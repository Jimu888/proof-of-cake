/** Integration contracts only. No live adapter is implemented or enabled. */
export type ResolvedIdentity = {
  handle: string;
  chainId: number;
  address: string;
  resolvedAt: string;
  source: 'space-id-api' | 'registry';
};
export interface IdentityResolver {
  resolve(handle: string, chainId: number): Promise<ResolvedIdentity>;
  reverse(address: string, chainId: number): Promise<ResolvedIdentity | null>;
}
export type LoginChallenge = {
  id: string; message: string; expiresAt: string;
};
export interface WalletAuthentication {
  challenge(address: string, chainId: number): Promise<LoginChallenge>;
  /** Must consume a nonce once, and check domain, expiry and wallet ownership. */
  verify(challengeId: string, signature: string): Promise<{ address: string; chainId: number }>;
}
export type DeliveryProof = {
  orderId: string; chainId: number; transactionHash: string;
  blockHash: string; blockNumber: string; contractAddress: string;
  tokenId: string; senderAddress: string; recipientAddress: string;
};
export interface ChainVerifier {
  /** Inspect canonical onchain events; a submitted hash alone is not delivery. */
  verifyDelivery(orderId: string, transactionHash: string): Promise<
    | { state: 'pending' }
    | { state: 'failed'; reason: string }
    | { state: 'confirmed'; proof: DeliveryProof }
  >;
}
