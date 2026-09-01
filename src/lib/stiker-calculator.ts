// ponytail: kalkulator dan master parameter Stiker (23. Pricelist Stiker)
// Referensi: Pricelist Stiker.xlsx sheets HARGA JULI 2026 + Source/*.xlsm
// Ukuran: 8×5 cm, 7.5×6 cm, 9.5×6.5 cm, 10×12 cm, 21×29,7 cm
// Bahan: Sticker Vinyl Glossy 200 gsm / Sticker Cromo, Full Colour 1 Muka
// Finishing: Non Cutting (Rajang Potong), Kiss Cutting, Die Cut + Packing

export interface StikerMasterParams {
  // A. Bahan Stiker & Print Digital
  tarifStikerVinylA3: number;       // Rp 3.500 / lbr A3+
  tarifDesainStiker: number;        // Rp 10.000 / order

  // B. Finishing Rajang & Cutting
  tarifRajangPerLbr: number;        // Rp 50 / lbr
  tarifKissCutPerLbr: number;       // Rp 1.500 / lbr A3+
  tarifDieCutPerPcs: number;        // Rp 250 / pcs
  tarifPackingKardus: number;       // Rp 8.500 / box

  // C. Margin & Nego Standar
  marginDefaultPct: number;         // 30% (HARGA JULI 2026: ROUNDUP(HPP * 1.30, -2))
  negoDefaultPct: number;           // 4% (HARGA JULI 2026: ROUNDUP(Harga * 0.96, -1))
}

export const DEFAULT_STIKER_PARAMS: StikerMasterParams = {
  tarifStikerVinylA3: 3500,
  tarifDesainStiker: 10000,

  tarifRajangPerLbr: 50,
  tarifKissCutPerLbr: 1500,
  tarifDieCutPerPcs: 250,
  tarifPackingKardus: 8500,

  marginDefaultPct: 30,
  negoDefaultPct: 4,
};

export type StikerUkuran =
  | '8 x 5 cm'
  | '7.5 x 6 cm'
  | '9.5 x 6.5 cm'
  | '10 x 12 cm'
  | '21 x 29,7 cm';

export const STIKER_UKURAN_OPTIONS: StikerUkuran[] = [
  '8 x 5 cm',
  '7.5 x 6 cm',
  '9.5 x 6.5 cm',
  '10 x 12 cm',
  '21 x 29,7 cm',
];

export const STIKER_TIERS = [
  10, 50, 100, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900, 1000, 1500,
];

// Baseline HPP Map terverifikasi diff=0 dari Source Buku Tulis
export const STIKER_HPP_MAP: Record<StikerUkuran, Record<number, number>> = {
  '8 x 5 cm': {
    10: 2250.0,
    50: 600.0,
    100: 450.0,
    150: 350.0,
    200: 337.5,
    250: 300.0,
    300: 300.0,
    350: 278.57142857142856,
    400: 281.25,
    500: 270.0,
    600: 262.5,
    700: 257.14285714285717,
    800: 253.125,
    900: 250.0,
    1000: 247.5,
    1500: 240.0,
  },
  '7.5 x 6 cm': {
    10: 2250.0,
    50: 600.0,
    100: 450.0,
    150: 350.0,
    200: 337.5,
    250: 330.0,
    300: 300.0,
    350: 300.0,
    400: 300.0,
    500: 285.0,
    600: 275.0,
    700: 278.57142857142856,
    800: 271.875,
    900: 266.6666666666667,
    1000: 270.0,
    1500: 260.0,
  },
  '9.5 x 6.5 cm': {
    10: 2250.0,
    50: 750.0,
    100: 525.0,
    150: 500.0,
    200: 450.0,
    250: 420.0,
    300: 425.0,
    350: 407.1428571428572,
    400: 412.5,
    500: 390.0,
    600: 387.5,
    700: 385.7142857142858,
    800: 384.375,
    900: 375.0,
    1000: 375.0,
    1500: 370.0,
  },
  '10 x 12 cm': {
    10: 2250.0,
    50: 1050.0,
    100: 900.0,
    150: 800.0,
    200: 787.5,
    250: 750.0,
    300: 750.0,
    350: 728.5714285714284,
    400: 731.25,
    500: 720.0,
    600: 712.5,
    700: 707.1428571428571,
    800: 703.125,
    900: 700.0,
    1000: 697.5,
    1500: 695.0,
  },
  '21 x 29,7 cm': {
    10: 5250.0,
    50: 4050.0,
    100: 3900.0,
    150: 3850.0,
    200: 3825.0,
    250: 3810.0,
    300: 3800.0,
    350: 3792.857142857142,
    400: 3787.5,
    500: 3780.0,
    600: 3775.0,
    700: 3771.428571428571,
    800: 3768.75,
    900: 3766.6666666666665,
    1000: 3765.0,
    1500: 3760.0,
  },
};

export type StikerFinishingOption =
  | 'Non Cutting (Rajang Potong)'
  | 'Kiss Cutting (Setengah Putus)'
  | 'Die Cut (Potong Putus)';

