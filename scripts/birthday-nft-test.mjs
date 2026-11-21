import assert from 'node:assert/strict';
import { test } from 'node:test';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory, Contract, ZeroAddress, id, getCreate2Address, keccak256, concat } from 'ethers';
import { FACTORY_ADDRESS, FACTORY_RUNTIME, matchesBirthdayRuntime } from './birthday-nft-factory.mjs';
import { compileBirthday } from './birthday-nft-compile.mjs';
const artifact=await compileBirthday();
async function fixture(allowBurn=false){
 const rpc=ganache.provider({logging:{quiet:true},wallet:{totalAccounts:4},chain:{chainId:31337,hardfork:'shanghai'}});
 const provider=new BrowserProvider(rpc);provider.pollingInterval=10;
 const [issuer,recipient,stranger]=await Promise.all([0,1,2].map(i=>provider.getSigner(i)));
 const gift=await new ContractFactory(artifact.abi,artifact.bytecode,issuer).deploy('Local Test Gift','ipfs://test-only/metadata.json',allowBurn,await issuer.getAddress());await gift.waitForDeployment();
 return {rpc,provider,issuer,recipient,stranger,gift};
}
async function rejects(contract,fn,args,error){
 await assert.rejects(()=>contract[fn].staticCall(...args),e=>{assert.equal(contract.interface.parseError(e.data)?.name,error);return true});
}
test('One direct mint, fixed metadata and standard locked interface',async()=>{
 const f=await fixture();try{
  const {gift,recipient,stranger}=f;assert.equal(await gift.issued(),false);
  await rejects(gift.connect(stranger),'mintGift',[await recipient.getAddress()],'IssuerOnly');
  await rejects(gift,'locked',[1],'ERC721NonexistentToken');
  await rejects(gift,'mintGift',[ZeroAddress],'ERC721InvalidReceiver');assert.equal(await gift.issued(),false);
  const tx=await gift.mintGift(await recipient.getAddress());const receipt=await tx.wait();
  assert.equal(await gift.ownerOf(1),await recipient.getAddress());assert.equal(await gift.balanceOf(await recipient.getAddress()),1n);
  assert.equal(await gift.locked(1),true);assert.equal(await gift.supportsInterface('0xb45a3c0e'),true);assert.equal(await gift.supportsInterface('0x80ac58cd'),true);
  assert.equal(await gift.tokenURI(1),'ipfs://test-only/metadata.json');
  assert(receipt.logs.some(l=>{try{return gift.interface.parseLog(l)?.name==='Locked'}catch{return false}}));
  await rejects(gift,'mintGift',[await stranger.getAddress()],'AlreadyIssued');
  for(const name of ['unlock','setTokenURI','upgradeTo','transferOwnership'])assert.equal(gift.interface.getFunction(name),null);
 }finally{await f.provider.destroy();await f.rpc.disconnect()}
});
test('Every transfer entry point and approvals are blocked; issuer cannot burn',async()=>{
 const f=await fixture();try{
  const {gift,recipient,stranger}=f;const to=await stranger.getAddress(),from=await recipient.getAddress();await(await gift.mintGift(from)).wait();const held=gift.connect(recipient);
  await rejects(held,'transferFrom',[from,to,1],'Soulbound');
  await rejects(held,'safeTransferFrom(address,address,uint256)',[from,to,1],'Soulbound');
  await rejects(held,'safeTransferFrom(address,address,uint256,bytes)',[from,to,1,'0x'],'Soulbound');
  await rejects(held,'approve',[to,1],'Soulbound');await rejects(held,'setApprovalForAll',[to,true],'Soulbound');
  await rejects(held,'burn',[],'BurnDisabled');await rejects(gift,'burn',[],'BurnDisabled');assert.equal(await gift.ownerOf(1),from);
 }finally{await f.provider.destroy();await f.rpc.disconnect()}
});
test('Optional burn only by recipient; destruction never allows replacement mint',async()=>{
 const f=await fixture(true);try{
  const {gift,recipient}=f;await(await gift.mintGift(await recipient.getAddress())).wait();await rejects(gift,'burn',[],'RecipientOnly');
  await(await gift.connect(recipient).burn()).wait();assert.equal(await gift.issued(),true);await rejects(gift,'ownerOf',[1],'ERC721NonexistentToken');await rejects(gift,'mintGift',[await recipient.getAddress()],'AlreadyIssued');
 }finally{await f.provider.destroy();await f.rpc.disconnect()}
});

test('Rejected recipients roll back issuance, allowing a later valid mint',async()=>{
 const f=await fixture();try{
  const {gift,recipient}=f;
  for(const to of [ZeroAddress,await gift.getAddress()]){
   await assert.rejects(async()=>{await(await gift.mintGift(to,{gasLimit:500000})).wait()});
   assert.equal(await gift.issued(),false);
  }
  await(await gift.mintGift(await recipient.getAddress())).wait();assert.equal(await gift.issued(),true);
 }finally{await f.provider.destroy();await f.rpc.disconnect()}
});

test('Factory deployment preserves the chosen issuer; factory and strangers cannot mint',async()=>{
 const f=await fixture(true);try{
  const {rpc,issuer,recipient,stranger,provider}=f;
  await rpc.request({method:'evm_setAccountCode',params:[FACTORY_ADDRESS,FACTORY_RUNTIME]});
  assert.equal((await provider.getCode(FACTORY_ADDRESS)).toLowerCase(),FACTORY_RUNTIME);
  const factory=new ContractFactory(artifact.abi,artifact.bytecode,issuer);
  const creation=await factory.getDeployTransaction('Factory Test Gift','ipfs://test-only/factory.json',true,await issuer.getAddress());
  const salt=id('mement-local-factory-test');const data=concat([salt,creation.data]);const predicted=getCreate2Address(FACTORY_ADDRESS,salt,keccak256(creation.data));
  await(await stranger.sendTransaction({to:FACTORY_ADDRESS,data})).wait();
  const deployed=new Contract(predicted,artifact.abi,issuer);
  assert.equal(await deployed.issuer(),await issuer.getAddress());
  const runtime=await provider.getCode(predicted);assert(matchesBirthdayRuntime(runtime,artifact));assert(!matchesBirthdayRuntime('0x00'+runtime.slice(4),artifact));
  await rejects(deployed.connect(stranger),'mintGift',[await recipient.getAddress()],'IssuerOnly');
  await(await deployed.mintGift(await recipient.getAddress())).wait();assert.equal(await deployed.ownerOf(1),await recipient.getAddress());
  await rejects(deployed.connect(recipient),'transferFrom',[await recipient.getAddress(),await stranger.getAddress(),1],'Soulbound');
  await assert.rejects(async()=>{await(await issuer.sendTransaction({to:FACTORY_ADDRESS,data,gasLimit:3000000})).wait()});
  assert.equal(await deployed.issuer(),await issuer.getAddress());
 }finally{await f.provider.destroy();await f.rpc.disconnect()}
});
