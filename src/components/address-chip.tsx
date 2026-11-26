'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatCardIdentity, isHexWalletAddress } from '../lib/generative-art';
import { useLanguage } from '../lib/i18n';

export default function AddressChip({ value, fallback = '' }: { value?: string; fallback?: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [tipPos, setTipPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const raw = (value ?? '').trim();
  if (!raw) return <>{fallback}</>;
  if (!isHexWalletAddress(raw)) return <>{raw}</>;

  function openTip() {
    const el = btnRef.current;
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    const halfMax = 185;
    const center = rect.left + rect.width / 2;
    const clampedLeft = Math.max(halfMax + 12, Math.min(window.innerWidth - halfMax - 12, center));
    const top = rect.top < 48 ? rect.bottom + 10 : rect.top - 10;
    setTipPos({ left: clampedLeft, top });
  }

  function closeTip() {
    if (!copied) setTipPos(null);
  }

  async function copy(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    openTip();
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setTipPos(null);
      }, 1600);
    } catch {}
  }

  const placeBelow = tipPos && btnRef.current ? btnRef.current.getBoundingClientRect().top < 48 : false;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`address-chip${copied ? ' is-copied' : ''}`}
        onClick={copy}
        onMouseEnter={openTip}
        onMouseLeave={closeTip}
        onFocus={openTip}
        onBlur={closeTip}
        aria-label={t(`Copy full wallet address ${raw}`, `点击复制完整钱包地址 ${raw}`)}
      >
        <span className="address-chip-short">{formatCardIdentity(raw)}</span>
      </button>
      {tipPos && typeof document !== 'undefined' && createPortal(
        <span
          className={`address-chip-portal-tip${copied ? ' is-copied' : ''}${placeBelow ? ' is-below' : ''}`}
          role="tooltip"
          style={{ left: tipPos.left, top: tipPos.top }}
        >
          <span className="address-chip-full">{raw}</span>
          <span className="address-chip-hint">
            {copied ? t('Copied ✓', '已复制 ✓') : t('Click to copy', '点击复制')}
          </span>
        </span>,
        document.body,
      )}
    </>
  );
}
