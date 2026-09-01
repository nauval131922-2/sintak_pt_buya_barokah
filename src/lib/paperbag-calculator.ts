// ponytail: kalkulator dan master parameter Paperbag / Tas Kertas (29. Pricelist Paperbag)
// Referensi: Pricelist Paperbag.xlsx sheets HARGA JULI 2026 + Source/*.xlsm
// Ukuran:
// 1. 14 x 12 x 9 cm (Kecil / Souvenir) -> Terbuka: 22,5 x 24,5 cm (3 tas / plano)
// 2. 15 x 20 x 10 cm (Sedang / Butik) -> Terbuka: 26,5 x 29,5 cm (3 tas / plano)
// 3. 23 x 30 x 11 cm (Besar / Seminar) -> Terbuka: 35,5 x 38,5 cm (2 tas / plano)
// Bahan: Art Carton 230 gsm | 1 Muka
// Cetak: Full Colour 1 Muka (Oliver 58/52 s/d 2.500 pcs, SM 52/72 >= 3.000 pcs)
// Finishing: Pond Die Cut + Double Tape + Lem Putih + Tali Kur + Lipat Assembly + Packing Kardus
// Finishing Tambahan Opsional: Laminasi Glossy, Laminasi Doff, UV Varnish, Tanpa Laminasi
// Margin default: 30%, Nego default: 5%

export type PaperbagUkuran =
  | '14 x 12 x 9 cm'
  | '15 x 20 x 10 cm'
  | '23 x 30 x 11 cm';

export type PaperbagFinishing =
  | 'Tanpa Laminasi'
  | 'Laminasi Glossy 1 Muka'
  | 'Laminasi Doff 1 Muka'
  | 'UV Varnish';

export interface PaperbagVariantSpec {
  ukuran: PaperbagUkuran;
  namaProduk: string;
  keterangan: string;
  panjangTerbukaCm: number;
  lebarTerbukaCm: number;
  ukuranTerbuka: string;
  planoYieldTas: number; // berapa tas/paperbag dari 1 plano
  planoYieldPotong: number; // berapa potong dari 1 plano (1 tas = 2 potong)
}

export const PAPERBAG_VARIANTS: Record<PaperbagUkuran, PaperbagVariantSpec> = {
  '14 x 12 x 9 cm': {
    ukuran: '14 x 12 x 9 cm',
    namaProduk: 'Paperbag Kecil 14 x 12 x 9 cm',
    keterangan: 'Cocok untuk souvenir, kosmetik, aksesoris, & perhiasan',
    panjangTerbukaCm: 22.5,
    lebarTerbukaCm: 24.5,
    ukuranTerbuka: '22,5 x 24,5 cm (2 pcs/tas)',
    planoYieldTas: 3,
    planoYieldPotong: 6,
  },
  '15 x 20 x 10 cm': {
    ukuran: '15 x 20 x 10 cm',
    namaProduk: 'Paperbag Sedang 15 x 20 x 10 cm',
    keterangan: 'Cocok untuk butik, pakaian, merchandise, & toko retail',
    panjangTerbukaCm: 26.5,
    lebarTerbukaCm: 29.5,
    ukuranTerbuka: '26,5 x 29,5 cm (2 pcs/tas)',
    planoYieldTas: 3,
    planoYieldPotong: 6,
  },
  '23 x 30 x 11 cm': {
    ukuran: '23 x 30 x 11 cm',
    namaProduk: 'Paperbag Besar 23 x 30 x 11 cm',
    keterangan: 'Cocok untuk tas seminar, dokumen A4, seragam, & hampers',
    panjangTerbukaCm: 35.5,
    lebarTerbukaCm: 38.5,
    ukuranTerbuka: '35,5 x 38,5 cm (2 pcs/tas)',
    planoYieldTas: 2,
    planoYieldPotong: 4,
  },
};

export const PAPERBAG_UKURAN_OPTIONS: PaperbagUkuran[] = [
  '14 x 12 x 9 cm',
  '15 x 20 x 10 cm',
  '23 x 30 x 11 cm',
];

export const PAPERBAG_FINISHING_OPTIONS: PaperbagFinishing[] = [
  'Tanpa Laminasi',
  'Laminasi Glossy 1 Muka',
  'Laminasi Doff 1 Muka',
  'UV Varnish',
];

