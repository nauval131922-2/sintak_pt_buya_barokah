// Kalkulator Buku Soft Cover engine "Buku Custom" (folder 19/21/24, ukuran 14,5x20,25 & 10,5x14,8).
// Direct binding 1:1 ke sheet BUKU file `BUKU UK. ... .xlsm` (114 kolom, tanpa dataValidation).
// Perbandingan string mesin case-insensitive (Excel): norm().
export type SoftCoverCustomLini =
  | 'custom-pp145-19' | 'custom-pr145-19'
  | 'custom-oo145-21' | 'custom-or145-21' | 'custom-pp145-21' | 'custom-pr145-21'
  | 'custom-oo105-24' | 'custom-po105-24' | 'custom-pp105-24' | 'custom-pr105-24';

export const SOFT_COVER_CUSTOM_LINIS: { id: SoftCoverCustomLini; label: string }[] = [
  { id: 'custom-pp145-19', label: '14,5 Cover Print-Isi Print (19 · 20–200)' },
  { id: 'custom-pr145-19', label: '14,5 Cover Print-Isi Ryobi (19 · 250–600)' },
  { id: 'custom-oo145-21', label: '14,5 Cover Oliver-Isi Oliver (21 · 1000–3000)' },
  { id: 'custom-or145-21', label: '14,5 Cover Oliver-Isi Ryobi (21 · 650–900)' },
  { id: 'custom-pp145-21', label: '14,5 Cover Print-Isi Print (21 · 20–200)' },
  { id: 'custom-pr145-21', label: '14,5 Cover Print-Isi Ryobi (21 · 250–600)' },
  { id: 'custom-oo105-24', label: '10,5 Cover Oliver-Isi Oliver (24 · 1500–5000)' },
  { id: 'custom-po105-24', label: '10,5 Cover Print-Isi Oliver (24 · 700–1000)' },
  { id: 'custom-pp105-24', label: '10,5 Cover Print-Isi Print (24 · 20–200)' },
  { id: 'custom-pr105-24', label: '10,5 Cover Print-Isi Ryobi (24 · 250–600)' },
];

