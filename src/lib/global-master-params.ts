// ponytail: definisi dan utilitas sinkronisasi Master Parameter Global untuk seluruh jenis produk

import { SimulatorMasterParams, DEFAULT_MASTER_PARAMS, DEFAULT_MASTER_PARAMS_KLEM } from './pricelist-simulator';
import { ManasikMasterParams, DEFAULT_MANASIK_PARAMS } from './manasik-calculator';
import { YasinMasterParams, DEFAULT_YASIN_PARAMS } from './yasin-calculator';
import { NotaMasterParams, DEFAULT_NOTA_PARAMS } from './nota-calculator';
import { BrosurMasterParams, DEFAULT_BROSUR_PARAMS } from './brosur-calculator';
import { LabelKhqMasterParams, DEFAULT_LABEL_KHQ_PARAMS } from './label-khq-calculator';
import { BukuTulisMasterParams, DEFAULT_BUKU_TULIS_PARAMS } from './buku-tulis-calculator';
import { StopmapMasterParams, DEFAULT_STOPMAP_PARAMS } from './stopmap-calculator';
import { SyahadahMasterParams, DEFAULT_SYAHADAH_PARAMS } from './syahadah-calculator';

export interface GlobalMasterParams {
  // 1. Mesin Cetak Offset Oliver (58 / 52)
  oliverPlatUnit: number;        // Rp 45.000 / plat (Kalender, Manasik, Brosur)
  oliverMinOngkos: number;       // Rp 90.000 (min 1000 drek) (Kalender, Manasik, Brosur)
  oliverDrekOver: number;        // Rp 40 / drek (Kalender, Manasik, Brosur)
  oliverTransport: number;       // Rp 100.000 (Kalender)

  // 2. Kertas Dasar & Bahan Baku
  tarifHvs70: number;            // Rp 15.700 / kg (Kalender, Nota)
  tarifAp120: number;            // Rp 17.400 / kg (Kalender, Brosur dasar)
  tarifAp150: number;            // Rp 17.400 / kg (Kalender)
  tarifAc230Kg: number;          // Rp 15.100 / kg (Manasik, Yasin cover)
  tarifAc260Kg: number;          // Rp 15.500 / kg (Manasik)
  upKertasPct: number;           // 5% margin/ppn kertas dasar

  // 3. Mesin Print Digital POD A3+
  tarifPrintA3: number;          // Rp 2.500 / lembar A3+ (Manasik cover, Yasin cover)
  tarifPrintInter1Muka: number;  // Rp 1.800 / lembar A3+ (Brosur 1 muka)
  tarifPrintInter2Muka: number;  // Rp 3.300 / lembar A3+ (Brosur 2 muka)

  // 4. Tarif Laminasi
  tarifLaminasiGlossyCm2: number; // Rp 0.35 / cm² (Manasik, Yasin, Brosur)
  tarifLaminasiDoffCm2: number;   // Rp 0.40 / cm² (Manasik, Yasin, Brosur)
  tarifUvVarnishCm2: number;      // Rp 0.11 / cm² (Manasik, Brosur)
  minLaminasi: number;            // Rp 50.000 (Manasik, Yasin)

  // 5. Finishing & Kemasan Standar
  tarifKardusBox: number;         // Rp 8.500 / box (Manasik, Brosur)
  tarifLakbanRoll: number;        // Rp 8.000 / roll (Kalender, Brosur)
  tarifPlastikOppPcs: number;     // Rp 92 / pcs (Manasik, Yasin)
  tarifSisirPcs: number;          // Rp 150 / pcs (Manasik, Yasin)
  tarifStaplesPcs: number;        // Rp 100 / pcs (Manasik, Yasin)
}

export const DEFAULT_GLOBAL_PARAMS: GlobalMasterParams = {
  oliverPlatUnit: 45000,
  oliverMinOngkos: 90000,
  oliverDrekOver: 40,
  oliverTransport: 100000,

  tarifHvs70: 15700,
  tarifAp120: 17400,
  tarifAp150: 17400,
  tarifAc230Kg: 15100,
  tarifAc260Kg: 15500,
  upKertasPct: 5,

  tarifPrintA3: 2500,
  tarifPrintInter1Muka: 1800,
  tarifPrintInter2Muka: 3300,

  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  tarifUvVarnishCm2: 0.11,
  minLaminasi: 50000,

  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,
  tarifPlastikOppPcs: 92,
  tarifSisirPcs: 150,
  tarifStaplesPcs: 100,
};

/**
 * Menyebarkan (propagate) nilai parameter global ke seluruh state parameter masing-masing produk
 */
