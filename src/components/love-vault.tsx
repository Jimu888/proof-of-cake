'use client';

import { useRef, useState } from 'react';
import { formatEther, parseEther } from 'ethers';
import { breakupTerms, loveCooldown, promiseTokens, type LoveAgreement } from '../domain/gifting-modes';
import { useLanguage } from '../lib/i18n';
import { GiftingOptions } from './gifting-options';
import InfoTip from './info-tip';
import AddressChip from './address-chip';
import { Countdown, useClock } from './vault-preview-controls';
import { friendlyWalletError, loveVaultActionOnBscTestnet, type OnchainSealProof } from '../lib/bsc-testnet-client';
import { testnet } from '../lib/testnet';

function offsetUtcDate(months: number) {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function useBreakupLabels() {
  const { t } = useLanguage();
  return {
    proportional: t('Return each contribution', '礼金原路退回'),
    a: t('Initiator’s wallet', '发起人钱包'),
    b: t('Partner’s wallet', '对方钱包'),
    donate: t('Donate to charity', '捐赠至公益地址'),
  };
}

export function LoveVaultFields({ value, onChange }: { value: LoveAgreement; onChange: (draft: LoveAgreement) => void }) {
  const { t } = useLanguage();
  const dateRef = useRef<HTMLInputElement>(null);
  const [funding, setFunding] = useState<'solo' | 'shared'>(() => (Number(value.amounts[1]) > 0 ? 'shared' : 'solo'));
  const [partnerInput, setPartnerInput] = useState(() => (value.amounts[1] === '0' ? '' : value.amounts[1]));
  const [datePreset, setDatePreset] = useState<'1m' | '6m' | '1y' | 'custom'>('1y');
  const token = value.token ?? 'BNB';
  const fundingLabels = {
    solo: t('I cover all', '我来出'),
    shared: t('Both contribute', '两人一起出'),
  };
  const presetLabels = {
    '1m': t('1 Month', '1 个月'),
    '6m': t('6 Months', '6 个月'),
    '1y': t('1 Year', '1 年'),
    custom: t('Pick date', '自定义日历'),
  };
  function openCalendar() {
    const el = dateRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!el) return;
    el.focus();
    try { el.showPicker?.(); } catch { /* fallback to focused date input */ }
  }
  function pickPreset(preset: '1m' | '6m' | '1y' | 'custom') {
    setDatePreset(preset);
    if (preset === '1m') onChange({ ...value, token, terms: 'proportional', date: offsetUtcDate(1) });
    else if (preset === '6m') onChange({ ...value, token, terms: 'proportional', date: offsetUtcDate(6) });
    else if (preset === '1y') onChange({ ...value, token, terms: 'proportional', date: offsetUtcDate(12) });
    else requestAnimationFrame(openCalendar);
  }
  return <div className="checkout-form ritual-reserve">
    <GiftingOptions
      label={t('Funding · CONTRIBUTION', '出资方式 · CONTRIBUTION')}
      options={['solo', 'shared'] as const}
      value={funding}
      layout="ritual-chips"
      display={option => fundingLabels[option]}
      onChange={next => {
        setFunding(next);
        const nextPartner = next === 'solo' ? '0' : (Number(value.amounts[1]) > 0 ? value.amounts[1] : value.amounts[0] || '0.1');
        setPartnerInput(next === 'solo' ? '' : nextPartner);
        onChange({
          ...value,
          token,
          terms: 'proportional',
          amounts: [value.amounts[0], nextPartner],
        });
      }}
    />
    <GiftingOptions
      label={t('Asset · TOKEN', '礼金币种 · ASSET')}
      options={promiseTokens}
      value={token}
      layout="ritual-chips"
      display={item => item}
      onChange={nextToken => onChange({ ...value, token: nextToken, terms: 'proportional' })}
    />
    <div className={funding === 'shared' ? 'vault-form-pair' : undefined}>
      <label>{funding === 'shared' ? t(`Your deposit · ${token}`, `我先存入 · ${token}`) : t(`Deposit · ${token}`, `礼金金额 · ${token}`)}
        <input className="ritual-amount" required maxLength={29} inputMode="decimal" value={value.amounts[0]}
          onChange={event => onChange({ ...value, token, terms: 'proportional', amounts: [event.target.value, funding === 'shared' ? value.amounts[1] : '0'] })}/>
      </label>
      {funding === 'shared' && <label>{t(`Partner’s expected deposit · ${token}`, `对方待存入 · ${token}`)}
        <input className="ritual-amount" required maxLength={29} inputMode="decimal" placeholder="0.1" value={partnerInput}
          onChange={event => {
            const raw = event.target.value;
            setPartnerInput(raw);
            onChange({ ...value, token, terms: 'proportional', amounts: [value.amounts[0], raw.trim() || '0'] });
          }}/>
      </label>}
    </div>
    <GiftingOptions
      label={t('Promise duration · UTC', '约定时长 · DURATION')}
      options={['1m', '6m', '1y', 'custom'] as const}
      value={datePreset}
      layout="ritual-chips"
      display={option => presetLabels[option]}
      onChange={pickPreset}
    />
    <label className="ritual-date-picker" onClick={openCalendar}>
      <span>{t('Promise date · Click calendar to customize', '约定日期 · 点击右侧日历可自定义')}</span>
      <input ref={dateRef} required type="date" value={value.date ?? ''}
        onChange={event => { setDatePreset('custom'); onChange({ ...value, token, terms: 'proportional', date: event.target.value }); }}/>
    </label>
    <p className="ritual-hint">{funding === 'shared'
      ? t('Deposit your share first; the gift box activates once your partner signs and deposits their share. You can cancel the gift box anytime before they join.',
        '你先存入份额，对方签署并存入对应份额即生效；对方加入前你可随时撤销礼盒。')
      : t('Deposit the full reserve; the gift box activates once your partner signs to accept. You can cancel the gift box anytime before they join.',
        '你存入全部礼金，对方签署同意即生效；对方加入前你可随时撤销礼盒。')}</p>
  </div>;
}

