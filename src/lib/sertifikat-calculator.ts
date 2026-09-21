// Sertifikat — kalkulator murni 1:1 engine BUKU dari 6 file master:
//   Pricelist Sertifikat 1 Muka {Ac 230, BC, Linen} × {Oliver, Print} - 21 x 29,7 cm
//   (12. Pricelist Sertifikat/Source)
// Lapisan: Master (input) → BUKU (engine per tier pcs) → Harga_Final (output).
// Oplah Excel dalam PCS (Oliver: 1000–3000; Print Inter: 100–500).
// Terminologi 1:1 Excel: Insheet, Plate, Drek, Desain, Film, Sisir, Klise Foil,
//   Laminasi Glossy/Doff, UV Varnish, Lakban, Kardus, Royalty, Transp, BTKL/BOP
//   (BTKL/BOP tak ada di file Sertifikat — tidak dipakai).

export type SertifikatBahan = 'Art Carton' | 'BC Putih' | 'Linen Crem';
export type SertifikatMesin = 'Oliver' | 'SM' | 'Print Inter' | 'Ryobi';
export type SertifikatUkuran = '21 x 29,7' | '21,5 x 33';
export type SertifikatFinishing = 'None,' | 'UV Varnish,' | 'Laminasi Glossy,' | 'Laminasi Doff,';

export const SERTIFIKAT_BAHAN: SertifikatBahan[] = ['Art Carton', 'BC Putih', 'Linen Crem'];
export const SERTIFIKAT_MESIN: SertifikatMesin[] = ['Oliver', 'SM', 'Print Inter', 'Ryobi'];
export const SERTIFIKAT_UKURAN: SertifikatUkuran[] = ['21 x 29,7', '21,5 x 33'];
export const SERTIFIKAT_FINISHING: SertifikatFinishing[] = ['None,', 'UV Varnish,', 'Laminasi Glossy,', 'Laminasi Doff,'];
export const SERTIFIKAT_GRAMATUR_OPTIONS = [50, 52, 57, 58, 60, 70, 80, 100, 120, 150, 210, 230, 260, 300, 310]; // Master!D11

export interface SertifikatMasterParams {
  umr: number; // Master!D8 → jasa foil BUKU!AO6 = (UMR/25)/500
  hargaKgAc: number; // Master!D12 file Art Carton
  hargaKgBc: number; // Master!D12 file BC
  hargaKgLinen: number; // Master!D12 file Linen
  upAcOffset: number; // Master!E12 Ac + Oliver-family (%) — SM/Ryobi ikut pola Oliver
  upAcPrint: number; // Master!E12 Ac + Print Inter (%)
  upBcOffset: number; // Master!E12 BC + Oliver-family (%)
  upBcPrint: number; // Master!E12 BC + Print Inter (%)
  upLinenOffset: number; // Master!E12 Linen + Oliver-family (%)
  upLinenPrint: number; // Master!E12 Linen + Print Inter (%)
  gramaturAc: number; // Master!D11 file Art Carton
  gramaturBc: number; // Master!D11 file BC
  gramaturLinen: number; // Master!D11 file Linen
  insheetOffset: number; // Master!D13 file Oliver (100) — SM/Ryobi ikut pola Oliver
  insheetPrint: number; // Master!D13 file Print Inter (7)
  desain: number; // Master!D17 (20000 semua file)
  tarifPrintAc: number; // Master!D18 file Ac (2700) → BUKU!T2
  tarifPrintBc: number; // Master!D18 file BC (3800) → BUKU!T2
  tarifPrintLinen: number; // Master!D18 file Linen (3800) → BUKU!T2
  tarifSisir: number; // BUKU!AS6 = 5000 (selalu ditarik via AS7)
  tarifLamGlossy: number; // BUKU!AU6 = 0,35 (string koma di Excel)
  tarifLamDoff: number; // BUKU!AX6 = 0,4
  tarifUv: number; // BUKU!BA6 = 0,12
  tarifLakbanRoll: number; // Master!D21 → BUKU!BF32
  tarifKardusBox: number; // Master!D22 → BUKU!BG6
  tarifFoilPlastikRoll: number; // BUKU!AN33 = 295000 (masuk via AP7 bila foil √)
  royaltyPerPcs: number; // Master!D23 → BUKU!AI6
  transportPerOrder: number; // BUKU!AR6
  labaPct: number; // Master!E24 → BUKU!BK6
}

