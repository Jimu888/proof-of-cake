'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { formatEther } from 'ethers';
import TestnetIssuance from './testnet-issuance';
import { testnet } from '../lib/testnet';

type Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, callback: () => void): void;
  removeListener?(event: string, callback: () => void): void;
  disconnect?(): Promise<void>;
};
const featuredWallets = [
  { id: 'okx', name: 'OKX 钱包', domains: ['com.okex.wallet', 'com.okx.wallet'] },
  { id: 'binance', name: '币安钱包', domains: ['com.binance.wallet'] },
  { id: 'metamask', name: 'MetaMask', domains: ['io.metamask'] },
] as const;
type WalletBrand = typeof featuredWallets[number]['id'];
type InjectedProvider = Provider & {
  providers?: InjectedProvider[];
  isMetaMask?: boolean;
  isOKExWallet?: boolean;
  isOkxWallet?: boolean;
  isBinance?: boolean;
};
type WalletWindow = Window & {
  ethereum?: InjectedProvider;
  okxwallet?: InjectedProvider & { ethereum?: InjectedProvider };
  binancew3w?: InjectedProvider & { ethereum?: InjectedProvider };
  BinanceChain?: InjectedProvider;
};
type WalletOption = { id: string; name: string; provider: Provider; brand?: WalletBrand; announced?: boolean };
type WalletAnnouncement = CustomEvent<{ info: { uuid: string; name: string; rdns?: string }; provider: Provider }>;

function injectedWallets(site: WalletWindow): WalletOption[] {
  const options: WalletOption[] = [];
  function add(provider: InjectedProvider | undefined, brand?: WalletBrand) {
    if (typeof provider?.request !== 'function' || options.some(wallet => wallet.provider === provider)) return;
    options.push({
      id: 'injected-' + options.length,
      name: featuredWallets.find(wallet => wallet.id === brand)?.name ?? '浏览器钱包',
      provider, brand,
    });
  }
  add(site.okxwallet?.ethereum ?? site.okxwallet, 'okx');
  add(site.binancew3w?.ethereum ?? site.binancew3w, 'binance');
  add(site.BinanceChain, 'binance');
  for (const provider of site.ethereum?.providers ?? (site.ethereum ? [site.ethereum] : [])) {
    const brand = provider.isOKExWallet || provider.isOkxWallet ? 'okx'
      : provider.isBinance ? 'binance' : provider.isMetaMask ? 'metamask' : undefined;
    add(provider, brand);
  }
  return options;
}

async function auth(input: object) {
  const response = await fetch('/api/wallet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

async function selectTestnet(provider: Provider, rpc: string) {
  if (await provider.request({ method: 'eth_chainId' }) === testnet.chainId) return;
  try { await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: testnet.chainId }] }); }
  catch (error) {
    if (Number((error as { code?: number }).code) !== 4902) throw error;
    await provider.request({ method: 'wallet_addEthereumChain', params: [{
      chainId: testnet.chainId, chainName: testnet.name, nativeCurrency: testnet.currency,
      rpcUrls: [rpc], blockExplorerUrls: [testnet.explorer],
    }] });
    if (await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: testnet.chainId }] });
    }
  }
  if (await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) throw new Error('请在钱包中切换到 BNB Smart Chain 测试网。');
}

