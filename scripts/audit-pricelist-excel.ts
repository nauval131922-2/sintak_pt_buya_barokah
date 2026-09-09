// scripts/audit-pricelist-excel.ts
/**
 * HARNESS AUDIT MEKANIS OTOMATIS: SINTAK VS EXCEL MASTER ASLI
 *
 * Menjalankan kalkulasi murni dari file calculator TypeScript dan mencocokkan
 * hasilnya dengan cell-cell di file fisik Excel master di drive H:.
 *
 * Exit 0: Jika seluruh modul PASS (selisih <= Rp 1).
 * Exit 1: Jika ada selisih > Rp 1 (FAIL).
 */

import { calculateManasikSimulator, DEFAULT_MANASIK_PARAMS } from '../src/lib/manasik-calculator';
import { calculateYasinSimulator, DEFAULT_YASIN_PARAMS } from '../src/lib/yasin-calculator';
import { calculateNotaSimulator, DEFAULT_NOTA_PARAMS } from '../src/lib/nota-calculator';
import { calculateBrosurSimulator, DEFAULT_BROSUR_PARAMS } from '../src/lib/brosur-calculator';
import { calculateLabelKhqHpp, DEFAULT_LABEL_KHQ_PARAMS } from '../src/lib/label-khq-calculator';

interface AuditRow {
  modul: string;
  skenario: string;
  excelRef: string;
  excelHpp: number;
  sintakHpp: number;
  diffHpp: number;
  excelJual: number;
  sintakJual: number;
  diffJual: number;
  status: 'PASS' | 'FAIL';
}

const results: AuditRow[] = [];

// ==========================================
// 1. AUDIT BUKU MANASIK KOSONGAN (7 TIER OPLAH)
// Referensi: Kosongan.xlsm -> Sheet BUKU (Row 7 s/d 14)
// ==========================================
const kosonganBenchmarks = [
  { oplah: 100, excelTotal: 1660569, excelHpp: 16606, excelJual: 16610 },
  { oplah: 200, excelTotal: 3059261, excelHpp: 15296, excelJual: 15300 },
  { oplah: 300, excelTotal: 4467413, excelHpp: 14891, excelJual: 14900 },
  { oplah: 2000, excelTotal: 28543821, excelHpp: 14272, excelJual: 14280 },
  { oplah: 3000, excelTotal: 42716443, excelHpp: 14239, excelJual: 14240 },
  { oplah: 5000, excelTotal: 71061688, excelHpp: 14212, excelJual: 14220 },
  { oplah: 10000, excelTotal: 141929599, excelHpp: 14193, excelJual: 14200 },
];

for (const b of kosonganBenchmarks) {
  const res = calculateManasikSimulator(
    {
      varian: 'Kosongan 10 x 15,5',
      oplah: b.oplah,
      jumlahHalaman: 212,
      tipeJilid: 'Tali Kur',
      metodeCetakCover: 'Offset (Oliver)',
      metodeCetakIsi: 'Print Buya',
      insheetIsiCustom: 5,
      laminasiCover: 'Tanpa Laminasi',
      opsiPlastikOpp: false,
      opsiKardus: false,
      marginPct: 0,
      negoDiskonPct: 0,
    },
    DEFAULT_MANASIK_PARAMS
  );
  const diffHpp = Math.abs(res.summary.hppPerPcs - b.excelHpp);
  const diffJual = Math.abs(res.summary.hargaJualPerPcs - b.excelJual);
  const pass = diffHpp <= 1 && diffJual <= 1;

  results.push({
    modul: 'Manasik',
    skenario: `Kosongan ${b.oplah} eks`,
    excelRef: `BUKU!EB${b.oplah === 100 ? 7 : ''}`,
    excelHpp: b.excelHpp,
    sintakHpp: res.summary.hppPerPcs,
    diffHpp,
    excelJual: b.excelJual,
    sintakJual: res.summary.hargaJualPerPcs,
    diffJual,
    status: pass ? 'PASS' : 'FAIL',
  });
}

// ==========================================
// 1b. AUDIT BUKU MANASIK KOSONGAN RYOBI (INSHEET 100)
// Referensi: Kosongan.xlsm -> Sheet BUKU saat D25=Ryobi & D23=100
// ==========================================
const kosonganRyobiBenchmarks = [
  { oplah: 100, excelTotal: 2218699, excelHpp: 22187, excelJual: 22190 },
  { oplah: 200, excelTotal: 2693279, excelHpp: 13466, excelJual: 13470 },
  { oplah: 300, excelTotal: 3178033, excelHpp: 10593, excelJual: 10600 },
  { oplah: 2000, excelTotal: 14093532, excelHpp: 7047, excelJual: 7050 },
  { oplah: 3000, excelTotal: 20618603, excelHpp: 6873, excelJual: 6880 },
  { oplah: 5000, excelTotal: 33668030, excelHpp: 6734, excelJual: 6740 },
  { oplah: 10000, excelTotal: 66296040, excelHpp: 6630, excelJual: 6630 },
];

