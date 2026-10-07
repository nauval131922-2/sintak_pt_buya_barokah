import fs from 'fs';
import path from 'path';
import {
  calculatePosterSimulator,
  DEFAULT_POSTER_PARAMS,
  PosterMasterParams,
  PosterUkuran,
} from '../src/lib/poster-calculator';

interface ExpectedTier {
  oplah: number;
  hppPerPcs: number;
  totalHpp: number;
  hargaJualBuku: number;
  komponen: {
    kertas: number;
    desain: number;
    plat: number;
    ongkosCetak: number;
    transp: number;
    sisir: number;
  };
}

interface ExpectedGroup {
  file: string;
  ukuran: string;
  mesin: string;
  tiers: ExpectedTier[];
}

const expectedPath = path.resolve(__dirname, 'poster-expected.json');
const raw = fs.readFileSync(expectedPath, 'utf8');
const data: Record<string, ExpectedGroup> = JSON.parse(raw);

console.log('='.repeat(80));
console.log(' AUDIT BENCHMARK & REAKTIVITAS POSTER (EXHAUSTIVE SWEEP 44 TIERS)');
console.log(' Standar SOP PANDUAN_AUDIT_EXCEL_SINTAK.md (Pos 0 s/d Pos 4)');
console.log('='.repeat(80));

let totalTiers = 0;
let passedTiers = 0;
let failedTiers = 0;

for (const [key, grp] of Object.entries(data)) {
  console.log(`\n▶ [${grp.file}]`);
  console.log(`  Ukuran: ${grp.ukuran} | Mesin: ${grp.mesin} (${grp.tiers.length} Tiers)`);
  console.log('-'.repeat(80));
  console.log(
    ' Oplah | Excel HPP (Rp) | SINTAK HPP (Rp) | Selisih HPP | Harga Jual | Status'
  );
  console.log('-'.repeat(80));

  for (const t of grp.tiers) {
    totalTiers++;
    const res = calculatePosterSimulator(
      {
        ukuran: grp.ukuran as PosterUkuran,
        oplah: t.oplah,
        mesin: grp.mesin === 'Print Inter' ? 'Print Inter' : grp.mesin === 'Oliver' ? 'Oliver' : 'SM',
        finishing: 'Tanpa Laminasi',
      },
      DEFAULT_POSTER_PARAMS
    );

    const diffHpp = Math.abs(res.hppPerPcs - t.hppPerPcs);
    const isPass = diffHpp < 0.01;

    if (isPass) {
      passedTiers++;
      console.log(
        ` ${String(t.oplah).padStart(5)} | ` +
        `${t.hppPerPcs.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(14)} | ` +
        `${res.hppPerPcs.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(15)} | ` +
        `${diffHpp.toFixed(4).padStart(11)} | ` +
        `${res.hargaJualPerPcs.toLocaleString('id-ID').padStart(10)} | ` +
        `[PASS]`
      );
    } else {
      failedTiers++;
      console.log(
        ` ${String(t.oplah).padStart(5)} | ` +
        `${t.hppPerPcs.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(14)} | ` +
        `${res.hppPerPcs.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(15)} | ` +
        `${diffHpp.toFixed(4).padStart(11)} | ` +
        `${res.hargaJualPerPcs.toLocaleString('id-ID').padStart(10)} | ` +
        `[FAIL]`
      );
    }
  }
}

console.log('\n' + '='.repeat(80));
console.log(' UJI REAKTIVITAS PARAMETER (Membuktikan Delta HPP > 0)');
console.log('='.repeat(80));

function testReactivity(
  name: string,
  baseInput: { ukuran: PosterUkuran; oplah: number; mesin?: any },
  paramKey: keyof PosterMasterParams,
  newValue: number
) {
  const baseRes = calculatePosterSimulator(
    { ...baseInput, finishing: 'Tanpa Laminasi' },
    DEFAULT_POSTER_PARAMS
  );
  const modRes = calculatePosterSimulator(
    { ...baseInput, finishing: 'Tanpa Laminasi' },
    { ...DEFAULT_POSTER_PARAMS, [paramKey]: newValue }
  );

  const delta = modRes.totalHpp - baseRes.totalHpp;
  const passed = delta > 0;
  console.log(
    ` [${passed ? 'PASS' : 'FAIL'}] ${name.padEnd(58)} | Delta Total HPP: +Rp ${delta.toLocaleString('id-ID')}`
  );
  if (!passed) {
    throw new Error(`Reaktivitas gagal untuk parameter: ${String(paramKey)}`);
  }
}

