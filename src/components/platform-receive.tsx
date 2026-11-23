'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import Link from 'next/link';
import { artworkImage } from '../domain/catalog';
import type { PublicDemoOrder } from '../domain/orders';
import { describeArtworkPolicy } from '../domain/artwork-policy';
import VaultPlaque from './vault-plaque';
import type { VaultAsset } from '../domain/vault-gift';
import { testnet } from '../lib/testnet';

type PaperTone = 'graphite' | 'rice' | 'slate';
type ReceiveGift = Pick<PublicDemoOrder, 'id' | 'artwork' | 'recipient' | 'message' | 'createdAt' | 'vault'> & { sender: string };

export default function PlatformReceive({ order, transaction, chainVault }: { order: ReceiveGift; transaction?: string; chainVault?: VaultAsset }) {
  const [simulatedRedeemed, setSimulatedRedeemed] = useState(false);
  const redeemed = simulatedRedeemed || !!chainVault?.redeemed;
  const [phase, setPhase] = useState<'sealed' | 'lighting' | 'open'>('sealed');
  const [paper, setPaper] = useState<PaperTone>('graphite');
  const [slideProgress, setSlideProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [copied, setCopied] = useState(false);

  const letter = useRef<HTMLHeadingElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const param = new URLSearchParams(window.location.search).get('paper');
      if (param === 'rice' || param === 'slate' || param === 'graphite') setPaper(param);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (phase !== 'lighting') return;
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1150;
    const timer = setTimeout(() => setPhase('open'), delay);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'open') letter.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  function triggerUnseal() {
    if (phase !== 'sealed') return;
    setSlideProgress(1);
    setDragging(false);
    setPhase('lighting');
  }

  function updateSlideFromClientX(clientX: number) {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const usable = Math.max(1, rect.width - 52);
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left - 26) / usable));
    setSlideProgress(ratio);
    if (ratio >= 0.76) {
      triggerUnseal();
    }
  }

  function onSliderDown(event: PointerEvent<HTMLDivElement>) {
    if (phase !== 'sealed') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updateSlideFromClientX(event.clientX);
  }

  function onSliderMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging || phase !== 'sealed') return;
    updateSlideFromClientX(event.clientX);
  }

  function onSliderUp() {
    if (!dragging) return;
    setDragging(false);
    if (phase === 'sealed') setSlideProgress(0);
  }

  async function copy() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); }
    catch { setCopied(false); }
  }

  const dateText = new Date(order.createdAt).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.');
  const policyText = describeArtworkPolicy(order.artwork.policy);

  return <main className={`platform-receive platform-receive-${phase}${redeemed ? ' gift-redeemed' : ''}`}>
    <p className="platform-preview-notice">
      {transaction ? 'BNB SMART CHAIN 测试网 · 已确认铸造' : '收礼体验预览 · 尚未铸造或发送 NFT'}
    </p>

    {phase === 'sealed' && <section className="unseal-stage" aria-label="启封礼盒">
      <div className="unseal-envelope">
        <span className="unseal-strip-line" aria-hidden="true"/>
        <p className="unseal-eyebrow">A LITTLE SOMETHING, JUST FOR YOU</p>
        <div className="unseal-emblem" aria-hidden="true">
          <span className="unseal-pulse"/>
          <span>SEALED</span>
        </div>
        <h1>有人为你，留了一件作品。</h1>
        <p className="unseal-parties">From {order.sender} · To {order.recipient}</p>
        <p className="unseal-date">{dateText}</p>

        <div
          ref={trackRef}
          className={`unseal-slider ${dragging ? 'is-dragging' : ''}`}
          role="slider"
          tabIndex={0}
          aria-label="向右滑动以启封礼物"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(slideProgress * 100)}
          onPointerDown={onSliderDown}
          onPointerMove={onSliderMove}
          onPointerUp={onSliderUp}
          onPointerCancel={onSliderUp}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowRight') {
              event.preventDefault();
              triggerUnseal();
            }
          }}
        >
          <span className="unseal-slider-fill" style={{ width: `${Math.max(12, slideProgress * 100)}%` }} aria-hidden="true"/>
          <span className="unseal-slider-thumb" style={{ left: `calc(${slideProgress} * (100% - 48px) + 4px)` }} aria-hidden="true">→</span>
          <span className="unseal-slider-text" style={{ opacity: Math.max(0, 1 - slideProgress * 1.4) }}>向右轻划，启封</span>
        </div>

        <button type="button" className="boutique-link unseal-fallback" onClick={triggerUnseal}>
          或轻点此处启封 →
        </button>
      </div>
    </section>}

    {phase === 'lighting' && <section className="lighting-stage" aria-live="polite">
      <div className="boutique-niche lighting-niche is-illuminating">
        <span className="niche-spill" aria-hidden="true"><img src={artworkImage(order.artwork)} alt=""/></span>
        <span className="niche-media"><img src={artworkImage(order.artwork)} alt={order.artwork.title} className={order.artwork.cutout ? 'is-cutout' : ''}/></span>
      </div>
      <p className="lighting-caption">正在为你点亮展龛…</p>
    </section>}

    {phase === 'open' && <section className="platform-received-layout">
      <figure className="receive-figure">
        <button
          type="button"
          className="boutique-niche receive-niche receive-niche-trigger"
          onClick={() => setLightbox(true)}
          aria-label="进入熄灯全屏凝视模式"
        >
          <span className="niche-spill" aria-hidden="true"><img src={artworkImage(order.artwork)} alt=""/></span>
          <span className="niche-media"><img src={artworkImage(order.artwork)} alt={order.artwork.title} className={order.artwork.cutout ? 'is-cutout' : ''}/></span>
        </button>
        <figcaption className="receive-figcaption">
          <span>{order.artwork.name} / {order.artwork.title}</span>
          <button type="button" className="boutique-link" onClick={() => setLightbox(true)}>熄灯细看 ↗</button>
        </figcaption>
      </figure>

      <div className="platform-received-letter">
        <div className={`stationery-card receive-note-card paper-${paper}`}>
          <div className="stationery-card-head">
            <span>A NOTE, JUST FOR YOU</span>
            <span>{dateText}</span>
          </div>
          <h1 ref={letter} tabIndex={-1}>To {order.recipient}</h1>
          <p className="platform-message">{order.message || '这份心意，留在作品里。'}</p>
          <p className="platform-signature">
            — {order.sender}
            <time dateTime={order.createdAt}>{dateText}</time>
          </p>
        </div>

        <VaultPlaque demo={order.vault} asset={chainVault} purchase={transaction} onDemoRedeemed={() => setSimulatedRedeemed(true)}/>

        <details className="archival-certificate">
          <summary>
            <span>ARCHIVAL CERTIFICATE · 美术馆典藏档案</span>
            <span className="cert-toggle" aria-hidden="true">+</span>
          </summary>
          <div className="cert-body">
            <dl>
              <div><dt>典藏编号</dt><dd className="cert-mono">{order.id}</dd></div>
              <div><dt>作品名称</dt><dd>{order.artwork.title} ({order.artwork.name})</dd></div>
              <div><dt>创作者</dt><dd>{order.artwork.artist}{!order.artwork.cover && ' · 示例署名'}</dd></div>
              <div><dt>赠送人</dt><dd>{order.sender}</dd></div>
              <div><dt>收礼人</dt><dd>{order.recipient}</dd></div>
              <div><dt>发行规则</dt><dd>{policyText}</dd></div>
              <div>
                <dt>链上记录</dt>
                <dd>
                  {transaction
                    ? <a href={testnet.explorer + '/tx/' + transaction} target="_blank" rel="noreferrer">查看 BSC 测试网交易 ↗</a>
                    : '本地演示预览 · 尚未铸造上链'}
                </dd>
              </div>
            </dl>
          </div>
        </details>

        <div className="receive-actions">
          <button type="button" className="boutique-link" onClick={copy}>{copied ? '链接已复制 ✓' : '复制这份礼物链接 ↗'}</button>
        </div>
      </div>
    </section>}

    {lightbox && <div className="receive-lightbox" role="dialog" aria-modal="true" aria-label="熄灯凝视模式" onClick={() => setLightbox(false)}>
      <button type="button" className="lightbox-close" onClick={() => setLightbox(false)}>退出凝视 · ESC</button>
      <div className="boutique-niche lightbox-niche" onClick={event => event.stopPropagation()}>
        <span className="niche-spill" aria-hidden="true"><img src={artworkImage(order.artwork)} alt=""/></span>
        <span className="niche-media"><img src={artworkImage(order.artwork)} alt={order.artwork.title} className={order.artwork.cutout ? 'is-cutout' : ''}/></span>
      </div>
      <p className="lightbox-caption">{order.artwork.title} · {order.artwork.artist}</p>
    </div>}

    <Link className="platform-receive-home" href="/">MEMENT · 也为一个人挑选礼物 ↗</Link>
  </main>;
}
