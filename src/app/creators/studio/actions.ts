'use server';
import sharp from 'sharp';
import { getOperations, OperationsError, priceAtomic } from '../../../server/operations';

async function normalize(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0 || value.size > 20 * 1024 * 1024) throw new OperationsError('请上传 20 MB 以内的图片。');
  try {
    const bytes = Buffer.from(await value.arrayBuffer());
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const png = bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
    const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!jpeg && !png && !webp) throw new Error('Unsupported image');
    const image = sharp(bytes, { limitInputPixels: 24_000_000 });
    const info = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(info.format ?? '') || (info.pages ?? 1) > 1) throw new Error('Unsupported image');
    return await image.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 92 }).toBuffer();
  } catch { throw new OperationsError('请使用可正常打开的静态 JPG、PNG 或 WebP，像素总数不超过 2400 万。'); }
}
export async function submitArtwork(_previous: { message: string; ok: boolean }, form: FormData) {
  try {
    const store = getOperations();
    const token = String(form.get('token') ?? '').trim();
    store.author(token);
    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();
    const price = String(form.get('price') ?? '').trim();
    const edition = Number(form.get('edition'));
    if (!title || title.length > 80 || !description || description.length > 1200) throw new OperationsError('请填写名称和作品简介。');
    if (!Number.isInteger(edition) || edition < 1 || edition > 10000) throw new OperationsError('请输入 1 至 10000 之间的版数。');
    priceAtomic(price);
    if (form.get('rights') !== 'on') throw new OperationsError('请确认作品授权。');
    const image = await normalize(form.get('image'));
    const cover = await normalize(form.get('cover'));
    const id = store.submit(token, String(form.get('requestKey') ?? ''), {
      title, description, price, edition, transferable: form.get('transferable') === 'on', holderCanBurn: form.get('holderCanBurn') === 'on',
    }, image, cover);
    return { message: '已提交审核 · ' + id, ok: true };
  } catch (error) {
    if (!(error instanceof OperationsError)) console.error('Artwork submission failed', error instanceof Error ? error.name : 'UnknownError');
    return { message: error instanceof OperationsError ? error.message : '暂时无法保存作品。', ok: false };
  }
}
