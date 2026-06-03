import { createClient } from '@libsql/client';
import path from 'path';

async function analyze(dbName: string) {
  const dbUrl = `file:${path.join(process.cwd(), dbName)}`;
  const db = createClient({ url: dbUrl });

  console.log(`\n=== Analyzing ${dbName} ===`);
  try {
    // Get all user tables
    const tablesRes = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const tables = tablesRes.rows.map(r => String(r.name));

    const stats = [];
    for (const table of tables) {
      try {
        const countRes = await db.execute(`SELECT COUNT(*) as count FROM "${table}"`);
        const count = Number((countRes.rows[0] as any).count);
        stats.push({ table, count });
      } catch (e: any) {
        console.error(`Error counting ${table}:`, e.message);
      }
    }

    // Sort by count descending
    stats.sort((a, b) => b.count - a.count);

    stats.forEach(s => {
      console.log(`- ${s.table}: ${s.count.toLocaleString('id-ID')} rows`);
    });

  } catch (err: any) {
    console.error(`Failed to analyze ${dbName}:`, err.message);
  }
}

async function main() {
  await analyze('database.sqlite');
  await analyze('database_dev.sqlite');
}

main();
