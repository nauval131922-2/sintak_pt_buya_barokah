// ponytail: kalkulator dan master parameter Buku Tabungan Security 9 x 14,5 cm (15. Pricelist Buku Tabungan Security)
// Referensi: Pricelist Buku Tabungan Security.xlsx sheets HARGA JULI 2026 (BUKU TABUNGAN 9 x 14,5 Security 24 Hal) + Source BUKU TABUNGAN 9 x 14,5 cm - Security Ryobi.xlsm (Master Art Carton 260 gsm 16400 +5% + Print Inter 3500, HVS 70 gsm 15700 +5% + Ryobi, 6 lbr/24 hal, laminasi glossy 0.35/cm2 min 50k, finishing susun+lipat+jahit+pound+packing + Security Foil Emas + Numbering seri)
// Ukuran: 9 x 14,5 cm (tertutup) 1 Muka Full Colour, laminasi glossy, foil emas, numbering seri, jahit + pound + susun + lipat + packing — heuristik: mirip NS tapi tambah Security Paper + watermark + nomor seri, harga sedikit lebih tinggi

export interface BukuTabunganSecurityMasterParams {
  // A. Bahan Kertas Cover Art Carton/Ivory 260 gsm
  tarifKertasCoverKg: number; // default 16400 /kg (Ivory Security)
  upKertasCoverPct: number; // default 5%
  insheetCover: number; // default 15 lbr

  // B. Bahan Kertas Isi HVS 70 gsm
  tarifKertasIsiKg: number; // default 15700 /kg
  upKertasIsiPct: number; // default 5%
  insheetIsi: number; // default 30 lbr

  // C. Desain
  tarifDesignCover: number; // default 15000 /order
  tarifDesignIsiPerLbr: number; // default 1500 /lbr (6 lbr = 9000)

  // D. Cetak Cover Print Inter & Isi Ryobi
  tarifPrintCoverA3: number; // Rp 3500 / lbr A3+ (Print Inter)
  tarifPrintIsiA3: number; // Rp 1500 / lbr A3+ (Ryobi 1W, naik ke Oliver >500 => 0.6x + plat 180k)

  // E. Laminasi Cover
  tarifLaminasiGlossyCm2: number; // Rp 0.35 / cm2
  minLaminasi: number; // Rp 50.000 min

  // F. Finishing per pcs
  tarifSusunLipatPerPcs: number; // susun + lipat per pcs (Excel: (UMR/25)/BI28 ≈125)
  tarifJahitPerPcs: number; // jahit per pcs (min 250k)
  minJahit: number; // Rp 250.000 min jahit
  tarifPoundPerPcs: number; // pound + jasa per pcs (≈300)
  tarifPisauPoundFlat: number; // pisau pound flat per order (≈52377)
  tarifPlastikSringPerPcs: number; // plastik sring per pcs

  // F2. Security finishing tambahan
  tarifSecurityPerPcs: number; // Security Paper + watermark + foil emas per pcs
  tarifNumberingPerPcs: number; // numbering seri per pcs

  // G. Packing
  tarifKardusBox: number; // Rp 8500 / box
  tarifLakbanRoll: number; // Rp 8000 / roll

  // H. Margin & nego
  marginDefaultPct: number; // default 30%
  negoDefaultPct: number; // default 5%
}

export const DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS: BukuTabunganSecurityMasterParams = {
  tarifKertasCoverKg: 16400,
  upKertasCoverPct: 5,
  insheetCover: 15,
  tarifKertasIsiKg: 15700,
  upKertasIsiPct: 5,
  insheetIsi: 30,
  tarifDesignCover: 15000,
  tarifDesignIsiPerLbr: 1500,
  tarifPrintCoverA3: 3500,
  tarifPrintIsiA3: 1500,
  tarifLaminasiGlossyCm2: 0.35,
  minLaminasi: 50000,
  tarifSusunLipatPerPcs: 125,
  tarifJahitPerPcs: 500,
  minJahit: 250000,
  tarifPoundPerPcs: 300,
  tarifPisauPoundFlat: 52377,
  tarifPlastikSringPerPcs: 150,
  tarifSecurityPerPcs: 550,
  tarifNumberingPerPcs: 350,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,
  marginDefaultPct: 30,
  negoDefaultPct: 5,
};

