// Engine bersama lini Soft Cover Offset 21 x 29,7 — direct binding 1:1 ke 3 file Source.
// Sumber: 17. Pricelist Buku Soft Cover - 21 x 29,7 cm/Source/BUKU UK. 21 x 29,7 - {Cover Oliver - Isi Oliver /
//   Cover Print - Isi Oliver / Cover Print - Isi Print}.xlsm
// Rumus & gate IDENTIK di 3 file (total BUKU!DC7 30 suku → BUKU!DI7). Beda hanya 6 titik per-combo
// (diikat di SOFT_COVER_OFFSET_CONFIG): Y6 plate cover, model jasa (UMR5 vs BNBO), tabel BN28,
// insheet cover/isi, pasangan mesin, tier.
// Setiap rumus mencantumkan alamat cell Excel aslinya.

export type SoftCoverOffsetComboId =
  | 'Oliver-Oliver' | 'Print-Oliver' | 'Print-Print'
  | 'OO-14' | 'OR-14' | 'PP-14' | 'PR-14';

export type SoftCoverOffsetUkuran = '21 x 29,7' | '14,5 x 20,25';

export type SoftCoverOffsetMukaType = '1 Muka' | '2 Muka'; // Master!D14
export type SoftCoverOffsetWarnaType = '1 Warna' | '2 Warna' | '3 Warna' | '4 Warna'; // Master!D15/D24
// Master!D29 H29:H39 (9 opsi, SEMUA terkomputasi untuk 21 x 29,7 di generasi file ini):
export type SoftCoverOffsetFinishingType =
  | 'None,'
  | 'UV Varnish,'
  | 'Laminasi Glossy,'
  | 'Laminasi Doff,'
  | 'Lem Bending,'
  | 'UV Varnish + Bending,'
  | 'Laminasi Glossy + Bending,'
  | 'Laminasi Doff + Bending,'
  | 'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,';

export const SOFT_COVER_OFFSET_MUKA_OPTIONS: SoftCoverOffsetMukaType[] = ['1 Muka', '2 Muka'];
export const SOFT_COVER_OFFSET_WARNA_OPTIONS: SoftCoverOffsetWarnaType[] = ['1 Warna', '2 Warna', '3 Warna', '4 Warna'];
export const SOFT_COVER_OFFSET_FINISHING_OPTIONS: SoftCoverOffsetFinishingType[] = [
  'None,', 'UV Varnish,', 'Laminasi Glossy,', 'Laminasi Doff,', 'Lem Bending,',
  'UV Varnish + Bending,', 'Laminasi Glossy + Bending,', 'Laminasi Doff + Bending,',
  'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,',
];

export interface SoftCoverOffsetMasterParams {
  umr: number; // Master!D8 UMR (Rp) — 2818850
  tarifKertasCoverKg: number; // Master!D12 Art Carton /kg (Rp) — 16400
  upCoverPct: number; // Master!E12 up cover (%) — 0
  gramaturCover: number; // Master!D11 -> BUKU!W28 — 230
  insheetCover: number; // Master!D13 -> BUKU!K6 — 100 / 10 / 10 per combo
  tarifDesainCover: number; // Master!D17 -> BUKU!V6 — 20000
  tarifPrintCoverA3: number; // Master!D18 -> BUKU!T2 (jalur Print Inter) — 2700
  // BUKU!AR2 ("700"/"350" teks) & D27 A3+ isi-Print juga konstanta per-file (D27 hanya untuk isi Print Inter,
  // tak dipakai combo mana pun) — diikat di config (jasaBuyaAR2: 700/350).
  tarifKertasIsiKg: number; // Master!D22 HVS /kg (Rp) — 15700
  upIsiPct: number; // Master!E22 up isi (%) — 0
  gramaturIsi: number; // Master!D21 -> BUKU!AU28 — 70
  insheetIsi: number; // Master!D23 -> BUKU!AI6 — 100 / 100 / 7 per combo
  tarifDesainIsiPerUnit: number; // Master!D26 -> BUKU!AT6 (Rp × C7) — 2500
  // Tarif isi AW6/AY6/AZ7/AR2 adalah konstanta BUKU per-mesin per-file (BUKAN sel Master) —
  // diikat di config per combo agar 1 state params tetap benar saat ganti lini:
  // Oliver 45000/90000/40; Ryobi 10000/15000/30; Buya/Inter 0 (+AR2 700/350).
  tarifRoyalti: number; // Master!D36 -> BUKU!BF6 — 0
  tarifKawatRoll: number; // Master!D30 Kawat Stiching (Rp/roll) — 120000 -> BUKU!BL6 = D30/25500
  tarifTintaSpotUV: number; // Master!D31 (Rp/kg) — 279625 -> BUKU!BT7 = BS7*D31
  tarifShrinkRoll: number; // Master!D32 Plastik Sring (Rp/roll) — 832500 (21) / 1162500 (14,5) -> BUKU!CT7
  tarifSteplesPack: number; // Master!D33 Isi Steples 369/Pack (Rp) — 3000 -> BUKU!BO6 (combo Print-Print)
  tarifLakbanRoll: number; // Master!D34 -> BUKU!CZ6 — 8000
  tarifKardusBox: number; // Master!D35 -> BUKU!DA6 — 8500
  tarifSisirPerPcs: number; // BUKU!BQ6 = 3*50 (Rp/pcs) — 150
  tarifBending: number; // BUKU!CC6 (Rp) — 50
  minBending: number; // floor BUKU!CE7 (Rp) — 100000
  tarifLaminasiGlossy: number; // BUKU!CF6 (Rp/cm2) — 0.35
  tarifLaminasiDoff: number; // BUKU!CI6 (Rp/cm2) — 0.4
  tarifUvVarnish: number; // BUKU!CL6 (Rp/cm2) — 0.11
  minFinishing: number; // floor BUKU!CG/CJ/CM (Rp) — 50000
  marginDefaultPct: number; // Master!E37 Laba (%) — 30
}

