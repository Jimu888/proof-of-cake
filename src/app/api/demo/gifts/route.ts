import { JsonRequestError, readJson } from '../../../../server/request-json';
import { demoGifts, InputError } from '../../../../domain/gifts';
import { assertDemoMode } from '../../../../server/mode';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try { assertDemoMode(); } catch { return Response.json({ error: '真实交易尚未开放。' }, { status: 503 }); }
  // A local-only prototype, not a public endpoint. Hosting requires edge rate limiting.
  try {
    const result = demoGifts.create(await readJson(request, 4096), request.headers.get('idempotency-key') ?? '');
    return Response.json({ ...result, notice: '仅生成临时演示记录，未验证身份、未解析地址、未付款、未铸造或发送 NFT。' }, { status: result.replay ? 200 : 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof JsonRequestError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof InputError || error instanceof SyntaxError) return Response.json({ error: error instanceof InputError ? error.message : 'JSON 格式不正确。' }, { status: 400 });
    return Response.json({ error: '无法创建演示礼物。' }, { status: 500 });
  }
}
