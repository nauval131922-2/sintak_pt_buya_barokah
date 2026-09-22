// Kalkulator murni Buku Soft Cover 21 x 29,7 — direct binding 1:1 ke Source Excel.
// Sumber: 17. Pricelist Buku Soft Cover/Source/Pricelist Buku Soft Cover 21 x 29,7.xlsm
// Struktur: sheet Master (A3:H39, input) + sheet BUKU (A1:DE41, engine 12 tier H7:H18 + harga DD7:DD18).
// Domain terkomputasi Excel (satu-satunya yang tidak #DIV/0!): ukuran 21 x 29,7 + cover Print Inter
// + isi Oliver. Ukuran/mesin lain membuat BUKU!R7/AN7 = #DIV/0! — karena itu dikunci.
// Setiap rumus mencantumkan alamat cell Excel aslinya.
// Kombinasi finishing yang di Excel-nya sendiri #DIV/0! untuk ukuran ini (Glossy+Bending via CR7,
// full Doff+SpotUV+Emboss+Bending+Shrink via BR7) TIDAK ditawarkan di UI — didokumentasikan di Manual.

export type BukuSoftCoverVarianType = '21 x 29,7 cm';

export const BUKU_SOFT_COVER_VARIANTS: BukuSoftCoverVarianType[] = ['21 x 29,7 cm'];

export type BukuSoftCoverMukaCoverType = '1 Muka' | '2 Muka'; // Master!D14
export type BukuSoftCoverWarnaCoverType = '1 Warna' | '2 Warna' | '3 Warna' | '4 Warna'; // Master!D15
export type BukuSoftCoverWarnaIsiType = '1 Warna' | '2 Warna' | '3 Warna' | '4 Warna'; // Master!D24
// Master!D29 (nilai mentah persis seperti di Excel; 7 yang terkomputasi untuk ukuran ini):
export type BukuSoftCoverFinishingType =
  | 'None,'
  | 'UV Varnish,'
  | 'Laminasi Glossy,'
  | 'Laminasi Doff,'
  | 'Lem Bending,'
  | 'UV Varnish + Bending,'
  | 'Laminasi Doff + Bending,';

export const BUKU_SOFT_COVER_MUKA_COVER_OPTIONS: BukuSoftCoverMukaCoverType[] = ['1 Muka', '2 Muka'];
export const BUKU_SOFT_COVER_WARNA_COVER_OPTIONS: BukuSoftCoverWarnaCoverType[] = ['1 Warna', '2 Warna', '3 Warna', '4 Warna'];
export const BUKU_SOFT_COVER_WARNA_ISI_OPTIONS: BukuSoftCoverWarnaIsiType[] = ['1 Warna', '2 Warna', '3 Warna', '4 Warna'];
export const BUKU_SOFT_COVER_FINISHING_OPTIONS: BukuSoftCoverFinishingType[] = [
  'None,', 'UV Varnish,', 'Laminasi Glossy,', 'Laminasi Doff,',
  'Lem Bending,', 'UV Varnish + Bending,', 'Laminasi Doff + Bending,',
];