export const DEFAULT_SOFT_COVER_OFFSET_PARAMS: SoftCoverOffsetMasterParams = {
  umr: 2818850,
  tarifKertasCoverKg: 16400,
  upCoverPct: 0,
  gramaturCover: 230,
  insheetCover: 100,
  tarifDesainCover: 20000,
  tarifPrintCoverA3: 2700,
  tarifKertasIsiKg: 15700,
  upIsiPct: 0,
  gramaturIsi: 70,
  insheetIsi: 100,
  tarifDesainIsiPerUnit: 2500,
  tarifRoyalti: 0,
  tarifKawatRoll: 120000,
  tarifTintaSpotUV: 279625,
  tarifShrinkRoll: 832500,
  tarifSteplesPack: 3000,
  tarifLakbanRoll: 8000,
  tarifKardusBox: 8500,
  tarifSisirPerPcs: 150,
  tarifBending: 50,
  minBending: 100000,
  tarifLaminasiGlossy: 0.35,
  tarifLaminasiDoff: 0.4,
  tarifUvVarnish: 0.11,
  minFinishing: 50000,
  marginDefaultPct: 30,
};

// Default Master per combo (= DEFAULT + bawaan file; tiap lini punya state params sendiri).
// Bawaan file — insheetCover/insheetIsi/shrink/jasaBuya: OO(100/100), PO(10/100), PP(10/7),
// OO-14(100/100), OR-14(100/30), PP-14(7/5), PR-14(7/30); shrink 1162500 & jasaBuya 350 untuk 14,5.
export function defaultSoftCoverOffsetParams(combo: SoftCoverOffsetComboId): SoftCoverOffsetMasterParams {
  const base = { ...DEFAULT_SOFT_COVER_OFFSET_PARAMS };
  switch (combo) {
    case 'Print-Oliver': return { ...base, insheetCover: 10 };
    case 'Print-Print': return { ...base, insheetCover: 10, insheetIsi: 7 };
    case 'OO-14': return { ...base, tarifShrinkRoll: 1162500 };
    case 'OR-14': return { ...base, insheetIsi: 30, tarifShrinkRoll: 1162500 };
    case 'PP-14': return { ...base, insheetCover: 7, insheetIsi: 5, tarifShrinkRoll: 1162500 };
    case 'PR-14': return { ...base, insheetCover: 7, insheetIsi: 30, tarifShrinkRoll: 1162500 };
    default: return base;
  }
}

export interface SoftCoverOffsetComboConfig {
  id: SoftCoverOffsetComboId;
  ukuran: SoftCoverOffsetUkuran;
  isiAKALAM: [number, number, number]; // BUKU!AK7/AL7/AM7 (per file!)
  plateIsiY6: number; // BUKU!AW6 (Oliver 45000 / Ryobi 10000)
  minIsiY6: number; // BUKU!AY6 (Oliver 90000 / Ryobi 15000)
  drekIsiZ: number; // BUKU!AZ7 (Oliver 40 / Ryobi 30)
  jasaBuyaAR2: number; // BUKU!AR2 teks (700 / 350)
  label: string; // "Cover Oliver – Isi Oliver"
  coverMesin: string; // Master!D16 terkunci
  isiMesin: string; // Master!D25 terkunci
  potongCover: number; // BUKU!O7
  coverPerPlano: number; // BUKU!P7
  plateCoverY6: number; // BUKU!Y6 (45000 / 43000)
  minCoverAB6: number; // BUKU!AB6 — 90000
  drekCoverAC6: number; // BUKU!AC6 — 40
  ungatedCoverCells: boolean; // true hanya file Print-Oliver (AB7/Y7/BY7 tanpa gate H)
  jasaModel: 'UMR5' | 'BNBO'; // 'BNBO' hanya combo Print-Print (BI26–BM26=X, BN26/BO26=√)
  tiers: number[]; // BUKU!H tiers file
  category: string;
  description: string;
}

