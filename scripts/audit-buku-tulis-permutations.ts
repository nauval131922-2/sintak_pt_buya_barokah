import XLSX from 'xlsx';
import { calculateBukuTulisHpp, DEFAULT_BUKU_TULIS_PARAMS } from '../src/lib/buku-tulis-calculator';

console.log('========================================================================================');
console.log('BENCHMARK PERMUTASI DROPDOWN BUKU TULIS: SINTAK vs EXCEL MASTER (100% MATHEMATICAL PARITY)');
console.log('========================================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assertCheck(desc: string, actTotal: number, exTotal: number, actJual: number, exJual: number) {
  totalTests++;
  const diffTot = Math.abs(actTotal - exTotal);
  const diffJual = Math.abs(actJual - exJual);
  const pass = diffTot === 0 && diffJual === 0;
  if (pass) passedTests++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${desc.padEnd(52)} | HPP Act: ${actTotal.toLocaleString('id-ID').padStart(10)} Ex: ${exTotal.toLocaleString('id-ID').padStart(10)} (d:${diffTot}) | Jual Act: ${actJual.toLocaleString('id-ID').padStart(6)} Ex: ${exJual.toLocaleString('id-ID').padStart(6)} (d:${diffJual})`);
  return pass;
}

// 1. FILE 1: 50 - 500 pcs - 15,5 x 21.xlsm (Print Inter + Ryobi)
console.log('--- 1. TIER OPLAH KECIL (50 - 500 pcs - 15,5 x 21.xlsm): Print Inter + Ryobi ---');
const wb1 = XLSX.readFile('E:\\percetakan buya barokah\\backup\\a1\\02__PEMASARAN\\0203_SURAT PENAWARAN HARGA (SPH) out\\020326 2026 SURAT PENAWARAN HARGA (SPH) out\\Pricelist Juli 2026\\06. Pricelist Buku Tulis\\Source\\02020137 Pricelist Buku Tulis Juli 2026  50 - 500 pcs - 15,5 x 21.xlsm');
const b1 = wb1.Sheets['BUKU'];

for (let r = 7; r <= 18; r++) {
  const oplah = Number(b1['H' + r]?.v);
  const exTotal = Math.round(Number(b1['DF' + r]?.v));
  const exJual = Number(b1['DL' + r]?.v);
  const res = calculateBukuTulisHpp(
    {
      ukuran: '15,5 x 21',
      oplah,
      metodeCetakCover: 'Print Inter',
      metodeCetakIsi: 'Ryobi',
      opsiLaminasi: true,
      opsiSisir: true,
    },
    { ...DEFAULT_BUKU_TULIS_PARAMS, upHvsPct: 3, tarifDesignIsiPerHlm: 2500, insheetIsiRyobi: 30 }
  );
  assertCheck(`Oplah ${oplah} (Cover: Print Inter | Isi: Ryobi)`, res.totalHpp, exTotal, res.hargaJualPerPcs, exJual);
}

// 2. FILE 2: 600 - 2.500 pcs - 16 x 21.xlsm (Oliver 4W + Oliver 1W)
console.log('\n--- 2. TIER OPLAH MENENGAH (600 - 2.500 pcs - 16 x 21.xlsm): Oliver 4W + Oliver 1W ---');
const wb2 = XLSX.readFile('E:\\percetakan buya barokah\\backup\\a1\\02__PEMASARAN\\0203_SURAT PENAWARAN HARGA (SPH) out\\020326 2026 SURAT PENAWARAN HARGA (SPH) out\\Pricelist Juli 2026\\06. Pricelist Buku Tulis\\Source\\02020137 Pricelist Buku Tulis Juli 2026  600 - 2.500 pcs - 16 x 21.xlsm');
const b2 = wb2.Sheets['BUKU'];

for (let r = 7; r <= 18; r++) {
  const oplah = Number(b2['H' + r]?.v);
  const exTotal = Math.round(Number(b2['DF' + r]?.v));
  const exJual = Number(b2['DL' + r]?.v);
  const res = calculateBukuTulisHpp(
    {
      ukuran: '16 x 21',
      oplah,
      metodeCetakCover: 'Oliver',
      metodeCetakIsi: 'Oliver',
      opsiLaminasi: true,
      opsiSisir: true,
    },
    { ...DEFAULT_BUKU_TULIS_PARAMS, upHvsPct: 0, tarifDesignIsiPerHlm: 2500, insheetIsiOliver: 100 }
  );
  assertCheck(`Oplah ${oplah} (Cover: Oliver | Isi: Oliver)`, res.totalHpp, exTotal, res.hargaJualPerPcs, exJual);
}

// 3. FILE 3 (Mode SM): 3.000 - 10.000 pcs - 16 x 21.xlsm (Oliver 4W + Speedmaster SM 102 1W)
console.log('\n--- 3. TIER OPLAH BESAR (3.000 - 10.000 pcs): Permutasi Default (Cover: Oliver | Isi: SM 102) ---');
const wb3 = XLSX.readFile('E:\\percetakan buya barokah\\backup\\a1\\02__PEMASARAN\\0203_SURAT PENAWARAN HARGA (SPH) out\\020326 2026 SURAT PENAWARAN HARGA (SPH) out\\Pricelist Juli 2026\\06. Pricelist Buku Tulis\\Source\\02020137 Pricelist Buku Tulis Juli 2026  3.000 - 10.000 pcs - 16 x 21.xlsm');
const b3 = wb3.Sheets['BUKU'];

for (let r = 7; r <= 10; r++) {
  const oplah = Number(b3['H' + r]?.v);
  const exTotal = Math.round(Number(b3['DF' + r]?.v));
  const exJual = Number(b3['DL' + r]?.v);
  const res = calculateBukuTulisHpp(
    {
      ukuran: '16 x 21',
      oplah,
      metodeCetakCover: 'Oliver',
      metodeCetakIsi: 'SM',
      opsiLaminasi: true,
      opsiSisir: true,
    },
    { ...DEFAULT_BUKU_TULIS_PARAMS, upHvsPct: 0, tarifDesignIsiPerHlm: 0, insheetIsiSm: 300 }
  );
  assertCheck(`Oplah ${oplah} (Cover: Oliver | Isi: SM 102)`, res.totalHpp, exTotal, res.hargaJualPerPcs, exJual);
}

// 4. FILE 3 (Mode Oliver): 3.000 - 10.000 pcs - 16 x 21.xlsm (Oliver 4W + Oliver 1W - Dropdown Override)
console.log('\n--- 4. TIER OPLAH BESAR (3.000 - 10.000 pcs): Permutasi Dropdown Override (Cover: Oliver | Isi: Oliver 1W) ---');
// Angka acuan Excel murni ketika dropdown Master!D25 diganti menjadi "Oliver":
const oliverLargeCases = [
  { oplah: 3000, exTotal: 9875825, exJual: 3960 },
  { oplah: 3500, exTotal: 11320890, exJual: 3890 },
  { oplah: 5000, exTotal: 15671873, exJual: 3770 },
  { oplah: 10000, exTotal: 30177983, exJual: 3630 },
];

for (const tc of oliverLargeCases) {
  // Pada file 3.000 - 10.000 pcs, sel Master!D23 = 300, Master!D26 = 0, Master!E22 = 0
  const res = calculateBukuTulisHpp(
    {
      ukuran: '16 x 21',
      oplah: tc.oplah,
      metodeCetakCover: 'Oliver',
      metodeCetakIsi: 'Oliver',
      opsiLaminasi: true,
      opsiSisir: true,
    },
    { ...DEFAULT_BUKU_TULIS_PARAMS, upHvsPct: 0, tarifDesignIsiPerHlm: 0, insheetIsiOliver: 300 }
  );
  assertCheck(`Oplah ${tc.oplah} (Cover: Oliver | Isi: Oliver 300 insh)`, res.totalHpp, tc.exTotal, res.hargaJualPerPcs, tc.exJual);
}

// 4B. FILE 3 (Mode Cover SM): 3.000 - 10.000 pcs - 16 x 21.xlsm (Cover: SM 102 4W | Isi: SM 102 1W)
console.log('\n--- 4B. TIER OPLAH BESAR (3.000 - 10.000 pcs): Permutasi Cover SM (Cover: SM 102 | Isi: SM 102) ---');
const smCoverCases = [
  { oplah: 3000, exTotal: 11526947, exJual: 4620 },
  { oplah: 5000, exTotal: 17522067, exJual: 4210 },
  { oplah: 10000, exTotal: 32546219, exJual: 3910 },
];

for (const tc of smCoverCases) {
  const res = calculateBukuTulisHpp(
    {
      ukuran: '16 x 21',
      oplah: tc.oplah,
      metodeCetakCover: 'SM',
      metodeCetakIsi: 'SM',
      opsiLaminasi: true,
      opsiSisir: true,
    },
    { ...DEFAULT_BUKU_TULIS_PARAMS, upHvsPct: 0, tarifDesignIsiPerHlm: 0, insheetIsiSm: 300 }
  );
  assertCheck(`Oplah ${tc.oplah} (Cover: SM 102 | Isi: SM 102)`, res.totalHpp, tc.exTotal, res.hargaJualPerPcs, tc.exJual);
}

// 5. UJI REAKTIVITAS PARAMETER (ANTI-HARDCODE / ANTI-HIJACKING TEST)
console.log('\n--- 5. UJI REAKTIVITAS PARAMETER (Memastikan Tidak Ada Variabel Dibajak/Mati) ---');

function assertReactivity(paramName: string, hpp1: number, hpp2: number) {
  totalTests++;
  const diff = Math.abs(hpp2 - hpp1);
  const pass = diff > 0;
  if (pass) passedTests++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] Reaktivitas ${paramName.padEnd(30)} | HPP A: Rp ${hpp1.toLocaleString('id-ID')} -> HPP B: Rp ${hpp2.toLocaleString('id-ID')} (Delta: Rp ${diff.toLocaleString('id-ID')})`);
  if (!pass) throw new Error(`CRITICAL: Parameter ${paramName} tidak merespons perubahan (Hardcode/Hijacking terdeteksi)!`);
  return pass;
}