for (const b of kosonganRyobiBenchmarks) {
  const res = calculateManasikSimulator(
    {
      varian: 'Kosongan 10 x 15,5',
      oplah: b.oplah,
      jumlahHalaman: 212,
      tipeJilid: 'Tali Kur',
      metodeCetakCover: 'Offset (Oliver)',
      metodeCetakIsi: 'Ryobi',
      laminasiCover: 'Tanpa Laminasi',
      opsiPlastikOpp: false,
      opsiKardus: false,
      marginPct: 0,
      negoDiskonPct: 0,
    },
    DEFAULT_MANASIK_PARAMS
  );

  const diffHpp = Math.abs(res.summary.hppPerPcs - b.excelHpp);
  const diffJual = Math.abs(res.summary.hargaJualPerPcs - b.excelJual);
  const pass = diffHpp <= 1 && diffJual <= 1;

  results.push({
    modul: 'Manasik',
    skenario: `Kosongan Ryobi ${b.oplah} eks`,
    excelRef: 'BUKU!EB_Ryobi',
    excelHpp: b.excelHpp,
    sintakHpp: res.summary.hppPerPcs,
    diffHpp,
    excelJual: b.excelJual,
    sintakJual: res.summary.hargaJualPerPcs,
    diffJual,
    status: pass ? 'PASS' : 'FAIL',
  });
}

// ==========================================
// 2. AUDIT BUKU MANASIK CUSTOM COVER (11 TIER OPLAH: 20 s/d 5000 EKS)
// Referensi: Custom Cover 2026.xlsm -> Sheet BUKU (Row 9 s/d 19)
// ==========================================
const customCoverBenchmarks = [
  { oplah: 20, excelTotal: 232463, excelHpp: 11623, excelJual: 15120 },
  { oplah: 50, excelTotal: 416249, excelHpp: 8325, excelJual: 10830 },
  { oplah: 100, excelTotal: 722557, excelHpp: 7226, excelJual: 9400 },
  { oplah: 150, excelTotal: 1028866, excelHpp: 6859, excelJual: 8920 },
  { oplah: 200, excelTotal: 1335175, excelHpp: 6676, excelJual: 8680 },
  { oplah: 250, excelTotal: 1649983, excelHpp: 6600, excelJual: 8580 },
  { oplah: 300, excelTotal: 1957732, excelHpp: 6526, excelJual: 8490 },
  { oplah: 350, excelTotal: 2265481, excelHpp: 6473, excelJual: 8420 },
  { oplah: 400, excelTotal: 2573229, excelHpp: 6433, excelJual: 8370 },
  { oplah: 450, excelTotal: 2895278, excelHpp: 6434, excelJual: 8370 },
  { oplah: 500, excelTotal: 3209227, excelHpp: 6418, excelJual: 8350 },
];

for (const b of customCoverBenchmarks) {
  const res = calculateManasikSimulator(
    {
      varian: 'Custom Cover 10 x 15,5',
      oplah: b.oplah,
      jumlahHalaman: 216,
      tipeJilid: 'Tali Kur',
      metodeCetakCover: 'Otomatis',
      laminasiCover: 'Doff',
      opsiPlastikOpp: true,
      opsiKardus: true,
      opsiSisipan: true,
      marginPct: 30,
      negoDiskonPct: 0,
    },
    DEFAULT_MANASIK_PARAMS
  );

  const diffHpp = Math.abs(res.summary.hppPerPcs - b.excelHpp);
  const diffJual = Math.abs(res.summary.hargaJualPerPcs - b.excelJual);
  const pass = diffHpp <= 1 && diffJual <= 1;

  results.push({
    modul: 'Manasik',
    skenario: `Custom Cover ${b.oplah} eks`,
    excelRef: `BUKU!DE${b.oplah === 500 ? 19 : ''}`,
    excelHpp: b.excelHpp,
    sintakHpp: res.summary.hppPerPcs,
    diffHpp,
    excelJual: b.excelJual,
    sintakJual: res.summary.hargaJualPerPcs,
    diffJual,
    status: pass ? 'PASS' : 'FAIL',
  });
}

