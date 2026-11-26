import { Contract, ContractFactory, type InterfaceAbi, getAddress, ZeroAddress, keccak256 } from 'ethers';
import legacyArtifact from '../../contracts/platform/test-gift.artifact.json';
import previousVaultArtifact from '../../contracts/platform/vault-gift-v1.artifact.json';
import artifact from '../../contracts/platform/vault-gift.artifact.json';
import { getOperations, OperationsError, type TestnetRelease } from './operations';
import { getRevenueSplit } from './revenue-config';
import { testnetProvider } from './testnet-gifts';
import type { Artwork } from '../domain/catalog';

function metadata(artwork: Artwork, artistBps: number) {
  return 'data:application/json,' + encodeURIComponent(JSON.stringify({
    name: artwork.title, description: artwork.description, workId: artwork.id,
    version: artwork.releaseVersion, artistBps,
  }));
}

function releaseInputs(id: string, artist: string, platform: string) {
  const store = getOperations();
  const artwork = store.publishedArtwork(id);
  if (!artwork || artwork.showcase || store.release(id)) throw new OperationsError('请选择已陈列且尚未发行的作品。');
  let artistAddress: string, platformAddress: string;
  try { artistAddress = getAddress(artist); platformAddress = getAddress(platform); }
  catch { throw new OperationsError('请输入完整的创作者和平台收款地址。'); }
  if (artistAddress === platformAddress || [artistAddress, platformAddress].includes(ZeroAddress)) throw new OperationsError('请使用两个不同的非零收款地址。');
  return { artwork, artist: artistAddress, platform: platformAddress, artistBps: getRevenueSplit().artistBps };
}

export async function prepareRelease(id: string, artist: string, platform: string) {
  const release = releaseInputs(id, artist, platform);
  const data = await releaseData(release, artifact);
  return { ...release, chainId: '0x61', data };
}

async function releaseData(release: ReturnType<typeof releaseInputs>, compiled: { abi: InterfaceAbi; bytecode: string }) {
  const { artwork, artistBps } = release;
  const factory = new ContractFactory(compiled.abi, compiled.bytecode);
  const transaction = await factory.getDeployTransaction(release.artist, release.platform, artwork.priceAtomic,
    artistBps, artwork.editionLimit, artwork.policy.transferable, artwork.policy.holderCanBurn, metadata(artwork, artistBps));
  return transaction.data;
}

export async function verifyRelease(id: string, artist: string, platform: string, hash: string): Promise<TestnetRelease> {
  if (!/^0x[0-9a-f]{64}$/i.test(hash)) throw new OperationsError('请输入完整的部署交易哈希。');
  const store = getOperations();
  const existing = store.release(id);
  if (existing) throw new OperationsError('作品已绑定测试版。');
  const prepared = await prepareRelease(id, artist, platform);
  const provider = testnetProvider();
  try {
    if ((await provider.getNetwork()).chainId !== 97n) throw new Error('Unexpected chain');
    const [receipt, transaction, height] = await Promise.all([
      provider.getTransactionReceipt(hash), provider.getTransaction(hash), provider.getBlockNumber(),
    ]);
    if (!receipt || height - receipt.blockNumber + 1 < 3) throw new OperationsError('部署交易尚未达到三次确认，请稍后核验。');
    if (receipt.status !== 1 || !receipt.contractAddress || !transaction || transaction.to ||
        transaction.value !== 0n) throw new OperationsError('部署交易与当前作品或收款设置不一致。');
    const hashOfData = keccak256(transaction.data);
    const vault = hashOfData === keccak256(prepared.data) ||
      hashOfData === keccak256(await releaseData(prepared, previousVaultArtifact));
    if (!vault && hashOfData !== keccak256(await releaseData(prepared, legacyArtifact))) {
      throw new OperationsError('部署交易与当前作品或收款设置不一致。');
    }
    const block = await provider.getBlock(receipt.blockNumber);
    if (block?.hash !== receipt.blockHash) throw new OperationsError('部署区块尚未稳定，请稍后核验。');
    const contract = getAddress(receipt.contractAddress);
    const deployed = new Contract(contract, artifact.abi, provider);
    if (await deployed.metadata() !== metadata(prepared.artwork, prepared.artistBps)) throw new OperationsError('链上作品信息不一致。');
    const { data: _data, chainId: _chain, ...release } = prepared;
    return { ...release, contract, ...(vault && { vault: true }) };
  } finally { provider.destroy(); }
}
