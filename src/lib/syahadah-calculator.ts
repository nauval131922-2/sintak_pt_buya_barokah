// ponytail: kalkulator dan master parameter Syahadah 21,5x33 (08. Pricelist Syahadah)
// Referensi: Pricelist Syahadah Juli 2026 sheets Source & HARGA JULI 2026 (Linen/Hammer Crem Tebal 260 gsm 21,5x33, 1/2 Muka FC/1W/2W, Sisir+Packing, foil opsional +450/pcs min 100k)
// Ukuran fisik tunggal 21,5x33 cm, varian 6: 1M-FC, 1M-1W, 1M-2W, 2M-FC, 2M-1W, 2M-2W. Finishing Sisir per pcs + Packing kardus/lakban per order.

export interface SyahadahMasterParams {
  // A. Bahan Kertas Linen/Hammer Crem Tebal (Art Carton 260 gsm Linen)
  tarifKertasLinenKg: number; // Master!E12 default 16.500 /kg (premium Linen)
  upKertasPct: number; // default 5%
  insheetWaste: number; // default 5 lbr insheet A3+

  // B. Desain
  tarifDesign: number; // Master!D17 default 20.000 /order

  // C. Cetak Print Inter (FC) & Ryobi (1W/2W small)
  tarifPrintA3: number; // Rp 2.500 / lbr A3+ 1 Muka FC Print Inter
  tarifRyobi: number; // Rp 1.900 / lbr A3+ per warna (Ryobi 1W/2W)

  // D. Cetak Oliver (offset, untuk oplah besar)
  tarifPlatOliver: number; // Rp 45.000 / plat CTP
  minOliver: number; // Rp 90.000 / plat min 1000 drek
  drekOliver: number; // Rp 40 / drek over

  // E. Foil (opsional)
  tarifFoilPerPcs: number; // Rp 450 / pcs penambahan foil
  minFoil: number; // Rp 100.000 min order foil
  tarifMasterFoil: number; // Rp 150.000 master foil (belum termasuk di min)

  // F. Finishing per pcs / per order
  tarifSisirPerPcs: number; // sisir kawat/plastik
  tarifKardusBox: number; // Rp 8.500 / box
  tarifLakbanRoll: number; // Rp 8.000 / roll

  // G. Margin & nego
  marginDefaultPct: number; // default 30%
  negoDefaultPct: number; // default 4%
}

export const DEFAULT_SYAHADAH_PARAMS: SyahadahMasterParams = {
  tarifKertasLinenKg: 16500,
  upKertasPct: 5,
  insheetWaste: 5,
  tarifDesign: 20000,
  tarifPrintA3: 2500,
  tarifRyobi: 1900,
  tarifPlatOliver: 45000,
  minOliver: 90000,
  drekOliver: 40,
  tarifFoilPerPcs: 450,
  minFoil: 100000,
  tarifMasterFoil: 150000,
  tarifSisirPerPcs: 150,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,
  marginDefaultPct: 30,
  negoDefaultPct: 4,
};

export type SyahadahUkuranType = '21,5 x 33 cm';
export type SyahadahVarianType =
  | '1 Muka FC'
  | '1 Muka 1 Warna'
  | '1 Muka 2 Warna'
  | '2 Muka FC'
  | '2 Muka 1 Warna'
  | '2 Muka 2 Warna';

export const SYAHADAH_VARIANTS: SyahadahVarianType[] = [
  '1 Muka FC',
  '1 Muka 1 Warna',
  '1 Muka 2 Warna',
  '2 Muka 1 Warna',
  '2 Muka 2 Warna',
  '2 Muka FC',
];