export interface PaperbagMasterParams {
  // 1. Kertas Dasar (Art Carton 230 gsm)
  hargaPlanoAC230: number; // Rp 2.451,80 / plano
  insheetPlanoOliver: number; // 150 lembar
  insheetPlanoSM: number; // 150 lembar

  // 2. Desain & Plat Cetak
  biayaDesain: number; // Rp 25.000 / order
  tarifPlatOliverPerWarna: number; // Rp 45.000 / plat
  tarifPlatSMPerWarna: number; // Rp 78.000 / plat

  // 3. Ongkos Cetak Offset (4 Warna)
  oliverMinOngkosPerWarna: number; // Rp 90.000 (s/d 1.000 drek)
  oliverDrekOverPerWarna: number; // Rp 40 / drek / warna
  smMinOngkosPerWarna: number; // Rp 310.000 (s/d 3.000 drek)
  smDrekOverPerWarna: number; // Rp 100 / drek / warna

  // 4. Finishing Pond & Transport
  biayaTransport: number; // Rp 25.000
  tarifPisauPondMin: number; // Rp 90.000
  tarifPisauPondPerCm2: number; // Rp 149,65 / cm2
  tarifOngkosPondPerPcs: number; // Rp 187,90 / pcs

  // 5. Finishing Assembly Paperbag
  tarifDoubleTapePerPcs: number; // Rp 399 / pcs (material tape)
  tarifTenagaTapePerPcs: number; // Rp 451 / pcs (upah tempel tape)
  tarifTaliKurPerPcs: number; // Rp 320 / pcs (tali kur 2 sisi)
  tarifPasangTaliPerPcs: number; // Rp 113 / pcs (upah pasang tali & mata ayam)
  tarifFinishingLipatPerPcs: number; // Rp 752 / pcs (upah lipat & rakit tas)

  // 6. Packing Kardus & Bungkus
  tarifKardusPerPcs: number; // Rp 450,97 / kardus
  kapasitasKardusPcs: number; // 100 pcs
  tarifLakbanPerRoll: number; // Rp 8.000

  // 7. Finishing Tambahan (Opsional)
  tarifLaminasiGlossyPerCm2: number; // Rp 0,35 / cm2 (min Rp 50.000)
  tarifLaminasiDoffPerCm2: number; // Rp 0,40 / cm2 (min Rp 50.000)
  tarifUVVarnishPerCm2: number; // Rp 0,12 / cm2 (min Rp 50.000)
  minBiayaLaminasi: number; // Rp 50.000

  // 8. Margin & Nego Default
  marginDefaultPct: number; // 30%
  negoDefaultPct: number; // 5%
}

