// Benchmark Permutasi & Uji Reaktivitas Buku Soft Cover Unified vs Excel Master
// Standar SOP PANDUAN_AUDIT_EXCEL_SINTAK.md & AI_RULES.md
// Pos 0: Exhaustive Sweep 100% Workbook Sumber di Folder 17, 18, 19, 21, dan 24 (18 File, 124 Tier)
import fs from 'fs';
import path from 'path';
import {
  calculateSoftCoverUnified,
  DEFAULT_SOFT_COVER_UNIFIED,
  SoftCoverLini,
  SoftCoverFinishing,
  SoftCoverUnifiedParams,
} from '../src/lib/buku-soft-cover-unified';

interface WorkbookDef {
  folder: string;
  file: string;
  ukuran: string;
  lini: SoftCoverLini;
  mesinCover: string;
  mesinIsi: string;
  finishing: SoftCoverFinishing;
  cacheSource: 'bsc' | 'bsc2' | 'bsc3' | 'bsc4';
  cacheKey?: string;
}

const WORKBOOKS: WorkbookDef[] = [
  // Folder 17: Klasik
  {
    folder: '17. Pricelist Buku Soft Cover',
    file: 'Pricelist Buku Soft Cover 21 x 29,7.xlsm',
    ukuran: '21 × 29,7',
    lini: 'Klasik',
    mesinCover: 'Print Inter',
    mesinIsi: 'Oliver',
    finishing: 'Laminasi Glossy,',
    cacheSource: 'bsc',
  },
  // Folder 17: 21 x 29,7 cm
  {
    folder: '17. Pricelist Buku Soft Cover - 21 x 29,7 cm',
    file: 'BUKU UK. 21 x 29,7 - Cover Oliver - Isi Oliver.xlsm',
    ukuran: '21 × 29,7',
    lini: 'Oliver-Oliver',
    mesinCover: 'Oliver',
    mesinIsi: 'Oliver',
    finishing: 'None,',
    cacheSource: 'bsc2',
    cacheKey: 'Oliver-Oliver',
  },
  {
    folder: '17. Pricelist Buku Soft Cover - 21 x 29,7 cm',
    file: 'BUKU UK. 21 x 29,7 - Cover Print - Isi Oliver.xlsm',
    ukuran: '21 × 29,7',
    lini: 'Print-Oliver',
    mesinCover: 'Print Inter',
    mesinIsi: 'Oliver',
    finishing: 'None,',
    cacheSource: 'bsc2',
    cacheKey: 'Print-Oliver',
  },
  {
    folder: '17. Pricelist Buku Soft Cover - 21 x 29,7 cm',
    file: 'BUKU UK. 21 x 29,7 - Cover Print - Isi Print.xlsm',
    ukuran: '21 × 29,7',
    lini: 'Print-Print',
    mesinCover: 'Print Inter',
    mesinIsi: 'Print Buya',
    finishing: 'None,',
    cacheSource: 'bsc2',
    cacheKey: 'Print-Print',
  },
  // Folder 18: 14,5 x 20,25 cm
  {
    folder: '18. Pricelist Buku Soft Cover - 14,5 x 20,25 cm',
    file: 'BUKU UK. 14,5 x 20,25 - Cover Oliver - Isi Oliver.xlsm',
    ukuran: '14,5 × 20,25',
    lini: 'OO-14',
    mesinCover: 'Oliver',
    mesinIsi: 'Oliver',
    finishing: 'None,',
    cacheSource: 'bsc3',
    cacheKey: 'OO-14',
  },
  {
    folder: '18. Pricelist Buku Soft Cover - 14,5 x 20,25 cm',
    file: 'BUKU UK. 14,5 x 20,25 - Cover Oliver - Isi Ryobi.xlsm',
    ukuran: '14,5 × 20,25',
    lini: 'OR-14',
    mesinCover: 'Oliver',
    mesinIsi: 'Ryobi',
    finishing: 'None,',
    cacheSource: 'bsc3',
    cacheKey: 'OR-14',
  },
  {
    folder: '18. Pricelist Buku Soft Cover - 14,5 x 20,25 cm',
    file: 'BUKU UK. 14,5 x 20,25 - Cover Print - Isi Print.xlsm',
    ukuran: '14,5 × 20,25',
    lini: 'PP-14',
    mesinCover: 'Print Inter',
    mesinIsi: 'Print Buya',
    finishing: 'None,',
    cacheSource: 'bsc3',
    cacheKey: 'PP-14',
  },
  {
    folder: '18. Pricelist Buku Soft Cover - 14,5 x 20,25 cm',
    file: 'BUKU UK. 14,5 x 20,25 - Cover Print - Isi Ryobi.xlsm',
    ukuran: '14,5 × 20,25',
    lini: 'PR-14',
    mesinCover: 'Print Inter',
    mesinIsi: 'Ryobi',
    finishing: 'None,',
    cacheSource: 'bsc3',
    cacheKey: 'PR-14',
  },
  // Folder 19: 14,5 x 20,25 cm
  {
    folder: '19. Pricelist Buku Soft Cover - 14,5 x 20,25 cm',
    file: 'BUKU UK. 14,5 x 20,25 - Cover Print - Isi Print.xlsm',
    ukuran: '14,5 × 20,25',
    lini: 'custom-pp145-19',
    mesinCover: 'Print Inter',
    mesinIsi: 'Print Buya',
    finishing: 'None,',
    cacheSource: 'bsc4',
    cacheKey: 'custom-pp145-19',
  },
  {
    folder: '19. Pricelist Buku Soft Cover - 14,5 x 20,25 cm',
    file: 'BUKU UK. 14,5 x 20,25 - Cover Print - Isi Ryobi.xlsm',
    ukuran: '14,5 × 20,25',
    lini: 'custom-pr145-19',
    mesinCover: 'Print Inter',
    mesinIsi: 'Ryobi',
    finishing: 'None,',
    cacheSource: 'bsc4',
    cacheKey: 'custom-pr145-19',
  },
  // Folder 21: 14,5 x 20,25 cm
  {
    folder: '21. Pricelist Buku Soft Cover - 14,5 x 20,25 cm',
    file: 'BUKU UK. 14,5 x 20,25 - Cover Oliver - Isi Oliver.xlsm',
    ukuran: '14,5 × 20,25',
    lini: 'custom-oo145-21',
    mesinCover: 'Oliver',
    mesinIsi: 'Oliver',
    finishing: 'None,',
    cacheSource: 'bsc4',
    cacheKey: 'custom-oo145-21',
  },
  {
    folder: '21. Pricelist Buku Soft Cover - 14,5 x 20,25 cm',
    file: 'BUKU UK. 14,5 x 20,25 - Cover Oliver - Isi Ryobi.xlsm',
    ukuran: '14,5 × 20,25',
    lini: 'custom-or145-21',
    mesinCover: 'Oliver',
    mesinIsi: 'Ryobi',
    finishing: 'None,',
    cacheSource: 'bsc4',
    cacheKey: 'custom-or145-21',
  },
  {
    folder: '21. Pricelist Buku Soft Cover - 14,5 x 20,25 cm',
    file: 'BUKU UK. 14,5 x 20,25 - Cover Print - Isi Print.xlsm',
    ukuran: '14,5 × 20,25',
    lini: 'custom-pp145-21',
    mesinCover: 'Print Inter',
    mesinIsi: 'Print Buya',
    finishing: 'None,',
    cacheSource: 'bsc4',
    cacheKey: 'custom-pp145-21',
  },
  {
    folder: '21. Pricelist Buku Soft Cover - 14,5 x 20,25 cm',
    file: 'BUKU UK. 14,5 x 20,25 - Cover Print - Isi Ryobi.xlsm',
    ukuran: '14,5 × 20,25',
    lini: 'custom-pr145-21',
    mesinCover: 'Print Inter',
    mesinIsi: 'Ryobi',
    finishing: 'None,',
    cacheSource: 'bsc4',
    cacheKey: 'custom-pr145-21',
  },
  // Folder 24: 10,5 x 14,8 cm
  {
    folder: '24. Pricelist Buku Soft Cover - 10,5 x 14,8 cm',
    file: 'BUKU UK. 10,5 X 14,8 - Cover Oliver - Isi Oliver.xlsm',
    ukuran: '10,5 × 14,8',
    lini: 'custom-oo105-24',
    mesinCover: 'Oliver',
    mesinIsi: 'Oliver',
    finishing: 'None,',
    cacheSource: 'bsc4',
    cacheKey: 'custom-oo105-24',
  },
  {
    folder: '24. Pricelist Buku Soft Cover - 10,5 x 14,8 cm',
    file: 'BUKU UK. 10,5 X 14,8 - Cover Print - Isi Oliver.xlsm',
    ukuran: '10,5 × 14,8',
    lini: 'custom-po105-24',
    mesinCover: 'Print Inter',
    mesinIsi: 'Oliver',
    finishing: 'None,',
    cacheSource: 'bsc4',
    cacheKey: 'custom-po105-24',
  },
  {
    folder: '24. Pricelist Buku Soft Cover - 10,5 x 14,8 cm',
    file: 'BUKU UK. 10,5 X 14,8 - Cover Print - Isi Print.xlsm',
    ukuran: '10,5 × 14,8',
    lini: 'custom-pp105-24',
    mesinCover: 'Print Inter',
    mesinIsi: 'Print Buya',
    finishing: 'None,',
    cacheSource: 'bsc4',
    cacheKey: 'custom-pp105-24',
  },
  {
    folder: '24. Pricelist Buku Soft Cover - 10,5 x 14,8 cm',
    file: 'BUKU UK. 10,5 X 14,8 - Cover Print - Isi Ryobi.xlsm',
    ukuran: '10,5 × 14,8',
    lini: 'custom-pr105-24',
    mesinCover: 'Print Inter',
    mesinIsi: 'Ryobi',
    finishing: 'None,',
    cacheSource: 'bsc4',
    cacheKey: 'custom-pr105-24',
  },
];

