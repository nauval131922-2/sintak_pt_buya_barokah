// ponytail: kalkulator dan master parameter Packaging Box Dus (28. Pricelist Packaging)
// Referensi: Pricelist Packaging.xlsx sheets HARGA JULI 2026 + Source/*.xlsm
// Ukuran: 15 x 15 x 8 cm, 20 x 20 x 7 cm, 15,2 x 10,2 x 4,5 cm, 18 x 18 x 8,5 cm
// Bahan: Duplex 350 gsm, Art Carton 230 gsm, Ivory 230 gsm
// Cetak: Full Colour 1 Muka (Oliver 58/52 s/d 2.500 pcs, SM 52/72 >= 3.000 pcs)
// Finishing: Pond (Die Cut) + Packing Kardus + Lakban, Opsi: Laminasi Glossy / Doff / UV Varnish / Tanpa Laminasi
// Margin default: 30%, Nego default: 5%

export type PackagingUkuran =
  | '15 x 15 x 8 cm'
  | '20 x 20 x 7 cm'
  | '15,2 x 10,2 x 4,5 cm'
  | '18 x 18 x 8,5 cm';

export type PackagingBahan =
  | 'Duplex 350 gsm'
  | 'Art Carton 230 gsm'
  | 'Ivory 230 gsm';

export type PackagingFinishing =
  | 'Tanpa Laminasi'
  | 'Laminasi Glossy 1 Muka'
  | 'Laminasi Doff 1 Muka'
  | 'UV Varnish';

export interface PackagingVariantSpec {
  ukuran: PackagingUkuran;
  bahan: PackagingBahan;
  namaProduk: string;
  ukuranTerbuka: string; // e.g. '31 x 54 cm'
  panjangTerbukaCm: number;
  lebarTerbukaCm: number;
  planoYield: number; // berapa box dari 1 plano
  defaultHargaPlano: number; // Rp / plano
}

