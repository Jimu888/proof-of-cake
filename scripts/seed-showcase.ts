import { createDemoOrder } from '../src/domain/orders';
import { getOrderRepository } from '../src/server/order-repository';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { getCreatorApplicationRepository } from '../src/server/creator-application-repository';
import { getOperations } from '../src/server/operations';

const creators = getCreatorApplicationRepository();
const store = getOperations();
const samples = [
  ['边界工作室', '月球来信', 'cat.png', '0.06'],
  ['晚风画室', '把梦留给夜晚', 'ink-sheep.png', '0.03'],
  ['折光工作室', '一朵花的时间', 'flower.png', '0.07'],
] as const;

async function seed() {
  for (const [index, [name,title,image,price]] of samples.entries()) {
    const picture = await sharp(readFileSync('public/cryptogift/' + image)).webp().toBuffer();
    const creator = creators.submit({
      name: name + '（演示）', contact: 'sample@example.com', links: ['https://example.com/art/' + (index + 1)],
      medium: 'image', proposal: '用于预览创作者申请、作品展示和结算的示例。',
    }, 'mement-showcase-creator-' + index, [{name:image,bytes:readFileSync('public/cryptogift/' + image)}]);
    const author = creators.review(creator.id, 'approved');
    const existing = store.list().find(work => work.artwork.artist === author.name && work.artwork.title === title);
    const id = existing?.artwork.id ?? store.submit(store.issue(author.id),'mement-showcase-work-' + index,{
      title, description: '从作品、赠礼到结算的演示样本。', price, edition: 30, transferable: false, holderCanBurn: true,
    },picture,picture,true);
    if (!existing) store.update(id,'publish',price);
    const artwork = store.publishedArtwork(id);
    if (!artwork || store.demoSales().some(sale => sale.title === title && sale.artist === author.name)) continue;
    for (let count = 0; count <= index; count++) {
      const result = createDemoOrder(getOrderRepository(), {
        artworkId: id, recipient: 'example.ai', message: '愿你常有好风景。',
      }, 'mement-showcase-sale-' + index + '-' + count, { version: 'split-v1', artistBps: 5000 }, () => artwork);
      store.recordDemoSale(result.order);
      if (count === 0 && index === 1) store.settleDemoSale(result.order.id);
    }
  }
  console.log('Three linked sample creators and works are available.');
}
void seed().catch(error=>{console.error(error.message);process.exitCode=1;});
