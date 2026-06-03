import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';

const DAYS_TO_KEEP = 7;

function getFileSizeInMB(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  const stats = fs.statSync(filePath);
  return stats.size / (1024 * 1024);
}

async function cleanupDatabase(dbName: string) {
  const dbPath = path.join(process.cwd(), dbName);
  if (!fs.existsSync(dbPath)) {
    console.log(`[${dbName}] File tidak ditemukan, dilewati.`);
    return;
  }

  const initialSize = getFileSizeInMB(dbPath);
  console.log(`\n=============================================`);
  console.log(`[${dbName}] Memulai pembersihan...`);
  console.log(`[${dbName}] Ukuran awal: ${initialSize.toFixed(2)} MB (${(initialSize / 1024).toFixed(2)} GB)`);

  const dbUrl = `file:${dbPath}`;
  const db = createClient({ url: dbUrl });

  try {
    // 1. Hitung jumlah log sebelum dihapus
    const countBeforeRes = await db.execute(`SELECT COUNT(*) as count FROM activity_logs`);
    const countBefore = Number((countBeforeRes.rows[0] as any).count);
    console.log(`[${dbName}] Jumlah activity_logs saat ini: ${countBefore.toLocaleString('id-ID')} baris`);

    // 2. Hapus log yang lebih tua dari 7 hari
    console.log(`[${dbName}] Menghapus log yang lebih tua dari ${DAYS_TO_KEEP} hari...`);
    const deleteRes = await db.execute({
      sql: `DELETE FROM activity_logs WHERE created_at < date('now', ?)`,
      args: [`-${DAYS_TO_KEEP} days`]
    });
    
    const countAfterRes = await db.execute(`SELECT COUNT(*) as count FROM activity_logs`);
    const countAfter = Number((countAfterRes.rows[0] as any).count);
    const deletedCount = countBefore - countAfter;

    console.log(`[${dbName}] Berhasil menghapus: ${deletedCount.toLocaleString('id-ID')} baris`);
    console.log(`[${dbName}] Sisa activity_logs: ${countAfter.toLocaleString('id-ID')} baris`);

    // 3. Jalankan VACUUM untuk mengecilkan file di disk
    console.log(`[${dbName}] Menjalankan VACUUM... (Proses ini memakan waktu beberapa menit, mohon tunggu)`);
    const startTime = Date.now();
    await db.execute(`VACUUM`);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[${dbName}] VACUUM selesai dalam ${duration} detik.`);

    // 4. Hitung ukuran akhir
    const finalSize = getFileSizeInMB(dbPath);
    const savedSize = initialSize - finalSize;
    console.log(`[${dbName}] Ukuran akhir: ${finalSize.toFixed(2)} MB (${(finalSize / 1024).toFixed(2)} GB)`);
    console.log(`[${dbName}] Menghemat ruang disk: ${savedSize.toFixed(2)} MB`);

  } catch (error: any) {
    console.error(`[${dbName}] Terjadi kesalahan:`, error.message);
  } finally {
    db.close();
  }
}

async function main() {
  console.log(`=== SINTAK DATABASE CLEANUP & VACUUM TOOL ===`);
  console.log(`Menyimpan log untuk ${DAYS_TO_KEEP} hari terakhir.`);
  
  await cleanupDatabase('database_dev.sqlite');
  await cleanupDatabase('database.sqlite');
  
  console.log(`\n=============================================`);
  console.log(`Semua proses pembersihan selesai.`);
}

main().catch(err => {
  console.error("Terjadi kesalahan utama:", err);
});
