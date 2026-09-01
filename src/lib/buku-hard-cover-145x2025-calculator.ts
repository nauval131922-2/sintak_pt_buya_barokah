// ponytail: kalkulator dan master parameter Buku Hard Cover 14,5 x 20,25 cm (25. Pricelist Hard Cover - 14,5 x 20,25 cm)
// Referensi: Pricelist Buku Hard Cover 14,5 x 20,25 cm.xlsx sheets HARGA JULI 2026 + Source/*.xlsm
// Ukuran: 14,5 x 20,25 cm (tertutup), 100 Halaman (25 lembar) bolak-balik
// Cover: Hard Cover | Art Paper 150 gsm 1 Muka Full Colour + Board tebal No. 30/40
// Skiblat: Art Carton 230 gsm Polos (tanpa cetak)
// Isi: HVS 70 gsm 1 Warna Bolak-Balik (100 Halaman)
// Finishing: Lipat, Susun, Jahit Benang, Lem Press, Headband, Pita Pembatas, Craft Punggung, Pilung, Casing In, Packing Kardus
// Alur Proses Mesin:
// - Oplah 50–250: Cover Print (Print Inter A3+) - Isi Print (Print Buya A4)
// - Oplah 300–500: Cover Print (Print Inter A3+) - Isi Ryobi (Offset Ryobi 1W)
// - Oplah 600–2500: Cover Oliver (Offset Oliver 4W) - Isi Oliver (Offset Oliver 1W)
// - Oplah 3000–5000: Cover Oliver (Offset Oliver 4W) - Isi Heidelberg SM 52

export interface BukuHardCover145x2025MasterParams {
  // A. Cover & Cetak Cover
  tarifPrintCoverA3: number;        // Rp 3.500 / lbr A3+
  tarifKertasAp150Kg: number;       // Rp 17.400 / kg
  tarifDesainCover: number;          // Rp 20.000 / order
  tarifPlateCoverOliver: number;    // Rp 45.000 / plat (4 plat = Rp 180.000)
  minOngkosCoverOliver: number;     // Rp 90.000 / plat (4 plat = Rp 360.000)
  drekCoverOliver: number;          // Rp 40 / drek (di atas 1000 drek)

  // B. Hard Cover Board & Casing
  tarifBoardPerPcs: number;         // Rp 1.100 / pcs (Board No. 30/40)
  tarifJasaHardCover: number;       // Rp 1.050 / pcs
  tarifRoundingCover: number;       // Rp 250 / pcs

  // C. Skiblat (Art Carton 230)
  tarifKertasAc230Kg: number;       // Rp 16.400 / kg

  // D. Isi & Cetak Isi
  tarifKertasHvs70Kg: number;       // Rp 15.700 / kg
  tarifDesainIsi: number;           // Rp 62.500 / order (Rp 2.500 × 25 lbr)
  tarifPrintIsiPerLbr: number;      // Rp 350 / lbr (Print Buya A4)
  tarifPlateIsiRyobi: number;       // Rp 10.000 / plat (25 plat = Rp 250.000)
  minOngkosIsiRyobi: number;        // Rp 15.000 / plat
  drekIsiRyobi: number;             // Rp 30 / drek (di atas 500 drek)
  tarifPlateIsiOliver: number;      // Rp 45.000 / plat (8 plat = Rp 360.000)
  minOngkosIsiOliver: number;       // Rp 90.000 / plat
  drekIsiOliver: number;            // Rp 40 / drek (di atas 1000 drek)

  // E. Finishing Jilid & Casing In
  tarifLipatIsi: number;            // Rp 250 / pcs
  tarifSusunIsi: number;            // Rp 150 / pcs
  tarifSisip: number;               // Rp 100 / pcs
  tarifJahitBenang: number;         // Rp 350 / pcs
  tarifLemPressSkiblat: number;     // Rp 450 / pcs
  tarifSisirPcs: number;            // Rp 150 / pcs
  tarifHeadband: number;            // Rp 300 / pcs
  tarifPitaPembatas: number;        // Rp 250 / pcs
  tarifCraftPunggung: number;       // Rp 350 / pcs
  tarifPilung: number;              // Rp 300 / pcs
  tarifCasingIn: number;            // Rp 1.050 / pcs
  tarifKardusBox: number;           // Rp 8.500 / box (kapasitas 50 pcs)
  tarifLakbanRoll: number;          // Rp 8.000 / roll

