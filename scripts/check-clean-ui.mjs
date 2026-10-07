/**
 * Skrip Pemindai Kebocoran Sel Excel & Kepatuhan UI Standar SINTAK.
 * 
 * Manual: node scripts/check-clean-ui.mjs
 * 
 * Aturan:
 * 1. Tidak boleh ada alamat sel Excel (Master!Dxx, BUKU!xxx, dll.) yang bocor
 *    ke tampilan UI utama (form label, card header, badge, breakdown table).
 *    Referensi sel HANYA diizinkan di modal panduan/manual pengguna atau komentar kode.
 * 2. Tidak boleh ada alamat sel Excel yang bocor di file backend (src/lib/*.ts)
 *    dalam string literal yang dikembalikan ke tabel breakdown UI.
 * 3. Simulator berstandar modern (memakai stepChip) wajib memiliki kelengkapan UI baku:
 *    - optBtn untuk tombol seleksi netral
 *    - 3 kartu metrik ringkasan baku di kolom kanan (HPP Per Pcs/Exp, Harga Per Pcs, Harga Total + Profit)
 *    - Tombol simpan kalkulasi standar full-width
 */
import fs from 'fs';
import path from 'path';

const APP_DIR = 'src/app/pricelist';
const LIB_DIR = 'src/lib';

const allAppFiles = fs.readdirSync(APP_DIR);
const simulatorFiles = allAppFiles.filter((f) => f.endsWith('Simulator.tsx'));
const masterParamFiles = allAppFiles.filter((f) => f.endsWith('MasterParameter.tsx'));
const targetAppFiles = [...simulatorFiles, ...masterParamFiles];

const allLibFiles = fs.readdirSync(LIB_DIR).filter((f) => f.endsWith('.ts'));

let totalCellLeaks = 0;
let totalContractFailures = 0;

// Regex untuk mendeteksi nama sel Excel (Master!D19, BUKU!AJ6, Sheet1!A1, dll)
const CELL_LEAK_REGEX = /\b(Master|BUKU|Sheet\d*)![A-Za-z0-9_:-]+/g;

// 1. Audit Kebocoran Sel Excel di UI (src/app/pricelist)
for (const file of targetAppFiles) {
  const filePath = path.join(APP_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let inModal = false;
  let inMultiComment = false;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Skip komentar
    if (trimmed.startsWith('//') || (trimmed.startsWith('/*') && trimmed.endsWith('*/'))) {
      return;
    }
    if (trimmed.startsWith('/*')) {
      inMultiComment = true;
      return;
    }
    if (inMultiComment) {
      if (trimmed.includes('*/')) inMultiComment = false;
      return;
    }

    // Deteksi blok modal panduan pengguna (di dalam modal diperbolehkan referensi sel)
    if (trimmed.includes('showManualModal &&') || trimmed.includes('showGuideModal &&') || trimmed.includes('showGuide &&')) {
      inModal = true;
    }
    if (inModal && (trimmed === ')}' || trimmed === ') : null}' || trimmed === ');' || (trimmed.startsWith('</div') && line.startsWith('      )}')))) {
      inModal = false;
    }

    // Jika di luar modal, cek apakah ada kebocoran sel Excel
    if (!inModal) {
      const matches = trimmed.match(CELL_LEAK_REGEX);
      if (matches) {
        const isInlineComment = trimmed.includes('//') && trimmed.indexOf('//') < trimmed.indexOf(matches[0]);
        if (!isInlineComment) {
          console.error(`[LEAK UI] ${file}:${lineNum} - Teks sel Excel di UI: "${matches.join(', ')}"`);
          console.error(`          ${trimmed}`);
          totalCellLeaks++;
        }
      }
    }
  });
}