export const PACKAGING_VARIANTS: Record<string, PackagingVariantSpec> = {
  // 1. 15 x 15 x 8 cm (Dus Snack / Nasi Kecil)
  '15x15x8_duplex': {
    ukuran: '15 x 15 x 8 cm',
    bahan: 'Duplex 350 gsm',
    namaProduk: 'Packaging Dus 15 x 15 x 8 cm - Duplex 350 gsm',
    ukuranTerbuka: '31 x 54 cm',
    panjangTerbukaCm: 31,
    lebarTerbukaCm: 54,
    planoYield: 4,
    defaultHargaPlano: 4285.26,
  },
  '15x15x8_ac': {
    ukuran: '15 x 15 x 8 cm',
    bahan: 'Art Carton 230 gsm',
    namaProduk: 'Packaging Dus 15 x 15 x 8 cm - Art Carton 230 gsm',
    ukuranTerbuka: '31 x 54 cm',
    panjangTerbukaCm: 31,
    lebarTerbukaCm: 54,
    planoYield: 2,
    defaultHargaPlano: 2451.8,
  },
  '15x15x8_ivory': {
    ukuran: '15 x 15 x 8 cm',
    bahan: 'Ivory 230 gsm',
    namaProduk: 'Packaging Dus 15 x 15 x 8 cm - Ivory 230 gsm',
    ukuranTerbuka: '31 x 54 cm',
    panjangTerbukaCm: 31,
    lebarTerbukaCm: 54,
    planoYield: 2,
    defaultHargaPlano: 2227.55,
  },

  // 2. 20 x 20 x 7 cm (Dus Nasi Standar Catering)
  '20x20x7_duplex': {
    ukuran: '20 x 20 x 7 cm',
    bahan: 'Duplex 350 gsm',
    namaProduk: 'Packaging Dus 20 x 20 x 7 cm - Duplex 350 gsm',
    ukuranTerbuka: '34 x 61 cm',
    panjangTerbukaCm: 34,
    lebarTerbukaCm: 61,
    planoYield: 3,
    defaultHargaPlano: 4285.26,
  },
  '20x20x7_ac': {
    ukuran: '20 x 20 x 7 cm',
    bahan: 'Art Carton 230 gsm',
    namaProduk: 'Packaging Dus 20 x 20 x 7 cm - Art Carton 230 gsm',
    ukuranTerbuka: '34 x 61 cm',
    panjangTerbukaCm: 34,
    lebarTerbukaCm: 61,
    planoYield: 3,
    defaultHargaPlano: 3248.07,
  },
  '20x20x7_ivory': {
    ukuran: '20 x 20 x 7 cm',
    bahan: 'Ivory 230 gsm',
    namaProduk: 'Packaging Dus 20 x 20 x 7 cm - Ivory 230 gsm',
    ukuranTerbuka: '34 x 61 cm',
    panjangTerbukaCm: 34,
    lebarTerbukaCm: 61,
    planoYield: 3,
    defaultHargaPlano: 2950.99,
  },

  // 3. 15,2 x 10,2 x 4,5 cm (Dus Kue / Snack Mini)
  '152x102x45_duplex': {
    ukuran: '15,2 x 10,2 x 4,5 cm',
    bahan: 'Duplex 350 gsm',
    namaProduk: 'Packaging Dus 15,2 x 10,2 x 4,5 cm - Duplex 350 gsm',
    ukuranTerbuka: '24,2 x 34,5 cm',
    panjangTerbukaCm: 24.2,
    lebarTerbukaCm: 34.5,
    planoYield: 8,
    defaultHargaPlano: 4285.26,
  },
  '152x102x45_ac': {
    ukuran: '15,2 x 10,2 x 4,5 cm',
    bahan: 'Art Carton 230 gsm',
    namaProduk: 'Packaging Dus 15,2 x 10,2 x 4,5 cm - Art Carton 230 gsm',
    ukuranTerbuka: '24,2 x 34,5 cm',
    panjangTerbukaCm: 24.2,
    lebarTerbukaCm: 34.5,
    planoYield: 6,
    defaultHargaPlano: 3248.07,
  },
  '152x102x45_ivory': {
    ukuran: '15,2 x 10,2 x 4,5 cm',
    bahan: 'Ivory 230 gsm',
    namaProduk: 'Packaging Dus 15,2 x 10,2 x 4,5 cm - Ivory 230 gsm',
    ukuranTerbuka: '24,2 x 34,5 cm',
    panjangTerbukaCm: 24.2,
    lebarTerbukaCm: 34.5,
    planoYield: 6,
    defaultHargaPlano: 2950.99,
  },

  // 4. 18 x 18 x 8,5 cm (Dus Nasi Sedang)
  '18x18x85_duplex': {
    ukuran: '18 x 18 x 8,5 cm',
    bahan: 'Duplex 350 gsm',
    namaProduk: 'Packaging Dus 18 x 18 x 8,5 cm - Duplex 350 gsm',
    ukuranTerbuka: '35 x 61,5 cm',
    panjangTerbukaCm: 35,
    lebarTerbukaCm: 61.5,
    planoYield: 3,
    defaultHargaPlano: 4285.26,
  },
  '18x18x85_ac': {
    ukuran: '18 x 18 x 8,5 cm',
    bahan: 'Art Carton 230 gsm',
    namaProduk: 'Packaging Dus 18 x 18 x 8,5 cm - Art Carton 230 gsm',
    ukuranTerbuka: '35 x 61,5 cm',
    panjangTerbukaCm: 35,
    lebarTerbukaCm: 61.5,
    planoYield: 2,
    defaultHargaPlano: 3248.07,
  },
  '18x18x85_ivory': {
    ukuran: '18 x 18 x 8,5 cm',
    bahan: 'Ivory 230 gsm',
    namaProduk: 'Packaging Dus 18 x 18 x 8,5 cm - Ivory 230 gsm',
    ukuranTerbuka: '35 x 61,5 cm',
    panjangTerbukaCm: 35,
    lebarTerbukaCm: 61.5,
    planoYield: 2,
    defaultHargaPlano: 2950.99,
  },
};

