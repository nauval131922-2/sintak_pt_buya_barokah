// ponytail: kalkulator murni Buku Hard Cover Unified terpadu 3 ukuran (10,5×14,8 cm, 14,5×20,25 cm, 21×29,7 cm)
// Referensi: 18, 21, 25, 26. Pricelist Hard Cover SPH out Juli 2026 Source/*.xlsm
// Mengikuti SOP PANDUAN_AUDIT_EXCEL_SINTAK.md & AI_RULES.md (100% direct binding, anti-jargon asing)

export type HardCoverUkuran = '10,5×14,8' | '14,5×20,25' | '21×29,7';
export type MesinCoverHC = 'OTOMATIS' | 'PRINT INTER' | 'OLIVER' | 'SM';
export type MesinIsiHC = 'OTOMATIS' | 'PRINT BUYA' | 'RYOBI' | 'OLIVER' | 'SM';
export type FinishingCoverHC = 
  | 'None' 
  | 'Laminasi Glossy' 
  | 'Laminasi Doff' 
  | 'Laminasi Glossy + Spot UV' 
  | 'Laminasi Doff + Spot UV'
  | 'Laminasi Glossy + Foil'
  | 'Laminasi Doff + Foil'
  | 'Laminasi Glossy + Spot UV + Foil'
  | 'Laminasi Doff + Spot UV + Foil'
  | 'Laminasi Glossy + Spot UV + Foil + Emboss'
  | 'Laminasi Doff + Spot UV + Foil + Emboss';

export interface BukuHardCoverUnifiedParams {
  // ─── A. BASIS UMR & KETENAGAKERJAAN ───
  // Master!D8
  umr: number; // Rp 2.818.585

  // ─── B. COVER & CETAK COVER ───
  // Master!D12
  hargaKertasCoverPerKg: number; // Rp 17.400 (Art Paper 150)
  // Master!D11
  gramaturCover: number; // 150 gsm
  // Master!D13
  insheetCoverOffset: number; // 150 lbr
  insheetCoverPrint: number; // 10 lbr
  // Master!D14
  biayaDesainCover: number; // Rp 20.000
  // Master!D17
  tarifPrintCoverA3: number; // Rp 3.500 / lbr A3+
  // BUKU!X6, AA6, AD6 (Oliver)
  tarifPlateCoverOliver: number; // Rp 45.000
  minOngkosCoverOliver: number; // Rp 90.000
  drekCoverOliver: number; // Rp 40
  // BUKU!X6, AA6, AD6 (SM)
  tarifPlateCoverSM: number; // Rp 78.000
  minOngkosCoverSM: number; // Rp 310.000
  drekCoverSM: number; // Rp 100

  // ─── C. BOARD & GEMBOS ───
  // Master!D21
  hargaBoardPerPack: number; // Rp 200.000
  // Master!D20
  lembarPerPackBoard: number; // 30 lbr
  // Master!D22
  insheetBoardMin: number; // 20 pcs
  // BUKU!BR27
  targetPouncePerHari: number; // 1.200 exp / hari

  // ─── D. CASING & LEM HARD COVER ───
  // Master!D29
  hargaLemHardCoverKg: number; // Rp 58.000
  // BUKU!BV27
  targetHardCoverPerHari: number; // 400 exp / hari
  // BUKU!CA27
  targetRoundingCoverPerHari: number; // 900 exp / hari

  // ─── E. SKIBLAT (ART CARTON 230) ───
  // Master!D33
  hargaKertasSkiblatPerKg: number; // Rp 16.400
  // Master!D32
  gramaturSkiblat: number; // 230 gsm
  // Master!D34
  insheetSkiblat: number; // 10 lbr
  // Master!D38
  tarifPrintSkiblatA3: number; // Rp 2.500
  // BUKU!EM28
  targetLipatSkiblatPerHari: number; // 5.000 exp / hari

  // ─── F. KERTAS ISI & CETAK ISI ───
  // Master!D46
  hargaKertasIsiPerKg: number; // Rp 15.700 (HVS 70)
  // Master!D45
  gramaturIsi: number; // 70 gsm
  // Master!D47
  insheetIsiOffset: number; // 100 lbr
  insheetIsiPrint: number; // 7 lbr
  // Master!D48
  biayaDesainIsiPerLbr: number; // Rp 2.500
  // Master!D51
  tarifPrintIsiA4: number; // Rp 350
  tarifPrintIsiA3: number; // Rp 2.000 (khusus A4 21x29,7)
  // BUKU!DX6, DZ6, ED6 (Ryobi)
  tarifPlateIsiRyobi: number; // Rp 10.000
  minOngkosIsiRyobi: number; // Rp 15.000
  drekIsiRyobi: number; // Rp 30
  // BUKU!DX6, DZ6, ED6 (Oliver)
  tarifPlateIsiOliver: number; // Rp 45.000
  minOngkosIsiOliver: number; // Rp 90.000
  drekIsiOliver: number; // Rp 40
  // BUKU!DX6, DZ6, ED6 (SM)
  tarifPlateIsiSM: number; // Rp 78.000
  minOngkosIsiSM: number; // Rp 310.000
  drekIsiSM: number; // Rp 100

