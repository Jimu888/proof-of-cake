export function GET() {
  return Response.json({ ok: true, stage: 'foundation', liveTransactions: false });
}
