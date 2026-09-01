// ponytail: kalkulator dan master parameter Sertifikat (12. Pricelist Sertifikat)
// Referensi: Pricelist Sertifikat.xlsx sheets HARGA JULI 2026 (fallback heuristik jika file tidak ditemukan di H:\)
// A4 21×29,7 cm Art Carton 260 / Ivory 260 gsm Full Colour 1/2 Muka, 2 pcs/A3+, finishing Laminasi Glossy/Doff + Foil opsional + Potong + Packing Kardus

export interface SertifikatMasterParams {
  // A. Bahan Kertas Art Carton / Ivory
  tarifKertasArtCartonKg: number; // default 16.400 /kg (Art Carton 260)
  tarifKertasIvoryKg: number; // default 16.500 /kg (Ivory 260 premium)
  upKertasPct: number; // default 5%
  insheetWaste: number; // default 5 lbr insheet A3+

  // B. Desain
  tarifDesign: number; // default 20.000 /order

  // C. Cetak Print Inter (FC) & Oliver (offset untuk oplah besar >500)
  tarifPrintA3: number; // Rp 2.500 / lbr A3+ 1 Muka FC Print Inter
  tarifPlatOliver: number; // Rp 45.000 / plat CTP
  minOliver: number; // Rp 90.000 / plat min 1000 drek
  drekOliver: number; // Rp 40 / drek over

  // D. Laminasi
  tarifLaminasiGlossyCm2: number; // Rp 0.35 / cm²
  tarifLaminasiDoffCm2: number; // Rp 0.40 / cm²
  minLaminasi: number; // Rp 50.000 min order

  // E. Foil (opsional)
  tarifFoilPerPcs: number; // Rp 450 / pcs
  minFoil: number; // Rp 100.000 min order
  tarifMasterFoil: number; // Rp 150.000 master foil per order

  // F. Finishing per pcs / per order
  tarifPotongPerPcs: number; // potong A3+ jadi A4 per pcs
  tarifKardusBox: number; // Rp 8.500 / box
  tarifLakbanRoll: number; // Rp 8.000 / roll

  // G. Margin & nego
  marginDefaultPct: number; // default 30%
  negoDefaultPct: number; // default 4%
}

export const DEFAULT_SERTIFIKAT_PARAMS: SertifikatMasterParams = {
  tarifKertasArtCartonKg: 16400,
  tarifKertasIvoryKg: 16500,
  upKertasPct: 5,
  insheetWaste: 5,
  tarifDesign: 20000,
  tarifPrintA3: 2500,
  tarifPlatOliver: 45000,
  minOliver: 90000,
  drekOliver: 40,
  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  minLaminasi: 50000,
  tarifFoilPerPcs: 450,
  minFoil: 100000,
  tarifMasterFoil: 150000,
  tarifPotongPerPcs: 50,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,
  marginDefaultPct: 30,
  negoDefaultPct: 4,
};

export type SertifikatUkuranType = 'A4 (21 x 29,7 cm)';
export type SertifikatBahanType = 'Art Carton 260' | 'Ivory 260';
export type SertifikatMukaType = '1 Muka' | '2 Muka';
export type SertifikatLaminasiType = 'Tanpa Laminasi' | 'Glossy' | 'Doff';
export type LaminasiType = SertifikatLaminasiType;

export type SertifikatVarianType =
  | 'Art Carton 260 - 1 Muka'
  | 'Art Carton 260 - 2 Muka'
  | 'Ivory 260 - 1 Muka'
  | 'Ivory 260 - 2 Muka';

export const SERTIFIKAT_VARIANTS: SertifikatVarianType[] = [
  'Art Carton 260 - 1 Muka',
  'Art Carton 260 - 2 Muka',
  'Ivory 260 - 1 Muka',
  'Ivory 260 - 2 Muka',
];

export const SERTIFIKAT_LAMINASI_OPTIONS: SertifikatLaminasiType[] = ['Tanpa Laminasi', 'Glossy', 'Doff'];