  // F. Finishing Tambahan (Laminasi & Foil)
  tarifLaminasiGlossyCm2: number;   // Rp 0.35 / cm²
  tarifLaminasiDoffCm2: number;     // Rp 0.40 / cm²
  minLaminasi: number;              // Rp 50.000 / order

  // G. Margin & Nego Standar
  marginDefaultPct: number;         // 30% (HARGA JULI 2026: ROUNDUP(HPP * 1.30, -2))
  negoDefaultPct: number;           // 5% (HARGA JULI 2026: ROUNDUP(Harga * 0.95, -2))
}

export const DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS: BukuHardCover145x2025MasterParams = {
  tarifPrintCoverA3: 3500,
  tarifKertasAp150Kg: 17400,
  tarifDesainCover: 20000,
  tarifPlateCoverOliver: 45000,
  minOngkosCoverOliver: 90000,
  drekCoverOliver: 40,

  tarifBoardPerPcs: 1100,
  tarifJasaHardCover: 1050,
  tarifRoundingCover: 250,

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

  tarifLipatIsi: 250,
  tarifSusunIsi: 150,
  tarifSisip: 100,
  tarifJahitBenang: 350,
  tarifLemPressSkiblat: 450,
  tarifSisirPcs: 150,
  tarifHeadband: 300,
  tarifPitaPembatas: 250,
  tarifCraftPunggung: 350,
  tarifPilung: 300,
  tarifCasingIn: 1050,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,

  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  minLaminasi: 50000,

  marginDefaultPct: 30,
  negoDefaultPct: 5,
};

export const BUKU_HARD_COVER_145X2025_TIERS = [
  50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 650, 700, 750,
  800, 900, 1000, 1500, 2000, 2500, 3000, 4000, 5000,
];

// Baseline HPP Map dari Source Buku Tulis (diff=0 terverifikasi dari xlsm master)
export const BUKU_HARD_COVER_145X2025_HPP_MAP: Record<number, number> = {
  50: 23631.866035728515,
  100: 20709.30908572851,
  150: 19820.903435728513,
  200: 19312.360610728512,
  250: 19032.044915728513,
  300: 16655.517377041775,
  350: 15910.617048470347,
  400: 15373.566789541775,
  450: 14951.450911763997,
  500: 14707.728209041775,
  600: 12391.556681849475,
  650: 12022.008329342818,
  700: 11696.61231290854,
  750: 11428.729993332165,
  800: 11189.421708286172,
  900: 10785.035529505813,
  1000: 10515.774057481529,
  1500: 9705.183768148194,
  2000: 9312.878623481528,
  2500: 9083.355536681529,
  3000: 9023.398687702484,
  4000: 8834.577002702483,
  5000: 8719.588991702484,
};

export type BukuHardCover145x2025FinishingOption =
  | 'Tanpa Laminasi'
  | 'Laminasi Glossy'
  | 'Laminasi Doff';

export interface BukuHardCover145x2025SimulatorInput {
  oplah: number;
  finishing: BukuHardCover145x2025FinishingOption;
  opsiFoil?: boolean;
  marginPct: number;
  negoDiskonPct: number;
}

export interface BukuHardCover145x2025SimulatorResult {
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
  totalHpp: number;
  prosesCetak: string;
  areaCoverCm2: number;
  input: BukuHardCover145x2025SimulatorInput;
  breakdown: {
    no: number;
    komponen: string;
    keterangan: string;
    biaya: number;
    porsiPct: number;
  }[];
}

export function getProsesCetakHardCover145x2025(oplah: number): string {
  if (oplah <= 250) return 'Cover Print - Isi Print';
  if (oplah <= 500) return 'Cover Print - Isi Ryobi';
  if (oplah <= 2500) return 'Cover Oliver - Isi Oliver';
  return 'Cover Oliver - Isi SM';
}

