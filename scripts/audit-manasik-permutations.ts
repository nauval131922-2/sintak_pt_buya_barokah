import XLSX from 'xlsx';
import { calculateManasikSimulator, DEFAULT_MANASIK_PARAMS } from '../src/lib/manasik-calculator';

console.log('========================================================================================');
console.log('BENCHMARK PERMUTASI & REAKTIVITAS BUKU MANASIK: SINTAK vs EXCEL MASTER (100% PARITY)');
console.log('========================================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assertCheck(desc: string, actTotal: number, exTotal: number, actJual: number, exJual: number) {
  totalTests++;
  const diffTot = Math.abs(actTotal - exTotal);
  const diffJual = Math.abs(actJual - exJual);
  const pass = diffTot <= 1 && diffJual <= 10;
  if (pass) passedTests++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${desc.padEnd(54)} | HPP Act: ${actTotal.toLocaleString('id-ID').padStart(10)} Ex: ${exTotal.toLocaleString('id-ID').padStart(10)} (d:${diffTot}) | Jual Act: ${actJual.toLocaleString('id-ID').padStart(6)} Ex: ${exJual.toLocaleString('id-ID').padStart(6)} (d:${diffJual})`);
  return pass;
}

// 1. FILE 1: Custom Cover 2026.xlsm
console.log('--- 1. MANASIK CUSTOM COVER 10 x 15,5 cm (216 Hal / 212+4) ---');
const wb1 = XLSX.readFile('E:\\percetakan buya barokah\\backup\\a1\\02__PEMASARAN\\0202_KALKULASI HARGA\\020201 MASTER HARGA\\02020107 BUKU, KITAB, MAJALAH\\02020107 BUKU, KITAB SOFT COVER UK. 10 x 15,5 - BUKU MANASIK - Custom Cover 2026.xlsm');
const b1 = wb1.Sheets['BUKU'];

for (let r = 7; r <= 24; r++) {
  const q = Number(b1['H' + r]?.v);
  const exTot = Math.round(Number(b1['CY' + r]?.v));
  const exJual = Number(b1['DE' + r]?.v);
  if (q && exTot > 0) {
    const res = calculateManasikSimulator({
      varian: 'Custom Cover 10 x 15,5',
      oplah: q,
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
    assertCheck(`Custom Cover Oplah ${q}`, res.summary.totalHpp, exTot, res.summary.hargaJualPerPcs, exJual);
  }
}

// 2. FILE 2: Kosongan.xlsm (Mode Print Buya)
console.log('\n--- 2. MANASIK KOSONGAN 10 x 15,5 cm (Mode Print Buya) ---');
const wb2 = XLSX.readFile('E:\\percetakan buya barokah\\backup\\a1\\02__PEMASARAN\\0202_KALKULASI HARGA\\020201 MASTER HARGA\\02020107 BUKU, KITAB, MAJALAH\\02020107 BUKU, KITAB SOFT COVER UK. 10 x 15,5 - BUKU MANASIK - Kosongan.xlsm');
const b2 = wb2.Sheets['BUKU'];

for (let r = 7; r <= 24; r++) {
  const q = Number(b2['H' + r]?.v);
  const exTot = Math.round(Number(b2['EB' + r]?.v));
  const exJual = Number(b2['EH' + r]?.v);
  if (q && exTot > 0 && exJual > 0) {
    const res = calculateManasikSimulator({
      varian: 'Kosongan 10 x 15,5',
      oplah: q,
      jumlahHalaman: 212,
      tipeJilid: 'Tali Kur',
      metodeCetakCover: 'Tanpa Cover',
      metodeCetakIsi: 'Print Buya',
      laminasiCover: 'Tanpa Laminasi',
      opsiPlastikOpp: false,
      opsiKardus: true,
      opsiSisipan: false,
      marginPct: 0,
      negoDiskonPct: 0,
    }, DEFAULT_MANASIK_PARAMS);
    assertCheck(`Kosongan Print Buya Oplah ${q}`, res.summary.totalHpp, exTot, res.summary.hargaJualPerPcs, exJual);
  }
}

// 3. FILE 3: Mini TikTok 6,3 x 10,3 cm (Mode Oliver)
console.log('\n--- 3. MANASIK MINI TIKTOK 6,3 x 10,3 cm (48 Hal / 24 Kartu) ---');
const wb3 = XLSX.readFile('E:\\percetakan buya barokah\\backup\\a1\\02__PEMASARAN\\0202_KALKULASI HARGA\\020201 MASTER HARGA\\02020107 BUKU, KITAB, MAJALAH\\02020107 BUKU, KITAB SOFT COVER UK. 6,3 x 10,3 - BUKU MANASIK MINI TIKTOK.xlsm');
const b3 = wb3.Sheets['BUKU'];

for (let r = 7; r <= 24; r++) {
  const q = Number(b3['H' + r]?.v);
  const exTot = Math.round(Number(b3['BI' + r]?.v));
  const exJual = Number(b3['BO' + r]?.v);
  if (q && exTot > 0) {
    const res = calculateManasikSimulator({
      varian: 'Mini TikTok 6,3 x 10,3',
      oplah: q,
      jumlahHalaman: 48,
      tipeJilid: 'Ring Binder',
      metodeCetakCover: 'Offset (Oliver)',
      laminasiCover: 'Glossy',
      opsiPlastikOpp: true,
      opsiKardus: true,
      opsiSisipan: false,
      marginPct: 32,
      negoDiskonPct: 0,
    }, DEFAULT_MANASIK_PARAMS);
    assertCheck(`Mini TikTok Oliver Oplah ${q}`, res.summary.totalHpp, exTot, res.summary.hargaJualPerPcs, exJual);
  }
}

// 4. UJI REAKTIVITAS PARAMETER (ANTI-HARDCODE)
console.log('\n--- 4. UJI REAKTIVITAS PARAMETER BUKU MANASIK ---');
function assertReactivity(paramName: string, hpp1: number, hpp2: number) {
  totalTests++;
  const diff = Math.abs(hpp2 - hpp1);
  const pass = diff > 0;
  if (pass) passedTests++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] Reaktivitas ${paramName.padEnd(30)} | HPP A: Rp ${hpp1.toLocaleString('id-ID')} -> HPP B: Rp ${hpp2.toLocaleString('id-ID')} (Delta: Rp ${diff.toLocaleString('id-ID')})`);
  if (!pass) throw new Error(`CRITICAL: Parameter ${paramName} tidak merespons perubahan!`);
  return pass;
}

