import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateRevenue, describeArtworkPolicy } from '../src/domain/artwork-policy';

test('creator transfer and burn rules are independent', () => {
  assert.equal(describeArtworkPolicy({ transferable: true, holderCanBurn: false }), '可转让 · 不可销毁');
  assert.equal(describeArtworkPolicy({ transferable: false, holderCanBurn: true }), '不可转让 · 持有人可销毁');
});
test('50/50 uses exact atomic units, conserving even very large amounts', () => {
  const split = { version: 'split-v1', artistBps: 5000 };
  for (const amount of [0n, 1n, 2n, 101n, 10n ** 30n + 1n]) {
    const result = allocateRevenue(amount, split);
    assert.equal(result.artistAmount + result.platformAmount, amount);
    assert.ok(result.artistAmount >= result.platformAmount);
  }
  assert.equal(allocateRevenue(101n, split).artistAmount, 51n);
});
test('configuration updates do not mutate an existing allocation', () => {
  const split = { version: 'v1', artistBps: 5000 };
  const old = allocateRevenue(100n, split);
  split.artistBps = 7000;
  split.version = 'v2';
  assert.equal(old.artistAmount, 50n);
  assert.equal(old.version, 'v1');
  assert.equal(allocateRevenue(100n, split).artistAmount, 70n);
  assert.equal(allocateRevenue(100n, { version: 'v3', artistBps: 0 }).platformAmount, 100n);
  assert.equal(allocateRevenue(100n, { version: 'v4', artistBps: 10000 }).artistAmount, 100n);
});
test('invalid financial settings fail closed', () => {
  for (const artistBps of [-1, 10001, 50.5, NaN, Infinity]) {
    assert.throws(() => allocateRevenue(100n, { version: 'v1', artistBps }));
  }
  assert.throws(() => allocateRevenue(-1n, { version: 'v1', artistBps: 5000 }));
  assert.throws(() => allocateRevenue(1n, { version: '', artistBps: 5000 }));
});