// BUKU!O7/P7 per (ukuran, mesin cover) — cabang mati dikomposisi dari file yang hidup (disetujui user).
// 14,5: semua file sepakat. 10,5: cover Oliver dari file OO (O=4/P=16); Ryobi tak ada cabang (0/0 = tak valid).
const COVER_OP: Record<string, Record<string, [number, number]>> = {
  '14,5 X 20,25': { sm: [1, 9], oliver: [4, 8], ryobi: [9, 9], 'print inter': [1, 2], 'print buya': [1, 1] },
  '10,5 X 14,8': { sm: [1, 4], oliver: [4, 16], 'print inter': [1, 4], 'print buya': [1, 1] },
};
// BUKU!AK7/AL7/AM7 per (ukuran, mesin isi) — 10,5 isi Oliver dari file OO/PO, isi Ryobi dari file PR.
const ISI_AKALAM: Record<string, Record<string, [number, number, number]>> = {
  '14,5 X 20,25': { sm: [16, 1, 32], oliver: [8, 2, 32], ryobi: [2, 1, 4], 'print buya': [2, 1, 4], 'print inter': [4, 1, 8] },
  '10,5 X 14,8': { sm: [8, 1, 16], oliver: [16, 2, 64], ryobi: [4, 1, 8], 'print buya': [4, 1, 8], 'print inter': [4, 1, 8] },
};
// BUKU!V27/W27 plano cover per (ukuran, mesin cover). 10,5 tanpa cabang Ryobi.
const COVER_PLANO: Record<string, Record<string, [number, number]>> = {
  '14,5 X 20,25': { sm: [65, 100], oliver: [65, 100], ryobi: [65, 100], 'print inter': [32.5, 48], 'print buya': [21.5, 33] },
  '10,5 X 14,8': { sm: [65, 100], oliver: [65, 100], 'print inter': [32.5, 48], 'print buya': [29.7, 42] },
};
// BUKU!AT27/AU27 plano isi per (ukuran, warna isi, mesin isi). 14,5 tanpa cabang warna & Print Inter.
const ISI_PLANO: Record<string, Record<string, Record<string, [number, number]>>> = {
  '14,5 X 20,25': {
    '*': { sm: [61, 86], oliver: [61, 86], ryobi: [21.5, 33], 'print buya': [21.5, 33], 'print inter': [0, 0] },
  },
  '10,5 X 14,8': {
    '1 Warna': { sm: [61, 86], oliver: [61, 86], ryobi: [21.5, 33], 'print buya': [21.5, 33], 'print inter': [32.5, 48] },
    '2 Warna': { sm: [65, 100], oliver: [65, 100], ryobi: [21.5, 33], 'print buya': [29.7, 42], 'print inter': [32.5, 48] },
    '3 Warna': { sm: [65, 100], oliver: [65, 100], ryobi: [21.5, 33], 'print buya': [29.7, 42], 'print inter': [32.5, 48] },
    '4 Warna': { sm: [65, 100], oliver: [65, 100], ryobi: [21.5, 33], 'print buya': [21.5, 42], 'print inter': [32.5, 48] },
  },
};
// BUKU!Y6/AB6 (plat/min cover), BUKU!AW6/AY6 (plat/min isi), BUKU!AC7/AZ7 (per drek). Sama di semua file.
const PLAT_MIN_COVER: Record<string, [number, number]> = { sm: [78000, 310000], oliver: [45000, 90000], ryobi: [10000, 15000], 'print inter': [0, 0], 'print buya': [0, 0] };
const PLAT_MIN_ISI: Record<string, [number, number]> = { 'print buya': [0, 0], 'print inter': [0, 0], ryobi: [10000, 15000], oliver: [45000, 90000], sm: [78000, 310000] };
const DREK: Record<string, number> = { sm: 100, oliver: 40, ryobi: 30, 'print inter': 0, 'print buya': 0 };
// BUKU!BW27..CQ27/CW28 toggle finishing per Master!D29 (9 opsi, identik semua file).
const D29_OPTIONS = ['None,', 'UV Varnish,', 'Laminasi Glossy,', 'Laminasi Doff,', 'Lem Bending,', 'UV Varnish + Bending,', 'Laminasi Glossy + Bending,', 'Laminasi Doff + Bending,', 'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,'];
const D29_TOGGLE: Record<string, { bending: boolean; glossy: boolean; doff: boolean; uv: boolean; uvBend: boolean; glossyBend: boolean; doffBend: boolean; shrink: boolean; full: boolean }> = {
  'None,': { bending: false, glossy: false, doff: false, uv: false, uvBend: false, glossyBend: false, doffBend: false, shrink: false, full: false },
  'UV Varnish,': { bending: false, glossy: false, doff: false, uv: true, uvBend: false, glossyBend: false, doffBend: false, shrink: false, full: false },
  'Laminasi Glossy,': { bending: false, glossy: true, doff: false, uv: false, uvBend: false, glossyBend: false, doffBend: false, shrink: false, full: false },
  'Laminasi Doff,': { bending: false, glossy: false, doff: true, uv: false, uvBend: false, glossyBend: false, doffBend: false, shrink: false, full: false },
  'Lem Bending,': { bending: true, glossy: false, doff: false, uv: false, uvBend: false, glossyBend: false, doffBend: false, shrink: false, full: false },
  'UV Varnish + Bending,': { bending: false, glossy: false, doff: false, uv: false, uvBend: true, glossyBend: false, doffBend: false, shrink: false, full: false },
  'Laminasi Glossy + Bending,': { bending: false, glossy: false, doff: false, uv: false, uvBend: false, glossyBend: true, doffBend: false, shrink: true, full: false },
  'Laminasi Doff + Bending,': { bending: false, glossy: false, doff: false, uv: false, uvBend: false, glossyBend: false, doffBend: true, shrink: false, full: false },
  'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,': { bending: true, glossy: false, doff: true, uv: false, uvBend: false, glossyBend: false, doffBend: false, shrink: true, full: true },
};

