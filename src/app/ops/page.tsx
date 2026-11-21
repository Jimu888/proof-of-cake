import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isOperator } from '../../server/operator-auth';
import { signIn } from './actions';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mement 运营后台', robots: { index: false, follow: false } };

export default async function OperationsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isOperator()) redirect('/ops/creators');
  const query = await searchParams;
  return <main className="ops ops-login"><Link href="/">Mement</Link><h1>运营登录</h1>
    <form action={signIn}><label>运营密钥<input name="key" type="password" autoComplete="current-password" required maxLength={256}/></label><button>登录</button></form>
    {query.error && <p role="alert">运营密钥不正确。</p>}
  </main>;
}
