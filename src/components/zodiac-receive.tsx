'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { getZodiacById, type ActiveZodiacId, type ZodiacFilter } from '../domain/zodiac';
import type { VaultDraft } from '../domain/vault-gift';
import { LocalText, useLanguage } from '../lib/i18n';
import { zodiacEnglish } from '../lib/gift-copy';
import { SculptureMount } from './artwork-presentation';
import { LoveVaultStatus } from './love-vault';
import type { LoveAgreement } from '../domain/gifting-modes';
import VaultPlaque from './vault-plaque';
import { Countdown, useClock } from './vault-preview-controls';
import { GroupLetter } from './group-gift';
import { isHexWalletAddress } from '../lib/generative-art';
import AddressChip from './address-chip';
import { friendlyWalletError, verifyRecipientNoteSignature, type OnchainSealProof } from '../lib/bsc-testnet-client';
import { testnet } from '../lib/testnet';
import GiftClaimBinding from './gift-claim-binding';
import { ReserveReceipt } from './reserve-fields';
import type { ReservePlan } from '../domain/reserve-plan';
import type { GroupNote } from '../lib/zodiac-share';
import { ReceiveHeader, useRitualSound } from './gift-ritual';
import { playLightReveal, playUnsealSlide } from '../lib/ritual-sound';

const ZodiacStage = dynamic(() => import('./zodiac-stage'), { ssr: false,
  loading: () => <p className="zodiac-stage-loading" role="status"><LocalText en="Preparing the sculpture…" zh="正在准备藏品…"/></p>,
});

