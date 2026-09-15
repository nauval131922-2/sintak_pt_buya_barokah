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
console.log('--- 1. TIER OPLAH KECIL (50 - 500 pcs - 15,5 x 21.xlsm): POD Print Inter + Ryobi ---');
const wb1 = XLSX.readFile('E:\\percetakan buya barokah\\backup\\a1\\02__PEMASARAN\\0203_SURAT PENAWARAN HARGA (SPH) out\\020326 2026 SURAT PENAWARAN HARGA (SPH) out\\Pricelist Juli 2026\\06. Pricelist Buku Tulis\\Source\\02020137 Pricelist Buku Tulis Juli 2026  50 - 500 pcs - 15,5 x 21.xlsm');
const b1 = wb1.Sheets['BUKU'];

for (let r = 7; r <= 18; r++) {
  const oplah = Number(b1['H' + r]?.v);
  const exTotal = Math.round(Number(b1['DF' + r]?.v));
  const exJual = Number(b1['DL' + r]?.v);
  const res = calculateBukuTulisHpp({
    ukuran: '15,5 x 21',
    oplah,
    metodeCetakCover: 'Print Inter',
    metodeCetakIsi: 'Ryobi',
    opsiLaminasi: true,
    opsiSisir: true,
  });
  assertCheck(`Oplah ${oplah} (Cover: POD | Isi: Ryobi)`, res.totalHpp, exTotal, res.hargaJualPerPcs, exJual);
}

// 2. FILE 2: 600 - 2.500 pcs - 16 x 21.xlsm (Oliver 4W + Oliver 1W)
console.log('\n--- 2. TIER OPLAH MENENGAH (600 - 2.500 pcs - 16 x 21.xlsm): Oliver 4W + Oliver 1W ---');
const wb2 = XLSX.readFile('E:\\percetakan buya barokah\\backup\\a1\\02__PEMASARAN\\0203_SURAT PENAWARAN HARGA (SPH) out\\020326 2026 SURAT PENAWARAN HARGA (SPH) out\\Pricelist Juli 2026\\06. Pricelist Buku Tulis\\Source\\02020137 Pricelist Buku Tulis Juli 2026  600 - 2.500 pcs - 16 x 21.xlsm');
const b2 = wb2.Sheets['BUKU'];

for (let r = 7; r <= 18; r++) {
  const oplah = Number(b2['H' + r]?.v);
  const exTotal = Math.round(Number(b2['DF' + r]?.v));
  const exJual = Number(b2['DL' + r]?.v);
  const res = calculateBukuTulisHpp({
    ukuran: '16 x 21',
    oplah,
    metodeCetakCover: 'Oliver',
    metodeCetakIsi: 'Oliver',
    opsiLaminasi: true,
    opsiSisir: true,
  });
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
  const res = calculateBukuTulisHpp({
    ukuran: '16 x 21',
    oplah,
    metodeCetakCover: 'Oliver',
    metodeCetakIsi: 'SM',
    opsiLaminasi: true,
    opsiSisir: true,
  });
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
  // Pada file 3.000 - 10.000 pcs, sel Master!D23 (Insheet Isi) adalah 300
  const res = calculateBukuTulisHpp(
    {
      ukuran: '16 x 21',
      oplah: tc.oplah,
      metodeCetakCover: 'Oliver',
      metodeCetakIsi: 'Oliver',
      opsiLaminasi: true,
      opsiSisir: true,
    },
    { ...DEFAULT_BUKU_TULIS_PARAMS, insheetIsiOliver: 300 }
  );
  assertCheck(`Oplah ${tc.oplah} (Cover: Oliver | Isi: Oliver 300 insh)`, res.totalHpp, tc.exTotal, res.hargaJualPerPcs, tc.exJual);
}

// 5. UJI DINAMIS PERUBAHAN INSHEET OLIVER (100 vs 300 lbr)
console.log('\n--- 5. UJI DINAMIS: RESPON KALKULATOR SAAT INSHEET OLIVER DIUBAH (100 vs 300 lbr) ---');
const r100 = calculateBukuTulisHpp(
  { ukuran: '16 x 21', oplah: 3000, metodeCetakCover: 'Oliver', metodeCetakIsi: 'Oliver' },
  { ...DEFAULT_BUKU_TULIS_PARAMS, insheetIsiOliver: 100 }
);
const r300 = calculateBukuTulisHpp(
  { ukuran: '16 x 21', oplah: 3000, metodeCetakCover: 'Oliver', metodeCetakIsi: 'Oliver' },
  { ...DEFAULT_BUKU_TULIS_PARAMS, insheetIsiOliver: 300 }
);
const selisihHpp = r300.totalHpp - r100.totalHpp;
console.log(`Insheet 100 lbr -> Total HPP: Rp ${r100.totalHpp.toLocaleString('id-ID')} | HPP/pcs: Rp ${Math.round(r100.hppPerPcs).toLocaleString('id-ID')} | Jual: Rp ${r100.hargaJualPerPcs.toLocaleString('id-ID')}`);
console.log(`Insheet 300 lbr -> Total HPP: Rp ${r300.totalHpp.toLocaleString('id-ID')} | HPP/pcs: Rp ${Math.round(r300.hppPerPcs).toLocaleString('id-ID')} | Jual: Rp ${r300.hargaJualPerPcs.toLocaleString('id-ID')}`);
console.log(`Respon Perubahan Parameter Insheet: ${selisihHpp > 0 ? `✅ BERHASIL DINAMIS (Selisih Biaya: Rp ${selisihHpp.toLocaleString('id-ID')})` : '❌ TIDAK BERUBAH'}`);

console.log('\n========================================================================================');
console.log(`TOTAL UJI PERMUTASI: ${totalTests} | LULUS: ${passedTests} | GAGAL: ${totalTests - passedTests}`);
console.log(`STATUS AKHIR: ${passedTests === totalTests ? '✅ 100% PARITY TERCAPAI (0 SELISIH DI SELURUH PERMUTASI)' : '❌ MASIH ADA SELISIH'}`);
console.log('========================================================================================\n');
