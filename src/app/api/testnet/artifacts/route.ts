import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const artifactFiles: Record<string, string> = {
  MementVaultGift: 'contracts/platform/vault-gift.artifact.json',
  MementLoveVault: 'contracts/platform/love-vault.artifact.json',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') ?? '';
  const rel = artifactFiles[name];
  if (!rel) return NextResponse.json({ error: 'Unknown contract artifact.' }, { status: 400 });
  try {
    const raw = await readFile(path.join(process.cwd(), rel), 'utf8');
    const parsed = JSON.parse(raw) as { abi: unknown[]; bytecode: string };
    return NextResponse.json({ name, abi: parsed.abi, bytecode: parsed.bytecode });
  } catch {
    return NextResponse.json({ error: 'Contract artifact not compiled.' }, { status: 500 });
  }
}
