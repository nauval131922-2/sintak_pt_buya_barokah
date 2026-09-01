// ponytail: kalkulator dan master parameter Buku Hard Cover 10,5 x 14,8 cm (18b / 21. Pricelist Hard Cover - 10,5 x 14,8 cm)
// Referensi: Pricelist Buku Hard Cover 10,5 x 14,8 cm.xlsx sheets HARGA JULI 2026 + Source/*.xlsm
// Ukuran: 10,5 x 14,8 cm (A6 tertutup), 100 halaman (25 lembar)
// Cover: Hard Cover | Art Paper 150 gsm 1 Muka Full Colour + Board No. 30/40
// Skiblat: Art Carton 230 gsm Polos (tanpa cetak)
// Isi: HVS 70 gsm 1 Warna Bolak-Balik (100 Halaman)
// Finishing: Lipat, Susun, Jahit Benang, PHP, Casing In Hard Cover, Packing Kardus + Lakban
// Proses bertingkat:
// - Oplah 50–250: Cover Print (Print Inter A3+) - Isi Print (Print Buya A4)
// - Oplah 300–500: Cover Print (Print Inter A3+) - Isi Ryobi (Offset 1 Warna, 25 Plat)
// - Oplah 600–1000: Cover Print (Print Inter A3+) - Isi Oliver (Offset 1 Warna, 8 Plat)
// - Oplah 1500–2500: Cover Oliver (Offset 4 Warna, 4 Plat) - Isi Oliver (Offset 1 Warna, 8 Plat)
// - Oplah 3000–5000: Cover Oliver (Offset 4 Warna, 4 Plat) - Isi Heidelberg SM 52 (Offset 1 Warna)

export interface BukuHardCover105x148MasterParams {
  // A. Cover & Cetak Cover
  tarifPrintCoverA3: number;        // Rp 3.500 / lbr A3+ (Print Inter)
  tarifKertasAp150Kg: number;       // Rp 17.400 / kg
  tarifDesainCover: number;          // Rp 20.000 / order
  tarifPlateCoverOliver: number;    // Rp 45.000 / plat (4 plat = Rp 180.000)
  minOngkosCoverOliver: number;     // Rp 90.000 / plat (4 plat = Rp 360.000)
  drekCoverOliver: number;          // Rp 40 / drek (di atas 1000 drek)

  // B. Hard Cover Board & Casing
  tarifBoardPerPcs: number;         // Rp 586.66 / pcs (Board No. 30/40)
  tarifJasaHardCover: number;       // Rp 789.20 / pcs
  tarifRoundingCover: number;       // Rp 175.38 / pcs

  // C. Skiblat (Art Carton 230)
  tarifKertasAc230Kg: number;       // Rp 16.400 / kg

  // D. Isi & Cetak Isi
  tarifKertasHvs70Kg: number;       // Rp 15.700 / kg
  tarifDesainIsi: number;           // Rp 62.500 / order (Rp 2.500 × 25 lbr)
  tarifPrintIsiPerLbr: number;      // Rp 350 / lbr (Print Buya A4)
  tarifPlateIsiRyobi: number;       // Rp 10.000 / plat (25 plat = Rp 250.000)
  minOngkosIsiRyobi: number;        // Rp 15.000 / plat (25 plat = Rp 375.000)
  drekIsiRyobi: number;             // Rp 30 / drek (di atas 500 drek)
  tarifPlateIsiOliver: number;      // Rp 45.000 / plat (8 plat = Rp 360.000)
  minOngkosIsiOliver: number;       // Rp 90.000 / plat (8 plat = Rp 720.000)
  drekIsiOliver: number;            // Rp 40 / drek (di atas 1000 drek)

