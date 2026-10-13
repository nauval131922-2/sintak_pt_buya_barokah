import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const isAuto = process.argv.includes('--auto');
const NEXT_THRESHOLD_MB = 500;
const WAL_THRESHOLD_MB = 20;

function isDirLargerThan(dir, maxBytes, state = { current: 0 }) {
  if (!fs.existsSync(dir)) return false;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (isDirLargerThan(full, maxBytes, state)) return true;
      } else if (entry.isFile()) {
        state.current += fs.statSync(full).size;
        if (state.current > maxBytes) return true;
      }
    }
  } catch {}
  return state.current > maxBytes;
}

function getWalSizeMb(file) {
  const walPath = path.join(process.cwd(), `${file}-wal`);
  try {
    return fs.existsSync(walPath) ? fs.statSync(walPath).size / (1024 * 1024) : 0;
  } catch {
    return 0;
  }
}

const nextDir = path.join(process.cwd(), '.next');
const dbFiles = ['database_dev.sqlite', 'database.sqlite'];

// Cek apakah threshold terpenuhi
const nextExceeds = isDirLargerThan(nextDir, NEXT_THRESHOLD_MB * 1024 * 1024);
const maxWalMb = Math.max(...dbFiles.map(getWalSizeMb));
const walExceeds = maxWalMb > WAL_THRESHOLD_MB;

if (isAuto && !nextExceeds && !walExceeds) {
  console.log('⚡ [SINTAK predev] Cache `.next` & WAL SQLite masih dalam batas optimal (< 500 MB). Menyalakan dev server...');
  process.exit(0);
}

if (isAuto) {
  const reasons = [];
  if (nextExceeds) reasons.push(`cache .next > ${NEXT_THRESHOLD_MB} MB`);
  if (walExceeds) reasons.push(`WAL SQLite > ${WAL_THRESHOLD_MB} MB`);
  console.log(`🧹 [SINTAK predev] Pembersihan otomatis dipicu (${reasons.join(', ')})...`);
} else {
  console.log('🧹 [SINTAK] Memulai pembersihan penuh cache dev & WAL SQLite...');
}

// 1. Bersihkan folder cache .next jika melebihi threshold atau manual force
if (!isAuto || nextExceeds) {
  if (fs.existsSync(nextDir)) {
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log('✅ Cache `.next` berhasil dibersihkan.');
    } catch (err) {
      console.warn('⚠️ Gagal menghapus sebagian file di `.next` (mungkin file sedang terkunci):', err.message);
    }
  }
}

// 2. Checkpoint WAL SQLite
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

console.log('✨ [SINTAK] Selesai. Dev server siap dijalankan dengan ringan.\n');
