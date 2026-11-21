import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Wallet } from 'ethers';
import { WalletAuth } from '../src/server/wallet-auth';

test('wallet authentication binds signer, origin and browser, consumes nonce and revokes sessions', async () => {
  const service = new WalletAuth();
  const wallet = Wallet.createRandom();
  const origin = 'http://127.0.0.1:3194';
  const challenge = service.challenge(wallet.address, origin, 'browser-1');
  assert.match(challenge.message, /Chain ID: 97/);
  const signature = await wallet.signMessage(challenge.message);
  assert.throws(() => service.verify(challenge.nonce, signature, 'https://different.test', 'browser-1'));
  assert.throws(() => service.verify(challenge.nonce, signature, origin, 'browser-2'));
  assert.throws(() => service.verify(challenge.nonce, '0x123', origin, 'browser-1'));
  const otherSignature = await Wallet.createRandom().signMessage(challenge.message);
  assert.throws(() => service.verify(challenge.nonce, otherSignature, origin, 'browser-1'));
  const { sessionToken } = service.verify(challenge.nonce, signature, origin, 'browser-1');
  assert.equal(service.read(sessionToken, origin)?.address, wallet.address);
  assert.equal(service.read(sessionToken, 'https://different.test'), null);
  assert.throws(() => service.verify(challenge.nonce, signature, origin, 'browser-1'));
  service.revoke(sessionToken);
  assert.equal(service.read(sessionToken, origin), null);
});
