import { writeFile, mkdir } from 'node:fs/promises';
import { ContractFactory, JsonRpcProvider, getAddress, parseEther, ZeroAddress } from 'ethers';
import { compileTestnet } from './testnet-compile.mjs';

const [deployerInput, artistInput, platformInput] = process.argv.slice(2);
if (!deployerInput || !artistInput || !platformInput) {
  throw new Error('Usage: node scripts/testnet-deployment.mjs <deployer> <artist> <platform>');
}
const [deployer, artist, platform] = [deployerInput, artistInput, platformInput].map(getAddress);
if ([deployer, artist, platform].includes(ZeroAddress) || artist === platform) throw new Error('Use valid, distinct payout addresses.');
const rpc = 'https://bsc-testnet-dataseed.bnbchain.org';
const provider = new JsonRpcProvider(rpc);
try {
  const network = await provider.getNetwork();
  if (network.chainId !== 97n) throw new Error('Expected BSC Testnet chain 97.');
  const artifact = await compileTestnet();
  const metadata = 'data:application/json,' + encodeURIComponent(JSON.stringify({
    name: 'Mement Test Gift', description: 'Mement BSC testnet edition for validating gift purchases.',
  }));
  const { data } = await new ContractFactory(artifact.abi, artifact.bytecode).getDeployTransaction(artist, platform, parseEther('0.0001'), 5000, 30, false, true, metadata);
  const gas = await provider.estimateGas({ from: deployer, data });
  const balance = await provider.getBalance(deployer);
  const { gasPrice } = await provider.getFeeData();
  await mkdir('delivery', { recursive: true });
  await writeFile('delivery/testnet-deployment.json', JSON.stringify({
    chainId: '0x61', from: deployer, data, value: '0x0', artist, platform,
  }, null, 2));
  console.log(JSON.stringify({ chainId: 97, deployer, artist, platform, gas: String(gas), balanceWei: String(balance), estimatedFeeWei: gasPrice ? String(gas * gasPrice) : null }, null, 2));
  console.log('Unsigned transaction saved to delivery/testnet-deployment.json.');
} finally { provider.destroy(); }
