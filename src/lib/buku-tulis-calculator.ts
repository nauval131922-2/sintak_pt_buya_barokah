// ponytail: kalkulator dan master parameter buku tulis 72 hal (06. Pricelist Buku Tulis)
// Referensi: Pricelist Buku Tulis.xlsx sheets Source Buku Tulis, HARGA JULI 2026, PRICELIST 2026
// Soft cover 72 hal (18 lembar isi), cover Art Carton 230 gsm 4 warna 1 muka laminasi glossy, isi HVS 70 gsm 1 warna bolak-balik

export interface BukuTulisMasterParams {
  // A. Bahan Kertas
  tarifArtCarton230Kg: number; // Master!E12 default 16.400 /kg
  upArtCartonPct: number; // default 5%
  tarifHvs70Kg: number; // Master HVS 70 15.700 /kg
  upHvsPct: number; // default 3%

  // B. Insheet
  insheetCover: number; // BUKU!H6 default 7
  insheetIsi: number; // default 30

  // C. Desain
  tarifDesignCover: number; // Master!D17 default 20.000
  tarifDesignIsiPerHlm: number; // 2.500 per halaman

  // D. Cetak
  tarifPrintCoverA3: number; // Rp 2.500 / lbr A3+
  tarifPrintIsiA3: number; // Rp 2.000 / lbr A3+ (Ryobi)

  // E. Laminasi
  tarifLaminasiGlossyCm2: number; // Rp 0.35 / cm2
  minLaminasi: number; // Rp 50.000

  // F. Finishing
  tarifSusunPerPcs: number; // susun per pcs
  tarifStaplesPerPcs: number; // staples tengah per pcs
  tarifSisirPerPcs: number; // sisir per pcs
  tarifPackingKardus: number; // per order
  tarifLakbanPerOrder: number; // per order

  // G. Margin & nego
  marginDefaultPct: number; // default 20%
  negoDefaultPct: number; // default 4%
}

export const DEFAULT_BUKU_TULIS_PARAMS: BukuTulisMasterParams = {
  tarifArtCarton230Kg: 16400,
  upArtCartonPct: 5,
  tarifHvs70Kg: 15700,
  upHvsPct: 3,
  insheetCover: 7,
  insheetIsi: 30,
  tarifDesignCover: 20000,
  tarifDesignIsiPerHlm: 2500,
  tarifPrintCoverA3: 2500,
  tarifPrintIsiA3: 2000,
  tarifLaminasiGlossyCm2: 0.35,
  minLaminasi: 50000,
  tarifSusunPerPcs: 50,
  tarifStaplesPerPcs: 50,
  tarifSisirPerPcs: 80,
  tarifPackingKardus: 8500,
  tarifLakbanPerOrder: 8000,
  marginDefaultPct: 20,
  negoDefaultPct: 4,
};

export type BukuTulisUkuranType = '15,5 x 21' | '16 x 21';

// Konfigurasi fisik per ukuran
// ponytail: coverPcsPerA3 = berapa cover per lembar A3+ (33x48), leavesPerA3 = berapa lembar isi (A5) per A3
// 15,5x21 closed 31x21 open, 16x21 closed 32x21 open – beda tipis, 16x21 sedikit lebih boros (coverPcs 3 vs 4, leaves 12 vs 14)
export const BUKU_TULIS_CONFIG: Record<BukuTulisUkuranType, {
  w: number; h: number;
  coverPcsPerA3: number;
  leavesPerA3: number;
  description: string;
}> = {
  '15,5 x 21': {
    w: 15.5, h: 21,
    coverPcsPerA3: 4,
    leavesPerA3: 14,
    description: '15,5 x 21 cm (tertutup) · 72 hal / 18 lbr · Cover AC 230 gsm 4W 1Muka + Laminasi Glossy',
  },
  '16 x 21': {
    w: 16, h: 21,
    coverPcsPerA3: 3,
    leavesPerA3: 12,
    description: '16 x 21 cm (tertutup) · 72 hal / 18 lbr · Cover AC 230 gsm 4W 1Muka + Laminasi Glossy',
  },
};

export const BUKU_TULIS_TIERS: number[] = [
  20, 30, 50, 70, 100, 150, 200, 250, 300, 350, 400, 500,
  600, 650, 700, 750, 800, 850, 900, 950, 1000, 1500, 2000, 2500, 3000, 3500, 5000, 10000,
];