export interface StikerSimulatorInput {
  ukuran: StikerUkuran;
  oplah: number;
  finishing: StikerFinishingOption;
  marginPct: number;
  negoDiskonPct: number;
}

export interface StikerSimulatorResult {
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
  totalHpp: number;
  input: StikerSimulatorInput;
  breakdown: {
    no: number;
    komponen: string;
    keterangan: string;
    biaya: number;
    porsiPct: number;
  }[];
}

export function getBaseHppStiker(ukuran: StikerUkuran, oplah: number): number {
  const map = STIKER_HPP_MAP[ukuran];
  if (map[oplah]) return map[oplah];

  const tiers = STIKER_TIERS;
  if (oplah <= tiers[0]) return map[tiers[0]];
  if (oplah >= tiers[tiers.length - 1]) return map[tiers[tiers.length - 1]];

  for (let i = 0; i < tiers.length - 1; i++) {
    if (tiers[i] <= oplah && oplah <= tiers[i + 1]) {
      const t1 = tiers[i];
      const t2 = tiers[i + 1];
      const h1 = map[t1];
      const h2 = map[t2];
      return h1 + ((h2 - h1) * (oplah - t1)) / (t2 - t1);
    }
  }
  return map[tiers[0]];
}

export function calculateStikerSimulator(
  input: StikerSimulatorInput,
  customParams?: Partial<StikerMasterParams>
): StikerSimulatorResult {
  const p: StikerMasterParams = {
    ...DEFAULT_STIKER_PARAMS,
    ...customParams,
  };

  const oplah = Math.max(1, input.oplah);
  const baseHppPerPcs = getBaseHppStiker(input.ukuran, oplah);

  // Finishing Cutting Tambahan
  let biayaCuttingPerPcs = 0;
  if (input.finishing === 'Kiss Cutting (Setengah Putus)') {
    // Estimasi kiss cutting per pcs (~Rp 800 - 1500)
    biayaCuttingPerPcs = 1100;
  } else if (input.finishing === 'Die Cut (Potong Putus)') {
    biayaCuttingPerPcs = p.tarifDieCutPerPcs;
  }

  const hppPerPcs = baseHppPerPcs + biayaCuttingPerPcs;
  const totalHpp = hppPerPcs * oplah;

  const marginPct = input.marginPct ?? p.marginDefaultPct;
  const negoDiskonPct = input.negoDiskonPct ?? p.negoDefaultPct;

  // HARGA JULI 2026: ROUNDUP(HPP * 1.30, -2) & Nego = ROUNDUP(Harga * 0.96, -1)
  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + marginPct / 100)) / 100) * 100;
  const negoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 10) * 10;
  const totalHargaJual = hargaJualPerPcs * oplah;

  // Breakdown representatif
  const rawBreakdown = [
    {
      komponen: 'Bahan Sticker Vinyl Glossy 200 gsm',
      keterangan: `Ukuran ${input.ukuran} 1 Muka Full Colour`,
      biaya: Math.round(totalHpp * 0.65),
    },
    {
      komponen: 'Cetak Print Digital POD',
      keterangan: 'Full Colour Resolusi Tinggi',
      biaya: Math.round(totalHpp * 0.25),
    },
    {
      komponen: 'Finishing & Packing',
      keterangan: `${input.finishing} + Packing Rapi`,
      biaya: Math.round(totalHpp * 0.10),
    },
  ];

  const breakdown = rawBreakdown.map((item, idx) => ({
    no: idx + 1,
    komponen: item.komponen,
    keterangan: item.keterangan,
    biaya: Math.round(item.biaya),
    porsiPct: totalHpp > 0 ? Number(((item.biaya / totalHpp) * 100).toFixed(1)) : 0,
  }));

  return {
    hppPerPcs,
    hargaJualPerPcs,
    negoPerPcs,
    totalHargaJual,
    totalHpp,
    input,
    breakdown,
  };
}

export interface StikerMatrixCell {
  ukuran: StikerUkuran;
  oplah: number;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
}

export function recalculateStikerMatrix(
  customParams?: Partial<StikerMasterParams>,
  finishing: StikerFinishingOption = 'Non Cutting (Rajang Potong)',
  marginPct = 30,
  negoDiskonPct = 4
): StikerMatrixCell[] {
  const cells: StikerMatrixCell[] = [];

  for (const ukuran of STIKER_UKURAN_OPTIONS) {
    for (const oplah of STIKER_TIERS) {
      const res = calculateStikerSimulator(
        {
          ukuran,
          oplah,
          finishing,
          marginPct,
          negoDiskonPct,
        },
        customParams
      );

      cells.push({
        ukuran,
        oplah,
        hppPerPcs: res.hppPerPcs,
        hargaJualPerPcs: res.hargaJualPerPcs,
        negoPerPcs: res.negoPerPcs,
        totalHargaJual: res.totalHargaJual,
      });
    }
  }

  return cells;
}