// ponytail: pcsPerA3 = 1 sertifikat per lembar A3+ (33x48) untuk Linen 21,5x33 dengan bleed & gripper; upgrade ke 2/A3+ jika imposisi 2-up terbukti muat
export const SYAHADAH_CONFIG: Record<SyahadahVarianType, {
  w: number; h: number;
  pcsPerA3: number;
  muka: 1 | 2;
  warna: number; // 4 untuk FC, 1/2 untuk warna spot
  isFC: boolean;
  description: string;
}> = {
  '1 Muka FC': {
    w: 21.5, h: 33, pcsPerA3: 1, muka: 1, warna: 4, isFC: true,
    description: '21,5 x 33 cm · Linen/Hammer Crem Tebal 260 gsm · 1 Muka Full Colour · Tanpa Foil',
  },
  '1 Muka 1 Warna': {
    w: 21.5, h: 33, pcsPerA3: 1, muka: 1, warna: 1, isFC: false,
    description: '21,5 x 33 cm · Linen/Hammer Crem Tebal 260 gsm · 1 Muka 1 Warna Hitam · Ryobi/Oliver',
  },
  '1 Muka 2 Warna': {
    w: 21.5, h: 33, pcsPerA3: 1, muka: 1, warna: 2, isFC: false,
    description: '21,5 x 33 cm · Linen/Hammer Crem Tebal 260 gsm · 1 Muka 2 Warna · Ryobi/Oliver',
  },
  '2 Muka 1 Warna': {
    w: 21.5, h: 33, pcsPerA3: 1, muka: 2, warna: 1, isFC: false,
    description: '21,5 x 33 cm · Linen/Hammer Crem Tebal 260 gsm · 2 Muka 1 Warna · Ryobi/Oliver',
  },
  '2 Muka 2 Warna': {
    w: 21.5, h: 33, pcsPerA3: 1, muka: 2, warna: 2, isFC: false,
    description: '21,5 x 33 cm · Linen/Hammer Crem Tebal 260 gsm · 2 Muka 2 Warna · Ryobi/Oliver',
  },
  '2 Muka FC': {
    w: 21.5, h: 33, pcsPerA3: 1, muka: 2, warna: 4, isFC: true,
    description: '21,5 x 33 cm · Linen/Hammer Crem Tebal 260 gsm · 2 Muka Full Colour · Tanpa Foil',
  },
};

export const SYAHADAH_TIERS: number[] = [
  20, 30, 40, 50, 75, 100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1500, 2000, 2500, 3000,
];

export interface SyahadahSimulatorInput {
  oplah: number;
  varian: SyahadahVarianType;
  opsiFoil: boolean;
  marginPct: number;
  negoDiskonPct: number;
}

export interface SyahadahBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface SyahadahSimulatorResult {
  input: SyahadahSimulatorInput;
  breakdown: SyahadahBreakdownItem[];
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
  // A3+ 33 x 48 cm = 0.1584 m2
  return 0.1584 * gramatur / 1000;
}

