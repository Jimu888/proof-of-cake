'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ZODIAC_FILTERS,
  ZODIAC_LIST,
  getZodiacById,
  isActiveZodiacId,
  type ActiveZodiacId,
  type ZodiacFilter,
  type ZodiacSpec,
} from '../domain/zodiac';

import VaultFields from './vault-fields';
import VaultPlaque from './vault-plaque';
import { parseVaultDraft, type VaultDraft } from '../domain/vault-gift';
import { zodiacSeries } from '../domain/series';

const ZodiacStage = dynamic(() => import('./zodiac-stage'), {
  ssr: false,
  loading: () => <div className="zodiac-stage-loading">正在初始化 3D 光学展台…</div>,
});

type PaperTone = 'graphite' | 'rice' | 'slate';
const PAPER_OPTIONS: ReadonlyArray<{ id: PaperTone; label: string; swatch: string }> = [
  { id: 'graphite', label: '石墨暗卡', swatch: '#1a1c20' },
  { id: 'rice', label: '宣纸暖白', swatch: '#f1eee7' },
  { id: 'slate', label: '雾灰石卡', swatch: '#272b33' },
];

const SEAL_HOLD_MS = 1200;

function isFilter(value: string | null): value is ZodiacFilter {
  return value === 'original' || value === 'obsidian' || value === 'hologram' || value === 'emerald';
}

function isPaper(value: string | null): value is PaperTone {
  return value === 'graphite' || value === 'rice' || value === 'slate';
}

function drawZodiacInvitationCard(options: {
  spec: ZodiacSpec;
  recipient: string;
  sender: string;
  dateText: string;
  shareUrl: string;
}): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#070a0f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle 36px cold grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Outer frame + L-corners
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.strokeRect(56, 56, 968, 1238);

  const drawCorner = (x: number, y: number, dx: number, dy: number) => {
    ctx.strokeStyle = 'rgba(245,200,108,0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + dx * 28, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * 28);
    ctx.stroke();
  };
  drawCorner(56, 56, 1, 1);
  drawCorner(1024, 56, -1, 1);
  drawCorner(56, 1294, 1, -1);
  drawCorner(1024, 1294, -1, -1);

  ctx.fillStyle = '#f2f2ef';
  ctx.font = '400 26px "Hanken", -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('M E M E N T  ·  G E N E S I S  Z O D I A C', 540, 146);

  // Cinnabar digital seal stamp
  ctx.fillStyle = '#a52420';
  ctx.fillRect(470, 230, 140, 140);
  ctx.strokeStyle = '#d44d46';
  ctx.lineWidth = 2;
  ctx.strokeRect(470, 230, 140, 140);
  ctx.strokeStyle = 'rgba(7,10,15,0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(479, 239, 122, 122);

  const chars = Array.from(options.spec.sealText);
  ctx.fillStyle = '#f9ebe6';
  ctx.font = '400 42px Georgia, "Songti SC", serif';
  ctx.fillText(`${chars[0] ?? ''}${chars[1] ?? ''}`, 540, 294);
  ctx.fillText(`${chars[2] ?? ''}${chars[3] ?? ''}`, 540, 344);

  ctx.fillStyle = options.spec.accentHex;
  ctx.font = '400 20px ui-monospace, Menlo, monospace';
  ctx.fillText(`${options.spec.yearTag}  ·  ${options.spec.cryptoTheme.toUpperCase()}`, 540, 456);

  ctx.fillStyle = '#f2f2ef';
  ctx.font = '400 54px Georgia, "Songti SC", serif';
  ctx.fillText(`${options.spec.nameCn} · 链上生日礼`, 540, 536);

  ctx.fillStyle = '#b7bcc6';
  ctx.font = '400 26px Georgia, "Songti SC", serif';
  ctx.fillText(`To ${options.recipient || 'You'}`, 540, 616);

  ctx.fillStyle = '#8b909a';
  ctx.font = '400 20px Georgia, "Songti SC", serif';
  ctx.fillText(`From ${options.sender || 'Mement'} · 划开封条即可启封 3D 藏品`, 540, 668);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(160, 756);
  ctx.lineTo(920, 756);
  ctx.stroke();

  ctx.fillStyle = '#989ba3';
  ctx.font = '400 18px ui-monospace, Menlo, monospace';
  ctx.fillText(`${options.spec.blockHeight}  ·  SEALED ON ${options.dateText}`, 540, 822);

  // URL strip
  ctx.fillStyle = '#101520';
  ctx.fillRect(130, 888, 820, 74);
  ctx.strokeStyle = 'rgba(245,200,108,0.28)';
  ctx.strokeRect(130, 888, 820, 74);

  ctx.fillStyle = '#e5e7ec';
  ctx.font = '400 16px ui-monospace, Menlo, monospace';
  const displayUrl = options.shareUrl.length > 56 ? options.shareUrl.slice(0, 53) + '…' : options.shareUrl;
  ctx.fillText(displayUrl, 540, 932);

  ctx.fillStyle = '#6c7078';
  ctx.font = '400 15px ui-monospace, Menlo, monospace';
  ctx.fillText('MEMENT BOUTIQUE · LUMINOUS VOXEL ZODIAC · NO LOGIN REQUIRED', 540, 1226);

  return canvas.toDataURL('image/png');
}

