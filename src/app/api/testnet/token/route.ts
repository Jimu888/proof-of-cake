import { testnetProvider } from '../../../../server/testnet-gifts';
import { readVaultToken } from '../../../../server/testnet-vault';

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get('address') ?? '';
  const headers = { 'Cache-Control': 'no-store' };
  if (!/^0x[0-9a-f]{40}$/i.test(address)) return Response.json({ error: '请输入完整代币合约地址。' }, { status: 400, headers });
  const provider = testnetProvider();
  try {
    if ((await provider.getNetwork()).chainId !== 97n) throw new Error('Wrong network');
    return Response.json(await readVaultToken(provider, address), { headers });
  } catch {
    return Response.json({ error: '测试网上找不到兼容的代币资料。' }, { status: 422, headers });
  } finally { provider.destroy(); }
}