export interface BukuSoftCoverMasterParams {
  // Mati di jalur Print Inter (BUKU!T7 = T2·R all-in; BUKU!W29/V27/W27 tak terpakai) — D11/D12/E12
  // didokumentasikan di Manual, TIDAK jadi parameter agar lolos uji reaktivitas:
  // gramaturCover 230, tarifKertasCoverKg 16400, upCoverPct 3.
  insheetCover: number; // Master!D13 -> BUKU!K6 (lbr) — 5
  tarifDesainCover: number; // Master!D17 -> BUKU!V6 (Rp/order) — 20000
  tarifPrintCoverA3: number; // Master!D18 -> BUKU!T2 (Rp/lbr, Print Inter) — 2700
  tarifKertasIsiKg: number; // Master!D22 HVS /kg (Rp) — 15700
  upIsiPct: number; // Master!E22 up isi (%) — 3
  gramaturIsi: number; // Master!D21 -> BUKU!AU28 (opsi angka) — 70
  insheetIsi: number; // Master!D23 -> BUKU!AI6 (lbr) — 100
  tarifDesainIsiPerHlm: number; // Master!D26 -> BUKU!AT6 (Rp/hlm) — 15000
  tarifPlateIsi: number; // BUKU!AW6 Oliver (Rp/plat) — 45000
  tarifCetakMinIsi: number; // BUKU!AY6 Oliver min (Rp) — 90000
  tarifDrekIsi: number; // BUKU!AZ7 Oliver (Rp/drek) — 40
  tarifRoyalti: number; // Master!D35 -> BUKU!BF6 (Rp/pcs) — 0
  tarifSteplesPack: number; // Master!D32 Isi Steples 369/Pack (Rp) — 3000 → BUKU!BJ6 = D32/(1000/3)
  umr: number; // Master!D8 UMR (Rp) — 2818585 → jasa susun (UMR/25)/target
  tarifSisirPerPcs: number; // BUKU!BL6 = 3*50 (Rp/pcs) — 150
  tarifBending: number; // BUKU!BX6 (Rp) — 50, live saat hal>100 + finishing Bending
  minBending: number; // floor BUKU!BZ7 (Rp) — 100000
  tarifLaminasiGlossy: number; // BUKU!CA6 (Rp/cm2) — 0.35
  tarifLaminasiDoff: number; // BUKU!CD6 (Rp/cm2) — 0.4
  tarifUvVarnish: number; // BUKU!CG6 (Rp/cm2) — 0.11
  minFinishing: number; // floor BUKU!CB/CE/CH (Rp) — 50000
  marginDefaultPct: number; // Master!E36 Laba (%) — 30
}

export const DEFAULT_BUKU_SOFT_COVER_PARAMS: BukuSoftCoverMasterParams = {
  insheetCover: 5,
  tarifDesainCover: 20000,
  tarifPrintCoverA3: 2700,
  tarifKertasIsiKg: 15700,
  upIsiPct: 3,
  gramaturIsi: 70,
  insheetIsi: 100,
  tarifDesainIsiPerHlm: 15000,
  tarifPlateIsi: 45000,
  tarifCetakMinIsi: 90000,
  tarifDrekIsi: 40,
  tarifRoyalti: 0,
  tarifSteplesPack: 3000,
  umr: 2818585,
  tarifSisirPerPcs: 150,
  tarifBending: 50,
  minBending: 100000,
  tarifLaminasiGlossy: 0.35,
  tarifLaminasiDoff: 0.4,
  tarifUvVarnish: 0.11,
  minFinishing: 50000,
  marginDefaultPct: 30,
};

// BUKU!H7:H18 — tier oplah bawaan file.
export const BUKU_SOFT_COVER_TIERS: number[] = [
  20, 30, 50, 60, 100, 150, 200, 250, 300, 350, 400, 500,
];

export interface BukuSoftCoverSimulatorInput {
  oplah: number;
  varian: BukuSoftCoverVarianType; // dikunci '21 x 29,7 cm' (satunya yang terkomputasi)
  jumlahHalaman: number; // Master!D6, bebas (tersimpan 32)
  mukaCover: BukuSoftCoverMukaCoverType; // Master!D14
  warnaCover: BukuSoftCoverWarnaCoverType; // Master!D15
  warnaIsi: BukuSoftCoverWarnaIsiType; // Master!D24
  finishing: BukuSoftCoverFinishingType; // Master!D29
  marginPct: number; // Master!E36
}

export interface BukuSoftCoverBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface BukuSoftCoverSimulatorResult {
  input: BukuSoftCoverSimulatorInput;
  breakdown: BukuSoftCoverBreakdownItem[];
  kebutuhanKertasCover: number; // BUKU!R7 lbr plano cover
  kebutuhanCetakCover: number; // BUKU!Q7
  kebutuhanPlanoIsi: number; // BUKU!AP7 lbr plano isi
  totalHpp: number; // BUKU!CX7
  hppPerPcs: number; // BUKU!CY7
  hargaJualPerPcs: number; // BUKU!DD7
  totalHargaJual: number; // BUKU!DB7
  profitPerPcs: number;
  profitTotal: number;
  marginPct: number;
}

