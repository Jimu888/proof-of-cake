import { readApplicationUpload } from '../../../../server/application-upload';
import { JsonRequestError, readJson } from '../../../../server/request-json';
import { ApplicationInputError } from '../../../../domain/creator-applications';
import { getCreatorApplicationRepository } from '../../../../server/creator-application-repository';
import { assertDemoMode } from '../../../../server/mode';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  try { assertDemoMode(); } catch { return Response.json({ error: '申请服务尚未启用。' }, { status: 503, headers }); }
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const source = new URL(origin);
      if (source.host !== request.headers.get('host') || source.protocol !== new URL(request.url).protocol) throw new Error('Origin mismatch');
    } catch { return Response.json({ error: '请求来源不匹配。' }, { status: 403, headers }); }
  }
  try {
    const submission = request.headers.get('content-type')?.startsWith('multipart/form-data;')
      ? await readApplicationUpload(request)
      : { input: await readJson(request, 12000), attachments: [] };
    const application = getCreatorApplicationRepository().submit(submission.input, request.headers.get('idempotency-key') ?? '', submission.attachments);
    return Response.json({ id: application.id, status: application.status }, { status: 200, headers });
  } catch (error) {
    if (error instanceof JsonRequestError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof ApplicationInputError || error instanceof SyntaxError) return Response.json({ error: error instanceof ApplicationInputError ? error.message : '请求格式错误。' }, { status: 400, headers });
    return Response.json({ error: '暂时无法保存申请，请稍后重试。' }, { status: 500, headers });
  }
}
