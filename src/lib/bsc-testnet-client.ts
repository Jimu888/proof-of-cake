'use client';

import { BrowserProvider, Contract, ContractFactory, JsonRpcProvider, ZeroAddress, formatEther, getAddress, id, isAddress, parseEther, parseUnits } from 'ethers';
import { injectedWallets, selectTestnet, type Provider, type WalletWindow } from './injected-wallet';
import { giftAbi, vaultGiftAbi } from './test-gift';
import { loveVaultAbi, LOVE_COOLDOWN_SECONDS } from './love-vault-abi';
import { testnet } from './testnet';

export type TestnetDeployments = {
  vaultGift?: string;
  loveVault?: string;
  atlasFeedBtc?: string;
  atlasFeedBnb?: string;
  vaultGiftTx?: string;
  loveVaultTx?: string;
};

export type OnchainSealProof = {
  kind: 'vault-gift' | 'love-vault';
  txHash: string;
  contract: string;
  tokenId?: string;
  agreementId?: string;
};

export type OnchainProgress = {
  step: 'wallet' | 'confirming' | 'wallet_2' | 'confirming_2';
  txHash?: string;
};

const fullVaultGiftAbi = [...giftAbi, ...vaultGiftAbi];
const STORAGE_KEY = 'mement-bsc97-deployments';

export const DEFAULT_BSC97_DEPLOYMENTS: TestnetDeployments = {
  vaultGift: '0xCd918f5eB2070dc82FD0933b3D66073338f334F8',
  loveVault: '0x4601DD2C53d10A7561C795C3b3DaD3669b6270EF',
  atlasFeedBtc: '0xE20536BC715AAc6560394E33DEb66Ed205aEEc33',
  vaultGiftTx: '0x7f716d5a3388861f128c7aa212825921fcfa2cced17dde11efb5dfae382214cf',
  loveVaultTx: '0xf6c637157c8fd46e30aa4c93d090e3de9c4d5eb58fccaa02fd3e43a3f3bf36e8',
};

export function readLocalDeployments(): TestnetDeployments {
  const fromEnv: TestnetDeployments = {
    ...DEFAULT_BSC97_DEPLOYMENTS,
    ...(process.env.NEXT_PUBLIC_MEMENT_VAULT_GIFT_CONTRACT ? { vaultGift: process.env.NEXT_PUBLIC_MEMENT_VAULT_GIFT_CONTRACT } : {}),
    ...(process.env.NEXT_PUBLIC_MEMENT_LOVE_VAULT_CONTRACT ? { loveVault: process.env.NEXT_PUBLIC_MEMENT_LOVE_VAULT_CONTRACT } : {}),
  };
  if (typeof window === 'undefined') return fromEnv;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fromEnv;
    const parsed = JSON.parse(raw) as TestnetDeployments;
    return { ...parsed, ...fromEnv };
  } catch {
    return fromEnv;
  }
}

export async function fetchTestnetDeployments(): Promise<TestnetDeployments> {
  const local = readLocalDeployments();
  try {
    const res = await fetch('/api/testnet/deployments', { cache: 'no-store' });
    if (!res.ok) return local;
    const data = await res.json() as TestnetDeployments;
    const merged: TestnetDeployments = {
      vaultGift: data.vaultGift || local.vaultGift,
      loveVault: data.loveVault || local.loveVault,
      atlasFeedBtc: data.atlasFeedBtc || local.atlasFeedBtc || '0xE20536BC715AAc6560394E33DEb66Ed205aEEc33',
      atlasFeedBnb: data.atlasFeedBnb || local.atlasFeedBnb,
      vaultGiftTx: data.vaultGiftTx || local.vaultGiftTx,
      loveVaultTx: data.loveVaultTx || local.loveVaultTx,
    };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
    return merged;
  } catch {
    return local;
  }
}

export function pickInjectedProvider(): Provider {
  if (typeof window === 'undefined') throw new Error('No browser wallet available.');
  const wallets = injectedWallets(window as WalletWindow);
  if (wallets.length > 0) return wallets[0].provider;
  const fallback = (window as WalletWindow).ethereum;
  if (fallback?.request) return fallback;
  throw new Error('No EVM wallet detected. Please install MetaMask, OKX Wallet, or Binance Wallet.');
}

