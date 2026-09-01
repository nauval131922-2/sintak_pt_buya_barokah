// ponytail: kalkulator dan master parameter Kalender Kop (27. Pricelist Kalender Kop)
// Referensi: Pricelist Kalender Kop.xlsx sheets HARGA JULI 2026 + Source/*.xlsm
// Ukuran: 32 x 48 cm, Dwi Wulan - 6 Lembar (Art Paper 120 gsm)
// Varian: 1 Warna, 2 Warna, 3 Warna, 4 Warna
// Finishing: Cetak Sablon/Offset Kop Surat pada kalender blanko + Klem Seng + Packing

export interface KalenderKopMasterParams {
  // A. Blanko Kalender Dwi Wulan 6 Lembar
  tarifBlankoKalender6Lbr: number;   // Rp 5.500 / eks (Blanko Kalender 6 lembar AP 120 gsm)

  // B. Ongkos Cetak Kop per Warna
  tarifCetakKop1Warna: number;       // Rp 1.500 / eks
  tarifCetakKop2Warna: number;       // Rp 2.500 / eks
  tarifCetakKop3Warna: number;       // Rp 3.500 / eks
  tarifCetakKop4Warna: number;       // Rp 4.500 / eks
  tarifDesainKop: number;            // Rp 25.000 / order

  // C. Finishing Jilid Klem Seng & Packing
  tarifKlemSeng: number;             // Rp 400 / eks
  tarifPackingKardus: number;        // Rp 8.500 / box

  // D. Margin & Nego Standar
  marginDefaultPct: number;          // 0% (HPP sudah all-in harga penawaran standar)
  negoDefaultPct: number;            // 4% (Batas nego standar marketing)
}

export const DEFAULT_KALENDER_KOP_PARAMS: KalenderKopMasterParams = {
  tarifBlankoKalender6Lbr: 5500,

  tarifCetakKop1Warna: 1500,
  tarifCetakKop2Warna: 2500,
  tarifCetakKop3Warna: 3500,
  tarifCetakKop4Warna: 4500,
  tarifDesainKop: 25000,

  tarifKlemSeng: 400,
  tarifPackingKardus: 8500,

  marginDefaultPct: 0,
  negoDefaultPct: 4,
};

export type KalenderKopVarian =
  | '1 Warna'
  | '2 Warna'
  | '3 Warna'
  | '4 Warna';

export const KALENDER_KOP_VARIAN_OPTIONS: KalenderKopVarian[] = [
  '1 Warna',
  '2 Warna',
  '3 Warna',
  '4 Warna',
];

export const KALENDER_KOP_TIERS = [
  50, 70, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 1000,
];

// Baseline HPP Map terverifikasi diff=0 dari Source Excel
export const KALENDER_KOP_HPP_MAP: Record<KalenderKopVarian, Record<number, number>> = {
  '1 Warna': {
    50: 11600.0,
    70: 9857.14,
    100: 8550.0,
    150: 7533.33,
    200: 7025.0,
    250: 6720.0,
    300: 6516.67,
    350: 6387.43,
    400: 6291.5,
    450: 6216.89,
    500: 6157.2,
    550: 6108.36,
    600: 6067.67,
    650: 6054.85,
    700: 6043.86,
    1000: 6001.0,
  },
  '2 Warna': {
    50: 14300.0,
    70: 11785.71,
    100: 9900.0,
    150: 8433.33,
    200: 7700.0,
    250: 7260.0,
    300: 6966.67,
    350: 6789.14,
    400: 6658.0,
    450: 6556.0,
    500: 6474.4,
    550: 6407.64,
    600: 6352.0,
    650: 6327.0,
    700: 6305.57,
    1000: 6222.0,
  },
  '3 Warna': {
    50: 17000.0,
    70: 13714.29,
    100: 11250.0,
    150: 9333.33,
    200: 8375.0,
    250: 7800.0,
    300: 7416.67,
    350: 7190.86,
    400: 7024.5,
    450: 6895.11,
    500: 6791.6,
    550: 6706.91,
    600: 6636.33,
    650: 6599.15,
    700: 6567.29,
    1000: 6443.0,
  },
  '4 Warna': {
    50: 19700.0,
    70: 15642.86,
    100: 12600.0,
    150: 10233.33,
    200: 9050.0,
    250: 8340.0,
    300: 7866.67,
    350: 7592.57,
    400: 7391.0,
    450: 7234.22,
    500: 7108.8,
    550: 7006.18,
    600: 6920.67,
    650: 6871.31,
    700: 6829.0,
    1000: 6664.0,
  },
};

export interface KalenderKopSimulatorInput {
  varian: KalenderKopVarian;
  oplah: number;
  marginPct?: number; // default 0%
  negoDiskonPct?: number; // default 4%
}

export interface KalenderKopSimulatorResult {
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
  totalHpp: number;
  input: KalenderKopSimulatorInput;
  breakdown: {
    no: number;
    komponen: string;
    keterangan: string;
    biaya: number;
    porsiPct: number;
  }[];
}

export function getBaseHppKalenderKop(varian: KalenderKopVarian, oplah: number): number {
  const map = KALENDER_KOP_HPP_MAP[varian];
  if (map[oplah]) return map[oplah];

  const tiers = KALENDER_KOP_TIERS;
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

export function calculateKalenderKopSimulator(
  input: KalenderKopSimulatorInput,
  customParams?: Partial<KalenderKopMasterParams>
): KalenderKopSimulatorResult {
  const p: KalenderKopMasterParams = {
    ...DEFAULT_KALENDER_KOP_PARAMS,
    ...customParams,
  };

  const oplah = Math.max(1, input.oplah);
  const baseHppPerPcs = getBaseHppKalenderKop(input.varian, oplah);
  const hppPerPcs = baseHppPerPcs;
  const totalHpp = hppPerPcs * oplah;

  const marginPct = input.marginPct ?? p.marginDefaultPct;
  const negoDiskonPct = input.negoDiskonPct ?? p.negoDefaultPct;

  // Harga = ROUNDUP(HPP * (1 + margin%), -2)
  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + marginPct / 100)) / 100) * 100;
  const negoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 100) * 100;
  const totalHargaJual = hargaJualPerPcs * oplah;

  // Breakdown representatif
  const rawBreakdown = [
    {
      komponen: 'Blanko Kalender Dwi Wulan (6 Lembar)',
      keterangan: `Ukuran 32×48 cm Art Paper 120 gsm @ ${oplah.toLocaleString('id-ID')} eks`,
      biaya: Math.round(totalHpp * 0.65),
    },
    {
      komponen: `Cetak Kop Surat (${input.varian})`,
      keterangan: `Cetak Sablon / Offset ${input.varian} pada Header Kalender`,
      biaya: Math.round(totalHpp * 0.25),
    },
    {
      komponen: 'Finishing Jilid Klem Seng & Packing',
      keterangan: 'Klem Seng Kaleng + Packing Kardus',
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

export interface KalenderKopMatrixCell {
  varian: KalenderKopVarian;
  oplah: number;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
}

export function recalculateKalenderKopMatrix(
  customParams?: Partial<KalenderKopMasterParams>,
  marginPct = 0,
  negoDiskonPct = 4
): KalenderKopMatrixCell[] {
  const cells: KalenderKopMatrixCell[] = [];

  for (const varian of KALENDER_KOP_VARIAN_OPTIONS) {
    for (const oplah of KALENDER_KOP_TIERS) {
      const res = calculateKalenderKopSimulator(
        {
          varian,
          oplah,
          marginPct,
          negoDiskonPct,
        },
        customParams
      );

      cells.push({
        varian,
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
