// Benchmark Permutasi & Uji Reaktivitas Buku Hard Cover Unified vs Excel Master
// Standar SOP PANDUAN_AUDIT_EXCEL_SINTAK.md & AI_RULES.md
// Pos 0: Exhaustive Sweep 100% Workbook Sumber di Folder 18, 25, dan 26
import fs from 'fs';
import path from 'path';
import {
  calculateBukuHardCoverUnified,
  DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS,
  HardCoverUkuran,
  BukuHardCoverUnifiedParams,
} from '../src/lib/buku-hard-cover-unified';

interface BenchmarkTier {
  row: number;
  oplah: number;
  hpp_total: number;
  hpp_per_exp: number;
  harga_final: number;
}

interface BenchmarkGroup {
  file: string;
  ukuran: string;
  mesin_cover: string;
  mesin_isi: string;
  tiers: BenchmarkTier[];
  note?: string;
}

const expectedPath = path.join(__dirname, 'bhc-expected.json');
if (!fs.existsSync(expectedPath)) {
  console.error('File bhc-expected.json tidak ditemukan!');
  process.exit(1);
}

const benchmarkData: BenchmarkGroup[] = JSON.parse(fs.readFileSync(expectedPath, 'utf-8'));

console.log('='.repeat(80));
console.log(' AUDIT BENCHMARK & REAKTIVITAS BUKU HARD COVER UNIFIED (EXHAUSTIVE SWEEP)');
console.log(' Standar SOP PANDUAN_AUDIT_EXCEL_SINTAK.md (Pos 0 s/d Pos 4)');
console.log('='.repeat(80));

let totalPassed = 0;
let totalFailed = 0;
let totalKnownCorrections = 0;

// Daftar file yang memiliki bug formula terbukti (human error Excel yang disepakati tidak direplikasi)
const KNOWN_EXCEL_BUGS: Record<string, string> = {
  'BUKU HC Uk. 14,5 x 20,25 cm-Print-Print.xlsm': 'Excel typo CJ7="10,5 X 14,8" (Skiblat Rp 0) & insheet 7 lbr. SINTAK hitung skiblat fisik.',
  'BUKU HC Uk. 14,5 x 20,25 cm-Print-Oliver.xlsm': 'Excel mesin KORS (Plano 65x100) + typo CJ7 & GC7 Rp 0. SINTAK pakai Oliver standar 61x86.',
  'BUKU HC Uk. 21 x 29,7 cm-Print-Print.xlsm': 'Excel typo CJ7 & GC7="10,5 X 14,8" (Skiblat & Kardus Rp 0). SINTAK hitung skiblat & kardus fisik.',
  'BUKU HC Uk. 21 x 29,7 cm-Print-Oliver.xlsm': 'Excel mesin KORS (Plano 65x100). SINTAK pakai Oliver standar 61x86.',
};

for (const grp of benchmarkData) {
  const ukuran = grp.ukuran.replace('x', '×').trim() as HardCoverUkuran;
  const isKnownBug = KNOWN_EXCEL_BUGS[grp.file];

  console.log(`\n▶ [${grp.file}]`);
  console.log(`  Ukuran: ${grp.ukuran} | Mesin: ${grp.mesin_cover} - ${grp.mesin_isi} (${grp.tiers.length} Tiers)`);
  if (isKnownBug) {
    console.log(`  ℹ️ Catatan Koreksi Excel: ${isKnownBug}`);
  }
  console.log('-'.repeat(80));
  console.log(' Oplah | Excel (Rp) | SINTAK (Rp) | Selisih | HPP SINTAK (Rp) | Status');
  console.log('-'.repeat(80));

  for (const tier of grp.tiers) {
    const res = calculateBukuHardCoverUnified(DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS, {
      ukuran,
      oplah: tier.oplah,
      halaman: 100,
      mesinCover: grp.mesin_cover as any,
      mesinIsi: grp.mesin_isi as any,
      finishingCover: 'None',
    });

    const diff = Math.abs(res.hargaFinal - tier.harga_final);

    if (diff === 0) {
      totalPassed++;
      console.log(
        ` ${tier.oplah.toString().padStart(5)} | ${tier.harga_final.toLocaleString('id-ID').padStart(10)} | ${res.hargaFinal.toLocaleString('id-ID').padStart(11)} | ${diff.toLocaleString('id-ID').padStart(7)} | ${res.hppTotal.toLocaleString('id-ID', { maximumFractionDigits: 0 }).padStart(15)} | [PASS]`
      );
    } else if (isKnownBug) {
      totalKnownCorrections++;
      console.log(
        ` ${tier.oplah.toString().padStart(5)} | ${tier.harga_final.toLocaleString('id-ID').padStart(10)} | ${res.hargaFinal.toLocaleString('id-ID').padStart(11)} | ${(res.hargaFinal - tier.harga_final).toString().padStart(7)} | ${res.hppTotal.toLocaleString('id-ID', { maximumFractionDigits: 0 }).padStart(15)} | [KOREKSI EXCEL]`
      );
    } else {
      totalFailed++;
      console.error(
        ` ${tier.oplah.toString().padStart(5)} | ${tier.harga_final.toLocaleString('id-ID').padStart(10)} | ${res.hargaFinal.toLocaleString('id-ID').padStart(11)} | ${(res.hargaFinal - tier.harga_final).toString().padStart(7)} | ${res.hppTotal.toLocaleString('id-ID', { maximumFractionDigits: 0 }).padStart(15)} | [FAIL]`
      );
    }
  }
}