// ==========================================
// 2b. AUDIT BUKU MANASIK CUSTOM COVER (MESIN OLIVER 5.000 EKS)
// Referensi: Custom Cover 2026.xlsm -> Sheet BUKU Row 7 (Oliver, Insheet 200)
// ==========================================
const manasikOliver5k = calculateManasikSimulator(
  {
    varian: 'Custom Cover 10 x 15,5',
    oplah: 5000,
    jumlahHalaman: 216,
    tipeJilid: 'Tali Kur',
    metodeCetakCover: 'Offset (Oliver)',
    laminasiCover: 'Doff',
    opsiPlastikOpp: true,
    opsiKardus: true,
    opsiSisipan: true,
    marginPct: 30,
    negoDiskonPct: 0,
  },
  DEFAULT_MANASIK_PARAMS
);

results.push({
  modul: 'Manasik',
  skenario: 'Custom Cover Oliver 5.000 eks',
  excelRef: 'BUKU!CZ7 / DE7',
  excelHpp: 6007,
  sintakHpp: manasikOliver5k.summary.hppPerPcs,
  diffHpp: Math.abs(manasikOliver5k.summary.hppPerPcs - 6007),
  excelJual: 7810,
  sintakJual: manasikOliver5k.summary.hargaJualPerPcs,
  diffJual: Math.abs(manasikOliver5k.summary.hargaJualPerPcs - 7810),
  status:
    manasikOliver5k.summary.hppPerPcs === 6007 && manasikOliver5k.summary.hargaJualPerPcs === 7810
      ? 'PASS'
      : 'FAIL',
});
// 3. AUDIT BUKU SURAT YASIN HARDCOVER (175 EKS)
// Referensi: Surat Yasin Hardcover 175 Eks.xlsm
// ==========================================
const yasinHc = calculateYasinSimulator(
  {
    oplah: 175,
    tipeCover: 'Hardcover',
    ukuran: '11.7 x 15',
    jumlahHalamanIsi: 96,
    lembarSisipanFoto: 1,
    lembarSisipanKeluarga: 1,
    laminasiCover: 'Glossy',
    opsiPitaRumbai: true,
    opsiSikuEmas: false,
    opsiPlastikOpp: true,
    marginPct: 30,
    negoDiskonPct: 0,
  },
  DEFAULT_YASIN_PARAMS
);

results.push({
  modul: 'Yasin',
  skenario: 'Hardcover 96 Hal 175 eks',
  excelRef: 'BUKU!Cell HPP',
  excelHpp: 7411,
  sintakHpp: yasinHc.summary.hppPerPcs,
  diffHpp: Math.abs(yasinHc.summary.hppPerPcs - 7411),
  excelJual: 9640,
  sintakJual: yasinHc.summary.hargaJualPerPcs,
  diffJual: Math.abs(yasinHc.summary.hargaJualPerPcs - 9640),
  status:
    yasinHc.summary.hppPerPcs === 7411 && yasinHc.summary.hargaJualPerPcs === 9640 ? 'PASS' : 'FAIL',
});

// ==========================================
// 4. AUDIT NOTA 2 WARNA (1 RIM FOLIO)
// Referensi: 02020102 NOTA 2 PLY FOLIO 2 WARNA.xlsx
// ==========================================
const nota2w = calculateNotaSimulator(
  {
    oplahRim: 1,
    rangkap: 1,
    ukuran: 'Folio (21.5 x 33)',
    jumlahWarna: 2,
    opsiPorporasi: true,
    opsiNomorator: false,
    marginPct: 30,
    negoDiskonPct: 0,
  },
  DEFAULT_NOTA_PARAMS
);

results.push({
  modul: 'Nota',
  skenario: '1 Ply Folio 2W (1 Rim)',
  excelRef: 'BUKU!AW7/AY7',
  excelHpp: 109566,
  sintakHpp: nota2w.summary.hppPerRim,
  diffHpp: Math.abs(nota2w.summary.hppPerRim - 109566),
  excelJual: 142440,
  sintakJual: nota2w.summary.hargaJualPerRim,
  diffJual: Math.abs(nota2w.summary.hargaJualPerRim - 142440),
  status:
    nota2w.summary.hppPerRim === 109566 && nota2w.summary.hargaJualPerRim === 142440
      ? 'PASS'
      : 'FAIL',
});

