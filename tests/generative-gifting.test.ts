import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../src/domain/catalog';
import { giftSeries } from '../src/domain/series';
import { createDemoOrder, parseOrder, publicOrder } from '../src/domain/orders';
import { artHash, bondPreviewHash, recipientVisualSeed, sampleRecipient, sampleSender } from '../src/lib/generative-art';
import { readZodiacExtras, zodiacGiftParams } from '../src/lib/zodiac-share';

const bond = { artworkId: 'algorithmic-bond', senderAddress: sampleSender, recipient: sampleRecipient, message: 'A sample note.' };
const agreement = { amounts: ['0.1', '0.2'] as [string, string], terms: 'proportional' as const };

test('the single exhibition and two generative gifts resolve with stable case-insensitive artwork seeds', () => {
  assert.deepEqual(giftSeries.map(series => series.slug), ['zodiac']);
  assert.deepEqual(catalog.filter(work => work.displayMode === 'generative-canvas').map(work => work.id), ['snowflake', 'algorithmic-bond']);
  assert.match(artHash(sampleRecipient), /^0x[0-9a-f]{64}$/);
  assert.equal(artHash(sampleRecipient), artHash(sampleRecipient.toUpperCase()));
  assert.notEqual(artHash(sampleSender), artHash(sampleRecipient));
  assert.notEqual(bondPreviewHash(sampleSender, sampleRecipient, 'order-1'), bondPreviewHash(sampleSender, sampleRecipient, 'order-2'));
});

test('a Love Vault preview freezes normalized sample addresses and terms without verifying either wallet', () => {
  const result = createDemoOrder({
    create: (_key, _fingerprint, order) => ({ order, replay: false }),
    findByToken: () => undefined,
  }, { ...bond, agreement }, 'bond-sample-preview', { version: 'test', artistBps: 5000 });
  const order = publicOrder(result.order);
  assert.equal(order.status, 'demo_preview');
  assert.equal(order.recipientVerified, false);
  assert.equal(order.sender, '演示赠送人');
  assert.deepEqual(order.agreement, agreement);
  assert.equal(order.senderAddress?.toLowerCase(), sampleSender);
  assert.equal(order.recipient.toLowerCase(), sampleRecipient);
  for (const input of [
    { ...bond, senderAddress: undefined },
    { ...bond, agreement, recipient: sampleSender },
    { ...bond, agreement: { ...agreement, amounts: ['0', '1'] } },
    { ...bond, agreement: { ...agreement, terms: 'donate', donation: 'invalid' } },
    { ...bond, agreement, notes: [{ name: 'A', message: 'First' }, { name: 'B', message: 'Second' }] },
  ]) assert.throws(() => parseOrder(input));
});

test('Group AA and Zodiac previews preserve the shared note and custom-token time lock', () => {
  const notes = [{ name: 'A', message: 'First' }, { name: 'B', message: 'Second' }];
  const vault = { kind: 'token' as const, token: sampleSender, amount: '1.5', unlockTime: 2147483647 };
  const input = parseOrder({ ...bond, notes, vault });
  assert.deepEqual(input.notes, notes);
  assert.equal(input.vault?.unlockTime, vault.unlockTime);
  assert.throws(() => parseOrder({ ...bond, notes: notes.slice(0, 1) }));
  const selection = { sign: 'goat', filter: 'original' } as const;
  const gift = { paper: 'rice' as const, sender: sampleSender, recipient: sampleRecipient, vault: input.vault };
  assert.deepEqual(readZodiacExtras(zodiacGiftParams(selection, { ...gift, notes })), { vault: input.vault, notes, agreement: undefined });
  assert.deepEqual(readZodiacExtras(zodiacGiftParams(selection, { ...gift, agreement })).agreement, agreement);
});

test('gift recipients accept email, social handles and .ai, with deterministic visual seeds', () => {
  for (const [input, expected] of [
    ['Name@EXAMPLE.com', 'Name@example.com'], ['@My_Name', '@my_name'],
    ['x:@someone', 'x:@someone'], ['tg:@someone', 'tg:@someone'], ['Example.ai', 'example.ai'],
  ]) {
    assert.equal(parseOrder({ ...bond, recipient: input, agreement }).recipient, expected);
    assert.equal(recipientVisualSeed(input), recipientVisualSeed(expected));
    assert.match(recipientVisualSeed(input)!, /^0x[0-9a-f]{40}$/);
  }
  assert.notEqual(recipientVisualSeed('x:@someone'), recipientVisualSeed('tg:@someone'));
  for (const recipient of ['', 'invalid', 'x:someone', '@a', '@' + 'a'.repeat(33), 'name@domain', 'a b@example.com', 'name@example.com\n', 'a'.repeat(95) + '@a.com']) {
    assert.throws(() => parseOrder({ ...bond, recipient }));
    assert.equal(recipientVisualSeed(recipient), undefined);
  }
});

test('a generative Promise accepts contact senders and rejects the same identity on both sides', () => {
  const result = createDemoOrder({
    create: (_key, _fingerprint, order) => ({ order, replay: false }),
    findByToken: () => undefined,
  }, { ...bond, senderAddress: 'Jimu.ai', recipient: 'dds2d.ai', agreement }, 'bond-contact-preview', { version: 'test', artistBps: 5000 });
  const order = publicOrder(result.order);
  assert.equal(order.senderAddress, 'jimu.ai');
  assert.equal(order.recipient, 'dds2d.ai');
  assert.deepEqual(order.agreement, agreement);
  assert.equal(order.recipientVerified, false);
  assert.match(recipientVisualSeed(order.senderAddress)!, /^0x[0-9a-f]{40}$/);
  assert.notEqual(recipientVisualSeed(order.senderAddress), recipientVisualSeed(order.recipient));
  for (const senderAddress of ['Jimu.ai', 'Name@example.com', '@someone', 'x:@someone', 'tg:@someone']) {
    const input = { ...bond, senderAddress, recipient: 'dds2d.ai', agreement };
    assert.ok(parseOrder(input).senderAddress);
    assert.throws(() => parseOrder({ ...input, recipient: senderAddress.toUpperCase() }), /不同/);
  }
  assert.deepEqual(readZodiacExtras(new URLSearchParams({
    from: 'jimu.ai', to: 'dds2d.ai', agreement: JSON.stringify(agreement),
  })).agreement, agreement);
});
