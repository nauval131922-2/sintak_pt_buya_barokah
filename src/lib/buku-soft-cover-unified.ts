// Dispatcher unifikasi "1 Buku Soft Cover" — 6 folder sumber, 18 lini, 3 generasi engine.
// Sumber:
//  (A) 17. Pricelist Buku Soft Cover/Source/Pricelist Buku Soft Cover 21 x 29,7.xlsm
//      → lini 'Klasik' (engine CX: ./buku-soft-cover-calculator, tier 20–500, finishing 7 opsi)
//  (B) 17. Pricelist Buku Soft Cover - 21 x 29,7 cm/Source/BUKU UK. 21 x 29,7 - *.xlsm (3 file)
//      → lini 'Oliver-Oliver' | 'Print-Oliver' | 'Print-Print' (engine DC offset)
//  (C) 18. Pricelist Buku Soft Cover - 14,5 x 20,25 cm/Source/BUKU UK. 14,5 x 20,25 - *.xlsm (4 file)
//      → lini 'OO-14' | 'OR-14' | 'PP-14' | 'PR-14' (engine DC offset)
//  (D) 19 + 21. Pricelist Buku Soft Cover - 14,5 x 20,25 cm/Source (2+4 file, engine Buku Custom)
//      → 6 lini 'custom-*145-*' (folder 21 menang untuk PP/PR — keputusan user)
//  (E) 24. Pricelist Buku Soft Cover - 10,5 x 14,8 cm/Source (4 file, engine Buku Custom)
//      → 4 lini 'custom-*105-24'
// Tiap lini terkunci ke filenya (mesin/ukuran tak bisa dipilih bebas — di luar itu Excel #DIV/0!).
// Pemilih di UI: satu dropdown lini (18 opsi, dikelompokkan per ukuran).

import {
  calculateBukuSoftCoverHpp as calcKlasik,
  DEFAULT_BUKU_SOFT_COVER_PARAMS as DEF_KLASIK,
  BukuSoftCoverMasterParams as KlasikParams,
  BukuSoftCoverFinishingType as KlasikFinishing,
  BUKU_SOFT_COVER_TIERS as TIERS_KLASIK,
} from './buku-soft-cover-calculator';
// Catatan: KlasikFinishing = 7 literal yang sama persis dengan 7 pertama OffsetFinishing
// ('None,' … 'Laminasi Doff + Bending,') — tanpa mapping, langsung teruskan.
import {
  calculateSoftCoverOffsetHpp as calcOffset,
  DEFAULT_SOFT_COVER_OFFSET_PARAMS as DEF_OFFSET,
  defaultSoftCoverOffsetParams,
  SoftCoverOffsetMasterParams as OffsetParams,
  SoftCoverOffsetComboId,
  SoftCoverOffsetFinishingType as OffsetFinishing,
  SOFT_COVER_OFFSET_COMBOS,
} from './buku-soft-cover-offset-calculator';
import {
  calcSoftCoverCustomTier,
  defaultSoftCoverCustomParams,
  SOFT_COVER_CUSTOM_CONFIGS,
  SOFT_COVER_CUSTOM_LINIS,
  SoftCoverCustomLini,
  SoftCoverCustomParams,
} from './buku-soft-cover-custom-calculator';

export type SoftCoverLini =
  | 'Klasik'
  | SoftCoverOffsetComboId
  | SoftCoverCustomLini;

export type SoftCoverUkuran = '21 × 29,7' | '14,5 × 20,25' | '10,5 × 14,8';
export const SOFT_COVER_UKURANS: SoftCoverUkuran[] = ['21 × 29,7', '14,5 × 20,25', '10,5 × 14,8'];

// Opsi mesin sesuai cabang yang hidup di file Excel (di luar ini = #DIV/0!/0).
export const SOFT_COVER_COVER_OPTIONS: Record<SoftCoverUkuran, string[]> = {
  '21 × 29,7': ['Print Inter', 'Oliver'],
  '14,5 × 20,25': ['Print Inter', 'Oliver'],
  '10,5 × 14,8': ['Print Inter', 'Oliver'],
};
export const SOFT_COVER_ISI_OPTIONS: Record<SoftCoverUkuran, string[]> = {
  '21 × 29,7': ['Oliver', 'Print'],
  '14,5 × 20,25': ['Oliver', 'Ryobi', 'Print', 'Print Buya'],
  '10,5 × 14,8': ['Oliver', 'Ryobi', 'Print Buya'],
};