export const SOFT_COVER_OFFSET_COMBOS: Record<SoftCoverOffsetComboId, SoftCoverOffsetComboConfig> = {
  'Oliver-Oliver': {
    id: 'Oliver-Oliver', ukuran: '21 x 29,7', label: 'Cover Oliver – Isi Oliver', coverMesin: 'Oliver', isiMesin: 'Oliver',
    isiAKALAM: [4, 2, 16], plateIsiY6: 45000, minIsiY6: 90000, drekIsiZ: 40, jasaBuyaAR2: 700,
    potongCover: 2, coverPerPlano: 4, plateCoverY6: 45000, minCoverAB6: 90000, drekCoverAC6: 40,
    ungatedCoverCells: false, jasaModel: 'UMR5',
    tiers: [550, 600, 650, 700, 750, 800, 900, 1000, 1500, 2000, 2500, 3000],
    category: 'Buku Soft Cover Oliver-Oliver',
    description: '21 × 29,7 cm · Cover AC 230 Oliver + Isi HVS 70 Oliver · tier 550–3000',
  },
  'Print-Oliver': {
    id: 'Print-Oliver', ukuran: '21 x 29,7', label: 'Cover Print – Isi Oliver', coverMesin: 'Print Inter', isiMesin: 'Oliver',
    isiAKALAM: [4, 2, 16], plateIsiY6: 45000, minIsiY6: 90000, drekIsiZ: 40, jasaBuyaAR2: 700,
    potongCover: 1, coverPerPlano: 1, plateCoverY6: 43000, minCoverAB6: 90000, drekCoverAC6: 40,
    ungatedCoverCells: true, jasaModel: 'UMR5',
    tiers: [300, 350, 400, 450, 500],
    category: 'Buku Soft Cover Print-Oliver',
    description: '21 × 29,7 cm · Cover Print Inter + Isi HVS 70 Oliver · tier 300–500',
  },
  'Print-Print': {
    id: 'Print-Print', ukuran: '21 x 29,7', label: 'Cover Print – Isi Print', coverMesin: 'Print Inter', isiMesin: 'Print Buya',
    isiAKALAM: [2, 1, 4], plateIsiY6: 0, minIsiY6: 0, drekIsiZ: 0, jasaBuyaAR2: 700,
    potongCover: 1, coverPerPlano: 1, plateCoverY6: 43000, minCoverAB6: 90000, drekCoverAC6: 40,
    ungatedCoverCells: false, jasaModel: 'BNBO',
    tiers: [20, 30, 50, 60, 100, 150, 200, 250],
    category: 'Buku Soft Cover Print-Print',
    description: '21 × 29,7 cm · Cover Print Inter + Isi Print Buya · tier 20–250',
  },
  'OO-14': {
    id: 'OO-14', ukuran: '14,5 x 20,25', label: 'Cover Oliver – Isi Oliver', coverMesin: 'Oliver', isiMesin: 'Oliver',
    isiAKALAM: [4, 4, 32], plateIsiY6: 45000, minIsiY6: 90000, drekIsiZ: 40, jasaBuyaAR2: 350,
    potongCover: 4, coverPerPlano: 8, plateCoverY6: 45000, minCoverAB6: 90000, drekCoverAC6: 40,
    ungatedCoverCells: false, jasaModel: 'UMR5',
    tiers: [1000, 1500, 2000, 2500, 3000],
    category: 'Buku Soft Cover OO-14',
    description: '14,5 × 20,25 cm · Cover AC 230 Oliver + Isi HVS 70 Oliver · tier 1000–3000',
  },
  'OR-14': {
    id: 'OR-14', ukuran: '14,5 x 20,25', label: 'Cover Oliver – Isi Ryobi', coverMesin: 'Oliver', isiMesin: 'Ryobi',
    isiAKALAM: [2, 1, 4], plateIsiY6: 10000, minIsiY6: 15000, drekIsiZ: 30, jasaBuyaAR2: 350,
    potongCover: 4, coverPerPlano: 8, plateCoverY6: 45000, minCoverAB6: 90000, drekCoverAC6: 40,
    ungatedCoverCells: false, jasaModel: 'BNBO',
    tiers: [650, 700, 750, 800, 900],
    category: 'Buku Soft Cover OR-14',
    description: '14,5 × 20,25 cm · Cover AC 230 Oliver + Isi HVS 70 Ryobi · tier 650–900',
  },
  'PP-14': {
    id: 'PP-14', ukuran: '14,5 x 20,25', label: 'Cover Print – Isi Print', coverMesin: 'Print Inter', isiMesin: 'Print Buya',
    isiAKALAM: [2, 1, 4], plateIsiY6: 0, minIsiY6: 0, drekIsiZ: 0, jasaBuyaAR2: 350,
    potongCover: 1, coverPerPlano: 2, plateCoverY6: 45000, minCoverAB6: 90000, drekCoverAC6: 40,
    ungatedCoverCells: true, jasaModel: 'BNBO',
    tiers: [20, 30, 50, 60, 100, 150, 200],
    category: 'Buku Soft Cover PP-14',
    description: '14,5 × 20,25 cm · Cover Print Inter + Isi Print Buya · tier 20–200',
  },
  'PR-14': {
    id: 'PR-14', ukuran: '14,5 x 20,25', label: 'Cover Print – Isi Ryobi', coverMesin: 'Print Inter', isiMesin: 'Ryobi',
    isiAKALAM: [2, 1, 4], plateIsiY6: 10000, minIsiY6: 15000, drekIsiZ: 30, jasaBuyaAR2: 350,
    potongCover: 1, coverPerPlano: 2, plateCoverY6: 45000, minCoverAB6: 90000, drekCoverAC6: 40,
    ungatedCoverCells: true, jasaModel: 'BNBO',
    tiers: [250, 300, 350, 400, 450, 500, 550, 600],
    category: 'Buku Soft Cover PR-14',
    description: '14,5 × 20,25 cm · Cover Print Inter + Isi HVS 70 Ryobi · tier 250–600',
  },
};

