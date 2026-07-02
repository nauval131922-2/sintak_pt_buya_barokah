import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database_dev.sqlite');
const db = new Database(dbPath);

console.log('\n📊 Sample logs dari 18 Juni - 30 Juni 2026:\n');

const rows = db.prepare(`
  SELECT DATE(created_at) as date, COUNT(*) as count 
  FROM activity_logs 
  WHERE DATE(created_at) BETWEEN '2026-06-18' AND '2026-06-30' 
  GROUP BY DATE(created_at) 
  ORDER BY date
`).all();

rows.forEach((row: any) => {
  console.log(`${row.date}: ${row.count} logs`);
});

console.log(`\nTotal: ${rows.reduce((sum: number, row: any) => sum + row.count, 0)} logs across ${rows.length} days`);

db.close();
