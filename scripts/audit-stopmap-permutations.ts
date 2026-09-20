import XLSX from 'xlsx';
import path from 'path';
import {
  calculateStopmapHpp,
  DEFAULT_STOPMAP_PARAMS,
  StopmapMasterParams,
  StopmapUkuranType,
  StopmapLaminasiType,
} from '../src/lib/stopmap-calculator';

console.log('========================================================================================');
console.log('BENCHMARK PERMUTASI & REAKTIVITAS STOPMAP: SINTAK vs EXCEL MASTER (100% PARITY)');
console.log('========================================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assertCheck(desc: string, actTotal: number, exTotal: number, actJual: number, exJual: number) {
  totalTests++;
  const diffTot = Math.abs(actTotal - exTotal);
  const diffJual = Math.abs(actJual - exJual);
  const pass = diffTot <= 1 && diffJual <= 10;
  if (pass) passedTests++;
  console.log(
    `[${pass ? 'PASS' : 'FAIL'}] ${desc.padEnd(52)} | HPP Act: ${actTotal.toLocaleString('id-ID').padStart(10)} Ex: ${exTotal.toLocaleString('id-ID').padStart(10)} (d:${diffTot.toFixed(2)}) | Jual Act: ${actJual.toLocaleString('id-ID').padStart(7)} Ex: ${exJual.toLocaleString('id-ID').padStart(7)} (d:${diffJual})`
  );
  return pass;
}

function assertReactivity(desc: string, baseHpp: number, newHpp: number) {
  totalTests++;
  const delta = Math.abs(newHpp - baseHpp);
  const pass = delta > 0;
  if (pass) passedTests++;
  console.log(
    `[${pass ? 'PASS' : 'FAIL'}] ${desc.padEnd(52)} | Base: ${baseHpp.toLocaleString('id-ID').padStart(10)} -> Mod: ${newHpp.toLocaleString('id-ID').padStart(10)} | Delta: ${delta.toLocaleString('id-ID')}`
  );
  return pass;
}

const baseDir =
  'E:\\percetakan buya barokah\\backup\\a1\\02__PEMASARAN\\0203_SURAT PENAWARAN HARGA (SPH) out\\020326 2026 SURAT PENAWARAN HARGA (SPH) out\\Pricelist Juli 2026\\07. Pricelist Stopmap\\Source';

// ==================================================================================
// 1. BENCHMARK MASTER STOPMAP A4 (Pricelist STOPMAP A4.xlsm - 12 TIERS)
// ==================================================================================
console.log('--- 1. STOPMAP A4 (Pricelist STOPMAP A4.xlsm - PRINT INTER POD) ---');
const wbA4 = XLSX.readFile(path.join(baseDir, 'Pricelist STOPMAP A4.xlsm'));
const bA4 = wbA4.Sheets['BUKU'];

for (let r = 7; r <= 18; r++) {
  const q = Number(bA4['H' + r]?.v);
  const exTot = Math.round(Number(bA4['BK' + r]?.v));
  const exJual = Number(bA4['BQ' + r]?.v);
  if (q && exTot > 0) {
    const res = calculateStopmapHpp(
      {
        oplah: q,
        ukuran: 'A4 (22 x 32 cm)',
        mesin: 'PRINT INTER',
        laminasi: 'Glossy',
        opsiPisauPonzBaru: false,
        opsiKardusLakban: true,
        marginPct: 30,
        negoDiskonPct: 5,
      },
      DEFAULT_STOPMAP_PARAMS
    );
    assertCheck(`Stopmap A4 Oplah ${q}`, res.totalHpp, exTot, res.hargaJualTensPerPcs, exJual);
  }
}

// ==================================================================================
// 2. BENCHMARK MASTER STOPMAP FOLIO (Pricelist STOPMAP FOLIO.xlsm - 12 TIERS)
// ==================================================================================
console.log('\n--- 2. STOPMAP FOLIO (Pricelist STOPMAP FOLIO.xlsm - OLIVER OFFSET) ---');
const wbFolio = XLSX.readFile(path.join(baseDir, 'Pricelist STOPMAP FOLIO.xlsm'));
const bFolio = wbFolio.Sheets['BUKU'];

for (let r = 7; r <= 18; r++) {
  const q = Number(bFolio['H' + r]?.v);
  const exTot = Math.round(Number(bFolio['BK' + r]?.v));
  const exJual = Number(bFolio['BQ' + r]?.v);
  if (q && exTot > 0) {
    const res = calculateStopmapHpp(
      {
        oplah: q,
        ukuran: 'FOLIO (24 x 35 cm)',
        mesin: 'Oliver',
        laminasi: 'Glossy',
        opsiPisauPonzBaru: false,
        opsiKardusLakban: true,
        marginPct: 30,
        negoDiskonPct: 5,
      },
      DEFAULT_STOPMAP_PARAMS
    );
    assertCheck(`Stopmap Folio Oplah ${q}`, res.totalHpp, exTot, res.hargaJualTensPerPcs, exJual);
  }
}

