export type ZodiacId =
  | 'rat'
  | 'ox'
  | 'tiger'
  | 'rabbit'
  | 'dragon'
  | 'snake'
  | 'horse'
  | 'goat'
  | 'monkey'
  | 'rooster'
  | 'dog'
  | 'pig';

export type ActiveZodiacId = 'goat' | 'horse' | 'ox' | 'dragon';
export type ZodiacFilter = 'original' | 'obsidian' | 'hologram' | 'emerald';

export type ZodiacSpec = {
  id: ZodiacId;
  branch: string;
  nameCn: string;
  nameEn: string;
  yearTag: string;
  cryptoTheme: string;
  cryptoSubtitle: string;
  available: boolean;
  modelUrl?: string;
  previewUrl?: string;
  sealText: string;
  accentHex: string;
  blockHeight: string;
  defaultBlessing: string;
  unsealLabel: string;
};

export const ZODIAC_FILTERS: ReadonlyArray<{ id: ZodiacFilter; label: string; en: string }> = [
  { id: 'original', label: '原色增强', en: 'ORIGINAL+' },
  { id: 'obsidian', label: '黑曜鎏金', en: 'OBSIDIAN' },
  { id: 'hologram', label: '冰银全息', en: 'HOLOGRAM' },
  { id: 'emerald', label: '翡翠矩阵', en: 'EMERALD' },
];