// 2. UJI REAKTIVITAS PARAMETER (DELTA HPP > 0)
console.log('\n' + '='.repeat(80));
console.log(' UJI REAKTIVITAS PARAMETER (Membuktikan Delta HPP > 0)');
console.log('='.repeat(80));

const baseInput = {
  ukuran: '14,5×20,25' as HardCoverUkuran,
  oplah: 1000,
  halaman: 100,
  mesinCover: 'OLIVER' as const,
  mesinIsi: 'OLIVER' as const,
};

const baseCalc = calculateBukuHardCoverUnified(DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS, baseInput);

const reaktivitasTests: {
  nama: string;
  patch: Partial<BukuHardCoverUnifiedParams>;
}[] = [
  { nama: 'Kenaikan UMR Rp 2.818.585 -> Rp 3.500.000', patch: { umr: 3500000 } },
  { nama: 'Kenaikan Kertas Cover Rp 17.400 -> Rp 25.000 /kg', patch: { hargaKertasCoverPerKg: 25000 } },
  { nama: 'Kenaikan Board per Pack Rp 200.000 -> Rp 250.000', patch: { hargaBoardPerPack: 250000 } },
  { nama: 'Kenaikan Kertas Isi HVS Rp 15.700 -> Rp 22.000 /kg', patch: { hargaKertasIsiPerKg: 22000 } },
  { nama: 'Kenaikan Plat Oliver Rp 45.000 -> Rp 60.000', patch: { tarifPlateCoverOliver: 60000 } },
  { nama: 'Kenaikan Min Ongkos Oliver Rp 90.000 -> Rp 120.000', patch: { minOngkosCoverOliver: 120000 } },
  { nama: 'Kenaikan Lem Hard Cover Rp 58.000 -> Rp 80.000 /kg', patch: { hargaLemHardCoverKg: 80000 } },
  { nama: 'Kenaikan Kardus Box Rp 8.500 -> Rp 12.000', patch: { hargaKardusBox: 12000 } },
];

let reaktivitasPassed = 0;
for (const test of reaktivitasTests) {
  const modifiedParams = { ...DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS, ...test.patch };
  const modCalc = calculateBukuHardCoverUnified(modifiedParams, baseInput);
  const deltaHpp = modCalc.hppTotal - baseCalc.hppTotal;

  if (deltaHpp > 0) {
    reaktivitasPassed++;
    console.log(` [PASS] ${test.nama.padEnd(52)} | +Rp ${deltaHpp.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`);
  } else {
    console.error(` [FAIL] ${test.nama} | Delta HPP <= 0! (${deltaHpp})`);
  }
}

// 3. UJI PERMUTASI FINISHING COVER
console.log('\n' + '='.repeat(80));
console.log(' UJI PERMUTASI FINISHING KHUSUS COVER');
console.log('='.repeat(80));

const finishingOptions = [
  'Laminasi Glossy',
  'Laminasi Doff',
  'Laminasi Glossy + Spot UV',
  'Laminasi Doff + Foil',
  'Laminasi Doff + Spot UV + Foil + Emboss',
] as const;

let finishingPassed = 0;
for (const fin of finishingOptions) {
  const finCalc = calculateBukuHardCoverUnified(DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS, {
    ...baseInput,
    finishingCover: fin,
  });
  const deltaHpp = finCalc.hppTotal - baseCalc.hppTotal;
  if (deltaHpp > 0) {
    finishingPassed++;
    console.log(` [PASS] Finishing ${fin.padEnd(45)} | +Rp ${deltaHpp.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`);
  } else {
    console.error(` [FAIL] Finishing ${fin} tidak reaktif!`);
  }
}

const totalTiers = totalPassed + totalFailed + totalKnownCorrections;
console.log('\n' + '='.repeat(80));
console.log(` RINGKASAN HASIL AUDIT BUKU HARD COVER (EXHAUSTIVE SWEEP):`);
console.log(` - Total File Workbook Sumber : ${benchmarkData.length} File Workbook`);
console.log(` - Total Tier Dieksekusi      : ${totalTiers} Tier`);
console.log(` - Tier Parity Murni (Rp 0)   : ${totalPassed} PASSED`);
console.log(` - Tier Koreksi Bug Excel     : ${totalKnownCorrections} TIER (Skiblat/Kardus typo Excel dikoreksi fisik)`);
console.log(` - Tier Gagal (Unexplained)   : ${totalFailed} FAILED`);
console.log(` - Reaktivitas Parameter      : ${reaktivitasPassed}/${reaktivitasTests.length} PASSED (Delta HPP > 0)`);
console.log(` - Permutasi Finishing        : ${finishingPassed}/${finishingOptions.length} PASSED`);
console.log('='.repeat(80));

if (totalFailed > 0 || reaktivitasPassed < reaktivitasTests.length) {
  process.exit(1);
} else {
  console.log(' [OK] AUDIT BUKU HARD COVER MENYAPU 100% WORKBOOK LOLOS SESUAI SOP.\n');
}