// (ukuran, cover, isi) → kandidat lini berurutan (pertama = default).
// Klasik tetap default untuk (21, PI, Oliver); F21 diutamakan di custom; offset jadi alternatif.
const CASCADE_MAP: Record<string, SoftCoverLini[]> = {
  '21 × 29,7|Print Inter|Oliver': ['Klasik', 'Print-Oliver'],
  '21 × 29,7|Oliver|Oliver': ['Oliver-Oliver'],
  '21 × 29,7|Print Inter|Print': ['Print-Print'],
  '14,5 × 20,25|Oliver|Oliver': ['OO-14', 'custom-oo145-21'],
  '14,5 × 20,25|Oliver|Ryobi': ['OR-14', 'custom-or145-21'],
  '14,5 × 20,25|Print Inter|Print': ['PP-14'],
  '14,5 × 20,25|Print Inter|Print Buya': ['custom-pp145-21', 'custom-pp145-19'],
  '14,5 × 20,25|Print Inter|Ryobi': ['custom-pr145-21', 'PR-14', 'custom-pr145-19'],
  '10,5 × 14,8|Oliver|Oliver': ['custom-oo105-24'],
  '10,5 × 14,8|Print Inter|Oliver': ['custom-po105-24'],
  '10,5 × 14,8|Print Inter|Print Buya': ['custom-pp105-24'],
  '10,5 × 14,8|Print Inter|Ryobi': ['custom-pr105-24'],
};

export function resolveLiniCandidates(ukuran: SoftCoverUkuran, mesinCover: string, mesinIsi: string): SoftCoverLini[] {
  return CASCADE_MAP[`${ukuran}|${mesinCover}|${mesinIsi}`] ?? [];
}

// Balikan untuk restore riwayat/draft: lini → (ukuran, cover, isi).
export function liniToSelectors(lini: SoftCoverLini): { ukuran: SoftCoverUkuran; mesinCover: string; mesinIsi: string } {
  switch (lini) {
    case 'Klasik': return { ukuran: '21 × 29,7', mesinCover: 'Print Inter', mesinIsi: 'Oliver' };
    case 'Oliver-Oliver': return { ukuran: '21 × 29,7', mesinCover: 'Oliver', mesinIsi: 'Oliver' };
    case 'Print-Oliver': return { ukuran: '21 × 29,7', mesinCover: 'Print Inter', mesinIsi: 'Oliver' };
    case 'Print-Print': return { ukuran: '21 × 29,7', mesinCover: 'Print Inter', mesinIsi: 'Print' };
    case 'OO-14': return { ukuran: '14,5 × 20,25', mesinCover: 'Oliver', mesinIsi: 'Oliver' };
    case 'OR-14': return { ukuran: '14,5 × 20,25', mesinCover: 'Oliver', mesinIsi: 'Ryobi' };
    case 'PP-14': return { ukuran: '14,5 × 20,25', mesinCover: 'Print Inter', mesinIsi: 'Print' };
    case 'PR-14': return { ukuran: '14,5 × 20,25', mesinCover: 'Print Inter', mesinIsi: 'Ryobi' };
    default: {
      const cfg = SOFT_COVER_CUSTOM_CONFIGS[lini as SoftCoverCustomLini];
      const ukuran = (cfg.ukuran === '10,5 X 14,8' ? '10,5 × 14,8' : '14,5 × 20,25') as SoftCoverUkuran;
      return { ukuran, mesinCover: cfg.defaultMesinCover, mesinIsi: cfg.defaultMesinIsi };
    }
  }
}

export const isCustomLini = (l: SoftCoverLini): l is SoftCoverCustomLini =>
  typeof l === 'string' && l.startsWith('custom-');

export const SOFT_COVER_LINIS_21: SoftCoverLini[] = ['Klasik', 'Oliver-Oliver', 'Print-Oliver', 'Print-Print'];
export const SOFT_COVER_LINIS_14: SoftCoverOffsetComboId[] = ['OO-14', 'OR-14', 'PP-14', 'PR-14'];
export const SOFT_COVER_LINIS_14_CUSTOM: SoftCoverCustomLini[] = SOFT_COVER_CUSTOM_LINIS.filter((l) => l.id.includes('145')).map((l) => l.id);
export const SOFT_COVER_LINIS_105_CUSTOM: SoftCoverCustomLini[] = SOFT_COVER_CUSTOM_LINIS.filter((l) => l.id.includes('105')).map((l) => l.id);