export const DEFAULT_SERTIFIKAT_PARAMS: SertifikatMasterParams = {
  umr: 2818585,
  hargaKgAc: 16400,
  hargaKgBc: 24100,
  hargaKgLinen: 29900,
  upAcOffset: 5,
  upAcPrint: 0,
  upBcOffset: 5,
  upBcPrint: 5,
  upLinenOffset: 0,
  upLinenPrint: 0,
  gramaturAc: 230,
  gramaturBc: 200,
  gramaturLinen: 300,
  insheetOffset: 100,
  insheetPrint: 7,
  desain: 20000,
  tarifPrintAc: 2700,
  tarifPrintBc: 3800,
  tarifPrintLinen: 3800,
  tarifSisir: 5000,
  tarifLamGlossy: 0.35,
  tarifLamDoff: 0.4,
  tarifUv: 0.12,
  tarifLakbanRoll: 8000,
  tarifKardusBox: 8500,
  tarifFoilPlastikRoll: 295000,
  royaltyPerPcs: 0,
  transportPerOrder: 0,
  labaPct: 30,
};

// BUKU!O7/P7 per mesin (sama untuk kedua ukuran) — BUKU!V27/W27 dimensi dasar kertas
const SERTIFIKAT_MESIN_SPEC: Record<SertifikatMesin, {
  o7: number; p7: number; v27: number; w27: number;
  plate: number; minOrder: number; drek: number; overMode: 'Q-1000' | 'Q-3000' | 'none' | 'Q-500';
}> = {
  // BUKU!O7 — BUKU!P7 — BUKU!V27 — BUKU!W27 — BUKU!Y6 — BUKU!AB6 — BUKU!AC7 — BUKU!AE7
  'Oliver': { o7: 5, p7: 10, v27: 79, w27: 109, plate: 45000, minOrder: 90000, drek: 40, overMode: 'Q-1000' },
  'SM': { o7: 2, p7: 8, v27: 79, w27: 109, plate: 78000, minOrder: 310000, drek: 100, overMode: 'Q-3000' },
  'Print Inter': { o7: 1, p7: 2, v27: 32.5, w27: 48, plate: 0, minOrder: 0, drek: 0, overMode: 'none' },
  'Ryobi': { o7: 11, p7: 11, v27: 79, w27: 109, plate: 10000, minOrder: 15000, drek: 30, overMode: 'Q-500' },
};

// BUKU!D7/F7 dimensi display untuk basis laminasi/UV
const SERTIFIKAT_DIM_DISPLAY: Record<SertifikatUkuran, { d: number; f: number }> = {
  '21 x 29,7': { d: 21, f: 29.7 },
  '21,5 x 33': { d: 21.5, f: 33 },
};

export const SERTIFIKAT_TIERS = [100, 200, 300, 400, 500, 1000, 1500, 2000, 2500, 3000]; // union tier file

export interface SertifikatSimulatorInput {
  oplahPcs: number; // BUKU!H
  ukuran: SertifikatUkuran; // Master!D5
  bahan: SertifikatBahan; // Master!D10
  gramatur: number; // Master!D11 → BUKU!W28
  nWarna: 1 | 2 | 3 | 4; // Master!D15 → BUKU!L7/Z2
  muka: 1 | 2; // Master!D14 → BUKU!N7
  mesin: SertifikatMesin; // Master!D16
  finishing: SertifikatFinishing; // Master!D20 → AV27/AY27/BB27
  foilAktif: boolean; // BUKU!AP27 √/X (AN27 selalu √ sesuai file)
  kardusAktif: boolean; // BUKU!BG28 √/X
  insheetLembar: number; // Master!D13 → BUKU!K6
  marginPct: number; // override BUKU!BK6 (= Master!E24)
}

