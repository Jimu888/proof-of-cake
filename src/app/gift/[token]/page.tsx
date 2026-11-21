import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrderRepository } from '../../../server/order-repository';
import { assertDemoMode } from '../../../server/mode';
import { publicOrder } from '../../../domain/orders';
import PlatformReceive from '../../../components/platform-receive';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: '一份心意 · Mement', robots: { index: false, follow: false } };
export default async function GiftPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{48}$/.test(token)) notFound();
  try { assertDemoMode(); } catch { notFound(); }
  const order = getOrderRepository().findByToken(token);
  if (!order) return <main className="platform-empty"><p className="eyebrow">MEMENT</p><h1>这份预览已结束。</h1><p>链接可能已过期，或尚未在这个服务中创建。</p><Link className="button outline" href="/">返回精选作品 ↗</Link></main>;
  return <PlatformReceive order={publicOrder(order)}/>;
}