export interface SoftCoverCustomParams {
  jumlahHalaman: number; mukaCover: 1 | 2; warnaCover: number; warnaIsi: number;
  mesinCover: string; mesinIsi: string;
  umr: number; hargaKertasCoverKg: number; hargaKertasIsiKg: number;
  gramaturCover: number; // BUKU!W28 — 230 di semua file custom
  upCoverPct: number; upIsiPct: number; // Master!E12/E22 (%) — 0 di semua file custom
  insheetCover: number; insheetIsi: number;
  desainCover: number; tarifPrintCover: number; tarifPrintBuyaIsi: number; drekIsi: number; desainIsiPerHlm: number;
  d29: string;
  finLipat: boolean; finSisir: boolean; finSusunKomplit: boolean; finKawat: boolean; finStiching: boolean;
  finSusunStaples: boolean; finBiayaStaples: boolean;
  targetLipat: number; targetSisir: number; targetSusunKomplit: number; targetKawatRoll: number; targetStiching: number;
  kawatPerRoll: number; staplesPerPack: number;
  tintaSpotUVkg: number; plastikShrinkRoll: number; lakbanRoll: number; kardus: number; royalty: number;
  labaPct: number;
  packingKardus?: boolean; // saklar bebas (default = file: on, DA28=√)
}

export interface SoftCoverCustomLiniConfig {
  lini: SoftCoverCustomLini; ukuran: string; lebar: number; panjang: number;
  defaultMesinCover: string; defaultMesinIsi: string;
  insheetCover: number; insheetIsi: number; drekIsi: number; shrinkRoll: number;
  tiers: number[]; finOO: boolean;
  // Temuan audit Tahap-4: file 24oo satu-satunya yang R7-nya tanpa ROUNDUP
  // (BUKU!R7=IF(H7>0,(H7/P7)+(K7/O7),0)); 9 file lain ROUNDUP(...,0). Diikat per lini, bukan kompromi.
  rataR?: boolean;
}

export const SOFT_COVER_CUSTOM_CONFIGS: Record<SoftCoverCustomLini, SoftCoverCustomLiniConfig> = {
  // Master!D13/D23/D27/D32 + tier H + row26 per file sumber. Folder 21 menang untuk PP/PR @14,5 (keputusan user).
  'custom-pp145-19': { lini: 'custom-pp145-19', ukuran: '14,5 X 20,25', lebar: 14.5, panjang: 20.25, defaultMesinCover: 'Print Inter', defaultMesinIsi: 'Print Buya', insheetCover: 10, insheetIsi: 7, drekIsi: 350, shrinkRoll: 1162500, tiers: [20, 30, 50, 60, 100, 150, 200], finOO: false },
  'custom-pr145-19': { lini: 'custom-pr145-19', ukuran: '14,5 X 20,25', lebar: 14.5, panjang: 20.25, defaultMesinCover: 'Print Inter', defaultMesinIsi: 'Ryobi', insheetCover: 10, insheetIsi: 30, drekIsi: 2000, shrinkRoll: 1162500, tiers: [250, 300, 350, 400, 450, 500, 550, 600], finOO: false },
  'custom-oo145-21': { lini: 'custom-oo145-21', ukuran: '14,5 X 20,25', lebar: 14.5, panjang: 20.25, defaultMesinCover: 'Oliver', defaultMesinIsi: 'Oliver', insheetCover: 100, insheetIsi: 100, drekIsi: 2000, shrinkRoll: 1162500, tiers: [1000, 1500, 2000, 2500, 3000], finOO: true },
  'custom-or145-21': { lini: 'custom-or145-21', ukuran: '14,5 X 20,25', lebar: 14.5, panjang: 20.25, defaultMesinCover: 'Oliver', defaultMesinIsi: 'Ryobi', insheetCover: 100, insheetIsi: 30, drekIsi: 2000, shrinkRoll: 1162500, tiers: [650, 700, 750, 800, 900], finOO: false },
  'custom-pp145-21': { lini: 'custom-pp145-21', ukuran: '14,5 X 20,25', lebar: 14.5, panjang: 20.25, defaultMesinCover: 'Print Inter', defaultMesinIsi: 'Print Buya', insheetCover: 7, insheetIsi: 5, drekIsi: 350, shrinkRoll: 1162500, tiers: [20, 30, 50, 60, 100, 150, 200], finOO: false },
  'custom-pr145-21': { lini: 'custom-pr145-21', ukuran: '14,5 X 20,25', lebar: 14.5, panjang: 20.25, defaultMesinCover: 'Print Inter', defaultMesinIsi: 'Ryobi', insheetCover: 7, insheetIsi: 30, drekIsi: 2000, shrinkRoll: 1162500, tiers: [250, 300, 350, 400, 450, 500, 550, 600], finOO: false },
  'custom-oo105-24': { lini: 'custom-oo105-24', ukuran: '10,5 X 14,8', lebar: 10.5, panjang: 14.8, defaultMesinCover: 'Oliver', defaultMesinIsi: 'Oliver', insheetCover: 100, insheetIsi: 100, drekIsi: 1750, shrinkRoll: 832500, tiers: [1500, 2000, 3000, 4000, 5000], finOO: true, rataR: false },
  'custom-po105-24': { lini: 'custom-po105-24', ukuran: '10,5 X 14,8', lebar: 10.5, panjang: 14.8, defaultMesinCover: 'Print Inter', defaultMesinIsi: 'Oliver', insheetCover: 10, insheetIsi: 100, drekIsi: 1750, shrinkRoll: 832500, tiers: [700, 800, 900, 1000], finOO: true },
  'custom-pp105-24': { lini: 'custom-pp105-24', ukuran: '10,5 X 14,8', lebar: 10.5, panjang: 14.8, defaultMesinCover: 'Print Inter', defaultMesinIsi: 'Print Buya', insheetCover: 10, insheetIsi: 7, drekIsi: 1750, shrinkRoll: 832500, tiers: [20, 30, 50, 60, 100, 150, 200], finOO: false },
  'custom-pr105-24': { lini: 'custom-pr105-24', ukuran: '10,5 X 14,8', lebar: 10.5, panjang: 14.8, defaultMesinCover: 'Print Inter', defaultMesinIsi: 'Ryobi', insheetCover: 10, insheetIsi: 30, drekIsi: 1750, shrinkRoll: 832500, tiers: [250, 300, 350, 400, 500, 600], finOO: false },
};

