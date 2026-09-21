// Buku Tabungan Non Security 9 x 14,5 cm — kalkulator murni 1:1 direct binding Excel.
// Sumber: 14. Pricelist Buku Tabungan Non Security/Source/
//   - BUKU TABUNGAN 9 x 14,5 cm - Non Security Ryobi.xlsm (oplah besar 250-1500, isi Ryobi)
//   - BUKU TABUNGAN 9 x 14,5 cm - Non Security.xlsm (oplah kecil 50-200, isi Print Buya)
// Lapisan: Input=Master, Engine=BUKU (tier H7:H24, output DI7:DI24 via Oplah/Harga_Final), Output=Master!D39.
// STOP&ASK user (2026-09-21): insheet default 15/30, desain cover 15000, mesin isi Otomatis
//   (<250 Print Buya, >=250 Ryobi), toggle Pisau Pound + Kardus aktif.

export type TabunganNsMesinCover = 'Otomatis' | 'Print Inter' | 'Ryobi' | 'Oliver' | 'SM';
export type TabunganNsMesinIsi = 'Otomatis' | 'Print Buya' | 'Print Inter' | 'Ryobi' | 'Oliver' | 'SM';

export const TABUNGAN_NS_MESIN_COVER: TabunganNsMesinCover[] = ['Otomatis', 'Print Inter', 'Ryobi', 'Oliver', 'SM'];
export const TABUNGAN_NS_MESIN_ISI: TabunganNsMesinIsi[] = ['Otomatis', 'Print Buya', 'Print Inter', 'Ryobi', 'Oliver', 'SM'];

// BUKU! Master!D29 options (H29:H40, trailing comma = 1:1 Excel)
export type TabunganNsFinishing =
  | 'None,'
  | 'UV Varnish,'
  | 'Laminasi Glossy,'
  | 'Laminasi Doff,'
  | 'Lem Bending,'
  | 'UV Varnish + Bending,'
  | 'Laminasi Glossy + Bending,'
  | 'Laminasi Doff + Bending,'
  | 'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,';

export const TABUNGAN_NS_FINISHING: TabunganNsFinishing[] = [
  'None,',
  'UV Varnish,',
  'Laminasi Glossy,',
  'Laminasi Doff,',
  'Lem Bending,',
  'UV Varnish + Bending,',
  'Laminasi Glossy + Bending,',
  'Laminasi Doff + Bending,',
  'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,',
];

export const TABUNGAN_NS_BAHAN_COVER = ['HVS', 'Imperial', 'Book Paper', 'Art Paper', 'Art Carton', 'Duplex', 'Vp', 'Ivory,'] as const;
export const TABUNGAN_NS_GRAMATUR_COVER = [50, 52, 57, 58, 60, 70, 80, 100, 120, 150, 210, 230, 260, 300, 310] as const;
export const TABUNGAN_NS_BAHAN_ISI = ['HVS', 'Imperial', 'Book Paper', 'Art Paper', 'QPP,'] as const;
export const TABUNGAN_NS_GRAMATUR_ISI = [50, 52, 57, 58, 60, 70, 80, 100, 120, 150] as const;

