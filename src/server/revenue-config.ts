import 'server-only';
import type { RevenueSplit } from '../domain/artwork-policy';

/** Read on the server when creating a new order. Persist the returned snapshot. */
export function getRevenueSplit(): RevenueSplit {
  const raw = process.env.ARTIST_REVENUE_BPS ?? '5000';
  if (!/^\d{1,5}$/.test(raw) || Number(raw) > 10_000) {
    throw new Error('ARTIST_REVENUE_BPS 必须是 0–10000 的整数。');
  }
  const version = process.env.REVENUE_SPLIT_VERSION?.trim() || 'split-v1';
  return Object.freeze({ version, artistBps: Number(raw) });
}