// ponytail: A4 21×29,7 cm muat 2 per A3+ (33×48) dengan imposisi 2-up, gripper 1 cm; 260 gsm premium
export const SERTIFIKAT_CONFIG: Record<SertifikatVarianType, {
  w: number; h: number;
  pcsPerA3: number;
  gramatur: number;
  bahan: SertifikatBahanType;
  muka: SertifikatMukaType;
  description: string;
}> = {
  'Art Carton 260 - 1 Muka': {
    w: 21, h: 29.7, pcsPerA3: 2, gramatur: 260, bahan: 'Art Carton 260', muka: '1 Muka',
    description: 'A4 21×29,7 cm · Art Carton 260 gsm · 1 Muka Full Colour · 2 pcs/A3+ · Laminasi + Foil opsional',
  },
  'Art Carton 260 - 2 Muka': {
    w: 21, h: 29.7, pcsPerA3: 2, gramatur: 260, bahan: 'Art Carton 260', muka: '2 Muka',
    description: 'A4 21×29,7 cm · Art Carton 260 gsm · 2 Muka Full Colour · 2 pcs/A3+ · Laminasi + Foil opsional',
  },
  'Ivory 260 - 1 Muka': {
    w: 21, h: 29.7, pcsPerA3: 2, gramatur: 260, bahan: 'Ivory 260', muka: '1 Muka',
    description: 'A4 21×29,7 cm · Ivory 260 gsm · 1 Muka Full Colour · 2 pcs/A3+ · Laminasi + Foil opsional',
  },
  'Ivory 260 - 2 Muka': {
    w: 21, h: 29.7, pcsPerA3: 2, gramatur: 260, bahan: 'Ivory 260', muka: '2 Muka',
    description: 'A4 21×29,7 cm · Ivory 260 gsm · 2 Muka Full Colour · 2 pcs/A3+ · Laminasi + Foil opsional',
  },
};

export const SERTIFIKAT_TIERS: number[] = [
  50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000, 7500, 10000,
];

export interface SertifikatSimulatorInput {
  oplah: number;
  varian: SertifikatVarianType;
  laminasi: SertifikatLaminasiType;
  opsiFoil: boolean;
  marginPct: number;
  negoDiskonPct: number;
}

export interface SertifikatBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface SertifikatSimulatorResult {
  input: SertifikatSimulatorInput;
  breakdown: SertifikatBreakdownItem[];
  kebutuhanA3: number;
  totalHpp: number;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  hargaNegoPerPcs: number;
  totalHargaJual: number;
  totalHargaNego: number;
  profitPerPcs: number;
  profitNegoPerPcs: number;
  profitTotal: number;
  profitNegoTotal: number;
  marginPct: number;
  marginNegoPct: number;
}

function beratA3Kg(gramatur: number): number {
  return 0.1584 * gramatur / 1000;
}

