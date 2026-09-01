// ponytail: kalkulator dan master parameter Buku Hard Cover 21 x 29,7 cm (26. Pricelist Hard Cover - 21 x 29,7 cm)
// Referensi: Pricelist Buku Hard Cover 21 x 29,7 cm.xlsx sheets HARGA JULI 2026 + Source/*.xlsm
// Ukuran: 21 x 29,7 cm (A4 tertutup), 100 Halaman (25 lembar) bolak-balik
// Cover: Hard Cover | Art Paper 150 gsm 1 Muka Full Colour + Board tebal No. 30
// Skiblat: Art Carton 230 gsm Polos (tanpa cetak)
// Isi: HVS 70 gsm 1 Warna Bolak-Balik (100 Halaman)
// Finishing: Lipat, Susun, Jahit Benang, Lem Press, Headband, Pita Pembatas, Craft Punggung, Pilung, Casing In, Packing Kardus
// Alur Proses Mesin:
// - Oplah 250–2500: Cover Oliver (Offset Oliver 4W) - Isi Oliver (Offset Oliver 1W)
// - Oplah 3000–5000: Cover Oliver (Offset Oliver 4W) - Isi Heidelberg SM 52

export interface BukuHardCover21x297MasterParams {
  // A. Cover & Cetak Cover
  tarifPrintCoverA3: number;        // Rp 3.500 / lbr A3+
  tarifKertasAp150Kg: number;       // Rp 17.400 / kg
  tarifDesainCover: number;          // Rp 20.000 / order
  tarifPlateCoverOliver: number;    // Rp 45.000 / plat (4 plat = Rp 180.000)
  minOngkosCoverOliver: number;     // Rp 90.000 / plat (4 plat = Rp 360.000)
  drekCoverOliver: number;          // Rp 40 / drek (di atas 1000 drek)

  // B. Hard Cover Board & Casing
  tarifBoardPerPcs: number;         // Rp 1.500 / pcs (Board No. 30)
  tarifJasaHardCover: number;       // Rp 1.400 / pcs
  tarifRoundingCover: number;       // Rp 350 / pcs

  // C. Skiblat (Art Carton 230)
  tarifKertasAc230Kg: number;       // Rp 16.400 / kg

  // D. Isi & Cetak Isi
  tarifKertasHvs70Kg: number;       // Rp 15.700 / kg
  tarifDesainIsi: number;           // Rp 62.500 / order (Rp 2.500 × 25 lbr)
  tarifPlateIsiOliver: number;      // Rp 45.000 / plat (8 plat = Rp 360.000)
  minOngkosIsiOliver: number;       // Rp 90.000 / plat
  drekIsiOliver: number;            // Rp 40 / drek (di atas 1000 drek)

  // E. Finishing Jilid & Casing In
  tarifLipatIsi: number;            // Rp 300 / pcs
  tarifSusunIsi: number;            // Rp 200 / pcs
  tarifSisip: number;               // Rp 150 / pcs
  tarifJahitBenang: number;         // Rp 450 / pcs
  tarifLemPressSkiblat: number;     // Rp 550 / pcs
  tarifSisirPcs: number;            // Rp 150 / pcs
  tarifHeadband: number;            // Rp 350 / pcs
  tarifPitaPembatas: number;        // Rp 300 / pcs
  tarifCraftPunggung: number;       // Rp 400 / pcs
  tarifPilung: number;              // Rp 350 / pcs
  tarifCasingIn: number;            // Rp 1.400 / pcs
  tarifKardusBox: number;           // Rp 8.500 / box (kapasitas 40 pcs)
  tarifLakbanRoll: number;          // Rp 8.000 / roll

  // F. Finishing Tambahan (Laminasi & Foil)
  tarifLaminasiGlossyCm2: number;   // Rp 0.35 / cm²
  tarifLaminasiDoffCm2: number;     // Rp 0.40 / cm²
  minLaminasi: number;              // Rp 50.000 / order

  // G. Margin & Nego Standar
  marginDefaultPct: number;         // 30% (HARGA JULI 2026: ROUNDUP(HPP * 1.30, -2))
  negoDefaultPct: number;           // 5% (HARGA JULI 2026: ROUNDUP(Harga * 0.95, -2))
}

export const DEFAULT_BUKU_HARD_COVER_21X297_PARAMS: BukuHardCover21x297MasterParams = {
  tarifPrintCoverA3: 3500,
  tarifKertasAp150Kg: 17400,
  tarifDesainCover: 20000,
  tarifPlateCoverOliver: 45000,
  minOngkosCoverOliver: 90000,
  drekCoverOliver: 40,

  tarifBoardPerPcs: 1500,
  tarifJasaHardCover: 1400,
  tarifRoundingCover: 350,

  tarifKertasAc230Kg: 16400,

  tarifKertasHvs70Kg: 15700,
  tarifDesainIsi: 62500,
  tarifPlateIsiOliver: 45000,
  minOngkosIsiOliver: 90000,
  drekIsiOliver: 40,

  tarifLipatIsi: 300,
  tarifSusunIsi: 200,
  tarifSisip: 150,
  tarifJahitBenang: 450,
  tarifLemPressSkiblat: 550,
  tarifSisirPcs: 150,
  tarifHeadband: 350,
  tarifPitaPembatas: 300,
  tarifCraftPunggung: 400,
  tarifPilung: 350,
  tarifCasingIn: 1400,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,

  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  minLaminasi: 50000,

  marginDefaultPct: 30,
  negoDefaultPct: 5,
};

export const BUKU_HARD_COVER_21X297_TIERS = [
  250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500,
  3000, 4000, 5000,
];

