import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { formatEther, parseEther } from 'ethers';
import type { readTestnetGift } from './testnet-gifts';
import { platformDirectory } from './data-directory';
import type { DemoOrder } from '../domain/orders';
import type { Artwork } from '../domain/catalog';
import { getCreatorApplicationRepository } from './creator-application-repository';

export const digest = (text: string) => createHash('sha256').update(text).digest('hex');
export const randomToken = () => randomBytes(32).toString('hex');
export class OperationsError extends Error { readonly name = 'OperationsError'; }
export type TestnetSale = Omit<NonNullable<Awaited<ReturnType<typeof readTestnetGift>>>, 'message' | 'sharePath' | 'vault'>;
export type TestnetRelease = { artwork: Artwork; contract: string; artist: string; platform: string; artistBps: number; vault?: boolean };
type Work = { artwork: Artwork; state: 'review' | 'published' | 'rejected' | 'archived'; createdAt: string };
export function priceAtomic(price: string) {
  if (!/^\d{1,8}(?:\.\d{1,18})?$/.test(price) || parseEther(price) === 0n) throw new OperationsError('请输入大于零的 BNB 价格，最多 18 位小数。');
  return parseEther(price).toString();
}

export class Operations {
  private db: DatabaseSync;
  constructor(path = resolve(platformDirectory, 'operations.sqlite')) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    if (path !== ':memory:') chmodSync(path, 0o600);
    this.db.exec(`PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS creator_grants (hash TEXT PRIMARY KEY, application_id TEXT NOT NULL UNIQUE);
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY, application_id TEXT NOT NULL, request_key TEXT NOT NULL,
        payload TEXT NOT NULL, state TEXT NOT NULL, created_at TEXT NOT NULL,
        image BLOB NOT NULL, cover BLOB NOT NULL, UNIQUE(application_id, request_key)
      );
      CREATE TABLE IF NOT EXISTS testnet_releases (
        work_id TEXT PRIMARY KEY, contract TEXT UNIQUE NOT NULL, payload TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS testnet_sales (
        hash TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS demo_sales (
        id TEXT PRIMARY KEY, payload TEXT NOT NULL, settled_at TEXT
      );
      CREATE TABLE IF NOT EXISTS price_history (
        work_id TEXT NOT NULL, old_price TEXT, price TEXT NOT NULL, changed_at TEXT NOT NULL
      );`);
  }

  issue(applicationId: string) {
    if (!getCreatorApplicationRepository().list().some(item => item.id === applicationId && item.status === 'approved')) throw new OperationsError('请先通过创作者申请。');
    const token = randomToken();
    this.db.prepare('INSERT INTO creator_grants VALUES (?, ?) ON CONFLICT(application_id) DO UPDATE SET hash=excluded.hash').run(digest(token), applicationId);
    return token;
  }

  author(token: string) {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new OperationsError('上传凭证无效。');
    const grant = this.db.prepare('SELECT application_id FROM creator_grants WHERE hash=?').get(digest(token));
    const application = grant && getCreatorApplicationRepository().list().find(item => item.id === grant.application_id && item.status === 'approved');
    if (!application) throw new OperationsError('上传凭证无效或已更换。');
    return application;
  }

  submit(token: string, requestKey: string, input: { title: string; description: string; price: string; edition: number; transferable: boolean; holderCanBurn: boolean }, image: Uint8Array, cover: Uint8Array, showcase?: true) {
    const author = this.author(token);
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(requestKey)) throw new OperationsError('提交标识无效。');
    const id = randomUUID();
    const amount = priceAtomic(input.price);
    const artwork: Artwork = {
      id, releaseVersion: 'v1', title: input.title, name: input.title, theme: 'art', artist: author.name,
      description: input.description, story: input.description, image: '/media/' + id + '/image', cover: '/media/' + id + '/cover',
      media: 'image', cutout: false, editionLimit: input.edition, priceAtomic: amount, price: formatEther(amount),
      currency: 'BNB', chainId: 56, showcase, policy: { transferable: input.transferable, holderCanBurn: input.holderCanBurn }, saleEnabled: false,
    };
    this.db.prepare('INSERT INTO submissions VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(application_id,request_key) DO NOTHING')
      .run(id, author.id, requestKey, JSON.stringify(artwork), 'review', new Date().toISOString(), image, cover);
    return String(this.db.prepare('SELECT id FROM submissions WHERE application_id=? AND request_key=?').get(author.id, requestKey)!.id);
  }

  list(publicOnly = false): Work[] {
    const rows = this.db.prepare('SELECT payload,state,created_at FROM submissions WHERE (?=0 OR state=?) ORDER BY rowid DESC').all(Number(publicOnly), 'published');
    return rows.map(row => ({ artwork: JSON.parse(String(row.payload)), state: row.state as Work['state'], createdAt: String(row.created_at) }));
  }

  worksPage(search: string, status: string, requested: number, limit: number) {
    const where = `WHERE (?='' OR state=?)
      AND (instr(lower(json_extract(payload,'$.title')),lower(?))>0
        OR instr(lower(json_extract(payload,'$.artist')),lower(?))>0 OR ?='')`;
    const params = [status, status, search, search, search];
    const total = Number(this.db.prepare('SELECT count(*) AS total FROM submissions ' + where).get(...params)!.total);
    const page = Math.max(1, Math.min(requested, Math.ceil(total / limit)));
    const rows = this.db.prepare('SELECT payload,state,created_at FROM submissions ' + where + ' ORDER BY rowid DESC LIMIT ? OFFSET ?')
      .all(...params, limit, (page - 1) * limit);
    const items: Work[] = rows.map(row => ({ artwork: JSON.parse(String(row.payload)), state: row.state as Work['state'], createdAt: String(row.created_at) }));
    return { total, page, items };
  }

  publishedArtwork(id: string): Artwork | undefined {
    const row = this.db.prepare("SELECT payload FROM submissions WHERE id=? AND state='published'").get(id);
    return row && JSON.parse(String(row.payload));
  }

  history(id: string) {
    return this.db.prepare('SELECT old_price,price,changed_at FROM price_history WHERE work_id=? ORDER BY rowid DESC').all(id)
      .map(row => ({ price: formatEther(String(row.price)), date: String(row.changed_at) }));
  }

  update(id: string, action: 'publish' | 'reject' | 'archive', price: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = this.db.prepare('SELECT payload,state FROM submissions WHERE id=?').get(id);
      if (!row) throw new OperationsError('作品不存在。');
      const artwork: Artwork = JSON.parse(String(row.payload));
      if (action === 'publish' && (row.state === 'review' || row.state === 'published')) {
        const amount = priceAtomic(price);
        if (this.release(id) && amount !== artwork.priceAtomic) throw new OperationsError('已发行的测试版使用固定价格。');
        if (row.state === 'review' || amount !== artwork.priceAtomic) this.db.prepare('INSERT INTO price_history VALUES (?, ?, ?, ?)').run(id, row.state === 'review' ? null : artwork.priceAtomic, amount, new Date().toISOString());
        this.db.prepare('UPDATE submissions SET state=?,payload=? WHERE id=?').run('published', JSON.stringify({ ...artwork, priceAtomic: amount, price: formatEther(amount) }), id);
      } else if (action === 'reject' && row.state === 'review' || action === 'archive' && row.state === 'published') {
        this.db.prepare('UPDATE submissions SET state=? WHERE id=?').run(action === 'reject' ? 'rejected' : 'archived', id);
      } else throw new OperationsError('作品状态已变更，请刷新。');
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }

  hasReleases() { return !!this.db.prepare('SELECT 1 FROM testnet_releases LIMIT 1').get(); }

  release(id: string): TestnetRelease | undefined {
    const row = this.db.prepare('SELECT payload FROM testnet_releases WHERE work_id=?').get(id);
    return row && JSON.parse(String(row.payload));
  }

  releaseByContract(contract: string): TestnetRelease | undefined {
    const row = this.db.prepare('SELECT payload FROM testnet_releases WHERE contract=?').get(contract.toLowerCase());
    return row && JSON.parse(String(row.payload));
  }

  bindRelease(release: TestnetRelease) {
    const payload = JSON.stringify(release);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = this.db.prepare('SELECT state,payload FROM submissions WHERE id=?').get(release.artwork.id);
      if (row?.state !== 'published' || row.payload !== JSON.stringify(release.artwork)) throw new OperationsError('作品或价格已变化，请重新准备发行。');
      const previous = this.release(release.artwork.id);
      if (previous && JSON.stringify(previous) !== payload) throw new OperationsError('作品已绑定测试版。');
      if (!previous) {
        if (this.releaseByContract(release.contract)) throw new OperationsError('此合约已绑定其他作品。');
        this.db.prepare('INSERT INTO testnet_releases VALUES (?, ?, ?)').run(release.artwork.id, release.contract.toLowerCase(), payload);
      }
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }

  recordDemoSale(order: DemoOrder) {
    this.db.prepare('INSERT INTO demo_sales(id,payload) VALUES (?,?) ON CONFLICT(id) DO NOTHING').run(order.id, JSON.stringify({
      title: order.artwork.title, artist: order.artwork.artist, date: order.createdAt,
      price: order.artwork.priceAtomic, artistAmount: order.settlement.artistAmount, platformAmount: order.settlement.platformAmount,
    }));
  }

  demoSales() {
    return this.db.prepare('SELECT id,payload,settled_at FROM demo_sales ORDER BY rowid DESC').all().map(row => {
      const details = JSON.parse(String(row.payload)) as { title: string; artist: string; date: string; price: string; artistAmount: string; platformAmount: string };
      return { ...details, id: String(row.id), settledAt: row.settled_at ? String(row.settled_at) : null };
    });
  }

  settleDemoSale(id: string) {
    const result = this.db.prepare('UPDATE demo_sales SET settled_at=? WHERE id=? AND settled_at IS NULL').run(new Date().toISOString(), id);
    return result.changes === 1;
  }

  recordTestnetSale(sale: TestnetSale) {
    this.db.prepare('INSERT INTO testnet_sales VALUES (?, ?, ?) ON CONFLICT(hash) DO NOTHING')
      .run(sale.transaction.toLowerCase(), JSON.stringify(sale), sale.createdAt);
  }

  sales(month = '', search = ''): TestnetSale[] {
    return this.db.prepare(`SELECT payload FROM testnet_sales WHERE (? = '' OR substr(created_at,1,7) = ?) ORDER BY created_at DESC`)
      .all(month, month).map(row => JSON.parse(String(row.payload)) as TestnetSale)
      .filter(sale => !search || [sale.artworkTitle, sale.artistName, sale.transaction].some(value => value?.toLowerCase().includes(search.toLowerCase())));
  }

  media(id: string, kind: 'image' | 'cover', privateAccess: boolean) {
    const statement = kind === 'image'
      ? "SELECT image AS bytes FROM submissions WHERE id=? AND (?=1 OR state IN ('published','archived'))"
      : "SELECT cover AS bytes FROM submissions WHERE id=? AND (?=1 OR state IN ('published','archived'))";
    const row = this.db.prepare(statement).get(id, Number(privateAccess));
    return row ? row.bytes as Uint8Array : null;
  }
}
let operations: Operations | undefined;
export const getOperations = () => operations ??= new Operations();
