// ponytail: kalkulator dan master parameter Poster (19. Pricelist Poster & 21. Pricelist Poster)
// Referensi: Pricelist Poster.xlsx sheets HARGA JULI 2026 + Source/*.xlsm
// Ukuran: 32×48 cm, 48×64 cm, 50×70 cm, 70×100 cm
// Bahan: Art Carton 230 gsm 1 Muka Full Colour (Master!D10 & D11)
// Finishing: Potong / Sisir (BUKU!AL6) + Desain (BUKU!V6) + Transport (BUKU!AK6) (+ Opsi Laminasi Glossy/Doff/UV)
// Alur Proses Mesin Standar:
// - 32×48 cm: Oplah 100–500 (Print Inter A3+), Oplah 600–2.000 (Oliver Offset 4W)
// - 48×64 cm: Oplah 300–3.000 (Oliver Offset 4W), Oplah 3.500–5.000 (Heidelberg SM 52)
// - 50×70 cm: Oplah 1.000–10.000 (Heidelberg SM 52)
// - 70×100 cm: Oplah 1.000–10.000 (Heidelberg SM 72 / SM 102)

export interface PosterMasterParams {
  // A. Kertas & Bahan Dasar (Master!D12)
  tarifArtCarton230Kg: number; // Rp 16.400 / kg
  upKertasPct: number; // 0% (BUKU!Y30)

  // B. Setting & Desain (Master!D17 & D18)
  tarifDesain: number; // Rp 30.000 / order (BUKU!V6)
  tarifPrintA3: number; // Rp 2.500 / lbr A3+ (Master!D18)

  // C. Mesin Oliver (BUKU!Y6, AB6, AC7)
  oliverPlatUnit: number; // Rp 45.000 / plat (BUKU!Y6, 4 plat = Rp 180.000)
  oliverMinOngkos: number; // Rp 90.000 / warna (BUKU!AB6, 4 warna = Rp 360.000 s/d 1.000 tarikan)
  oliverDrekOver: number; // Rp 40 / drek (BUKU!AC7, over 1.000 tarikan)

  // D. Mesin Heidelberg SM (BUKU!Y6, AB6, AC7)
  smPlatUnit: number; // Rp 78.000 / plat (BUKU!Y6, 4 plat = Rp 312.000)
  smMinOngkos: number; // Rp 310.000 / warna (BUKU!AB6, 4 warna = Rp 1.240.000 s/d 3.000 tarikan)
  smDrekOver: number; // Rp 100 / drek (BUKU!AC7, over 3.000 tarikan)

  // E. Finishing & Operasional (BUKU!AK6, AL6)
  tarifTransp: number; // Rp 25.000 / order (BUKU!AK6)
  tarifSisirPer100Plano: number; // Rp 5.000 / 100 lembar plano (BUKU!AL6)

  // F. Finishing Tambahan (BUKU!AN6, AQ6, AT6)
  tarifLaminasiGlossyCm2: number; // Rp 0.35 / cm² (BUKU!AN6)
  tarifLaminasiDoffCm2: number; // Rp 0.40 / cm² (BUKU!AQ6)
  tarifUvVarnishCm2: number; // Rp 0.12 / cm² (BUKU!AT6)
  minLaminasi: number; // Rp 50.000 / order (BUKU!AO27/AR27/AU27 min limit)

  // G. Kemasan Standar (Master!D21, D22)
  tarifKardusBox: number; // Rp 8.500 / box (Master!D22)
  tarifLakbanRoll: number; // Rp 8.000 / roll (Master!D21)

  // H. Margin & Nego Standar (Master!E24)
  marginDefaultPct: number; // 30% (HARGA JULI 2026: ROUNDUP(HPP * 1.30, -2))
  negoDefaultPct: number; // 5% (HARGA JULI 2026: ROUNDUP(Harga * 0.95, -2))
}

