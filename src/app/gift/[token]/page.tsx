import { LanguageSwitch, LocalText } from '../../../lib/i18n';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrderRepository } from '../../../server/order-repository';
import { assertDemoMode } from '../../../server/mode';
import { demoOrderExpiry, OrderInputError, parseOrder, publicOrder, type DemoOrder, type PublicDemoOrder } from '../../../domain/orders';
import { findArtwork } from '../../../domain/catalog';
import { zodiacArtwork } from '../../../domain/zodiac-artwork';
import { decodeGiftSnapshot } from '../../../lib/gift-snapshot';
import ZodiacReceive from '../../../components/zodiac-receive';
import PlatformReceive from '../../../components/platform-receive';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Gift invitation · Mement', referrer: 'no-referrer', robots: { index: false, follow: false } };

function snapshotOrder(token: string, encoded: unknown): PublicDemoOrder | undefined {
  const snapshot = decodeGiftSnapshot(encoded);
  if (!snapshot) return;
  const { id, sender, createdAt, ...input } = snapshot;
  const artwork = zodiacArtwork(input.artworkId) ?? findArtwork(input.artworkId);
  if (!artwork) return;
  try {
    const parsed = parseOrder({ ...input, senderAddress: sender }, id => id === artwork.id ? artwork : undefined);
    const { artworkId: _artworkId, ...details } = parsed;
    const now = Date.now();
    const created = Date.parse(createdAt);
    const expiry = demoOrderExpiry(created, details);
    if (created > now || now >= expiry) return;
    return {
      ...details, artwork, createdAt, expiresAt: new Date(expiry).toISOString(), id: id ?? token, shareToken: token,
      mode: 'demo', status: 'demo_preview', recipientVerified: false, sender: '演示赠送人',
    };
  } catch (error) {
    if (!(error instanceof OrderInputError)) throw error;
  }
}

export default async function GiftPage({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paper?: string | string[]; s?: string | string[]; private?: string | string[]; tx?: string | string[]; contract?: string | string[]; kind?: string | string[]; tokenId?: string | string[]; agreementId?: string | string[] }>;
}) {
  const { token } = await params;
  if (!/^[0-9a-f]{48}$/.test(token)) notFound();
  try { assertDemoMode(); } catch { notFound(); }
  const { paper, s, private: privateFlag, tx, contract, kind, tokenId, agreementId } = await searchParams;
  const pick = (v?: string | string[]) => Array.isArray(v) ? v[0] : v;
  const privateNote = pick(privateFlag) === '1';
  const txHash = pick(tx);
  const contractAddr = pick(contract);
  const kindVal = pick(kind);
  const tid = pick(tokenId);
  const aid = pick(agreementId);
  const onchain = txHash && /^0x[0-9a-fA-F]{64}$/.test(txHash) && contractAddr && /^0x[0-9a-fA-F]{40}$/.test(contractAddr)
    ? {
        kind: (kindVal === 'love-vault' ? 'love-vault' : 'vault-gift') as 'vault-gift' | 'love-vault',
        txHash,
        contract: contractAddr,
        ...(tid && /^\d{1,12}$/.test(tid) ? { tokenId: tid } : {}),
        ...(aid && /^\d{1,12}$/.test(aid) ? { agreementId: aid } : {}),
      }
    : undefined;
  let stored: DemoOrder | undefined;
  try {
    stored = getOrderRepository().findByToken(token);
  } catch (error) {
    if (!s) throw error;
    console.warn('Demo order repository unavailable', error instanceof Error ? error.name : 'UnknownError');
  }
  const order = stored ? publicOrder(stored) : snapshotOrder(token, s);
  if (!order) return <main className="platform-empty room-page gift-invitation-empty">
    <div className="receive-page-controls"><LanguageSwitch/></div>
    <p className="eyebrow">MEMENT</p>
    <h1><LocalText en="This invitation has expired." zh="这份邀请已失效。"/></h1>
    <p><LocalText en="The link may have expired or may belong to a different server." zh="链接可能已过期，或尚未在这个服务中创建。"/></p>
    <Link className="room-button room-button-primary" href="/"><LocalText en="Back to the collection ↗" zh="返回精选作品 ↗"/></Link>
  </main>;
  if (order.zodiacFilter && order.artwork.zodiacSign) {
    return <ZodiacReceive sign={order.artwork.zodiacSign} filter={order.zodiacFilter}
      paper={paper === 'rice' || paper === 'slate' ? paper : 'graphite'} recipient={order.recipient}
      sender={order.senderAddress ?? 'Mement'} message={order.message} vault={order.vault}
      reserve={order.reserve} notes={order.notes} agreement={order.agreement} archiveId={order.id} createdAt={order.createdAt} onchain={onchain} privateNote={privateNote}/>;
  }
  return <PlatformReceive order={order} onchain={onchain} privateNote={privateNote}/>;
}
