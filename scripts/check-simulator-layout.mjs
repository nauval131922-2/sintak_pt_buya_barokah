/**
 * Cek konsistensi layout dual-scroll & kepatuhan UI standar Manasik pada Simulator.
 *
 * Manual: npm run check:simulator-layout
 *
 * Aturan: file *Simulator.tsx yang memakai pola tinggi tetap
 * h-[calc(100vh-140px)] WAJIB memuat 4 pola class baku persis
 * (lihat PANDUAN_AUDIT_EXCEL_SINTAK.md Tahap 5) serta mematuhi Clean UI.
 *
 * Exit 1 = ada file menyimpang.
 */
import fs from 'fs';
import path from 'path';

const DIR = 'src/app/pricelist';

const REQUIRED = [
  'flex flex-col flex-1 h-[calc(100vh-140px)] min-h-0 space-y-3 pb-2',
  'grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 min-h-0 pb-1',
  'lg:col-span-5 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4',
  'lg:col-span-7 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4',
];

// Dilarang keras card header gelap/hitam pekat di simulator
const FORBIDDEN_DARK_HEADER = [
  'from-slate-900',
  'bg-slate-900 text-white rounded',
];

// Dilarang keras header banner hijau raksasa (~100px) di atas simulator dual-scroll
const FORBIDDEN_GREEN_BANNER = [
  'bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4',
];

const TRIGGER = 'h-[calc(100vh-140px)]';
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('Simulator.tsx'));
let failed = 0;
let checked = 0;
let skipped = 0;

for (const f of files) {
  const content = fs.readFileSync(path.join(DIR, f), 'utf8');
  if (!content.includes(TRIGGER)) {
    skipped++;
    continue;
  }
  checked++;
  const missing = REQUIRED.filter((p) => !content.includes(p));
  const darkHeader = FORBIDDEN_DARK_HEADER.find((d) => content.includes(d));
  const greenBanner = FORBIDDEN_GREEN_BANNER.find((g) => content.includes(g));

  if (missing.length > 0) {
    failed++;
    console.error(`[FAIL] ${f} — pola baku dual-scroll tidak lengkap:`);
    for (const m of missing) console.error(`       hilang: "${m}"`);
  } else if (darkHeader) {
    failed++;
    console.error(`[FAIL] ${f} — terdeteksi box header gelap/hitam pekat ("${darkHeader}"): wajib memakai 3-kartu metrik ringkasan baku.`);
  } else if (greenBanner) {
    failed++;
    console.error(`[FAIL] ${f} — terdeteksi header banner hijau raksasa ("${greenBanner}"): hapus banner untuk Clean UI Tahap 5.`);
  } else {
    console.log(`[PASS] ${f}`);
  }
}

console.log(`\nChecked: ${checked}, Skipped (belum pakai pola): ${skipped}, Failed: ${failed}`);
if (failed > 0) {
  console.error('\nPerbaiki file di atas agar persis mematuhi standar Tahap 5 panduan.');
  process.exit(1);
}
console.log('Layout simulator OK.');
