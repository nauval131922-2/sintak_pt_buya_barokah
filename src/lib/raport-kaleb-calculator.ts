// ponytail: kalkulator dan master parameter Raport Kaleb 24x34 (09. Pricelist Raport Kaleb)
// Referensi: Pricelist Raport Kaleb.xlsx sheets Source Buku Tulis (Raport Kaleb Isi 6/Kosongan), HARGA JULI 2026 (Kaleb Foil Emas 24x34 Kosongan 20-1000 + isi +1200/lbr)
export interface RaportKalebMasterParams {
  // A. Bahan Kertas Kaleb Foil Emas
  tarifKertasKalebKg: number; // default 16.400 /kg (Art Carton/Ivory Kaleb)
  upKertasPct: number; // default 5%
  insheetCover: number; // default 5 lbr insheet A3+

  // B. Desain
  tarifDesign: number; // default 20.000 /order

  // C. Cetak Print Inter (digital FC)
  tarifPrintA3: number; // Rp 2.500 / lbr A3+

  // D. Foil Emas
  tarifFoilPerPcs: number; // Rp 450 / pcs penambahan foil (optional)
  minFoil: number; // Rp 100.000 min order foil

  // E. Finishing & Packing
  tarifSisir: number; // sisir/jilid per pcs
  tarifKardus: number; // Rp 8.500 / box
  tarifLakbanRoll: number; // Rp 8.000 / roll

  // F. Isi tambahan
  tarifIsiPerLbr: number; // Rp 1.200 / lbr penambahan isi

  // G. Margin & nego
  marginDefaultPct: number; // default 30%
  negoDefaultPct: number; // default 4%
}

export const DEFAULT_RAPORT_KALEB_PARAMS: RaportKalebMasterParams = {
  tarifKertasKalebKg: 16400,
  upKertasPct: 5,
  insheetCover: 5,
  tarifDesign: 20000,
  tarifPrintA3: 2500,
  tarifFoilPerPcs: 450,
  minFoil: 100000,
  tarifSisir: 150,
  tarifKardus: 8500,
  tarifLakbanRoll: 8000,
  tarifIsiPerLbr: 1200,
  marginDefaultPct: 30,
  negoDefaultPct: 4,
};

export type RaportKalebVarianType = 'Kosongan' | 'Isi 6';
export type RaportKalebUkuranType = '24 x 34 cm';

export const RAPORT_KALEB_VARIANTS: RaportKalebVarianType[] = ['Kosongan', 'Isi 6'];

// ponytail: pcsPerA3 = 1 raport per lembar A3+ (33x48) untuk 24x34 tertutup dengan bleed & gripper; upgrade ke 2-up jika imposisi terbukti muat
export const RAPORT_KALEB_CONFIG: Record<RaportKalebVarianType, {
  w: number; h: number;
  pcsPerA3: number;
  jumlahIsi: number;
  description: string;
}> = {
  'Kosongan': {
    w: 24, h: 34, pcsPerA3: 1, jumlahIsi: 0,
    description: '24 x 34 cm (tertutup) · Bahan Kaleb Foil Emas · Kosongan (tanpa isi) · Packing Kardus',
  },
  'Isi 6': {
    w: 24, h: 34, pcsPerA3: 1, jumlahIsi: 6,
    description: '24 x 34 cm (tertutup) · Bahan Kaleb Foil Emas · Isi 6 lembar (+Rp 1.200/lbr) · Packing Kardus',
  },
};

export const RAPORT_KALEB_TIERS: number[] = [
  10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 250, 300, 350, 400, 450, 500, 1000,
];

export interface RaportKalebSimulatorInput {
  oplah: number;
  varian: RaportKalebVarianType;
  opsiFoil?: boolean; // default true karena bahan Kaleb foil emas, tapi tetap opsional untuk fleksibilitas
  tambahanIsiLbr?: number; // tambahan lembar isi custom di luar varian (0 = sesuai varian)
  marginPct: number;
  negoDiskonPct: number;
}

