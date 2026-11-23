import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import solc from 'solc';

const root = fileURLToPath(new URL('../', import.meta.url));
export async function compileTestnet(name = 'MementTestGift') {
  const filename = name + '.sol';
  const content = await readFile(resolve(root, 'contracts/platform', filename), 'utf8');
  const input = {
    language: 'Solidity',
    sources: { [filename]: { content } },
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'paris', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode'] } } },
  };
  const result = JSON.parse(solc.compile(JSON.stringify(input), { import: name => {
    if (!name.startsWith('@openzeppelin/contracts/')) return { error: 'Unexpected import' };
    try { return { contents: readFileSync(resolve(root, 'node_modules', name), 'utf8') }; }
    catch { return { error: 'Missing import' }; }
  } }));
  const errors = (result.errors ?? []).filter(error => error.severity === 'error');
  if (errors.length) throw new Error(errors.map(error => error.formattedMessage).join('\n'));
  const contract = result.contracts[filename][name];
  return contractArtifact(contract);
}
function contractArtifact(contract) {
  return { abi: contract.abi, bytecode: '0x' + contract.evm.bytecode.object, runtime: '0x' + contract.evm.deployedBytecode.object, immutableReferences: contract.evm.deployedBytecode.immutableReferences };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const artifact = await compileTestnet();
  await mkdir(resolve(root, 'delivery'), { recursive: true });
  await writeFile(resolve(root, 'delivery/testnet-contract.json'), JSON.stringify(artifact));
  console.log('Testnet contract compiled. Wallet deployment remains unsigned.');
}
