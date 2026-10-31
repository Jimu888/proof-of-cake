import { randomUUID } from 'node:crypto';
import { catalog, blessings } from './catalog';

export class InputError extends Error {}
export type Gift = {
  id: string; artworkId: string; recipientHandle: string;
  blessingId: keyof typeof blessings; status: 'demo_created';
  createdAt: string; mode: 'demo';
};
export function parseGift(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InputError('请求内容必须是对象。');
  const data = input as Record<string, unknown>;
  if (Object.keys(data).some(k => !['artworkId', 'recipientHandle', 'blessingId'].includes(k))) throw new InputError('包含不支持的字段。');
  if (typeof data.artworkId !== 'string' || !catalog.some(a => a.id === data.artworkId)) throw new InputError('作品不存在。');
  if (typeof data.recipientHandle !== 'string' || data.recipientHandle.length > 40) throw new InputError('请输入收礼人的 Agent ID。');
  const handle = data.recipientHandle.trim().toLowerCase().replace(/\.ai$/, '');
  if (!/^[a-z0-9]{3,15}$/.test(handle)) throw new InputError('Agent ID 应为 3–15 位英文字母或数字，可带 .ai 后缀。');
  if (typeof data.blessingId !== 'string' || !Object.hasOwn(blessings, data.blessingId)) throw new InputError('请选择预设祝福。');
  return { artworkId: data.artworkId, recipientHandle: `${handle}.ai`, blessingId: data.blessingId as keyof typeof blessings };
}

// Disposable demo repository only. Process-local, capped, expires after one hour.
// Replace with a transactional PostgreSQL repository before accepting real orders.
export class DemoGiftService {
  private entries = new Map<string, { fingerprint: string; gift: Gift; expiresAt: number }>();
  constructor(private capacity = 1000, private ttl = 3_600_000) {}
  create(input: unknown, key: string) {
    if (!/^[a-zA-Z0-9_-]{8,100}$/.test(key)) throw new InputError('请提供 8–100 位 Idempotency-Key。');
    const parsed = parseGift(input);
    const fingerprint = JSON.stringify(parsed);
    const now = Date.now();
    for (const [k, v] of this.entries) if (v.expiresAt <= now) this.entries.delete(k);
    const previous = this.entries.get(key);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new InputError('相同请求标识不能用于不同礼物。');
      return { gift: previous.gift, replay: true };
    }
    if (this.entries.size >= this.capacity) throw new InputError('演示记录已满，请稍后再试。');
    const gift: Gift = { id: randomUUID(), ...parsed, status: 'demo_created', mode: 'demo', createdAt: new Date(now).toISOString() };
    this.entries.set(key, { fingerprint, gift, expiresAt: now + this.ttl });
    return { gift, replay: false };
  }
}
export const demoGifts = new DemoGiftService();