export type BukuTabunganSecurityVarianType = '24 Hal' | '32 Hal' | '48 Hal';

export const BUKU_TABUNGAN_SECURITY_VARIANTS: BukuTabunganSecurityVarianType[] = ['24 Hal', '32 Hal', '48 Hal'];

// ponytail: coverPcsPerA3 = 4 cover per A3+ (BUKU!P7=4), leavesPerA3 = 6 lembar isi per A3+ naive — upgrade ke plano-aware jika presisi dibutuhkan
export const BUKU_TABUNGAN_SECURITY_CONFIG: Record<BukuTabunganSecurityVarianType, {
  w: number; h: number;
  coverPcsPerA3: number;
  leavesPerA3: number;
  jumlahHalaman: number;
  jumlahLbr: number;
  description: string;
}> = {
  '24 Hal': {
    w: 9, h: 14.5, coverPcsPerA3: 4, leavesPerA3: 6, jumlahHalaman: 24, jumlahLbr: 6,
    description: '9 × 14,5 cm (tertutup) · Cover Ivory 260 gsm 1 Muka FC + Laminasi Glossy + Foil Emas · Isi HVS 70 gsm 1 Warna Bolak-Balik 24 Hal (6 lbr) · Security + Numbering + Jahit + Pound',
  },
  '32 Hal': {
    w: 9, h: 14.5, coverPcsPerA3: 4, leavesPerA3: 6, jumlahHalaman: 32, jumlahLbr: 8,
    description: '9 × 14,5 cm (tertutup) · Cover Ivory 260 gsm 1 Muka FC + Laminasi Glossy + Foil Emas · Isi HVS 70 gsm 1 Warna Bolak-Balik 32 Hal (8 lbr) · Security + Numbering + Jahit + Pound',
  },
  '48 Hal': {
    w: 9, h: 14.5, coverPcsPerA3: 4, leavesPerA3: 6, jumlahHalaman: 48, jumlahLbr: 12,
    description: '9 × 14,5 cm (tertutup) · Cover Ivory 260 gsm 1 Muka FC + Laminasi Glossy + Foil Emas · Isi HVS 70 gsm 1 Warna Bolak-Balik 48 Hal (12 lbr) · Security + Numbering + Jahit + Pound',
  },
};

export const BUKU_TABUNGAN_SECURITY_TIERS: number[] = [
  50, 100, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900, 1000, 1500,
];

export interface BukuTabunganSecuritySimulatorInput {
  oplah: number;
  varian: BukuTabunganSecurityVarianType;
  marginPct: number;
  negoDiskonPct: number;
}