// 2. Audit Kebocoran Sel Excel di Backend Return Strings (src/lib/*.ts)
for (const file of allLibFiles) {
  const filePath = path.join(LIB_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let inMultiComment = false;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    if (trimmed.startsWith('//') || (trimmed.startsWith('/*') && trimmed.endsWith('*/'))) return;
    if (trimmed.startsWith('/*')) {
      inMultiComment = true;
      return;
    }
    if (inMultiComment) {
      if (trimmed.includes('*/')) inMultiComment = false;
      return;
    }

    // Hapus inline comment
    const codePart = trimmed.split('//')[0].trim();
    if (!codePart) return;

    // Cek string literal yang mengandung Master! atau BUKU!
    const stringLiteralRegex = /(?:'|"`)[^'"`]*(?:Master|BUKU)![^'"`]*(?:'|"`)/g;
    const matches = codePart.match(stringLiteralRegex);
    if (matches) {
      console.error(`[LEAK LIB] ${file}:${lineNum} - String literal backend memuat referensi sel:`);
      console.error(`           ${matches.join(', ')}`);
      totalCellLeaks++;
    }
  });
}

// 3. Audit Kelengkapan Kontrak UI Simulator Menyeluruh (26 Modul Aktif)
const ACTIVE_SIMULATORS = [
  'ManasikSimulator.tsx',
  'YasinSimulator.tsx',
  'NotaSimulator.tsx',
  'BrosurSimulator.tsx',
  'LabelKhqSimulator.tsx',
  'BukuTulisSimulator.tsx',
  'StopmapSimulator.tsx',
  'SyahadahSimulator.tsx',
  'RaportKalebSimulator.tsx',
  'KopSuratSimulator.tsx',
  'AmplopSimulator.tsx',
  'SertifikatSimulator.tsx',
  'UndanganSimulator.tsx',
  'BukuTabunganNsSimulator.tsx',
  'BukuTabunganSecuritySimulator.tsx',
  'KartuKoperasiPromiseSimulator.tsx',
  'LebelKartuObatSimulator.tsx',
  'BukuSoftCoverUnifiedSimulator.tsx',
  'BukuHardCoverUnifiedSimulator.tsx',
  'PackagingSimulator.tsx',
  'PaperbagSimulator.tsx',
  'PosterSimulator.tsx',
  'MajalahSimulator.tsx',
  'StikerSimulator.tsx',
  'KalenderKopSimulator.tsx',
  'PricelistSimulator.tsx'
];

for (const file of ACTIVE_SIMULATORS) {
  const filePath = path.join(APP_DIR, file);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');

  // a. Dilarang banner hijau raksasa
  if (content.includes('bg-emerald-50/70 border border-emerald-200/80 rounded-2xl')) {
    console.error(`[CONTRACT FAIL] ${file} - Masih memuat banner hijau raksasa terlarang.`);
    totalContractFailures++;
  }

  // b. Kartu metrik wajib memuat "Harga Total"
  if (!content.includes('Harga Total')) {
    console.error(`[CONTRACT FAIL] ${file} - Kartu metrik tidak konsisten (wajib memuat "Harga Total").`);
    totalContractFailures++;
  }

  // c. Tfoot tabel breakdown wajib baku "Total HPP Biaya Produksi"
  if (!content.includes('Total HPP Biaya Produksi')) {
    console.error(`[CONTRACT FAIL] ${file} - Tfoot tabel breakdown tidak baku (wajib memuat "Total HPP Biaya Produksi").`);
    totalContractFailures++;
  }

  // d. Form header wajib bersih (tidak memuat tombol aksi di dalam wadah header form)
  const formHeaderMatch = content.match(/<div className="flex items-center (?:justify-between )?gap-2 border-b border-slate-100 pb-2(?:\.5)?">([\s\S]*?)<\/div>/);
  if (formHeaderMatch && formHeaderMatch[1].includes('<button')) {
    console.error(`[CONTRACT FAIL] ${file} - Header form memuat tombol aksi yang seharusnya dibersihkan.`);
    totalContractFailures++;
  }
}
console.log(`\n========================================`);
if (totalCellLeaks > 0 || totalContractFailures > 0) {
  console.error(`TOTAL PELANGGARAN: ${totalCellLeaks} kebocoran sel Excel, ${totalContractFailures} pelanggaran kontrak UI!`);
  console.error(`Pindahkan referensi sel ke modal panduan dan selaraskan kontrak.`);
  process.exit(1);
} else {
  console.log(`SEMUA BERSIH: 0 kebocoran sel Excel di UI & backend, dan seluruh kontrak UI terpenuhi.`);
  console.log(`========================================\n`);
}
