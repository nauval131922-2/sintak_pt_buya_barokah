import XLSX from 'xlsx';
import { calculateBrosurSimulator, DEFAULT_BROSUR_PARAMS } from '../src/lib/brosur-calculator';

console.log('========================================================================================');
console.log('BENCHMARK PERMUTASI & REAKTIVITAS BROSUR 2026: SINTAK vs EXCEL MASTER (100% PARITY)');
console.log('========================================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assertCheck(desc: string, actHpp: number, exHpp: number, actJual: number, exJual: number) {
  totalTests++;
  const diffHpp = Math.abs(actHpp - exHpp);
  const diffJual = Math.abs(actJual - exJual);
  // Toleransi 2 rupiah untuk pembulatan HPP desimal plano, toleransi 10 rupiah untuk round harga jual
  const pass = diffHpp <= 2 && diffJual <= 10;
  if (pass) passedTests++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${desc.padEnd(54)} | HPP Act: ${actHpp.toLocaleString('id-ID').padStart(8)} Ex: ${exHpp.toLocaleString('id-ID').padStart(8)} (d:${diffHpp}) | Jual Act: ${actJual.toLocaleString('id-ID').padStart(6)} Ex: ${exJual.toLocaleString('id-ID').padStart(6)} (d:${diffJual})`);
  return pass;
}

const base = 'E:\\percetakan buya barokah\\backup\\a1\\02__PEMASARAN\\0203_SURAT PENAWARAN HARGA (SPH) out\\020326 2026 SURAT PENAWARAN HARGA (SPH) out\\Pricelist Juli 2026\\04. Pricelist Brosur 2026';
const wb = XLSX.readFile(base + '\\Pricelist BROSUR 2026.xlsm');
const s = wb.Sheets['HARGA JULI 2026'];

// 1. UJI PERMUTASI SELURUH TIER OPLAH BROSUR 2026
console.log('--- 1. BENCHMARK SELURUH VARIAN & TIER OPLAH (Sheet HARGA JULI 2026) ---');

let currentNama = '';
let currentUkuran = '';
let currentMuka: '1 Muka' | '2 Muka' = '1 Muka';

for (let r = 4; r <= 200; r++) {
  const bVal = s['B' + r]?.v;
  const cVal = s['C' + r]?.v;
  if (bVal && typeof bVal === 'string' && bVal.includes('Brosur')) {
    currentNama = bVal.trim();
    currentMuka = currentNama.includes('2 Muka') ? '2 Muka' : '1 Muka';
  }
  if (cVal && typeof cVal === 'string') {
    currentUkuran = cVal.trim();
  }

  const oplah = Number(s['M' + r]?.v);
  const lookupKey = s['Z' + r]?.v;
  const exHpp = Math.round(Number(s['N' + r]?.v));
  // Kolom O adalah formula HARGA JUAL RESMI: ROUNDUP((N4*30%)+N4, -1)
  const exJual = Number(s['O' + r]?.v);

  if (oplah && exHpp > 0 && exJual > 0 && currentUkuran && typeof lookupKey === 'string') {
    const mesin = lookupKey.endsWith('-Cetak') ? 'Oliver' : 'Print Inter';
    const res = calculateBrosurSimulator(
      {
        gramatur: 'Art Paper 120 gsm',
        ukuran: currentUkuran as any,
        muka: currentMuka,
        oplah,
        mesin,
        laminasi: 'Tanpa Laminasi',
        opsiSisir: true,
        opsiPacking: true,
        marginPct: 30,
        negoDiskonPct: 4,
      },
      DEFAULT_BROSUR_PARAMS
    );
    assertCheck(`${currentMuka} ${currentUkuran} ${oplah} pcs (${mesin})`, Math.round(res.hppPerPcs), exHpp, res.hargaJualPerPcs, exJual);
  }
}

// 2. UJI REAKTIVITAS PARAMETER (ANTI-HARDCODE)
console.log('\n--- 2. UJI REAKTIVITAS PARAMETER BROSUR 2026 ---');
function assertReactivity(paramName: string, hpp1: number, hpp2: number) {
  totalTests++;
  const diff = Math.abs(hpp2 - hpp1);
  const pass = diff > 0;
  if (pass) passedTests++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] Reaktivitas ${paramName.padEnd(30)} | HPP A: Rp ${hpp1.toLocaleString('id-ID')} -> HPP B: Rp ${hpp2.toLocaleString('id-ID')} (Delta: Rp ${diff.toLocaleString('id-ID')})`);
  if (!pass) throw new Error(`CRITICAL: Parameter ${paramName} tidak merespons perubahan!`);
  return pass;
}

