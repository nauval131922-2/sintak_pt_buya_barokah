// ponytail: kalkulator dan master parameter Amplop (11. Pricelist Amplop)
// Referensi: Pricelist Amplop.xlsx sheets HARGA JULI 2026 (fallback heuristik jika file tidak ditemukan di H:\)
// Tiga ukuran: Kecil 11x22 cm (DL), Sedang 16x23 cm (C5), Besar 24x35 cm (C4) — HVS 80 gsm 1 Muka 1 Warna, finishing Lipat & Lem + Packing Kardus
// Heuristik: bahan HVS 80 gsm, cetak 1 warna Ryobi/Oliver threshold 500, finishing lipat/lem per pcs

export interface AmplopMasterParams {
  // A. Bahan Kertas HVS
  tarifKertasHvsKg: number; // default 15.700 /kg (HVS 80)
  upKertasPct: number; // default 5%
  insheetWaste: number; // default 5 lbr insheet A3+

  // B. Desain
  tarifDesign: number; // default 20.000 /order

  // C. Cetak Print Inter (FC fallback) & Ryobi (1W)
  tarifPrintA3: number; // Rp 2.500 / lbr A3+ 1 Muka FC Print Inter
  tarifRyobi: number; // Rp 1.900 / lbr A3+ per warna Ryobi 1W

  // D. Cetak Oliver (offset untuk oplah besar >500)
  tarifPlatOliver: number; // Rp 45.000 / plat CTP
  minOliver: number; // Rp 90.000 / plat min 1000 drek
  drekOliver: number; // Rp 40 / drek over

  // E. Finishing per pcs / per order
  tarifLipatLemPerPcs: number; // lipat & lem amplop per pcs
  tarifKardusBox: number; // Rp 8.500 / box
  tarifLakbanRoll: number; // Rp 8.000 / roll

  // F. Margin & nego
  marginDefaultPct: number; // default 30%
  negoDefaultPct: number; // default 4%
}

export const DEFAULT_AMPLOP_PARAMS: AmplopMasterParams = {
  tarifKertasHvsKg: 15700,
  upKertasPct: 5,
  insheetWaste: 5,
  tarifDesign: 20000,
  tarifPrintA3: 2500,
  tarifRyobi: 1900,
  tarifPlatOliver: 45000,
  minOliver: 90000,
  drekOliver: 40,
  tarifLipatLemPerPcs: 75,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,
  marginDefaultPct: 30,
  negoDefaultPct: 4,
};

export type AmplopUkuranType =
  | 'Kecil (11 x 22 cm)'
  | 'Sedang (16 x 23 cm)'
  | 'Besar (24 x 35 cm)';

export const AMPLOP_VARIANTS: AmplopUkuranType[] = [
  'Kecil (11 x 22 cm)',
  'Sedang (16 x 23 cm)',
  'Besar (24 x 35 cm)',
];

// ponytail: pcsPerA3 heuristik DL 4-up, C5 2-up, C4 1-up pada A3+ 33x48 dengan bleed & gripper; upgrade ke imposisi presisi jika die-line terbukti
export const AMPLOP_CONFIG: Record<AmplopUkuranType, {
  w: number; h: number;
  pcsPerA3: number;
  gramatur: number;
  warna: number;
  isFC: boolean;
  description: string;
}> = {
  'Kecil (11 x 22 cm)': {
    w: 11, h: 22, pcsPerA3: 4, gramatur: 80, warna: 1, isFC: false,
    description: '11 × 22 cm (DL) · HVS 80 gsm · 1 Muka 1 Warna · 4 pcs/A3+ · Lipat & Lem + Packing Kardus',
  },
  'Sedang (16 x 23 cm)': {
    w: 16, h: 23, pcsPerA3: 2, gramatur: 80, warna: 1, isFC: false,
    description: '16 × 23 cm (C5) · HVS 80 gsm · 1 Muka 1 Warna · 2 pcs/A3+ · Lipat & Lem + Packing Kardus',
  },
  'Besar (24 x 35 cm)': {
    w: 24, h: 35, pcsPerA3: 1, gramatur: 80, warna: 1, isFC: false,
    description: '24 × 35 cm (C4/B4) · HVS 80 gsm · 1 Muka 1 Warna · 1 pcs/A3+ · Lipat & Lem + Packing Kardus',
  },
};

