import { readFile, writeFile } from 'node:fs/promises';
import { compileTestnet } from './testnet-compile.mjs';

const output = new URL('../contracts/platform/vault-gift.artifact.json', import.meta.url);
const candidate = JSON.stringify(await compileTestnet('MementVaultGift')) + '\n';
if (process.argv.includes('--check')) {
  if (await readFile(output, 'utf8') !== candidate) throw new Error('Vault artifact does not match its source');
} else {
  await writeFile(output, candidate);
}