  // ─── G. FINISHING ISI & JILID ───
  // BUKU!EG28
  targetLipatIsiPerHari: number; // 10.000
  // BUKU!EI28
  targetSusunIsiBasis: number; // 19.000 / katern
  // BUKU!EK28
  targetSisipPerHari: number; // 2.000
  // Master!D54, BUKU!EP31
  hargaBenangJahitRoll: number; // Rp 18.000
  panjangBenangRollCm: number; // 47.000 cm
  // BUKU!EP28
  targetJahitIsiBasis: number; // 11.400 / katern (600 * 19)
  // BUKU!EU28
  targetLemPressSkiblatPerHari: number; // 500
  // BUKU!EW6
  tarifSisirPerExp: number; // Rp 150
  // Master!D56, BUKU!EZ31, EZ28
  hargaHeadbandMeter: number; // Rp 2.350
  targetPasangHeadbandPerHari: number; // 300
  // Master!D55, BUKU!FF31, FF28
  hargaPitaRoll: number; // Rp 75.000
  panjangPitaRollCm: number; // 36.500 cm
  targetPasangPitaPerHari: number; // 300
  // Master!D57, BUKU!FL28
  hargaCraftPlano: number; // Rp 2.300
  targetPasangCraftPerHari: number; // 200
  // BUKU!FQ28
  targetPilungPerHari: number; // 550
  // BUKU!FS28
  targetCasingInPerHari: number; // 200
  // Master!D58, BUKU!FX28
  hargaPlastikShrinkRoll: number; // Rp 1.162.500
  targetShrinkPerHari: number; // 500
  // Master!D59, D60
  hargaLakbanRoll: number; // Rp 8.000
  hargaKardusBox: number; // Rp 8.500

  // ─── H. FINISHING KHUSUS COVER (OPSIONAL) ───
  // Master!D25
  hargaLaminasiGlossyRoll: number; // Rp 1.705.885
  // Master!D26
  hargaLaminasiDoffRoll: number; // Rp 1.737.761
  // Master!D27
  hargaFoilRoll: number; // Rp 295.000
  // Master!D28
  hargaSpotUvKg: number; // Rp 279.625
  // BUKU!AH27, AT27, BA27, BG27
  targetLaminasiPerHari: number; // 1.250
  targetFoilPerHari: number; // 600
  targetSpotUvPerHari: number; // 500
  targetEmbossPerHari: number; // 1.000
  minBiayaLaminasi: number; // Rp 50.000
  minBiayaFoil: number; // Rp 50.000
  minBiayaSpotUv: number; // Rp 100.000
  minBiayaEmboss: number; // Rp 100.000

  // ─── I. MARGIN & PROFIT ───
  // Master!E62
  marginPersen: number; // 30%
}

export const DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS: BukuHardCoverUnifiedParams = {
  umr: 2818585,

  hargaKertasCoverPerKg: 17400,
  gramaturCover: 150,
  insheetCoverOffset: 150,
  insheetCoverPrint: 10,
  biayaDesainCover: 20000,
  tarifPrintCoverA3: 3500,
  tarifPlateCoverOliver: 45000,
  minOngkosCoverOliver: 90000,
  drekCoverOliver: 40,
  tarifPlateCoverSM: 78000,
  minOngkosCoverSM: 310000,
  drekCoverSM: 100,

  hargaBoardPerPack: 200000,
  lembarPerPackBoard: 30,
  insheetBoardMin: 20,
  targetPouncePerHari: 1200,

  hargaLemHardCoverKg: 58000,
  targetHardCoverPerHari: 400,
  targetRoundingCoverPerHari: 900,

  hargaKertasSkiblatPerKg: 16400,
  gramaturSkiblat: 230,
  insheetSkiblat: 10,
  tarifPrintSkiblatA3: 2500,
  targetLipatSkiblatPerHari: 5000,

  hargaKertasIsiPerKg: 15700,
  gramaturIsi: 70,
  insheetIsiOffset: 100,
  insheetIsiPrint: 7,
  biayaDesainIsiPerLbr: 2500,
  tarifPrintIsiA4: 350,
  tarifPrintIsiA3: 2000,
  tarifPlateIsiRyobi: 10000,
  minOngkosIsiRyobi: 15000,
  drekIsiRyobi: 30,
  tarifPlateIsiOliver: 45000,
  minOngkosIsiOliver: 90000,
  drekIsiOliver: 40,
  tarifPlateIsiSM: 78000,
  minOngkosIsiSM: 310000,
  drekIsiSM: 100,

  targetLipatIsiPerHari: 10000,
  targetSusunIsiBasis: 19000,
  targetSisipPerHari: 2000,
  hargaBenangJahitRoll: 18000,
  panjangBenangRollCm: 47000,
  targetJahitIsiBasis: 11400,
  targetLemPressSkiblatPerHari: 500,
  tarifSisirPerExp: 150,
  hargaHeadbandMeter: 2350,
  targetPasangHeadbandPerHari: 300,
  hargaPitaRoll: 75000,
  panjangPitaRollCm: 36500,
  targetPasangPitaPerHari: 300,
  hargaCraftPlano: 2300,
  targetPasangCraftPerHari: 200,
  targetPilungPerHari: 550,
  targetCasingInPerHari: 200,
  hargaPlastikShrinkRoll: 1162500,
  targetShrinkPerHari: 500,
  hargaLakbanRoll: 8000,
  hargaKardusBox: 8500,

  hargaLaminasiGlossyRoll: 1705885,
  hargaLaminasiDoffRoll: 1737761,
  hargaFoilRoll: 295000,
  hargaSpotUvKg: 279625,
  targetLaminasiPerHari: 1250,
  targetFoilPerHari: 600,
  targetSpotUvPerHari: 500,
  targetEmbossPerHari: 1000,
  minBiayaLaminasi: 50000,
  minBiayaFoil: 50000,
  minBiayaSpotUv: 100000,
  minBiayaEmboss: 100000,

  marginPersen: 30,
};

