// ponytail: kalkulator dan master parameter Kartu Koperasi Promise (15. Pricelist kartu Koperasi Promise)
// Referensi: Pricelist kartu Koperasi Promise.xlsm sheets HARGA JULI 2026 (KARTU KOPERASI - PROMISE 10,5 x 16,5 / 10,5 x 21,5 / 12,7 x 16,3 BC 160 2 Muka 1 Warna) + Source KARTU KOPERASI - PROMISE *.xlsm (Master BC 160 34800/33000 +5% + Ryobi 1W 2Muka, insheet 40, plat 10k, minOrder 15k/drek 40/30, pisau 149.8*luas, pound min 50k, sisir 10k/500, kardus 8500, lakban 8000)
// Ukuran: 10,5 x 16,5 / 10,5 x 21,5 / 12,7 x 16,3 cm 2 Muka 1 Warna, Pound + Sisir + Packing — heuristik: BC 160, cetak Ryobi, finishing pound + sisir

export interface KartuKoperasiPromiseMasterParams {
  // A. Bahan Kertas BC 160 gsm
  tarifKertasKg: number; // default 34800 /kg (BC 160, 12,7 variant 33000 -> pakai 34800 + override weight)
  upKertasPct: number; // default 5%
  insheet: number; // default 40 lbr

  // B. Desain
  tarifDesign: number; // default 15000 /order (12,7 variant 0 di config)

  // C. Plate & Cetak Ryobi 1 Warna 2 Muka
  tarifPlatePerPlat: number; // Rp 10.000 / plat
  tarifCetakMinPerPlat: number; // Rp 15.000 / plat min 1000 drek
  tarifDrek: number; // Rp 40 / drek (12,7 variant 30 -> toleransi)

  // D. Finishing
  tarifPisauPerCm2: number; // Rp 149.8 / cm2 * luasPisau (21.5*31.5=677 =>101452, 17*26.1=443=>66466)
  tarifPoundPerUnit: number; // Rp 140.93 / effective unit ((UMR/25)/divider)
  minPound: number; // Rp 50.000 min pound
  tarifSisirPer500: number; // Rp 10.000 /500 effective units

  // E. Packing
  tarifKardusBox: number; // Rp 8.500 / box (isi 3000 pcs)
  tarifLakbanRoll: number; // Rp 8.000 / roll (39.03 box per roll)

  // F. Margin & nego
  marginDefaultPct: number; // default 30%
  negoDefaultPct: number; // default 4% (Excel 4%)
}

export const DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS: KartuKoperasiPromiseMasterParams = {
  tarifKertasKg: 34800,
  upKertasPct: 5,
  insheet: 40,
  tarifDesign: 15000,
  tarifPlatePerPlat: 10000,
  tarifCetakMinPerPlat: 15000,
  tarifDrek: 40,
  tarifPisauPerCm2: 149.8,
  tarifPoundPerUnit: 140.92925,
  minPound: 50000,
  tarifSisirPer500: 10000,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,
  marginDefaultPct: 30,
  negoDefaultPct: 4,
};

export type KartuKoperasiPromiseVarianType = '10,5 x 16,5' | '10,5 x 21,5' | '12,7 x 16,3';

export const KARTU_KOPERASI_PROMISE_VARIANTS: KartuKoperasiPromiseVarianType[] = ['10,5 x 16,5', '10,5 x 21,5', '12,7 x 16,3'];

// ponytail: kartuPerPlano/potongPerPlano/planoWeight naive — upgrade ke plano-aware jika presisi dibutuhkan
export const KARTU_KOPERASI_PROMISE_CONFIG: Record<KartuKoperasiPromiseVarianType, {
  w: number; h: number;
  kartuPerPlano: number;
  potongPerPlano: number;
  platCount: number;
  luasPisauCm2: number;
  kertasWeightRawKg: number; // raw kg per plano (tanpa up)
  includeMukaInCetak: boolean; // true untuk 12,7 x16,3 (P=Q*N*M)
  kertasDefaultKg: number;
  description: string;
}> = {
  '10,5 x 16,5': {
    w: 10.5, h: 16.5, kartuPerPlano: 4, potongPerPlano: 1, platCount: 2, luasPisauCm2: 677.25, kertasWeightRawKg: 0.0113516, includeMukaInCetak: false, kertasDefaultKg: 34800,
    description: '10,5 × 16,5 cm · BC 160 gsm 2 Muka 1 Warna · 4 kartu/plano · Pound + Sisir + Packing',
  },
  '10,5 x 21,5': {
    w: 10.5, h: 21.5, kartuPerPlano: 3, potongPerPlano: 1, platCount: 2, luasPisauCm2: 677.25, kertasWeightRawKg: 0.0113516, includeMukaInCetak: false, kertasDefaultKg: 34800,
    description: '10,5 × 21,5 cm · BC 160 gsm 2 Muka 1 Warna · 3 kartu/plano · Pound + Sisir + Packing',
  },
  '12,7 x 16,3': {
    w: 12.7, h: 16.3, kartuPerPlano: 22, potongPerPlano: 11, platCount: 1, luasPisauCm2: 443.7, kertasWeightRawKg: 0.07994, includeMukaInCetak: true, kertasDefaultKg: 33000,
    description: '12,7 × 16,3 cm · BC 160 gsm 2 Muka 1 Warna · 22 kartu/plano (11 potong) · Pound + Sisir + Packing',
  },
};

