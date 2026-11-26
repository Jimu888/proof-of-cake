'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import RoomHeader from './room-header';
import type { ArtworkPolicy } from '../domain/artwork-policy';
import { formatEther } from 'ethers';
import InfoTip from './info-tip';
import { Countdown, useClock } from './vault-preview-controls';
import { useLanguage } from '../lib/i18n';
import VaultFields, { resolveVaultDraft } from './vault-fields';
import { parseVaultDraft, vaultAmountText, type VaultAsset, type VaultDraft } from '../domain/vault-gift';
import { giftAbi, vaultGiftAbi, vaultTokenAbi } from '../lib/test-gift';
import TestnetIssuance from './testnet-issuance';
import { testnet } from '../lib/testnet';
import { auth, featuredWallets, injectedWallets, selectTestnet, useInjectedWallets, type Provider, type WalletWindow } from '../lib/injected-wallet';

export default function WalletLogin({ projectId, sale, issue, artworkRequested, redemption, rpc = testnet.rpc }: {
  projectId: string; sale?: { id: string; title: string; contract: string; price: string; vault?: boolean; policy?: ArtworkPolicy };
  redemption?: { purchase: string; contract: string; tokenId: string; asset: VaultAsset };
  artworkRequested?: boolean; issue?: { id: string; title: string; price: string }; rpc?: string;
}) {
  const wallets = useInjectedWallets();
  const { t, locale } = useLanguage();
  const redemptionTime = redemption?.asset.unlockTime;
  const redemptionNow = useClock(!!redemptionTime);
  const redemptionLocked = !!redemptionTime && (redemptionNow === undefined || redemptionNow < redemptionTime);
  const [address, setAddress] = useState('');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [pairing, setPairing] = useState<{ uri: string; qr: string }>();
  const [network, setNetwork] = useState<{ block: number; contract: string | null; price: string | null }>();
  const [lockEdition, setLockEdition] = useState<string>();
  const vaultContract = sale?.vault ? sale.contract : undefined;
  const purchase = sale ?? (artworkRequested ? undefined : network);
  const purchaseKey = address && purchase?.contract ? 'mement-test-gift:' + address.toLowerCase() + ':' + purchase.contract.toLowerCase() : '';
  const [vault, setVault] = useState<VaultDraft>();
  const [redeemHash, setRedeemHash] = useState('');
  const [redeemResult, setRedeemResult] = useState<'confirmed' | 'reverted'>();
  const [vaultReview, setVaultReview] = useState<Awaited<ReturnType<typeof resolveVaultDraft>>>();
  const redeemKey = redemption ? 'mement-vault-redeem:' + redemption.purchase : '';

  useEffect(() => {
    if (!redeemKey) return;
    try {
      const saved = sessionStorage.getItem(redeemKey);
      if (saved && /^0x[0-9a-f]{64}$/i.test(saved)) setRedeemHash(saved);
    } catch {}
  }, [redeemKey]);
  const [recipient, setRecipient] = useState('');
  const [messageDraft, setMessage] = useState<string>();
  const message = messageDraft ?? t('Happy birthday!', '生日快乐！');
  const [txHash, setTxHash] = useState('');
  const [reverted, setReverted] = useState(false);
  const [reviewAddress, setReviewAddress] = useState('');
  const [confirmedGift, setConfirmedGift] = useState<{ tokenId: string; sharePath: string }>();
  const [connectorReady, setConnectorReady] = useState(false);
  const active = useRef<Provider | null>(null);
  useEffect(() => {
    const connector = active.current;
    if (!connector || !vaultContract || !address) return;
    let cancelled = false;
    void (async () => {
      const { Interface } = await import('ethers');
      const abi = new Interface(vaultGiftAbi);
      const result = await connector.request({ method: 'eth_call', params: [{
        to: vaultContract, data: abi.encodeFunctionData('supportsTimeLock'),
      }, 'latest'] }) as string;
      if (!cancelled && abi.decodeFunctionResult('supportsTimeLock', result)[0]) setLockEdition(vaultContract);
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [vaultContract, address, connectorReady]);
  const operation = useRef(0);
  const releaseListeners = useRef<(() => void) | undefined>(undefined);
  const submittingGift = useRef(false);
  const pendingOrder = useRef<{ draft: string; id: string } | undefined>(undefined);

  useEffect(() => {
    const initialOperation = operation.current;
    fetch('/api/wallet').then(response => response.json()).then(data => {
      if (operation.current === initialOperation) setAddress(data.address ?? '');
    }).catch(() => {});
    fetch('/api/testnet').then(response => response.ok ? response.json() : null).then(data => { if (data) setNetwork(data); }).catch(() => {});
    return () => {
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
    try { await auth({ action: 'logout' }); } catch { setError(t('Could not sign out. Try again.', '退出请求未送达，请重试。')); }
    try { await provider?.disconnect?.(); } catch { /* Site session is independent of the connector. */ }
  }

  async function connect(provider?: Provider) {
    const current = ++operation.current;
    setError('');
    setProgress(t('Connecting wallet…', '正在连接钱包…'));
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
      if (!accounts?.[0]) throw new Error(t('The wallet did not provide an account.', '钱包未提供账户。'));
      await selectTestnet(provider, rpc, t('Switch to BNB Smart Chain Testnet in your wallet.', '请在钱包中切换到 BNB Smart Chain 测试网。'));
      const account = accounts[0];
      setProgress(t('Sign in your wallet to continue.', '请在钱包中签名登录。'));
      const challenge = await auth({ action: 'challenge', address: account }, t('Wallet sign-in failed. Request a new signature and try again.', '钱包登录失败，请重新请求签名。'));
      const bytes = new TextEncoder().encode(challenge.message);
      const hex = '0x' + Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
      const signature = await provider.request({ method: 'personal_sign', params: [hex, account] });
      if (operation.current !== current) return;
      const selected = await provider.request({ method: 'eth_accounts' }) as string[];
      if (selected[0]?.toLowerCase() !== account.toLowerCase() || await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) throw new Error(t('Your wallet account or network changed. Sign in again.', '钱包账户或网络已变化，请重新登录。'));
      const session = await auth({ action: 'verify', nonce: challenge.nonce, signature }, t('Wallet sign-in failed. Request a new signature and try again.', '钱包登录失败，请重新请求签名。'));
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
      if (operation.current === current) setError(Number((failure as { code?: number }).code) === 4001 ? t('You declined the wallet request.', '你已取消钱包请求。') : failure instanceof Error ? failure.message : t('Could not connect to the wallet.', '钱包连接失败。'));
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
      if (to === ZeroAddress) throw new Error(t('The recipient cannot be the zero address.', '收礼地址不能为零地址。'));
      if (new TextEncoder().encode(message).length > 840) throw new Error(t('The message is too long.', '祝福内容过长。'));
      const checked = await resolveVaultDraft(vault, t('Check the testnet token address and availability.', '请确认测试网代币合约地址及可用性。'));
      setMessage(message);
      setVault(checked?.draft);
      setVaultReview(checked);
      setReviewAddress(to);
    } catch { setError(vault ? t('Check the recipient address, message length, and vaulted amount.', '请核对收礼地址、祝福长度及内封心意金。') : t('Check the recipient address and message length.', '请核对收礼地址及祝福长度。')); }
  }

  async function deploy(data: string) {
    const provider = active.current;
    if (!provider || !address) throw new Error(t('Connect a testnet wallet first.', '请先连接测试网钱包。'));
    const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
    if (accounts[0]?.toLowerCase() !== address.toLowerCase() || await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) throw new Error(t('Reconnect your testnet wallet.', '请重新连接测试网钱包。'));
    const hash = await provider.request({ method: 'eth_sendTransaction', params: [{ from: address, value: '0x0', data }] });
    if (typeof hash !== 'string' || !/^0x[0-9a-f]{64}$/i.test(hash)) throw new Error(t('The wallet did not return a valid deployment hash.', '钱包未返回有效部署交易哈希。'));
    return hash;
  }

  async function sendGift() {
    const provider = active.current;
    if (!provider || !purchase?.contract || progress || submittingGift.current) return;
    submittingGift.current = true;
    const current = operation.current;
    setError('');
    setProgress(t('Checking the testnet gift…', '正在核对测试赠礼…'));
    try {
      const { BrowserProvider, getAddress, ZeroAddress, Interface, toBeHex, hexlify, randomBytes, id, isHexString } = await import('ethers');
      const to = getAddress(reviewAddress);
      if (to === ZeroAddress) throw new Error(t('The recipient cannot be the zero address.', '收礼地址不能为零地址。'));
      const session = await fetch('/api/wallet').then(response => response.json());
      if (session.address !== address) throw new Error(t('Your session expired. Sign in again.', '登录已失效，请重新登录。'));
      const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
      if (accounts[0]?.toLowerCase() !== address.toLowerCase() || await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) throw new Error(t('Reconnect your testnet wallet.', '请重新连接测试网钱包。'));
      const deposit = await resolveVaultDraft(vault, t('Check the testnet token address and availability.', '请确认测试网代币合约地址及可用性。'));
      if (deposit?.amount !== vaultReview?.amount || deposit?.symbol !== vaultReview?.symbol) {
        setReviewAddress('');
        throw new Error(t('Token details changed. Review the vaulted amount again.', '代币资料已变化，请重新核对内封心意金。'));
      }
      if (deposit && !sale?.vault) throw new Error(t('This testnet edition does not support vaulted assets.', '该测试发行版本不支持封入资产。'));
      const draft = id(JSON.stringify(deposit
        ? [address, to, message, purchase.contract, deposit.draft, String(deposit.amount)]
        : [address, to, message, purchase.contract]));
      if (pendingOrder.current?.draft !== draft) {
        let saved: { draft?: string; id?: string } | null = null;
        try { saved = JSON.parse(sessionStorage.getItem(purchaseKey + ':order') ?? 'null'); } catch { /* Browser storage may be unavailable. */ }
        pendingOrder.current = { draft, id: saved?.draft === draft && isHexString(saved.id, 32) ? saved.id! : hexlify(randomBytes(32)) };
      }
      try { sessionStorage.setItem(purchaseKey + ':order', JSON.stringify(pendingOrder.current)); } catch { /* Keep the in-memory order identifier. */ }
      const unlockTime = deposit?.draft.unlockTime;
      if (unlockTime && lockEdition !== purchase.contract) throw new Error(t('This test edition does not support time locks.', '该测试发行版本不支持时间锁。'));
      const lockArgs = unlockTime ? [unlockTime] : [];
      const args = [pendingOrder.current.id, to, message];
      const encoder = new Interface([...giftAbi, ...vaultGiftAbi]);
      let value = BigInt(purchase.price!);
      let data = encoder.encodeFunctionData('buyGift', args);
      if (deposit?.draft.kind === 'native') {
        value += deposit.amount;
        data = encoder.encodeFunctionData(unlockTime ? 'mintGiftWithNativeVaultLocked' : 'mintGiftWithNativeVault', [...args, deposit.amount, ...lockArgs]);
      } else if (deposit) {
        const token = deposit.draft.token!;
        const abi = new Interface(vaultTokenAbi);
        const allowance = async () => {
          const result = await provider.request({ method: 'eth_call', params: [{
            to: token, data: abi.encodeFunctionData('allowance', [address, purchase.contract]),
          }, 'latest'] }) as string;
          return abi.decodeFunctionResult('allowance', result)[0] as bigint;
        };
        const existing = await allowance();
        if (existing < deposit.amount) {
          if (operation.current !== current || await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) return;
          if (existing !== 0n) throw new Error(t('Revoke the existing token allowance in your wallet before trying again.', '请先在钱包撤销该代币的旧授权，再重新赠送。'));
          setProgress(t('Approve the testnet token allowance in your wallet.', '请在钱包确认本次测试代币的用量授权。'));
          const approval = await provider.request({ method: 'eth_sendTransaction', params: [{
            from: address, to: token, data: abi.encodeFunctionData('approve', [purchase.contract, deposit.amount]), value: '0x0',
          }] });
          if (typeof approval !== 'string' || !isHexString(approval, 32)) throw new Error(t('The wallet did not return a valid approval hash.', '钱包未返回有效的授权哈希。'));
          const client = new BrowserProvider(provider, testnet.id);
          try {
            const receipt = await client.waitForTransaction(approval, 1, 90_000);
            if (receipt?.status !== 1 || await allowance() < deposit.amount) throw new Error(t('Token approval is still pending. Try again later.', '测试代币授权尚未成功，可稍后重试。'));
          } finally { client.destroy(); }
        }
        data = encoder.encodeFunctionData(unlockTime ? 'mintGiftWithTokenVaultLocked' : 'mintGiftWithTokenVault', [...args, token, deposit.amount, ...lockArgs]);
      }
      const currentAccounts = await provider.request({ method: 'eth_accounts' }) as string[];
      if (operation.current !== current || currentAccounts[0]?.toLowerCase() !== address.toLowerCase() ||
          await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) return;
      const transaction = { from: address, to: purchase.contract, value: toBeHex(value), data };
      try {
        const simulation = await provider.request({ method: 'eth_call', params: [transaction, 'latest'] });
        if (typeof simulation !== 'string' || !/^0x[0-9a-f]{64}$/i.test(simulation) || BigInt(simulation) === 0n) throw new Error('No mint result');
      }
      catch { throw new Error(t('Transaction simulation failed. Check testnet funds, token allowance, edition availability, and the recipient address.', '交易预检未通过。请核对测试币、代币授权、发行库存及收礼地址。')); }
      if (operation.current !== current || await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) return;
      setProgress(t('Review and confirm the testnet transaction in your wallet.', '请在钱包中核对并确认测试网交易。'));
      const hash = await provider.request({ method: 'eth_sendTransaction', params: [transaction] }) as string;
      if (!/^0x[0-9a-f]{64}$/i.test(hash)) throw new Error(t('The wallet did not return a valid transaction hash.', '钱包未返回有效交易哈希。'));
      try { sessionStorage.setItem(purchaseKey, hash); } catch { /* Keep the hash visible if browser storage is unavailable. */ }
      if (operation.current !== current) return;
      setTxHash(hash);
      setProgress(t('Checking the gift on-chain…', '正在核对链上赠礼记录…'));
      await verifyGift(hash);
    } catch (failure) {
      if (operation.current === current) setError(failure instanceof Error ? failure.message : t('Could not complete the testnet gift.', '测试赠礼未完成。'));
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
    if (!response.ok) throw new Error(t('Could not verify the transaction.', '暂时无法核对交易。'));
    if (!data.tokenId) {
      setError(t('The transaction is awaiting confirmation. Check again later.', '交易尚未获得确认，可以稍后重新核对。'));
      return;
    }
    if (data.sender?.toLowerCase() !== address.toLowerCase() ||
        data.contract?.toLowerCase() !== purchase?.contract?.toLowerCase()) throw new Error(t('The transaction does not match the current wallet or artwork.', '交易与当前钱包或作品不一致。'));
    setError('');
    setConfirmedGift({ tokenId: data.tokenId, sharePath: data.sharePath });
  }

  async function checkRedemption() {
    if (!redemption || !redeemHash || progress) return;
    setError('');
    setProgress(t('Checking the redemption…', '正在核对赎回交易…'));
    try {
      const result = await fetch('/api/testnet?transaction=' + encodeURIComponent(redemption.purchase));
      const gift = await result.json();
      if (result.ok && gift.vault?.redeemed) {
        setRedeemHash(gift.vault.redeemed.transaction);
        setRedeemResult('confirmed');
        try { sessionStorage.removeItem(redeemKey); } catch {}
        return;
      }
      if (active.current && await active.current.request({ method: 'eth_chainId' }) === testnet.chainId) {
        const receipt = await active.current.request({ method: 'eth_getTransactionReceipt', params: [redeemHash] }) as { status?: string } | null;
        if (receipt?.status === '0x0') {
          try { sessionStorage.removeItem(redeemKey); } catch {}
          setRedeemHash('');
          setRedeemResult('reverted');
          return;
        }
      }
      setError(t('Redemption is awaiting three confirmations. Check again later.', '赎回尚未获得三次确认，请稍后再核对。'));
    } catch {
      setError(t('Could not verify redemption.', '暂时无法核对赎回状态。'));
    } finally { setProgress(''); }
  }

  async function redeemGift() {
    const provider = active.current;
    if (!redemption || redemptionLocked || !provider || !address || progress || submittingGift.current || redeemHash) return;
    submittingGift.current = true;
    const current = operation.current;
    setError('');
    setRedeemResult(undefined);
    setProgress(t('Checking the current owner…', '正在核对当前持有人…'));
    try {
      const { Interface, isHexString } = await import('ethers');
      const session = await fetch('/api/wallet').then(response => response.json());
      const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
      if (session.address !== address || accounts[0]?.toLowerCase() !== address.toLowerCase() ||
          await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) throw new Error(t("Connect the current owner's testnet wallet.", '请连接当前持有人的测试网钱包。'));
      const abi = new Interface(vaultGiftAbi);
      const result = await provider.request({ method: 'eth_call', params: [{
        to: redemption.contract, data: abi.encodeFunctionData('ownerOf', [redemption.tokenId]),
      }, 'latest'] }) as string;
      if (abi.decodeFunctionResult('ownerOf', result)[0].toLowerCase() !== address.toLowerCase()) throw new Error(t('Only the current NFT owner can redeem the deposit.', '只有当前 NFT 持有人可以取出资产。'));
      const tx = { from: address, to: redemption.contract, data: abi.encodeFunctionData('burnAndRedeem', [redemption.tokenId]), value: '0x0' };
      await provider.request({ method: 'eth_call', params: [tx, 'latest'] });
      if (operation.current !== current || await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) return;
      setProgress(t('Confirm the testnet burn and redemption in your wallet.', '请在钱包确认测试网销毁和赎回。'));
      const hash = await provider.request({ method: 'eth_sendTransaction', params: [tx] });
      if (typeof hash !== 'string' || !isHexString(hash, 32)) throw new Error(t('The wallet did not return a valid redemption hash.', '钱包未返回有效的赎回哈希。'));
      try { sessionStorage.setItem(redeemKey, hash); } catch {}
      setRedeemHash(hash);
    } catch (failure) {
      if (operation.current === current) setError(failure instanceof Error && !('code' in failure) ? failure.message : t('Could not complete testnet redemption. Check ownership and token transfer status.', '测试网赎回未完成，请检查持有人及代币转账状态。'));
    } finally {
      submittingGift.current = false;
      if (operation.current === current) setProgress('');
    }
  }

  return <div className="platform-page room-page wallet-page" lang={locale}>
    <RoomHeader/>
    <main className="creator-application-layout">
      <section className="creator-application-intro">
        <p className="eyebrow">BNB SMART CHAIN TESTNET</p>
        <h1>{t('Wallet sign-in', '钱包登录')}</h1>
        <p>{t('Connect your wallet and sign a message to verify control of your address. Signing is free.', '连接钱包并签名，验证你对地址的控制权。签名登录无需支付费用。')}</p>
        <p className="checkout-note">{network ? t(`Testnet connected · Block ${network.block.toLocaleString(locale)}`, `测试网已连接 · 区块 ${network.block.toLocaleString(locale)}`) : t('Testnet node unavailable', '测试网节点暂未连接')}</p>
      </section>
      <section className="creator-application-panel wallet-panel">
        {address ? <><h2>{t('Signed in', '已登录')}</h2><p className="wallet-address">{address}</p><button className="room-button" onClick={logout}>{t('Sign out', '退出登录')}</button></> : <h2>{t('Choose a wallet', '选择钱包')}</h2>}
        {!connectorReady && <>
          {featuredWallets.map(wallet => {
            const detected = wallets.find(item => item.announced && item.brand === wallet.id) ?? wallets.find(item => item.brand === wallet.id);
            return <button className="room-button room-button-primary" key={wallet.id} disabled={!!progress} onClick={() => {
              const provider = detected?.provider ?? injectedWallets(window as WalletWindow).find(item => item.brand === wallet.id)?.provider;
              if (provider) void connect(provider);
              else setError(t(`Install or enable ${wallet.name}, then refresh this page.`, `请安装或启用${wallet.zh}插件，然后刷新此页。`));
            }}>{t(wallet.name, wallet.zh)}<span className="wallet-detection">{detected ? t('Connect ↗', '连接 ↗') : t('Not detected', '未检测到')}</span></button>;
          })}
          {wallets.filter(wallet => !wallet.brand).map(wallet => <button className="room-button room-button-primary" key={wallet.id} disabled={!!progress} onClick={() => connect(wallet.provider)}>{wallet.name || t('Browser wallet', '浏览器钱包')}<span aria-hidden="true">↗</span></button>)}
          <button className={projectId ? 'room-button room-button-primary' : 'room-button'} disabled={!projectId || !!progress} onClick={() => connect()}> {t('Mobile wallet · WalletConnect', '手机钱包 · WalletConnect')} <span aria-hidden="true">↗</span></button>
          {!projectId && <p className="checkout-note">{t('QR pairing requires a WalletConnect Project ID.', '扫码连接需配置 WalletConnect Project ID。')}</p>}
        </>}
        {pairing && <div className="wallet-pairing"><img src={pairing.qr} alt={t('WalletConnect pairing QR code', 'WalletConnect 连接二维码')}/><p>{t('Scan with your wallet app to connect.', '用钱包 App 扫码连接。')}</p><button className="text-link" onClick={() => navigator.clipboard.writeText(pairing.uri).catch(() => setError(t('Could not copy the pairing URI.', '无法复制连接信息。')))}>{t('Copy pairing URI', '复制连接 URI')}</button></div>}
        {issue && connectorReady && <TestnetIssuance {...issue} deploy={deploy}/>}
        {address && !issue && !redemption && <section className="wallet-test-gift">
          <h2>{t('Testnet gifting', '测试赠礼')}{sale && ' · ' + sale.title}</h2>
          {!purchase?.contract ? <p className="checkout-note">{t('Testnet payment and minting require a configured contract.', '测试合约地址配置后可体验付款与铸造。')}</p> : <>
            <p className="checkout-note">{t('Price', '价格')} {purchase.price ? formatEther(purchase.price) : ''} tBNB · {t('Testnet network fees apply.', '另需测试网手续费。')}</p>
            {!txHash && <form className="checkout-form" onSubmit={event => { event.preventDefault(); void reviewGift(); }}>
              <label htmlFor="test-recipient">{t('Testnet recipient address', '测试网收礼地址')}</label><input id="test-recipient" required value={recipient} disabled={!!reviewAddress} onChange={event => setRecipient(event.target.value)} placeholder="0x…"/>
              <label htmlFor="test-message">{t('Public message', '公开祝福')}</label><textarea id="test-message" maxLength={280} rows={3} value={message} disabled={!!reviewAddress} onChange={event => setMessage(event.target.value)}/>
              {sale?.vault && <VaultFields value={vault} onChange={setVault} enabled supportsTimeLock={lockEdition === sale.contract} policy={sale.policy} disabled={!!reviewAddress || !!progress}/>}
              {reviewAddress ? <>
                <p className="wallet-address">{t('Recipient address', '收礼地址')} {reviewAddress}</p>
                {vaultReview && <p className="checkout-note">{t('Vaulted gift', '内封心意金')} {vaultReview.draft.amount} {vaultReview.symbol} · {t('Excludes artwork price', '平台售价另计')}</p>}
                {vaultReview?.draft.unlockTime && <p className="checkout-note">{t('Redeem from', '可取出时间')} <time dateTime={new Date(vaultReview.draft.unlockTime * 1000).toISOString()}>
                  {new Date(vaultReview.draft.unlockTime * 1000).toLocaleString(locale)}</time></p>}
                <button type="button" className="room-button room-button-primary" disabled={!connectorReady || !!progress} onClick={() => void sendGift()}>{t('Confirm and open wallet ↗', '确认并打开钱包 ↗')}</button>
                <button type="button" className="text-link" disabled={!!progress} onClick={() => setReviewAddress('')}>{t('Edit recipient details', '修改收礼信息')}</button>
              </> : <button className="room-button room-button-primary" disabled={!connectorReady || !!progress}>{t('Review testnet gift ↗', '核对测试赠礼 ↗')}</button>}
            </form>}
            {txHash && <p><a className="text-link" href={testnet.explorer + '/tx/' + txHash} target="_blank" rel="noreferrer">{t('View testnet transaction ↗', '查看测试网交易 ↗')}</a></p>}
            {txHash && !confirmedGift && !reverted && <button className="room-button" disabled={!!progress} onClick={() => { setError(''); void verifyGift(txHash).catch(failure => setError(failure.message)); }}>{t('Check transaction again', '重新核对交易')}</button>}
            {(confirmedGift || reverted) && <button className="room-button" onClick={clearGift}>{reverted ? t('Try gifting again', '重新准备赠礼') : t('Prepare another gift', '准备下一份礼物')}</button>}
            {confirmedGift && <><p role="status">{t('Confirmed on-chain · NFT #', '链上已确认 · NFT #')}{confirmedGift.tokenId}</p><Link className="room-button" href={confirmedGift.sharePath}>{t('Open testnet gift ↗', '打开测试收礼页 ↗')}</Link></>}
          </>}
        </section>}
        {redemption && <section className="wallet-test-gift">
          <h2>{t('Redeem vaulted gift · Testnet', '取出内封心意金 · 测试网')}</h2>
          <p>{vaultAmountText(redemption.asset)} · {t('Burning is permanent', '销毁后不可恢复')}</p>
          {redemptionLocked && redemptionTime && <Countdown target={redemptionTime} now={redemptionNow}/>}
          {address && !redeemHash && <div className="vault-inline"><button type="button" className="room-button room-button-primary" disabled={!connectorReady || !!progress || redemptionLocked}
            onClick={() => void redeemGift()}>{t('Confirm burn and redeem in wallet ↗', '在钱包确认销毁并取出 ↗')}</button>
            <InfoTip en="Wallet confirmation permanently burns the NFT and redeems its deposit on testnet." zh="钱包确认会在测试网永久销毁 NFT 并取出心意金。" />
          </div>}
          {redeemHash && <p role="status">{redeemResult === 'confirmed' ? t('Burn and redemption confirmed.', '已确认销毁和赎回。') : t('Submitted and awaiting confirmation.', '已提交，等待链上确认。')}<a className="text-link" href={testnet.explorer + '/tx/' + redeemHash} target="_blank" rel="noreferrer">{t('View testnet transaction ↗', '查看测试网交易 ↗')}</a></p>}
          {redeemHash && redeemResult !== 'confirmed' && <button type="button" className="room-button" disabled={!!progress} onClick={() => void checkRedemption()}>{t('Check redemption again', '重新核对赎回')}</button>}
          {redeemResult === 'reverted' && <p role="status">{t('The transaction failed. Check its status before trying again.', '交易未执行成功，可重新核对后再提交。')}</p>}
          <Link className="text-link" href={'/gift/testnet/' + redemption.purchase}>{t('Return to the gift to check its status ↗', '返回收礼页查看状态 ↗')}</Link>
        </section>}
        {progress && <p className="checkout-note" role="status">{progress}</p>}
        {error && <p className="error" role="alert">{error}</p>}
      </section>
    </main>
  </div>;
}
