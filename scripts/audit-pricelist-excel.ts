import { calculateYasinSimulator, DEFAULT_YASIN_PARAMS } from '../src/lib/yasin-calculator';
import { calculateManasikSimulator, DEFAULT_MANASIK_PARAMS } from '../src/lib/manasik-calculator';

console.log('===============================================================');
console.log('AUDIT MEKANIS PRICELIST: SINTAK vs MASTER EXCEL DRIVE H:');
console.log('===============================================================\n');

let totalTests = 0;
let passTests = 0;

function assertEqual(desc: string, actual: number, expected: number, tolerance = 0) {
  totalTests++;
  const diff = Math.abs(actual - expected);
  const pass = diff <= tolerance;
  if (pass) passTests++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${desc.padEnd(50)} | SINTAK: ${actual.toLocaleString('id-ID')} | EXCEL: ${expected.toLocaleString('id-ID')} | Diff: ${diff}`);
  return pass;
}

// 1. AUDIT YASIN 128 HALAMAN (Pricelist yasin 128.xlsx)
console.log('--- 1. BUKU YASIN 128 HALAMAN (Pricelist yasin 128.xlsx) ---');
const yasin128Cases = [
  { q: 20, exTot: 213250, exHpp: 10663, exJual: 13870 },
  { q: 30, exTot: 262800, exHpp: 8760, exJual: 11390 },
  { q: 50, exTot: 369450, exHpp: 7389, exJual: 9610 },
  { q: 70, exTot: 471050, exHpp: 6729, exJual: 8750 },
  { q: 100, exTot: 627250, exHpp: 6273, exJual: 8160 },
  { q: 125, exTot: 763900, exHpp: 6111, exJual: 7950 },
  { q: 150, exTot: 891550, exHpp: 5944, exJual: 7730 },
  { q: 175, exTot: 1021700, exHpp: 5838, exJual: 7590 },
  { q: 200, exTot: 1149350, exHpp: 5747, exJual: 7480 },
  { q: 225, exTot: 1291050, exHpp: 5738, exJual: 7460 },
  { q: 250, exTot: 1421200, exHpp: 5685, exJual: 7400 },
  { q: 500, exTot: 2746570, exHpp: 5493, exJual: 7150 },
  { q: 600, exTot: 3282334, exHpp: 5471, exJual: 7120 },
];

for (const c of yasin128Cases) {
  const res = calculateYasinSimulator({
    tipeCover: 'Softcover',
    ukuran: '11.7 x 15',
    jumlahHalamanIsi: 128,
    oplah: c.q,
    lembarSisipanFoto: 1,
    lembarSisipanKeluarga: 1,
    laminasiCover: 'Glossy',
    opsiPlastikOpp: true,
    opsiPitaSiku: false,
    opsiKardus: true,
    marginPct: 30,
    negoDiskonPct: 0,
  }, DEFAULT_YASIN_PARAMS);

  assertEqual(`Yasin 128 (Oplah ${c.q}) - Total Biaya`, res.summary.totalHpp, c.exTot);
  assertEqual(`Yasin 128 (Oplah ${c.q}) - HPP/Pcs`, res.summary.hppPerPcs, c.exHpp, 1);
  assertEqual(`Yasin 128 (Oplah ${c.q}) - Harga Jual`, res.summary.hargaJualPerPcs, c.exJual);
}

// 2. AUDIT YASIN 96 HALAMAN (Pricelist yasin 96.xlsx)
console.log('\n--- 2. BUKU YASIN 96 HALAMAN (Pricelist yasin 96.xlsx) ---');
const yasin96Cases = [
  { q: 20, exTot: 198250, exHpp: 9913, exJual: 12890 },
  { q: 50, exTot: 331950, exHpp: 6639, exJual: 8640 },
  { q: 100, exTot: 552250, exHpp: 5523, exJual: 7180 },
  { q: 500, exTot: 2371570, exHpp: 4743, exJual: 6170 },
];

for (const c of yasin96Cases) {
  const res = calculateYasinSimulator({
    tipeCover: 'Softcover',
    ukuran: '11.7 x 15',
    jumlahHalamanIsi: 96,
    oplah: c.q,
    lembarSisipanFoto: 1,
    lembarSisipanKeluarga: 1,
    laminasiCover: 'Glossy',
    opsiPlastikOpp: true,
    opsiPitaSiku: false,
    opsiKardus: true,
    marginPct: 30,
    negoDiskonPct: 0,
  }, DEFAULT_YASIN_PARAMS);

  assertEqual(`Yasin 96 (Oplah ${c.q}) - Total Biaya`, res.summary.totalHpp, c.exTot);
  assertEqual(`Yasin 96 (Oplah ${c.q}) - HPP/Pcs`, res.summary.hppPerPcs, c.exHpp, 1);
  assertEqual(`Yasin 96 (Oplah ${c.q}) - Harga Jual`, res.summary.hargaJualPerPcs, c.exJual);
}

// 3. AUDIT MANASIK (Custom Cover 2026.xlsm)
console.log('\n--- 3. BUKU MANASIK CUSTOM COVER (Custom Cover 2026.xlsm) ---');
const manasikCases = [
  { q: 20, exTot: 232463, exHpp: 11623, exJual: 15120 },
  { q: 100, exTot: 722557, exHpp: 7226, exJual: 9400 },
  { q: 500, exTot: 3209227, exHpp: 6418, exJual: 8350 },
];

for (const c of manasikCases) {
  const res = calculateManasikSimulator({
    varian: 'Custom Cover 10 x 15,5',
    oplah: c.q,
    jumlahHalaman: 216,
    tipeJilid: 'Tali Kur',
    metodeCetakCover: 'Print Digital (A3+)',
    laminasiCover: 'Doff',
    opsiPlastikOpp: true,
    opsiKardus: true,
    opsiSisipan: true,
    marginPct: 30,
    negoDiskonPct: 0,
  }, DEFAULT_MANASIK_PARAMS);

  assertEqual(`Manasik Custom (Oplah ${c.q}) - Total Biaya`, res.summary.totalHpp, c.exTot);
  assertEqual(`Manasik Custom (Oplah ${c.q}) - HPP/Pcs`, res.summary.hppPerPcs, c.exHpp, 1);
  assertEqual(`Manasik Custom (Oplah ${c.q}) - Harga Jual`, res.summary.hargaJualPerPcs, c.exJual);
}

console.log('\n===============================================================');
console.log(`HASIL AKHIR: ${passTests}/${totalTests} TESTS PASS (${Math.round((passTests/totalTests)*100)}%)`);
console.log('===============================================================');
if (passTests !== totalTests) {
  process.exit(1);
}
