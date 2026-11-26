const giftErrors: Record<string, string> = {
  '请填写礼物信息。': 'Enter the gift details.',
  '包含不支持的订单字段。': 'The request contains unsupported order fields.',
  '请选择可用的生肖材质。': 'Choose an available zodiac material.',
  '请选择一种礼金配置。': 'Choose one reserve configuration.',
  '请求来源不匹配。': 'The request origin does not match this site.',
  'JSON 格式错误。': 'The request contains invalid JSON.',
  '请使用 JSON 请求。': 'Send the request as JSON.',
  '请求内容过长。': 'The request is too large.',
  '请输入有效的邮箱、社交账号、.ai 名称或钱包地址。': 'Enter a valid email, social handle, .ai name or wallet address.',
  '请输入不同的收礼身份和发起身份，以及有效礼金与终止条款。': 'Use distinct recipient and sender identities and check the deposit and termination terms.',
  '请输入有效的发起人邮箱、社交账号、.ai 名称或钱包地址。': 'Enter a valid sender email, social handle, .ai name or wallet address.',
  '请输入不同的双钱包地址、有效出资及分开条款。': 'Enter two distinct sample addresses, valid deposits, and termination terms.',
  '请填写有效的多人祝福。': 'Add valid contributor notes.',
  '请输入示例收礼人。': 'Enter a sample recipient.',
  '请选择未来的有效开启时间。': 'Choose a valid opening date in the future.',
  '请输入有效的内封资产。': 'Enter a valid vaulted asset.',
  '请选择内封资产类型。': 'Choose the vaulted asset type.',
  '请输入大于零的资产数量。': 'Enter an amount greater than zero.',
  '请输入完整的 BSC 代币合约地址。': 'Enter the full BSC token contract address.',
  '代币合约不能为零地址。': 'The token contract cannot be the zero address.',
  '资产数量超出代币的小数位或金额范围。': 'The amount exceeds the token’s precision or supported range.',
  '该发行版本不允许销毁，无法封入资产。': 'This edition cannot be burned and does not support vaulted assets.',
  '请输入 .ai 名称或 BSC 钱包地址。': 'Enter a .ai name or BSC wallet address.',
  '请输入完整 .ai 名称或 BSC 钱包地址。': 'Enter the full .ai name or BSC wallet address.',
  '钱包地址格式或校验和有误。': 'The wallet address format or checksum is invalid.',
  '不能赠送到零地址。': 'A gift cannot be sent to the zero address.',
  '祝福最多 280 字，请使用普通文字。': 'Enter a plain-text message of up to 280 characters.',
  '作品不存在。': 'This artwork is unavailable.',
  '请求标识无效，请刷新后重试。': 'The request ID is invalid. Refresh and try again.',
  '真实购买尚未开放。': 'Live purchasing is currently unavailable.',
  '暂时无法封缄礼盒。': 'Could not seal the parcel.',
  '请输入完整且有效的钱包地址。': 'Enter complete, valid wallet addresses.',
  '请输入收礼人。': 'Enter a recipient.',
  '请检查礼金金额、代币及解锁条件。': 'Check the reserve amount, token and unlock rule.',
  '暂时无法核验 PancakeSwap 流动性。': 'PancakeSwap liquidity is currently unavailable.',
  'PancakeSwap 流动性低于 $50,000。': 'PancakeSwap liquidity is below $50,000.',
  '网络连接中断，请重试。': 'Connection interrupted. Try again.',
  '复制失败，请复制分享链接。': 'Could not copy automatically. Copy the share link below.',
};

export function giftErrorText(error: string, language: 'en' | 'zh') {
  if (error === '无法保存预览，请稍后重试。' || error === '暂时无法生成预览。') return language === 'zh' ? '暂时无法封缄礼盒，请稍后重试。' : 'Could not seal the parcel. Try again.';
  return language === 'zh' ? error : giftErrors[error] ?? (/^[ -~·’–—…↗←→]+$/.test(error) ? error : 'Could not complete this step. Try again.');
}

export const zodiacEnglish = {
  goat: { year: '2027 Dingwei', subtitle: 'Airdrop prism', reveal: 'Airdrop assembly', seal: 'Good fortune from above', greeting: 'May good fortune land right on time in the Year of the Goat. Here’s to catching every surprise and being the one and only G.O.A.T. of your own story. Happy birthday!' },
  horse: { year: '2026 Bingwu', subtitle: 'High-TPS lightning network', reveal: 'Lightspeed assembly', seal: 'Fortune at full gallop', greeting: 'May the year ahead move like a lightning-fast Layer 2, with nothing in your way and every wish arriving right on time. Happy birthday!' },
  ox: { year: 'Bull Market', subtitle: 'A charge of green candles', reveal: 'Bull-market ascent', seal: 'A bullish year ahead', greeting: 'May you have the confidence to hold what matters and the momentum to keep breaking through. Wishing you a bullish year and a happy birthday!' },
  dragon: { year: 'Genesis #0', subtitle: 'Genesis block 0 / 1', reveal: 'Orbital assembly', seal: 'A light for every year', greeting: 'May the Genesis Dragon bring you good fortune, new horizons, and discoveries worth keeping. Here’s to a legendary year. Happy birthday!' },
} as const;

export const paperOptions = [
  { id: 'graphite', en: 'Graphite', zh: '石墨暗卡', swatch: '#263844' },
  { id: 'rice', en: 'Rice paper', zh: '宣纸暖白', swatch: '#f1eee7' },
  { id: 'slate', en: 'Slate', zh: '雾灰石卡', swatch: '#394956' },
] as const;

export type PaperTone = typeof paperOptions[number]['id'];
