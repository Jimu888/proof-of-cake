import { platformDirectory } from './data-directory';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { OrderInputError, type DemoOrder, type OrderRepository, type OrderResult } from '../domain/orders';

/** Local demo persistence. Replace with PostgreSQL for a hosted, authenticated service. */
export class SqliteOrderRepository implements OrderRepository {
  private db: DatabaseSync;
  constructor(path: string, private capacity = 1000) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    if (path !== ':memory:') chmodSync(path, 0o600);
    this.db.exec(`
      PRAGMA busy_timeout = 5000;
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS demo_orders (
        request_key TEXT PRIMARY KEY,
        fingerprint TEXT NOT NULL,
        share_token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        payload TEXT NOT NULL
      );
    `);
  }
  create(key: string, fingerprint: string, candidate: DemoOrder): OrderResult {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const existing = this.db.prepare('SELECT fingerprint, payload FROM demo_orders WHERE request_key = ?').get(key);
      let result: OrderResult;
      if (existing) {
        const previousInput = JSON.parse(existing.fingerprint as string);
        delete previousInput.publicMessageAccepted; // Ignore the retired checkbox in saved demo requests.
        if (JSON.stringify(previousInput) !== fingerprint) throw new OrderInputError('同一请求标识不能创建不同订单。');
        const order = JSON.parse(existing.payload as string) as DemoOrder;
        if (Date.parse(order.expiresAt) <= Date.now()) throw new OrderInputError('预览已过期，请重新填写。');
        result = { order, replay: true };
      } else {
        this.db.prepare('DELETE FROM demo_orders WHERE expires_at <= ?').run(new Date().toISOString());
        const count = this.db.prepare('SELECT COUNT(*) AS total FROM demo_orders').get()!.total as number;
        if (count >= this.capacity) throw new OrderInputError('本地演示记录已满，请稍后再试。');
        this.db.prepare('INSERT INTO demo_orders VALUES (?, ?, ?, ?, ?)').run(key, fingerprint, candidate.shareToken, candidate.expiresAt, JSON.stringify(candidate));
        result = { order: candidate, replay: false };
      }
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  findByToken(token: string): DemoOrder | undefined {
    if (!/^[0-9a-f]{48}$/.test(token)) return undefined;
    const row = this.db.prepare('SELECT payload FROM demo_orders WHERE share_token = ? AND expires_at > ?').get(token, new Date().toISOString());
    return row ? JSON.parse(row.payload as string) as DemoOrder : undefined;
  }
  close() { this.db.close(); }
}
let repository: SqliteOrderRepository | undefined;
export function getOrderRepository(): SqliteOrderRepository {
  repository ??= new SqliteOrderRepository(resolve(platformDirectory, 'orders.sqlite'));
  return repository;
}