async function resolveProviderForSigner(preferred?: Provider, expectedSigner?: string): Promise<Provider> {
  if (preferred) return preferred;
  if (typeof window === 'undefined') throw new Error('No browser wallet available.');
  const wallets = injectedWallets(window as WalletWindow);
  const candidates: Provider[] = wallets.map(w => w.provider);
  const eth = (window as WalletWindow).ethereum;
  if (eth?.request && !candidates.includes(eth)) candidates.push(eth);
  if (candidates.length === 0) throw new Error('No EVM wallet detected. Please install MetaMask, OKX Wallet, or Binance Wallet.');

  const target = expectedSigner && isAddress(expectedSigner) ? expectedSigner.toLowerCase() : undefined;
  let firstConnected: Provider | undefined;

  for (const prov of candidates) {
    try {
      const accounts = await Promise.race([
        prov.request({ method: 'eth_accounts' }) as Promise<string[]>,
        new Promise<string[]>(resolve => setTimeout(() => resolve([]), 1200)),
      ]);
      if (Array.isArray(accounts) && accounts.length > 0) {
        if (!firstConnected) firstConnected = prov;
        if (target && accounts.some(a => typeof a === 'string' && a.toLowerCase() === target)) {
          return prov;
        }
      }
    } catch { /* try next wallet */ }
  }

  // If target wasn't found among already-authorized wallets, try requesting accounts on other wallets
  if (target && candidates.length > 1) {
    for (const prov of candidates) {
      if (prov === firstConnected) continue;
      try {
        const accounts = await Promise.race([
          prov.request({ method: 'eth_requestAccounts' }) as Promise<string[]>,
          new Promise<string[]>(resolve => setTimeout(() => resolve([]), 12000)),
        ]);
        if (Array.isArray(accounts) && accounts.some(a => typeof a === 'string' && a.toLowerCase() === target)) {
          return prov;
        }
      } catch { /* try next wallet */ }
    }
  }

  return firstConnected ?? candidates[0];
}

export async function connectBscTestnetSigner(preferred?: Provider, expectedSigner?: string) {
  const raw = await resolveProviderForSigner(preferred, expectedSigner);
  await raw.request({ method: 'eth_requestAccounts' });
  await selectTestnet(raw, testnet.rpc, 'Please switch your wallet to BNB Smart Chain Testnet (Chain ID 97).');
  const provider = new BrowserProvider(raw as unknown as { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> });
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}

export function resolveTestnetAddress(identity: string, fallback: string, avoid?: string): string {
  const trimmed = identity.trim();
  if (isAddress(trimmed)) {
    const addr = getAddress(trimmed);
    if (!avoid || addr.toLowerCase() !== avoid.toLowerCase()) return addr;
  }
  if (!avoid) return getAddress(fallback);
  // Deterministic non-zero BSC Testnet counterparty address derived from .ai / handle
  const hash = id('mement:bsc97:' + trimmed.toLowerCase());
  const derived = getAddress('0x' + hash.slice(26));
  if (derived.toLowerCase() === avoid.toLowerCase()) {
    return getAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  }
  return derived;
}

export async function readVaultGiftOnchainInfo(contractAddress: string): Promise<{ priceBnb: string; transferable: boolean } | null> {
  if (!isAddress(contractAddress)) return null;
  const rpc = new JsonRpcProvider(testnet.rpc, testnet.id, { staticNetwork: true });
  try {
    const c = new Contract(contractAddress, ['function price() view returns (uint256)', 'function transferable() view returns (bool)'], rpc);
    const [p, tr] = await Promise.all([c.price(), c.transferable()]);
    return { priceBnb: formatEther(p as bigint), transferable: Boolean(tr) };
  } catch {
    return null;
  } finally {
    rpc.destroy();
  }
}

async function bscTxOverrides(provider: BrowserProvider, extra: Record<string, unknown> = {}) {
  const minFee = parseUnits('1', 'gwei');
  try {
    const fee = await provider.getFeeData();
    const base = fee.maxFeePerGas ?? fee.gasPrice ?? minFee;
    const maxFeePerGas = base > minFee ? base : minFee;
    const maxPriorityFeePerGas = fee.maxPriorityFeePerGas && fee.maxPriorityFeePerGas > minFee ? fee.maxPriorityFeePerGas : minFee;
    return { maxFeePerGas, maxPriorityFeePerGas, ...extra };
  } catch {
    return { maxFeePerGas: minFee, maxPriorityFeePerGas: minFee, ...extra };
  }
}