export interface SoftCoverOffsetSimulatorInput {
  oplah: number;
  jumlahHalaman: number; // Master!D6 (tersimpan 32)
  mukaCover: SoftCoverOffsetMukaType; // Master!D14
  warnaCover: SoftCoverOffsetWarnaType; // Master!D15
  warnaIsi: SoftCoverOffsetWarnaType; // Master!D24
  finishing: SoftCoverOffsetFinishingType; // Master!D29
  marginPct: number; // Master!E37
  // Saklar komponen bebas (default = keadaan file per jasaModel).
  feat?: {
    jasaLipat?: boolean; jasaSisir?: boolean; jasaSusun?: boolean; jasaKawat?: boolean;
    jasaStiching?: boolean; jasaSusunStaples?: boolean; jasaSteples?: boolean;
    packingKardus?: boolean;
  };
}

export interface SoftCoverOffsetBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface SoftCoverOffsetSimulatorResult {
  input: SoftCoverOffsetSimulatorInput;
  combo: SoftCoverOffsetComboId;
  breakdown: SoftCoverOffsetBreakdownItem[];
  kebutuhanKertasCover: number; // BUKU!R7
  kebutuhanCetakCover: number; // BUKU!Q7
  kebutuhanPlanoIsi: number; // BUKU!AP7
  totalHpp: number; // BUKU!DC7
  hppPerPcs: number; // BUKU!DD7
  hargaJualPerPcs: number; // BUKU!DI7
  totalHargaJual: number; // BUKU!DG7
  profitPerPcs: number;
  profitTotal: number;
  marginPct: number;
}

const mukaCount = (m: SoftCoverOffsetMukaType): number => (m === '1 Muka' ? 1 : 2); // BUKU!N7
const warnaCount = (w: string): number => // BUKU!L7 = BUKU!AJ7
  (w === '1 Warna' ? 1 : w === '2 Warna' ? 2 : w === '3 Warna' ? 3 : 4);
// BUKU!M7 punggung generasi file-combo (BEDA dari file PI-Oliver lama yang ≤100→0)
const punggung = (hal: number): number =>
  hal <= 100 ? 0.5 : hal <= 200 ? 0.7 : hal <= 300 ? 1.5 : hal <= 400 ? 2 : hal <= 500 ? 2.5 : hal <= 600 ? 2.5 : 2.8;
// BUKU!BN28 target per (ukuran, file): 21×29,7 & 14,5×20,25 punya tabel sendiri;
// dalam satu ukuran, file BNBO (F3-21 / F2-F4-14) vs non-BNBO bisa beda tabel — diikat per combo.
const targetBN = (hal: number, combo: SoftCoverOffsetComboId): number => {
  const ukuran = SOFT_COVER_OFFSET_COMBOS[combo].ukuran;
  if (ukuran === '14,5 x 20,25')
    return hal <= 20 ? 900 : hal <= 30 ? 900 : hal <= 40 ? 800 : hal <= 50 ? 800 : hal <= 60 ? 800 : hal <= 70 ? 800 : 700;
  if (combo === 'Print-Print')
    return hal <= 20 ? 600 : hal <= 30 ? 550 : hal <= 40 ? 500 : hal <= 50 ? 450 : hal <= 60 ? 400 : hal <= 70 ? 350 : 300;
  return hal <= 20 ? 700 : hal <= 30 ? 650 : hal <= 40 ? 600 : hal <= 50 ? 550 : hal <= 60 ? 500 : hal <= 70 ? 450 : 400;
};
// BUKU!CY35 isi kardus dari halaman C6
const kardusIsi = (hal: number): number =>
  hal <= 100 ? 200 : hal <= 200 ? 150 : hal <= 300 ? 100 : hal <= 400 ? 90 : hal <= 500 ? 80 : hal <= 600 ? 70 : 50;
