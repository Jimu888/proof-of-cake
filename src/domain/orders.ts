import { randomBytes, randomUUID } from 'node:crypto';
import { getAddress, ZeroAddress } from 'ethers';
import { findArtwork, type Artwork } from './catalog';
import { parseVaultDraft, type VaultDraft } from './vault-gift';
import { allocateRevenue, type RevenueSplit } from './artwork-policy';

export class OrderInputError extends Error {}
export type OrderInput = {
  artworkId: string;
  recipient: string;
  message: string;
  vault?: VaultDraft;
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
  const allowed = ['artworkId', 'recipient', 'message', 'publicMessageAccepted', 'vault'];
  if (Object.keys(data).some(key => !allowed.includes(key))) throw new OrderInputError('包含不支持的订单字段。');
  const artwork = typeof data.artworkId === 'string' ? lookup(data.artworkId) : undefined;
  if (!artwork) throw new OrderInputError('作品不存在。');
  if (typeof data.recipient !== 'string' || data.recipient.length > 100) throw new OrderInputError('请输入 .ai 名称或 BSC 钱包地址。');
  let recipient = data.recipient.trim();
  if (/^0x/i.test(recipient)) {
    try { recipient = getAddress(recipient); } catch { throw new OrderInputError('钱包地址格式或校验和有误。'); }
    if (recipient === ZeroAddress) throw new OrderInputError('不能赠送到零地址。');
  } else {
    recipient = recipient.toLowerCase();
    if (!/^[a-z0-9]{3,15}\.ai$/.test(recipient)) throw new OrderInputError('请输入完整 .ai 名称或 BSC 钱包地址。');
  }
  if (typeof data.message !== 'string' || data.message.length > 280 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(data.message)) {
    throw new OrderInputError('祝福最多 280 字，请使用普通文字。');
  }
  let vault;
  try { vault = parseVaultDraft(data.vault); }
  catch (error) { throw new OrderInputError((error as Error).message); }
  if (vault && !artwork.policy.holderCanBurn) throw new OrderInputError('该发行版本不允许销毁，无法封入资产。');
  return { artworkId: artwork.id, recipient, message: data.message.trim(), ...(vault && { vault }) };
}
export function createDemoOrder(repository: OrderRepository, input: unknown, key: string, split: RevenueSplit, lookup = findArtwork): OrderResult {
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(key)) throw new OrderInputError('请求标识无效，请刷新后重试。');
  const parsed = parseOrder(input, lookup);
  const artwork = structuredClone(lookup(parsed.artworkId)!);
  const allocation = allocateRevenue(BigInt(artwork.priceAtomic), split);
  const now = Date.now();
  const order: DemoOrder = {
    id: randomUUID(), shareToken: randomBytes(24).toString('hex'), mode: 'demo', status: 'demo_preview',
    createdAt: new Date(now).toISOString(), expiresAt: new Date(now + 7 * 86400_000).toISOString(),
    recipient: parsed.recipient, recipientVerified: false, sender: '演示赠送人', message: parsed.message, artwork, ...(parsed.vault && { vault: parsed.vault }),
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
