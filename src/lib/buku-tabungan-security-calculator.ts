// Buku Tabungan Security 9 x 14,5 cm — LAPISAN ALIAS 1:1 ke kalkulator NS.
// PROVENANCE (POS 1 audit 2026-09-22, skrip bedah-tabsec-pos1*.py):
//   Sumber: 15. Pricelist Buku Tabungan Security/Source/
//     - BUKU TABUNGAN 9 x 14,5 cm - Security Ryobi.xlsm (tier 250-1500, isi Ryobi)
//     - BUKU TABUNGAN 9 x 14,5 cm - Security.xlsm (tier 50-200, isi Print Buya)
//   HASIL BEDAH: engine BUKU Security IDENTIK dengan 14. Pricelist Buku Tabungan Non Security:
//     - 12 dropdown Master + 1 DV BUKU (BJ26/BL26/BM26/BQ26/DA28) sama persis
//       (D16 Cover: Print Inter, Ryobi, Oliver, SM; D25 Isi: +Print Buya; D29 9 finishing)
//     - Sel manual sama (D6 24, D8 2818585, D12 16400, D13 15/10, D17 15000/10000,
//       D18 3500, D22 15700, D23 30/10, D25 Ryobi/Print Buya, D26 1500, D27 2000,
//       D30-D36, E37 laba 30); sel mati sama (V30 kosong, AU6=0, M26 tanpa referensi)
//     - Rumus ROW2/4/5/6/7, tabel acuan ROW26-35, dan DC7
//       (=T7+V7+Y7+AG7+AR7+AT7+AW7+BD7+BF7+BH7+BI7+BQ7+CC7+CG7+CJ7+CM7+CO7+CP7+CQ7
//        +BP7+DA7+CW7+CA7+BW7+BN7+BM7+BL7+BJ7, quirk triple-count Pound) sama persis
//     - Nilai tersimpan tier-per-tier IDENTIK sampai sen
//       (Ryobi 1000: DC 2758605.57/DI 3590; Kecil 100: DC 695258.48/DI 9040)
//   - TIDAK ADA kolom Foil/Numbering di Excel mana pun: tarif karangan SINTAK lama
//     (tarifSecurityPerPcs, tarifNumberingPerPcs 350, "Foil Emas", "Ivory Security")
//     DIHAPUS demi paritas 1:1 (keputusan user 2026-09-22).
//   - Keputusan STOP&ASK reuse NS: insheet 15/30, desain 15000, mesin isi Otomatis
//     (<250 Print Buya, >=250 Ryobi), toggle Pisau Pound + Kardus aktif.
// Binding 1:1 (// BUKU!xxx) lives in buku-tabungan-ns-calculator.ts; duplikasi
// dilarang agar tidak drift — lapisan ini hanya alias nama Security.

import {
  calculateBukuTabunganNsHpp,
  DEFAULT_BUKU_TABUNGAN_NS_PARAMS,
  BUKU_TABUNGAN_NS_TIERS,
  TABUNGAN_NS_MESIN_COVER,
  TABUNGAN_NS_MESIN_ISI,
  TABUNGAN_NS_FINISHING,
  TABUNGAN_NS_GRAMATUR_COVER,
  TABUNGAN_NS_GRAMATUR_ISI,
} from './buku-tabungan-ns-calculator';
import type {
  BukuTabunganNsMasterParams,
  BukuTabunganNsSimulatorInput,
  BukuTabunganNsSimulatorResult,
  BukuTabunganNsBreakdownItem,
  TabunganNsMesinCover,
  TabunganNsMesinIsi,
  TabunganNsFinishing,
} from './buku-tabungan-ns-calculator';

export { resolveMesinCover, resolveMesinIsi } from './buku-tabungan-ns-calculator';

export type BukuTabunganSecurityMasterParams = BukuTabunganNsMasterParams;
export const DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS: BukuTabunganSecurityMasterParams =
  DEFAULT_BUKU_TABUNGAN_NS_PARAMS;

export type TabunganSecurityMesinCover = TabunganNsMesinCover;
export type TabunganSecurityMesinIsi = TabunganNsMesinIsi;
export type TabunganSecurityFinishing = TabunganNsFinishing;
export const TABUNGAN_SECURITY_MESIN_COVER = TABUNGAN_NS_MESIN_COVER;
export const TABUNGAN_SECURITY_MESIN_ISI = TABUNGAN_NS_MESIN_ISI;
export const TABUNGAN_SECURITY_FINISHING = TABUNGAN_NS_FINISHING;
export const TABUNGAN_SECURITY_GRAMATUR_COVER = TABUNGAN_NS_GRAMATUR_COVER;
export const TABUNGAN_SECURITY_GRAMATUR_ISI = TABUNGAN_NS_GRAMATUR_ISI;
export const TABUNGAN_SECURITY_BAHAN_COVER = [
  'HVS', 'Imperial', 'Book Paper', 'Art Paper', 'Art Carton', 'Duplex', 'Vp', 'Ivory',
];
export const TABUNGAN_SECURITY_BAHAN_ISI = ['HVS', 'Imperial', 'Book Paper', 'Art Paper', 'QPP'];

// Union tier kedua file Security (kecil 50-200, besar 250-1500)
export const BUKU_TABUNGAN_SECURITY_TIERS: number[] = BUKU_TABUNGAN_NS_TIERS;

export type BukuTabunganSecuritySimulatorInput = BukuTabunganNsSimulatorInput;
export type BukuTabunganSecuritySimulatorResult = BukuTabunganNsSimulatorResult;
export type BukuTabunganSecurityBreakdownItem = BukuTabunganNsBreakdownItem;

export function calculateBukuTabunganSecurityHpp(
  input: BukuTabunganSecuritySimulatorInput,
  rawParams: BukuTabunganSecurityMasterParams = DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS
): BukuTabunganSecuritySimulatorResult {
  return calculateBukuTabunganNsHpp(input, rawParams);
}

export type SavedBukuTabunganSecuritySimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: BukuTabunganSecuritySimulatorResult;
  paramsSnapshot?: BukuTabunganSecurityMasterParams;
};
