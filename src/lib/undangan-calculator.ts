// Undangan — kalkulator murni 1:1 engine BUKU dari 4 file master:
//   Harga UNDANGAN {15 x 17 cm, 15,5 x 15,5 cm} {- Oliver, ''} (.xlsm)
//   (13. Pricelist Undangan/Source)
// Lapisan: Master (input) → BUKU (engine per tier pcs) → Harga_Final (output).
// Oplah Excel dalam PCS (Oliver: 1000–3000; Print Inter: 50–600).
// Terminologi 1:1 Excel: Insheet, Plate, Drek, Desain, Film, Sisir, Plastik Opp,
//   Lipat Undangan, Pasang Plastik, Label Undangan, Print Label, Biaya Lain-Lain,
//   Laminasi Glossy/Doff, UV Varnish, Lakban, Kardus, Royalty, Transp, Oliver,
//   Print Inter. Harga jual per PCS (BUKU!BR7/BS7).

export type UndanganUkuran = '15 x 17' | '15,5 x 15,5';
export type UndanganMesin = 'Oliver' | 'Print Inter';
export type UndanganFinishing = 'None,' | 'UV Varnish,' | 'Laminasi Glossy,' | 'Laminasi Doff,';

export const UNDANGAN_UKURAN: UndanganUkuran[] = ['15 x 17', '15,5 x 15,5'];
export const UNDANGAN_MESIN: UndanganMesin[] = ['Oliver', 'Print Inter'];
export const UNDANGAN_FINISHING: UndanganFinishing[] = ['None,', 'UV Varnish,', 'Laminasi Glossy,', 'Laminasi Doff,'];
export const UNDANGAN_BAHAN_OPTIONS = ['BC', 'Art Paper', 'Art Carton', 'Duplex', 'Vp', 'Ivory']; // Master!D10
export const UNDANGAN_GRAMATUR_OPTIONS = [120, 150, 200, 210, 230, 260, 300, 310]; // Master!D11

export interface UndanganMasterParams {
  umr: number; // Master!D8 → BUKU!AN6/AO6 (lipat & pasang plastik)
  hargaPerKg: number; // Master!D12
  upOffsetPct: number; // Master!E12 file Oliver (0.05 → UI 5)
  upPrintPct: number; // Master!E12 file Print Inter (0 → UI 0)
  gramatur: number; // Master!D11 → BUKU!W28 (230 gsm)
  insheetOliver: number; // Master!D13 file Oliver (150)
  insheetPrint: number; // Master!D13 file Print Inter (7)
  desain: number; // Master!D17 (20000)
  tarifPrintA3: number; // Master!D18 → BUKU!T2 (4500)
  tarifLakbanRoll: number; // Master!D21 → BUKU!BJ32 (9200)
  tarifPlastikOpp: number; // Master!D22 → BUKU!AM6 (12000 per 100)
  tarifLabel: number; // Master!D23 → BUKU!AR6 (5000)
  // Master!D24 Kardus @ Rp 8000 = sel mati (0 referensi di BUKU). Tanpa param.
  royaltyPerPcs: number; // Master!D25 → BUKU!AI6
  transportOliver: number; // BUKU!AK6 file Oliver (15000)
  transportPrint: number; // BUKU!AK6 file Print Inter (10000)
  tarifPrintLabel: number; // BUKU!AS6 = 1500
  tarifSisirBase: number; // BUKU!AW6 = 7000 (min 7000 via AW7)
  tarifLamGlossy: number; // BUKU!AY6 = 0,35 (string koma di Excel)
  tarifLamDoff: number; // BUKU!BB6 = 0,4
  tarifUv: number; // BUKU!BE6 = 0,12
  tarifKardusBox: number; // BUKU!BK6 = BJ32 (9200 — kardus dihitung pakai harga lakban!)
  labaPct: number; // Master!E26 → BUKU!BO6
}

export const DEFAULT_UNDANGAN_PARAMS: UndanganMasterParams = {
  umr: 2815858,
  hargaPerKg: 16400,
  upOffsetPct: 5,
  upPrintPct: 0,
  gramatur: 230,
  insheetOliver: 150,
  insheetPrint: 7,
  desain: 20000,
  tarifPrintA3: 4500,
  tarifLakbanRoll: 9200,
  tarifPlastikOpp: 12000,
  tarifLabel: 5000,
  royaltyPerPcs: 0,
  transportOliver: 15000,
  transportPrint: 10000,
  tarifPrintLabel: 1500,
  tarifSisirBase: 7000,
  tarifLamGlossy: 0.35,
  tarifLamDoff: 0.4,
  tarifUv: 0.12,
  tarifKardusBox: 9200,
  labaPct: 30,
};

