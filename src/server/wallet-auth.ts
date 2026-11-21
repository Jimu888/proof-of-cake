import { randomBytes, createHash } from 'node:crypto';
import { getAddress, verifyMessage, ZeroAddress } from 'ethers';
import { testnet } from '../lib/testnet';

export class WalletAuthError extends Error {}
type Challenge = { address: string; message: string; origin: string; expiresAt: number; browser: string };
type Session = { address: string; origin: string; expiresAt: number };
const challengeLifetime = 5 * 60_000;
export const sessionLifetime = 8 * 60 * 60_000;

const token = () => randomBytes(32).toString('hex');
const digest = (value: string) => createHash('sha256').update(value).digest('hex');

export class WalletAuth {
  private challenges = new Map<string, Challenge>();
  private sessions = new Map<string, Session>();

  challenge(addressInput: unknown, origin: string, browser: string) {
    let address: string;
    try { address = getAddress(typeof addressInput === 'string' ? addressInput : ''); }
    catch { throw new WalletAuthError('钱包地址无效。'); }
    if (address === ZeroAddress) throw new WalletAuthError('钱包地址无效。');
    const now = Date.now();
    this.removeExpired(now);
    this.cancelChallenges(browser, origin);
    if (this.challenges.size >= 1000) throw new WalletAuthError('签名请求过多，请稍后重试。');
    const nonce = token();
    const site = new URL(origin);
    const expiresAt = now + challengeLifetime;
    const message = [
      `${site.protocol.slice(0, -1)}://${site.host} wants you to sign in with your Ethereum account:`,
      address, '', 'Sign in to Mement on BNB Smart Chain Testnet.', '',
      `URI: ${origin}/wallet`, 'Version: 1', `Chain ID: ${testnet.id}`, `Nonce: ${nonce}`,
      `Issued At: ${new Date(now).toISOString()}`, `Expiration Time: ${new Date(expiresAt).toISOString()}`,
    ].join('\n');
    this.challenges.set(nonce, { address, message, origin, expiresAt, browser });
    return { nonce, message };
  }

  verify(nonce: unknown, signature: unknown, origin: string, browser: string) {
    const now = Date.now();
    this.removeExpired(now);
    const challenge = typeof nonce === 'string' && this.challenges.get(nonce);
    if (!challenge || challenge.origin !== origin || challenge.browser !== browser) throw new WalletAuthError('签名请求已失效，请重新登录。');
    let signer: string | undefined;
    try {
      if (typeof signature === 'string' && /^0x(?:[a-fA-F0-9]{128}|[a-fA-F0-9]{130})$/.test(signature)) {
        signer = verifyMessage(challenge.message, signature);
      }
    } catch { /* Invalid signature. */ }
    if (signer !== challenge.address) throw new WalletAuthError('签名未通过钱包地址验证。');
    if (this.sessions.size >= 1000) throw new WalletAuthError('登录会话已满，请稍后重试。');
    this.challenges.delete(nonce as string);
    const sessionToken = token();
    const session = { address: challenge.address, origin, expiresAt: now + sessionLifetime };
    this.sessions.set(digest(sessionToken), session);
    return { sessionToken, session };
  }

  read(sessionToken: string, origin: string) {
    const session = this.sessions.get(digest(sessionToken));
    return session && session.origin === origin && session.expiresAt > Date.now() ? session : null;
  }

  cancelChallenges(browser: string, origin: string) {
    for (const [nonce, challenge] of this.challenges) {
      if (challenge.browser === browser && challenge.origin === origin) this.challenges.delete(nonce);
    }
  }

  revoke(sessionToken: string) { this.sessions.delete(digest(sessionToken)); }

  private removeExpired(now: number) {
    for (const [key, challenge] of this.challenges) if (challenge.expiresAt <= now) this.challenges.delete(key);
    for (const [key, session] of this.sessions) if (session.expiresAt <= now) this.sessions.delete(key);
  }
}

const runtime = globalThis as typeof globalThis & { mementWalletAuth?: WalletAuth };
export const walletAuth = runtime.mementWalletAuth ??= new WalletAuth();
