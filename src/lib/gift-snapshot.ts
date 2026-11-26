import { normalizeGiftRecipient } from '../domain/gift-recipient';
import { parseLoveAgreement, type LoveAgreement } from '../domain/gifting-modes';
import { parseReservePlan, type ReservePlan } from '../domain/reserve-plan';
import { ZODIAC_FILTERS, type ZodiacFilter } from '../domain/zodiac';

export const giftSnapshotUrlLimit = 1400;
const snapshotKeys = new Set(['id', 'artworkId', 'recipient', 'sender', 'message', 'createdAt', 'reserve', 'agreement', 'zodiacFilter']);

export type GiftSnapshot = {
  id?: string;
  artworkId: string;
  recipient: string;
  sender?: string;
  message: string;
  createdAt: string;
  reserve?: ReservePlan;
  agreement?: LoveAgreement;
  zodiacFilter?: ZodiacFilter;
};

function parseSnapshot(value: unknown): GiftSnapshot | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !snapshotKeys.has(key))) return;
  const data = value as GiftSnapshot;
  const { id, artworkId, message, createdAt, zodiacFilter } = data;
  const recipient = normalizeGiftRecipient(data.recipient);
  const sender = normalizeGiftRecipient(data.sender);
  if (!recipient || (data.sender !== undefined && !sender) ||
    (id !== undefined && (typeof id !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id))) ||
    typeof artworkId !== 'string' || !/^[a-z0-9-]{1,80}$/.test(artworkId) ||
    typeof message !== 'string' || message.length > 280 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(message) ||
    typeof createdAt !== 'string' || !Number.isFinite(Date.parse(createdAt)) || new Date(createdAt).toISOString() !== createdAt ||
    (zodiacFilter !== undefined && !ZODIAC_FILTERS.some(filter => filter.id === zodiacFilter))) return;
  const reserve = parseReservePlan(data.reserve);
  const agreement = parseLoveAgreement(data.agreement);
  if ((data.reserve !== undefined && !reserve) || (data.agreement !== undefined && !agreement) || (reserve && agreement)) return;
  return { ...(id && { id }), artworkId, recipient, message, createdAt, ...(sender && { sender }), ...(reserve && { reserve }),
    ...(agreement && { agreement }), ...(zodiacFilter && { zodiacFilter }) };
}

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function encodeGiftSnapshot(snapshot: GiftSnapshot): string | undefined {
  try {
    const parsed = parseSnapshot(snapshot);
    if (!parsed) return;
    const bytes = new TextEncoder().encode(JSON.stringify(parsed));
    if (bytes.length > Math.floor(giftSnapshotUrlLimit * 3 / 4)) return;
    const encoded = base64url(bytes);
    if (encoded.length <= giftSnapshotUrlLimit) return encoded;
  } catch { return undefined; }
}

export function decodeGiftSnapshot(encoded: unknown): GiftSnapshot | undefined {
  if (typeof encoded !== 'string' || encoded.length > giftSnapshotUrlLimit || !/^[A-Za-z0-9_-]+$/.test(encoded)) return;
  try {
    const bytes = Uint8Array.from(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
    if (base64url(bytes) !== encoded) return;
    return parseSnapshot(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  } catch { return undefined; }
}
