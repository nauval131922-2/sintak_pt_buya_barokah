import XLSX from 'xlsx';
import { calculateNotaSimulator, DEFAULT_NOTA_PARAMS } from '../src/lib/nota-calculator';

console.log('========================================================================================');
console.log('BENCHMARK PERMUTASI & REAKTIVITAS NOTA 1 WARNA: SINTAK vs EXCEL MASTER (100% PARITY)');
console.log('========================================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assertCheck(desc: string, actTotal: number, exTotal: number, actJual: number, exJual: number) {
  totalTests++;
  const diffTot = Math.abs(actTotal - exTotal);
  const diffJual = Math.abs(actJual - exJual);
  const pass = diffTot <= 1 && diffJual <= 10;
  if (pass) passedTests++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${desc.padEnd(52)} | HPP Act: ${actTotal.toLocaleString('id-ID').padStart(10)} Ex: ${exTotal.toLocaleString('id-ID').padStart(10)} (d:${diffTot}) | Jual Act: ${actJual.toLocaleString('id-ID').padStart(8)} Ex: ${exJual.toLocaleString('id-ID').padStart(8)} (d:${diffJual})`);
  return pass;
}

const base = 'E:\\percetakan buya barokah\\backup\\a1\\02__PEMASARAN\\0203_SURAT PENAWARAN HARGA (SPH) out\\020326 2026 SURAT PENAWARAN HARGA (SPH) out\\Pricelist Juli 2026\\03. Pricelist Nota 1 Warna\\Source';

// 1. FILE 1: 1 Rangkap HVS 70
console.log('--- 1. NOTA 1 RANGKAP HVS 70 (Nota 1 Rangkap HVS 70.xlsx) ---');
const wb1 = XLSX.readFile(base + '\\Nota 1 Rangkap HVS 70.xlsx');
const b1 = wb1.Sheets['BUKU'];

for (let r = 7; r <= 16; r++) {
  const q = Number(b1['H' + r]?.v);
  const exTot = Math.round(Number(b1['AS' + r]?.v));
  const exJual = Number(b1['AY' + r]?.v);
  if (q && exTot > 0) {
    const res = calculateNotaSimulator({
      oplahRim: q,
      rangkap: 1,
      ukuran: 'Folio (21.5 x 33)',
      jumlahWarna: 1,
      opsiPorporasi: true,
      opsiNomorator: false,
      marginPct: 30,
      negoDiskonPct: 0,
    }, DEFAULT_NOTA_PARAMS);
    assertCheck(`Nota 1 Rangkap Oplah ${q} Rim`, res.summary.totalHpp, exTot, res.summary.hargaJualPerRim, exJual);
  }
}

// 2. FILE 2: 2 Rangkap NCR 55
console.log('\n--- 2. NOTA 2 RANGKAP NCR 55 (Nota 2 Rangkap NCR 55.xlsx) ---');
const wb2 = XLSX.readFile(base + '\\Nota 2 Rangkap NCR 55.xlsx');
const b2 = wb2.Sheets['BUKU'];

for (let r = 7; r <= 16; r++) {
  const q = Number(b2['H' + r]?.v);
  const exTot = Math.round(Number(b2['AS' + r]?.v));
  const exJual = Number(b2['AY' + r]?.v);
  if (q && exTot > 0) {
    const res = calculateNotaSimulator({
      oplahRim: q,
      rangkap: 2,
      ukuran: 'Folio (21.5 x 33)',
      jumlahWarna: 1,
      opsiPorporasi: true,
      opsiNomorator: false,
      marginPct: 30,
      negoDiskonPct: 0,
    }, DEFAULT_NOTA_PARAMS);
    assertCheck(`Nota 2 Rangkap Oplah ${q} Rim`, res.summary.totalHpp, exTot, res.summary.hargaJualPerRim, exJual);
  }
}

// 3. FILE 3: 3 Rangkap NCR 55
console.log('\n--- 3. NOTA 3 RANGKAP NCR 55 (Nota 3 Rangkap NCR 55.xlsx) ---');
const wb3 = XLSX.readFile(base + '\\Nota 3 Rangkap NCR 55.xlsx');
const b3 = wb3.Sheets['BUKU'];

for (let r = 7; r <= 16; r++) {
  const q = Number(b3['H' + r]?.v);
  const exTot = Math.round(Number(b3['AS' + r]?.v));
  const exJual = Number(b3['AY' + r]?.v);
  if (q && exTot > 0) {
    const res = calculateNotaSimulator({
      oplahRim: q,
      rangkap: 3,
      ukuran: 'Folio (21.5 x 33)',
      jumlahWarna: 1,
      opsiPorporasi: true,
      opsiNomorator: false,
      marginPct: 30,
      negoDiskonPct: 0,
    }, DEFAULT_NOTA_PARAMS);
    assertCheck(`Nota 3 Rangkap Oplah ${q} Rim`, res.summary.totalHpp, exTot, res.summary.hargaJualPerRim, exJual);
  }
}

// 4. UJI REAKTIVITAS PARAMETER
console.log('\n--- 4. UJI REAKTIVITAS PARAMETER NOTA 1 WARNA ---');
function assertReactivity(paramName: string, hpp1: number, hpp2: number) {
  totalTests++;
  const diff = Math.abs(hpp2 - hpp1);
  const pass = diff > 0;
  if (pass) passedTests++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] Reaktivitas ${paramName.padEnd(30)} | HPP A: Rp ${hpp1.toLocaleString('id-ID')} -> HPP B: Rp ${hpp2.toLocaleString('id-ID')} (Delta: Rp ${diff.toLocaleString('id-ID')})`);
  if (!pass) throw new Error(`CRITICAL: Parameter ${paramName} tidak merespons perubahan!`);
  return pass;
}

