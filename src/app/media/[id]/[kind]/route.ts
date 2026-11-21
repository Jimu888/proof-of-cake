import { getOperations } from '../../../../server/operations';
import { isOperator } from '../../../../server/operator-auth';

export async function GET(_: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id) || (kind !== 'image' && kind !== 'cover')) return new Response(null, { status: 404 });
  const store = getOperations();
  const bytes = store.media(id, kind, false) ?? ((await isOperator()) ? store.media(id, kind, true) : null);
  if (!bytes) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