export interface BukuHardCoverCalculationInput {
  ukuran: HardCoverUkuran;
  oplah: number;
  halaman: number;
  mesinCover: MesinCoverHC;
  mesinIsi: MesinIsiHC;
  finishingCover?: FinishingCoverHC;
  sertakanShrink?: boolean;
}

export interface BukuHardCoverBreakdownItem {
  kategori: string;
  item: string;
  spekTeknis: string;
  biaya: number;
  persen: number;
}

export interface BukuHardCoverCalculationResult {
  input: BukuHardCoverCalculationInput;
  mesinCoverTerpilih: 'PRINT INTER' | 'OLIVER' | 'SM';
  mesinIsiTerpilih: 'PRINT BUYA' | 'RYOBI' | 'OLIVER' | 'SM';
  oplahTotal: number;
  hppTotal: number;
  hppPerExp: number;
  totalHargaJual: number;
  hargaPerExp: number;
  hargaFinal: number; // Pembulatan puluhan
  breakdown: BukuHardCoverBreakdownItem[];
}

export function recommendMesinCoverHC(ukuran: HardCoverUkuran, oplah: number): 'PRINT INTER' | 'OLIVER' | 'SM' {
  if (oplah < 300) return 'PRINT INTER';
  if (oplah <= 2500) return 'OLIVER';
  return 'SM';
}

export function recommendMesinIsiHC(ukuran: HardCoverUkuran, oplah: number): 'PRINT BUYA' | 'RYOBI' | 'OLIVER' | 'SM' {
  if (oplah < 300) return 'PRINT BUYA';
  if (oplah <= 500 && ukuran !== '21×29,7') return 'RYOBI';
  if (oplah <= 2500) return 'OLIVER';
  return 'SM';
}

