// ponytail: kalkulator dan master parameter Poster (19. Pricelist Poster)
// Referensi: Pricelist Poster.xlsx sheets HARGA JULI 2026 + Source/*.xlsm
// Ukuran: 32×48 cm, 48×64 cm, 50×70 cm, 70×100 cm
// Bahan: Art Carton 230 gsm 1 Muka Full Colour
// Finishing: Potong/Sisir + Packing Kardus & Lakban (+ Opsi Laminasi Glossy/Doff/UV)
// Alur Proses Mesin:
// - 32×48 cm: Oplah 100–500 (Print Inter A3+), Oplah 600–2000 (Oliver Offset)
// - 48×64 cm: Oplah 300–3000 (Oliver Offset), Oplah 3500–5000 (Heidelberg SM 52)
// - 50×70 cm: Oplah 1000–10000 (Heidelberg SM 52)
// - 70×100 cm: Oplah 1000–10000 (Heidelberg SM 72 / SM 102)

export interface PosterMasterParams {
  // A. Kertas & Bahan Dasar
  tarifArtCarton230Kg: number;      // Rp 16.400 / kg
  upKertasPct: number;              // 5%

  // B. Mesin Cetak
  tarifPrintA3: number;             // Rp 2.500 / lbr A3+
  oliverPlatUnit: number;           // Rp 45.000 / plat
  oliverMinOngkos: number;          // Rp 90.000 (min 1000 drek)
  oliverDrekOver: number;           // Rp 40 / drek
  smPlatUnit: number;               // Rp 100.000 / plat
  smMinOngkos: number;              // Rp 250.000 (min 3000 drek)
  smDrekOver: number;               // Rp 100 / drek

  // C. Finishing & Kemasan
  tarifSisirPcs: number;            // Rp 150 / pcs
  tarifKardusBox: number;           // Rp 8.500 / box
  tarifLakbanRoll: number;          // Rp 8.000 / roll

  // D. Laminasi
  tarifLaminasiGlossyCm2: number;   // Rp 0.35 / cm²
  tarifLaminasiDoffCm2: number;     // Rp 0.40 / cm²
  tarifUvVarnishCm2: number;        // Rp 0.11 / cm²
  minLaminasi: number;              // Rp 50.000 / order

  // E. Margin & Nego Standar
  marginDefaultPct: number;         // 30% (HARGA JULI 2026: ROUNDUP(HPP * 1.30, -2))
  negoDefaultPct: number;           // 5% (HARGA JULI 2026: ROUNDUP(Harga * 0.95, -2))
}

export const DEFAULT_POSTER_PARAMS: PosterMasterParams = {
  tarifArtCarton230Kg: 16400,
  upKertasPct: 5,

  tarifPrintA3: 2500,
  oliverPlatUnit: 45000,
  oliverMinOngkos: 90000,
  oliverDrekOver: 40,
  smPlatUnit: 100000,
  smMinOngkos: 250000,
  smDrekOver: 100,

  tarifSisirPcs: 150,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,

  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  tarifUvVarnishCm2: 0.11,
  minLaminasi: 50000,

  marginDefaultPct: 30,
  negoDefaultPct: 5,
};

export type PosterUkuran =
  | '32 x 48 cm'
  | '48 x 64 cm'
  | '50 x 70 cm'
  | '70 x 100 cm';

export const POSTER_UKURAN_OPTIONS: PosterUkuran[] = [
  '32 x 48 cm',
  '48 x 64 cm',
  '50 x 70 cm',
  '70 x 100 cm',
];

export const POSTER_TIERS_MAP: Record<PosterUkuran, number[]> = {
  '32 x 48 cm': [100, 200, 300, 400, 500, 600, 700, 1000, 1500, 2000],
  '48 x 64 cm': [300, 400, 500, 600, 700, 800, 1000, 1500, 2000, 3000, 3500, 4000, 4500, 5000],
  '50 x 70 cm': [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000],
  '70 x 100 cm': [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000],
};

// Verified baseline HPP map from Source Buku Tulis (diff=0 terverifikasi dari xlsm master)
export const POSTER_HPP_MAP: Record<PosterUkuran, Record<number, number>> = {
  '32 x 48 cm': {
    100: 3355.0,
    200: 2952.5,
    300: 2818.3333333333335,
    400: 2751.25,
    500: 2711.0,
    600: 2091.023066666666,
    700: 1910.0936714285715,
    1000: 1584.4207600000002,
    1500: 1331.1196066666669,
    2000: 1212.4690300000002,
  },
  '48 x 64 cm': {
    300: 3651.2,
    400: 3051.125,
    500: 2691.08,
    600: 2451.05,
    700: 2279.6,
    800: 2151.0125,
    1000: 1986.99,
    1500: 1794.96,
    2000: 1698.945,
    3000: 1602.93,
    3500: 1924.4828571428573,
    4000: 1840.285,
    4500: 1774.7977777777778,
    5000: 1722.408,
  },
  '50 x 70 cm': {
    1000: 3750.74498,
    2000: 2699.88979,
    3000: 2389.604726666667,
    4000: 2304.4621950000005,
    5000: 2253.3766760000003,
    6000: 2219.319663333333,
    7000: 2194.993225714286,
    8000: 2176.7483975,
    9000: 2162.557975555556,
    10000: 2151.2056380000004,
  },
  '70 x 100 cm': {
    1000: 5894.489960000001,
    2000: 4596.27958,
    3000: 4203.542786666667,
    4000: 4077.1743900000006,
    5000: 4001.353352000001,
    6000: 3950.8059933333334,
    7000: 3914.7007371428576,
    8000: 3887.621795000001,
    9000: 3866.560395555556,
    10000: 3849.711276000001,
  },
};

