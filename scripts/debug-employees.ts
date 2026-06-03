import db from '../src/lib/db';

async function main() {
  console.log("=== Checking Employees vs Jurnal Karyawan ===");

  const r1 = await db.execute("SELECT DISTINCT bagian FROM jurnal_harian_produksi WHERE deleted_at IS NULL");
  console.log("Distinct 'bagian' in jurnal_harian_produksi:", r1.rows.map(r => r.bagian));

  const r2 = await db.execute("SELECT DISTINCT department FROM employees WHERE is_active = 1");
  console.log("Distinct 'department' in active employees:", r2.rows.map(r => r.department));

  const r3 = await db.execute("SELECT COUNT(DISTINCT nama_karyawan) as count FROM jurnal_harian_produksi WHERE deleted_at IS NULL");
  console.log("Total distinct employees in JHP:", r3.rows[0].count);

  const r4 = await db.execute("SELECT COUNT(*) as count FROM employees WHERE is_active = 1");
  console.log("Total active employees in employees table:", r4.rows[0].count);

  // Let's see if there are any employees in JHP that are not in employees table
  const r5 = await db.execute(`
    SELECT DISTINCT nama_karyawan 
    FROM jurnal_harian_produksi 
    WHERE deleted_at IS NULL 
      AND nama_karyawan NOT IN (SELECT name FROM employees)
    LIMIT 20
  `);
  console.log("Some employees in JHP not in employees table:", r5.rows.map(r => r.nama_karyawan));
}

main().catch(console.error);
