import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoGiftService, parseGift } from '../src/domain/gifts';
import { assertDemoMode } from '../src/server/mode';
const input = { artworkId: 'genesis-cake', recipientHandle: 'Alice.ai', blessingId: 'birthday' };
test('canonical handle; never claim identity verification', () => {
  assert.equal(parseGift(input).recipientHandle, 'alice.ai');
  assert.throws(() => parseGift({ ...input, recipientHandle: '<script>' }));
  assert.throws(() => parseGift({ ...input, senderHandle: 'someone.ai' }));
  assert.throws(() => parseGift({ ...input, blessingId: '__proto__' }));
  assert.throws(() => parseGift({ ...input, artworkId: 'unknown' }));
});
test('duplicate submissions do not create duplicate gifts; conflicting reuse fails', () => {
  const service = new DemoGiftService();
  const first = service.create(input, 'request_123');
  const replay = service.create(input, 'request_123');
  assert.equal(first.gift.id, replay.gift.id);
  assert.equal(replay.replay, true);
  assert.equal(first.gift.status, 'demo_created');
  assert.throws(() => service.create({ ...input, blessingId: 'none' }, 'request_123'));
  assert.throws(() => service.create(input, ''));
});
test('demo store is bounded', () => {
  const service = new DemoGiftService(1);
  service.create(input, 'request_123');
  assert.throws(() => service.create(input, 'request_456'));
});
test('live mode fails closed', () => {
  const previous = process.env.APP_MODE;
  try { process.env.APP_MODE = 'live'; assert.throws(assertDemoMode); }
  finally { if (previous === undefined) delete process.env.APP_MODE; else process.env.APP_MODE = previous; }
});
