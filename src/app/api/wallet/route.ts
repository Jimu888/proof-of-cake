import { JsonRequestError, readJson } from '../../../server/request-json';
import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { WalletAuthError, walletAuth, sessionLifetime } from '../../../server/wallet-auth';
import { testnet } from '../../../lib/testnet';

export const runtime = 'nodejs';
const sessionCookie = 'mement_testnet_session';
const browserCookie = 'mement_wallet_browser';
const headers = { 'Cache-Control': 'no-store' };
function siteOrigin(request: NextRequest) {
  const configured = process.env.MEMENT_ORIGIN;
  if (configured) {
    const site = new URL(configured);
    if (site.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(site.hostname)) throw new Error('HTTPS origin required');
    return site.origin;
  }
  const host = request.headers.get('host') ?? '';
  if (!/^(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(host)) throw new Error('MEMENT_ORIGIN required');
  return 'http://' + host;
}

export function GET(request: NextRequest) {
  try {
    const session = walletAuth.read(request.cookies.get(sessionCookie)?.value ?? '', siteOrigin(request));
    return NextResponse.json({ address: session?.address ?? null, chainId: testnet.id }, { headers });
  } catch { return NextResponse.json({ error: '网站登录地址尚未配置。' }, { status: 503, headers }); }
}

export async function POST(request: NextRequest) {
  try {
    const origin = siteOrigin(request);
    if (request.headers.get('origin') !== origin) return NextResponse.json({ error: '请求来源不匹配。' }, { status: 403, headers });
    const options = { httpOnly: true, sameSite: 'strict' as const, secure: origin.startsWith('https:'), path: '/' };
    const previous = request.cookies.get(sessionCookie)?.value ?? '';
    const data = await readJson(request, 4096) as { action?: unknown; address?: unknown; nonce?: unknown; signature?: unknown } | null;
    let browser = request.cookies.get(browserCookie)?.value;
    if (data?.action === 'logout') {
      if (browser) walletAuth.cancelChallenges(browser, origin);
      walletAuth.revoke(previous);
      const response = NextResponse.json({ address: null }, { headers });
      response.cookies.set(sessionCookie, '', { ...options, maxAge: 0 });
      response.cookies.set(browserCookie, '', { ...options, maxAge: 0 });
      return response;
    }
    if (data?.action === 'challenge') {
      browser ||= randomBytes(32).toString('hex');
      const response = NextResponse.json(walletAuth.challenge(data.address, origin, browser), { headers });
      response.cookies.set(browserCookie, browser, { ...options, maxAge: 300 });
      return response;
    }
    if (data?.action !== 'verify' || !browser) throw new WalletAuthError('请先请求登录签名。');
    const { sessionToken, session } = walletAuth.verify(data.nonce, data.signature, origin, browser);
    walletAuth.revoke(previous);
    const response = NextResponse.json({ address: session.address, chainId: testnet.id }, { headers });
    response.cookies.set(sessionCookie, sessionToken, { ...options, maxAge: sessionLifetime / 1000 });
    return response;
  } catch (error) {
    if (error instanceof JsonRequestError) return NextResponse.json({ error: error.message }, { status: error.status, headers });
    if (error instanceof WalletAuthError || error instanceof SyntaxError) return NextResponse.json({ error: error instanceof SyntaxError ? '请求格式错误。' : (error as Error).message }, { status: 400, headers });
    return NextResponse.json({ error: '钱包登录服务暂不可用。' }, { status: 503, headers });
  }
}
