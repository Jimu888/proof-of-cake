import type { Artwork } from './catalog';
import { getZodiacById, isActiveZodiacId } from './zodiac';
import { zodiacEnglish } from '../lib/gift-copy';

export function zodiacArtwork(id: string): Artwork | undefined {
  if (!id.startsWith('zodiac-')) return;
  const sign = id.slice(7);
  if (!isActiveZodiacId(sign)) return;
  const spec = getZodiacById(sign);
  const english = zodiacEnglish[sign];
  return {
    id, releaseVersion: 'genesis-zodiac-demo', name: spec.nameEn, title: spec.nameCn,
    theme: 'birthday', artist: 'Mement 概念工作室', artistEn: 'Mement Concept Studio',
    description: spec.cryptoSubtitle, descriptionEn: english.subtitle,
    story: spec.defaultBlessing, storyEn: english.greeting,
    image: spec.previewUrl ?? '', cover: spec.previewUrl, media: 'image', cutout: false, zodiacSign: sign,
    editionLimit: 30, price: '0.06', priceAtomic: '60000000000000000', currency: 'BNB', chainId: 56,
    policy: { transferable: false, holderCanBurn: true }, saleEnabled: false, showcase: true,
  };
}