export const DEFAULT_PAPERBAG_PARAMS: PaperbagMasterParams = {
  hargaPlanoAC230: 2451.8,
  insheetPlanoOliver: 150,
  insheetPlanoSM: 150,

  biayaDesain: 25000,
  tarifPlatOliverPerWarna: 45000,
  tarifPlatSMPerWarna: 78000,

  oliverMinOngkosPerWarna: 90000,
  oliverDrekOverPerWarna: 40,
  smMinOngkosPerWarna: 310000,
  smDrekOverPerWarna: 100,

  biayaTransport: 25000,
  tarifPisauPondMin: 90000,
  tarifPisauPondPerCm2: 149.65,
  tarifOngkosPondPerPcs: 187.9056,

  tarifDoubleTapePerPcs: 399,
  tarifTenagaTapePerPcs: 450.9736,
  tarifTaliKurPerPcs: 320,
  tarifPasangTaliPerPcs: 112.7434,
  tarifFinishingLipatPerPcs: 751.6226,

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

export interface PaperbagSimulatorInput {
  ukuran: PaperbagUkuran;
  oplah: number;
  finishing: PaperbagFinishing;
  marginPct: number;
  negoDiskonPct: number;
}

export interface PaperbagCostItem {
  no: number;
  komponen: string;
  keterangan: string;
  biaya: number;
  porsiPct: number;
}

export interface PaperbagSimulatorResult {
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
  biayaDoubleTape: number;
  biayaTaliKur: number;
  biayaFinishingLipat: number;
  biayaPacking: number;
  biayaFinishingTambahan: number;
  breakdown: PaperbagCostItem[];
  input: PaperbagSimulatorInput;
  spec: PaperbagVariantSpec;
}

export function calculatePaperbag(
  input: PaperbagSimulatorInput,
  params: PaperbagMasterParams = DEFAULT_PAPERBAG_PARAMS
): PaperbagSimulatorResult {
  const oplah = Math.max(1, input.oplah);
  const spec = PAPERBAG_VARIANTS[input.ukuran] || PAPERBAG_VARIANTS['14 x 12 x 9 cm'];

  const isSM = oplah >= 3000;
  const prosesCetak = isSM ? 'SM 52 / SM 72 (Heidelberg)' : 'Oliver 58 / 52 (4 Warna)';

  // 1. Kertas (1 tas = 2 potong, plano yield potong)
  const insheet = isSM ? params.insheetPlanoSM : params.insheetPlanoOliver;
  // Rumus plano: (2 * oplah / planoYieldPotong) + (insheet / planoYieldPotong)
  const kebutuhanPlano = Math.ceil(
    (2 * oplah) / spec.planoYieldPotong + insheet / spec.planoYieldPotong
  );
  const biayaKertas = kebutuhanPlano * params.hargaPlanoAC230;

  // 2. Desain
  const biayaDesain = params.biayaDesain;

  // 3. Plat Cetak (4 Warna)
  const tarifPlat = isSM ? params.tarifPlatSMPerWarna : params.tarifPlatOliverPerWarna;
  const biayaPlat = 4 * tarifPlat;

  // 4. Ongkos Cetak (4 Warna)
  const insirtCetak = kebutuhanPlano * spec.planoYieldPotong;
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

  // 6. Pond (Pisau Pond + Ongkos Pond)
  const areaCm2 = spec.panjangTerbukaCm * spec.lebarTerbukaCm;
  const biayaPisauPond = Math.max(
    params.tarifPisauPondMin,
    areaCm2 * params.tarifPisauPondPerCm2
  );
  const biayaOngkosPond = oplah * params.tarifOngkosPondPerPcs;
  const biayaPondTotal = Math.max(
    params.tarifPisauPondMin,
    biayaPisauPond + biayaOngkosPond
  );

  // 7. Double Tape & Lem
  const biayaDoubleTape =
    oplah * (params.tarifDoubleTapePerPcs + params.tarifTenagaTapePerPcs);

  // 8. Tali Kur & Pasang Tali
  const biayaTaliKur =
    oplah * (params.tarifTaliKurPerPcs + params.tarifPasangTaliPerPcs);

  // 9. Finishing Lipat & Assembly
  const biayaFinishingLipat = oplah * params.tarifFinishingLipatPerPcs;

  // 10. Packing (Kardus + Lakban)
  const jumlahKardus = Math.ceil(oplah / params.kapasitasKardusPcs);
  const biayaKardus = jumlahKardus * params.tarifKardusPerPcs;
  const biayaLakban =
    (oplah / params.kapasitasKardusPcs / 63.75) * params.tarifLakbanPerRoll;
  const biayaPacking = biayaKardus + biayaLakban;

  // 11. Finishing Tambahan (Laminasi / UV)
  // Perhatikan: paperbag ada 2 lembar per tas, jadi luas laminasi = 2 * area per lembar
  let biayaFinishingTambahan = 0;
  let ketFinishing = 'Tanpa Laminasi';
  const totalAreaCm2PerTas = 2 * areaCm2;

  if (input.finishing === 'Laminasi Glossy 1 Muka') {
    const rawFin = totalAreaCm2PerTas * params.tarifLaminasiGlossyPerCm2 * oplah;
    biayaFinishingTambahan = Math.max(params.minBiayaLaminasi, rawFin);
    ketFinishing = `Laminasi Glossy 1 Muka (${totalAreaCm2PerTas.toLocaleString('id-ID')} cm²/tas)`;
  } else if (input.finishing === 'Laminasi Doff 1 Muka') {
    const rawFin =
      2 *
      (spec.panjangTerbukaCm + 1) *
      (spec.lebarTerbukaCm + 1) *
      params.tarifLaminasiDoffPerCm2 *
      oplah;
    biayaFinishingTambahan = Math.max(params.minBiayaLaminasi, rawFin);
    ketFinishing = `Laminasi Doff 1 Muka (${totalAreaCm2PerTas.toLocaleString('id-ID')} cm²/tas)`;
  } else if (input.finishing === 'UV Varnish') {
    const rawFin =
      2 *
      (spec.panjangTerbukaCm + 1) *
      (spec.lebarTerbukaCm + 1) *
      params.tarifUVVarnishPerCm2 *
      oplah;
    biayaFinishingTambahan = Math.max(params.minBiayaLaminasi, rawFin);
    ketFinishing = `UV Varnish (${totalAreaCm2PerTas.toLocaleString('id-ID')} cm²/tas)`;
  }

  // Total HPP
  const totalHpp =
    biayaKertas +
    biayaDesain +
    biayaPlat +
    ongkosCetak +
    biayaTransport +
    biayaPondTotal +
    biayaDoubleTape +
    biayaTaliKur +
    biayaFinishingLipat +
    biayaPacking +
    biayaFinishingTambahan;

  const hppPerPcs = totalHpp / oplah;

  // Pricing
  const marginPct = input.marginPct ?? params.marginDefaultPct;
  const negoDiskonPct = input.negoDiskonPct ?? params.negoDefaultPct;

  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + marginPct / 100)) / 100) * 100;
  const negoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 100) * 100;
  const totalHargaJual = hargaJualPerPcs * oplah;

  // Breakdown Table
  const rawItems: { komponen: string; keterangan: string; biaya: number }[] = [
    {
      komponen: 'Bahan Kertas Art Carton 230 gsm',
      keterangan: `${kebutuhanPlano.toLocaleString('id-ID')} plano @ Rp ${Math.round(params.hargaPlanoAC230).toLocaleString('id-ID')} (${spec.planoYieldTas} tas/plano)`,
      biaya: biayaKertas,
    },
    {
      komponen: 'Jasa Desain Paperbag',
      keterangan: 'Desain layout & pisau pond custom',
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
      keterangan: 'Transport antar workshop finishing & rakit',
      biaya: biayaTransport,
    },
    {
      komponen: 'Pond Die Cut (Pisau + Ongkos)',
      keterangan: `Pisau Pond: Rp ${Math.round(biayaPisauPond).toLocaleString('id-ID')} + Ongkos: Rp ${Math.round(biayaOngkosPond).toLocaleString('id-ID')}`,
      biaya: biayaPondTotal,
    },
    {
      komponen: 'Double Tape & Lem Sambung',
      keterangan: `Material Tape + Tenaga Pasang @ Rp ${Math.round(params.tarifDoubleTapePerPcs + params.tarifTenagaTapePerPcs).toLocaleString('id-ID')}/pcs`,
      biaya: biayaDoubleTape,
    },
    {
      komponen: 'Tali Kur & Pasang Tali',
      keterangan: `Tali Kur 2 Sisi + Upah Pasang @ Rp ${Math.round(params.tarifTaliKurPerPcs + params.tarifPasangTaliPerPcs).toLocaleString('id-ID')}/pcs`,
      biaya: biayaTaliKur,
    },
    {
      komponen: 'Finishing Lipat & Assembly Tas',
      keterangan: `Upah rakit & bentuk tas @ Rp ${Math.round(params.tarifFinishingLipatPerPcs).toLocaleString('id-ID')}/pcs`,
      biaya: biayaFinishingLipat,
    },
    {
      komponen: 'Packing Kardus & Lakban',
      keterangan: `${jumlahKardus} kardus @ 100 tas + wrapping`,
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

  const breakdown: PaperbagCostItem[] = rawItems.map((item, idx) => ({
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
    biayaDoubleTape,
    biayaTaliKur,
    biayaFinishingLipat,
    biayaPacking,
    biayaFinishingTambahan,
    breakdown,
    input,
    spec,
  };
}

export const PAPERBAG_OPLAH_OPTIONS = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000,
  4000, 5000, 10000,
];

export interface PaperbagMatrixRow {
  oplah: number;
  proses: string;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
}

export function recalculatePaperbagMatrix(
  ukuran: PaperbagUkuran,
  finishing: PaperbagFinishing,
  params: PaperbagMasterParams = DEFAULT_PAPERBAG_PARAMS,
  oplahs: number[] = PAPERBAG_OPLAH_OPTIONS
): PaperbagMatrixRow[] {
  return oplahs.map((oplah) => {
    const res = calculatePaperbag(
      {
        ukuran,
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
