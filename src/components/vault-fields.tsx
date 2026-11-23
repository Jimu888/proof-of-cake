'use client';

import { useEffect, useState } from 'react';
import { ZeroAddress } from 'ethers';
import { parseVaultDraft, vaultUnits, type TokenDetails, type VaultDraft } from '../domain/vault-gift';

export default function VaultFields({ value, onChange, enabled, demo, disabled }: {
  value?: VaultDraft;
  onChange: (value?: VaultDraft) => void;
  enabled: boolean;
  demo?: boolean;
  disabled?: boolean;
}) {
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

  if (!enabled) return <p className="checkout-note">此发行版本暂不支持封入资产。</p>;
  const checked = metadata?.address === token ? metadata?.info : undefined;
  return <fieldset className="vault-fields" disabled={disabled}>
    <legend className="sr-only">选填内封资产</legend>
    <label className="vault-toggle">
      <input type="checkbox" checked={!!value} onChange={event => onChange(event.target.checked ? { kind: 'native', amount: '' } : undefined)}/>
      封入链上资产（选填）
    </label>
    {value && <>
      <p className="checkout-note">{demo ? '演示模拟锁仓 · 未扣款或上链。' : '仅 BSC 测试网。当前持有人销毁礼物时可取出资产。'}</p>
      <label>资产类型
        <select value={value.kind} onChange={event => onChange({ kind: event.target.value === 'token' ? 'token' : 'native', amount: value.amount })}>
          <option value="native">原生 {demo ? 'BNB（演示）' : 'tBNB'}</option>
          <option value="token">自定义 BSC 测试网代币</option>
        </select>
      </label>
      {value.kind === 'token' && <>
        <label>代币合约地址
          <input value={value.token ?? ''} onChange={event => onChange({ ...value, token: event.target.value.trim() })} placeholder="0x…" maxLength={42} required/>
        </label>
        {token && /^0x[0-9a-f]{40}$/i.test(token) && metadata?.address === token && <p className="checkout-note" role="status">
          {checked ? `${checked.symbol} · ${checked.decimals} 位小数` : '暂时无法读取测试网代币资料。'}
        </p>}
        <p className="checkout-note">代币转账税会减少实际到账。暂停、白名单或其他发行方限制可能阻止取出。</p>
      </>}
      <label>封入数量
        <input value={value.amount} onChange={event => onChange({ ...value, amount: event.target.value.trim() })} inputMode="decimal" required maxLength={69} placeholder="0.01"/>
      </label>
    </>}
  </fieldset>;
}

export async function resolveVaultDraft(value?: VaultDraft) {
  const draft = parseVaultDraft(value);
  if (!draft) return;
  if (draft.kind === 'native') return { draft, amount: vaultUnits(draft.amount, 18), symbol: 'tBNB' };
  const response = await fetch('/api/testnet/token?address=' + encodeURIComponent(draft.token!));
  if (!response.ok) throw new Error('请确认测试网代币合约地址及可用性。');
  const details = await response.json() as TokenDetails;
  return { draft, amount: vaultUnits(draft.amount, details.decimals), symbol: details.symbol };
}