export const SOFT_COVER_LINI_LABEL: Record<SoftCoverLini, string> = {
  'Klasik': 'Klasik Cover Print Inter – Isi Oliver (20–500)',
  'Oliver-Oliver': 'Cover Oliver – Isi Oliver (550–3000)',
  'Print-Oliver': 'Cover Print Inter – Isi Oliver (300–500)',
  'Print-Print': 'Cover Print Inter – Isi Print Buya (20–250)',
  'OO-14': '14,5 Cover Oliver – Isi Oliver (1000–3000)',
  'OR-14': '14,5 Cover Oliver – Isi Ryobi (650–900)',
  'PP-14': '14,5 Cover Print Inter – Isi Print Buya (20–200)',
  'PR-14': '14,5 Cover Print Inter – Isi Ryobi (250–600)',
  'custom-pp145-19': '14,5 Custom Print Inter–Print Buya F19 (20–200)',
  'custom-pr145-19': '14,5 Custom Print Inter–Ryobi F19 (250–600)',
  'custom-oo145-21': '14,5 Custom Oliver–Oliver F21 (1000–3000)',
  'custom-or145-21': '14,5 Custom Oliver–Ryobi F21 (650–900)',
  'custom-pp145-21': '14,5 Custom Print Inter–Print Buya F21 (20–200)',
  'custom-pr145-21': '14,5 Custom Print Inter–Ryobi F21 (250–600)',
  'custom-oo105-24': '10,5 Custom Oliver–Oliver F24 (1500–5000)',
  'custom-po105-24': '10,5 Custom Print Inter–Oliver F24 (700–1000)',
  'custom-pp105-24': '10,5 Custom Print Inter–Print Buya F24 (20–200)',
  'custom-pr105-24': '10,5 Custom Print Inter–Ryobi F24 (250–600)',
};

export type SoftCoverMukaType = '1 Muka' | '2 Muka';
export type SoftCoverWarnaType = '1 Warna' | '2 Warna' | '3 Warna' | '4 Warna';
// Gabungan opsi finishing (klasik: 7 tanpa Glossy+Bending & full-paket; offset: 9).
export type SoftCoverFinishing = OffsetFinishing;
export const SOFT_COVER_FINISHING_9: SoftCoverFinishing[] = [
  'None,', 'UV Varnish,', 'Laminasi Glossy,', 'Laminasi Doff,', 'Lem Bending,',
  'UV Varnish + Bending,', 'Laminasi Glossy + Bending,', 'Laminasi Doff + Bending,',
  'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,',
];
export const SOFT_COVER_FINISHING_7: SoftCoverFinishing[] = [
  'None,', 'UV Varnish,', 'Laminasi Glossy,', 'Laminasi Doff,', 'Lem Bending,',
  'UV Varnish + Bending,', 'Laminasi Doff + Bending,',
];

// Params gabungan = offset (27) + 4 kunci khusus-klasik (plate/min/drek/desain-hlm isi,
// di offset adalah konstanta BUKU per-combo) + 7 kunci khusus-custom (tarif print isi,
// target jasa). Kunci sama-nama dipakai bersama.
export interface SoftCoverUnifiedParams extends OffsetParams {
  tarifDesainIsiPerHlm: number; // klasik: desain isi /hlm (Rp) — 15000
  tarifPlateIsi: number; // klasik: plate isi (Rp/plat) — 45000
  tarifCetakMinIsi: number; // klasik: min isi (Rp) — 90000
  tarifDrekIsi: number; // klasik: drek isi (Rp) — 40
  tarifPrintBuyaIsi: number; // custom BUKU!AR2 konstanta "350" (Rp) — 350
  tarifPrintIsiA3: number; // custom Master!D27 tarif print isi Print Inter — per lini 350/2000/1750
  targetLipat: number; // custom BUKU!BI28 — 10000
  targetSisir: number; // custom BUKU!BJ28 — 1700
  targetSusunKomplit: number; // custom BUKU!BK28 = 500*19 — 9500
  targetKawatRoll: number; // custom BUKU!BL28 = 30000-15% — 25500
  targetStiching: number; // custom BUKU!BM28 — 10000
}

