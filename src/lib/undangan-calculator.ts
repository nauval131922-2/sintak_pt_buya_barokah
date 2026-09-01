// ponytail: kalkulator dan master parameter Undangan (13. Pricelist Undangan)
// Referensi: Pricelist Undangan.xlsx sheets HARGA JULI 2026 (2 ukuran) + Source file Harga UNDANGAN 15 x 17 / 15,5 x 15,5 cm (Print Inter 4500/A3+ insheet 7 & Oliver insheet 150, AC 230 gsm 16400/kg +5%)
// Ukuran: 15,5 x 15,5 cm (15,5 x 30 terbuka, 3 pcs/A3+) & 15 x 17 cm (17 x 30 terbuka, 2 pcs/A3+) — Art Carton 230 gsm 2 Muka Full Colour, finishing Sisir + Plastik OPP + Label + Packing Kardus

export interface UndanganMasterParams {
  // A. Bahan Kertas Art Carton
  tarifKertasAc230Kg: number; // default 16.400 /kg (Art Carton 230 gsm)
  upKertasPct: number; // default 5%
  insheetWaste: number; // default 7 lbr insheet A3+ (Print Inter); Oliver 150 di Source tapi disederhanakan jadi 7 untuk ponytail single param

  // B. Desain
  tarifDesign: number; // default 20.000 /order

  // C. Cetak Print Inter (FC 4500) & Oliver (offset untuk oplah besar >500)
  tarifPrintA3: number; // Rp 4.500 / lbr A3+ Print Inter undangan (beda dari global 2500 — disinkron bisa overide)
  tarifPlatOliver: number; // Rp 45.000 / plat CTP
  minOliver: number; // Rp 90.000 / plat min 1000 drek
  drekOliver: number; // Rp 40 / drek over

  // D. Laminasi (opsional, per cm2)
  tarifLaminasiGlossyCm2: number; // Rp 0.35 / cm2
  tarifLaminasiDoffCm2: number; // Rp 0.40 / cm2
  minLaminasi: number; // Rp 50.000 min order laminasi

  // E. Finishing per pcs / per order
  tarifSisirPerPcs: number; // sisir per pcs (Excel: 7000 min /500 = ~14/pcs, disederhanakan 150? pakai 150 sinkron global)
  tarifPlastikOppPerPcs: number; // plastik OPP pasang sendiri per pcs (Excel ~120/pcs, disederhanakan 92 global? pakai 120)
  tarifLabelPerPcs: number; // label undangan per pcs (Excel 5000/84≈60/pcs, pakai 60)
  tarifKardusBox: number; // Rp 8.000 / box (Master D24)
  tarifLakbanRoll: number; // Rp 9.200 / roll (Master D21) — sinkron global 8000

  // F. Margin & nego
  marginDefaultPct: number; // default 30%
  negoDefaultPct: number; // default 4%
}

export const DEFAULT_UNDANGAN_PARAMS: UndanganMasterParams = {
  tarifKertasAc230Kg: 16400,
  upKertasPct: 5,
  insheetWaste: 7,
  tarifDesign: 20000,
  tarifPrintA3: 4500,
  tarifPlatOliver: 45000,
  minOliver: 90000,
  drekOliver: 40,
  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  minLaminasi: 50000,
  tarifSisirPerPcs: 150,
  tarifPlastikOppPerPcs: 120,
  tarifLabelPerPcs: 60,
  tarifKardusBox: 8000,
  tarifLakbanRoll: 9200,
  marginDefaultPct: 30,
  negoDefaultPct: 4,
};

export type UndanganVarianType =
  | '15,5 x 15,5 cm - 1 Muka'
  | '15,5 x 15,5 cm - 2 Muka'
  | '15 x 17 cm - 1 Muka'
  | '15 x 17 cm - 2 Muka';

export const UNDANGAN_VARIANTS: UndanganVarianType[] = [
  '15,5 x 15,5 cm - 1 Muka',
  '15,5 x 15,5 cm - 2 Muka',
  '15 x 17 cm - 1 Muka',
  '15 x 17 cm - 2 Muka',
];

export type UndanganLaminasiType = 'Tanpa Laminasi' | 'Glossy' | 'Doff';

export const UNDANGAN_LAMINASI_OPTIONS: UndanganLaminasiType[] = ['Tanpa Laminasi', 'Glossy', 'Doff'];

// ponytail: pcsPerA3 heuristik Print Inter: 15,5=3/A3+ (32x48) , 15x17=2/A3+ ; Oliver 12/A3+ pada plano 79x109 tapi disederhanakan pakai pcsPerA3 Print Inter untuk kertas kalkulasi naive — upgrade ke plano-aware jika butuh presisi Oliver
export const UNDANGAN_CONFIG: Record<UndanganVarianType, {
  w: number; h: number;
  wOpen: number; hOpen: number;
  pcsPerA3: number;
  gramatur: number;
  muka: 1 | 2;
  description: string;
}> = {
  '15,5 x 15,5 cm - 1 Muka': {
    w: 15.5, h: 15.5, wOpen: 15.5, hOpen: 31, pcsPerA3: 3, gramatur: 230, muka: 1,
    description: '15,5 × 15,5 cm (15,5 × 30 terbuka) · Art Carton 230 gsm · 1 Muka Full Colour · 3 pcs/A3+ · Sisir + Plastik OPP + Label',
  },
  '15,5 x 15,5 cm - 2 Muka': {
    w: 15.5, h: 15.5, wOpen: 15.5, hOpen: 31, pcsPerA3: 3, gramatur: 230, muka: 2,
    description: '15,5 × 15,5 cm (15,5 × 30 terbuka) · Art Carton 230 gsm · 2 Muka Full Colour · 3 pcs/A3+ · Sisir + Plastik OPP + Label',
  },
  '15 x 17 cm - 1 Muka': {
    w: 15, h: 17, wOpen: 17, hOpen: 30, pcsPerA3: 2, gramatur: 230, muka: 1,
    description: '15 × 17 cm (17 × 30 terbuka) · Art Carton 230 gsm · 1 Muka Full Colour · 2 pcs/A3+ · Sisir + Plastik OPP + Label',
  },
  '15 x 17 cm - 2 Muka': {
    w: 15, h: 17, wOpen: 17, hOpen: 30, pcsPerA3: 2, gramatur: 230, muka: 2,
    description: '15 × 17 cm (17 × 30 terbuka) · Art Carton 230 gsm · 2 Muka Full Colour · 2 pcs/A3+ · Sisir + Plastik OPP + Label',
  },
};