export const DEFAULT_POSTER_PARAMS: PosterMasterParams = {
  tarifArtCarton230Kg: 16400,
  upKertasPct: 0,

  tarifDesain: 30000,
  tarifPrintA3: 2500,

  oliverPlatUnit: 45000,
  oliverMinOngkos: 90000,
  oliverDrekOver: 40,

  smPlatUnit: 78000,
  smMinOngkos: 310000,
  smDrekOver: 100,

  tarifTransp: 25000,
  tarifSisirPer100Plano: 5000,

  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  tarifUvVarnishCm2: 0.12,
  minLaminasi: 50000,

  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,

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

export type PosterMesinOption =
  | 'Otomatis'
  | 'Print Inter'
  | 'Oliver'
  | 'SM';

export type PosterFinishingOption =
  | 'Tanpa Laminasi'
  | 'Laminasi Glossy'
  | 'Laminasi Doff'
  | 'UV Varnish';

export const POSTER_TIERS_MAP: Record<PosterUkuran, number[]> = {
  '32 x 48 cm': [100, 200, 300, 400, 500, 600, 700, 1000, 1500, 2000],
  '48 x 64 cm': [300, 400, 500, 600, 700, 800, 1000, 1500, 2000, 3000, 3500, 4000, 4500, 5000],
  '50 x 70 cm': [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000],
  '70 x 100 cm': [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000],
};

export interface PosterSimulatorInput {
  ukuran: PosterUkuran;
  oplah: number;
  mesin?: PosterMesinOption;
  finishing: PosterFinishingOption;
  marginPct?: number;
  negoDiskonPct?: number;
}

export interface PosterSimulatorResult {
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
  totalHpp: number;
  prosesCetak: string;
  mesinTerpilih: 'Print Inter' | 'Oliver' | 'SM';
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

/**
 * Mendapatkan alur proses mesin default berdasarkan ukuran & oplah
 */
export function getProsesCetakPosterDefault(ukuran: PosterUkuran, oplah: number): 'Print Inter' | 'Oliver' | 'SM' {
  if (ukuran === '32 x 48 cm') {
    return oplah <= 500 ? 'Print Inter' : 'Oliver';
  }
  if (ukuran === '48 x 64 cm') {
    return oplah <= 3000 ? 'Oliver' : 'SM';
  }
  // 50 x 70 cm & 70 x 100 cm selalu SM
  return 'SM';
}

export function getProsesCetakPosterLabel(mesin: 'Print Inter' | 'Oliver' | 'SM'): string {
  if (mesin === 'Print Inter') return 'Print Inter A3+';
  if (mesin === 'Oliver') return 'Oliver Offset 4W';
  return 'Heidelberg SM 52/102';
}

/**
 * Dimensi fisik poster terbuka untuk perhitungan laminasi:
 * Luas di Excel dihitung dengan margin potong (D + 1) * (F + 1) (BUKU!AN7/AQ7/AT7)
 */
export function getPosterAreaCm2(ukuran: PosterUkuran): number {
  if (ukuran === '32 x 48 cm') return (32 + 1) * (48 + 1); // 1.617 cm²
  if (ukuran === '48 x 64 cm') return (48 + 1) * (64 + 1); // 3.185 cm²
  if (ukuran === '50 x 70 cm') return (50 + 1) * (70 + 1); // 3.621 cm²
  return (70 + 1) * (100 + 1); // 7.171 cm²
}

/**
 * Kalkulasi lengkap Poster 1:1 sesuai rumus asli Excel Workbook Master
 */
export function calculatePosterSimulator(
  input: PosterSimulatorInput,
  customParams?: Partial<PosterMasterParams>
): PosterSimulatorResult {
  const p: PosterMasterParams = {
    ...DEFAULT_POSTER_PARAMS,
    ...customParams,
  };

  const oplah = Math.max(1, input.oplah);
  const defaultMesin = getProsesCetakPosterDefault(input.ukuran, oplah);
  const mesinTerpilih: 'Print Inter' | 'Oliver' | 'SM' =
    !input.mesin || input.mesin === 'Otomatis' ? defaultMesin : input.mesin;

  const areaCm2 = getPosterAreaCm2(input.ukuran);

  // 1. Biaya Kertas Plano (BUKU!T7)
  let planoPjg = 0;
  let planoLbr = 0;
  let planoPotongO = 1;
  let planoDapatP = 1;
  let insheet = 100;
  let biayaKertas = 0;
  let ketKertas = '';
  let lembarPlanoR = 0;
  let tarikanMesinQ = 0;

  const tarifKertasKg = p.tarifArtCarton230Kg * (1 + (p.upKertasPct || 0) / 100);

  if (input.ukuran === '32 x 48 cm') {
    if (mesinTerpilih === 'Print Inter') {
      // Print Inter A3+ (BUKU!T7 = Q7 * T2)
      // Lembar A3+ (32.5 x 48 cm), O=1, P=1, insheet = 10 lembar (BUKU!K6=10)
      planoPotongO = 1;
      planoDapatP = 1;
      insheet = 10;
      lembarPlanoR = oplah + insheet; // R7 = H7/P7 + K7/O7
      tarikanMesinQ = lembarPlanoR * planoPotongO; // Q7 = R7 * O7 * N7
      biayaKertas = lembarPlanoR * p.tarifPrintA3;
      ketKertas = `Print Inter A3+: ${lembarPlanoR.toLocaleString('id-ID')} lbr × Rp ${p.tarifPrintA3.toLocaleString('id-ID')}`;
    } else {
      // Oliver Offset (Plano 79 x 109 cm, potong 2 mesin, dapat 4 poster)
      planoPjg = 79;
      planoLbr = 109;
      planoPotongO = 2; // BUKU!O7
      planoDapatP = 4; // BUKU!P7
      insheet = 100; // BUKU!K6
      lembarPlanoR = (oplah / planoDapatP) + (insheet / planoPotongO); // BUKU!R7 = H7/4 + 100/2
      tarikanMesinQ = lembarPlanoR * planoPotongO; // BUKU!Q7
      const rimPrice = ((planoPjg * planoLbr * 230) / 20000) * tarifKertasKg; // BUKU!W29
      biayaKertas = (lembarPlanoR / 500) * rimPrice; // BUKU!T7
      ketKertas = `Art Carton 230 gsm (79×109 cm potong 2): ${lembarPlanoR.toFixed(1)} plano (${rimPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}/rim)`;
    }
  } else if (input.ukuran === '48 x 64 cm') {
    if (mesinTerpilih === 'Oliver') {
      // Oliver Offset (Plano 65 x 100 cm, potong 2 mesin, dapat 2 poster)
      planoPjg = 65;
      planoLbr = 100;
      planoPotongO = 2;
      planoDapatP = 2;
      insheet = 100;
      lembarPlanoR = (oplah / planoDapatP) + (insheet / planoPotongO); // H/2 + 50
      tarikanMesinQ = lembarPlanoR * planoPotongO;
      const rimPrice = ((planoPjg * planoLbr * 230) / 20000) * tarifKertasKg;
      biayaKertas = (lembarPlanoR / 500) * rimPrice;
      ketKertas = `Art Carton 230 gsm (65×100 cm potong 2): ${lembarPlanoR.toFixed(1)} plano`;
    } else {
      // Heidelberg SM (Plano 65 x 100 cm utuh, dapat 2 poster, insheet 300)
      planoPjg = 65;
      planoLbr = 100;
      planoPotongO = 1;
      planoDapatP = 2;
      insheet = 300;
      lembarPlanoR = (oplah / planoDapatP) + (insheet / planoPotongO); // H/2 + 300
      tarikanMesinQ = lembarPlanoR * planoPotongO;
      const rimPrice = ((planoPjg * planoLbr * 230) / 20000) * tarifKertasKg;
      biayaKertas = (lembarPlanoR / 500) * rimPrice;
      ketKertas = `Art Carton 230 gsm (65×100 cm utuh): ${lembarPlanoR.toFixed(1)} plano`;
    }
  } else if (input.ukuran === '50 x 70 cm') {
    // Heidelberg SM (Plano 79 x 109 cm, potong 2 mesin, dapat 2 poster, insheet 300)
    planoPjg = 79;
    planoLbr = 109;
    planoPotongO = 2;
    planoDapatP = 2;
    insheet = 300;
    lembarPlanoR = (oplah / planoDapatP) + (insheet / planoPotongO); // H/2 + 150
    tarikanMesinQ = lembarPlanoR * planoPotongO;
    const rimPrice = ((planoPjg * planoLbr * 230) / 20000) * tarifKertasKg;
    biayaKertas = (lembarPlanoR / 500) * rimPrice;
    ketKertas = `Art Carton 230 gsm (79×109 cm potong 2): ${lembarPlanoR.toFixed(1)} plano`;
  } else {
    // 70 x 100 cm (Heidelberg SM utuh 79 x 109 cm, dapat 1 poster, insheet 300)
    planoPjg = 79;
    planoLbr = 109;
    planoPotongO = 1;
    planoDapatP = 1;
    insheet = 300;
    lembarPlanoR = (oplah / planoDapatP) + (insheet / planoPotongO); // H/1 + 300
    tarikanMesinQ = lembarPlanoR * planoPotongO;
    const rimPrice = ((planoPjg * planoLbr * 230) / 20000) * tarifKertasKg;
    biayaKertas = (lembarPlanoR / 500) * rimPrice;
    ketKertas = `Art Carton 230 gsm (79×109 cm utuh): ${lembarPlanoR.toFixed(1)} plano`;
  }

  // 2. Setting Desain (BUKU!V7 = V6)
  const biayaDesain = p.tarifDesain;

  // 3. Plat Cetak (BUKU!Y7 = Y6 * Z7)
  let biayaPlat = 0;
  let ketPlat = 'Digital (Tanpa Plat)';
  if (mesinTerpilih === 'Oliver') {
    biayaPlat = 4 * p.oliverPlatUnit; // 4 plat
    ketPlat = `4 Plat Oliver @ Rp ${p.oliverPlatUnit.toLocaleString('id-ID')}`;
  } else if (mesinTerpilih === 'SM') {
    biayaPlat = 4 * p.smPlatUnit; // 4 plat
    ketPlat = `4 Plat Heidelberg SM @ Rp ${p.smPlatUnit.toLocaleString('id-ID')}`;
  }

  // 4. Ongkos Cetak (BUKU!AG7 = AD7 + AF7)
  let biayaCetak = 0;
  let ketCetak = 'Termasuk di biaya print digital';
  if (mesinTerpilih === 'Oliver') {
    const minCetak = 4 * p.oliverMinOngkos; // BUKU!AD7 (4 warna min Rp 90.000)
    const overDrek = Math.max(0, tarikanMesinQ - 1000); // BUKU!AE7
    const cetakOver = overDrek > 0 ? overDrek * p.oliverDrekOver * 4 : 0; // BUKU!AF7
    biayaCetak = minCetak + cetakOver;
    ketCetak = overDrek > 0
      ? `Oliver Min Rp ${minCetak.toLocaleString('id-ID')} + ${overDrek} drek over (Rp ${cetakOver.toLocaleString('id-ID')})`
      : `Oliver Min Order Cetak 4 Warna (Rp ${minCetak.toLocaleString('id-ID')})`;
  } else if (mesinTerpilih === 'SM') {
    const minCetak = 4 * p.smMinOngkos; // BUKU!AD7 (4 warna min Rp 310.000)
    const overDrek = Math.max(0, tarikanMesinQ - 3000); // BUKU!AE7
    const cetakOver = overDrek > 0 ? overDrek * p.smDrekOver * 4 : 0; // BUKU!AF7
    biayaCetak = minCetak + cetakOver;
    ketCetak = overDrek > 0
      ? `SM Min Rp ${minCetak.toLocaleString('id-ID')} + ${overDrek} drek over (Rp ${cetakOver.toLocaleString('id-ID')})`
      : `SM Min Order Cetak 4 Warna (Rp ${minCetak.toLocaleString('id-ID')})`;
  }

  // 5. Biaya Transport (BUKU!AK7 = AK6)
  const biayaTransp = p.tarifTransp;

  // 6. Upah Potong / Sisir (BUKU!AL7 = AL6 * (R7 / 100))
  const biayaSisir = (lembarPlanoR / 100) * p.tarifSisirPer100Plano;

  // 7. Finishing Tambahan (Laminasi / UV) (BUKU!AO7/AR7/AU7)
  let biayaLaminasi = 0;
  let ketLaminasi = 'Tanpa Laminasi';
  if (input.finishing === 'Laminasi Glossy') {
    const raw = areaCm2 * p.tarifLaminasiGlossyCm2 * oplah;
    biayaLaminasi = Math.max(p.minLaminasi, raw);
    ketLaminasi = `Laminasi Glossy (${areaCm2} cm² × Rp ${p.tarifLaminasiGlossyCm2}/cm²)`;
  } else if (input.finishing === 'Laminasi Doff') {
    const raw = areaCm2 * p.tarifLaminasiDoffCm2 * oplah;
    biayaLaminasi = Math.max(p.minLaminasi, raw);
    ketLaminasi = `Laminasi Doff (${areaCm2} cm² × Rp ${p.tarifLaminasiDoffCm2}/cm²)`;
  } else if (input.finishing === 'UV Varnish') {
    const raw = areaCm2 * p.tarifUvVarnishCm2 * oplah;
    biayaLaminasi = Math.max(p.minLaminasi, raw);
    ketLaminasi = `UV Varnish (${areaCm2} cm² × Rp ${p.tarifUvVarnishCm2}/cm²)`;
  }

  // 8. Total HPP & HPP Per Pcs (BUKU!BF7 & BG7)
  const totalHpp =
    biayaKertas +
    biayaDesain +
    biayaPlat +
    biayaCetak +
    biayaTransp +
    biayaSisir +
    biayaLaminasi;

  const hppPerPcs = totalHpp / oplah;

  // 9. Margin & Harga Jual (Sheet HARGA JULI 2026: ROUNDUP(HPP * 1.30, -2))
  const marginPct = input.marginPct !== undefined ? input.marginPct : p.marginDefaultPct;
  const negoDiskonPct = input.negoDiskonPct !== undefined ? input.negoDiskonPct : p.negoDefaultPct;

  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + marginPct / 100)) / 100) * 100;
  const negoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 100) * 100;
  const totalHargaJual = hargaJualPerPcs * oplah;

  const prosesCetak = `${input.ukuran} • ${getProsesCetakPosterLabel(mesinTerpilih)}`;

  // Breakdown Transparan
  const rawBreakdown = [
    {
      komponen: 'Kertas Plano',
      keterangan: ketKertas,
      biaya: Math.round(biayaKertas),
    },
    {
      komponen: 'Setting Desain',
      keterangan: `Rp ${biayaDesain.toLocaleString('id-ID')} per pesanan`,
      biaya: Math.round(biayaDesain),
    },
    {
      komponen: 'Plat Cetak',
      keterangan: ketPlat,
      biaya: Math.round(biayaPlat),
    },
    {
      komponen: 'Ongkos Cetak',
      keterangan: ketCetak,
      biaya: Math.round(biayaCetak),
    },
    {
      komponen: 'Biaya Transport',
      keterangan: `Rp ${biayaTransp.toLocaleString('id-ID')} per order`,
      biaya: Math.round(biayaTransp),
    },
    {
      komponen: 'Potong & Sisir',
      keterangan: `${lembarPlanoR.toFixed(1)} plano @ Rp ${p.tarifSisirPer100Plano.toLocaleString('id-ID')}/100 plano`,
      biaya: Math.round(biayaSisir),
    },
  ];

  if (biayaLaminasi > 0) {
    rawBreakdown.push({
      komponen: 'Finishing Laminasi',
      keterangan: ketLaminasi,
      biaya: Math.round(biayaLaminasi),
    });
  }

  const breakdown = rawBreakdown.map((item, idx) => ({
    no: idx + 1,
    komponen: item.komponen,
    keterangan: item.keterangan,
    biaya: item.biaya,
    porsiPct: totalHpp > 0 ? (item.biaya / totalHpp) * 100 : 0,
  }));

  return {
    hppPerPcs,
    hargaJualPerPcs,
    negoPerPcs,
    totalHargaJual,
    totalHpp,
    prosesCetak,
    mesinTerpilih,
    areaCm2,
    input,
    breakdown,
  };
}

export interface PosterMatrixItem {
  ukuran: PosterUkuran;
  oplah: number;
  prosesCetak: string;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
}

/**
 * Matriks harga instan untuk 4 ukuran across tier oplah
 */
export function recalculatePosterMatrix(
  customParams: PosterMasterParams,
  finishing: PosterFinishingOption = 'Tanpa Laminasi',
  marginPct: number = 30,
  negoPct: number = 5
): PosterMatrixItem[] {
  const result: PosterMatrixItem[] = [];

  for (const ukuran of POSTER_UKURAN_OPTIONS) {
    const tiers = POSTER_TIERS_MAP[ukuran];
    for (const oplah of tiers) {
      const calc = calculatePosterSimulator(
        {
          ukuran,
          oplah,
          finishing,
          marginPct,
          negoDiskonPct: negoPct,
        },
        customParams
      );

      result.push({
        ukuran,
        oplah,
        prosesCetak: getProsesCetakPosterLabel(calc.mesinTerpilih),
        hppPerPcs: calc.hppPerPcs,
        hargaJualPerPcs: calc.hargaJualPerPcs,
        negoPerPcs: calc.negoPerPcs,
        totalHargaJual: calc.totalHargaJual,
      });
    }
  }

  return result;
}
