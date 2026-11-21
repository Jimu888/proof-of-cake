import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomToken, digest } from './operations';
import { platformDirectory } from './data-directory';

const cookie = 'mement_operator';
export function operatorKey() {
  if (process.env.MEMENT_OPERATOR_KEY) return process.env.MEMENT_OPERATOR_KEY;
  const path = join(platformDirectory, 'operator.key');
  mkdirSync(platformDirectory, { recursive: true, mode: 0o700 });
  try { writeFileSync(path, randomToken(), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
  return readFileSync(path, 'utf8');
}
// The local service owns session validity so logout invalidates the token itself.
const runtime = globalThis as typeof globalThis & { mementOperatorSessions?: Map<string, number> };
const sessions = runtime.mementOperatorSessions ??= new Map<string, number>();

export async function isOperator() {
  const token = (await cookies()).get(cookie)?.value ?? '';
  return /^[a-f0-9]{64}$/.test(token) && (sessions.get(digest(token)) ?? 0) > Date.now();
}

export async function operatorLogin(key: string) {
  if (!timingSafeEqual(Buffer.from(digest(key)), Buffer.from(digest(operatorKey())))) return false;
  const jar = await cookies();
  const previous = jar.get(cookie)?.value;
  if (previous) sessions.delete(digest(previous));
  const now = Date.now();
  for (const [hash, expiry] of sessions) if (expiry <= now) sessions.delete(hash);
  if (sessions.size >= 1000) return false;
  const token = randomToken();
  sessions.set(digest(token), now + 8 * 3600_000);
  jar.set(cookie, token, {
    httpOnly: true, sameSite: 'strict', path: '/', maxAge: 8 * 3600,
    secure: process.env.MEMENT_ORIGIN?.startsWith('https:') ?? false,
  });
  return true;
}

export async function operatorLogout() {
  const jar = await cookies();
  const token = jar.get(cookie)?.value;
  if (token) sessions.delete(digest(token));
  jar.delete(cookie);
}
