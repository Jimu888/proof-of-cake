'use client';
import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { artworkImage } from '../domain/catalog';
import type { Artwork } from '../domain/catalog';
import { describeArtworkPolicy } from '../domain/artwork-policy';
import type { PublicDemoOrder } from '../domain/orders';

type SavedOrder = { order: PublicDemoOrder; sharePath: string };
export default function GiftCheckout({ artwork, testnetAvailable }: { artwork: Artwork; testnetAvailable?: boolean }) {
  const [step, setStep] = useState<'artwork' | 'compose' | 'review' | 'saved'>('artwork');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('生日快乐。\n愿新的一岁，有喜欢的风景，\n有一起前行的人，也有不断出发的勇气。');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<SavedOrder | null>(null);
  const [copied, setCopied] = useState(false);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  function go(next: typeof step) {
    setStep(next);
    setError('');
    requestAnimationFrame(() => heading.current?.focus());
  }
  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    go('review');
  }
  async function save() {
    if (pending) return;
    setPending(true);
    setError('');
    const input = { artworkId: artwork.id, recipient, message };
    const fingerprint = JSON.stringify(input);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
    try {
      const response = await fetch('/api/demo/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.current.key }, body: fingerprint,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '暂时无法生成预览。');
      setSaved(result);
      go('saved');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '网络连接中断，请重试。');
    } finally { setPending(false); }
  }
  async function copyLink() {
    if (!saved) return;
    try {
      await navigator.clipboard.writeText(new URL(saved.sharePath, window.location.origin).href);
      setCopied(true);
    } catch { setError('请长按下方链接复制。'); }
  }
  return <div className="platform-page">
    <header className="platform-header"><Link className="brand" href="/">✦ Mement</Link><span>赠礼流程演示 · BNB Smart Chain</span></header>
    <main className="checkout-layout" id="main">
      <div className="checkout-art"><img src={artworkImage(artwork)} alt={artwork.title} className={artwork.cutout ? 'cutout' : ''}/><span>{artwork.name}{artwork.cover ? ' / 创作者作品' : ' / 概念作品'}</span></div>
      <section className="checkout-copy">
        <Link href="/#gifts" className="text-link">← 返回精选作品</Link>
        <ol className="checkout-steps" aria-label="赠礼进度">{['作品', '写信', '核对', '预览'].map((label, index) => <li key={label} aria-current={index === ['artwork', 'compose', 'review', 'saved'].indexOf(step) ? 'step' : undefined}><span>0{index + 1}</span>{label}</li>)}</ol>
        <h1 ref={heading} tabIndex={-1}>{step === 'artwork' ? artwork.title : step === 'compose' ? '为一个特别的人。' : step === 'review' ? '让心意，准确抵达。' : '一份心意，已有了模样。'}</h1>
        {step === 'artwork' && <>
          <p className="checkout-english">{artwork.name}</p><p className="checkout-story">{artwork.story}</p>
          <dl className="checkout-facts"><div><dt>创作者</dt><dd>{artwork.artist}{!artwork.cover && ' · 示例署名'}</dd></div><div><dt>发行计划</dt><dd>{artwork.editionLimit} 份{!artwork.cover && ' · 示例版数'}</dd></div><div><dt>作品形式</dt><dd>数字图像 NFT</dd></div><div><dt>发行规则</dt><dd>{describeArtworkPolicy(artwork.policy)}</dd></div></dl>
          <p className="checkout-price">{artwork.price} <small>BNB · {artwork.cover && !artwork.showcase ? '陈列价格' : '演示价格'}</small></p>
          <button className="button primary" onClick={() => go('compose')}>为 TA 准备这份礼物 <span>↗</span></button>
          {testnetAvailable && <Link className="button outline" href={'/wallet?artwork=' + artwork.id}>测试网购买赠礼 ↗</Link>}
          <p className="checkout-note">{testnetAvailable ? '测试版已发行，可使用 tBNB 体验赠礼。' : '现可预览赠礼体验，作品发行后开放购买。'}</p>
        </>}
        {step === 'compose' && <form onSubmit={review} className="checkout-form">
          <label htmlFor="gift-recipient">收礼人的 .ai 名称或 BSC 地址</label>
          <input id="gift-recipient" required maxLength={100} autoComplete="off" spellCheck={false} value={recipient} onChange={event => setRecipient(event.target.value)} placeholder="例如 curiosity.ai"/>
          <p className="checkout-note">正式赠礼会先解析并核对地址。本次预览仅记录你的输入。</p>
          <label htmlFor="gift-message">写给 TA 的话</label>
          <textarea id="gift-message" rows={5} maxLength={280} value={message} onChange={event => setMessage(event.target.value)}/>
          <span className="checkout-count">{message.length} / 280</span>
          <button className="button primary" type="submit">核对这份礼物 <span>→</span></button>
          <button className="text-link" type="button" onClick={() => go('artwork')}>← 返回作品</button>
        </form>}
        {step === 'review' && <>
          <dl className="checkout-facts"><div><dt>送出的作品</dt><dd>{artwork.title}</dd></div><div><dt>收礼人</dt><dd>{recipient}</dd></div><div><dt>地址核对</dt><dd>待解析 / 待验证</dd></div><div><dt>赠送人</dt><dd>演示赠送人 · 正式赠礼需钱包登录</dd></div><div><dt>发行规则</dt><dd>{describeArtworkPolicy(artwork.policy)}</dd></div><div><dt>作品价格</dt><dd>{artwork.price} BNB · {artwork.cover && !artwork.showcase ? '陈列价格' : '演示价格'}</dd></div></dl>
          <blockquote className="checkout-letter">{message || '这份心意，留在作品里。'}</blockquote>
          <p className="checkout-note">正式购买会由钱包确认支付与铸造，另需网络费。此处将生成有效期 7 天的本地演示链接，可在连接本服务的浏览器中打开。</p>
          <button className="button primary" disabled={pending} onClick={save}>{pending ? '正在保存预览…' : artwork.showcase ? '生成演示订单与收礼预览' : '生成收礼预览'} <span>↗</span></button>
          <button className="text-link" disabled={pending} onClick={() => go('compose')}>← 修改收礼信息</button>
        </>}
        {step === 'saved' && saved && <>
          <p className="checkout-story">拆开礼盒，看看 TA 会遇见怎样的惊喜。</p>
          <p className="checkout-note">演示预览已保存，尚未支付、铸造或赠送 NFT。链接有效期至 {new Date(saved.order.expiresAt).toLocaleDateString('zh-CN')}。</p>
          <Link className="button primary" href={saved.sharePath}>打开收礼预览 <span>↗</span></Link>
          <button className="button outline" onClick={copyLink}>{copied ? '链接已复制' : '复制预览链接'}</button>
          <Link className="checkout-share" href={saved.sharePath}>{saved.sharePath}</Link>
        </>}
        {error && <p className="error" role="alert">{error}</p>}
      </section>
    </main>
  </div>;
}