// BUKU!O7/P7/V27/W27 per (ukuran, mesin)
const UNDANGAN_MESIN_SPEC: Record<UndanganUkuran, Record<UndanganMesin, {
  o7: number; p7: number; v27: number; w27: number;
}>> = {
  // BUKU!O7 — BUKU!P7 — BUKU!V27 — BUKU!W27
  '15 x 17': {
    'Oliver': { o7: 4, p7: 12, v27: 79, w27: 109 },
    'Print Inter': { o7: 1, p7: 2, v27: 32.5, w27: 48 },
  },
  '15,5 x 15,5': {
    'Oliver': { o7: 4, p7: 12, v27: 79, w27: 109 },
    'Print Inter': { o7: 1, p7: 3, v27: 32.5, w27: 48 },
  },
};

// BUKU!D7/F7 dimensi display untuk basis laminasi/UV
const UNDANGAN_DIM_DISPLAY: Record<UndanganUkuran, { d: number; f: number }> = {
  '15 x 17': { d: 17, f: 30 },
  '15,5 x 15,5': { d: 15.5, f: 31 },
};

export const UNDANGAN_TIERS = [50, 100, 150, 200, 250, 300, 350, 400, 500, 600, 1000, 1500, 2000, 2500, 3000]; // union tier

export interface UndanganSimulatorInput {
  oplahPcs: number; // BUKU!H
  ukuran: UndanganUkuran; // Master!D5
  nWarna: 1 | 2 | 3 | 4; // Master!D15 → BUKU!L7/Z2
  muka: 1 | 2; // Master!D14 → BUKU!N7
  mesin: UndanganMesin; // Master!D16
  finishing: UndanganFinishing; // Master!D20 → AZ27/BC27/BF27
  labelAktif: boolean; // BUKU!AT26 √/X (Label + Print Label)
  lipatAktif: boolean; // BUKU!AN26 √/X (Lipat Undangan)
  pasangPlastikAktif: boolean; // BUKU!AO26 √/X (Pasang Plastik)
  kardusAktif: boolean; // BUKU!BK28 √/X
  insheetLembar: number; // Master!D13 → BUKU!K6
  marginPct: number; // override BUKU!BO6 (= Master!E26)
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
  kebutuhanPlano: number; // BUKU!R7
  totalHpp: number; // BUKU!BM7
  hppPerPcs: number; // BUKU!BN7
  labaPerPcs: number; // BUKU!BO7
  labaTotal: number; // BUKU!BP7
  totalHarga: number; // BUKU!BQ7
  hargaPerPcs: number; // BUKU!BR7
  hargaFinalPerPcs: number; // BUKU!BS7
  marginPct: number;
}

export function insheetDefaultForMesin(mesin: UndanganMesin, p: UndanganMasterParams): number {
  return mesin === 'Oliver' ? p.insheetOliver : p.insheetPrint;
}

export function roundUpTens(n: number): number {
  return Math.ceil(n / 10) * 10;
}

