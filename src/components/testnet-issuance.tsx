'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../lib/i18n';
import { prepareTestnetRelease, bindTestnetRelease } from '../app/ops/actions';

export default function TestnetIssuance({ id, title, price, deploy }: {
  id: string; title: string; price: string; deploy: (data: string) => Promise<string>;
}) {
  const { t } = useLanguage();
  const [artist, setArtist] = useState('');
  const [platform, setPlatform] = useState('');
  const [hash, setHash] = useState('');
  const [contract, setContract] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function run(action: 'deploy' | 'bind') {
    setBusy(true);
    setError('');
    try {
      if (action === 'deploy') {
        const result = await prepareTestnetRelease(id, artist, platform);
        if ('error' in result) throw new Error(t('Could not prepare the testnet edition. Check the payout addresses.', result.error ?? '测试发行操作未完成。'));
        setHash(await deploy(result.data));
      } else {
        const result = await bindTestnetRelease(id, artist, platform, hash);
        if ('error' in result) throw new Error(t('Could not verify the deployment. Check the transaction hash and testnet confirmations.', result.error ?? '测试发行操作未完成。'));
        setContract(result.contract);
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : t('Could not complete testnet issuance.', '测试发行操作未完成。')); }
    finally { setBusy(false); }
  }
  return <section className="wallet-test-gift"><h2>{t('Testnet issuance · ', '测试发行 · ')}{title}</h2>
    <p>{t('Price ', '售价 ')}{price} tBNB · {t('Confirm the testnet deployment fee in your wallet. Testnet gifting opens once the deployment is verified.', '部署时由钱包确认测试网手续费，核验通过后开放测试赠礼。')}</p>
    {contract ? <><p role="status">{t('Testnet edition issued', '测试版已发行')}</p><Link className="room-button" href={'/gifts/' + id}>{t('View artwork ↗', '查看作品 ↗')}</Link></> :
      <div className="checkout-form">
        <label htmlFor="issue-artist">{t('Creator payout address', '创作者收款地址')}</label><input id="issue-artist" value={artist} disabled={busy} onChange={event => setArtist(event.target.value.trim())}/>
        <label htmlFor="issue-platform">{t('Platform payout address', '平台收款地址')}</label><input id="issue-platform" value={platform} disabled={busy} onChange={event => setPlatform(event.target.value.trim())}/>
        <button className="room-button room-button-primary" disabled={busy || !!hash || !artist || !platform} onClick={() => void run('deploy')}>{t('Deploy testnet edition in wallet ↗', '用钱包部署测试版 ↗')}</button>
        <label htmlFor="issue-hash">{t('Deployment transaction hash', '部署交易哈希')}</label><input id="issue-hash" value={hash} disabled={busy} onChange={event => setHash(event.target.value.trim())}/>
        <button className="room-button" disabled={busy || !hash || !artist || !platform} onClick={() => void run('bind')}>{t('Verify and bind testnet edition', '核验并绑定测试版')}</button>
      </div>}
    {busy && <p role="status">{t('Processing testnet issuance…', '正在处理测试发行…')}</p>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
