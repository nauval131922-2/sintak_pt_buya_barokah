import XLSX from 'xlsx';
import path from 'path';
import { calculateLabelKhqHpp, DEFAULT_LABEL_KHQ_PARAMS } from '../src/lib/label-khq-calculator';

console.log('========================================================================================');
console.log('BENCHMARK PERMUTASI & REAKTIVITAS LABEL KHQ: SINTAK vs FILE SOURCE (100% PARITY)');
console.log('========================================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assertCheck(desc: string, actHpp: number, exHpp: number, actJual: number, exJual: number) {
  totalTests++;
  const diffHpp = Math.abs(actHpp - exHpp);
  const diffJual = Math.abs(actJual - exJual);
  const pass = diffHpp <= 1 && diffJual <= 1;
  if (pass) passedTests++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${desc.padEnd(46)} | HPP Act: ${actHpp.toLocaleString('id-ID').padStart(5)} Ex: ${exHpp.toLocaleString('id-ID').padStart(5)} (d:${diffHpp}) | Jual Act: ${actJual.toLocaleString('id-ID').padStart(5)} Ex: ${exJual.toLocaleString('id-ID').padStart(5)} (d:${diffJual})`);
  return pass;
}

const base = 'E:\\percetakan buya barokah\\backup\\a1\\02__PEMASARAN\\0203_SURAT PENAWARAN HARGA (SPH) out\\020326 2026 SURAT PENAWARAN HARGA (SPH) out\\Pricelist Juli 2026\\05. Pricelist Label KHQ\\Source';

// 1. BENCHMARK SAMPLE 220 ML, 330 ML, 600 ML
console.log('--- 1. BENCHMARK MULTI-VARIAN LABEL KHQ (220 ML, 330 ML, 600 ML) ---');

const testCases = [
  // 220 ml
  { f: 'Label KHQ 220 ml 5 - 22 kardus.xlsm', varian: 'KHQ 220 ml' as const },
  { f: 'Label KHQ 220 ml 23 - 40 kardus.xlsm', varian: 'KHQ 220 ml' as const },
  { f: 'Label KHQ 220 ml 41 - 58 kardus.xlsm', varian: 'KHQ 220 ml' as const },
  { f: 'Label KHQ 220 ml 95 - 112 kardus.xlsm', varian: 'KHQ 220 ml' as const },
  { f: 'Label KHQ 220 ml 203 - 220 kardus.xlsm', varian: 'KHQ 220 ml' as const },

  // 330 ml
  { f: 'Label KHQ 330 ml 5 - 22 kardus.xlsm', varian: 'KHQ 330 ml' as const },
  { f: 'Label KHQ 330 ml 23 - 40 kardus.xlsm', varian: 'KHQ 330 ml' as const },
  { f: 'Label KHQ 330 ml 41 - 58 kardus.xlsm', varian: 'KHQ 330 ml' as const },
  { f: 'Label KHQ 330 ml 95 - 112 kardus.xlsm', varian: 'KHQ 330 ml' as const },
  { f: 'Label KHQ 330 ml 203 - 220 kardus.xlsm', varian: 'KHQ 330 ml' as const },

  // 600 ml
  { f: 'Label KHQ 600 ml 5 - 22 kardus.xlsm', varian: 'KHQ 600 ml' as const },
  { f: 'Label KHQ 600 ml 41 - 58 kardus.xlsm', varian: 'KHQ 600 ml' as const },
  { f: 'Label KHQ 600 ml 59 - 76 kardus.xlsm', varian: 'KHQ 600 ml' as const },
  { f: 'Label KHQ 600 ml 95 - 112 kardus.xlsm', varian: 'KHQ 600 ml' as const },
  { f: 'Label KHQ 600 ml 203 - 220 kardus.xlsm', varian: 'KHQ 600 ml' as const },
];

for (const tc of testCases) {
  const wb = XLSX.readFile(path.join(base, tc.f));
  const b = wb.Sheets['BUKU'];
  const lbr = Number(b['H7']?.v);
  const kardus = Math.round(lbr / 24);
  const exHpp = Math.round(Number(b['BE7']?.v));
  const exJual = Math.round(Number(b['BJ7']?.v));

  const res = calculateLabelKhqHpp({ varian: tc.varian, jumlahKardus: kardus, marginPct: 30, negoDiskonPct: 4 }, DEFAULT_LABEL_KHQ_PARAMS);
  assertCheck(`${tc.varian} (${kardus} kardus)`, Math.round(res.hppPerLbr), exHpp, res.hargaJualPerLbr, exJual);
}

// 2. UJI REAKTIVITAS PARAMETER (ANTI-HARDCODE)
console.log('\n--- 2. UJI REAKTIVITAS PARAMETER LABEL KHQ ---');
function assertReactivity(paramName: string, hpp1: number, hpp2: number) {
  totalTests++;
  const diff = Math.abs(hpp2 - hpp1);
  const pass = diff > 0;
  if (pass) passedTests++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] Reaktivitas ${paramName.padEnd(30)} | HPP A: Rp ${hpp1.toLocaleString('id-ID')} -> HPP B: Rp ${hpp2.toLocaleString('id-ID')} (Delta: Rp ${diff.toLocaleString('id-ID')})`);
  if (!pass) throw new Error(`CRITICAL: Parameter ${paramName} tidak merespons perubahan!`);
  return pass;
}