export interface BukuTabunganNsMasterParams {
  // A. Umum (Master!D6/D8)
  jumlahHalaman: number; // Master!D6, default 24 (BUKU!C6)
  umr: number; // Master!D8 -> A07.UMR, default 2818585
  // B. Cover (Master!D12/D13/D17/D18)
  tarifKertasCoverKg: number; // Master!D12 (BUKU!W30), default 16400
  upKertasCoverPct: number; // Master!E12 (BUKU!Y30), default 0
  insheetCover: number; // Master!D13 (BUKU!K6), default 15
  tarifDesainCover: number; // Master!D17 (BUKU!V6), default 15000
  tarifPrintCoverA3: number; // Master!D18 (BUKU!T2), default 3500
  tarifFilmBw: number; // BUKU!W6 (V30 kosong -> mati), default 0
  // C. Isi (Master!D22/D23/D26/D27)
  tarifKertasIsiKg: number; // Master!D22 (BUKU!AU30), default 15700
  upKertasIsiPct: number; // Master!E22 (BUKU!AW30), default 0
  insheetIsi: number; // Master!D23 (BUKU!AI6), default 30
  tarifDesainIsiPerLbr: number; // Master!D26 (BUKU!AT6), default 1500
  tarifPrintIsiA3: number; // Master!D27 (BUKU!AR2), default 2000
  tarifFilmWarna: number; // BUKU!AU6 (selalu 0 di Excel), default 0
  tarifJasaPrintBuya: number; // BUKU!AR2 "350" (teks di Excel) utk isi Print Buya, default 350
  // D. Jasa & finishing (Master!D30-D36)
  tarifKawatStiching: number; // Master!D30 (info, tidak masuk DC7), default 120000
  tarifTintaSpotUvKg: number; // Master!D31 (BUKU!BT32), default 279625
  tarifPlastikSringRoll: number; // Master!D32 (BUKU!CT32), default 1162500
  tarifSteplesPack: number; // Master!D33 (info), default 3000
  tarifLakbanRoll: number; // Master!D34 (BUKU!CZ32), default 8000
  tarifKardusBox: number; // Master!D35 (BUKU!DA6), default 8500
  royalty: number; // Master!D36 (BUKU!BF6), default 0
  // E. Konstanta acuan BUKU (baris 28-30, gated ukuran 10 X 15)
  targetSusunLipat: number; // BUKU!BI28 lookup halaman — dioverride tabel C6 (default basis 900)
  targetJahit: number; // BUKU!BJ28, default 250
  targetPound: number; // BUKU!BM28, default 450
  targetSpotUv: number; // BUKU!BT27, default 500
  targetEmboss: number; // BUKU!BZ27, default 1000
  targetSring: number; // BUKU!CV28, default 500
  targetLakban: number; // BUKU!CZ28, default 500
  tarifPisauPound: number; // BUKU!BL6 jika √, default 299.3
  tarifSisirPaket: number; // BUKU!BQ6 = 3*50 jika √, default 150
  tarifBending: number; // BUKU!CC6, default 50
  tarifLamGlossy: number; // BUKU!CF6, default 0.35
  tarifLamDoff: number; // BUKU!CI6, default 0.4
  tarifUvVarnish: number; // BUKU!CL6, default 0.12
  minJahit: number; // BUKU!BJ7 batas bawah, default 250000
  minPound: number; // BUKU!BM7 batas bawah, default 50000
  minBendingKombi: number; // BUKU!CE7 batas bawah, default 100000
  minLaminasi: number; // BUKU!CG7/CJ7/CM7 batas bawah, default 50000
  ukuranPlastikSringCm: number; // BUKU!CT30 = 1067*100, default 106700
  ukuranLakbanCm: number; // BUKU!CZ30, default 7650
  acuanSpotUvCm: number; // BUKU!BT30 (4 Kg Jadi cm), default 5393320
  // F. Laba (Master!E37 -> BUKU!DE6)
  labaPct: number; // default 30
}

export const DEFAULT_BUKU_TABUNGAN_NS_PARAMS: BukuTabunganNsMasterParams = {
  jumlahHalaman: 24,
  umr: 2818585,
  tarifKertasCoverKg: 16400,
  upKertasCoverPct: 0,
  insheetCover: 15,
  tarifDesainCover: 15000,
  tarifPrintCoverA3: 3500,
  tarifFilmBw: 0,
  tarifKertasIsiKg: 15700,
  upKertasIsiPct: 0,
  insheetIsi: 30,
  tarifDesainIsiPerLbr: 1500,
  tarifPrintIsiA3: 2000,
  tarifFilmWarna: 0,
  tarifJasaPrintBuya: 350,
  tarifKawatStiching: 120000,
  tarifTintaSpotUvKg: 279625,
  tarifPlastikSringRoll: 1162500,
  tarifSteplesPack: 3000,
  tarifLakbanRoll: 8000,
  tarifKardusBox: 8500,
  royalty: 0,
  targetSusunLipat: 900,
  targetJahit: 250,
  targetPound: 450,
  targetSpotUv: 500,
  targetEmboss: 1000,
  targetSring: 500,
  targetLakban: 500,
  tarifPisauPound: 299.3,
  tarifSisirPaket: 150,
  tarifBending: 50,
  tarifLamGlossy: 0.35,
  tarifLamDoff: 0.4,
  tarifUvVarnish: 0.12,
  minJahit: 250000,
  minPound: 50000,
  minBendingKombi: 100000,
  minLaminasi: 50000,
  ukuranPlastikSringCm: 106700,
  ukuranLakbanCm: 7650,
  acuanSpotUvCm: 5393320,
  labaPct: 30,
};

