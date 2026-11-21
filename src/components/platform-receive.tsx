'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { artworkImage } from '../domain/catalog';
import type { PublicDemoOrder } from '../domain/orders';
import { describeArtworkPolicy } from '../domain/artwork-policy';
import { testnet } from '../lib/testnet';

type ReceiveGift = Pick<PublicDemoOrder, 'id' | 'artwork' | 'recipient' | 'message' | 'createdAt'> & { sender: string };
export default function PlatformReceive({ order, transaction }: { order: ReceiveGift; transaction?: string }) {
  const [phase, setPhase] = useState<'sealed' | 'opening' | 'open'>('sealed');
  const [copied, setCopied] = useState(false);
  const letter = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (phase !== 'opening') return;
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1400;
    const timer = setTimeout(() => setPhase('open'), delay);
    return () => clearTimeout(timer);
  }, [phase]);
  useEffect(() => { if (phase === 'open') letter.current?.focus({ preventScroll: true }); }, [phase]);
  async function copy() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); }
    catch { setCopied(false); }
  }
  return <main className={'platform-receive platform-receive-' + phase}>
    <p className="platform-preview-notice">{transaction ? 'BNB Smart Chain 测试网 · 已确认铸造' : '收礼体验预览 · 尚未铸造或发送 NFT'}</p>
    {phase !== 'open' ? <section className="platform-unbox">
      <p className="eyebrow">A LITTLE SOMETHING, JUST FOR YOU</p>
      <button className="platform-parcel" disabled={phase === 'opening'} onClick={() => setPhase('opening')} aria-label="打开这份礼物"><img src={'/cryptogift/' + (phase === 'opening' ? 'gift-open.png' : 'gift.png')} alt=""/></button>
      <h1>{phase === 'opening' ? '心意，正在展开。' : '有人为你，留了一份心意。'}</h1>
      <p>{phase === 'opening' ? ' ' : '轻点礼盒，打开看看'}</p>
    </section> : <section className="platform-received-layout">
      <figure><img src={artworkImage(order.artwork)} alt={order.artwork.title} className={order.artwork.cutout ? 'cutout' : ''}/><figcaption>{order.artwork.name} / {order.artwork.title}</figcaption></figure>
      <div className="platform-received-letter"><p className="eyebrow">A NOTE, JUST FOR YOU</p><h1 ref={letter} tabIndex={-1}>To {order.recipient}</h1><p className="platform-message">{order.message || '这份心意，留在作品里。'}</p><p className="platform-signature">— {order.sender}<time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}</time></p>
        <details className="platform-provenance"><summary>关于这件作品</summary><dl><div><dt>创作者</dt><dd>{order.artwork.artist}{!order.artwork.cover && ' · 示例署名'}</dd></div><div><dt>发行规则</dt><dd>{describeArtworkPolicy(order.artwork.policy)}</dd></div><div><dt>{transaction ? 'NFT 编号' : '预览编号'}</dt><dd>{order.id}</dd></div><div><dt>链上记录</dt><dd>{transaction ? <a href={testnet.explorer + "/tx/" + transaction} target="_blank" rel="noreferrer">查看测试网交易 ↗</a> : "当前为演示，尚无交易记录"}</dd></div></dl></details>
        <button className="text-link" onClick={copy}>{copied ? '链接已复制' : '复制礼物链接 ↗'}</button>
      </div>
    </section>}
    <Link className="platform-receive-home" href="/">Mement · 也为一个人挑选礼物 ↗</Link>
  </main>;
}
