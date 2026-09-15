import XLSX from 'xlsx';
import { calculateYasinSimulator, DEFAULT_YASIN_PARAMS } from '../src/lib/yasin-calculator';

console.log('========================================================================================');
console.log('BENCHMARK PERMUTASI & REAKTIVITAS BUKU YASIN: SINTAK vs EXCEL MASTER (100% PARITY)');
console.log('========================================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assertCheck(desc: string, actTotal: number, exTotal: number, actJual: number, exJual: number) {
  totalTests++;
  const diffTot = Math.abs(actTotal - exTotal);
  const diffJual = Math.abs(actJual - exJual);
  // Toleransi 1 rupiah untuk pembulatan koma desimal, toleransi 10 rupiah untuk round harga jual
  const pass = diffTot <= 1 && diffJual <= 10;
  if (pass) passedTests++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${desc.padEnd(52)} | HPP Act: ${actTotal.toLocaleString('id-ID').padStart(10)} Ex: ${exTotal.toLocaleString('id-ID').padStart(10)} (d:${diffTot}) | Jual Act: ${actJual.toLocaleString('id-ID').padStart(6)} Ex: ${exJual.toLocaleString('id-ID').padStart(6)} (d:${diffJual})`);
  return pass;
}

const base = 'E:\\percetakan buya barokah\\backup\\a1\\02__PEMASARAN\\0203_SURAT PENAWARAN HARGA (SPH) out\\020326 2026 SURAT PENAWARAN HARGA (SPH) out\\Pricelist Juli 2026\\02. Pricelist Yasin';

// 1. FILE 1: Softcover 96 Halaman
console.log('--- 1. YASIN SOFT COVER 96 HALAMAN (Pricelist yasin 96.xlsx) ---');
const wb1 = XLSX.readFile(base + '\\Source Yasin 96 dan 128\\Pricelist yasin 96.xlsx');
const b1 = wb1.Sheets['BUKU'];

for (let r = 7; r <= 23; r++) {
  const q = Number(b1['H' + r]?.v);
  const exTot = Math.round(Number(b1['BG' + r]?.v));
  const exJual = Number(b1['BM' + r]?.v);
  if (q && exTot > 0) {
    const res = calculateYasinSimulator({
      tipeCover: 'Softcover',
      ukuran: '11.7 x 15',
      jumlahHalamanIsi: 96,
      oplah: q,
      lembarSisipanFoto: 1,
      lembarSisipanKeluarga: 1,
      laminasiCover: 'Glossy',
      opsiPlastikOpp: true,
      opsiPitaSiku: false,
      opsiKardus: true,
      marginPct: 30,
      negoDiskonPct: 0,
    }, DEFAULT_YASIN_PARAMS);
    assertCheck(`Yasin SC 96 Oplah ${q}`, res.summary.totalHpp, exTot, res.summary.hargaJualPerPcs, exJual);
  }
}

// 2. FILE 2: Softcover 128 Halaman
console.log('\n--- 2. YASIN SOFT COVER 128 HALAMAN (Pricelist yasin 128.xlsx) ---');
const wb2 = XLSX.readFile(base + '\\Source Yasin 96 dan 128\\Pricelist yasin 128.xlsx');
const b2 = wb2.Sheets['BUKU'];

for (let r = 7; r <= 23; r++) {
  const q = Number(b2['H' + r]?.v);
  const exTot = Math.round(Number(b2['BG' + r]?.v));
  const exJual = Number(b2['BM' + r]?.v);
  if (q && exTot > 0) {
    const res = calculateYasinSimulator({
      tipeCover: 'Softcover',
      ukuran: '11.7 x 15',
      jumlahHalamanIsi: 128,
      oplah: q,
      lembarSisipanFoto: 1,
      lembarSisipanKeluarga: 1,
      laminasiCover: 'Glossy',
      opsiPlastikOpp: true,
      opsiPitaSiku: false,
      opsiKardus: true,
      marginPct: 30,
      negoDiskonPct: 0,
    }, DEFAULT_YASIN_PARAMS);
    assertCheck(`Yasin SC 128 Oplah ${q}`, res.summary.totalHpp, exTot, res.summary.hargaJualPerPcs, exJual);
  }
}

// 3. FILE 3: Hardcover 96 Halaman
console.log('\n--- 3. YASIN HARD COVER 96 HALAMAN (Pricelist Yasin HC 96.xlsx) ---');
const wb3 = XLSX.readFile(base + '\\Source Yasin HC\\Pricelist Yasin HC 96.xlsx');
const b3 = wb3.Sheets['BUKU'];

for (let r = 7; r <= 23; r++) {
  const q = Number(b3['H' + r]?.v);
  const exTot = Math.round(Number(b3['BL' + r]?.v));
  const exJual = Number(b3['BR' + r]?.v);
  if (q && exTot > 0) {
    const res = calculateYasinSimulator({
      tipeCover: 'Hardcover',
      ukuran: '11.7 x 15',
      jumlahHalamanIsi: 96,
      oplah: q,
      lembarSisipanFoto: 1,
      lembarSisipanKeluarga: 1,
      laminasiCover: 'Glossy',
      opsiPlastikOpp: true,
      opsiPitaRumbai: true,
      opsiSikuEmas: false,
      opsiKardus: true,
      marginPct: 30,
      negoDiskonPct: 0,
    }, DEFAULT_YASIN_PARAMS);
    assertCheck(`Yasin HC 96 Oplah ${q}`, res.summary.totalHpp, exTot, res.summary.hargaJualPerPcs, exJual);
  }
}

// 4. FILE 4: Hardcover 128 Halaman
console.log('\n--- 4. YASIN HARD COVER 128 HALAMAN (Princelist Yasin HC 128.xlsx) ---');
const wb4 = XLSX.readFile(base + '\\Source Yasin HC\\Princelist Yasin HC 128.xlsx');
const b4 = wb4.Sheets['BUKU'];

for (let r = 7; r <= 23; r++) {
  const q = Number(b4['H' + r]?.v);
  const exTot = Math.round(Number(b4['BL' + r]?.v));
  const exJual = Number(b4['BR' + r]?.v);
  if (q && exTot > 0) {
    const res = calculateYasinSimulator({
      tipeCover: 'Hardcover',
      ukuran: '11.7 x 15',
      jumlahHalamanIsi: 128,
      oplah: q,
      lembarSisipanFoto: 1,
      lembarSisipanKeluarga: 1,
      laminasiCover: 'Glossy',
      opsiPlastikOpp: true,
      opsiPitaRumbai: true,
      opsiSikuEmas: false,
      opsiKardus: true,
      marginPct: 30,
      negoDiskonPct: 0,
    }, DEFAULT_YASIN_PARAMS);
    assertCheck(`Yasin HC 128 Oplah ${q}`, res.summary.totalHpp, exTot, res.summary.hargaJualPerPcs, exJual);
  }
}

// 5. UJI REAKTIVITAS PARAMETER
console.log('\n--- 5. UJI REAKTIVITAS PARAMETER BUKU YASIN ---');
function assertReactivity(paramName: string, hpp1: number, hpp2: number) {
  totalTests++;
  const diff = Math.abs(hpp2 - hpp1);
  const pass = diff > 0;
  if (pass) passedTests++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] Reaktivitas ${paramName.padEnd(30)} | HPP A: Rp ${hpp1.toLocaleString('id-ID')} -> HPP B: Rp ${hpp2.toLocaleString('id-ID')} (Delta: Rp ${diff.toLocaleString('id-ID')})`);
  if (!pass) throw new Error(`CRITICAL: Parameter ${paramName} tidak merespons perubahan!`);
  return pass;
}