export const DEFAULT_SOFT_COVER_UNIFIED: SoftCoverUnifiedParams = {
  ...DEF_OFFSET,
  tarifDesainIsiPerHlm: 15000,
  tarifPlateIsi: 45000,
  tarifCetakMinIsi: 90000,
  tarifDrekIsi: 40,
  tarifPrintBuyaIsi: 350,
  tarifPrintIsiA3: 2000,
  targetLipat: 10000,
  targetSisir: 1700,
  targetSusunKomplit: 9500,
  targetKawatRoll: 25500,
  targetStiching: 10000,
};

// Default per lini untuk kunci yang nilainya beda antar-file (edit user selalu menang):
// umr 2818585 (klasik) vs 2818850 (offset/custom); insheetCover 5 (klasik) vs per-file;
// insheetIsi, shrink & tarif print-isi-A3 per file (lihat defaultSoftCoverOffsetParams / SOFT_COVER_CUSTOM_CONFIGS).
function liniDefault(lini: SoftCoverLini, key: 'umr' | 'upIsiPct' | 'insheetCover' | 'insheetIsi' | 'tarifShrinkRoll' | 'tarifPrintIsiA3'): number {
  if (lini === 'Klasik') {
    if (key === 'umr') return DEF_KLASIK.umr;
    if (key === 'upIsiPct') return DEF_KLASIK.upIsiPct; // 3 (unified base = 0 offset)
    if (key === 'insheetCover') return DEF_KLASIK.insheetCover; // 5 (unified base = 100 OO)
    return (DEFAULT_SOFT_COVER_UNIFIED as any)[key];
  }
  if (isCustomLini(lini)) {
    const c = SOFT_COVER_CUSTOM_CONFIGS[lini];
    if (key === 'insheetCover') return c.insheetCover;
    if (key === 'insheetIsi') return c.insheetIsi;
    if (key === 'tarifShrinkRoll') return c.shrinkRoll;
    if (key === 'tarifPrintIsiA3') return c.drekIsi;
    return (DEFAULT_SOFT_COVER_UNIFIED as any)[key];
  }
  return (defaultSoftCoverOffsetParams(lini as SoftCoverOffsetComboId) as any)[key]
    ?? (DEFAULT_SOFT_COVER_UNIFIED as any)[key];
}

function resolveParams(lini: SoftCoverLini, raw: SoftCoverUnifiedParams): SoftCoverUnifiedParams {
  const out = { ...raw };
  (['umr', 'upIsiPct', 'insheetCover', 'insheetIsi', 'tarifShrinkRoll', 'tarifPrintIsiA3'] as const).forEach((k) => {
    const v = (raw as any)[k];
    if (v === undefined || v === (DEFAULT_SOFT_COVER_UNIFIED as any)[k]) (out as any)[k] = liniDefault(lini, k);
  });
  return out;
}

export interface SoftCoverFinCustom {
  lipat: boolean; sisir: boolean; susunKomplit: boolean; kawat: boolean; stiching: boolean;
  susunStaples: boolean; biayaStaples: boolean;
}

// Saklar komponen bebas — rumus tiap komponen tetap 1:1 Excel, kombinasinya bebas (persetujuan user).
export interface SoftCoverFeat {
  jasa?: Partial<Record<'lipat' | 'sisir' | 'susun' | 'kawat' | 'stiching' | 'susunStaples' | 'steples', boolean>>;
  spotUVEmboss?: boolean; // khusus Klasik (offset/custom lewat D29)
  shrinkPacking?: boolean; // khusus Klasik
  packingKardus?: boolean; // semua engine (default file: Klasik off, offset/custom on)
}

export function defaultFeat(lini: SoftCoverLini): SoftCoverFeat {
  if (lini === 'Klasik') {
    return { jasa: { susun: true, steples: true }, spotUVEmboss: false, shrinkPacking: false, packingKardus: false };
  }
  if (isCustomLini(lini)) {
    const f = defaultFinCustom(lini);
    return {
      jasa: { lipat: f.lipat, sisir: f.sisir, susun: f.susunKomplit, kawat: f.kawat, stiching: f.stiching, susunStaples: f.susunStaples, steples: f.biayaStaples },
      packingKardus: true,
    };
  }
  const bnbo = (SOFT_COVER_OFFSET_COMBOS[lini as SoftCoverOffsetComboId].jasaModel !== 'UMR5');
  return {
    jasa: bnbo
      ? { lipat: false, sisir: false, susun: false, kawat: false, stiching: false, susunStaples: true, steples: true }
      : { lipat: true, sisir: true, susun: true, kawat: true, stiching: true, susunStaples: false, steples: false },
    packingKardus: true,
  };
}