export interface RaportKalebBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface RaportKalebSimulatorResult {
  input: RaportKalebSimulatorInput;
  breakdown: RaportKalebBreakdownItem[];
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

export function calculateRaportKalebHpp(
  input: RaportKalebSimulatorInput,
  rawParams: RaportKalebMasterParams = DEFAULT_RAPORT_KALEB_PARAMS
): RaportKalebSimulatorResult {
  const p: RaportKalebMasterParams = { ...DEFAULT_RAPORT_KALEB_PARAMS, ...(rawParams || {}) };
  const { oplah, varian, opsiFoil = true, tambahanIsiLbr = 0, marginPct, negoDiskonPct } = input;
  const validOplah = Math.max(1, oplah);
  const cfg = RAPORT_KALEB_CONFIG[varian];

  const breakdown: RaportKalebBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // 1. Kebutuhan kertas A3+ & Biaya Kertas Kaleb Foil Emas (Art Carton/Ivory 230 gsm estimasi)
  const kebutuhanA3Net = Math.ceil(validOplah / cfg.pcsPerA3);
  const kebutuhanA3 = kebutuhanA3Net + p.insheetCover;
  const beratPerA3 = beratA3Kg(230);
  const hargaPerA3 = beratPerA3 * p.tarifKertasKalebKg * (1 + p.upKertasPct / 100);
  const biayaKertas = kebutuhanA3 * hargaPerA3;
  add('Kertas Kaleb Foil Emas', biayaKertas,
    `${kebutuhanA3} lbr A3+ (${kebutuhanA3Net} + ${p.insheetCover} insheet) × Rp ${Math.round(hargaPerA3).toLocaleString('id-ID')} (+${p.upKertasPct}%)`);

  // 2. Cetak Print Inter 1 Muka Full Colour
  const biayaPrint = kebutuhanA3 * p.tarifPrintA3;
  add('Cetak Print Inter 1 Muka Full Colour', biayaPrint,
    `${kebutuhanA3} lbr A3+ × Rp ${p.tarifPrintA3.toLocaleString('id-ID')}`);

  // 3. Desain
  if (p.tarifDesign > 0) {
    add('Desain Artwork Raport Kaleb', p.tarifDesign, 'Biaya desain & setting cover raport');
  }

  // 4. Foil Emas (per pcs + min order) - default ON untuk Kaleb Foil Emas
  if (opsiFoil && p.tarifFoilPerPcs > 0) {
    const rawFoil = validOplah * p.tarifFoilPerPcs;
    const biayaFoil = Math.max(p.minFoil, rawFoil);
    const ketFoil = rawFoil < p.minFoil
      ? `Min Foil Rp ${p.minFoil.toLocaleString('id-ID')} (raw ${validOplah}×${p.tarifFoilPerPcs}=${rawFoil.toLocaleString('id-ID')})`
      : `${validOplah} pcs × Rp ${p.tarifFoilPerPcs.toLocaleString('id-ID')}`;
    add('Hot Foil Emas', biayaFoil, ketFoil);
  }

  // 5. Isi Tambahan (varian Isi 6 = 6 lbr + custom tambahan)
  {
    const baseIsi = cfg.jumlahIsi;
    const totalIsiLbr = baseIsi + Math.max(0, tambahanIsiLbr);
    if (totalIsiLbr > 0 && p.tarifIsiPerLbr > 0) {
      const biayaIsi = validOplah * totalIsiLbr * p.tarifIsiPerLbr;
      const ketIsi = baseIsi > 0 && tambahanIsiLbr > 0
        ? `${validOplah} pcs × (${baseIsi} + ${tambahanIsiLbr} custom) lbr × Rp ${p.tarifIsiPerLbr.toLocaleString('id-ID')}`
        : baseIsi > 0
          ? `${validOplah} pcs × ${baseIsi} lbr × Rp ${p.tarifIsiPerLbr.toLocaleString('id-ID')}`
          : `${validOplah} pcs × ${tambahanIsiLbr} lbr × Rp ${p.tarifIsiPerLbr.toLocaleString('id-ID')} (custom)`;
      add('Isi Tambahan Raport', biayaIsi, ketIsi);
    }
  }

  // 6. Finishing Sisir per pcs
  if (p.tarifSisir > 0) {
    const biayaSisir = validOplah * p.tarifSisir;
    add('Finishing Sisir (jilid)', biayaSisir,
      `${validOplah} pcs × Rp ${p.tarifSisir.toLocaleString('id-ID')}`);
  }

  // 7. Packing Kardus + Lakban per order
  {
    const biayaPacking = p.tarifKardus + p.tarifLakbanRoll;
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

export type SavedRaportKalebSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: RaportKalebSimulatorResult;
  paramsSnapshot?: RaportKalebMasterParams;
};
