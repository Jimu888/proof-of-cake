import { Interface, formatUnits } from 'ethers';
import { previewAddress } from '../../../../domain/gifting-modes';
import { atlasOracleMetadata, atlasOracleRegistry, atlasSymbolForAddress, IAtlasPriceFeed, type AtlasSymbol } from '../../../../lib/atlas-oracle';
import { reserveMarket } from '../../../../server/reserve-market';

const feedAbi = new Interface(IAtlasPriceFeed);
const maxFeedAgeSeconds = 3600n;

async function readAtlasPrice(symbol: AtlasSymbol) {
  const spec = atlasOracleRegistry.feeds[symbol];
  const envVal = process.env[spec.env];
  const feed = previewAddress(envVal !== undefined ? envVal : spec.defaultAddress);
  if (!feed) return null;
  const rpc = process.env.ATLAS_ORACLE_BSC_RPC || spec.rpc;
  const signal = AbortSignal.timeout(5000);
  async function request(method: string, params: unknown[]) {
    const response = await fetch(rpc, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    if (!response.ok) throw new Error('Atlas RPC unavailable');
    const { result } = await response.json();
    if (typeof result !== 'string') throw new Error('Invalid Atlas RPC result');
    return result;
  }
  async function read(method: string) {
    const data = feedAbi.encodeFunctionData(method);
    const result = await request('eth_call', [{ to: feed, data }, 'latest']);
    return feedAbi.decodeFunctionResult(method, result);
  }
  try {
    const [chain, [decimals], [roundId, answer, , updatedAt, answeredInRound]] = await Promise.all([
      request('eth_chainId', []), read('decimals'), read('latestRoundData'),
    ]);
    const now = BigInt(Math.floor(Date.now() / 1000));
    const chainId = BigInt(chain);
    if ((chainId !== 56n && chainId !== 97n) || answer <= 0n || roundId === 0n || answeredInRound < roundId ||
      updatedAt === 0n || updatedAt > now || now - updatedAt > maxFeedAgeSeconds || decimals > 36n) return null;
    const price = Number(formatUnits(answer, Number(decimals)));
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const bstonx = params.get('symbol') === 'Bstonx';
  const address = previewAddress(bstonx ? process.env.MEMENT_BSTONX_MARKET_ADDRESS : params.get('address'));
  if (!address) return Response.json({ error: bstonx ? 'Market data unavailable' : 'Invalid token address' }, { status: bstonx ? 503 : 400 });
  const symbol = bstonx ? undefined : atlasSymbolForAddress(address);
  const [reference, atlasPrice] = await Promise.all([
    reserveMarket(address).catch(() => null), symbol ? readAtlasPrice(symbol) : null,
  ]);
  const oracle = symbol ? atlasOracleMetadata(symbol, atlasPrice === null ? 'reference-fallback' : 'configured') : undefined;
  if (!reference && atlasPrice === null) return Response.json({ error: 'Market data unavailable', oracle }, { status: 503 });
  return Response.json({ liquidity: reference?.liquidity ?? 0, price: atlasPrice ?? reference?.price ?? null, oracle });
}
