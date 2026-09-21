// Kop Surat — kalkulator murni 1:1 engine BUKU dari 4 file master:
//   Pricelist KOP SURAT 1/2/3/4 Warna.xlsm  (10. Pricelist Kop Surat/Source)
// Lapisan: Master (input) → BUKU (engine per tier rim) → Harga_Final (output).
// Oplah Excel dalam RIM (BUKU!H7:H16 = 1..10 rim ≈ 500..5000 lbr kop).
// Terminologi 1:1 Excel: Plate, Desain, Insheet Cetak, Sisir, Film, Royalty, Transp.

export type KopSuratJenisKop = 'FOLIO' | 'A4' | 'Setengah Folio' | 'Setengah A4';
export type KopSuratJenisCetak = 'CETAK' | 'ONGKOS CETAK';

export const KOP_SURAT_JENIS_KOP: KopSuratJenisKop[] = ['FOLIO', 'A4', 'Setengah Folio', 'Setengah A4'];
export const KOP_SURAT_GRAMATUR_OPTIONS = [55, 58, 60, 70, 80, 100, 160]; // Master!D12 dropdown
export const KOP_SURAT_BAHAN_OPTIONS = ['HVS', 'BC', 'CD']; // Master!D11 dropdown
export const KOP_SURAT_D9_OPTIONS = ['HVS', 'Imperial', 'Book Paper', 'Art Paper', 'Art Carton', 'Duplex', 'Vp', 'Ivory']; // Master!D9 dropdown (tersimpan kosong di ke-4 file)

export interface KopSuratMasterParams {
  umr: number; // Master!D8 — informatif, tidak dipakai rumus BUKU
  gramatur: number; // Master!D12
  hargaPerKg: number; // Master!D13
  upPct: number; // Master!E13 (Excel simpan 0.05 → UI persen)
  insheet1Warna: number; // Master!D15 file 1 Warna
  insheet2Warna: number; // Master!D15 file 2 Warna
  insheet3Warna: number; // Master!D15 file 3 Warna
  insheet4Warna: number; // Master!D15 file 4 Warna
  desain: number; // Master!D16
  tarifFilm: number; // BUKU!U6 (Film BW, aktif hanya jika T30=√)
  platOverride: number; // BUKU!X6 (0 = otomatis L7*M7)
  royaltyPerRim: number; // BUKU!AH6
  transportPerOrder: number; // BUKU!AJ6
  labaPct: number; // Master!E21 → BUKU!AO6
  hargaPembandingPerRim: number; // Master!H14 — statis, tidak dipakai rumus
  bahanKop: string; // Master!D11 — informatif, tidak dipakai rumus BUKU
  jenisKertasTambahan: string; // Master!D9 — tersimpan kosong, tidak dipakai rumus
}

export const DEFAULT_KOP_SURAT_PARAMS: KopSuratMasterParams = {
  umr: 2818585,
  gramatur: 70,
  hargaPerKg: 15700,
  upPct: 5,
  insheet1Warna: 30,
  insheet2Warna: 30,
  insheet3Warna: 40,
  insheet4Warna: 50,
  desain: 10000,
  tarifFilm: 0,
  platOverride: 0,
  royaltyPerRim: 0,
  transportPerOrder: 0,
  labaPct: 30,
  hargaPembandingPerRim: 65000,
  bahanKop: 'HVS',
  jenisKertasTambahan: '',
};

export const KOP_SURAT_INSHET_DEFAULT: Record<1 | 2 | 3 | 4, keyof Pick<KopSuratMasterParams, 'insheet1Warna' | 'insheet2Warna' | 'insheet3Warna' | 'insheet4Warna'>> = {
  1: 'insheet1Warna',
  2: 'insheet2Warna',
  3: 'insheet3Warna',
  4: 'insheet4Warna',
};

// Master!D6: label ukuran per jenis kop
export const KOP_SURAT_UKURAN_LABEL: Record<KopSuratJenisKop, string> = {
  'FOLIO': '21,5 x 33',
  'A4': '21 x 29,7',
  'Setengah Folio': '16,5 x 21,5',
  'Setengah A4': '14,8 x 21',
};

// BUKU!D7/F7: dimensi display (d, f)
const KOP_SURAT_DIM_DISPLAY: Record<KopSuratJenisKop, { d: number; f: number }> = {
  'FOLIO': { d: 21.5, f: 33 },
  'A4': { d: 21, f: 29.7 },
  'Setengah Folio': { d: 16.5, f: 21.5 },
  'Setengah A4': { d: 14.8, f: 21 },
};