export function getBaseHppHardCover145x2025(oplah: number): number {
  if (BUKU_HARD_COVER_145X2025_HPP_MAP[oplah]) {
    return BUKU_HARD_COVER_145X2025_HPP_MAP[oplah];
  }
  const tiers = BUKU_HARD_COVER_145X2025_TIERS;
  if (oplah <= tiers[0]) return BUKU_HARD_COVER_145X2025_HPP_MAP[tiers[0]];
  if (oplah >= tiers[tiers.length - 1]) return BUKU_HARD_COVER_145X2025_HPP_MAP[tiers[tiers.length - 1]];

  for (let i = 0; i < tiers.length - 1; i++) {
    if (tiers[i] <= oplah && oplah <= tiers[i + 1]) {
      const t1 = tiers[i];
      const t2 = tiers[i + 1];
      const h1 = BUKU_HARD_COVER_145X2025_HPP_MAP[t1];
      const h2 = BUKU_HARD_COVER_145X2025_HPP_MAP[t2];
      return h1 + ((h2 - h1) * (oplah - t1)) / (t2 - t1);
    }
  }
  return BUKU_HARD_COVER_145X2025_HPP_MAP[tiers[0]];
}

export function calculateBukuHardCover145x2025Simulator(
  input: BukuHardCover145x2025SimulatorInput,
  customParams?: Partial<BukuHardCover145x2025MasterParams>
): BukuHardCover145x2025SimulatorResult {
  const p: BukuHardCover145x2025MasterParams = {
    ...DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS,
    ...customParams,
  };

  const oplah = Math.max(1, input.oplah);
  const proses = getProsesCetakHardCover145x2025(oplah);
  const baseHppPerPcs = getBaseHppHardCover145x2025(oplah);
  const areaCoverCm2 = (14.5 * 2 + 1.5) * (20.25 + 1.5); // Area terbuka cover ~663 cm²

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
      biaya: Math.round(totalHpp * 0.15),
    },
    {
      komponen: 'Board & Casing Hard Cover',
      keterangan: 'Board No. 30/40 + Jasa Casing Hard Cover + Rounding',
      biaya: Math.round(totalHpp * 0.22),
    },
    {
      komponen: 'Bahan Skiblat (Art Carton 230)',
      keterangan: 'Skiblat Depan & Belakang (Polos)',
      biaya: Math.round(totalHpp * 0.05),
    },
    {
      komponen: 'Bahan Kertas Isi (HVS 70)',
      keterangan: 'HVS 70 gsm 100 Halaman (25 lembar)',
      biaya: Math.round(totalHpp * 0.20),
    },
    {
      komponen: 'Ongkos Cetak Isi',
      keterangan: `${proses.includes('Isi Print') ? 'Print Buya A4' : proses.includes('Isi Ryobi') ? 'Offset Ryobi 1W' : proses.includes('Isi SM') ? 'Heidelberg SM 52' : 'Offset Oliver 1W'}`,
      biaya: Math.round(totalHpp * 0.15),
    },
    {
      komponen: 'Finishing Jilid & Casing In',
      keterangan: 'Lipat, Susun, Jahit Benang, Lem Press, Sisir, Headband, Casing In',
      biaya: Math.round(totalHpp * 0.19),
    },
    {
      komponen: 'Kemasan (Kardus & Lakban)',
      keterangan: `${Math.ceil(oplah / 50)} box @ 50 pcs`,
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

export interface BukuHardCover145x2025MatrixCell {
  oplah: number;
  prosesCetak: string;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
}

export function recalculateBukuHardCover145x2025Matrix(
  customParams?: Partial<BukuHardCover145x2025MasterParams>,
  finishing: BukuHardCover145x2025FinishingOption = 'Tanpa Laminasi',
  opsiFoil = false,
  marginPct = 30,
  negoDiskonPct = 5
): BukuHardCover145x2025MatrixCell[] {
  return BUKU_HARD_COVER_145X2025_TIERS.map((oplah) => {
    const res = calculateBukuHardCover145x2025Simulator(
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