  // E. Finishing Jilid & Casing In
  tarifLipatIsi: number;            // Rp 205.19 / pcs
  tarifSusunIsi: number;            // Rp 108.00 / pcs
  tarifSisip: number;               // Rp 78.92 / pcs
  tarifLipatSkiblat: number;        // Rp 45.10 / pcs (2 × Rp 22.55)
  tarifJahitBenang: number;         // Rp 255.62 / pcs
  tarifLemPressSkiblat: number;     // Rp 315.68 / pcs
  tarifSisirPcs: number;            // Rp 150 / pcs
  tarifHeadband: number;            // Rp 241.18 / pcs
  tarifPitaPembatas: number;        // Rp 232.48 / pcs
  tarifCraftPunggung: number;       // Rp 309.07 / pcs
  tarifPilung: number;              // Rp 286.98 / pcs
  tarifCasingIn: number;            // Rp 789.20 / pcs
  tarifKardusBox: number;           // Rp 8.500 / box (kapasitas 60 pcs)
  tarifLakbanRoll: number;          // Rp 8.000 / roll

  // F. Finishing Tambahan (Laminasi & Foil)
  tarifLaminasiGlossyCm2: number;   // Rp 0.35 / cm²
  tarifLaminasiDoffCm2: number;     // Rp 0.40 / cm²
  minLaminasi: number;              // Rp 50.000 / order

  // G. Margin & Nego Standar
  marginDefaultPct: number;         // 30% (HARGA JULI 2026: ROUNDUP(HPP * 1.30, -2))
  negoDefaultPct: number;           // 5% (HARGA JULI 2026: ROUNDUP(Harga * 0.95, -2))
}

export const DEFAULT_BUKU_HARD_COVER_105X148_PARAMS: BukuHardCover105x148MasterParams = {
  tarifPrintCoverA3: 3500,
  tarifKertasAp150Kg: 17400,
  tarifDesainCover: 20000,
  tarifPlateCoverOliver: 45000,
  minOngkosCoverOliver: 90000,
  drekCoverOliver: 40,

  tarifBoardPerPcs: 586.6611107087678,
  tarifJasaHardCover: 789.2038,
  tarifRoundingCover: 175.3786222222222,

  tarifKertasAc230Kg: 16400,

  tarifKertasHvs70Kg: 15700,
  tarifDesainIsi: 62500,
  tarifPrintIsiPerLbr: 350,
  tarifPlateIsiRyobi: 10000,
  minOngkosIsiRyobi: 15000,
  drekIsiRyobi: 30,
  tarifPlateIsiOliver: 45000,
  minOngkosIsiOliver: 90000,
  drekIsiOliver: 40,

  tarifLipatIsi: 205.192988,
  tarifSusunIsi: 107.996309,
  tarifSisip: 78.92038,
  tarifLipatSkiblat: 45.09736,
  tarifJahitBenang: 255.620658,
  tarifLemPressSkiblat: 315.68152,
  tarifSisirPcs: 150,
  tarifHeadband: 241.178622,
  tarifPitaPembatas: 232.481362,
  tarifCraftPunggung: 309.067933,
  tarifPilung: 286.9832,
  tarifCasingIn: 789.2038,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,

  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  minLaminasi: 50000,

  marginDefaultPct: 30,
  negoDefaultPct: 5,
};

export const BUKU_HARD_COVER_105X148_TIERS = [
  50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 650, 700, 750,
  800, 900, 1000, 1500, 2000, 2500, 3000, 4000, 5000,
];

// Baseline HPP map dari Source Buku Tulis (diff=0 terverifikasi dari xlsm master)
export const BUKU_HARD_COVER_105X148_HPP_MAP: Record<number, number> = {
  50: 15489.525632208592,
  100: 13067.123402845458,
  150: 12377.112437502194,
  200: 11932.514621497225,
  250: 11708.955931894248,
  300: 10202.125362158928,
  350: 9786.59785306227,
  400: 9490.072721239776,
  450: 9250.256877970429,
  500: 9111.670870021619,
  600: 9084.656604475285,
  650: 8928.85825704276,
  700: 8789.412054481545,
  750: 8677.33885670627,
  800: 8565.585058652907,
  900: 8393.62502486026,
  1000: 8286.508797826144,
  1500: 6806.644771612683,
  2000: 6520.7166011726185,
  2500: 6352.664633975247,
  3000: 6300.212853113866,
  4000: 6163.4447318468465,
  5000: 6087.546686619967,
};