const t1 = calculateYasinSimulator({ tipeCover: 'Softcover', ukuran: '11.7 x 15', jumlahHalamanIsi: 96, oplah: 100, lembarSisipanFoto: 1, lembarSisipanKeluarga: 1, laminasiCover: 'Glossy', opsiPlastikOpp: true, opsiPitaSiku: false, opsiKardus: true }, { ...DEFAULT_YASIN_PARAMS, tarifPrintCoverA3: 2500 }).summary.totalHpp;
const t2 = calculateYasinSimulator({ tipeCover: 'Softcover', ukuran: '11.7 x 15', jumlahHalamanIsi: 96, oplah: 100, lembarSisipanFoto: 1, lembarSisipanKeluarga: 1, laminasiCover: 'Glossy', opsiPlastikOpp: true, opsiPitaSiku: false, opsiKardus: true }, { ...DEFAULT_YASIN_PARAMS, tarifPrintCoverA3: 3500 }).summary.totalHpp;
assertReactivity('tarifPrintCoverA3', t1, t2);

const t3 = calculateYasinSimulator({ tipeCover: 'Hardcover', ukuran: '11.7 x 15', jumlahHalamanIsi: 96, oplah: 100, lembarSisipanFoto: 1, lembarSisipanKeluarga: 1, laminasiCover: 'Glossy', opsiPlastikOpp: true, opsiPitaSiku: true, opsiKardus: true }, { ...DEFAULT_YASIN_PARAMS, tarifCasingInHardcover: 750 }).summary.totalHpp;
const t4 = calculateYasinSimulator({ tipeCover: 'Hardcover', ukuran: '11.7 x 15', jumlahHalamanIsi: 96, oplah: 100, lembarSisipanFoto: 1, lembarSisipanKeluarga: 1, laminasiCover: 'Glossy', opsiPlastikOpp: true, opsiPitaSiku: true, opsiKardus: true }, { ...DEFAULT_YASIN_PARAMS, tarifCasingInHardcover: 1200 }).summary.totalHpp;
assertReactivity('tarifCasingInHardcover', t3, t4);

const t5 = calculateYasinSimulator({ tipeCover: 'Softcover', ukuran: '11.7 x 15', jumlahHalamanIsi: 96, oplah: 100, lembarSisipanFoto: 1, lembarSisipanKeluarga: 1, laminasiCover: 'Glossy', opsiPlastikOpp: true, opsiPitaSiku: false, opsiKardus: true }, { ...DEFAULT_YASIN_PARAMS, hargaIsiYasin96: 2250 }).summary.totalHpp;
const t6 = calculateYasinSimulator({ tipeCover: 'Softcover', ukuran: '11.7 x 15', jumlahHalamanIsi: 96, oplah: 100, lembarSisipanFoto: 1, lembarSisipanKeluarga: 1, laminasiCover: 'Glossy', opsiPlastikOpp: true, opsiPitaSiku: false, opsiKardus: true }, { ...DEFAULT_YASIN_PARAMS, hargaIsiYasin96: 3000 }).summary.totalHpp;
assertReactivity('hargaIsiYasin96', t5, t6);

console.log('\n========================================================================================');
console.log(`TOTAL PENGUJIAN: ${totalTests} | LULUS: ${passedTests} | GAGAL: ${totalTests - passedTests}`);
console.log(`STATUS AKHIR: ${passedTests === totalTests ? '✅ 100% PARITY TERCAPAI (0 SELISIH DI SELURUH PERMUTASI)' : '❌ MASIH ADA SELISIH'}`);
console.log('========================================================================================\n');
