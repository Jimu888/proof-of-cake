type MarketPair = {
  chainId?: string;
  dexId?: string;
  baseToken?: { address?: string };
  quoteToken?: { address?: string };
  priceUsd?: string;
  liquidity?: { usd?: number };
};

export async function reserveMarket(address: string) {
  const source = await fetch('https://api.dexscreener.com/token-pairs/v1/bsc/' + address, {
    next: { revalidate: 60 }, signal: AbortSignal.timeout(5000),
  });
  if (!source.ok) throw new Error('Market data unavailable');
  const pairs = await source.json() as MarketPair[];
  const matching = pairs.filter(pair => pair.chainId === 'bsc' && pair.dexId === 'pancakeswap');
  const poolDepth = (pair: MarketPair) => Number.isFinite(pair.liquidity?.usd) ? Math.max(0, pair.liquidity!.usd!) : 0;
  const liquidity = Math.max(0, ...matching.filter(pair => [pair.baseToken?.address, pair.quoteToken?.address]
    .some(token => token?.toLowerCase() === address.toLowerCase())).map(poolDepth));
  const quoted = matching.filter(pair => pair.baseToken?.address?.toLowerCase() === address.toLowerCase() &&
    Number.isFinite(Number(pair.priceUsd)) && Number(pair.priceUsd) > 0).sort((a, b) => poolDepth(b) - poolDepth(a))[0];
  return { liquidity, price: quoted ? Number(quoted.priceUsd) : null };
}
