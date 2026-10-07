import fs from 'fs';
import {
  calculateStikerSimulator,
  DEFAULT_STIKER_PARAMS,
  StikerMasterParams,
  StikerUkuran,
  StikerFinishingOption,
} from '../src/lib/stiker-calculator';

const expectedData = JSON.parse(fs.readFileSync('scripts/stiker-expected.json', 'utf8'));

console.log('========================================================================');
console.log('AUDIT BENCHMARK & REAKTIVITAS STIKER (EXHAUSTIVE 160 TIERS) — STANDAR SOP');
console.log('========================================================================\n');

let totalTiers = 0;
let passTiers = 0;
let failTiers = 0;

for (const [key, entry] of Object.entries(expectedData) as any) {
  const { jenis, ukuran, tiers } = entry;
  const finishing: StikerFinishingOption =
    jenis === 'CUTTING' ? 'Kiss Cutting (Setengah Putus)' : 'Non Cutting (Rajang Potong)';

  console.log(`\n--- UJI WORKBOOK: ${key} (${tiers.length} Tiers) ---`);

  for (const t of tiers) {
    totalTiers++;
    const res = calculateStikerSimulator(
      {
        ukuran: ukuran as StikerUkuran,
        oplah: t.oplah,
        finishing,
        marginPct: 30,
      },
      DEFAULT_STIKER_PARAMS
    );

    const diffHpp = Math.abs(res.totalHpp - t.totalHpp);
    const diffJual = Math.abs(res.hargaJualPerPcs - t.hargaJualPerPcs);

    if (diffHpp === 0 && diffJual === 0) {
      passTiers++;
      console.log(
        `[PASS] Oplah ${String(t.oplah).padStart(4)} | HPP: Rp ${res.totalHpp.toLocaleString('id-ID').padStart(8)} | Jual: Rp ${res.hargaJualPerPcs.toLocaleString('id-ID').padStart(6)} (Selisih Rp 0)`
      );
    } else {
      failTiers++;
      console.error(
        `[FAIL] Oplah ${t.oplah} | HPP calc ${res.totalHpp} vs excel ${t.totalHpp} (diff ${diffHpp}) | Jual calc ${res.hargaJualPerPcs} vs excel ${t.hargaJualPerPcs} (diff ${diffJual})`
      );
    }
  }
}

console.log('\n========================================================================');
console.log(`HASIL BENCHMARK: ${passTiers} / ${totalTiers} Tiers Lolos 100% Selisih Rp 0`);
console.log('========================================================================\n');

if (failTiers > 0) {
  console.error(`Terdapat ${failTiers} tier yang gagal! Periksa kembali formula.`);
  process.exit(1);
}

// UJI REAKTIVITAS PARAMETER (Pos 3 Syarat Wajib)
console.log('--- UJI REAKTIVITAS PARAMETER MASTER STIKER ---');

const baseNonCutting = calculateStikerSimulator({
  ukuran: '8 x 5 cm',
  oplah: 100,
  finishing: 'Non Cutting (Rajang Potong)',
});

const baseCutting = calculateStikerSimulator({
  ukuran: '8 x 5 cm',
  oplah: 100,
  finishing: 'Kiss Cutting (Setengah Putus)',
});

// 1. Uji Kenaikan Tarif Print Non Cutting
const resPrintNC = calculateStikerSimulator(
  {
    ukuran: '8 x 5 cm',
    oplah: 100,
    finishing: 'Non Cutting (Rajang Potong)',
  },
  { ...DEFAULT_STIKER_PARAMS, tarifPrintNonCuttingA3: 8500 }
);
const deltaPrintNC = resPrintNC.totalHpp - baseNonCutting.totalHpp;
console.log(`[PASS] Kenaikan Print Non Cutting Rp 7.500 -> Rp 8.500 (+Rp 1.000 x 4 lbr A3) -> Delta HPP = +Rp ${deltaPrintNC} (PASS)`);
if (deltaPrintNC !== 4000) throw new Error(`Reaktivitas Print Non Cutting gagal: delta ${deltaPrintNC}`);

// 2. Uji Kenaikan Tarif Print Cutting
const resPrintCut = calculateStikerSimulator(
  {
    ukuran: '8 x 5 cm',
    oplah: 100,
    finishing: 'Kiss Cutting (Setengah Putus)',
  },
  { ...DEFAULT_STIKER_PARAMS, tarifPrintCuttingA3: 25000 }
);
const deltaPrintCut = resPrintCut.totalHpp - baseCutting.totalHpp;
console.log(`[PASS] Kenaikan Print Cutting Rp 20.000 -> Rp 25.000 (+Rp 5.000 x 4 lbr A3) -> Delta HPP = +Rp ${deltaPrintCut} (PASS)`);
if (deltaPrintCut !== 20000) throw new Error(`Reaktivitas Print Cutting gagal: delta ${deltaPrintCut}`);

// 3. Uji Kenaikan Desain
const resDesain = calculateStikerSimulator(
  {
    ukuran: '8 x 5 cm',
    oplah: 100,
    finishing: 'Non Cutting (Rajang Potong)',
  },
  { ...DEFAULT_STIKER_PARAMS, tarifDesain: 25000 }
);
const deltaDesain = resDesain.totalHpp - baseNonCutting.totalHpp;
console.log(`[PASS] Kenaikan Desain Rp 15.000 -> Rp 25.000 (+Rp 10.000) -> Delta HPP = +Rp ${deltaDesain} (PASS)`);
if (deltaDesain !== 10000) throw new Error(`Reaktivitas Desain gagal: delta ${deltaDesain}`);

// 4. Uji Finishing Sisir
const resSisir = calculateStikerSimulator({
  ukuran: '8 x 5 cm',
  oplah: 100,
  finishing: 'Non Cutting (Rajang Potong)',
  opsiSisir: true,
});
const deltaSisir = resSisir.totalHpp - baseNonCutting.totalHpp;
console.log(`[PASS] Opsi Sisir Diaktifkan (4 lbr A3 / 500 = 1 paket x Rp 10.000) -> Delta HPP = +Rp ${deltaSisir} (PASS)`);
if (deltaSisir !== 10000) throw new Error(`Reaktivitas Sisir gagal: delta ${deltaSisir}`);

// 5. Uji Kenaikan Margin
const resMargin = calculateStikerSimulator({
  ukuran: '8 x 5 cm',
  oplah: 100,
  finishing: 'Non Cutting (Rajang Potong)',
  marginPct: 40,
});
const deltaJual = resMargin.hargaJualPerPcs - baseNonCutting.hargaJualPerPcs;
console.log(`[PASS] Kenaikan Margin 30% -> 40% -> Harga Jual Naik: Rp ${baseNonCutting.hargaJualPerPcs} -> Rp ${resMargin.hargaJualPerPcs} (+Rp ${deltaJual}) (PASS)`);
if (deltaJual <= 0) throw new Error(`Reaktivitas Margin gagal: delta ${deltaJual}`);

console.log('\nSEMUA UJI BENCHMARK DAN REAKTIVITAS STIKER LOLOS SEMPURNA!\n');
