// Upstream: https://github.com/Arachnid/deterministic-deployment-proxy
// Address and runtime reproduced from upstream deployment transaction, checked
// against two independent BSC RPC endpoints before any real preparation.
export const FACTORY_ADDRESS='0x4e59b44847b379578588920ca78fbf26c0b4956c';
export const FACTORY_RUNTIME='0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3';
export const BSC_RPC_ENDPOINTS=['https://bsc-dataseed.bnbchain.org','https://bsc-dataseed1.bnbchain.org'];
export async function checkFactory(provider){
 const chainId=(await provider.getNetwork()).chainId;
 if(chainId!==56n)throw new Error('Expected BSC mainnet chain 56.');
 const code=await provider.getCode(FACTORY_ADDRESS);
 if(code.toLowerCase()!==FACTORY_RUNTIME)throw new Error('Factory runtime does not match upstream.');
 return {chainId:Number(chainId),factory:FACTORY_ADDRESS,codeVerified:true};
}

export function matchesBirthdayRuntime(actual,artifact){
 if(actual.length!==artifact.deployedBytecode.length)return false;
 const normalize=hex=>{
  const bytes=hex.slice(2).match(/../g)??[];
  for(const refs of Object.values(artifact.immutableReferences??{}))for(const {start,length} of refs)bytes.fill('00',start,start+length);
  return bytes.join('').toLowerCase();
 };
 return normalize(actual)===normalize(artifact.deployedBytecode);
}