const t1 = calculateLabelKhqHpp({ varian: 'KHQ 220 ml', jumlahKardus: 10, marginPct: 30, negoDiskonPct: 4 }, { ...DEFAULT_LABEL_KHQ_PARAMS, tarifPrintA3: 2000 }).totalHpp;
const t2 = calculateLabelKhqHpp({ varian: 'KHQ 220 ml', jumlahKardus: 10, marginPct: 30, negoDiskonPct: 4 }, { ...DEFAULT_LABEL_KHQ_PARAMS, tarifPrintA3: 2500 }).totalHpp;
assertReactivity('tarifPrintA3', t1, t2);

const t3 = calculateLabelKhqHpp({ varian: 'KHQ 220 ml', jumlahKardus: 10, marginPct: 30, negoDiskonPct: 4 }, { ...DEFAULT_LABEL_KHQ_PARAMS, tarifRajangPerPcs: 50 }).totalHpp;
const t4 = calculateLabelKhqHpp({ varian: 'KHQ 220 ml', jumlahKardus: 10, marginPct: 30, negoDiskonPct: 4 }, { ...DEFAULT_LABEL_KHQ_PARAMS, tarifRajangPerPcs: 100 }).totalHpp;
assertReactivity('tarifRajangPerPcs', t3, t4);

const t5 = calculateLabelKhqHpp({ varian: 'KHQ 220 ml', jumlahKardus: 10, marginPct: 30, negoDiskonPct: 4 }, { ...DEFAULT_LABEL_KHQ_PARAMS, tarifDesain: 30000 }).totalHpp;
const t6 = calculateLabelKhqHpp({ varian: 'KHQ 220 ml', jumlahKardus: 10, marginPct: 30, negoDiskonPct: 4 }, { ...DEFAULT_LABEL_KHQ_PARAMS, tarifDesain: 50000 }).totalHpp;
assertReactivity('tarifDesain', t5, t6);

console.log('\n========================================================================================');
console.log(`TOTAL PENGUJIAN: ${totalTests} | LULUS: ${passedTests} | GAGAL: ${totalTests - passedTests}`);
console.log(`STATUS AKHIR: ${passedTests === totalTests ? '✅ 100% PARITY TERCAPAI (0 SELISIH DI SELURUH PERMUTASI)' : '❌ MASIH ADA SELISIH'}`);
console.log('========================================================================================\n');
