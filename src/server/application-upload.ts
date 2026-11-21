import { ApplicationInputError } from '../domain/creator-applications';
import type { ApplicationAttachment } from './creator-application-repository';

const maxFile = 8 * 1024 * 1024;
export const maxApplicationBody = 3 * maxFile + 64 * 1024;

export async function readApplicationUpload(request: Request) {
  if (Number(request.headers.get('content-length')) > maxApplicationBody) throw new ApplicationInputError('附件总量过大。');
  let size = 0;
  const body = request.body?.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      size += chunk.byteLength;
      if (size > maxApplicationBody) throw new ApplicationInputError('附件总量过大。');
      controller.enqueue(chunk);
    },
  }));
  const form = await new Response(body, { headers: { 'Content-Type': request.headers.get('content-type')! } }).formData();
  const files = form.getAll('attachments').filter((entry): entry is File => entry instanceof File && !!entry.name);
  if (files.length > 3) throw new ApplicationInputError('最多上传 3 个附件。');
  const attachments: ApplicationAttachment[] = [];
  for (const file of files) {
    if (!file.size || file.size > maxFile) throw new ApplicationInputError('每个附件须小于或等于 8 MB。');
    const name = file.name.replace(/[\u0000-\u001f\u007f/\\]/g, '_').slice(-160);
    const extension = name.split('.').pop()?.toLowerCase();
    const bytes = Buffer.from(await file.arrayBuffer());
    const magic = bytes.subarray(0, 12).toString('hex');
    const valid = extension === 'pdf' ? magic.startsWith('255044462d')
      : extension === 'doc' ? magic.startsWith('d0cf11e0a1b11ae1')
      : extension === 'docx' ? magic.startsWith('504b0304') && bytes.includes('[Content_Types].xml') && bytes.includes('word/document.xml')
      : extension === 'png' ? magic.startsWith('89504e470d0a1a0a')
      : extension === 'jpg' || extension === 'jpeg' ? magic.startsWith('ffd8ff')
      : extension === 'gif' ? /^474946383[79]61/.test(magic)
      : extension === 'webp' ? /^52494646.{8}57454250/.test(magic)
      : extension === 'bmp' ? magic.startsWith('424d')
      : extension === 'tiff' || extension === 'tif' ? /^(49492a00|4d4d002a)/.test(magic)
      : false;
    if (!valid) throw new ApplicationInputError('附件格式与文件内容不匹配。支持常见图片、PDF、DOC 和 DOCX。');
    attachments.push({ name, bytes });
  }
  return { input: {
    name: form.get('name'), contact: form.get('contact'), medium: form.get('medium'),
    proposal: form.get('proposal'), links: form.getAll('links'),
  }, attachments };
}