export const KARTU_KOPERASI_PROMISE_TIERS: number[] = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 3000, 4000, 5000,
];

export interface KartuKoperasiPromiseSimulatorInput {
  oplah: number;
  varian: KartuKoperasiPromiseVarianType;
  marginPct: number;
  negoDiskonPct: number;
}

export interface KartuKoperasiPromiseBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface KartuKoperasiPromiseSimulatorResult {
  input: KartuKoperasiPromiseSimulatorInput;
  breakdown: KartuKoperasiPromiseBreakdownItem[];
  kebutuhanPlano: number;
  kebutuhanCetak: number;
  totalHpp: number;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  hargaNegoPerPcs: number;
  totalHargaJual: number;
  totalHargaNego: number;
  profitPerPcs: number;
  profitNegoPerPcs: number;
  profitTotal: number;
  profitNegoTotal: number;
  marginPct: number;
  marginNegoPct: number;
}

export function calculateKartuKoperasiPromiseHpp(
  input: KartuKoperasiPromiseSimulatorInput,
  rawParams: KartuKoperasiPromiseMasterParams = DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS
): KartuKoperasiPromiseSimulatorResult {
  const p: KartuKoperasiPromiseMasterParams = { ...DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS, ...(rawParams || {}) };
  const { oplah, varian, marginPct, negoDiskonPct } = input;
  const validOplah = Math.max(1, oplah);
  const cfg = KARTU_KOPERASI_PROMISE_CONFIG[varian];

  const breakdown: KartuKoperasiPromiseBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // 1. Kebutuhan Plano & Biaya Kertas BC 160
  // ponytail: insheetEff = max(insheet, ceil(oplah/40)) naive — upgrade ke insheet table jika presisi dibutuhkan
  const insheetEff = Math.max(p.insheet, Math.ceil(validOplah / 40));
  const kebutuhanPlano = Math.ceil(validOplah / cfg.kartuPerPlano + insheetEff / cfg.potongPerPlano);
  const hargaPerPlano = cfg.kertasWeightRawKg * p.tarifKertasKg * (1 + p.upKertasPct / 100);
  const biayaKertas = kebutuhanPlano * hargaPerPlano;
  add('Kertas BC 160 gsm', biayaKertas,
    `${kebutuhanPlano} lbr plano (${validOplah}/${cfg.kartuPerPlano}=${(validOplah / cfg.kartuPerPlano).toFixed(1)} + ${insheetEff}/${cfg.potongPerPlano}) × Rp ${Math.round(hargaPerPlano).toLocaleString('id-ID')} (+${p.upKertasPct}%)`);

  // 2. Desain (12,7 variant 0 di master asli)
  const biayaDesain = varian === '12,7 x 16,3' ? 0 : p.tarifDesign;
  add('Desain Cover', biayaDesain,
    varian === '12,7 x 16,3' ? 'Tanpa desain (0) — sesuai master 12,7 x16,3' : `Rp ${p.tarifDesign.toLocaleString('id-ID')} / order`);

  // 3. Plate
  const biayaPlate = cfg.platCount * p.tarifPlatePerPlat;
  add('Plate Cetak', biayaPlate,
    `${cfg.platCount} plat × Rp ${p.tarifPlatePerPlat.toLocaleString('id-ID')}`);

  // 4. Cetak Ryobi 1 Warna 2 Muka (minOrder + drek over)
  const mukaFactor = cfg.includeMukaInCetak ? 2 : 1;
  const jumlahCetak = kebutuhanPlano * cfg.potongPerPlano * mukaFactor;
  const biayaMin = cfg.platCount * p.tarifCetakMinPerPlat;
  const over = Math.max(0, jumlahCetak - 500);
  const biayaOver = over * p.tarifDrek;
  const biayaCetak = biayaMin + biayaOver;
  add('Cetak Ryobi 1 Warna 2 Muka', biayaCetak,
    `${cfg.platCount}×${p.tarifCetakMinPerPlat.toLocaleString('id-ID')}=${biayaMin.toLocaleString('id-ID')} + Over ${over}×${p.tarifDrek}=${biayaOver.toLocaleString('id-ID')} (P=${jumlahCetak})`);

  // 5. Finishing: Pisau Pound + Pound + Sisir
  const biayaPisau = cfg.luasPisauCm2 * p.tarifPisauPerCm2;
  // ponytail: pound min 50k naive — upgrade ke pound per-effective-unit jika throughput pound tinggi
  const effectiveUnits = validOplah * cfg.potongPerPlano / cfg.kartuPerPlano;
  const rawPound = effectiveUnits * p.tarifPoundPerUnit;
  const biayaPound = Math.max(p.minPound, rawPound);
  const ketPound = rawPound < p.minPound
    ? `Min Pound Rp ${p.minPound.toLocaleString('id-ID')} (raw ${effectiveUnits.toFixed(1)}×${p.tarifPoundPerUnit}=${Math.round(rawPound).toLocaleString('id-ID')})`
    : `${effectiveUnits.toFixed(1)} unit × Rp ${p.tarifPoundPerUnit}=${Math.round(rawPound).toLocaleString('id-ID')}`;
  const biayaSisir = (effectiveUnits / 500) * p.tarifSisirPer500;

  add('Pisau Pound', biayaPisau,
    `${cfg.luasPisauCm2} cm² × Rp ${p.tarifPisauPerCm2} (21.5×31.5 / 17×26.1)`);
  add('Pound', biayaPound, ketPound);
  add('Sisir', biayaSisir,
    `${effectiveUnits.toFixed(1)} unit /500 × Rp ${p.tarifSisirPer500.toLocaleString('id-ID')}`);

  // 6. Packing Kardus + Lakban per order
  {
    const jumlahKardus = Math.ceil(validOplah / 3000);
    const biayaKardus = jumlahKardus * p.tarifKardusBox;
    const kebutuhanLakban = (validOplah / 3000) / 39.03061224489796;
    const biayaLakban = kebutuhanLakban * p.tarifLakbanRoll;
    const biayaPacking = biayaKardus + biayaLakban;
    add('Packing Kardus & Lakban', biayaPacking,
      `${jumlahKardus} kardus × Rp ${p.tarifKardusBox.toLocaleString('id-ID')} + Lakban ${kebutuhanLakban.toFixed(4)} roll × Rp ${p.tarifLakbanRoll.toLocaleString('id-ID')}`);
  }

  breakdown.forEach(b => { b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0; });

  const hppPerPcs = validOplah > 0 ? totalHpp / validOplah : 0;
  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + marginPct / 100)) / 10) * 10;
  const hargaNegoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 10) * 10;
  const totalHargaJual = Math.round(hargaJualPerPcs * validOplah);
  const totalHargaNego = Math.round(hargaNegoPerPcs * validOplah);
  const profitPerPcs = hargaJualPerPcs - hppPerPcs;
  const profitNegoPerPcs = hargaNegoPerPcs - hppPerPcs;
  const profitTotal = totalHargaJual - totalHpp;
  const profitNegoTotal = totalHargaNego - totalHpp;
  const marginPctActual = hargaJualPerPcs > 0 ? profitPerPcs / hargaJualPerPcs : 0;
  const marginNegoPct = hargaNegoPerPcs > 0 ? profitNegoPerPcs / hargaNegoPerPcs : 0;

  return {
    input,
    breakdown,
    kebutuhanPlano,
    kebutuhanCetak: jumlahCetak,
    totalHpp: Math.round(totalHpp),
    hppPerPcs,
    hargaJualPerPcs,
    hargaNegoPerPcs,
    totalHargaJual,
    totalHargaNego,
    profitPerPcs,
    profitNegoPerPcs,
    profitTotal,
    profitNegoTotal,
    marginPct: marginPctActual,
    marginNegoPct,
  };
}

export type SavedKartuKoperasiPromiseSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: KartuKoperasiPromiseSimulatorResult;
  paramsSnapshot?: KartuKoperasiPromiseMasterParams;
};
