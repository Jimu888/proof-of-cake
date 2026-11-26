import { parseVaultDraft, type VaultDraft } from '../domain/vault-gift';
import type { ActiveZodiacId, ZodiacFilter } from '../domain/zodiac';
import { normalizeGiftRecipient } from '../domain/gift-recipient';
import type { PaperTone } from './gift-copy';

import { parseGroupNotes, parseLoveAgreement, type GroupNote, type LoveAgreement } from '../domain/gifting-modes';

export type { GroupNote } from '../domain/gifting-modes';

export function readZodiacExtras(params: URLSearchParams) {
  let vault: VaultDraft | undefined;
  let notes: GroupNote[] | undefined;
  let agreement: LoveAgreement | undefined;
  const senderAddress = normalizeGiftRecipient(params.get('from'));
  const recipientAddress = normalizeGiftRecipient(params.get('to'));
  try { vault = parseVaultDraft(JSON.parse(params.get('vault') ?? 'null'), 0); }
  catch { /* Ignore malformed optional preview data. */ }
  try { notes = parseGroupNotes(JSON.parse(params.get('notes') ?? 'null')); }
  catch { /* Ignore malformed optional preview data. */ }
  try {
    if (!notes && senderAddress && recipientAddress && senderAddress.toLowerCase() !== recipientAddress.toLowerCase()) {
      agreement = parseLoveAgreement(JSON.parse(params.get('agreement') ?? 'null'));
    }
  } catch { /* Ignore malformed optional preview data. */ }
  return { vault, notes, agreement };
}

export function zodiacGiftParams(selection: { sign: ActiveZodiacId; filter: ZodiacFilter }, gift: {
  recipient: string; sender: string; paper: PaperTone; message?: string; vault?: VaultDraft; notes?: GroupNote[]; agreement?: LoveAgreement;
}) {
  const params = new URLSearchParams({ sign: selection.sign, filter: selection.filter, paper: gift.paper, to: gift.recipient.trim(), from: gift.sender });
  if (gift.message) params.set('msg', gift.message.trim());
  if (gift.vault) params.set('vault', JSON.stringify(gift.vault));
  if (gift.agreement) params.set('agreement', JSON.stringify(gift.agreement));
  if (gift.notes) params.set('notes', JSON.stringify(gift.notes));
  return params;
}

export type ShareQuery = Record<string, string | string[] | undefined>;

export const zodiacReceivePath = '/gift/zodiac';

export function shareParams(query: ShareQuery) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const item of typeof value === 'string' ? [value] : value ?? []) params.append(key, item);
  }
  return params;
}

export function unpackZodiacShare(value: string) {
  // Earlier invitations compressed the percent-encoded query verbatim.
  return new URLSearchParams(value.startsWith('[') ? JSON.parse(value) as [string, string][] : value);
}

export async function zodiacShareUrl(params: URLSearchParams, origin: string) {
  const url = new URL(zodiacReceivePath, origin);
  url.search = params.toString();
  if (url.href.length < 450 || typeof CompressionStream === 'undefined') return url.href;

  // Shorter links keep the printed QR code readable for longer Chinese blessings.
  try {
    const body = new Blob([JSON.stringify([...params])]).stream().pipeThrough(new CompressionStream('deflate'));
    const compressed = new Uint8Array(await new Response(body).arrayBuffer());
    const encoded = btoa(String.fromCharCode(...compressed)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
    if (encoded.length + 3 < url.search.length) url.search = new URLSearchParams({ v: encoded }).toString();
  } catch { /* Leave the explicit query as a fallback. */ }
  return url.href;
}