const mukaCount = (m: BukuSoftCoverMukaCoverType): number => (m === '1 Muka' ? 1 : 2); // BUKU!N7
const warnaCount = (w: string): number => // BUKU!L7 = BUKU!AJ7
  (w === '1 Warna' ? 1 : w === '2 Warna' ? 2 : w === '3 Warna' ? 3 : 4);
// BUKU!M7 punggung dari halaman C6
const punggung = (hal: number): number =>
  hal <= 100 ? 0 : hal <= 200 ? 0.7 : hal <= 300 ? 1.5 : hal <= 400 ? 2 : hal <= 500 ? 2.5 : hal <= 600 ? 2.5 : 2.8;
// BUKU!BI28 target jasa susun dari halaman C6
const targetSusun = (hal: number): number =>
  hal <= 20 ? 900 : hal <= 30 ? 900 : hal <= 40 ? 800 : hal <= 50 ? 800 : hal <= 60 ? 800 : hal <= 70 ? 800 : hal >= 71 ? 700 : 900;

export function calculateBukuSoftCoverHpp(
  input: BukuSoftCoverSimulatorInput,
  rawParams: BukuSoftCoverMasterParams = DEFAULT_BUKU_SOFT_COVER_PARAMS
): BukuSoftCoverSimulatorResult {
  const p: BukuSoftCoverMasterParams = { ...DEFAULT_BUKU_SOFT_COVER_PARAMS, ...(rawParams || {}) };
  const { oplah, jumlahHalaman, mukaCover, warnaCover, warnaIsi, finishing, marginPct } = input;
  const H = Math.max(0, Math.round(oplah));
  const C6 = Math.max(0, Math.round(jumlahHalaman));
  const M = punggung(C6); // BUKU!M7
  const N = mukaCount(mukaCover); // BUKU!N7
  const Z2 = warnaCount(warnaCover); // BUKU!Z2 (cover)
  const AJ = warnaCount(warnaIsi); // BUKU!AJ7 (isi)

  const breakdown: BukuSoftCoverBreakdownItem[] = [];
  let totalHpp = 0;
  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return; // BH negatif tetap masuk (bukan 0)
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // ---- COVER (Print Inter, 21 x 29,7) ----
  // BUKU!K7 = K6; BUKU!O7 = P7 = 1; BUKU!Q7 = R*O*N; BUKU!R7 = IF(H>0,(H/P)+(K/O),0)
  const Kc = p.insheetCover;
  const R = H > 0 ? H / 1 + Kc / 1 : 0;
  const Q = R * 1 * N;
  // BUKU!T7 = T2*R (T2 = D18 Print Inter all-in; jalur (R/500)*W29 untuk mesin lain mati karena V27/W27=0)
  add('Cetak Cover Print Inter', p.tarifPrintCoverA3 * R,
    `BUKU!T7: ${R} lbr × Rp ${p.tarifPrintCoverA3.toLocaleString('id-ID')} (all-in bahan+cetak)`);
  // BUKU!V7 = IF(H>0,V6,0)
  add('Desain Cover', H > 0 ? p.tarifDesainCover : 0, `BUKU!V7: Rp ${p.tarifDesainCover.toLocaleString('id-ID')}/order`);
  // BUKU!Y7 = Y6*Z7 = 0 (Y6=0 untuk Print Inter); BUKU!AG7 = 0 (Print Inter) — tanpa baris

  // ---- ISI (Oliver, 21 x 29,7) ----
  const AI = H > 0 ? p.insheetIsi : 0; // BUKU!AI7
  const AK = 8; const AL = 2; const AM = 16; // BUKU!AK7/AL7/AM7 (Oliver)
  const AN = C6 / (AM / AL); // BUKU!AN7 = C6/8
  const AN6 = Math.ceil(AN); // BUKU!AN6 = ROUNDUP(AN7,0)
  const AO = ((H / AL) * AN + (AI / AL) * AN6) * AL; // BUKU!AO7
  const AP = H > 0 ? ((H / AL) * AN + (AI / AL) * AN6) : 0; // BUKU!AP7
  // BUKU!AU29 rim isi = ((65*100)*gsm)/20000*(kg*(1+up)); BUKU!AR7 = (AP/500)*AU29 (Oliver)
  const rimIsi = ((65 * 100) * p.gramaturIsi) / 20000 * (p.tarifKertasIsiKg * (1 + p.upIsiPct / 100));
  add('Kertas Isi HVS', (AP / 500) * rimIsi,
    `BUKU!AR7: ${AP} lbr × Rp ${(rimIsi / 500).toFixed(2)} (rim Rp ${Math.round(rimIsi).toLocaleString('id-ID')}/500)`);
  // BUKU!AT7 = IF(H>0,AT6*C7,0); C7 = C6
  add('Desain Isi', H > 0 ? p.tarifDesainIsiPerHlm * C6 : 0,
    `BUKU!AT7: Rp ${p.tarifDesainIsiPerHlm.toLocaleString('id-ID')} × ${C6} hlm`);
  // BUKU!AW7 = AW6*AX7 (tanpa gate H!); AX7 = 1 (AX6=1)
  add('Plate Isi Oliver', p.tarifPlateIsi * 1, 'BUKU!AW7: 1 plat (AX6=1)');
  // BUKU!BA7 = AY7*AX7 (tanpa gate H!)
  const minIsi = p.tarifCetakMinIsi * 1;
  // BUKU!BB7 Oliver = ((H+AI)-1000)*AX jika >1; BUKU!BC7 = BB*AZ7; BUKU!BD7 = BC+BA
  const BB = (H + AI - 1000) * 1 > 1 ? (H + AI - 1000) * 1 : 0;
  add('Cetak Isi Oliver', (BB === 0 ? 0 : BB) * p.tarifDrekIsi + minIsi,
    `BUKU!BD7: min Rp ${minIsi.toLocaleString('id-ID')} + over ${BB}×Rp ${p.tarifDrekIsi} (H+AI=${H + AI})`);
  // BUKU!BF7 = H*D35
  if (H * p.tarifRoyalti > 0) add('Royalty', H * p.tarifRoyalti, `BUKU!BF7: ${H} × Rp ${p.tarifRoyalti}`);
  // BUKU!BH7 Oliver = ((AO*2)-1000)*AZ7 — BISA NEGATIF, tetap masuk total
  const BH = H > 0 ? (AO * 2 - 1000) * p.tarifDrekIsi : 0;
  if (BH !== 0) add('Tambahan Cetak Isi', BH, `BUKU!BH7: (2×${AO}−1000)×Rp ${p.tarifDrekIsi}`);
  // BUKU!BI7 = H*(UMR/25)/BI28 (jasa susun)
  add('Jasa Susun', H * ((p.umr / 25) / targetSusun(C6)),
    `BUKU!BI7: ${H} × Rp ${((p.umr / 25) / targetSusun(C6)).toFixed(2)} ((UMR/25)/${targetSusun(C6)})`);
  // BUKU!BJ7 = BJ6*H; BJ6 = D32/(1000/3) (steples)
  add('Steples', (p.tarifSteplesPack / (1000 / 3)) * H,
    `BUKU!BJ7: ${H} × Rp ${(p.tarifSteplesPack / (1000 / 3)).toFixed(2)}`);
  // BUKU!BL7 = H*150 (sisir; BL6 = 3*50)
  add('Sisir', H * p.tarifSisirPerPcs, `BUKU!BL7: ${H} × Rp ${p.tarifSisirPerPcs}`);

  // ---- FINISHING (D7=21, F7=29.7 terkunci ukuran) ----
  const luasLam = (21 * 2 + 1) * (29.7 + 1); // (D7*2+1)*(F7+1)
  const finFloor = (raw: number): number => (raw === 0 ? 0 : raw > p.minFinishing ? raw : p.minFinishing);
  // BUKU!BX27 chain persis: √ hanya untuk 'Lem Bending,' dan full-combo (full-combo tidak ditawarkan)
  const bendingOn = finishing === 'Lem Bending,';
  const BY = p.tarifBending * 29.7 * M * H; // BUKU!BY7 = (BX6*F7*M7)*H
  const BZ = BY === 0 ? 0 : BY > p.minBending ? BY : p.minBending; // BUKU!BZ7
  if (bendingOn && BY !== 0) add('Bending', BY, `BUKU!BX7: ${p.tarifBending}×29,7×${M}×${H}`);
  add('Laminasi Glossy', finishing === 'Laminasi Glossy,' ? finFloor(luasLam * p.tarifLaminasiGlossy * H) : 0,
    `BUKU!CB7: ${luasLam.toFixed(1)} cm² × ${p.tarifLaminasiGlossy} × ${H}, floor Rp ${p.minFinishing.toLocaleString('id-ID')}`);
  add('Laminasi Doff', finishing === 'Laminasi Doff,' ? finFloor(luasLam * p.tarifLaminasiDoff * H) : 0,
    `BUKU!CE7: floor Rp ${p.minFinishing.toLocaleString('id-ID')}`);
  add('UV Varnish', finishing === 'UV Varnish,' || finishing === 'UV Varnish + Bending,'
    ? (finishing === 'UV Varnish,' ? finFloor(luasLam * p.tarifUvVarnish * H) : finFloor(luasLam * p.tarifUvVarnish * H) + BZ) : 0,
    'BUKU!CH7/CJ7: UV (+bending BZ untuk +Bending)');
  add('Laminasi Doff + Bending', finishing === 'Laminasi Doff + Bending,' ? finFloor(luasLam * p.tarifLaminasiDoff * H) + BZ : 0,
    'BUKU!CL7: CF7+BZ7');
  // CK7 (Glossy+Bending) selalu 0 di domain ini — jalurnya #DIV/0! di Excel (CR7), tidak ditawarkan.

  breakdown.forEach((b) => { b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0; });

  // BUKU!CX7 = T+V+Y+AG+AR+AT+AW+BD+BF+BH+BI+BJ+BL+BX+CB+CE+CH+CJ+CK+CL+BK+CV+CR+BV+BR
  // (Y=AGcover=CK=BK=CV=CR=BV=BR=0 di domain ini)
  // BUKU!CY7 = CX/H; BUKU!CZ7 = CY*(E36%); BUKU!DB7 = (CY+CZ)*H; BUKU!DC7 = DB/H; BUKU!DD7 = ROUNDUP(DC,-1)
  const hppPerPcs = H > 0 ? totalHpp / H : 0;
  const labaPerPcs = hppPerPcs * (marginPct / 100);
  const totalHargaJual = Math.round((hppPerPcs + labaPerPcs) * H);
  const hargaJualPerPcs = H > 0 ? Math.ceil((hppPerPcs + labaPerPcs) / 10) * 10 : 0;
  const profitPerPcs = hargaJualPerPcs - hppPerPcs;

  return {
    input,
    breakdown,
    kebutuhanKertasCover: R,
    kebutuhanCetakCover: Q,
    kebutuhanPlanoIsi: AP,
    totalHpp: Math.round(totalHpp),
    hppPerPcs,
    hargaJualPerPcs,
    totalHargaJual,
    profitPerPcs,
    profitTotal: totalHargaJual - Math.round(totalHpp),
    marginPct: hargaJualPerPcs > 0 ? profitPerPcs / hargaJualPerPcs : 0,
  };
}

export type SavedBukuSoftCoverSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: BukuSoftCoverSimulatorResult;
  paramsSnapshot?: BukuSoftCoverMasterParams;
};
