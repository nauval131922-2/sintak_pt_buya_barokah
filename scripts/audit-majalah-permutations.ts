// Audit Benchmark Majalah: calculateMajalahSimulator vs 3 Source Workbooks (20 Tiers)
import fs from 'fs';
import path from 'path';
import {
  calculateMajalahSimulator,
  DEFAULT_MAJALAH_PARAMS,
  MajalahMasterParams,
} from '../src/lib/majalah-calculator';

const expectedPath = path.join(__dirname, 'majalah-expected.json');
const expectedData: any[] = JSON.parse(fs.readFileSync(expectedPath, 'utf-8'));

console.log('='.repeat(80));
console.log(' AUDIT BENCHMARK & REAKTIVITAS MAJALAH 14,5 x 20,25 CM (EXHAUSTIVE SWEEP)');
console.log(' Standar SOP PANDUAN_AUDIT_EXCEL_SINTAK.md (Pos 0 s/d Pos 4)');
console.log('='.repeat(80));

let totalPassed = 0;
let totalFailed = 0;
let totalTiers = 0;

for (const wb of expectedData) {
  console.log(`\n▶ [${wb.file}]`);
  console.log(`  Ukuran: ${wb.ukuran} | Mesin: ${wb.mesin_cover} - ${wb.mesin_isi} (${wb.tiers.length} Tiers)`);
  console.log('-'.repeat(80));
  console.log(' Oplah | Excel (Rp) | SINTAK (Rp) | Selisih | HPP SINTAK (Rp) | Status');
  console.log('-'.repeat(80));

  totalTiers += wb.tiers.length;

  for (const tier of wb.tiers) {
    const res = calculateMajalahSimulator(
      {
        oplah: tier.oplah,
        finishing: 'Tanpa Laminasi',
        jilid: 'Staples Tengah',
        marginPct: 30,
        negoDiskonPct: 5,
      },
      DEFAULT_MAJALAH_PARAMS
    );

    const diff = Math.abs(res.hargaJualPerPcs - tier.harga_final);
    const pass = diff === 0;

    const padOplah = tier.oplah.toString().padStart(6);
    const padExcel = tier.harga_final.toLocaleString('id-ID').padStart(11);
    const padSintak = res.hargaJualPerPcs.toLocaleString('id-ID').padStart(11);
    const padDiff = diff.toLocaleString('id-ID').padStart(7);
    const padHpp = res.totalHpp.toLocaleString('id-ID', { maximumFractionDigits: 0 }).padStart(15);

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

const baseParam = { ...DEFAULT_MAJALAH_PARAMS };
const baseResPrint = calculateMajalahSimulator(
  { oplah: 100, finishing: 'Tanpa Laminasi', jilid: 'Staples Tengah', marginPct: 30, negoDiskonPct: 5 },
  baseParam
);
const baseResOffset = calculateMajalahSimulator(
  { oplah: 1000, finishing: 'Tanpa Laminasi', jilid: 'Staples Tengah', marginPct: 30, negoDiskonPct: 5 },
  baseParam
);

const reaktivitasTests: Array<{
  name: string;
  oplah: number;
  modParam: Partial<MajalahMasterParams>;
}> = [
  { name: 'Kenaikan UMR Rp 2.818.850 -> Rp 3.200.000', oplah: 1000, modParam: { umr: 3200000 } },
  { name: 'Kenaikan Tarif Kertas AC 230 /kg Rp 16.400 -> Rp 19.000', oplah: 1000, modParam: { tarifKertasAc230Kg: 19000 } },
  { name: 'Kenaikan Tarif Kertas AP 120 /kg Rp 17.400 -> Rp 20.000', oplah: 1000, modParam: { tarifKertasAp120Kg: 20000 } },
  { name: 'Kenaikan Tarif Plat Cover Oliver Rp 45.000 -> Rp 60.000', oplah: 1000, modParam: { tarifPlateCoverOliver: 60000 } },
  { name: 'Kenaikan Tarif Plat Isi Oliver Rp 45.000 -> Rp 60.000', oplah: 1000, modParam: { tarifPlateIsiOliver: 60000 } },
  { name: 'Kenaikan Tarif Print Cover Digital Rp 2.700 -> Rp 3.500', oplah: 100, modParam: { tarifPrintCoverA3: 3500 } },
  { name: 'Kenaikan Tarif Print Isi Digital Rp 1.750 -> Rp 2.200', oplah: 100, modParam: { tarifPrintIsiA3: 2200 } },
  { name: 'Kenaikan Tarif Desain Cover Rp 20.000 -> Rp 50.000', oplah: 1000, modParam: { tarifDesainCover: 50000 } },
  { name: 'Kenaikan Tarif Kardus Box Rp 8.500 -> Rp 12.000', oplah: 1000, modParam: { tarifKardusBox: 12000 } },
  { name: 'Kenaikan Tarif Lakban Roll Rp 8.000 -> Rp 10.000', oplah: 1000, modParam: { tarifLakbanRoll: 10000 } },
];

let reaktivitasPassed = 0;
for (const test of reaktivitasTests) {
  const baseCompare = test.oplah === 100 ? baseResPrint : baseResOffset;
  const modRes = calculateMajalahSimulator(
    { oplah: test.oplah, finishing: 'Tanpa Laminasi', jilid: 'Staples Tengah', marginPct: 30, negoDiskonPct: 5 },
    { ...baseParam, ...test.modParam }
  );

  const delta = modRes.totalHpp - baseCompare.totalHpp;
  if (delta > 0) {
    reaktivitasPassed++;
    console.log(` [PASS] ${test.name.padEnd(60)} | +Rp ${Math.round(delta).toLocaleString('id-ID')}`);
  } else {
    console.error(` [FAIL] ${test.name.padEnd(60)} | Delta: Rp ${delta} (Tidak bereaksi)`);
  }
}

// 3. UJI PERMUTASI FINISHING & JILID
console.log('\n' + '='.repeat(80));
console.log(' UJI PERMUTASI FINISHING & JILID');
console.log('='.repeat(80));

const finishingOptions: Array<{ name: string; finishing: any; jilid: any }> = [
  { name: 'Finishing Laminasi Glossy', finishing: 'Laminasi Glossy', jilid: 'Staples Tengah' },
  { name: 'Finishing Laminasi Doff', finishing: 'Laminasi Doff', jilid: 'Staples Tengah' },
  { name: 'Finishing UV Varnish', finishing: 'UV Varnish', jilid: 'Staples Tengah' },
  { name: 'Jilid Lem Bending', finishing: 'Tanpa Laminasi', jilid: 'Lem Bending' },
  { name: 'Laminasi Glossy + Lem Bending', finishing: 'Laminasi Glossy', jilid: 'Lem Bending' },
];

let finishingPassed = 0;
for (const opt of finishingOptions) {
  const res = calculateMajalahSimulator(
    { oplah: 1000, finishing: opt.finishing, jilid: opt.jilid, marginPct: 30, negoDiskonPct: 5 },
    baseParam
  );

  const delta = res.totalHpp - baseResOffset.totalHpp;
  if (delta > 0) {
    finishingPassed++;
    console.log(` [PASS] ${opt.name.padEnd(60)} | +Rp ${Math.round(delta).toLocaleString('id-ID')}`);
  } else {
    console.error(` [FAIL] ${opt.name.padEnd(60)} | Delta: Rp ${delta}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log(' RINGKASAN HASIL AUDIT MAJALAH (EXHAUSTIVE SWEEP):');
console.log(` - Total File Workbook Sumber : ${expectedData.length} File Workbook`);
console.log(` - Total Tier Dieksekusi      : ${totalTiers} Tier`);
console.log(` - Tier Parity Murni (Rp 0)   : ${totalPassed} PASSED`);
console.log(` - Tier Gagal (Unexplained)   : ${totalFailed} FAILED`);
console.log(` - Reaktivitas Parameter      : ${reaktivitasPassed}/${reaktivitasTests.length} PASSED (Delta HPP > 0)`);
console.log(` - Permutasi Finishing/Jilid  : ${finishingPassed}/${finishingOptions.length} PASSED`);
console.log('='.repeat(80));

if (totalFailed > 0 || reaktivitasPassed < reaktivitasTests.length || finishingPassed < finishingOptions.length) {
  process.exit(1);
} else {
  console.log(' [OK] AUDIT MAJALAH MENYAPU 100% WORKBOOK LOLOS SESUAI SOP.\n');
}