export const PACKAGING_UKURAN_OPTIONS: PackagingUkuran[] = [
  '15 x 15 x 8 cm',
  '20 x 20 x 7 cm',
  '15,2 x 10,2 x 4,5 cm',
  '18 x 18 x 8,5 cm',
];

export const PACKAGING_BAHAN_OPTIONS: PackagingBahan[] = [
  'Duplex 350 gsm',
  'Art Carton 230 gsm',
  'Ivory 230 gsm',
];

export const PACKAGING_FINISHING_OPTIONS: PackagingFinishing[] = [
  'Tanpa Laminasi',
  'Laminasi Glossy 1 Muka',
  'Laminasi Doff 1 Muka',
  'UV Varnish',
];

export interface PackagingMasterParams {
  // 1. Kertas Plano Dasar (Rp/lembar plano)
  hargaPlanoDuplex350: number; // default Rp 4.285,26
  hargaPlanoAC230_15x15: number; // default Rp 2.451,80
  hargaPlanoAC230_Standard: number; // default Rp 3.248,07
  hargaPlanoIvory230_15x15: number; // default Rp 2.227,55
  hargaPlanoIvory230_Standard: number; // default Rp 2.950,99
  insheetPlanoOliver: number; // 150 lembar
  insheetPlanoSM: number; // 150 lembar

  // 2. Desain & Plat
  biayaDesain: number; // Rp 20.000
  tarifPlatOliverPerWarna: number; // Rp 45.000 / plat
  tarifPlatSMPerWarna: number; // Rp 78.000 / plat

  // 3. Ongkos Cetak
  // Oliver (Oplah < 3.000)
  oliverMinOngkosPerWarna: number; // Rp 90.000 / plat (min s/d 1.000 drek)
  oliverDrekOverPerWarna: number; // Rp 40 / drek / warna (> 1.000 drek)
  // SM (Oplah >= 3.000)
  smMinOngkosPerWarna: number; // Rp 310.000 / plat (min s/d 3.000 drek)
  smDrekOverPerWarna: number; // Rp 100 / drek / warna (> 3.000 drek)

  // 4. Finishing Pond & Transport
  biayaTransport: number; // Rp 100.000
  tarifPisauPondPerCm2: number; // Rp 149,65 / cm2 (min Rp 50.000)
  tarifOngkosPondPerPcs: number; // Rp 143,95 / pcs (min total pond Rp 50.000)
  minBiayaPond: number; // Rp 50.000

  // 5. Packing & Bungkus
  tarifKardusPerPcs: number; // Rp 450,97 / kardus (1 kardus = 100 pcs box)
  kapasitasKardusPcs: number; // 100 pcs
  tarifLakbanPerRoll: number; // Rp 8.000 (1 roll = 63,75 kardus)

  // 6. Finishing Tambahan (Opsional)
  tarifLaminasiGlossyPerCm2: number; // Rp 0,35 / cm2 (min Rp 50.000)
  tarifLaminasiDoffPerCm2: number; // Rp 0,40 / cm2 (min Rp 50.000)
  tarifUVVarnishPerCm2: number; // Rp 0,12 / cm2 (min Rp 50.000)
  minBiayaLaminasi: number; // Rp 50.000

  // 7. Margin & Nego Default
  marginDefaultPct: number; // 30%
  negoDefaultPct: number; // 5%
}

export const DEFAULT_PACKAGING_PARAMS: PackagingMasterParams = {
  hargaPlanoDuplex350: 4285.26,
  hargaPlanoAC230_15x15: 2451.8,
  hargaPlanoAC230_Standard: 3248.07,
  hargaPlanoIvory230_15x15: 2227.55,
  hargaPlanoIvory230_Standard: 2950.99,
  insheetPlanoOliver: 150,
  insheetPlanoSM: 150,

  biayaDesain: 20000,
  tarifPlatOliverPerWarna: 45000,
  tarifPlatSMPerWarna: 78000,

  oliverMinOngkosPerWarna: 90000,
  oliverDrekOverPerWarna: 40,
  smMinOngkosPerWarna: 310000,
  smDrekOverPerWarna: 100,

  biayaTransport: 100000,
  tarifPisauPondPerCm2: 149.65,
  tarifOngkosPondPerPcs: 143.9528,
  minBiayaPond: 50000,

  tarifKardusPerPcs: 450.9736,
  kapasitasKardusPcs: 100,
  tarifLakbanPerRoll: 8000,

  tarifLaminasiGlossyPerCm2: 0.35,
  tarifLaminasiDoffPerCm2: 0.4,
  tarifUVVarnishPerCm2: 0.12,
  minBiayaLaminasi: 50000,

  marginDefaultPct: 30,
  negoDefaultPct: 5,
};