const bscPath = path.join(__dirname, 'bsc-expected.json');
const bsc2Path = path.join(__dirname, 'bsc2-expected.json');
const bsc3Path = path.join(__dirname, 'bsc3-expected.json');
const bsc4Path = path.join(__dirname, 'bsc4-expected.json');

const bscData = JSON.parse(fs.readFileSync(bscPath, 'utf-8'));
const bsc2Data = JSON.parse(fs.readFileSync(bsc2Path, 'utf-8'));
const bsc3Data = JSON.parse(fs.readFileSync(bsc3Path, 'utf-8'));
const bsc4Data = JSON.parse(fs.readFileSync(bsc4Path, 'utf-8'));

console.log('='.repeat(80));
console.log(' AUDIT BENCHMARK & REAKTIVITAS BUKU SOFT COVER UNIFIED (EXHAUSTIVE SWEEP)');
console.log(' Standar SOP PANDUAN_AUDIT_EXCEL_SINTAK.md (Pos 0 s/d Pos 4)');
console.log('='.repeat(80));

let totalPassed = 0;
let totalFailed = 0;
let totalTiers = 0;

for (const wb of WORKBOOKS) {
  let tiers: Array<{ oplah: number; hargaJualExcel: number; hppExcel?: number }> = [];

  if (wb.cacheSource === 'bsc') {
    tiers = bscData.map((t: any) => ({
      oplah: t.H,
      hargaJualExcel: t.DD,
      hppExcel: t.CX,
    }));
  } else if (wb.cacheSource === 'bsc2') {
    tiers = bsc2Data[wb.cacheKey!].map((t: any) => ({
      oplah: t.H,
      hargaJualExcel: t.DI,
      hppExcel: t.DC,
    }));
  } else if (wb.cacheSource === 'bsc3') {
    tiers = bsc3Data[wb.cacheKey!].map((t: any) => ({
      oplah: t.H,
      hargaJualExcel: t.DI,
      hppExcel: t.DC,
    }));
  } else if (wb.cacheSource === 'bsc4') {
    tiers = bsc4Data[wb.cacheKey!].map((t: any) => ({
      oplah: t.oplah,
      hargaJualExcel: t.DI,
      hppExcel: t.row?.DC,
    }));
  }

  totalTiers += tiers.length;

  console.log(`\n▶ [${wb.folder} / ${wb.file}]`);
  console.log(`  Ukuran: ${wb.ukuran} | Lini: ${wb.lini} | Mesin: ${wb.mesinCover} - ${wb.mesinIsi} (${tiers.length} Tiers)`);
  console.log('-'.repeat(80));
  console.log(' Oplah | Excel (Rp) | SINTAK (Rp) | Selisih | HPP SINTAK (Rp) | Status');
  console.log('-'.repeat(80));

  for (const tier of tiers) {
    const res = calculateSoftCoverUnified(
      {
        lini: wb.lini,
        oplah: tier.oplah,
        jumlahHalaman: 32,
        mukaCover: '1 Muka',
        warnaCover: '4 Warna',
        warnaIsi: '1 Warna',
        finishing: wb.finishing,
        marginPct: 30,
      },
      DEFAULT_SOFT_COVER_UNIFIED
    );

    const diff = Math.abs(res.hargaJualPerPcs - tier.hargaJualExcel);
    const pass = diff === 0;

    const padOplah = tier.oplah.toString().padStart(6);
    const padExcel = tier.hargaJualExcel.toLocaleString('id-ID').padStart(11);
    const padSintak = res.hargaJualPerPcs.toLocaleString('id-ID').padStart(11);
    const padDiff = diff.toLocaleString('id-ID').padStart(7);
    const padHpp = res.totalHpp.toLocaleString('id-ID').padStart(15);

    if (pass) {
      totalPassed++;
      console.log(`${padOplah} | ${padExcel} | ${padSintak} | ${padDiff} | ${padHpp} | [PASS]`);
    } else {
      totalFailed++;
      console.error(`${padOplah} | ${padExcel} | ${padSintak} | ${padDiff} | ${padHpp} | [FAIL]`);
    }
  }
}

