import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database_dev.sqlite');
const db = new Database(dbPath);

console.log('\n📅 Checking logs untuk 29 Juni 2026:\n');

const rows = db.prepare(`
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as count,
    MIN(created_at) as first_log,
    MAX(created_at) as last_log
  FROM activity_logs 
  WHERE DATE(created_at) BETWEEN '2026-06-28' AND '2026-06-30'
  GROUP BY DATE(created_at)
  ORDER BY date
`).all();

rows.forEach((row: any) => {
  console.log(`${row.date}: ${row.count} logs`);
  console.log(`  First: ${row.first_log}`);
  console.log(`  Last:  ${row.last_log}\n`);
});

db.close();