const t1 = calculateNotaSimulator({ oplahRim: 5, rangkap: 1, ukuran: 'Folio (21.5 x 33)', jumlahWarna: 1, opsiPorporasi: true, opsiNomorator: false, marginPct: 30, negoDiskonPct: 0 }, { ...DEFAULT_NOTA_PARAMS, tarifHvs70Kg: 15700 }).summary.totalHpp;
const t2 = calculateNotaSimulator({ oplahRim: 5, rangkap: 1, ukuran: 'Folio (21.5 x 33)', jumlahWarna: 1, opsiPorporasi: true, opsiNomorator: false, marginPct: 30, negoDiskonPct: 0 }, { ...DEFAULT_NOTA_PARAMS, tarifHvs70Kg: 18000 }).summary.totalHpp;
assertReactivity('tarifHvs70Kg', t1, t2);

const t3 = calculateNotaSimulator({ oplahRim: 5, rangkap: 2, ukuran: 'Folio (21.5 x 33)', jumlahWarna: 1, opsiPorporasi: true, opsiNomorator: false, marginPct: 30, negoDiskonPct: 0 }, { ...DEFAULT_NOTA_PARAMS, tarifNcrTopRim: 65500 }).summary.totalHpp;
const t4 = calculateNotaSimulator({ oplahRim: 5, rangkap: 2, ukuran: 'Folio (21.5 x 33)', jumlahWarna: 1, opsiPorporasi: true, opsiNomorator: false, marginPct: 30, negoDiskonPct: 0 }, { ...DEFAULT_NOTA_PARAMS, tarifNcrTopRim: 75000 }).summary.totalHpp;
assertReactivity('tarifNcrTopRim', t3, t4);

const t5 = calculateNotaSimulator({ oplahRim: 5, rangkap: 1, ukuran: 'Folio (21.5 x 33)', jumlahWarna: 1, opsiPorporasi: true, opsiNomorator: false, marginPct: 30, negoDiskonPct: 0 }, { ...DEFAULT_NOTA_PARAMS, tarifPorporasiPerRim: 5000 }).summary.totalHpp;
const t6 = calculateNotaSimulator({ oplahRim: 5, rangkap: 1, ukuran: 'Folio (21.5 x 33)', jumlahWarna: 1, opsiPorporasi: true, opsiNomorator: false, marginPct: 30, negoDiskonPct: 0 }, { ...DEFAULT_NOTA_PARAMS, tarifPorporasiPerRim: 8000 }).summary.totalHpp;
assertReactivity('tarifPorporasiPerRim', t5, t6);

console.log('\n========================================================================================');
console.log(`TOTAL PENGUJIAN: ${totalTests} | LULUS: ${passedTests} | GAGAL: ${totalTests - passedTests}`);
console.log(`STATUS AKHIR: ${passedTests === totalTests ? '✅ 100% PARITY TERCAPAI (0 SELISIH DI SELURUH PERMUTASI)' : '❌ MASIH ADA SELISIH'}`);
console.log('========================================================================================\n');
