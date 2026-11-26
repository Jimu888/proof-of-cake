import type { ActiveZodiacId } from './zodiac';
import type { ArtworkPolicy } from './artwork-policy';

export type ArtworkDisplayMode = 'sculpture-3d' | 'framed-2d' | 'scroll-ink' | 'motion-video' | 'generative-canvas';

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
  displayMode?: ArtworkDisplayMode;
  zodiacSign?: ActiveZodiacId;
  videoUrl?: string;
  artistEn?: string;
  descriptionEn?: string;
  storyEn?: string;
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
  {
    id: 'snowflake', releaseVersion: 'generative-v1', title: '初雪', name: 'First Snow', theme: 'winter',
    artist: 'Mement 概念工作室', artistEn: 'Mement Concept Studio',
    description: '由你的 .ai 钱包地址结晶而成，世间独一无二。', descriptionEn: 'Crystallized from your .ai wallet address—singular and unrepeatable.',
    story: '同一枚地址，永远长出同一片雪花。把独属于这一刻的冬日封进礼盒。', storyEn: 'The same address always grows the same crystal. Seal a singular piece of winter in a gift.',
    image: 'snowflake.png', media: 'image', displayMode: 'generative-canvas', cutout: false,
    editionLimit: 88, priceAtomic: '30000000000000000', price: '0.03', currency: 'BNB', chainId: 56,
    policy: { transferable: false, holderCanBurn: true }, saleEnabled: false,
  },
  {
    id: 'algorithmic-bond', releaseVersion: 'generative-v1', title: '区块红线', name: 'Blockbound Thread', theme: 'love',
    artist: 'Mement 概念工作室', artistEn: 'Mement Concept Studio',
    description: '由封缄那一刻的 BNB 区块高度与时间戳编织而成。', descriptionEn: 'Woven from the exact BNB Chain block height and timestamp of sealing.',
    story: '相遇的那一个区块不可复制，将那一刻的链上时间系成一根流动的朱砂红线。', storyEn: 'No block ever repeats. Weave the exact onchain moment into a flowing crimson silk thread.',
    image: 'algorithmic-bond.png', media: 'image', displayMode: 'generative-canvas', cutout: false,
    editionLimit: 88, priceAtomic: '30000000000000000', price: '0.03', currency: 'BNB', chainId: 56,
    policy: { transferable: false, holderCanBurn: true }, saleEnabled: false,
  },
  { id: 'sheep', releaseVersion: 'concept-v1', title: '今天不数羊', name: 'Counting Dreams', theme: 'birthday', artist: 'Mement 概念工作室', artistEn: 'Mement Concept Studio', descriptionEn: 'Leave your cares with the moon tonight.', storyEn: 'A little space for a good dream. Gentle ink for a quiet celebration and the ordinary nights that follow.', description: '今晚，把心事交给月亮。', story: '留一点空白，给一夜好梦。让柔软的水墨陪伴一次安静的庆祝，也陪伴之后那些平常的夜晚。', image: 'ink-sheep.png', media: 'image', displayMode: 'scroll-ink', cutout: false, editionLimit: 50, priceAtomic: '30000000000000000', price: '0.03', currency: 'BNB', chainId: 56, policy: { transferable: true, holderCanBurn: true }, saleEnabled: false },
  { id: 'flower', releaseVersion: 'concept-v1', title: '流动的花', name: 'Quiet Bloom', theme: 'art', artist: 'Mement 概念工作室', artistEn: 'Mement Concept Studio', descriptionEn: 'A flower that will keep for the ordinary days.', storyEn: 'The petals are caught at the moment they unfold. A moment for you, and for the days still growing around it.', description: '为平凡的日子，留下一朵不会凋谢的花。', story: '花瓣停留在展开的一瞬。把这一瞬送给你，也把之后慢慢生长的日子一起送给你。', image: 'flower.png', media: 'image', cutout: false, editionLimit: 20, priceAtomic: '70000000000000000', price: '0.07', currency: 'BNB', chainId: 56, policy: { transferable: false, holderCanBurn: false }, saleEnabled: false },
  { id: 'cat', releaseVersion: 'concept-v1', title: '宇航猫', name: 'Space Cat', theme: 'birthday', artist: 'Mement 概念工作室', artistEn: 'Mement Concept Studio', descriptionEn: 'Take your curiosity a little farther.', storyEn: 'For someone who never stops exploring. A clear helmet, a little courage, and a world waiting to be discovered.', description: '把好奇心带上，去更远的地方。', story: '送给那个始终愿意探索的人。一顶透明头盔，一点勇气，还有一个等待被发现的世界。', image: 'cat.png', media: 'image', cutout: true, editionLimit: 30, priceAtomic: '60000000000000000', price: '0.06', currency: 'BNB', chainId: 56, policy: { transferable: false, holderCanBurn: true }, saleEnabled: false },
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

export function artworkDisplayMode(artwork: Artwork): ArtworkDisplayMode {
  if (artwork.displayMode) return artwork.displayMode;
  if (artwork.zodiacSign) return 'sculpture-3d';
  if (artwork.videoUrl) return 'motion-video';
  if (artwork.id === 'sheep' || /水墨|宣纸|\bink\b/i.test(artwork.theme)) return 'scroll-ink';
  return 'framed-2d';
}

export function artworkArtist(artwork: Artwork, language: 'en' | 'zh') {
  // Earlier demo orders have artwork snapshots from before artistEn was added.
  return language === 'en' ? artwork.artistEn ?? (artwork.artist === 'Mement 概念工作室' ? 'Mement Concept Studio' : artwork.artist) : artwork.artist;
}
