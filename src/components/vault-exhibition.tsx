'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { LanguageSwitch, useLanguage } from '../lib/i18n';
import type { GiftSeries } from '../domain/series';

export function VaultEmblem({ kind, active = false }: { kind: 'capsule' | 'love'; active?: boolean }) {
  return <span className={`vault-emblem vault-emblem-${kind}`} data-active={active} aria-hidden="true">
    <i/><i/><b/>
  </span>;
}

export function VaultExhibition({ series, stage, children }: { series: GiftSeries; stage: ReactNode; children: ReactNode }) {
  const { t, locale } = useLanguage();
  return <div className="platform-page vault-exhibition" lang={locale}>
    <header className="boutique-header counter-header">
      <Link className="counter-back" href="/#series">{t('← Exhibitions', '← 主题特展')}</Link>
      <Link className="boutique-brand" href="/">MEMENT</Link>
      <LanguageSwitch/>
    </header>
    <main className="vault-exhibition-grid" id="main">
      <section className="vault-exhibition-stage" aria-label={t('Exhibition cabinet', '特展展柜')}>{stage}</section>
      <section className="vault-workbench">
        <p className="vault-caption">{t(series.code, series.code.replace('EXHIBITION', '主题特展'))}</p>
        <h1>{t(series.titleEn, series.titleCn)}</h1>
        {children}
      </section>
    </main>
  </div>;
}
