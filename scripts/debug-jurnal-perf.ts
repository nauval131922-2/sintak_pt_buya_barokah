import db from '../src/lib/db';

async function main() {
  console.log("=== Debugging JHP GET Performance ===");

  const SELECT_COLS = `id, posisi, absensi, tgl, shift, nama_karyawan, no_order, nama_order,
    jenis_pekerjaan, keterangan, target, realisasi, no_order_2, nama_order_2,
    jenis_pekerjaan_2, bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala, bagian, is_manual_input`;

  const whereClause = 'WHERE deleted_at IS NULL';
  const args = [50, 0];

  const sqlData = `SELECT ${SELECT_COLS} FROM jurnal_harian_produksi ${whereClause} 
    ORDER BY 
      tgl ASC, 
      CASE UPPER(bagian)
        WHEN 'SETTING' THEN 1
        WHEN 'QUALITY CONTROL' THEN 2
        WHEN 'CETAK' THEN 3
        WHEN 'FINISHING' THEN 4
        WHEN 'GUDANG' THEN 5
        WHEN 'TEKNISI' THEN 6
        WHEN 'MESIN' THEN 7
        ELSE 8
      END ASC,
      CASE WHEN jenis_pekerjaan LIKE '%Koordinasi%' THEN 0 ELSE 1 END ASC,
      absensi ASC, 
      id ASC 
    LIMIT ? OFFSET ?`;

  const sqlTotal = `SELECT COUNT(*) as count FROM jurnal_harian_produksi WHERE deleted_at IS NULL`;

  const sqlLastUpdated = `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated 
        FROM activity_logs 
        WHERE table_name = 'jurnal_harian_produksi' AND action_type = 'UPLOAD'`;

  console.log("1. Measuring batch query of route.ts GET...");
  const t0 = Date.now();
  const batchRes = await db.batch([
    { sql: sqlData, args },
    { sql: sqlTotal, args: [] },
    { sql: sqlLastUpdated, args: [] }
  ], "read");
  console.log(`Batch query completed in ${Date.now() - t0}ms`);

  // Individually measure
  console.log("\n2. Measuring queries individually...");

  const t1 = Date.now();
  await db.execute({ sql: sqlData, args });
  console.log(`sqlData took: ${Date.now() - t1}ms`);

  const t2 = Date.now();
  await db.execute({ sql: sqlTotal, args: [] });
  console.log(`sqlTotal took: ${Date.now() - t2}ms`);

  const t3 = Date.now();
  await db.execute({ sql: sqlLastUpdated, args: [] });
  console.log(`sqlLastUpdated took: ${Date.now() - t3}ms`);

  // Options query
  console.log("\n3. Measuring options query...");
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

  const tOptBatch = Date.now();
  await db.batch([
    { sql: opt1, args: [] },
    { sql: opt2, args: [] },
    { sql: opt3, args: [] }
  ], "read");
  console.log(`Options batch took: ${Date.now() - tOptBatch}ms`);

  const tOpt1 = Date.now();
  await db.execute(opt1);
  console.log(`opt1 took: ${Date.now() - tOpt1}ms`);

  const tOpt2 = Date.now();
  await db.execute(opt2);
  console.log(`opt2 took: ${Date.now() - tOpt2}ms`);

  const tOpt3 = Date.now();
  await db.execute(opt3);
  console.log(`opt3 took: ${Date.now() - tOpt3}ms`);
}

main().catch(console.error);