// A. Test Insheet Oliver (100 vs 300)
const testInsh100 = calculateBukuTulisHpp(
  { ukuran: '16 x 21', oplah: 3000, metodeCetakCover: 'Oliver', metodeCetakIsi: 'Oliver' },
  { ...DEFAULT_BUKU_TULIS_PARAMS, insheetIsiOliver: 100 }
).totalHpp;
const testInsh300 = calculateBukuTulisHpp(
  { ukuran: '16 x 21', oplah: 3000, metodeCetakCover: 'Oliver', metodeCetakIsi: 'Oliver' },
  { ...DEFAULT_BUKU_TULIS_PARAMS, insheetIsiOliver: 300 }
).totalHpp;
assertReactivity('insheetIsiOliver (100 vs 300)', testInsh100, testInsh300);

// B. Test Desain Setting Isi (0 vs 2.500)
const testDesain0 = calculateBukuTulisHpp(
  { ukuran: '16 x 21', oplah: 3000, metodeCetakCover: 'Oliver', metodeCetakIsi: 'Oliver' },
  { ...DEFAULT_BUKU_TULIS_PARAMS, tarifDesignIsiPerHlm: 0 }
).totalHpp;
const testDesain2500 = calculateBukuTulisHpp(
  { ukuran: '16 x 21', oplah: 3000, metodeCetakCover: 'Oliver', metodeCetakIsi: 'Oliver' },
  { ...DEFAULT_BUKU_TULIS_PARAMS, tarifDesignIsiPerHlm: 2500 }
).totalHpp;
assertReactivity('tarifDesignIsiPerHlm (0 vs 2.500)', testDesain0, testDesain2500);

