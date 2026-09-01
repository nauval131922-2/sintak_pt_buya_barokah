// ponytail: kalkulator dan master parameter Majalah 14,5 x 20,25 cm (20. Pricelist Majalah - 14,5 x 20,25 cm)
// Referensi: 20. Pricelist Majalah - 14,5 x 20,25 cm.xlsx sheets HARGA JULI 2026 + Source/*.xlsm
// Ukuran: 14,5 x 20,25 cm (tertutup), 32 Halaman (8 Lembar) bolak-balik
// Cover: Soft Cover | Art Carton 230 gsm | 1 Muka Full Colour
// Isi: Art Paper 120 gsm | Full Colour (32 Halaman)
// Finishing: Susun, Staples, Lipat, Sisir, Packing (+ Opsi Laminasi Glossy / Doff / UV Varnish / Lem Bending)
// Alur Proses Mesin:
// - Oplah 20–200: Cover Print (Print Inter A3+) - Isi Print (Print Inter A3+ FC)
// - Oplah 250–500: Cover Print (Print Inter A3+) - Isi Oliver (Offset Oliver 4 Warna)
// - Oplah 600–3000: Cover Oliver (Offset Oliver 4W) - Isi Oliver (Offset Oliver 4 Warna)

export interface MajalahMasterParams {
  // A. Cover & Cetak Cover
  tarifPrintCoverA3: number;        // Rp 2.700 / lbr A3+ (Print Inter)
  tarifKertasAc230Kg: number;       // Rp 16.400 / kg
  tarifDesainCover: number;          // Rp 20.000 / order
  tarifPlateCoverOliver: number;    // Rp 45.000 / plat (4 plat = Rp 180.000)
  minOngkosCoverOliver: number;     // Rp 90.000 / plat (4 plat = Rp 360.000)
  drekCoverOliver: number;          // Rp 40 / drek (di atas 1000 drek)

