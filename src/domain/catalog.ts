import type { ArtworkPolicy } from './artwork-policy';

export type Artwork = Readonly<{
  id: string;
  releaseVersion: string;
  title: string;
  name: string;
  theme: string;
  artist: string;
  description: string;
  story: string;
  image: string;
  cover?: string;
  media: 'image';
  cutout: boolean;
  editionLimit: number;
  priceAtomic: string;
  price: string;
  currency: 'BNB';
  chainId: 56;
  policy: ArtworkPolicy;
  saleEnabled: false;
  showcase?: true;
}>;

// Curated concept works only. Publication requires creator authorization.
export const catalog: readonly Artwork[] = [
  { id: 'cat', releaseVersion: 'concept-v1', title: '宇航猫', name: 'Space Cat', theme: 'birthday', artist: 'Mement 概念工作室', description: '把好奇心带上，去更远的地方。', story: '送给那个始终愿意探索的人。一顶透明头盔，一点勇气，还有一个等待被发现的世界。', image: 'cat.png', media: 'image', cutout: true, editionLimit: 30, priceAtomic: '60000000000000000', price: '0.06', currency: 'BNB', chainId: 56, policy: { transferable: false, holderCanBurn: true }, saleEnabled: false },
  { id: 'sheep', releaseVersion: 'concept-v1', title: '今天不数羊', name: 'Counting Dreams', theme: 'birthday', artist: 'Mement 概念工作室', description: '今晚，把心事交给月亮。', story: '留一点空白，给一夜好梦。让柔软的水墨陪伴一次安静的庆祝，也陪伴之后那些平常的夜晚。', image: 'ink-sheep.png', media: 'image', cutout: false, editionLimit: 50, priceAtomic: '30000000000000000', price: '0.03', currency: 'BNB', chainId: 56, policy: { transferable: true, holderCanBurn: true }, saleEnabled: false },
  { id: 'flower', releaseVersion: 'concept-v1', title: '流动的花', name: 'Quiet Bloom', theme: 'art', artist: 'Mement 概念工作室', description: '为平凡的日子，留下一朵不会凋谢的花。', story: '花瓣停留在展开的一瞬。把这一瞬送给你，也把之后慢慢生长的日子一起送给你。', image: 'flower.png', media: 'image', cutout: false, editionLimit: 20, priceAtomic: '70000000000000000', price: '0.07', currency: 'BNB', chainId: 56, policy: { transferable: false, holderCanBurn: false }, saleEnabled: false },
];

// Preserve identifiers accepted by the original demo API and old browser drafts.
const aliases: Record<string, string> = { 'genesis-cake': 'cat', 'zodiac-orbit': 'flower', portal: 'flower' };
export function findArtwork(id: string): Artwork | undefined {
  return catalog.find(work => work.id === (Object.hasOwn(aliases, id) ? aliases[id] : id));
}

export const blessings = {
  birthday: '生日快乐，愿你新的一岁好运不断。',
  encounter: '很高兴在这个世界遇见你。',
  memory: '送你一份链上的生日纪念。',
  none: '',
} as const;

export function artworkImage(artwork: Artwork, cover = false) {
  const image = (cover && artwork.cover) || artwork.image;
  return image.startsWith('/') ? image : '/cryptogift/' + image;
}
