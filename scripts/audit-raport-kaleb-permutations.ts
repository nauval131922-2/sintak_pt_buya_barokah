// ============================================================================
// BENCHMARK PERMUTASI & REAKTIVITAS RAPORT KALEB: SINTAK vs EXCEL MASTER
// Sumber: 
// 1. Pricelist Raport Kaleb.xlsx (Sheet HARGA JULI 2026 & Source Buku Tulis)
// 2. Source/Pricelist RAPORT KALEB - kosongan.xlsm (Sheet Master & BUKU)
// 3. Source/Pricelist RAPORT KALEB - isi 6.xlsm (Sheet Master & BUKU)
// Standar: 100% Mathematical Parity (Rp 0 Selisih) & Reaktivitas Penuh
// ============================================================================

import ExcelJS from 'exceljs';
import * as path from 'path';
import {
  calculateRaportKalebHpp,
  DEFAULT_RAPORT_KALEB_PARAMS,
  RaportKalebMasterParams,
  RAPORT_KALEB_TIERS,
  RAPORT_KALEB_VARIANTS,
} from '../src/lib/raport-kaleb-calculator';

const basePath = 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/09. Pricelist Raport Kaleb';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function getNum(cell: ExcelJS.Cell): number {
  if (!cell || cell.value === null || cell.value === undefined) return 0;
  if (typeof cell.value === 'object') {
    if ('result' in cell.value && cell.value.result !== undefined) {
      return Number(cell.value.result);
    }
  }
  return Number(cell.value);
}

function assertParity(
  label: string,
  actualHpp: number,
  expectedHpp: number,
  actualJual: number,
  expectedJual: number,
  actualNego?: number,
  expectedNego?: number
) {
  totalTests++;
  const diffHpp = Math.abs(actualHpp - expectedHpp);
  const diffJual = Math.abs(actualJual - expectedJual);
  const diffNego = expectedNego !== undefined && actualNego !== undefined ? Math.abs(actualNego - expectedNego) : 0;

  if (diffHpp < 0.05 && diffJual === 0 && diffNego === 0) {
    passedTests++;
    const negoStr = expectedNego !== undefined ? ` | Nego Act: ${actualNego?.toLocaleString('id-ID')} Ex: ${expectedNego?.toLocaleString('id-ID')}` : '';
    console.log(
      `[PASS] ${label.padEnd(52)} | HPP Act: ${actualHpp.toFixed(2).padStart(8)} Ex: ${expectedHpp.toFixed(2).padStart(8)} | Jual Act: ${actualJual.toLocaleString('id-ID').padStart(6)} Ex: ${expectedJual.toLocaleString('id-ID').padStart(6)}${negoStr}`
    );
  } else {
    failedTests++;
    console.error(
      `[FAIL] ${label}
  HPP  -> Actual: ${actualHpp} | Expected: ${expectedHpp} (Diff: ${diffHpp})
  Jual -> Actual: ${actualJual} | Expected: ${expectedJual} (Diff: ${diffJual})
  Nego -> Actual: ${actualNego} | Expected: ${expectedNego} (Diff: ${diffNego})`
    );
  }
}

function assertReactivity(paramName: string, baseVal: number, modifiedVal: number) {
  totalTests++;
  const delta = Math.abs(modifiedVal - baseVal);
  if (delta > 0) {
    passedTests++;
    console.log(
      `[PASS] Reaktivitas: ${paramName.padEnd(38)} | Base: ${baseVal.toLocaleString('id-ID').padStart(10)} -> Mod: ${modifiedVal.toLocaleString('id-ID').padStart(10)} | Delta: ${delta.toLocaleString('id-ID')}`
    );
  } else {
    failedTests++;
    console.error(`[FAIL] Reaktivitas Parameter Mati: ${paramName} (Delta = 0)`);
  }
}

