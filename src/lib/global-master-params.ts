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
import { SoftCoverUnifiedParams, DEFAULT_SOFT_COVER_UNIFIED } from './buku-soft-cover-unified';
import { LebelKartuObatMasterParams, DEFAULT_LEBEL_KARTU_OBAT_PARAMS } from './lebel-kartu-obat-calculator';

import { BukuHardCover105x148MasterParams, DEFAULT_BUKU_HARD_COVER_105X148_PARAMS } from './buku-hard-cover-105x148-calculator';
import { PosterMasterParams, DEFAULT_POSTER_PARAMS } from './poster-calculator';
import { MajalahMasterParams, DEFAULT_MAJALAH_PARAMS } from './majalah-calculator';
import { StikerMasterParams, DEFAULT_STIKER_PARAMS } from './stiker-calculator';
import { BukuHardCover145x2025MasterParams, DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS } from './buku-hard-cover-145x2025-calculator';
import { BukuHardCover21x297MasterParams, DEFAULT_BUKU_HARD_COVER_21X297_PARAMS } from './buku-hard-cover-21x297-calculator';
import { KalenderKopMasterParams, DEFAULT_KALENDER_KOP_PARAMS } from './kalender-kop-calculator';
import { PackagingMasterParams, DEFAULT_PACKAGING_PARAMS } from './packaging-calculator';
import { PaperbagMasterParams, DEFAULT_PAPERBAG_PARAMS } from './paperbag-calculator';

export interface GlobalMasterParams {
  // Harga kertas dasar & bahan baku (/kg) + up kertas — satu-satunya isi Global.
  tarifHvs70: number;            // Rp 15.700 / kg (Kalender, Nota, Buku Tulis, Buku Tabungan, dll)
  tarifAp120: number;            // Rp 17.400 / kg (Kalender, Brosur, Majalah isi)
  tarifAp150: number;            // Rp 17.400 / kg (Kalender, Buku Hardcover cover)
  tarifAc230Kg: number;          // Rp 16.400 / kg (Manasik, Stopmap, Buku Tulis, Buku Soft/Hard cover)
  tarifAc260Kg: number;          // Rp 15.500 / kg (Manasik, Syahadah, Sertifikat, Buku Tabungan)
  upKertasPct: number;           // 5% margin/ppn kertas dasar
}

