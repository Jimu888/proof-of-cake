'use client';

import { useEffect, useState } from 'react';
import { formatEther } from 'ethers';
import Link from 'next/link';
import RoomHeader from '../../../components/room-header';
import { useLanguage } from '../../../lib/i18n';
import {
  connectBscTestnetSigner,
  deployLoveVaultOnBscTestnet,
  deployVaultGiftOnBscTestnet,
  fetchTestnetDeployments,
  type TestnetDeployments,
} from '../../../lib/bsc-testnet-client';
import { testnet } from '../../../lib/testnet';

export default function TestnetDeployPage() {
  const { t } = useLanguage();
  const [account, setAccount] = useState<string>('');
  const [balance, setBalance] = useState<string>('');
  const [artist, setArtist] = useState('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  const [giftPrice, setGiftPrice] = useState('0.03');
  const [atlasFeedInput, setAtlasFeedInput] = useState('');
  const [deployments, setDeployments] = useState<TestnetDeployments>({});
  const [busy, setBusy] = useState<'connect' | 'vault' | 'love' | 'atlas' | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchTestnetDeployments().then(d => {
      setDeployments(d);
      if (d.atlasFeedBnb) setAtlasFeedInput(d.atlasFeedBnb);
    });
  }, []);

  async function handleConnect() {
    setBusy('connect');
    setError('');
    setStatus('');
    try {
      const { provider, address } = await connectBscTestnetSigner();
      const bal = await provider.getBalance(address);
      setAccount(address);
      setBalance(Number(formatEther(bal)).toFixed(4));
      setStatus(t('Connected to BNB Smart Chain Testnet (Chain ID 97).', '已连接 BNB Smart Chain Testnet（链 ID 97）。'));
    } catch (e) {
      setError((e as Error).message || t('Wallet connection failed.', '钱包连接失败。'));
    } finally {
      setBusy(null);
    }
  }

  async function persist(patch: TestnetDeployments) {
    const res = await fetch('/api/testnet/deployments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save deployment.');
    setDeployments(prev => ({ ...prev, ...patch }));
  }

  async function handleDeployVaultGift() {
    setBusy('vault');
    setError('');
    setStatus(t('Waiting for wallet signature to deploy MementVaultGift…', '请在钱包中确认部署 MementVaultGift 合约…'));
    try {
      const result = await deployVaultGiftOnBscTestnet(artist, giftPrice);
      await persist({ vaultGift: result.address, vaultGiftTx: result.txHash });
      setStatus(t(`MementVaultGift deployed at ${result.address}`, `MementVaultGift 已部署至 ${result.address}`));
    } catch (e) {
      setError((e as Error).message || t('Deployment failed.', '部署失败。'));
    } finally {
      setBusy(null);
    }
  }

  async function handleDeployLoveVault() {
    setBusy('love');
    setError('');
    setStatus(t('Waiting for wallet signature to deploy MementLoveVault…', '请在钱包中确认部署 MementLoveVault 合约…'));
    try {
      const result = await deployLoveVaultOnBscTestnet();
      await persist({ loveVault: result.address, loveVaultTx: result.txHash });
      setStatus(t(`MementLoveVault deployed at ${result.address}`, `MementLoveVault 已部署至 ${result.address}`));
    } catch (e) {
      setError((e as Error).message || t('Deployment failed.', '部署失败。'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="platform-page room-page wallet-page">
      <RoomHeader />
      <main className="creator-application-layout" style={{ maxWidth: 820, marginInline: 'auto', display: 'grid', gap: 28 }}>
        <section className="creator-application-intro" style={{ display: 'grid', gap: 12 }}>
          <p className="ritual-eyebrow">BNB SMART CHAIN TESTNET · CHAIN ID 97</p>
          <h1>{t('One-Click Contract Deployment', 'BSC 测试网一键合约部署台')}</h1>
          <p className="ritual-hint">
            {t(
              'Deploy MementVaultGift and MementLoveVault directly from your browser wallet. No private keys are ever requested or stored. Once deployed, the 5-step gifting desk and receive pages automatically use these live BSC Testnet contracts.',
              '通过你的浏览器钱包直接将两份合约部署至 BSC Testnet 97，全程绝不接触或保存私钥。部署完成后，全站 5 步赠礼台与拆礼页将自动接通这两份真实链上合约。'
            )}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 4 }}>
            <button type="button" className="ritual-cta" disabled={busy !== null} onClick={handleConnect}>
              {busy === 'connect' ? t('Connecting…', '连接中…') : account ? `${account.slice(0, 6)}…${account.slice(-4)} · ${balance} tBNB` : t('Connect Wallet (BSC Testnet 97)', '连接钱包（切至 BSC Testnet 97）')}
            </button>
            <a className="boutique-link" href="https://www.bnbchain.org/en/testnet-faucet" target="_blank" rel="noreferrer">
              {t('Get free tBNB from Faucet ↗', '免费领取 tBNB 测试币 ↗')}
            </a>
          </div>
          {status && <p className="ritual-hint" style={{ color: '#F2743A' }}>{status}</p>}
          {error && <p className="checkout-error" role="alert">{error}</p>}
        </section>

        <section style={{ display: 'grid', gap: 18 }}>
          <div style={{ padding: 22, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(16,24,33,0.72)', display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <p className="ritual-eyebrow" style={{ margin: 0 }}>01 · SOULBOUND GIFT NFT (ERC-5192) + TIME CAPSULE + BURN-TO-REDEEM</p>
                <h2 style={{ margin: '6px 0 0', fontSize: 20 }}>MementVaultGift.sol</h2>
              </div>
              <span style={{ fontSize: 12, color: deployments.vaultGift ? '#6EE7B7' : '#A0A1A3' }}>
                {deployments.vaultGift ? t('● Live on BSC 97', '● 已部署至链 97') : t('Not deployed', '待部署')}
              </span>
            </div>
            <p className="ritual-hint" style={{ margin: 0 }}>
              {t('Powers Gift Someone & To Future Me: immediately mints a non-transferable ERC-5192 Soulbound NFT directly to the recipient wallet upon payment, locks tBNB with optional UTC time lock or Atlas Oracle milestone, and enforces burnAndRedeem().', '驱动「赠予他人」与「致未来的自己」：支付后立即铸造不可转让（ERC-5192 Soulbound）礼物 NFT 直达收礼人钱包，封入 tBNB、时间锁或 Atlas Oracle 币价里程碑，并在拆礼页执行销毁赎回。')}
            </p>
            <label style={{ display: 'grid', gap: 6, fontSize: 12, color: '#A0A1A3' }}>
              <span>{t('Artist settlement address (must differ from deployer wallet)', '艺术家分成地址（需与当前部署钱包不同）')}</span>
              <input value={artist} onChange={e => setArtist(e.target.value)} style={{ background: 'transparent', border: 0, borderBottom: '1px solid rgba(255,255,255,0.2)', color: '#F4F6F8', padding: '8px 0', fontFamily: 'monospace' }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 12, color: '#A0A1A3' }}>
              <span>{t('Gift sale price on BSC Testnet (tBNB · split 50% artist / 50% platform; 0% fee on enclosed reserve)', '测试网礼物售价（tBNB · 创作者与平台 50/50 分成，内封礼金 0% 手续费）')}</span>
              <input value={giftPrice} onChange={e => setGiftPrice(e.target.value)} inputMode="decimal" style={{ background: 'transparent', border: 0, borderBottom: '1px solid rgba(255,255,255,0.2)', color: '#F4F6F8', padding: '8px 0', fontFamily: 'monospace', maxWidth: 180 }} />
            </label>
            {deployments.vaultGift && (
              <div style={{ fontSize: 12, fontFamily: 'monospace', display: 'grid', gap: 6 }}>
                <span>Contract: <a href={`${testnet.explorer}/address/${deployments.vaultGift}`} target="_blank" rel="noreferrer" style={{ color: '#F2743A' }}>{deployments.vaultGift} ↗</a></span>
                {deployments.vaultGiftTx && <span>Deploy Tx: <a href={`${testnet.explorer}/tx/${deployments.vaultGiftTx}`} target="_blank" rel="noreferrer" style={{ color: '#CBD5E1' }}>{deployments.vaultGiftTx} ↗</a></span>}
              </div>
            )}
            <div>
              <button type="button" className="ritual-cta" disabled={busy !== null} onClick={handleDeployVaultGift}>
                {busy === 'vault' ? t('Deploying MementVaultGift…', '部署中…') : deployments.vaultGift ? t('Redeploy MementVaultGift', '重新部署 MementVaultGift') : t('Deploy MementVaultGift to BSC 97 →', '部署 MementVaultGift 到 BSC 测试网 →')}
              </button>
            </div>
          </div>

          <div style={{ padding: 22, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(16,24,33,0.72)', display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <p className="ritual-eyebrow" style={{ margin: 0 }}>02 · SHARED PROMISE + CO-DEPOSIT + 30-DAY COOLING-OFF</p>
                <h2 style={{ margin: '6px 0 0', fontSize: 20 }}>MementLoveVault.sol</h2>
              </div>
              <span style={{ fontSize: 12, color: deployments.loveVault ? '#6EE7B7' : '#A0A1A3' }}>
                {deployments.loveVault ? t('● Live on BSC 97', '● 已部署至链 97') : t('Not deployed', '待部署')}
              </span>
            </div>
            <p className="ritual-hint" style={{ margin: 0 }}>
              {t('Powers Shared Promise: creates two-party onchain agreements, accepts deposits from both partners, 2-of-2 settlement, and 30-day unilateral cooling-off refund.', '驱动「双人约定」：链上创建双人约定、双方存入 tBNB、2/2 共同启封或提前解锁、30 天单方冷静期原路退回。')}
            </p>
            {deployments.loveVault && (
              <div style={{ fontSize: 12, fontFamily: 'monospace', display: 'grid', gap: 6 }}>
                <span>Contract: <a href={`${testnet.explorer}/address/${deployments.loveVault}`} target="_blank" rel="noreferrer" style={{ color: '#F2743A' }}>{deployments.loveVault} ↗</a></span>
                {deployments.loveVaultTx && <span>Deploy Tx: <a href={`${testnet.explorer}/tx/${deployments.loveVaultTx}`} target="_blank" rel="noreferrer" style={{ color: '#CBD5E1' }}>{deployments.loveVaultTx} ↗</a></span>}
              </div>
            )}
            <div>
              <button type="button" className="ritual-cta" disabled={busy !== null} onClick={handleDeployLoveVault}>
                {busy === 'love' ? t('Deploying MementLoveVault…', '部署中…') : deployments.loveVault ? t('Redeploy MementLoveVault', '重新部署 MementLoveVault') : t('Deploy MementLoveVault to BSC 97 →', '部署 MementLoveVault 到 BSC 测试网 →')}
              </button>
            </div>
          </div>

          <div style={{ padding: 22, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(16,24,33,0.72)', display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <p className="ritual-eyebrow" style={{ margin: 0 }}>03 · SPONSOR ORACLE · ATLAS ORACLE PUSH SINGLE-FEED</p>
                <h2 style={{ margin: '6px 0 0', fontSize: 20 }}>Atlas Oracle (IAtlasSingleFeed)</h2>
              </div>
              <span style={{ fontSize: 12, color: deployments.atlasFeedBnb ? '#6EE7B7' : '#A0A1A3' }}>
                {deployments.atlasFeedBnb ? t('● Feed bound on BSC 97', '● 已绑定链 97 喂价') : t('Optional · Fallback active', '待绑定（当前走参考价兜底）')}
              </span>
            </div>
            <p className="ritual-hint" style={{ margin: 0 }}>
              {t('MementVaultGift calls IAtlasSingleFeed.latestRoundData() directly onchain to enforce Price Milestone unlocks. Paste an Atlas Oracle BSC Testnet Push Feed contract address from atlasoracle.io/feeds.', 'MementVaultGift 已在合约内直接集成 IAtlasSingleFeed.latestRoundData() 校验币价里程碑解锁。填入来自 atlasoracle.io/feeds 的 BSC Testnet 喂价合约地址即可启用链上预言机解锁。')}{' '}
              <a href="https://atlasoracle.io/feeds" target="_blank" rel="noreferrer" style={{ color: '#F2743A' }}>atlasoracle.io/feeds ↗</a>
            </p>
            <label style={{ display: 'grid', gap: 6, fontSize: 12, color: '#A0A1A3' }}>
              <span>{t('Atlas Oracle BNB/USD Push Feed Address (BSC Testnet 97)', 'Atlas Oracle BNB/USD 喂价合约地址（BSC 测试网 97）')}</span>
              <input value={atlasFeedInput} onChange={e => setAtlasFeedInput(e.target.value)} placeholder="0x..." style={{ background: 'transparent', border: 0, borderBottom: '1px solid rgba(255,255,255,0.2)', color: '#F4F6F8', padding: '8px 0', fontFamily: 'monospace' }} />
            </label>
            <div>
              <button type="button" className="ritual-cta" disabled={busy !== null || !atlasFeedInput.trim()} onClick={async () => {
                setBusy('atlas');
                setError('');
                try {
                  await persist({ atlasFeedBnb: atlasFeedInput.trim() });
                  setStatus(t(`Atlas Oracle feed bound: ${atlasFeedInput.trim()}`, `已验证并绑定 Atlas Oracle 喂价合约：${atlasFeedInput.trim()}`));
                } catch (e) {
                  setError((e as Error).message || t('Invalid Atlas feed address.', '无效的 Atlas 喂价合约地址。'));
                } finally {
                  setBusy(null);
                }
              }}>
                {busy === 'atlas' ? t('Verifying bytecode on BSC 97…', '正在校验链 97 合约字节码…') : t('Verify & Bind Atlas Oracle Feed', '校验并绑定 Atlas Oracle 喂价合约')}
              </button>
            </div>
          </div>

          {(deployments.vaultGift || deployments.loveVault) && (
            <div style={{ padding: 18, border: '1px solid rgba(242,116,58,0.3)', background: 'rgba(242,116,58,0.06)', display: 'grid', gap: 10 }}>
              <strong style={{ fontSize: 13 }}>{t('Live Contracts Active Across Mement', '已自动生效 · 环境变量备份（用于 Cloudflare 公网部署）')}</strong>
              <pre style={{ margin: 0, fontSize: 11, overflowX: 'auto', color: '#E2E8F0' }}>{[
                deployments.vaultGift ? `NEXT_PUBLIC_MEMENT_VAULT_GIFT_CONTRACT=${deployments.vaultGift}` : '',
                deployments.vaultGift ? `MEMENT_TESTNET_CONTRACT=${deployments.vaultGift}` : '',
                deployments.loveVault ? `NEXT_PUBLIC_MEMENT_LOVE_VAULT_CONTRACT=${deployments.loveVault}` : '',
                deployments.loveVault ? `MEMENT_LOVE_VAULT_CONTRACT=${deployments.loveVault}` : '',
              ].filter(Boolean).join('\n')}</pre>
              <Link className="boutique-link" href="/">{t('← Return to Mement Vitrine & test live gifting', '← 返回 Mement 橱窗体验真实链上赠礼')}</Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