export function applyGlobalParamsToAll(
  g: GlobalMasterParams,
  currSpiral: SimulatorMasterParams,
  currKlem: SimulatorMasterParams,
  currManasik: ManasikMasterParams,
  currYasin: YasinMasterParams,
  currNota: NotaMasterParams,
  currBrosur: BrosurMasterParams,
  currLabelKhq: LabelKhqMasterParams,
  currBukuTulis: BukuTulisMasterParams = DEFAULT_BUKU_TULIS_PARAMS,
  currStopmap: StopmapMasterParams = DEFAULT_STOPMAP_PARAMS,
  currSyahadah: SyahadahMasterParams = DEFAULT_SYAHADAH_PARAMS
) {
  const nextSpiral: SimulatorMasterParams = {
    ...currSpiral,
    oliverPlatUnit: g.oliverPlatUnit,
    oliverMinOngkos: g.oliverMinOngkos,
    oliverDrekOver: g.oliverDrekOver,
    oliverTransport: g.oliverTransport,
    tarifHvs70: g.tarifHvs70,
    tarifAp120: g.tarifAp120,
    tarifAp150: g.tarifAp150,
    ppnMarginKertas: 1 + g.upKertasPct / 100,
    ppnHvs70: 1 + g.upKertasPct / 100,
    ppnAp120: 1 + g.upKertasPct / 100,
    ppnAp150: 1 + g.upKertasPct / 100,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  const nextKlem: SimulatorMasterParams = {
    ...currKlem,
    oliverPlatUnit: g.oliverPlatUnit,
    oliverMinOngkos: g.oliverMinOngkos,
    oliverDrekOver: g.oliverDrekOver,
    oliverTransport: g.oliverTransport,
    tarifHvs70: g.tarifHvs70,
    tarifAp120: g.tarifAp120,
    tarifAp150: g.tarifAp150,
    ppnMarginKertas: 1 + g.upKertasPct / 100,
    ppnHvs70: 1 + g.upKertasPct / 100,
    ppnAp120: 1 + g.upKertasPct / 100,
    ppnAp150: 1 + g.upKertasPct / 100,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  const nextManasik: ManasikMasterParams = {
    ...currManasik,
    tarifAc230Kg: g.tarifAc230Kg,
    tarifAc260Kg: g.tarifAc260Kg,
    tarifPrintCoverA3: g.tarifPrintA3,
    oliverMinOngkosCover: g.oliverMinOngkos,
    oliverPlatUnitCover: g.oliverPlatUnit,
    oliverDrekOverCover: g.oliverDrekOver,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    tarifUvVarnishCm2: g.tarifUvVarnishCm2,
    minLaminasi: g.minLaminasi,
    tarifSisir: g.tarifSisirPcs,
    tarifStaplesPalu: g.tarifStaplesPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifPlastikOppPack: Math.round(g.tarifPlastikOppPcs * 100),
  };

  const nextYasin: YasinMasterParams = {
    ...currYasin,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    minLaminasi: g.minLaminasi,
    tarifPlastikOppYasin: Math.round(g.tarifPlastikOppPcs),
    tarifSisirYasin: g.tarifSisirPcs,
    tarifStaplesYasin: Math.round(g.tarifStaplesPcs / 2),
  };

  const nextNota: NotaMasterParams = {
    ...currNota,
    tarifHvs70Kg: g.tarifHvs70,
    upHvsPct: g.upKertasPct,
    upNcrPct: g.upKertasPct,
  };

  const nextBrosur: BrosurMasterParams = {
    ...currBrosur,
    tarifArtPaperKg: g.tarifAp120,
    upKertasPct: g.upKertasPct,
    tarifPrintInter1Muka: g.tarifPrintInter1Muka,
    tarifPrintInter2Muka: g.tarifPrintInter2Muka,
    tarifPlatOliver: g.oliverPlatUnit,
    minOrderOliver: g.oliverMinOngkos,
    tarifDrekOliver: g.oliverDrekOver,
    tarifKardus: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossy: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoff: g.tarifLaminasiDoffCm2,
    tarifUvVarnish: g.tarifUvVarnishCm2,
  };

  const nextLabelKhq: LabelKhqMasterParams = {
    ...currLabelKhq,
    tarifPrintA3: g.tarifPrintA3,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    minLaminasi: g.minLaminasi,
  };

  const nextBukuTulis: BukuTulisMasterParams = {
    ...currBukuTulis,
    tarifArtCarton230Kg: g.tarifAc230Kg,
    tarifHvs70Kg: g.tarifHvs70,
    upArtCartonPct: g.upKertasPct,
    upHvsPct: g.upKertasPct,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifPrintIsiA3: g.tarifPrintA3,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    minLaminasi: g.minLaminasi,
    tarifSisirPerPcs: g.tarifSisirPcs,
    tarifStaplesPerPcs: g.tarifStaplesPcs,
    tarifPackingKardus: g.tarifKardusBox,
    tarifLakbanPerOrder: g.tarifLakbanRoll,
  };

  const nextStopmap: StopmapMasterParams = {
    ...currStopmap,
    tarifArtCarton230Kg: g.tarifAc230Kg,
    upArtCartonPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    minLaminasi: g.minLaminasi,
    tarifSisirPerPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  const nextSyahadah: SyahadahMasterParams = {
    ...currSyahadah,
    tarifKertasLinenKg: g.tarifAc260Kg,
    upKertasPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    tarifRyobi: g.tarifPrintInter1Muka,
    tarifPlatOliver: g.oliverPlatUnit,
    minOliver: g.oliverMinOngkos,
    drekOliver: g.oliverDrekOver,
    tarifSisirPerPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  return {
    nextSpiral,
    nextKlem,
    nextManasik,
    nextYasin,
    nextNota,
    nextBrosur,
    nextLabelKhq,
    nextBukuTulis,
    nextStopmap,
    nextSyahadah,
  };
}
