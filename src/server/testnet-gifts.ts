import { Contract, FetchRequest, Interface, JsonRpcProvider, ZeroAddress, getAddress } from 'ethers';
import { testnet } from '../lib/testnet';
import { getOperations } from './operations';
import { readGiftVault } from './testnet-vault';
import { giftAbi, vaultGiftAbi } from '../lib/test-gift';

export const transactionHashPattern = /^0x[0-9a-f]{64}$/i;
export class RevertedGiftTransaction extends Error {}
const giftInterface = new Interface([...giftAbi, ...vaultGiftAbi]);
export function testnetProvider() {
  const local = process.env.MEMENT_LOCAL_TESTNET_RPC;
  if (local && !/^http:\/\/127\.0\.0\.1:\d+$/.test(local)) throw new Error('Expected loopback test RPC');
  const connection = new FetchRequest(local || testnet.rpc);
  connection.timeout = 8000;
  return new JsonRpcProvider(connection, undefined, { batchMaxCount: 1 });
}
export async function readTestnetConfiguration(provider: JsonRpcProvider) {
  if ((await provider.getNetwork()).chainId !== BigInt(testnet.id)) throw new Error('Wrong network');
  const block = await provider.getBlockNumber();
  const contract = process.env.MEMENT_TESTNET_CONTRACT ? getAddress(process.env.MEMENT_TESTNET_CONTRACT) : null;
  const price = contract ? String(await new Contract(contract, giftAbi, provider).price()) : null;
  return { block, contract, price, chainId: testnet.id };
}
export async function readTestnetGift(provider: JsonRpcProvider, transaction: string, configuration: Awaited<ReturnType<typeof readTestnetConfiguration>>) {
  if (!transactionHashPattern.test(transaction)) return null;
  const { block } = configuration;
  const receipt = await provider.getTransactionReceipt(transaction);
  if (!receipt || block - receipt.blockNumber + 1 < 3) return null;
  if (receipt.status !== 1) throw new RevertedGiftTransaction('Transaction reverted');
  const contract = receipt.to && getAddress(receipt.to);
  if (!contract) throw new Error('Wrong receipt');
  const release = getOperations().releaseByContract(contract);
  const price = release?.artwork.priceAtomic ??
    (contract.toLowerCase() === configuration.contract?.toLowerCase() ? configuration.price : null);
  if (price === null) throw new Error('Unregistered gift contract');
  const logs = receipt.logs.filter(log => log.address.toLowerCase() === contract.toLowerCase()).map(log => giftInterface.parseLog(log));
  const gift = logs.find(log => log?.name === 'GiftPurchased' && log.args.sender === getAddress(receipt.from) && String(log.args.price) === price);
  if (!gift || !logs.some(log => log?.name === 'Transfer' && log.args.from === ZeroAddress && log.args.to === gift.args.recipient && log.args.tokenId === gift.args.tokenId)) throw new Error('Missing mint');
  const [giftBlock, submitted] = await Promise.all([
    provider.getBlock(receipt.blockNumber), provider.getTransaction(receipt.hash),
  ]);
  if (!submitted || submitted.blockHash !== receipt.blockHash) return null;
  const purchase = giftInterface.parseTransaction({ data: submitted.data, value: submitted.value });
  const native = purchase?.name === 'mintGiftWithNativeVault';
  const token = purchase?.name === 'mintGiftWithTokenVault';
  const vaulted = native || token;
  const paid = BigInt(price) + (native ? BigInt(purchase.args.vaultAmount) : 0n);
  const funded = vaulted && logs.find(log => log?.name === 'VaultFunded' && log.args.tokenId === gift.args.tokenId);
  if (vaulted && (!release?.vault || !funded || funded.args.amount <= 0n ||
      funded.args.token !== (native ? ZeroAddress : purchase!.args.token) ||
      (native ? funded.args.amount !== purchase!.args.vaultAmount : funded.args.amount > purchase!.args.desiredAmount))) {
    throw new Error('Vault deposit does not match receipt');
  }
  if (submitted.chainId !== BigInt(testnet.id) || submitted.from !== gift.args.sender ||
      submitted.to !== contract || submitted.value !== paid || (!vaulted && purchase?.name !== 'buyGift') ||
      !purchase || purchase.args.orderId !== gift.args.orderId || purchase.args.recipient !== gift.args.recipient ||
      purchase.args.message !== gift.args.message) throw new Error('Purchase does not match receipt');
  if (!giftBlock || giftBlock.hash !== receipt.blockHash) return null;
  const settlement = new Contract(contract, ['function artistBps() view returns (uint16)'], provider);
  const artistBps = release?.artistBps ?? Number(await settlement.artistBps());
  if (!Number.isInteger(artistBps) || artistBps < 0 || artistBps > 10000 || price === null) throw new Error('Invalid split');
  const amount = BigInt(price);
  const platformAmount = amount * BigInt(10000 - artistBps) / 10000n;
  const vault = vaulted ? await readGiftVault(provider, contract, gift.args.tokenId, block) : undefined;
  if (funded && (vault?.token !== funded.args.token || vault?.amount !== String(funded.args.amount))) {
    throw new Error('Vault balance record does not match confirmed funding');
  }
  return {
    artworkId: release?.artwork.id, artworkTitle: release?.artwork.title, artistName: release?.artwork.artist,
    contract, price, artistBps, artistAmount: String(amount - platformAmount), platformAmount: String(platformAmount),
    tokenId: String(gift.args.tokenId), recipient: String(gift.args.recipient), sender: String(gift.args.sender),
    message: String(gift.args.message), createdAt: new Date(giftBlock.timestamp * 1000).toISOString(),
    vault,
    transaction: receipt.hash, sharePath: '/gift/testnet/' + receipt.hash,
  };
}

export async function verifyAndRecordGift(provider: JsonRpcProvider, hash: string) {
  const gift = await readTestnetGift(provider, hash, await readTestnetConfiguration(provider));
  if (!gift) return null;
  const { message: _message, sharePath: _sharePath, vault: _vault, ...sale } = gift;
  getOperations().recordTestnetSale(sale);
  return gift;
}
