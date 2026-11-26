'use client';
import { playSealStamp } from '../lib/ritual-sound';
import { drawInvitationQr } from '../lib/invitation-qr';
import { SEAL_HOLD_MS, SoundToggle, useRitualSound, waitForSealAnimation } from './gift-ritual';
import { LoveVaultFields } from './love-vault';
import { parseLoveAgreement, type LoveAgreement } from '../domain/gifting-modes';
import { GiftingSwitch } from './gifting-options';
import { normalizeGiftRecipient } from '../domain/gift-recipient';
import { formatCardIdentity, isHexWalletAddress, recipientVisualSeed, sampleRecipient, sampleSender } from '../lib/generative-art';
import AddressChip from './address-chip';
import { initialReserve, ReserveFields } from './reserve-fields';
import { milestoneDeadline, parseReservePlan, type ReservePlan } from '../domain/reserve-plan';
import WinterCabinEntry from './winter-cabin-entry';
import { useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { encodeGiftSnapshot, giftSnapshotUrlLimit } from '../lib/gift-snapshot';
import WalletTrigger from './wallet-trigger';
import Link from 'next/link';
import { artworkArtist, artworkDisplayMode } from '../domain/catalog';
import { LanguageSwitch, useLanguage } from '../lib/i18n';
import ArtworkPresentation from './artwork-presentation';
import { giftErrorText, paperOptions, type PaperTone } from '../lib/gift-copy';
import type { Artwork } from '../domain/catalog';
import type { PublicDemoOrder } from '../domain/orders';
import type { ZodiacFilter } from '../domain/zodiac';
import {
  appendOnchainParams,
  connectBscTestnetSigner,
  fetchTestnetDeployments,
  friendlyWalletError,
  readVaultGiftOnchainInfo,
  sealLoveVaultOnBscTestnet,
  sealVaultGiftOnBscTestnet,
  type OnchainProgress,
  type OnchainSealProof,
  type TestnetDeployments,
} from '../lib/bsc-testnet-client';
import { testnet } from '../lib/testnet';

type GiftingMode = 'solo' | 'love' | 'self';

type SavedGift = { id: string; recipient: string; createdAt: string; expiresAt?: string; sharePath: string; onchain?: OnchainSealProof };
type ZodiacCounter = {
  filter: ZodiacFilter;
  stage: ReactNode;
  controls?: ReactNode;
  initial: { recipient?: string; sender?: string; message?: string; paper?: PaperTone };
  greeting: string;
};

type SavedOrder = { order: PublicDemoOrder; sharePath: string };

async function drawInvitationCard(options: {
  artworkTitle: string;
  language: string;
  recipient: string;
  dateText: string;
  shareUrl: string;
}): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const zh = options.language === 'zh';

  // 1. Deep architectural slate studio background
  const wall = ctx.createRadialGradient(540, 320, 60, 540, 520, 1080);
  wall.addColorStop(0, '#243746');
  wall.addColorStop(0.48, '#141e27');
  wall.addColorStop(1, '#0c1218');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer double architectural hairline frame
  ctx.strokeStyle = 'rgba(255,255,255,0.11)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(48, 48, 984, 1404);
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  ctx.strokeRect(64, 64, 952, 1372);

  // Surgical Signal Orange corner L-registration marks
  ctx.strokeStyle = '#f2743a';
  ctx.lineWidth = 3;
  const corners: [number, number, number, number][] = [
    [48, 48, 1, 1], [1032, 48, -1, 1], [48, 1452, 1, -1], [1032, 1452, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * 28, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * 28);
    ctx.stroke();
  }

  // 2. Top museum wordmark & micro-eyebrow
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f2f2ef';
  ctx.font = '400 34px -apple-system, "PingFang SC", sans-serif';
  ctx.fillText('M  E  M  E  N  T', 540, 134);
  ctx.fillStyle = '#7e8a96';
  ctx.font = '400 17px ui-monospace, Menlo, monospace';
  ctx.fillText(zh ? 'PRIVATE EXHIBITION INVITATION · 私人取礼邀请函' : 'PRIVATE EXHIBITION INVITATION · ONCHAIN KEEPSAKE', 540, 174);

  // 3. Centerpiece: Recessed Frosted-Glass Vitrine Niche (echoing homepage cabinet)
  const nx = 320, ny = 224, nw = 440, nh = 420;
  // Subtle warm ambient aura behind niche
  const aura = ctx.createRadialGradient(540, ny + nh / 2, 30, 540, ny + nh / 2, 300);
  aura.addColorStop(0, 'rgba(242,116,58,0.16)');
  aura.addColorStop(1, 'rgba(242,116,58,0)');
  ctx.fillStyle = aura;
  ctx.fillRect(nx - 80, ny - 60, nw + 160, nh + 120);

  // Recessed cabinet body
  const nicheGrad = ctx.createLinearGradient(0, ny, 0, ny + nh);
  nicheGrad.addColorStop(0, '#1e2c38');
  nicheGrad.addColorStop(0.32, '#131c24');
  nicheGrad.addColorStop(1, '#0e151c');
  ctx.fillStyle = nicheGrad;
  ctx.fillRect(nx, ny, nw, nh);

  // Volumetric overhead gallery light cone
  const cone = ctx.createRadialGradient(540, ny + 18, 12, 540, ny + 130, 270);
  cone.addColorStop(0, 'rgba(255,255,255,0.18)');
  cone.addColorStop(0.55, 'rgba(255,255,255,0.035)');
  cone.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = cone;
  ctx.fillRect(nx, ny, nw, nh);

  // Crisp beveled glass frame + inner depth border
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(nx, ny, nw, nh);
  ctx.strokeStyle = 'rgba(242,116,58,0.28)';
  ctx.lineWidth = 1;
  ctx.strokeRect(nx + 12, ny + 12, nw - 24, nh - 24);

  // Signature overhead linear white light bar
  const lightBar = ctx.createLinearGradient(nx + 90, ny + 18, nx + nw - 90, ny + 18);
  lightBar.addColorStop(0, 'rgba(255,255,255,0)');
  lightBar.addColorStop(0.2, 'rgba(255,255,255,0.95)');
  lightBar.addColorStop(0.8, 'rgba(255,255,255,0.95)');
  lightBar.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = lightBar;
  ctx.fillRect(nx + 90, ny + 16, nw - 180, 4);

  // Concentric Signal Orange Seal Crest inside the vitrine
  const sx = 540, sy = ny + 224;
  ctx.save();
  ctx.setLineDash([4, 8]);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(sx, sy, 128, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Outer glowing orange ring
  ctx.strokeStyle = '#f2743a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(sx, sy, 102, 0, Math.PI * 2);
  ctx.stroke();

  // Inner fine architectural ring
  ctx.strokeStyle = 'rgba(242,116,58,0.38)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(sx, sy, 86, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle geometric 4-point compass ticks on the seal
  ctx.strokeStyle = 'rgba(242,116,58,0.65)';
  ctx.lineWidth = 1.5;
  for (const [ax, ay] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    ctx.beginPath();
    ctx.moveTo(sx + ax * 102, sy + ay * 102);
    ctx.lineTo(sx + ax * 116, sy + ay * 116);
    ctx.stroke();
  }

  // Seal center label
  ctx.fillStyle = '#f2743a';
  ctx.font = '500 28px -apple-system, "PingFang SC", sans-serif';
  ctx.fillText(zh ? '已  封  缄' : 'S E A L E D', sx, sy + 6);
  ctx.fillStyle = '#8b96a1';
  ctx.font = '400 13px ui-monospace, Menlo, monospace';
  ctx.fillText('MEMENT · BNB CHAIN', sx, sy + 36);

  // 4. Editorial Headline & Hairline Diamond Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(140, 706);
  ctx.lineTo(516, 706);
  ctx.moveTo(564, 706);
  ctx.lineTo(940, 706);
  ctx.stroke();

  // Center orange diamond
  ctx.fillStyle = '#f2743a';
  ctx.beginPath();
  ctx.moveTo(540, 699);
  ctx.lineTo(547, 706);
  ctx.lineTo(540, 713);
  ctx.lineTo(533, 706);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f2f2ef';
  ctx.font = '400 50px Georgia, "Songti SC", serif';
  ctx.fillText(zh ? '有人为你，留了一份礼物。' : 'Someone sealed a gift for you.', 540, 782, 880);

  // 3-Column Museum Metadata Placard
  const metaY = 842;
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.moveTo(140, metaY);
  ctx.lineTo(940, metaY);
  ctx.moveTo(140, metaY + 104);
  ctx.lineTo(940, metaY + 104);
  ctx.moveTo(406, metaY + 18);
  ctx.lineTo(406, metaY + 86);
  ctx.moveTo(674, metaY + 18);
  ctx.lineTo(674, metaY + 86);
  ctx.stroke();

  const cols: [number, string, string][] = [
    [273, zh ? '致 · TO' : 'TO', formatCardIdentity(options.recipient) || (zh ? '你' : 'You')],
    [540, zh ? '礼物 · GIFT' : 'GIFT', options.artworkTitle],
    [807, zh ? '封缄日期 · DATE' : 'SEALED ON', options.dateText],
  ];
  for (const [colX, label, val] of cols) {
    ctx.fillStyle = '#7e8a96';
    ctx.font = '400 15px ui-monospace, Menlo, monospace';
    ctx.fillText(label, colX, metaY + 38, 240);
    ctx.fillStyle = '#f2f2ef';
    ctx.font = '400 26px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText(val, colX, metaY + 78, 240);
  }

  // 5. Framed QR Ticket Section
  // Subtle mat backdrop behind QR
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  ctx.fillRect(386, 994, 308, 308);
  ctx.strokeRect(386, 994, 308, 308);

  await drawInvitationQr(ctx, options.shareUrl, 1008, 280, options.language);

  ctx.fillStyle = '#6f7c88';
  ctx.font = '400 16px ui-monospace, Menlo, monospace';
  ctx.fillText('MEMENT · BNB CHAIN ONCHAIN KEEPSAKE', 540, 1412);

  return canvas.toDataURL('image/png');
}

export default function GiftCheckout({ artwork, testnetAvailable, zodiac }: { artwork: Artwork; testnetAvailable?: boolean; zodiac?: ZodiacCounter }) {
  const { language, locale, t } = useLanguage();
  const title = t(artwork.name, artwork.title);
  const artist = artworkArtist(artwork, language);
  const generative = artworkDisplayMode(artwork) === 'generative-canvas';
  const bond = artwork.id === 'algorithmic-bond';
  const [step, setStep] = useState<'artwork' | 'reserve' | 'compose' | 'review' | 'sealing_animation' | 'saved'>('artwork');
  const sound = useRitualSound();
  const [recipient, setRecipient] = useState(zodiac?.initial.recipient ?? '');
  const [senderAddress, setSenderAddress] = useState(() => normalizeGiftRecipient(zodiac?.initial.sender) ?? '');
  const [previewSeed, setPreviewSeed] = useState({ recipient: sampleRecipient, sender: sampleSender });
  const [agreementDraft, setAgreementDraft] = useState<LoveAgreement>({ amounts: ['0.1', '0'], terms: 'proportional', date: '' });
  const [mode, setMode] = useState<GiftingMode>(bond ? 'love' : 'solo');
  const [hoverMode, setHoverMode] = useState<GiftingMode>();
  const [focusMode, setFocusMode] = useState<GiftingMode>();
  const [reserve, setReserve] = useState<ReservePlan>(initialReserve);
  const [reserveEnabled, setReserveEnabled] = useState(false);
  const [reserveGate, setReserveGate] = useState(false);
  const [cabinOpen, setCabinOpen] = useState(false);
  const [pairedSnow, setPairedSnow] = useState(false);
  const [privateNote, setPrivateNote] = useState(false);
  const scene = step === 'artwork' ? hoverMode ?? focusMode ?? mode : mode;
  const stages = [t('Occasion', '场景'), t('Reserve', '礼金'), t('Note', '留言'), t('Seal', '封缄'), t('Deliver', '投递')];
  const index = ({ artwork: 0, reserve: 1, compose: 2, review: 3, sealing_animation: 3, saved: 4 })[step];
  const occasions = [
    { kind: 'solo', label: t('Gift Someone', '赠予他人'), subtitle: t('PERSONAL', 'GIFT SOMEONE'),
      tip: t('Seal interactive art, a personal note, and optional locked crypto for someone special.', '将互动艺术、祝福留言与可选加密礼金封缄，赠予重要的人。') },
    { kind: 'love', label: t('Shared Promise', '双人约定'), subtitle: t('TWO-PARTY', 'SHARED PROMISE'),
      tip: t('Two people lock a shared date or price milestone—for friends, partners, or co-builders.', '两个人共同约定未来日期或币价里程碑——适合朋友、搭档或伴侣。') },
    { kind: 'self', label: t('To Future Me', '致未来的自己'), subtitle: t('FUTURE CAPSULE', 'TO FUTURE ME'),
      tip: t('Lock crypto into an unbreakable future capsule by date or price target, with a letter to your future self.', '把资产锁给未来的自己，到期或达标前不可提前取出，顺便留一封信给那天的自己。') },
  ] as const;
  const destinations = ['artwork', 'reserve', 'compose', 'review'] as const;
  const self = mode === 'self';
  const showSenderField = !self;
  const needsSender = !self && (bond || mode === 'love' || pairedSnow);
  const prompts = self ? [
    t('To myself 1 year from now—hope you’re still unhurried and doing what you love.', '写给 1 年后的自己：愿你依然从容，走在喜欢的路上。'),
    t('Leaving this BNB for myself 5 years from now—see you on the other side of the cycle.', '给 5 年后的自己留一笔 BNB，穿过周期再见面。'),
    t('Locked while clear-headed—hands off until the unlock date.', '趁清醒锁一笔利润，到期前谁来都别碰。'),
  ] : mode === 'love' ? [
    t('Sealing today onchain—let’s open it together on our next anniversary.', '把今天存进链上，等下一个纪念日我们一起启封。'),
    t('When BNB hits $1,000, we book the trip together.', '等 BNB 破 $1,000，我们一起出发去旅行。'),
    t('A shared fund for the next chapter we’re building.', '一起存一笔未来启动金，留给下一段旅程。'),
  ] : [];
  const sender = self ? t('Your past self', '过去的自己') : senderAddress.trim() || zodiac?.initial.sender || t('Gift sender', '赠礼人');
  const [draftMessage, setMessage] = useState<string | undefined>(zodiac?.initial.message);
  const message = draftMessage ?? (self || mode === 'love' ? '' : zodiac?.greeting) ?? (bond ? t('Here’s to the thread that brought us together.', '敬把我们牵到一起的那根线。') : generative ? t('A little piece of winter, just for you.', '送你一枚只属于你的冬日。') : t('Happy birthday.\nMay the year ahead bring places you love, good company, and the courage to keep exploring.', '生日快乐。\n愿新的一岁，有喜欢的风景，\n有一起前行的人，也有不断出发的勇气。'));
  const [paper, setPaper] = useState<PaperTone>(zodiac?.initial.paper ?? 'graphite');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const saving = useRef(false);
  const [saved, setSaved] = useState<SavedGift>();
  const [copied, setCopied] = useState(false);
  const [invitationCard, setInvitationCard] = useState<{ gift: SavedGift; language: string; url: string }>();
  const invitationUrl = invitationCard && invitationCard.gift === saved && invitationCard.language === language ? invitationCard.url : undefined;
  const [sealProgress, setSealProgress] = useState(0);
  const [sealing, setSealing] = useState(false);
  const [deployments, setDeployments] = useState<TestnetDeployments>({});
  const [vaultInfo, setVaultInfo] = useState<{ priceBnb: string; transferable: boolean } | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<string>('');
  const [connectingSender, setConnectingSender] = useState(false);
  const [onchainMode, setOnchainMode] = useState(true);
  const [onchainProgress, setOnchainProgress] = useState<OnchainProgress | null>(null);

  useEffect(() => {
    void fetchTestnetDeployments().then(d => {
      setDeployments(d);
      if (d.vaultGift) void readVaultGiftOnchainInfo(d.vaultGift).then(setVaultInfo);
    });
    void fetch('/api/wallet', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then((data: { authenticated?: boolean; address?: string } | null) => {
        if (data?.authenticated && data.address) {
          setConnectedWallet(data.address);
          setSenderAddress(prev => prev || data.address!);
        }
      })
      .catch(() => {});
  }, []);
  const activeContract = mode === 'love' ? deployments.loveVault : deployments.vaultGift;
  const canSealOnchain = Boolean(activeContract);
  const onchainUnitBnb = Number(vaultInfo?.priceBnb ?? artwork.price);
  const onchainReserveBnb = mode === 'love' ? Number(agreementDraft.amounts[0] || 0) : (reserveEnabled ? Number(reserve.amount || 0) : 0);
  const totalWalletBnb = mode === 'love'
    ? onchainReserveBnb
    : +(onchainUnitBnb + onchainReserveBnb).toFixed(6);

  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const holdRaf = useRef<number | null>(null);
  const holdStart = useRef<number>(0);

  const todayText = new Date().toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.');

  useEffect(() => {
    if (!saved) return;
    let current = true;
    drawInvitationCard({
      artworkTitle: title,
      language,
      recipient: saved.recipient,
      dateText: new Date(saved.createdAt).toLocaleDateString(locale),
      shareUrl: new URL(saved.sharePath, window.location.origin).href,
    }).then(url => { if (current) setInvitationCard({ gift: saved, language, url }); })
      .catch(() => { if (current) setInvitationCard({ gift: saved, language, url: '' }); });
    return () => { current = false; };
  }, [saved, title, language, locale]);

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
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
    });
  }

  function advanceReserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (mode === 'love') {
        if (!agreementDraft.date || Date.parse(agreementDraft.date) <= Date.now() || !parseLoveAgreement(agreementDraft)) {
          throw new Error(t('Enter a positive deposit, a future date and valid terms.', '请填写首笔礼金、未来约定日期和有效条款。'));
        }
      } else if (reserveEnabled) {
        const plan = parseReservePlan(reserve);
        if (plan?.date && Date.parse(plan.date) <= Date.now()) throw new Error(t('Choose a future date.', '请选择未来日期。'));
        if (self && plan?.date && Date.parse(plan.date) > milestoneDeadline(Date.now(), 5)) {
          throw new Error(t('Choose a date within the next five years.', '请选择未来五年内的日期。'));
        }
        if (plan?.address && !reserveGate) throw new Error(t('Verify PancakeSwap liquidity before continuing.', '请先通过 PancakeSwap 流动性核验。'));
      }
      go('compose');
    } catch (failure) { setError((failure as Error).message); }
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const to = normalizeGiftRecipient(recipient);
    const from = normalizeGiftRecipient(senderAddress);
    if (!to) {
      setError(t('Enter a valid email, social handle, .ai name or wallet address.', '请输入有效的邮箱、社交账号、.ai 名称或钱包地址。'));
      document.getElementById('gift-recipient')?.focus();
      return;
    }
    if (needsSender && !from) {
      setError(t('Enter a valid sender email, social handle, .ai name or wallet address.', '请输入有效的发起人邮箱、社交账号、.ai 名称或钱包地址。'));
      document.getElementById('gift-sender')?.focus();
      return;
    }
    if (mode === 'love' && (to.toLowerCase() === from?.toLowerCase() || !parseLoveAgreement(agreementDraft))) {
      setError(t('Use distinct recipient and sender identities and check the Promise terms.', '请使用不同的收礼身份和发起身份，并检查约定条款。'));
      return;
    }
    setRecipient(to);
    if (needsSender && from) setSenderAddress(from);
    go('review');
  }

  function changeMode(next: GiftingMode) {
    if (next === mode || pending) return;
    setMode(next);
    if (next === 'self') {
      setReserveEnabled(true);
      setReserve(value => ({ ...value, unlock: 'date' }));
    }
    setCopied(false);
    setSaved(undefined);
    setReserveGate(false);
  }

  function buildSharePath(rawSharePath: string, order: PublicDemoOrder) {
    const url = new URL(rawSharePath, window.location.origin);
    if (paper !== 'graphite') url.searchParams.set('paper', paper);
    const snapshot = encodeGiftSnapshot({
      id: order.id, artworkId: order.artwork.id, recipient: order.recipient, sender: order.senderAddress, message: order.message,
      createdAt: order.createdAt, reserve: order.reserve, agreement: order.agreement, zodiacFilter: order.zodiacFilter,
    });
    if (snapshot) {
      url.searchParams.set('s', snapshot);
      if (url.href.length > giftSnapshotUrlLimit) url.searchParams.delete('s');
    }
    return url.pathname + url.search;
  }

  async function save() {
    if (saving.current) return;
    saving.current = true;
    setCopied(false);
    setPending(true);
    sound.prepare();
    setStep('sealing_animation');
    const animation = waitForSealAnimation();
    if (sound.enabled) void animation.then(playSealStamp);
    setError('');
    try {
      const agreement = mode === 'love' ? parseLoveAgreement(agreementDraft) : undefined;
      const from = self && bond ? recipient : normalizeGiftRecipient(senderAddress || connectedWallet) || undefined;
      const reservePlan = mode !== 'love' && reserveEnabled ? parseReservePlan(reserve) : undefined;
      const input = { artworkId: artwork.id, recipient, message, senderAddress: from, agreement,
        reserve: reservePlan, zodiacFilter: zodiac?.filter };
      const fingerprint = JSON.stringify(input);
      if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
      const response = await fetch('/api/demo/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.current.key }, body: fingerprint,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t('Could not seal the gift. Try again.', '暂时无法封缄礼盒，请重试。'));
      const { order, sharePath } = result as SavedOrder;
      let onchainProof: OnchainSealProof | undefined;
      if (canSealOnchain && onchainMode && activeContract) {
        setOnchainProgress({ step: 'wallet' });
        if (mode === 'love') {
          onchainProof = await sealLoveVaultOnBscTestnet({
            contractAddress: activeContract,
            partner: order.recipient,
            amountBnb: agreementDraft.amounts[0] || '0.001',
            onProgress: setOnchainProgress,
          });
        } else {
          const vaultBnb = reserveEnabled && Number(reserve.amount) > 0 ? reserve.amount : undefined;
          const unlockDate = reserveEnabled && reserve.unlock === 'date' ? reserve.date : undefined;
          const matchedAtlasFeed = reserveEnabled && reserve.unlock === 'price'
            ? (reserve.token === 'BTC' ? deployments.atlasFeedBtc : reserve.token === 'BNB' ? deployments.atlasFeedBnb : undefined)
            : undefined;
          onchainProof = await sealVaultGiftOnBscTestnet({
            contractAddress: activeContract,
            orderId: order.id,
            recipient: order.recipient,
            message: order.message,
            vaultAmountBnb: vaultBnb,
            unlockDate,
            atlasFeed: matchedAtlasFeed,
            targetPriceUsd: matchedAtlasFeed ? reserve.price : undefined,
            maxYears: matchedAtlasFeed ? reserve.maxYears : undefined,
            onProgress: setOnchainProgress,
          });
        }
        setOnchainProgress(null);
      }
      const basePath = appendOnchainParams(buildSharePath(sharePath, order), onchainProof);
      const resolvedSharePath = privateNote ? `${basePath}${basePath.includes('?') ? '&' : '?'}private=1` : basePath;
      if (mode === 'love') {
        try {
          const prev = JSON.parse(localStorage.getItem('mement-pending-promises') || '[]') as { recipient: string; title: string; from: string; sharePath: string }[];
          const next = [{ recipient: order.recipient, title, from: sender, sharePath: resolvedSharePath }, ...prev.filter(item => item.sharePath !== resolvedSharePath)].slice(0, 12);
          localStorage.setItem('mement-pending-promises', JSON.stringify(next));
        } catch { /* ignore storage errors */ }
      }
      setSaved({ id: order.id, recipient: order.recipient, createdAt: order.createdAt,
        expiresAt: order.expiresAt, sharePath: resolvedSharePath, onchain: onchainProof });
      await animation;
      go('saved');
    } catch (failure) {
      setOnchainProgress(null);
      setStep('review');
      setError(friendlyWalletError(failure, language === 'zh'));
    } finally {
      saving.current = false;
      setPending(false);
      cancelHold();
    }
  }

  function startHold() {
    if (pending || holdRaf.current !== null) return;
    sound.prepare();
    setSealing(true);
    holdStart.current = performance.now();
    const tick = (now: number) => {
      const ratio = Math.min(1, (now - holdStart.current) / SEAL_HOLD_MS);
      setSealProgress(ratio);
      if (ratio >= 1) {
        holdRaf.current = null;
        setSealing(false);
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
    } catch { setError(t('Copy failed. Select and copy the link below.', '复制失败，请手动复制下方链接。')); }
  }

  function downloadInvitation() {
    if (!invitationUrl || !saved) return;
    const anchor = document.createElement('a');
    anchor.href = invitationUrl;
    anchor.download = `mement-invitation-${saved.id.slice(0, 8)}.png`;
    anchor.click();
  }

  const invitation = saved && <>
    <p className="ritual-eyebrow ritual-sealed">{saved.onchain ? t('Sealed on BSC Testnet 97', 'SEALED ONCHAIN · 已铸造并封缄至 BSC 测试网') : t('Sealed', 'SEALED · 礼盒已封缄妥当')}</p>
    {saved.onchain && <p className="ritual-hint" style={{ color: '#6EE7B7' }}>
      ● {saved.onchain.kind === 'vault-gift'
        ? t(`Non-transferable Soulbound NFT #${saved.onchain.tokenId ?? ''} minted to recipient wallet`, `不可转让礼物 NFT #${saved.onchain.tokenId ?? ''} 已铸造并发送至收礼人钱包`)
        : t(`BSC Testnet 97 · Agreement #${saved.onchain.agreementId ?? ''}`, `BSC 测试网 · 双人约定 #${saved.onchain.agreementId ?? ''}`)} ·{' '}
      <a href={`${testnet.explorer}/tx/${saved.onchain.txHash}`} target="_blank" rel="noreferrer" style={{ color: '#F2743A' }}>
        {t('View on BscScan ↗', '在 BscScan 查看交易 ↗')}
      </a>
    </p>}
    <p className="ritual-delivery-guide">{t('Send the unboxing link or QR invitation so the recipient can reveal the gift.', '现在可以把启封链接或带二维码的邀请函发给对方，拆封欣赏这份链上礼物。')}</p>
    <div className="ritual-delivery-actions">
      <Link className="ritual-cta" href={saved.sharePath}>{t('Open the gift link', '打开启封链接')} <span aria-hidden="true">↗</span></Link>
      <button type="button" className="ritual-ghost" disabled={!invitationUrl} onClick={downloadInvitation}>{t('Download invitation (PNG)', '保存取礼邀请函 (PNG)')} <span aria-hidden="true">↓</span></button>
      <button type="button" className="ritual-ghost" onClick={copyLink}>{copied ? t('Link copied', '链接已复制') : t('Copy unboxing link', '复制启封链接')}</button>
    </div>
    {invitationUrl === '' && <p className="ritual-hint" role="status">{t('PNG unavailable for this link. You can still copy the link.', '此链接无法生成 PNG 邀请函，仍可复制分享链接。')}</p>}
    <input className="checkout-share-url" aria-label={t("Share link", "分享链接")}
      value={saved.sharePath && typeof window !== 'undefined' ? new URL(saved.sharePath, window.location.origin).href : saved.sharePath}
      readOnly onFocus={event => event.target.select()}/>
    <p className="checkout-note">
      {saved.expiresAt !== undefined && <> {t('Link expires on', '链接有效期至')} {new Date(saved.expiresAt).toLocaleDateString(locale)}{t(' · No login required to open.', ' · 无需登录即可启封。')}</>}</p>
  </>;

  const sampleOnly = generative || needsSender;
  const seed = {
    recipient: recipientVisualSeed(recipient) ?? previewSeed.recipient, sender: recipientVisualSeed(self ? recipient : senderAddress) ?? previewSeed.sender, pairedSnow: (mode === 'solo' && pairedSnow) || (artwork.id === 'snowflake' && mode === 'love'), orderId: saved?.id, date: saved?.createdAt,
  };

  return <div className="platform-page counter-page ritual-gallery" data-scene={scene} data-step={step} data-sealing={sealing} data-reserve={(mode === 'love' && !!agreementDraft.amounts[0]) || (reserveEnabled && Number(reserve.amount) > 0)} style={{ '--seal-progress': sealProgress } as React.CSSProperties} lang={locale}>
    <header className="boutique-header counter-header">
      <Link className="counter-back" href={zodiac ? '/#series' : '/#gifts'}>{t('← Back to Room', '← 返回展厅')}</Link>
      <Link className="boutique-brand" href="/">MEMENT</Link>
      <div className="ritual-header-controls"><SoundToggle {...sound}/><WalletTrigger className="counter-wallet"/><LanguageSwitch/></div>
    </header>
    <main className="counter-layout" id="main">
      <section className="counter-stage" aria-label={step === 'saved' ? t('Gift invitation', '取礼邀请函') : t('Artwork display', '作品展龛')}>
        <div className="ritual-particles" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties}/>)}</div>
        {step === 'saved' ? (invitationUrl && <div className="invitation-preview">
          <img src={invitationUrl} width={1080} height={1500} alt={t('Mement gift invitation with QR code', '带二维码的 Mement 取礼邀请函')}/>
        </div>) : <div className="ritual-object">
          <div className="boutique-niche counter-niche">
            {zodiac?.stage ?? <ArtworkPresentation artwork={artwork} seed={seed} active={!cabinOpen}/>}
          </div>
          {index >= 2 && index < 4 && <div className={`stationery-card ritual-live-card paper-${paper}`}>
            <div className="stationery-card-head"><span>MEMENT</span><time>{todayText}</time></div>
            <strong className={isHexWalletAddress(recipient) ? 'is-hex-address' : undefined}>{t('To', '致')} <AddressChip value={recipient} fallback={t('You', '你')}/></strong>
            <blockquote className="stationery-quote">{message}</blockquote>
            <div className="ritual-live-sign">— <AddressChip value={sender}/></div>
          </div>}
          {step === 'sealing_animation' && <div className="ritual-parcel" aria-hidden="true"><i/><b>MEMENT</b></div>}
        </div>}
        <p className="counter-spec">{title} · {artist} · {artwork.price} {artwork.currency} · {t('Edition limit', '发行上限')} {artwork.editionLimit}</p>
        {step === 'saved' && saved && <p className="counter-spec ritual-aura">{t('Gift preview sealed', '礼盒预览已封缄')} · {new Date(saved.createdAt).toLocaleDateString(locale)}</p>}
        {index > 0 && index < 4 && mode === 'love' && Number(agreementDraft.amounts[0]) > 0 &&
          <p className="counter-spec ritual-aura">{agreementDraft.amounts[0]} {agreementDraft.token ?? 'BNB'}{Number(agreementDraft.amounts[1]) > 0 ? ` + ${agreementDraft.amounts[1]} ${agreementDraft.token ?? 'BNB'}` : ''}{agreementDraft.date && ' · ' + agreementDraft.date}</p>}
        {index > 0 && index < 4 && reserveEnabled && mode !== 'love' && Number(reserve.amount) > 0 &&
          <p className="counter-spec ritual-aura">{reserve.amount} {reserve.token === 'custom' ? t('Community token', '社区代币') : reserve.token} · {
            { instant: t('Instant Unseal', '即时启封'), date: t('Time Capsule', '时间胶囊'), price: t('Price Milestone', '里程碑解锁') }[reserve.unlock]}{reserve.unlock === 'date' && reserve.date && ` · ${reserve.date}`}{reserve.unlock === 'price' && reserve.price && ` · $${reserve.price} / ${t(`max ${reserve.maxYears ?? 3}Y`, `最长 ${reserve.maxYears ?? 3} 年`)}`}</p>}
        {step === 'artwork' && zodiac?.controls}
      </section>

      <section className="counter-desk">
        <div className="counter-desk-inner">
          <h1 ref={heading} id="gift-checkout-heading" tabIndex={-1} className="sr-only">
            {stages[index]}
          </h1>

          {step === 'artwork' && <>
            <div className="ritual-occasions" role="group" aria-label={stages[0]}>
              {occasions.map(({ kind, label, subtitle }, position) => <button type="button" key={kind}
                data-active={scene === kind} aria-describedby={scene === kind ? 'ritual-occasion-tip' : undefined}
                onPointerEnter={event => { if (event.pointerType === 'mouse') setHoverMode(kind); }}
                onPointerLeave={() => setHoverMode(undefined)}
                onFocus={() => setFocusMode(kind)} onBlur={() => setFocusMode(undefined)}
                onClick={() => { setHoverMode(undefined); setFocusMode(undefined); changeMode(kind); go('reserve'); }}>
                <span className="ritual-occasion-title"><span aria-hidden="true">0{position + 1}</span> {label}</span>
                <span className="ritual-occasion-subtitle" aria-hidden="true">{subtitle}</span>
              </button>)}
            </div>
            <p className="ritual-occasion-tip" id="ritual-occasion-tip">
              {occasions.map(({ kind, tip }) => <span key={kind} data-active={scene === kind} aria-hidden={scene !== kind}>{tip}</span>)}
            </p>
          </>}

          {step === 'reserve' && <form className="checkout-form" onSubmit={advanceReserve}>
            {mode === 'love' ? <>
              <p className="ritual-eyebrow ritual-promise">{t('SHARED PROMISE', 'SHARED PROMISE · 双人约定')}</p>
              <LoveVaultFields value={agreementDraft} onChange={setAgreementDraft}/>
            </> : self ? <>
              <p className="ritual-eyebrow">{t('TO FUTURE ME', 'TO FUTURE ME · 致未来的自己')}</p>
              <div className="ritual-field">
                <p className="ritual-hint">{t('Once sealed onchain, funds cannot be redeemed early until the date or price milestone is reached.', '链上封缄后无法提前赎回，直至约定日期或目标币价达成。')}</p>
                <p className="ritual-hint">{t('Demo preview · no funds move.', '演示预览 · 不转移资产。')}</p>
              </div>
              <ReserveFields value={reserve} lockedOnly onChange={setReserve} onGate={setReserveGate}/>
            </> : <>
              <div className="ritual-reserve-tabs" role="group" aria-label={t('Gift reserve', '礼金选项')}>
                <button type="button" aria-pressed={reserveEnabled} onClick={() => setReserveEnabled(true)}>{t('Enclose a reserve', '封入礼金')}</button>
                <button type="button" aria-pressed={!reserveEnabled} onClick={() => setReserveEnabled(false)}>{t('Artwork only', '仅赠作品')}</button>
              </div>
              {reserveEnabled ? <ReserveFields value={reserve} onChange={setReserve} onGate={setReserveGate}/> :
                <p className="ritual-hint">{t('Give the artwork on its own, without a gift reserve.', '仅赠艺术品本身，不附带额外礼金。')}</p>}
            </>}
            <div className="ritual-action-footer">
              <button type="button" className="counter-back-step" onClick={() => go('artwork')}>{t('← Back to occasion', '← 返回场景')}</button>
              <button type="submit" className="ritual-cta">{t('Continue to note', '继续写留言')} →</button>
            </div>
          </form>}

          {step === 'compose' && <form onSubmit={review} className="checkout-form">
            {sampleOnly && <div className="ritual-inline-actions">
              <button type="button" className="boutique-link" onClick={() => {
                const randomAddress = () => '0x' + Array.from(crypto.getRandomValues(new Uint8Array(20)), byte => byte.toString(16).padStart(2, '0')).join('');
                const to = randomAddress(), from = randomAddress();
                setPreviewSeed({ recipient: to, sender: from });
                setRecipient(to);
                if (needsSender || pairedSnow) setSenderAddress(from);
              }}>{t('Generate random 0x', '生成随机 0x 地址')}</button>
              {artwork.id === 'snowflake' && mode === 'solo' && <GiftingSwitch label={t('Pair two identities', '双身份雪花')} checked={pairedSnow} onChange={setPairedSnow}/>}
            </div>}
            <div className="paper-picker" role="group" aria-label={t("Choose a paper finish", "选择信纸纸色")}>
              <span className="paper-picker-label">{t("Paper finish", "信纸纸色 · PAPER")}</span>
              <div className="paper-swatches">
                {paperOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={paper === opt.id}
                    className="paper-swatch-btn"
                    onClick={() => setPaper(opt.id)}
                  >
                    <span className="paper-swatch-dot" style={{ background: opt.swatch }} aria-hidden="true"/>
                    {t(opt.en, opt.zh)}
                  </button>
                ))}
              </div>
            </div>

            <div className="stationery-field">
              <label htmlFor="gift-recipient">{self ? t('To · Your future self (.ai wallet, email, @handle or 0x)', '致 · 未来的自己（.ai 钱包地址、邮箱、@账号或 0x）') : t('To · .ai wallet, email, @handle or 0x address', '致 · .ai 钱包地址、邮箱、@账号或 0x 地址')}</label>
              <input id="gift-recipient" required maxLength={100} autoComplete="off" spellCheck={false} value={recipient}
                aria-describedby={error && !normalizeGiftRecipient(recipient) ? "gift-recipient-hint gift-checkout-error" : "gift-recipient-hint"}
                aria-invalid={!!error && !normalizeGiftRecipient(recipient)}
                onChange={event => setRecipient(event.target.value)} placeholder={t('e.g. alice.ai, email, @handle or 0x…', '例如 alice.ai、邮箱、@账号或 0x…')}/>
              <p className="ritual-hint" id="gift-recipient-hint">{t('Upon payment, this gift is immediately minted as a non-transferable (Soulbound) NFT directly to a 0x wallet; for .ai / email recipients, they can unseal via link without a wallet.', '支付完成后，礼物将立即铸造为不可转让（Soulbound）NFT 发送至收礼人的 0x 钱包；填写 .ai 域名或邮箱时，对方也可凭链接免登录拆礼。')}</p>
            </div>
            {showSenderField && <div className="stationery-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <label htmlFor="gift-sender">{t('From · Connected wallet or .ai identity', '来自 · 送礼人（默认取当前登录钱包）')}</label>
                {!connectedWallet ? (
                  <button type="button" className="boutique-link" style={{ color: '#F2743A', fontSize: 12 }} disabled={connectingSender} onClick={async () => {
                    setConnectingSender(true);
                    setError('');
                    try {
                      const { address } = await connectBscTestnetSigner();
                      setConnectedWallet(address);
                      setSenderAddress(address);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : t('Wallet connection failed.', '连接钱包失败。'));
                    } finally {
                      setConnectingSender(false);
                    }
                  }}>
                    {connectingSender ? t('Connecting wallet…', '连接钱包中…') : t('Connect wallet to autofill ↗', '尚未登录钱包 · 点此连接并自动填入 ↗')}
                  </button>
                ) : (
                  <span style={{ fontSize: 11, color: '#6EE7B7' }}>● {t('Autofilled from wallet', '已默认填入当前登录钱包')}</span>
                )}
              </div>
              <input id="gift-sender" required={needsSender} maxLength={100} value={senderAddress} autoComplete="off" spellCheck={false}
                aria-invalid={needsSender && !!error && !normalizeGiftRecipient(senderAddress)}
                aria-describedby={needsSender && error && !normalizeGiftRecipient(senderAddress) ? "gift-checkout-error" : undefined}
                placeholder={t('Connect wallet above or enter jimu.ai / 0x…', '请先连接上方钱包，或输入你的 .ai 域名 / 0x 地址')} onChange={event => setSenderAddress(event.target.value)}/>
            </div>}
            <div className="stationery-field">
              <label htmlFor="gift-message">{t("Note", "祝福语 · NOTE")}</label>
              {prompts.length > 0 && <div className="ritual-prompt-chips" role="group" aria-label={t('Note inspiration', '留言灵感')}>
                {prompts.map(prompt => <button type="button" key={prompt} onClick={() => setMessage(prompt)}>{prompt}</button>)}
              </div>}
              <textarea id="gift-message" rows={3} maxLength={280} value={message} onChange={event => setMessage(event.target.value)}/>
              <div className="stationery-card-foot">
                <span>— {formatCardIdentity(sender)}</span>
                <span className="checkout-count">{message.length} / 280</span>
              </div>
              {!self && (
                <div style={{ marginTop: 10 }}>
                  <GiftingSwitch
                    label={t('Private note (recipient wallet signature required to read)', '私密信笺（仅收礼人钱包签名验证后可阅读，无 Gas）')}
                    checked={privateNote}
                    onChange={setPrivateNote}
                  />
                </div>
              )}
            </div>

            <div className="ritual-action-footer">
              <button className="counter-back-step" type="button" onClick={() => go('reserve')}>{t('← Back to reserve', '← 返回礼金')}</button>
              <button className="ritual-cta" type="submit">{t('Continue to sealing', '前往封缄')} <span aria-hidden="true">→</span></button>
            </div>
          </form>}

          {step === 'review' && <>
            <p className="ritual-eyebrow">{t('Final check', 'FINAL CHECK · 封缄清单')}</p>
            <dl className="ritual-seal-summary">
              <div><dt>{stages[0]}</dt><dd>{occasions.find(occasion => occasion.kind === mode)?.label}</dd></div>
              <div>
                <dt>{t('Gift price', '礼物售价')}</dt>
                <dd>{canSealOnchain && mode !== 'love' && vaultInfo ? `${vaultInfo.priceBnb} tBNB` : `${artwork.price} ${artwork.currency}`}</dd>
              </div>
              <div><dt>{stages[1]}</dt><dd>{mode === 'love' ? `${agreementDraft.amounts[0]} ${agreementDraft.token ?? 'BNB'}${Number(agreementDraft.amounts[1]) > 0 ? ` + ${agreementDraft.amounts[1]} ${agreementDraft.token ?? 'BNB'}` : ''} · ${agreementDraft.date}` :
                reserveEnabled ? <>{reserve.amount} {reserve.token === 'custom' ? t('Custom', '自定义') : reserve.token} · {
                  reserve.unlock === 'date' ? reserve.date : reserve.unlock === 'price' ?
                    t(`$${reserve.price} / max ${reserve.maxYears ?? 3}Y`, `$${reserve.price} / 最长 ${reserve.maxYears ?? 3} 年`) : t('Instant unseal', '即时启封')} <span style={{ color: '#8A96A3', fontSize: 11 }}>({t('0% fee · 100% to recipient', '0% 手续费 · 全额归收礼人')})</span></> :
                  t('Artwork only', '仅赠作品')}</dd></div>
              {canSealOnchain && onchainMode && <div>
                <dt>{t('Wallet total', '本次钱包支付')}</dt>
                <dd style={{ color: '#F2743A', fontWeight: 600 }}>
                  {totalWalletBnb} tBNB
                  <span style={{ color: '#8A96A3', fontSize: 11, fontWeight: 400, marginLeft: 8 }}>
                    {mode === 'love'
                      ? t('(2 wallet steps: ① create promise → ② deposit tBNB)', '（需钱包确认 2 笔：① 创建约定 → ② 存入首笔 tBNB）')
                      : t(`(Mint Soulbound NFT to recipient · Non-transferable)`, '（支付即铸造不可转让 Soulbound NFT 发往收礼人钱包）')}
                  </span>
                </dd>
              </div>}
              <div><dt>{t('Recipient', '收礼人')}</dt><dd><AddressChip value={recipient}/></dd></div>
              <div>
                <dt>{t('Payment', '链上支付')}</dt>
                <dd style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                  {canSealOnchain ? <>
                    <button type="button" className="boutique-link" style={{ color: onchainMode ? '#6EE7B7' : '#A0A1A3' }} onClick={() => setOnchainMode(true)}>
                      {onchainMode ? '● ' : ''}{t('Pay with Wallet (BSC Testnet 97)', '调起钱包支付（BSC 测试网）')}
                    </button>
                    <button type="button" className="boutique-link" style={{ color: !onchainMode ? '#F2743A' : '#A0A1A3' }} onClick={() => setOnchainMode(false)}>
                      {!onchainMode ? '● ' : ''}{t('Instant Preview', '本地快速预览')}
                    </button>
                  </> : <Link className="boutique-link" href="/testnet/deploy" style={{ color: '#F2743A' }}>
                    {t('Contracts not deployed yet · Deploy on /testnet/deploy to enable wallet payment →', '测试网合约尚未部署 · 点此前往 /testnet/deploy 部署后即可调起钱包支付 →')}
                  </Link>}
                </dd>
              </div>
            </dl>
            <div className="seal-control">
              <button
                type="button"
                className={`seal-hold-btn ${sealing ? 'is-sealing' : ''}`}
                disabled={pending}
                onPointerDown={event => {
                  if (!event.isPrimary || event.button !== 0 || holdRaf.current !== null) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  startHold();
                }}
                onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) cancelHold(); }}
                onPointerCancel={event => { if (event.isPrimary) cancelHold(); }}
                onLostPointerCapture={cancelHold}
                onContextMenu={event => event.preventDefault()}
                onBlur={cancelHold}
                onKeyDown={event => {
                  if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault();
                    if (!event.repeat) startHold();
                  }
                }}
                onKeyUp={event => {
                  if (event.key === ' ' || event.key === 'Enter') cancelHold();
                }}
              >
                <span className="seal-progress-fill" style={{ transform: `scaleX(${sealProgress})` }} aria-hidden="true"/>
                <span className="seal-btn-content">
                  <span className="ritual-seal-mark" aria-hidden="true">
                    <span className="ritual-seal-dot"/>
                    <svg className="seal-ring" width="26" height="26" viewBox="0 0 26 26">
                      <circle className="seal-ring-track" cx="13" cy="13" r="11"/>
                      <circle className="seal-ring-arc" cx="13" cy="13" r="11" pathLength="1"
                        strokeDasharray="1" strokeDashoffset={1 - sealProgress}/>
                    </svg>
                  </span>
                  <span>
                    {pending ? t("Stamping the seal…", "正在盖印封缄…") : sealing ? t(`Keep holding · ${Math.round(sealProgress * 100)}%`, `保持按住 · ${Math.round(sealProgress * 100)}%`) : t("Hold for 2 seconds to seal", "长按 2 秒 · 封缄并生成礼盒")}
                  </span>
                </span>
              </button>
            </div>

            <div className="ritual-action-footer">
              <button type="button" className="counter-back-step" disabled={pending} onClick={() => go('compose')}>{t('← Edit your note', '← 返回修改留言')}</button>
            </div>
          </>}

          {step === 'sealing_animation' && <p role="status">{t('Sealing the parcel…', '正在封缄礼盒…')}</p>}

          {step === 'saved' && invitation}


          {error && <p className="error" id="gift-checkout-error" role="alert">{giftErrorText(error, language)}</p>}
        </div>
      </section>
    </main>
    {step === 'artwork' && testnetAvailable &&
      <Link className="boutique-link ritual-wallet-link" href={'/wallet?artwork=' + artwork.id}>{t('Wallet gifting ↗', '钱包赠礼 ↗')}</Link>}
    <div className="ritual-progress-dock" role="group" aria-label={t('Gifting progress', '赠礼进度')}>
      <div aria-hidden="true"><span className="progress-num">0{index + 1}</span> / 05</div>
      <ol>
        {stages.map((label, position) => {
          const destination = destinations[position];
          const current = position === index;
          const complete = position < index;
          return <li key={position} aria-current={current ? 'step' : undefined} data-complete={complete}>
            {complete && destination ?
              <button type="button" aria-label={label} title={label} disabled={pending || sealing || step === 'sealing_animation'} onClick={() => go(destination)}/> :
              <span role="img" aria-label={label} title={label}/>}
          </li>;
        })}
      </ol>
    </div>
    {onchainProgress && <div className="onchain-wait-backdrop" role="presentation">
      <div className="onchain-wait-modal" role="dialog" aria-modal="true" aria-live="polite">
        <span className="onchain-wait-lamp" aria-hidden="true"/>
        <div className="onchain-wait-orbit" aria-hidden="true">
          <span className="onchain-wait-spinner"/>
          <span className="onchain-wait-core"/>
        </div>
        <p className="onchain-wait-eyebrow">BNB SMART CHAIN TESTNET · CHAIN 97</p>
        <h3>{
          onchainProgress.step === 'wallet'
            ? (mode === 'love' ? t('Step 1/2 · Confirm creating Promise in wallet', '第 1 / 2 步 · 请在钱包确认创建双人约定') : t('Confirm sealing & minting in wallet', '请在钱包中确认支付与铸造 NFT'))
            : onchainProgress.step === 'confirming'
              ? (mode === 'love' ? t('Step 1/2 · Waiting for BNB Chain confirmation…', '第 1 / 2 步 · 正在等待 BNB Chain 区块确认…') : t('Waiting for BNB Chain block confirmation…', '交易已广播 · 正在等待 BNB Chain 区块确认…'))
              : onchainProgress.step === 'wallet_2'
                ? t('Step 2/2 · Confirm depositing tBNB in wallet', '第 2 / 2 步 · 请在钱包确认存入首笔 tBNB')
                : t('Step 2/2 · Confirming deposit onchain…', '第 2 / 2 步 · 正在等待礼金入库区块确认…')
        }</h3>
        <p className="onchain-wait-copy">{t(
          'Onchain confirmation typically takes 3–8 seconds. Once confirmed, your non-transferable Soulbound NFT and invitation card will appear automatically—please keep this page open.',
          '区块确认通常需要 3–8 秒，确认完成后将自动铸造不可转让礼物 NFT 并跳转至取礼邀请函，请稍候片刻、勿关闭页面。',
        )}</p>
        {onchainProgress.txHash && (
          <a className="onchain-wait-tx" href={`${testnet.explorer}/tx/${onchainProgress.txHash}`} target="_blank" rel="noreferrer">
            {t('Track live transaction on BscScan', '在 BscScan 实时查看交易进度')} · {onchainProgress.txHash.slice(0, 8)}…{onchainProgress.txHash.slice(-6)} ↗
          </a>
        )}
      </div>
    </div>}
  </div>;
}
