/** Chosen by the creator before publication and fixed for that release. */
export type ArtworkPolicy = Readonly<{
  transferable: boolean;
  holderCanBurn: boolean;
}>;

export function describeArtworkPolicy(policy: ArtworkPolicy): string {
  return `${policy.transferable ? '可转让' : '不可转让'} · ${policy.holderCanBurn ? '持有人可销毁' : '不可销毁'}`;
}

export type RevenueSplit = Readonly<{
  version: string;
  artistBps: number;
}>;

/** Atomic integer units only. The artist receives any indivisible remainder. */
export function allocateRevenue(amount: bigint, split: RevenueSplit) {
  if (amount < 0n) throw new Error('销售金额不能为负数。');
  if (!Number.isSafeInteger(split.artistBps) || split.artistBps < 0 || split.artistBps > 10_000 || !split.version.trim()) {
    throw new Error('分成必须包含版本和有效的创作者比例。');
  }
  const platformAmount = amount * BigInt(10_000 - split.artistBps) / 10_000n;
  return Object.freeze({
    version: split.version,
    artistBps: split.artistBps,
    artistAmount: amount - platformAmount,
    platformAmount,
  });
}
