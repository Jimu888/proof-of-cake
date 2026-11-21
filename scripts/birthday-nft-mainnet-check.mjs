// Read-only mainnet simulation: never signs, broadcasts or connects a signer.
import { JsonRpcProvider, ContractFactory, getAddress, id, concat, getCreate2Address, keccak256, formatEther } from 'ethers';
import { compileBirthday,root } from './birthday-nft-compile.mjs';
import { checkFactory,FACTORY_ADDRESS,BSC_RPC_ENDPOINTS } from './birthday-nft-factory.mjs';
import { mkdir,writeFile } from 'node:fs/promises';
import path from 'node:path';
const issuer=getAddress(process.env.BIRTHDAY_ISSUER_ADDRESS??'');
const artifact=await compileBirthday();
// Deliberate test metadata: ONLY used in non-persistent eth_call/estimateGas.
const creation=await new ContractFactory(artifact.abi,artifact.bytecode).getDeployTransaction('SIMULATION ONLY','ipfs://test-only/not-a-release.json',true,issuer);
const salt=id('mement-read-only-factory-check:'+issuer);
const data=concat([salt,creation.data]);const predicted=getCreate2Address(FACTORY_ADDRESS,salt,keccak256(creation.data));
const checks=[];
for(const url of BSC_RPC_ENDPOINTS){
 const provider=new JsonRpcProvider(url);
 try{
  const checked=await checkFactory(provider);
  if(await provider.getCode(predicted)!=='0x')throw new Error('Simulation target already occupied.');
  const transaction={from:issuer,to:FACTORY_ADDRESS,data,value:0n};
  const result=await provider.call(transaction);
  if(getAddress(result)!==predicted)throw new Error('Factory simulation returned a different address.');
  const gas=await provider.estimateGas(transaction);const price=(await provider.getFeeData()).gasPrice;
  checks.push({...checked,rpc:url,simulationOnly:true,simulatedCreation:true,estimatedGas:gas.toString(),gasPriceWei:price?.toString(),estimatedBNB:price===null?null:formatEther(gas*price)});
 }finally{await provider.destroy()}
}
await mkdir(path.join(root,'delivery/nft-build'),{recursive:true});
await writeFile(path.join(root,'delivery/nft-build/mainnet-readonly-check.json'),JSON.stringify({checkedAt:new Date().toISOString(),broadcast:false,checks},null,2));
console.log(JSON.stringify({broadcast:false,checks},null,2));
