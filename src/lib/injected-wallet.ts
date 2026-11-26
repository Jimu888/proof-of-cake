import { useEffect, useState } from 'react';
import { testnet } from './testnet';

export type Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, callback: () => void): void;
  removeListener?(event: string, callback: () => void): void;
  disconnect?(): Promise<void>;
};
export const featuredWallets = [
  { id: 'okx', name: 'OKX Wallet', zh: 'OKX 钱包', domains: ['com.okex.wallet', 'com.okx.wallet'] },
  { id: 'binance', name: 'Binance Wallet', zh: '币安钱包', domains: ['com.binance.wallet'] },
  { id: 'metamask', name: 'MetaMask', zh: 'MetaMask', domains: ['io.metamask'] },
] as const;
type WalletBrand = typeof featuredWallets[number]['id'];
type InjectedProvider = Provider & {
  providers?: InjectedProvider[];
  isMetaMask?: boolean;
  isOKExWallet?: boolean;
  isOkxWallet?: boolean;
  isBinance?: boolean;
};
export type WalletWindow = Window & {
  ethereum?: InjectedProvider;
  okxwallet?: InjectedProvider & { ethereum?: InjectedProvider };
  binancew3w?: InjectedProvider & { ethereum?: InjectedProvider };
  BinanceChain?: InjectedProvider;
};
export type WalletOption = { id: string; name: string; provider: Provider; brand?: WalletBrand; announced?: boolean };
type WalletAnnouncement = CustomEvent<{ info: { uuid: string; name: string; rdns?: string }; provider: Provider }>;

function normalizeWalletName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function sameWallet(a: Pick<WalletOption, 'provider' | 'brand' | 'name'>, b: Pick<WalletOption, 'provider' | 'brand' | 'name'>) {
  if (a.provider === b.provider) return true;
  if (a.brand && b.brand && a.brand === b.brand) return true;
  const nameA = normalizeWalletName(a.name);
  const nameB = normalizeWalletName(b.name);
  return Boolean(nameA && nameB && nameA === nameB);
}

function inferBrandFromMeta(rdns: string, name: string): WalletBrand | undefined {
  const byRdns = featuredWallets.find(wallet => wallet.domains.some(domain => domain === rdns))?.id;
  if (byRdns) return byRdns;
  const lower = normalizeWalletName(name);
  if (lower.includes('okx') || lower.includes('okex')) return 'okx';
  if (lower.includes('binance')) return 'binance';
  if (lower === 'metamask') return 'metamask';
  return undefined;
}

export function injectedWallets(site: WalletWindow): WalletOption[] {
  const options: WalletOption[] = [];
  function add(provider: InjectedProvider | undefined, brand?: WalletBrand) {
    if (typeof provider?.request !== 'function') return;
    const candidate: WalletOption = {
      id: 'injected-' + options.length,
      name: featuredWallets.find(wallet => wallet.id === brand)?.name ?? '',
      provider, brand,
    };
    if (options.some(wallet => sameWallet(wallet, candidate))) return;
    options.push(candidate);
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

export async function auth(input: object, errorMessage?: string) {
  const response = await fetch('/api/wallet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  const data = await response.json();
  if (!response.ok) throw new Error(errorMessage ?? data.error);
  return data;
}

export async function selectTestnet(provider: Provider, rpc: string, networkError: string) {
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
  if (await provider.request({ method: 'eth_chainId' }) !== testnet.chainId) throw new Error(networkError);
}


function sortWallets(list: WalletOption[]) {
  const order = (wallet: WalletOption) => {
    const idx = wallet.brand ? featuredWallets.findIndex(item => item.id === wallet.brand) : -1;
    return idx >= 0 ? idx : featuredWallets.length;
  };
  return [...list].sort((a, b) => order(a) - order(b));
}

export function useInjectedWallets() {
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  useEffect(() => {
    const add = (event: Event) => {
      const { info, provider } = (event as WalletAnnouncement).detail ?? {};
      if (typeof info?.uuid !== 'string' || typeof info.name !== 'string' || typeof provider?.request !== 'function') return;
      const rdns = typeof info.rdns === 'string' ? info.rdns.toLowerCase() : '';
      const brand = inferBrandFromMeta(rdns, info.name);
      setWallets(current => {
        const known = current.find(item => item.provider === provider);
        const option: WalletOption = { id: info.uuid, name: info.name, provider, brand: brand ?? known?.brand, announced: true };
        return sortWallets([...current.filter(item => item.id !== info.uuid && !sameWallet(item, option)), option]);
      });
    };
    const scan = () => setWallets(current => {
      const announced = current.filter(item => item.announced);
      const discovered = injectedWallets(window as WalletWindow);
      const uniqueLegacy = discovered.filter(wallet => !announced.some(item => sameWallet(item, wallet)));
      return sortWallets([...announced, ...uniqueLegacy]);
    });
    window.addEventListener('eip6963:announceProvider', add);
    window.addEventListener('ethereum#initialized', scan);
    scan();
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    const timer = setTimeout(scan, 600);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('eip6963:announceProvider', add);
      window.removeEventListener('ethereum#initialized', scan);
    };
  }, []);
  return wallets;
}
