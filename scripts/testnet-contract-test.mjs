import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory, id } from 'ethers';
import { compileTestnet } from './testnet-compile.mjs';

test('test gift purchase mints once, splits proceeds and enforces transfer and burn rules', async () => {
  const artifact = await compileTestnet();
  const committed = JSON.parse(await readFile(new URL('../contracts/platform/test-gift.artifact.json', import.meta.url), 'utf8'));
  assert.deepEqual(committed, artifact, 'Deployment artifact must match the Solidity source');
  const rpc = ganache.provider({ logging: { quiet: true }, chain: { chainId: 97 }, wallet: { totalAccounts: 4 } });
  const provider = new BrowserProvider(rpc);
  provider.pollingInterval = 20;
  try {
    const [buyer, artist, platform, recipient] = await Promise.all([0, 1, 2, 3].map(index => provider.getSigner(index)));
    const factory = new ContractFactory(artifact.abi, artifact.bytecode, buyer);
    const gift = await factory.deploy(artist.address, platform.address, 101n, 5000, 2, false, true, 'ipfs://test-metadata');
    await gift.waitForDeployment();
    const orderId = id('gift-order');
    await assert.rejects(gift.buyGift.staticCall(orderId, recipient.address, '测试祝福', { value: 100n }));
    await assert.rejects(gift.buyGift.staticCall(orderId, await gift.getAddress(), '测试祝福', { value: 101n }));
    assert.equal(await gift.minted(), 0n);
    const receipt = await (await gift.buyGift(orderId, recipient.address, '测试祝福', { value: 101n })).wait();
    assert.equal(await gift.ownerOf(1), recipient.address);
    assert.equal(await gift.proceeds(artist.address), 51n);
    assert.equal(await gift.proceeds(platform.address), 50n);
    assert.ok(receipt.logs.some(log => { try { return gift.interface.parseLog(log)?.args.message === '测试祝福'; } catch { return false; } }));
    await assert.rejects(gift.buyGift.staticCall(orderId, recipient.address, '', { value: 101n }));
    await assert.rejects(gift.connect(recipient).transferFrom.staticCall(recipient.address, buyer.address, 1));
    await assert.rejects(gift.burn.staticCall(1));
    await (await gift.connect(recipient).burn(1)).wait();
    assert.equal(await gift.minted(), 1n);
    assert.equal(await provider.getBalance(await gift.getAddress(), receipt.blockNumber), 101n);
    await assert.rejects(gift.connect(buyer).withdraw.staticCall());
    const withdrawal = await (await gift.connect(artist).withdraw()).wait();
    assert.ok(withdrawal.logs.some(log => {
      const event = gift.interface.parseLog(log);
      return event?.name === 'ProceedsWithdrawn' && event.args.payee === artist.address && event.args.amount === 51n;
    }));
    assert.equal(await gift.proceeds(platform.address), 50n);
    assert.equal(await provider.getBalance(await gift.getAddress(), withdrawal.blockNumber), 50n);
    await assert.rejects(gift.connect(artist).withdraw.staticCall());
    assert.equal(await gift.proceeds(artist.address), 0n);
  } finally { provider.destroy(); await rpc.disconnect(); }
});