export function calculateBukuHardCoverUnified(
  params: BukuHardCoverUnifiedParams,
  input: BukuHardCoverCalculationInput
): BukuHardCoverCalculationResult {
  const { ukuran, oplah, halaman, finishingCover = 'None', sertakanShrink = false } = input;
  if (oplah <= 0 || halaman <= 0) {
    return {
      input,
      mesinCoverTerpilih: 'OLIVER',
      mesinIsiTerpilih: 'OLIVER',
      oplahTotal: 0,
      hppTotal: 0,
      hppPerExp: 0,
      totalHargaJual: 0,
      hargaPerExp: 0,
      hargaFinal: 0,
      breakdown: [],
    };
  }

  // Resolusi mesin cover & mesin isi
  const mesinCover: 'PRINT INTER' | 'OLIVER' | 'SM' =
    input.mesinCover === 'OTOMATIS' ? recommendMesinCoverHC(ukuran, oplah) : input.mesinCover;
  
  let mesinIsi: 'PRINT BUYA' | 'RYOBI' | 'OLIVER' | 'SM' =
    input.mesinIsi === 'OTOMATIS' ? recommendMesinIsiHC(ukuran, oplah) : input.mesinIsi;
  // Ryobi tidak bisa untuk A4 (21x29,7)
  if (ukuran === '21×29,7' && mesinIsi === 'RYOBI') {
    mesinIsi = 'OLIVER';
  }

  // Dimensi fisik & konstanta kapasitas
  let lebar = 14.5;
  let panjang = 20.25;
  let planoCoverN = 4;
  let planoCoverO = 8;
  let bk = 7;
  let bl = 7;
  let ce = 4;
  let cf = 8;
  let dm = 2;
  let dl = 8;
  let dn = 32;
  let craftPerPlano = 36;
  let insheetCover = params.insheetCoverOffset;
  let insheetBoardBahan = params.insheetBoardMin;

  const cleanUkuran = String(ukuran).replace(/\s+/g, '').replace(/x/gi, '×');
  if (cleanUkuran.startsWith('10,5')) {
    lebar = 10.5;
    panjang = 14.85;
    planoCoverN = mesinCover === 'OLIVER' ? 4 : mesinCover === 'SM' ? 2 : 1;
    planoCoverO = mesinCover === 'PRINT INTER' ? 2 : 16;
    bk = 12;
    bl = 12;
    ce = 4;
    cf = 16;
    dm = mesinIsi === 'OLIVER' ? 2 : 1;
    dl = mesinIsi === 'SM' ? 32 : mesinIsi === 'OLIVER' ? 16 : 4;
    dn = mesinIsi === 'SM' || mesinIsi === 'OLIVER' ? 64 : 8;
    craftPerPlano = 81;
    insheetCover = mesinCover === 'PRINT INTER' ? params.insheetCoverPrint : 100;
    insheetBoardBahan = Math.max(params.insheetBoardMin, oplah * 0.05);
  } else if (cleanUkuran.startsWith('14,5')) {
    lebar = 14.5;
    panjang = 20.25;
    planoCoverN = mesinCover === 'OLIVER' ? 4 : mesinCover === 'SM' ? 2 : 1;
    planoCoverO = mesinCover === 'PRINT INTER' ? 1 : 8;
    bk = 7;
    bl = 7;
    ce = 4;
    cf = 8;
    dm = mesinIsi === 'OLIVER' ? 2 : 1;
    dl = mesinIsi === 'SM' ? 16 : mesinIsi === 'OLIVER' ? 8 : 2;
    dn = mesinIsi === 'SM' || mesinIsi === 'OLIVER' ? 32 : 4;
    craftPerPlano = 36;
    insheetCover = mesinCover === 'PRINT INTER' ? params.insheetCoverPrint : params.insheetCoverOffset;
    insheetBoardBahan = params.insheetBoardMin;
  } else {
    // 21×29,7
    lebar = 21.0;
    panjang = 29.7;
    planoCoverN = mesinCover === 'OLIVER' ? 4 : mesinCover === 'SM' ? 2 : 1;
    planoCoverO = mesinCover === 'PRINT INTER' ? 1 : 4;
    bk = 3;
    bl = 3;
    ce = 2;
    cf = 4;
    dm = mesinIsi === 'OLIVER' ? 2 : 1;
    dl = mesinIsi === 'SM' ? 8 : mesinIsi === 'OLIVER' ? 4 : 2;
    dn = mesinIsi === 'SM' || mesinIsi === 'OLIVER' ? 16 : 4;
    craftPerPlano = 28;
    insheetCover = mesinCover === 'PRINT INTER' ? params.insheetCoverPrint : params.insheetCoverOffset;
    insheetBoardBahan = Math.max(params.insheetBoardMin, oplah * 0.10);
  }

  const upahHarian = params.umr / 25; // A05.UMR / 25

  // Punggung buku (BUKU!M7)
  let punggung = 0.5;
  if (halaman <= 100) punggung = 0.5;
  else if (halaman <= 200) punggung = 1.0;
  else if (halaman <= 300) punggung = 1.5;
  else if (halaman <= 400) punggung = 2.0;
  else if (halaman <= 500) punggung = 2.5;
  else if (halaman <= 600) punggung = 3.0;
  else if (halaman <= 700) punggung = 3.5;
  else punggung = 4.0;

  // BUKU!I7: Oplah Total = H7 + B05.Insheet_Bhn.Board (20)
  const oplahTotal = oplah + params.insheetBoardMin;

  // ─── 1. BIAYA COVER ───
  // BUKU!R7: ROUNDUP((oplah / O) + (insheet / N))
  const lbrPlanoCover = Math.ceil(oplah / planoCoverO + insheetCover / planoCoverN);
  const lbrCetakCover = lbrPlanoCover * planoCoverN; // BUKU!P7

  let biayaKertasCover = 0;
  const biayaDesainCover = params.biayaDesainCover; // BUKU!U7
  let biayaPlatCover = 0;
  let biayaCetakCover = 0;

  if (mesinCover === 'OLIVER' || mesinCover === 'SM') {
    // Plano 79 x 109 cm Art Paper 150 (BUKU!R28, S28, S31)
    const hrgPerReamCover = ((79 * 109 * params.gramaturCover) / 20000) * params.hargaKertasCoverPerKg;
    biayaKertasCover = (lbrPlanoCover / 500) * hrgPerReamCover; // BUKU!S7

    const tarifPlat = mesinCover === 'SM' ? params.tarifPlateCoverSM : params.tarifPlateCoverOliver;
    const jmlPlat = 5; // BUKU!Y7
    biayaPlatCover = tarifPlat * jmlPlat; // BUKU!X7

    const minOngkos = mesinCover === 'SM' ? params.minOngkosCoverSM : params.minOngkosCoverOliver;
    const biayaCetakPokok = minOngkos * jmlPlat; // BUKU!AB7
    const drekThreshold = mesinCover === 'SM' ? 3000 : 1000;
    const drekRate = mesinCover === 'SM' ? params.drekCoverSM : params.drekCoverOliver;
    const overCetak = lbrCetakCover - drekThreshold >= 1 ? lbrCetakCover - drekThreshold : 0; // BUKU!AC7
    const biayaCetakOver = overCetak * drekRate * jmlPlat; // BUKU!AD7
    biayaCetakCover = biayaCetakPokok + biayaCetakOver; // BUKU!AE7
  } else {
    // PRINT INTER (Digital Print A3+)
    biayaKertasCover = lbrPlanoCover * params.tarifPrintCoverA3; // BUKU!S7
  }

  // ─── 2. BIAYA FINISHING COVER KHUSUS (LAMINASI / FOIL / SPOT UV / EMBOSS) ───
  let biayaLaminasiCover = 0;
  let biayaFoilCover = 0;
  let biayaSpotUvCover = 0;
  let biayaEmbossCover = 0;

  const isGlossy = finishingCover.includes('Laminasi Glossy');
  const isDoff = finishingCover.includes('Laminasi Doff');
  const isSpotUv = finishingCover.includes('Spot UV');
  const isFoil = finishingCover.includes('Foil');
  const isEmboss = finishingCover.includes('Emboss');

  if (isGlossy || isDoff) {
    const rollPrice = isGlossy ? params.hargaLaminasiGlossyRoll : params.hargaLaminasiDoffRoll;
    const targetLaminasi = params.targetLaminasiPerHari;
    // BUKU!AG6 / AM6: kebutuhan meter per roll (300.000 cm)
    const rollCm = 300000;
    const widthCoverCm = lebar * 2 + punggung + 1.6 + 3;
    const lbrPerRoll = (rollCm / widthCoverCm) * 2;
    const rollTerpakai = oplahTotal / (lbrPerRoll * 0.985); // minus 1.5% waste
    const biayaPlastik = rollTerpakai * (rollPrice / 300000) * widthCoverCm;
    const biayaJasa = (upahHarian / targetLaminasi) * oplahTotal;
    const totalLam = biayaPlastik + biayaJasa;
    biayaLaminasiCover = Math.max(totalLam, params.minBiayaLaminasi);
  }

  if (isFoil) {
    const widthCoverCm = lebar * 2 + punggung + 1.6;
    const rollCm = 12000;
    const lbrPerRoll = (rollCm / widthCoverCm) * 2 * 0.85; // minus 15% waste
    const biayaPlastik = (oplahTotal / lbrPerRoll) * (params.hargaFoilRoll / 12000) * widthCoverCm;
    const biayaJasa = (upahHarian / params.targetFoilPerHari) * oplahTotal;
    const kliseFoil = lebar * panjang * 500;
    const totalFoil = biayaPlastik + biayaJasa + kliseFoil;
    biayaFoilCover = Math.max(totalFoil, params.minBiayaFoil);
  }

  if (isSpotUv) {
    const areaCover = (lebar * 2 + 1.6 + punggung) * panjang;
    const tintaPerLbr = areaCover / 5393320; // BUKU!BA30
    const biayaTinta = oplahTotal * tintaPerLbr * params.hargaSpotUvKg;
    const biayaJasa = (upahHarian / params.targetSpotUvPerHari) * oplahTotal;
    const totalSpot = biayaTinta + biayaJasa;
    biayaSpotUvCover = Math.max(totalSpot, params.minBiayaSpotUv);
  }

  if (isEmboss) {
    const kliseEmboss = lebar * panjang * 500;
    const biayaJasa = (upahHarian / params.targetEmbossPerHari) * oplahTotal;
    const totalEmboss = kliseEmboss + biayaJasa;
    biayaEmbossCover = Math.max(totalEmboss, params.minBiayaEmboss);
  }

  // ─── 3. BIAYA BOARD & POUNCE ───
  // BUKU!BM7: ROUNDUP((oplah / BL) + (insheetBoard / BL))
  const lbrPlanoBoard = Math.ceil(oplah / bl + insheetBoardBahan / bl);
  const hargaPerLbrBoard = params.hargaBoardPerPack / params.lembarPerPackBoard;
  const biayaBoard = lbrPlanoBoard * hargaPerLbrBoard; // BUKU!BO7

  // BUKU!BS7: Pounce Board
  const biayaPounce = (upahHarian / params.targetPouncePerHari) * oplahTotal;

  // ─── 4. HARD COVER CASING & ROUNDING ───
  // BUKU!BU6, BU7: Lem Hard Cover
  const areaLem = (lebar * 2 + 1.6 + punggung + 3) * (panjang + 3);
  const kebLemPerExp = 64483.33 / areaLem;
  const kebLemTotal = oplahTotal / kebLemPerExp;
  const biayaLem = kebLemTotal * params.hargaLemHardCoverKg;
  // BUKU!BX7: Jasa Making Casing
  const biayaJasaHc = ((upahHarian * 2) / params.targetHardCoverPerHari) * oplahTotal;
  const biayaHardCover = biayaLem + biayaJasaHc; // BUKU!BY7

  // BUKU!CA7: Rounding Sudut Cover
  const biayaRoundingCover = (upahHarian / params.targetRoundingCoverPerHari) * oplahTotal;

  // ─── 5. SKIBLAT (ART CARTON 230) ───
  // BUKU!CI7: ROUNDUP(((oplah * 2) / CF) + (insheet / CE))
  const lbrPlanoSkiblat = Math.ceil((oplah * 2) / cf + params.insheetSkiblat / ce);
  // Plano 65 x 100 cm Art Carton 230 (BUKU!CJ28, CJ31)
  const hrgReamSkiblat = ((65 * 100 * params.gramaturSkiblat) / 20000) * params.hargaKertasSkiblatPerKg;
  const biayaKertasSkiblat = (lbrPlanoSkiblat / 500) * hrgReamSkiblat; // BUKU!CJ7

  // ─── 6. KERTAS ISI & CETAK ISI ───
  // BUKU!DO7: halaman / (DN / DM)
  const cuttern = halaman / (dn / dm);
  const do6 = Math.ceil(cuttern);
  const insheetIsi =
    mesinIsi === 'PRINT BUYA'
      ? params.insheetIsiPrint
      : mesinIsi === 'RYOBI'
        ? 30
        : mesinIsi === 'OLIVER'
          ? params.insheetIsiOffset
          : 300;
  const lbrPlanoIsi = (oplah / dm) * cuttern + (insheetIsi / dm) * do6; // BUKU!DR7

  let biayaKertasIsi = 0;
  const biayaDesainIsi = params.biayaDesainIsiPerLbr * (halaman / 4); // BUKU!DU7
  let biayaPlatIsi = 0;
  let biayaCetakIsi = 0;

  if (mesinIsi === 'PRINT BUYA') {
    const tarifPrint = ukuran === '21×29,7' ? params.tarifPrintIsiA3 : params.tarifPrintIsiA4;
    biayaKertasIsi = lbrPlanoIsi * tarifPrint; // BUKU!DS7
  } else if (mesinIsi === 'RYOBI') {
    // Potong Folio 21.5 x 33 cm HVS 70 (BUKU!DR28, DS28, DS31)
    const hrgReamFolio = ((21.5 * 33 * params.gramaturIsi) / 20000) * params.hargaKertasIsiPerKg;
    biayaKertasIsi = (lbrPlanoIsi / 500) * hrgReamFolio; // BUKU!DS7

    const jmlPlatIsi = Math.ceil(halaman / dl); // BUKU!DY7
    biayaPlatIsi = params.tarifPlateIsiRyobi * jmlPlatIsi; // BUKU!DX7
    const overIsi = oplah + insheetIsi > 500 ? (oplah + insheetIsi - 500) * jmlPlatIsi : 0;
    biayaCetakIsi = (params.minOngkosIsiRyobi * jmlPlatIsi) + (overIsi * params.drekIsiRyobi); // BUKU!EE7
  } else {
    // Plano 61 x 86 cm HVS 70 (BUKU!DS28, DS31)
    const hrgReamIsi = ((61 * 86 * params.gramaturIsi) / 20000) * params.hargaKertasIsiPerKg;
    biayaKertasIsi = (lbrPlanoIsi / 500) * hrgReamIsi; // BUKU!DS7

    const jmlPlatIsi = Math.ceil(halaman / dl); // BUKU!DY7
    let tarifPlatIsi = params.tarifPlateIsiOliver;
    let minOngkosIsi = params.minOngkosIsiOliver;
    let drekThreshold = 1000;
    let drekRate = params.drekIsiOliver;

    if (mesinIsi === 'SM') {
      tarifPlatIsi = params.tarifPlateIsiSM;
      minOngkosIsi = params.minOngkosIsiSM;
      drekThreshold = 3000;
      drekRate = params.drekIsiSM;
    }

    biayaPlatIsi = tarifPlatIsi * jmlPlatIsi; // BUKU!DX7
    const biayaPokokIsi = minOngkosIsi * jmlPlatIsi; // BUKU!EB7
    const overIsi = oplah + insheetIsi > drekThreshold ? (oplah + insheetIsi - drekThreshold) * jmlPlatIsi : 0; // BUKU!EC7
    const biayaOverIsi = overIsi * drekRate; // BUKU!ED7
    biayaCetakIsi = biayaPokokIsi + biayaOverIsi; // BUKU!EE7
  }

  // ─── 7. FINISHING ISI & BUKU ───
  const ei2 = Math.ceil(cuttern); // BUKU!EI2 (katern)
  // BUKU!EG7: Lipat Isi
  const biayaLipat = (upahHarian / params.targetLipatIsiPerHari) * oplahTotal * ei2;
  // BUKU!EI7: Susun Komplit
  const targetSusun = params.targetSusunIsiBasis / ei2;
  const biayaSusun = (upahHarian / targetSusun) * oplahTotal;
  // BUKU!EK7: Sisip Isi
  const biayaSisip = (upahHarian / params.targetSisipPerHari) * oplahTotal;
  // BUKU!EM7: Lipat Skiblat
  const biayaLipatSkiblat = (upahHarian / params.targetLipatSkiblatPerHari) * (oplah * 2);
  // BUKU!ES7: Jahit Isi (Jasa + Benang)
  const targetJahit = params.targetJahitIsiBasis / ei2;
  const biayaJasaJahit = (upahHarian / targetJahit) * oplahTotal;
  const kebBenangRoll = oplahTotal / (params.panjangBenangRollCm / ((panjang - 4) * ei2));
  const biayaBenang = kebBenangRoll * params.hargaBenangJahitRoll;
  const biayaJahit = biayaJasaJahit + biayaBenang;
  // BUKU!EU7: Lem Press + Skiblat
  const biayaLemPress = (upahHarian / params.targetLemPressSkiblatPerHari) * oplahTotal;
  // BUKU!EW7: Sisir Potong 3 Sisi
  const biayaSisir = params.tarifSisirPerExp * oplah;
  // BUKU!FC7: Headband (Jasa + Bahan)
  const biayaPasangHeadband = (upahHarian / params.targetPasangHeadbandPerHari / 3) * oplahTotal;
  const kebMeterHeadband = (oplahTotal * (punggung + 0.5) * 2) / 100;
  const biayaBahanHeadband = kebMeterHeadband * params.hargaHeadbandMeter;
  const biayaHeadband = biayaPasangHeadband + biayaBahanHeadband;
  // BUKU!FI7: Pita (Jasa + Bahan)
  const biayaPasangPita = (upahHarian / params.targetPasangPitaPerHari / 3) * oplahTotal;
  const kebMeterPita = (oplahTotal * (panjang + 5)) / 100;
  const biayaBahanPita = (kebMeterPita / (params.panjangPitaRollCm / 100)) * params.hargaPitaRoll;
  const biayaPita = biayaPasangPita + biayaBahanPita;
  // BUKU!FO7: Craft (Jasa + Bahan)
  const kebCraftPlano = Math.ceil(oplahTotal / craftPerPlano);
  const biayaBahanCraft = kebCraftPlano * params.hargaCraftPlano;
  const biayaPasangCraft = (upahHarian / params.targetPasangCraftPerHari / 3) * oplahTotal;
  const biayaCraft = biayaBahanCraft + biayaPasangCraft;
  // BUKU!FQ7: Pilung (Rounding Punggung Isi)
  const biayaPilung = (upahHarian / params.targetPilungPerHari) * oplahTotal;
  // BUKU!FS7: Casing In
  const biayaCasingIn = (upahHarian / params.targetCasingInPerHari) * oplahTotal;
  // BUKU!FY7: Shrink (Bila dicentang)
  let biayaShrink = 0;
  if (sertakanShrink) {
    const kebPlastikRoll = oplahTotal / (30000 / (panjang + 8));
    const biayaPlastik = kebPlastikRoll * params.hargaPlastikShrinkRoll;
    const biayaJasa = (upahHarian / params.targetShrinkPerHari / 2) * oplahTotal;
    biayaShrink = biayaPlastik + biayaJasa;
  }
  // BUKU!GB7, GC7: Kardus + Lakban
  const biayaLakban = (oplah / 60.150375939849624) * params.hargaLakbanRoll;
  const biayaKardusBox = Math.ceil(oplah / 120) * params.hargaKardusBox;
  const totalPacking = biayaKardusBox + biayaLakban * 2; // GC7 (kardus + lakban) + GB7 (lakban)

  // ─── 8. TOTAL HPP & HARGA JUAL ───
  // BUKU!GE7
  const hppTotal =
    biayaKertasCover +
    biayaDesainCover +
    biayaPlatCover +
    biayaCetakCover +
    biayaLaminasiCover +
    biayaFoilCover +
    biayaSpotUvCover +
    biayaEmbossCover +
    biayaBoard +
    biayaPounce +
    biayaHardCover +
    biayaRoundingCover +
    biayaKertasSkiblat +
    biayaKertasIsi +
    biayaDesainIsi +
    biayaPlatIsi +
    biayaCetakIsi +
    biayaLipat +
    biayaSusun +
    biayaSisip +
    biayaLipatSkiblat +
    biayaJahit +
    biayaLemPress +
    biayaSisir +
    biayaHeadband +
    biayaPita +
    biayaCraft +
    biayaPilung +
    biayaCasingIn +
    biayaShrink +
    totalPacking;

  const hppPerExp = hppTotal / oplah; // BUKU!GF7
  const totalHargaJual = hppTotal * (1 + params.marginPersen / 100); // BUKU!GK7
  const hargaPerExp = totalHargaJual / oplah; // BUKU!GL7
  const hargaFinal = Math.ceil(hargaPerExp / 10) * 10; // BUKU!GM7: ROUNDUP(GL, -1)

  // ─── 9. BREAKDOWN BIAYA TRANSPARAN ───
  const rawBreakdown: { kategori: string; item: string; spekTeknis: string; biaya: number }[] = [
    {
      kategori: 'Cover & Cetak',
      item: 'Kertas Cover',
      spekTeknis: `Art Paper 150 gsm (${lbrPlanoCover} lbr plano)`,
      biaya: biayaKertasCover,
    },
    {
      kategori: 'Cover & Cetak',
      item: 'Desain & Setting Cover',
      spekTeknis: 'Setting layout cover 1 order',
      biaya: biayaDesainCover,
    },
    {
      kategori: 'Cover & Cetak',
      item: 'Plat Cover',
      spekTeknis: mesinCover === 'PRINT INTER' ? 'Digital Print (Tanpa Plat)' : `${mesinCover} 5 plat`,
      biaya: biayaPlatCover,
    },
    {
      kategori: 'Cover & Cetak',
      item: 'Ongkos Cetak Cover',
      spekTeknis: `${mesinCover} 4 Warna (${lbrCetakCover} lbr cetak)`,
      biaya: biayaCetakCover,
    },
    {
      kategori: 'Finishing Cover',
      item: 'Laminasi Cover',
      spekTeknis: isGlossy ? 'Laminasi Glossy Roll' : isDoff ? 'Laminasi Doff Roll' : 'Tanpa Laminasi',
      biaya: biayaLaminasiCover,
    },
    {
      kategori: 'Finishing Cover',
      item: 'Foil Cover',
      spekTeknis: isFoil ? 'Hot Stamping Foil Emas/Perak' : 'Tanpa Foil',
      biaya: biayaFoilCover,
    },
    {
      kategori: 'Finishing Cover',
      item: 'Spot UV Cover',
      spekTeknis: isSpotUv ? 'Sablon Pernis Spot UV' : 'Tanpa Spot UV',
      biaya: biayaSpotUvCover,
    },
    {
      kategori: 'Finishing Cover',
      item: 'Emboss Cover',
      spekTeknis: isEmboss ? 'Klise Emboss Timbul' : 'Tanpa Emboss',
      biaya: biayaEmbossCover,
    },
    {
      kategori: 'Hard Cover Board',
      item: 'Kertas Board',
      spekTeknis: `Yellow Board No. 30 (${lbrPlanoBoard} lbr plano)`,
      biaya: biayaBoard,
    },
    {
      kategori: 'Hard Cover Board',
      item: 'Pond / Pounce Board',
      spekTeknis: 'Pisau & cetak pond sudut board',
      biaya: biayaPounce,
    },
    {
      kategori: 'Hard Cover Board',
      item: 'Making Casing & Lem',
      spekTeknis: `Lem Fox HC (${kebLemTotal.toFixed(2)} kg) & jasa casing`,
      biaya: biayaHardCover,
    },
    {
      kategori: 'Hard Cover Board',
      item: 'Rounding Sudut Cover',
      spekTeknis: 'Rounding lengkung sudut hard cover',
      biaya: biayaRoundingCover,
    },
    {
      kategori: 'Skiblat',
      item: 'Kertas Skiblat',
      spekTeknis: `Art Carton 230 gsm (${lbrPlanoSkiblat} lbr plano)`,
      biaya: biayaKertasSkiblat,
    },
    {
      kategori: 'Isi & Cetak',
      item: 'Kertas Isi',
      spekTeknis: `HVS 70 gsm (${lbrPlanoIsi.toFixed(0)} lbr plano)`,
      biaya: biayaKertasIsi,
    },
    {
      kategori: 'Isi & Cetak',
      item: 'Desain & Setting Isi',
      spekTeknis: `${halaman} hal (${halaman / 4} lembar)`,
      biaya: biayaDesainIsi,
    },
    {
      kategori: 'Isi & Cetak',
      item: 'Plat Isi',
      spekTeknis: mesinIsi === 'PRINT BUYA' ? 'Digital Print (Tanpa Plat)' : `${mesinIsi} ${Math.ceil(halaman / dl)} plat`,
      biaya: biayaPlatIsi,
    },
    {
      kategori: 'Isi & Cetak',
      item: 'Ongkos Cetak Isi',
      spekTeknis: `${mesinIsi} 1 Warna (${oplahTotal} exp)`,
      biaya: biayaCetakIsi,
    },
    {
      kategori: 'Finishing Buku',
      item: 'Lipat & Susun Isi',
      spekTeknis: `${ei2} katern susun komplit`,
      biaya: biayaLipat + biayaSusun + biayaSisip,
    },
    {
      kategori: 'Finishing Buku',
      item: 'Lipat Skiblat',
      spekTeknis: `${oplah * 2} lembar lipat`,
      biaya: biayaLipatSkiblat,
    },
    {
      kategori: 'Finishing Buku',
      item: 'Jahit Benang Isi',
      spekTeknis: `Benang (${kebBenangRoll.toFixed(2)} roll) & jasa jahit`,
      biaya: biayaJahit,
    },
    {
      kategori: 'Finishing Buku',
      item: 'Lem Press Blok Buku',
      spekTeknis: 'Lem blok punggung + pasang skiblat',
      biaya: biayaLemPress,
    },
    {
      kategori: 'Finishing Buku',
      item: 'Sisir Potong 3 Sisi',
      spekTeknis: 'Pisau potong rata 3 sisi',
      biaya: biayaSisir,
    },
    {
      kategori: 'Finishing Buku',
      item: 'Aksesoris Buku (Headband & Pita)',
      spekTeknis: 'Pasang headband kain & pita pembatas',
      biaya: biayaHeadband + biayaPita,
    },
    {
      kategori: 'Finishing Buku',
      item: 'Kertas Craft Punggung',
      spekTeknis: `Craft backing (${kebCraftPlano} lbr plano)`,
      biaya: biayaCraft,
    },
    {
      kategori: 'Finishing Buku',
      item: 'Pilung (Rounding Isi)',
      spekTeknis: 'Rounding lengkung punggung blok buku',
      biaya: biayaPilung,
    },
    {
      kategori: 'Finishing Buku',
      item: 'Casing-In (Gantung Cover)',
      spekTeknis: 'Penyatuan blok buku ke hard cover',
      biaya: biayaCasingIn,
    },
    {
      kategori: 'Packing',
      item: 'Plastik Shrink (Opsional)',
      spekTeknis: sertakanShrink ? 'Plastik wrap shrink per buku' : 'Tanpa Shrink',
      biaya: biayaShrink,
    },
    {
      kategori: 'Packing',
      item: 'Kardus & Lakban Packing',
      spekTeknis: `Box isi 120 (${Math.ceil(oplah / 120)} dus) + lakban`,
      biaya: totalPacking,
    },
  ];

  const breakdown: BukuHardCoverBreakdownItem[] = rawBreakdown
    .filter((b) => b.biaya > 0)
    .map((b) => ({
      ...b,
      persen: hppTotal > 0 ? (b.biaya / hppTotal) * 100 : 0,
    }));

  return {
    input,
    mesinCoverTerpilih: mesinCover,
    mesinIsiTerpilih: mesinIsi,
    oplahTotal,
    hppTotal,
    hppPerExp,
    totalHargaJual,
    hargaPerExp,
    hargaFinal,
    breakdown,
  };
}

export const OPLAH_TIERS_HC: number[] = [
  50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 5000,
];

export function getBukuHardCoverMatrixTiers(
  params: BukuHardCoverUnifiedParams,
  input: Omit<BukuHardCoverCalculationInput, 'oplah'>,
  tiers: number[] = OPLAH_TIERS_HC
): BukuHardCoverCalculationResult[] {
  return tiers.map((oplah) => calculateBukuHardCoverUnified(params, { ...input, oplah }));
}
