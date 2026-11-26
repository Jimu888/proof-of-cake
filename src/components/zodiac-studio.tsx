'use client';

import { useState } from 'react';
import WalletTrigger from './wallet-trigger';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ZODIAC_FILTERS,
  ZODIAC_LIST,
  getZodiacById,
  isActiveZodiacId,
  type ActiveZodiacId,
  type ZodiacFilter,
  type ZodiacSpec,
} from '../domain/zodiac';

import { LanguageSwitch, LocalText, useLanguage } from '../lib/i18n';
import { zodiacEnglish, type PaperTone } from '../lib/gift-copy';
import GiftCheckout from './gift-checkout';
import { zodiacArtwork } from '../domain/zodiac-artwork';

const ZodiacStage = dynamic(() => import('./zodiac-stage'), {
  ssr: false,
  loading: () => <div className="zodiac-stage-loading" role="status"><LocalText en="Preparing the 3D display…" zh="正在初始化 3D 光学展台…"/></div>,
});

function isFilter(value: string | null): value is ZodiacFilter {
  return value === 'original' || value === 'obsidian' || value === 'hologram' || value === 'emerald';
}

function isPaper(value: string | null): value is PaperTone {
  return value === 'graphite' || value === 'rice' || value === 'slate';
}

const lunarBranches = '子丑寅卯辰巳午未申酉戌亥';
const lunarCalendar = new Intl.DateTimeFormat('en-u-ca-chinese', { year: 'numeric', timeZone: 'UTC' });

