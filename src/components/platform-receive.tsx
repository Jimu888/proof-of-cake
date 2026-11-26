'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import Link from 'next/link';
import { artworkArtist } from '../domain/catalog';
import { useLanguage } from '../lib/i18n';
import ArtworkPresentation, { snowflakeSeed } from './artwork-presentation';
import WinterCabinEntry from './winter-cabin-entry';
import { ReserveReceipt } from './reserve-fields';
import GiftClaimBinding from './gift-claim-binding';
import { formatCardIdentity, isHexWalletAddress, recipientVisualSeed, shortArtValue } from '../lib/generative-art';
import AddressChip from './address-chip';
import { GroupLetter } from './group-gift';
import { LoveVaultStatus } from './love-vault';
import type { PublicDemoOrder } from '../domain/orders';
import { describeArtworkPolicy } from '../domain/artwork-policy';
import { ReceiveHeader, useRitualSound } from './gift-ritual';
import { playLightReveal, playUnsealSlide } from '../lib/ritual-sound';
import VaultPlaque from './vault-plaque';
import type { VaultAsset } from '../domain/vault-gift';
import { testnet } from '../lib/testnet';

import type { PaperTone } from '../lib/gift-copy';
import { friendlyWalletError, verifyRecipientNoteSignature, type OnchainSealProof } from '../lib/bsc-testnet-client';
type ReceiveGift = Pick<PublicDemoOrder, 'id' | 'artwork' | 'recipient' | 'message' | 'createdAt' | 'vault' | 'reserve' | 'senderAddress' | 'agreement' | 'notes'> & { sender: string };

