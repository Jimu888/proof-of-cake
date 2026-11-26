import { NextResponse } from 'next/server';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { JsonRpcProvider, getAddress, isAddress } from 'ethers';
import { testnet } from '../../../../lib/testnet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type StoredDeployments = {
  vaultGift?: string;
  loveVault?: string;
  atlasFeedBtc?: string;
  atlasFeedBnb?: string;
  vaultGiftTx?: string;
  loveVaultTx?: string;
};

const txPattern = /^0x[0-9a-fA-F]{64}$/;

function deploymentsFile() {
  const dir = process.env.MEMENT_DATA_DIR || path.join(process.cwd(), 'delivery', 'platform-demo');
  return path.join(dir, 'testnet-deployments.json');
}

async function readStored(): Promise<StoredDeployments> {
  try {
    const raw = await readFile(deploymentsFile(), 'utf8');
    return JSON.parse(raw) as StoredDeployments;
  } catch {
    return {};
  }
}

export async function GET() {
  const stored = await readStored();
  const vaultGift = process.env.NEXT_PUBLIC_MEMENT_VAULT_GIFT_CONTRACT || process.env.MEMENT_TESTNET_CONTRACT || stored.vaultGift;
  const loveVault = process.env.NEXT_PUBLIC_MEMENT_LOVE_VAULT_CONTRACT || process.env.MEMENT_LOVE_VAULT_CONTRACT || stored.loveVault;
  const atlasFeedBtc = process.env.NEXT_PUBLIC_ATLAS_ORACLE_FEED_BTC || process.env.ATLAS_ORACLE_FEED_BTC || stored.atlasFeedBtc;
  const atlasFeedBnb = process.env.NEXT_PUBLIC_ATLAS_ORACLE_FEED_BNB || process.env.ATLAS_ORACLE_FEED_BNB || stored.atlasFeedBnb;
  return NextResponse.json({
    chainId: testnet.id,
    explorer: testnet.explorer,
    vaultGift: vaultGift && isAddress(vaultGift) ? getAddress(vaultGift) : undefined,
    loveVault: loveVault && isAddress(loveVault) ? getAddress(loveVault) : undefined,
    atlasFeedBtc: atlasFeedBtc && isAddress(atlasFeedBtc) ? getAddress(atlasFeedBtc) : undefined,
    atlasFeedBnb: atlasFeedBnb && isAddress(atlasFeedBnb) ? getAddress(atlasFeedBnb) : undefined,
    vaultGiftTx: stored.vaultGiftTx,
    loveVaultTx: stored.loveVaultTx,
  });
}

export async function POST(request: Request) {
  let body: StoredDeployments;
  try {
    body = await request.json() as StoredDeployments;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const current = await readStored();
  const next: StoredDeployments = { ...current };
  const rpc = process.env.MEMENT_LOCAL_TESTNET_RPC || testnet.rpc;
  const provider = new JsonRpcProvider(rpc, testnet.id, { staticNetwork: true });

  try {
    for (const key of ['vaultGift', 'loveVault', 'atlasFeedBtc', 'atlasFeedBnb'] as const) {
      const candidate = body[key];
      if (!candidate) continue;
      if (!isAddress(candidate)) {
        return NextResponse.json({ error: `Invalid address for ${key}.` }, { status: 400 });
      }
      const checksum = getAddress(candidate);
      const code = await provider.getCode(checksum);
      if (!code || code === '0x') {
        return NextResponse.json({ error: `No deployed contract bytecode found on BSC Testnet 97 at ${checksum}.` }, { status: 400 });
      }
      next[key] = checksum;
    }
    if (body.vaultGiftTx && txPattern.test(body.vaultGiftTx)) next.vaultGiftTx = body.vaultGiftTx;
    if (body.loveVaultTx && txPattern.test(body.loveVaultTx)) next.loveVaultTx = body.loveVaultTx;
  } finally {
    provider.destroy();
  }

  const file = deploymentsFile();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(next, null, 2) + '\n', 'utf8');
  return NextResponse.json({ ok: true, ...next });
}