export function defaultFinCustom(lini: SoftCoverLini): SoftCoverFinCustom {
  const oo = isCustomLini(lini) && SOFT_COVER_CUSTOM_CONFIGS[lini].finOO;
  return { lipat: oo, sisir: oo, susunKomplit: oo, kawat: oo, stiching: oo, susunStaples: !oo, biayaStaples: !oo };
}

export interface SoftCoverUnifiedInput {
  lini: SoftCoverLini;
  oplah: number;
  jumlahHalaman: number;
  mukaCover: SoftCoverMukaType;
  warnaCover: SoftCoverWarnaType;
  warnaIsi: SoftCoverWarnaType;
  finishing: SoftCoverFinishing;
  marginPct: number;
  finCustom?: SoftCoverFinCustom; // legacy (sebelum saklar) — dipetakan ke feat.jasa
  feat?: SoftCoverFeat; // saklar komponen bebas
  mesinCover?: string; // override mesin cover custom (default = file lini); di luar cabang = 0
  mesinIsi?: string; // override mesin isi custom (default = file lini)
}

export interface SoftCoverUnifiedBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface SoftCoverUnifiedResult {
  input: SoftCoverUnifiedInput;
  breakdown: SoftCoverUnifiedBreakdownItem[];
  kebutuhanKertasCover: number;
  kebutuhanCetakCover: number;
  kebutuhanPlanoIsi: number;
  totalHpp: number;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  totalHargaJual: number;
  profitPerPcs: number;
  profitTotal: number;
  marginPct: number;
}

export function softCoverTiers(lini: SoftCoverLini): number[] {
  if (lini === 'Klasik') return TIERS_KLASIK;
  if (isCustomLini(lini)) return SOFT_COVER_CUSTOM_CONFIGS[lini].tiers;
  return SOFT_COVER_OFFSET_COMBOS[lini].tiers;
}

export function softCoverFinishingOptions(lini: SoftCoverLini): SoftCoverFinishing[] {
  return lini === 'Klasik' ? SOFT_COVER_FINISHING_7 : SOFT_COVER_FINISHING_9;
}

const MESIN_CUSTOM = ['SM', 'Oliver', 'Ryobi', 'Print Inter', 'Print Buya'];

export function softCoverMesinCoverOptions(lini: SoftCoverLini): string[] {
  if (!isCustomLini(lini)) return [];
  const cfg = SOFT_COVER_CUSTOM_CONFIGS[lini];
  // 10,5 tak punya cabang Ryobi di O7/P7/V27/W27 (0/0 = tak valid) — sembunyikan.
  return cfg.ukuran === '10,5 X 14,8' ? MESIN_CUSTOM.filter((m) => m !== 'Ryobi') : MESIN_CUSTOM;
}

export function softCoverMesinIsiOptions(): string[] {
  return MESIN_CUSTOM;
}

function customBreakdown(
  r: ReturnType<typeof calcSoftCoverCustomTier>,
  mesinCover: string, mesinIsi: string
): SoftCoverUnifiedBreakdownItem[] {
  const t = r.totalHpp || 1;
  const d = r.dbg;
  const item = (nama: string, nominal: number, keterangan: string): SoftCoverUnifiedBreakdownItem =>
    ({ nama, nominal, pct: nominal / t, keterangan });
  return [
    item('Kertas Cover', r.kertasCover, `${mesinCover}: kebutuhan ${d.R} lembar plano`),
    item('Desain Cover', r.desainCover, 'Biaya desain cover per order'),
    item('Plat + Min Cover', r.platCover + r.ongkosCover, `Ongkos plate ${d.Z} warna + cetak minimal dan lebihan`),
    item('Kertas Isi', r.kertasIsi, `${mesinIsi}: kebutuhan ${d.AP} lembar plano`),
    item('Desain Isi', r.desainIsi, 'Biaya desain isi per lembar'),
    item('Plat + Min Isi', r.platIsi + r.ongkosIsi, `Ongkos plate ${d.AX} keping + cetak minimal dan lebihan`),
    item('Finishing + Kemas', r.finishing, 'Jasa lipat, sisir, susun, laminasi, shrink, dan kardus'),
  ];
}

