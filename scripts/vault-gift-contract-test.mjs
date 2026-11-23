import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ganache from 'ganache';
import solc from 'solc';
import { BrowserProvider, ContractFactory, ZeroAddress, id } from 'ethers';
import { compileTestnet } from './testnet-compile.mjs';

const artifact = JSON.parse(await readFile(new URL('../contracts/platform/vault-gift.artifact.json', import.meta.url)));
const compiled = JSON.parse(solc.compile(JSON.stringify({
  language: 'Solidity',
  sources: { 'Fixtures.sol': { content: `pragma solidity ^0.8.30;
    contract MockToken {
      mapping(address => uint256) public balanceOf;
      mapping(address => mapping(address => uint256)) public allowance;
      uint256 public immutable fee;
      bool public transfersPaused;
      constructor(uint256 f) { fee = f; balanceOf[msg.sender] = 10000; }
      function pause(bool p) external { transfersPaused = p; }
      function approve(address target, uint256 value) external returns (bool) {
        allowance[msg.sender][target] = value; return true;
      }
      function transfer(address to, uint256 value) external returns (bool) {
        move(msg.sender, to, value); return true;
      }
      function transferFrom(address from, address to, uint256 value) external returns (bool) {
        allowance[from][msg.sender] -= value; move(from, to, value); return true;
      }
      function move(address from, address to, uint256 value) private {
        require(!transfersPaused);
        balanceOf[from] -= value;
        balanceOf[to] += value - value * fee / 100;
      }
    }
    contract RejectingRecipient {
      function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return 0x150b7a02;
      }
      function redeem(address gift, uint256 token) external {
        (bool ok,) = gift.call(abi.encodeWithSignature("burnAndRedeem(uint256)", token));
        require(ok);
      }
    }` } },
  settings: { evmVersion: 'paris', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } },
})));
const fixtures = compiled.contracts['Fixtures.sol'];

async function setup(t) {
  const chain = ganache.provider({ logging: { quiet: true }, chain: { chainId: 97 }, wallet: { totalAccounts: 5 } });
  const provider = new BrowserProvider(chain);
  provider.pollingInterval = 20;
  t.after(async () => { await provider.destroy(); await chain.disconnect(); });
  const [buyer, artist, platform, holder, other] = await Promise.all([0, 1, 2, 3, 4].map(index => provider.getSigner(index)));
  async function deploy(transferable = false, burnable = true) {
    const gift = await new ContractFactory(artifact.abi, artifact.bytecode, buyer)
      .deploy(artist.address, platform.address, 101n, 5000, 10, transferable, burnable, 'ipfs://test');
    return gift.waitForDeployment();
  }
  async function fixture(name, ...args) {
    const contract = fixtures[name];
    return (await new ContractFactory(contract.abi, '0x' + contract.evm.bytecode.object, buyer).deploy(...args)).waitForDeployment();
  }
  return { provider, buyer, artist, platform, holder, other, deploy, fixture };
}

test('vault deployment artifact matches source and all redemption entry points share the guard', async () => {
  assert.deepEqual(artifact, await compileTestnet('MementVaultGift'));
  const source = await readFile(new URL('../contracts/platform/MementVaultGift.sol', import.meta.url), 'utf8');
  for (const fn of ['burn', 'burnAndRedeem']) assert.match(source, new RegExp('function ' + fn + '\\(uint256 tokenId\\) external nonReentrant \\{\\s+_redeem'));
});

test('native vault is isolated from proceeds and follows the current NFT owner', async t => {
  const { deploy, holder, other, artist, platform, provider } = await setup(t);
  const gift = await deploy(true);
  const address = await gift.getAddress();
  await assert.rejects(gift.mintGiftWithNativeVault.staticCall(id('native'), holder.address, '', 500n, { value: 600n }));
  await (await gift.mintGiftWithNativeVault(id('native'), holder.address, '生日快乐', 500n, { value: 601n })).wait();
  assert.equal(await gift.proceeds(artist.address), 51n);
  assert.equal(await gift.proceeds(platform.address), 50n);
  await (await gift.connect(artist).withdraw()).wait();
  const withdrawal = await (await gift.connect(platform).withdraw()).wait();
  assert.equal(await gift.reserved(ZeroAddress), 500n);
  assert.equal(await provider.getBalance(address, withdrawal.blockNumber), 500n);
  await assert.rejects(gift.connect(other).burnAndRedeem.staticCall(1));
  await (await gift.connect(holder).transferFrom(holder.address, other.address, 1)).wait();
  await assert.rejects(gift.connect(holder).burnAndRedeem.staticCall(1));
  const redeemed = await (await gift.connect(other).burnAndRedeem(1)).wait();
  const history = await gift.vaultAssets(1);
  assert.equal(history.redeemer, other.address);
  assert.equal(history.received, 500n);
  assert.equal(await provider.getBalance(address, redeemed.blockNumber), 0n);
  assert.equal(await gift.minted(), 1n);
  await assert.rejects(gift.ownerOf(1));
  await assert.rejects(gift.connect(other).burnAndRedeem.staticCall(1));
});

test('standard and taxed tokens settle actual balance changes and roll back on failed payouts', async t => {
  const { deploy, holder, fixture } = await setup(t);
  const gift = await deploy();
  for (const [index, fee] of [0, 10].entries()) {
    const token = await fixture('MockToken', fee);
    const address = await token.getAddress();
    const tokenId = index + 1;
    await (await token.approve(await gift.getAddress(), 1000)).wait();
    await (await gift.mintGiftWithTokenVault(id('token'+index), holder.address, '', address, 1000, { value: 101 })).wait();
    const locked = fee ? 900n : 1000n;
    assert.equal((await gift.vaultAssets(tokenId)).amount, locked);
    await (await token.pause(true)).wait();
    await assert.rejects(gift.connect(holder).burnAndRedeem.staticCall(tokenId));
    assert.equal(await gift.ownerOf(tokenId), holder.address);
    assert.equal(await gift.reserved(address), locked);
    await (await token.pause(false)).wait();
    await (await gift.connect(holder).burn(tokenId)).wait();
    const received = fee ? 810n : 1000n;
    assert.equal((await gift.vaultAssets(tokenId)).received, received);
    assert.equal(await token.balanceOf(holder.address), received);
    assert.equal(await gift.reserved(address), 0n);
  }
});

test('non-burnable editions only allow plain gifts and rejecting recipients keep the NFT on failed redemption', async t => {
  const { deploy, holder, fixture } = await setup(t);
  const fixed = await deploy(false, false);
  await assert.rejects(fixed.mintGiftWithNativeVault.staticCall(id('blocked'), holder.address, '', 20, { value: 121 }));
  const token = await fixture('MockToken', 0);
  await assert.rejects(fixed.mintGiftWithTokenVault.staticCall(id('blocked-token'), holder.address, '', await token.getAddress(), 1, { value: 101 }));
  await (await fixed.buyGift(id('plain'), holder.address, '', { value: 101 })).wait();
  assert.equal(await fixed.ownerOf(1), holder.address);
  const receiver = await fixture('RejectingRecipient');
  const gift = await deploy();
  await (await gift.mintGiftWithNativeVault(id('reject-payout'), await receiver.getAddress(), '', 20, { value: 121 })).wait();
  await assert.rejects(receiver.redeem.staticCall(await gift.getAddress(), 1));
  assert.equal(await gift.ownerOf(1), await receiver.getAddress());
  assert.equal((await gift.vaultAssets(1)).redeemed, false);
  assert.equal(await gift.reserved(ZeroAddress), 20n);
});