export default function ZodiacStudio() {
  const [activeSign, setActiveSign] = useState<ActiveZodiacId>('goat');
  const [filter, setFilter] = useState<ZodiacFilter>('original');
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [unsealNonce, setUnsealNonce] = useState(0);
  const [pulseNonce, setPulseNonce] = useState(0);

  const [selectionNotice, setSelectionNotice] = useState('');

  // Blessing modal, stationery paper tone & Hold-to-Seal (1.2s)
  const [blessingOpen, setBlessingOpen] = useState(false);
  const [blessingStep, setBlessingStep] = useState<'compose' | 'sealed'>('compose');
  const [vault, setVault] = useState<VaultDraft>();
  const [incomingVault, setIncomingVault] = useState<VaultDraft>();
  const [vaultError, setVaultError] = useState('');
  const [redeemed, setRedeemed] = useState(false);
  const [paper, setPaper] = useState<PaperTone>('graphite');
  const [recipient, setRecipient] = useState('friend.eth');
  const [sender, setSender] = useState('jimu.ai');
  const [customBlessing, setCustomBlessing] = useState('');
  const [sealProgress, setSealProgress] = useState(0);
  const [sealing, setSealing] = useState(false);
  const [sealedUrl, setSealedUrl] = useState('');
  const [invitationUrl, setInvitationUrl] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  // Incoming gift Slide-to-Unseal envelope overlay (when opened via shared link ?sealed=1)
  const [incomingSealed, setIncomingSealed] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [receivedNoteVisible, setReceivedNoteVisible] = useState(false);

  const holdRaf = useRef<number | null>(null);
  const holdStart = useRef<number>(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const spec = getZodiacById(activeSign);
  const effectiveBlessing = customBlessing.trim() || spec.defaultBlessing;
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

  // Hydrate shared gift parameters from URL (?sign=dragon&filter=obsidian&paper=rice&to=...&from=...&msg=...&sealed=1)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const qSign = params.get('sign');
      if (isActiveZodiacId(qSign)) setActiveSign(qSign);
      const qFilter = params.get('filter');
      if (isFilter(qFilter)) setFilter(qFilter);
      const qPaper = params.get('paper');
      if (isPaper(qPaper)) setPaper(qPaper);
      const qTo = params.get('to');
      if (qTo) setRecipient(qTo.slice(0, 80));
      const qFrom = params.get('from');
      if (qFrom) setSender(qFrom.slice(0, 80));
      const qMsg = params.get('msg');
      if (qMsg) setCustomBlessing(qMsg.slice(0, 280));
      if (params.get('sealed') === '1' || params.get('open') === '1') {
        setIncomingSealed(true);
        try {
          if (qSign && isActiveZodiacId(qSign) && params.has('vault')) {
            setIncomingVault(parseVaultDraft(JSON.parse(params.get('vault')!)));
          }
        } catch { /* Invalid optional preview data does not block opening. */ }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!blessingOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelHold();
        setBlessingOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [blessingOpen]);

  function selectZodiac(item: ZodiacSpec) {
    if (!item.available || !isActiveZodiacId(item.id)) {
      setSelectionNotice(`${item.nameCn}（${item.cryptoTheme}）正在制作中 · COMING SOON`);
      return;
    }
    setReceivedNoteVisible(false);
    setRedeemed(false);
    setIncomingVault(undefined);
    setActiveSign(item.id);
    setCustomBlessing('');
    setSelectionNotice('');
    setCopiedShare(false);
    setBlessingStep('compose');
  }

  function buildShareUrl(sealedVault = parseVaultDraft(vault)) {
    const url = new URL(zodiacSeries.route, window.location.origin);
    url.searchParams.set('sign', activeSign);
    if (filter !== 'original') url.searchParams.set('filter', filter);
    if (paper !== 'graphite') url.searchParams.set('paper', paper);
    if (recipient.trim()) url.searchParams.set('to', recipient.trim());
    if (sender.trim()) url.searchParams.set('from', sender.trim());
    if (customBlessing.trim()) url.searchParams.set('msg', customBlessing.trim());
    url.searchParams.set('sealed', '1');
    if (sealedVault) url.searchParams.set('vault', JSON.stringify(sealedVault));
    return url.href;
  }

  function completeSeal() {
    cancelHold();
    let parsed;
    try { parsed = parseVaultDraft(vault); }
    catch (failure) { setVaultError((failure as Error).message); return; }
    setVaultError('');
    setVault(parsed);
    const url = buildShareUrl(parsed);
    setSealedUrl(url);
    try {
      const cardData = drawZodiacInvitationCard({
        spec,
        recipient: recipient.trim() || 'You',
        sender: sender.trim() || 'Mement',
        dateText: todayText,
        shareUrl: url,
      });
      setInvitationUrl(cardData);
    } catch {
      setInvitationUrl('');
    }
    setBlessingStep('sealed');
    setPulseNonce((n) => n + 1);
  }

  function startHoldSeal() {
    if (sealing) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      completeSeal();
      return;
    }
    setSealing(true);
    holdStart.current = performance.now();
    const tick = (now: number) => {
      const ratio = Math.min(1, (now - holdStart.current) / SEAL_HOLD_MS);
      setSealProgress(ratio);
      if (ratio >= 1) {
        holdRaf.current = null;
        completeSeal();
        return;
      }
      holdRaf.current = requestAnimationFrame(tick);
    };
    holdRaf.current = requestAnimationFrame(tick);
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(sealedUrl || buildShareUrl());
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2600);
    } catch {
      setCopiedShare(false);
    }
  }

  function downloadInvitation() {
    if (!invitationUrl) return;
    const anchor = document.createElement('a');
    anchor.href = invitationUrl;
    anchor.download = `mement-zodiac-${activeSign}.png`;
    anchor.click();
  }

  function previewIncomingUnseal() {
    setIncomingVault(vault);
    setRedeemed(false);
    setBlessingOpen(false);
    setSlideProgress(0);
    setDragging(false);
    setReceivedNoteVisible(false);
    setIncomingSealed(true);
  }

  function triggerIncomingUnseal() {
    setSlideProgress(1);
    setDragging(false);
    setIncomingSealed(false);
    setUnsealNonce((n) => n + 1);
    setPulseNonce((n) => n + 1);
    setTimeout(() => setReceivedNoteVisible(true), 1250);
  }

  function updateSlideFromClientX(clientX: number) {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const usable = Math.max(1, rect.width - 52);
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left - 26) / usable));
    setSlideProgress(ratio);
    if (ratio >= 0.76) {
      triggerIncomingUnseal();
    }
  }

  function onSliderDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updateSlideFromClientX(event.clientX);
  }

  function onSliderMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    updateSlideFromClientX(event.clientX);
  }

  function onSliderUp() {
    if (!dragging) return;
    setDragging(false);
    setSlideProgress(0);
  }

  const sealChars = Array.from(spec.sealText);
  const ringCircumference = 2 * Math.PI * 15;
  const ringOffset = ringCircumference * (1 - sealProgress);

  return (
    <div className={`zodiac-page${redeemed ? ' gift-redeemed' : ''}`}>
      <header className="boutique-header zodiac-header">
        <div className="zodiac-header-left">
          <Link className="boutique-brand" href="/">MEMENT</Link>
          <span className="zodiac-header-tag">GENESIS ZODIAC · 十二生肖加密数字礼物</span>
        </div>
        <nav className="boutique-nav" aria-label="主导航">
          <Link href="/">橱窗</Link>
          <Link className="is-active" href="/#series">展厅</Link>
          <Link href="/creators/apply">创作者</Link>
          <Link href="/wallet">钱包</Link>
        </nav>
      </header>

      <main className="zodiac-workspace" id="main">
        <Link className="boutique-link zodiac-breadcrumb" href="/#series">← 返回展厅 / 主题特展 01</Link>
        <section className="zodiac-top-controls" aria-label="十二生肖导航">
          <div className="zodiac-rail" role="tablist" aria-label="选择生肖">
            {ZODIAC_LIST.map((item) => {
              const isCurrent = item.id === activeSign;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  className={`zodiac-pill ${isCurrent ? 'is-active' : ''} ${item.available ? 'is-ready' : 'is-locked'}`}
                  onClick={() => selectZodiac(item)}
                  title={item.available ? `${item.nameCn} · ${item.cryptoTheme}` : `${item.nameCn} · COMING SOON`}
                >
                  <span className="pill-branch">{item.branch}</span>
                  <span className="pill-name">{item.nameCn}</span>
                  {!item.available && <span className="pill-soon">SOON</span>}
                </button>
              );
            })}
          </div>

          {selectionNotice && <p className="zodiac-selection-note" role="status">{selectionNotice}</p>}
        </section>

        {/* Main 3D Stage Frame with L-Corners & Cinnabar Digital Seal */}
        <section className="zodiac-stage-shell" aria-label="3D 生肖赏玩台">
          <span className="l-corner l-tl" aria-hidden="true" />
          <span className="l-corner l-tr" aria-hidden="true" />
          <span className="l-corner l-bl" aria-hidden="true" />
          <span className="l-corner l-br" aria-hidden="true" />

          <div className="zodiac-hud-tl">
            <span className="hud-mono" style={{ color: spec.accentHex }}>{spec.yearTag}</span>
            <h1>{spec.nameCn} · {spec.nameEn}</h1>
            <p>{spec.cryptoTheme} — {spec.cryptoSubtitle}</p>
          </div>

          <div className="zodiac-cinnabar-seal" aria-label={`朱砂电子印章：${spec.sealText}`}>
            <span>{sealChars[0]}{sealChars[1]}</span>
            <span>{sealChars[2]}{sealChars[3]}</span>
          </div>

          <div className="zodiac-canvas-frame">
            <ZodiacStage
              sign={activeSign}
              mode="studio"
              filter={filter}
              motionEnabled={motionEnabled}
              unsealNonce={unsealNonce}
              pulseNonce={pulseNonce}
            />
          </div>

          {/* Floating Received Note Drawer after Slide-to-Unseal */}
          {receivedNoteVisible && (
            <aside className={`stationery-card zodiac-received-card paper-${paper}`} aria-label="收到的生日铭文">
              <div className="stationery-card-head">
                <span>TO · {recipient || 'YOU'}</span>
                <button type="button" className="zodiac-note-close" onClick={() => setReceivedNoteVisible(false)}>收起信笺 ✕</button>
              </div>
              <p className="stationery-quote">{effectiveBlessing}</p>
              <div className="stationery-card-foot">
                <span>— {sender || 'MEMENT'}</span>
                <span>{spec.sealText} · {spec.blockHeight}</span>
              </div>
              <VaultPlaque demo={incomingVault} onDemoRedeemed={() => setRedeemed(true)}/>
            </aside>
          )}

          <div className="zodiac-hud-bl">
            <span className="hud-mono">{spec.blockHeight}</span>
            <span className="hud-sep">/</span>
            <span>360° 拖拽旋转 · 滚轮缩放 · {spec.unsealLabel}</span>
          </div>
        </section>

        {/* Bottom Dock: Ritual Actions & Material Filters */}
        <section className="zodiac-dock" aria-label="动效与质感控制栏">
          <div className="zodiac-dock-group">
            <button type="button" className="zodiac-action-btn" onClick={() => setUnsealNonce((n) => n + 1)}>
              <span className="dock-code">UNSEAL</span> 启封动画
            </button>
            <button type="button" className="zodiac-action-btn" onClick={() => setPulseNonce((n) => n + 1)}>
              <span className="dock-code">PULSE</span> 链上流光
            </button>
            <button
              type="button"
              className={`zodiac-action-btn ${motionEnabled ? 'is-on' : ''}`}
              aria-pressed={motionEnabled}
              onClick={() => setMotionEnabled((v) => !v)}
            >
              <span className="dock-code">{motionEnabled ? 'LIVE' : 'PAUSED'}</span> 专属律动
            </button>
          </div>

          <div className="zodiac-dock-group" role="radiogroup" aria-label="质感滤镜切换">
            {ZODIAC_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={filter === f.id}
                className={`zodiac-filter-btn ${filter === f.id ? 'is-active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="zodiac-dock-group">
            <button
              type="button"
              className="zodiac-blessing-trigger"
              onClick={() => {
                setBlessingStep('compose');
                setBlessingOpen(true);
              }}
            >
              <span className="dock-code">SEAL &amp; GIFT</span> 写信封缄赠礼 ↗
            </button>
          </div>
        </section>
      </main>

      {/* Incoming Gift Slide-to-Unseal Darkroom Envelope */}
      {incomingSealed && (
        <div className="zodiac-unseal-overlay" role="dialog" aria-modal="true" aria-label="启封生肖数字礼物">
          <div className="unseal-envelope">
            <span className="l-corner l-tl" aria-hidden="true" />
            <span className="l-corner l-tr" aria-hidden="true" />
            <span className="l-corner l-bl" aria-hidden="true" />
            <span className="l-corner l-br" aria-hidden="true" />
            <p className="unseal-eyebrow">GENESIS ZODIAC · {spec.yearTag}</p>
            <div className="zodiac-cinnabar-seal is-compact" style={{ marginBottom: 22 }} aria-hidden="true">
              <span>{sealChars[0]}{sealChars[1]}</span>
              <span>{sealChars[2]}{sealChars[3]}</span>
            </div>
            <h1>有人为你，留了一尊{spec.nameCn}。</h1>
            <p className="unseal-parties">From {sender || 'Mement'} · To {recipient || 'You'}</p>
            <p className="unseal-date">{spec.blockHeight} · {spec.cryptoTheme}</p>

            <div
              ref={trackRef}
              className={`unseal-slider ${dragging ? 'is-dragging' : ''}`}
              role="slider"
              tabIndex={0}
              aria-label="向右滑动以启封生肖礼物"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(slideProgress * 100)}
              onPointerDown={onSliderDown}
              onPointerMove={onSliderMove}
              onPointerUp={onSliderUp}
              onPointerCancel={onSliderUp}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
                  e.preventDefault();
                  triggerIncomingUnseal();
                }
              }}
            >
              <span className="unseal-slider-fill" style={{ width: `${Math.max(12, slideProgress * 100)}%` }} aria-hidden="true" />
              <span className="unseal-slider-thumb" style={{ left: `calc(${slideProgress} * (100% - 48px) + 4px)` }} aria-hidden="true">→</span>
              <span className="unseal-slider-text" style={{ opacity: Math.max(0, 1 - slideProgress * 1.4) }}>向右轻划，启封 3D 藏品</span>
            </div>

            <button type="button" className="boutique-link unseal-fallback" onClick={triggerIncomingUnseal}>
              或轻点此处直接启封 →
            </button>
          </div>
        </div>
      )}

      {/* Blessing Stationery + Hold-to-Seal (1.2s) + Invitation Card Modal */}
      {blessingOpen && (
        <div className="zodiac-modal-backdrop" role="dialog" aria-modal="true" aria-label="链上生日铭文与封缄" onClick={() => { cancelHold(); setBlessingOpen(false); }}>
          <div className="zodiac-blessing-modal" onClick={(e) => e.stopPropagation()}>
            <span className="l-corner l-tl" aria-hidden="true" />
            <span className="l-corner l-tr" aria-hidden="true" />
            <span className="l-corner l-bl" aria-hidden="true" />
            <span className="l-corner l-br" aria-hidden="true" />

            <div className="blessing-modal-head">
              <div>
                <p className="hud-mono">GENESIS ZODIAC · {blessingStep === 'compose' ? 'STATIONERY & HOLD TO SEAL' : 'SEALED INVITATION'}</p>
                <h2>{spec.nameCn} · {blessingStep === 'compose' ? '写信并盖印封缄' : '礼盒已封缄备妥'}</h2>
              </div>
              <div className="zodiac-cinnabar-seal is-compact" aria-hidden="true">
                <span>{sealChars[0]}{sealChars[1]}</span>
                <span>{sealChars[2]}{sealChars[3]}</span>
              </div>
            </div>

            {blessingStep === 'compose' ? (
              <>
                <div className="paper-picker" role="radiogroup" aria-label="选择信纸纸色">
                  <span className="paper-picker-label">信纸纸色</span>
                  <div className="paper-swatches">
                    {PAPER_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={paper === opt.id}
                        className={`paper-swatch-btn ${paper === opt.id ? 'is-selected' : ''}`}
                        onClick={() => setPaper(opt.id)}
                      >
                        <span className="paper-swatch-dot" style={{ background: opt.swatch }} aria-hidden="true" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`stationery-card paper-${paper}`} style={{ marginBottom: 18 }}>
                  <div className="stationery-card-head">
                    <span>TO · {recipient || 'YOU'}</span>
                    <span>{spec.yearTag} · {todayText}</span>
                  </div>
                  <p className="stationery-quote" style={{ marginBottom: 12 }}>{effectiveBlessing}</p>
                  <div className="stationery-card-foot">
                    <span>— {sender || 'MEMENT'}</span>
                    <span>{spec.sealText}</span>
                  </div>
                </div>

                <div className="blessing-fields">
                  <div className="blessing-row">
                    <label>
                      <span>收礼人 ENS / 称呼</span>
                      <input type="text" maxLength={80} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="例如 friend.eth" />
                    </label>
                    <label>
                      <span>赠礼人署名</span>
                      <input type="text" maxLength={80} value={sender} onChange={(e) => setSender(e.target.value)} placeholder="例如 jimu.ai" />
                    </label>
                  </div>
                  <label>
                    <span>生日祝词（留空使用生肖默认祝词）</span>
                    <textarea rows={3} maxLength={280} value={customBlessing} onChange={(e) => setCustomBlessing(e.target.value)} placeholder={spec.defaultBlessing} />
                  </label>
                </div>

                <VaultFields value={vault} onChange={setVault} enabled={spec.available} demo/>
                {vaultError && <p className="error" role="alert">{vaultError}</p>}

                <div className="seal-control">
                  <button
                    type="button"
                    className={`seal-hold-btn ${sealing ? 'is-sealing' : ''}`}
                    onPointerDown={startHoldSeal}
                    onPointerUp={cancelHold}
                    onPointerLeave={cancelHold}
                    onPointerCancel={cancelHold}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        startHoldSeal();
                      }
                    }}
                    onKeyUp={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') cancelHold();
                    }}
                  >
                    <span className="seal-progress-fill" style={{ transform: `scaleX(${sealProgress})` }} aria-hidden="true" />
                    <span className="seal-btn-content">
                      <svg className="seal-ring" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
                        <circle cx="18" cy="18" r="15" className="seal-ring-track" />
                        <circle cx="18" cy="18" r="15" className="seal-ring-arc" strokeDasharray={ringCircumference} strokeDashoffset={ringOffset} />
                      </svg>
                      <span>{sealing ? '保持按住 · 正在盖上朱砂封缄…' : '长按 1.2 秒 · 封缄并生成礼盒'}</span>
                    </span>
                  </button>
                  <button type="button" className="boutique-link counter-quick-seal" onClick={completeSeal}>
                    或轻点直接封缄 →
                  </button>
                </div>
              </>
            ) : (
              <>
                {invitationUrl && (
                  <div className="invitation-preview">
                    <img src={invitationUrl} alt="十二生肖取礼邀请函预览" />
                  </div>
                )}
                <div className="counter-actions">
                  <button type="button" className="boutique-btn boutique-btn-full" onClick={previewIncomingUnseal}>
                    亲自体验「划开封条 → 3D 启封」 <span aria-hidden="true">→</span>
                  </button>
                  {invitationUrl && (
                    <button type="button" className="boutique-btn boutique-btn-subtle boutique-btn-full" onClick={downloadInvitation}>
                      保存生肖取礼邀请函 (PNG) <span aria-hidden="true">↓</span>
                    </button>
                  )}
                  <button type="button" className="boutique-btn boutique-btn-subtle boutique-btn-full" onClick={copyShareLink}>
                    {copiedShare ? '可启封分享链接已复制 ✓' : '复制可启封分享链接'}
                  </button>
                </div>
                <p className="blessing-note">链接已编码当前生肖、滤镜、信纸纸色、铭文与选填模拟内封资产，朋友点开会先看到暗房朱砂封套，划开封条即触发专属 3D 启封动画（当前为演示预览，尚未链上铸造）。</p>
                <div className="blessing-modal-actions" style={{ marginTop: 14 }}>
                  <button type="button" className="boutique-link" onClick={() => setBlessingStep('compose')}>← 返回修改信笺</button>
                  <button type="button" className="boutique-link" onClick={() => setBlessingOpen(false)}>关闭窗口</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
