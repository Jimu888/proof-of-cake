import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import solc from 'solc';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function compileBirthday(){
 const source=await readFile(path.join(root,'contracts/birthday/MementBirthday.sol'),'utf8');
 const input={language:'Solidity',sources:{'MementBirthday.sol':{content:source}},settings:{optimizer:{enabled:true,runs:200},evmVersion:'paris',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','evm.deployedBytecode.immutableReferences','metadata']}}}};
 const fs=await import('node:fs');
 const output=JSON.parse(solc.compile(JSON.stringify(input),{import:(name)=>{
  if(!name.startsWith('@openzeppelin/contracts/'))return {error:'Import not allowed'};
  try{const contents=fs.readFileSync(path.join(root,'node_modules',name),'utf8');input.sources[name]={content:contents};return {contents}}catch{return {error:'Import missing'}}
 }}));
 for(const e of output.errors??[])if(e.severity==='error')throw new Error(e.formattedMessage);
 const c=output.contracts['MementBirthday.sol'].MementBirthday;
 return {contractName:'MementBirthday',compiler:solc.version(),settings:input.settings,abi:c.abi,bytecode:'0x'+c.evm.bytecode.object,deployedBytecode:'0x'+c.evm.deployedBytecode.object,immutableReferences:c.evm.deployedBytecode.immutableReferences,compilerInput:input};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=await compileBirthday();await mkdir(path.join(root,'delivery/nft-build'),{recursive:true});
 await writeFile(path.join(root,'delivery/nft-build/MementBirthday.json'),JSON.stringify(result,null,2));
 console.log('Compiled locally. No RPC, wallet, deployment or upload used.');
}