// ==================================================================================
// 3. BENCHMARK PERMUTASI LAMINASI, MESIN & FINISHING
// ==================================================================================
console.log('\n--- 3. UJI STRES PERMUTASI DROPDOWN & FINISHING ---');
const permutasiCases: {
  desc: string;
  oplah: number;
  ukuran: StopmapUkuranType;
  mesin: 'Auto' | 'PRINT INTER' | 'Oliver';
  laminasi: StopmapLaminasiType;
  opsiPisau: boolean;
  opsiPacking: boolean;
}[] = [
  { desc: 'A4 Oplah 100 - Auto (POD) - Glossy', oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'Auto', laminasi: 'Glossy', opsiPisau: false, opsiPacking: true },
  { desc: 'A4 Oplah 100 - Auto (POD) - Doff', oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'Auto', laminasi: 'Doff', opsiPisau: false, opsiPacking: true },
  { desc: 'A4 Oplah 100 - Auto (POD) - UV Varnish', oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'Auto', laminasi: 'UV Varnish', opsiPisau: false, opsiPacking: true },
  { desc: 'A4 Oplah 100 - Auto (POD) - Tanpa Laminasi', oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'Auto', laminasi: 'Tanpa Laminasi', opsiPisau: false, opsiPacking: true },
  { desc: 'A4 Oplah 100 - Force Oliver (Offset) - Glossy', oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'Oliver', laminasi: 'Glossy', opsiPisau: false, opsiPacking: true },
  { desc: 'A4 Oplah 100 - Pisau Ponz Baru Aktif', oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'Auto', laminasi: 'Glossy', opsiPisau: true, opsiPacking: true },
  { desc: 'A4 Oplah 100 - Tanpa Packing Kardus Lakban', oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'Auto', laminasi: 'Glossy', opsiPisau: false, opsiPacking: false },
  { desc: 'Folio Oplah 500 - Oliver - Glossy', oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy', opsiPisau: false, opsiPacking: true },
  { desc: 'Folio Oplah 500 - Oliver - Doff', oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Doff', opsiPisau: false, opsiPacking: true },
  { desc: 'Folio Oplah 500 - Oliver - UV Varnish', oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'UV Varnish', opsiPisau: false, opsiPacking: true },
  { desc: 'Folio Oplah 500 - Oliver - Pisau Ponz Baru', oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy', opsiPisau: true, opsiPacking: true },
];

for (const c of permutasiCases) {
  const r = calculateStopmapHpp(
    {
      oplah: c.oplah,
      ukuran: c.ukuran,
      mesin: c.mesin,
      laminasi: c.laminasi,
      opsiPisauPonzBaru: c.opsiPisau,
      opsiKardusLakban: c.opsiPacking,
      marginPct: 30,
      negoDiskonPct: 5,
    },
    DEFAULT_STOPMAP_PARAMS
  );
  totalTests++;
  const pass = r.totalHpp > 0 && r.hargaJualPerPcs > 0;
  if (pass) passedTests++;
  console.log(
    `[${pass ? 'PASS' : 'FAIL'}] ${c.desc.padEnd(52)} | HPP: Rp ${r.totalHpp.toLocaleString('id-ID').padStart(10)} | Hpp/Pcs: Rp ${Math.round(r.hppPerPcs).toLocaleString('id-ID')} | Jual: Rp ${r.hargaJualPerPcs.toLocaleString('id-ID')}`
  );
}

// ==================================================================================
// 4. UJI REAKTIVITAS PARAMETER (SENSITIVITY TEST: DELTA HPP > 0)
// ==================================================================================
console.log('\n--- 4. UJI REAKTIVITAS PARAMETER (WAJIB DELTA HPP > 0) ---');

// Base case A4 (POD)
const baseA4 = calculateStopmapHpp(
  { oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'PRINT INTER', laminasi: 'Glossy', opsiPisauPonzBaru: false, opsiKardusLakban: true },
  DEFAULT_STOPMAP_PARAMS
);

// Base case Folio (Oliver)
const baseFolio = calculateStopmapHpp(
  { oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy', opsiPisauPonzBaru: false, opsiKardusLakban: true },
  DEFAULT_STOPMAP_PARAMS
);

// Test 1: UMR
const rUmr = calculateStopmapHpp(
  { oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'PRINT INTER', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, standarUMR: 3500000 }
);
assertReactivity('Reaktivitas: Standar UMR', baseA4.totalHpp, rUmr.totalHpp);

// Test 2: Tarif Kertas Art Carton /Kg
const rKertas = calculateStopmapHpp(
  { oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, tarifArtCartonKg: 19000 }
);
assertReactivity('Reaktivitas: Tarif Art Carton /Kg', baseFolio.totalHpp, rKertas.totalHpp);

// Test 3: Up Kertas %
const rUpKertas = calculateStopmapHpp(
  { oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, upArtCartonPct: 10 }
);
assertReactivity('Reaktivitas: Up Art Carton %', baseFolio.totalHpp, rUpKertas.totalHpp);

// Test 4: Tarif Print A3
const rPrintA3 = calculateStopmapHpp(
  { oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'PRINT INTER', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, tarifPrintA3: 3500 }
);
assertReactivity('Reaktivitas: Tarif Print A3+ Digital', baseA4.totalHpp, rPrintA3.totalHpp);

// Test 5: Insheet Cover Print Inter
const rInCoverPod = calculateStopmapHpp(
  { oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'PRINT INTER', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, insheetCoverPrintInter: 15 }
);
assertReactivity('Reaktivitas: Insheet Cover Print Inter', baseA4.totalHpp, rInCoverPod.totalHpp);

// Test 6: Insheet Cover Oliver
const rInCoverOliver = calculateStopmapHpp(
  { oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, insheetCoverOliver: 250 }
);
assertReactivity('Reaktivitas: Insheet Cover Oliver', baseFolio.totalHpp, rInCoverOliver.totalHpp);

// Test 7: Tarif Plat Oliver
const rPlat = calculateStopmapHpp(
  { oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, tarifPlatOliver: 60000 }
);
assertReactivity('Reaktivitas: Tarif Plat Cetak Oliver', baseFolio.totalHpp, rPlat.totalHpp);

// Test 8: Min Order Cetak Oliver
const rMinOrder = calculateStopmapHpp(
  { oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, minOrderOliver: 120000 }
);
assertReactivity('Reaktivitas: Min Order Cetak Oliver', baseFolio.totalHpp, rMinOrder.totalHpp);

// Test 9: Tarif Drek Over Oliver (pada oplah 2000 > 1000 drek)
const baseFolio2000 = calculateStopmapHpp(
  { oplah: 2000, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy' },
  DEFAULT_STOPMAP_PARAMS
);
const rDrekOver = calculateStopmapHpp(
  { oplah: 2000, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, tarifDrekOverOliver: 75 }
);
assertReactivity('Reaktivitas: Tarif Drek Over Oliver', baseFolio2000.totalHpp, rDrekOver.totalHpp);

// Test 10: Desain Artwork A4
const rDesainA4 = calculateStopmapHpp(
  { oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'PRINT INTER', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, tarifDesainA4: 25000 }
);
assertReactivity('Reaktivitas: Desain Artwork A4', baseA4.totalHpp, rDesainA4.totalHpp);

// Test 11: Desain Artwork Folio
const rDesainFolio = calculateStopmapHpp(
  { oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, tarifDesainFolio: 50000 }
);
assertReactivity('Reaktivitas: Desain Artwork Folio', baseFolio.totalHpp, rDesainFolio.totalHpp);

// Test 12: Transportasi Folio
const rTransportFolio = calculateStopmapHpp(
  { oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, tarifTransportFolio: 60000 }
);
assertReactivity('Reaktivitas: Transportasi Folio', baseFolio.totalHpp, rTransportFolio.totalHpp);

// Test 13: Insheet Plano Kupingan
const rInKupA4 = calculateStopmapHpp(
  { oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'PRINT INTER', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, insheetPlanoKupinganA4: 6 }
);
assertReactivity('Reaktivitas: Insheet Plano Kupingan A4', baseA4.totalHpp, rInKupA4.totalHpp);

// Test 14: Target Lipat Stopmap
const rLipat = calculateStopmapHpp(
  { oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'PRINT INTER', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, targetLipatPerHari: 2000 }
);
assertReactivity('Reaktivitas: Target Lipat Stopmap', baseA4.totalHpp, rLipat.totalHpp);

// Test 15: Target Ponz Kupingan
const rPonz = calculateStopmapHpp(
  { oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'PRINT INTER', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, targetPonzPerHari: 1000 }
);
assertReactivity('Reaktivitas: Target Ponz Kupingan', baseA4.totalHpp, rPonz.totalHpp);

// Test 16: Biaya Lem Kupingan
const rLem = calculateStopmapHpp(
  { oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'PRINT INTER', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, biayaLemKupinganPerPcs: 100 }
);
assertReactivity('Reaktivitas: Biaya Lem Kupingan /Pcs', baseA4.totalHpp, rLem.totalHpp);

// Test 17: Target Pasang Kupingan
const rPasang = calculateStopmapHpp(
  { oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'PRINT INTER', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, targetPasangPerHari: 250 }
);
assertReactivity('Reaktivitas: Target Pasang Kupingan', baseA4.totalHpp, rPasang.totalHpp);

// Test 18: Tarif Laminasi Glossy (pada oplah 500 di atas minimum)
const rLamGlossy = calculateStopmapHpp(
  { oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, tarifLaminasiGlossyCm2: 0.50 }
);
assertReactivity('Reaktivitas: Tarif Laminasi Glossy /Cm²', baseFolio.totalHpp, rLamGlossy.totalHpp);

// Test 19: Tarif Laminasi Doff (pada oplah 500 di atas minimum)
const baseFolioDoff = calculateStopmapHpp(
  { oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Doff' },
  DEFAULT_STOPMAP_PARAMS
);
const rLamDoff = calculateStopmapHpp(
  { oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Doff' },
  { ...DEFAULT_STOPMAP_PARAMS, tarifLaminasiDoffCm2: 0.60 }
);
assertReactivity('Reaktivitas: Tarif Laminasi Doff /Cm²', baseFolioDoff.totalHpp, rLamDoff.totalHpp);

// Test 20: Minimum Laminasi (pada oplah 10 di mana raw < minimum)
const baseA4_10 = calculateStopmapHpp(
  { oplah: 10, ukuran: 'A4 (22 x 32 cm)', mesin: 'PRINT INTER', laminasi: 'Glossy' },
  DEFAULT_STOPMAP_PARAMS
);
const rMinLam = calculateStopmapHpp(
  { oplah: 10, ukuran: 'A4 (22 x 32 cm)', mesin: 'PRINT INTER', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, minLaminasi: 75000 }
);
assertReactivity('Reaktivitas: Minimum Order Laminasi', baseA4_10.totalHpp, rMinLam.totalHpp);

// Test 21: Kardus Box
const rKardus = calculateStopmapHpp(
  { oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, tarifKardusBox: 15000 }
);
assertReactivity('Reaktivitas: Tarif Kardus Box', baseFolio.totalHpp, rKardus.totalHpp);

// Test 22: Lakban Roll
const rLakban = calculateStopmapHpp(
  { oplah: 500, ukuran: 'FOLIO (24 x 35 cm)', mesin: 'Oliver', laminasi: 'Glossy' },
  { ...DEFAULT_STOPMAP_PARAMS, tarifLakbanRoll: 16000 }
);
assertReactivity('Reaktivitas: Tarif Lakban Roll', baseFolio.totalHpp, rLakban.totalHpp);

// Test 23: Margin % (cek delta harga jual)
const rMargin = calculateStopmapHpp(
  { oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'PRINT INTER', laminasi: 'Glossy', marginPct: 40 },
  DEFAULT_STOPMAP_PARAMS
);
totalTests++;
const passMargin = rMargin.hargaJualPerPcs > baseA4.hargaJualPerPcs;
if (passMargin) passedTests++;
console.log(
  `[${passMargin ? 'PASS' : 'FAIL'}] ${'Reaktivitas: Margin Laba % (Harga Jual)'.padEnd(52)} | Base: Rp ${baseA4.hargaJualPerPcs.toLocaleString('id-ID')} -> Mod: Rp ${rMargin.hargaJualPerPcs.toLocaleString('id-ID')} | Delta: ${(rMargin.hargaJualPerPcs - baseA4.hargaJualPerPcs).toLocaleString('id-ID')}`
);

// Test 24: Nego Diskon % (cek delta harga nego)
const rNego = calculateStopmapHpp(
  { oplah: 100, ukuran: 'A4 (22 x 32 cm)', mesin: 'PRINT INTER', laminasi: 'Glossy', negoDiskonPct: 10 },
  DEFAULT_STOPMAP_PARAMS
);
totalTests++;
const passNego = rNego.hargaNegoPerPcs < baseA4.hargaNegoPerPcs;
if (passNego) passedTests++;
console.log(
  `[${passNego ? 'PASS' : 'FAIL'}] ${'Reaktivitas: Nego Diskon % (Harga Nego)'.padEnd(52)} | Base: Rp ${baseA4.hargaNegoPerPcs.toLocaleString('id-ID')} -> Mod: Rp ${rNego.hargaNegoPerPcs.toLocaleString('id-ID')} | Delta: ${(baseA4.hargaNegoPerPcs - rNego.hargaNegoPerPcs).toLocaleString('id-ID')}`
);

console.log('========================================================================================');
console.log(`HASIL AKHIR BENCHMARK: ${passedTests} / ${totalTests} PENGUJIAN LULUS (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
console.log('========================================================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