export async function deployVaultGiftOnBscTestnet(artistAddress: string, giftPriceBnb = '0.03') {
  const { provider, signer, address } = await connectBscTestnetSigner();
  const res = await fetch('/api/testnet/artifacts?name=MementVaultGift', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load MementVaultGift artifact.');
  const artifact = await res.json() as { abi: unknown[]; bytecode: string };
  const artist = isAddress(artistAddress) && artistAddress.toLowerCase() !== address.toLowerCase()
    ? getAddress(artistAddress)
    : getAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  const unitPrice = parseEther(Number(giftPriceBnb) > 0 ? giftPriceBnb : '0.03');
  const factory = new ContractFactory(artifact.abi as never, artifact.bytecode, signer);
  const overrides = await bscTxOverrides(provider);
  // transferable = false (ERC-5192 Soulbound: non-transferable once minted to recipient), holderCanBurn = true
  const contract = await factory.deploy(
    artist,
    address,
    unitPrice,
    5000,
    1000,
    false,
    true,
    'https://mement.art/metadata/bsc-testnet-v1',
    overrides,
  );
  const tx = contract.deploymentTransaction();
  await contract.waitForDeployment();
  const deployedAddress = await contract.getAddress();
  return { address: deployedAddress, txHash: tx?.hash ?? '' };
}

export async function deployLoveVaultOnBscTestnet() {
  const { provider, signer } = await connectBscTestnetSigner();
  const res = await fetch('/api/testnet/artifacts?name=MementLoveVault', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load MementLoveVault artifact.');
  const artifact = await res.json() as { abi: unknown[]; bytecode: string };
  const factory = new ContractFactory(artifact.abi as never, artifact.bytecode, signer);
  const overrides = await bscTxOverrides(provider);
  const contract = await factory.deploy(0n, overrides);
  const tx = contract.deploymentTransaction();
  await contract.waitForDeployment();
  const deployedAddress = await contract.getAddress();
  return { address: deployedAddress, txHash: tx?.hash ?? '' };
}

export async function sealVaultGiftOnBscTestnet(input: {
  contractAddress: string;
  orderId: string;
  recipient: string;
  message: string;
  vaultAmountBnb?: string;
  unlockDate?: string;
  atlasFeed?: string;
  targetPriceUsd?: string;
  maxYears?: number;
  onProgress?: (progress: OnchainProgress) => void;
}): Promise<OnchainSealProof> {
  input.onProgress?.({ step: 'wallet' });
  const { provider, signer, address } = await connectBscTestnetSigner();
  const contract = new Contract(input.contractAddress, fullVaultGiftAbi, signer);
  const price: bigint = await contract.price();
  const orderBytes = id(input.orderId);
  const recipientAddr = resolveTestnetAddress(input.recipient, address);
  const safeMsg = (input.message || 'Sealed on Mement · BSC Testnet').slice(0, 280);
  const vaultWei = input.vaultAmountBnb && Number(input.vaultAmountBnb) > 0 ? parseEther(input.vaultAmountBnb) : 0n;
  const unlockSec = input.unlockDate ? Math.floor(Date.parse(input.unlockDate + 'T00:00:00Z') / 1000) : 0;
  const nowSec = Math.floor(Date.now() / 1000);
  const txOpts = await bscTxOverrides(provider, { value: price + vaultWei, gasLimit: 360_000n });

  let tx;
  if (vaultWei > 0n && input.atlasFeed && isAddress(input.atlasFeed) && input.targetPriceUsd && Number(input.targetPriceUsd) > 0) {
    const feedAddr = getAddress(input.atlasFeed);
    const feedContract = new Contract(feedAddr, ['function decimals() view returns (uint8)'], signer);
    const feedDecimals = Number(await feedContract.decimals());
    const targetScaled = parseUnits(input.targetPriceUsd, feedDecimals);
    const maxDeadline = BigInt(nowSec + (input.maxYears ?? 3) * 365 * 86400);
    tx = await contract.mintGiftWithAtlasMilestone(
      orderBytes, recipientAddr, safeMsg, vaultWei, feedAddr, targetScaled, maxDeadline, txOpts,
    );
  } else if (vaultWei > 0n && unlockSec > nowSec + 60) {
    tx = await contract.mintGiftWithNativeVaultLocked(orderBytes, recipientAddr, safeMsg, vaultWei, BigInt(unlockSec), txOpts);
  } else if (vaultWei > 0n) {
    tx = await contract.mintGiftWithNativeVault(orderBytes, recipientAddr, safeMsg, vaultWei, txOpts);
  } else {
    tx = await contract.buyGift(orderBytes, recipientAddr, safeMsg, await bscTxOverrides(provider, { value: price }));
  }
  input.onProgress?.({ step: 'confirming', txHash: tx.hash });
  const receipt = await tx.wait();
  let tokenId: string | undefined;
  for (const log of receipt?.logs ?? []) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === 'GiftPurchased') {
        tokenId = String(parsed.args.tokenId);
        break;
      }
    } catch {}
  }
  return { kind: 'vault-gift', txHash: tx.hash, contract: input.contractAddress, tokenId };
}

