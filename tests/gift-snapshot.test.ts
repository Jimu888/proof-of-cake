import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeGiftSnapshot, encodeGiftSnapshot, giftSnapshotUrlLimit, type GiftSnapshot } from '../src/lib/gift-snapshot';

const snapshot = {
  id: '12345678-1234-1234-1234-1234567890ab',
  artworkId: 'snowflake',
  recipient: 'future.ai',
  sender: '@mement',
  message: '给未来的你 · A gift for later 🎁',
  createdAt: '2026-11-26T08:00:00.000Z',
  reserve: { token: 'BNB', amount: '0.1', unlock: 'price', price: '1000', maxYears: 3 },
} satisfies GiftSnapshot;

test('public gift snapshots round-trip as compact base64url', () => {
  const encoded = encodeGiftSnapshot(snapshot);
  assert.ok(encoded && /^[A-Za-z0-9_-]+$/.test(encoded));
  assert.deepEqual(decodeGiftSnapshot(encoded), snapshot);
  const { reserve: _reserve, ...base } = snapshot;
  const zodiac: GiftSnapshot = { ...base, artworkId: 'zodiac-horse', zodiacFilter: 'obsidian',
    agreement: { amounts: ['0.1', '0'], terms: 'proportional', date: '2027-01-01' } };
  assert.deepEqual(decodeGiftSnapshot(encodeGiftSnapshot(zodiac)), zodiac);
});

test('gift snapshots reject invalid encodings, input fields and oversized data', () => {
  for (const value of [null, [], '%zz', 'a', '_w', 'a'.repeat(giftSnapshotUrlLimit + 1)]) {
    assert.equal(decodeGiftSnapshot(value), undefined);
  }
  for (const invalid of [
    { ...snapshot, recipient: 'invalid' },
    { ...snapshot, createdAt: '2026-02-30T00:00:00Z' },
    { ...snapshot, message: 'a\0b' },
    { ...snapshot, mode: 'paid' },
    { ...snapshot, reserve: { ...snapshot.reserve, price: '-1' } },
    { ...snapshot, message: '雪'.repeat(280) },
  ]) {
    assert.equal(encodeGiftSnapshot(invalid), undefined);
    assert.equal(decodeGiftSnapshot(Buffer.from(JSON.stringify(invalid)).toString('base64url')), undefined);
  }
});
