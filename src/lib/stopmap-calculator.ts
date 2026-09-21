// ponytail: kalkulator dan master parameter Stopmap (07. Pricelist Stopmap)
// Referensi: Pricelist STOPMAP A4.xlsm, Pricelist STOPMAP FOLIO.xlsm, Pricelist Stopmap.xlsx sheet HARGA JULI 2026
// Art Carton 230 gsm 1 Muka Full Colour, Finishing: Sisir, Lipat, Kupingan Kantong, Ponz & Lem, Pasang Kupingan, Laminasi, Packing Kardus + Lakban.

export interface StopmapMasterParams {
  // A. Standar Upah & Kertas (Master!D8, Master!D12, Master!E12)
  standarUMR: number; // Master!D8 default Rp 2.818.585
  tarifArtCartonKg: number; // Master!D12 default Rp 16.400 /kg
  upArtCartonPct: number; // Master!E12 default 5%

  // B. Cetak Digital Print Inter (Master!D13, Master!D18)
  tarifPrintA3: number; // Master!D18 default Rp 2.500 / lbr A3+
  insheetCoverPrintInter: number; // Master!D13 (A4) default 5 lbr

  // C. Cetak Offset Oliver 4 Warna (Master!D13, BUKU!Y6, BUKU!AB6, BUKU!AC7)
  insheetCoverOliver: number; // Master!D13 (Folio) default 150 lbr
  tarifPlatOliver: number; // BUKU!Y6 default Rp 45.000 / plat
  minOrderOliver: number; // BUKU!AB6 default Rp 90.000 / plat (s.d. 1.000 drek)
  tarifDrekOverOliver: number; // BUKU!AC7 default Rp 40 per drek/warna (> 1.000 drek)

  // D. Desain & Transportasi (Master!D17, BUKU!AK6)
  tarifDesainA4: number; // Master!D17 (A4) default Rp 10.000
  tarifDesainFolio: number; // Master!D17 (Folio) default Rp 20.000
  tarifTransportA4: number; // BUKU!AK6 (A4) default Rp 0
  tarifTransportFolio: number; // BUKU!AK6 (Folio) default Rp 30.000

  // E. Bahan Kertas Kupingan / Kantong Map (BUKU!AN6, BUKU!AN7)
  kupinganPerPlano: number; // BUKU!AN6 default 15 pcs / plano 79x109
  insheetPlanoKupinganA4: number; // BUKU!AN7 (A4) default 3 plano
  insheetPlanoKupinganFolio: number; // BUKU!AN7 (Folio) default 8 plano
  biayaPisauPonzBaru: number; // BUKU!AQ6 default Rp 142.981 (jika pesan pisau baru)

  // F. Jasa Tangan & Finishing Tenaga UMR (BUKU!AL28, BUKU!AR28, BUKU!AU28, BUKU!AR6)
  targetLipatPerHari: number; // BUKU!AL28 default 4.000 pcs/hari
  targetPonzPerHari: number; // BUKU!AR28 default 2.000 pcs/hari
  biayaLemKupinganPerPcs: number; // BUKU!AR6 default Rp 50 / pcs
  targetPasangPerHari: number; // BUKU!AU28 default 500 pcs/hari

  // G. Finishing Laminasi (BUKU!AW6, BUKU!AZ6, BUKU!BC6, BUKU!AW7..BE7)
  tarifLaminasiGlossyCm2: number; // BUKU!AW6 default Rp 0.35 / cm²
  tarifLaminasiDoffCm2: number; // BUKU!AZ6 default Rp 0.40 / cm²
  tarifUvVarnishCm2: number; // BUKU!BC6 default Rp 0.12 / cm²
  minLaminasi: number; // BUKU!AW7..BE7 default Rp 50.000

  // H. Packing Kardus & Lakban (Master!D21, Master!D22, BUKU!BG30, BUKU!BG34, BUKU!BG6)
  kapasitasKardusBox: number; // BUKU!BG34 default 300 pcs / box
  tarifKardusBox: number; // Master!D22 default Rp 8.500 / box
  tarifLakbanRoll: number; // Master!D21 default Rp 8.000 / roll
  panjangLakbanRollCm: number; // BUKU!BG30 default 7.650 cm (90 yard)
  konsumsiLakbanPerKardusCm: number; // BUKU!BG6 default 196 cm / box