export function calculateSertifikatHpp(
  input: SertifikatSimulatorInput,
  rawParams: SertifikatMasterParams = DEFAULT_SERTIFIKAT_PARAMS
): SertifikatSimulatorResult {
  const p: SertifikatMasterParams = { ...DEFAULT_SERTIFIKAT_PARAMS, ...(rawParams || {}) };
  const { oplah, varian, laminasi = 'Tanpa Laminasi', opsiFoil = false, marginPct, negoDiskonPct } = input;
  const validOplah = Math.max(1, oplah);
  const cfg = SERTIFIKAT_CONFIG[varian];

  const breakdown: SertifikatBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // 1. Kebutuhan kertas A3+ & Biaya Kertas Art Carton / Ivory 260 gsm
  const kebutuhanA3Net = Math.ceil(validOplah / cfg.pcsPerA3);
  const kebutuhanA3 = kebutuhanA3Net + p.insheetWaste;
  const beratPerA3 = beratA3Kg(cfg.gramatur);
  const tarifKertasKg = cfg.bahan === 'Ivory 260' ? p.tarifKertasIvoryKg : p.tarifKertasArtCartonKg;
  const hargaPerA3 = beratPerA3 * tarifKertasKg * (1 + p.upKertasPct / 100);
  const biayaKertas = kebutuhanA3 * hargaPerA3;
  add(`Kertas ${cfg.bahan}`, biayaKertas,
    `${kebutuhanA3} lbr A3+ (${kebutuhanA3Net} + ${p.insheetWaste} insheet) × Rp ${Math.round(hargaPerA3).toLocaleString('id-ID')} (+${p.upKertasPct}%)`);

  // 2. Biaya Cetak Full Colour
  const is2Muka = cfg.muka === '2 Muka';
  if (is2Muka) {
    // 2 Muka FC: Print Inter double side (1.8×) untuk ≤500, Oliver untuk >500
    // ponytail: multiplier 1.8 duplex surcharge naive — upgrade ke 2× jika duplex full cost dibuktikan
    if (validOplah <= 500) {
      const tarifEfektif = Math.round(p.tarifPrintA3 * 1.8);
      const biayaPrint = kebutuhanA3 * tarifEfektif;
      add('Cetak Print Inter 2 Muka Full Colour', biayaPrint,
        `${kebutuhanA3} lbr A3+ × Rp ${tarifEfektif.toLocaleString('id-ID')} (1,8× 1 Muka)`);
    } else {
      const totalPlat = 8; // 4 plat × 2 muka
      const biayaPlat = totalPlat * p.tarifPlatOliver;
      add('Plate CTP Oliver (FC 2 Muka)', biayaPlat, `${totalPlat} plat × Rp ${p.tarifPlatOliver.toLocaleString('id-ID')}`);
      const ongkosDasar = p.minOliver * totalPlat;
      const overSheets = Math.max(0, kebutuhanA3 - 1000);
      const biayaOver = overSheets * p.drekOliver * totalPlat;
      const biayaCetakOliver = ongkosDasar + biayaOver;
      const ketOver = overSheets > 0
        ? `Min Rp ${ongkosDasar.toLocaleString('id-ID')} + Over ${overSheets} lbr × Rp ${p.drekOliver}/drek × ${totalPlat} plat`
        : `Min order ${totalPlat} plat × Rp ${p.minOliver.toLocaleString('id-ID')} (≤1000 lbr)`;
      add('Ongkos Cetak Oliver FC 2 Muka', biayaCetakOliver, ketOver);
    }
  } else {
    // 1 Muka FC
    if (validOplah <= 500) {
      const biayaPrint = kebutuhanA3 * p.tarifPrintA3;
      add('Cetak Print Inter 1 Muka Full Colour', biayaPrint,
        `${kebutuhanA3} lbr A3+ × Rp ${p.tarifPrintA3.toLocaleString('id-ID')}`);
    } else {
      const totalPlat = 4;
      const biayaPlat = totalPlat * p.tarifPlatOliver;
      add('Plate CTP Oliver (FC)', biayaPlat, `${totalPlat} plat × Rp ${p.tarifPlatOliver.toLocaleString('id-ID')}`);
      const ongkosDasar = p.minOliver * totalPlat;
      const overSheets = Math.max(0, kebutuhanA3 - 1000);
      const biayaOver = overSheets * p.drekOliver * totalPlat;
      const biayaCetakOliver = ongkosDasar + biayaOver;
      const ketOver = overSheets > 0
        ? `Min Rp ${ongkosDasar.toLocaleString('id-ID')} + Over ${overSheets} lbr × Rp ${p.drekOliver}/drek × ${totalPlat} plat`
        : `Min order ${totalPlat} plat × Rp ${p.minOliver.toLocaleString('id-ID')} (≤1000 lbr)`;
      add('Ongkos Cetak Oliver FC', biayaCetakOliver, ketOver);
    }
  }

  // 3. Desain
  if (p.tarifDesign > 0) {
    add('Desain Artwork Sertifikat', p.tarifDesign, 'Biaya desain & setting sertifikat');
  }

  // 4. Laminasi (opsional)
  if (laminasi !== 'Tanpa Laminasi') {
    const luasPerPcsCm2 = cfg.w * cfg.h;
    const tarifCm2 = laminasi === 'Doff' ? p.tarifLaminasiDoffCm2 : p.tarifLaminasiGlossyCm2;
    const mukaLaminasi = is2Muka ? 2 : 1;
    const biayaLaminasiRaw = luasPerPcsCm2 * tarifCm2 * validOplah * mukaLaminasi;
    const biayaLaminasi = Math.max(p.minLaminasi, biayaLaminasiRaw);
    const ketLam = biayaLaminasiRaw < p.minLaminasi
      ? `Min Laminasi Rp ${p.minLaminasi.toLocaleString('id-ID')} (raw ${luasPerPcsCm2} cm² × ${validOplah} pcs × ${mukaLaminasi} muka × Rp ${tarifCm2})`
      : `${validOplah} pcs × ${luasPerPcsCm2.toFixed(1)} cm² × ${mukaLaminasi} muka × Rp ${tarifCm2}/cm²`;
    add(`Laminasi ${laminasi}${is2Muka ? ' 2 Muka' : ''}`, biayaLaminasi, ketLam);
  }

  // 5. Foil opsional
  if (opsiFoil && p.tarifFoilPerPcs > 0) {
    const rawFoil = validOplah * p.tarifFoilPerPcs;
    const biayaFoilCetak = Math.max(p.minFoil, rawFoil);
    const ketFoil = rawFoil < p.minFoil
      ? `Min Foil Rp ${p.minFoil.toLocaleString('id-ID')} (raw ${validOplah}×${p.tarifFoilPerPcs}=${rawFoil.toLocaleString('id-ID')})`
      : `${validOplah} pcs × Rp ${p.tarifFoilPerPcs.toLocaleString('id-ID')}`;
    add('Hot Foil Emas', biayaFoilCetak, ketFoil);
    if (p.tarifMasterFoil > 0) {
      add('Master Foil (pelat foil)', p.tarifMasterFoil, 'Biaya master/pelat foil per order');
    }
  }

  // 6. Finishing Potong per pcs
  if (p.tarifPotongPerPcs > 0) {
    const biayaPotong = validOplah * p.tarifPotongPerPcs;
    add('Finishing Potong', biayaPotong,
      `${validOplah} pcs × Rp ${p.tarifPotongPerPcs.toLocaleString('id-ID')}`);
  }

  // 7. Packing Kardus + Lakban per order
  {
    const biayaPacking = p.tarifKardusBox + p.tarifLakbanRoll;
    add('Packing Kardus & Lakban', biayaPacking, '1 paket packing order');
  }

  breakdown.forEach(b => { b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0; });

  const hppPerPcs = validOplah > 0 ? totalHpp / validOplah : 0;
  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + marginPct / 100)) / 10) * 10;
  const hargaNegoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 10) * 10;
  const totalHargaJual = Math.round(hargaJualPerPcs * validOplah);
  const totalHargaNego = Math.round(hargaNegoPerPcs * validOplah);
  const profitPerPcs = hargaJualPerPcs - hppPerPcs;
  const profitNegoPerPcs = hargaNegoPerPcs - hppPerPcs;
  const profitTotal = totalHargaJual - totalHpp;
  const profitNegoTotal = totalHargaNego - totalHpp;
  const marginPctActual = hargaJualPerPcs > 0 ? profitPerPcs / hargaJualPerPcs : 0;
  const marginNegoPct = hargaNegoPerPcs > 0 ? profitNegoPerPcs / hargaNegoPerPcs : 0;

  return {
    input,
    breakdown,
    kebutuhanA3,
    totalHpp: Math.round(totalHpp),
    hppPerPcs,
    hargaJualPerPcs,
    hargaNegoPerPcs,
    totalHargaJual,
    totalHargaNego,
    profitPerPcs,
    profitNegoPerPcs,
    profitTotal,
    profitNegoTotal,
    marginPct: marginPctActual,
    marginNegoPct,
  };
}

export type SavedSertifikatSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: SertifikatSimulatorResult;
  paramsSnapshot?: SertifikatMasterParams;
};