// BUKU!T27/U27: dimensi dasar harga kertas + BUKU!O7: jadi kop per area cetak
const KOP_SURAT_DIM_KERTAS: Record<KopSuratJenisKop, { t27: number; u27: number; o7: number }> = {
  'FOLIO': { t27: 21.5, u27: 33, o7: 1 },
  'A4': { t27: 21, u27: 29.7, o7: 1 },
  'Setengah Folio': { t27: 21.5, u27: 33, o7: 2 },
  'Setengah A4': { t27: 21, u27: 29.7, o7: 2 },
};

export const KOP_SURAT_TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // BUKU!H7:H16 (rim)

export interface KopSuratSimulatorInput {
  oplahRim: number; // BUKU!H (rim @500 lbr)
  jenisKop: KopSuratJenisKop; // Master!D5
  nWarna: 1 | 2 | 3 | 4; // Master!D17 → BUKU!L7
  muka: 1 | 2; // Master!D18 → BUKU!M7
  jenisCetak: KopSuratJenisCetak; // Master!D10
  finishingSisir: boolean; // Master!D20 SISIR vs TANPA SISIR
  filmAktif: boolean; // BUKU!T30 = "√"
  insheetLembar: number; // Master!D15 (default per file warna)
  marginPct: number; // override BUKU!AO6 (= Master!E21)
}

export interface KopSuratBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface KopSuratSimulatorResult {
  input: KopSuratSimulatorInput;
  breakdown: KopSuratBreakdownItem[];
  kebutuhanPlano: number; // BUKU!Q7
  lembarCetakPlat: number; // BUKU!P7
  totalLembarKop: number; // H*500
  totalHpp: number; // BUKU!AM7
  hppPerRim: number; // BUKU!AN7
  labaPerRim: number; // BUKU!AO7
  labaTotal: number; // BUKU!AP7
  totalHarga: number; // BUKU!AQ7
  hargaPerRim: number; // BUKU!AR7
  hargaFinalPerRim: number; // BUKU!AS7
  marginPct: number;
}

// BUKU!AS7 = ROUNDUP(AR7, AT7=-1): bulatkan ke atas ke puluhan
export function roundUpTens(n: number): number {
  return Math.ceil(n / 10) * 10;
}

export function insheetDefaultForWarna(nWarna: 1 | 2 | 3 | 4, p: KopSuratMasterParams): number {
  return p[KOP_SURAT_INSHET_DEFAULT[nWarna]];
}

