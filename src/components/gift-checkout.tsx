'use client';
import VaultFields from './vault-fields';
import { parseVaultDraft, type VaultDraft } from '../domain/vault-gift';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { artworkImage } from '../domain/catalog';
import type { Artwork } from '../domain/catalog';
import { describeArtworkPolicy } from '../domain/artwork-policy';
import type { PublicDemoOrder } from '../domain/orders';

type PaperTone = 'graphite' | 'rice' | 'slate';
const PAPER_OPTIONS: ReadonlyArray<{ id: PaperTone; label: string; swatch: string }> = [
  { id: 'graphite', label: '石墨暗卡', swatch: '#1a1c20' },
  { id: 'rice', label: '宣纸暖白', swatch: '#f1eee7' },
  { id: 'slate', label: '雾灰石卡', swatch: '#272b33' },
];

type SavedOrder = { order: PublicDemoOrder; sharePath: string };
const SEAL_HOLD_MS = 1200;

function drawInvitationCard(options: {
  artworkTitle: string;
  artworkName: string;
  recipient: string;
  dateText: string;
  shareUrl: string;
  isDemo: boolean;
}): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Neutral graphite architectural background
  ctx.fillStyle = '#121315';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle overhead gallery light
  const glow = ctx.createRadialGradient(540, 120, 40, 540, 260, 620);
  glow.addColorStop(0, 'rgba(255,255,255,0.08)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Hairline outer architectural frame
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(56, 56, 968, 1238);

  // Inner subtle frame
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.strokeRect(72, 72, 936, 1206);

  // Brand header
  ctx.fillStyle = '#f2f2ef';
  ctx.font = '400 26px "Hanken", -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('M E M E N T', 540, 152);

  // Top divider line
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.moveTo(460, 186);
  ctx.lineTo(620, 186);
  ctx.stroke();

  // Recessed miniature seal emblem
  ctx.fillStyle = '#17191d';
  ctx.fillRect(360, 270, 360, 400);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.strokeRect(360, 270, 360, 400);

  // Linear overhead light bar inside emblem
  const bar = ctx.createLinearGradient(440, 271, 640, 271);
  bar.addColorStop(0, 'rgba(255,255,255,0)');
  bar.addColorStop(0.5, 'rgba(255,255,255,0.92)');
  bar.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = bar;
  ctx.fillRect(440, 271, 200, 3);

  // Circular architectural seal stamp
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(540, 470, 62, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(540, 470, 50, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f2f2ef';
  ctx.font = '400 16px ui-monospace, Menlo, monospace';
  ctx.fillText('SEALED', 540, 476);

  // Invitation copy
  ctx.fillStyle = '#8e9199';
  ctx.font = '400 18px ui-monospace, Menlo, monospace';
  ctx.fillText('A LITTLE SOMETHING, JUST FOR YOU', 540, 760);

  ctx.fillStyle = '#f2f2ef';
  ctx.font = '400 46px Georgia, "Songti SC", serif';
  ctx.fillText('有人为你，留了一件作品。', 540, 836);

  ctx.fillStyle = '#b4b7be';
  ctx.font = '400 24px Georgia, "Songti SC", serif';
  ctx.fillText(`To ${options.recipient || 'You'}`, 540, 902);

  // Metadata strip
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.moveTo(150, 976);
  ctx.lineTo(930, 976);
  ctx.stroke();

  ctx.fillStyle = '#989ba3';
  ctx.font = '400 18px ui-monospace, Menlo, monospace';
  ctx.fillText(`${options.artworkTitle}  ·  ${options.artworkName.toUpperCase()}`, 540, 1030);
  ctx.fillStyle = '#6c7078';
  ctx.font = '400 16px ui-monospace, Menlo, monospace';
  ctx.fillText(`SEALED ON ${options.dateText}  ·  NO LOGIN REQUIRED TO OPEN`, 540, 1068);

  // Share link box
  ctx.fillStyle = '#17181c';
  ctx.fillRect(140, 1118, 800, 68);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.strokeRect(140, 1118, 800, 68);

  ctx.fillStyle = '#dcdfe4';
  ctx.font = '400 17px ui-monospace, Menlo, monospace';
  const displayUrl = options.shareUrl.length > 56 ? options.shareUrl.slice(0, 53) + '…' : options.shareUrl;
  ctx.fillText(displayUrl, 540, 1158);

  // Footer boundary note
  ctx.fillStyle = '#6c7078';
  ctx.font = '400 14px ui-monospace, Menlo, monospace';
  ctx.fillText(
    options.isDemo ? 'MEMENT BOUTIQUE · DEMO PREVIEW INVITATION' : 'MEMENT BOUTIQUE · BNB SMART CHAIN',
    540,
    1242,
  );

  return canvas.toDataURL('image/png');
}

export default function GiftCheckout({ artwork, testnetAvailable }: { artwork: Artwork; testnetAvailable?: boolean }) {
  const [step, setStep] = useState<'artwork' | 'compose' | 'review' | 'saved'>('artwork');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('生日快乐。\n愿新的一岁，有喜欢的风景，\n有一起前行的人，也有不断出发的勇气。');
  const [vault, setVault] = useState<VaultDraft>();
  const [paper, setPaper] = useState<PaperTone>('graphite');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<SavedOrder | null>(null);
  const [copied, setCopied] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState('');
  const [sealProgress, setSealProgress] = useState(0);
  const [sealing, setSealing] = useState(false);

  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const holdRaf = useRef<number | null>(null);
  const holdStart = useRef<number>(0);

  const todayText = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.');

  function cancelHold() {
    if (holdRaf.current !== null) {
      cancelAnimationFrame(holdRaf.current);
      holdRaf.current = null;
    }
    setSealing(false);
    setSealProgress(0);
  }

  useEffect(() => () => cancelHold(), []);

  function go(next: typeof step) {
    cancelHold();
    setStep(next);
    setError('');
    requestAnimationFrame(() => heading.current?.focus());
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { setVault(parseVaultDraft(vault)); go('review'); }
    catch (failure) { setError((failure as Error).message); }
  }

  function buildSharePath(rawSharePath: string) {
    if (paper === 'graphite') return rawSharePath;
    const sep = rawSharePath.includes('?') ? '&' : '?';
    return `${rawSharePath}${sep}paper=${paper}`;
  }

  async function save() {
    if (pending) return;
    setPending(true);
    setError('');
    const input = { artworkId: artwork.id, recipient, message, vault };
    const fingerprint = JSON.stringify(input);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
    try {
      const response = await fetch('/api/demo/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.current.key }, body: fingerprint,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '暂时无法生成预览。');
      const finalSharePath = buildSharePath(result.sharePath);
      setSaved({ order: result.order, sharePath: finalSharePath });
      try {
        const fullUrl = new URL(finalSharePath, window.location.origin).href;
        const cardData = drawInvitationCard({
          artworkTitle: artwork.title,
          artworkName: artwork.name,
          recipient: recipient.trim() || result.order.recipient,
          dateText: todayText,
          shareUrl: fullUrl,
          isDemo: true,
        });
        setInvitationUrl(cardData);
      } catch {
        setInvitationUrl('');
      }
      go('saved');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '网络连接中断，请重试。');
    } finally {
      setPending(false);
      cancelHold();
    }
  }

  function startHold() {
    if (pending || sealing) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      void save();
      return;
    }
    setSealing(true);
    holdStart.current = performance.now();
    const tick = (now: number) => {
      const ratio = Math.min(1, (now - holdStart.current) / SEAL_HOLD_MS);
      setSealProgress(ratio);
      if (ratio >= 1) {
        holdRaf.current = null;
        void save();
        return;
      }
      holdRaf.current = requestAnimationFrame(tick);
    };
    holdRaf.current = requestAnimationFrame(tick);
  }

  async function copyLink() {
    if (!saved) return;
    try {
      await navigator.clipboard.writeText(new URL(saved.sharePath, window.location.origin).href);
      setCopied(true);
    } catch { setError('请长按下方链接复制。'); }
  }

  function downloadInvitation() {
    if (!invitationUrl || !saved) return;
    const anchor = document.createElement('a');
    anchor.href = invitationUrl;
    anchor.download = `mement-invitation-${saved.order.id.slice(0, 8)}.png`;
    anchor.click();
  }

  const policyText = describeArtworkPolicy(artwork.policy);
  const ringCircumference = 2 * Math.PI * 15;
  const ringOffset = ringCircumference * (1 - sealProgress);

  return <div className="platform-page counter-page">
    <header className="boutique-header counter-header">
      <Link className="counter-back" href="/#gifts">← 返回展厅</Link>
      <Link className="boutique-brand" href="/">MEMENT</Link>
      <Link className="counter-wallet" href="/wallet">钱包</Link>
    </header>
    <main className="counter-layout" id="main">
      <section className="counter-stage" aria-label="作品展龛">
        <div className="boutique-niche counter-niche">
          <span className="niche-spill" aria-hidden="true"><img src={artworkImage(artwork)} alt=""/></span>
          <span className="niche-media"><img src={artworkImage(artwork)} alt={artwork.title} className={artwork.cutout ? 'is-cutout' : ''}/></span>
        </div>
        <p className="counter-spec">
          EDITION {artwork.editionLimit} · {policyText} · BNB SMART CHAIN
        </p>
      </section>

      <section className="counter-desk">
        <div className="counter-desk-inner">
          <ol className="checkout-steps counter-steps" aria-label="赠礼进度">
            {['作品', '写信', '封缄', '递出'].map((label, index) => (
              <li key={label} aria-current={index === ['artwork', 'compose', 'review', 'saved'].indexOf(step) ? 'step' : undefined}>
                <span>0{index + 1}</span>{label}
              </li>
            ))}
          </ol>

          <p className="counter-eyebrow">
            {step === 'artwork' ? `${artwork.name.toUpperCase()} · ${artwork.cover ? 'CURATED OBJECT' : 'CONCEPT OBJECT'}` : step === 'compose' ? 'STATIONERY · 柜台手记卡片' : step === 'review' ? 'HOLD TO SEAL · 郑重封缄' : 'SEALED · 礼盒已封缄备妥'}
          </p>
          <h1 ref={heading} tabIndex={-1}>
            {step === 'artwork' ? artwork.title : step === 'compose' ? '落笔写一张卡片。' : step === 'review' ? '按住封缄，递出心意。' : '一份心意，已封缄备妥。'}
          </h1>
          <p className="counter-byline">{artwork.artist}{!artwork.cover && ' · 示例署名'} · {artwork.price} BNB{artwork.cover && !artwork.showcase ? '' : '（演示）'}</p>

          {step === 'artwork' && <>
            <p className="checkout-story">{artwork.story}</p>
            <dl className="checkout-facts">
              <div><dt>创作者</dt><dd>{artwork.artist}{!artwork.cover && ' · 示例署名'}</dd></div>
              <div><dt>发行上限</dt><dd>{artwork.editionLimit} 份{!artwork.cover && ' · 示例版数'}</dd></div>
              <div><dt>作品媒介</dt><dd>数字图像 NFT</dd></div>
              <div><dt>发行规则</dt><dd>{policyText}</dd></div>
            </dl>
            <div className="counter-actions">
              <button className="boutique-btn boutique-btn-full" onClick={() => go('compose')}>在柜台准备这份礼物 <span aria-hidden="true">→</span></button>
              {testnetAvailable && <Link className="boutique-btn boutique-btn-subtle boutique-btn-full" href={'/wallet?artwork=' + artwork.id}>通过测试网链上赠礼 <span aria-hidden="true">↗</span></Link>}
            </div>
            <p className="checkout-note">{testnetAvailable ? '测试版已发行，可使用 tBNB 体验链上铸造与直接送达。' : '现可体验柜台写信与开箱预览，作品链上发行后开放购买。'}</p>
          </>}

          {step === 'compose' && <form onSubmit={review} className="checkout-form">
            <div className="paper-picker" role="radiogroup" aria-label="选择信纸纸色">
              <span className="paper-picker-label">信纸纸色</span>
              <div className="paper-swatches">
                {PAPER_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={paper === opt.id}
                    className={`paper-swatch-btn ${paper === opt.id ? 'is-selected' : ''}`}
                    onClick={() => setPaper(opt.id)}
                  >
                    <span className="paper-swatch-dot" style={{ background: opt.swatch }} aria-hidden="true"/>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`counter-stationery stationery-card paper-${paper}`}>
              <div className="stationery-card-head">
                <span>MEMENT · NOTE CARD</span>
                <span>{todayText}</span>
              </div>
              <div className="stationery-field">
                <label htmlFor="gift-recipient">TO · 收礼人的 .ai 名称或 BSC 地址</label>
                <input id="gift-recipient" required maxLength={100} autoComplete="off" spellCheck={false} value={recipient} onChange={event => setRecipient(event.target.value)} placeholder="例如 curiosity.ai 或 0x…"/>
              </div>
              <div className="stationery-field">
                <label htmlFor="gift-message">A NOTE TO ACCOMPANY THE OBJECT · 附言</label>
                <textarea id="gift-message" rows={5} maxLength={280} value={message} onChange={event => setMessage(event.target.value)}/>
                <div className="stationery-card-foot">
                  <span>— 演示赠送人</span>
                  <span className="checkout-count">{message.length} / 280</span>
                </div>
              </div>
            </div>

            <VaultFields value={vault} onChange={setVault} enabled={artwork.policy.holderCanBurn} demo/>
            <p className="checkout-note">你此刻写下的排版与纸色，就是对方启封时见到的实体卡片模样。</p>
            <div className="counter-actions">
              <button className="boutique-btn boutique-btn-full" type="submit">前往柜台封缄 <span aria-hidden="true">→</span></button>
              <button className="boutique-link counter-back-step" type="button" onClick={() => go('artwork')}>← 返回作品详情</button>
            </div>
          </form>}

          {step === 'review' && <>
            <div className={`counter-stationery stationery-card paper-${paper}`}>
              <div className="stationery-card-head">
                <span>TO {recipient || 'YOU'}</span>
                <span>{todayText}</span>
              </div>
              <blockquote className="stationery-quote">{message || '这份心意，留在作品里。'}</blockquote>
              <div className="stationery-card-foot">
                <span>— 演示赠送人</span>
                <span>{artwork.title}</span>
              </div>
            </div>

            <dl className="checkout-facts counter-facts-tight">
              <div><dt>送出作品</dt><dd>{artwork.title}</dd></div>
              <div><dt>收礼人</dt><dd>{recipient}</dd></div>
              <div><dt>发行规则</dt><dd>{policyText}</dd></div>
              {vault && <div><dt>模拟内封资产</dt><dd>{vault.amount} {vault.kind === 'native' ? 'BNB' : '代币'} · 演示</dd></div>}
              <div><dt>作品价格</dt><dd>{artwork.price} BNB · {artwork.cover && !artwork.showcase ? '陈列价格' : '演示价格'}</dd></div>
            </dl>

            <div className="seal-control">
              <button
                type="button"
                className={`seal-hold-btn ${sealing ? 'is-sealing' : ''}`}
                disabled={pending}
                onPointerDown={startHold}
                onPointerUp={cancelHold}
                onPointerLeave={cancelHold}
                onPointerCancel={cancelHold}
                onKeyDown={event => {
                  if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault();
                    startHold();
                  }
                }}
                onKeyUp={event => {
                  if (event.key === ' ' || event.key === 'Enter') cancelHold();
                }}
              >
                <span className="seal-progress-fill" style={{ transform: `scaleX(${sealProgress})` }} aria-hidden="true"/>
                <span className="seal-btn-content">
                  <svg className="seal-ring" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
                    <circle cx="18" cy="18" r="15" className="seal-ring-track"/>
                    <circle cx="18" cy="18" r="15" className="seal-ring-arc" strokeDasharray={ringCircumference} strokeDashoffset={ringOffset}/>
                  </svg>
                  <span>
                    {pending ? '正在盖印封缄…' : sealing ? '保持按住 · 正在封缄…' : '长按 1.2 秒 · 封缄并生成礼盒'}
                  </span>
                </span>
              </button>
              <button type="button" className="boutique-link counter-quick-seal" disabled={pending} onClick={() => void save()}>
                或轻点直接封缄 →
              </button>
            </div>

            <p className="checkout-note">正式购买将由钱包确认支付与铸造，另需网络费。此处生成有效期 7 天的本地演示链接，收礼人无需登录即可启封。</p>
            <button className="boutique-link counter-back-step" disabled={pending} onClick={() => go('compose')}>← 返回修改信笺</button>
          </>}

          {step === 'saved' && saved && <>
            <p className="checkout-story">礼盒已封缄妥当。你可以直接发送链接，或保存下方取礼邀请函卡片递给对方。</p>
            {invitationUrl && <div className="invitation-preview">
              <img src={invitationUrl} alt="Mement 取礼邀请函预览"/>
            </div>}
            <div className="counter-actions">
              <Link className="boutique-btn boutique-btn-full" href={saved.sharePath}>亲自体验启封预览 <span aria-hidden="true">↗</span></Link>
              {invitationUrl && <button type="button" className="boutique-btn boutique-btn-subtle boutique-btn-full" onClick={downloadInvitation}>保存取礼邀请函卡片 (PNG) <span aria-hidden="true">↓</span></button>}
              <button type="button" className="boutique-btn boutique-btn-subtle boutique-btn-full" onClick={copyLink}>{copied ? '链接已复制' : '复制启封链接'}</button>
            </div>
            <p className="checkout-note">演示预览已保存，尚未支付、铸造或赠送 NFT。链接有效期至 {new Date(saved.order.expiresAt).toLocaleDateString('zh-CN')}。</p>
            <Link className="checkout-share" href={saved.sharePath}>{saved.sharePath}</Link>
          </>}

          {error && <p className="error" role="alert">{error}</p>}
        </div>
      </section>
    </main>
  </div>;
}
