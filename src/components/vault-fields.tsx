'use client';

import { GiftingOptions } from './gifting-options';
import InfoTip from './info-tip';
import { dateInputValue } from './vault-preview-controls';
import { useLanguage } from '../lib/i18n';
import { useEffect, useId, useState } from 'react';
import type { ArtworkPolicy } from '../domain/artwork-policy';
import { ZeroAddress } from 'ethers';
import { parseVaultDraft, vaultUnits, type TokenDetails, type VaultDraft } from '../domain/vault-gift';

export default function VaultFields({ value, onChange, enabled, disabled, policy, supportsTimeLock = false }: {
  value?: VaultDraft;
  onChange: (value?: VaultDraft) => void;
  enabled: boolean;
  disabled?: boolean;
  policy?: ArtworkPolicy;
  supportsTimeLock?: boolean;
}) {
  const { t } = useLanguage();
  const panel = useId();
  const open = !!value;
  const lock = value?.unlockTime;
  const token = value?.kind === 'token' ? value.token : undefined;
  const [metadata, setMetadata] = useState<{ address: string; info?: TokenDetails }>();
  useEffect(() => {
    if (!token || !/^0x[0-9a-f]{40}$/i.test(token) || token.toLowerCase() === ZeroAddress) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/testnet/token?address=' + encodeURIComponent(token), { signal: controller.signal });
        const info = response.ok ? await response.json() : undefined;
        if (!controller.signal.aborted) setMetadata({ address: token, info });
      } catch {
        if (!controller.signal.aborted) setMetadata({ address: token });
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [token]);

  if (!enabled) return <p className="checkout-note">{t("This edition does not support vaulted assets.", "此发行版本暂不支持封入资产。")}</p>;
  const checked = metadata?.address === token ? metadata?.info : undefined;
  return <fieldset className="vault-fields" disabled={disabled}>
    <legend className="sr-only">{t("Optional vaulted gift", "选填内封心意金")}</legend>
    <div className="vault-inline"><button type="button" className="vault-toggle" role="switch" aria-checked={open} aria-controls={panel}
      onClick={() => onChange(open ? undefined : { kind: 'native', amount: '' })}>
      <span>{t("Vaulted Gift Inside (optional)", "随礼封存一份心意金（选填）")}</span><span className="vault-switch" aria-hidden="true"/>
    </button><InfoTip en="Add an optional amount to the gift. The holder can redeem it by burning the NFT." zh="可给礼物附上一份心意金，持有人可通过销毁 NFT 取出。" /></div>
    <p className="vault-subtitle">{t("Supports BNB or compatible BSC tokens", "VAULTED GIFT · 支持 BNB 或兼容的 BSC 代币")}</p>
    <div id={panel} hidden={!open}>
      {value && <>
        <div className="vault-rules">
          <div className="vault-inline"><p>{t('Burn to redeem', '销毁后取出')}</p>
            <InfoTip en="The tokens stay in the gift contract until the current holder burns the gift NFT." zh="代币留在礼盒智能合约里，直至当前持有人销毁礼物 NFT。" />
          </div>
          {policy && <div className="vault-inline">
            <p>{policy.transferable ? t('Transferable edition', '可转让版本') : t('Permanently non-transferable', '永久不可转让')}</p>
            {policy.transferable
              ? <InfoTip en="Redemption rights pass to the new holder after transfer." zh="转让后，赎回权随礼物归新持有人。" />
              : <InfoTip en="The recipient cannot resell or give away this edition." zh="收礼人无法转售或转赠此版本。" />}
          </div>}
        </div>
        <GiftingOptions label={t('Asset type', '资产类型')} layout="room-dot-options" hideLabel
          options={['native', 'token'] as const} value={value.kind}
          onChange={kind => {
            if (value.kind !== kind) onChange({ kind, amount: value.amount, unlockTime: lock });
          }}
          display={kind => kind === 'native' ? t('Native tBNB', '原生 tBNB') : t('Custom BSC token', '自定义 BSC 代币')}/>
        {value.kind === 'token' && <>
          <label>{t("Token contract address", "代币合约地址")}
            <input value={value.token ?? ''} onChange={event => onChange({ ...value, token: event.target.value.trim() })} placeholder="0x…" maxLength={42} required/>
          </label>
          {token && /^0x[0-9a-f]{40}$/i.test(token) && metadata?.address === token && <p className="checkout-note" role="status">
            {checked ? `${checked.symbol} · ${checked.decimals} ${t("decimals", "位小数")}` : t("Could not read testnet token details.", "暂时无法读取测试网代币资料。")}
          </p>}
          <p className="checkout-note">{t("Transfer taxes reduce the amount received. Pauses, allowlists, and other issuer restrictions can prevent redemption.", "代币转账税会减少实际到账。暂停、白名单或其他发行方限制可能阻止取出。")}</p>
        </>}
        <label>{t("Amount to vault", "封入数量")}
          <input value={value.amount} onChange={event => onChange({ ...value, amount: event.target.value.trim() })} inputMode="decimal" required maxLength={69} placeholder="0.01"/>
        </label>
        {supportsTimeLock && <>
          <div className="vault-inline">
            <GiftingOptions label={t('Redemption timing', '赎回时间')} layout="room-dot-options"
              options={['instant', 'locked'] as const} value={lock === undefined ? 'instant' : 'locked'}
              onChange={option => {
                if ((lock === undefined) !== (option === 'instant')) {
                  onChange({ ...value, unlockTime: option === 'instant' ? undefined : 0 });
                }
              }}
              display={option => option === 'instant' ? t('Instant', '即时') : t('Time lock', '定时锁定')}/>
            <InfoTip en="Set the earliest time the holder may burn the NFT and redeem the deposit." zh="设定持有人最早可销毁 NFT 并取出心意金的时间。" />
          </div>
          {lock !== undefined && <label>{t('Opening date · local time', '开启日期 · 本地时间')}
            <input type="datetime-local" required value={lock ? dateInputValue(lock) : ''}
              onChange={event => onChange({ ...value, unlockTime: Math.floor(new Date(event.target.value).getTime() / 1000) || 0 })}/>
          </label>}
        </>}
      </>}
    </div>
  </fieldset>;
}

export async function resolveVaultDraft(value: VaultDraft | undefined, tokenError: string) {
  const draft = parseVaultDraft(value);
  if (!draft) return;
  if (draft.kind === 'native') return { draft, amount: vaultUnits(draft.amount, 18), symbol: 'tBNB' };
  const response = await fetch('/api/testnet/token?address=' + encodeURIComponent(draft.token!));
  if (!response.ok) throw new Error(tokenError);
  const details = await response.json() as TokenDetails;
  return { draft, amount: vaultUnits(draft.amount, details.decimals), symbol: details.symbol };
}
