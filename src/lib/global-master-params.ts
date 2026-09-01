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
import { RaportKalebMasterParams, DEFAULT_RAPORT_KALEB_PARAMS } from './raport-kaleb-calculator';
import { KopSuratMasterParams, DEFAULT_KOP_SURAT_PARAMS } from './kop-surat-calculator';
import { AmplopMasterParams, DEFAULT_AMPLOP_PARAMS } from './amplop-calculator';
import { SertifikatMasterParams, DEFAULT_SERTIFIKAT_PARAMS } from './sertifikat-calculator';
import { UndanganMasterParams, DEFAULT_UNDANGAN_PARAMS } from './undangan-calculator';
import { BukuTabunganNsMasterParams, DEFAULT_BUKU_TABUNGAN_NS_PARAMS } from './buku-tabungan-ns-calculator';
import { BukuTabunganSecurityMasterParams, DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS } from './buku-tabungan-security-calculator';
import { KartuKoperasiPromiseMasterParams, DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS } from './kartu-koperasi-promise-calculator';
import { LebelKartuObatMasterParams, DEFAULT_LEBEL_KARTU_OBAT_PARAMS } from './lebel-kartu-obat-calculator';
import { BukuSoftCoverMasterParams, DEFAULT_BUKU_SOFT_COVER_PARAMS } from './buku-soft-cover-calculator';
import { BukuSoftCover145x2025MasterParams, DEFAULT_BUKU_SOFT_COVER_145X2025_PARAMS } from './buku-soft-cover-145x2025-calculator';
import { BukuHardCover105x148MasterParams, DEFAULT_BUKU_HARD_COVER_105X148_PARAMS } from './buku-hard-cover-105x148-calculator';
import { PosterMasterParams, DEFAULT_POSTER_PARAMS } from './poster-calculator';
import { MajalahMasterParams, DEFAULT_MAJALAH_PARAMS } from './majalah-calculator';

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
  currSyahadah: SyahadahMasterParams = DEFAULT_SYAHADAH_PARAMS,
  currRaportKaleb: RaportKalebMasterParams = DEFAULT_RAPORT_KALEB_PARAMS,
  currKopSurat: KopSuratMasterParams = DEFAULT_KOP_SURAT_PARAMS,
  currAmplop: AmplopMasterParams = DEFAULT_AMPLOP_PARAMS,
  currSertifikat: SertifikatMasterParams = DEFAULT_SERTIFIKAT_PARAMS,
  currUndangan: UndanganMasterParams = DEFAULT_UNDANGAN_PARAMS,
  currBukuTabunganNs: BukuTabunganNsMasterParams = DEFAULT_BUKU_TABUNGAN_NS_PARAMS,
  currBukuTabunganSecurity: BukuTabunganSecurityMasterParams = DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS,
  currKartuKoperasiPromise: KartuKoperasiPromiseMasterParams = DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS,
  currLebelKartuObat: LebelKartuObatMasterParams = DEFAULT_LEBEL_KARTU_OBAT_PARAMS,
  currBukuSoftCover: BukuSoftCoverMasterParams = DEFAULT_BUKU_SOFT_COVER_PARAMS,
  currBukuSoftCover145x2025: BukuSoftCover145x2025MasterParams = DEFAULT_BUKU_SOFT_COVER_145X2025_PARAMS,
  currBukuHardCover105x148: BukuHardCover105x148MasterParams = DEFAULT_BUKU_HARD_COVER_105X148_PARAMS,
  currPoster: PosterMasterParams = DEFAULT_POSTER_PARAMS,
  currMajalah: MajalahMasterParams = DEFAULT_MAJALAH_PARAMS
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

  const nextRaportKaleb: RaportKalebMasterParams = {
    ...currRaportKaleb,
    tarifKertasKalebKg: g.tarifAc230Kg,
    upKertasPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    tarifFoilPerPcs: 450,
    tarifSisir: g.tarifSisirPcs,
    tarifKardus: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  const nextKopSurat: KopSuratMasterParams = {
    ...currKopSurat,
    tarifKertasHvsKg: g.tarifHvs70,
    upKertasPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    tarifRyobi: g.tarifPrintInter1Muka,
    tarifPlatOliver: g.oliverPlatUnit,
    minOliver: g.oliverMinOngkos,
    drekOliver: g.oliverDrekOver,
    tarifPotongPerPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  const nextAmplop: AmplopMasterParams = {
    ...currAmplop,
    tarifKertasHvsKg: g.tarifHvs70,
    upKertasPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    tarifRyobi: g.tarifPrintInter1Muka,
    tarifPlatOliver: g.oliverPlatUnit,
    minOliver: g.oliverMinOngkos,
    drekOliver: g.oliverDrekOver,
    tarifLipatLemPerPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  const nextSertifikat: SertifikatMasterParams = {
    ...currSertifikat,
    tarifKertasArtCartonKg: g.tarifAc260Kg,
    tarifKertasIvoryKg: g.tarifAc260Kg,
    upKertasPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    tarifPlatOliver: g.oliverPlatUnit,
    minOliver: g.oliverMinOngkos,
    drekOliver: g.oliverDrekOver,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    minLaminasi: g.minLaminasi,
    tarifPotongPerPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  const nextUndangan: UndanganMasterParams = {
    ...currUndangan,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    upKertasPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    tarifPlatOliver: g.oliverPlatUnit,
    minOliver: g.oliverMinOngkos,
    drekOliver: g.oliverDrekOver,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    minLaminasi: g.minLaminasi,
    tarifSisirPerPcs: g.tarifSisirPcs,
    tarifPlastikOppPerPcs: g.tarifPlastikOppPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  const nextBukuTabunganNs: BukuTabunganNsMasterParams = {
    ...currBukuTabunganNs,
    tarifKertasCoverKg: g.tarifAc260Kg,
    upKertasCoverPct: g.upKertasPct,
    tarifKertasIsiKg: g.tarifHvs70,
    upKertasIsiPct: g.upKertasPct,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifPrintIsiA3: g.tarifPrintInter1Muka,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    minLaminasi: g.minLaminasi,
    tarifSusunLipatPerPcs: g.tarifSisirPcs,
    tarifJahitPerPcs: g.tarifStaplesPcs * 5,
    tarifPoundPerPcs: g.tarifSisirPcs * 2,
    tarifPlastikSringPerPcs: g.tarifPlastikOppPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  const nextBukuTabunganSecurity: BukuTabunganSecurityMasterParams = {
    ...currBukuTabunganSecurity,
    tarifKertasCoverKg: g.tarifAc260Kg,
    upKertasCoverPct: g.upKertasPct,
    tarifKertasIsiKg: g.tarifHvs70,
    upKertasIsiPct: g.upKertasPct,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifPrintIsiA3: g.tarifPrintInter1Muka,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    minLaminasi: g.minLaminasi,
    tarifSusunLipatPerPcs: g.tarifSisirPcs,
    tarifJahitPerPcs: g.tarifStaplesPcs * 5,
    tarifPoundPerPcs: g.tarifSisirPcs * 2,
    tarifPlastikSringPerPcs: g.tarifPlastikOppPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  const nextKartuKoperasiPromise: KartuKoperasiPromiseMasterParams = {
    ...currKartuKoperasiPromise,
    tarifKertasKg: g.tarifAc260Kg,
    upKertasPct: g.upKertasPct,
    tarifDesign: g.tarifPrintA3 * 6,
    tarifPlatePerPlat: g.oliverPlatUnit,
    tarifCetakMinPerPlat: g.oliverMinOngkos,
    tarifDrek: g.oliverDrekOver,
    tarifPoundPerUnit: g.tarifSisirPcs * 0.94,
    tarifSisirPer500: g.tarifSisirPcs * 66,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  const nextLebelKartuObat: LebelKartuObatMasterParams = {
    ...currLebelKartuObat,
    tarifKertasKg: g.tarifHvs70,
    upKertasPct: g.upKertasPct,
    tarifDesain: g.tarifPrintA3 * 4,
    tarifPlatePerPlat: g.oliverPlatUnit,
    tarifCetakMinPerPlat: g.oliverMinOngkos,
    tarifDrek: g.oliverDrekOver,
    tarifSisirPer500: g.tarifSisirPcs * 66,
  };

  const nextBukuSoftCover: BukuSoftCoverMasterParams = {
    ...currBukuSoftCover,
    tarifKertasHvs70Kg: g.tarifHvs70,
    upKertasIsiPct: g.upKertasPct,
    tarifOliverPlatUnit: g.oliverPlatUnit,
    tarifOliverMinIsi: g.oliverMinOngkos,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    tarifUvVarnishCm2: g.tarifUvVarnishCm2,
    minLaminasi: g.minLaminasi,
    tarifSisirPerPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  const nextBukuSoftCover145x2025: BukuSoftCover145x2025MasterParams = {
    ...currBukuSoftCover145x2025,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    tarifPlateCoverOliver: g.oliverPlatUnit,
    minOngkosCoverOliver: g.oliverMinOngkos,
    drekCoverOliver: g.oliverDrekOver,
    tarifKertasHvs70Kg: g.tarifHvs70,
    tarifPlateIsiOliver: g.oliverPlatUnit,
    minOngkosIsiOliver: g.oliverMinOngkos,
    drekIsiOliver: g.oliverDrekOver,
    tarifSisirPerPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    tarifUvVarnishCm2: g.tarifUvVarnishCm2,
    minLaminasi: g.minLaminasi,
  };

  const nextBukuHardCover105x148: BukuHardCover105x148MasterParams = {
    ...currBukuHardCover105x148,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifKertasAp150Kg: g.tarifAp150,
    tarifPlateCoverOliver: g.oliverPlatUnit,
    minOngkosCoverOliver: g.oliverMinOngkos,
    drekCoverOliver: g.oliverDrekOver,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    tarifKertasHvs70Kg: g.tarifHvs70,
    tarifPlateIsiOliver: g.oliverPlatUnit,
    minOngkosIsiOliver: g.oliverMinOngkos,
    drekIsiOliver: g.oliverDrekOver,
    tarifSisirPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    minLaminasi: g.minLaminasi,
  };

  const nextPoster: PosterMasterParams = {
    ...currPoster,
    tarifArtCarton230Kg: g.tarifAc230Kg,
    upKertasPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    oliverPlatUnit: g.oliverPlatUnit,
    oliverMinOngkos: g.oliverMinOngkos,
    oliverDrekOver: g.oliverDrekOver,
    smPlatUnit: 100000,
    smMinOngkos: 250000,
    smDrekOver: 100,
    tarifSisirPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    tarifUvVarnishCm2: g.tarifUvVarnishCm2,
    minLaminasi: g.minLaminasi,
  };

  const nextMajalah: MajalahMasterParams = {
    ...currMajalah,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    tarifPlateCoverOliver: g.oliverPlatUnit,
    minOngkosCoverOliver: g.oliverMinOngkos,
    drekCoverOliver: g.oliverDrekOver,
    tarifKertasAp120Kg: g.tarifAp120,
    tarifPrintIsiA3: g.tarifPrintInter2Muka,
    tarifPlateIsiOliver: g.oliverPlatUnit,
    minOngkosIsiOliver: g.oliverMinOngkos,
    drekIsiOliver: g.oliverDrekOver,
    tarifSisirPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    tarifUvVarnishCm2: g.tarifUvVarnishCm2,
    minLaminasi: g.minLaminasi,
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
    nextRaportKaleb,
    nextKopSurat,
    nextAmplop,
    nextSertifikat,
    nextUndangan,
    nextBukuTabunganNs,
    nextBukuTabunganSecurity,
    nextKartuKoperasiPromise,
    nextLebelKartuObat,
    nextBukuSoftCover,
    nextBukuSoftCover145x2025,
    nextBukuHardCover105x148,
    nextPoster,
    nextMajalah,
  };
}