// Dimensi plano cover BUKU!V27/W27 per (ukuran, mesin cover)
const coverPlano = (ukuran: SoftCoverOffsetUkuran, mesin: string): [number, number] => {
  if (ukuran === '14,5 x 20,25')
    return mesin === 'SM' || mesin === 'Oliver' || mesin === 'Ryobi' ? [65, 100] : mesin === 'Print Inter' ? [32.5, 48] : [21.5, 33]; // Buya
  return mesin === 'Oliver' || mesin === 'SM' ? [65, 100] : mesin === 'Print Inter' ? [32.5, 48] : [29.7, 42]; // Buya
};
// Dimensi area isi BUKU!AT27/AU27 per (ukuran, mesin isi, warna isi)
const isiArea = (ukuran: SoftCoverOffsetUkuran, mesin: string, warna: string): [number, number] => {
  if (ukuran === '14,5 x 20,25') {
    if (mesin === 'SM') return [61, 86];
    if (mesin === 'Oliver') return [65, 100];
    return [21.5, 33]; // Ryobi / Print Buya
  }
  if (mesin === 'Oliver' || mesin === 'SM') return warna === '1 Warna' ? [61, 86] : [65, 100];
  if (mesin === 'Print Inter') return [32.5, 48];
  return [29.7, 42]; // Print Buya / Ryobi
};
// BUKU!AK7/AL7/AM7 & tarif isi AW6/AY6/AZ7/AR2 per FILE (cabang mesin dalam satu file bisa beda
// antar-file, mis. AK Oliver 4 (OO-14) vs 8 (file 14,5 lain) — karena itu diikat per combo, bukan per mesin).
// Lihat bsc3-fulldiff.txt: AK7/AL7/AM7/AT27/AU27 berbeda antar-file se-ukuran.
// Ambang over isi BUKU!BB7: Oliver 1000, Ryobi 500 (SM 3000 tak dipakai combo)
const ambangOverIsi = (mesin: string): number => (mesin === 'Oliver' ? 1000 : 500);

