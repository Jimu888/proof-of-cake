import assert from 'node:assert/strict';
import { test } from 'node:test';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory, ZeroAddress } from 'ethers';
import { compileTestnet } from './testnet-compile.mjs';

const artifact = await compileTestnet('MementGroupGift');
const send = async (transaction) => (await transaction).wait();

async function setup(t) {
  const chain = ganache.provider({ logging: { quiet: true }, chain: { chainId: 97 } });
  const provider = new BrowserProvider(chain);
  provider.pollingInterval = 20;
  t.after(async () => { await provider.destroy(); await chain.disconnect(); });
  const [payee, a, b, recipient] = await Promise.all([0, 1, 2, 3].map(index => provider.getSigner(index)));
  const gift = await new ContractFactory(artifact.abi, artifact.bytecode, payee).deploy(payee.address);
  await gift.waitForDeployment();
  const deadline = (await provider.getBlock('latest')).timestamp + 600;
  return { gift, provider, payee, a, b, recipient, deadline };
}

test('final share atomically mints the NFT, credits proceeds and isolates the vault', async t => {
  const { gift, provider, a, b, recipient, deadline, payee } = await setup(t);
  await send(gift.connect(a).createGroupGift(recipient.address, 100n, 50n, deadline));
  await send(gift.connect(a).contribute(1, { value: 65n }));
  await assert.rejects(gift.ownerOf(1));
  await assert.rejects(gift.connect(b).contribute.staticCall(1, { value: 86n }), /ExcessContribution/);
  assert.equal((await gift.groups(1)).collected, 65n);
  const receipt = await send(gift.connect(b).contribute(1, { value: 85n }));
  const events = receipt.logs.map(log => gift.interface.parseLog(log)?.name);
  assert.deepEqual(events, ['Contributed', 'Transfer', 'GroupCompleted', 'VaultLocked']);
  assert.equal((await gift.groups(1)).completed, true);
  assert.equal(await gift.ownerOf(1), recipient.address);
  assert.equal(await gift.lockedVault(1), 50n);
  assert.equal(await gift.proceeds(), 100n);
  await assert.rejects(gift.connect(a).refund.staticCall(1));
  await assert.rejects(gift.connect(b).contribute.staticCall(1, { value: 1n }));
  await assert.rejects(gift.connect(a).burnAndRedeem.staticCall(1, a.address));
  const withdrawn = await send(gift.connect(payee).withdrawProceeds(payee.address));
  assert.equal(await provider.getBalance(await gift.getAddress(), withdrawn.blockNumber), 50n);
  await send(gift.connect(recipient).burnAndRedeem(1, recipient.address));
  assert.equal(await gift.lockedVault(1), 0n);
  await assert.rejects(gift.ownerOf(1));
});

test('a rejected mint rolls back the final contribution and leaves previous contributions refundable', async t => {
  const { gift, provider, a, b, recipient, deadline } = await setup(t);
  const address = await gift.getAddress();
  assert.notEqual(address, ZeroAddress);
  // The contract has code but does not implement the ERC721 receiver interface.
  const other = await new ContractFactory(artifact.abi, artifact.bytecode, a).deploy(a.address);
  await other.waitForDeployment();
  await send(gift.createGroupGift(await other.getAddress(), 100n, 50n, deadline));
  await send(gift.connect(a).contribute(1, { value: 65n }));
  await assert.rejects(send(gift.connect(b).contribute(1, { value: 85n, gasLimit: 400000n })));
  assert.equal((await gift.groups(1)).collected, 65n);
  assert.equal(await gift.contributions(1, b.address), 0n);
  assert.equal(await gift.proceeds(), 0n);
  assert.equal(await gift.lockedVault(1), 0n);
  await send(gift.createGroupGift(recipient.address, 100n, 0n, deadline));
  await send(gift.connect(a).contribute(2, { value: 20n }));
  await send(gift.connect(b).contribute(2, { value: 30n }));
  await assert.rejects(gift.connect(a).refund.staticCall(2));
  await provider.send('evm_increaseTime', [601]);
  await provider.send('evm_mine', []);
  await assert.rejects(gift.connect(a).contribute.staticCall(2, { value: 50n }));
  const before = await provider.getBalance(recipient.address);
  const first = await send(gift.connect(a).refundTo(2, recipient.address));
  assert.equal(await provider.getBalance(recipient.address, first.blockNumber), before + 20n);
  await assert.rejects(gift.connect(a).refund.staticCall(2));
  const last = await send(gift.connect(b).refund(2));
  const refund = gift.interface.parseLog(last.logs[0]);
  assert.equal(refund.args.contributor, b.address);
  assert.equal(refund.args.amount, 30n);
  await assert.rejects(gift.connect(b).refund.staticCall(2));
  await send(gift.connect(a).refund(1));
  assert.equal(await gift.contributions(1, a.address), 0n);
  assert.equal(await gift.contributions(2, b.address), 0n);
});