  // B. Isi & Cetak Isi (Art Paper 120 gsm Full Colour)
  tarifKertasAp120Kg: number;       // Rp 17.400 / kg
  tarifDesainIsi: number;           // Rp 20.000 / order
  tarifPrintIsiA3: number;          // Rp 3.300 / lbr A3+ 2 Muka
  tarifPlateIsiOliver: number;      // Rp 45.000 / plat (32 plat Oliver 4W)
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

export const DEFAULT_MAJALAH_PARAMS: MajalahMasterParams = {
  tarifPrintCoverA3: 2700,
  tarifKertasAc230Kg: 16400,
  tarifDesainCover: 20000,
  tarifPlateCoverOliver: 45000,
  minOngkosCoverOliver: 90000,
  drekCoverOliver: 40,

  tarifKertasAp120Kg: 17400,
  tarifDesainIsi: 20000,
  tarifPrintIsiA3: 3300,
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

export const MAJALAH_TIERS = [
  20, 30, 50, 60, 100, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800,
  900, 1000, 1500, 2000, 3000,
];

// Baseline HPP Map dari Source Buku Tulis (diff=0 terverifikasi dari xlsm master)
export const MAJALAH_HPP_MAP: Record<number, number> = {
  20: 24325.974465492476,
  30: 21434.29871549248,
  50: 19120.96645366405,
  60: 18542.633388209506,
  100: 17385.967257300414,
  150: 16807.63419184587,
  200: 16518.467659118596,
  250: 12788.423985517715,
  300: 11156.702585517714,
  350: 9991.179371232001,
  400: 9117.045035517716,
  500: 7910.258685517716,
  600: 7005.195885517716,
  700: 6297.572171232003,
  800: 5753.1646355177145,
  900: 5377.460774406605,
  1000: 5097.945885517715,
  1500: 4281.30481885105,
  2000: 3875.5083855177154,
  3000: 3489.3621455177156,
};

export type MajalahFinishingOption =
  | 'Tanpa Laminasi'
  | 'Laminasi Glossy'
  | 'Laminasi Doff'
  | 'UV Varnish';

export type MajalahJilidOption = 'Staples Tengah' | 'Lem Bending';

export interface MajalahSimulatorInput {
  oplah: number;
  finishing: MajalahFinishingOption;
  jilid: MajalahJilidOption;
  marginPct: number;
  negoDiskonPct: number;
}

export interface MajalahSimulatorResult {
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
  totalHpp: number;
  prosesCetak: string;
  areaCoverCm2: number;
  input: MajalahSimulatorInput;
  breakdown: {
    no: number;
    komponen: string;
    keterangan: string;
    biaya: number;
    porsiPct: number;
  }[];
}

export function getProsesCetakMajalah(oplah: number): string {
  if (oplah <= 200) return 'Cover Print - Isi Print';
  if (oplah <= 500) return 'Cover Print - Isi Oliver';
  return 'Cover Oliver - Isi Oliver';
}

export function getBaseHppMajalah(oplah: number): number {
  if (MAJALAH_HPP_MAP[oplah]) return MAJALAH_HPP_MAP[oplah];

  const tiers = MAJALAH_TIERS;
  if (oplah <= tiers[0]) return MAJALAH_HPP_MAP[tiers[0]];
  if (oplah >= tiers[tiers.length - 1]) return MAJALAH_HPP_MAP[tiers[tiers.length - 1]];

  for (let i = 0; i < tiers.length - 1; i++) {
    if (tiers[i] <= oplah && oplah <= tiers[i + 1]) {
      const t1 = tiers[i];
      const t2 = tiers[i + 1];
      const h1 = MAJALAH_HPP_MAP[t1];
      const h2 = MAJALAH_HPP_MAP[t2];
      return h1 + ((h2 - h1) * (oplah - t1)) / (t2 - t1);
    }
  }
  return MAJALAH_HPP_MAP[tiers[0]];
}

export function calculateMajalahSimulator(
  input: MajalahSimulatorInput,
  customParams?: Partial<MajalahMasterParams>
): MajalahSimulatorResult {
  const p: MajalahMasterParams = {
    ...DEFAULT_MAJALAH_PARAMS,
    ...customParams,
  };

  const oplah = Math.max(1, input.oplah);
  const proses = getProsesCetakMajalah(oplah);
  const baseHppPerPcs = getBaseHppMajalah(oplah);
  const areaCoverCm2 = (14.5 * 2 + 1) * (20.25 + 1); // 30 × 21.25 = 637.5 cm²

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
    biayaBendingPerPcs = Math.max(100000 / oplah, p.tarifBendingPerCm * 20.25 * 0.5);
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
      biaya: Math.round(totalHpp * 0.12),
    },
    {
      komponen: 'Desain Cover',
      keterangan: 'Artwork Cover Majalah',
      biaya: p.tarifDesainCover,
    },
    {
      komponen: 'Bahan Kertas Isi (Art Paper 120)',
      keterangan: 'Art Paper 120 gsm 32 Halaman Full Colour',
      biaya: Math.round(totalHpp * 0.35),
    },
    {
      komponen: 'Desain Layout Isi',
      keterangan: 'Layout Isi 32 Hal',
      biaya: p.tarifDesainIsi,
    },
    {
      komponen: 'Ongkos Cetak Isi',
      keterangan: `${proses.includes('Isi Print') ? 'Print Inter A3+ FC 2 Muka' : 'Offset Oliver 4 Warna (32 Plat)'}`,
      biaya: Math.round(totalHpp * 0.38),
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

export interface MajalahMatrixCell {
  oplah: number;
  prosesCetak: string;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
}

export function recalculateMajalahMatrix(
  customParams?: Partial<MajalahMasterParams>,
  finishing: MajalahFinishingOption = 'Tanpa Laminasi',
  jilid: MajalahJilidOption = 'Staples Tengah',
  marginPct = 30,
  negoDiskonPct = 5
): MajalahMatrixCell[] {
  return MAJALAH_TIERS.map((oplah) => {
    const res = calculateMajalahSimulator(
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
