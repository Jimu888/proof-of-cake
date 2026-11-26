'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { useLanguage } from '../lib/i18n';

const WinterCabin = dynamic(() => import('./winter-cabin-scene'), { ssr: false });

export default function WinterCabinEntry({ seed, onOpen }: { seed: string; onOpen?: (open: boolean) => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={trigger} type="button" className="winter-cabin-entry boutique-link" onClick={() => { setOpen(true); onOpen?.(true); }}>
      {t('Enter Winter Cabin ↗', '点击赏雪 ↗')}
    </button>
    {open && <WinterCabin seed={seed} onClose={() => { setOpen(false); onOpen?.(false); requestAnimationFrame(() => trigger.current?.focus()); }}/>}
  </>;
}
