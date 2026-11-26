'use client';

import { useEffect, useState } from 'react';
import { parseUnits } from 'ethers';
import type { GiftSeries } from '../domain/series';
import { paperOptions, type PaperTone } from '../lib/gift-copy';
import { useLanguage } from '../lib/i18n';
import { previewLink, readPreview } from '../lib/vault-preview-link';
import { SealAnimation, SoundToggle, useRitualSound, waitForSealAnimation } from './gift-ritual';
import InfoTip from './info-tip';
import { Countdown, dateInputValue, HoldAction, useClock } from './vault-preview-controls';
import { initialReserve, ReserveFields, ReserveReceipt } from './reserve-fields';
import { parseReservePlan, type ReservePlan } from '../domain/reserve-plan';
import { VaultEmblem, VaultExhibition } from './vault-exhibition';

const newYearSeries: GiftSeries = {
  slug: 'new-year', code: 'EXHIBITION 02', titleCn: '新年时间胶囊', titleEn: 'NEW YEAR CAPSULE',
  seasonTag: '2027', summary: '写给未来的信和一份定期心意金。', route: '/series/new-year',
  itemProgress: '时间胶囊', status: 'live',
};


type Capsule = { recipient: string; time: number; paper: PaperTone; note: string; amount: string; currency: 'BNB' | 'USDT'; reserve?: ReservePlan };
const newYear = 1798761600;
const lunarNewYear = 1801872000;

function readCapsule(): Capsule | undefined {
  const data = readPreview('capsule') as Partial<Capsule> | null;
  if (!data || typeof data.recipient !== 'string' || data.recipient.length > 60 ||
    typeof data.note !== 'string' || new TextEncoder().encode(data.note).length > 240 ||
    typeof data.time !== 'number' || !Number.isSafeInteger(data.time) || data.time <= 0 || data.time > 253402300799 ||
    typeof data.amount !== 'string' || !validDeposit(data.amount, data.currency) ||
    !paperOptions.some(option => option.id === data.paper)) return;
  try { return { ...data as Capsule, reserve: parseReservePlan(data.reserve) }; }
  catch { return; }
}

function validDeposit(amount: string, currency?: string) {
  if (currency !== 'BNB' && currency !== 'USDT') return false;
  if (!amount) return true;
  try { return /^\d{1,10}(\.\d{1,8})?$/.test(amount) && parseUnits(amount, currency === 'USDT' ? 6 : 8) > 0n; }
  catch { return false; }
}

