import { ACTIVE_ZODIAC_IDS, ZODIAC_LIST } from './zodiac';

export type SeriesStatus = 'live' | 'upcoming' | 'archive';

export type GiftSeries = {
  slug: string;
  code: string;
  titleCn: string;
  titleEn: string;
  seasonTag: string;
  summary: string;
  route: string;
  coverImage?: string;
  itemProgress: string;
  status: SeriesStatus;
};

export const zodiacSeries: GiftSeries = {
  slug: 'zodiac',
  code: 'EXHIBITION 01',
  titleCn: '十二生肖 · 鎏金像素',
  titleEn: 'GILDED VOXEL ZODIAC',
  seasonTag: '2026–2027 · 当期特展',
  summary: '浏览十二生肖主题数字礼物，试玩实时三维赏玩与开箱。',
  route: '/series/zodiac',
  coverImage: '/api/zodiac-assets/voxel-horse-preview.png',
  itemProgress: `${String(ACTIVE_ZODIAC_IDS.length).padStart(2, '0')} / ${ZODIAC_LIST.length} 件可预览`,
  status: 'live',
};

export const giftSeries: readonly GiftSeries[] = [zodiacSeries];
