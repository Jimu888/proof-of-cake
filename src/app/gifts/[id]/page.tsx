import { getOperations } from '../../../server/operations';
import { notFound } from 'next/navigation';
import { publicArtwork } from '../../../server/public-catalog';
export const dynamic = 'force-dynamic';
import GiftCheckout from '../../../components/gift-checkout';
export default async function ArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const artwork = publicArtwork((await params).id);
  if (!artwork) notFound();
  return <GiftCheckout artwork={artwork} testnetAvailable={!!getOperations().release(artwork.id)}/>;
}
