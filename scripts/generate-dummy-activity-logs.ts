import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database_dev.sqlite');
const db = new Database(dbPath);

const ACTIONS = ['INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'SCRAPE', 'IMPORT', 'UPLOAD'];
const TABLES = [
  'jurnal_harian_produksi',
  'orders',
  'users',
  'employees',
  'sales_orders',
  'barang_jadi',
  'bahan_baku',
  'sph_out',
  'master_pekerjaan_jurnal_produksi',
];
const USERS = [
  { username: 'produksi3', name: 'Rheina Anggraini' },
  { username: 'produksi7', name: 'Meilinda Putri' },
  { username: 'produksi5', name: 'M. Arie Tengku' },
  { username: 'produksi', name: 'Yulia Maulasari' },
  { username: 'nauval', name: 'Nauval Gunawan' },
  { username: 'admin', name: 'Administrator' },
  { username: 'akunting', name: 'Putri Noor Anida' },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMessage(action: string, table: string): string {
  if (action === 'LOGIN') return 'User login ke sistem';
  if (action === 'LOGOUT') return 'User logout dari sistem';
  if (action === 'EXPORT') return `Export data ${table}`;
  if (action === 'SCRAPE') return `Scraping data ${table}`;
  if (action === 'IMPORT') return `Import data ke ${table}`;
  if (action === 'UPLOAD') return `Upload file ke ${table}`;
  return `${action} data di tabel ${table}`;
}

async function generateDummyLogs() {
  console.log('[DUMMY] Generating 1 year of activity logs...');
  
  // Start: 1 tahun yang lalu dari sekarang
  const now = new Date('2026-07-02T01:50:48.260Z');
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  
  const logs: any[] = [];
  let totalDays = 365;
  
  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const date = new Date(oneYearAgo);
    date.setDate(date.getDate() + dayOffset);
    
    // Weekend: kurangi aktivitas
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const logsPerDay = isWeekend ? randomInt(5, 15) : randomInt(20, 80);
    
    for (let i = 0; i < logsPerDay; i++) {
      const hour = isWeekend ? randomInt(0, 23) : randomInt(7, 18); // Jam kerja
      const minute = randomInt(0, 59);
      const second = randomInt(0, 59);
      
      const logDate = new Date(date);
      logDate.setHours(hour, minute, second, randomInt(0, 999));
      
      const action = randomItem(ACTIONS);
      const table = randomItem(TABLES);
      const user = randomItem(USERS);
      
      // Generate raw_data dummy (always generate to avoid NOT NULL constraint)
      let rawData: any;
      if (action === 'INSERT') {
        rawData = { id: randomInt(1000, 9999), nama: `Data ${randomInt(1, 100)}`, created_at: logDate.toISOString() };
      } else if (action === 'UPDATE') {
        rawData = {
          before: { status: 'draft', qty: randomInt(1, 50) },
          after: { status: 'completed', qty: randomInt(50, 100) },
        };
      } else if (action === 'DELETE') {
        rawData = { id: randomInt(1000, 9999), deleted_at: logDate.toISOString() };
      } else {
        // LOGIN, LOGOUT, EXPORT, etc - generic data
        rawData = { action: action, timestamp: logDate.toISOString() };
      }
      
      logs.push({
        action_type: action,
        table_name: table,
        record_id: randomInt(1, 5000), // Always generate record_id
        message: generateMessage(action, table),
        recorded_by: user.username,
        raw_data: JSON.stringify(rawData),
        created_at: logDate.toISOString(),
      });
    }
  }
  
  console.log(`[DUMMY] Generated ${logs.length} logs. Inserting into database...`);
  
  // Batch insert (1000 per batch untuk performa)
  const batchSize = 1000;
  let inserted = 0;
  
  for (let i = 0; i < logs.length; i += batchSize) {
    const batch = logs.slice(i, i + batchSize);
    
    const stmt = db.prepare(`
      INSERT INTO activity_logs (
        action_type, table_name, record_id, message, 
        recorded_by, raw_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((items: any[]) => {
      for (const item of items) {
        stmt.run(
          item.action_type,
          item.table_name,
          item.record_id,
          item.message,
          item.recorded_by,
          item.raw_data,
          item.created_at
        );
      }
    });
    
    insertMany(batch);
    inserted += batch.length;
    console.log(`[DUMMY] Inserted ${inserted}/${logs.length} logs...`);
  }
  
  console.log(`[DUMMY] ✓ Successfully inserted ${inserted} dummy activity logs for 1 year!`);
  
  // Stats
  const stats = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM activity_logs
    WHERE created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all(oneYearAgo.toISOString());
  
  console.log(`[DUMMY] Date range: ${stats[0]?.date} to ${stats[stats.length - 1]?.date}`);
  console.log(`[DUMMY] Total days with logs: ${stats.length}`);
  console.log(`[DUMMY] Average logs per day: ${Math.round(inserted / stats.length)}`);
}

generateDummyLogs().catch(console.error);
