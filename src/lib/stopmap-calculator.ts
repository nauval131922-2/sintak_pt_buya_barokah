// ponytail: kalkulator dan master parameter Stopmap (07. Pricelist Stopmap)
// Referensi: Pricelist Stopmap.xlsx sheets Source Stopmap A4/FOLIO, HARGA JULI 2026 (A4 22x31 & Folio 24x35)
// Art Carton 230 gsm 1 muka Full colour Laminasi Glossy/Doff, finishing Sisir+Lipat+Kupingan Smile+Packing.

export interface StopmapMasterParams {
  // A. Bahan Kertas
  tarifArtCarton230Kg: number; // Master!E12 default 16.400 /kg
  upArtCartonPct: number; // default 5%

  // B. Insheet & Cetak
  insheetWaste: number; // default 5 lbr insheet
  tarifDesign: number; // Master!D17 default 10.000 (A4) / 20.000 Folio -> pakai 10.000 global
  tarifPrintA3: number; // Rp 2.500 / lbr A3+ Print Inter

  // C. Laminasi
  tarifLaminasiGlossyCm2: number; // Rp 0.35 / cm²
  minLaminasi: number; // Rp 50.000 min order
  tarifLaminasiDoffAdd: number; // Rp 200 / pcs tambahan Doff di atas Glossy

  // D. Finishing per pcs
  tarifSisirPerPcs: number; // sisir
  tarifLipatPerPcs: number; // lipat
  tarifKupinganPerPcs: number; // kupingan smile

  // E. Packing per order
  tarifKardusBox: number; // Rp 8.500 / box
  tarifLakbanRoll: number; // Rp 8.000 / roll

  // F. Margin & nego
  marginDefaultPct: number; // default 30%
  negoDefaultPct: number; // default 4%
}

export const DEFAULT_STOPMAP_PARAMS: StopmapMasterParams = {
  tarifArtCarton230Kg: 16400,
  upArtCartonPct: 5,
  insheetWaste: 5,
  tarifDesign: 10000,
  tarifPrintA3: 2500,
  tarifLaminasiGlossyCm2: 0.35,
  minLaminasi: 50000,
  tarifLaminasiDoffAdd: 200,
  tarifSisirPerPcs: 150,
  tarifLipatPerPcs: 100,
  tarifKupinganPerPcs: 100,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,
  marginDefaultPct: 30,
  negoDefaultPct: 4,
};

export type StopmapUkuranType = 'A4 (22 x 31 cm)' | 'FOLIO (24 x 35 cm)';
export type StopmapLaminasiType = 'Glossy' | 'Doff';

// Konfigurasi fisik per ukuran
// ponytail: pcsPerA3 = 1 stopmap per lembar A3+ (33x48) – ukuran A4 22x31 & Folio 24x35 muat 1/lbr
export const STOPMAP_CONFIG: Record<StopmapUkuranType, {
  w: number; h: number;
  pcsPerA3: number;
  description: string;
}> = {
  'A4 (22 x 31 cm)': {
    w: 22, h: 31,
    pcsPerA3: 1,
    description: '22 x 31 cm (tertutup) · Art Carton 230 gsm 1 Muka Full Colour + Laminasi Glossy/Doff',
  },
  'FOLIO (24 x 35 cm)': {
    w: 24, h: 35,
    pcsPerA3: 1,
    description: '24 x 35 cm (tertutup) · Art Carton 230 gsm 1 Muka Full Colour + Laminasi Glossy/Doff',
  },
};

export const STOPMAP_TIERS: number[] = [
  10, 15, 20, 30, 40, 50, 75, 100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1500, 2000, 2500, 3000,
];

export interface StopmapSimulatorInput {
  oplah: number;
  ukuran: StopmapUkuranType;
  laminasi: StopmapLaminasiType;
  marginPct: number;
  negoDiskonPct: number;
}