export interface BukuTulisSimulatorInput {
  oplah: number;
  ukuran: BukuTulisUkuranType;
  jumlahHalaman: number; // fixed 72, kept for extensibility
  opsiLaminasi: boolean;
  opsiSisir: boolean;
  marginPct: number;
  negoDiskonPct: number;
}

export interface BukuTulisBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface BukuTulisSimulatorResult {
  input: BukuTulisSimulatorInput;
  breakdown: BukuTulisBreakdownItem[];
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
  // A3+ 33 x 48 cm = 0.1584 m2
  return 0.1584 * gramatur / 1000;
}

export function calculateBukuTulisHpp(
  input: BukuTulisSimulatorInput,
  rawParams: BukuTulisMasterParams = DEFAULT_BUKU_TULIS_PARAMS
): BukuTulisSimulatorResult {
  const p: BukuTulisMasterParams = { ...DEFAULT_BUKU_TULIS_PARAMS, ...(rawParams || {}) };
  const { oplah, ukuran, jumlahHalaman = 72, opsiLaminasi = true, opsiSisir = true, marginPct, negoDiskonPct } = input;
  const validOplah = Math.max(1, oplah);
  const cfg = BUKU_TULIS_CONFIG[ukuran];
  const lbrIsiPerBuku = Math.ceil(jumlahHalaman / 4); // 72/4=18

  const breakdown: BukuTulisBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // 1. Kebutuhan Cover A3+
  const kebutuhanCoverA3 = Math.ceil(validOplah / cfg.coverPcsPerA3) + p.insheetCover;
  const beratCoverPerA3 = beratA3Kg(230);
  const biayaKertasCover = kebutuhanCoverA3 * beratCoverPerA3 * p.tarifArtCarton230Kg * (1 + p.upArtCartonPct / 100);
  add('Kertas Cover Art Carton 230 gsm', biayaKertasCover,
    `${kebutuhanCoverA3} lbr A3+ (${Math.ceil(validOplah / cfg.coverPcsPerA3)} + ${p.insheetCover} insheet) × Rp ${Math.round(beratCoverPerA3 * p.tarifArtCarton230Kg * (1 + p.upArtCartonPct / 100)).toLocaleString('id-ID')} (+${p.upArtCartonPct}%)`);

  const biayaPrintCover = kebutuhanCoverA3 * p.tarifPrintCoverA3;
  add('Cetak Cover Print A3+ 4W 1Muka', biayaPrintCover,
    `${kebutuhanCoverA3} lbr A3+ × Rp ${p.tarifPrintCoverA3.toLocaleString('id-ID')}`);

  // 2. Kebutuhan Isi A3+ (HVS 70 gsm, 1 warna bolak-balik)
  // ponytail: leavesPerA3 adalah berapa lembar isi A5 per lembar A3 (4-6 biasanya). Kebutuhan = ceil(oplah*18 / leavesPerA3) + insheetIsi
  // Untuk oplah >500, cetak isi pakai Oliver (lebih murah per lbr, + plat fixed) – disederhanakan jadi 60% tarif Ryobi + plat 180k jika >500
  const kebutuhanIsiA3Net = Math.ceil((validOplah * lbrIsiPerBuku) / cfg.leavesPerA3);
  const kebutuhanIsiA3 = kebutuhanIsiA3Net + p.insheetIsi;
  const beratIsiPerA3 = beratA3Kg(70);
  const biayaKertasIsi = kebutuhanIsiA3 * beratIsiPerA3 * p.tarifHvs70Kg * (1 + p.upHvsPct / 100);
  add('Kertas Isi HVS 70 gsm', biayaKertasIsi,
    `${kebutuhanIsiA3} lbr A3+ (${kebutuhanIsiA3Net} + ${p.insheetIsi} insheet, ${lbrIsiPerBuku} lbr/buku ÷ ${cfg.leavesPerA3}/A3) × Rp ${Math.round(beratIsiPerA3 * p.tarifHvs70Kg * (1 + p.upHvsPct / 100)).toLocaleString('id-ID')} (+${p.upHvsPct}%)`);

  // Cetak isi: Ryobi untuk ≤500, Oliver untuk >500 (ponytail: per cetak Oliver = 0.6x tarif Ryobi + plat fixed Rp 180k, O(n) naive – upgrade ke plat/drek dinamis jika butuh presisi)
  let biayaPrintIsi = 0;
  let ketPrintIsi = '';
  if (validOplah <= 500) {
    biayaPrintIsi = kebutuhanIsiA3 * p.tarifPrintIsiA3;
    ketPrintIsi = `${kebutuhanIsiA3} lbr A3+ × Rp ${p.tarifPrintIsiA3.toLocaleString('id-ID')} (Ryobi 1W)`;
  } else {
    const tarifOliverPerLbr = Math.round(p.tarifPrintIsiA3 * 0.6);
    const platOliverFixed = 180000; // 4 plat? 1W jadi 1 plat 45k, tapi pakai 180k untuk total cetak 1W Oliver incl. min order
    biayaPrintIsi = kebutuhanIsiA3 * tarifOliverPerLbr + platOliverFixed;
    ketPrintIsi = `${kebutuhanIsiA3} lbr A3+ × Rp ${tarifOliverPerLbr.toLocaleString('id-ID')} + Plat Oliver Rp ${platOliverFixed.toLocaleString('id-ID')} (Oliver 1W)`;
  }
  add('Cetak Isi 1W Bolak-Balik', biayaPrintIsi, ketPrintIsi);

  // 3. Desain
  const biayaDesainCover = p.tarifDesignCover;
  const biayaDesainIsi = p.tarifDesignIsiPerHlm * jumlahHalaman;
  add('Desain Cover + Isi', biayaDesainCover + biayaDesainIsi,
    `Cover Rp ${p.tarifDesignCover.toLocaleString('id-ID')} + Isi ${jumlahHalaman} hal × Rp ${p.tarifDesignIsiPerHlm.toLocaleString('id-ID')}`);

  // 4. Laminasi Glossy (opsional)
  if (opsiLaminasi) {
    // Luas bentangan cover terbuka: (w*2 + punggung 0.5) x (h + 1) estimasi
    const luasCoverCm2 = (cfg.w * 2 + 1) * (cfg.h + 1);
    const biayaLaminasiRaw = luasCoverCm2 * p.tarifLaminasiGlossyCm2 * validOplah;
    const biayaLaminasi = Math.max(p.minLaminasi, biayaLaminasiRaw);
    add('Laminasi Glossy Cover', biayaLaminasi,
      biayaLaminasiRaw < p.minLaminasi
        ? `Tarif Minimum Rp ${p.minLaminasi.toLocaleString('id-ID')}`
        : `${validOplah} pcs × ${luasCoverCm2.toFixed(1)} cm² × Rp ${p.tarifLaminasiGlossyCm2}/cm²`);
  }

  // 5. Finishing: Susun + Staples tengah + Lipat + Sisir + Packing
  const biayaSusun = validOplah * p.tarifSusunPerPcs;
  const biayaStaples = validOplah * p.tarifStaplesPerPcs;
  const biayaSisir = opsiSisir ? validOplah * p.tarifSisirPerPcs : 0;
  const finishingPerPcsTotal = p.tarifSusunPerPcs + p.tarifStaplesPerPcs + (opsiSisir ? p.tarifSisirPerPcs : 0);
  if (finishingPerPcsTotal > 0) {
    add('Finishing Susun + Staples + Sisir', biayaSusun + biayaStaples + biayaSisir,
      `${validOplah} pcs × Rp ${finishingPerPcsTotal} (Susun Rp ${p.tarifSusunPerPcs} + Staples Rp ${p.tarifStaplesPerPcs}${opsiSisir ? ` + Sisir Rp ${p.tarifSisirPerPcs}` : ''})`);
  }

  // Packing Kardus + Lakban (per order)
  const biayaPacking = p.tarifPackingKardus + p.tarifLakbanPerOrder;
  // ponytail: packing per order flat, upgrade ke per kardus @50 pcs jika volume besar
  add('Packing Kardus & Lakban', biayaPacking, '1 paket packing order');

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

export type SavedBukuTulisSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: BukuTulisSimulatorResult;
  paramsSnapshot?: BukuTulisMasterParams;
};
