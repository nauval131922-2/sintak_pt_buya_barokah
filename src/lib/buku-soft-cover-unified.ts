// Dispatcher unifikasi "1 Buku Soft Cover" — 3 folder sumber, 8 lini, 2 generasi engine.
// Sumber:
//  (A) 17. Pricelist Buku Soft Cover/Source/Pricelist Buku Soft Cover 21 x 29,7.xlsm
//      → lini 'Klasik' (engine CX: ./buku-soft-cover-calculator, tier 20–500, finishing 7 opsi)
//  (B) 17. Pricelist Buku Soft Cover - 21 x 29,7 cm/Source/BUKU UK. 21 x 29,7 - *.xlsm (3 file)
//      → lini 'Oliver-Oliver' | 'Print-Oliver' | 'Print-Print' (engine DC offset)
//  (C) 18. Pricelist Buku Soft Cover - 14,5 x 20,25 cm/Source/BUKU UK. 14,5 x 20,25 - *.xlsm (4 file)
//      → lini 'OO-14' | 'OR-14' | 'PP-14' | 'PR-14' (engine DC offset)
// Tiap lini terkunci ke filenya (mesin/ukuran tak bisa dipilih bebas — di luar itu Excel #DIV/0!).
// Pemilih di UI: satu dropdown lini (8 opsi, dikelompokkan per ukuran).

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

export type SoftCoverLini =
  | 'Klasik'
  | SoftCoverOffsetComboId;

export const SOFT_COVER_LINIS_21: SoftCoverLini[] = ['Klasik', 'Oliver-Oliver', 'Print-Oliver', 'Print-Print'];
export const SOFT_COVER_LINIS_14: SoftCoverOffsetComboId[] = ['OO-14', 'OR-14', 'PP-14', 'PR-14'];

export const SOFT_COVER_LINI_LABEL: Record<SoftCoverLini, string> = {
  'Klasik': 'Klasik PI–Oliver (20–500)',
  'Oliver-Oliver': 'Cover Oliver – Isi Oliver (550–3000)',
  'Print-Oliver': 'Cover Print – Isi Oliver (300–500)',
  'Print-Print': 'Cover Print – Isi Print (20–250)',
  'OO-14': '14,5 Cover Oliver – Isi Oliver (1000–3000)',
  'OR-14': '14,5 Cover Oliver – Isi Ryobi (650–900)',
  'PP-14': '14,5 Cover Print – Isi Print (20–200)',
  'PR-14': '14,5 Cover Print – Isi Ryobi (250–600)',
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
// di offset adalah konstanta BUKU per-combo). Kunci sama-nama dipakai bersama.
export interface SoftCoverUnifiedParams extends OffsetParams {
  tarifDesainIsiPerHlm: number; // klasik: desain isi /hlm (Rp) — 15000
  tarifPlateIsi: number; // klasik: plate isi (Rp/plat) — 45000
  tarifCetakMinIsi: number; // klasik: min isi (Rp) — 90000
  tarifDrekIsi: number; // klasik: drek isi (Rp) — 40
}

export const DEFAULT_SOFT_COVER_UNIFIED: SoftCoverUnifiedParams = {
  ...DEF_OFFSET,
  tarifDesainIsiPerHlm: 15000,
  tarifPlateIsi: 45000,
  tarifCetakMinIsi: 90000,
  tarifDrekIsi: 40,
};

// Default per lini untuk kunci yang nilainya beda antar-file (edit user selalu menang):
// umr 2818585 (klasik) vs 2818850 (offset); insheetCover 5 (klasik) vs per-file offset;
// insheetIsi & shrink per file offset (lihat defaultSoftCoverOffsetParams).
function liniDefault(lini: SoftCoverLini, key: 'umr' | 'upIsiPct' | 'insheetCover' | 'insheetIsi' | 'tarifShrinkRoll'): number {
  if (lini === 'Klasik') {
    if (key === 'umr') return DEF_KLASIK.umr;
    if (key === 'upIsiPct') return DEF_KLASIK.upIsiPct; // 3 (unified base = 0 offset)
    if (key === 'insheetCover') return DEF_KLASIK.insheetCover; // 5 (unified base = 100 OO)
    return (DEFAULT_SOFT_COVER_UNIFIED as any)[key];
  }
  return (defaultSoftCoverOffsetParams(lini as SoftCoverOffsetComboId) as any)[key]
    ?? (DEFAULT_SOFT_COVER_UNIFIED as any)[key];
}

function resolveParams(lini: SoftCoverLini, raw: SoftCoverUnifiedParams): SoftCoverUnifiedParams {
  const out = { ...raw };
  (['umr', 'upIsiPct', 'insheetCover', 'insheetIsi', 'tarifShrinkRoll'] as const).forEach((k) => {
    const v = (raw as any)[k];
    if (v === undefined || v === (DEFAULT_SOFT_COVER_UNIFIED as any)[k]) (out as any)[k] = liniDefault(lini, k);
  });
  return out;
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
  return SOFT_COVER_OFFSET_COMBOS[lini].tiers;
}

export function softCoverFinishingOptions(lini: SoftCoverLini): SoftCoverFinishing[] {
  return lini === 'Klasik' ? SOFT_COVER_FINISHING_7 : SOFT_COVER_FINISHING_9;
}

export function calculateSoftCoverUnified(
  input: SoftCoverUnifiedInput,
  rawParams: SoftCoverUnifiedParams = DEFAULT_SOFT_COVER_UNIFIED
): SoftCoverUnifiedResult {
  const p = resolveParams(input.lini, { ...DEFAULT_SOFT_COVER_UNIFIED, ...(rawParams || {}) });
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
      minFinishing: p.minFinishing,
      marginDefaultPct: p.marginDefaultPct,
    };
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
  const r = calcOffset(
    {
      oplah: input.oplah,
      jumlahHalaman: input.jumlahHalaman,
      mukaCover: input.mukaCover,
      warnaCover: input.warnaCover,
      warnaIsi: input.warnaIsi,
      finishing: input.finishing,
      marginPct: input.marginPct,
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