export default function ZodiacReceive({ sign, filter, paper, recipient, sender, message, vault, reserve, notes, agreement, archiveId, createdAt, onchain, privateNote = false }: {
  sign: ActiveZodiacId; filter: ZodiacFilter; paper: 'rice' | 'slate' | 'graphite';
  recipient?: string; sender: string; message?: string; vault?: VaultDraft; reserve?: ReservePlan; notes?: GroupNote[]; agreement?: LoveAgreement; archiveId?: string; createdAt?: string; onchain?: OnchainSealProof; privateNote?: boolean;
}) {
  const { language, locale, t } = useLanguage();
  const [noteUnlocked, setNoteUnlocked] = useState(!privateNote);
  const [unlockingNote, setUnlockingNote] = useState(false);
  const [noteError, setNoteError] = useState('');
  const spec = getZodiacById(sign);
  const english = zodiacEnglish[sign];
  const title = t(spec.nameEn, spec.nameCn);
  const to = recipient || t('You', '你');
  const [phase, setPhase] = useState<'sealed' | 'revealing' | 'open' | 'dissolving' | 'archive'>('sealed');
  const unlockTime = vault?.unlockTime;
  const now = useClock(phase === 'sealed' && !!unlockTime);
  const locked = !!unlockTime && (now === undefined || now < unlockTime);
  const [progress, setProgress] = useState(0);
  const [theatre, setTheatre] = useState(false);
  const [redeemedOn, setRedeemedOn] = useState('');
  const [dragging, setDragging] = useState(false);
  const sound = useRitualSound();
  const started = useRef(false);
  const stage = useRef<HTMLElement>(null);
  const letter = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!vault && !reserve) return;
    try {
      const redeemed = sessionStorage.getItem('zodiac-keepsake:' + (archiveId ?? location.pathname + location.search));
      if (redeemed && Number.isFinite(Date.parse(redeemed))) {
        setRedeemedOn(redeemed);
        setPhase('archive');
      }
    } catch {}
  }, [vault, reserve, archiveId]);

  useEffect(() => {
    if (phase === 'open' || phase === 'archive') letter.current?.focus({ preventScroll: true });
    if (phase !== 'dissolving') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setPhase('archive'), reduced ? 0 : 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    function sync() {
      setTheatre(document.fullscreenElement === stage.current);
    }
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  function unseal() {
    if (locked || started.current || phase !== 'sealed') return;
    started.current = true;
    sound.prepare();
    if (sound.enabled) playUnsealSlide();
    setPhase('revealing');
  }

  function revealComplete() {
    if (phase !== 'revealing') return;
    if (sound.enabled) playLightReveal();
    setPhase('open');
  }

  function archive() {
    const date = new Date().toISOString();
    try { sessionStorage.setItem('zodiac-keepsake:' + (archiveId ?? location.pathname + location.search), date); } catch {}
    setRedeemedOn(date);
    setPhase('dissolving');
  }

  async function toggleTheatre() {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else if (theatre) {
      setTheatre(false);
    } else {
      try { await stage.current?.requestFullscreen(); }
      catch { setTheatre(true); }
      if (!stage.current?.requestFullscreen) setTheatre(true);
    }
  }

  return <main lang={locale} className={`zodiac-receive zodiac-receive-${phase} receive-gallery`} data-promise={!!agreement && phase !== 'sealed'} onKeyDown={event => {
    if (event.key === 'Escape' && theatre && !document.fullscreenElement) setTheatre(false);
  }}>
    <ReceiveHeader sound={sound}/>
    {phase === 'sealed' ? <section className="unseal-stage" aria-label={t("Unseal zodiac gift", "启封生肖礼物")}>
      <div className="unseal-envelope zodiac-private-envelope">
        <span className="unseal-strip-line" aria-hidden="true"/>
        <h1>{t("A birthday gift sealed for you", "一份为你封好的生日礼物")}</h1>
        <p className="unseal-parties">{t('From','来自')} <AddressChip value={sender}/> · {t('To','致')} <AddressChip value={to}/></p>
        {locked && unlockTime ? <div className="zodiac-sealed-lock">
          <p>{t('Sealed until', '封存至')} <time dateTime={new Date(unlockTime * 1000).toISOString()}>{new Date(unlockTime * 1000).toLocaleString(locale)}</time></p>
          <Countdown target={unlockTime} now={now}/>
        </div> : <>
        <div className={`unseal-slider${dragging ? ' is-dragging' : ''}`}
          role="slider" tabIndex={0} aria-label={t("Slide right to reveal the 3D sculpture", "向右轻划，启封 3D 藏品")}
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}
          onPointerDown={event => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
            sound.prepare();
          }}
          onPointerMove={event => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            const frame = event.currentTarget.getBoundingClientRect();
            const value = Math.max(0, Math.min(1, (event.clientX - frame.left - 24) / (frame.width - 48)));
            setProgress(value);
            if (value >= .78) unseal();
          }}
          onLostPointerCapture={() => { setDragging(false); setProgress(0); }}
          onKeyDown={event => {
            if (['Enter', ' ', 'ArrowRight', 'End'].includes(event.key)) { event.preventDefault(); unseal(); }
          }}>
          <span className="unseal-slider-fill" style={{ width: `${Math.max(12, progress * 100)}%` }} aria-hidden="true"/>
          <span className="unseal-slider-thumb" style={{ left: `calc(${progress} * (100% - 48px) + 4px)` }} aria-hidden="true">→</span>
          <span className="unseal-slider-text">{t("Slide right to reveal the 3D sculpture", "向右轻划，启封 3D 藏品")}</span>
        </div>
        </>}
      </div>
    </section> : <div className="receive-gallery-layout">
      <figure className="receive-figure">
        <section ref={stage} className={`boutique-niche receive-niche zodiac-private-stage${theatre ? ' is-theatre' : ''}`} data-enclosed={!!(reserve || vault || agreement) && phase !== 'archive'} aria-label={`${title} · ${t('3D sculpture','三维藏品')}`}>
          {phase === 'archive' ? <img className="zodiac-archive-image" src={spec.previewUrl} alt={title}/>
            : <SculptureMount><ZodiacStage sign={sign} filter={filter} mode="studio" onRevealComplete={revealComplete} dissolving={phase === 'dissolving'}/></SculptureMount>}
          {theatre && <button type="button" className="boutique-link zodiac-theatre-toggle" onClick={() => void toggleTheatre()}>
            {t("Exit fullscreen view", "退出凝视")}
          </button>}
        </section>
        <figcaption className="receive-figcaption">
          <span>{title} · GILDED VOXEL ZODIAC</span>
          {(phase === 'open' || phase === 'archive') && <button type="button" className="boutique-link" onClick={() => void toggleTheatre()}>
            {t("View full screen ↗", "熄灯全屏凝视 ↗")}
          </button>}
        </figcaption>
      </figure>
      {phase !== 'revealing' && <section className="receive-editorial">
        <div className={`stationery-card receive-note-card paper-${paper}`}>
          <div className="stationery-card-head"><span>{t('A NOTE, JUST FOR YOU', '一封写给你的信')}</span></div>
          <h1 ref={letter} tabIndex={-1} className={isHexWalletAddress(to) ? 'is-hex-address' : undefined}>{t('To','致')} <AddressChip value={to}/></h1>
          {recipient && <GiftClaimBinding recipient={recipient}/>}
          {!noteUnlocked ? (
            <div className="private-note-veil">
              <p>{t('This private letter is locked for the recipient wallet only.', '这是一封私密信笺，需验证收礼人钱包签名后方可阅读。')}</p>
              <button type="button" className="private-note-btn" disabled={unlockingNote} onClick={async () => {
                setUnlockingNote(true);
                setNoteError('');
                try {
                  await verifyRecipientNoteSignature(to, archiveId ?? sign);
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
          ) : notes ? <GroupLetter recipient={to} notes={notes}/>
            : <p className="platform-message">{message || t(english.greeting,spec.defaultBlessing)}</p>}
          <div className="stationery-card-foot"><span>— <AddressChip value={sender}/></span><span>{t(english.seal,spec.sealText)}</span></div>
        </div>
        <div className="receive-nft-badge" role="note">
          <span className="receive-nft-dot" aria-hidden="true"/>
          <span>
            {t('Non-transferable Soulbound NFT · Delivered to ', '链上不可转让礼物 NFT（Soulbound）· 已铸造至 ')}
            <AddressChip value={to}/>
            {t('', ' 的钱包')}
            {onchain && <> · <a href={`${testnet.explorer}/tx/${onchain.txHash}`} target="_blank" rel="noreferrer">{t('BscScan ↗', '链上凭证 ↗')}</a></>}
          </span>
        </div>
        {agreement && <LoveVaultStatus agreement={agreement} sender={sender} recipient={to} onchain={onchain?.kind === 'love-vault' ? onchain : undefined}/>}
        <ReserveReceipt giftId={archiveId} createdAt={createdAt} recipient={recipient} plan={reserve} archived={!!redeemedOn} onchain={onchain?.kind === 'vault-gift' ? onchain : undefined} onArchive={archive}/>
        {vault && <VaultPlaque demo={vault} onDemoRedeemed={archive} demoRedeemed={!!redeemedOn}/>}
        <details className="archival-certificate" open={phase === 'archive' ? true : undefined}>
          <summary>{t("Archival certificate", "美术馆典藏档案")}</summary>
          <div className="cert-body">
            <dl>
              <div><dt>{t("Object", "藏品")}</dt><dd>{title}</dd></div>
              <div><dt>{t("Series", "系列")}</dt><dd>GILDED VOXEL ZODIAC</dd></div>
              <div><dt>{t("Sender", "赠送人")}</dt><dd><AddressChip value={sender}/></dd></div>
              <div><dt>{t("Recipient", "收礼人")}</dt><dd><AddressChip value={to}/></dd></div>
              {onchain ? <div><dt>{t("Onchain record", "链上记录")}</dt><dd><a href={`${testnet.explorer}/tx/${onchain.txHash}`} target="_blank" rel="noreferrer">{t("View on BscScan ↗", "在 BscScan 查看交易 ↗")}</a></dd></div>
                : <div><dt>{t("Record", "记录")}</dt><dd>{t("Gift preview", "赠礼预览")}</dd></div>}
              {redeemedOn && <div><dt>{t("Archived on", "归档时间")}</dt><dd><time dateTime={redeemedOn}>{new Date(redeemedOn).toLocaleString(locale)}</time></dd></div>}
            </dl>
          </div>
        </details>
      </section>}
    </div>}
  </main>;
}