export const UNDANGAN_TIERS: number[] = [
  20, 50, 100, 150, 200, 250, 300, 350, 400, 500, 600, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000,
];

export interface UndanganSimulatorInput {
  oplah: number;
  varian: UndanganVarianType;
  laminasi: UndanganLaminasiType;
  marginPct: number;
  negoDiskonPct: number;
}

export interface UndanganBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface UndanganSimulatorResult {
  input: UndanganSimulatorInput;
  breakdown: UndanganBreakdownItem[];
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

export function calculateUndanganHpp(
  input: UndanganSimulatorInput,
  rawParams: UndanganMasterParams = DEFAULT_UNDANGAN_PARAMS
): UndanganSimulatorResult {
  const p: UndanganMasterParams = { ...DEFAULT_UNDANGAN_PARAMS, ...(rawParams || {}) };
  const { oplah, varian, laminasi = 'Tanpa Laminasi', marginPct, negoDiskonPct } = input;
  const validOplah = Math.max(1, oplah);
  const cfg = UNDANGAN_CONFIG[varian];

  const breakdown: UndanganBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // 1. Kebutuhan kertas A3+ & Biaya Kertas Art Carton 230 gsm
  const kebutuhanA3Net = Math.ceil(validOplah / cfg.pcsPerA3);
  const kebutuhanA3 = kebutuhanA3Net + p.insheetWaste;
  const beratPerA3 = beratA3Kg(cfg.gramatur);
  const hargaPerA3 = beratPerA3 * p.tarifKertasAc230Kg * (1 + p.upKertasPct / 100);
  const biayaKertas = kebutuhanA3 * hargaPerA3;
  add(`Kertas Art Carton ${cfg.gramatur} gsm`, biayaKertas,
    `${kebutuhanA3} lbr A3+ (${kebutuhanA3Net} + ${p.insheetWaste} insheet) × Rp ${Math.round(hargaPerA3).toLocaleString('id-ID')} (+${p.upKertasPct}%)`);

  // 2. Biaya Cetak Full Colour
  const is2Muka = cfg.muka === 2;
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
    add('Desain Artwork Undangan', p.tarifDesign, 'Biaya desain & setting undangan');
  }

  // 4. Laminasi (opsional) — glossy/doff per cm2, 2 muka jika 2 Muka varian
  if (laminasi !== 'Tanpa Laminasi') {
    const luasPerPcsCm2 = (cfg.wOpen + 1) * (cfg.hOpen + 1);
    const tarifCm2 = laminasi === 'Doff' ? p.tarifLaminasiDoffCm2 : p.tarifLaminasiGlossyCm2;
    const mukaLaminasi = is2Muka ? 2 : 1;
    const biayaLaminasiRaw = luasPerPcsCm2 * tarifCm2 * validOplah * mukaLaminasi;
    const biayaLaminasi = Math.max(p.minLaminasi, biayaLaminasiRaw);
    const ketLam = biayaLaminasiRaw < p.minLaminasi
      ? `Min Laminasi Rp ${p.minLaminasi.toLocaleString('id-ID')} (raw ${luasPerPcsCm2.toFixed(1)} cm² × ${validOplah} pcs × ${mukaLaminasi} muka × Rp ${tarifCm2})`
      : `${validOplah} pcs × ${luasPerPcsCm2.toFixed(1)} cm² × ${mukaLaminasi} muka × Rp ${tarifCm2}/cm²`;
    add(`Laminasi ${laminasi}${is2Muka ? ' 2 Muka' : ''}`, biayaLaminasi, ketLam);
  }

  // 5. Finishing Sisir + Plastik OPP + Label per pcs
  if (p.tarifSisirPerPcs > 0) {
    const biayaSisir = validOplah * p.tarifSisirPerPcs;
    add('Finishing Sisir', biayaSisir,
      `${validOplah} pcs × Rp ${p.tarifSisirPerPcs.toLocaleString('id-ID')}`);
  }
  if (p.tarifPlastikOppPerPcs > 0) {
    const biayaPlastik = validOplah * p.tarifPlastikOppPerPcs;
    add('Plastik OPP (Pasang Sendiri)', biayaPlastik,
      `${validOplah} pcs × Rp ${p.tarifPlastikOppPerPcs.toLocaleString('id-ID')}`);
  }
  if (p.tarifLabelPerPcs > 0) {
    const biayaLabel = validOplah * p.tarifLabelPerPcs;
    add('Label Undangan', biayaLabel,
      `${validOplah} pcs × Rp ${p.tarifLabelPerPcs.toLocaleString('id-ID')}`);
  }

  // 6. Packing Kardus + Lakban per order
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

export type SavedUndanganSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: UndanganSimulatorResult;
  paramsSnapshot?: UndanganMasterParams;
};
