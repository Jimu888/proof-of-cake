import { isOperator } from '../../../../../server/operator-auth';
import { getCreatorApplicationRepository } from '../../../../../server/creator-application-repository';

export async function GET(request: Request, { params }: { params: Promise<{ id: string; position: string }> }) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!await isOperator()) return new Response(null, { status: 401, headers });
  const { id, position } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id) || !/^[0-2]$/.test(position)) return new Response(null, { status: 404, headers });
  const file = getCreatorApplicationRepository().attachment(id, Number(position));
  if (!file) return new Response(null, { status: 404, headers });
  if (new URL(request.url).searchParams.get('preview') === '1') {
    const bytes = Buffer.from(file.bytes);
    const magic = bytes.subarray(0, 12).toString('hex');
    const contentType = magic.startsWith('89504e470d0a1a0a') ? 'image/png'
      : magic.startsWith('ffd8ff') ? 'image/jpeg'
      : /^474946383[79]61/.test(magic) ? 'image/gif'
      : /^52494646.{8}57454250/.test(magic) ? 'image/webp'
      : magic.startsWith('424d') ? 'image/bmp' : null;
    if (!contentType) return new Response(null, { status: 415, headers });
    return new Response(new Uint8Array(bytes), { headers: { ...headers, 'Content-Type': contentType, 'X-Content-Type-Options': 'nosniff' } });
  }
  const filename = encodeURIComponent(file.name.toWellFormed()).replace(/['()*]/g, character => '%' + character.charCodeAt(0).toString(16));
  return new Response(new Uint8Array(file.bytes), { headers: {
    ...headers, 'Content-Type': 'application/octet-stream', 'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': "attachment; filename*=UTF-8''" + filename,
  } });
}