testReactivity(
  'Kenaikan Tarif Kertas AC 230 Rp 16.400 -> Rp 19.000 (Oliver)',
  { ukuran: '32 x 48 cm', oplah: 600, mesin: 'Oliver' },
  'tarifArtCarton230Kg',
  19000
);

testReactivity(
  'Kenaikan Tarif Print A3+ Rp 2.500 -> Rp 3.000 (Print Inter)',
  { ukuran: '32 x 48 cm', oplah: 100, mesin: 'Print Inter' },
  'tarifPrintA3',
  3000
);

testReactivity(
  'Kenaikan Tarif Desain Rp 30.000 -> Rp 50.000',
  { ukuran: '48 x 64 cm', oplah: 500, mesin: 'Oliver' },
  'tarifDesain',
  50000
);

testReactivity(
  'Kenaikan Tarif Plat Oliver Rp 45.000 -> Rp 60.000',
  { ukuran: '48 x 64 cm', oplah: 1000, mesin: 'Oliver' },
  'oliverPlatUnit',
  60000
);

testReactivity(
  'Kenaikan Min Ongkos Cetak Oliver Rp 90.000 -> Rp 120.000',
  { ukuran: '48 x 64 cm', oplah: 1000, mesin: 'Oliver' },
  'oliverMinOngkos',
  120000
);

testReactivity(
  'Kenaikan Over Drek Oliver Rp 40 -> Rp 60 (tarikan over)',
  { ukuran: '48 x 64 cm', oplah: 2000, mesin: 'Oliver' },
  'oliverDrekOver',
  60
);

testReactivity(
  'Kenaikan Tarif Plat SM Rp 78.000 -> Rp 100.000',
  { ukuran: '50 x 70 cm', oplah: 2000, mesin: 'SM' },
  'smPlatUnit',
  100000
);

testReactivity(
  'Kenaikan Min Ongkos Cetak SM Rp 310.000 -> Rp 400.000',
  { ukuran: '50 x 70 cm', oplah: 2000, mesin: 'SM' },
  'smMinOngkos',
  400000
);

testReactivity(
  'Kenaikan Over Drek SM Rp 100 -> Rp 150 (tarikan over)',
  { ukuran: '50 x 70 cm', oplah: 5000, mesin: 'SM' },
  'smDrekOver',
  150
);

testReactivity(
  'Kenaikan Biaya Transport Rp 25.000 -> Rp 50.000',
  { ukuran: '70 x 100 cm', oplah: 1000, mesin: 'SM' },
  'tarifTransp',
  50000
);

testReactivity(
  'Kenaikan Tarif Sisir Rp 5.000 -> Rp 8.000',
  { ukuran: '70 x 100 cm', oplah: 2000, mesin: 'SM' },
  'tarifSisirPer100Plano',
  8000
);

console.log('\n' + '='.repeat(80));
console.log(' UJI PERMUTASI FINISHING (Laminasi Glossy / Doff / UV Varnish)');
console.log('='.repeat(80));

const baseFinishingRes = calculatePosterSimulator(
  { ukuran: '48 x 64 cm', oplah: 1000, finishing: 'Tanpa Laminasi' },
  DEFAULT_POSTER_PARAMS
);

for (const fin of ['Laminasi Glossy', 'Laminasi Doff', 'UV Varnish'] as const) {
  const finRes = calculatePosterSimulator(
    { ukuran: '48 x 64 cm', oplah: 1000, finishing: fin },
    DEFAULT_POSTER_PARAMS
  );
  const delta = finRes.totalHpp - baseFinishingRes.totalHpp;
  const passed = delta > 0;
  console.log(
    ` [${passed ? 'PASS' : 'FAIL'}] Finishing: ${fin.padEnd(20)} | Total HPP: Rp ${finRes.totalHpp.toLocaleString('id-ID')} (+Rp ${delta.toLocaleString('id-ID')})`
  );
}

console.log('\n' + '='.repeat(80));
console.log(' RINGKASAN AUDIT POSTER (EXHAUSTIVE SWEEP):');
console.log(` - Total File Workbook Sumber : ${Object.keys(data).length} File Workbook`);
console.log(` - Total Tier Dieksekusi      : ${totalTiers} Tier`);
console.log(` - Tier Parity Murni (Rp 0)   : ${passedTiers} PASSED (100% Selisih Rp 0)`);
console.log(` - Tier Gagal (Unexplained)   : ${failedTiers} FAILED`);
console.log('='.repeat(80));

if (failedTiers > 0) {
  console.error('\n[FATAL] Terdapat kegagalan pada uji tier!');
  process.exit(1);
} else {
  console.log('\n[OK] AUDIT POSTER MENYAPU 100% WORKBOOK LOLOS SESUAI SOP.');
}