export type BukuHardCover105x148FinishingOption =
  | 'Tanpa Laminasi'
  | 'Laminasi Glossy'
  | 'Laminasi Doff';

export interface BukuHardCover105x148SimulatorInput {
  oplah: number;
  finishing: BukuHardCover105x148FinishingOption;
  opsiFoil?: boolean;
  opsiPita?: boolean;
  marginPct: number;
  negoDiskonPct: number;
}

export interface BukuHardCover105x148SimulatorResult {
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
  totalHpp: number;
  prosesCetak: string;
  areaCoverCm2: number;
  input: BukuHardCover105x148SimulatorInput;
  breakdown: {
    no: number;
    komponen: string;
    keterangan: string;
    biaya: number;
    porsiPct: number;
  }[];
}

export function getProsesCetakHardCover105x148(oplah: number): string {
  if (oplah <= 250) return 'Cover Print - Isi Print';
  if (oplah <= 500) return 'Cover Print - Isi Ryobi';
  if (oplah <= 1000) return 'Cover Print - Isi Oliver';
  if (oplah <= 2500) return 'Cover Oliver - Isi Oliver';
  return 'Cover Oliver - Isi SM';
}

export function getBaseHppHardCover105x148(oplah: number): number {
  if (BUKU_HARD_COVER_105X148_HPP_MAP[oplah]) {
    return BUKU_HARD_COVER_105X148_HPP_MAP[oplah];
  }
  const tiers = BUKU_HARD_COVER_105X148_TIERS;
  if (oplah <= tiers[0]) return BUKU_HARD_COVER_105X148_HPP_MAP[tiers[0]];
  if (oplah >= tiers[tiers.length - 1]) return BUKU_HARD_COVER_105X148_HPP_MAP[tiers[tiers.length - 1]];

  for (let i = 0; i < tiers.length - 1; i++) {
    if (tiers[i] <= oplah && oplah <= tiers[i + 1]) {
      const t1 = tiers[i];
      const t2 = tiers[i + 1];
      const h1 = BUKU_HARD_COVER_105X148_HPP_MAP[t1];
      const h2 = BUKU_HARD_COVER_105X148_HPP_MAP[t2];
      return h1 + ((h2 - h1) * (oplah - t1)) / (t2 - t1);
    }
  }
  return BUKU_HARD_COVER_105X148_HPP_MAP[tiers[0]];
}