export interface StopmapBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface StopmapSimulatorResult {
  input: StopmapSimulatorInput;
  breakdown: StopmapBreakdownItem[];
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

export function calculateStopmapHpp(
  input: StopmapSimulatorInput,
  rawParams: StopmapMasterParams = DEFAULT_STOPMAP_PARAMS
): StopmapSimulatorResult {
  const p: StopmapMasterParams = { ...DEFAULT_STOPMAP_PARAMS, ...(rawParams || {}) };
  const { oplah, ukuran, laminasi = 'Glossy', marginPct, negoDiskonPct } = input;
  const validOplah = Math.max(1, oplah);
  const cfg = STOPMAP_CONFIG[ukuran];

  const breakdown: StopmapBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // 1. Kebutuhan kertas A3+ & Biaya Kertas Art Carton 230 gsm
  const kebutuhanA3Net = Math.ceil(validOplah / cfg.pcsPerA3);
  const kebutuhanA3 = kebutuhanA3Net + p.insheetWaste;
  const beratPerA3 = beratA3Kg(230);
  const hargaPerA3 = beratPerA3 * p.tarifArtCarton230Kg * (1 + p.upArtCartonPct / 100);
  const biayaKertas = kebutuhanA3 * hargaPerA3;
  add('Kertas Art Carton 230 gsm', biayaKertas,
    `${kebutuhanA3} lbr A3+ (${kebutuhanA3Net} + ${p.insheetWaste} insheet) × Rp ${Math.round(hargaPerA3).toLocaleString('id-ID')} (+${p.upArtCartonPct}%)`);

  // 2. Cetak Print Inter 1 Muka Full Colour
  const biayaPrint = kebutuhanA3 * p.tarifPrintA3;
  add('Cetak Print Inter 1 Muka 4 Warna', biayaPrint,
    `${kebutuhanA3} lbr A3+ × Rp ${p.tarifPrintA3.toLocaleString('id-ID')}`);

  // 3. Desain
  if (p.tarifDesign > 0) {
    add('Desain Artwork', p.tarifDesign, `Biaya desain cover stopmap`);
  }

  // 4. Laminasi Glossy (min order) + tambahan Doff
  {
    const luasPerPcsCm2 = cfg.w * cfg.h;
    const biayaLaminasiRaw = luasPerPcsCm2 * p.tarifLaminasiGlossyCm2 * validOplah;
    const biayaLaminasiGlossy = Math.max(p.minLaminasi, biayaLaminasiRaw);
    const ketLam = biayaLaminasiRaw < p.minLaminasi
      ? `Tarif Minimum Rp ${p.minLaminasi.toLocaleString('id-ID')}`
      : `${validOplah} pcs × ${luasPerPcsCm2} cm² × Rp ${p.tarifLaminasiGlossyCm2}/cm²`;
    add('Laminasi Glossy', biayaLaminasiGlossy, ketLam);
    if (laminasi === 'Doff' && p.tarifLaminasiDoffAdd > 0) {
      const biayaDoffAdd = validOplah * p.tarifLaminasiDoffAdd;
      add('Tambahan Laminasi Doff', biayaDoffAdd,
        `${validOplah} pcs × Rp ${p.tarifLaminasiDoffAdd.toLocaleString('id-ID')} (upgrade Glossy → Doff)`);
    }
  }

  // 5. Finishing: Sisir + Lipat + Kupingan Smile (per pcs)
  {
    const perPcs = p.tarifSisirPerPcs + p.tarifLipatPerPcs + p.tarifKupinganPerPcs;
    const biayaFinishing = validOplah * perPcs;
    add('Finishing Sisir + Lipat + Kupingan Smile', biayaFinishing,
      `${validOplah} pcs × Rp ${perPcs} (Sisir Rp ${p.tarifSisirPerPcs} + Lipat Rp ${p.tarifLipatPerPcs} + Kupingan Rp ${p.tarifKupinganPerPcs})`);
  }

  // 6. Packing Kardus + Lakban (per order)
  // ponytail: flat per order, upgrade ke per kardus @50 pcs jika volume besar
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

export type SavedStopmapSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: StopmapSimulatorResult;
  paramsSnapshot?: StopmapMasterParams;
};