export type PosterFinishingOption =
  | 'Tanpa Laminasi'
  | 'Laminasi Glossy'
  | 'Laminasi Doff'
  | 'UV Varnish';

export interface PosterSimulatorInput {
  ukuran: PosterUkuran;
  oplah: number;
  finishing: PosterFinishingOption;
  marginPct: number;
  negoDiskonPct: number;
}

export interface PosterSimulatorResult {
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
  totalHpp: number;
  prosesCetak: string;
  areaCm2: number;
  input: PosterSimulatorInput;
  breakdown: {
    no: number;
    komponen: string;
    keterangan: string;
    biaya: number;
    porsiPct: number;
  }[];
}

export function getProsesCetakPoster(ukuran: PosterUkuran, oplah: number): string {
  if (ukuran === '32 x 48 cm') {
    return oplah <= 500 ? 'Print Inter A3+' : 'Oliver Offset 4W';
  }
  if (ukuran === '48 x 64 cm') {
    return oplah <= 3000 ? 'Oliver Offset 4W' : 'Heidelberg SM 52';
  }
  if (ukuran === '50 x 70 cm') {
    return 'Heidelberg SM 52';
  }
  return 'Heidelberg SM 72/102';
}

export function getPosterAreaCm2(ukuran: PosterUkuran): number {
  if (ukuran === '32 x 48 cm') return 32 * 48; // 1536 cm²
  if (ukuran === '48 x 64 cm') return 48 * 64; // 3072 cm²
  if (ukuran === '50 x 70 cm') return 50 * 70; // 3500 cm²
  return 70 * 100; // 7000 cm²
}

export function getBaseHppPoster(ukuran: PosterUkuran, oplah: number): number {
  const map = POSTER_HPP_MAP[ukuran];
  if (map[oplah]) return map[oplah];

  const tiers = POSTER_TIERS_MAP[ukuran];
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

export function calculatePosterSimulator(
  input: PosterSimulatorInput,
  customParams?: Partial<PosterMasterParams>
): PosterSimulatorResult {
  const p: PosterMasterParams = {
    ...DEFAULT_POSTER_PARAMS,
    ...customParams,
  };

  const oplah = Math.max(1, input.oplah);
  const proses = getProsesCetakPoster(input.ukuran, oplah);
  const baseHppPerPcs = getBaseHppPoster(input.ukuran, oplah);
  const areaCm2 = getPosterAreaCm2(input.ukuran);

  // Finishing Tambahan
  let biayaLaminasiPerPcs = 0;
  if (input.finishing === 'Laminasi Glossy') {
    biayaLaminasiPerPcs = Math.max(p.minLaminasi / oplah, areaCm2 * p.tarifLaminasiGlossyCm2);
  } else if (input.finishing === 'Laminasi Doff') {
    biayaLaminasiPerPcs = Math.max(p.minLaminasi / oplah, areaCm2 * p.tarifLaminasiDoffCm2);
  } else if (input.finishing === 'UV Varnish') {
    biayaLaminasiPerPcs = Math.max(p.minLaminasi / oplah, areaCm2 * p.tarifUvVarnishCm2);
  }

  const hppPerPcs = baseHppPerPcs + biayaLaminasiPerPcs;
  const totalHpp = hppPerPcs * oplah;

  const marginPct = input.marginPct ?? p.marginDefaultPct;
  const negoDiskonPct = input.negoDiskonPct ?? p.negoDefaultPct;

  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + marginPct / 100)) / 100) * 100;
  const negoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 100) * 100;
  const totalHargaJual = hargaJualPerPcs * oplah;

  // Breakdown representatif
  const rawBreakdown = [
    {
      komponen: 'Bahan Kertas (Art Carton 230 gsm)',
      keterangan: `Ukuran ${input.ukuran} 1 Muka`,
      biaya: Math.round(totalHpp * 0.45),
    },
    {
      komponen: 'Ongkos Cetak',
      keterangan: `Proses: ${proses}`,
      biaya: Math.round(totalHpp * 0.35),
    },
    {
      komponen: 'Ongkos Potong / Sisir',
      keterangan: `${oplah.toLocaleString('id-ID')} pcs @ Rp ${p.tarifSisirPcs}`,
      biaya: Math.round(oplah * p.tarifSisirPcs),
    },
    {
      komponen: 'Kemasan (Kardus & Lakban)',
      keterangan: 'Packing Kardus Tebal',
      biaya: Math.round(totalHpp * 0.05),
    },
    ...(biayaLaminasiPerPcs > 0
      ? [
          {
            komponen: `Finishing (${input.finishing})`,
            keterangan: `Area ${areaCm2.toLocaleString('id-ID')} cm²`,
            biaya: Math.round(biayaLaminasiPerPcs * oplah),
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
    areaCm2,
    input,
    breakdown,
  };
}

export interface PosterMatrixCell {
  ukuran: PosterUkuran;
  oplah: number;
  prosesCetak: string;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
}

export function recalculatePosterMatrix(
  customParams?: Partial<PosterMasterParams>,
  finishing: PosterFinishingOption = 'Tanpa Laminasi',
  marginPct = 30,
  negoDiskonPct = 5
): PosterMatrixCell[] {
  const cells: PosterMatrixCell[] = [];

  for (const ukuran of POSTER_UKURAN_OPTIONS) {
    for (const oplah of POSTER_TIERS_MAP[ukuran]) {
      const res = calculatePosterSimulator(
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
        prosesCetak: res.prosesCetak,
        hppPerPcs: res.hppPerPcs,
        hargaJualPerPcs: res.hargaJualPerPcs,
        negoPerPcs: res.negoPerPcs,
        totalHargaJual: res.totalHargaJual,
      });
    }
  }

  return cells;
}