export default function PlatformReceive({ order, transaction, chainVault, onchain, privateNote = false }: { order: ReceiveGift; transaction?: string; chainVault?: VaultAsset; onchain?: OnchainSealProof; privateNote?: boolean }) {
  const { language, locale, t } = useLanguage();
  const title = t(order.artwork.name, order.artwork.title);
  const sender = order.senderAddress ?? (!transaction && order.sender === "演示赠送人" ? t("Gift sender", "赠礼人") : order.sender);
  const seed = { recipient: recipientVisualSeed(order.recipient) ?? order.recipient, sender: recipientVisualSeed(order.senderAddress ?? (transaction ? order.sender : '')),
    pairedSnow: !!order.senderAddress, transaction, orderId: order.id, date: order.createdAt };
  const artist = artworkArtist(order.artwork, language);
  const sound = useRitualSound();
  const audio = useRef(sound.enabled);
  audio.current = sound.enabled;
  const [simulatedRedeemed, setSimulatedRedeemed] = useState(false);
  useEffect(() => {
    if (!order.reserve) return;
    try { setSimulatedRedeemed(localStorage.getItem('mement-keepsake:' + order.id) === '1'); }
    catch { /* Keep the archive state for this visit. */ }
  }, [order.id, order.reserve]);
  const redeemed = simulatedRedeemed || !!chainVault?.redeemed;
  const [phase, setPhase] = useState<'sealed' | 'lighting' | 'open'>('sealed');
  const [paper, setPaper] = useState<PaperTone>('graphite');
  const [slideProgress, setSlideProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [cabinOpen, setCabinOpen] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'main' | 'widget' | 'archive'>('main');
  const [noteUnlocked, setNoteUnlocked] = useState(!privateNote);
  const [unlockingNote, setUnlockingNote] = useState(false);
  const [noteError, setNoteError] = useState('');
  const hasWidget = order.artwork.id === 'algorithmic-bond' || Boolean(order.agreement) || Boolean(order.reserve);

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
    const timer = setTimeout(() => {
      if (audio.current) playLightReveal();
      setPhase('open');
    }, delay);
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
    sound.prepare();
    if (sound.enabled) playUnsealSlide();
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

  const dateText = new Date(order.createdAt).toLocaleDateString(locale, { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.');
  const policyText = describeArtworkPolicy(order.artwork.policy, language);

  return <main lang={locale} className={`platform-receive platform-receive-${phase} receive-gallery${redeemed ? ' gift-redeemed' : ''}`} data-promise={phase !== 'sealed' && (order.artwork.id === 'algorithmic-bond' || !!order.agreement)}>
    <ReceiveHeader sound={sound}/>

    {phase === 'sealed' && <section className="unseal-stage" aria-label={t("Unseal the gift", "启封礼盒")}>
      <div className="unseal-envelope">
        <span className="unseal-strip-line" aria-hidden="true"/>
        <p className="unseal-eyebrow">{t('A LITTLE SOMETHING, JUST FOR YOU', '一份专属于你的心意')}</p>
        <div className="unseal-emblem" aria-hidden="true">
          <span className="unseal-pulse"/>
          <span>{t('SEALED', '已封缄')}</span>
        </div>
        <h1>{t("Someone sealed a gift for you.", "有人为你，留了一份礼物。")}</h1>
        <p className="unseal-parties">{t('From', '来自')} <AddressChip value={sender}/> · {t('To', '致')} <AddressChip value={order.recipient}/></p>
        <p className="unseal-date">{dateText}</p>

        <div
          ref={trackRef}
          className={`unseal-slider ${dragging ? 'is-dragging' : ''}`}
          role="slider"
          tabIndex={0}
          aria-label={t("Slide right to unseal the gift", "向右滑动以启封礼物")}
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
          <span className="unseal-slider-text" style={{ opacity: Math.max(0, 1 - slideProgress * 1.4) }}>{t("Slide right to unseal", "向右轻划，启封")}</span>
        </div>
      </div>
    </section>}

    {phase === 'lighting' && <section className="lighting-stage" aria-live="polite">
      <div className="boutique-niche lighting-niche is-illuminating">
        <ArtworkPresentation artwork={order.artwork} seed={seed} active={!lightbox && !cabinOpen}/>
      </div>
      <p className="lighting-caption">{t("Lighting the display…", "正在为你点亮展龛…")}</p>
    </section>}

    {phase === 'open' && <section className="receive-gallery-layout">
      <figure className="receive-figure">
        <div className="boutique-niche receive-niche" data-enclosed={!!(order.reserve || order.vault || chainVault || order.agreement) && !redeemed}>
          <ArtworkPresentation artwork={order.artwork} seed={seed} active={!lightbox && !cabinOpen} crystallize={false}/>
          {order.artwork.displayMode !== 'generative-canvas' && <button
            type="button"
            className="receive-niche-trigger"
            onClick={() => setLightbox(true)}
            aria-label={t("View artwork full screen", "进入熄灯全屏凝视模式")}
          />}
        </div>
        <figcaption className="receive-figcaption">
          <span>{title}</span>
          <button type="button" className="boutique-link" onClick={() => setLightbox(true)}>{t("View artwork full screen ↗", "熄灯全屏凝视 ↗")}</button>
        </figcaption>
      </figure>

      <div className="receive-editorial">
        <nav className="receive-tabs" role="tablist" aria-label={t('Gift details', '礼物信息切换')}>
          <button type="button" role="tab" aria-selected={tab === 'main'} className={tab === 'main' ? 'is-active' : undefined} onClick={() => setTab('main')}>
            {order.agreement ? t('Note & Promise', '心意与约定') : t('Note & Reserve', '心意与礼金')}
          </button>
          {hasWidget && (
            <button type="button" role="tab" aria-selected={tab === 'widget'} className={tab === 'widget' ? 'is-active' : undefined} onClick={() => setTab('widget')}>
              {t('Desktop Widget', '桌面小组件')}
            </button>
          )}
          <button type="button" role="tab" aria-selected={tab === 'archive'} className={tab === 'archive' ? 'is-active' : undefined} onClick={() => setTab('archive')}>
            {t('Onchain Record', '链上档案')}
          </button>
        </nav>

        {tab === 'main' && <>
          <div className={`stationery-card receive-note-card paper-${paper}`}>
            <div className="stationery-card-head">
              <span>{t('A NOTE, JUST FOR YOU', '一封写给你的信')}</span>
              <time dateTime={order.createdAt}>{dateText}</time>
            </div>
            <h1 ref={letter} tabIndex={-1} className={isHexWalletAddress(order.recipient) ? 'is-hex-address' : undefined}>
              {t('To', '致')} <AddressChip value={order.recipient}/>
            </h1>
            <GiftClaimBinding recipient={order.recipient}/>
            {!noteUnlocked ? (
              <div className="private-note-veil">
                <p>{t('This private letter is locked for the recipient wallet only.', '这是一封私密信笺，需验证收礼人钱包签名后方可阅读。')}</p>
                <button type="button" className="private-note-btn" disabled={unlockingNote} onClick={async () => {
                  setUnlockingNote(true);
                  setNoteError('');
                  try {
                    await verifyRecipientNoteSignature(order.recipient, order.id);
                    setNoteUnlocked(true);
                  } catch (err) {
                    setNoteError(friendlyWalletError(err, language === 'zh'));
                  } finally {
                    setUnlockingNote(false);
                  }
                }}>
                  {unlockingNote ? t('Verifying signature…', '正在验证钱包签名…') : t('Sign with recipient wallet to read (Gas-free)', '使用收礼钱包签名解锁阅读（免费无 Gas）')}
                </button>
                {noteError && <p className="checkout-error" role="alert">{noteError}</p>}
              </div>
            ) : order.notes ? <GroupLetter recipient={order.recipient} notes={order.notes}/> : <p className="platform-message">{order.message || t("This artwork says what words can’t.", "这份心意，留在作品里。")}</p>}
            <div className="stationery-card-foot">
              <span>— <AddressChip value={sender}/></span>
              <span>{onchain?.kind === 'vault-gift' ? t('SOULBOUND NFT', '不可转让 NFT') : t('MEMENT SEAL', 'MEMENT 封印')}</span>
            </div>
          </div>

          <ReserveReceipt giftId={order.id} createdAt={order.createdAt} recipient={order.recipient} plan={order.reserve} archived={simulatedRedeemed} onchain={onchain?.kind === 'vault-gift' ? onchain : undefined} onArchive={() => {
            setSimulatedRedeemed(true);
            try { localStorage.setItem('mement-keepsake:' + order.id, '1'); } catch {}
          }}/>
          <VaultPlaque demo={order.vault} asset={chainVault} purchase={transaction} onDemoRedeemed={() => setSimulatedRedeemed(true)}/>

          {order.agreement && order.senderAddress && <LoveVaultStatus agreement={order.agreement} sender={order.senderAddress} recipient={order.recipient} onchain={onchain?.kind === 'love-vault' ? onchain : undefined}/>}
        </>}

        {tab === 'widget' && hasWidget && (
          <div className="receive-tab-panel">
            <LivingKeepsake
              artworkId={order.artwork.id}
              createdAt={order.createdAt}
              sender={sender}
              recipient={order.recipient}
              agreement={order.agreement}
              reserve={order.reserve}
            />
          </div>
        )}

        {tab === 'archive' && (
          <div className="receive-tab-panel receive-archive-panel">
            <div className="receive-nft-badge" role="note">
              <span className="receive-nft-dot" aria-hidden="true"/>
              <span>
                {t('Non-transferable Soulbound NFT · Delivered to ', '链上不可转让礼物 NFT（Soulbound）· 已铸造至 ')}
                <AddressChip value={order.recipient}/>
                {t('', ' 的钱包')}
                {(transaction || onchain) && <> · <a href={`${testnet.explorer}/tx/${transaction ?? onchain!.txHash}`} target="_blank" rel="noreferrer">{t('BscScan ↗', '链上凭证 ↗')}</a></>}
              </span>
            </div>
            <div className="cert-body receive-cert-open">
              <dl>
                <div><dt>{t("Archive number", "典藏编号")}</dt><dd className="cert-mono">{order.id}</dd></div>
                <div><dt>{t("Artwork title", "作品名称")}</dt><dd>{title}</dd></div>
                <div><dt>{t("Artist", "创作者")}</dt><dd>{artist}</dd></div>
                <div><dt>{t("Sender", "赠送人")}</dt><dd><AddressChip value={sender}/></dd></div>
                <div><dt>{t("Recipient", "收礼人")}</dt><dd><AddressChip value={order.recipient}/></dd></div>
                <div><dt>{t("Edition rules", "发行规则")}</dt><dd>{policyText}</dd></div>
                {!transaction && !onchain && <div><dt>{t("Record", "记录")}</dt><dd>{t("Gift preview", "赠礼预览")}</dd></div>}
                {(transaction || onchain) && <div><dt>{t("Onchain record", "链上记录")}</dt><dd>
                  <a href={testnet.explorer + '/tx/' + (transaction ?? onchain!.txHash)} target="_blank" rel="noreferrer">{t("View on BscScan (Chain 97) ↗", "在 BscScan (BSC 测试网) 查看交易 ↗")}</a>
                </dd></div>}
              </dl>
            </div>
            <div className="receive-actions">
              <button type="button" className="boutique-link" onClick={copy}>{copied ? t("Link copied ✓", "链接已复制 ✓") : t("Copy gift link ↗", "复制这份礼物链接 ↗")}</button>
            </div>
          </div>
        )}
      </div>
    </section>}

    {lightbox && <div className="receive-lightbox" role="dialog" aria-modal="true" aria-label={t("Fullscreen artwork view", "熄灯凝视模式")} onClick={() => setLightbox(false)}>
      <button type="button" className="lightbox-close" onClick={() => setLightbox(false)}>{t("Exit fullscreen view · Esc", "退出凝视 · ESC")}</button>
      <div className="boutique-niche lightbox-niche" onClick={event => event.stopPropagation()}>
        <ArtworkPresentation artwork={order.artwork} seed={seed} crystallize={false}/>
      </div>
      <p className="lightbox-caption">{title} · {artist}</p>
    </div>}

    <Link className="platform-receive-home" href="/">{t("MEMENT · Find a gift ↗", "MEMENT · 也为一个人挑选礼物 ↗")}</Link>
  </main>;
}

function buildIosScriptableCode(input: {
  title: string;
  subtitle: string;
  parties: string;
  badge: string;
  url: string;
}) {
  const esc = (s: string) => JSON.stringify(s);
  return `// Mement iOS Home Screen Widget (Scriptable)
const w = new ListWidget();
const grad = new LinearGradient();
grad.colors = [new Color("#17222D"), new Color("#0E151C")];
grad.locations = [0, 1];
w.backgroundGradient = grad;
w.setPadding(16, 18, 16, 18);
w.url = ${esc(input.url)};

const top = w.addStack();
top.centerAlignContent();
const dot = top.addText("● ");
dot.font = Font.systemFont(8);
dot.textColor = new Color("#F2743A");
const brand = top.addText("MEMENT · ONCHAIN");
brand.font = Font.mediumMonospacedSystemFont(9);
brand.textColor = new Color("#8D98A3");
top.addSpacer();
const badge = top.addText(${esc(input.badge)});
badge.font = Font.semiboldMonospacedSystemFont(10);
badge.textColor = new Color("#F2743A");

w.addSpacer(10);
const hero = w.addText(${esc(input.title)});
hero.font = Font.mediumSystemFont(22);
hero.textColor = new Color("#F4F6F8");

const sub = w.addText(${esc(input.subtitle)});
sub.font = Font.regularSystemFont(11);
sub.textColor = new Color("#9AA6B2");

w.addSpacer();
const foot = w.addStack();
const parties = foot.addText(${esc(input.parties)});
parties.font = Font.regularMonospacedSystemFont(11);
parties.textColor = new Color("#CBD3DB");
foot.addSpacer();
const chain = foot.addText("BNB");
chain.font = Font.semiboldMonospacedSystemFont(10);
chain.textColor = new Color("#7E8A96");

if (config.runsInWidget) { Script.setWidget(w); } else { await w.presentMedium(); }
Script.complete();`;
}

function LivingKeepsake({
  artworkId,
  createdAt,
  sender,
  recipient,
  agreement,
  reserve,
}: {
  artworkId: string;
  createdAt: string;
  sender: string;
  recipient: string;
  agreement?: ReceiveGift['agreement'];
  reserve?: ReceiveGift['reserve'];
}) {
  const { t } = useLanguage();
  const [day, setDay] = useState(1);
  const [copiedScript, setCopiedScript] = useState(false);
  useEffect(() => {
    const created = Date.parse(createdAt);
    if (!Number.isFinite(created)) return;
    let timer: ReturnType<typeof setTimeout>;
    function sync() {
      const elapsed = Math.max(0, Date.now() - created);
      setDay(Math.floor(elapsed / 86_400_000) + 1);
      timer = setTimeout(sync, 86_400_000 - elapsed % 86_400_000);
    }
    sync();
    return () => clearTimeout(timer);
  }, [createdAt]);

  const isPromise = Boolean(agreement) || artworkId === 'algorithmic-bond';
  const targetDate = agreement?.date ?? (reserve?.unlock === 'date' ? reserve.date : undefined);
  const daysLeft = targetDate ? Math.max(0, Math.ceil((Date.parse(targetDate) - Date.now()) / 86_400_000)) : undefined;
  const assetBadge = agreement
    ? `${agreement.amounts[0]}${Number(agreement.amounts[1]) > 0 ? `+${agreement.amounts[1]}` : ''} ${agreement.token ?? 'BNB'}`
    : reserve
      ? `${reserve.amount} ${reserve.token === 'custom' ? 'TOKEN' : reserve.token}`
      : 'BNB CHAIN';
  const heroTitle = isPromise
    ? t(`Together · Day ${day}`, `相伴 · 第 ${day} 天`)
    : daysLeft !== undefined
      ? t(`${daysLeft}d to Unseal`, `距启封 · ${daysLeft} 天`)
      : t(`Sealed · Day ${day}`, `封缄 · 第 ${day} 天`);
  const subtitle = targetDate
    ? t(`Unlocks ${targetDate}`, `约定启封 · ${targetDate}`)
    : reserve?.unlock === 'price' && reserve.price
      ? t(`Target $${reserve.price}`, `目标里程碑 · $${reserve.price}`)
      : t('Onchain keepsake active', '链上纪念持续运行中');
  const partiesText = `${shortArtValue(sender)} × ${shortArtValue(recipient)}`;
  const isSnow = artworkId === 'snowflake';

  async function copyIosScript() {
    const code = buildIosScriptableCode({
      title: heroTitle,
      subtitle,
      parties: partiesText,
      badge: assetBadge,
      url: typeof window !== 'undefined' ? window.location.href : 'https://mement.art',
    });
    try {
      await navigator.clipboard.writeText(code);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2600);
    } catch {}
  }

  return <section className="living-keepsake">
    <div className="living-keepsake-head">
      <h2>{t('iOS / macOS Widget Preview', '桌面小组件预览')}</h2>
      <button type="button" className="living-keepsake-export" onClick={copyIosScript}>
        {copiedScript ? t('iOS script copied ✓', '已复制 iOS 脚本 ✓') : t('Copy iOS Scriptable ↗', '复制 iOS 小组件代码 ↗')}
      </button>
    </div>
    <div className={`living-keepsake-face ${isSnow ? 'is-snow' : 'is-bond'}`}>
      <div className="living-keepsake-niche" aria-hidden="true">
        <span className="living-keepsake-lamp"/>
        {isSnow ? (
          <svg viewBox="0 0 80 80" className="living-keepsake-svg">
            <g stroke="#CFE8FF" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.92">
              {[0, 60, 120, 180, 240, 300].map(deg => (
                <g key={deg} transform={`rotate(${deg} 40 40)`}>
                  <line x1="40" y1="40" x2="40" y2="12"/>
                  <polyline points="35,24 40,19 45,24"/>
                  <polyline points="33,31 40,26 47,31"/>
                </g>
              ))}
            </g>
            <polygon points="40,33 42.2,37.8 47,40 42.2,42.2 40,47 37.8,42.2 33,40 37.8,37.8" fill="#FFE2A8"/>
          </svg>
        ) : (
          <svg viewBox="0 0 88 80" className="living-keepsake-svg">
            <path className="living-keepsake-heart" d="M 6 44 C 18 44 22 39 28 39 C 35 39 39 50 44 57 C 49 50 56 40 56 32 C 56 24 49 21 44 27 C 39 21 32 24 32 32 C 32 40 39 50 44 57 C 49 50 53 39 60 39 C 66 39 70 44 82 44" fill="none" stroke="#F2743A" strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <div className="living-keepsake-meta">
        <div className="living-keepsake-top">
          <span className="living-keepsake-brand"><i/>MEMENT</span>
          <span className="living-keepsake-badge">{assetBadge}</span>
        </div>
        <strong>{heroTitle}</strong>
        <span className="living-keepsake-sub">{subtitle}</span>
        <div className="living-keepsake-bar" aria-hidden="true"><i/></div>
        <span className="living-keepsake-parties">{partiesText}</span>
      </div>
    </div>
    <p>{t('Pin this promise to your macOS desktop or iPhone home screen (via Scriptable).', '可将这份约定常驻 macOS 桌面或 iPhone 主屏幕（支持 Scriptable 导入）。')}</p>
  </section>;
}