async function runAudit() {
  console.log('========================================================================================');
  console.log('BENCHMARK PERMUTASI & REAKTIVITAS RAPORT KALEB: SINTAK vs EXCEL MASTER (100% PARITY)');
  console.log('========================================================================================\n');

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(basePath, 'Pricelist Raport Kaleb.xlsx'));
  const wsHarga = wb.getWorksheet('HARGA JULI 2026');
  if (!wsHarga) throw new Error('Sheet HARGA JULI 2026 tidak ditemukan');

  // --- 1. BENCHMARK KOSONGAN (18 TIERS) DARI HARGA JULI 2026 ---
  console.log('--- 1. BENCHMARK KOSONGAN (Sheet HARGA JULI 2026 - 18 TIERS) ---');
  for (let r = 4; r <= 21; r++) {
    const row = wsHarga.getRow(r);
    const oplah = getNum(row.getCell('M'));
    const exHpp = getNum(row.getCell('N'));
    const exJual = getNum(row.getCell('O'));
    const exNego = getNum(row.getCell('P'));

    const res = calculateRaportKalebHpp({
      oplah,
      varian: 'Kosongan',
      marginPct: 25,
      negoDiskonPct: 4,
    });

    assertParity(
      `Kosongan ${oplah} pcs`,
      res.hppPerPcs,
      exHpp,
      res.hargaJualPerPcs,
      exJual,
      res.hargaNegoPerPcs,
      exNego
    );
  }

  // --- 2. BENCHMARK ISI 6 (18 TIERS) DARI HARGA JULI 2026 ---
  console.log('\n--- 2. BENCHMARK ISI 6 (Sheet HARGA JULI 2026 - 18 TIERS) ---');
  for (let r = 26; r <= 43; r++) {
    const row = wsHarga.getRow(r);
    const oplah = getNum(row.getCell('M'));
    const exHpp = getNum(row.getCell('N'));
    const exJual = getNum(row.getCell('O'));
    const exNego = getNum(row.getCell('P'));

    const res = calculateRaportKalebHpp({
      oplah,
      varian: 'Isi 6',
      marginPct: 25,
      negoDiskonPct: 4,
    });

    assertParity(
      `Isi 6 ${oplah} pcs`,
      res.hppPerPcs,
      exHpp,
      res.hargaJualPerPcs,
      exJual,
      res.hargaNegoPerPcs,
      exNego
    );
  }

  // --- 3. UJI STRES PERMUTASI DROPDOWN VARIAN & PACKING ---
  console.log('\n--- 3. UJI STRES PERMUTASI DROPDOWN & FINISHING ---');
  const testPermutations: {
    oplah: number;
    varian: any;
    tambahanIsiLbr?: number;
    opsiPacking?: boolean;
    marginPct: number;
    negoDiskonPct: number;
  }[] = [
    { oplah: 10, varian: 'Kosongan', marginPct: 25, negoDiskonPct: 4 },
    { oplah: 100, varian: 'Isi 4', marginPct: 25, negoDiskonPct: 4 },
    { oplah: 100, varian: 'Isi 6', marginPct: 25, negoDiskonPct: 4 },
    { oplah: 100, varian: 'Isi 8', marginPct: 25, negoDiskonPct: 4 },
    { oplah: 100, varian: 'Isi 10', marginPct: 25, negoDiskonPct: 4 },
    { oplah: 100, varian: 'Isi 12', marginPct: 25, negoDiskonPct: 4 },
    { oplah: 100, varian: 'Kosongan', tambahanIsiLbr: 2, marginPct: 25, negoDiskonPct: 4 },
    { oplah: 100, varian: 'Isi 6', tambahanIsiLbr: 4, marginPct: 25, negoDiskonPct: 4 },
    { oplah: 100, varian: 'Kosongan', opsiPacking: true, marginPct: 25, negoDiskonPct: 4 },
    { oplah: 500, varian: 'Isi 6', opsiPacking: true, marginPct: 25, negoDiskonPct: 4 },
    { oplah: 1000, varian: 'Isi 12', opsiPacking: true, marginPct: 30, negoDiskonPct: 5 },
  ];

  for (const t of testPermutations) {
    const res = calculateRaportKalebHpp(t);
    totalTests++;
    if (res.totalHpp > 0 && res.hargaJualPerPcs > res.hppPerPcs && res.breakdown.length >= 2) {
      passedTests++;
      const packStr = t.opsiPacking ? ' + Packing' : '';
      const extraStr = t.tambahanIsiLbr ? ` (+${t.tambahanIsiLbr} custom)` : '';
      console.log(
        `[PASS] Oplah ${t.oplah.toString().padStart(4)} - ${t.varian}${extraStr}${packStr}`.padEnd(52) +
        ` | HPP: Rp ${res.totalHpp.toLocaleString('id-ID').padStart(10)} | Hpp/Pcs: Rp ${Math.round(res.hppPerPcs).toLocaleString('id-ID').padStart(6)} | Jual: Rp ${res.hargaJualPerPcs.toLocaleString('id-ID').padStart(6)}`
      );
    } else {
      failedTests++;
      console.error(`[FAIL] Permutasi invalid:`, t, res);
    }
  }

  // --- 4. UJI REAKTIVITAS PARAMETER MASTER (WAJIB DELTA HPP > 0) ---
  console.log('\n--- 4. UJI REAKTIVITAS PARAMETER (WAJIB DELTA HPP > 0) ---');
  const baseKosongan100 = calculateRaportKalebHpp({
    oplah: 100,
    varian: 'Kosongan',
    marginPct: 25,
    negoDiskonPct: 4,
  });

  const baseIsi6_500 = calculateRaportKalebHpp({
    oplah: 500,
    varian: 'Isi 6',
    opsiPacking: true,
    marginPct: 25,
    negoDiskonPct: 4,
  });

  // Test 1: Harga Map Kosongan (Master!D12)
  const rMap = calculateRaportKalebHpp(
    { oplah: 100, varian: 'Kosongan', marginPct: 25, negoDiskonPct: 4 },
    { ...DEFAULT_RAPORT_KALEB_PARAMS, hargaMapKosongan: 18000 }
  );
  assertReactivity('Harga Map Kosongan (Master!D12)', baseKosongan100.totalHpp, rMap.totalHpp);

  // Test 2: Markup Map Kosongan % (Master!E12)
  const rUpMap = calculateRaportKalebHpp(
    { oplah: 100, varian: 'Kosongan', marginPct: 25, negoDiskonPct: 4 },
    { ...DEFAULT_RAPORT_KALEB_PARAMS, upMapKosonganPct: 10 }
  );
  assertReactivity('Markup Kertas Map % (Master!E12)', baseKosongan100.totalHpp, rUpMap.totalHpp);

  // Test 3: Harga Isi Per Lembar (Master!D13)
  const rIsi = calculateRaportKalebHpp(
    { oplah: 500, varian: 'Isi 6', opsiPacking: true, marginPct: 25, negoDiskonPct: 4 },
    { ...DEFAULT_RAPORT_KALEB_PARAMS, hargaIsiPerLbr: 1200 }
  );
  assertReactivity('Harga Isi /Lbr (Master!D13)', baseIsi6_500.totalHpp, rIsi.totalHpp);

  // Test 4: Desain Layout (Master!D14)
  const rDesain = calculateRaportKalebHpp(
    { oplah: 100, varian: 'Kosongan', marginPct: 25, negoDiskonPct: 4 },
    { ...DEFAULT_RAPORT_KALEB_PARAMS, tarifDesign: 50000 }
  );
  assertReactivity('Biaya Desain (Master!D14)', baseKosongan100.totalHpp, rDesain.totalHpp);

  // Test 5: Klise Foil Emas (Master!D15)
  const rKlise = calculateRaportKalebHpp(
    { oplah: 100, varian: 'Kosongan', marginPct: 25, negoDiskonPct: 4 },
    { ...DEFAULT_RAPORT_KALEB_PARAMS, tarifKlise: 450000 }
  );
  assertReactivity('Tarif Klise Foil (Master!D15)', baseKosongan100.totalHpp, rKlise.totalHpp);

  // Test 6: Batas Oplah Klise (BUKU!P7)
  const rBatasKlise = calculateRaportKalebHpp(
    { oplah: 150, varian: 'Kosongan', marginPct: 25, negoDiskonPct: 4 },
    { ...DEFAULT_RAPORT_KALEB_PARAMS, batasOplahKlise: 200 } // batas dinaikkan, jadi oplah 150 kena klise
  );
  const baseKosongan150 = calculateRaportKalebHpp({
    oplah: 150,
    varian: 'Kosongan',
    marginPct: 25,
    negoDiskonPct: 4,
  });
  assertReactivity('Batas Oplah Klise (BUKU!P7)', baseKosongan150.totalHpp, rBatasKlise.totalHpp);

  // Test 7: Tarif Kardus Box (Master!D18)
  const rKardus = calculateRaportKalebHpp(
    { oplah: 500, varian: 'Isi 6', opsiPacking: true, marginPct: 25, negoDiskonPct: 4 },
    { ...DEFAULT_RAPORT_KALEB_PARAMS, tarifKardusBox: 12000 }
  );
  assertReactivity('Tarif Kardus Box (Master!D18)', baseIsi6_500.totalHpp, rKardus.totalHpp);

  // Test 8: Tarif Lakban Roll (Master!D17)
  const rLakban = calculateRaportKalebHpp(
    { oplah: 500, varian: 'Isi 6', opsiPacking: true, marginPct: 25, negoDiskonPct: 4 },
    { ...DEFAULT_RAPORT_KALEB_PARAMS, tarifLakbanRoll: 15000 }
  );
  assertReactivity('Tarif Lakban Roll (Master!D17)', baseIsi6_500.totalHpp, rLakban.totalHpp);

  // Test 9: Kapasitas Kardus (BUKU!V35)
  const rKapKardus = calculateRaportKalebHpp(
    { oplah: 500, varian: 'Isi 6', opsiPacking: true, marginPct: 25, negoDiskonPct: 4 },
    { ...DEFAULT_RAPORT_KALEB_PARAMS, kapasitasKardus: 50 }
  );
  assertReactivity('Kapasitas Kardus (BUKU!V35)', baseIsi6_500.totalHpp, rKapKardus.totalHpp);

  // Test 10: Margin Laba % (Harga Jual)
  const rMargin = calculateRaportKalebHpp({
    oplah: 100,
    varian: 'Kosongan',
    marginPct: 35,
    negoDiskonPct: 4,
  });
  totalTests++;
  const deltaMargin = Math.abs(rMargin.hargaJualPerPcs - baseKosongan100.hargaJualPerPcs);
  if (deltaMargin > 0) {
    passedTests++;
    console.log(
      `[PASS] Reaktivitas: Margin Laba % (Harga Jual)        | Base: Rp ${baseKosongan100.hargaJualPerPcs.toLocaleString('id-ID')} -> Mod: Rp ${rMargin.hargaJualPerPcs.toLocaleString('id-ID')} | Delta: ${deltaMargin}`
    );
  } else {
    failedTests++;
    console.error(`[FAIL] Reaktivitas Margin Laba % Mati!`);
  }

  // Test 11: Nego Diskon % (Harga Nego)
  const rNego = calculateRaportKalebHpp({
    oplah: 100,
    varian: 'Kosongan',
    marginPct: 25,
    negoDiskonPct: 8,
  });
  totalTests++;
  const deltaNego = Math.abs(rNego.hargaNegoPerPcs - baseKosongan100.hargaNegoPerPcs);
  if (deltaNego > 0) {
    passedTests++;
    console.log(
      `[PASS] Reaktivitas: Nego Diskon % (Harga Nego)        | Base: Rp ${baseKosongan100.hargaNegoPerPcs.toLocaleString('id-ID')} -> Mod: Rp ${rNego.hargaNegoPerPcs.toLocaleString('id-ID')} | Delta: ${deltaNego}`
    );
  } else {
    failedTests++;
    console.error(`[FAIL] Reaktivitas Nego Diskon % Mati!`);
  }

  console.log('========================================================================================');
  console.log(
    `HASIL AKHIR BENCHMARK: ${passedTests} / ${totalTests} PENGUJIAN LULUS (${((passedTests / totalTests) * 100).toFixed(1)}%)`
  );
  console.log('========================================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
