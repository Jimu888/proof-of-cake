// Receipt verification only; no signer, signing, upload or chain-write APIs.
import {readFile} from 'node:fs/promises';
import {JsonRpcProvider,Contract,Interface,getAddress,ZeroAddress} from 'ethers';
import {compileBirthday} from './birthday-nft-compile.mjs';
import {BSC_RPC_ENDPOINTS,matchesBirthdayRuntime} from './birthday-nft-factory.mjs';
const config=JSON.parse(await readFile(process.argv[2],'utf8'));
for(const key of ['contract','issuer','recipient'])config[key]=getAddress(config[key]);
if(!/^0x[\da-fA-F]{64}$/.test(config.mintTransaction))throw new Error('A real mint transaction hash is required.');
if(typeof config.metadataURI!=='string'||!(/^(ipfs:\/\/|https:\/\/)/.test(config.metadataURI)))throw new Error('Expected final metadata URI.');
const artifact=await compileBirthday();
const iface=new Interface(artifact.abi);const result=[];
for(const rpc of BSC_RPC_ENDPOINTS){
 const p=new JsonRpcProvider(rpc);
 try{
  if((await p.getNetwork()).chainId!==56n)throw new Error('Wrong network.');
  const receipt=await p.getTransactionReceipt(config.mintTransaction);
  if(!receipt||receipt.status!==1)throw new Error('Mint is not confirmed successfully.');
  if(getAddress(receipt.from)!==config.issuer||!receipt.to||getAddress(receipt.to)!==config.contract)throw new Error('Receipt sender/contract mismatch.');
  const emitted=receipt.logs.filter(l=>getAddress(l.address)===config.contract).some(l=>{
   try{const event=iface.parseLog(l);return event?.name==='Transfer'&&event.args.from===ZeroAddress&&getAddress(event.args.to)===config.recipient&&event.args.tokenId===1n}catch{return false}
  });
  if(!emitted)throw new Error('Expected direct mint event was not found.');
  if(!matchesBirthdayRuntime(await p.getCode(config.contract),artifact))throw new Error('Deployed runtime is not the compiled birthday contract.');
  const c=new Contract(config.contract,artifact.abi,p);
  if(getAddress(await c.issuer())!==config.issuer||await c.tokenURI(1)!==config.metadataURI||!(await c.recipientMayBurn())||!(await c.locked(1))||!(await c.issued()))throw new Error('Contract properties mismatch (or gift is no longer held).');
  if(getAddress(await c.ownerOf(1))!==config.recipient)throw new Error('Recipient is not the current owner.');
  const confirmations=(await p.getBlockNumber())-receipt.blockNumber+1;
  if(confirmations<5)throw new Error('Wait for at least five confirmations.');
  result.push({rpc,status:'mint-confirmed-and-held',confirmations,blockNumber:receipt.blockNumber,locked:true,recipientMayBurn:true});
 }finally{await p.destroy()}
}
console.log(JSON.stringify({verified:true,checks:result},null,2));
