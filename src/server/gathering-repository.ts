import { randomBytes } from 'node:crypto';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { GroupNote } from '../domain/gifting-modes';
import { platformDirectory } from './data-directory';

type Room = { seats: number; deadline: number; guests: [string, GroupNote][] };

export class GatheringRepository {
  private readonly db: DatabaseSync;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    if (path !== ':memory:') chmodSync(path, 0o600);
    this.db.exec(`
      PRAGMA busy_timeout = 5000;
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS gatherings (id TEXT PRIMARY KEY, deadline INTEGER NOT NULL, payload TEXT NOT NULL);
    `);
  }

  private find(id: string, now: number): Room | undefined {
    const row = this.db.prepare('SELECT payload FROM gatherings WHERE id = ? AND deadline > ?').get(id, now - 86400);
    if (row) return JSON.parse(row.payload as string) as Room;
  }

  list(id: string, now: number) {
    return this.find(id, now)?.guests.map(([, note]) => note);
  }

  create(seats: number, deadline: number, now: number) {
    return this.transaction(() => {
      this.db.prepare('DELETE FROM gatherings WHERE deadline <= ?').run(now - 86400);
      if (Number(this.db.prepare('SELECT count(*) AS count FROM gatherings').get()?.count) >= 1000) return;
      const id = randomBytes(24).toString('hex');
      this.db.prepare('INSERT INTO gatherings VALUES (?, ?, ?)').run(id, deadline, JSON.stringify({ seats, deadline, guests: [] }));
      return id;
    });
  }

  join(id: string, guest: string, note: GroupNote, now: number) {
    return this.transaction(() => {
      const room = this.find(id, now);
      if (!room) return { status: 404 as const };
      if (!room.guests.some(([key]) => key === guest)) {
        if (room.deadline <= now) return { status: 404 as const };
        if (room.guests.length >= room.seats - 1) return { status: 409 as const };
        room.guests.push([guest, note]);
        this.db.prepare('UPDATE gatherings SET payload = ? WHERE id = ?').run(JSON.stringify(room), id);
      }
      return { status: 200 as const, guests: room.guests.map(([, wish]) => wish) };
    });
  }

  private transaction<T>(operate: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const value = operate();
      this.db.exec('COMMIT');
      return value;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  close() { this.db.close(); }
}

let repository: GatheringRepository | undefined;
export function getGatheringRepository() {
  return repository ??= new GatheringRepository(resolve(platformDirectory, 'gatherings.sqlite'));
}