export const AMPLOP_TIERS: number[] = [
  50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000, 7500, 10000,
];

export interface AmplopSimulatorInput {
  oplah: number;
  varian: AmplopUkuranType;
  marginPct: number;
  negoDiskonPct: number;
}

export interface AmplopBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface AmplopSimulatorResult {
  input: AmplopSimulatorInput;
  breakdown: AmplopBreakdownItem[];
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

export function calculateAmplopHpp(
  input: AmplopSimulatorInput,
  rawParams: AmplopMasterParams = DEFAULT_AMPLOP_PARAMS
): AmplopSimulatorResult {
  const p: AmplopMasterParams = { ...DEFAULT_AMPLOP_PARAMS, ...(rawParams || {}) };
  const { oplah, varian, marginPct, negoDiskonPct } = input;
  const validOplah = Math.max(1, oplah);
  const cfg = AMPLOP_CONFIG[varian];

  const breakdown: AmplopBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // 1. Kebutuhan kertas A3+ & Biaya Kertas HVS 80 gsm
  const kebutuhanA3Net = Math.ceil(validOplah / cfg.pcsPerA3);
  const kebutuhanA3 = kebutuhanA3Net + p.insheetWaste;
  const beratPerA3 = beratA3Kg(cfg.gramatur);
  const hargaPerA3 = beratPerA3 * p.tarifKertasHvsKg * (1 + p.upKertasPct / 100);
  const biayaKertas = kebutuhanA3 * hargaPerA3;
  add(`Kertas HVS ${cfg.gramatur} gsm`, biayaKertas,
    `${kebutuhanA3} lbr A3+ (${kebutuhanA3Net} + ${p.insheetWaste} insheet) × Rp ${Math.round(hargaPerA3).toLocaleString('id-ID')} (+${p.upKertasPct}%)`);

  // 2. Biaya Cetak — 1 Warna: Ryobi untuk ≤500, Oliver untuk >500
  // ponytail: threshold 500, naive — upgrade ke kalkulasi drek dinamis jika presisi Oliver dibutuhkan
  {
    const totalPlat = cfg.warna;
    if (validOplah <= 500) {
      const biayaRyobi = kebutuhanA3 * p.tarifRyobi * totalPlat;
      add('Cetak Ryobi 1 Muka 1 Warna', biayaRyobi,
        `${kebutuhanA3} lbr A3+ × ${totalPlat} plat × Rp ${p.tarifRyobi.toLocaleString('id-ID')}`);
    } else {
      const biayaPlat = totalPlat * p.tarifPlatOliver;
      add('Plate CTP Oliver', biayaPlat, `${totalPlat} plat × Rp ${p.tarifPlatOliver.toLocaleString('id-ID')}`);
      const ongkosDasar = p.minOliver * totalPlat;
      const overSheets = Math.max(0, kebutuhanA3 - 1000);
      const biayaOver = overSheets * p.drekOliver * totalPlat;
      const biayaCetakOliver = ongkosDasar + biayaOver;
      const ketOver = overSheets > 0
        ? `Min Rp ${ongkosDasar.toLocaleString('id-ID')} + Over ${overSheets} lbr × Rp ${p.drekOliver}/drek × ${totalPlat} plat`
        : `Min order ${totalPlat} plat × Rp ${p.minOliver.toLocaleString('id-ID')} (≤1000 lbr)`;
      add('Ongkos Cetak Oliver', biayaCetakOliver, ketOver);
    }
  }

  // 3. Desain
  if (p.tarifDesign > 0) {
    add('Desain Artwork Amplop', p.tarifDesign, 'Biaya desain & setting amplop');
  }

  // 4. Finishing Lipat & Lem per pcs
  if (p.tarifLipatLemPerPcs > 0) {
    const biayaLipatLem = validOplah * p.tarifLipatLemPerPcs;
    add('Finishing Lipat & Lem', biayaLipatLem,
      `${validOplah} pcs × Rp ${p.tarifLipatLemPerPcs.toLocaleString('id-ID')}`);
  }

  // 5. Packing Kardus + Lakban per order
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

export type SavedAmplopSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: AmplopSimulatorResult;
  paramsSnapshot?: AmplopMasterParams;
};
