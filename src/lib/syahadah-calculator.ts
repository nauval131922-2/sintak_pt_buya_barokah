// ponytail: kalkulator dan master parameter Syahadah (08. Pricelist Syahadah)
// Referensi: Pricelist Syahadah.xlsx sheet HARGA JULI 2026 & 11 File Master Source/*.xlsm sheet BUKU
// Bahan: Linen / Hammer Crem Tebal 300 gsm (Rp 29.900/kg)
// Varian: 1 Muka & 2 Muka (FC, 1 Warna, 2 Warna)
// Mesin: Print Inter (POD A3+), Ryobi (Offset Toko 11-up plano), Oliver (Offset 4W)
// Finishing: Potong Sisir, Foil Emas (Opsional), Laminasi (Opsional), Packing Kardus & Lakban

export interface SyahadahMasterParams {
  // A. Standar Upah & Kertas (Master!D8, Master!D12, Master!E12)
  standarUMR: number; // Master!D8 default Rp 2.818.585
  tarifKertasLinenKg: number; // Master!D12 default Rp 29.900 /kg (Hammer Crem / Linen 300 gsm)
  upKertasPct: number; // Master!E12 default 0%

  // B. Cetak Digital POD Print Inter (Master!D18, Master!D13)
  tarifPrintA3: number; // Master!D18 default Rp 3.800 / lbr A3+
  insheetPod: number; // Master!D13 (Print Inter) default 5 lbr A3+

  // C. Cetak Offset Ryobi (BUKU!Y6, BUKU!AB6, BUKU!AC7, Master!D13)
  insheetRyobi: number; // Master!D13 (Ryobi) default 50 lbr folio
  tarifPlatRyobi: number; // BUKU!Y6 default Rp 10.000 / plat
  minOrderRyobi: number; // BUKU!AB6 default Rp 15.000 / plat (s.d. 500 drek)
  tarifDrekOverRyobi: number; // BUKU!AC7 default Rp 30 per drek/warna (> 500 drek)
  syahadahPerPlanoRyobi: number; // BUKU!O15/P16 default 11 lbr folio / plano 79x109

  // D. Cetak Offset Oliver (BUKU!Y6, BUKU!AB6, BUKU!AC7)
  tarifPlatOliver: number; // BUKU!Y6 default Rp 43.000 / plat
  minOrderOliver: number; // BUKU!AB6 default Rp 90.000 / plat (s.d. 1.000 drek)
  tarifDrekOverOliver: number; // BUKU!AC7 default Rp 40 per drek/warna (> 1.000 drek)

  // E. Desain Artwork & Potong Sisir (Master!D17, BUKU!AS6)
  tarifDesign: number; // Master!D17 default Rp 20.000 per order
  tarifSisirPer500: number; // BUKU!AS6 default Rp 5.000 per 500 pcs

  // F. Finishing Foil Emas (BUKU!AN6, BUKU!AO6, HARGA JULI 2026)
  tarifKliseMasterFoil: number; // BUKU!AN6 default Rp 53.200 per muka (min. 50.000)
  tarifFoilPerPcs: number; // HARGA JULI 2026 catatan: Rp 450 / pcs
  minOrderFoil: number; // HARGA JULI 2026 catatan: min. Rp 100.000

  // G. Finishing Laminasi (BUKU!AU6, BUKU!AX6, BUKU!BA6, BUKU!AW7..BC7)
  tarifLaminasiGlossyCm2: number; // BUKU!AU6 default Rp 0.35 / cm²
  tarifLaminasiDoffCm2: number; // BUKU!AX6 default Rp 0.40 / cm²
  tarifUvVarnishCm2: number; // BUKU!BA6 default Rp 0.12 / cm²
  minLaminasi: number; // BUKU!AW7..BC7 default Rp 50.000

  // H. Packing Kardus & Lakban (Master!D21, Master!D22, BUKU!BE35, BUKU!BF30)
  kapasitasKardusBox: number; // BUKU!BE35 default 1.000 pcs / box
  tarifKardusBox: number; // Master!D22 default Rp 8.500 / box
  tarifLakbanRoll: number; // Master!D21 default Rp 8.000 / roll
  panjangLakbanRollCm: number; // BUKU!BF30 default 7.650 cm (90 yard)
  konsumsiLakbanPerBoxCm: number; // BUKU!BE6 default 196 cm / box

