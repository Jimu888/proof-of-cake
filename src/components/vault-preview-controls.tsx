'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLanguage } from '../lib/i18n';
import InfoTip from './info-tip';
import { SEAL_HOLD_MS } from './gift-ritual';

export function useClock(enabled = true) {
  const [now, setNow] = useState<number>();
  useEffect(() => {
    if (!enabled) return;
    function tick() { setNow(Math.floor(Date.now() / 1000)); }
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [enabled]);
  return now;
}

export function dateInputValue(seconds: number) {
  const date = new Date(seconds * 1000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function Countdown({ target, now }: { target: number; now?: number }) {
  const { t } = useLanguage();
  const total = now === undefined ? undefined : Math.max(0, target - now);
  const units = [
    [86400, t('days', '日')], [3600, t('hours', '时')], [60, t('min', '分')], [1, t('sec', '秒')],
  ] as const;
  return <div className="vault-countdown" role="timer" aria-label={t('Time remaining', '剩余时间')}>
    {units.map(([size, label], index) => <span key={size}>
      <strong>{total === undefined ? '—' : String(Math.floor(total / size) % ([Infinity, 24, 60, 60][index])).padStart(2, '0')}</strong>
      <small>{label}</small>
    </span>)}
  </div>;
}

export function HoldAction({ children, onConfirm, disabled, tip }: {
  children: ReactNode; onConfirm: () => void; disabled?: boolean; tip: { en: string; zh: string };
}) {
  const { t } = useLanguage();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [holding, setHolding] = useState(false);
  const confirm = useRef(onConfirm);
  confirm.current = onConfirm;
  function cancel() {
    clearTimeout(timer.current);
    timer.current = undefined;
    setHolding(false);
  }
  function start() {
    if (disabled || timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => { cancel(); confirm.current(); }, SEAL_HOLD_MS);
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (disabled) cancel(); }, [disabled]);
  return <div className="vault-hold">
    <div className="vault-inline">
      <button type="button" className="vault-hold-button" data-holding={holding} disabled={disabled}
        onPointerDown={event => { if (event.button === 0) { event.currentTarget.setPointerCapture(event.pointerId); start(); } }}
        onPointerUp={cancel} onPointerCancel={cancel} onLostPointerCapture={cancel}
        onBlur={cancel} onContextMenu={event => event.preventDefault()}
        onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat) start(); } }}
        onKeyUp={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); cancel(); } }}
        onClick={event => { if (!disabled && event.detail === 0) confirm.current(); }}>
        {holding ? t('Keep holding…', '继续按住…') : children}
      </button>
      <InfoTip {...tip}/>
    </div>
    <button type="button" className="boutique-link" disabled={disabled} onClick={onConfirm}>{t('Confirm with a click', '轻点确认')}</button>
  </div>;
}
