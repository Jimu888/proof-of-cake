import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ZodiacStudio from '../../../components/zodiac-studio';
import { zodiacSeries } from '../../../domain/series';

export const metadata: Metadata = {
  title: 'GENESIS ZODIAC · 十二生肖生日礼 | Mement',
  description: zodiacSeries.summary,
};

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  if ((await params).slug !== zodiacSeries.slug) notFound();
  return <ZodiacStudio />;
}
