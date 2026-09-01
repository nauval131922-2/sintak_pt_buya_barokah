// ponytail: kalkulator dan master parameter Buku Soft Cover 10,5 x 14,8 cm (24. Pricelist Buku Soft Cover - 10,5 x 14,8 cm)
// Referensi: Pricelist Buku Soft Cover - 10,5 x 14,8 cm.xlsx sheets HARGA JULI 2026 + Source/*.xlsm
// Ukuran: 10,5 x 14,8 cm (A6 tertutup), 32 Halaman (8 Lembar) bolak-balik
// Cover: Soft Cover | Art Carton 230 gsm | 1 Muka Full Colour
// Isi: HVS 70 gsm | 1 Warna Bolak-Balik (32 Halaman)
// Finishing: Susun, Staples, Lipat, Sisir, Packing (+ Opsi Laminasi Glossy / Doff / UV Varnish / Lem Bending)
// Alur Proses Mesin:
// - Oplah 20–200: Cover Print (Print Inter A3+) - Isi Print (Print Buya A4)
// - Oplah 250–600: Cover Print (Print Inter A3+) - Isi Ryobi (Offset Ryobi 1W)
// - Oplah 700–1000: Cover Print (Print Inter A3+) - Isi Oliver (Offset Oliver 1W)
// - Oplah 1500–5000: Cover Oliver (Offset Oliver 4W) - Isi Oliver (Offset Oliver 1W)

export interface BukuSoftCover105x148MasterParams {
  // A. Cover & Cetak Cover
  tarifPrintCoverA3: number;        // Rp 2.700 / lbr A3+ (Print Inter)
  tarifKertasAc230Kg: number;       // Rp 16.400 / kg
  tarifDesainCover: number;          // Rp 20.000 / order
  tarifPlateCoverOliver: number;    // Rp 45.000 / plat (4 plat = Rp 180.000)
  minOngkosCoverOliver: number;     // Rp 90.000 / plat (4 plat = Rp 360.000)
  drekCoverOliver: number;          // Rp 40 / drek (di atas 1000 drek)

  // B. Isi & Cetak Isi
  tarifKertasHvs70Kg: number;       // Rp 15.700 / kg
  tarifDesainIsi: number;           // Rp 20.000 / order
  tarifPrintIsiPerLbr: number;      // Rp 350 / lbr (Print Buya A4)
  tarifPlateIsiRyobi: number;       // Rp 10.000 / plat (8 plat = Rp 80.000)
  minOngkosIsiRyobi: number;        // Rp 15.000 / plat
  drekIsiRyobi: number;             // Rp 30 / drek (di atas 500 drek)
  tarifPlateIsiOliver: number;      // Rp 45.000 / plat (4 plat = Rp 180.000)
  minOngkosIsiOliver: number;       // Rp 90.000 / plat
  drekIsiOliver: number;            // Rp 40 / drek (di atas 1000 drek)

  // C. Finishing & Kemasan
  jasaFinishingStandar: number;     // Rp 140.94 / pcs
  tarifStaplesPcs: number;          // Rp 9 / pcs
  tarifSisirPcs: number;            // Rp 150 / pcs
  tarifKardusBox: number;           // Rp 8.500 / box (kapasitas 200 pcs)
  tarifLakbanRoll: number;          // Rp 8.000 / roll

  // D. Finishing Tambahan (Laminasi & Bending)
  tarifLaminasiGlossyCm2: number;   // Rp 0.35 / cm²
  tarifLaminasiDoffCm2: number;     // Rp 0.40 / cm²
  tarifUvVarnishCm2: number;        // Rp 0.11 / cm²
  minLaminasi: number;              // Rp 50.000 / order
  tarifBendingPerCm: number;        // Rp 50 / cm (min Rp 100.000)

  // E. Margin & Nego Standar
  marginDefaultPct: number;         // 30% (HARGA JULI 2026: ROUNDUP(HPP * 1.30, -2))
  negoDefaultPct: number;           // 5% (HARGA JULI 2026: ROUNDUP(Harga * 0.95, -2))
}

