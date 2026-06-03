import db from '../src/lib/db';

async function main() {
  console.log("=== Testing Options Query Performance with New Indexes ===");

  const opt1 = `SELECT DISTINCT bagian 
              FROM jurnal_harian_produksi 
              WHERE bagian IS NOT NULL AND bagian != ''
                AND deleted_at IS NULL
              ORDER BY bagian ASC 
              LIMIT 50`;
  const opt2 = `SELECT DISTINCT nama_karyawan, bagian 
              FROM jurnal_harian_produksi 
              WHERE nama_karyawan IS NOT NULL AND nama_karyawan != ''
                AND (nama_karyawan NOT LIKE '-%' AND bagian NOT LIKE '-%')
                AND deleted_at IS NULL
              ORDER BY nama_karyawan ASC 
              LIMIT 500`;
  const opt3 = `SELECT DISTINCT substr(tgl, 1, 4) as year 
              FROM jurnal_harian_produksi 
              WHERE tgl IS NOT NULL AND tgl != '' AND deleted_at IS NULL
              ORDER BY year DESC`;

  console.log("\n--- Before new indexes ---");
  const tOpt1_b = Date.now();
  await db.execute(opt1);
  console.log(`opt1 took: ${Date.now() - tOpt1_b}ms`);

  const tOpt2_b = Date.now();
  await db.execute(opt2);
  console.log(`opt2 took: ${Date.now() - tOpt2_b}ms`);

  const tOpt3_b = Date.now();
  await db.execute(opt3);
  console.log(`opt3 took: ${Date.now() - tOpt3_b}ms`);

  console.log("\n--- Creating new indexes ---");
  const create1 = "CREATE INDEX IF NOT EXISTS idx_jurnal_karyawan_bagian ON jurnal_harian_produksi(nama_karyawan, bagian);";
  const create2 = "CREATE INDEX IF NOT EXISTS idx_jurnal_bagian ON jurnal_harian_produksi(bagian);";

  const tC = Date.now();
  await db.execute(create1);
  await db.execute(create2);
  console.log(`Creating indexes took: ${Date.now() - tC}ms`);

  console.log("\n--- After new indexes ---");
  const tOpt1_a = Date.now();
  await db.execute(opt1);
  console.log(`opt1 took: ${Date.now() - tOpt1_a}ms`);

  const tOpt2_a = Date.now();
  await db.execute(opt2);
  console.log(`opt2 took: ${Date.now() - tOpt2_a}ms`);

  const tOpt3_a = Date.now();
  await db.execute(opt3);
  console.log(`opt3 took: ${Date.now() - tOpt3_a}ms`);
}

main().catch(console.error);
