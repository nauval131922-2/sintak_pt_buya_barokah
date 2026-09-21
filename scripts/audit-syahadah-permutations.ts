import XLSX from 'xlsx';
import path from 'path';
import {
  calculateSyahadahHpp,
  DEFAULT_SYAHADAH_PARAMS,
  SyahadahMasterParams,
  SyahadahVarianType,
  SyahadahLaminasiType,
} from '../src/lib/syahadah-calculator';

console.log('========================================================================================');
console.log('BENCHMARK PERMUTASI & REAKTIVITAS SYAHADAH: SINTAK vs EXCEL MASTER (100% PARITY)');
console.log('========================================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assertCheck(desc: string, actHpp: number, exHpp: number, actJual: number, exJual: number) {
  totalTests++;
  const diffHpp = Math.abs(actHpp - exHpp);
  const diffJual = Math.abs(actJual - exJual);
  const pass = diffHpp <= 0.05 && diffJual === 0;
  if (pass) passedTests++;
  console.log(
    `[${pass ? 'PASS' : 'FAIL'}] ${desc.padEnd(52)} | HPP Act: ${actHpp.toFixed(2).padStart(8)} Ex: ${exHpp.toFixed(2).padStart(8)} (d:${diffHpp.toFixed(2)}) | Jual Act: ${actJual.toLocaleString('id-ID').padStart(6)} Ex: ${exJual.toLocaleString('id-ID').padStart(6)} (d:${diffJual})`
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

const parentFolder =
  'E:\\percetakan buya barokah\\backup\\a1\\02__PEMASARAN\\0203_SURAT PENAWARAN HARGA (SPH) out\\020326 2026 SURAT PENAWARAN HARGA (SPH) out\\Pricelist Juli 2026\\08. Pricelist Syahadah';
const wbParent = XLSX.readFile(path.join(parentFolder, 'Pricelist Syahadah.xlsx'));
const ws = wbParent.Sheets['HARGA JULI 2026'];

// ==================================================================================
// 1. BENCHMARK SELURUH 76 TIER OPLAH & 6 SECTION (Sheet HARGA JULI 2026)
// ==================================================================================
console.log('--- 1. BENCHMARK MATRIKS SHEET HARGA JULI 2026 (76 TIERS) ---');

const sections: {
  startRow: number;
  endRow: number;
  varian: SyahadahVarianType;
  name: string;
}[] = [
  { startRow: 4, endRow: 15, varian: '1 Muka FC', name: '1 Muka FC' },
  { startRow: 18, endRow: 31, varian: '1 Muka 1 Warna', name: '1 Muka 1 Warna' },
  { startRow: 33, endRow: 46, varian: '1 Muka 2 Warna', name: '1 Muka 2 Warna' },
  { startRow: 50, endRow: 61, varian: '2 Muka FC', name: '2 Muka FC' },
  { startRow: 64, endRow: 77, varian: '2 Muka 1 Warna', name: '2 Muka 1 Warna' },
  { startRow: 79, endRow: 92, varian: '2 Muka 2 Warna', name: '2 Muka 2 Warna' },
];

for (const sec of sections) {
  console.log(`\n>> Sub-Section: ${sec.name}`);
  for (let r = sec.startRow; r <= sec.endRow; r++) {
    const q = ws['N' + r]?.v;
    const exHpp = ws['O' + r]?.v;
    const exJual = ws['P' + r]?.v;
    const met = ws['L' + r]?.v;

    if (!q || Number(q) <= 0 || exHpp === undefined) continue;

    const oplah = Number(q);
    const res = calculateSyahadahHpp(
      {
        oplah,
        varian: sec.varian,
        mesin: met === 'Print' ? 'Print Inter' : 'Ryobi',
        laminasi: 'Tanpa Laminasi',
        opsiFoil: false,
        opsiKardusLakban: met === 'Cetak',
        marginPct: 30,
        negoDiskonPct: 5,
      },
      DEFAULT_SYAHADAH_PARAMS
    );

    assertCheck(
      `${sec.name} ${oplah} pcs (${met})`,
      res.hppPerPcs,
      Number(exHpp),
      res.hargaJualPerPcs,
      Number(exJual)
    );
  }
}

// ==================================================================================
// 2. BENCHMARK MASTER SOURCE BUKU PULUHAN (Pricelist Syahadah - 1 Muka 1 Warna Ryobi.xlsm)
// ==================================================================================
console.log('\n--- 2. BENCHMARK MASTER BUKU (Ryobi & Print Inter - Pembulatan Puluhan) ---');
const wbRyobi = XLSX.readFile(
  path.join(parentFolder, 'Source', 'Pricelist Syahadah - 1 Muka 1 Warna Ryobi.xlsm')
);
const bRyobi = wbRyobi.Sheets['BUKU'];

for (let r = 7; r <= 12; r++) {
  const q = Number(bRyobi['H' + r]?.v);
  const exTot = Math.round(Number(bRyobi['BI' + r]?.v));
  const exJualTens = Number(bRyobi['BO' + r]?.v);

  const res = calculateSyahadahHpp(
    {
      oplah: q,
      varian: '1 Muka 1 Warna',
      mesin: 'Ryobi',
      laminasi: 'Tanpa Laminasi',
      opsiFoil: false,
      opsiKardusLakban: true,
      marginPct: 30,
      negoDiskonPct: 5,
    },
    DEFAULT_SYAHADAH_PARAMS
  );

  totalTests++;
  const diffTot = Math.abs(res.totalHpp - exTot);
  const diffJual = Math.abs(res.hargaJualTensPerPcs - exJualTens);
  const pass = diffTot <= 1 && diffJual === 0;
  if (pass) passedTests++;
  console.log(
    `[${pass ? 'PASS' : 'FAIL'}] ${`Ryobi 1M-1W BUKU ${q} pcs`.padEnd(52)} | TotHPP Act: ${res.totalHpp.toLocaleString('id-ID').padStart(8)} Ex: ${exTot.toLocaleString('id-ID').padStart(8)} | Jual Act: ${res.hargaJualTensPerPcs} Ex: ${exJualTens}`
  );
}

// ==================================================================================
// 3. UJI STRES PERMUTASI DROPDOWN & FINISHING
// ==================================================================================
console.log('\n--- 3. UJI STRES PERMUTASI DROPDOWN, MESIN & FINISHING ---');
const permutasiCases: {
  desc: string;
  oplah: number;
  varian: SyahadahVarianType;
  mesin: 'Auto' | 'Print Inter' | 'Ryobi' | 'Oliver';
  laminasi: SyahadahLaminasiType;
  opsiFoil: boolean;
  opsiPacking: boolean;
}[] = [
  { desc: '1M-FC Oplah 100 - Auto (Print Inter) - Tanpa Lam', oplah: 100, varian: '1 Muka FC', mesin: 'Auto', laminasi: 'Tanpa Laminasi', opsiFoil: false, opsiPacking: false },
  { desc: '1M-FC Oplah 100 - Auto (Print Inter) - Glossy', oplah: 100, varian: '1 Muka FC', mesin: 'Auto', laminasi: 'Glossy', opsiFoil: false, opsiPacking: false },
  { desc: '1M-FC Oplah 100 - Auto (Print Inter) - Doff', oplah: 100, varian: '1 Muka FC', mesin: 'Auto', laminasi: 'Doff', opsiFoil: false, opsiPacking: false },
  { desc: '1M-FC Oplah 100 - Auto (Print Inter) - UV Varnish', oplah: 100, varian: '1 Muka FC', mesin: 'Auto', laminasi: 'UV Varnish', opsiFoil: false, opsiPacking: false },
  { desc: '1M-FC Oplah 100 - Foil Emas Aktif', oplah: 100, varian: '1 Muka FC', mesin: 'Auto', laminasi: 'Tanpa Laminasi', opsiFoil: true, opsiPacking: false },
  { desc: '1M-1W Oplah 500 - Auto (Ryobi) - Packing Aktif', oplah: 500, varian: '1 Muka 1 Warna', mesin: 'Auto', laminasi: 'Tanpa Laminasi', opsiFoil: false, opsiPacking: true },
  { desc: '1M-1W Oplah 500 - Foil Emas Aktif', oplah: 500, varian: '1 Muka 1 Warna', mesin: 'Auto', laminasi: 'Tanpa Laminasi', opsiFoil: true, opsiPacking: true },
  { desc: '2M-FC Oplah 200 - Auto (Print Inter) - Tanpa Lam', oplah: 200, varian: '2 Muka FC', mesin: 'Auto', laminasi: 'Tanpa Laminasi', opsiFoil: false, opsiPacking: false },
  { desc: '2M-2W Oplah 1000 - Ryobi - Tanpa Lam', oplah: 100, varian: '2 Muka 2 Warna', mesin: 'Ryobi', laminasi: 'Tanpa Laminasi', opsiFoil: false, opsiPacking: true },
  { desc: '1M-FC Oplah 1000 - Oliver Offset - Tanpa Lam', oplah: 1000, varian: '1 Muka FC', mesin: 'Oliver', laminasi: 'Tanpa Laminasi', opsiFoil: false, opsiPacking: true },
];

for (const c of permutasiCases) {
  const r = calculateSyahadahHpp(
    {
      oplah: c.oplah,
      varian: c.varian,
      mesin: c.mesin,
      laminasi: c.laminasi,
      opsiFoil: c.opsiFoil,
      opsiKardusLakban: c.opsiPacking,
      marginPct: 30,
      negoDiskonPct: 5,
    },
    DEFAULT_SYAHADAH_PARAMS
  );
  totalTests++;
  const pass = r.totalHpp > 0 && r.hargaJualPerPcs > 0;
  if (pass) passedTests++;
  console.log(
    `[${pass ? 'PASS' : 'FAIL'}] ${c.desc.padEnd(52)} | HPP: Rp ${r.totalHpp.toLocaleString('id-ID').padStart(9)} | Hpp/Pcs: Rp ${Math.round(r.hppPerPcs).toLocaleString('id-ID')} | Jual: Rp ${r.hargaJualPerPcs.toLocaleString('id-ID')}`
  );
}

// ==================================================================================
// 4. UJI REAKTIVITAS PARAMETER (SENSITIVITY TEST: DELTA HPP > 0)
// ==================================================================================
console.log('\n--- 4. UJI REAKTIVITAS PARAMETER (WAJIB DELTA HPP > 0) ---');

// Base case 1: Print Inter Digital
const basePod = calculateSyahadahHpp(
  { oplah: 100, varian: '1 Muka FC', mesin: 'Print Inter', laminasi: 'Tanpa Laminasi', opsiFoil: false, opsiKardusLakban: false },
  DEFAULT_SYAHADAH_PARAMS
);

// Base case 2: Ryobi Offset
const baseRyobi = calculateSyahadahHpp(
  { oplah: 500, varian: '1 Muka 1 Warna', mesin: 'Ryobi', laminasi: 'Tanpa Laminasi', opsiFoil: false, opsiKardusLakban: true },
  DEFAULT_SYAHADAH_PARAMS
);

// Test 1: Tarif Kertas Linen /Kg
const rKertas = calculateSyahadahHpp(
  { oplah: 500, varian: '1 Muka 1 Warna', mesin: 'Ryobi' },
  { ...DEFAULT_SYAHADAH_PARAMS, tarifKertasLinenKg: 35000 }
);
assertReactivity('Reaktivitas: Tarif Kertas Linen /Kg', baseRyobi.totalHpp, rKertas.totalHpp);

// Test 2: Up Kertas %
const rUpKertas = calculateSyahadahHpp(
  { oplah: 500, varian: '1 Muka 1 Warna', mesin: 'Ryobi' },
  { ...DEFAULT_SYAHADAH_PARAMS, upKertasPct: 10 }
);
assertReactivity('Reaktivitas: Up Kertas %', baseRyobi.totalHpp, rUpKertas.totalHpp);

// Test 3: Tarif Print A3 Digital
const rPrintA3 = calculateSyahadahHpp(
  { oplah: 100, varian: '1 Muka FC', mesin: 'Print Inter' },
  { ...DEFAULT_SYAHADAH_PARAMS, tarifPrintA3: 4500 }
);
assertReactivity('Reaktivitas: Tarif Print A3+ Digital', basePod.totalHpp, rPrintA3.totalHpp);

// Test 4: Insheet Digital Print Inter
const rInPod = calculateSyahadahHpp(
  { oplah: 100, varian: '1 Muka FC', mesin: 'Print Inter' },
  { ...DEFAULT_SYAHADAH_PARAMS, insheetPod: 15 }
);
assertReactivity('Reaktivitas: Insheet Cetak Digital', basePod.totalHpp, rInPod.totalHpp);

// Test 5: Insheet Ryobi
const rInRyobi = calculateSyahadahHpp(
  { oplah: 500, varian: '1 Muka 1 Warna', mesin: 'Ryobi' },
  { ...DEFAULT_SYAHADAH_PARAMS, insheetRyobi: 100 }
);
assertReactivity('Reaktivitas: Insheet Cetak Ryobi', baseRyobi.totalHpp, rInRyobi.totalHpp);

// Test 6: Tarif Plat Ryobi
const rPlatRyobi = calculateSyahadahHpp(
  { oplah: 500, varian: '1 Muka 1 Warna', mesin: 'Ryobi' },
  { ...DEFAULT_SYAHADAH_PARAMS, tarifPlatRyobi: 20000 }
);
assertReactivity('Reaktivitas: Tarif Plat Ryobi', baseRyobi.totalHpp, rPlatRyobi.totalHpp);

// Test 7: Min Order Ryobi
const rMinRyobi = calculateSyahadahHpp(
  { oplah: 500, varian: '1 Muka 1 Warna', mesin: 'Ryobi' },
  { ...DEFAULT_SYAHADAH_PARAMS, minOrderRyobi: 25000 }
);
assertReactivity('Reaktivitas: Min. Order Cetak Ryobi', baseRyobi.totalHpp, rMinRyobi.totalHpp);

// Test 8: Tarif Drek Over Ryobi
const rDrekRyobi = calculateSyahadahHpp(
  { oplah: 500, varian: '1 Muka 1 Warna', mesin: 'Ryobi' },
  { ...DEFAULT_SYAHADAH_PARAMS, tarifDrekOverRyobi: 60 }
);
assertReactivity('Reaktivitas: Tarif Drek Over Ryobi', baseRyobi.totalHpp, rDrekRyobi.totalHpp);

// Test 9: Desain
const rDesain = calculateSyahadahHpp(
  { oplah: 100, varian: '1 Muka FC', mesin: 'Print Inter' },
  { ...DEFAULT_SYAHADAH_PARAMS, tarifDesign: 50000 }
);
assertReactivity('Reaktivitas: Desain Syahadah', basePod.totalHpp, rDesain.totalHpp);

// Test 10: Potong Sisir per 500
const rSisir = calculateSyahadahHpp(
  { oplah: 100, varian: '1 Muka FC', mesin: 'Print Inter' },
  { ...DEFAULT_SYAHADAH_PARAMS, tarifSisirPer500: 10000 }
);
assertReactivity('Reaktivitas: Ongkos Potong Sisir', basePod.totalHpp, rSisir.totalHpp);

// Test 11: Tarif Kardus Box
const rKardus = calculateSyahadahHpp(
  { oplah: 500, varian: '1 Muka 1 Warna', mesin: 'Ryobi' },
  { ...DEFAULT_SYAHADAH_PARAMS, tarifKardusBox: 15000 }
);
assertReactivity('Reaktivitas: Tarif Kardus Box', baseRyobi.totalHpp, rKardus.totalHpp);

// Test 12: Tarif Lakban Roll
const rLakban = calculateSyahadahHpp(
  { oplah: 500, varian: '1 Muka 1 Warna', mesin: 'Ryobi' },
  { ...DEFAULT_SYAHADAH_PARAMS, tarifLakbanRoll: 16000 }
);
assertReactivity('Reaktivitas: Tarif Lakban Roll', baseRyobi.totalHpp, rLakban.totalHpp);

// Test 13: Tarif Foil per Pcs
const baseFoil = calculateSyahadahHpp(
  { oplah: 500, varian: '1 Muka FC', opsiFoil: true },
  DEFAULT_SYAHADAH_PARAMS
);
const rFoilPcs = calculateSyahadahHpp(
  { oplah: 500, varian: '1 Muka FC', opsiFoil: true },
  { ...DEFAULT_SYAHADAH_PARAMS, tarifFoilPerPcs: 600 }
);
assertReactivity('Reaktivitas: Tarif Hotprint Foil /Pcs', baseFoil.totalHpp, rFoilPcs.totalHpp);

// Test 14: Klise Master Foil
const rKlise = calculateSyahadahHpp(
  { oplah: 500, varian: '1 Muka FC', opsiFoil: true },
  { ...DEFAULT_SYAHADAH_PARAMS, tarifKliseMasterFoil: 80000 }
);
assertReactivity('Reaktivitas: Klise Master Foil', baseFoil.totalHpp, rKlise.totalHpp);

// Test 15: Margin % (cek delta harga jual)
const rMargin = calculateSyahadahHpp(
  { oplah: 100, varian: '1 Muka FC', marginPct: 40 },
  DEFAULT_SYAHADAH_PARAMS
);
totalTests++;
const passMargin = rMargin.hargaJualPerPcs > basePod.hargaJualPerPcs;
if (passMargin) passedTests++;
console.log(
  `[${passMargin ? 'PASS' : 'FAIL'}] ${'Reaktivitas: Margin Laba % (Harga Jual)'.padEnd(52)} | Base: Rp ${basePod.hargaJualPerPcs.toLocaleString('id-ID')} -> Mod: Rp ${rMargin.hargaJualPerPcs.toLocaleString('id-ID')} | Delta: ${(rMargin.hargaJualPerPcs - basePod.hargaJualPerPcs).toLocaleString('id-ID')}`
);

// Test 16: Nego Diskon % (cek delta harga nego)
const rNego = calculateSyahadahHpp(
  { oplah: 100, varian: '1 Muka FC', negoDiskonPct: 10 },
  DEFAULT_SYAHADAH_PARAMS
);
totalTests++;
const passNego = rNego.hargaNegoPerPcs < basePod.hargaNegoPerPcs;
if (passNego) passedTests++;
console.log(
  `[${passNego ? 'PASS' : 'FAIL'}] ${'Reaktivitas: Nego Diskon % (Harga Nego)'.padEnd(52)} | Base: Rp ${basePod.hargaNegoPerPcs.toLocaleString('id-ID')} -> Mod: Rp ${rNego.hargaNegoPerPcs.toLocaleString('id-ID')} | Delta: ${(basePod.hargaNegoPerPcs - rNego.hargaNegoPerPcs).toLocaleString('id-ID')}`
);

console.log('========================================================================================');
console.log(
  `HASIL AKHIR BENCHMARK: ${passedTests} / ${totalTests} PENGUJIAN LULUS (${((passedTests / totalTests) * 100).toFixed(1)}%)`
);
console.log('========================================================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