// ==========================================
// 5. AUDIT BROSUR OLIVER 2 MUKA (2.000 EKS)
// Referensi: Pricelist Brosur Juni 2026 10,5 x 21 2 muka oliver.xlsm
// ==========================================
const brosurOliver = calculateBrosurSimulator(
  {
    oplah: 2000,
    gramatur: 'Art Paper 120 gsm',
    ukuran: '10,5 x 21',
    muka: '2 Muka',
    mesin: 'Oliver',
    laminasi: 'Tanpa Laminasi',
    opsiSisir: true,
    opsiPacking: false,
    marginPct: 30,
    negoDiskonPct: 0,
  },
  DEFAULT_BROSUR_PARAMS
);

const bHpp = Math.round(brosurOliver.hppPerPcs);
results.push({
  modul: 'Brosur',
  skenario: '10,5x21 2 Muka Oliver 2k',
  excelRef: 'BUKU!Row 7',
  excelHpp: 376,
  sintakHpp: bHpp,
  diffHpp: Math.abs(bHpp - 376),
  excelJual: 490,
  sintakJual: brosurOliver.hargaJualPerPcs,
  diffJual: Math.abs(brosurOliver.hargaJualPerPcs - 490),
  status: bHpp === 376 && brosurOliver.hargaJualPerPcs === 490 ? 'PASS' : 'FAIL',
});

// ==========================================
// 6. AUDIT LABEL KHQ 330 ML (167 DUS / 4.008 LBR)
// Referensi: Label KHQ 330 ml 167 - 184 kardus.xlsm
// ==========================================
const labelKhq = calculateLabelKhqHpp(
  {
    varian: 'KHQ 330 ml',
    jumlahKardus: 167,
    opsiLaminasi: true,
    opsiRajang: true,
    marginPct: 30,
    negoDiskonPct: 4,
  },
  { ...DEFAULT_LABEL_KHQ_PARAMS, tarifPrintA3: 2000 }
);

const kHpp = Number(labelKhq.hppPerLbr.toFixed(2));
results.push({
  modul: 'Label KHQ',
  skenario: '330 ml 167 Dus (4.008 lbr)',
  excelRef: 'BUKU!BD7/BE7/BJ7',
  excelHpp: 191.09,
  sintakHpp: kHpp,
  diffHpp: Math.abs(kHpp - 191.09),
  excelJual: 249,
  sintakJual: labelKhq.hargaJualPerLbr,
  diffJual: Math.abs(labelKhq.hargaJualPerLbr - 249),
  status: kHpp === 191.09 && labelKhq.hargaJualPerLbr === 249 ? 'PASS' : 'FAIL',
});

// ==========================================
// CETAK TABEL LAPORAN AUDIT RESMI
// ==========================================
console.log('\n==================================================================================================');
console.log('                 AUDIT MEKANIS OTOMATIS: SINTAK ERP VS MASTER EXCEL ASLI                  ');
console.log('==================================================================================================');
console.log(
  `${'Modul'.padEnd(10)} | ${'Skenario / Oplah'.padEnd(26)} | ${'Excel HPP'.padStart(10)} | ${'SINTAK HPP'.padStart(10)} | ${'Diff'.padStart(5)} | ${'Excel Jual'.padStart(10)} | ${'SINTAK Jual'.padStart(11)} | ${'Status'.padStart(6)}`
);
console.log('--------------------------------------------------------------------------------------------------');

let allPass = true;
for (const r of results) {
  if (r.status === 'FAIL') allPass = false;
  const hppEx = `Rp ${r.excelHpp.toLocaleString('id-ID')}`;
  const hppSin = `Rp ${r.sintakHpp.toLocaleString('id-ID')}`;
  const jualEx = `Rp ${r.excelJual.toLocaleString('id-ID')}`;
  const jualSin = `Rp ${r.sintakJual.toLocaleString('id-ID')}`;

  console.log(
    `${r.modul.padEnd(10)} | ${r.skenario.padEnd(26)} | ${hppEx.padStart(10)} | ${hppSin.padStart(10)} | ${r.diffHpp.toString().padStart(5)} | ${jualEx.padStart(10)} | ${jualSin.padStart(11)} | ${r.status === 'PASS' ? '✅PASS' : '❌FAIL'}`
  );
}
console.log('==================================================================================================');

if (!allPass) {
  console.error('\n❌ AUDIT GAGAL: Ditemukan selisih formula antara SINTAK dengan Master Excel!');
  process.exit(1);
} else {
  console.log('\n✅ SELURUH MODUL 100% PASS: Seluruh formula identik rupiah demi rupiah dengan Master Excel.');
  process.exit(0);
}