export interface SertifikatBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface SertifikatSimulatorResult {
  input: SertifikatSimulatorInput;
  breakdown: SertifikatBreakdownItem[];
  kebutuhanPlano: number; // BUKU!R7
  totalHpp: number; // BUKU!BI7
  hppPerPcs: number; // BUKU!BJ7
  labaPerPcs: number; // BUKU!BK7
  labaTotal: number; // BUKU!BL7
  totalHarga: number; // BUKU!BM7
  hargaPerPcs: number; // BUKU!BN7
  hargaFinalPerPcs: number; // BUKU!BO7
  marginPct: number;
}

export function hargaKgForBahan(bahan: SertifikatBahan, p: SertifikatMasterParams): number {
  return bahan === 'Art Carton' ? p.hargaKgAc : bahan === 'BC Putih' ? p.hargaKgBc : p.hargaKgLinen;
}

export function upPctForSpec(bahan: SertifikatBahan, mesin: SertifikatMesin, p: SertifikatMasterParams): number {
  const isPrint = mesin === 'Print Inter';
  if (bahan === 'Art Carton') return isPrint ? p.upAcPrint : p.upAcOffset;
  if (bahan === 'BC Putih') return isPrint ? p.upBcPrint : p.upBcOffset;
  return isPrint ? p.upLinenPrint : p.upLinenOffset;
}

export function gramaturDefaultForBahan(bahan: SertifikatBahan, p: SertifikatMasterParams): number {
  return bahan === 'Art Carton' ? p.gramaturAc : bahan === 'BC Putih' ? p.gramaturBc : p.gramaturLinen;
}

export function tarifPrintForBahan(bahan: SertifikatBahan, p: SertifikatMasterParams): number {
  return bahan === 'Art Carton' ? p.tarifPrintAc : bahan === 'BC Putih' ? p.tarifPrintBc : p.tarifPrintLinen;
}

export function insheetDefaultForMesin(mesin: SertifikatMesin, p: SertifikatMasterParams): number {
  return mesin === 'Print Inter' ? p.insheetPrint : p.insheetOffset;
}

export function roundUpTens(n: number): number {
  return Math.ceil(n / 10) * 10;
}

