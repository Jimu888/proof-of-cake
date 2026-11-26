import { ZODIAC_FILTERS, type ZodiacFilter } from './zodiac';
import { milestoneDeadline, parseReservePlan, type ReservePlan } from './reserve-plan';
import { randomBytes, randomUUID } from 'node:crypto';
import { normalizeGiftRecipient } from './gift-recipient';
import { findArtwork, type Artwork } from './catalog';
import { parseVaultDraft, type VaultDraft } from './vault-gift';
import { parseGroupNotes, parseLoveAgreement, type GroupNote, type LoveAgreement } from './gifting-modes';
import { allocateRevenue, type RevenueSplit } from './artwork-policy';

export class OrderInputError extends Error {}
export type OrderInput = {
  artworkId: string;
  recipient: string;
  message: string;
  vault?: VaultDraft;
  reserve?: ReservePlan;
  zodiacFilter?: ZodiacFilter;
  senderAddress?: string;
  agreement?: LoveAgreement;
  notes?: GroupNote[];
};
export type DemoOrder = {
  id: string;
  shareToken: string;
  mode: 'demo';
  status: 'demo_preview';
  createdAt: string;
  expiresAt: string;
  recipient: string;
  recipientVerified: false;
  sender: '演示赠送人';
  message: string;
  vault?: VaultDraft;
  reserve?: ReservePlan;
  zodiacFilter?: ZodiacFilter;
  senderAddress?: string;
  agreement?: LoveAgreement;
  notes?: GroupNote[];
  artwork: Artwork;
  settlement: { version: string; artistBps: number; artistAmount: string; platformAmount: string };
};
export type OrderResult = { order: DemoOrder; replay: boolean };
export interface OrderRepository {
  create(key: string, fingerprint: string, candidate: DemoOrder): OrderResult;
  findByToken(token: string): DemoOrder | undefined;
}
export function parseOrder(input: unknown, lookup = findArtwork): OrderInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new OrderInputError('请填写礼物信息。');
  const data = input as Record<string, unknown>;
  const allowed = ['artworkId', 'recipient', 'message', 'publicMessageAccepted', 'vault', 'senderAddress', 'agreement', 'notes', 'reserve', 'zodiacFilter'];
  if (Object.keys(data).some(key => !allowed.includes(key))) throw new OrderInputError('包含不支持的订单字段。');
  const artwork = typeof data.artworkId === 'string' ? lookup(data.artworkId) : undefined;
  if (!artwork) throw new OrderInputError('作品不存在。');
  const recipient = normalizeGiftRecipient(data.recipient);
  if (!recipient) throw new OrderInputError('请输入有效的邮箱、社交账号、.ai 名称或钱包地址。');
  const zodiacFilter = data.zodiacFilter;
  if (zodiacFilter !== undefined && (!artwork.id.startsWith('zodiac-') || !ZODIAC_FILTERS.some(filter => filter.id === zodiacFilter))) {
    throw new OrderInputError('请选择可用的生肖材质。');
  }
  if (typeof data.message !== 'string' || data.message.length > 280 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(data.message)) {
    throw new OrderInputError('祝福最多 280 字，请使用普通文字。');
  }
  let vault;
  try { vault = parseVaultDraft(data.vault, 0); }
  catch (error) { throw new OrderInputError((error as Error).message); }
  if (vault && !artwork.policy.holderCanBurn) throw new OrderInputError('该发行版本不允许销毁，无法封入资产。');
  let reserve;
  try { reserve = parseReservePlan(data.reserve); }
  catch (error) { throw new OrderInputError((error as Error).message); }
  if (reserve && (vault || data.agreement !== undefined)) throw new OrderInputError('请选择一种礼金配置。');
  const senderAddress = normalizeGiftRecipient(data.senderAddress);
  const agreement = parseLoveAgreement(data.agreement);
  const notes = parseGroupNotes(data.notes);
  if ((data.senderAddress !== undefined && !senderAddress) ||
    (artwork.id === 'algorithmic-bond' && !senderAddress)) {
    throw new OrderInputError('请输入有效的发起人邮箱、社交账号、.ai 名称或钱包地址。');
  }
  if (data.agreement !== undefined && (!agreement || !senderAddress || senderAddress.toLowerCase() === recipient.toLowerCase() || notes)) {
    throw new OrderInputError('请输入不同的收礼身份和发起身份，以及有效礼金与终止条款。');
  }
  if (data.notes !== undefined && !notes) throw new OrderInputError('请填写有效的多人祝福。');
  return { artworkId: artwork.id, recipient, message: data.message.trim(),
    ...(typeof zodiacFilter === 'string' && { zodiacFilter: zodiacFilter as ZodiacFilter }), ...(reserve && { reserve }), ...(vault && { vault }), ...(senderAddress && { senderAddress }), ...(agreement && { agreement }), ...(notes && { notes }) };
}
export function demoOrderExpiry(now: number, parsed: Pick<OrderInput, 'vault' | 'reserve' | 'agreement'>) {
  const expiryBase = Math.max(now, (parsed.vault?.unlockTime ?? 0) * 1000, parsed.reserve?.date ? Date.parse(parsed.reserve.date) : 0,
    parsed.agreement?.date ? Date.parse(parsed.agreement.date) : 0,
    parsed.reserve?.unlock === 'price' ? milestoneDeadline(now, parsed.reserve.maxYears) : 0);
  return Math.min(expiryBase + 7 * 86400_000, 253402300799000);
}
export function createDemoOrder(repository: OrderRepository, input: unknown, key: string, split: RevenueSplit, lookup = findArtwork): OrderResult {
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(key)) throw new OrderInputError('请求标识无效，请刷新后重试。');
  const parsed = parseOrder(input, lookup);
  const artwork = structuredClone(lookup(parsed.artworkId)!);
  const allocation = allocateRevenue(BigInt(artwork.priceAtomic), split);
  const now = Date.now();
  const order: DemoOrder = {
    id: randomUUID(), shareToken: randomBytes(24).toString('hex'), mode: 'demo', status: 'demo_preview',
    createdAt: new Date(now).toISOString(), expiresAt: new Date(demoOrderExpiry(now, parsed)).toISOString(),
    recipient: parsed.recipient, recipientVerified: false, sender: '演示赠送人', message: parsed.message, artwork,
    ...(parsed.zodiacFilter && { zodiacFilter: parsed.zodiacFilter }), ...(parsed.reserve && { reserve: parsed.reserve }), ...(parsed.vault && { vault: parsed.vault }), ...(parsed.senderAddress && { senderAddress: parsed.senderAddress }),
    ...(parsed.agreement && { agreement: parsed.agreement }), ...(parsed.notes && { notes: parsed.notes }),
    settlement: { version: allocation.version, artistBps: allocation.artistBps, artistAmount: allocation.artistAmount.toString(), platformAmount: allocation.platformAmount.toString() },
  };
  return repository.create(key, JSON.stringify(parsed), order);
}
/** Settlement configuration stays on the server. Browser gets a display snapshot only. */
export function publicOrder(order: DemoOrder) {
  const { settlement: _settlement, ...display } = order;
  return display;
}
export type PublicDemoOrder = ReturnType<typeof publicOrder>;