// Union tier kedua file (kecil 50-200, besar 250-1500)
export const BUKU_TABUNGAN_NS_TIERS: number[] = [
  50, 100, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900, 1000, 1500,
];

export interface BukuTabunganNsSimulatorInput {
  oplahPcs: number;
  jumlahHalaman: number; // BUKU!C6 (default 24)
  mukaCover: 1 | 2; // Master!D14
  warnaCover: 1 | 2 | 3 | 4; // Master!D15
  mesinCover: TabunganNsMesinCover; // Master!D16
  bahanCover: string; // Master!D10
  gramaturCover: number; // Master!D11
  warnaIsi: 1 | 2 | 3 | 4; // Master!D24
  mesinIsi: TabunganNsMesinIsi; // Master!D25
  bahanIsi: string; // Master!D20
  gramaturIsi: number; // Master!D21
  finishing: TabunganNsFinishing; // Master!D29
  jahitAktif: boolean; // BUKU!BJ26
  pisauPoundAktif: boolean; // BUKU!BL26
  jasaPoundAktif: boolean; // BUKU!BM26
  sisirAktif: boolean; // BUKU!BQ26
  kardusAktif: boolean; // BUKU!DA28
  insheetCover: number; // BUKU!K6 override
  insheetIsi: number; // BUKU!AI6 override
  marginPct: number; // BUKU!DE6 override
}

export interface BukuTabunganNsBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
  diLuarTotal?: boolean; // true = info saja, tidak masuk DC7 (Film BW/Warna)
}

export interface BukuTabunganNsSimulatorResult {
  input: BukuTabunganNsSimulatorInput;
  mesinCoverEfektif: string;
  mesinIsiEfektif: string;
  breakdown: BukuTabunganNsBreakdownItem[];
  kebutuhanCoverPlano: number; // BUKU!R7
  kebutuhanIsiPlano: number; // BUKU!AP7
  totalHpp: number; // BUKU!DC7
  hppPerPcs: number; // BUKU!DD7
  labaPerPcs: number; // BUKU!DE7
  totalLaba: number; // BUKU!DF7
  totalHarga: number; // BUKU!DG7
  hargaFinalPerPcs: number; // BUKU!DI7
}

// Resolve mesin Otomatis 1:1 kondisi file tersimpan (cover selalu Print Inter,
// isi kecil=Print Buya, besar=Ryobi; batas 250 = tier max file kecil / min file besar)
export function resolveMesinCover(m: TabunganNsMesinCover): string {
  return m === 'Otomatis' ? 'Print Inter' : m;
}
export function resolveMesinIsi(m: TabunganNsMesinIsi, oplahPcs: number): string {
  if (m !== 'Otomatis') return m;
  return oplahPcs < 250 ? 'Print Buya' : 'Ryobi';
}

const eqI = (a: string, b: string) => a.toUpperCase() === b.toUpperCase(); // Excel IF case-insensitive