export default function WalletLogin({ projectId, sale, issue, artworkRequested, rpc = testnet.rpc }: {
  projectId: string; sale?: { id: string; title: string; contract: string; price: string };
  artworkRequested?: boolean; issue?: { id: string; title: string; price: string }; rpc?: string;
}) {
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [address, setAddress] = useState('');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [pairing, setPairing] = useState<{ uri: string; qr: string }>();
  const [network, setNetwork] = useState<{ block: number; contract: string | null; price: string | null }>();
  const purchase = sale ?? (artworkRequested ? undefined : network);
  const purchaseKey = address && purchase?.contract ? 'mement-test-gift:' + address.toLowerCase() + ':' + purchase.contract.toLowerCase() : '';
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('生日快乐！');
  const [txHash, setTxHash] = useState('');
  const [reverted, setReverted] = useState(false);
  const [reviewAddress, setReviewAddress] = useState('');
  const [confirmedGift, setConfirmedGift] = useState<{ tokenId: string; sharePath: string }>();
  const [connectorReady, setConnectorReady] = useState(false);
  const active = useRef<Provider | null>(null);
  const operation = useRef(0);
  const releaseListeners = useRef<(() => void) | undefined>(undefined);
  const submittingGift = useRef(false);
  const pendingOrder = useRef<{ draft: string; id: string } | undefined>(undefined);

  useEffect(() => {
    const add = (event: Event) => {
      const { info, provider } = (event as WalletAnnouncement).detail ?? {};
      if (typeof info?.uuid !== 'string' || typeof info.name !== 'string' || typeof provider?.request !== 'function') return;
      const rdns = typeof info.rdns === 'string' ? info.rdns.toLowerCase() : '';
      const brand = featuredWallets.find(wallet => wallet.domains.some(domain => domain === rdns))?.id;
      setWallets(current => {
        const known = current.find(item => item.provider === provider);
        const option = { id: info.uuid, name: info.name, provider, brand: rdns ? brand : known?.brand, announced: true };
        return [...current.filter(item => item.provider !== provider && item.id !== info.uuid), option];
      });
    };
    const scan = () => setWallets(current => {
      const discovered = injectedWallets(window as WalletWindow);
      return [...current.filter(item => item.announced), ...discovered.filter(wallet =>
        !current.some(item => item.announced && item.provider === wallet.provider))];
    });
    window.addEventListener('eip6963:announceProvider', add);
    window.addEventListener('ethereum#initialized', scan);
    scan();
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    const timer = setTimeout(scan, 600);
    const initialOperation = operation.current;
    fetch('/api/wallet').then(response => response.json()).then(data => {
      if (operation.current === initialOperation) setAddress(data.address ?? '');
    }).catch(() => {});
    fetch('/api/testnet').then(response => response.ok ? response.json() : null).then(data => { if (data) setNetwork(data); }).catch(() => {});
    return () => {
      clearTimeout(timer);
      window.removeEventListener('eip6963:announceProvider', add);
      window.removeEventListener('ethereum#initialized', scan);
      releaseListeners.current?.();
      operation.current++;
    };
  }, []);

  async function logout() {
    operation.current++;
    const provider = active.current;
    releaseListeners.current?.();
    releaseListeners.current = undefined;
    active.current = null;
    setConnectorReady(false);
    setAddress('');
    setPairing(undefined);
    setProgress('');
    setTxHash('');
    setReverted(false);
    setReviewAddress('');
    setConfirmedGift(undefined);
    pendingOrder.current = undefined;
    try { await auth({ action: 'logout' }); } catch { setError('退出请求未送达，请重试。'); }
    try { await provider?.disconnect?.(); } catch { /* Site session is independent of the connector. */ }
  }

  async function connect(provider?: Provider) {
    const current = ++operation.current;
    setError('');
    setProgress('正在连接钱包…');
    setPairing(undefined);
    try {
      if (!provider) {
        const [{ EthereumProvider }, QRCode] = await Promise.all([import('@walletconnect/ethereum-provider'), import('qrcode')]);
        const mobile = await EthereumProvider.init({
          projectId, optionalChains: [testnet.id], showQrModal: false, rpcMap: { [testnet.id]: rpc },
          optionalMethods: ['personal_sign', 'eth_sendTransaction', 'wallet_switchEthereumChain', 'eth_call'],
          optionalEvents: ['accountsChanged', 'chainChanged'],
          metadata: { name: 'Mement', description: 'Mement testnet', url: window.location.origin, icons: [] },
        });
        const showPairing = async (uri: string) => {
          const qr = await QRCode.toDataURL(uri, { width: 260, margin: 2 });
          if (operation.current === current) setPairing({ uri, qr });
        };
        mobile.on('display_uri', showPairing);
        try { if (!mobile.session) await mobile.connect(); }
        finally { mobile.removeListener('display_uri', showPairing); }
        provider = mobile as unknown as Provider;
      }
      if (operation.current !== current) return;
      setPairing(undefined);
      const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
      if (!accounts?.[0]) throw new Error('钱包未提供账户。');
      await selectTestnet(provider, rpc);
      const account = accounts[0];
      setProgress('请在钱包中签名登录。');
      const challenge = await auth({ action: 'challenge', address: account });
      const bytes = new TextEncoder().encode(challenge.message);
      const hex = '0x' + Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
      const signature = await provider.request({ method: 'personal_sign', params: [hex, account] });
      if (operation.current !== current) return;
      const selected = await provider.request({ method: 'eth_accounts' }) as string[];
      if (selected[0]?.toLowerCase() !== account.toLowerCase() || await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) throw new Error('钱包账户或网络已变化，请重新登录。');
      const session = await auth({ action: 'verify', nonce: challenge.nonce, signature });
      if (operation.current !== current) return;
      active.current = provider;
      setConnectorReady(true);
      setAddress(session.address);
      const changed = () => {
        if (active.current !== provider) return;
        void logout();
      };
      provider.on?.('accountsChanged', changed);
      provider.on?.('chainChanged', changed);
      provider.on?.('disconnect', changed);
      releaseListeners.current = () => {
        provider?.removeListener?.('accountsChanged', changed);
        provider?.removeListener?.('chainChanged', changed);
        provider?.removeListener?.('disconnect', changed);
      };
    } catch (failure) {
      if (operation.current === current) setError(Number((failure as { code?: number }).code) === 4001 ? '你已取消钱包请求。' : failure instanceof Error ? failure.message : '钱包连接失败。');
    } finally {
      if (operation.current === current) { setProgress(''); setPairing(undefined); }
    }
  }

  useEffect(() => {
    if (!purchaseKey) return;
    try {
      const previous = sessionStorage.getItem(purchaseKey);
      if (previous && /^0x[0-9a-f]{64}$/i.test(previous)) setTxHash(previous);
    } catch { /* Browser storage may be unavailable. */ }
  }, [purchaseKey]);

  function clearGift() {
    try {
      sessionStorage.removeItem(purchaseKey);
      sessionStorage.removeItem(purchaseKey + ':order');
    } catch { /* Browser storage may be unavailable. */ }
    setTxHash('');
    setConfirmedGift(undefined);
    setReviewAddress('');
    setReverted(false);
    setError('');
    pendingOrder.current = undefined;
  }

  async function reviewGift() {
    setError('');
    try {
      const { getAddress, ZeroAddress } = await import('ethers');
      const to = getAddress(recipient.trim());
      if (to === ZeroAddress) throw new Error('收礼地址不能为零地址。');
      if (new TextEncoder().encode(message).length > 840) throw new Error('祝福内容过长。');
      setReviewAddress(to);
    } catch (failure) { setError(failure instanceof Error && failure.message.includes('收礼') ? failure.message : '请核对收礼地址及祝福长度。'); }
  }

  async function deploy(data: string) {
    const provider = active.current;
    if (!provider || !address) throw new Error('请先连接测试网钱包。');
    const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
    if (accounts[0]?.toLowerCase() !== address.toLowerCase() || await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) throw new Error('请重新连接测试网钱包。');
    const hash = await provider.request({ method: 'eth_sendTransaction', params: [{ from: address, value: '0x0', data }] });
    if (typeof hash !== 'string' || !/^0x[0-9a-f]{64}$/i.test(hash)) throw new Error('钱包未返回有效部署交易哈希。');
    return hash;
  }

  async function sendGift() {
    const provider = active.current;
    if (!provider || !purchase?.contract || progress || submittingGift.current) return;
    submittingGift.current = true;
    const current = operation.current;
    setError('');
    setProgress('正在核对测试赠礼…');
    try {
      const { getAddress, ZeroAddress, Interface, toBeHex, hexlify, randomBytes, id, isHexString } = await import('ethers');
      const { giftAbi } = await import('../lib/test-gift');
      const to = getAddress(reviewAddress);
      if (to === ZeroAddress) throw new Error('收礼地址不能为零地址。');
      const session = await fetch('/api/wallet').then(response => response.json());
      if (session.address !== address) throw new Error('登录已失效，请重新登录。');
      const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
      if (accounts[0]?.toLowerCase() !== address.toLowerCase() || await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) throw new Error('请重新连接测试网钱包。');
      const draft = id(JSON.stringify([address, to, message, purchase.contract]));
      if (pendingOrder.current?.draft !== draft) {
        let saved: { draft?: string; id?: string } | null = null;
        try { saved = JSON.parse(sessionStorage.getItem(purchaseKey + ':order') ?? 'null'); } catch { /* Browser storage may be unavailable. */ }
        pendingOrder.current = { draft, id: saved?.draft === draft && isHexString(saved.id, 32) ? saved.id! : hexlify(randomBytes(32)) };
      }
      try { sessionStorage.setItem(purchaseKey + ':order', JSON.stringify(pendingOrder.current)); } catch { /* Keep the in-memory order identifier. */ }
      const data = new Interface(giftAbi).encodeFunctionData('buyGift', [pendingOrder.current.id, to, message]);
      if (operation.current !== current) return;
      const transaction = { from: address, to: purchase.contract, value: toBeHex(BigInt(purchase.price!)), data };
      try {
        const simulation = await provider.request({ method: 'eth_call', params: [transaction, 'latest'] });
        if (typeof simulation !== 'string' || !/^0x[0-9a-f]{64}$/i.test(simulation) || BigInt(simulation) === 0n) throw new Error('No mint result');
      }
      catch { throw new Error('交易预检未通过。请核对测试币余额、作品库存和收礼地址。'); }
      if (operation.current !== current || await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) return;
      setProgress('请在钱包中核对并确认测试网交易。');
      const hash = await provider.request({ method: 'eth_sendTransaction', params: [transaction] }) as string;
      if (!/^0x[0-9a-f]{64}$/i.test(hash)) throw new Error('钱包未返回有效交易哈希。');
      try { sessionStorage.setItem(purchaseKey, hash); } catch { /* Keep the hash visible if browser storage is unavailable. */ }
      if (operation.current !== current) return;
      setTxHash(hash);
      setProgress('正在核对链上赠礼记录…');
      await verifyGift(hash);
    } catch (failure) {
      if (operation.current === current) setError(failure instanceof Error ? failure.message : '测试赠礼未完成。');
    } finally {
      submittingGift.current = false;
      if (operation.current === current) setProgress('');
    }
  }

  async function verifyGift(hash: string) {
    const current = operation.current;
    const response = await fetch('/api/testnet?transaction=' + encodeURIComponent(hash));
    const data = await response.json();
    if (operation.current !== current) return;
    if (data.state === 'reverted') setReverted(true);
    if (!response.ok) throw new Error(data.error || '暂时无法核对交易。');
    if (!data.tokenId) {
      setError('交易尚未获得确认，可以稍后重新核对。');
      return;
    }
    if (data.sender?.toLowerCase() !== address.toLowerCase() ||
        data.contract?.toLowerCase() !== purchase?.contract?.toLowerCase()) throw new Error('交易与当前钱包或作品不一致。');
    setError('');
    setConfirmedGift({ tokenId: data.tokenId, sharePath: data.sharePath });
  }

  return <div className="platform-page">
    <header className="platform-header"><Link className="brand" href="/">✦ Mement</Link><Link className="text-link" href="/">返回精选作品 ↗</Link></header>
    <main className="creator-application-layout">
      <section className="creator-application-intro">
        <p className="eyebrow">BNB SMART CHAIN TESTNET</p>
        <h1>钱包登录</h1>
        <p>连接钱包并签名，验证你对地址的控制权。签名登录无需支付费用。</p>
        <p className="checkout-note">{network ? `测试网已连接 · 区块 ${network.block.toLocaleString('zh-CN')}` : '测试网节点暂未连接'}</p>
      </section>
      <section className="creator-application-panel wallet-panel">
        {address ? <><h2>已登录</h2><p className="wallet-address">{address}</p><button className="button outline" onClick={logout}>退出登录</button></> : <h2>选择钱包</h2>}
        {!connectorReady && <>
          {featuredWallets.map(wallet => {
            const detected = wallets.find(item => item.announced && item.brand === wallet.id) ?? wallets.find(item => item.brand === wallet.id);
            return <button className="button outline" key={wallet.id} disabled={!!progress} onClick={() => {
              const provider = detected?.provider ?? injectedWallets(window as WalletWindow).find(item => item.brand === wallet.id)?.provider;
              if (provider) void connect(provider);
              else setError('未检测到' + wallet.name + '插件。安装或启用后，请刷新此页。');
            }}>{wallet.name}<span className="wallet-detection" aria-hidden="true">{detected ? '连接 ↗' : '未检测到'}</span></button>;
          })}
          {wallets.filter(wallet => !wallet.brand).map(wallet => <button className="button outline" key={wallet.id} disabled={!!progress} onClick={() => connect(wallet.provider)}>{wallet.name}<span aria-hidden="true">↗</span></button>)}
          <button className="button outline" disabled={!projectId || !!progress} onClick={() => connect()}>手机钱包 · WalletConnect <span aria-hidden="true">↗</span></button>
          {!projectId && <p className="checkout-note">扫码连接需配置 WalletConnect Project ID。</p>}
        </>}
        {pairing && <div className="wallet-pairing"><img src={pairing.qr} alt="WalletConnect 连接二维码"/><p>用钱包 App 扫码连接。</p><button className="text-link" onClick={() => navigator.clipboard.writeText(pairing.uri).catch(() => setError('无法复制连接信息。'))}>复制连接 URI</button></div>}
        {issue && connectorReady && <TestnetIssuance {...issue} deploy={deploy}/>}
        {address && !issue && <section className="wallet-test-gift">
          <h2>{sale ? '测试赠礼 · ' + sale.title : '测试赠礼'}</h2>
          {!purchase?.contract ? <p className="checkout-note">测试合约地址配置后可体验付款与铸造。</p> : <>
            <p className="checkout-note">价格 {purchase.price ? formatEther(purchase.price) : ''} tBNB，另需测试网手续费。</p>
            {!txHash && <form className="checkout-form" onSubmit={event => { event.preventDefault(); void reviewGift(); }}>
              <label htmlFor="test-recipient">测试网收礼地址</label><input id="test-recipient" required value={recipient} disabled={!!reviewAddress} onChange={event => setRecipient(event.target.value)} placeholder="0x…"/>
              <label htmlFor="test-message">公开祝福</label><textarea id="test-message" maxLength={280} rows={3} value={message} disabled={!!reviewAddress} onChange={event => setMessage(event.target.value)}/>
              {reviewAddress ? <>
                <p className="wallet-address">收礼地址 {reviewAddress}</p>
                <button type="button" className="button primary" disabled={!connectorReady || !!progress} onClick={() => void sendGift()}>确认并打开钱包 ↗</button>
                <button type="button" className="text-link" disabled={!!progress} onClick={() => setReviewAddress('')}>修改收礼信息</button>
              </> : <button className="button primary" disabled={!connectorReady || !!progress}>核对测试赠礼 ↗</button>}
            </form>}
            {txHash && <p><a className="text-link" href={testnet.explorer + '/tx/' + txHash} target="_blank" rel="noreferrer">查看测试网交易 ↗</a></p>}
            {txHash && !confirmedGift && !reverted && <button className="button outline" disabled={!!progress} onClick={() => { setError(''); void verifyGift(txHash).catch(failure => setError(failure.message)); }}>重新核对交易</button>}
            {(confirmedGift || reverted) && <button className="button outline" onClick={clearGift}>{reverted ? '重新准备赠礼' : '准备下一份礼物'}</button>}
            {confirmedGift && <><p role="status">链上已确认 · NFT #{confirmedGift.tokenId}</p><Link className="button outline" href={confirmedGift.sharePath}>打开测试收礼页 ↗</Link></>}
          </>}
        </section>}
        {progress && <p className="checkout-note" role="status">{progress}</p>}
        {error && <p className="error" role="alert">{error}</p>}
      </section>
    </main>
  </div>;
}