export function calculateKopSuratHpp(
  input: KopSuratSimulatorInput,
  rawParams: KopSuratMasterParams = DEFAULT_KOP_SURAT_PARAMS
): KopSuratSimulatorResult {
  const p: KopSuratMasterParams = { ...DEFAULT_KOP_SURAT_PARAMS, ...(rawParams || {}) };
  const { oplahRim, jenisKop, nWarna, muka, jenisCetak, finishingSisir, filmAktif, insheetLembar, marginPct } = input;
  const H = Math.max(1, oplahRim);
  const disp = KOP_SURAT_DIM_DISPLAY[jenisKop];
  const krt = KOP_SURAT_DIM_KERTAS[jenisKop];

  const breakdown: KopSuratBreakdownItem[] = [];
  let totalHpp = 0;
  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal * 100) / 100, pct: 0, keterangan });
    totalHpp += nominal;
  };

  // BUKU!L7: jumlah warna — BUKU!M7: muka — BUKU!N7: selalu 1 — BUKU!O7: 1 (Folio/A4) else 2
  const L7 = nWarna; // BUKU!L7 = IF(Master!D17=...)
  const M7 = muka; // BUKU!M7 = IF(Master!D18=...)
  const N7 = 1; // BUKU!N7 = IF(...1,1,1,1,0) → selalu 1
  const O7 = krt.o7; // BUKU!O7
  // BUKU!Q7 = ((H7*500)/O7)+(K7/N7) — BUKU!P7 = N7*Q7
  const Q7 = ((H * 500) / O7) + (insheetLembar / N7);
  const P7 = N7 * Q7;
  // BUKU!U29 = ((T27*U27)*U28)/20000*((U30*W30)+U30)
  const U29 = ((krt.t27 * krt.u27) * p.gramatur) / 20000 * ((p.hargaPerKg * (p.upPct / 100)) + p.hargaPerKg);
  // BUKU!R7 = ($U$29/500)*Q7
  add('Kertas', (U29 / 500) * Q7,
    `${Q7.toLocaleString('id-ID')} lbr plano (${H} rim × 500${O7 > 1 ? ` / ${O7}` : ''} + ${insheetLembar} insheet) × Rp ${(U29 / 500).toLocaleString('id-ID')}/lbr`);
  // BUKU!T7 = T6 = Master!D16
  add('Desain', p.desain, `Master!D16 Rp ${p.desain.toLocaleString('id-ID')}`);
  // BUKU!U7 = IF($T$30="√",(D7+1)*(F7+1)*$U$6*1,0)
  add('Film', filmAktif ? (disp.d + 1) * (disp.f + 1) * p.tarifFilm : 0,
    filmAktif ? `(${disp.d}+1) × (${disp.f}+1) × Rp ${p.tarifFilm.toLocaleString('id-ID')}` : 'T30 ≠ √ → 0');
  // BUKU!X7 = IF(X6>0,X6,L7*M7) — BUKU!W7 = $W$6*X7, W6 = IF(D10 ONGKOS CETAK,0,CETAK,10000)
  const X7 = p.platOverride > 0 ? p.platOverride : L7 * M7;
  const W6 = jenisCetak === 'CETAK' ? 10000 : 0; // BUKU!W6
  add('Plate', W6 * X7, `${X7} plat × Rp ${W6.toLocaleString('id-ID')} (${jenisCetak})`);
  // BUKU!AB7 = X7*Z7 (Z6/Z7 min order 15000/plat) — BUKU!AC7 over = P7-500 — BUKU!AD7 = AC7*AA7*X7 (AA7 drek 30)
  const Z7 = 15000; // BUKU!Z6 = IF(...15000,15000) → selalu 15000
  const AB7 = X7 * Z7;
  const AC7 = P7 - 500 === 0 ? 0 : (P7 - 500 >= 1 ? P7 - 500 : 0); // BUKU!AC7
  const AA7 = 30; // BUKU!AA7 = IF(...30,30) → selalu 30
  const AD7 = AC7 === 0 ? 0 : AC7 * AA7 * X7; // BUKU!AD7
  add('Ongkos Cetak Min Order', AB7, `${X7} plat × Rp ${Z7.toLocaleString('id-ID')} (≤500 lbr)`);
  add('Ongkos Cetak Over', AD7, AC7 > 0 ? `${AC7} lbr × Rp ${AA7}/drek × ${X7} plat` : 'P7 ≤ 500 → 0');
  // BUKU!AH7 = H7*AH6 — BUKU!AJ7 = AJ6
  add('Royalty', H * p.royaltyPerRim, `${H} rim × Rp ${p.royaltyPerRim.toLocaleString('id-ID')}`);
  add('Transport', p.transportPerOrder, 'per order');
  // BUKU!AK7 = IF(D20 SISIR,((((T27*U27)*U28)/20000)/500)*Q7)*AK6,0) — AK6 = 1000
  add('Sisir', finishingSisir ? ((((krt.t27 * krt.u27) * p.gramatur) / 20000) / 500) * Q7 * 1000 : 0,
    finishingSisir ? '((((T27×U27)×gramatur)/20000)/500)×Q7×1000' : 'TANPA SISIR → 0');

  breakdown.forEach((b) => { b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0; });

  // BUKU!AM7 = SUM(...) — AN7 = AM7/H7 — AO7 = AN7*(AO6/100) — AP7 = AO7*H7
  const AM7 = totalHpp;
  const AN7 = AM7 / H;
  const AO7 = AN7 * (marginPct / 100);
  const AP7 = AO7 * H;
  // BUKU!AQ7 = (AN7+AO7)*H7 — AR7 = AQ7/H7 — AS7 = ROUNDUP(AR7,-1)
  const AQ7 = (AN7 + AO7) * H;
  const AR7 = AQ7 / H;
  const AS7 = roundUpTens(AR7);

  return {
    input,
    breakdown,
    kebutuhanPlano: Q7,
    lembarCetakPlat: P7,
    totalLembarKop: H * 500,
    totalHpp: AM7,
    hppPerRim: AN7,
    labaPerRim: AO7,
    labaTotal: AP7,
    totalHarga: AQ7,
    hargaPerRim: AR7,
    hargaFinalPerRim: AS7,
    marginPct: marginPct / 100,
  };
}

export type SavedKopSuratSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: KopSuratSimulatorResult;
  paramsSnapshot?: KopSuratMasterParams;
};