export function calculateUndanganHpp(
  input: UndanganSimulatorInput,
  rawParams: UndanganMasterParams = DEFAULT_UNDANGAN_PARAMS
): UndanganSimulatorResult {
  const p: UndanganMasterParams = { ...DEFAULT_UNDANGAN_PARAMS, ...(rawParams || {}) };
  const { oplahPcs, ukuran, nWarna, muka, mesin, finishing, labelAktif, lipatAktif, pasangPlastikAktif, kardusAktif, insheetLembar, marginPct } = input;
  const H = Math.max(1, oplahPcs);
  const spec = UNDANGAN_MESIN_SPEC[ukuran][mesin];
  const disp = UNDANGAN_DIM_DISPLAY[ukuran];
  const isOliver = mesin === 'Oliver';

  const breakdown: UndanganBreakdownItem[] = [];
  let totalHpp = 0;
  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal * 100) / 100, pct: 0, keterangan });
    totalHpp += nominal;
  };

  // BUKU!K7 = K6 — BUKU!N7 = muka (M7 selalu 0)
  const K7 = insheetLembar; // BUKU!K7 = IF(H>0, K6, 0)
  const N7 = muka; // BUKU!N7
  // BUKU!R7 = ROUNDUP((H/P7)+(K7/O7),0) — BUKU!Q7 = R7*O7*N7
  const R7 = Math.ceil(H / spec.p7 + K7 / spec.o7); // BUKU!R7
  const Q7 = R7 * spec.o7 * N7; // BUKU!Q7
  // BUKU!W29 = ((V27*W27)*W28)/20000*((W30*Y30)+W30)
  const upPct = isOliver ? p.upOffsetPct : p.upPrintPct;
  const W29 = ((spec.v27 * spec.w27) * p.gramatur) / 20000 * ((p.hargaPerKg * (upPct / 100)) + p.hargaPerKg);
  // BUKU!T7 = (W29/500)*R7 (Oliver) atau R7*T2 (Print Inter, T2 = D18)
  const T7 = isOliver ? (W29 / 500) * R7 : R7 * p.tarifPrintA3;
  add(isOliver ? 'Kertas' : 'Cetak Print Inter', T7,
    isOliver ? `${R7} lbr plano × Rp ${(W29 / 500).toLocaleString('id-ID')}` : `${R7} × Rp ${p.tarifPrintA3.toLocaleString('id-ID')}`);
  // BUKU!V7 = V6 = D17
  add('Desain', p.desain, `Master!D17 Rp ${p.desain.toLocaleString('id-ID')}`);
  // BUKU!Z7 = Z2*N7 (Z6 = 0) — BUKU!Y7 = Y6*Z7 (Y6 = 45000 Oliver else 0)
  const Z7 = nWarna * N7; // BUKU!Z7
  const Y6 = isOliver ? 45000 : 0; // BUKU!Y6
  add('Plate', Y6 * Z7, `${Z7} plat × Rp ${Y6.toLocaleString('id-ID')} (${mesin})`);
  // BUKU!AD7 = AB6*Z7 (AB6 = 90000 Oliver else 0) — BUKU!AE7 = Q-1000 (Oliver) — BUKU!AF7 = AE*AC*Z2 (AC = 40)
  const AD7 = (isOliver ? 90000 : 0) * Z7; // BUKU!AD7
  const AE7 = isOliver && Q7 - 1000 > 1 ? Q7 - 1000 : 0; // BUKU!AE7 (Print: 0 tetap)
  const AF7 = AE7 === 0 ? 0 : AE7 * 40 * nWarna; // BUKU!AF7 (AE7>1 selalu benar bila AE7>0)
  add('Ongkos Cetak Min Order', AD7, `${Z7} plat × Rp ${(isOliver ? 90000 : 0).toLocaleString('id-ID')}`);
  add('Ongkos Cetak Over', AF7, AE7 > 0 ? `${AE7} × Rp 40/drek × ${nWarna}` : 'Q ≤ 1000 → 0');
  // BUKU!AI7 = H*AI6 (royalty)
  add('Royalty', H * p.royaltyPerPcs, `${H} pcs × Rp ${p.royaltyPerPcs.toLocaleString('id-ID')}`);
  // BUKU!AK7 = AK6 (transport per mesin)
  add('Transport', isOliver ? p.transportOliver : p.transportPrint, `per order (${mesin})`);
  // BUKU!AM7 = (H/100)*AM6 (plastik OPP, AM26 selalu √) — AN7/AO7 lipat & pasang (X = 0)
  // BUKU!AP7 = AM7+AN7+AO7
  add('Plastik OPP', (H / 100) * p.tarifPlastikOpp, `(${H}/100) × Rp ${p.tarifPlastikOpp.toLocaleString('id-ID')}`);
  // BUKU!AN6 = (UMR/25)/AN28 (5000) — BUKU!AO6 = (UMR/25)/AO28 (500)
  add('Lipat Undangan', lipatAktif ? ((p.umr / 25) / 5000) * H : 0,
    lipatAktif ? `AN26=√: (UMR/25)/5000 × ${H}` : 'AN26=X → 0');
  add('Pasang Plastik', pasangPlastikAktif ? ((p.umr / 25) / 500) * H : 0,
    pasangPlastikAktif ? `AO26=√: (UMR/25)/500 × ${H}` : 'AO26=X → 0');
  // BUKU!AR7 = ROUNDUP(H/84)*AR6 (label) — BUKU!AS7 = ROUNDUP(H/12)*AS6 (print label)
  // BUKU!AT7 = AR7+AS7 bila AT26 √
  const labelTotal = Math.ceil(H / 84) * p.tarifLabel + Math.ceil(H / 12) * p.tarifPrintLabel;
  add('Label + Print Label', labelAktif ? labelTotal : 0,
    labelAktif ? `AT26=√: ceil(${H}/84)×${p.tarifLabel} + ceil(${H}/12)×${p.tarifPrintLabel}` : 'AT26=X → 0');
  // BUKU!AV7 = AV6 = 0 (Biaya Lain-Lain — sel manual 0)
  add('Biaya Lain-Lain', 0, 'AV6 = 0 di semua file');
  // BUKU!AW7 = IF((H/500)*AW6<7000, 7000, (H/500)*AW6) (Sisir, min 7000)
  const sisirHitung = (H / 500) * p.tarifSisirBase;
  add('Sisir', sisirHitung < 7000 ? 7000 : sisirHitung, `max(7000, (${H}/500) × ${p.tarifSisirBase})`);
  // Laminasi/UV: basis selalu dihitung; dikenakan bila checkbox √ (min 50000)
  // BUKU!AY7 = ((D+1)*(F+1)*AY6)*H*N7 — AZ7 = IF(AZ27 √, guard, 0)
  const lamBase = (disp.d + 1) * (disp.f + 1) * p.tarifLamGlossy * H * N7; // BUKU!AY7
  const doffBase = (disp.d + 1) * (disp.f + 1) * p.tarifLamDoff * H * N7; // BUKU!BB7
  const uvBase = (disp.d + 1) * (disp.f + 1) * p.tarifUv * H * N7; // BUKU!BE7
  const aboveMin = (v: number) => (v === 0 ? 0 : v > 50000 ? v : 50000);
  add('Laminasi Glossy', finishing === 'Laminasi Glossy,' ? aboveMin(lamBase) : 0,
    finishing === 'Laminasi Glossy,' ? `AZ27=√, max(Rp ${Math.round(lamBase).toLocaleString('id-ID')}, 50000)` : 'AZ27=X → 0');
  add('Laminasi Doff', finishing === 'Laminasi Doff,' ? aboveMin(doffBase) : 0,
    finishing === 'Laminasi Doff,' ? `BC27=√, max(Rp ${Math.round(doffBase).toLocaleString('id-ID')}, 50000)` : 'BC27=X → 0');
  add('UV Varnish', finishing === 'UV Varnish,' ? aboveMin(uvBase) : 0,
    finishing === 'UV Varnish,' ? `BF27=√, max(Rp ${Math.round(uvBase).toLocaleString('id-ID')}, 50000)` : 'BF27=X → 0');
  // BUKU!BI7 = (H/BI35)/BI6 (BI35 = 500, BI6 = 7650/196) — BUKU!BJ7 = BJ32*BI7
  // BUKU!BK7 = IF(BK28 √, ROUNDUP(H/BI35)*BK6 + BJ7, 0)
  const BI7 = (H / 500) / (7650 / 196); // BUKU!BI7
  const BJ7 = p.tarifLakbanRoll * BI7; // BUKU!BJ7
  add('Kardus + Lakban', kardusAktif ? Math.ceil(H / 500) * p.tarifKardusBox + BJ7 : 0,
    kardusAktif ? `BK28=√: ceil(${H}/500) × Rp ${p.tarifKardusBox.toLocaleString('id-ID')} + lakban` : 'BK28=X → 0');

  breakdown.forEach((b) => { b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0; });

  // BUKU!BM7 = jumlah — BN7 = BM/H — BO7 = BN*(BO6/100) — BP7 = BO*H
  // BUKU!BQ7 = (BN+BO)*H — BR7 = BQ/H — BS7 = ROUNDUP(BR,-1)
  const BM7 = totalHpp;
  const BN7 = BM7 / H;
  const BO7 = BN7 * (marginPct / 100);
  const BP7 = BO7 * H;
  const BQ7 = (BN7 + BO7) * H;
  const BR7 = BQ7 / H;
  const BS7 = roundUpTens(BR7);

  return {
    input,
    breakdown,
    kebutuhanPlano: R7,
    totalHpp: BM7,
    hppPerPcs: BN7,
    labaPerPcs: BO7,
    labaTotal: BP7,
    totalHarga: BQ7,
    hargaPerPcs: BR7,
    hargaFinalPerPcs: BS7,
    marginPct: marginPct / 100,
  };
}

export type SavedUndanganSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: UndanganSimulatorResult;
  paramsSnapshot?: UndanganMasterParams;
};
