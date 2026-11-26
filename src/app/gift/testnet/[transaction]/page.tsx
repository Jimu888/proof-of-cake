import { LanguageSwitch, LocalText } from '../../../../lib/i18n';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PlatformReceive from '../../../../components/platform-receive';
import { getOperations } from '../../../../server/operations';
import { findArtwork } from '../../../../domain/catalog';
import { verifyAndRecordGift, testnetProvider, transactionHashPattern } from '../../../../server/testnet-gifts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: '礼物 · Mement', robots: { index: false, follow: false } };
export default async function TestnetGiftPage({ params }: { params: Promise<{ transaction: string }> }) {
  const { transaction } = await params;
  if (!transactionHashPattern.test(transaction)) notFound();
  const provider = testnetProvider();
  const gift = await (async () => {
    try { return await verifyAndRecordGift(provider, transaction); }
    catch { return null; }
    finally { provider.destroy(); }
  })();
  if (!gift) return <main className="platform-empty"><div className="receive-page-controls"><LanguageSwitch/></div><h1><LocalText en="This gift could not be verified yet." zh="暂时无法确认这份礼物。"/></h1><p><LocalText en="Check the transaction link or try again later." zh="请核对交易链接，或稍后刷新查看。"/></p><Link className="button primary" href="/wallet"><LocalText en="Back to wallet gifting" zh="返回钱包赠礼"/></Link></main>;
  const artwork = getOperations().releaseByContract(gift.contract)?.artwork ?? findArtwork('cat')!;
  const { vault, ...order } = gift;
  return <PlatformReceive order={{ ...order, id: gift.tokenId, artwork }} transaction={gift.transaction} chainVault={vault}/>;
}