export const DEFAULT_BUKU_SOFT_COVER_105X148_PARAMS: BukuSoftCover105x148MasterParams = {
  tarifPrintCoverA3: 2700,
  tarifKertasAc230Kg: 16400,
  tarifDesainCover: 20000,
  tarifPlateCoverOliver: 45000,
  minOngkosCoverOliver: 90000,
  drekCoverOliver: 40,

  tarifKertasHvs70Kg: 15700,
  tarifDesainIsi: 20000,
  tarifPrintIsiPerLbr: 350,
  tarifPlateIsiRyobi: 10000,
  minOngkosIsiRyobi: 15000,
  drekIsiRyobi: 30,
  tarifPlateIsiOliver: 45000,
  minOngkosIsiOliver: 90000,
  drekIsiOliver: 40,

  jasaFinishingStandar: 140.9425,
  tarifStaplesPcs: 9,
  tarifSisirPcs: 150,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,

  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  tarifUvVarnishCm2: 0.11,
  minLaminasi: 50000,
  tarifBendingPerCm: 50,

  marginDefaultPct: 30,
  negoDefaultPct: 5,
};

export const BUKU_SOFT_COVER_105X148_TIERS = [
  20, 30, 50, 60, 100, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800,
  900, 1000, 1500, 2000, 3000, 4000, 5000,
];

// Baseline HPP Map dari Source Buku Tulis (diff=0 terverifikasi dari xlsm master)
export const BUKU_SOFT_COVER_105X148_HPP_MAP: Record<number, number> = {
  20: 7062.030588235295,
  30: 5648.968254901962,
  50: 4464.530588235294,
  60: 4145.922121568628,
  100: 3562.7011882352945,
  150: 3280.090721568628,
  200: 3125.2754882352943,
  250: 2466.685388235294,
  300: 2265.7225882352943,
  350: 2129.878778711485,
  400: 2021.2587787114848,
  500: 1905.981888235294,
  600: 1842.9649215686278,
  700: 1802.2033882352943,
  800: 1730.7963882352944,
  900: 1684.7171926797387,
  1000: 1647.3488882352944,
  1500: 1413.338023412453,
  2000: 1265.8177284124529,
  3000: 1121.130766745786,
  4000: 1052.7872859124527,
  5000: 1016.5811974124524,
};

export type BukuSoftCover105x148FinishingOption =
  | 'Tanpa Laminasi'
  | 'Laminasi Glossy'
  | 'Laminasi Doff'
  | 'UV Varnish';

export type BukuSoftCover105x148JilidOption = 'Staples Tengah' | 'Lem Bending';

export interface BukuSoftCover105x148SimulatorInput {
  oplah: number;
  finishing: BukuSoftCover105x148FinishingOption;
  jilid: BukuSoftCover105x148JilidOption;
  marginPct: number;
  negoDiskonPct: number;
}

export interface BukuSoftCover105x148SimulatorResult {
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
  totalHpp: number;
  prosesCetak: string;
  areaCoverCm2: number;
  input: BukuSoftCover105x148SimulatorInput;
  breakdown: {
    no: number;
    komponen: string;
    keterangan: string;
    biaya: number;
    porsiPct: number;
  }[];
}

export function getProsesCetakBukuSoftCover105x148(oplah: number): string {
  if (oplah <= 200) return 'Cover Print - Isi Print';
  if (oplah <= 600) return 'Cover Print - Isi Ryobi';
  if (oplah <= 1000) return 'Cover Print - Isi Oliver';
  return 'Cover Oliver - Isi Oliver';
}

export function getBaseHppBukuSoftCover105x148(oplah: number): number {
  if (BUKU_SOFT_COVER_105X148_HPP_MAP[oplah]) return BUKU_SOFT_COVER_105X148_HPP_MAP[oplah];

  const tiers = BUKU_SOFT_COVER_105X148_TIERS;
  if (oplah <= tiers[0]) return BUKU_SOFT_COVER_105X148_HPP_MAP[tiers[0]];
  if (oplah >= tiers[tiers.length - 1]) return BUKU_SOFT_COVER_105X148_HPP_MAP[tiers[tiers.length - 1]];

  for (let i = 0; i < tiers.length - 1; i++) {
    if (tiers[i] <= oplah && oplah <= tiers[i + 1]) {
      const t1 = tiers[i];
      const t2 = tiers[i + 1];
      const h1 = BUKU_SOFT_COVER_105X148_HPP_MAP[t1];
      const h2 = BUKU_SOFT_COVER_105X148_HPP_MAP[t2];
      return h1 + ((h2 - h1) * (oplah - t1)) / (t2 - t1);
    }
  }
  return BUKU_SOFT_COVER_105X148_HPP_MAP[tiers[0]];
}

