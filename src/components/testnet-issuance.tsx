'use client';
import { useState } from 'react';
import Link from 'next/link';
import { prepareTestnetRelease, bindTestnetRelease } from '../app/ops/actions';

export default function TestnetIssuance({ id, title, price, deploy }: {
  id: string; title: string; price: string; deploy: (data: string) => Promise<string>;
}) {
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
        if ('error' in result) throw new Error(result.error);
        setHash(await deploy(result.data));
      } else {
        const result = await bindTestnetRelease(id, artist, platform, hash);
        if ('error' in result) throw new Error(result.error);
        setContract(result.contract);
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : '测试发行操作未完成。'); }
    finally { setBusy(false); }
  }
  return <section className="wallet-test-gift"><h2>测试发行 · {title}</h2>
    <p>售价 {price} tBNB。部署时由钱包确认测试网手续费，核验通过后开放测试赠礼。</p>
    {contract ? <><p role="status">测试版已发行</p><Link href={'/gifts/' + id}>查看作品 ↗</Link></> :
      <div className="checkout-form">
        <label htmlFor="issue-artist">创作者收款地址</label><input id="issue-artist" value={artist} disabled={busy} onChange={event => setArtist(event.target.value.trim())}/>
        <label htmlFor="issue-platform">平台收款地址</label><input id="issue-platform" value={platform} disabled={busy} onChange={event => setPlatform(event.target.value.trim())}/>
        <button className="button primary" disabled={busy || !!hash || !artist || !platform} onClick={() => void run('deploy')}>用钱包部署测试版 ↗</button>
        <label htmlFor="issue-hash">部署交易哈希</label><input id="issue-hash" value={hash} disabled={busy} onChange={event => setHash(event.target.value.trim())}/>
        <button className="button outline" disabled={busy || !hash || !artist || !platform} onClick={() => void run('bind')}>核验并绑定测试版</button>
      </div>}
    {busy && <p role="status">正在处理测试发行…</p>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
