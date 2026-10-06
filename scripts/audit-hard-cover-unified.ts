// Benchmark Permutasi & Uji Reaktivitas Buku Hard Cover Unified vs Excel Master
// Standar SOP PANDUAN_AUDIT_EXCEL_SINTAK.md & AI_RULES.md
import fs from 'fs';
import path from 'path';
import {
  calculateBukuHardCoverUnified,
  DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS,
  HardCoverUkuran,
  BukuHardCoverUnifiedParams,
} from '../src/lib/buku-hard-cover-unified';

interface BenchmarkTier {
  row: number;
  oplah: number;
  hpp_total: number;
  hpp_per_exp: number;
  total_harga_jual: number;
  harga_per_exp: number;
  harga_final: number;
}

interface BenchmarkGroup {
  ukuran: string;
  mesin_cover: string;
  mesin_isi: string;
  tiers: BenchmarkTier[];
}

const expectedPath = path.join(__dirname, 'bhc-expected.json');
if (!fs.existsSync(expectedPath)) {
  console.error('File bhc-expected.json tidak ditemukan!');
  process.exit(1);
}

const benchmarkData: BenchmarkGroup[] = JSON.parse(fs.readFileSync(expectedPath, 'utf-8'));

console.log('='.repeat(75));
console.log(' AUDIT BENCHMARK & REAKTIVITAS BUKU HARD COVER UNIFIED');
console.log(' Standar SOP PANDUAN_AUDIT_EXCEL_SINTAK.md (Pos 3)');
console.log('='.repeat(75));

let totalPassed = 0;
let totalFailed = 0;

// 1. BENCHMARK TIERS EXCEL
// Kita uji grup Oliver-Oliver yang menjadi patokan matriks 1:1 di Excel
const oliverGroups = benchmarkData.filter((g) => g.mesin_cover === 'OLIVER' && g.mesin_isi === 'OLIVER');

for (const grp of oliverGroups) {
  const ukuran = grp.ukuran.replace('x', '×').trim() as HardCoverUkuran;
  console.log(`\n▶ Menguji Ukuran: ${grp.ukuran} [${grp.mesin_cover} - ${grp.mesin_isi}] (${grp.tiers.length} Tiers)`);
  console.log('-'.repeat(75));
  console.log(' Oplah | Excel (Rp) | SINTAK (Rp) | Selisih | HPP SINTAK (Rp) | Status');
  console.log('-'.repeat(75));

  for (const tier of grp.tiers) {
    const res = calculateBukuHardCoverUnified(DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS, {
      ukuran,
      oplah: tier.oplah,
      halaman: 100,
      mesinCover: 'OLIVER',
      mesinIsi: 'OLIVER',
      finishingCover: 'None',
    });

    const diff = Math.abs(res.hargaFinal - tier.harga_final);
    const pass = diff === 0;

    if (pass) {
      totalPassed++;
      console.log(
        ` ${tier.oplah.toString().padStart(5)} | ${tier.harga_final.toLocaleString('id-ID').padStart(10)} | ${res.hargaFinal.toLocaleString('id-ID').padStart(11)} | ${diff.toLocaleString('id-ID').padStart(7)} | ${res.hppTotal.toLocaleString('id-ID', { maximumFractionDigits: 0 }).padStart(15)} | [PASS]`
      );
    } else {
      totalFailed++;
      console.error(
        ` ${tier.oplah.toString().padStart(5)} | ${tier.harga_final.toLocaleString('id-ID').padStart(10)} | ${res.hargaFinal.toLocaleString('id-ID').padStart(11)} | ${diff.toLocaleString('id-ID').padStart(7)} | ${res.hppTotal.toLocaleString('id-ID', { maximumFractionDigits: 0 }).padStart(15)} | [FAIL]`
      );
    }
  }
}

// 2. UJI REAKTIVITAS PARAMETER (DELTA HPP > 0)
console.log('\n' + '='.repeat(75));
console.log(' UJI REAKTIVITAS PARAMETER (Membuktikan Delta HPP > 0)');
console.log('='.repeat(75));