export function calculateBukuSoftCover105x148Simulator(
  input: BukuSoftCover105x148SimulatorInput,
  customParams?: Partial<BukuSoftCover105x148MasterParams>
): BukuSoftCover105x148SimulatorResult {
  const p: BukuSoftCover105x148MasterParams = {
    ...DEFAULT_BUKU_SOFT_COVER_105X148_PARAMS,
    ...customParams,
  };

  const oplah = Math.max(1, input.oplah);
  const proses = getProsesCetakBukuSoftCover105x148(oplah);
  const baseHppPerPcs = getBaseHppBukuSoftCover105x148(oplah);
  const areaCoverCm2 = (10.5 * 2 + 1) * (14.85 + 1); // 22 × 15.85 = ~348.7 cm²

  // Finishing Tambahan (Laminasi Cover)
  let biayaLaminasiPerPcs = 0;
  if (input.finishing === 'Laminasi Glossy') {
    biayaLaminasiPerPcs = Math.max(p.minLaminasi / oplah, areaCoverCm2 * p.tarifLaminasiGlossyCm2);
  } else if (input.finishing === 'Laminasi Doff') {
    biayaLaminasiPerPcs = Math.max(p.minLaminasi / oplah, areaCoverCm2 * p.tarifLaminasiDoffCm2);
  } else if (input.finishing === 'UV Varnish') {
    biayaLaminasiPerPcs = Math.max(p.minLaminasi / oplah, areaCoverCm2 * p.tarifUvVarnishCm2);
  }

  // Jilid Tambahan (Lem Bending)
  let biayaBendingPerPcs = 0;
  if (input.jilid === 'Lem Bending') {
    biayaBendingPerPcs = Math.max(100000 / oplah, p.tarifBendingPerCm * 14.85 * 0.5);
  }

  const hppPerPcs = baseHppPerPcs + biayaLaminasiPerPcs + biayaBendingPerPcs;
  const totalHpp = hppPerPcs * oplah;

  const marginPct = input.marginPct ?? p.marginDefaultPct;
  const negoDiskonPct = input.negoDiskonPct ?? p.negoDefaultPct;

  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + marginPct / 100)) / 100) * 100;
  const negoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 100) * 100;
  const totalHargaJual = hargaJualPerPcs * oplah;

  // Breakdown representatif
  const rawBreakdown = [
    {
      komponen: 'Bahan Cover (Art Carton 230)',
      keterangan: `${proses.startsWith('Cover Print') ? 'Print Inter A3+' : 'Offset Oliver 4W'}`,
      biaya: Math.round(totalHpp * 0.20),
    },
    {
      komponen: 'Desain Cover',
      keterangan: 'Artwork Cover Buku',
      biaya: p.tarifDesainCover,
    },
    {
      komponen: 'Bahan Kertas Isi (HVS 70)',
      keterangan: 'HVS 70 gsm 32 Halaman (8 lembar)',
      biaya: Math.round(totalHpp * 0.30),
    },
    {
      komponen: 'Desain Layout Isi',
      keterangan: 'Layout Isi 32 Hal',
      biaya: p.tarifDesainIsi,
    },
    {
      komponen: 'Ongkos Cetak Isi',
      keterangan: `${proses.includes('Isi Print') ? 'Print Buya A4' : proses.includes('Isi Ryobi') ? 'Offset Ryobi 1W' : 'Offset Oliver 1W'}`,
      biaya: Math.round(totalHpp * 0.25),
    },
    {
      komponen: 'Jasa Finishing Standar',
      keterangan: 'Susun, Staples Tengah, Lipat, Sisir',
      biaya: Math.round((p.jasaFinishingStandar + p.tarifStaplesPcs + p.tarifSisirPcs) * oplah),
    },
    {
      komponen: 'Kemasan (Kardus & Lakban)',
      keterangan: `${Math.ceil(oplah / 200)} box @ 200 pcs`,
      biaya: Math.round(Math.ceil(oplah / 200) * p.tarifKardusBox + (oplah / 200 / 39.03) * p.tarifLakbanRoll),
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
    ...(biayaBendingPerPcs > 0
      ? [
          {
            komponen: `Jilid (${input.jilid})`,
            keterangan: 'Lem Bending Panas',
            biaya: Math.round(biayaBendingPerPcs * oplah),
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

export interface BukuSoftCover105x148MatrixCell {
  oplah: number;
  prosesCetak: string;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
}

export function recalculateBukuSoftCover105x148Matrix(
  customParams?: Partial<BukuSoftCover105x148MasterParams>,
  finishing: BukuSoftCover105x148FinishingOption = 'Tanpa Laminasi',
  jilid: BukuSoftCover105x148JilidOption = 'Staples Tengah',
  marginPct = 30,
  negoDiskonPct = 5
): BukuSoftCover105x148MatrixCell[] {
  return BUKU_SOFT_COVER_105X148_TIERS.map((oplah) => {
    const res = calculateBukuSoftCover105x148Simulator(
      {
        oplah,
        finishing,
        jilid,
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
