'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../lib/i18n';

export default function InfoTip({ en, zh }: { en: string; zh: string }) {
  const { t, locale } = useLanguage();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLSpanElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const pinned = useRef(false);
  const touch = useRef(false);
  const focused = useRef(false);

  function show() {
    clearTimeout(leaveTimer.current);
    setOpen(true);
  }

  function close() {
    clearTimeout(leaveTimer.current);
    pinned.current = false;
    setOpen(false);
  }

  function leave() {
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => {
      if (!focused.current && !pinned.current) setOpen(false);
    }, 150);
  }

  useLayoutEffect(() => {
    if (!open) return;
    function position() {
      const anchor = trigger.current?.getBoundingClientRect();
      const card = popup.current;
      if (!anchor || !card) return;
      const { offsetWidth: width, offsetHeight: height } = card;
      const left = Math.max(8, Math.min(anchor.left + anchor.width / 2 - width / 2, document.documentElement.clientWidth - width - 8));
      const below = anchor.bottom + 8;
      const top = below + height <= window.innerHeight - 8 ? below : anchor.top - height - 8;
      card.style.left = left + 'px';
      card.style.top = Math.max(8, top) + 'px';
    }
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [open, locale]);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !popup.current?.contains(target)) close();
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  return <span className="info-tip">
    <button ref={trigger} type="button" className="info-tip-trigger" aria-label={t('More information', '详细说明')}
      aria-describedby={open ? id : undefined}
      onPointerEnter={event => { if (event.pointerType === 'mouse') show(); }}
      onPointerLeave={leave}
      onPointerDown={event => { touch.current = event.pointerType !== 'mouse'; }}
      onFocus={() => { focused.current = true; if (!touch.current) show(); }}
      onBlur={() => { focused.current = false; touch.current = false; close(); }}
      onClick={() => {
        if (pinned.current) close();
        else { pinned.current = true; show(); }
      }}>i</button>
    {open && typeof document !== 'undefined' && createPortal(
      <span ref={popup} id={id} role="tooltip" lang={locale} className="info-tip-popup"
        onPointerEnter={show} onPointerLeave={leave}>{t(en, zh)}</span>,
      trigger.current?.closest('dialog[open]') ?? document.body,
    )}
  </span>;
}