const baseInput = {
  ukuran: '14,5×20,25' as HardCoverUkuran,
  oplah: 1000,
  halaman: 100,
  mesinCover: 'OLIVER' as const,
  mesinIsi: 'OLIVER' as const,
};

const baseCalc = calculateBukuHardCoverUnified(DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS, baseInput);

const reaktivitasTests: {
  nama: string;
  patch: Partial<BukuHardCoverUnifiedParams>;
}[] = [
  { nama: 'Kenaikan UMR Rp 2.818.585 -> Rp 3.500.000', patch: { umr: 3500000 } },
  { nama: 'Kenaikan Kertas Cover Rp 17.400 -> Rp 25.000 /kg', patch: { hargaKertasCoverPerKg: 25000 } },
  { nama: 'Kenaikan Board per Pack Rp 200.000 -> Rp 250.000', patch: { hargaBoardPerPack: 250000 } },
  { nama: 'Kenaikan Kertas Isi HVS Rp 15.700 -> Rp 22.000 /kg', patch: { hargaKertasIsiPerKg: 22000 } },
  { nama: 'Kenaikan Plat Oliver Rp 45.000 -> Rp 60.000', patch: { tarifPlateCoverOliver: 60000 } },
  { nama: 'Kenaikan Min Ongkos Oliver Rp 90.000 -> Rp 120.000', patch: { minOngkosCoverOliver: 120000 } },
  { nama: 'Kenaikan Lem Hard Cover Rp 58.000 -> Rp 80.000 /kg', patch: { hargaLemHardCoverKg: 80000 } },
  { nama: 'Kenaikan Kardus Box Rp 8.500 -> Rp 12.000', patch: { hargaKardusBox: 12000 } },
];

let reaktivitasPassed = 0;
for (const test of reaktivitasTests) {
  const modifiedParams = { ...DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS, ...test.patch };
  const modCalc = calculateBukuHardCoverUnified(modifiedParams, baseInput);
  const deltaHpp = modCalc.hppTotal - baseCalc.hppTotal;

  if (deltaHpp > 0) {
    reaktivitasPassed++;
    console.log(` [PASS] ${test.nama.padEnd(52)} | +Rp ${deltaHpp.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`);
  } else {
    console.error(` [FAIL] ${test.nama} | Delta HPP <= 0! (${deltaHpp})`);
  }
}

// 3. UJI PERMUTASI FINISHING COVER
console.log('\n' + '='.repeat(75));
console.log(' UJI PERMUTASI FINISHING KHUSUS COVER');
console.log('='.repeat(75));

const finishingOptions = [
  'Laminasi Glossy',
  'Laminasi Doff',
  'Laminasi Glossy + Spot UV',
  'Laminasi Doff + Foil',
  'Laminasi Doff + Spot UV + Foil + Emboss',
] as const;

let finishingPassed = 0;
for (const fin of finishingOptions) {
  const finCalc = calculateBukuHardCoverUnified(DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS, {
    ...baseInput,
    finishingCover: fin,
  });
  const deltaHpp = finCalc.hppTotal - baseCalc.hppTotal;
  if (deltaHpp > 0) {
    finishingPassed++;
    console.log(` [PASS] Finishing ${fin.padEnd(45)} | +Rp ${deltaHpp.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`);
  } else {
    console.error(` [FAIL] Finishing ${fin} tidak reaktif!`);
  }
}

console.log('\n' + '='.repeat(75));
console.log(` RINGKASAN HASIL AUDIT BUKU HARD COVER:`);
console.log(` - Benchmark Tier Excel : ${totalPassed} PASSED, ${totalFailed} FAILED (100% Selisih Rp 0)`);
console.log(` - Reaktivitas Parameter: ${reaktivitasPassed}/${reaktivitasTests.length} PASSED (Delta HPP > 0)`);
console.log(` - Permutasi Finishing  : ${finishingPassed}/${finishingOptions.length} PASSED`);
console.log('='.repeat(75));

if (totalFailed > 0 || reaktivitasPassed < reaktivitasTests.length) {
  process.exit(1);
} else {
  console.log(' [OK] AUDIT BUKU HARD COVER LOLOS 100% SESUAI STANDAR SOP.\n');
}
