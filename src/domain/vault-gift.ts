import { formatUnits, getAddress, parseUnits, ZeroAddress } from 'ethers';

export type VaultDraft = { kind: 'native' | 'token'; amount: string; token?: string; unlockTime?: number };
export type VaultAsset = {
  token: string;
  amount: string;
  symbol?: string;
  decimals?: number;
  owner?: string;
  unlockTime?: number;
  redeemed?: { amount: string; transaction: string; owner: string };
};
export type TokenDetails = { symbol: string; decimals: number };
export const testnetNativeSymbol = 'tBNB';

export function parseVaultDraft(value: unknown, minimumUnlockTime = Math.floor(Date.now() / 1000)): VaultDraft | undefined {
  if (value === undefined || value === null) return;
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('请输入有效的内封资产。');
  const { kind, amount, token, unlockTime } = value as Partial<VaultDraft>;
  if (unlockTime !== undefined && (!Number.isSafeInteger(unlockTime) || unlockTime <= minimumUnlockTime || unlockTime > 253402300799)) {
    throw new Error('请选择未来的有效开启时间。');
  }
  const lock = unlockTime === undefined ? {} : { unlockTime };
  if (kind !== 'native' && kind !== 'token') throw new Error('请选择内封资产类型。');
  if (typeof amount !== 'string' || !/^\d{1,32}(?:\.\d{1,36})?$/.test(amount) || !/[1-9]/.test(amount)) {
    throw new Error('请输入大于零的资产数量。');
  }
  const normalized = amount.replace(/^0+(?=\d)/, '').replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
  if (kind === 'native') {
    vaultUnits(normalized, 18);
    return { kind, amount: normalized, ...lock };
  }
  let address;
  try {
    address = getAddress(token ?? '');
  } catch {
    throw new Error('请输入完整的 BSC 代币合约地址。');
  }
  if (address === ZeroAddress) throw new Error('代币合约不能为零地址。');
  return { kind, amount: normalized, token: address, ...lock };
}

export function vaultUnits(amount: string, decimals: number): bigint {
  try {
    const value = parseUnits(amount, decimals);
    if (value <= 0n || value >= 2n ** 256n) throw new Error();
    return value;
  } catch {
    throw new Error('资产数量超出代币的小数位或金额范围。');
  }
}

export function vaultAmountText(asset: VaultAsset, amount = asset.amount) {
  return asset.decimals === undefined
    ? `${amount} 最小单位`
    : `${formatUnits(amount, asset.decimals)} ${asset.symbol ?? '代币'}`;
}
