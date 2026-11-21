import { randomUUID } from 'node:crypto';

export class ApplicationInputError extends Error {}
export type CreatorApplicationInput = {
  name: string;
  contact: string;
  portfolio: string;
  links?: string[];
  medium: 'image' | 'video' | 'model' | 'mixed' | 'other';
  proposal: string;
};
export type CreatorApplication = CreatorApplicationInput & {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt: string | null;
};
export function parseCreatorApplication(input: unknown): CreatorApplicationInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationInputError('请填写申请信息。');
  const data = input as Record<string, unknown>;
  if (Object.keys(data).some(key => !['name', 'contact', 'portfolio', 'links', 'medium', 'proposal'].includes(key))) throw new ApplicationInputError('申请包含不支持的字段。');
  function text(key: string, max: number): string {
    const value = data[key];
    if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw new ApplicationInputError('请完整填写申请，并遵守各项字数限制。');
    return value.trim();
  }
  const name = text('name', 80), contact = text('contact', 200), proposal = text('proposal', 1200);
  const rawLinks = data.links ?? (data.portfolio ? [data.portfolio] : []);
  if (!Array.isArray(rawLinks) || rawLinks.length > 10) throw new ApplicationInputError('最多填写 10 条作品链接。');
  const links = rawLinks.map(link => {
    if (typeof link !== 'string' || link.length > 500) throw new ApplicationInputError('作品链接格式有误。');
    return link.trim();
  }).filter(Boolean);
  try {
    for (const link of links) {
      const url = new URL(link);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid link');
    }
  } catch { throw new ApplicationInputError('作品链接需要是完整的 http 或 https 链接。'); }
  if (!['image', 'video', 'model', 'mixed', 'other'].includes(data.medium as string)) throw new ApplicationInputError('请选择作品形式。');
  return { name, contact, portfolio: links[0] ?? '', ...(data.links === undefined ? {} : { links }), proposal, medium: data.medium as CreatorApplicationInput['medium'] };
}
export function newCreatorApplication(input: CreatorApplicationInput): CreatorApplication {
  return { ...input, id: randomUUID(), status: 'pending', createdAt: new Date().toISOString(), reviewedAt: null };
}
