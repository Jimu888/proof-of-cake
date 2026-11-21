// Mainnet preparation only: verifies factory and estimates an unsigned call.
// No wallet signing or broadcasting code exists in this file.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { ContractFactory, JsonRpcProvider, getAddress, getCreate2Address, keccak256, concat, hexlify, randomBytes, formatEther, isHexString } from 'ethers';
import { compileBirthday, root } from './birthday-nft-compile.mjs';
import { FACTORY_ADDRESS, BSC_RPC_ENDPOINTS, checkFactory } from './birthday-nft-factory.mjs';
const file=process.argv[2];
if(!file)throw new Error('Provide a local config JSON: title, metadataURI, recipientMayBurn, salt (optional). Set BIRTHDAY_ISSUER_ADDRESS to the connected issuer. No recipient or key required.');
const config=JSON.parse(await readFile(file,'utf8'));
if(typeof config.title!=='string'||!config.title.trim()||/REPLACE|PLACEHOLDER|SIMULATION ONLY/i.test(config.title))throw new Error('A final title is required.');
if(typeof config.metadataURI!=='string'||/placeholder|replace|test-only|YOUR_/i.test(config.metadataURI))throw new Error('Use a final published metadata URI.');
let immutableHttps=false;
try{const u=new URL(config.metadataURI);immutableHttps=u.protocol==='https:'&&/^[a-f0-9]{8,}\.mement-jihua-zhiwai\.pages\.dev$/.test(u.hostname)&&u.pathname==='/metadata/1.json'&&!u.search&&!u.hash}catch{}
const ipfs=/^ipfs:\/\/[a-zA-Z0-9]{32,}\/.+\.json$/.test(config.metadataURI);
if(!immutableHttps&&!ipfs)throw new Error('Use the frozen versioned Cloudflare deployment URL or final IPFS URI.');
if(immutableHttps){
 const response=await fetch(config.metadataURI,{signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error('Published metadata is not reachable.');
 const metadata=await response.json();
 if(metadata.name!==config.title.trim()||!metadata.animation_url||!metadata.image)throw new Error('Published metadata does not match the release.');
}
if(config.recipientMayBurn!==true)throw new Error('The confirmed birthday policy permits recipient-only burn.');
const issuer=getAddress(process.env.BIRTHDAY_ISSUER_ADDRESS??'');
const salt=config.salt??hexlify(randomBytes(32));if(!isHexString(salt,32))throw new Error('Salt must be exactly 32 bytes.');
const artifact=await compileBirthday();
const creation=await new ContractFactory(artifact.abi,artifact.bytecode).getDeployTransaction(config.title.trim(),config.metadataURI,true,issuer);
const predicted=getCreate2Address(FACTORY_ADDRESS,salt,keccak256(creation.data));
const transaction={from:issuer,to:FACTORY_ADDRESS,data:concat([salt,creation.data]),value:0n};
const checks=[];
for(const url of BSC_RPC_ENDPOINTS){
 const provider=new JsonRpcProvider(url);
 try{
  await checkFactory(provider);
  if(await provider.getCode(predicted)!=='0x')throw new Error('Predicted address is occupied: verify the existing contract before any retry.');
  if(getAddress(await provider.call(transaction))!==predicted)throw new Error('Simulation returned unexpected address.');
  const gas=await provider.estimateGas(transaction);const price=(await provider.getFeeData()).gasPrice;
  checks.push({rpc:url,gas:gas.toString(),gasPriceWei:price?.toString(),estimatedBNB:price===null?null:formatEther(gas*price)});
 }finally{await provider.destroy()}
}
await mkdir(path.join(root,'delivery/nft-build'),{recursive:true});
await writeFile(path.join(root,'delivery/nft-build/unsigned-deployment.json'),JSON.stringify({chainId:56,from:issuer,to:FACTORY_ADDRESS,data:transaction.data,value:'0',salt,predictedContract:predicted,metadataURI:config.metadataURI,recipientMayBurn:true,checks,broadcast:false,note:'Review metadata content and all wallet preview risks before any execution. This plan does not publish metadata or sign/broadcast.'},null,2));
console.log('Verified unsigned factory call prepared locally; nothing uploaded, signed or broadcast.');
