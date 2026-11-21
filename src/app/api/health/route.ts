export function GET() {
  return Response.json({ ok: true, stage: 'platform-demo', liveTransactions: false });
}
