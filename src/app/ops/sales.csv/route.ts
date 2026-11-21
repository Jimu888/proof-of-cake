import { isOperator } from '../../../server/operator-auth';
import { getOperations } from '../../../server/operations';
export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  if (!await isOperator()) return new Response(null, { status: 401, headers });
  const month = new URL(request.url).searchParams.get('month') ?? '';
  if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return new Response(null, { status: 400, headers });
  const rows = getOperations().sales(month, (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, 100)).map(sale => [
    97, sale.contract, sale.transaction, sale.tokenId, sale.createdAt, sale.sender, sale.recipient, sale.price, sale.artistBps, sale.artistAmount, sale.platformAmount,
  ].join(','));
  return new Response(['chain_id,contract,transaction,token_id,date_utc,sender,recipient,price_wei,artist_bps,artist_wei,platform_wei', ...rows].join('\r\n'), {
    headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="mement-testnet-sales.csv"' },
  });
}