export function calculateSertifikatHpp(
  input: SertifikatSimulatorInput,
  rawParams: SertifikatMasterParams = DEFAULT_SERTIFIKAT_PARAMS
): SertifikatSimulatorResult {
  const p: SertifikatMasterParams = { ...DEFAULT_SERTIFIKAT_PARAMS, ...(rawParams || {}) };
  const { oplahPcs, ukuran, bahan, gramatur, nWarna, muka, mesin, finishing, foilAktif, kardusAktif, insheetLembar, marginPct } = input;
  const H = Math.max(1, oplahPcs);
  const spec = SERTIFIKAT_MESIN_SPEC[mesin];
  const disp = SERTIFIKAT_DIM_DISPLAY[ukuran];
  const isPrint = mesin === 'Print Inter';

  const breakdown: SertifikatBreakdownItem[] = [];
  let totalHpp = 0;
  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal * 100) / 100, pct: 0, keterangan });
    totalHpp += nominal;
  };

  // BUKU!K7 = K6 — BUKU!L7 = warna — BUKU!N7 = muka (M7 selalu 0)
  const K7 = insheetLembar; // BUKU!K7
  const N7 = muka; // BUKU!N7
  // BUKU!R7 = ROUNDUP((H/P7)+(K7/O7),0) — BUKU!Q7 = R7*O7*N7
  const R7 = Math.ceil(H / spec.p7 + K7 / spec.o7); // BUKU!R7
  const Q7 = R7 * spec.o7 * N7; // BUKU!Q7
  // BUKU!W29 = ((V27*W27)*W28)/20000*((W30*Y30)+W30)
  const hargaKg = hargaKgForBahan(bahan, p);
  const upPct = upPctForSpec(bahan, mesin, p);
  const W29 = ((spec.v27 * spec.w27) * gramatur) / 20000 * ((hargaKg * (upPct / 100)) + hargaKg);
  // BUKU!T7 = (W29/500)*R7 (offset) atau Q7*T2 (Print Inter, T2 = D18)
  const T7 = isPrint ? Q7 * tarifPrintForBahan(bahan, p) : (W29 / 500) * R7;
  add(isPrint ? 'Cetak Print Inter' : 'Kertas', T7,
    isPrint ? `${Q7} × Rp ${tarifPrintForBahan(bahan, p).toLocaleString('id-ID')}` : `${R7} lbr plano × Rp ${(W29 / 500).toLocaleString('id-ID')}`);
  // BUKU!V7 = V6 = D17
  add('Desain', p.desain, `Master!D17 Rp ${p.desain.toLocaleString('id-ID')}`);
  // BUKU!Z7 = IF(Z6>0, Z6, Z2*N7)
  const Z7 = p.platOverride > 0 ? p.platOverride : nWarna * N7; // BUKU!Z7
  add('Plate', spec.plate * Z7, `${Z7} plat × Rp ${spec.plate.toLocaleString('id-ID')} (${mesin})`);
  // BUKU!AD7 = AB6*Z7 — BUKU!AE7 over — BUKU!AF7 = AE*AC*Z2 — BUKU!AG7 = AF+AD
  const AD7 = spec.minOrder * Z7; // BUKU!AD7
  const overBase = spec.overMode === 'Q-1000' ? Q7 - 1000 : spec.overMode === 'Q-3000' ? Q7 - 3000 : spec.overMode === 'Q-500' ? Q7 - 500 : -1;
  const AE7 = overBase > 1 ? overBase : 0; // BUKU!AE7 (Print Inter: 0 tetap)
  const AF7 = AE7 <= 0 ? 0 : AE7 * spec.drek * nWarna; // BUKU!AF7 (AE7>1 selalu benar bila AE7>0)
  add('Ongkos Cetak Min Order', AD7, `${Z7} plat × Rp ${spec.minOrder.toLocaleString('id-ID')}`);
  add('Ongkos Cetak Over', AF7, AE7 > 0 ? `${AE7} × Rp ${spec.drek}/drek × ${nWarna}` : 'di bawah ambang → 0');
  // BUKU!AI7 = H*AI6 (royalty)
  add('Royalty', H * p.royaltyPerPcs, `${H} pcs × Rp ${p.royaltyPerPcs.toLocaleString('id-ID')}`);
  // BUKU!AR7 = AR6 (transport)
  add('Transport', p.transportPerOrder, 'per order');
  // BUKU!AS7 = ROUNDUP(H/500,0)*AS6 (Sisir — selalu, tanpa syarat)
  add('Sisir', Math.ceil(H / 500) * p.tarifSisir, `ceil(${H}/500) × Rp ${p.tarifSisir.toLocaleString('id-ID')}`);
  // Laminasi/UV: basis selalu dihitung; dikenakan bila checkbox √ (min 50000)
  // BUKU!AU7 = ((D+1)*(F+1)*AU6)*H — BUKU!AV7 = IF(AV27 √, MAX(AU7,50000), 0)
  const lamBase = (disp.d + 1) * (disp.f + 1) * p.tarifLamGlossy * H; // BUKU!AU7
  const doffBase = (disp.d + 1) * (disp.f + 1) * p.tarifLamDoff * H; // BUKU!AX7
  const uvBase = (disp.d + 1) * (disp.f + 1) * p.tarifUv * H; // BUKU!BA7
  const aboveMin = (v: number) => (v === 0 ? 0 : v > 50000 ? v : 50000);
  add('Laminasi Glossy', finishing === 'Laminasi Glossy,' ? aboveMin(lamBase) : 0,
    finishing === 'Laminasi Glossy,' ? `AV27=√, max(Rp ${Math.round(lamBase).toLocaleString('id-ID')}, 50000)` : 'AV27=X → 0');
  add('Laminasi Doff', finishing === 'Laminasi Doff,' ? aboveMin(doffBase) : 0,
    finishing === 'Laminasi Doff,' ? `AY27=√, max(Rp ${Math.round(doffBase).toLocaleString('id-ID')}, 50000)` : 'AY27=X → 0');
  add('UV Varnish', finishing === 'UV Varnish,' ? aboveMin(uvBase) : 0,
    finishing === 'UV Varnish,' ? `BB27=√, max(Rp ${Math.round(uvBase).toLocaleString('id-ID')}, 50000)` : 'BB27=X → 0');
  // BUKU!BE7 = (H/BE35)/BE6 — BUKU!BF7 = BF32*BE7 — BUKU!BG7 = IF(BG28 √, ROUNDUP(H/BE35)*BG6+BF7, 0)
  const BE6 = 7650 / 196; // BUKU!BE6 = BF30/196
  const BE7 = (H / 1000) / BE6; // BUKU!BE7
  const BF7 = p.tarifLakbanRoll * BE7; // BUKU!BF7
  add('Kardus + Lakban', kardusAktif ? Math.ceil(H / 1000) * p.tarifKardusBox + BF7 : 0,
    kardusAktif ? `ceil(${H}/1000) × Rp ${p.tarifKardusBox.toLocaleString('id-ID')} + lakban` : 'BG28=X → 0');
  // Foil: AN7 = AN6*AN2 (AN27 selalu √) ; AO7 = ((UMR/25)/500*H)*AN2 ; AP7 = AO+AN+AL bila AP27 √
  // BUKU!AN6 = IF(((7*19)*400)<50000, 50000, IF(>50000, nilai, 0)) — AL35=6, AN35=18
  const kliseBase = ((6 + 1) * (18 + 1)) * 400; // BUKU!AN6
  const AN6 = kliseBase < 50000 ? 50000 : kliseBase > 50000 ? kliseBase : 0;
  const AN7 = AN6 * 2; // BUKU!AN7 (AN27=√, AN2=2)
  const AO7 = ((p.umr / 25) / 500 * H) * 2; // BUKU!AO7 (AO30=500, AN2=2)
  const AL7 = (H / 4800) * p.tarifFoilPlastikRoll; // BUKU!AL7 (AK6=4800)
  add('Foil (Klise + Jasa + Plastik)', foilAktif ? AO7 + AN7 + AL7 : 0,
    foilAktif ? `AP27=√: jasa + klise Rp ${AN6.toLocaleString('id-ID')} + plastik` : 'AP27=X → 0');
  // BUKU!AK7 = H/AK6 — masuk BI7 (pecahan roll, quirk Excel)
  const AK7 = H / 4800; // BUKU!AK7
  add('Kebutuhan Foil Roll', AK7, `${H}/4800 roll (pecahan, sesuai BI7)`);

  breakdown.forEach((b) => { b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0; });

  // BUKU!BI7 = jumlah — BJ7 = BI/H — BK7 = BJ*(BK6/100) — BL7 = BK*H
  // BUKU!BM7 = (BJ+BK)*H — BN7 = BM/H — BO7 = ROUNDUP(BN,-1)
  const BI7 = totalHpp;
  const BJ7 = BI7 / H;
  const BK7 = BJ7 * (marginPct / 100);
  const BL7 = BK7 * H;
  const BM7 = (BJ7 + BK7) * H;
  const BN7 = BM7 / H;
  const BO7 = roundUpTens(BN7);

  return {
    input,
    breakdown,
    kebutuhanPlano: R7,
    totalHpp: BI7,
    hppPerPcs: BJ7,
    labaPerPcs: BK7,
    labaTotal: BL7,
    totalHarga: BM7,
    hargaPerPcs: BN7,
    hargaFinalPerPcs: BO7,
    marginPct: marginPct / 100,
  };
}

export type SavedSertifikatSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: SertifikatSimulatorResult;
  paramsSnapshot?: SertifikatMasterParams;
};