  // I. Margin & Nego (Master!E24, HARGA JULI 2026)
  marginDefaultPct: number; // Master!E24 default 30%
  negoDefaultPct: number; // HARGA JULI 2026 default 5%
}

export const DEFAULT_SYAHADAH_PARAMS: SyahadahMasterParams = {
  standarUMR: 2818585,
  tarifKertasLinenKg: 29900,
  upKertasPct: 0,

  tarifPrintA3: 3800,
  insheetPod: 5,

  insheetRyobi: 50,
  tarifPlatRyobi: 10000,
  minOrderRyobi: 15000,
  tarifDrekOverRyobi: 30,
  syahadahPerPlanoRyobi: 11,

  tarifPlatOliver: 43000,
  minOrderOliver: 90000,
  tarifDrekOverOliver: 40,

  tarifDesign: 20000,
  tarifSisirPer500: 5000,

  tarifKliseMasterFoil: 53200,
  tarifFoilPerPcs: 450,
  minOrderFoil: 100000,

  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  tarifUvVarnishCm2: 0.12,
  minLaminasi: 50000,

  kapasitasKardusBox: 1000,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,
  panjangLakbanRollCm: 7650,
  konsumsiLakbanPerBoxCm: 196,

  marginDefaultPct: 30,
  negoDefaultPct: 5,
};

export type SyahadahUkuranType = '21,5 x 33 cm' | '21 x 29,7 cm';

export type SyahadahVarianType =
  | '1 Muka FC'
  | '1 Muka 1 Warna'
  | '1 Muka 2 Warna'
  | '2 Muka FC'
  | '2 Muka 1 Warna'
  | '2 Muka 2 Warna';

export type SyahadahMesinType = 'Auto' | 'Print Inter' | 'Ryobi' | 'Oliver';
export type SyahadahLaminasiType = 'Tanpa Laminasi' | 'Glossy' | 'Doff' | 'UV Varnish';

export const SYAHADAH_VARIANTS: SyahadahVarianType[] = [
  '1 Muka FC',
  '1 Muka 1 Warna',
  '1 Muka 2 Warna',
  '2 Muka FC',
  '2 Muka 1 Warna',
  '2 Muka 2 Warna',
];

export const SYAHADAH_CONFIG: Record<SyahadahVarianType, {
  muka: 1 | 2;
  warna: number; // 4 = FC, 1 = 1W, 2 = 2W
  isFC: boolean;
  label: string;
  description: string;
}> = {
  '1 Muka FC': {
    muka: 1,
    warna: 4,
    isFC: true,
    label: '1 Muka Full Colour',
    description: '1 Muka Full Colour · Kertas Linen/Hammer Crem Tebal 300 gsm',
  },
  '1 Muka 1 Warna': {
    muka: 1,
    warna: 1,
    isFC: false,
    label: '1 Muka 1 Warna',
    description: '1 Muka 1 Warna (Hitam/Spot) · Kertas Linen/Hammer Crem Tebal 300 gsm',
  },
  '1 Muka 2 Warna': {
    muka: 1,
    warna: 2,
    isFC: false,
    label: '1 Muka 2 Warna',
    description: '1 Muka 2 Warna (Dua Warna) · Kertas Linen/Hammer Crem Tebal 300 gsm',
  },
  '2 Muka FC': {
    muka: 2,
    warna: 4,
    isFC: true,
    label: '2 Muka Full Colour',
    description: '2 Muka Bolak-Balik Full Colour · Kertas Linen/Hammer Crem Tebal 300 gsm',
  },
  '2 Muka 1 Warna': {
    muka: 2,
    warna: 1,
    isFC: false,
    label: '2 Muka 1 Warna',
    description: '2 Muka Bolak-Balik 1 Warna · Kertas Linen/Hammer Crem Tebal 300 gsm',
  },
  '2 Muka 2 Warna': {
    muka: 2,
    warna: 2,
    isFC: false,
    label: '2 Muka 2 Warna',
    description: '2 Muka Bolak-Balik 2 Warna · Kertas Linen/Hammer Crem Tebal 300 gsm',
  },
};

