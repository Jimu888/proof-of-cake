import { activeReserveTokens, marketAddresses } from '../domain/reserve-plan';

const docsUrl = 'https://docs.atlasoracle.io';
const feedsUrl = 'https://atlasoracle.io/feeds';

export const atlasOracleRegistry = {
  provider: 'Atlas Oracle',
  network: 'BNB Smart Chain',
  architecture: 'Atlas Push/Pull Multi-Feed Registry',
  docsUrl,
  feedsUrl,
  feeds: {
    BTC: {
      pair: 'BTC/USD',
      env: 'ATLAS_ORACLE_FEED_BTC',
      defaultAddress: '0xE20536BC715AAc6560394E33DEb66Ed205aEEc33',
      chainId: 97,
      rpc: 'https://bsc-testnet-dataseed.bnbchain.org',
    },
    ETH: {
      pair: 'ETH/USD',
      env: 'ATLAS_ORACLE_FEED_ETH',
      defaultAddress: '0x7942b8dd9F552c57Eb94D16Ea8215AeF6cAC948f',
      chainId: 56,
      rpc: 'https://bsc-dataseed.bnbchain.org',
    },
    BNB: {
      pair: 'BNB/USD',
      env: 'ATLAS_ORACLE_FEED_BNB',
      defaultAddress: '0x9C0517F5b4C8657c7F18d68d2d79E2B3b1cd6438',
      chainId: 56,
      rpc: 'https://bsc-dataseed.bnbchain.org',
    },
    USDT: {
      pair: 'USDT/USD',
      env: 'ATLAS_ORACLE_FEED_USDT',
      defaultAddress: '',
      chainId: 56,
      rpc: 'https://bsc-dataseed.bnbchain.org',
    },
  },
} as const;

export type AtlasSymbol = keyof typeof atlasOracleRegistry.feeds;

export function atlasSymbolForAddress(address: string) {
  return activeReserveTokens.find(symbol => marketAddresses[symbol]?.toLowerCase() === address.toLowerCase());
}

export function atlasOracleMetadata(symbol: AtlasSymbol, mode: 'configured' | 'reference-fallback') {
  return { provider: atlasOracleRegistry.provider, pair: atlasOracleRegistry.feeds[symbol].pair, mode, docsUrl };
}

// Atlas Push single-feed adapter ABI, used by the read-only market route.
export const IAtlasPriceFeed = [
  'function decimals() external view returns (uint8)',
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
] as const;
