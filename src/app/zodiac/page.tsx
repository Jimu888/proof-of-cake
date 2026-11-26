import { redirect } from 'next/navigation';
import { zodiacSeries } from '../../domain/series';
import { shareParams, zodiacReceivePath, type ShareQuery } from '../../lib/zodiac-share';

export default async function LegacyZodiacPage({ searchParams }: { searchParams: Promise<ShareQuery> }) {
  const query = shareParams(await searchParams);
  const destination = query.get('sealed') === '1' || query.get('open') === '1' ? zodiacReceivePath : zodiacSeries.route;
  redirect(query.size ? `${destination}?${query}` : destination);
}