const norm = (s: string) => s.trim().toLowerCase();
const rUp0 = (x: number) => Math.ceil(x - 1e-9);
const rUp10 = (x: number) => Math.ceil(x / 10 - 1e-9) * 10;

export function defaultSoftCoverCustomParams(lini: SoftCoverCustomLini): SoftCoverCustomParams {
  const c = SOFT_COVER_CUSTOM_CONFIGS[lini];
  return {
    jumlahHalaman: 32, mukaCover: 1, warnaCover: 4, warnaIsi: 1,
    mesinCover: c.defaultMesinCover, mesinIsi: c.defaultMesinIsi,
    umr: 2818850, hargaKertasCoverKg: 16400, hargaKertasIsiKg: 15700, gramaturCover: 230,
    upCoverPct: 0, upIsiPct: 0,
    insheetCover: c.insheetCover, insheetIsi: c.insheetIsi,
    desainCover: 20000, tarifPrintCover: 2700, tarifPrintBuyaIsi: 350, drekIsi: c.drekIsi, desainIsiPerHlm: 2500,
    d29: 'None,',
    finLipat: c.finOO, finSisir: c.finOO, finSusunKomplit: c.finOO, finKawat: c.finOO, finStiching: c.finOO,
    finSusunStaples: !c.finOO, finBiayaStaples: !c.finOO,
    targetLipat: 10000, targetSisir: 1700, targetSusunKomplit: 9500, targetKawatRoll: 25500, targetStiching: 10000,
    kawatPerRoll: 120000, staplesPerPack: 3000,
    tintaSpotUVkg: 279625, plastikShrinkRoll: c.shrinkRoll, lakbanRoll: 8000, kardus: 8500, royalty: 0,
    labaPct: 30,
  };
}

export interface SoftCoverCustomTierResult {
  oplah: number; lbr: number; punggung: number;
  kertasCover: number; desainCover: number; platCover: number; ongkosCover: number;
  kertasIsi: number; desainIsi: number; platIsi: number; ongkosIsi: number;
  finishing: number; totalHpp: number; hppPerPcs: number; labaPerPcs: number; hargaJualPerPcs: number;
  dbg: Record<string, number>;
}

