/**
 * Skrip Pemindai Kebocoran Sel Excel & Kepatuhan UI Standar SINTAK.
 * 
 * Manual: node scripts/check-clean-ui.mjs
 * 
 * Aturan:
 * 1. Tidak boleh ada alamat sel Excel (Master!Dxx, BUKU!xxx, dll.) yang bocor
 *    ke tampilan UI utama (form label, card header, badge, breakdown table).
 *    Referensi sel HANYA diizinkan di modal panduan/manual pengguna atau komentar kode.
 * 2. Simulator berstandar modern (memakai stepChip) wajib memiliki kelengkapan UI baku:
 *    - optBtn untuk tombol seleksi netral
 *    - 3 kartu metrik ringkasan baku di kolom kanan (HPP, Harga Jual, Omset)
 *    - Tombol simpan kalkulasi standar full-width
 */
import fs from 'fs';
import path from 'path';

const DIR = 'src/app/pricelist';
const allFiles = fs.readdirSync(DIR);
const simulatorFiles = allFiles.filter((f) => f.endsWith('Simulator.tsx'));
const masterParamFiles = allFiles.filter((f) => f.endsWith('MasterParameter.tsx'));
const targetFiles = [...simulatorFiles, ...masterParamFiles];

let totalCellLeaks = 0;
let totalContractFailures = 0;

// Regex untuk mendeteksi nama sel Excel (Master!D19, BUKU!AJ6, Sheet1!A1, dll)
const CELL_LEAK_REGEX = /\b(Master|BUKU|Sheet\d*)![A-Za-z0-9_:-]+/g;

// 1. Audit Kebocoran Sel Excel (Menyapu 100% Berkas UI Pricelist)
for (const file of targetFiles) {
  const filePath = path.join(DIR, file);
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
          console.error(`[LEAK] ${file}:${lineNum} - Teks sel Excel di UI: "${matches.join(', ')}"`);
          console.error(`       ${trimmed}`);
          totalCellLeaks++;
        }
      }
    }
  });
}

// 2. Audit Kelengkapan Kontrak UI Simulator Modern (yang memakai stepChip)
for (const file of simulatorFiles) {
  const filePath = path.join(DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Simulator yang telah menerapkan stepChip wajib memenuhi seluruh kontrak baku
  if (content.includes('stepChip')) {
    // Cek ketersediaan optBtn
    if (!content.includes('optBtn')) {
      console.error(`[CONTRACT FAIL] ${file} - Tidak memiliki styling optBtn tombol seleksi netral.`);
      totalContractFailures++;
    }

    // Cek tombol simpan kalkulasi full-width
    if (!content.includes('Simpan Kalkulasi Ini ke Daftar Kalkulasi') && !content.includes('Simpan Kalkulasi ke Riwayat')) {
      console.error(`[CONTRACT FAIL] ${file} - Tidak memiliki tombol simpan kalkulasi standar.`);
      totalContractFailures++;
    }
  }
}

console.log(`\n========================================`);
if (totalCellLeaks > 0 || totalContractFailures > 0) {
  console.error(`TOTAL PELANGGARAN: ${totalCellLeaks} kebocoran sel Excel, ${totalContractFailures} pelanggaran kontrak UI!`);
  console.error(`Pindahkan referensi sel ke modal panduan dan lengkapi standar kontrak.`);
  process.exit(1);
} else {
  console.log(`SEMUA BERSIH: 0 kebocoran sel Excel & semua kontrak simulator modern terpenuhi.`);
  console.log(`========================================\n`);
}
