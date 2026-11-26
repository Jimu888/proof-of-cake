import { Contract, getAddress, Interface, ZeroAddress, type JsonRpcProvider } from 'ethers';
import { testnetNativeSymbol, type TokenDetails, type VaultAsset } from '../domain/vault-gift';
import { vaultGiftAbi, vaultTokenAbi } from '../lib/test-gift';

export async function readVaultToken(provider: JsonRpcProvider, rawAddress: string): Promise<TokenDetails> {
  const address = getAddress(rawAddress);
  if (address === ZeroAddress) throw new Error('Expected token contract');
  const token = new Contract(address, vaultTokenAbi, provider);
  const [rawSymbol, rawDecimals] = await Promise.all([token.symbol(), token.decimals()]);
  const decimals = Number(rawDecimals);
  if (typeof rawSymbol !== 'string' || !/^[a-zA-Z0-9._-]{1,24}$/.test(rawSymbol) ||
    !Number.isInteger(decimals) || decimals < 0 || decimals > 36) throw new Error('Unsupported token metadata');
  return { symbol: rawSymbol, decimals };
}

export async function readGiftVault(provider: JsonRpcProvider, address: string, tokenId: bigint, height: number, unlockTime?: number): Promise<VaultAsset | undefined> {
  // Use a confirmed snapshot for the wallet owner, accounting and redemption history.
  const blockTag = height - 2;
  const contract = new Contract(address, vaultGiftAbi, provider);
  // Older editions expose seven return values, while time-lock editions append the timestamp.
  const ledger = unlockTime === undefined ? contract : new Contract(address, [
    vaultGiftAbi.find(entry => entry.startsWith('function vaultAssets'))!.replace('uint256 received)', 'uint256 received,uint64 unlockTime)'),
  ], provider);
  const asset = await ledger.vaultAssets(tokenId, { blockTag });
  if (unlockTime !== undefined && asset.unlockTime !== BigInt(unlockTime)) throw new Error('Time lock does not match confirmed purchase');
  if (asset.amount === 0n) return;
  const meta = asset.token === ZeroAddress
    ? { symbol: testnetNativeSymbol, decimals: 18 }
    : await readVaultToken(provider, asset.token).catch(() => undefined);
  const result: VaultAsset = { token: asset.token, amount: String(asset.amount), unlockTime, ...meta };
  if (!asset.redeemed) {
    result.owner = await contract.ownerOf(tokenId, { blockTag });
    return result;
  }
  const abi = new Interface(vaultGiftAbi);
  const event = abi.getEvent('GiftRedeemed')!;
  const block = Number(asset.redeemedBlock);
  const logs = await provider.getLogs({ address, fromBlock: block, toBlock: block, topics: abi.encodeFilterTopics(event, [tokenId, asset.redeemer, asset.token]) });
  const log = logs.find(item => abi.parseLog(item)?.args.amount === asset.received);
  if (!log) throw new Error('Missing confirmed redemption log');
  result.redeemed = { amount: String(asset.received), transaction: log.transactionHash, owner: asset.redeemer };
  return result;
}