export function calculateSoftCoverOffsetHpp(
  input: SoftCoverOffsetSimulatorInput,
  rawParams: SoftCoverOffsetMasterParams = DEFAULT_SOFT_COVER_OFFSET_PARAMS,
  comboId: SoftCoverOffsetComboId = 'Oliver-Oliver'
): SoftCoverOffsetSimulatorResult {
  const p: SoftCoverOffsetMasterParams = { ...DEFAULT_SOFT_COVER_OFFSET_PARAMS, ...(rawParams || {}) };
  const cfg = SOFT_COVER_OFFSET_COMBOS[comboId];
  const { oplah, jumlahHalaman, mukaCover, warnaCover, warnaIsi, finishing, marginPct } = input;
  const H = Math.max(0, Math.round(oplah));
  const C6 = Math.max(0, Math.round(jumlahHalaman));
  const M = punggung(C6); // BUKU!M7
  const N = mukaCount(mukaCover); // BUKU!N7
  const Z2 = warnaCount(warnaCover); // BUKU!Z2
  const AJ = warnaCount(warnaIsi); // BUKU!AJ7
  const C7 = C6 / 4; // BUKU!C7 (generasi combo: C6/4)
  const umrHarian = p.umr / 25;

  const breakdown: SoftCoverOffsetBreakdownItem[] = [];
  let totalHpp = 0;
  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // ---- COVER (terkunci per combo) ----
  const [D7, F7] = cfg.ukuran === '14,5 x 20,25' ? [14.5, 20.25] : [21, 29.7]; // BUKU!D7/F7
  const K = p.insheetCover; // BUKU!K7 = K6 = Master!D13 (tanpa gate H)
  const O = cfg.potongCover; // BUKU!O7
  const P = cfg.coverPerPlano; // BUKU!P7
  // BUKU!R7 = IF(H>0,(H/P)+(K/O),0) —/+ ROUNDUP untuk 14,5 x 20,25
  const R = H > 0 ? (cfg.ukuran === '14,5 x 20,25' ? Math.ceil(H / P + K / O) : H / P + K / O) : 0;
  const Qc = R * O * N; // BUKU!Q7
  // BUKU!W29 rim cover; BUKU!T7: Ryobi/Oliver/SM/Buya → (R/500)*W29; Print Inter → T2*R
  const [cvW, cvH] = coverPlano(cfg.ukuran, cfg.coverMesin);
  const rimCover = ((cvW * cvH) * p.gramaturCover) / 20000 * (p.tarifKertasCoverKg * (1 + p.upCoverPct / 100));
  const T = cfg.coverMesin === 'Print Inter' ? p.tarifPrintCoverA3 * R : (R / 500) * rimCover;
  add(`Kertas Cover ${cfg.coverMesin}`, T, `${R} lbr × Rp ${Math.round(cfg.coverMesin === 'Print Inter' ? p.tarifPrintCoverA3 : rimCover / 500).toLocaleString('id-ID')}`);
  // BUKU!V7 = IF(H>0,V6,0)
  add('Desain Cover', H > 0 ? p.tarifDesainCover : 0, `Rp ${p.tarifDesainCover.toLocaleString('id-ID')}/order`);
  // BUKU!Y6/AB6 = 0 untuk Print Inter & Print Buya → seluruh blok plate/min/over cover Rp 0.
  // (cabang SM/Ryobi ada di rumus tapi tak dipakai combo mana pun — didokumentasikan, tidak diikat)
  const coverOffset = cfg.coverMesin === 'Oliver';
  // BUKU!Y7 (gate H; file Print-Oliver tanpa gate — nilai sama saat H>0)
  const Z7 = Z2; // BUKU!Z7 (Z6=0 → Z2)
  const Y = coverOffset && (H > 0 || cfg.ungatedCoverCells) ? cfg.plateCoverY6 * Z7 : 0;
  add('Plate Cover ' + cfg.coverMesin, Y, `Rp ${coverOffset ? cfg.plateCoverY6.toLocaleString('id-ID') : 0} × ${Z7} warna`);
  // BUKU!AB7 (gate H; Print-Oliver tanpa gate); BUKU!AD7 = AB*Z7
  const AB = coverOffset && (H > 0 || cfg.ungatedCoverCells) ? cfg.minCoverAB6 : 0;
  const AD = AB * Z7;
  // BUKU!AE7 over cover (Oliver: Q-1000>1); BUKU!AF7 = AE>1 ? AE*drek*Z2 : 0; BUKU!AG7 = AF+AD (Oliver)
  const overCover = coverOffset && Qc - 1000 > 1 ? Qc - 1000 : 0;
  const AF = overCover === 0 ? 0 : overCover > 1 ? overCover * cfg.drekCoverAC6 * Z2 : 0;
  const AG = coverOffset ? AF + AD : 0;
  if (AG !== 0) add('Ongkos Cetak Cover ' + cfg.coverMesin, AG, `Cetak minimal Rp ${AD.toLocaleString('id-ID')} + lebihan ${overCover}×${cfg.drekCoverAC6}×${Z2}`);

  // ---- ISI ----
  const AI = H > 0 ? p.insheetIsi : 0; // BUKU!AI7 = Master!D23
  // BUKU!AK7/AL7/AM7 (terkunci per combo)
  const [AK, AL, AM] = cfg.isiAKALAM;
  const AN = C6 / (AM / AL); // BUKU!AN7
  const AN6 = Math.ceil(AN); // BUKU!AN6 = ROUNDUP(AN7,0)
  const AO = ((H / AL) * AN + (AI / AL) * AN6) * AL; // BUKU!AO7
  const AP = H > 0 ? ((H / AL) * AN + (AI / AL) * AN6) : 0; // BUKU!AP7
  // BUKU!AU29 rim isi; BUKU!AR7: Print Inter → (AR2*2)*AP; Buya/Ryobi/Oliver/SM → (AP/500)*AU29
  const [iaW, iaH] = isiArea(cfg.ukuran, cfg.isiMesin, warnaIsi);
  const rimIsi = ((iaW * iaH) * p.gramaturIsi) / 20000 * (p.tarifKertasIsiKg * (1 + p.upIsiPct / 100));
  const AR = (AP / 500) * rimIsi;
  add('Kertas Isi HVS', AR, `${AP} lbr × Rp ${(rimIsi / 500).toFixed(2)} (rim Rp ${Math.round(rimIsi).toLocaleString('id-ID')}/500)`);
  // BUKU!AT7 = IF(H>0,AT6*C7,0)
  add('Desain Isi', H > 0 ? p.tarifDesainIsiPerUnit * C7 : 0,
    `Rp ${p.tarifDesainIsiPerUnit.toLocaleString('id-ID')} × ${C7}`);
  // BUKU!AX7: AX6=0 → AY2*AJ; AX25 = C6/AK7; AY2 = ROUNDUP(AX25,0)
  const AX = Math.ceil(C6 / AK) * AJ;
  // BUKU!AW6/AY6 = 0 untuk Print Buya & Print Inter → plate/min isi Rp 0
  const isiOffset = cfg.isiMesin === 'Oliver' || cfg.isiMesin === 'Ryobi';
  // BUKU!AW7 = IF(H>0,AW6*AX,0); BUKU!AY7 = IF(H>0,AY6,0); BUKU!BA7 = AY*AX
  add('Plate Isi ' + cfg.isiMesin, isiOffset && H > 0 ? cfg.plateIsiY6 * AX : 0,
    `Rp ${isiOffset ? cfg.plateIsiY6.toLocaleString('id-ID') : 0} × ${AX}`);
  const BA = isiOffset && H > 0 ? cfg.minIsiY6 * AX : 0;
  // BUKU!BB7: Oliver ((H+AI)-1000)*AX / Ryobi ((H+AI)-500)*AX jika >1; Buya/Inter → 0
  const ambang = ambangOverIsi(cfg.isiMesin);
  const BB = (cfg.isiMesin === 'Oliver' || cfg.isiMesin === 'Ryobi') && (H + AI - ambang) * AX > 1 ? (H + AI - ambang) * AX : 0;
  const BC = BB === 0 ? 0 : BB * cfg.drekIsiZ;
  const BD = cfg.isiMesin === 'Print Buya' ? cfg.jasaBuyaAR2 * AO : BC + BA;
  add('Cetak Isi ' + cfg.isiMesin, BD,
    cfg.isiMesin === 'Print Buya' ? `Rp ${cfg.jasaBuyaAR2} × ${AO} (jasa print)` : `Cetak minimal Rp ${Math.round(BA).toLocaleString('id-ID')} + lebihan ${BB}×${cfg.drekIsiZ}`);
  // BUKU!BF7 = H*D36
  if (H * p.tarifRoyalti > 0) add('Royalty', H * p.tarifRoyalti, `${H} × Rp ${p.tarifRoyalti}`);
  // BUKU!BH7 = IF(H>0,BH6,0) = 0 (BH6=0 konstanta generasi combo) — tanpa baris

  // ---- JASA (model per combo) ----
  const feat = input.feat ?? {};
  const fJ = (k: 'jasaLipat' | 'jasaSisir' | 'jasaSusun' | 'jasaKawat' | 'jasaStiching' | 'jasaSusunStaples' | 'jasaSteples', fileOn: boolean) =>
    feat[k] ?? fileOn;
  if (cfg.jasaModel === 'UMR5') {
    // BI26–BM26=√: BI=(BI6*AN6)*H; BJ=BJ6*H; BK=(BK6*AN6)*H; BL=BL6*H; BM=BM6*H
    const BI6 = umrHarian / 10000; // BUKU!BI28 (A02 21x29,7)
    const BJ6 = (umrHarian / 1700) * 1; // BUKU!BJ28 × BJ2
    const BK6 = umrHarian / (500 * 19); // BUKU!BK28
    const BL6 = p.tarifKawatRoll / (30000 * (1 - 15 / 100)); // BUKU!BL28 = 30000-15%
    const BM6 = (umrHarian * 2) / 10000; // BUKU!BM28
    if (fJ('jasaLipat', true)) add('Jasa Lipat', BI6 * AN6 * H, `Rp ${BI6.toFixed(2)}×${AN6}×${H}`);
    if (fJ('jasaSisir', true)) add('Jasa Sisir', BJ6 * H, `Rp ${BJ6.toFixed(2)}×${H}`);
    if (fJ('jasaSusun', true)) add('Jasa Susun', BK6 * AN6 * H, `Rp ${BK6.toFixed(2)}×${AN6}×${H}`);
    if (fJ('jasaKawat', true)) add('Kawat Stiching', BL6 * H, `Rp ${BL6.toFixed(2)}×${H}`);
    if (fJ('jasaStiching', true)) add('Jasa Stiching', BM6 * H, `Rp ${BM6.toFixed(2)}×${H}`);
  } else {
    // BN26/BO26=√ (combo Print-Print): BN = H*BN6; BO = BO6*H
    const BN6 = umrHarian / targetBN(C6, comboId); // BUKU!BN28
    const BO6 = p.tarifSteplesPack / (1000 / 3); // BUKU!BO6 = D33/(1000/3)
    if (fJ('jasaSusunStaples', true)) add('Jasa Susun Staples', H * BN6, `${H} × Rp ${BN6.toFixed(2)}`);
    if (fJ('jasaSteples', true)) add('Steples', BO6 * H, `${H} × Rp ${BO6.toFixed(2)}`);
  }
  // BQ7 = H*150 (sisir flat; BUKU!BQ6 = 3*50)
  add('Sisir', H * p.tarifSisirPerPcs, `${H} × Rp ${p.tarifSisirPerPcs}`);

  // ---- SPOT UV (hidup untuk 21 x 29,7 di generasi combo) ----
  // BUKU!BS6 = (BT30/4)/(((D7*2)+M)*F7); BT30 = 5393320; BUKU!BS7 = H/BS6; BUKU!BT7 = BS*D31
  const BS6 = 5393320 / 4 / (((D7 * 2) + M) * F7);
  const BS = BS6 === 0 ? 0 : H / BS6;
  const BT = BS * p.tarifTintaSpotUV;
  // BUKU!BV6 = (UMR/25)/BT27; BT27 = 500; BUKU!BV7 = BV6*H; BUKU!BW7 = gate full → BT+BV
  const BV = (umrHarian / 500) * H;
  const fullCombo = finishing === 'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,';
  if (fullCombo) { add('Tinta Spot UV', BT, 'Paket full-combo'); add('Jasa Spot UV', BV, 'Paket full-combo'); }

  // ---- EMBOSS (hidup untuk 21 x 29,7) ----
  // BUKU!BY6 = ((D7+4)*(F7+4))*500*2; BUKU!BY7 = IF(H>0,BY6,0)
  // (satu file 21×29,7 Print-Oliver tanpa gate — nilai sama saat H>0)
  const BY = H > 0 ? ((D7 + 4) * (F7 + 4)) * 500 * 2 : 0;
  const BZ = H * (umrHarian / 1000);
  // BUKU!CA7 = gate full → BY+BZ
  if (fullCombo) { add('Klise Emboss', BY, 'Paket full-combo'); add('Jasa Emboss', BZ, 'Paket full-combo'); }

  // ---- BENDING ----
  // BUKU!CC27 chain persis (√: Lem Bending, / full-combo); BUKU!CD7 = (50*F7*M)*H; BUKU!CE7 floor 100rb
  const bendingOn = finishing === 'Lem Bending,' || fullCombo;
  const CD = p.tarifBending * F7 * M * H;
  const CE = CD === 0 ? 0 : CD > p.minBending ? CD : p.minBending;
  if (bendingOn && CD !== 0) add('Bending', CD, `${p.tarifBending}×${F7}×${M}×${H}`);

  // ---- LAMINASI (×N muka cover) ----
  const luasLam = (D7 * 2 + 1) * (F7 + 1); // (D7*2+1)*(F7+1): 1320.1 (21) / 638.75 (14,5)
  const finFloor = (raw: number): number => (raw === 0 ? 0 : raw > p.minFinishing ? raw : p.minFinishing);
  const rawG = luasLam * p.tarifLaminasiGlossy * H * N;
  const rawD = luasLam * p.tarifLaminasiDoff * H * N;
  const rawU = luasLam * p.tarifUvVarnish * H * N;
  add('Laminasi Glossy', finishing === 'Laminasi Glossy,' ? finFloor(rawG) : 0,
    `${luasLam.toFixed(1)}×${p.tarifLaminasiGlossy}×${H}×${N}, minimal Rp ${p.minFinishing.toLocaleString('id-ID')}`);
  add('Laminasi Doff', finishing === 'Laminasi Doff,' || fullCombo ? finFloor(rawD) : 0, 'Paket full-combo bila aktif');
  add('UV Varnish', finishing === 'UV Varnish,' ? finFloor(rawU) : 0, 'Lapisan UV');
  // Combo +Bending: UV+Bending; Glossy+Bending; Doff+Bending
  if (finishing === 'UV Varnish + Bending,') add('UV Varnish + Bending', finFloor(rawU) + CE, 'UV + ongkos bending');
  if (finishing === 'Laminasi Glossy + Bending,') add('Laminasi Glossy + Bending', finFloor(rawG) + CE, 'Glossy + ongkos bending');
  if (finishing === 'Laminasi Doff + Bending,') add('Laminasi Doff + Bending', finFloor(rawD) + CE, 'Doff + ongkos bending');

  // ---- SHRINK ----
  // BUKU!CS6 = CT30/(F7+8); CT30 = 106700; BUKU!CS7 = H/CS6; BUKU!CT7 = CS*D32
  // BUKU!CV6 = ((UMR/25)*2)/500; BUKU!CV7 = CV6*H; BUKU!CW7 = gate (Glossy+Bending/full) → CV+CT
  const CS = H / (106700 / (F7 + 8));
  const CT = CS * p.tarifShrinkRoll;
  const CV = ((umrHarian * 2) / 500) * H;
  const shrinkOn = finishing === 'Laminasi Glossy + Bending,' || fullCombo;
  if (shrinkOn) { add('Plastik Shrink', CT, 'Paket Glossy+Bending/full'); add('Jasa Shrink + Packing', CV, 'Jasa packing'); }

  // ---- PACKING ----
  // BUKU!CY6 = CZ30/196 = 7650/196; BUKU!CY7 = (H/CY35)/CY6; BUKU!CZ7 = CZ6*CY (CZ6 = D34)
  // BUKU!DA7 = gate (A02 ∧ DA28=√) → ROUNDUP(H/CY35)*DA6 + CZ (DA6 = D35)
  const CY = (H / kardusIsi(C6)) / (7650 / 196);
  const CZ = p.tarifLakbanRoll * CY;
  if (feat.packingKardus ?? true) add('Packing Kardus & Lakban', Math.ceil(H / kardusIsi(C6)) * p.tarifKardusBox + CZ,
    `${H > 0 ? Math.ceil(H / kardusIsi(C6)) : 0} kardus × Rp ${p.tarifKardusBox.toLocaleString('id-ID')} + ${CY.toFixed(4)} roll lakban`);

  breakdown.forEach((b) => { b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0; });

  // BUKU!DC7 30 suku (BN=BO=BP=0 di UMR5; BI–BM=0 di BNBO; BH=0 konstanta; CK=0 di domain terkomputasi)
  // BUKU!DD7 = DC/H; BUKU!DE7 = DD*(E37%); BUKU!DF7 = DE*H; BUKU!DG7 = (DD+DE)*H; BUKU!DH7 = DG/H; BUKU!DI7 = ROUNDUP(DH,-1)
  const hppPerPcs = H > 0 ? totalHpp / H : 0;
  const labaPerPcs = hppPerPcs * (marginPct / 100);
  const totalHargaJual = Math.round((hppPerPcs + labaPerPcs) * H);
  const hargaJualPerPcs = H > 0 ? Math.ceil((hppPerPcs + labaPerPcs) / 10) * 10 : 0;
  const profitPerPcs = hargaJualPerPcs - hppPerPcs;

  return {
    input,
    combo: comboId,
    breakdown,
    kebutuhanKertasCover: R,
    kebutuhanCetakCover: Qc,
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

export type SavedSoftCoverOffsetSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  combo: SoftCoverOffsetComboId;
  data: SoftCoverOffsetSimulatorResult;
  paramsSnapshot?: SoftCoverOffsetMasterParams;
};
