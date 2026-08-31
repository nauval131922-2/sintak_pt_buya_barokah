// ponytail: kalkulator dan master parameter Label KHQ (05. Pricelist Label KHQ)
// Referensi: Pricelist Label KHQ JUNI 2026.xlsm & Source single files (Label KHQ 220ml / 330ml / 600ml)

export interface LabelKhqMasterParams {
  // A. Kertas & Print Digital POD A3+
  tarifPrintA3: number;          // Rp 2.000 / lembar A3+ (Master!D18)
  insheetWasteLbr: number;       // Master!D13 = 7 lembar insheet waste

  // B. Finishing
  tarifRajangPerPcs: number;     // BUKU!AN6 = Rp 50 / lembar label (potong / rajang)
  tarifLaminasiGlossyCm2: number;// Rp 0.35 / cm²
  minLaminasi: number;           // Rp 50.000 minimum laminasi

  // C. Desain & Overhead
  tarifDesain: number;           // Rp 30.000 (Master!D17)

  // D. Margin & Nego Standar
  marginDefaultPct: number;      // 30% (Pricelist Label Juni 2026)
  negoDefaultPct: number;        // 4% default nego
}

export const DEFAULT_LABEL_KHQ_PARAMS: LabelKhqMasterParams = {
  tarifPrintA3: 2000,
  insheetWasteLbr: 7,
  tarifRajangPerPcs: 50,
  tarifLaminasiGlossyCm2: 0.35,
  minLaminasi: 50000,
  tarifDesain: 30000,
  marginDefaultPct: 30,
  negoDefaultPct: 4,
};

export type LabelKhqVarianType = 'KHQ 220 ml' | 'KHQ 330 ml' | 'KHQ 600 ml';

// Konfigurasi ukuran fisik & kapasitas per lembar A3+
// 220 ml: 3.5 x 21 cm (19 pcs / A3+, 24 lbr / kardus = 480 botol)
// 330 ml: 3.5 x 18.7 cm (20 pcs / A3+, 24 lbr / kardus = 480 botol)
// 600 ml: 3.9 x 21.7 cm (17 pcs / A3+, 24 lbr / kardus = 480 botol)
export const LABEL_KHQ_CONFIG: Record<LabelKhqVarianType, {
  w: number;
  h: number;
  pcsPerLbrA3: number;
  lbrPerKardus: number;
  botolPerLbr: number; // 1 lembar label memuat 24 botol / 1 dus isi 24 botol
  description: string;
}> = {
  'KHQ 220 ml': {
    w: 3.5,
    h: 21.0,
    pcsPerLbrA3: 19,
    lbrPerKardus: 24,
    botolPerLbr: 20, // 24 lbr = 480 cup/kardus
    description: 'Ukuran 3,5 x 21 cm · 19 pcs/lbr A3+ · Art Paper 120 gsm + Laminasi Glossy + Rajang',
  },
  'KHQ 330 ml': {
    w: 3.5,
    h: 18.7,
    pcsPerLbrA3: 20,
    lbrPerKardus: 24,
    botolPerLbr: 20,
    description: 'Ukuran 3,5 x 18,7 cm · 20 pcs/lbr A3+ · Art Paper 120 gsm + Laminasi Glossy + Rajang',
  },
  'KHQ 600 ml': {
    w: 3.9,
    h: 21.7,
    pcsPerLbrA3: 17,
    lbrPerKardus: 24,
    botolPerLbr: 20,
    description: 'Ukuran 3,9 x 21,7 cm · 17 pcs/lbr A3+ · Art Paper 120 gsm + Laminasi Glossy + Rajang',
  },
};

export interface LabelKhqBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface LabelKhqSimulatorInput {
  varian: LabelKhqVarianType;
  jumlahKardus: number;          // Input utama dalam satuan kardus (1 kardus = 24 lbr)
  jumlahLbrCustom?: number;      // Atau custom jumlah lembar cetak
  opsiLaminasi: boolean;         // Default true (Laminasi Glossy)
  opsiRajang: boolean;           // Default true (Rajang / Potong)
  marginPct: number;
  negoDiskonPct: number;
}

export interface LabelKhqCalculationResult {
  input: LabelKhqSimulatorInput;
  jumlahKardus: number;
  jumlahLbr: number;             // Total lembar label
  kebutuhanLbrA3: number;        // Lembar A3+ yang dicetak (termasuk insheet)
  breakdown: LabelKhqBreakdownItem[];
  totalHpp: number;
  hppPerLbr: number;
  hargaJualPerLbr: number;
  hargaNegoPerLbr: number;
  totalHargaJual: number;
  totalHargaNego: number;
  profitPerLbr: number;
  profitNegoPerLbr: number;
  profitTotal: number;
  profitNegoTotal: number;
  marginPct: number;
  marginNegoPct: number;
}