// 2. UJI REAKTIVITAS PARAMETER (DELTA HPP > 0)
console.log('\n' + '='.repeat(80));
console.log(' UJI REAKTIVITAS PARAMETER (Membuktikan Delta HPP > 0)');
console.log('='.repeat(80));

const baseParam = { ...DEFAULT_SOFT_COVER_UNIFIED };

const reaktivitasTests: Array<{
  name: string;
  lini?: SoftCoverLini;
  modParam: Partial<SoftCoverUnifiedParams>;
}> = [
  { name: 'Kenaikan UMR Rp 2.500.000 -> Rp 3.000.000', modParam: { umr: 3000000 } },
  { name: 'Kenaikan Tarif Kertas Cover /kg Rp 22.000 -> Rp 25.000', modParam: { tarifKertasCoverKg: 25000 } },
  { name: 'Kenaikan Tarif Kertas Isi /kg Rp 15.700 -> Rp 18.000', modParam: { tarifKertasIsiKg: 18000 } },
  { name: 'Kenaikan Tarif Desain Cover Rp 20.000 -> Rp 50.000', modParam: { tarifDesainCover: 50000 } },
  { name: 'Kenaikan Tarif Sisir Potong Rp 150 -> Rp 300 /pcs', modParam: { tarifSisirPerPcs: 300 } },
  { name: 'Kenaikan Tarif Kardus Box Rp 8.500 -> Rp 12.000', modParam: { tarifKardusBox: 12000 } },
  { name: 'Kenaikan Tarif Lakban Roll Rp 8.000 -> Rp 10.000', modParam: { tarifLakbanRoll: 10000 } },
  { name: 'Kenaikan Tarif Plate Isi (Klasik) Rp 45.000 -> Rp 60.000', lini: 'Klasik', modParam: { tarifPlateIsi: 60000 } },
  { name: 'Kenaikan Desain Isi (Klasik) Rp 15.000 -> Rp 20.000 /hlm', lini: 'Klasik', modParam: { tarifDesainIsiPerHlm: 20000 } },
];