export default function ZodiacStudio({ query }: { query: string }) {
  const params = new URLSearchParams(query);
  const sign = params.get('sign');
  const material = params.get('filter');
  const { locale, t } = useLanguage();
  const [activeSign, setActiveSign] = useState<ActiveZodiacId>(isActiveZodiacId(sign) ? sign : 'horse');
  const [filter, setFilter] = useState<ZodiacFilter>(isFilter(material) ? material : 'original');
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [unsealNonce, setUnsealNonce] = useState(0);
  const [pulseNonce, setPulseNonce] = useState(0);

  const [selectionNotice, setSelectionNotice] = useState<ZodiacSpec>();

  const [counterOpen, setCounterOpen] = useState(params.get('checkout') === '1');
  const [birthday, setBirthday] = useState('');
  const [birthdayMatch, setBirthdayMatch] = useState<ZodiacSpec>();
  const [initial, setInitial] = useState(() => {
    const paper = params.get('paper');
    return {
      paper: isPaper(paper) ? paper : undefined,
      recipient: params.get('to')?.slice(0, 100),
      sender: params.get('from')?.slice(0, 80),
      message: params.get('msg')?.slice(0, 280),
    };
  });

  const spec = getZodiacById(activeSign);
  const english = zodiacEnglish[activeSign];
  const signTitle = t(spec.nameEn, spec.nameCn);
  const year = t(english.year, spec.yearTag);

  function selectZodiac(item: ZodiacSpec) {
    if (!item.available || !isActiveZodiacId(item.id)) {
      setSelectionNotice(item);
      return;
    }
    setActiveSign(item.id);
    setInitial(draft => ({ ...draft, message: undefined }));
    setSelectionNotice(undefined);
  }

  function matchBirthday(date: string) {
    setBirthday(date);
    setBirthdayMatch(undefined);
    if (!date) return;
    const day = new Date(date + 'T12:00:00Z');
    if (!Number.isFinite(day.getTime())) return;
    const parts = lunarCalendar.formatToParts(day);
    const lunarYear = Number(parts.find(({ type }: { type: string }) => type === 'relatedYear')?.value);
    const index = ((lunarYear - 4) % 12 + 12) % 12;
    const match = ZODIAC_LIST.find(item => item.branch === lunarBranches[index]);
    if (match) {
      setBirthdayMatch(match.available ? match : undefined);
      selectZodiac(match);
    }
  }

  const stage = <ZodiacStage sign={activeSign} mode="studio" filter={filter} motionEnabled={motionEnabled}
    unsealNonce={unsealNonce} pulseNonce={pulseNonce}/>;

  if (counterOpen) {
    const artwork = zodiacArtwork('zodiac-' + activeSign)!;
    return <GiftCheckout artwork={artwork} zodiac={{
      filter, initial, greeting: t(english.greeting, spec.defaultBlessing),
      stage: <div className="counter-zodiac-stage artwork-sculpture-3d">{stage}</div>,
      controls: <div className="ritual-zodiac-controls">
        <div className="ritual-chips" role="group" aria-label={t('Choose a zodiac sign', '选择生肖')}>
          {ZODIAC_LIST.filter(item => item.available).map(item =>
            <button key={item.id} type="button" aria-pressed={item.id === activeSign} onClick={() => selectZodiac(item)}>
              {t(item.id[0].toUpperCase() + item.id.slice(1), item.nameCn)}
            </button>)}
        </div>
        <button type="button" className="boutique-link ritual-studio-link" onClick={() => {
          setCounterOpen(false);
          requestAnimationFrame(() => {
            window.scrollTo(0, 0);
            document.getElementById('zodiac-studio-heading')?.focus({ preventScroll: true });
          });
        }}>{t('3D Studio & Materials ↗', '3D 赏玩台与材质 ↗')}</button>
      </div>,
    }}/>;
  }

  return (
    <div className="zodiac-page" lang={locale}>
      <header className="boutique-header zodiac-header">
        <div className="zodiac-header-left">
          <Link className="boutique-brand" href="/">MEMENT</Link>
          <span className="zodiac-header-tag">{t("GILDED VOXEL ZODIAC", "GILDED VOXEL ZODIAC · 十二生肖 · 鎏金像素")}</span>
        </div>
        <nav className="boutique-nav" aria-label={t("Main navigation", "主导航")}>
          <Link href="/">{t("Vitrine", "橱窗")}</Link>
          <Link className="is-active" aria-current="page" href="/#series">{t("Room", "展厅")}</Link>
          <Link href="/creators/apply">{t("Creators", "创作者")}</Link>
          <WalletTrigger/>
          <LanguageSwitch/>
        </nav>
      </header>

      <main className="zodiac-workspace" id="main">
        <Link className="boutique-link zodiac-breadcrumb" href="/#series">{t("← Back to Room / Exhibition 01", "← 返回展厅 / 主题特展 01")}</Link>
        <section className="zodiac-top-controls" aria-label={t("Zodiac navigation", "十二生肖导航")}>
          <div className="zodiac-rail" role="group" aria-label={t("Choose a zodiac sign", "选择生肖")}>
            {ZODIAC_LIST.map((item) => {
              const isCurrent = item.id === activeSign;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isCurrent}
                  className={`zodiac-pill ${isCurrent ? 'is-active' : ''} ${item.available ? 'is-ready' : 'is-locked'}`}
                  onClick={() => selectZodiac(item)}
                  title={`${t(item.nameEn,item.nameCn)} · ${item.available ? item.cryptoTheme : t('Coming soon','敬请期待')}`}
                >
                  <span className="pill-branch">{t(String(lunarBranches.indexOf(item.branch) + 1).padStart(2, '0'), item.branch)}</span>
                  <span className="pill-name">{t(item.id[0].toUpperCase() + item.id.slice(1),item.nameCn)}</span>
                  {!item.available && <span className="pill-soon">{t('SOON','预告')}</span>}
                </button>
              );
            })}
          </div>

          <div className="zodiac-birthday-match">
            <label onClick={event => {
              const input = event.currentTarget.querySelector('input') as (HTMLInputElement & { showPicker?: () => void }) | null;
              try { input?.showPicker?.(); } catch { /* ignore */ }
            }}>{t('Find your zodiac by birthday · Click calendar', '按生日匹配生肖 · 点击日历选择')}
              <input type="date" min="1900-01-01" max="2099-12-31" value={birthday} onChange={event => matchBirthday(event.target.value)}/>
            </label>
            {birthdayMatch && <span role="status">{t(birthdayMatch.nameEn, birthdayMatch.nameCn)}</span>}
          </div>
          {selectionNotice && <p className="zodiac-selection-note" role="status">{t(`${selectionNotice.nameEn} · Coming soon`,`${selectionNotice.nameCn} · 正在制作中`)}</p>}
        </section>

        {/* Main 3D Stage Frame with L-Corners */}
        <section className="zodiac-stage-shell" aria-label={t("3D zodiac display", "3D 生肖赏玩台")}>
          <span className="l-corner l-tl" aria-hidden="true" />
          <span className="l-corner l-tr" aria-hidden="true" />
          <span className="l-corner l-bl" aria-hidden="true" />
          <span className="l-corner l-br" aria-hidden="true" />

          <div className="zodiac-hud-tl">
            <span className="hud-mono">{year}</span>
            <h1 id="zodiac-studio-heading" tabIndex={-1}>{signTitle}</h1>
            <p>{spec.cryptoTheme} · {t(english.subtitle,spec.cryptoSubtitle)}</p>
          </div>

          <div className="zodiac-canvas-frame artwork-sculpture-3d">
            {stage}
          </div>

          <div className="zodiac-hud-bl">
            <span className="hud-mono">{spec.blockHeight}</span>
            <span className="hud-sep">/</span>
            <span className="zodiac-pointer-guide">{t('Drag to rotate · Scroll to zoom','拖拽旋转 · 滚轮缩放')} · {t(english.reveal,spec.unsealLabel)}</span>
            <span className="zodiac-touch-guide">{t("Swipe to rotate · Pinch to zoom", "横向拖动旋转 · 双指缩放")}</span>
          </div>
        </section>

        {/* Bottom Dock: Ritual Actions & Material Filters */}
        <section className="zodiac-dock" aria-label={t("Motion and material controls", "动效与质感控制栏")}>
          <div className="zodiac-dock-group zodiac-dock-motion">
            <button type="button" className="zodiac-action-btn" onClick={() => setUnsealNonce((n) => n + 1)}>
              <span className="dock-code">{t("UNSEAL","启封")}</span> {t("Replay reveal", "启封动画")}
            </button>
            <button type="button" className="zodiac-action-btn" onClick={() => setPulseNonce((n) => n + 1)}>
              <span className="dock-code">{t("PULSE","流光")}</span> {t("Light pulse", "链上流光")}
            </button>
            <button
              type="button"
              className={`zodiac-action-btn ${motionEnabled ? 'is-on' : ''}`}
              aria-pressed={motionEnabled}
              onClick={() => setMotionEnabled((v) => !v)}
            >
              <span className="dock-code">{motionEnabled ? t('LIVE','播放') : t('PAUSED','暂停')}</span> {t("Sculpture motion", "专属律动")}
            </button>
          </div>

          <div className="zodiac-dock-group zodiac-dock-filters" role="radiogroup" aria-label={t("Material filters", "质感滤镜切换")}>
            {ZODIAC_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={filter === f.id}
                className={`zodiac-filter-btn ${filter === f.id ? 'is-active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {t(f.en,f.label)}
              </button>
            ))}
          </div>

          <div className="zodiac-dock-group">
            <button
              type="button"
              className="zodiac-blessing-trigger"
              onClick={() => {
                setCounterOpen(true);
                requestAnimationFrame(() => {
                  window.scrollTo(0, 0);
                  document.getElementById('gift-checkout-heading')?.focus({ preventScroll: true });
                });
              }}
            >
              <span className="dock-code">{t("SEAL & GIFT","赠礼")}</span> {t("Write a note and seal ↗", "写信封缄赠礼 ↗")}
            </button>
          </div>
        </section>
      </main>

    </div>
  );
}