export const SYAHADAH_TIERS: number[] = [
  5, 10, 20, 30, 40, 50, 75, 100, 200, 250, 300, 400, 500, 600, 700, 800, 1000, 1500, 2000, 2500, 3000,
];

export interface SyahadahSimulatorInput {
  oplah: number;
  varian: SyahadahVarianType;
  ukuran?: SyahadahUkuranType;
  mesin?: SyahadahMesinType;
  laminasi?: SyahadahLaminasiType;
  opsiFoil?: boolean;
  opsiKardusLakban?: boolean;
  marginPct?: number;
  negoDiskonPct?: number;
}

export interface SyahadahBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface SyahadahSimulatorResult {
  input: SyahadahSimulatorInput;
  mesinTerpilih: 'Print Inter' | 'Ryobi' | 'Oliver';
  breakdown: SyahadahBreakdownItem[];
  kebutuhanLembarCetak: number;
  totalHpp: number;
  hppPerPcs: number;
  hargaJualTensPerPcs: number; // Pembulatan puluhan (BUKU!BO7)
  hargaJualPerPcs: number;     // Pembulatan ratusan (HARGA JULI 2026: ROUNDUP((HPP*30%)+HPP, -2))
  hargaNegoPerPcs: number;     // Nego pembulatan ratusan (HARGA JULI 2026)
  totalHargaJual: number;
  totalHargaNego: number;
  profitPerPcs: number;
  profitNegoPerPcs: number;
  profitTotal: number;
  profitNegoTotal: number;
  marginPct: number;
  marginNegoPct: number;
}

