import { inflateSync } from 'node:zlib';
import { notFound } from 'next/navigation';
import ZodiacReceive from '../../../components/zodiac-receive';
import { ZODIAC_FILTERS, isActiveZodiacId } from '../../../domain/zodiac';
import { readZodiacExtras, shareParams, unpackZodiacShare, type ShareQuery } from '../../../lib/zodiac-share';

export const metadata = { title: '生肖生辰礼 · Mement', robots: { index: false, follow: false } };

export default async function ZodiacGiftPage({ searchParams }: { searchParams: Promise<ShareQuery> }) {
  let params = shareParams(await searchParams);
  const compressed = params.get('v');
  if (compressed !== null) {
    if (!/^[A-Za-z0-9_-]{1,16384}$/.test(compressed)) notFound();
    try {
      params = unpackZodiacShare(inflateSync(Buffer.from(compressed, 'base64url'), { maxOutputLength: 32768 }).toString('utf8'));
    } catch { notFound(); }
  }
  const sign = params.get('sign') ?? 'goat';
  if (!isActiveZodiacId(sign)) notFound();
  const filter = ZODIAC_FILTERS.find(item => item.id === params.get('filter'))?.id ?? 'original';
  const paperParam = params.get('paper');
  const paper = paperParam === 'rice' || paperParam === 'slate' ? paperParam : 'graphite';
  const extras = readZodiacExtras(params);
  return <ZodiacReceive sign={sign} filter={filter} paper={paper}
    recipient={params.get('to')?.slice(0, 100)}
    sender={params.get('from')?.slice(0, 100) || 'Mement'}
    message={params.get('msg')?.slice(0, 280)} {...extras}/>;
}
