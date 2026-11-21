import { platformDirectory } from './data-directory';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { ApplicationInputError, newCreatorApplication, parseCreatorApplication, type CreatorApplication } from '../domain/creator-applications';

export type ApplicationAttachment = { name: string; bytes: Uint8Array };

/** Private local review queue. Never expose list/review through an unauthenticated API. */
export class CreatorApplicationRepository {
  private db: DatabaseSync;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    if (path !== ':memory:') chmodSync(path, 0o600);
    this.db.exec(`PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS creator_applications (
        request_key TEXT PRIMARY KEY, fingerprint TEXT NOT NULL,
        id TEXT NOT NULL UNIQUE, payload TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS application_attachments (
        application_id TEXT NOT NULL, position INTEGER NOT NULL, name TEXT NOT NULL, bytes BLOB NOT NULL,
        PRIMARY KEY(application_id, position)
      );`);
  }
  submit(input: unknown, key: string, attachments: ApplicationAttachment[] = []): CreatorApplication {
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(key)) throw new ApplicationInputError('申请标识无效，请刷新后重试。');
    const parsed = parseCreatorApplication(input);
    if (!parsed.portfolio && !attachments.length) throw new ApplicationInputError('请提供作品链接或上传附件。');
    const fingerprint = attachments.length
      ? JSON.stringify([parsed, attachments.map(file => [file.name, createHash('sha256').update(file.bytes).digest('hex')])])
      : JSON.stringify(parsed);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const previous = this.db.prepare('SELECT fingerprint, payload FROM creator_applications WHERE request_key=?').get(key);
      let application: CreatorApplication;
      if (previous) {
        if (previous.fingerprint !== fingerprint) throw new ApplicationInputError('同一申请标识不能用于不同内容。');
        application = JSON.parse(previous.payload as string);
      } else {
        const count = this.db.prepare('SELECT COUNT(*) AS total FROM creator_applications').get()!.total as number;
        if (count >= 1000) throw new ApplicationInputError('申请列表暂满，请稍后再试。');
        application = newCreatorApplication(parsed);
        this.db.prepare('INSERT INTO creator_applications VALUES (?, ?, ?, ?)').run(key, fingerprint, application.id, JSON.stringify(application));
        const insert = this.db.prepare('INSERT INTO application_attachments VALUES (?, ?, ?, ?)');
        attachments.forEach((file, index) => insert.run(application.id, index, file.name, file.bytes));
      }
      this.db.exec('COMMIT');
      return application;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  list(): CreatorApplication[] {
    return this.db.prepare('SELECT payload FROM creator_applications ORDER BY rowid DESC LIMIT 1000').all().map(row => JSON.parse(row.payload as string));
  }
  page(search: string, status: string, requested: number, limit: number) {
    const where = `WHERE (?='' OR json_extract(payload,'$.status')=?)
      AND (instr(lower(json_extract(payload,'$.name')),lower(?))>0
        OR instr(lower(json_extract(payload,'$.contact')),lower(?))>0 OR ?='')`;
    const params = [status, status, search, search, search];
    const total = Number(this.db.prepare('SELECT count(*) AS total FROM creator_applications ' + where).get(...params)!.total);
    const page = Math.max(1, Math.min(requested, Math.ceil(total / limit)));
    const rows = this.db.prepare('SELECT payload FROM creator_applications ' + where + ' ORDER BY rowid DESC LIMIT ? OFFSET ?')
      .all(...params, limit, (page - 1) * limit);
    return { total, page, items: rows.map(row => JSON.parse(String(row.payload)) as CreatorApplication) };
  }

  attachments(id: string) {
    return this.db.prepare('SELECT position,name FROM application_attachments WHERE application_id=? ORDER BY position').all(id)
      .map(row => ({ position: Number(row.position), name: String(row.name) }));
  }

  attachment(id: string, position: number) {
    const row = this.db.prepare('SELECT name,bytes FROM application_attachments WHERE application_id=? AND position=?').get(id, position);
    return row && { name: String(row.name), bytes: row.bytes as Uint8Array };
  }

  review(id: string, status: 'approved' | 'rejected'): CreatorApplication {
    if (!['approved', 'rejected'].includes(status)) throw new ApplicationInputError('审核结果无效。');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = this.db.prepare('SELECT payload FROM creator_applications WHERE id=?').get(id);
      if (!row) throw new ApplicationInputError('申请不存在。');
      const application: CreatorApplication = JSON.parse(row.payload as string);
      if (application.status !== 'pending' && application.status !== status) throw new ApplicationInputError('申请已经审核，请先核对现有结果。');
      if (application.status === 'pending') {
        application.status = status;
        application.reviewedAt = new Date().toISOString();
        this.db.prepare('UPDATE creator_applications SET payload=? WHERE id=?').run(JSON.stringify(application), id);
      }
      this.db.exec('COMMIT');
      return application;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  close() { this.db.close(); }
}
let repository: CreatorApplicationRepository | undefined;
export function getCreatorApplicationRepository() {
  repository ??= new CreatorApplicationRepository(resolve(platformDirectory, 'applications.sqlite'));
  return repository;
}
