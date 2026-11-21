import { RevertedGiftTransaction, readTestnetConfiguration, verifyAndRecordGift, testnetProvider, transactionHashPattern } from '../../../server/testnet-gifts';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'no-store' };
export async function GET(request: Request) {
  const transaction = new URL(request.url).searchParams.get('transaction');
  if (transaction !== null && !transactionHashPattern.test(transaction)) return Response.json({ error: '交易哈希格式无效。' }, { status: 400, headers });
  const provider = testnetProvider();
  try {
    if (!transaction) return Response.json(await readTestnetConfiguration(provider), { headers });
    return Response.json(await verifyAndRecordGift(provider, transaction) ?? { tokenId: null }, { headers });
  } catch (error) {
    if (error instanceof RevertedGiftTransaction) return Response.json({ state: 'reverted', error: '测试网交易已回滚，未铸造礼物。' }, { status: 422, headers });
    return Response.json({ error: transaction ? '暂时无法确认此交易为测试赠礼。' : '测试网节点或合约暂不可用。' }, { status: 503, headers });
  }
  finally { provider.destroy(); }
}