// Baseline HPP Map dari Source Buku Tulis (diff=0 terverifikasi dari xlsm master)
export const BUKU_HARD_COVER_21X297_HPP_MAP: Record<number, number> = {
  250: 31510.952712616505,
  300: 28362.874218057455,
  350: 26126.87299527718,
  400: 24454.32408902531,
  450: 23134.680559718297,
  500: 22113.794011606016,
  600: 20528.16284888205,
  700: 19413.951054944113,
  800: 18581.17188737151,
  900: 17935.04369037151,
  1000: 17536.69742498205,
  1500: 16324.066497204272,
  2000: 15721.092497204273,
  2500: 15355.706764537606,
  3000: 15154.773489870938,
  4000: 14864.15682320427,
  5000: 14688.08682320427,
};

export type BukuHardCover21x297FinishingOption =
  | 'Tanpa Laminasi'
  | 'Laminasi Glossy'
  | 'Laminasi Doff';

export interface BukuHardCover21x297SimulatorInput {
  oplah: number;
  finishing: BukuHardCover21x297FinishingOption;
  opsiFoil?: boolean;
  marginPct: number;
  negoDiskonPct: number;
}

export interface BukuHardCover21x297SimulatorResult {
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
  totalHpp: number;
  prosesCetak: string;
  areaCoverCm2: number;
  input: BukuHardCover21x297SimulatorInput;
  breakdown: {
    no: number;
    komponen: string;
    keterangan: string;
    biaya: number;
    porsiPct: number;
  }[];
}

export function getProsesCetakHardCover21x297(oplah: number): string {
  if (oplah <= 2500) return 'Cover Oliver - Isi Oliver';
  return 'Cover Oliver - Isi SM';
}

export function getBaseHppHardCover21x297(oplah: number): number {
  if (BUKU_HARD_COVER_21X297_HPP_MAP[oplah]) {
    return BUKU_HARD_COVER_21X297_HPP_MAP[oplah];
  }
  const tiers = BUKU_HARD_COVER_21X297_TIERS;
  if (oplah <= tiers[0]) return BUKU_HARD_COVER_21X297_HPP_MAP[tiers[0]];
  if (oplah >= tiers[tiers.length - 1]) return BUKU_HARD_COVER_21X297_HPP_MAP[tiers[tiers.length - 1]];

  for (let i = 0; i < tiers.length - 1; i++) {
    if (tiers[i] <= oplah && oplah <= tiers[i + 1]) {
      const t1 = tiers[i];
      const t2 = tiers[i + 1];
      const h1 = BUKU_HARD_COVER_21X297_HPP_MAP[t1];
      const h2 = BUKU_HARD_COVER_21X297_HPP_MAP[t2];
      return h1 + ((h2 - h1) * (oplah - t1)) / (t2 - t1);
    }
  }
  return BUKU_HARD_COVER_21X297_HPP_MAP[tiers[0]];
}

export function calculateBukuHardCover21x297Simulator(
  input: BukuHardCover21x297SimulatorInput,
  customParams?: Partial<BukuHardCover21x297MasterParams>
): BukuHardCover21x297SimulatorResult {
  const p: BukuHardCover21x297MasterParams = {
    ...DEFAULT_BUKU_HARD_COVER_21X297_PARAMS,
    ...customParams,
  };

  const oplah = Math.max(1, input.oplah);
  const proses = getProsesCetakHardCover21x297(oplah);
  const baseHppPerPcs = getBaseHppHardCover21x297(oplah);
  const areaCoverCm2 = (21 * 2 + 1.5) * (29.7 + 1.5); // Area terbuka cover ~1357 cm²

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
      keterangan: 'Offset Oliver 4 Warna (Plano)',
      biaya: Math.round(totalHpp * 0.16),
    },
    {
      komponen: 'Board & Casing Hard Cover',
      keterangan: 'Board No. 30 + Jasa Casing Hard Cover + Rounding',
      biaya: Math.round(totalHpp * 0.24),
    },
    {
      komponen: 'Bahan Skiblat (Art Carton 230)',
      keterangan: 'Skiblat Depan & Belakang A4 (Polos)',
      biaya: Math.round(totalHpp * 0.05),
    },
    {
      komponen: 'Bahan Kertas Isi (HVS 70)',
      keterangan: 'HVS 70 gsm 100 Halaman A4 (25 lembar)',
      biaya: Math.round(totalHpp * 0.20),
    },
    {
      komponen: 'Ongkos Cetak Isi',
      keterangan: `${proses.includes('Isi SM') ? 'Heidelberg SM 52 Offset' : 'Offset Oliver 1 Warna'}`,
      biaya: Math.round(totalHpp * 0.15),
    },
    {
      komponen: 'Finishing Jilid & Casing In',
      keterangan: 'Lipat, Susun, Jahit Benang, Lem Press, Sisir, Headband, Casing In',
      biaya: Math.round(totalHpp * 0.16),
    },
    {
      komponen: 'Kemasan (Kardus & Lakban)',
      keterangan: `${Math.ceil(oplah / 40)} box @ 40 pcs`,
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

export interface BukuHardCover21x297MatrixCell {
  oplah: number;
  prosesCetak: string;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
}

export function recalculateBukuHardCover21x297Matrix(
  customParams?: Partial<BukuHardCover21x297MasterParams>,
  finishing: BukuHardCover21x297FinishingOption = 'Tanpa Laminasi',
  opsiFoil = false,
  marginPct = 30,
  negoDiskonPct = 5
): BukuHardCover21x297MatrixCell[] {
  return BUKU_HARD_COVER_21X297_TIERS.map((oplah) => {
    const res = calculateBukuHardCover21x297Simulator(
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