  // I. Margin & Nego (Master!E24, HARGA JULI 2026)
  marginDefaultPct: number; // Master!E24 default 30%
  negoDefaultPct: number; // Sheet HARGA JULI 2026 default 5%
}

export const DEFAULT_STOPMAP_PARAMS: StopmapMasterParams = {
  standarUMR: 2818585,
  tarifArtCartonKg: 16400,
  upArtCartonPct: 5,

  tarifPrintA3: 2500,
  insheetCoverPrintInter: 5,

  insheetCoverOliver: 150,
  tarifPlatOliver: 45000,
  minOrderOliver: 90000,
  tarifDrekOverOliver: 40,

  tarifDesainA4: 10000,
  tarifDesainFolio: 20000,
  tarifTransportA4: 0,
  tarifTransportFolio: 30000,

  kupinganPerPlano: 15,
  insheetPlanoKupinganA4: 3,
  insheetPlanoKupinganFolio: 8,
  biayaPisauPonzBaru: 142981,

  targetLipatPerHari: 4000,
  targetPonzPerHari: 2000,
  biayaLemKupinganPerPcs: 50,
  targetPasangPerHari: 500,

  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  tarifUvVarnishCm2: 0.12,
  minLaminasi: 50000,

  kapasitasKardusBox: 300,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,
  panjangLakbanRollCm: 7650,
  konsumsiLakbanPerKardusCm: 196,

  marginDefaultPct: 30,
  negoDefaultPct: 5,
};

export type StopmapUkuranType =
  | 'A4 (22 x 32 cm)'
  | 'A4 (22 x 31 cm)'
  | 'FOLIO (24 x 35 cm)';

export type StopmapMesinType = 'Auto' | 'PRINT INTER' | 'Oliver';
export type StopmapLaminasiType = 'Tanpa Laminasi' | 'Glossy' | 'Doff' | 'UV Varnish';

export const STOPMAP_CONFIG: Record<string, {
  w: number;
  h: number;
  label: string;
  isFolio: boolean;
  description: string;
}> = {
  'A4 (22 x 32 cm)': {
    w: 22,
    h: 32,
    label: 'A4 (22 x 32 cm)',
    isFolio: false,
    description: '22 x 32 cm (tertutup) · Bentangan 44 x 32 cm · Muat Digital A3+ & Offset Oliver',
  },
  'A4 (22 x 31 cm)': {
    w: 22,
    h: 32, // BUKU!D4 & F4 file master A4 menggunakan 22 x 32 cm
    label: 'A4 (22 x 32 cm)',
    isFolio: false,
    description: '22 x 32 cm (tertutup) · Bentangan 44 x 32 cm · Muat Digital A3+ & Offset Oliver',
  },
  'FOLIO (24 x 35 cm)': {
    w: 24,
    h: 35,
    label: 'FOLIO (24 x 35 cm)',
    isFolio: true,
    description: '24 x 35 cm (tertutup) · Bentangan 48 x 35 cm · Cetak Mesin Offset Oliver 4W',
  },
};

export const STOPMAP_TIERS: number[] = [
  10, 15, 20, 30, 40, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 500, 600, 700, 800, 1000, 1500, 2000, 2500, 3000,
];

export interface StopmapSimulatorInput {
  oplah: number;
  ukuran: StopmapUkuranType;
  mesin?: StopmapMesinType;
  laminasi?: StopmapLaminasiType;
  opsiPisauPonzBaru?: boolean;
  opsiKardusLakban?: boolean;
  marginPct?: number;
  negoDiskonPct?: number;
}

export interface StopmapBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface StopmapSimulatorResult {
  input: StopmapSimulatorInput;
  mesinTerpilih: 'PRINT INTER' | 'Oliver';
  breakdown: StopmapBreakdownItem[];
  kebutuhanPlanoCover: number;
  kebutuhanPlanoKupingan: number;
  totalHpp: number;
  hppPerPcs: number;
  hargaJualTensPerPcs: number; // Pembulatan puluhan (BUKU!BQ7: ROUNDUP(BP, -1))
  hargaJualPerPcs: number;     // Pembulatan ratusan (HARGA JULI 2026: ROUNDUP(HPP*1.3, -2))
  hargaNegoPerPcs: number;     // Nego pembulatan ratusan (HARGA JULI 2026: ROUNDUP(O-(O*5%), -2))
  totalHargaJual: number;
  totalHargaNego: number;
  profitPerPcs: number;
  profitNegoPerPcs: number;
  profitTotal: number;
  profitNegoTotal: number;
  marginPct: number;
  marginNegoPct: number;
}

