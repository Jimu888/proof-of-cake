import { redirect } from 'next/navigation';
import { zodiacSeries } from '../../domain/series';

export default async function LegacyZodiacPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of typeof value === 'string' ? [value] : value ?? []) query.append(key, item);
  }
  redirect(query.size ? `${zodiacSeries.route}?${query}` : zodiacSeries.route);
}
