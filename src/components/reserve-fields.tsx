'use client';

import { useEffect, useRef, useState } from 'react';
import { activeReserveTokens, liquidityMinimum, marketAddresses, milestoneDeadline, milestoneMaxYears, unlockRules, type ReservePlan } from '../domain/reserve-plan';
import { GiftingOptions } from './gifting-options';
import { atlasOracleMetadata, atlasOracleRegistry, atlasSymbolForAddress } from '../lib/atlas-oracle';
import { burnAndRedeemOnBscTestnet, friendlyWalletError, type OnchainSealProof } from '../lib/bsc-testnet-client';
import { testnet } from '../lib/testnet';
import { useLanguage } from '../lib/i18n';

function offsetUtcDate(months: number) {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

export const initialReserve: ReservePlan = { amount: '', token: 'BNB', unlock: 'instant' };
type Quote = { address: string; liquidity: number; price: number | null; oracle?: ReturnType<typeof atlasOracleMetadata> } | { address: string; unavailable: true };

function useQuote(address?: string, refresh = false) {
  const [result, setResult] = useState<Quote>();
  useEffect(() => {
    if (!address) return;
    const controller = new AbortController();
    async function update() {
      try {
        const query = address === 'Bstonx' ? 'symbol=Bstonx' : 'address=' + encodeURIComponent(address!);
        const response = await fetch('/api/market/token?' + query, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const quote = await response.json();
        if (!controller.signal.aborted) setResult({ ...quote, address: address! });
      } catch {
        if (!controller.signal.aborted) setResult({ address: address!, unavailable: true });
      }
    }
    const timer = setTimeout(update, 250);
    const interval = refresh ? setInterval(update, 60_000) : undefined;
    return () => { controller.abort(); clearTimeout(timer); clearInterval(interval); };
  }, [address, refresh]);
  return result?.address === address ? result : undefined;
}

export function ReserveFields({ value, onChange, onGate, fixedDate = false, lockedOnly = false }: {
  value: ReservePlan; fixedDate?: boolean; lockedOnly?: boolean; onChange: (plan: ReservePlan) => void; onGate: (valid: boolean) => void;
}) {
  const { t } = useLanguage();
  const dateRef = useRef<HTMLInputElement>(null);
  const [datePreset, setDatePreset] = useState<'1m' | '6m' | '1y' | 'custom'>('6m');
  useEffect(() => onGate(true), [onGate]);
  const rules = [t('Instant Unseal', '即时启封'), t('Time Capsule', '时间胶囊'), t('Price Milestone', '里程碑解锁')];
  const presetLabels = {
    '1m': t('1 Month', '1 个月'),
    '6m': t('6 Months', '6 个月'),
    '1y': t('1 Year', '1 年'),
    custom: t('Pick date', '自定义日历'),
  };
  function pickPreset(preset: '1m' | '6m' | '1y' | 'custom') {
    setDatePreset(preset);
    if (preset === '1m') onChange({ ...value, date: offsetUtcDate(1) });
    else if (preset === '6m') onChange({ ...value, date: offsetUtcDate(6) });
    else if (preset === '1y') onChange({ ...value, date: offsetUtcDate(12) });
    else {
      requestAnimationFrame(() => {
        const el = dateRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
        if (!el) return;
        el.focus();
        try { el.showPicker?.(); } catch { /* fallback to focused date input */ }
      });
    }
  }
  return <div className="checkout-form ritual-reserve">
    <div className="ritual-amount-group">
      <label>{t('Amount', '礼金金额 · AMOUNT')}<input className="ritual-amount" required inputMode="decimal" maxLength={51} value={value.amount}
        onChange={event => onChange({ ...value, amount: event.target.value.trim() })} placeholder="0.00"/></label>
      <GiftingOptions label={t('Target token', '目标币种')} hideLabel={!fixedDate} options={activeReserveTokens} value={value.token} layout="ritual-chips"
        display={token => token}
        onChange={token => onChange({ ...value, token })}/>
    </div>
    {!fixedDate && <div className="ritual-unlock-group">
      <GiftingOptions label={t('Unlock rule', '解锁方式 · UNLOCK')} options={lockedOnly ? unlockRules.slice(1) : unlockRules} value={value.unlock} layout="ritual-chips"
        display={rule => rules[unlockRules.indexOf(rule)]} onChange={unlock => onChange({ ...value, unlock, ...(unlock === 'date' && !value.date ? { date: offsetUtcDate(6) } : {}) })}/>
      {value.unlock === 'instant' && <p className="ritual-hint">{t('Burn the gift NFT anytime to claim the reserve; once burned, the NFT is permanently destroyed and kept only as a monochrome record.', '随时可销毁礼物 NFT 提取礼金；一旦销毁即永久消失，仅留存黑白静态记录。')}</p>}
      {value.unlock === 'date' && <>
        <GiftingOptions
          label={t('Duration · UTC', '锁定时长 · DURATION')}
          options={['1m', '6m', '1y', 'custom'] as const}
          value={datePreset}
          layout="ritual-chips"
          display={option => presetLabels[option]}
          onChange={pickPreset}
        />
        <label className="ritual-date-picker" onClick={() => {
          const el = dateRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
          try { el?.showPicker?.(); } catch { /* ignore */ }
        }}>
          <span>{t('Unlock date · Click calendar to customize', '解锁日期 · 点击右侧日历可自定义')}</span>
          <input ref={dateRef} type="date" required value={value.date ?? ''}
            onChange={event => { setDatePreset('custom'); onChange({ ...value, date: event.target.value }); }}/>
        </label>
        <p className="ritual-hint">{t('Once the unlock date arrives, burn the gift NFT to claim the reserve; the burned gift becomes a static monochrome record.', '到达约定日期后，销毁礼物 NFT 即可提取礼金；销毁后作品失去动效，仅留存黑白静态记录。')}</p>
      </>}
      {value.unlock === 'price' && <>
        <div className="vault-form-pair ritual-milestone-pair">
          <label>{t('Target price · USD', '目标币价 · USD')}<input required inputMode="decimal" value={value.price ?? ''} placeholder="1000"
            onChange={event => onChange({ ...value, price: event.target.value.trim() })}/></label>
          <GiftingOptions label={t('Max duration', '最长自动解锁期限')} options={milestoneMaxYears} value={value.maxYears ?? 3} layout="ritual-chips"
            display={years => t(`${years}Y`, `${years} 年`)} onChange={maxYears => onChange({ ...value, maxYears })}/>
        </div>
        <p className="ritual-hint"><a href={atlasOracleRegistry.docsUrl} target="_blank" rel="noreferrer">Atlas Oracle</a> · {t('Once the target price or deadline is reached, burn the gift NFT to claim the reserve.', '触及目标价（含插针）或期满后，销毁礼物 NFT 即可提取礼金。')}</p>
      </>}
    </div>}
  </div>;
}

export function ReserveReceipt({ plan, giftId, createdAt, recipient, archived: alreadyArchived = false, onchain, onArchive }: { plan?: ReservePlan; giftId?: string; createdAt?: string; recipient?: string; archived?: boolean; onchain?: OnchainSealProof; onArchive: () => void }) {
  const { language, t, locale } = useLanguage();
  const quote = useQuote(plan?.unlock === 'price' ? plan.address ?? marketAddresses[plan.token] ?? plan.token : undefined, true);
  const address = plan && !plan.address ? marketAddresses[plan.token] : undefined;
  const symbol = address ? atlasSymbolForAddress(address) : undefined;
  const oracle = quote && !('unavailable' in quote) ? quote.oracle : undefined;
  const pair = oracle?.pair ?? (symbol ? atlasOracleRegistry.feeds[symbol].pair : undefined);
  const [now, setNow] = useState(0);
  const [archived, setArchived] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [burning, setBurning] = useState(false);
  const [burnError, setBurnError] = useState('');
  const [redeemTx, setRedeemTx] = useState('');
  const [milestoneReached, setMilestoneReached] = useState(false);
  const price = quote && !('unavailable' in quote) ? quote.price : null;
  const reached = plan?.unlock === 'price' && price !== null && price >= Number(plan.price) &&
    (!plan.address || (!!quote && !('unavailable' in quote) && quote.liquidity >= liquidityMinimum));
  useEffect(() => {
    if (plan?.unlock !== 'price') return;
    if (reached) setMilestoneReached(true);
    if (!giftId) return;
    try {
      const key = 'mement-milestone:' + giftId;
      if (reached) localStorage.setItem(key, '1');
      else if (localStorage.getItem(key) === '1') setMilestoneReached(true);
    } catch { /* Keep the current visit's milestone in memory. */ }
  }, [giftId, plan?.unlock, reached]);
  useEffect(() => {
    if (plan?.unlock !== 'date' && plan?.unlock !== 'price') return;
    const sync = () => setNow(Date.now());
    sync();
    const timer = setInterval(sync, 1000);
    return () => clearInterval(timer);
  }, [plan?.unlock]);
  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setConfirmOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmOpen]);
  if (!plan) return null;
  const tokenLabel = plan.token === 'custom' ? t('Community token', '社区代币') : plan.token;
  const maxYears = plan.maxYears ?? 3;
  const expired = plan.unlock === 'price' && !!createdAt && now >= milestoneDeadline(Date.parse(createdAt), maxYears);
  const unlocked = plan.unlock === 'instant' || (plan.unlock === 'date' && now >= Date.parse(plan.date!)) ||
    (plan.unlock === 'price' && (reached || milestoneReached || expired));
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumSignificantDigits: 8 });
  return <section className="vault-form ritual-reserve">
    <h2>{t('Gift Reserve', 'GIFT RESERVE · 礼金')}</h2>
    <p className="reserve-receipt-amount">{plan.amount} {plan.schedule ? 'USDT → ' : ''}{plan.token === 'custom' ? t('Community token', '社区代币') : plan.token}</p>
    <dl className="reserve-receipt-terms">
      <div><dt>{t('Unlock rule', '解锁规则')}</dt><dd>{
        plan.unlock === 'date' ? <>{t('Time Capsule', '时间胶囊')} · <time dateTime={plan.date}>{plan.date} UTC</time></> :
        plan.unlock === 'price' ? <>{t('Price Milestone', '里程碑解锁')} · {currency.format(Number(plan.price))}</> :
        t('Instant unseal', '即时启封')
      }</dd></div>
      {plan.unlock === 'price' && <>
        <div><dt>{t('Maximum term', '最长兜底期限')}</dt><dd>{t(`${maxYears} ${maxYears === 1 ? 'year' : 'years'}`, `${maxYears} 年`)}</dd></div>
        <div><dt>{t('Reference price progress', '参考价进度')}</dt><dd>
          {price === null ? t('Reference price unavailable', '参考价暂不可用') : currency.format(price)}
          <progress aria-label={t('Price milestone progress', '币价里程碑进度')} max={1} value={reached || milestoneReached ? 1 : Math.min(1, (price ?? 0) / Number(plan.price))}/>
          {pair && <a href={oracle?.docsUrl ?? atlasOracleRegistry.docsUrl} target="_blank" rel="noreferrer">Atlas Oracle · {pair} ↗</a>}
          {price !== null && oracle?.mode !== 'configured' && <small>{t('PancakeSwap BSC reference', 'PancakeSwap BSC 参考行情')}</small>}
        </dd></div>
      </>}
    </dl>
    {(archived || alreadyArchived) ? <div className="burn-settled-card" role="status">
      <strong>✓ {t(`${plan.amount} ${tokenLabel} released automatically to your wallet`, `销毁完成 · ${plan.amount} ${tokenLabel} 已自动释放至你的钱包`)}</strong>
      <p>{t(
        'This Soulbound NFT has been permanently burned and preserved as a static monochrome record. The smart contract sent the reserve directly to your wallet—no extra withdrawal step needed.',
        '礼物 NFT 已永久销毁并转为黑白静态留念；礼金由智能合约在同一笔交易中直接自动打入你的收礼钱包，无需额外提现。',
      )}</p>
      {redeemTx && <a href={`${testnet.explorer}/tx/${redeemTx}`} target="_blank" rel="noreferrer">{t('View payout receipt on BscScan ↗', '在 BscScan 查看自动到账回执 ↗')}</a>}
    </div> :
      <button type="button" className="boutique-link reserve-receipt-action" disabled={!unlocked} onClick={() => { setBurnError(''); setConfirmOpen(true); }}>
        {unlocked ? t('Burn gift & claim reserve', '销毁礼物并提取礼金') : t('Awaiting unlock', '等待解锁')}
      </button>}
    {confirmOpen && <div className="burn-confirm-backdrop" role="presentation" onClick={() => !burning && setConfirmOpen(false)}>
      <div className="burn-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="burn-confirm-title" onClick={event => event.stopPropagation()}>
        <div className="burn-confirm-head">
          <span className="burn-confirm-eyebrow">{t('IRREVERSIBLE ACTION', 'IRREVERSIBLE ACTION · 不可逆操作')}</span>
          <button type="button" className="burn-confirm-close" aria-label={t('Close', '关闭')} disabled={burning} onClick={() => setConfirmOpen(false)}>×</button>
        </div>
        <h3 id="burn-confirm-title">{t('Burn this gift NFT to claim the reserve?', '确认销毁礼物并提取礼金？')}</h3>
        <div className="burn-confirm-points">
          <div>
            <strong>{t('Permanent NFT Burn', '永久销毁礼物 NFT')}</strong>
            <p>{t('Once burned, this NFT cannot be restored and loses all 3D / live motion, leaving only a static monochrome history card.', '一旦确认销毁，该 NFT 将彻底消失且无法恢复、失去全部动效，页面仅留存黑白静态记录卡片。')}</p>
          </div>
          <div>
            <strong>{t(`Instant Payout · ${plan.amount} ${tokenLabel}`, `自动到账 · ${plan.amount} ${tokenLabel}`)}</strong>
            <p>{t(`The smart contract automatically transfers ${plan.amount} ${tokenLabel} directly to your wallet in the same transaction.`, `智能合约将在确认销毁的同一笔交易中，自动把 ${plan.amount} ${tokenLabel} 礼金全额打入你的钱包（0% 手续费）。`)}</p>
          </div>
        </div>
        {burnError && <p className="checkout-error" role="alert">{burnError}</p>}
        <div className="burn-confirm-actions">
          <button type="button" className="burn-btn-cancel" disabled={burning} onClick={() => setConfirmOpen(false)}>{t('Keep gift intact', '暂不销毁')}</button>
          <button type="button" className="burn-btn-confirm" disabled={burning} onClick={async () => {
            if (onchain?.contract && onchain?.tokenId) {
              setBurning(true);
              setBurnError('');
              try {
                const hash = await burnAndRedeemOnBscTestnet(onchain.contract, onchain.tokenId, recipient);
                setRedeemTx(hash);
                setConfirmOpen(false);
                setArchived(true);
                onArchive();
              } catch (err) {
                setBurnError(friendlyWalletError(err, language === 'zh'));
              } finally {
                setBurning(false);
              }
            } else {
              setConfirmOpen(false);
              setArchived(true);
              onArchive();
            }
          }}>
            {burning ? t('Confirming on BSC Testnet…', '链上销毁并打款中…') : t('Confirm burn & claim', '确认销毁并提取礼金')}
          </button>
        </div>
      </div>
    </div>}
  </section>;
}
