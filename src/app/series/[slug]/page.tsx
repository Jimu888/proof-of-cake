import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import ZodiacStudio from '../../../components/zodiac-studio';
import NewYearCapsule from '../../../components/new-year-capsule';
import { giftSeries, zodiacSeries } from '../../../domain/series';
import { shareParams, zodiacReceivePath, type ShareQuery } from '../../../lib/zodiac-share';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const series = giftSeries.find(exhibition => exhibition.slug === slug);
  return series ? { title: `${series.titleEn} · ${series.titleCn} | Mement`, description: series.summary } : {};
}

export default async function SeriesPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<ShareQuery> }) {
  const { slug } = await params;
  if (slug === 'new-year') return <NewYearCapsule/>;
  if (slug === 'love-vault') redirect('/gifts/algorithmic-bond');
  if (slug !== zodiacSeries.slug) notFound();
  const query = shareParams(await searchParams);
  if (query.get('sealed') === '1' || query.get('open') === '1') redirect(`${zodiacReceivePath}?${query}`);
  return <ZodiacStudio query={query.toString()}/>;
}
