import type { Metadata } from 'next';
import WalletLogin from '../../components/wallet-login';
import { getOperations } from '../../server/operations';
import { isOperator } from '../../server/operator-auth';
export const metadata: Metadata = { title: '钱包登录 · Mement', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function WalletPage({ searchParams }: { searchParams: Promise<{ artwork?: string; issue?: string }> }) {
  const query = await searchParams;
  const store = getOperations();
  const artwork = query.artwork ? store.publishedArtwork(query.artwork) : undefined;
  const release = artwork && store.release(artwork.id);
  const issue = query.issue && await isOperator() && !store.release(query.issue)
    ? store.publishedArtwork(query.issue) : undefined;
  return <WalletLogin projectId={process.env.WALLETCONNECT_PROJECT_ID ?? ''}
    artworkRequested={!!query.artwork || !!query.issue}
    sale={release && { id: release.artwork.id, title: release.artwork.title, contract: release.contract, price: release.artwork.priceAtomic }}
    issue={issue && { id: issue.id, title: issue.title, price: issue.price }}
    rpc={process.env.MEMENT_LOCAL_TESTNET_RPC}/>;
}