export function LoveVaultStatus({ agreement, sender, recipient, onchain }: { agreement: LoveAgreement; sender: string; recipient: string; onchain?: OnchainSealProof }) {
  const { language, t } = useLanguage();
  const terms = useBreakupLabels();
  const [accepted, setAccepted] = useState(!agreement.date);
  const [cancelled, setCancelled] = useState(false);
  const [topUp, setTopUp] = useState('');
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [partnerAmount, setPartnerAmount] = useState(agreement.amounts[1]);
  const [earlyTerm, setEarlyTerm] = useState<LoveAgreement['terms']>(agreement.terms);
  const [eligibleAt, setEligibleAt] = useState<number>();
  const [release, setRelease] = useState(0);
  const [breakup, setBreakup] = useState(0);
  const [chainBusy, setChainBusy] = useState(false);
  const [chainTx, setChainTx] = useState(onchain?.txHash ?? '');
  const [chainError, setChainError] = useState('');
  const now = useClock(accepted);
  const minimum = agreement.date ? Date.parse(agreement.date) / 1000 : 0;
  const canRelease = now !== undefined && now >= minimum && (eligibleAt === undefined || now < eligibleAt);
  const ended = breakup === 3 || (eligibleAt !== undefined && now !== undefined && now >= eligibleAt);
  const completed = release === 3;
  const validTopUp = /^\d{1,10}(?:\.\d{1,18})?$/.test(topUp) && Number(topUp) > 0;
  const shared = Number(partnerAmount) > 0;
  const token = agreement.token ?? 'BNB';
  const total = formatEther(parseEther(agreement.amounts[0]) + parseEther(partnerAmount));

  async function runChain(
    action: 'deposit' | 'approveMarriage' | 'approveBreakup' | 'requestBreakup' | 'withdraw',
    amount?: string,
    onOk?: () => void,
    expectedSigner?: string,
  ) {
    if (!onchain?.contract || !onchain?.agreementId) {
      onOk?.();
      return;
    }
    setChainBusy(true);
    setChainError('');
    try {
      const hash = await loveVaultActionOnBscTestnet(onchain.contract, onchain.agreementId, action, amount, expectedSigner);
      setChainTx(hash);
      onOk?.();
    } catch (err) {
      setChainError(friendlyWalletError(err, language === 'zh'));
    } finally {
      setChainBusy(false);
    }
  }

  return <section className="vault-form love-vault-status">
    <div className="promise-status-head">
      <h2>{t('SHARED PROMISE', 'SHARED PROMISE · 双人约定')}</h2>
      {onchain?.agreementId && (
        <a className="promise-chain-pill" href={`${testnet.explorer}/tx/${chainTx || onchain.txHash}`} target="_blank" rel="noreferrer">
          <span className="receive-nft-dot" aria-hidden="true"/>
          BSC 97 #{onchain.agreementId} ↗
        </a>
      )}
    </div>
    {chainError && <p className="checkout-error" role="alert">{chainError}</p>}
    <div className="promise-hero-row">
      <strong className="promise-hero-amount">{total} {token}</strong>
      {agreement.date && <span className="promise-hero-meta"><time dateTime={agreement.date}>{agreement.date}</time> · {shared ? t('Both contribute', '两人一起出') : t('Initiator funded', '发起人出资')}</span>}
    </div>
    <div className="promise-parties-inline">
      <span>{t('Initiator', '发起')} <AddressChip value={sender}/> <em>({agreement.amounts[0]})</em></span>
      <span aria-hidden="true">·</span>
      <span>{t('Partner', '受邀')} <AddressChip value={recipient}/> <em>({partnerAmount})</em></span>
    </div>
    {cancelled ? <p role="status">{t('Gift box cancelled · Initiator deposit returned.', '礼盒已撤销 · 发起人本金已原路退回。')}</p> :
      !accepted ? <>
      <p className="ritual-hint">{shared
        ? t(`Co-sign and deposit ${partnerAmount} ${token} with the recipient wallet to activate this promise.`,
          `请使用收礼钱包签署并存入 ${partnerAmount} ${token}，双人约定即正式锁定生效。`)
        : t('Sign with the recipient wallet to accept and lock this shared promise.',
          '请使用收礼钱包签署同意，双人约定即正式锁定生效。')}</p>
      <div className="promise-primary-actions">
        <button type="button" className="ritual-cta promise-main-cta" disabled={chainBusy} onClick={() => void runChain('deposit', shared ? partnerAmount : '0.0001', () => setAccepted(true), recipient)}>
          {chainBusy ? t('Confirming on BSC Testnet…', '链上确认中…') : shared ? t(`Co-sign & deposit ${partnerAmount} ${token}`, `签署并存入 ${partnerAmount} ${token}`) : t('Accept Promise', '同意缔约')}
        </button>
        <button type="button" className="boutique-link promise-cancel-link" disabled={chainBusy} onClick={() => void runChain('requestBreakup', undefined, () => setCancelled(true), sender)}>
          {chainBusy ? t('Verifying initiator wallet…', '校验发起人钱包中…') : t('Initiator · cancel gift box', '发起人撤销礼盒')}
        </button>
      </div>
    </> : ended || completed ? <>
      <p role="status">{ended ? t('Early unlock settled', '提前解锁已完成') + ' · ' + terms[breakup === 3 ? earlyTerm : 'proportional'] : t('Both parties confirmed fulfillment', '双方已确认达成约定')} · {total} {token}</p>
      {onchain?.agreementId && <button type="button" className="room-button room-button-primary" disabled={chainBusy} onClick={() => void runChain('withdraw')}>
        {chainBusy ? t('Withdrawing…', '提取中…') : t('Withdraw claimable tBNB onchain', '链上提取可领 tBNB')}
      </button>}
    </> : <>
      <p role="status">{t('Promise active & locked', '双方约定已正式锁定生效')}</p>
      {agreement.date && Number(partnerAmount) === 0 && !release && !breakup && (
        topUpOpen ? <div className="vault-form-pair">
          <label>{t(`Add a deposit · ${token}`, `添一笔礼金 · ${token}`)}<input inputMode="decimal" maxLength={29} value={topUp} onChange={event => setTopUp(event.target.value)}/></label>
          <button type="button" className="vault-hold-button" disabled={!validTopUp || chainBusy} onClick={() => void runChain('deposit', topUp, () => { setPartnerAmount(topUp); setTopUpOpen(false); })}>
            {chainBusy ? t('Depositing…', '存入中…') : t('Confirm deposit amount', '确认礼金金额')}
          </button>
        </div> : <button type="button" className="boutique-link" onClick={() => setTopUpOpen(true)}>{t('Add a deposit · optional', '我也添一笔礼金（选填）')}</button>
      )}
      <div className="vault-form-pair">
        {[0, 1].map(index => {
          const bit = 1 << index;
          const expected = index === 0 ? sender : recipient;
          return <button key={index} type="button" className="vault-hold-button" disabled={!canRelease || !!(release & bit) || chainBusy}
            onClick={() => void runChain('approveMarriage', undefined, () => { if (eligibleAt !== undefined && Date.now() / 1000 >= eligibleAt) return; setRelease(release | bit); setBreakup(breakup & ~bit); }, expected)}>
            {index === 0 ? t('Initiator · confirm fulfillment', '发起人 · 到期共启') : t('Partner · confirm fulfillment', '对方 · 到期共启')}
          </button>;
        })}
      </div>
      <details className="promise-mechanics">
        <summary>{t('Early Unlock', '提前解锁 · Early Unlock')}</summary>
        <p className="ritual-hint">{t('Both signatures unlock immediately under the chosen distribution. A unilateral request starts a 30-day cooling-off period, after which each contribution strictly returns to its own wallet.',
          '双方共签可立即按选定方式提前解锁；若仅单方发起，将进入 30 天冷静期，期满后强制将双方礼金原路退回各自钱包。')}</p>
        <GiftingOptions
          label={t('Distribution · both signatures required', '提前解锁分配方式（双方共签生效）')}
          options={breakupTerms}
          value={earlyTerm}
          layout="ritual-option-cards"
          display={term => terms[term]}
          onChange={setEarlyTerm}
        />
        <div className="vault-form-pair">
          {[0, 1].map(index => {
            const bit = 1 << index;
            const expected = index === 0 ? sender : recipient;
            return <button key={index} type="button" className="vault-hold-button" disabled={!!(breakup & bit) || chainBusy}
              onClick={() => {
                if (eligibleAt !== undefined && Date.now() / 1000 >= eligibleAt) return;
                const action = breakup === 0 ? 'requestBreakup' : 'approveBreakup';
                void runChain(action, undefined, () => {
                  setBreakup(breakup | bit); setRelease(release & ~bit);
                  if (eligibleAt === undefined) setEligibleAt(Math.floor(Date.now() / 1000) + loveCooldown);
                }, expected);
              }}>{index === 0 ? t('Initiator · early unlock', '发起人 · 申请提前解锁') : t('Partner · early unlock', '对方 · 申请提前解锁')}</button>;
          })}
        </div>
        {eligibleAt && <p>{t('30-day cooling-off period', '30 天冷静期')} · <Countdown target={eligibleAt} now={now}/></p>}
      </details>
      <InfoTip en="These controls record choices for this visit. Wallet signatures are required for contract execution." zh="此处记录本次开启时的选项。合约执行须由钱包签名。" />
    </>}
  </section>;
}
