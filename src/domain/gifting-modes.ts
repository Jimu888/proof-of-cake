import { ZeroAddress, getAddress, parseEther } from 'ethers';

export type GiftingMode = 'solo' | 'group' | 'love';
export const breakupTerms = ['proportional', 'a', 'b', 'donate'] as const;
export const promiseTokens = ['BTC', 'ETH', 'BNB', 'USDT'] as const;
export type PromiseToken = typeof promiseTokens[number];
export type LoveAgreement = {
  amounts: [string, string];
  token?: PromiseToken;
  terms: typeof breakupTerms[number];
  donation?: string;
  date?: string;
};
export type GroupNote = { name: string; message: string };
export const loveCooldown = 30 * 24 * 60 * 60;

export function previewAddress(value: unknown) {
  if (typeof value !== 'string' || !/^0x[0-9a-f]{40}$/i.test(value)) return;
  try {
    const address = getAddress(value);
    if (address !== ZeroAddress) return address;
  } catch { /* Invalid EVM checksum. */ }
}

export function parseLoveAgreement(value: unknown): LoveAgreement | undefined {
  if (!value || typeof value !== 'object') return;
  const draft = value as LoveAgreement;
  if (!Array.isArray(draft.amounts) || draft.amounts.length !== 2 ||
    draft.amounts.some((amount, index) => typeof amount !== 'string' || !/^\d{1,10}(?:\.\d{1,18})?$/.test(amount) || (parseEther(amount) <= 0n && (index === 0 || !draft.date))) ||
    !breakupTerms.includes(draft.terms)) return;
  const date = draft.date;
  if (date !== undefined && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) return;
  const token = draft.token;
  if (token !== undefined && !promiseTokens.includes(token)) return;
  const donation = draft.terms === 'donate' ? previewAddress(draft.donation) : undefined;
  if (draft.terms === 'donate' && !donation) return;
  return { amounts: [draft.amounts[0], draft.amounts[1]], ...(token && { token }), terms: draft.terms, ...(donation && { donation }), ...(date && { date }) };
}

export function parseGroupNotes(value: unknown): GroupNote[] | undefined {
  const plain = (text: unknown, max: number): text is string => typeof text === 'string' &&
    !!text.trim() && text.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text);
  if (!Array.isArray(value) || value.length < 2 || value.length > 8 ||
    !value.every(note => plain(note?.name, 36) && plain(note?.message, 180))) return;
  return value.map(({ name, message }) => ({ name: name.trim(), message: message.trim() }));
}