export function calculateSyahadahHpp(
  input: SyahadahSimulatorInput,
  rawParams: SyahadahMasterParams = DEFAULT_SYAHADAH_PARAMS
): SyahadahSimulatorResult {
  const p: SyahadahMasterParams = { ...DEFAULT_SYAHADAH_PARAMS, ...(rawParams || {}) };
  const { oplah, varian, opsiFoil = false, marginPct, negoDiskonPct } = input;
  const validOplah = Math.max(1, oplah);
  const cfg = SYAHADAH_CONFIG[varian];

  const breakdown: SyahadahBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // 1. Kebutuhan kertas A3+ & Biaya Kertas Linen/Hammer 260 gsm
  const kebutuhanA3Net = Math.ceil(validOplah / cfg.pcsPerA3);
  const kebutuhanA3 = kebutuhanA3Net + p.insheetWaste;
  const beratPerA3 = beratA3Kg(260);
  const hargaPerA3 = beratPerA3 * p.tarifKertasLinenKg * (1 + p.upKertasPct / 100);
  const biayaKertas = kebutuhanA3 * hargaPerA3;
  add('Kertas Linen/Hammer Crem Tebal 260 gsm', biayaKertas,
    `${kebutuhanA3} lbr A3+ (${kebutuhanA3Net} + ${p.insheetWaste} insheet) × Rp ${Math.round(hargaPerA3).toLocaleString('id-ID')} (+${p.upKertasPct}%)`);

  // 2. Biaya Cetak
  if (cfg.isFC) {
    // FC: Print Inter digital Full Colour per muka
    // ponytail: 2 Muka = 1.8× tarif 1 Muka (duplex surcharge), upgrade ke 2× jika duplex full cost dibuktikan
    const tarifEfektif = cfg.muka === 2 ? Math.round(p.tarifPrintA3 * 1.8) : p.tarifPrintA3;
    const biayaPrint = kebutuhanA3 * tarifEfektif;
    add(cfg.muka === 2 ? 'Cetak Print Inter 2 Muka Full Colour' : 'Cetak Print Inter 1 Muka Full Colour', biayaPrint,
      `${kebutuhanA3} lbr A3+ × Rp ${tarifEfektif.toLocaleString('id-ID')}${cfg.muka === 2 ? ' (1,8× 1 Muka)' : ''}`);
  } else {
    // 1W/2W: Ryobi untuk oplah kecil-menengah, Oliver untuk oplah besar (>500)
    // ponytail: threshold 500, O(n) naive – ganti ke kalkulasi drek dinamis jika butuh presisi Oliver
    const totalPlat = cfg.warna * cfg.muka;
    if (validOplah <= 500) {
      const biayaRyobi = kebutuhanA3 * p.tarifRyobi * totalPlat;
      const label = `${cfg.muka} Muka ${cfg.warna} Warna (Ryobi)`;
      add(`Cetak Ryobi ${label}`, biayaRyobi,
        `${kebutuhanA3} lbr A3+ × ${totalPlat} plat/warna × Rp ${p.tarifRyobi.toLocaleString('id-ID')}`);
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
    add('Desain Artwork Syahadah', p.tarifDesign, 'Biaya desain & setting sertifikat');
  }

  // 4. Foil opsional (emas) – penambahan per pcs + min order + master foil
  if (opsiFoil) {
    const rawFoil = validOplah * p.tarifFoilPerPcs;
    const biayaFoilCetak = Math.max(p.minFoil, rawFoil);
    const ketFoil = rawFoil < p.minFoil
      ? `Min Foil Rp ${p.minFoil.toLocaleString('id-ID')} (raw ${validOplah}×${p.tarifFoilPerPcs}=${rawFoil.toLocaleString('id-ID')}) + Master Foil belum termasuk`
      : `${validOplah} pcs × Rp ${p.tarifFoilPerPcs.toLocaleString('id-ID')} + Master Foil belum termasuk`;
    add('Hot Foil Emas', biayaFoilCetak, ketFoil);
    // Master foil dicatat sebagai komponen terpisah agar transparan (opsional, sesuai catatan HARGA JULI 2026)
    // ponytail: master foil fixed per order, upgrade ke per varian jika ada master berbeda per warna foil
    if (p.tarifMasterFoil > 0) {
      add('Master Foil (pelat foil)', p.tarifMasterFoil, 'Biaya master/pelat foil per order (belum termasuk di min foil)');
    }
  }

  // 5. Finishing Sisir per pcs
  if (p.tarifSisirPerPcs > 0) {
    const biayaSisir = validOplah * p.tarifSisirPerPcs;
    add('Finishing Sisir (jilid tepi)', biayaSisir,
      `${validOplah} pcs × Rp ${p.tarifSisirPerPcs.toLocaleString('id-ID')}`);
  }

  // 6. Packing Kardus + Lakban per order
  {
    const biayaPacking = p.tarifKardusBox + p.tarifLakbanRoll;
    add('Packing Kardus & Lakban', biayaPacking, '1 paket packing order');
  }

  // Hitung pct
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

export type SavedSyahadahSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: SyahadahSimulatorResult;
  paramsSnapshot?: SyahadahMasterParams;
};
