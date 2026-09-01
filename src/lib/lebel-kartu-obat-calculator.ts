// ponytail: kalkulator dan master parameter Lebel Kartu Obat (16. Pricelist Lebel Kartu Obat)
// Referensi: Pricelist Lebel Kartu Obat.xlsx HARGA JULI 2026 + Source Pricelist LABEL OBAT - 3,5 x 7 cm / 4 x 6 cm / 5 x 6,7 cm.xlsm (Master HVS 70 21.5x33 Folio, insheet 30, desain 10k, plate 10k, minOrder 15k/plat, drek 30, sisir 10k/500)
// Ukuran: 3,5 x 7 / 4 x 6 / 5 x 6,7 cm 1 Warna 1 Muka, Rajang + Packing — heuristik: HVS 70, cetak Ryobi/Oliver mini, finishing sisir/potong

export interface LebelKartuObatMasterParams {
  // A. Bahan Kertas HVS 70 gsm Folio 21.5x33
  tarifKertasKg: number; // default 15700 /kg HVS 70
  upKertasPct: number; // default 5%
  insheet: number; // default 30 lbr

  // B. Desain
  tarifDesain: number; // default 10000 /order

  // C. Plate & Cetak 1 Warna 1 Muka
  tarifPlatePerPlat: number; // Rp 10.000 / plat
  tarifCetakMinPerPlat: number; // Rp 15.000 / plat min 500
  tarifDrek: number; // Rp 30 / drek

  // D. Finishing Sisir/Rajang
  tarifSisirPer500: number; // Rp 10.000 /500 lbr (Q/500*10k)

  // E. Margin & nego
  marginDefaultPct: number; // default 30%
  negoDefaultPct: number; // default 4%
}

export const DEFAULT_LEBEL_KARTU_OBAT_PARAMS: LebelKartuObatMasterParams = {
  tarifKertasKg: 15700,
  upKertasPct: 5,
  insheet: 30,
  tarifDesain: 10000,
  tarifPlatePerPlat: 10000,
  tarifCetakMinPerPlat: 15000,
  tarifDrek: 30,
  tarifSisirPer500: 10000,
  marginDefaultPct: 30,
  negoDefaultPct: 4,
};

export type LebelKartuObatVarianType = '3,5 x 7 cm' | '4 x 6 cm' | '5 x 6,7 cm';

export const LEBEL_KARTU_OBAT_VARIANTS: LebelKartuObatVarianType[] = ['3,5 x 7 cm', '4 x 6 cm', '5 x 6,7 cm'];

// ponytail: potong/plano naive 1 — upgrade ke plano-aware jika presisi dibutuhkan
export const LEBEL_KARTU_OBAT_CONFIG: Record<LebelKartuObatVarianType, {
  w: number; h: number;
  potongPerPlano: number;
  platCount: number;
  kertasWPlanoCm: number;
  kertasHPlanoCm: number;
  gramatur: number;
  description: string;
}> = {
  '3,5 x 7 cm': {
    w: 3.5, h: 7, potongPerPlano: 1, platCount: 1, kertasWPlanoCm: 21.5, kertasHPlanoCm: 33, gramatur: 70,
    description: '3,5 × 7 cm · HVS 70 gsm 1 Warna 1 Muka · Folio 21,5×33 cm · Rajang + Packing',
  },
  '4 x 6 cm': {
    w: 4, h: 6, potongPerPlano: 1, platCount: 1, kertasWPlanoCm: 21.5, kertasHPlanoCm: 33, gramatur: 70,
    description: '4 × 6 cm · HVS 70 gsm 1 Warna 1 Muka · Folio 21,5×33 cm · Rajang + Packing',
  },
  '5 x 6,7 cm': {
    w: 5, h: 6.7, potongPerPlano: 1, platCount: 1, kertasWPlanoCm: 21.5, kertasHPlanoCm: 33, gramatur: 70,
    description: '5 × 6,7 cm · HVS 70 gsm 1 Warna 1 Muka · Folio 21,5×33 cm · Rajang + Packing',
  },
};

export const LEBEL_KARTU_OBAT_TIERS: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
];

export interface LebelKartuObatSimulatorInput {
  oplah: number; // rim (1 rim = 500 lbr)
  varian: LebelKartuObatVarianType;
  marginPct: number;
  negoDiskonPct: number;
}

export interface LebelKartuObatBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface LebelKartuObatSimulatorResult {
  input: LebelKartuObatSimulatorInput;
  breakdown: LebelKartuObatBreakdownItem[];
  kebutuhanPlano: number; // Q lbr plano termasuk insheet
  kebutuhanCetak: number; // P = Q * potong
  totalHpp: number;
  hppPerRim: number;
  hppPerPcs: number;
  hargaJualPerRim: number;
  hargaNegoPerRim: number;
  totalHargaJual: number;
  totalHargaNego: number;
  profitPerRim: number;
  profitNegoPerRim: number;
  profitTotal: number;
  profitNegoTotal: number;
  marginPct: number;
  marginNegoPct: number;
}

