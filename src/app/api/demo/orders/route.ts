import { zodiacArtwork } from '../../../../domain/zodiac-artwork';
import { liquidityMinimum } from '../../../../domain/reserve-plan';
import { reserveMarket } from '../../../../server/reserve-market';
import { getOperations } from '../../../../server/operations';
import { JsonRequestError, readJson } from '../../../../server/request-json';
import { publicArtwork } from '../../../../server/public-catalog';
import { createDemoOrder, parseOrder, OrderInputError, publicOrder } from '../../../../domain/orders';
import { assertDemoMode } from '../../../../server/mode';
import { getOrderRepository } from '../../../../server/order-repository';
import { getRevenueSplit } from '../../../../server/revenue-config';

const lookupArtwork = (id: string) => zodiacArtwork(id) ?? publicArtwork(id);

export const runtime = 'nodejs';
export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  try { assertDemoMode(); } catch { return Response.json({ error: '真实购买尚未开放。' }, { status: 503, headers }); }
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const source = new URL(origin);
      if (source.host !== request.headers.get('host') || source.protocol !== new URL(request.url).protocol) throw new Error('Origin mismatch');
    } catch { return Response.json({ error: '请求来源不匹配。' }, { status: 403, headers }); }
  }
  try {
    const input = await readJson(request, 8192);
    const { reserve } = parseOrder(input, lookupArtwork);
    if (reserve?.address) {
      let liquidity: number;
      try { ({ liquidity } = await reserveMarket(reserve.address)); }
      catch { return Response.json({ error: '暂时无法核验 PancakeSwap 流动性。' }, { status: 503, headers }); }
      if (liquidity < liquidityMinimum) throw new OrderInputError('PancakeSwap 流动性低于 $50,000。');
    }
    const result = createDemoOrder(getOrderRepository(), input, request.headers.get('idempotency-key') ?? '', getRevenueSplit(), lookupArtwork);
    if (result.order.artwork.showcase && !result.order.zodiacFilter) getOperations().recordDemoSale(result.order);
    return Response.json({ order: publicOrder(result.order), replay: result.replay, sharePath: `/gift/${result.order.shareToken}` }, { status: result.replay ? 200 : 201, headers });
  } catch (error) {
    if (error instanceof JsonRequestError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof OrderInputError || error instanceof SyntaxError) return Response.json({ error: error instanceof OrderInputError ? error.message : 'JSON 格式错误。' }, { status: 400, headers });
    console.error('Demo order creation failed', error instanceof Error ? error.name : 'UnknownError');
    return Response.json({ error: '无法保存预览，请稍后重试。' }, { status: 500, headers });
  }
}
