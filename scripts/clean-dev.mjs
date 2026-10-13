import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

console.log('🧹 [SINTAK] Memulai pembersihan cache dan database dev...\n');

// 1. Bersihkan folder cache .next
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('✅ Cache `.next` (1.9 GB) berhasil dihapus.');
  } catch (err) {
    console.warn('⚠️ Gagal menghapus sebagian file di `.next` (mungkin dev server masih aktif):', err.message);
  }
} else {
  console.log('ℹ️ Folder `.next` sudah bersih.');
}

// 2. Checkpoint WAL SQLite (database_dev.sqlite & database.sqlite)
const dbFiles = ['database_dev.sqlite', 'database.sqlite'];
for (const file of dbFiles) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) continue;

  try {
    const db = new Database(fullPath);
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.close();
    console.log(`✅ WAL SQLite checkpoint berhasil: ${file}`);
  } catch (err) {
    console.warn(`⚠️ Gagal checkpoint WAL untuk ${file}:`, err.message);
  }
}

console.log('\n✨ Selesai! Dev server kini siap dijalankan kembali dengan ringan via `npm run dev`.\n');