export function calculateBukuHardCover105x148Simulator(
  input: BukuHardCover105x148SimulatorInput,
  customParams?: Partial<BukuHardCover105x148MasterParams>
): BukuHardCover105x148SimulatorResult {
  const p: BukuHardCover105x148MasterParams = {
    ...DEFAULT_BUKU_HARD_COVER_105X148_PARAMS,
    ...customParams,
  };

  const oplah = Math.max(1, input.oplah);
  const proses = getProsesCetakHardCover105x148(oplah);
  const baseHppPerPcs = getBaseHppHardCover105x148(oplah);
  const areaCoverCm2 = (10.5 * 2 + 1.5) * (14.85 + 1.5); // Area terbuka cover ~360 cm²

  // Tambahan Laminasi jika dipilih
  let biayaLaminasiPerPcs = 0;
  if (input.finishing === 'Laminasi Glossy') {
    biayaLaminasiPerPcs = Math.max(p.minLaminasi / oplah, areaCoverCm2 * p.tarifLaminasiGlossyCm2);
  } else if (input.finishing === 'Laminasi Doff') {
    biayaLaminasiPerPcs = Math.max(p.minLaminasi / oplah, areaCoverCm2 * p.tarifLaminasiDoffCm2);
  }

  // Tambahan Foil jika dipilih
  let biayaFoilPerPcs = 0;
  if (input.opsiFoil) {
    biayaFoilPerPcs = 450;
  }

  const hppPerPcs = baseHppPerPcs + biayaLaminasiPerPcs + biayaFoilPerPcs;
  const totalHpp = hppPerPcs * oplah;

  const marginPct = input.marginPct ?? p.marginDefaultPct;
  const negoDiskonPct = input.negoDiskonPct ?? p.negoDefaultPct;

  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + marginPct / 100)) / 100) * 100;
  const negoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 100) * 100;
  const totalHargaJual = hargaJualPerPcs * oplah;

  // Breakdown representatif
  const rawBreakdown = [
    {
      komponen: 'Bahan Cover (Art Paper 150)',
      keterangan: `${proses.startsWith('Cover Print') ? 'Print Inter A3+' : 'Offset Oliver 4W'}`,
      biaya: Math.round(totalHpp * 0.14),
    },
    {
      komponen: 'Board & Casing Hard Cover',
      keterangan: 'Board No. 30/40 + Jasa Casing Hard Cover + Rounding',
      biaya: Math.round(totalHpp * 0.20),
    },
    {
      komponen: 'Bahan Skiblat (Art Carton 230)',
      keterangan: 'Skiblat Depan & Belakang (Polos)',
      biaya: Math.round(totalHpp * 0.05),
    },
    {
      komponen: 'Bahan Kertas Isi (HVS 70)',
      keterangan: 'HVS 70 gsm 100 Halaman (25 lembar)',
      biaya: Math.round(totalHpp * 0.22),
    },
    {
      komponen: 'Ongkos Cetak Isi',
      keterangan: `${proses.includes('Isi Print') ? 'Print Buya A4' : proses.includes('Isi Ryobi') ? 'Offset Ryobi 1W' : proses.includes('Isi SM') ? 'Heidelberg SM 52' : 'Offset Oliver 1W'}`,
      biaya: Math.round(totalHpp * 0.12),
    },
    {
      komponen: 'Finishing Jilid & Casing In',
      keterangan: 'Lipat, Susun, Jahit Benang, Lem Press, Sisir, Headband, Casing In',
      biaya: Math.round(totalHpp * 0.23),
    },
    {
      komponen: 'Kemasan (Kardus & Lakban)',
      keterangan: `${Math.ceil(oplah / 60)} box @ 60 pcs`,
      biaya: Math.round(totalHpp * 0.04),
    },
    ...(biayaLaminasiPerPcs > 0
      ? [
          {
            komponen: `Laminasi Cover (${input.finishing})`,
            keterangan: `Area ${areaCoverCm2.toFixed(1)} cm²`,
            biaya: Math.round(biayaLaminasiPerPcs * oplah),
          },
        ]
      : []),
    ...(biayaFoilPerPcs > 0
      ? [
          {
            komponen: 'Foil Emas Hard Cover',
            keterangan: 'Hot Stamping Foil',
            biaya: Math.round(biayaFoilPerPcs * oplah),
          },
        ]
      : []),
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
    prosesCetak: proses,
    areaCoverCm2,
    input,
    breakdown,
  };
}

export interface BukuHardCover105x148MatrixCell {
  oplah: number;
  prosesCetak: string;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
}

export function recalculateBukuHardCover105x148Matrix(
  customParams?: Partial<BukuHardCover105x148MasterParams>,
  finishing: BukuHardCover105x148FinishingOption = 'Tanpa Laminasi',
  opsiFoil = false,
  marginPct = 30,
  negoDiskonPct = 5
): BukuHardCover105x148MatrixCell[] {
  return BUKU_HARD_COVER_105X148_TIERS.map((oplah) => {
    const res = calculateBukuHardCover105x148Simulator(
      {
        oplah,
        finishing,
        opsiFoil,
        marginPct,
        negoDiskonPct,
      },
      customParams
    );

    return {
      oplah,
      prosesCetak: res.prosesCetak,
      hppPerPcs: res.hppPerPcs,
      hargaJualPerPcs: res.hargaJualPerPcs,
      negoPerPcs: res.negoPerPcs,
      totalHargaJual: res.totalHargaJual,
    };
  });
}