export interface BukuTabunganSecurityBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface BukuTabunganSecuritySimulatorResult {
  input: BukuTabunganSecuritySimulatorInput;
  breakdown: BukuTabunganSecurityBreakdownItem[];
  kebutuhanCoverA3: number;
  kebutuhanIsiA3: number;
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

export function calculateBukuTabunganSecurityHpp(
  input: BukuTabunganSecuritySimulatorInput,
  rawParams: BukuTabunganSecurityMasterParams = DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS
): BukuTabunganSecuritySimulatorResult {
  const p: BukuTabunganSecurityMasterParams = { ...DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS, ...(rawParams || {}) };
  const { oplah, varian, marginPct, negoDiskonPct } = input;
  const validOplah = Math.max(1, oplah);
  const cfg = BUKU_TABUNGAN_SECURITY_CONFIG[varian];

  const breakdown: BukuTabunganSecurityBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // 1. Kebutuhan Cover A3+ & Biaya Kertas Cover Ivory 260 gsm Security
  const kebutuhanCoverNet = Math.ceil(validOplah / cfg.coverPcsPerA3);
  const kebutuhanCoverA3 = kebutuhanCoverNet + p.insheetCover;
  const beratCoverPerA3 = beratA3Kg(260);
  const hargaCoverPerA3 = beratCoverPerA3 * p.tarifKertasCoverKg * (1 + p.upKertasCoverPct / 100);
  const biayaKertasCover = kebutuhanCoverA3 * hargaCoverPerA3;
  add('Kertas Cover Ivory 260 gsm Security', biayaKertasCover,
    `${kebutuhanCoverA3} lbr A3+ (${kebutuhanCoverNet} + ${p.insheetCover} insheet) × Rp ${Math.round(hargaCoverPerA3).toLocaleString('id-ID')} (+${p.upKertasCoverPct}%)`);

  const biayaPrintCover = kebutuhanCoverA3 * p.tarifPrintCoverA3;
  add('Cetak Cover Print Inter 1 Muka FC', biayaPrintCover,
    `${kebutuhanCoverA3} lbr A3+ × Rp ${p.tarifPrintCoverA3.toLocaleString('id-ID')}`);

  // 2. Kebutuhan Isi A3+ & Biaya Kertas Isi HVS 70 gsm (1 Warna BB)
  const kebutuhanIsiNet = Math.ceil((validOplah * cfg.jumlahLbr) / cfg.leavesPerA3);
  const kebutuhanIsiA3 = kebutuhanIsiNet + p.insheetIsi;
  const beratIsiPerA3 = beratA3Kg(70);
  const hargaIsiPerA3 = beratIsiPerA3 * p.tarifKertasIsiKg * (1 + p.upKertasIsiPct / 100);
  const biayaKertasIsi = kebutuhanIsiA3 * hargaIsiPerA3;
  add('Kertas Isi HVS 70 gsm', biayaKertasIsi,
    `${kebutuhanIsiA3} lbr A3+ (${kebutuhanIsiNet} + ${p.insheetIsi} insheet, ${cfg.jumlahLbr} lbr/buku ÷ ${cfg.leavesPerA3}/A3) × Rp ${Math.round(hargaIsiPerA3).toLocaleString('id-ID')} (+${p.upKertasIsiPct}%)`);

  // Cetak Isi: Ryobi untuk ≤500, Oliver untuk >500 (ponytail: 0.6x tarif + plat 180k naive — upgrade ke plat/drek dinamis jika butuh presisi)
  let biayaPrintIsi = 0;
  let ketPrintIsi = '';
  if (validOplah <= 500) {
    biayaPrintIsi = kebutuhanIsiA3 * p.tarifPrintIsiA3;
    ketPrintIsi = `${kebutuhanIsiA3} lbr A3+ × Rp ${p.tarifPrintIsiA3.toLocaleString('id-ID')} (Ryobi 1 Warna BB)`;
  } else {
    const tarifOliverPerLbr = Math.round(p.tarifPrintIsiA3 * 0.6);
    const platOliverFixed = 180000;
    biayaPrintIsi = kebutuhanIsiA3 * tarifOliverPerLbr + platOliverFixed;
    ketPrintIsi = `${kebutuhanIsiA3} lbr A3+ × Rp ${tarifOliverPerLbr.toLocaleString('id-ID')} + Plat Oliver Rp ${platOliverFixed.toLocaleString('id-ID')} (Oliver 1W)`;
  }
  add('Cetak Isi 1 Warna Bolak-Balik', biayaPrintIsi, ketPrintIsi);

  // 3. Desain Cover + Isi
  const biayaDesain = p.tarifDesignCover + cfg.jumlahLbr * p.tarifDesignIsiPerLbr;
  add('Desain Cover + Isi', biayaDesain,
    `Cover Rp ${p.tarifDesignCover.toLocaleString('id-ID')} + Isi ${cfg.jumlahLbr} lbr × Rp ${p.tarifDesignIsiPerLbr.toLocaleString('id-ID')}`);

  // 4. Laminasi Glossy Cover (luas bentangan 9*2+1 x 14.5+1)
  {
    const luasCoverCm2 = (cfg.w * 2 + 1) * (cfg.h + 1);
    const biayaLaminasiRaw = luasCoverCm2 * p.tarifLaminasiGlossyCm2 * validOplah;
    const biayaLaminasi = Math.max(p.minLaminasi, biayaLaminasiRaw);
    const ketLam = biayaLaminasiRaw < p.minLaminasi
      ? `Min Laminasi Rp ${p.minLaminasi.toLocaleString('id-ID')} (raw ${luasCoverCm2.toFixed(1)} cm² × ${validOplah} pcs × Rp ${p.tarifLaminasiGlossyCm2})`
      : `${validOplah} pcs × ${luasCoverCm2.toFixed(1)} cm² × Rp ${p.tarifLaminasiGlossyCm2}/cm²`;
    add('Laminasi Glossy Cover', biayaLaminasi, ketLam);
  }

  // 5. Finishing: Susun Lipat + Jahit + Pound (Pisau + Jasa) + Plastik Sring
  const biayaSusun = validOplah * p.tarifSusunLipatPerPcs;
  const rawJahit = validOplah * p.tarifJahitPerPcs;
  const biayaJahit = Math.max(p.minJahit, rawJahit);
  const ketJahit = rawJahit < p.minJahit
    ? `Min Jahit Rp ${p.minJahit.toLocaleString('id-ID')} (raw ${validOplah}×${p.tarifJahitPerPcs}=${rawJahit.toLocaleString('id-ID')})`
    : `${validOplah} pcs × Rp ${p.tarifJahitPerPcs.toLocaleString('id-ID')}`;
  const biayaPound = validOplah * p.tarifPoundPerPcs + p.tarifPisauPoundFlat;
  const biayaPlastik = validOplah * p.tarifPlastikSringPerPcs;

  // ponytail: pound pisau flat + jasa per pcs naive — upgrade ke pisau per order + per pcs jika throughput pisau tinggi
  add('Finishing Susun + Lipat + Jahit', biayaSusun + biayaJahit,
    `Susun Lipat ${validOplah}×${p.tarifSusunLipatPerPcs}=${biayaSusun.toLocaleString('id-ID')} + Jahit ${ketJahit}`);
  add('Finishing Pound (Pisau + Jasa) + Plastik Sring', biayaPound + biayaPlastik,
    `Pound ${validOplah}×${p.tarifPoundPerPcs}+Pisau ${p.tarifPisauPoundFlat.toLocaleString('id-ID')} + Sring ${validOplah}×${p.tarifPlastikSringPerPcs}`);

  // 5b. Security tambahan: Foil Emas + Watermark Security Paper + Numbering seri
  const biayaSecurity = validOplah * p.tarifSecurityPerPcs;
  add('Security Foil Emas + Watermark', biayaSecurity,
    `${validOplah} pcs × Rp ${p.tarifSecurityPerPcs.toLocaleString('id-ID')} (Foil Emas + Security Paper)`);
  const biayaNumbering = validOplah * p.tarifNumberingPerPcs;
  add('Numbering Seri Security', biayaNumbering,
    `${validOplah} pcs × Rp ${p.tarifNumberingPerPcs.toLocaleString('id-ID')} (Nomor seri + watermark)`);

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
    kebutuhanCoverA3,
    kebutuhanIsiA3,
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

export type SavedBukuTabunganSecuritySimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: BukuTabunganSecuritySimulatorResult;
  paramsSnapshot?: BukuTabunganSecurityMasterParams;
};
