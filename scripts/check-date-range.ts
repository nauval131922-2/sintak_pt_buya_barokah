import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database_dev.sqlite');
const db = new Database(dbPath);

console.log('\n📊 Checking logs between 2026-03-30 and 2026-07-02:\n');

const rows = db.prepare(`
  SELECT DATE(created_at) as date, COUNT(*) as count 
  FROM activity_logs 
  WHERE DATE(created_at) BETWEEN '2026-03-30' AND '2026-07-02' 
  GROUP BY DATE(created_at) 
  ORDER BY date
  LIMIT 20
`).all();

console.log('First 20 days:');
rows.forEach((row: any) => {
  console.log(`${row.date}: ${row.count} logs`);
});

const total = db.prepare(`
  SELECT COUNT(*) as total 
  FROM activity_logs 
  WHERE DATE(created_at) BETWEEN '2026-03-30' AND '2026-07-02'
`).get() as any;

console.log(`\nTotal: ${total.total} logs`);

// Check exact date range in DB
const range = db.prepare(`
  SELECT 
    MIN(created_at) as min_date,
    MAX(created_at) as max_date
  FROM activity_logs
`).get() as any;

console.log(`\nActual data range in DB:`);
console.log(`Min: ${range.min_date}`);
console.log(`Max: ${range.max_date}`);

db.close();
