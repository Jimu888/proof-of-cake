import test from 'node:test';
import assert from 'node:assert/strict';
import { milestoneDeadline, milestoneMaxYears, parseReservePlan } from '../src/domain/reserve-plan';
import { parseOrder } from '../src/domain/orders';
import { zodiacArtwork } from '../src/domain/zodiac-artwork';
import { loveCooldown, parseLoveAgreement } from '../src/domain/gifting-modes';
import { GatheringRepository } from '../src/server/gathering-repository';
import { reserveMarket } from '../src/server/reserve-market';
import { sampleRecipient, sampleSender } from '../src/lib/generative-art';

test('reserve plans validate independent unlock rules and accept uncapped DCA amounts', () => {
  const plan = { amount: '1200', token: 'BNB', unlock: 'price', price: '1000', date: '2027-03-03',
    schedule: { frequency: 'three-days', periods: 12 } };
  assert.deepEqual(parseReservePlan(plan), {
    amount: '1200', token: 'BNB', unlock: 'price', price: '1000', maxYears: 3, schedule: plan.schedule,
  });
  for (const invalid of [
    { ...plan, unlock: 'date', date: '2027-02-30' },
    { ...plan, unlock: 'price', price: '0' },
    { ...plan, token: 'custom', address: '0x123' },
    { ...plan, schedule: { frequency: 'weekly', periods: 2.5 } },
  ]) assert.throws(() => parseReservePlan(invalid));
});

test('milestone durations are integers from one to five years with a three-year default', () => {
  const plan = { token: 'BNB', amount: '1', unlock: 'price', price: '1000' };
  assert.equal(parseReservePlan(plan)?.maxYears, 3);
  for (const maxYears of milestoneMaxYears) assert.equal(parseReservePlan({ ...plan, maxYears })?.maxYears, maxYears);
  for (const maxYears of [0, 6, 2.5, '3', null]) assert.throws(() => parseReservePlan({ ...plan, maxYears }));
  assert.equal(parseReservePlan({ ...plan, unlock: 'instant', maxYears: 3 })?.maxYears, undefined);
  assert.equal(new Date(milestoneDeadline(Date.parse('2028-02-29T13:00:00Z'), 1)).toISOString(), '2029-02-28T13:00:00.000Z');
});

test('unilateral Promise termination has a thirty-day cooling-off period', () => {
  assert.equal(loveCooldown, 30 * 24 * 60 * 60);
});

test('a new Promise permits an initiator-only contribution and freezes its date with the zodiac selection', () => {
  const agreement = { amounts: ['1.2', '0'], terms: 'proportional', date: '2027-03-03' };
  assert.deepEqual(parseLoveAgreement(agreement), agreement);
  assert.equal(parseLoveAgreement({ ...agreement, amounts: ['0', '0'] }), undefined);
  assert.deepEqual(parseLoveAgreement({ ...agreement, amounts: ['1', '0.5'], token: 'ETH' }), { ...agreement, amounts: ['1', '0.5'], token: 'ETH' });
  const draft = { artworkId: 'zodiac-goat', zodiacFilter: 'original', recipient: sampleRecipient, senderAddress: sampleSender,
    message: 'A wish', agreement };
  assert.deepEqual(parseOrder(draft, zodiacArtwork).agreement, agreement);
  assert.throws(() => parseOrder({ ...draft, zodiacFilter: 'forged' }, zodiacArtwork));
  assert.throws(() => parseOrder({ ...draft, reserve: { token: 'BNB', amount: '1', unlock: 'instant' } }, zodiacArtwork));
});

test('gathering contributions are idempotent, capacity bound and deadline locked', () => {
  const store = new GatheringRepository(':memory:');
  try {
    const deadline = 300;
    const first = store.create(2, deadline, 100)!;
    const note = { name: 'Friend', message: 'A wish' };
    assert.deepEqual(store.join(first, 'id', note, 101), { status: 200, guests: [note] });
    assert.deepEqual(store.join(first, 'id', { ...note, message: 'Overwrite' }, deadline), { status: 200, guests: [note] });
    assert.equal(store.join(first, 'other', note, 102).status, 409);
    assert.equal(store.join(first, 'other', note, deadline).status, 404);
    assert.deepEqual(store.list(first, deadline), [note]);
  } finally { store.close(); }
});

test('market verification uses only matching BSC PancakeSwap pool liquidity and base-token price', async t => {
  const pair = { chainId: 'bsc', dexId: 'pancakeswap', baseToken: { address: sampleSender }, priceUsd: '103.2', liquidity: { usd: 50_000 } };
  t.mock.method(globalThis, 'fetch', async () => Response.json([
    pair,
    { ...pair, chainId: 'ethereum', liquidity: { usd: 500_000 } },
    { ...pair, dexId: 'other', liquidity: { usd: 750_000 } },
    { ...pair, quoteToken: pair.baseToken, baseToken: { address: sampleRecipient }, priceUsd: '95.2', liquidity: { usd: 95_000 } },
  ]));
  assert.deepEqual(await reserveMarket(sampleSender), { liquidity: 95_000, price: 103.2 });
});
