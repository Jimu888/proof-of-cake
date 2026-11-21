'use server';
import { redirect } from 'next/navigation';
import { getOperations, OperationsError } from '../../server/operations';
import { isOperator, operatorLogin, operatorLogout } from '../../server/operator-auth';
import { getCreatorApplicationRepository } from '../../server/creator-application-repository';
import { ApplicationInputError } from '../../domain/creator-applications';

export async function signIn(form: FormData) {
  redirect(await operatorLogin(String(form.get('key') ?? '')) ? '/ops/creators' : '/ops?error=login');
}
export async function signOut() { await operatorLogout(); redirect('/ops'); }
export async function manage(form: FormData) {
  if (!await isOperator()) redirect('/ops');
  const id = String(form.get('id') ?? '');
  const action = form.get('action');
  let query = '?done=1';
  try {
    if (action === 'approve' || action === 'reject-creator') getCreatorApplicationRepository().review(id, action === 'approve' ? 'approved' : 'rejected');
    else if (action === 'publish' || action === 'reject' || action === 'archive') getOperations().update(id, action, String(form.get('price') ?? ''));
    else throw new OperationsError('操作无效。');
  } catch (error) {
    if (!(error instanceof OperationsError || error instanceof ApplicationInputError)) throw error;
    query = '?error=' + encodeURIComponent(error.message);
  }
  redirect((action === 'approve' || action === 'reject-creator' ? '/ops/creators' : '/ops/works') + query);
}

export async function issueInvite(_previous: string, form: FormData) {
  if (!await isOperator()) return '请重新登录运营后台。';
  try { return getOperations().issue(String(form.get('id') ?? '')); }
  catch (error) { if (error instanceof OperationsError) return error.message; throw error; }
}

export async function importSale(form: FormData) {
  if (!await isOperator()) redirect('/ops');
  const { verifyAndRecordGift, testnetProvider, transactionHashPattern } = await import('../../server/testnet-gifts');
  const hash = String(form.get('hash') ?? '').trim();
  if (!transactionHashPattern.test(hash)) redirect('/ops/sales?error=' + encodeURIComponent('请输入完整的测试网交易哈希。'));
  const provider = testnetProvider();
  let result: string;
  try {
    if (!process.env.MEMENT_TESTNET_CONTRACT && !getOperations().hasReleases()) throw new OperationsError('测试网合约地址尚未配置。');
    if (!await verifyAndRecordGift(provider, hash)) throw new OperationsError('交易未达到确认要求。');
    result = '?done=1';
  } catch (error) {
    result = '?error=' + encodeURIComponent(error instanceof OperationsError ? error.message : '无法核验该测试网交易。');
  } finally { provider.destroy(); }
  redirect('/ops/sales' + result);
}

export async function prepareTestnetRelease(id: string, artist: string, platform: string) {
  if (!await isOperator()) return { error: '请先登录运营后台。' };
  try {
    const { prepareRelease } = await import('../../server/testnet-release');
    return await prepareRelease(id, artist, platform);
  } catch (error) { return { error: error instanceof OperationsError ? error.message : '无法准备发行。' }; }
}

export async function bindTestnetRelease(id: string, artist: string, platform: string, hash: string) {
  if (!await isOperator()) return { error: '请先登录运营后台。' };
  try {
    const { verifyRelease } = await import('../../server/testnet-release');
    const release = await verifyRelease(id, artist, platform, hash);
    getOperations().bindRelease(release);
    return { contract: release.contract };
  } catch (error) { return { error: error instanceof OperationsError ? error.message : '无法核验部署交易。' }; }
}

export async function settleDemo(form: FormData) {
  if (!await isOperator()) redirect('/ops');
  const changed = getOperations().settleDemoSale(String(form.get('id') ?? ''));
  redirect('/ops/sales?demo=1' + (changed ? '&done=1' : '') + '#demo-sales');
}