export async function sealLoveVaultOnBscTestnet(input: {
  contractAddress: string;
  partner: string;
  amountBnb: string;
  onProgress?: (progress: OnchainProgress) => void;
}): Promise<OnchainSealProof> {
  input.onProgress?.({ step: 'wallet' });
  const { provider, signer, address } = await connectBscTestnetSigner();
  const contract = new Contract(input.contractAddress, loveVaultAbi, signer);
  const partnerAddr = resolveTestnetAddress(input.partner, address, address);
  const createTx = await contract.createVault(partnerAddr, 0, ZeroAddress, BigInt(LOVE_COOLDOWN_SECONDS), await bscTxOverrides(provider, { gasLimit: 300_000n }));
  input.onProgress?.({ step: 'confirming', txHash: createTx.hash });
  const createReceipt = await createTx.wait();
  let agreementId: string | undefined;
  for (const log of createReceipt?.logs ?? []) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === 'AgreementCreated') {
        agreementId = String(parsed.args.agreementId);
        break;
      }
    } catch {}
  }
  if (!agreementId) throw new Error('AgreementCreated event not found.');
  let finalTxHash = createTx.hash;
  if (Number(input.amountBnb) > 0) {
    input.onProgress?.({ step: 'wallet_2', txHash: createTx.hash });
    const depTx = await contract.deposit(BigInt(agreementId), await bscTxOverrides(provider, { value: parseEther(input.amountBnb), gasLimit: 180_000n }));
    input.onProgress?.({ step: 'confirming_2', txHash: depTx.hash });
    await depTx.wait();
    finalTxHash = depTx.hash;
  }
  return { kind: 'love-vault', txHash: finalTxHash, contract: input.contractAddress, agreementId };
}

export async function burnAndRedeemOnBscTestnet(contractAddress: string, tokenId: string, expectedHolder?: string) {
  const { provider, signer, address } = await connectBscTestnetSigner(undefined, expectedHolder);
  if (expectedHolder && isAddress(expectedHolder) && address.toLowerCase() !== expectedHolder.toLowerCase()) {
    throw new Error(`WRONG_SIGNER:${address}:${getAddress(expectedHolder)}`);
  }
  const contract = new Contract(contractAddress, fullVaultGiftAbi, signer);
  const tx = await contract.burnAndRedeem(BigInt(tokenId), await bscTxOverrides(provider));
  await tx.wait();
  return tx.hash as string;
}

export async function loveVaultActionOnBscTestnet(
  contractAddress: string,
  agreementId: string,
  action: 'deposit' | 'approveMarriage' | 'approveBreakup' | 'requestBreakup' | 'withdraw',
  amountBnb?: string,
  expectedSigner?: string,
) {
  const { provider, signer, address } = await connectBscTestnetSigner(undefined, expectedSigner);
  if (expectedSigner && isAddress(expectedSigner) && address.toLowerCase() !== expectedSigner.toLowerCase()) {
    throw new Error(`WRONG_SIGNER:${address}:${getAddress(expectedSigner)}`);
  }
  const contract = new Contract(contractAddress, loveVaultAbi, signer);
  let tx;
  if (action === 'deposit') {
    tx = await contract.deposit(BigInt(agreementId), await bscTxOverrides(provider, { value: parseEther(amountBnb || '0.001'), gasLimit: 180_000n }));
  } else if (action === 'approveMarriage') {
    tx = await contract.approveMarriage(BigInt(agreementId), await bscTxOverrides(provider, { gasLimit: 220_000n }));
  } else if (action === 'approveBreakup') {
    tx = await contract.approveBreakup(BigInt(agreementId), await bscTxOverrides(provider, { gasLimit: 220_000n }));
  } else if (action === 'requestBreakup') {
    tx = await contract.requestBreakup(BigInt(agreementId), await bscTxOverrides(provider, { gasLimit: 180_000n }));
  } else {
    tx = await contract.withdraw(address, await bscTxOverrides(provider, { gasLimit: 180_000n }));
  }
  await tx.wait();
  return tx.hash as string;
}

