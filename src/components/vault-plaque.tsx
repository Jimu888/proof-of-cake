'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ZeroAddress } from 'ethers';
import { vaultAmountText, type VaultAsset, type VaultDraft } from '../domain/vault-gift';
import { testnet } from '../lib/testnet';

export default function VaultPlaque({ demo, asset, purchase, onDemoRedeemed }: {
  demo?: VaultDraft;
  asset?: VaultAsset;
  purchase?: string;
  onDemoRedeemed?: () => void;
}) {
  const description = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [pressed, setPressed] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => () => clearTimeout(hold.current), []);
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
    hold.current = setTimeout(confirm, 1500);
  }
  return <section className="vault-plaque" aria-label="内封资产">
    <p className="room-eyebrow">VAULTED ASSET · 内封资产</p>
    <p className="vault-amount">{asset ? vaultAmountText(asset) : `${demo?.amount} ${demo?.kind === 'native' ? 'BNB' : '代币'}`}</p>
    {token && <p className="wallet-address" title={token}>代币合约 {token.slice(0, 10)}…{token.slice(-6)}</p>}
    <p role="status">{asset ? redeemed ? '测试网 · 已销毁，内封资产已取出' : '测试网 · 已锁定，持有人销毁后可取出'
      : simulated ? '演示销毁完成 · 未发生链上交易' : '演示模拟锁仓 · 未扣款或上链'}</p>
    {redeemed && <p>实际取出 {vaultAmountText(asset!, redeemed.amount)} · <a className="boutique-link" href={testnet.explorer + '/tx/' + redeemed.transaction} target="_blank" rel="noreferrer">赎回记录 ↗</a></p>}
    {!redeemed && !simulated && (purchase || demo) && <button ref={trigger} type="button" className="boutique-link" onClick={() => dialog.current?.showModal()}>
      {purchase ? '销毁此礼物并取出内封资产 →' : '模拟销毁并取出 →'}
    </button>}
    <dialog className="vault-dialog" ref={dialog} onClose={() => { cancelHold(); trigger.current?.focus(); }} aria-label="确认销毁礼物">
      <h2>确认销毁礼物</h2>
      <p>{purchase ? '链上确认后，礼物 NFT 将永久销毁。内封资产会发至持有人钱包。若代币对转账收税，实际到账会减少。' : '这次演示会把礼物切换为灰阶纪念状态，并保留祝福。'}</p>
      <button type="button" className="button outline" autoFocus onClick={() => dialog.current?.close()}>取消，继续珍藏</button>
      <button type="button" className="button outline" aria-describedby={description}
        onPointerDown={event => { if (event.button === 0) { event.currentTarget.setPointerCapture(event.pointerId); begin(); } }}
        onPointerUp={cancelHold} onPointerCancel={cancelHold} onLostPointerCapture={cancelHold}
        onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); begin(); } }}
        onKeyUp={event => { if (event.key === ' ' || event.key === 'Enter') cancelHold(); }}
        onBlur={cancelHold}
        onClick={event => { if (event.detail === 0) confirm(); }}>
        {pressed ? '继续按住…' : '长按确认销毁'}
      </button>
      <p id={description} className="checkout-note">按住 1.5 秒{purchase ? '，随后在钱包确认' : '，完成销毁演示'}。</p>
    </dialog>
  </section>;
}