export function calculateStopmapHpp(
  input: StopmapSimulatorInput,
  rawParams: StopmapMasterParams = DEFAULT_STOPMAP_PARAMS
): StopmapSimulatorResult {
  const p: StopmapMasterParams = { ...DEFAULT_STOPMAP_PARAMS, ...(rawParams || {}) };
  const {
    oplah,
    ukuran = 'A4 (22 x 32 cm)',
    mesin = 'Auto',
    laminasi = 'Glossy',
    opsiPisauPonzBaru = false,
    opsiKardusLakban = true,
    marginPct = p.marginDefaultPct,
    negoDiskonPct = p.negoDefaultPct,
  } = input;

  const validOplah = Math.max(1, oplah);
  const cfg = STOPMAP_CONFIG[ukuran] || STOPMAP_CONFIG['A4 (22 x 32 cm)'];
  const isFolio = cfg.isFolio;

  // Penentuan Mesin Cetak (Auto vs Manual)
  // Folio secara fisik tingginya 35 cm > 32.5 cm A3+, sehingga wajib Oliver.
  // A4 dapat dicetak di PRINT INTER (Auto untuk oplah <= 200) atau Oliver (Auto untuk oplah >= 250).
  let mesinTerpilih: 'PRINT INTER' | 'Oliver' = 'Oliver';
  if (isFolio) {
    mesinTerpilih = 'Oliver';
  } else if (mesin === 'PRINT INTER') {
    mesinTerpilih = 'PRINT INTER';
  } else if (mesin === 'Oliver') {
    mesinTerpilih = 'Oliver';
  } else {
    // Auto: A4 oplah <= 200 -> PRINT INTER, oplah >= 250 -> Oliver
    mesinTerpilih = validOplah <= 200 ? 'PRINT INTER' : 'Oliver';
  }

  const breakdown: StopmapBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // -------------------------------------------------------------
  // 1. KERTAS COVER & ONGKOS CETAK (BUKU!T7, BUKU!Y7, BUKU!AG7)
  // -------------------------------------------------------------
  // Hitung harga per lembar plano 79x109 Art Carton 230 gsm (BUKU!W29 & BUKU!W32)
  // BUKU!W29: ((79 * 109) * 230) / 20000 * ((tarifArtCartonKg * upArtCartonPct) + tarifArtCartonKg)
  const beratPlano79x109Kg = (79 * 109 * 230) / 20000; // 99.0265 kg per rim (500 lbr)
  const hargaPerKgNet = p.tarifArtCartonKg * (1 + p.upArtCartonPct / 100); // 17.220
  const hargaRimPlano79x109 = beratPlano79x109Kg * hargaPerKgNet; // 1.705.236,33
  const hargaLembarPlano79x109 = hargaRimPlano79x109 / 500; // 3.410,47266 (BUKU!W32)

  let kebutuhanPlanoCover = 0;

  if (mesinTerpilih === 'PRINT INTER') {
    // Cetak Digital Print Inter (BUKU!T7 = Master!D18 * R7)
    // Insheet cover: Master!D13 (A4) = 5 lembar
    const inCover = p.insheetCoverPrintInter;
    const r7 = validOplah + inCover; // BUKU!R7 lembar A3+
    kebutuhanPlanoCover = r7; // Lembar A3+
    const biayaKertasCover = p.tarifPrintA3 * r7;
    add(
      'Cetak Cover Print Inter A3+ (4W)',
      biayaKertasCover,
      `BUKU!T7: ${r7} lbr A3+ (${validOplah} + ${inCover} insheet) × Rp ${p.tarifPrintA3.toLocaleString('id-ID')}`
    );
  } else {
    // Offset Heidelberg Oliver 4 Warna (BUKU!T7, BUKU!Y7, BUKU!AG7)
    // 1 lembar plano 79x109 potong 4 stopmap (BUKU!O7 = 4, BUKU!P7 = 4)
    const inCover = p.insheetCoverOliver; // Master!D13 (Folio) = 150 lembar
    const r7 = (validOplah / 4) + (inCover / 4); // BUKU!R7 jumlah lembar plano
    kebutuhanPlanoCover = r7;
    const biayaKertasCover = hargaLembarPlano79x109 * r7; // BUKU!T7
    add(
      'Bahan Kertas Cover Art Carton 230 gsm',
      biayaKertasCover,
      `BUKU!T7: ${r7.toFixed(2)} lbr plano 79×109 (${validOplah}/4 + ${inCover}/4 insheet) × Rp ${Math.round(hargaLembarPlano79x109).toLocaleString('id-ID')}`
    );

    // BUKU!Y7: Plate Cetak 4 Warna
    const biayaPlat = 4 * p.tarifPlatOliver;
    add(
      'Plat Cetak Oliver (4 Warna)',
      biayaPlat,
      `BUKU!Y7: 4 plat × Rp ${p.tarifPlatOliver.toLocaleString('id-ID')}`
    );

    // BUKU!AG7: Ongkos Cetak Oliver (Min Order 1.000 drek + Drek Over)
    const q7 = r7 * 4; // BUKU!Q7 total drek mesin cetak
    const drekOver = Math.max(0, q7 - 1000); // BUKU!AE7
    const ongkosOver = drekOver * p.tarifDrekOverOliver * 4; // BUKU!AF7 (4 warna)
    const ongkosDasar = 4 * p.minOrderOliver; // BUKU!AD7
    const totalOngkosCetak = ongkosDasar + ongkosOver;
    const ketCetak = drekOver > 0
      ? `BUKU!AG7: Min Order Rp ${ongkosDasar.toLocaleString('id-ID')} + ${drekOver.toFixed(0)} drek over × Rp ${p.tarifDrekOverOliver} × 4W (Rp ${Math.round(ongkosOver).toLocaleString('id-ID')})`
      : `BUKU!AG7: Min Order 4 plat × Rp ${p.minOrderOliver.toLocaleString('id-ID')}`;
    add('Ongkos Cetak Oliver 4 Warna', totalOngkosCetak, ketCetak);
  }

  // -------------------------------------------------------------
  // 2. DESAIN & TRANSPORTASI (BUKU!V7, BUKU!AK7)
  // -------------------------------------------------------------
  const tarifDesain = isFolio ? p.tarifDesainFolio : p.tarifDesainA4; // Master!D17
  if (tarifDesain > 0) {
    add('Desain Cover', tarifDesain, `BUKU!V7: Biaya setting desain ${cfg.label}`);
  }

  const tarifTransport = isFolio ? p.tarifTransportFolio : p.tarifTransportA4; // BUKU!AK6
  if (tarifTransport > 0) {
    add('Ongkos Transportasi', tarifTransport, `BUKU!AK7: Biaya kirim/transport ${cfg.label}`);
  }

  // -------------------------------------------------------------
  // 3. BAHAN KERTAS KUPINGAN / KANTONG MAP (BUKU!AN7, BUKU!AO7)
  // -------------------------------------------------------------
  // 1 lembar plano 79x109 menghasilkan 15 kupingan (BUKU!AN6)
  // Insheet plano kupingan: A4 = 3 plano, Folio = 8 plano (BUKU!AN7)
  const inKupinganPlano = isFolio ? p.insheetPlanoKupinganFolio : p.insheetPlanoKupinganA4;
  const an7 = Math.ceil((validOplah / p.kupinganPerPlano) + inKupinganPlano);
  const kebutuhanPlanoKupingan = an7;
  const biayaKupingan = an7 * hargaLembarPlano79x109; // BUKU!AO7
  add(
    'Bahan Kupingan (Art Carton 230 gsm)',
    biayaKupingan,
    `BUKU!AO7: ${an7} lbr plano 79×109 (isi ${p.kupinganPerPlano}/plano + ${inKupinganPlano} plano insheet) × Rp ${Math.round(hargaLembarPlano79x109).toLocaleString('id-ID')}`
  );

  // -------------------------------------------------------------
  // 4. JASA FINISHING TENAGA UMR (BUKU!AL7, BUKU!AR7, BUKU!AU7, BUKU!AQ7)
  // -------------------------------------------------------------
  // BUKU!AL7: Lipat Stopmap = (UMR / 25 / targetLipat) * oplah
  const tarifLipatPerPcs = (p.standarUMR / 25) / p.targetLipatPerHari; // BUKU!AL6 (28.18585)
  const biayaLipat = validOplah * tarifLipatPerPcs;
  add(
    'Jasa Lipat Stopmap',
    biayaLipat,
    `BUKU!AL7: ${validOplah} pcs × Rp ${tarifLipatPerPcs.toFixed(2)} (UMR/25/${p.targetLipatPerHari.toLocaleString('id-ID')} target)`
  );

  // BUKU!AQ7: Pisau Ponz Kupingan (Jika buat pisau baru BUKU!AQ26 = '√')
  if (opsiPisauPonzBaru && p.biayaPisauPonzBaru > 0) {
    add(
      'Pembuatan Pisau Ponz Kupingan',
      p.biayaPisauPonzBaru,
      `BUKU!AQ7: Pembuatan pisau ponz bentuk baru`
    );
  }

  // BUKU!AR7: Ponz Kupingan + Biaya Lem = ((UMR / 25 / targetPonz) + biayaLemKupinganPerPcs) * oplah
  const tarifPonzLemPerPcs = ((p.standarUMR / 25) / p.targetPonzPerHari) + p.biayaLemKupinganPerPcs; // BUKU!AR6 (106.3717)
  const biayaPonzLem = validOplah * tarifPonzLemPerPcs;
  add(
    'Ponz Kupingan & Biaya Lem',
    biayaPonzLem,
    `BUKU!AR7: ${validOplah} pcs × Rp ${tarifPonzLemPerPcs.toFixed(2)} (Ponz UMR + Lem Rp ${p.biayaLemKupinganPerPcs})`
  );

  // BUKU!AU7: Pasang Kupingan ke Map = (UMR / 25 / targetPasang) * oplah
  const tarifPasangPerPcs = (p.standarUMR / 25) / p.targetPasangPerHari; // BUKU!AU6 (225.4868)
  const biayaPasang = validOplah * tarifPasangPerPcs;
  add(
    'Pasang Kupingan ke Stopmap',
    biayaPasang,
    `BUKU!AU7: ${validOplah} pcs × Rp ${tarifPasangPerPcs.toFixed(2)} (UMR/25/${p.targetPasangPerHari} target)`
  );

  // -------------------------------------------------------------
  // 5. FINISHING LAMINASI (BUKU!AW7..BE7)
  // -------------------------------------------------------------
  let biayaLaminasi = 0;
  let labelLaminasi = '';
  let ketLaminasi = '';

  if (laminasi === 'Glossy') {
    // BUKU!AW7: Luas bentangan (w * 2) * h cm²
    const luasCm2 = (cfg.w * 2) * cfg.h; // A4: 44x32=1408, Folio: 48x35=1680
    const rawLam = luasCm2 * p.tarifLaminasiGlossyCm2 * validOplah;
    biayaLaminasi = Math.max(p.minLaminasi, rawLam); // BUKU!AX7
    labelLaminasi = 'Laminasi Glossy 1 Muka';
    ketLaminasi = rawLam < p.minLaminasi
      ? `BUKU!AX7: Tarif Minimum Order Rp ${p.minLaminasi.toLocaleString('id-ID')}`
      : `BUKU!AX7: ${validOplah} pcs × ${luasCm2} cm² × Rp ${p.tarifLaminasiGlossyCm2}/cm²`;
  } else if (laminasi === 'Doff') {
    // BUKU!AZ7: Luas bentangan dengan bleed ((w * 2) + 1) * (h + 1) cm²
    const luasCm2 = ((cfg.w * 2) + 1) * (cfg.h + 1); // A4: 45x33=1485, Folio: 49x36=1764
    const rawLam = luasCm2 * p.tarifLaminasiDoffCm2 * validOplah;
    biayaLaminasi = Math.max(p.minLaminasi, rawLam); // BUKU!BA7
    labelLaminasi = 'Laminasi Doff 1 Muka';
    ketLaminasi = rawLam < p.minLaminasi
      ? `BUKU!BA7: Tarif Minimum Order Rp ${p.minLaminasi.toLocaleString('id-ID')}`
      : `BUKU!BA7: ${validOplah} pcs × ${luasCm2} cm² × Rp ${p.tarifLaminasiDoffCm2}/cm²`;
  } else if (laminasi === 'UV Varnish') {
    // BUKU!BC7: Luas bentangan dengan bleed ((w * 2) + 1) * (h + 1) cm²
    const luasCm2 = ((cfg.w * 2) + 1) * (cfg.h + 1);
    const rawLam = luasCm2 * p.tarifUvVarnishCm2 * validOplah;
    biayaLaminasi = Math.max(p.minLaminasi, rawLam); // BUKU!BD7
    labelLaminasi = 'Finishing UV Varnish';
    ketLaminasi = rawLam < p.minLaminasi
      ? `BUKU!BD7: Tarif Minimum Order Rp ${p.minLaminasi.toLocaleString('id-ID')}`
      : `BUKU!BD7: ${validOplah} pcs × ${luasCm2} cm² × Rp ${p.tarifUvVarnishCm2}/cm²`;
  }

  if (biayaLaminasi > 0) {
    add(labelLaminasi, biayaLaminasi, ketLaminasi);
  }

  // -------------------------------------------------------------
  // 6. PACKING KARDUS & LAKBAN (BUKU!BI7)
  // -------------------------------------------------------------
  if (opsiKardusLakban) {
    // Lakban: BUKU!BH7 = p.tarifLakbanRoll * ((oplah / kapasitasKardus) / (panjangRoll / konsumsiLakban))
    const rasioLakban = p.panjangLakbanRollCm / p.konsumsiLakbanPerKardusCm; // 7650 / 196 = 39.030612
    const kardusFloat = validOplah / p.kapasitasKardusBox;
    const biayaLakban = (kardusFloat / rasioLakban) * p.tarifLakbanRoll;

    // Kardus: BUKU!BI7 bagian kardus = ROUNDUP(oplah / kapasitasKardus, 0) * tarifKardusBox
    const jumlahKardus = Math.ceil(validOplah / p.kapasitasKardusBox);
    const biayaKardus = jumlahKardus * p.tarifKardusBox;
    const totalPacking = biayaLakban + biayaKardus;

    add(
      'Packing Kardus & Lakban',
      totalPacking,
      `BUKU!BI7: ${jumlahKardus} box kardus (isi ${p.kapasitasKardusBox} pcs) × Rp ${p.tarifKardusBox.toLocaleString('id-ID')} + lakban Rp ${Math.round(biayaLakban).toLocaleString('id-ID')}`
    );
  }

  // Hitung persentase kontribusi per item
  breakdown.forEach((b) => {
    b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0;
  });

  // -------------------------------------------------------------
  // 7. TOTAL HPP, MARGIN & HARGA JUAL (BUKU!BK..BQ, HARGA JULI 2026)
  // -------------------------------------------------------------
  const hppPerPcs = validOplah > 0 ? totalHpp / validOplah : 0; // BUKU!BL7

  // BUKU!BQ7: Pembulatan puluhan Excel Master BUKU = ROUNDUP(BP7, -1)
  const hargaJualTensPerPcs = Math.ceil((totalHpp * (1 + marginPct / 100) / validOplah) / 10) * 10;

  // Sheet HARGA JULI 2026: Pembulatan ratusan = ROUNDUP(HPP * (1 + marginPct/100), -2)
  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + marginPct / 100)) / 100) * 100;

  // Sheet HARGA JULI 2026: Nego Diskon = ROUNDUP(HargaJual - (HargaJual * negoDiskonPct%), -2)
  const hargaNegoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 100) * 100;

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
    mesinTerpilih,
    breakdown,
    kebutuhanPlanoCover,
    kebutuhanPlanoKupingan,
    totalHpp: Math.round(totalHpp),
    hppPerPcs,
    hargaJualTensPerPcs,
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