export function calculateLebelKartuObatHpp(
  input: LebelKartuObatSimulatorInput,
  rawParams: LebelKartuObatMasterParams = DEFAULT_LEBEL_KARTU_OBAT_PARAMS
): LebelKartuObatSimulatorResult {
  const p: LebelKartuObatMasterParams = { ...DEFAULT_LEBEL_KARTU_OBAT_PARAMS, ...(rawParams || {}) };
  const { oplah, varian, marginPct, negoDiskonPct } = input;
  const validOplah = Math.max(1, Math.round(oplah));
  const cfg = LEBEL_KARTU_OBAT_CONFIG[varian];

  const breakdown: LebelKartuObatBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // 1. Kebutuhan Plano & Biaya Kertas HVS 70 Folio 21.5x33
  // ponytail: insheet 30 naive — upgrade ke insheet table jika presisi dibutuhkan
  const kebutuhanPlano = validOplah * 500 + p.insheet; // Q
  const kebutuhanCetak = kebutuhanPlano * cfg.potongPerPlano; // P
  // Harga per rim Folio: ((W*H)*gramatur)/20000 * tarifKg * (1+up)
  const hargaPerRim = ((cfg.kertasWPlanoCm * cfg.kertasHPlanoCm) * cfg.gramatur) / 20000 * p.tarifKertasKg * (1 + p.upKertasPct / 100);
  const hargaPerLembar = hargaPerRim / 500;
  const biayaKertas = kebutuhanPlano * hargaPerLembar;
  add('Kertas HVS 70 gsm Folio', biayaKertas,
    `${kebutuhanPlano} lbr plano (${validOplah} rim×500 + ${p.insheet} insheet) × Rp ${Math.round(hargaPerLembar).toLocaleString('id-ID')}/lbr (Rp ${Math.round(hargaPerRim).toLocaleString('id-ID')}/rim +${p.upKertasPct}%)`);

  // 2. Desain
  add('Desain', p.tarifDesain,
    `Rp ${p.tarifDesain.toLocaleString('id-ID')} / order`);

  // 3. Plate
  const biayaPlate = cfg.platCount * p.tarifPlatePerPlat;
  add('Plate Cetak', biayaPlate,
    `${cfg.platCount} plat × Rp ${p.tarifPlatePerPlat.toLocaleString('id-ID')}`);

  // 4. Cetak 1 Warna 1 Muka (minOrder + drek over)
  const biayaMin = cfg.platCount * p.tarifCetakMinPerPlat;
  const over = Math.max(0, kebutuhanCetak - 500);
  const biayaOver = over * p.tarifDrek * cfg.platCount;
  const biayaCetak = biayaMin + biayaOver;
  add('Cetak 1 Warna 1 Muka', biayaCetak,
    `${cfg.platCount}×${p.tarifCetakMinPerPlat.toLocaleString('id-ID')}=${biayaMin.toLocaleString('id-ID')} + Over ${over}×${p.tarifDrek}=${biayaOver.toLocaleString('id-ID')} (P=${kebutuhanCetak})`);

  // 5. Finishing Sisir / Rajang Potong
  const biayaSisir = (kebutuhanPlano / 500) * p.tarifSisirPer500;
  add('Sisir / Rajang Potong', biayaSisir,
    `${kebutuhanPlano} lbr /500 × Rp ${p.tarifSisirPer500.toLocaleString('id-ID')}`);

  breakdown.forEach(b => { b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0; });

  const hppPerRim = validOplah > 0 ? totalHpp / validOplah : 0;
  const hppPerPcs = hppPerRim / 500;
  // HARGA JULI 2026: ROUNDUP ke ratusan (-2)
  const hargaJualPerRim = Math.ceil((hppPerRim * (1 + marginPct / 100)) / 100) * 100;
  const hargaNegoPerRim = Math.ceil((hargaJualPerRim * (1 - negoDiskonPct / 100)) / 100) * 100;
  const totalHargaJual = Math.round(hargaJualPerRim * validOplah);
  const totalHargaNego = Math.round(hargaNegoPerRim * validOplah);
  const profitPerRim = hargaJualPerRim - hppPerRim;
  const profitNegoPerRim = hargaNegoPerRim - hppPerRim;
  const profitTotal = totalHargaJual - totalHpp;
  const profitNegoTotal = totalHargaNego - totalHpp;
  const marginPctActual = hargaJualPerRim > 0 ? profitPerRim / hargaJualPerRim : 0;
  const marginNegoPct = hargaNegoPerRim > 0 ? profitNegoPerRim / hargaNegoPerRim : 0;

  return {
    input,
    breakdown,
    kebutuhanPlano,
    kebutuhanCetak,
    totalHpp: Math.round(totalHpp),
    hppPerRim,
    hppPerPcs,
    hargaJualPerRim,
    hargaNegoPerRim,
    totalHargaJual,
    totalHargaNego,
    profitPerRim,
    profitNegoPerRim,
    profitTotal,
    profitNegoTotal,
    marginPct: marginPctActual,
    marginNegoPct,
  };
}

export type SavedLebelKartuObatSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: LebelKartuObatSimulatorResult;
  paramsSnapshot?: LebelKartuObatMasterParams;
};