export function calculateBukuTabunganNsHpp(
  input: BukuTabunganNsSimulatorInput,
  rawParams: BukuTabunganNsMasterParams = DEFAULT_BUKU_TABUNGAN_NS_PARAMS
): BukuTabunganNsSimulatorResult {
  const p: BukuTabunganNsMasterParams = { ...DEFAULT_BUKU_TABUNGAN_NS_PARAMS, ...(rawParams || {}) };
  const H = Math.max(0, Math.round(input.oplahPcs));
  const C6 = input.jumlahHalaman; // BUKU!C6 = Master!D6
  const C7 = C6 / 4; // BUKU!C7 lembar/buku
  const D7 = 10; // BUKU!D7 (Master!D5 = 10 X 15)
  const F7 = 15.5; // BUKU!F7
  const mC = resolveMesinCover(input.mesinCover);
  const mI = resolveMesinIsi(input.mesinIsi, H);
  const nWC = input.warnaCover; // BUKU!Z2
  const nWI = input.warnaIsi; // BUKU!AJ7
  const nMuka = input.mukaCover; // BUKU!N7
  const Kcov = H > 0 ? input.insheetCover : 0; // BUKU!K7
  const Kisi = H > 0 ? input.insheetIsi : 0; // BUKU!AI7
  const umrH = p.umr / 25; // A07.UMR/25

  // ---- COVER: O7/P7 kapasitas plano (BUKU!O7/P7) ----
  const O7 = eqI(mC, 'SM') ? 2 : eqI(mC, 'Oliver') ? 4 : eqI(mC, 'Ryobi') ? 9 : eqI(mC, 'Print Inter') ? 1 : 0;
  const P7 = eqI(mC, 'SM') ? 16 : eqI(mC, 'Oliver') ? 16 : eqI(mC, 'Ryobi') ? 9 : eqI(mC, 'Print Inter') ? 4 : 0;
  const R7 = H > 0 ? Math.ceil(H / P7 + Kcov / O7) : 0; // BUKU!R7 kebutuhan plano
  const Q7 = R7 * O7 * nMuka; // BUKU!Q7 impresi cetak

  // ---- KERTAS COVER: W29 ream -> T7 (BUKU!W29/T7) ----
  const V27 = eqI(mC, 'SM') ? 79 : eqI(mC, 'Oliver') || eqI(mC, 'Ryobi') ? 65 : eqI(mC, 'Print Inter') ? 32.5 : 0; // BUKU!V27
  const W27 = eqI(mC, 'SM') ? 109 : eqI(mC, 'Oliver') || eqI(mC, 'Ryobi') ? 100 : eqI(mC, 'Print Inter') ? 48 : 0; // BUKU!W27
  const W29 = ((V27 * W27) * input.gramaturCover) / 20000 * (p.tarifKertasCoverKg * p.upKertasCoverPct / 100 + p.tarifKertasCoverKg);
  const T2 = eqI(mC, 'Print Inter') ? p.tarifPrintCoverA3 : eqI(mC, 'Print Buya') ? 300 : 0; // BUKU!T2
  const T7 = eqI(mC, 'Ryobi') || eqI(mC, 'Oliver') || eqI(mC, 'SM') ? (R7 / 500) * W29 : eqI(mC, 'Print Inter') ? T2 * R7 : 0;

  const V7 = H > 0 ? p.tarifDesainCover : 0; // BUKU!V7 = Master!D17
  const W7 = 0; // BUKU!W7 Film BW: V30 kosong -> selalu 0 (di luar DC7)
  // ---- PLAT & CETAK COVER: Y6/AB6/AC7/AD7/AE7/AF7/AG7 ----
  const Y6 = eqI(mC, 'SM') ? 78000 : eqI(mC, 'Oliver') ? 45000 : eqI(mC, 'Ryobi') ? 10000 : 0; // BUKU!Y6
  const Z7 = nWC * nMuka; // BUKU!Z7 (Z6=0 -> Z2*N7)
  const Y7 = Y6 * Z7;
  const AB6 = eqI(mC, 'SM') ? 310000 : eqI(mC, 'Oliver') ? 90000 : eqI(mC, 'Ryobi') ? 15000 : 0; // BUKU!AB6
  const AC7 = eqI(mC, 'SM') ? 100 : eqI(mC, 'Oliver') ? 40 : eqI(mC, 'Ryobi') ? 30 : 0; // BUKU!AC7
  const AD7 = AB6 * Z7;
  const AE7 = eqI(mC, 'Print Inter') ? 0
    : eqI(mC, 'Ryobi') ? (Q7 - 500 > 1 ? Q7 - 500 : 0)
    : eqI(mC, 'Oliver') ? (Q7 - 1000 > 1 ? Q7 - 1000 : 0)
    : eqI(mC, 'SM') ? (Q7 - 3000 > 1 ? Q7 - 3000 : 0) : 0; // BUKU!AE7
  const AF7 = (AE7 === 0 ? 0 : AE7 > 1 ? AE7 : 0) * AC7 * nWC; // BUKU!AF7
  const AG7 = eqI(mC, 'SM') || eqI(mC, 'Oliver') || eqI(mC, 'Ryobi') ? AF7 + AD7 : 0; // BUKU!AG7

  // ---- ISI: AK7/AL7/AM7/AN7/AO7/AP7 (BUKU!AK7-AP7) ----
  const AK7 = eqI(mI, 'SM') ? 32 : eqI(mI, 'Oliver') ? 16 : eqI(mI, 'Ryobi') || eqI(mI, 'Print Buya') ? 4 : eqI(mI, 'Print Inter') ? 8 : 0;
  const AL7 = eqI(mI, 'SM') ? 1 : eqI(mI, 'Oliver') ? 2 : 1; // Ryobi/Buya/Inter = 1
  const AM7 = eqI(mI, 'SM') || eqI(mI, 'Oliver') ? 64 : eqI(mI, 'Ryobi') || eqI(mI, 'Print Buya') ? 8 : eqI(mI, 'Print Inter') ? 16 : 0;
  const AN7 = C6 / (AM7 / AL7);
  const AN6 = Math.ceil(AN7); // BUKU!AN6 = ROUNDUP(AN7, AN2=0)
  const AP7 = H > 0 ? (H / AL7) * AN7 + (Kisi / AL7) * AN6 : 0;
  const AO7 = AP7 * AL7;

  // ---- KERTAS ISI: AU29 ream -> AR7 ----
  const AT27 = eqI(mI, 'SM') || eqI(mI, 'Oliver') ? 61 : eqI(mI, 'Ryobi') || eqI(mI, 'Print Buya') ? 21.5 : eqI(mI, 'Print Inter') ? 32.5 : 0; // BUKU!AT27
  const AU27 = eqI(mI, 'SM') || eqI(mI, 'Oliver') ? 86 : eqI(mI, 'Ryobi') || eqI(mI, 'Print Buya') ? 33 : eqI(mI, 'Print Inter') ? 48 : 0; // BUKU!AU27
  const AU29 = ((AT27 * AU27) * input.gramaturIsi) / 20000 * (p.tarifKertasIsiKg * p.upKertasIsiPct / 100 + p.tarifKertasIsiKg);
  const AR2 = eqI(mI, 'Print Buya') ? p.tarifJasaPrintBuya : eqI(mI, 'Print Inter') ? p.tarifPrintIsiA3 : 0; // BUKU!AR2
  const AR7 = eqI(mI, 'Print Inter') ? AR2 * 2 * AP7
    : eqI(mI, 'Print Buya') || eqI(mI, 'Ryobi') || eqI(mI, 'Oliver') || eqI(mI, 'SM') ? (AP7 / 500) * AU29 : 0; // BUKU!AR7

  const AT7 = H > 0 ? p.tarifDesainIsiPerLbr * C7 : 0; // BUKU!AT7 = Master!D26 * C7
  const AU7 = p.tarifKertasIsiKg > 0 ? (D7 + 1) * (F7 + 1) * p.tarifFilmWarna * C7 : 0; // BUKU!AU7 = IF(AU30>0,...) AU30=Master!D22=tarifKertasIsiKg (AU6=0 -> 0, di luar DC7)
  // ---- PLAT & CETAK ISI: AW6/AX7/AY7/AZ7/BA7/BB7/BC7/BD7 ----
  const AW6 = eqI(mI, 'Print Buya') || eqI(mI, 'Print Inter') ? 0 : eqI(mI, 'Ryobi') ? 10000 : eqI(mI, 'Oliver') ? 45000 : eqI(mI, 'SM') ? 78000 : 0; // BUKU!AW6
  const AX7 = Math.ceil(C6 / AK7) * nWI; // BUKU!AX7 (AY2*AJ7, AY2=ROUNDUP(C6/AK7))
  const AY6 = eqI(mI, 'Print Buya') || eqI(mI, 'Print Inter') ? 0 : eqI(mI, 'Ryobi') ? 15000 : eqI(mI, 'Oliver') ? 90000 : eqI(mI, 'SM') ? 310000 : 0; // BUKU!AY6
  const AY7 = H > 0 ? AY6 : 0;
  const AZ7 = eqI(mI, 'Print Buya') || eqI(mI, 'Print Inter') ? 0 : eqI(mI, 'Ryobi') ? 30 : eqI(mI, 'Oliver') ? 40 : eqI(mI, 'SM') ? 100 : 0; // BUKU!AZ7
  const AW7 = H > 0 ? AW6 * AX7 : 0;
  const BA7 = AY7 * AX7;
  const BB7 = {
    Ryobi: (H + Kisi - 500) * AX7,
    Oliver: (H + Kisi - 1000) * AX7,
    SM: (H + Kisi - 3000) * AX7,
  } as Record<string, number>;
  const bbRaw = eqI(mI, 'Ryobi') ? BB7.Ryobi : eqI(mI, 'Oliver') ? BB7.Oliver : eqI(mI, 'SM') ? BB7.SM : 0;
  const BB7v = bbRaw > 1 ? bbRaw : 0; // Buya/Inter -> 0 (BUKU!BB7)
  const BC7 = (BB7v === 0 ? 0 : BB7v > 1 ? BB7v : 0) * AZ7; // BUKU!BC7
  const BD7 = eqI(mI, 'Print Buya') ? AR2 * AO7 : BC7 + BA7; // BUKU!BD7 (Inter/Ryobi/Oliver/SM = BC+BA)

  const BF7 = H * p.royalty; // BUKU!BF7 = Master!D36
  const BH7 = H > 0 ? 0 : 0; // BUKU!BH7 Transp (BH6=0 statis)
  // ---- JASA UMR/25 (BUKU!BI6/BJ6/BM6) ----
  const BI28 = C6 >= 71 ? 700 : C6 >= 31 ? 800 : 900; // BUKU!BI28 lookup C6
  const BI6 = umrH / BI28;
  const BI7 = H * BI6; // BUKU!BI7 Susun Lipat
  const BJ6 = input.jahitAktif ? umrH / p.targetJahit : 0; // BUKU!BJ6 (BJ26)
  const BJ7 = H > 0 ? (BJ6 * H <= p.minJahit ? p.minJahit : BJ6 * H) : 0; // BUKU!BJ7 min 250rb (NOTE: min berlaku bahkan saat toggle X karena BJ6=0 -> 0<=min -> min! 1:1 Excel)
  const BL6 = input.pisauPoundAktif ? p.tarifPisauPound : 0; // BUKU!BL6 (BL26)
  const BL7 = H > 0 ? (D7 * F7 + D7 * 2) * BL6 : 0; // BUKU!BL7 Pisau Pound
  const BM6 = input.jasaPoundAktif ? umrH / p.targetPound : 0; // BUKU!BM6 (BM26)
  const BM7 = H > 0 ? (BM6 * H <= p.minPound ? p.minPound : BM6 * H) : 0; // BUKU!BM7 min 50rb (1:1, sama seperti Jahit)
  const BN7 = BL7 + BM7; // BUKU!BN7
  const BP7 = 0; // BUKU!BP7 Biaya Lain-Lain (BP6=0 statis)
  const BQ7 = H * (input.sisirAktif ? p.tarifSisirPaket : 0); // BUKU!BQ7 Sisir (BQ26)

  // ---- SPOT UV / EMBOSS (BUKU!BS6-BW7, BY6-CA7) ----
  const M7 = C6 === 0 ? 0 : C6 <= 100 ? 0.5 : C6 <= 200 ? 0.7 : C6 <= 300 ? 1.5 : C6 <= 400 ? 2 : C6 <= 500 ? 2.5 : C6 <= 600 ? 2.5 : 2.8; // BUKU!M7 punggung
  const BS6 = p.acuanSpotUvCm / 4 / ((D7 * 2 + M7) * F7);
  const BS7 = H / BS6;
  const BT7 = BS7 * p.tarifTintaSpotUvKg;
  const BV7 = (umrH / p.targetSpotUv) * H; // BUKU!BV6*H
  const FULL = 'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,';
  const BW7 = input.finishing === FULL ? BT7 + BV7 : 0; // BUKU!BW27
  const BY7 = H > 0 ? (D7 + 4) * (F7 + 4) * 500 * 2 : 0; // BUKU!BY6 klise
  const BZ7 = H * (umrH / p.targetEmboss);
  const CA7 = input.finishing === FULL ? BY7 + BZ7 : 0; // BUKU!CA27

  // ---- BENDING + LAMINASI + KOMBO (BUKU!CC7-CQ7) ----
  const bendingOn = input.finishing === 'Lem Bending,' || input.finishing === FULL; // BUKU!CC27
  const CC7 = bendingOn ? p.tarifBending * F7 * M7 * H : 0;
  const CD7 = p.tarifBending * F7 * M7 * H;
  const CE7 = CD7 === 0 ? 0 : CD7 > p.minBendingKombi ? CD7 : p.minBendingKombi;
  const luasLam = (D7 * 2 + 1) * (F7 + 1);
  const CF7 = luasLam * p.tarifLamGlossy * H;
  const minLam = (raw: number) => (raw === 0 ? 0 : raw > p.minLaminasi ? raw : p.minLaminasi);
  const CG7 = input.finishing === 'Laminasi Glossy,' || input.finishing === FULL ? minLam(CF7) : 0; // BUKU!CG27
  const CH7 = minLam(CF7);
  const CI7 = luasLam * p.tarifLamDoff * H;
  const CJ7 = input.finishing === 'Laminasi Doff,' || input.finishing === FULL ? minLam(CI7) : 0; // BUKU!CJ27
  const CK7 = minLam(CI7);
  const CL7 = luasLam * p.tarifUvVarnish * H;
  const CM7 = input.finishing === 'UV Varnish,' || input.finishing === FULL ? minLam(CL7) : 0; // BUKU!CM27
  const CN7 = minLam(CL7);
  const CO7 = input.finishing === 'UV Varnish + Bending,' ? CN7 + CE7 : 0; // BUKU!CO27
  const CP7 = input.finishing === 'Laminasi Glossy + Bending,' ? CH7 + CE7 : 0; // BUKU!CP27
  const CQ7 = input.finishing === 'Laminasi Doff + Bending,' ? CK7 + CE7 : 0; // BUKU!CQ27

  // ---- SRING (BUKU!CS6-CW7) ----
  const CS6 = p.ukuranPlastikSringCm / (F7 + 8);
  const CS7 = H / CS6;
  const CT7 = CS7 * p.tarifPlastikSringRoll;
  const CV7 = ((umrH * 2) / p.targetSring) * H; // BUKU!CV6*H
  const CW7 = input.finishing === 'Laminasi Glossy + Bending,' || input.finishing === FULL ? CV7 + CT7 : 0; // BUKU!CW28

  // ---- LAKBAN + KARDUS (BUKU!CY6-DA7) ----
  const CY35 = C6 === 0 ? 0 : C6 <= 100 ? 500 : C6 <= 200 ? 400 : C6 <= 300 ? 300 : C6 <= 400 ? 200 : C6 <= 500 ? 100 : C6 <= 600 ? 50 : 2.8; // BUKU!CY35
  const CY6 = p.ukuranLakbanCm / 196;
  const CY7 = H / CY35 / CY6;
  const CZ7 = p.tarifLakbanRoll * CY7;
  const DA7 = input.kardusAktif ? Math.ceil(H / CY35) * p.tarifKardusBox + CZ7 : 0; // BUKU!DA7 (DA28)

  // ---- TOTAL 1:1 (BUKU!DC7 — NOTE quirk: BN7+BM7+BL7 triple-count Pound, 1:1 Excel) ----
  const DC7 = T7 + V7 + Y7 + AG7 + AR7 + AT7 + AW7 + BD7 + BF7 + BH7 + BI7 + BQ7
    + CC7 + CG7 + CJ7 + CM7 + CO7 + CP7 + CQ7 + BP7 + DA7 + CW7 + CA7 + BW7 + BN7 + BM7 + BL7 + BJ7;
  const DD7 = H > 0 ? DC7 / H : 0;
  const DE7 = DD7 * (input.marginPct / 100); // BUKU!DE7 (DE6 = margin)
  const DF7 = DE7 * H;
  const DG7 = (DD7 + DE7) * H;
  const DH7 = H > 0 ? DG7 / H : 0;
  const DI7 = H > 0 ? Math.ceil(DH7 / 10) * 10 : 0; // BUKU!DI7 = ROUNDUP(DH7,-1) puluhan

  const breakdown: BukuTabunganNsBreakdownItem[] = [];
  const add = (nama: string, nominal: number, keterangan = '') => {
    const v = Math.round(nominal * 100) / 100;
    breakdown.push({ nama, nominal: v, pct: 0, keterangan });
  };
  add('Kertas Cover', T7, `BUKU!T7: ${R7} plano × Rp ${Math.round(W29).toLocaleString('id-ID')}/rim-equiv (${mC})`);
  add('Desain Cover', V7, 'BUKU!V7 = Master!D17 flat');
  add('Plate Cover', Y7, `BUKU!Y7: ${Z7} plat × Rp ${Y6.toLocaleString('id-ID')} (${mC})`);
  add('Ongkos Cetak Cover', AG7, `BUKU!AG7: min Rp ${(AB6 * Z7).toLocaleString('id-ID')} + over Rp ${Math.round(AF7).toLocaleString('id-ID')} (${mC})`);
  add('Kertas Isi', AR7, `BUKU!AR7: ${Math.round(AP7 * 100) / 100} plano × ream Rp ${Math.round(AU29).toLocaleString('id-ID')} (${mI})`);
  add('Desain Isi', AT7, `BUKU!AT7: ${C7} lbr × Rp ${p.tarifDesainIsiPerLbr.toLocaleString('id-ID')}`);
  add('Plate Isi', AW7, `BUKU!AW7: ${AX7} plat × Rp ${AW6.toLocaleString('id-ID')} (${mI})`);
  add('Ongkos Cetak Isi', BD7, `BUKU!BD7: min Rp ${Math.round(BA7).toLocaleString('id-ID')} + over Rp ${Math.round(BC7).toLocaleString('id-ID')} (${mI})`);
  if (BF7 !== 0) add('Royalty', BF7, 'BUKU!BF7 = Master!D36');
  if (BH7 !== 0) add('Transport', BH7, 'BUKU!BH7');
  add('Jasa Susun + Lipat', BI7, `BUKU!BI7: ${H} × Rp ${Math.round(BI6 * 100) / 100} (UMR/25÷${BI28})`);
  add('Jasa Jahit', BJ7, `BUKU!BJ7: min Rp ${p.minJahit.toLocaleString('id-ID')}`);
  add('Pisau Pound', BL7, 'BUKU!BL7');
  add('Jasa Pound', BM7, `BUKU!BM7: min Rp ${p.minPound.toLocaleString('id-ID')}`);
  add('Pound Gabungan (BN7)', BN7, 'BUKU!BN7 = BL7+BM7 — quirk Excel: masuk DC7 bersama BL7 & BM7 (triple-count 1:1)');
  if (BQ7 !== 0) add('Sisir', BQ7, 'BUKU!BQ7');
  if (BW7 !== 0) add('Spot UV', BW7, 'BUKU!BW7 (tinta + jasa)');
  if (CA7 !== 0) add('Emboss', CA7, 'BUKU!CA7 (klise + jasa)');
  if (CC7 !== 0) add('Bending', CC7, 'BUKU!CC7');
  if (CG7 !== 0) add('Laminasi Glossy', CG7, `BUKU!CG7: min Rp ${p.minLaminasi.toLocaleString('id-ID')}`);
  if (CJ7 !== 0) add('Laminasi Doff', CJ7, `BUKU!CJ7: min Rp ${p.minLaminasi.toLocaleString('id-ID')}`);
  if (CM7 !== 0) add('UV Varnish', CM7, `BUKU!CM7: min Rp ${p.minLaminasi.toLocaleString('id-ID')}`);
  if (CO7 !== 0) add('UV Varnish + Bending', CO7, 'BUKU!CO7');
  if (CP7 !== 0) add('Laminasi Glossy + Bending', CP7, 'BUKU!CP7');
  if (CQ7 !== 0) add('Laminasi Doff + Bending', CQ7, 'BUKU!CQ7');
  if (BP7 !== 0) add('Biaya Lain-Lain', BP7, 'BUKU!BP7');
  if (DA7 !== 0) add('Kardus + Lakban', DA7, `BUKU!DA7: ${Math.ceil(H / CY35)} box + lakban`);
  if (CW7 !== 0) add('Sring + Packing', CW7, 'BUKU!CW7 (plastik + jasa)');
  // Info di luar DC7 (1:1 Excel tidak menjumlah W7/AU7 ke Total HPP):
  breakdown.push({ nama: 'Film BW Cover (info)', nominal: W7, pct: 0, keterangan: 'BUKU!W7 — V30 kosong, selalu 0, di luar DC7', diLuarTotal: true });
  breakdown.push({ nama: 'Film Warna Isi (info)', nominal: Math.round(AU7 * 100) / 100, pct: 0, keterangan: 'BUKU!AU7 — AU6=0, selalu 0, di luar DC7', diLuarTotal: true });
  breakdown.forEach((b) => { b.pct = DC7 > 0 && !b.diLuarTotal ? b.nominal / DC7 : 0; });

  return {
    input,
    mesinCoverEfektif: mC,
    mesinIsiEfektif: mI,
    breakdown,
    kebutuhanCoverPlano: R7,
    kebutuhanIsiPlano: Math.round(AP7 * 100) / 100,
    totalHpp: DC7,
    hppPerPcs: DD7,
    labaPerPcs: DE7,
    totalLaba: DF7,
    totalHarga: DG7,
    hargaFinalPerPcs: DI7,
  };
}

export type SavedBukuTabunganNsSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: BukuTabunganNsSimulatorResult;
  paramsSnapshot?: BukuTabunganNsMasterParams;
};