export const DEFAULT_GLOBAL_PARAMS: GlobalMasterParams = {
  tarifHvs70: 15700,
  tarifAp120: 17400,
  tarifAp150: 17400,
  tarifAc230Kg: 16400,
  tarifAc260Kg: 15500,
  upKertasPct: 5,
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
  currBukuSoftCover: SoftCoverUnifiedParams = DEFAULT_SOFT_COVER_UNIFIED,
  currBukuHardCover105x148: BukuHardCover105x148MasterParams = DEFAULT_BUKU_HARD_COVER_105X148_PARAMS,
  currPoster: PosterMasterParams = DEFAULT_POSTER_PARAMS,
  currMajalah: MajalahMasterParams = DEFAULT_MAJALAH_PARAMS,
  currStiker: StikerMasterParams = DEFAULT_STIKER_PARAMS,
  currBukuHardCover145x2025: BukuHardCover145x2025MasterParams = DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS,
  currBukuHardCover21x297: BukuHardCover21x297MasterParams = DEFAULT_BUKU_HARD_COVER_21X297_PARAMS,
  currKalenderKop: KalenderKopMasterParams = DEFAULT_KALENDER_KOP_PARAMS,
  currPackaging: PackagingMasterParams = DEFAULT_PACKAGING_PARAMS,
  currPaperbag: PaperbagMasterParams = DEFAULT_PAPERBAG_PARAMS,
) {
  const nextSpiral: SimulatorMasterParams = {
    ...currSpiral,
    tarifHvs70: g.tarifHvs70,
    tarifAp120: g.tarifAp120,
    tarifAp150: g.tarifAp150,
    ppnMarginKertas: 1 + g.upKertasPct / 100,
    ppnHvs70: 1 + g.upKertasPct / 100,
    ppnAp120: 1 + g.upKertasPct / 100,
    ppnAp150: 1 + g.upKertasPct / 100,
  };

  const nextKlem: SimulatorMasterParams = {
    ...currKlem,
    tarifHvs70: g.tarifHvs70,
    tarifAp120: g.tarifAp120,
    tarifAp150: g.tarifAp150,
    ppnMarginKertas: 1 + g.upKertasPct / 100,
    ppnHvs70: 1 + g.upKertasPct / 100,
    ppnAp120: 1 + g.upKertasPct / 100,
    ppnAp150: 1 + g.upKertasPct / 100,
  };

  const nextManasik: ManasikMasterParams = {
    ...currManasik,
    tarifAc230Kg: g.tarifAc230Kg,
    tarifAc260Kg: g.tarifAc260Kg,
    tarifKertasHvs70Kg: g.tarifHvs70,
  };
  const nextYasin: YasinMasterParams = {
    ...currYasin,
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
  };

  const nextLabelKhq: LabelKhqMasterParams = {
    ...currLabelKhq,
  };

  const nextBukuTulis: BukuTulisMasterParams = {
    ...currBukuTulis,
    tarifArtCarton230Kg: g.tarifAc230Kg,
    tarifHvs70Kg: g.tarifHvs70,
    upArtCartonPct: g.upKertasPct,
    upHvsPct: g.upKertasPct,
  };

  const nextStopmap: StopmapMasterParams = {
    ...currStopmap,
    tarifArtCartonKg: g.tarifAc230Kg,
    upArtCartonPct: g.upKertasPct,
  };

  const nextSyahadah: SyahadahMasterParams = {
    ...currSyahadah,
    tarifKertasLinenKg: 29900,
    upKertasPct: g.upKertasPct,
  };

  const nextRaportKaleb: RaportKalebMasterParams = {
    ...currRaportKaleb,
  };

  const nextKopSurat: KopSuratMasterParams = {
    ...currKopSurat,
    hargaPerKg: g.tarifHvs70,
    upPct: g.upKertasPct,
  };

  const nextAmplop: AmplopMasterParams = {
    ...currAmplop,
  };

  const nextSertifikat: SertifikatMasterParams = {
    ...currSertifikat,
  };

  const nextUndangan: UndanganMasterParams = {
    ...currUndangan,
  };

  const nextBukuTabunganNs: BukuTabunganNsMasterParams = {
    ...currBukuTabunganNs,
    tarifKertasCoverKg: g.tarifAc260Kg,
    upKertasCoverPct: g.upKertasPct,
    tarifKertasIsiKg: g.tarifHvs70,
    upKertasIsiPct: g.upKertasPct,
  };

  const nextBukuTabunganSecurity: BukuTabunganSecurityMasterParams = {
    ...currBukuTabunganSecurity,
    tarifKertasCoverKg: g.tarifAc260Kg,
    upKertasCoverPct: g.upKertasPct,
    tarifKertasIsiKg: g.tarifHvs70,
    upKertasIsiPct: g.upKertasPct,
  };

  const nextKartuKoperasiPromise: KartuKoperasiPromiseMasterParams = {
    ...currKartuKoperasiPromise,
    tarifKertasKg: g.tarifAc260Kg,
    upKertasPct: g.upKertasPct,
  };

  const nextLebelKartuObat: LebelKartuObatMasterParams = {
    ...currLebelKartuObat,
    tarifKertasKg: g.tarifHvs70,
    upKertasPct: g.upKertasPct,
  };

  const nextBukuSoftCover: SoftCoverUnifiedParams = {
    ...currBukuSoftCover,
    tarifKertasCoverKg: g.tarifAc230Kg,
    upCoverPct: g.upKertasPct,
    tarifKertasIsiKg: g.tarifHvs70,
    upIsiPct: g.upKertasPct,
  };

  const nextBukuHardCover105x148: BukuHardCover105x148MasterParams = {
    ...currBukuHardCover105x148,
    tarifKertasAp150Kg: g.tarifAp150,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    tarifKertasHvs70Kg: g.tarifHvs70,
  };

  const nextPoster: PosterMasterParams = {
    ...currPoster,
    tarifArtCarton230Kg: g.tarifAc230Kg,
    upKertasPct: g.upKertasPct,
  };

  const nextMajalah: MajalahMasterParams = {
    ...currMajalah,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    tarifKertasAp120Kg: g.tarifAp120,
  };

  const nextStiker: StikerMasterParams = {
    ...currStiker,
  };

  const nextBukuHardCover145x2025: BukuHardCover145x2025MasterParams = {
    ...currBukuHardCover145x2025,
    tarifKertasAp150Kg: g.tarifAp150,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    tarifKertasHvs70Kg: g.tarifHvs70,
  };

  const nextBukuHardCover21x297: BukuHardCover21x297MasterParams = {
    ...currBukuHardCover21x297,
    tarifKertasAp150Kg: g.tarifAp150,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    tarifKertasHvs70Kg: g.tarifHvs70,
  };

  const nextKalenderKop: KalenderKopMasterParams = {
    ...currKalenderKop,
  };

  const nextPackaging: PackagingMasterParams = {
    ...currPackaging,
  };

  const nextPaperbag: PaperbagMasterParams = {
    ...currPaperbag,
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
    nextBukuHardCover105x148,
    nextPoster,
    nextMajalah,
    nextStiker,
    nextBukuHardCover145x2025,
    nextBukuHardCover21x297,
    nextKalenderKop,
    nextPackaging,
    nextPaperbag,
  };
}
