export const catalog = [
  { id: 'genesis-cake', title: 'Genesis Cake', theme: 'birthday', artist: 'Demo Studio', description: '演示占位作品；等待项目方原创素材替换。', price: null, saleEnabled: false },
  { id: 'zodiac-orbit', title: 'Zodiac Orbit', theme: 'zodiac', artist: 'Demo Studio', description: '星座主题占位记录；不是已获授权的商品。', price: null, saleEnabled: false },
] as const;
export const blessings = {
  birthday: '生日快乐，愿你新的一岁好运不断。',
  encounter: '很高兴在这个世界遇见你。',
  memory: '送你一份链上的生日纪念。',
  none: '',
} as const;