export function calculateLabelKhqHpp(
  input: LabelKhqSimulatorInput,
  rawParams: LabelKhqMasterParams = DEFAULT_LABEL_KHQ_PARAMS
): LabelKhqCalculationResult {
  const p: LabelKhqMasterParams = { ...DEFAULT_LABEL_KHQ_PARAMS, ...(rawParams || {}) };
  const {
    varian,
    jumlahKardus,
    jumlahLbrCustom,
    opsiLaminasi = true,
    opsiRajang = true,
    marginPct = p.marginDefaultPct,
    negoDiskonPct = p.negoDefaultPct,
  } = input;

  const cfg = LABEL_KHQ_CONFIG[varian];
  const jumlahLbr = jumlahLbrCustom && jumlahLbrCustom > 0
    ? jumlahLbrCustom
    : Math.max(1, jumlahKardus) * cfg.lbrPerKardus;
  const kardusActual = jumlahLbr / cfg.lbrPerKardus;

  // 1. Kebutuhan Lembar Cetak A3+
  // Formula Excel: ROUNDUP((jumlahLbr / pcsPerLbrA3) + insheet, 0)
  const lbrA3Raw = Math.ceil(jumlahLbr / cfg.pcsPerLbrA3);
  const kebutuhanLbrA3 = lbrA3Raw + p.insheetWasteLbr;

  const breakdown: LabelKhqBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // 1. Biaya Print Digital POD A3+
  const biayaPrint = kebutuhanLbrA3 * p.tarifPrintA3;
  add('Biaya Print Digital POD A3+', biayaPrint,
    `${kebutuhanLbrA3} lbr A3+ (net ${lbrA3Raw} + ${p.insheetWasteLbr} insheet) × Rp ${p.tarifPrintA3.toLocaleString('id-ID')}`);

  // 2. Biaya Desain
  if (p.tarifDesain > 0) {
    add('Biaya Desain Artwork', p.tarifDesain, 'Biaya setup desain label');
  }

  // 3. Biaya Rajang / Potong Lembaran
  if (opsiRajang && p.tarifRajangPerPcs > 0) {
    const biayaRajang = jumlahLbr * p.tarifRajangPerPcs;
    add('Ongkos Rajang / Potong', biayaRajang,
      `${jumlahLbr.toLocaleString('id-ID')} lbr label × Rp ${p.tarifRajangPerPcs.toLocaleString('id-ID')}`);
  }

  // 4. Biaya Laminasi Glossy (Area A3+ per sheet print)
  if (opsiLaminasi && p.tarifLaminasiGlossyCm2 > 0) {
    // Luas area kertas plano A3+ (32.5 x 48.0 cm + margin) = ~33.5 x 49 cm = ~1.641,5 cm²
    const luasA3Cm2 = 33.5 * 49.0;
    const biayaLaminasiRaw = luasA3Cm2 * p.tarifLaminasiGlossyCm2 * kebutuhanLbrA3;
    const biayaLaminasi = Math.max(p.minLaminasi, biayaLaminasiRaw);
    add('Laminasi Glossy', biayaLaminasi,
      biayaLaminasiRaw < p.minLaminasi
        ? `Tarif Minimum Rp ${p.minLaminasi.toLocaleString('id-ID')}`
        : `${kebutuhanLbrA3} lbr A3+ × Rp ${Math.round(luasA3Cm2 * p.tarifLaminasiGlossyCm2).toLocaleString('id-ID')}`);
  }

  // Hitung persentase breakdown
  breakdown.forEach((b) => {
    b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0;
  });

  const hppPerLbr = jumlahLbr > 0 ? totalHpp / jumlahLbr : 0;
  // Formula pembulatan harga jual: ROUNDUP((HPP * (1 + marginPct/100)), -1) -> kelipatan 10
  const rawHargaJual = hppPerLbr * (1 + marginPct / 100);
  const hargaJualPerLbr = Math.ceil(rawHargaJual / 10) * 10;
  const hargaNegoPerLbr = Math.ceil((hargaJualPerLbr * (1 - negoDiskonPct / 100)) / 10) * 10;

  const totalHargaJual = Math.round(hargaJualPerLbr * jumlahLbr);
  const totalHargaNego = Math.round(hargaNegoPerLbr * jumlahLbr);

  const profitPerLbr = hargaJualPerLbr - hppPerLbr;
  const profitNegoPerLbr = hargaNegoPerLbr - hppPerLbr;
  const profitTotal = totalHargaJual - totalHpp;
  const profitNegoTotal = totalHargaNego - totalHpp;

  const marginPctActual = hargaJualPerLbr > 0 ? profitPerLbr / hargaJualPerLbr : 0;
  const marginNegoPct = hargaNegoPerLbr > 0 ? profitNegoPerLbr / hargaNegoPerLbr : 0;

  return {
    input,
    jumlahKardus: kardusActual,
    jumlahLbr,
    kebutuhanLbrA3,
    breakdown,
    totalHpp,
    hppPerLbr,
    hargaJualPerLbr,
    hargaNegoPerLbr,
    totalHargaJual,
    totalHargaNego,
    profitPerLbr,
    profitNegoPerLbr,
    profitTotal,
    profitNegoTotal,
    marginPct: marginPctActual,
    marginNegoPct,
  };
}

export type SavedLabelKhqSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: LabelKhqCalculationResult;
  paramsSnapshot?: LabelKhqMasterParams;
};
