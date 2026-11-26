import type { Metadata } from 'next';
import WalletLogin from '../../components/wallet-login';
import { getOperations } from '../../server/operations';
import Link from 'next/link';
import RoomHeader from '../../components/room-header';
import { LocalText } from '../../lib/i18n';
import { notFound } from 'next/navigation';
import { readTestnetConfiguration, readTestnetGift, testnetProvider, transactionHashPattern } from '../../server/testnet-gifts';
import { isOperator } from '../../server/operator-auth';
export const metadata: Metadata = { title: 'Wallet sign-in · Mement', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function WalletPage({ searchParams }: { searchParams: Promise<{ artwork?: string; issue?: string; redeem?: string }> }) {
  const query = await searchParams;
  if (query.redeem) {
    if (!transactionHashPattern.test(query.redeem)) notFound();
    const provider = testnetProvider();
    let gift;
    try { gift = await readTestnetGift(provider, query.redeem, await readTestnetConfiguration(provider)); }
    catch { /* A failed RPC read never grants redemption access. */ }
    finally { provider.destroy(); }
    if (!gift?.vault?.owner || gift.vault.redeemed) {
      return <div className="platform-page room-page wallet-page">
        <RoomHeader/>
        <main className="creator-application-layout">
          <section className="creator-application-intro">
            <h1><LocalText en="No vaulted assets available to redeem" zh="暂时没有可取出的内封资产"/></h1>
            <Link className="room-button" href={'/gift/testnet/' + query.redeem}><LocalText en="Return to the gift →" zh="返回礼物 →"/></Link>
          </section>
        </main>
      </div>;
    }
    return <WalletLogin projectId={process.env.WALLETCONNECT_PROJECT_ID ?? ''}
      redemption={{ purchase: gift.transaction, contract: gift.contract, tokenId: gift.tokenId, asset: gift.vault }}
      rpc={process.env.MEMENT_LOCAL_TESTNET_RPC}/>;
  }
  const store = getOperations();
  const artwork = query.artwork ? store.publishedArtwork(query.artwork) : undefined;
  const release = artwork && store.release(artwork.id);
  const issue = query.issue && await isOperator() && !store.release(query.issue)
    ? store.publishedArtwork(query.issue) : undefined;
  return <WalletLogin projectId={process.env.WALLETCONNECT_PROJECT_ID ?? ''}
    artworkRequested={!!query.artwork || !!query.issue}
    sale={release && { id: release.artwork.id, title: release.artwork.title, contract: release.contract, price: release.artwork.priceAtomic, policy: release.artwork.policy, vault: !!release.vault && release.artwork.policy.holderCanBurn }}
    issue={issue && { id: issue.id, title: issue.title, price: issue.price }}
    rpc={process.env.MEMENT_LOCAL_TESTNET_RPC}/>;
}