export function calculateSyahadahHpp(
  input: SyahadahSimulatorInput,
  rawParams: SyahadahMasterParams = DEFAULT_SYAHADAH_PARAMS
): SyahadahSimulatorResult {
  const p: SyahadahMasterParams = { ...DEFAULT_SYAHADAH_PARAMS, ...(rawParams || {}) };
  const {
    oplah,
    varian = '1 Muka FC',
    ukuran = '21,5 x 33 cm',
    mesin = 'Auto',
    laminasi = 'Tanpa Laminasi',
    opsiFoil = false,
    opsiKardusLakban = oplah >= 250,
    marginPct = p.marginDefaultPct,
    negoDiskonPct = p.negoDefaultPct,
  } = input;

  const validOplah = Math.max(1, oplah);
  const cfg = SYAHADAH_CONFIG[varian] || SYAHADAH_CONFIG['1 Muka FC'];
  const isFC = cfg.isFC;

  // 1. Penentuan Mesin Cetak (Auto vs Manual)
  // Sesuai Sheet HARGA JULI 2026 & Master Excel:
  // - FC selalu Print Inter (POD) untuk oplah <= 500, atau Oliver untuk oplah besar.
  // - 1W & 2W: Oplah <= 200 menggunakan Print Inter (POD), oplah >= 250 menggunakan Ryobi.
  let mesinTerpilih: 'Print Inter' | 'Ryobi' | 'Oliver' = 'Print Inter';
  if (mesin === 'Print Inter') {
    mesinTerpilih = 'Print Inter';
  } else if (mesin === 'Ryobi') {
    mesinTerpilih = 'Ryobi';
  } else if (mesin === 'Oliver') {
    mesinTerpilih = 'Oliver';
  } else {
    // Auto recommendation:
    if (isFC) {
      mesinTerpilih = validOplah <= 500 ? 'Print Inter' : 'Oliver';
    } else {
      mesinTerpilih = validOplah <= 200 ? 'Print Inter' : 'Ryobi';
    }
  }

  const breakdown: SyahadahBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  let kebutuhanLembarCetak = 0;

  // -------------------------------------------------------------
  // 1. BAHAN KERTAS & ONGKOS CETAK (BUKU!T7, BUKU!Y7, BUKU!AG7)
  // -------------------------------------------------------------
  if (mesinTerpilih === 'Print Inter') {
    // POD Digital Print Inter (BUKU!T7 = Q7 * T2)
    // 1 lembar A3+ (32.5x48) muat 2 lembar Syahadah folio (BUKU!P7 = 2, BUKU!O7 = 1)
    const r7 = Math.ceil((validOplah / 2) + p.insheetPod); // BUKU!R7 lembar A3+
    const q7 = r7 * 1 * cfg.muka; // BUKU!Q7 drek A3+
    kebutuhanLembarCetak = r7;
    const biayaKertasCetak = q7 * p.tarifPrintA3; // BUKU!T7
    add(
      `Cetak Digital Print Inter A3+ (${cfg.muka} Muka ${cfg.isFC ? 'FC' : cfg.warna + ' Warna'})`,
      biayaKertasCetak,
      `BUKU!T7: ${r7} lbr A3+ (${validOplah}/2 + ${p.insheetPod} insh) × ${cfg.muka} muka × Rp ${p.tarifPrintA3.toLocaleString('id-ID')}`
    );
  } else if (mesinTerpilih === 'Ryobi') {
    // Offset Toko / Ryobi (BUKU!T7, BUKU!Y7, BUKU!AG7)
    // 1 lembar plano 79x109 dipotong jadi 11 lembar folio 21.5x33 (BUKU!O7 = 11, BUKU!P7 = 11)
    // W29 = ((79*109)*300)/20000 * tarifKertasLinenKg * (1 + upKertasPct)
    const beratPlanoRim = (79 * 109 * 300) / 20000; // 129.165 kg/rim
    const hargaPlanoRim = beratPlanoRim * (p.tarifKertasLinenKg * (1 + p.upKertasPct / 100)); // 3.862.033.5
    const hargaPlanoLbr = hargaPlanoRim / 500; // 7.724,067 (BUKU!W32)

    const r7 = Math.ceil((validOplah / p.syahadahPerPlanoRyobi) + (p.insheetRyobi / p.syahadahPerPlanoRyobi)); // BUKU!R7 lembar plano
    kebutuhanLembarCetak = r7;
    const biayaKertas = r7 * hargaPlanoLbr; // BUKU!T7
    add(
      'Bahan Kertas Linen/Hammer Crem 300 gsm',
      biayaKertas,
      `BUKU!T7: ${r7} lbr plano 79×109 (${validOplah}/${p.syahadahPerPlanoRyobi} + ${p.insheetRyobi}/${p.syahadahPerPlanoRyobi} insh) × Rp ${Math.round(hargaPlanoLbr).toLocaleString('id-ID')}`
    );

    // BUKU!Y7: Plate Cetak Ryobi (Rp 10.000 / plat)
    const jmlPlat = cfg.warna * cfg.muka; // BUKU!Z7
    const biayaPlat = jmlPlat * p.tarifPlatRyobi; // BUKU!Y7
    add(
      `Plat Cetak Ryobi (${jmlPlat} Plat)`,
      biayaPlat,
      `BUKU!Y7: ${jmlPlat} plat (${cfg.warna}W × ${cfg.muka} muka) × Rp ${p.tarifPlatRyobi.toLocaleString('id-ID')}`
    );

    // BUKU!AG7: Ongkos Cetak Ryobi (Min Order Rp 15.000/plat + drek over Rp 30/drek/warna)
    const q7 = r7 * p.syahadahPerPlanoRyobi * cfg.muka; // BUKU!Q7
    const ongkosDasar = jmlPlat * p.minOrderRyobi; // BUKU!AD7
    const drekOver = Math.max(0, q7 - 500); // BUKU!AE7
    const ongkosOver = drekOver * p.tarifDrekOverRyobi * cfg.warna; // BUKU!AF7
    const totalOngkosCetak = ongkosDasar + ongkosOver; // BUKU!AG7
    const ketCetak = drekOver > 0
      ? `BUKU!AG7: Dasar Rp ${ongkosDasar.toLocaleString('id-ID')} + ${drekOver} drek over × Rp ${p.tarifDrekOverRyobi} × ${cfg.warna}W (Rp ${Math.round(ongkosOver).toLocaleString('id-ID')})`
      : `BUKU!AG7: Min Order ${jmlPlat} plat × Rp ${p.minOrderRyobi.toLocaleString('id-ID')}`;
    add('Ongkos Cetak Ryobi', totalOngkosCetak, ketCetak);
  } else {
    // Offset Oliver (BUKU!T7, BUKU!Y7, BUKU!AG7)
    // 1 lembar plano 79x109 dipotong 5 lembar untuk Oliver (BUKU!O15 = 5, P16 = 10)
    const beratPlanoRim = (79 * 109 * 300) / 20000;
    const hargaPlanoRim = beratPlanoRim * (p.tarifKertasLinenKg * (1 + p.upKertasPct / 100));
    const hargaPlanoLbr = hargaPlanoRim / 500;

    const inCover = 100;
    const r7 = Math.ceil((validOplah / 10) + (inCover / 5));
    kebutuhanLembarCetak = r7;
    const biayaKertas = r7 * hargaPlanoLbr;
    add(
      'Bahan Kertas Linen/Hammer Crem 300 gsm',
      biayaKertas,
      `BUKU!T7: ${r7} lbr plano 79×109 × Rp ${Math.round(hargaPlanoLbr).toLocaleString('id-ID')}`
    );

    const jmlPlat = cfg.warna * cfg.muka;
    const biayaPlat = jmlPlat * p.tarifPlatOliver;
    add(
      `Plat Cetak Oliver (${jmlPlat} Plat)`,
      biayaPlat,
      `BUKU!Y7: ${jmlPlat} plat × Rp ${p.tarifPlatOliver.toLocaleString('id-ID')}`
    );

    const q7 = r7 * 5 * cfg.muka;
    const ongkosDasar = jmlPlat * p.minOrderOliver;
    const drekOver = Math.max(0, q7 - 1000);
    const ongkosOver = drekOver * p.tarifDrekOverOliver * cfg.warna;
    const totalOngkosCetak = ongkosDasar + ongkosOver;
    add('Ongkos Cetak Oliver', totalOngkosCetak, `BUKU!AG7: Min Order Dasar + Over Cetak`);
  }

  // -------------------------------------------------------------
  // 2. DESAIN ARTWORK & POTONG SISIR (BUKU!V7, BUKU!AS7)
  // -------------------------------------------------------------
  if (p.tarifDesign > 0) {
    add('Desain Artwork Syahadah', p.tarifDesign, 'BUKU!V7: Biaya setting layout desain sertifikat/syahadah');
  }

  // BUKU!AS7: Ongkos Potong Sisir = ROUNDUP(oplah / 500, 0) * 5.000
  const biayaSisir = Math.ceil(validOplah / 500) * p.tarifSisirPer500;
  add(
    'Potong Sisir',
    biayaSisir,
    `BUKU!AS7: ${Math.ceil(validOplah / 500)} paket (per 500 pcs) × Rp ${p.tarifSisirPer500.toLocaleString('id-ID')}`
  );

  // -------------------------------------------------------------
  // 3. FINISHING FOIL EMAS OPSIONAL (BUKU!AP7 / HARGA JULI 2026)
  // -------------------------------------------------------------
  if (opsiFoil) {
    // Sesuai Catatan Sheet HARGA JULI 2026: Tambahan Rp 450/pcs (min. Rp 100.000) belum termasuk Master Foil Rp 53.200
    const rawFoil = validOplah * p.tarifFoilPerPcs;
    const ongkosFoil = Math.max(p.minOrderFoil, rawFoil);
    const kliseFoil = p.tarifKliseMasterFoil * cfg.muka;
    const totalFoil = ongkosFoil + kliseFoil;
    add(
      'Finishing Foil Emas (Hotprint)',
      totalFoil,
      `HARGA JULI 2026: Hotprint Rp ${p.tarifFoilPerPcs}/pcs (min. Rp ${p.minOrderFoil.toLocaleString('id-ID')}) + Klise Foil Rp ${kliseFoil.toLocaleString('id-ID')}`
    );
  }

  // -------------------------------------------------------------
  // 4. FINISHING LAMINASI OPSIONAL (BUKU!AW7..BC7)
  // -------------------------------------------------------------
  const dimW = ukuran.includes('21 x 29,7') ? 21 : 21.5;
  const dimH = ukuran.includes('21 x 29,7') ? 29.7 : 33;
  const luasCm2 = (dimW + 1) * (dimH + 1);

  if (laminasi === 'Glossy') {
    const rawLam = luasCm2 * p.tarifLaminasiGlossyCm2 * validOplah;
    const biayaLam = Math.max(p.minLaminasi, rawLam);
    add(
      'Laminasi Glossy 1 Muka',
      biayaLam,
      rawLam < p.minLaminasi
        ? `BUKU!AW7: Tarif Minimum Order Rp ${p.minLaminasi.toLocaleString('id-ID')}`
        : `BUKU!AW7: ${validOplah} pcs × ${luasCm2.toFixed(1)} cm² × Rp ${p.tarifLaminasiGlossyCm2}/cm²`
    );
  } else if (laminasi === 'Doff') {
    const rawLam = luasCm2 * p.tarifLaminasiDoffCm2 * validOplah;
    const biayaLam = Math.max(p.minLaminasi, rawLam);
    add(
      'Laminasi Doff 1 Muka',
      biayaLam,
      rawLam < p.minLaminasi
        ? `BUKU!AZ7: Tarif Minimum Order Rp ${p.minLaminasi.toLocaleString('id-ID')}`
        : `BUKU!AZ7: ${validOplah} pcs × ${luasCm2.toFixed(1)} cm² × Rp ${p.tarifLaminasiDoffCm2}/cm²`
    );
  } else if (laminasi === 'UV Varnish') {
    const rawLam = luasCm2 * p.tarifUvVarnishCm2 * validOplah;
    const biayaLam = Math.max(p.minLaminasi, rawLam);
    add(
      'Finishing UV Varnish',
      biayaLam,
      rawLam < p.minLaminasi
        ? `BUKU!BC7: Tarif Minimum Order Rp ${p.minLaminasi.toLocaleString('id-ID')}`
        : `BUKU!BC7: ${validOplah} pcs × ${luasCm2.toFixed(1)} cm² × Rp ${p.tarifUvVarnishCm2}/cm²`
    );
  }

  // -------------------------------------------------------------
  // 5. PACKING KARDUS & LAKBAN (BUKU!BG7)
  // -------------------------------------------------------------
  if (opsiKardusLakban) {
    const rasioLakban = p.panjangLakbanRollCm / p.konsumsiLakbanPerBoxCm; // 7650 / 196 = 39.030612
    const bLakban = ((validOplah / p.kapasitasKardusBox) / rasioLakban) * p.tarifLakbanRoll;
    const jmlKardus = Math.ceil(validOplah / p.kapasitasKardusBox);
    const bKardus = jmlKardus * p.tarifKardusBox;
    const totalPacking = bKardus + bLakban;

    add(
      'Packing Kardus & Lakban',
      totalPacking,
      `BUKU!BG7: ${jmlKardus} box (isi ${p.kapasitasKardusBox} pcs) × Rp ${p.tarifKardusBox.toLocaleString('id-ID')} + lakban Rp ${Math.round(bLakban).toLocaleString('id-ID')}`
    );
  }

  // BUKU!AK7: Fraksi cadangan roll foil bawaan formula BUKU
  // = oplah / 4800 (BUKU!AK6 kapasitas roll)
  const rollFoilFraction = validOplah / 4800;

  // Hitung persentase kontribusi per item
  breakdown.forEach((b) => {
    b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0;
  });

  // -------------------------------------------------------------
  // 6. TOTAL HPP, MARGIN & HARGA JUAL (BUKU!BI..BO & HARGA JULI 2026)
  // -------------------------------------------------------------
  // Total HPP murni Excel (termasuk rollFoilFraction untuk keselarasan 100% dengan cell BUKU!BI7)
  const totalHppExact = totalHpp + rollFoilFraction;
  const hppPerPcs = validOplah > 0 ? totalHppExact / validOplah : 0; // BUKU!BJ7

  // BUKU!BO7: Pembulatan puluhan = ROUNDUP(BN7, -1)
  const hargaJualTensPerPcs = Math.ceil(((totalHppExact * (1 + marginPct / 100)) / validOplah) / 10) * 10;

  // Sheet HARGA JULI 2026: Pembulatan ratusan = ROUNDUP((HPP * marginPct) + HPP, -2)
  const hargaJualPerPcs = Math.ceil(((hppPerPcs * (marginPct / 100)) + hppPerPcs) / 100) * 100;

  // Nego Diskon: Pembulatan ratusan = ROUNDUP(HargaJual - (HargaJual * negoDiskonPct%), -2)
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
    kebutuhanLembarCetak,
    totalHpp: Math.round(totalHppExact),
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

export type SavedSyahadahSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: SyahadahSimulatorResult;
  paramsSnapshot?: SyahadahMasterParams;
};