let reaktivitasPassed = 0;
for (const test of reaktivitasTests) {
  const testLini = test.lini || 'Oliver-Oliver';
  const bRes = calculateSoftCoverUnified(
    {
      lini: testLini,
      oplah: testLini === 'Klasik' ? 100 : 1000,
      jumlahHalaman: 32,
      mukaCover: '1 Muka',
      warnaCover: '4 Warna',
      warnaIsi: '1 Warna',
      finishing: testLini === 'Klasik' ? 'Laminasi Glossy,' : 'None,',
      marginPct: 30,
    },
    baseParam
  );

  const modRes = calculateSoftCoverUnified(
    {
      lini: testLini,
      oplah: testLini === 'Klasik' ? 100 : 1000,
      jumlahHalaman: 32,
      mukaCover: '1 Muka',
      warnaCover: '4 Warna',
      warnaIsi: '1 Warna',
      finishing: testLini === 'Klasik' ? 'Laminasi Glossy,' : 'None,',
      marginPct: 30,
    },
    { ...baseParam, ...test.modParam }
  );

  const delta = modRes.totalHpp - bRes.totalHpp;
  if (delta > 0) {
    reaktivitasPassed++;
    console.log(` [PASS] ${test.name.padEnd(55)} | +Rp ${delta.toLocaleString('id-ID')}`);
  } else {
    console.error(` [FAIL] ${test.name.padEnd(55)} | Delta: Rp ${delta.toLocaleString('id-ID')} (Tidak bereaksi)`);
  }
}