export interface PackagingSimulatorInput {
  ukuran: PackagingUkuran;
  bahan: PackagingBahan;
  oplah: number;
  finishing: PackagingFinishing;
  marginPct: number;
  negoDiskonPct: number;
}

export interface PackagingCostItem {
  no: number;
  komponen: string;
  keterangan: string;
  biaya: number;
  porsiPct: number;
}

export interface PackagingSimulatorResult {
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
  totalHpp: number;
  prosesCetak: string;
  kebutuhanPlano: number;
  insirtCetak: number;
  biayaKertas: number;
  biayaDesain: number;
  biayaPlat: number;
  ongkosCetak: number;
  biayaTransport: number;
  biayaPisauPond: number;
  biayaOngkosPond: number;
  biayaPondTotal: number;
  biayaPacking: number;
  biayaFinishingTambahan: number;
  breakdown: PackagingCostItem[];
  input: PackagingSimulatorInput;
  variantKey: string;
  variantSpec: PackagingVariantSpec;
}

export function getPackagingVariantKey(
  ukuran: PackagingUkuran,
  bahan: PackagingBahan
): string {
  let ukKey = '15x15x8';
  if (ukuran === '20 x 20 x 7 cm') ukKey = '20x20x7';
  else if (ukuran === '15,2 x 10,2 x 4,5 cm') ukKey = '152x102x45';
  else if (ukuran === '18 x 18 x 8,5 cm') ukKey = '18x18x85';

  let bahanKey = 'duplex';
  if (bahan === 'Art Carton 230 gsm') bahanKey = 'ac';
  else if (bahan === 'Ivory 230 gsm') bahanKey = 'ivory';

  return `${ukKey}_${bahanKey}`;
}

export function getHargaPlanoForVariant(
  ukuran: PackagingUkuran,
  bahan: PackagingBahan,
  params: PackagingMasterParams
): number {
  if (bahan === 'Duplex 350 gsm') {
    return params.hargaPlanoDuplex350;
  }
  if (bahan === 'Art Carton 230 gsm') {
    if (ukuran === '15 x 15 x 8 cm') return params.hargaPlanoAC230_15x15;
    return params.hargaPlanoAC230_Standard;
  }
  if (bahan === 'Ivory 230 gsm') {
    if (ukuran === '15 x 15 x 8 cm') return params.hargaPlanoIvory230_15x15;
    return params.hargaPlanoIvory230_Standard;
  }
  return params.hargaPlanoDuplex350;
}