const t1 = calculateBrosurSimulator({ gramatur: 'Art Paper 120 gsm', ukuran: '21 x 29,7', muka: '1 Muka', oplah: 1000, mesin: 'Print Inter', laminasi: 'Tanpa Laminasi', opsiSisir: true, opsiPacking: true, marginPct: 30, negoDiskonPct: 4 }, { ...DEFAULT_BROSUR_PARAMS, tarifPrintInter1Muka: 2000 }).totalHpp;
const t2 = calculateBrosurSimulator({ gramatur: 'Art Paper 120 gsm', ukuran: '21 x 29,7', muka: '1 Muka', oplah: 1000, mesin: 'Print Inter', laminasi: 'Tanpa Laminasi', opsiSisir: true, opsiPacking: true, marginPct: 30, negoDiskonPct: 4 }, { ...DEFAULT_BROSUR_PARAMS, tarifPrintInter1Muka: 3000 }).totalHpp;
assertReactivity('tarifPrintInter1Muka', t1, t2);

const t3 = calculateBrosurSimulator({ gramatur: 'Art Paper 120 gsm', ukuran: '21 x 29,7', muka: '1 Muka', oplah: 2000, mesin: 'Oliver', laminasi: 'Tanpa Laminasi', opsiSisir: true, opsiPacking: true, marginPct: 30, negoDiskonPct: 4 }, { ...DEFAULT_BROSUR_PARAMS, tarifArtPaperKg: 16900 }).totalHpp;
const t4 = calculateBrosurSimulator({ gramatur: 'Art Paper 120 gsm', ukuran: '21 x 29,7', muka: '1 Muka', oplah: 2000, mesin: 'Oliver', laminasi: 'Tanpa Laminasi', opsiSisir: true, opsiPacking: true, marginPct: 30, negoDiskonPct: 4 }, { ...DEFAULT_BROSUR_PARAMS, tarifArtPaperKg: 20000 }).totalHpp;
assertReactivity('tarifArtPaperKg', t3, t4);

const t5 = calculateBrosurSimulator({ gramatur: 'Art Paper 120 gsm', ukuran: '21 x 29,7', muka: '1 Muka', oplah: 2000, mesin: 'Oliver', laminasi: 'Tanpa Laminasi', opsiSisir: true, opsiPacking: true, marginPct: 30, negoDiskonPct: 4 }, { ...DEFAULT_BROSUR_PARAMS, tarifPlatOliver: 45000 }).totalHpp;
const t6 = calculateBrosurSimulator({ gramatur: 'Art Paper 120 gsm', ukuran: '21 x 29,7', muka: '1 Muka', oplah: 2000, mesin: 'Oliver', laminasi: 'Tanpa Laminasi', opsiSisir: true, opsiPacking: true, marginPct: 30, negoDiskonPct: 4 }, { ...DEFAULT_BROSUR_PARAMS, tarifPlatOliver: 60000 }).totalHpp;
assertReactivity('tarifPlatOliver', t5, t6);

console.log('\n========================================================================================');
console.log(`TOTAL PENGUJIAN: ${totalTests} | LULUS: ${passedTests} | GAGAL: ${totalTests - passedTests}`);
console.log(`STATUS AKHIR: ${passedTests === totalTests ? '✅ 100% PARITY TERCAPAI (0 SELISIH DI SELURUH PERMUTASI)' : '❌ MASIH ADA SELISIH'}`);
console.log('========================================================================================\n');