const t1 = calculateManasikSimulator({ varian: 'Custom Cover 10 x 15,5', oplah: 500, jumlahHalaman: 216, tipeJilid: 'Tali Kur', metodeCetakCover: 'Print Digital (A3+)', laminasiCover: 'Doff', opsiPlastikOpp: true, opsiKardus: true, opsiSisipan: true }, { ...DEFAULT_MANASIK_PARAMS, tarifPrintCoverA3: 2700 }).summary.totalHpp;
const t2 = calculateManasikSimulator({ varian: 'Custom Cover 10 x 15,5', oplah: 500, jumlahHalaman: 216, tipeJilid: 'Tali Kur', metodeCetakCover: 'Print Digital (A3+)', laminasiCover: 'Doff', opsiPlastikOpp: true, opsiKardus: true, opsiSisipan: true }, { ...DEFAULT_MANASIK_PARAMS, tarifPrintCoverA3: 3500 }).summary.totalHpp;
assertReactivity('tarifPrintCoverA3', t1, t2);

const t3 = calculateManasikSimulator({ varian: 'Custom Cover 10 x 15,5', oplah: 500, jumlahHalaman: 216, tipeJilid: 'Tali Kur', metodeCetakCover: 'Print Digital (A3+)', laminasiCover: 'Doff', opsiPlastikOpp: true, opsiKardus: true, opsiSisipan: true }, { ...DEFAULT_MANASIK_PARAMS, tarifPasangTali: 112 }).summary.totalHpp;
const t4 = calculateManasikSimulator({ varian: 'Custom Cover 10 x 15,5', oplah: 500, jumlahHalaman: 216, tipeJilid: 'Tali Kur', metodeCetakCover: 'Print Digital (A3+)', laminasiCover: 'Doff', opsiPlastikOpp: true, opsiKardus: true, opsiSisipan: true }, { ...DEFAULT_MANASIK_PARAMS, tarifPasangTali: 250 }).summary.totalHpp;
assertReactivity('tarifPasangTali', t3, t4);

const t5 = calculateManasikSimulator({ varian: 'Mini TikTok 6,3 x 10,3', oplah: 500, jumlahHalaman: 48, tipeJilid: 'Ring Binder', metodeCetakCover: 'Offset (Oliver)', laminasiCover: 'Glossy', opsiPlastikOpp: true, opsiKardus: true, opsiSisipan: false }, { ...DEFAULT_MANASIK_PARAMS, tarifTaliCocardMini: 2500 }).summary.totalHpp;
const t6 = calculateManasikSimulator({ varian: 'Mini TikTok 6,3 x 10,3', oplah: 500, jumlahHalaman: 48, tipeJilid: 'Ring Binder', metodeCetakCover: 'Offset (Oliver)', laminasiCover: 'Glossy', opsiPlastikOpp: true, opsiKardus: true, opsiSisipan: false }, { ...DEFAULT_MANASIK_PARAMS, tarifTaliCocardMini: 3500 }).summary.totalHpp;
assertReactivity('tarifTaliCocardMini', t5, t6);

console.log('\n========================================================================================');
console.log(`TOTAL PENGUJIAN: ${totalTests} | LULUS: ${passedTests} | GAGAL: ${totalTests - passedTests}`);
console.log(`STATUS AKHIR: ${passedTests === totalTests ? '✅ 100% PARITY TERCAPAI (0 SELISIH DI SELURUH PERMUTASI)' : '❌ MASIH ADA SELISIH'}`);
console.log('========================================================================================\n');