export default function NewYearCapsule({ receive = false }: { receive?: boolean }) {
  const { t, locale } = useLanguage();
  const now = useClock();
  const sound = useRitualSound();
  const [capsule, setCapsule] = useState<Capsule>();
  const [redeemed, setRedeemed] = useState(false);
  const [opened, setOpened] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sealing, setSealing] = useState(false);
  const [self, setSelf] = useState(true);
  const [recipient, setRecipient] = useState('');
  const [preset, setPreset] = useState('new');
  const [custom, setCustom] = useState('');
  const [yearLater, setYearLater] = useState<number>();
  const [paper, setPaper] = useState<PaperTone>('graphite');
  const [note, setNote] = useState('');
  const [reserve, setReserve] = useState<ReservePlan>(initialReserve);
  const [gate, setGate] = useState(true);
  let plan: ReservePlan | undefined;
  try { if (reserve.amount) plan = parseReservePlan(reserve); } catch {}
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState<boolean>();
  const relativeYear = yearLater ?? newYear;
  const target = capsule?.time ?? (preset === 'lunar' ? lunarNewYear : preset === 'year' ? relativeYear : preset === 'custom' ? Math.floor(new Date(custom).getTime() / 1000) : newYear);
  const validTarget = Number.isSafeInteger(target) && target > 0 && target <= 253402300799;
  const canOpen = !!capsule && receive && (now !== undefined && now >= target);
  const valid = now !== undefined && validTarget && target > now && (self || !!recipient.trim()) && !!note.trim() &&
    new TextEncoder().encode(note).length <= 240 && (!reserve.amount || (!!plan && gate));
  const href = capsule && !receive ? previewLink('/series/new-year/receive', 'capsule', capsule) : undefined;

  useEffect(() => {
    if (!receive) return;
    setCapsule(readCapsule());
    setLoaded(true);
  }, [receive]);

  useEffect(() => {
    if (!href) return;
    let current = true;
    void import('qrcode').then(({ default: QRCode }) => QRCode.toDataURL(href, {
      errorCorrectionLevel: 'L', margin: 4, scale: 5, color: { dark: '#131c24', light: '#f2f2ef' },
    })).then(data => { if (current) setQr(data); }).catch(() => {});
    return () => { current = false; };
  }, [href]);

  async function seal() {
    if (!valid || sealing || target <= Math.floor(Date.now() / 1000)) return;
    const draft: Capsule = { recipient: self ? t('My future self', '未来的自己') : recipient.trim(), time: target, paper, note: note.trim(), amount: '', currency: 'BNB', reserve: plan };
    sound.prepare();
    setSealing(true);
    await waitForSealAnimation();
    setCapsule(draft);
    setSealing(false);
  }

  return <VaultExhibition series={newYearSeries} stage={<>
    <VaultEmblem kind="capsule" active={canOpen}/>
    {(!receive || capsule) && validTarget && <div className="vault-stage-readout">
      <time dateTime={new Date(target * 1000).toISOString()} suppressHydrationWarning>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(target * 1000)}</time>
      <Countdown target={target} now={now}/>
    </div>}
  </>}>
    {receive ? !loaded ? <p>{t('Reading the seal…', '正在读取封印…')}</p> : !capsule ? <p role="status">{t('This capsule link is missing or damaged.', '胶囊链接缺失或已损坏。')}</p> : <>
      <h2>{canOpen ? t('The opening hour', '启封时刻') : t('Sealed by time', '时间封印')}</h2>
      <p>{t('Some answers are for time to open.', '有些答案，交给时间来打开。')}</p>
      <div className="vault-inline"><button type="button" className="vault-hold-button" disabled={!canOpen || opened} onClick={() => setOpened(true)}>{t('Open the capsule', '启封时间胶囊')}</button>
        <InfoTip en="The note opens when the countdown reaches zero." zh="倒计时归零后可以打开信笺。" /></div>
      {opened && <div className={`stationery-card paper-${capsule.paper} vault-letter`}><strong>{t('To', '致')} {capsule.recipient}</strong><p>{capsule.note}</p></div>}
      {capsule.amount && <div className="vault-inline">
        <button type="button" className="boutique-link" disabled={!canOpen || !opened || redeemed} onClick={() => setRedeemed(true)}>
          {redeemed ? t('Archived', '已归档') : t('Archive the keepsake', '存入纪念档案')} · {capsule.amount} {capsule.currency}
        </button><InfoTip en="Archive the keepsake after opening." zh="启封后可将作品存入纪念档案。" />
      </div>}
      {opened && <ReserveReceipt plan={capsule.reserve} onArchive={() => setRedeemed(true)}/>}
    </> : sealing ? <SealAnimation recipient={self ? t('My future self', '未来的自己') : recipient} message={note} paper={paper} sound={sound.enabled}/> : href && capsule ? <div className="vault-invite">
      <h2>{t('A date with the future', '与未来有约')}</h2>
      {qr && <img src={qr} alt={t('Time capsule invitation QR code', '时间胶囊邀请二维码')} width={200} height={200}/>}
      <div className="vault-inline"><a className="boutique-link" href={href}>{t('Open the invitation ↗', '打开邀请 ↗')}</a>
        <InfoTip en="Share this invitation with its intended recipient. Anyone with the link can access the note." zh="请把邀请函发给指定收礼人。持有链接的人均可访问信笺。" /></div>
      <label>{t('Invitation link', '邀请链接')}<input readOnly value={href} onFocus={event => event.currentTarget.select()}/></label>
      <button type="button" className="boutique-link" onClick={() => { void Promise.resolve().then(() => navigator.clipboard.writeText(href)).then(() => setCopied(true)).catch(() => setCopied(false)); }}>{t('Copy invitation', '复制邀请函')}</button>
      {copied !== undefined && <p role="status">{copied ? t('Link copied.', '链接已复制。') : t('Select the link above to copy it.', '可选择上方链接手动复制。')}</p>}
    </div> : <div className="vault-form">
      <p>{t('Leave a letter and a little something for another day.', '给未来留一封信，也留一份心意。')}</p>
      <div className="vault-segment" role="group" aria-label={t('Recipient', '收礼人')}>
        <button type="button" aria-pressed={self} onClick={() => setSelf(true)}>{t('Future me', '未来的自己')}</button>
        <button type="button" aria-pressed={!self} onClick={() => setSelf(false)}>{t('Someone close', '重要的人')}</button>
      </div>
      {!self && <label>{t('Recipient name', '收礼人称呼')}<input value={recipient} maxLength={60} onChange={event => setRecipient(event.target.value)}/></label>}
      <div className="vault-inline"><label>{t('Opening day', '开启日')}
        <select value={preset} onChange={event => {
          if (event.target.value === 'year') {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            setYearLater(Math.floor(date.getTime() / 1000));
          }
          if (event.target.value === 'custom' && !custom) setCustom(dateInputValue(relativeYear));
          setPreset(event.target.value);
        }}>
          <option value="new">{t('New Year’s Day 2027 · UTC', '2027 元旦 · UTC')}</option>
          <option value="lunar">{t('Lunar New Year 2027 · UTC', '2027 农历春节 · UTC')}</option>
          <option value="year">{t('One year from now', '一年后')}</option>
          <option value="custom">{t('Custom date · local time', '自定义日期 · 本地时间')}</option>
        </select></label><InfoTip en="Your letter stays sealed until this date. The cabinet shows the time in your timezone." zh="信笺会在此日期前保持封印。展柜使用你的本地时区。" /></div>
      {preset === 'custom' && <label>{t('Local opening time', '本地开启时间')}<input type="datetime-local" value={custom} onChange={event => setCustom(event.target.value)}/></label>}
      {now !== undefined && (!validTarget || target <= now) && <p className="checkout-note">{t('Choose a future opening time.', '请选择未来的开启时间。')}</p>}
      <ReserveFields value={reserve} fixedDate onChange={setReserve} onGate={setGate}/>
      <div className="vault-segment" role="group" aria-label={t('Paper finish', '信纸纸色')}>{paperOptions.map(option =>
        <button key={option.id} type="button" aria-pressed={paper === option.id} onClick={() => setPaper(option.id)}>
          <i className="vault-paper-swatch" style={{ backgroundColor: option.swatch }}/>{t(option.en, option.zh)}
        </button>)}</div>
      <label className={`stationery-card paper-${paper} vault-letter`}>
        {t('A letter for that day', '写给那一天的信')}
        <textarea value={note} maxLength={240} rows={4} onChange={event => setNote(event.target.value)}/>
      </label>
      <p className="checkout-note">{t('Use a sample note up to 240 UTF-8 bytes. The invitation contains this note.', '请使用最多 240 个 UTF-8 字节的示例信笺。邀请链接会携带内容。')}</p>
      <HoldAction disabled={!valid} onConfirm={() => void seal()} tip={{ en: 'Sealing creates a QR invitation and an invitation link.', zh: '封缄会生成二维码邀请函及启封链接。' }}>{t('Hold for 2 seconds to seal', '长按 2 秒封缄')}</HoldAction>
      <SoundToggle {...sound}/>
    </div>}
  </VaultExhibition>;
}