export function calculateSoftCoverUnified(
  input: SoftCoverUnifiedInput,
  rawParams: SoftCoverUnifiedParams = DEFAULT_SOFT_COVER_UNIFIED
): SoftCoverUnifiedResult {
  const p = resolveParams(input.lini, { ...DEFAULT_SOFT_COVER_UNIFIED, ...(rawParams || {}) });
  if (isCustomLini(input.lini)) {
    const cfg = SOFT_COVER_CUSTOM_CONFIGS[input.lini];
    const leg = input.finCustom;
    const j = input.feat?.jasa ?? (leg ? { lipat: leg.lipat, sisir: leg.sisir, susun: leg.susunKomplit, kawat: leg.kawat, stiching: leg.stiching, susunStaples: leg.susunStaples, steples: leg.biayaStaples } : undefined);
    const fin = { ...defaultFinCustom(input.lini) };
    if (j) {
      const map = { lipat: 'lipat', sisir: 'sisir', susun: 'susunKomplit', kawat: 'kawat', stiching: 'stiching', susunStaples: 'susunStaples', steples: 'biayaStaples' } as const;
      (Object.keys(map) as (keyof typeof map)[]).forEach((k) => {
        const v = (j as any)[k];
        if (v !== undefined) (fin as any)[map[k]] = v;
      });
    }
    const mc = input.mesinCover ?? cfg.defaultMesinCover;
    const mi = input.mesinIsi ?? cfg.defaultMesinIsi;
    const cp: SoftCoverCustomParams = {
      jumlahHalaman: input.jumlahHalaman,
      mukaCover: input.mukaCover === '2 Muka' ? 2 : 1,
      warnaCover: parseInt(input.warnaCover) || 4,
      warnaIsi: parseInt(input.warnaIsi) || 1,
      mesinCover: mc, mesinIsi: mi,
      umr: p.umr, hargaKertasCoverKg: p.tarifKertasCoverKg, hargaKertasIsiKg: p.tarifKertasIsiKg,
      upCoverPct: p.upCoverPct, upIsiPct: p.upIsiPct,
      insheetCover: p.insheetCover, insheetIsi: p.insheetIsi,
      desainCover: p.tarifDesainCover, tarifPrintCover: p.tarifPrintCoverA3,
      tarifPrintBuyaIsi: p.tarifPrintBuyaIsi, drekIsi: p.tarifPrintIsiA3, desainIsiPerHlm: p.tarifDesainIsiPerUnit,
      d29: input.finishing,
      finLipat: fin.lipat, finSisir: fin.sisir, finSusunKomplit: fin.susunKomplit, finKawat: fin.kawat,
      finStiching: fin.stiching, finSusunStaples: fin.susunStaples, finBiayaStaples: fin.biayaStaples,
      targetLipat: p.targetLipat, targetSisir: p.targetSisir, targetSusunKomplit: p.targetSusunKomplit,
      targetKawatRoll: p.targetKawatRoll, targetStiching: p.targetStiching,
      kawatPerRoll: p.tarifKawatRoll, staplesPerPack: p.tarifSteplesPack,
      tintaSpotUVkg: p.tarifTintaSpotUV, plastikShrinkRoll: p.tarifShrinkRoll,
      lakbanRoll: p.tarifLakbanRoll, kardus: p.tarifKardusBox, royalty: p.tarifRoyalti,
      labaPct: p.marginDefaultPct, // custom: laba E37, bukan margin input
      packingKardus: input.feat?.packingKardus ?? true,
    };
    const r = calcSoftCoverCustomTier(cfg, cp, input.oplah);
    const profitPerPcs = r.hargaJualPerPcs - r.hppPerPcs;
    return {
      input,
      breakdown: customBreakdown(r, mc, mi),
      kebutuhanKertasCover: r.dbg.R,
      kebutuhanCetakCover: r.dbg.Q,
      kebutuhanPlanoIsi: r.dbg.AP,
      totalHpp: r.totalHpp,
      hppPerPcs: r.hppPerPcs,
      hargaJualPerPcs: r.hargaJualPerPcs,
      totalHargaJual: r.hargaJualPerPcs * input.oplah,
      profitPerPcs,
      profitTotal: profitPerPcs * input.oplah,
      marginPct: p.marginDefaultPct,
    };
  }
  if (input.lini === 'Klasik') {
    const kp: KlasikParams = {
      insheetCover: p.insheetCover,
      tarifDesainCover: p.tarifDesainCover,
      tarifPrintCoverA3: p.tarifPrintCoverA3,
      tarifKertasIsiKg: p.tarifKertasIsiKg,
      upIsiPct: p.upIsiPct,
      gramaturIsi: p.gramaturIsi,
      insheetIsi: p.insheetIsi,
      tarifDesainIsiPerHlm: p.tarifDesainIsiPerHlm,
      tarifPlateIsi: p.tarifPlateIsi,
      tarifCetakMinIsi: p.tarifCetakMinIsi,
      tarifDrekIsi: p.tarifDrekIsi,
      tarifRoyalti: p.tarifRoyalti,
      tarifSteplesPack: p.tarifSteplesPack,
      umr: p.umr,
      tarifSisirPerPcs: p.tarifSisirPerPcs,
      tarifBending: p.tarifBending,
      minBending: p.minBending,
      tarifLaminasiGlossy: p.tarifLaminasiGlossy,
      tarifLaminasiDoff: p.tarifLaminasiDoff,
      tarifUvVarnish: p.tarifUvVarnish,
      tarifTintaSpotUV: p.tarifTintaSpotUV,
      minFinishing: p.minFinishing,
      marginDefaultPct: p.marginDefaultPct,
      tarifShrinkRoll: p.tarifShrinkRoll,
      tarifLakbanRoll: p.tarifLakbanRoll,
      tarifKardusBox: p.tarifKardusBox,
    };
    const f = input.feat ?? {};
    const r = calcKlasik(
      {
        oplah: input.oplah,
        varian: '21 x 29,7 cm',
        jumlahHalaman: input.jumlahHalaman,
        mukaCover: input.mukaCover,
        warnaCover: input.warnaCover,
        warnaIsi: input.warnaIsi,
        finishing: input.finishing as KlasikFinishing,
        marginPct: input.marginPct,
        feat: {
          jasaSusun: f.jasa?.susun ?? true,
          jasaSteples: f.jasa?.steples ?? true,
          spotUVEmboss: f.spotUVEmboss ?? false,
          shrinkPacking: f.shrinkPacking ?? false,
          packingKardus: f.packingKardus ?? false,
        },
      },
      kp
    );
    return {
      input,
      breakdown: r.breakdown,
      kebutuhanKertasCover: r.kebutuhanKertasCover,
      kebutuhanCetakCover: r.kebutuhanCetakCover,
      kebutuhanPlanoIsi: r.kebutuhanPlanoIsi,
      totalHpp: r.totalHpp,
      hppPerPcs: r.hppPerPcs,
      hargaJualPerPcs: r.hargaJualPerPcs,
      totalHargaJual: r.totalHargaJual,
      profitPerPcs: r.profitPerPcs,
      profitTotal: r.profitTotal,
      marginPct: r.marginPct,
    };
  }
  const f = input.feat ?? {};
  const r = calcOffset(
    {
      oplah: input.oplah,
      jumlahHalaman: input.jumlahHalaman,
      mukaCover: input.mukaCover,
      warnaCover: input.warnaCover,
      warnaIsi: input.warnaIsi,
      finishing: input.finishing,
      marginPct: input.marginPct,
      feat: {
        jasaLipat: f.jasa?.lipat,
        jasaSisir: f.jasa?.sisir,
        jasaSusun: f.jasa?.susun,
        jasaKawat: f.jasa?.kawat,
        jasaStiching: f.jasa?.stiching,
        jasaSusunStaples: f.jasa?.susunStaples,
        jasaSteples: f.jasa?.steples,
        packingKardus: f.packingKardus,
      },
    },
    p,
    input.lini as SoftCoverOffsetComboId
  );
  return {
    input,
    breakdown: r.breakdown,
    kebutuhanKertasCover: r.kebutuhanKertasCover,
    kebutuhanCetakCover: r.kebutuhanCetakCover,
    kebutuhanPlanoIsi: r.kebutuhanPlanoIsi,
    totalHpp: r.totalHpp,
    hppPerPcs: r.hppPerPcs,
    hargaJualPerPcs: r.hargaJualPerPcs,
    totalHargaJual: r.totalHargaJual,
    profitPerPcs: r.profitPerPcs,
    profitTotal: r.profitTotal,
    marginPct: r.marginPct,
  };
}

export type SavedSoftCoverUnifiedItem = {
  id: string;
  title: string;
  savedAt: string;
  data: SoftCoverUnifiedResult;
  paramsSnapshot?: SoftCoverUnifiedParams;
};
