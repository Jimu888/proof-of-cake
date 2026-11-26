'use client';

import { useLanguage } from '../lib/i18n';
import { useEffect, useId, useRef, useState } from 'react';
import { ZeroAddress } from 'ethers';
import { vaultAmountText, type VaultAsset, type VaultDraft } from '../domain/vault-gift';
import { SEAL_HOLD_MS } from './gift-ritual';
import InfoTip from './info-tip';
import { Countdown, useClock } from './vault-preview-controls';
import { testnet } from '../lib/testnet';

export default function VaultPlaque({ demo, asset, purchase, onDemoRedeemed, demoRedeemed = false, demoTimeLockElapsed = false }: {
  demo?: VaultDraft;
  asset?: VaultAsset;
  purchase?: string;
  onDemoRedeemed?: () => void;
  demoRedeemed?: boolean;
  demoTimeLockElapsed?: boolean;
}) {
  const { t } = useLanguage();
  const description = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [pressed, setPressed] = useState(false);
  const [simulatedHere, setSimulated] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => () => clearTimeout(hold.current), []);
  const simulated = demoRedeemed || simulatedHere;
  const unlockTime = asset?.unlockTime ?? (demoTimeLockElapsed ? undefined : demo?.unlockTime);
  const now = useClock(!!unlockTime && !asset?.redeemed && !simulated);
  const locked = !!unlockTime && (now === undefined || now < unlockTime);
  if (!asset && !demo) return null;

  const redeemed = asset?.redeemed;
  const token = asset?.token && asset.token !== ZeroAddress ? asset.token : demo?.token;
  function cancelHold() {
    clearTimeout(hold.current);
    hold.current = undefined;
    setPressed(false);
  }
  function confirm() {
    cancelHold();
    if (locked) return;
    dialog.current?.close();
    if (purchase) location.assign('/wallet?redeem=' + encodeURIComponent(purchase));
    else {
      setSimulated(true);
      onDemoRedeemed?.();
    }
  }
  function begin() {
    if (hold.current) return;
    setPressed(true);
    hold.current = setTimeout(confirm, SEAL_HOLD_MS);
  }
  return <section className="vault-plaque" aria-label={t("Vaulted gift", "内封心意金")}>
    <p className="room-eyebrow">{t("Vaulted Gift Inside", "VAULTED ASSET · 内封心意金")}</p>
    <p className="vault-amount">{asset ? vaultAmountText(asset) : `${demo?.amount} ${demo?.kind === 'native' ? 'BNB' : t("token", "代币")}`}</p>
    {token && <p className="wallet-address" title={token}>{t("Token contract", "代币合约")} {token.slice(0, 10)}…{token.slice(-6)}</p>}
    {asset && <p role="status">{redeemed ? t("Vaulted asset redeemed", "内封礼金已取出") : t("The holder can redeem the vaulted asset by burning the gift.", "持有人可销毁礼物以取出内封礼金。")}</p>}
    {simulated && <p role="status">{t('Kept as a keepsake', '已定格为纪念档案')}</p>}
    {redeemed && <p>{t("Redeemed", "实际取出")} {vaultAmountText(asset!, redeemed.amount)} · <a className="boutique-link" href={testnet.explorer + '/tx/' + redeemed.transaction} target="_blank" rel="noreferrer">{t("Redemption transaction ↗", "赎回记录 ↗")}</a></p>}
    {locked && unlockTime && <><p>{t('Time-locked until', '时间锁开启于')} <time dateTime={new Date(unlockTime * 1000).toISOString()}>
      {new Date(unlockTime * 1000).toLocaleString(t('en', 'zh-CN'))}</time></p><Countdown target={unlockTime} now={now}/></>}
    {!redeemed && !simulated && (purchase || demo) && <div className="vault-inline"><button ref={trigger} disabled={locked} type="button" className="boutique-link" onClick={() => dialog.current?.showModal()}>
      {purchase ? t("Burn gift and redeem vaulted asset →", "销毁此礼物并取出内封心意金 →") : t("Simulate burn and redemption →", "模拟销毁并取出 →")}
    </button><InfoTip en="The gift and its note stay in the keepsake archive." zh="作品与祝福保留在纪念档案。" /></div>}
    <dialog className="vault-dialog" ref={dialog} onClose={() => { cancelHold(); trigger.current?.focus(); }} aria-label={t("Confirm gift burn", "确认销毁礼物")}>
      <h2>{t("Confirm gift burn", "确认销毁礼物")}</h2>
      <p>{purchase ? t("After onchain confirmation, the gift NFT is permanently burned. The vaulted asset goes to the holder’s wallet. Transfer taxes may reduce the amount received.", "链上确认后，礼物 NFT 将永久销毁。内封心意金会发至持有人钱包。若代币对转账收税，实际到账会减少。") : t("The gift becomes a grayscale keepsake and preserves the note.", "礼物将定格为灰阶纪念档案，并保留祝福。")}</p>
      <button type="button" className="button outline" autoFocus onClick={() => dialog.current?.close()}>{t("Cancel and keep the gift", "取消，继续珍藏")}</button>
      <button type="button" className="button primary" aria-describedby={description}
        onPointerDown={event => { if (event.button === 0) { event.currentTarget.setPointerCapture(event.pointerId); begin(); } }}
        onPointerUp={cancelHold} onPointerCancel={cancelHold} onLostPointerCapture={cancelHold}
        onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); begin(); } }}
        onKeyUp={event => { if (event.key === ' ' || event.key === 'Enter') cancelHold(); }}
        onBlur={cancelHold}
        onClick={event => { if (event.detail === 0) confirm(); }}>
        {pressed ? t("Keep holding…", "继续按住…") : t("Hold to confirm burn", "长按确认销毁")}
      </button>
      <p id={description} className="checkout-note">{t(`Hold for ${SEAL_HOLD_MS / 1000} seconds`, `按住 ${SEAL_HOLD_MS / 1000} 秒`)}{purchase ? t(', then confirm in your wallet.', '，随后在钱包确认。') : t(' to archive the gift.', '，将礼物存入纪念档案。')}</p>
    </dialog>
  </section>;
}