export async function verifyRecipientNoteSignature(expectedRecipient: string, giftId: string): Promise<string> {
  const { signer, address } = await connectBscTestnetSigner(undefined, expectedRecipient);
  if (isAddress(expectedRecipient) && address.toLowerCase() !== expectedRecipient.toLowerCase()) {
    throw new Error(`WRONG_SIGNER:${address}:${getAddress(expectedRecipient)}`);
  }
  const challenge = `Mement Private Note Unlock\nGift: ${giftId}\nRecipient: ${expectedRecipient}\nTimestamp: ${new Date().toISOString()}`;
  await signer.signMessage(challenge);
  return address;
}

export function friendlyWalletError(err: unknown, zh: boolean): string {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  const code = (err as { code?: string | number })?.code;
  if (msg.startsWith('WRONG_SIGNER:')) {
    const [, current, expected] = msg.split(':');
    const shortCur = current ? `${current.slice(0, 6)}…${current.slice(-4)}` : '';
    const shortExp = expected ? `${expected.slice(0, 6)}…${expected.slice(-4)}` : '';
    return zh
      ? `当前钱包（${shortCur}）无权执行此签署，请先切换为指定钱包（${shortExp}）后再试。`
      : `Connected wallet (${shortCur}) does not match the required signer (${shortExp}). Please switch wallets and retry.`;
  }
  if (code === 'ACTION_REJECTED' || code === 4001 || /user rejected|user denied|ACTION_REJECTED/i.test(msg)) {
    return zh ? '你已取消钱包签名。如需继续上链封缄，请再次长按按钮并在钱包中点「确认」。' : 'Wallet signature was cancelled. Hold to seal again when ready.';
  }
  if (code === 'INSUFFICIENT_FUNDS' || /insufficient funds/i.test(msg)) {
    return zh ? '钱包 tBNB 测试币余额不足，请调小金额或前往水龙头领取免费 tBNB。' : 'Insufficient tBNB balance on BSC Testnet.';
  }
  if (/NotTokenHolder|0xa43d13b3/i.test(msg)) {
    return zh ? '当前连接的钱包不是该礼物 NFT 的持有人，请切换为收礼人钱包后再销毁提取。' : 'Connected wallet does not hold this gift NFT. Please switch to the recipient wallet and retry.';
  }
  if (/MilestoneNotReached/i.test(msg)) {
    return zh ? 'Atlas Oracle 链上喂价尚未达到目标里程碑价格，暂不可提前提取。' : 'Atlas Oracle feed has not reached the target milestone price yet.';
  }
  if (/VaultTimeLocked/i.test(msg)) {
    return zh ? '尚未到达链上解锁时间，暂不可提取礼金。' : 'The onchain time lock has not elapsed yet.';
  }
  if (/-32603|Transaction failed|could not coalesce/i.test(msg)) {
    return zh ? 'BSC 测试网节点临时拥堵或钱包 RPC 同步延迟，请等待 2 秒后再次长按重试。' : 'BSC Testnet RPC was briefly busy or out of sync. Please wait 2 seconds and try again.';
  }
  return msg.length > 140 ? msg.slice(0, 140) + '…' : msg;
}

export function appendOnchainParams(sharePath: string, proof?: OnchainSealProof): string {
  if (!proof) return sharePath;
  const [base, existing] = sharePath.split('?');
  const params = new URLSearchParams(existing ?? '');
  params.set('tx', proof.txHash);
  params.set('contract', proof.contract);
  params.set('kind', proof.kind);
  if (proof.tokenId) params.set('tokenId', proof.tokenId);
  if (proof.agreementId) params.set('agreementId', proof.agreementId);
  return `${base}?${params.toString()}`;
}