export function calculatePackaging(
  input: PackagingSimulatorInput,
  params: PackagingMasterParams = DEFAULT_PACKAGING_PARAMS
): PackagingSimulatorResult {
  const oplah = Math.max(1, input.oplah);
  const variantKey = getPackagingVariantKey(input.ukuran, input.bahan);
  const spec = PACKAGING_VARIANTS[variantKey] || PACKAGING_VARIANTS['15x15x8_duplex'];

  const isSM = oplah >= 3000;
  const prosesCetak = isSM ? 'SM 52 / SM 72 (Heidelberg)' : 'Oliver 58 / 52 (4 Warna)';

  // 1. Kertas
  const planoYield = spec.planoYield;
  const insheet = isSM ? params.insheetPlanoSM : params.insheetPlanoOliver;
  const kebutuhanPlano = isSM
    ? Math.ceil(oplah / planoYield + insheet)
    : Math.ceil(oplah / planoYield + insheet / planoYield);

  const hargaPlano = getHargaPlanoForVariant(input.ukuran, input.bahan, params);
  const biayaKertas = kebutuhanPlano * hargaPlano;

  // 2. Desain
  const biayaDesain = params.biayaDesain;

  // 3. Plat (4 Warna)
  const tarifPlat = isSM ? params.tarifPlatSMPerWarna : params.tarifPlatOliverPerWarna;
  const biayaPlat = 4 * tarifPlat;

  // 4. Ongkos Cetak (4 Warna)
  const insirtCetak = kebutuhanPlano * planoYield;
  let ongkosCetak = 0;
  if (isSM) {
    const minOngkos = 4 * params.smMinOngkosPerWarna;
    const overDrek = Math.max(0, insirtCetak - 3000);
    ongkosCetak = minOngkos + overDrek * params.smDrekOverPerWarna * 4;
  } else {
    const minOngkos = 4 * params.oliverMinOngkosPerWarna;
    const overDrek = Math.max(0, insirtCetak - 1000);
    ongkosCetak = minOngkos + overDrek * params.oliverDrekOverPerWarna * 4;
  }

  // 5. Transport
  const biayaTransport = params.biayaTransport;

  // 6. Finishing Pond (Pisau Pond + Ongkos Pond)
  const areaCm2 = spec.panjangTerbukaCm * spec.lebarTerbukaCm;
  const biayaPisauPond = Math.max(
    params.minBiayaPond,
    areaCm2 * params.tarifPisauPondPerCm2
  );
  const biayaOngkosPond = oplah * params.tarifOngkosPondPerPcs;
  const biayaPondTotal = Math.max(
    params.minBiayaPond,
    biayaPisauPond + biayaOngkosPond
  );

  // 7. Packing (Kardus + Lakban)
  const jumlahKardus = Math.ceil(oplah / params.kapasitasKardusPcs);
  const biayaKardus = jumlahKardus * params.tarifKardusPerPcs;
  const biayaLakban =
    (oplah / params.kapasitasKardusPcs / 63.75) * params.tarifLakbanPerRoll;
  const biayaPacking = biayaKardus + biayaLakban;

  // 8. Finishing Tambahan (Laminasi / UV)
  let biayaFinishingTambahan = 0;
  let ketFinishing = 'Tanpa Laminasi';
  if (input.finishing === 'Laminasi Glossy 1 Muka') {
    const rawFin = areaCm2 * params.tarifLaminasiGlossyPerCm2 * oplah;
    biayaFinishingTambahan = Math.max(params.minBiayaLaminasi, rawFin);
    ketFinishing = `Laminasi Glossy 1 Muka (${areaCm2.toLocaleString('id-ID')} cm²)`;
  } else if (input.finishing === 'Laminasi Doff 1 Muka') {
    const rawFin = (spec.panjangTerbukaCm + 1) * (spec.lebarTerbukaCm + 1) * params.tarifLaminasiDoffPerCm2 * oplah;
    biayaFinishingTambahan = Math.max(params.minBiayaLaminasi, rawFin);
    ketFinishing = `Laminasi Doff 1 Muka (${areaCm2.toLocaleString('id-ID')} cm²)`;
  } else if (input.finishing === 'UV Varnish') {
    const rawFin = (spec.panjangTerbukaCm + 1) * (spec.lebarTerbukaCm + 1) * params.tarifUVVarnishPerCm2 * oplah;
    biayaFinishingTambahan = Math.max(params.minBiayaLaminasi, rawFin);
    ketFinishing = `UV Varnish (${areaCm2.toLocaleString('id-ID')} cm²)`;
  }

  // Total HPP
  const totalHpp =
    biayaKertas +
    biayaDesain +
    biayaPlat +
    ongkosCetak +
    biayaTransport +
    biayaPondTotal +
    biayaPacking +
    biayaFinishingTambahan;

  const hppPerPcs = totalHpp / oplah;

  // Pricing
  const marginPct = input.marginPct ?? params.marginDefaultPct;
  const negoDiskonPct = input.negoDiskonPct ?? params.negoDefaultPct;

  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + marginPct / 100)) / 100) * 100;
  const negoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 100) * 100;
  const totalHargaJual = hargaJualPerPcs * oplah;

  // Breakdown
  const rawItems: { komponen: string; keterangan: string; biaya: number }[] = [
    {
      komponen: `Kertas ${input.bahan}`,
      keterangan: `${kebutuhanPlano.toLocaleString('id-ID')} plano @ Rp ${Math.round(hargaPlano).toLocaleString('id-ID')} (${spec.planoYield} box/plano)`,
      biaya: biayaKertas,
    },
    {
      komponen: 'Jasa Desain Packaging',
      keterangan: 'Desain layout & pisau potong custom',
      biaya: biayaDesain,
    },
    {
      komponen: 'Plat Cetak (4 Warna)',
      keterangan: `4 plat @ Rp ${tarifPlat.toLocaleString('id-ID')} (${isSM ? 'SM 52/72' : 'Oliver 58/52'})`,
      biaya: biayaPlat,
    },
    {
      komponen: 'Ongkos Cetak Full Colour',
      keterangan: `${prosesCetak} · ${insirtCetak.toLocaleString('id-ID')} insirt cetak`,
      biaya: ongkosCetak,
    },
    {
      komponen: 'Transport & Ekspedisi Produksi',
      keterangan: 'Transport antar workshop finishing & pond',
      biaya: biayaTransport,
    },
    {
      komponen: 'Finishing Pond (Die Cut / Pisau)',
      keterangan: `Pisau Pond: Rp ${Math.round(biayaPisauPond).toLocaleString('id-ID')} + Ongkos Pond: Rp ${Math.round(biayaOngkosPond).toLocaleString('id-ID')}`,
      biaya: biayaPondTotal,
    },
    {
      komponen: 'Packing Kardus + Lakban',
      keterangan: `${jumlahKardus} kardus @ 100 box + lakban wrapping`,
      biaya: biayaPacking,
    },
  ];

  if (biayaFinishingTambahan > 0) {
    rawItems.push({
      komponen: 'Finishing Tambahan',
      keterangan: ketFinishing,
      biaya: biayaFinishingTambahan,
    });
  }

  const breakdown: PackagingCostItem[] = rawItems.map((item, idx) => ({
    no: idx + 1,
    komponen: item.komponen,
    keterangan: item.keterangan,
    biaya: Math.round(item.biaya),
    porsiPct: totalHpp > 0 ? (item.biaya / totalHpp) * 100 : 0,
  }));

  return {
    hppPerPcs,
    hargaJualPerPcs,
    negoPerPcs,
    totalHargaJual,
    totalHpp,
    prosesCetak,
    kebutuhanPlano,
    insirtCetak,
    biayaKertas,
    biayaDesain,
    biayaPlat,
    ongkosCetak,
    biayaTransport,
    biayaPisauPond,
    biayaOngkosPond,
    biayaPondTotal,
    biayaPacking,
    biayaFinishingTambahan,
    breakdown,
    input,
    variantKey,
    variantSpec: spec,
  };
}

export const PACKAGING_OPLAH_OPTIONS = [
  250, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 4000,
  5000, 10000,
];

export interface PackagingMatrixRow {
  oplah: number;
  proses: string;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
}

export function recalculatePackagingMatrix(
  ukuran: PackagingUkuran,
  bahan: PackagingBahan,
  finishing: PackagingFinishing,
  params: PackagingMasterParams = DEFAULT_PACKAGING_PARAMS,
  oplahs: number[] = PACKAGING_OPLAH_OPTIONS
): PackagingMatrixRow[] {
  return oplahs.map((oplah) => {
    const res = calculatePackaging(
      {
        ukuran,
        bahan,
        oplah,
        finishing,
        marginPct: params.marginDefaultPct,
        negoDiskonPct: params.negoDefaultPct,
      },
      params
    );
    return {
      oplah,
      proses: res.prosesCetak,
      hppPerPcs: res.hppPerPcs,
      hargaJualPerPcs: res.hargaJualPerPcs,
      negoPerPcs: res.negoPerPcs,
      totalHargaJual: res.totalHargaJual,
    };
  });
}
