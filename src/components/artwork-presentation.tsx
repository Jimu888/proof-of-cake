'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, type ReactNode } from 'react';
import { artworkDisplayMode, artworkImage, type Artwork } from '../domain/catalog';
import { useLanguage } from '../lib/i18n';

import SnowflakeArt from './snowflake-art';
import AlgorithmicBondArt from './algorithmic-bond-art';
import { sampleRecipient, sampleSender } from '../lib/generative-art';

export type ArtworkSeed = { recipient?: string; pairedSnow?: boolean; sender?: string; transaction?: string; orderId?: string; date?: string };

const ZodiacStage = dynamic(() => import('./zodiac-stage'), { ssr: false });

export function snowflakeSeed(recipient: string, sender?: string, paired = false) {
  return paired && sender ? sender.toLowerCase() + ':' + recipient.toLowerCase() : recipient.toLowerCase();
}

export function SculptureMount({ children }: { children: ReactNode }) {
  return <div className="artwork-presentation artwork-sculpture-3d">{children}</div>;
}

function MotionArt({ source, poster, title }: { source: string; poster: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    function syncPlayback() {
      if (!video) return;
      if (preference.matches) video.pause();
      else void video.play().catch(() => {});
    }
    syncPlayback();
    preference.addEventListener('change', syncPlayback);
    return () => preference.removeEventListener('change', syncPlayback);
  }, [source]);

  return <div className="motion-artwork">
    <video ref={ref} src={source} poster={poster} aria-label={title} muted loop playsInline preload="metadata"/>
    <span className="motion-indicator" aria-hidden="true">{t('● MOTION', '● 动态')}</span>
  </div>;
}

export default function ArtworkPresentation({ artwork, cover = false, active = true, seed, crystallize = true }: {
  artwork: Artwork; cover?: boolean; active?: boolean; seed?: ArtworkSeed; crystallize?: boolean;
}) {
  const { t } = useLanguage();
  const mode = artworkDisplayMode(artwork);
  const title = t(artwork.name, artwork.title);
  const image = artworkImage(artwork, cover);

  if (mode === 'generative-canvas') {
    const recipient = seed?.recipient?.trim() || sampleRecipient;
    const sender = seed?.sender?.trim() || sampleSender;
    return <div className="artwork-presentation artwork-generative-canvas">
      {artwork.id === 'snowflake' ? <SnowflakeArt address={snowflakeSeed(recipient, sender, seed?.pairedSnow)} active={active} crystallize={crystallize}/>
        : <AlgorithmicBondArt sender={sender} recipient={recipient} transaction={seed?.transaction} orderId={seed?.orderId} date={seed?.date} active={active}/>}
    </div>;
  }

  if (mode === 'sculpture-3d' && artwork.zodiacSign && active) {
    return <SculptureMount><ZodiacStage sign={artwork.zodiacSign} filter="original" mode="hero"/></SculptureMount>;
  }

  return <div className={`artwork-presentation artwork-${mode}`}>
    {mode === 'motion-video' && artwork.videoUrl && active
      ? <MotionArt source={artwork.videoUrl} poster={image} title={title}/>
      : <img src={image} alt={title} className="artwork-print"/>}
  </div>;
}
