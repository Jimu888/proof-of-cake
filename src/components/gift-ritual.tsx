'use client';

import Link from 'next/link';
import { LanguageSwitch, useLanguage } from '../lib/i18n';
import { useEffect, useRef, useState } from 'react';
import { playSealStamp, unlockRitualSound } from '../lib/ritual-sound';

export const SEAL_HOLD_MS = 2000;

export function useRitualSound() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    try { setEnabled(localStorage.getItem('mement-ritual-sound') === 'on'); } catch {}
  }, []);
  function toggle() {
    const next = !enabled;
    if (next) unlockRitualSound();
    setEnabled(next);
    try { localStorage.setItem('mement-ritual-sound', next ? 'on' : 'off'); } catch {}
  }
  return { enabled, toggle, prepare: () => { if (enabled) unlockRitualSound(); } };
}

export function SoundToggle({ enabled, toggle }: { enabled: boolean; toggle: () => void }) {
  const { t } = useLanguage();
  return <button type="button" className="ritual-sound" onClick={toggle} aria-label={t("Ritual sound", "仪式音效")} aria-pressed={enabled}>{enabled ? t('SOUND ON','音效开') : t('SOUND OFF','音效关')}</button>;
}

export function ReceiveHeader({ sound }: { sound: ReturnType<typeof useRitualSound> }) {
  return <header className="receive-header">
    <Link className="boutique-brand" href="/">MEMENT</Link>
    <div className="receive-header-controls"><SoundToggle {...sound}/><LanguageSwitch/></div>
  </header>;
}

export function SealAnimation({ recipient, paper, message, sound }: {
  recipient: string; paper: string; message: string; sound: boolean;
}) {
  const { t } = useLanguage();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (soundRef.current) playSealStamp();
      return;
    }
    const timer = setTimeout(() => { if (soundRef.current) playSealStamp(); }, 930);
    return () => clearTimeout(timer);
  }, []);
  return <div className="seal-animation" role="status" aria-label={t("Sealing your note", "正在把信笺封入礼盒")}>
    <div className={`stationery-card seal-animation-paper paper-${paper}`} aria-hidden="true">
      <span>{t('TO','致')} · {recipient || t('YOU','你')}</span><p>{message}</p>
    </div>
    <div className="seal-animation-envelope" aria-hidden="true"><span>{t('SEALED','已封缄')}</span></div>
  </div>;
}

export function waitForSealAnimation() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return new Promise<void>(resolve => setTimeout(resolve, reduced ? 0 : 1300));
}