// C. Test Markup Kertas HVS (0% vs 5%)
const testUp0 = calculateBukuTulisHpp(
  { ukuran: '16 x 21', oplah: 3000, metodeCetakCover: 'Oliver', metodeCetakIsi: 'Oliver' },
  { ...DEFAULT_BUKU_TULIS_PARAMS, upHvsPct: 0 }
).totalHpp;
const testUp5 = calculateBukuTulisHpp(
  { ukuran: '16 x 21', oplah: 3000, metodeCetakCover: 'Oliver', metodeCetakIsi: 'Oliver' },
  { ...DEFAULT_BUKU_TULIS_PARAMS, upHvsPct: 5 }
).totalHpp;
assertReactivity('upHvsPct (0% vs 5%)', testUp0, testUp5);

// D. Test Ongkos Potong Sisir (150 vs 250)
const testSisir150 = calculateBukuTulisHpp(
  { ukuran: '16 x 21', oplah: 3000, metodeCetakCover: 'Oliver', metodeCetakIsi: 'Oliver' },
  { ...DEFAULT_BUKU_TULIS_PARAMS, tarifSisirPerPcs: 150 }
).totalHpp;
const testSisir250 = calculateBukuTulisHpp(
  { ukuran: '16 x 21', oplah: 3000, metodeCetakCover: 'Oliver', metodeCetakIsi: 'Oliver' },
  { ...DEFAULT_BUKU_TULIS_PARAMS, tarifSisirPerPcs: 250 }
).totalHpp;
assertReactivity('tarifSisirPerPcs (150 vs 250)', testSisir150, testSisir250);

console.log('\n========================================================================================');
console.log(`TOTAL UJI PERMUTASI: ${totalTests} | LULUS: ${passedTests} | GAGAL: ${totalTests - passedTests}`);
console.log(`STATUS AKHIR: ${passedTests === totalTests ? '✅ 100% PARITY TERCAPAI (0 SELISIH DI SELURUH PERMUTASI)' : '❌ MASIH ADA SELISIH'}`);
console.log('========================================================================================\n');