export function calcSoftCoverCustomTier(cfg: SoftCoverCustomLiniConfig, p: SoftCoverCustomParams, oplah: number): SoftCoverCustomTierResult {
  const H = oplah;
  const mc = norm(p.mesinCover); const mi = norm(p.mesinIsi);
  const op = (COVER_OP[cfg.ukuran] ?? {})[mc] ?? [0, 0]; // BUKU!O7/P7
  const O = op[0]; const P = op[1];
  const ak = (ISI_AKALAM[cfg.ukuran] ?? {})[mi] ?? [0, 0, 0]; // BUKU!AK7/AL7/AM7
  const AK = ak[0]; const AL = ak[1]; const AM = ak[2];
  const C6 = p.jumlahHalaman;
  const C7 = C6 / 4; // BUKU!C7
  const M = C6 === 0 ? 0 : C6 <= 100 ? 0.5 : C6 <= 200 ? 0.7 : C6 <= 300 ? 1.5 : C6 <= 400 ? 2 : C6 <= 600 ? 2.5 : 2.8; // BUKU!M7 (<=500 & <=600 sama2 2.5)
  const N = p.mukaCover; // BUKU!N7
  const Z2 = p.warnaCover; // BUKU!Z2
  const rawR = H > 0 && P > 0 && O > 0 ? H / P + p.insheetCover / O : 0;
  const R = H > 0 && P > 0 && O > 0 ? (cfg.rataR === false ? rawR : rUp0(rawR)) : 0; // BUKU!R7
  const Q = R * O * N; // BUKU!Q7
  const cv = (COVER_PLANO[cfg.ukuran] ?? {})[mc] ?? [0, 0]; // BUKU!V27/W27
  const W29 = ((cv[0] * cv[1]) * p.gramaturCover) / 20000 * (p.hargaKertasCoverKg * (p.upCoverPct / 100) + p.hargaKertasCoverKg); // BUKU!W29 (W28, Y30=E12)
  const T2 = mc === 'print inter' ? p.tarifPrintCover : mc === 'print buya' ? 300 : 0; // BUKU!T2
  const isOffC = mc === 'ryobi' || mc === 'oliver' || mc === 'sm';
  const kertasCover = isOffC ? (R / 500) * W29 : mc === 'print inter' ? T2 * R : 0; // BUKU!T7 (Print Buya ikut (R/500)*W29)
  const pk = PLAT_MIN_COVER[mc] ?? [0, 0]; // BUKU!Y6/AB6
  const Z = Z2; // BUKU!Z7 (Z6=0 → Z2)
  const platCover = H > 0 ? pk[0] * Z : 0; // BUKU!Y7
  const minCover = H > 0 ? pk[1] : 0; // BUKU!AB6→AB7
  const AC = DREK[mc] ?? 0; // BUKU!AC7
  const AD = minCover * Z; // BUKU!AD7
  const AE = mc === 'print buya' || mc === 'print inter' ? 0 : mc === 'ryobi' ? (Q - 500 > 1 ? Q - 500 : 0) : mc === 'oliver' ? (Q - 1000 > 1 ? Q - 1000 : 0) : mc === 'sm' ? (Q - 3000 > 1 ? Q - 3000 : 0) : 0; // BUKU!AE7
  const AF = AE === 0 ? 0 : AE > 1 ? AE * AC * Z2 : 0; // BUKU!AF7
  const ongkosCover = mc === 'sm' || mc === 'oliver' || mc === 'ryobi' ? AF + AD : mc === 'print inter' ? 0 : mc === 'print buya' ? T2 * Q : 0; // BUKU!AG7
  const wi = p.warnaIsi <= 1 ? '1 Warna' : p.warnaIsi === 2 ? '2 Warna' : p.warnaIsi === 3 ? '3 Warna' : '4 Warna';
  const au = ((ISI_PLANO[cfg.ukuran] ?? {})[wi] ?? (ISI_PLANO[cfg.ukuran] ?? {})['*'] ?? {})[mi] ?? [0, 0]; // BUKU!AT27/AU27
  const AU29 = ((au[0] * au[1]) * 70) / 20000 * (p.hargaKertasIsiKg * (p.upIsiPct / 100) + p.hargaKertasIsiKg); // BUKU!AU29 (AU28=70, AW30=E22)
  const AR2 = mi === 'print buya' ? p.tarifPrintBuyaIsi : mi === 'print inter' ? p.drekIsi : 0; // BUKU!AR2
  const AN = AL > 0 ? C6 / (AM / AL) : 0; // BUKU!AN7
  const AN6t = targetSusunFor(C6); // BUKU!BN28
  const AN6 = rUp0(AN); // BUKU!AN6 (AN2=0)
  const AO = AL > 0 ? ((H / AL) * AN + (p.insheetIsi / AL) * AN6) * AL : 0; // BUKU!AO7
  const AP = H > 0 && AL > 0 ? ((H / AL) * AN + (p.insheetIsi / AL) * AN6) : 0; // BUKU!AP7
  const kertasIsi = mi === 'print inter' ? AR2 * 2 * AP : mi === 'print buya' || mi === 'ryobi' || mi === 'oliver' || mi === 'sm' ? (AP / 500) * AU29 : 0; // BUKU!AR7
  const desainIsi = H > 0 ? p.desainIsiPerHlm * C7 : 0; // BUKU!AT7
  const pi = PLAT_MIN_ISI[mi] ?? [0, 0]; // BUKU!AW6/AY6
  const AX25 = AK > 0 ? C6 / AK : 0; // BUKU!AX25
  const AY2 = rUp0(AX25); // BUKU!AY2 (AX2=0)
  const AX = AY2 * p.warnaIsi; // BUKU!AX7 (AX6=0 → AY2*AJ7)
  const platIsi = H > 0 ? pi[0] * AX : 0; // BUKU!AW7
  const minIsi = H > 0 ? pi[1] : 0; // BUKU!AY7
  const AZ = DREK[mi] ?? 0; // BUKU!AZ7
  const BA = minIsi * AX; // BUKU!BA7
  const BB = mi === 'ryobi' ? (((H + p.insheetIsi - 500) * AX) > 1 ? ((H + p.insheetIsi - 500) * AX) : 0) : mi === 'oliver' ? (((H + p.insheetIsi - 1000) * AX) > 1 ? ((H + p.insheetIsi - 1000) * AX) : 0) : mi === 'sm' ? (((H + p.insheetIsi - 3000) * AX) > 1 ? ((H + p.insheetIsi - 3000) * AX) : 0) : 0; // BUKU!BB7 (PB/PI → 0)
  const BC = (BB === 0 ? 0 : BB > 1 ? BB : 0) * AZ; // BUKU!BC7
  const ongkosIsi = mi === 'print buya' ? AR2 * AO : mi === 'print inter' ? 0 : mi === 'ryobi' || mi === 'oliver' || mi === 'sm' ? BC + BA : 0; // BUKU!BD7
  // Finishing UMR — BUKU!BI6..BO6 × H (row26 = input toggle)
  const uh = p.umr / 25;
  const BI6 = p.finLipat ? uh / p.targetLipat : 0; // BUKU!BI6
  const BJ6 = p.finSisir ? (uh / p.targetSisir) * 1 : 0; // BUKU!BJ6 (BJ2=1 muka pond)
  const BK6 = p.finSusunKomplit ? uh / p.targetSusunKomplit : 0; // BUKU!BK6
  const BL6 = p.finKawat ? p.kawatPerRoll / p.targetKawatRoll : 0; // BUKU!BL6
  const BM6 = p.finStiching ? (uh * 2) / p.targetStiching : 0; // BUKU!BM6
  const BN6 = p.finSusunStaples ? uh / AN6t : 0; // BUKU!BN6
  const BO6 = p.finBiayaStaples ? p.staplesPerPack / (1000 / 3) : 0; // BUKU!BO6
  const BQ = H * 150; // BUKU!BQ7 (BQ6=3*50, tanpa toggle)
  const finUMR = (BI6 * AN6 + BJ6 + BK6 * AN6 + BL6 + BM6) * H + H * BN6 + BO6 * H;
  // Spot UV / Emboss / Bending / Laminasi / Shrink / Kardus — gate ukuran selalu terpenuhi per lini
  const t = D29_TOGGLE[p.d29] ?? D29_TOGGLE['None,'];
  const BS6 = (5393320 / 4) / (((cfg.lebar * 2 + M)) * cfg.panjang); // BUKU!BS6 (BT30=5393320, D7=lebar, F7=panjang)
  const BT = (H / BS6) * p.tintaSpotUVkg; // BUKU!BT7 (BS7*BT32)
  const BV = (uh / 500) * H; // BUKU!BV6*H (BT27=500)
  const spotUV = t.full ? BT + BV : 0; // BUKU!BW7
  const BY = ((cfg.lebar + 4) * (cfg.panjang + 4) * 500) * 2; // BUKU!BY6
  const BZ = (uh / 1000) * H; // BUKU!BZ6*H (BZ27=1000)
  const emboss = t.full ? BY + BZ : 0; // BUKU!CA7 (BY7 gated H>0; file tersimpan H>0 ✓)
  const bendBase = 50 * cfg.panjang * M * H; // BUKU!CD7 (CC6=50)
  const bendMin = bendBase === 0 ? 0 : bendBase > 100000 ? bendBase : 100000; // BUKU!CE7
  const bending = t.bending || t.full ? 0 : 0; // BUKU!CC7 — CC27=X pada None, (biaya bending murni tak dipakai di DC7)
  const cf = (cfg.lebar * 2 + 1) * (cfg.panjang + 1) * 0.35 * H * N; // BUKU!CF7
  const cfMin = cf === 0 ? 0 : cf > 50000 ? cf : 50000; // BUKU!CH7
  const ci = (cfg.lebar * 2 + 1) * (cfg.panjang + 1) * 0.4 * H * N; // BUKU!CI7
  const ciMin = ci === 0 ? 0 : ci > 50000 ? ci : 50000; // BUKU!CK7
  const cl = (cfg.lebar * 2 + 1) * (cfg.panjang + 1) * 0.11 * H * N; // BUKU!CL7
  const clMin = cl === 0 ? 0 : cl > 50000 ? cl : 50000; // BUKU!CN7
  const lam = (t.glossy ? cfMin : 0) + (t.doff || t.full ? ciMin : 0) + (t.uv ? clMin : 0)
    + (t.uvBend ? clMin + bendMin : 0) + (t.glossyBend ? cfMin + bendMin : 0) + (t.doffBend ? ciMin + bendMin : 0); // BUKU!CG7+CJ7+CM7+CO7+CP7+CQ7
  const CS6 = 106700 / (cfg.panjang + 8); // BUKU!CS6 (CT30=106700)
  const shrink = t.shrink ? ((uh * 2) / 500) * H + (H / CS6) * p.plastikShrinkRoll : 0; // BUKU!CW7 (CV6*H + CT7)
  const kardusIsi = C6 === 0 ? 0 : C6 <= 100 ? 200 : C6 <= 200 ? 150 : C6 <= 300 ? 100 : C6 <= 400 ? 90 : C6 <= 500 ? 80 : C6 <= 600 ? 70 : 50; // BUKU!CY35
  const fPacking = p.packingKardus ?? true;
  const lakban = fPacking && H > 0 && kardusIsi > 0 ? p.lakbanRoll * ((H / kardusIsi) / (7650 / 196)) : 0; // BUKU!CZ7 (CY6=CZ30/196)
  const kardus = fPacking && H > 0 && kardusIsi > 0 ? rUp0(H / kardusIsi) * p.kardus + lakban : 0; // BUKU!DA7 (DA28=√)
  const finishing = finUMR + BQ + spotUV + emboss + bending + lam + shrink + kardus + H * p.royalty; // BUKU!BH7+BF7=0
  const desainCover = H > 0 ? p.desainCover : 0; // BUKU!V7
  const totalHpp = kertasCover + desainCover + platCover + ongkosCover + kertasIsi + desainIsi + platIsi + ongkosIsi + finishing; // BUKU!DC7
  const hppPerPcs = H > 0 ? totalHpp / H : 0; // BUKU!DD7
  const labaPerPcs = hppPerPcs * (p.labaPct / 100); // BUKU!DE7
  const hargaJualPerPcs = H > 0 ? rUp10(hppPerPcs + labaPerPcs) : 0; // BUKU!DI7 (ROUNDUP(DH7,-1))
  return { oplah: H, lbr: C7, punggung: M, kertasCover, desainCover, platCover, ongkosCover, kertasIsi, desainIsi, platIsi, ongkosIsi, finishing, totalHpp, hppPerPcs, labaPerPcs, hargaJualPerPcs,
    dbg: { O, P, R, Q, W29, T2, Z, AD: AD, AE, AF, minCover, AK, AL, AM, AN, AN6, AO, AP, AU29, AR2, AX25, AY2, AX, minIsi, BA, BB, BC, BI6, BJ6, BK6, BL6, BM6, BN6, BO6, BQ, BS6, BT, BV, BY, BZ, bendMin, cf, cfMin, ci, ciMin, cl, clMin, CS6, kardusIsi, lakban, kardus } };
}

// BUKU!BN28 target susun per BUKU!C6 (jumlah halaman)
export function targetSusunFor(hal: number): number {
  if (hal < 0) return 900;
  if (hal <= 20) return 900;
  if (hal <= 30) return 900;
  if (hal <= 40) return 800;
  if (hal <= 50) return 800;
  if (hal <= 60) return 800;
  if (hal <= 70) return 800;
  return 700;
}