// 3. UJI PERMUTASI FINISHING
console.log('\n' + '='.repeat(80));
console.log(' UJI PERMUTASI FINISHING COVER');
console.log('='.repeat(80));

const baseRes = calculateSoftCoverUnified(
  {
    lini: 'Oliver-Oliver',
    oplah: 1000,
    jumlahHalaman: 32,
    mukaCover: '1 Muka',
    warnaCover: '4 Warna',
    warnaIsi: '1 Warna',
    finishing: 'None,',
    marginPct: 30,
  },
  baseParam
);
const finishings: SoftCoverFinishing[] = [
  'Laminasi Glossy,',
  'Laminasi Doff,',
  'UV Varnish,',
  'Lem Bending,',
  'Laminasi Glossy + Bending,',
  'Laminasi Doff + Bending,',
  'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,',
];

let finishingPassed = 0;
for (const fin of finishings) {
  const finRes = calculateSoftCoverUnified(
    {
      lini: 'Oliver-Oliver',
      oplah: 1000,
      jumlahHalaman: 32,
      mukaCover: '1 Muka',
      warnaCover: '4 Warna',
      warnaIsi: '1 Warna',
      finishing: fin,
      marginPct: 30,
    },
    baseParam
  );

  const delta = finRes.totalHpp - baseRes.totalHpp;
  if (delta > 0) {
    finishingPassed++;
    console.log(` [PASS] Finishing ${fin.padEnd(58)} | +Rp ${delta.toLocaleString('id-ID')}`);
  } else {
    console.error(` [FAIL] Finishing ${fin.padEnd(58)} | Delta: Rp ${delta}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log(' RINGKASAN HASIL AUDIT BUKU SOFT COVER (EXHAUSTIVE SWEEP):');
console.log(` - Total File Workbook Sumber : ${WORKBOOKS.length} File Workbook`);
console.log(` - Total Tier Dieksekusi      : ${totalTiers} Tier`);
console.log(` - Tier Parity Murni (Rp 0)   : ${totalPassed} PASSED`);
console.log(` - Tier Gagal (Unexplained)   : ${totalFailed} FAILED`);
console.log(` - Reaktivitas Parameter      : ${reaktivitasPassed}/${reaktivitasTests.length} PASSED (Delta HPP > 0)`);
console.log(` - Permutasi Finishing        : ${finishingPassed}/${finishings.length} PASSED`);
console.log('='.repeat(80));

if (totalFailed > 0 || reaktivitasPassed < reaktivitasTests.length || finishingPassed < finishings.length) {
  process.exit(1);
} else {
  console.log(' [OK] AUDIT BUKU SOFT COVER MENYAPU 100% WORKBOOK LOLOS SESUAI SOP.\n');
}