export const ZODIAC_LIST: readonly ZodiacSpec[] = [
  {
    id: 'goat',
    branch: '未',
    nameCn: '未羊',
    nameEn: 'RAM / GOAT',
    yearTag: '2027 丁未',
    cryptoTheme: 'G.O.A.T. / Airdrop',
    cryptoSubtitle: '空投棱镜 · 精准降临',
    available: true,
    modelUrl: '/api/zodiac-assets/voxel-goat.glb',
    previewUrl: '/api/zodiac-assets/voxel-goat-preview.png',
    sealText: '天降鸿运',
    accentHex: '#f5c86c',
    blockHeight: 'BLOCK #20270808',
    defaultBlessing: '愿你在 2027 丁未羊年好运如空投般精准降临，既能稳稳接住所有惊喜，又是人生赛道上独一无二的 G.O.A.T.！生日快乐！',
    unsealLabel: '空投降落拼装',
  },
  {
    id: 'horse',
    branch: '午',
    nameCn: '午马',
    nameEn: 'HORSE / L2',
    yearTag: '2026 丙午',
    cryptoTheme: 'Layer-2 Speed',
    cryptoSubtitle: '高 TPS 闪电网络',
    available: true,
    modelUrl: '/api/zodiac-assets/voxel-horse.glb',
    previewUrl: '/api/zodiac-assets/voxel-horse-preview.png',
    sealText: '马上暴富',
    accentHex: '#7dd3fc',
    blockHeight: 'BLOCK #20260707',
    defaultBlessing: '愿你新的一岁如 Layer-2 主网般零摩擦、高 TPS 极速出块，前路坦荡无阻，所有心愿“马上”兑现！生日快乐！',
    unsealLabel: '光速拉丝汇聚',
  },
  {
    id: 'ox',
    branch: '丑',
    nameCn: '丑牛',
    nameEn: 'OX / BULL',
    yearTag: 'BULL MARKET',
    cryptoTheme: 'Bull Market',
    cryptoSubtitle: '永动多头 K 线',
    available: true,
    modelUrl: '/api/zodiac-assets/voxel-ox.glb',
    previewUrl: '/api/zodiac-assets/voxel-ox-preview.png',
    sealText: '岁岁长牛',
    accentHex: '#34d399',
    blockHeight: 'BLOCK #20210202',
    defaultBlessing: '愿你新的一岁气势如虹、钻石手稳拿人生筹码，事业与生活如永动多头 K 线一路向上突破，岁岁长牛！生日快乐！',
    unsealLabel: '大阳线升腾突破',
  },
  {
    id: 'dragon',
    branch: '辰',
    nameCn: '辰龙',
    nameEn: 'GENESIS DRAGON',
    yearTag: 'GENESIS #0',
    cryptoTheme: 'Genesis Dragon',
    cryptoSubtitle: '创世区块 0 / 1',
    available: true,
    modelUrl: '/api/zodiac-assets/voxel-dragon.glb',
    previewUrl: '/api/zodiac-assets/voxel-dragon-preview.png',
    sealText: '岁岁长明',
    accentHex: '#e8c474',
    blockHeight: 'GENESIS #00000000',
    defaultBlessing: '愿你新的一岁如创世神龙般气运绵长，格局洞开，所遇皆为 Alpha，岁岁皆成主网级传奇。生日快乐！',
    unsealLabel: '星环螺旋汇聚',
  },
  {
    id: 'rat',
    branch: '子',
    nameCn: '子鼠',
    nameEn: 'RAT',
    yearTag: 'COMING SOON',
    cryptoTheme: 'Seed Phrase',
    cryptoSubtitle: '暗夜觅珠 · 敬请期待',
    available: false,
    sealText: '机敏生财',
    accentHex: '#94a3b8',
    blockHeight: 'PENDING',
    defaultBlessing: '子鼠加密数字礼物正在制作中。',
    unsealLabel: '敬请期待',
  },
  {
    id: 'tiger',
    branch: '寅',
    nameCn: '寅虎',
    nameEn: 'TIGER',
    yearTag: 'COMING SOON',
    cryptoTheme: 'Alpha Hunter',
    cryptoSubtitle: '林间猎手 · 敬请期待',
    available: false,
    sealText: '虎啸生风',
    accentHex: '#94a3b8',
    blockHeight: 'PENDING',
    defaultBlessing: '寅虎加密数字礼物正在制作中。',
    unsealLabel: '敬请期待',
  },
  {
    id: 'rabbit',
    branch: '卯',
    nameCn: '卯兔',
    nameEn: 'RABBIT',
    yearTag: 'COMING SOON',
    cryptoTheme: 'Rabbit Hole',
    cryptoSubtitle: '穿越兔子洞 · 概念已定',
    available: false,
    sealText: '跃入奇境',
    accentHex: '#94a3b8',
    blockHeight: 'PENDING',
    defaultBlessing: '卯兔加密数字礼物正在制作中。',
    unsealLabel: '敬请期待',
  },
  {
    id: 'snake',
    branch: '巳',
    nameCn: '巳蛇',
    nameEn: 'SNAKE',
    yearTag: 'COMING SOON',
    cryptoTheme: 'Smart Contract',
    cryptoSubtitle: '智能合约 · 概念已定',
    available: false,
    sealText: '灵蛇衔珠',
    accentHex: '#94a3b8',
    blockHeight: 'PENDING',
    defaultBlessing: '巳蛇加密数字礼物正在制作中。',
    unsealLabel: '敬请期待',
  },
  {
    id: 'monkey',
    branch: '申',
    nameCn: '申猴',
    nameEn: 'MONKEY',
    yearTag: 'COMING SOON',
    cryptoTheme: 'Degen Genius',
    cryptoSubtitle: '灵猴通变 · 敬请期待',
    available: false,
    sealText: '灵动无碍',
    accentHex: '#94a3b8',
    blockHeight: 'PENDING',
    defaultBlessing: '申猴加密数字礼物正在制作中。',
    unsealLabel: '敬请期待',
  },
  {
    id: 'rooster',
    branch: '酉',
    nameCn: '酉鸡',
    nameEn: 'ROOSTER',
    yearTag: 'COMING SOON',
    cryptoTheme: 'GM Signal',
    cryptoSubtitle: '破晓报晨 · 敬请期待',
    available: false,
    sealText: '破晓吉鸣',
    accentHex: '#94a3b8',
    blockHeight: 'PENDING',
    defaultBlessing: '酉鸡加密数字礼物正在制作中。',
    unsealLabel: '敬请期待',
  },
  {
    id: 'dog',
    branch: '戌',
    nameCn: '戌狗',
    nameEn: 'DOG',
    yearTag: 'COMING SOON',
    cryptoTheme: 'Loyal Node',
    cryptoSubtitle: '守护节点 · 敬请期待',
    available: false,
    sealText: '长守常安',
    accentHex: '#94a3b8',
    blockHeight: 'PENDING',
    defaultBlessing: '戌狗加密数字礼物正在制作中。',
    unsealLabel: '敬请期待',
  },
  {
    id: 'pig',
    branch: '亥',
    nameCn: '亥猪',
    nameEn: 'PIG',
    yearTag: 'COMING SOON',
    cryptoTheme: 'Full Vault',
    cryptoSubtitle: '金库满盈 · 敬请期待',
    available: false,
    sealText: '丰盈自在',
    accentHex: '#94a3b8',
    blockHeight: 'PENDING',
    defaultBlessing: '亥猪加密数字礼物正在制作中。',
    unsealLabel: '敬请期待',
  },
];

export const ACTIVE_ZODIAC_IDS: readonly ActiveZodiacId[] = ['goat', 'horse', 'ox', 'dragon'];

export function isActiveZodiacId(value: string | null | undefined): value is ActiveZodiacId {
  return value === 'goat' || value === 'horse' || value === 'ox' || value === 'dragon';
}

export function getZodiacById(id: string | null | undefined): ZodiacSpec {
  return ZODIAC_LIST.find(item => item.id === id) ?? ZODIAC_LIST[0];
}
