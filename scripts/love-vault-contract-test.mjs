import assert from 'node:assert/strict';
import { test } from 'node:test';
import ganache from 'ganache';
import solc from 'solc';
import { BrowserProvider, ContractFactory, ZeroAddress } from 'ethers';
import { compileTestnet } from './testnet-compile.mjs';

const artifact = await compileTestnet('MementLoveVault');
const send = async (transaction) => (await transaction).wait();

async function setup(t) {
  const chain = ganache.provider({ logging: { quiet: true }, chain: { chainId: 97 } });
  const provider = new BrowserProvider(chain);
  provider.pollingInterval = 20;
  t.after(async () => { await provider.destroy(); await chain.disconnect(); });
  const [platform, a, b, other] = await Promise.all([0, 1, 2, 3].map(index => provider.getSigner(index)));
  const vault = await new ContractFactory(artifact.abi, artifact.bytecode, platform).deploy(30n);
  await vault.waitForDeployment();
  async function create(terms = 0, donation = ZeroAddress) {
    await send(vault.connect(a).createVault(b.address, terms, donation, 30 * 24 * 60 * 60));
    const id = await vault.agreementCount();
    await send(vault.connect(a).deposit(id, { value: 100n }));
    await send(vault.connect(b).deposit(id, { value: 200n }));
    return id;
  }
  return { vault, a, b, other, provider, create };
}

test('separate reserves pay a bonus only after distinct, funded partner approvals', async t => {
  const { vault, a, b, other, provider, create } = await setup(t);
  await send(vault.fundBonusPool({ value: 40n }));
  await assert.rejects(vault.connect(other).fundBonusPool.staticCall({ value: 1n }));
  const id = await create();
  assert.equal(await vault.platformBonusPool(), 40n);
  await assert.rejects(vault.connect(other).approveMarriage.staticCall(id));
  await send(vault.connect(a).approveMarriage(id));
  await assert.rejects(vault.connect(a).approveMarriage.staticCall(id));
  await assert.rejects(vault.connect(a).withdraw.staticCall(a.address));
  assert.equal(await vault.claimable(a.address), 0n);
  assert.equal(await vault.platformBonusPool(), 40n);
  await send(vault.connect(b).approveMarriage(id));
  assert.equal((await vault.agreements(id)).status, 1n);
  assert.equal(await vault.claimable(a.address), 110n);
  assert.equal(await vault.claimable(b.address), 220n);
  assert.equal(await vault.platformBonusPool(), 10n);
  const before = await provider.getBalance(other.address);
  const receipt = await send(vault.connect(a).withdraw(other.address));
  assert.equal(await provider.getBalance(other.address, receipt.blockNumber), before + 110n);
  const second = await create();
  await send(vault.connect(a).approveMarriage(second));
  await send(vault.connect(b).approveMarriage(second));
  assert.equal(await vault.claimable(a.address), 100n);
  assert.equal(await vault.claimable(b.address), 420n);
  assert.equal(await vault.platformBonusPool(), 10n);
});

test('two breakup approvals settle immediately under every preset with no bonus', async t => {
  const { vault, a, b, other, create } = await setup(t);
  await send(vault.fundBonusPool({ value: 80n }));
  for (const [terms, expected] of [[0, [100n, 200n, 0n]], [1, [300n, 0n, 0n]], [2, [0n, 300n, 0n]], [3, [0n, 0n, 300n]]]) {
    const id = await create(terms, terms === 3 ? other.address : ZeroAddress);
    const accounts = [a.address, b.address, other.address];
    const before = await Promise.all(accounts.map(account => vault.claimable(account)));
    await send(vault.connect(a).approveBreakup(id));
    assert.equal((await vault.agreements(id)).status, 0n);
    await send(vault.connect(b).approveBreakup(id));
    assert.equal((await vault.agreements(id)).status, 2n);
    const after = await Promise.all(accounts.map(account => vault.claimable(account)));
    assert.deepEqual(after.map((balance, index) => balance - before[index]), expected);
    await assert.rejects(vault.connect(a).approveMarriage.staticCall(id));
  }
  assert.equal(await vault.platformBonusPool(), 80n);
});

test('either partner can settle a unilateral request once its cooldown expires', async t => {
  const { vault, a, b, other, provider, create } = await setup(t);
  const id = await create(1);
  await send(vault.connect(a).approveMarriage(id));
  await send(vault.connect(a).requestBreakup(id));
  assert.equal((await vault.agreements(id)).marriageVotes, 0n);
  await assert.rejects(vault.connect(b).requestBreakup.staticCall(id));
  await assert.rejects(vault.connect(b).finalizeBreakupAfterCooldown.staticCall(id));
  await provider.send('evm_increaseTime', [30 * 24 * 60 * 60]);
  await provider.send('evm_mine', []);
  await assert.rejects(vault.connect(other).finalizeBreakupAfterCooldown.staticCall(id));
  await assert.rejects(vault.connect(b).approveMarriage.staticCall(id));
  await assert.rejects(vault.connect(b).approveBreakup.staticCall(id));
  await send(vault.connect(b).finalizeBreakupAfterCooldown(id));
  assert.equal(await vault.claimable(a.address), 100n);
  assert.equal(await vault.claimable(b.address), 200n);
  await assert.rejects(vault.connect(a).finalizeBreakupAfterCooldown.staticCall(id));
});

test('failed withdrawals preserve claims and callbacks cannot reenter withdrawals', async t => {
  const { vault, a, b, provider, create } = await setup(t);
  const id = await create();
  await send(vault.connect(a).approveMarriage(id));
  await send(vault.connect(b).approveMarriage(id));
  const source = `pragma solidity ^0.8.30;
    interface Vault { function withdraw(address payable recipient) external; }
    contract Receiver {
      Vault immutable vault;
      bool public rejected;
      bool public rejectPayment = true;
      function acceptPayments() external { rejectPayment = false; }
      constructor(address vault_) { vault = Vault(vault_); }
      receive() external payable {
        require(!rejectPayment);
        try vault.withdraw(payable(address(this))) { revert(); }
        catch (bytes memory reason) {
          rejected = bytes4(reason) == bytes4(keccak256("ReentrancyGuardReentrantCall()"));
        }
      }
    }`;
  const output = JSON.parse(solc.compile(JSON.stringify({
    language: 'Solidity', sources: { 'Receiver.sol': { content: source } },
    settings: { evmVersion: 'paris', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } },
  })));
  const fixture = output.contracts['Receiver.sol'].Receiver;
  const receiver = await new ContractFactory(fixture.abi, '0x' + fixture.evm.bytecode.object, a).deploy(await vault.getAddress());
  await receiver.waitForDeployment();
  const address = await receiver.getAddress();
  await assert.rejects(send(vault.connect(a).withdraw(address, { gasLimit: 300000n })));
  assert.equal(await vault.claimable(a.address), 100n);
  await send(receiver.acceptPayments());
  const receipt = await send(vault.connect(a).withdraw(address));
  assert.equal(await receiver.rejected(), true);
  assert.equal(await provider.getBalance(address, receipt.blockNumber), 100n);
  assert.equal(await vault.claimable(a.address), 0n);
});
