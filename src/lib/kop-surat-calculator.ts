// ponytail: kalkulator dan master parameter Kop Surat A4 (10. Pricelist Kop Surat)
// Referensi: Pricelist Kop Surat.xlsx sheets HARGA JULI 2026, PRICELIST 2026, Source (fallback heuristik jika file tidak ditemukan di H:\)
// A4 21×29,7 cm HVS 80/100 gsm 1 Muka 1 Warna / Full Colour, 2/lbr A3+, finishing Potong + Packing Kardus

export interface KopSuratMasterParams {
  // A. Bahan Kertas HVS
  tarifKertasHvsKg: number; // default 15.700 /kg (HVS 80/100)
  upKertasPct: number; // default 5%
  insheetWaste: number; // default 5 lbr insheet A3+

  // B. Desain
  tarifDesign: number; // default 20.000 /order

  // C. Cetak Print Inter (FC) & Ryobi (1W)
  tarifPrintA3: number; // Rp 2.500 / lbr A3+ 1 Muka FC Print Inter
  tarifRyobi: number; // Rp 1.900 / lbr A3+ per warna Ryobi 1W

  // D. Cetak Oliver (offset untuk oplah besar >500)
  tarifPlatOliver: number; // Rp 45.000 / plat CTP
  minOliver: number; // Rp 90.000 / plat min 1000 drek
  drekOliver: number; // Rp 40 / drek over

  // E. Finishing per pcs / per order
  tarifPotongPerPcs: number; // potong per pcs
  tarifKardusBox: number; // Rp 8.500 / box
  tarifLakbanRoll: number; // Rp 8.000 / roll

  // F. Margin & nego
  marginDefaultPct: number; // default 30%
  negoDefaultPct: number; // default 4%
}

export const DEFAULT_KOP_SURAT_PARAMS: KopSuratMasterParams = {
  tarifKertasHvsKg: 15700,
  upKertasPct: 5,
  insheetWaste: 5,
  tarifDesign: 20000,
  tarifPrintA3: 2500,
  tarifRyobi: 1900,
  tarifPlatOliver: 45000,
  minOliver: 90000,
  drekOliver: 40,
  tarifPotongPerPcs: 50,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,
  marginDefaultPct: 30,
  negoDefaultPct: 4,
};

export type KopSuratVarianType =
  | 'HVS 80 - 1 Warna'
  | 'HVS 80 - Full Colour'
  | 'HVS 100 - 1 Warna'
  | 'HVS 100 - Full Colour';

export const KOP_SURAT_VARIANTS: KopSuratVarianType[] = [
  'HVS 80 - 1 Warna',
  'HVS 80 - Full Colour',
  'HVS 100 - 1 Warna',
  'HVS 100 - Full Colour',
];

// ponytail: A4 21×29,7 cm muat 2 per A3+ (33×48) dengan imposisi 2-up, gripper 1 cm; fallback 1-up jika bleed tidak muat
export const KOP_SURAT_CONFIG: Record<KopSuratVarianType, {
  w: number; h: number;
  pcsPerA3: number;
  gramatur: number;
  isFC: boolean;
  warna: number;
  description: string;
}> = {
  'HVS 80 - 1 Warna': {
    w: 21, h: 29.7, pcsPerA3: 2, gramatur: 80, isFC: false, warna: 1,
    description: 'A4 21×29,7 cm · HVS 80 gsm · 1 Muka 1 Warna Hitam · 2 pcs/A3+ · Potong + Packing Kardus',
  },
  'HVS 80 - Full Colour': {
    w: 21, h: 29.7, pcsPerA3: 2, gramatur: 80, isFC: true, warna: 4,
    description: 'A4 21×29,7 cm · HVS 80 gsm · 1 Muka Full Colour · 2 pcs/A3+ · Potong + Packing Kardus',
  },
  'HVS 100 - 1 Warna': {
    w: 21, h: 29.7, pcsPerA3: 2, gramatur: 100, isFC: false, warna: 1,
    description: 'A4 21×29,7 cm · HVS 100 gsm · 1 Muka 1 Warna Hitam · 2 pcs/A3+ · Potong + Packing Kardus',
  },
  'HVS 100 - Full Colour': {
    w: 21, h: 29.7, pcsPerA3: 2, gramatur: 100, isFC: true, warna: 4,
    description: 'A4 21×29,7 cm · HVS 100 gsm · 1 Muka Full Colour · 2 pcs/A3+ · Potong + Packing Kardus',
  },
};

export const KOP_SURAT_TIERS: number[] = [
  50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000, 7500, 10000,
];

export interface KopSuratSimulatorInput {
  oplah: number;
  varian: KopSuratVarianType;
  marginPct: number;
  negoDiskonPct: number;
}

export interface KopSuratBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface KopSuratSimulatorResult {
  input: KopSuratSimulatorInput;
  breakdown: KopSuratBreakdownItem[];
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

export function calculateKopSuratHpp(
  input: KopSuratSimulatorInput,
  rawParams: KopSuratMasterParams = DEFAULT_KOP_SURAT_PARAMS
): KopSuratSimulatorResult {
  const p: KopSuratMasterParams = { ...DEFAULT_KOP_SURAT_PARAMS, ...(rawParams || {}) };
  const { oplah, varian, marginPct, negoDiskonPct } = input;
  const validOplah = Math.max(1, oplah);
  const cfg = KOP_SURAT_CONFIG[varian];

  const breakdown: KopSuratBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // 1. Kebutuhan kertas A3+ & Biaya Kertas HVS 80/100 gsm
  const kebutuhanA3Net = Math.ceil(validOplah / cfg.pcsPerA3);
  const kebutuhanA3 = kebutuhanA3Net + p.insheetWaste;
  const beratPerA3 = beratA3Kg(cfg.gramatur);
  const hargaPerA3 = beratPerA3 * p.tarifKertasHvsKg * (1 + p.upKertasPct / 100);
  const biayaKertas = kebutuhanA3 * hargaPerA3;
  add(`Kertas HVS ${cfg.gramatur} gsm`, biayaKertas,
    `${kebutuhanA3} lbr A3+ (${kebutuhanA3Net} + ${p.insheetWaste} insheet) × Rp ${Math.round(hargaPerA3).toLocaleString('id-ID')} (+${p.upKertasPct}%)`);

  // 2. Biaya Cetak
  if (cfg.isFC) {
    // Full Colour: Print Inter untuk oplah kecil-menengah, Oliver untuk >500
    // ponytail: threshold 500, naive – upgrade ke kalkulasi drek dinamis jika presisi Oliver dibutuhkan
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
  } else {
    // 1 Warna: Ryobi untuk ≤500, Oliver untuk >500
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
    add('Desain Artwork Kop Surat', p.tarifDesign, 'Biaya desain & setting kop surat');
  }

  // 4. Finishing Potong per pcs
  if (p.tarifPotongPerPcs > 0) {
    const biayaPotong = validOplah * p.tarifPotongPerPcs;
    add('Finishing Potong', biayaPotong,
      `${validOplah} pcs × Rp ${p.tarifPotongPerPcs.toLocaleString('id-ID')}`);
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

export type SavedKopSuratSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: KopSuratSimulatorResult;
  paramsSnapshot?: KopSuratMasterParams;
};
