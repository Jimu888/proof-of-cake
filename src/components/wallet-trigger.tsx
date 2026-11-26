'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../lib/i18n';
import { auth, featuredWallets, selectTestnet, useInjectedWallets, type Provider } from '../lib/injected-wallet';
import { testnet } from '../lib/testnet';

export default function WalletTrigger({ className = '' }: { className?: string }) {
  const { t } = useLanguage();
  const wallets = useInjectedWallets();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [connected, setConnected] = useState(false);
  const [pendingPromise, setPendingPromise] = useState<{ title: string; from: string; sharePath: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'declined' | 'signin' | 'logout'>();
  const operation = useRef(0);
  const pending = useRef(false);

  useEffect(() => {
    setMounted(true);
    const controller = new AbortController();
    const initial = operation.current;
    fetch('/api/wallet', { cache: 'no-store', signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(session => {
        if (!controller.signal.aborted && initial === operation.current) setAddress(session?.address ?? '');
      }).catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!open || !address) return;
    let active = true;
    let request = 0;
    const refresh = async () => {
      const current = ++request;
      const matches = await Promise.all(wallets.map(async ({ provider }) => {
        try {
          const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
          return accounts?.[0]?.toLowerCase() === address.toLowerCase() &&
            await provider.request({ method: 'eth_chainId' }) === testnet.chainId;
        } catch { return false; }
      }));
      if (active && current === request) setConnected(matches.some(Boolean));
    };
    const events = ['accountsChanged', 'chainChanged', 'disconnect'];
    for (const { provider } of wallets) for (const event of events) provider.on?.(event, refresh);
    void refresh();
    return () => {
      active = false;
      for (const { provider } of wallets) for (const event of events) provider.removeListener?.(event, refresh);
    };
  }, [address, open, wallets]);

  async function changeSession(provider?: Provider) {
    if (pending.current) return;
    pending.current = true;
    operation.current++;
    setBusy(true);
    setError(undefined);
    try {
      if (!provider) {
        await auth({ action: 'logout' });
        setAddress('');
        setConnected(false);
        return;
      }
      const [account] = await provider.request({ method: 'eth_requestAccounts' }) as string[];
      if (!account) throw new Error();
      await selectTestnet(provider, testnet.rpc, 'BSC Testnet is required');
      const challenge = await auth({ action: 'challenge', address: account });
      const hex = '0x' + Array.from(new TextEncoder().encode(challenge.message), byte => byte.toString(16).padStart(2, '0')).join('');
      const signature = await provider.request({ method: 'personal_sign', params: [hex, account] });
      const [selected] = await provider.request({ method: 'eth_accounts' }) as string[];
      if (selected?.toLowerCase() !== account.toLowerCase() ||
        await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) throw new Error();
      const session = await auth({ action: 'verify', nonce: challenge.nonce, signature });
      setConnected(true);
      setAddress(session.address);
    } catch (failure) {
      setError(!provider ? 'logout' : (failure as { code?: number } | null)?.code === 4001 ? 'declined' : 'signin');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!address) { setPendingPromise(null); return; }
    try {
      const raw = JSON.parse(localStorage.getItem('mement-pending-promises') || '[]') as { recipient: string; title: string; from: string; sharePath: string }[];
      const match = raw.find(item => item.recipient.toLowerCase() === address.toLowerCase());
      setPendingPromise(match ? { title: match.title, from: match.from, sharePath: match.sharePath } : null);
    } catch { setPendingPromise(null); }
  }, [address, open]);

  const label = t('Wallet', '钱包');
  return <>
    <button ref={trigger} type="button" className={`wallet-trigger ${className}`} aria-haspopup="dialog"
      aria-expanded={open} aria-controls={mounted ? dialogId : undefined}
      aria-label={address ? `${label} · ${address}` : label}
      onClick={() => { dialog.current?.showModal(); setOpen(true); }}>
      {address ? <><span className="wallet-status-dot" aria-hidden="true"/>{address.slice(0, 6)}…{address.slice(-4)}</> : label}
    </button>
    {mounted && createPortal(<dialog ref={dialog} id={dialogId} className="wallet-modal" role="dialog" aria-modal="true"
      aria-labelledby={dialogId + '-title'}
      onClose={() => { setOpen(false); setConnected(false); trigger.current?.focus(); }}
      onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="wallet-modal-content">
        <header>
          <h2 id={dialogId + '-title'}>{label}</h2>
          <button type="button" autoFocus className="room-button" aria-label={t('Close wallet', '关闭钱包')} onClick={() => dialog.current?.close()}>×</button>
        </header>
        <p className="wallet-modal-network" role="status"><strong>{t('BSC Testnet · Chain 97', 'BSC 测试网 · 链 97')}</strong>
          <span>{connected ? t('Connected', '已连接') : t('Not connected', '未连接')}</span>
        </p>
        {address ? <>
          <p>{t('Signed in', '已登录')}<br/><code>{address}</code></p>
          {pendingPromise && <div className="wallet-pending-promise" role="status">
            <span>{t(`Pending Shared Promise from ${pendingPromise.from}`, `你有一份来自 ${pendingPromise.from} 的双人约定待处理`)}</span>
            <Link className="boutique-link" href={pendingPromise.sharePath} onClick={() => dialog.current?.close()}>
              {t(`Review ${pendingPromise.title} ↗`, `查看《${pendingPromise.title}》 ↗`)}
            </Link>
          </div>}
          <button type="button" className="room-button" disabled={busy} onClick={() => changeSession()}>{t('Sign out', '退出登录')}</button>
        </> : <>
          <p>{t('Connect a wallet and sign a message to verify your address.', '连接钱包并签名以验证你的地址。')}</p>
          <div className="wallet-modal-options">
            {wallets.map(wallet => {
              const brand = featuredWallets.find(item => item.id === wallet.brand);
              return <button type="button" className="room-button room-button-primary" key={wallet.id} disabled={busy}
                onClick={() => changeSession(wallet.provider)}>{brand ? t(brand.name, brand.zh) : wallet.name || t('Browser wallet', '浏览器钱包')}<span aria-hidden="true">↗</span></button>;
            })}
          </div>
          {!wallets.length && <p>{t('No browser wallet detected. Install or enable a wallet extension to connect.', '未检测到浏览器钱包。请安装或启用钱包扩展后连接。')}</p>}
        </>}
        {busy && <p role="status">{address ? t('Signing out…', '正在退出…') : t('Check your wallet for the connection or signature request.', '请在钱包中确认连接或签名请求。')}</p>}
        {error && <p role="alert">{error === 'declined' ? t('You declined the wallet request.', '你已取消钱包请求。') :
          error === 'logout' ? t('Could not sign out. Try again.', '退出登录失败，请重试。') :
          t('Sign-in failed. Check your wallet account and network, then try again.', '登录失败。请检查钱包账户和网络后重试。')}</p>}
        <footer><Link href="/wallet">{t('Full testnet & gifting panel ↗', '打开完整钱包与测试网面板 ↗')}</Link></footer>
      </div>
    </dialog>, document.body)}
  </>;
}
