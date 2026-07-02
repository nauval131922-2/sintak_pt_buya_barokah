import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database_dev.sqlite');
const db = new Database(dbPath);

console.log('[CLEANUP] Deleting dummy logs from last year...');

const oneYearAgo = new Date('2026-07-02T01:56:36.631Z');
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

const result = db.prepare(`
  DELETE FROM activity_logs 
  WHERE created_at >= ? AND created_at <= ?
`).run(oneYearAgo.toISOString(), new Date('2026-07-02T01:56:36.631Z').toISOString());

console.log(`[CLEANUP] ✓ Deleted ${result.changes} dummy logs`);

db.close();
