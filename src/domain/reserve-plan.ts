import { previewAddress } from './gifting-modes';

export const activeReserveTokens = ['BTC', 'ETH', 'BNB', 'USDT'] as const;
export const reserveTokens = ['BTC', 'ETH', 'BNB', 'USDT', 'BTCB', 'Bstonx', 'custom'] as const;
export const marketAddresses: Partial<Record<typeof reserveTokens[number], string>> = {
  BTC: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
  ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
  BNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
};
export const liquidityMinimum = 50_000;
export const frequencies = ['daily', 'three-days', 'weekly'] as const;
export const unlockRules = ['instant', 'date', 'price'] as const;
export const milestoneMaxYears = [1, 2, 3, 4, 5] as const;
export type ReservePlan = {
  token: typeof reserveTokens[number];
  address?: string;
  amount: string;
  unlock: typeof unlockRules[number];
  date?: string;
  price?: string;
  maxYears?: (typeof milestoneMaxYears)[number];
  schedule?: { frequency: typeof frequencies[number]; periods: number };
};

export function positiveDecimal(value: unknown): value is string {
  return typeof value === 'string' && /^\d{1,32}(?:\.\d{1,18})?$/.test(value) && Number(value) > 0;
}

export function parseReservePlan(value: unknown): ReservePlan | undefined {
  if (value == null) return;
  const draft = value as ReservePlan;
  const invalid = () => { throw new Error('请检查礼金金额、代币及解锁条件。'); };
  if (!reserveTokens.includes(draft.token) || !unlockRules.includes(draft.unlock) || !positiveDecimal(draft.amount)) return invalid();
  const address = draft.token === 'custom' ? previewAddress(draft.address) : undefined;
  if (draft.token === 'custom' && !address) return invalid();
  const date = draft.unlock === 'date' ? draft.date : undefined;
  const price = draft.unlock === 'price' ? draft.price : undefined;
  if (draft.unlock === 'date' && (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) return invalid();
  if (draft.unlock === 'price' && (!positiveDecimal(price) || (!address && !marketAddresses[draft.token] && draft.token !== 'Bstonx'))) return invalid();
  const maxYears = draft.unlock === 'price' ? (draft.maxYears === undefined ? 3 : draft.maxYears) : undefined;
  if (draft.unlock === 'price' && (maxYears === undefined || !milestoneMaxYears.includes(maxYears))) return invalid();
  const schedule = draft.schedule;
  if (schedule && (!frequencies.includes(schedule.frequency) || !Number.isSafeInteger(schedule.periods) || schedule.periods < 2)) return invalid();
  return { token: draft.token, amount: draft.amount, unlock: draft.unlock,
    ...(address && { address }), ...(date && { date }), ...(price && { price, maxYears }),
    ...(schedule && { schedule: { frequency: schedule.frequency, periods: schedule.periods } }) };
}


export function milestoneDeadline(createdAt: number, years: ReservePlan['maxYears'] = 3) {
  const date = new Date(createdAt);
  const month = date.getUTCMonth();
  date.setUTCFullYear(date.getUTCFullYear() + years);
  if (date.getUTCMonth() !== month) date.setUTCDate(0);
  return date.getTime();
}
