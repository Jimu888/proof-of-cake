import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDemoOrder, parseOrder, publicOrder } from '../src/domain/orders';
import { SqliteOrderRepository } from '../src/server/order-repository';

const input = { artworkId: 'cat', recipient: 'Example.ai', message: '一份公开演示祝福。' };
const split = { version: 'split-v1', artistBps: 5000 };

test('order input rejects forged prices, rules, sender and invalid recipients', () => {
  for (const added of [{ priceAtomic: '1' }, { sender: 'other.ai' }, { artistBps: 0 }, { transferable: true }, { status: 'paid' }]) {
    assert.throws(() => parseOrder({ ...input, ...added }));
  }
  for (const recipient of ['wrong', '<script>.ai', '0x' + '0'.repeat(40), '0x1234']) assert.throws(() => parseOrder({ ...input, recipient }));
  assert.deepEqual(parseOrder({ ...input, publicMessageAccepted: true }), parseOrder(input));
  assert.throws(() => parseOrder({ ...input, message: 'a'.repeat(281) }));
  assert.equal(parseOrder(input).recipient, 'example.ai');
  assert.equal(parseOrder({ ...input, artworkId: 'genesis-cake' }).artworkId, 'cat');
});

test('saved snapshots survive restart and configuration changes, replay returns the original order', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mement-orders-'));
  const path = join(directory, 'orders.sqlite');
  let repository = new SqliteOrderRepository(path);
  try {
    const first = createDemoOrder(repository, input, 'request_1234567890', split);
    assert.equal(first.order.status, 'demo_preview');
    assert.equal(first.order.recipientVerified, false);
    assert.equal(first.order.artwork.priceAtomic, '60000000000000000');
    assert.equal(first.order.settlement.artistAmount, '30000000000000000');
    repository.close();
    repository = new SqliteOrderRepository(path);
    const replay = createDemoOrder(repository, input, 'request_1234567890', { version: 'v2', artistBps: 8000 });
    assert.equal(replay.replay, true);
    assert.deepEqual(replay.order, first.order);
    assert.deepEqual(repository.findByToken(first.order.shareToken), first.order);
    assert.throws(() => createDemoOrder(repository, { ...input, message: '另一封信' }, 'request_1234567890', split));
    assert.equal(repository.findByToken('not-a-token'), undefined);
    assert.equal(repository.findByToken('f'.repeat(48)), undefined);
    assert.ok(!('settlement' in publicOrder(first.order)));
  } finally { repository.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('capacity errors roll back and never leave partially saved previews', () => {
  const repository = new SqliteOrderRepository(':memory:', 1);
  try {
    const first = createDemoOrder(repository, input, 'request_1234567890', split);
    assert.throws(() => createDemoOrder(repository, input, 'request_9876543210', split));
    assert.equal(createDemoOrder(repository, input, 'request_1234567890', split).order.id, first.order.id);
  } finally { repository.close(); }
});

test('expired records cannot be viewed or replayed as valid gifts', () => {
  const repository = new SqliteOrderRepository(':memory:');
  try {
    const result = createDemoOrder(repository, input, 'request_1234567890', split);
    const expired = { ...result.order, shareToken: 'e'.repeat(48), expiresAt: new Date(0).toISOString() };
    repository.create('expired_1234567890', JSON.stringify(parseOrder(input)), expired);
    assert.equal(repository.findByToken(expired.shareToken), undefined);
    assert.throws(() => createDemoOrder(repository, input, 'expired_1234567890', split));
  } finally { repository.close(); }
});
