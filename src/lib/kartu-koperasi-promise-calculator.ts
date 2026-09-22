// Kalkulator murni Kartu Koperasi Promise — direct binding 1:1 ke be dragged from Source Excel.
// Sumber: 15. Pricelist kartu Koperasi Promise/Source/KARTU KOPERASI - PROMISE {10,5 x 16,5 / 10,5 x 21,5 / 12,7 x 16,3} cm.xlsm
// Struktur tiap file: sheet Master (A3:F25, input) + sheet BUKU (A1:BK40, engine 15 tier H7:H21 + harga BJ7:BJ21).
// Setiap rumus di bawah mencantumkan alamat cell Excel aslinya. DILARANG conditional hijacking:
// semua konstanta yang beda antar-file diikat per-varian di KARTU_KOPERASI_PROMISE_CONFIG.

export type KartuKoperasiPromiseMesinType = 'Print Inter' | 'Ryobi'; // Master!D15
export type KartuKoperasiPromiseMukaType = '1 Muka' | '2 Muka'; // Master!D13
export type KartuKoperasiPromiseWarnaType = '1 Warna' | '2 Warna' | '3 Warna' | '4 Warna'; // Master!D14
// Master!D19 (nilai mentah persis seperti di Excel, koma trailing ikut):
export type KartuKoperasiPromiseFinishingType = 'None,' | 'UV Varnish,' | 'Laminasi Glossy,' | 'Laminasi Doff,';

export const KARTU_KOPERASI_PROMISE_MESIN_OPTIONS: KartuKoperasiPromiseMesinType[] = ['Print Inter', 'Ryobi'];
export const KARTU_KOPERASI_PROMISE_MUKA_OPTIONS: KartuKoperasiPromiseMukaType[] = ['1 Muka', '2 Muka'];
export const KARTU_KOPERASI_PROMISE_WARNA_OPTIONS: KartuKoperasiPromiseWarnaType[] = ['1 Warna', '2 Warna', '3 Warna', '4 Warna'];
export const KARTU_KOPERASI_PROMISE_FINISHING_OPTIONS: KartuKoperasiPromiseFinishingType[] = ['None,', 'UV Varnish,', 'Laminasi Glossy,', 'Laminasi Doff,'];

export interface KartuKoperasiPromiseMasterParams {
  umr: number; // Master!D7 UMR (Rp) — default 2818585
  tarifKertasKg: number; // Master!D11 harga/kg BC 160 (Rp) — file 10,5: 34800, file 12,7: 33000
  upKertasPct: number; // Master!E11 up kertas (%) — file 10,5: 5, file 12,7: 0 (sel kosong)
  insheet: number; // Master!D12 Insheet (lbr) — default 40 (BUKU!K6 = B04.Insheet)
  koefInsheet: number; // BUKU!K2 koefisien insheet — 0.025
  gramaturGsm: number; // Master!D10 -> BUKU!V28 gramatur angka (17 opsi label, tersimpan "160 gsm")
  tarifDesign: number; // Master!D16 Design Cover (Rp/order) — file 10,5: 15000, file 12,7: 0
  tarifPrintA3Plus: number; // Master!D17 Harga Print Cover A3+ (Rp) -> BUKU!S2, dipakai saat Cetak=Print Inter
  tarifPlatePerPlat: number; // BUKU!X6 Ryobi (Rp/plat) — 10000 (0 untuk Print Inter via mesin)
  tarifCetakMinPerPlat: number; // BUKU!AA6 Ryobi min order (Rp/plat) — 15000 (0 untuk Print Inter via mesin)
  tarifRoyaltyPerPcs: number; // Master!D22 -> BUKU!AH6 Royalty (Rp/pcs) — 0
  biayaTransport: number; // BUKU!AJ6 Transp (Rp/order) — 0 (BUKU!AJ7 = AJ6 tanpa gate H)
  biayaLain: number; // BUKU!AK6 Biaya Lain-Lain (Rp/order) — 0 (BUKU!AK7 = AK6 tanpa gate H)
  tarifPisauPerCm2: number; // BUKU!AL6 = 299.6/2 (Rp/cm2) — 149.8, aktif saat AL26=√ (konstanta √)
  tarifSisirPer500: number; // BUKU!AN6 Sisir (Rp/500 unit) — 10000, aktif saat AN26=√ (konstanta √)
  minPound: number; // BUKU!AM7 batas bawah Pound (Rp) — 50000
  tarifLaminasiGlossy: number; // BUKU!AP6 rate Glossy (Rp/cm2) — 0.35
  tarifLaminasiDoff: number; // BUKU!AS6 rate Doff (Rp/cm2) — 0.4
  tarifUvVarnish: number; // BUKU!AV6 rate UV (Rp/cm2) — 0.12
  minFinishing: number; // floor AQ/AT/AW (Rp) — 50000
  tarifLakbanRoll: number; // Master!D20 Lakban Transparan (Rp/roll) — 8000
  tarifKardusBox: number; // Master!D21 Kardus (Rp/box) — 8500
  lakbanUkuranRoll: number; // BUKU!BA30 Ukuran/Roll — 7650 (AZ6 = BA30/196)
  kardusIsiPcs: number; // BUKU!AZ35 1 Kardus Isi (pcs) — 3000 (C6=1 → cabang C6<=100)
  marginDefaultPct: number; // Master!E23 Laba (%) — 30
}

export const DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS: KartuKoperasiPromiseMasterParams = {
  umr: 2818585,
  tarifKertasKg: 34800,
  upKertasPct: 5,
  insheet: 40,
  koefInsheet: 0.025,
  gramaturGsm: 160,
  tarifDesign: 15000,
  tarifPrintA3Plus: 2500,
  tarifPlatePerPlat: 10000,
  tarifCetakMinPerPlat: 15000,
  tarifRoyaltyPerPcs: 0,
  biayaTransport: 0,
  biayaLain: 0,
  tarifPisauPerCm2: 149.8,
  tarifSisirPer500: 10000,
  minPound: 50000,
  tarifLaminasiGlossy: 0.35,
  tarifLaminasiDoff: 0.4,
  tarifUvVarnish: 0.12,
  minFinishing: 50000,
  tarifLakbanRoll: 8000,
  tarifKardusBox: 8500,
  lakbanUkuranRoll: 7650,
  kardusIsiPcs: 3000,
  marginDefaultPct: 30,
};

export type KartuKoperasiPromiseVarianType = '10,5 x 16,5' | '10,5 x 21,5' | '12,7 x 16,3';

export const KARTU_KOPERASI_PROMISE_VARIANTS: KartuKoperasiPromiseVarianType[] = ['10,5 x 16,5', '10,5 x 21,5', '12,7 x 16,3'];

// Konstanta per-file (satu file = satu varian). Nilai dikutip dari BUKU!N7/O7/U27/V27/AL30/AM30/AB7/AM28/Y6
// masing-masing file Source. BUKAN tebakan — jangan diubah tanpa audit ulang file Excel.
export const KARTU_KOPERASI_PROMISE_CONFIG: Record<KartuKoperasiPromiseVarianType, {
  kartuW: number; // BUKU!D7 lebar kartu (cm)
  kartuH: number; // BUKU!F7 panjang kartu (cm)
  potongPrintInter: number; // BUKU!N7 cabang Print Inter
  kartuPrintInter: number; // BUKU!O7 cabang Print Inter
  potongRyobi: number; // BUKU!N7 cabang Ryobi
  kartuRyobi: number; // BUKU!O7 cabang Ryobi
  planoW: number; // BUKU!U27 lebar plano (cm)
  planoH: number; // BUKU!V27 panjang plano (cm)
  pisauW: number; // BUKU!AL30 lebar pisau pound (cm)
  pisauH: number; // BUKU!AM30 panjang pisau pound (cm)
  tarifDrek: number; // BUKU!AB7 per drek warna (Rp, cabang Ryobi; 0 untuk Print Inter via mesin)
  targetPound: number; // BUKU!AM28 target/hari pound
  platOverride: number; // BUKU!Y6 override jumlah plat (0 = ikut Y2*M7)
  includeMukaInCetak: boolean; // true hanya file 12,7: BUKU!P7 = Q7*N7*M7 (file lain P7 = Q7*N7)
  fileKertasKg: number; // Master!D11 bawaan file
  fileUpPct: number; // Master!E11 bawaan file (12,7 kosong = 0)
  fileDesain: number; // Master!D16 bawaan file
  description: string;
}> = {
  '10,5 x 16,5': {
    kartuW: 10.5, kartuH: 21.5,
    potongPrintInter: 1, kartuPrintInter: 8, potongRyobi: 1, kartuRyobi: 4,
    planoW: 21.5, planoH: 33, pisauW: 21.5, pisauH: 31.5,
    tarifDrek: 40, targetPound: 800, platOverride: 0, includeMukaInCetak: false,
    fileKertasKg: 34800, fileUpPct: 5, fileDesain: 15000,
    description: '10,5 × 16,5 cm · BC 160 gsm 2 Muka 1 Warna · Ryobi 4 kartu/plano · Pound + Sisir + Packing',
  },
  '10,5 x 21,5': {
    kartuW: 10.5, kartuH: 21.5,
    potongPrintInter: 1, kartuPrintInter: 6, potongRyobi: 1, kartuRyobi: 3,
    planoW: 21.5, planoH: 33, pisauW: 21.5, pisauH: 31.5,
    tarifDrek: 40, targetPound: 800, platOverride: 0, includeMukaInCetak: false,
    fileKertasKg: 34800, fileUpPct: 5, fileDesain: 15000,
    description: '10,5 × 21,5 cm · BC 160 gsm 2 Muka 1 Warna · Ryobi 3 kartu/plano · Pound + Sisir + Packing',
  },
  '12,7 x 16,3': {
    kartuW: 12.7, kartuH: 16.3,
    potongPrintInter: 1, kartuPrintInter: 4, potongRyobi: 11, kartuRyobi: 22,
    planoW: 61, planoH: 86, pisauW: 17, pisauH: 26.1,
    tarifDrek: 30, targetPound: 1200, platOverride: 1, includeMukaInCetak: true,
    fileKertasKg: 33000, fileUpPct: 0, fileDesain: 0,
    description: '12,7 × 16,3 cm · BC 160 gsm 2 Muka 1 Warna · Ryobi 22 kartu/plano (11 potong) · Pound + Sisir + Packing',
  },
};

// BUKU!H7:H21 — tier oplah bawaan ketiga file (identik).
export const KARTU_KOPERASI_PROMISE_TIERS: number[] = [
  500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 10000,
];

export interface KartuKoperasiPromiseSimulatorInput {
  oplah: number;
  varian: KartuKoperasiPromiseVarianType;
  mesin: KartuKoperasiPromiseMesinType; // Master!D15
  muka: KartuKoperasiPromiseMukaType; // Master!D13
  warna: KartuKoperasiPromiseWarnaType; // Master!D14
  finishing: KartuKoperasiPromiseFinishingType; // Master!D19
  marginPct: number; // Master!E23
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
  kebutuhanPlano: number; // BUKU!Q7
  kebutuhanCetak: number; // BUKU!P7
  totalHpp: number; // BUKU!BD7
  hppPerPcs: number; // BUKU!BE7
  hargaJualPerPcs: number; // BUKU!BJ7
  totalHargaJual: number; // BUKU!BH7
  profitPerPcs: number;
  profitTotal: number;
  marginPct: number;
}

const mulaCount = (m: KartuKoperasiPromiseMukaType): number => (m === '1 Muka' ? 1 : m === '2 Muka' ? 2 : 0); // BUKU!M7
const warnaCount = (w: KartuKoperasiPromiseWarnaType): number => // BUKU!L7 = BUKU!Y2
  (w === '1 Warna' ? 1 : w === '2 Warna' ? 2 : w === '3 Warna' ? 3 : w === '4 Warna' ? 4 : 0);

export function calculateKartuKoperasiPromiseHpp(
  input: KartuKoperasiPromiseSimulatorInput,
  rawParams: KartuKoperasiPromiseMasterParams = DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS
): KartuKoperasiPromiseSimulatorResult {
  const d = DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS;
  const rp = rawParams || {};
  const cfg = KARTU_KOPERASI_PROMISE_CONFIG[input.varian];
  // Tiga sel Master yang nilai bawaannya beda antar-file: pakai nilai file kecuali user sudah mengubahnya
  // (di Master Parameter) dari default global — edit user selalu menang.
  const effKertasKg = rp.tarifKertasKg !== undefined && rp.tarifKertasKg !== d.tarifKertasKg ? rp.tarifKertasKg : cfg.fileKertasKg; // Master!D11
  const effUpPct = rp.upKertasPct !== undefined && rp.upKertasPct !== d.upKertasPct ? rp.upKertasPct : cfg.fileUpPct; // Master!E11
  const effDesain = rp.tarifDesign !== undefined && rp.tarifDesign !== d.tarifDesign ? rp.tarifDesign : cfg.fileDesain; // Master!D16
  const p: KartuKoperasiPromiseMasterParams = { ...d, ...rp, tarifKertasKg: effKertasKg, upKertasPct: effUpPct, tarifDesign: effDesain };
  const { oplah, varian, mesin, muka, warna, finishing, marginPct } = input;
  void varian;
  const H = Math.max(0, Math.round(oplah));
  const isPI = mesin === 'Print Inter';
  const M = mulaCount(muka); // BUKU!M7
  const Y2 = warnaCount(warna); // BUKU!Y2

  const breakdown: KartuKoperasiPromiseBreakdownItem[] = [];
  let totalHpp = 0;
  const add = (nama: string, nominal: number, keterangan = '') => {
    if (!(nominal > 0)) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // BUKU!K7 insheet: =IF(AND(H>0,K2>0,K2*H<=40),40,IF(AND(H>0,K2>0,K2*H>30),K2*H,IF(AND(H>0,K2<=0),K6,0)))
  const k2h = p.koefInsheet * H;
  const K = H > 0 && p.koefInsheet > 0 && k2h <= 40 ? 40
    : H > 0 && p.koefInsheet > 0 && k2h > 30 ? k2h
    : H > 0 && p.koefInsheet <= 0 ? p.insheet : 0;
  const N = isPI ? cfg.potongPrintInter : cfg.potongRyobi; // BUKU!N7
  const O = isPI ? cfg.kartuPrintInter : cfg.kartuRyobi; // BUKU!O7
  // BUKU!Q7 =ROUNDUP((H/O)+(K/N),0) — ROUNDUP positif = ceil
  const Q = H > 0 ? Math.ceil(H / O + K / N) : 0;
  // BUKU!P7 =Q*N (*M7 hanya file 12,7)
  const P = Q * N * (cfg.includeMukaInCetak ? M : 1);

  // BUKU!V29 harga/rim =((U27*V27)*V28)/20000*((V30*X30)+V30); BUKU!V32 = V29/500 harga/lembar
  const hargaRim = ((cfg.planoW * cfg.planoH) * p.gramaturGsm) / 20000 * (p.tarifKertasKg * (1 + p.upKertasPct / 100));
  const hargaLembar = hargaRim / 500;
  // BUKU!S7 =IF(Print Inter,S2*Q,IF(Ryobi,(V29/500)*Q,0)); BUKU!S2 =IF(D15=Print Inter,D17,0)
  const biayaKertas = H > 0 ? (isPI ? p.tarifPrintA3Plus * Q : hargaLembar * Q) : 0;
  add('Kertas BC 160 gsm', biayaKertas,
    `BUKU!S7: ${Q} lbr plano × Rp ${Math.round(isPI ? p.tarifPrintA3Plus : hargaLembar).toLocaleString('id-ID')} (${isPI ? 'Print Inter A3+' : `rim Rp ${Math.round(hargaRim).toLocaleString('id-ID')}/500`})`);

  // BUKU!U7 =IF(H>0,U6,0); BUKU!U6 =Master!D16
  add('Desain', H > 0 ? effDesain : 0, `BUKU!U7: Rp ${effDesain.toLocaleString('id-ID')}/order`);

  // BUKU!Y7 =IF(Y6>0,Y6,IF(Y6<=0,Y2*M7,0)); BUKU!X7 =IF(H>0,X6*Y7,0); X6=0 saat Print Inter
  const jmlPlat = cfg.platOverride > 0 ? cfg.platOverride : Y2 * M;
  add('Plate Cetak', H > 0 ? (isPI ? 0 : p.tarifPlatePerPlat) * jmlPlat : 0,
    `BUKU!X7: ${jmlPlat} plat × Rp ${(isPI ? 0 : p.tarifPlatePerPlat).toLocaleString('id-ID')}${cfg.platOverride > 0 ? ' (override BUKU!Y6)' : ' (BUKU!Y2×M7)'} — ${mesin}`);

  // BUKU!AA7 =IF(H>0,AA6,0); BUKU!AC7 =AA7*Y7; AA6=0 saat Print Inter
  const minOrder = H > 0 ? (isPI ? 0 : p.tarifCetakMinPerPlat) * jmlPlat : 0;
  // BUKU!AD7 =IF(AND(PI,P-500>1),0,IF(AND(Ryobi,P-500>1),P-500,0))
  const overDrek = !isPI && P - 500 > 1 ? P - 500 : 0;
  // BUKU!AE7 =(IF(AD=0,0,IF(AD>1,AD,0)))*AB7*Y2; AB7 = tarifDrek file (0 saat Print Inter via mesin)
  const overRp = (overDrek === 0 ? 0 : overDrek > 1 ? overDrek : 0) * (isPI ? 0 : cfg.tarifDrek) * Y2;
  // BUKU!AF7 =AE7+AC7
  add('Cetak ' + mesin, minOrder + overRp,
    `BUKU!AF7: min Rp ${Math.round(minOrder).toLocaleString('id-ID')} + over ${overDrek} drek × Rp ${isPI ? 0 : cfg.tarifDrek} × ${Y2} warna (P=${P})`);

  // BUKU!AH7 =H*AH6 (royalty); BUKU!AJ7 =AJ6; BUKU!AK7 =AK6 (tanpa gate H)
  if (H * p.tarifRoyaltyPerPcs > 0) add('Royalty', H * p.tarifRoyaltyPerPcs, `BUKU!AH7: ${H} × Rp ${p.tarifRoyaltyPerPcs}`);
  if (p.biayaTransport > 0) add('Transport', p.biayaTransport, 'BUKU!AJ7 = AJ6');
  if (p.biayaLain > 0) add('Biaya Lain-Lain', p.biayaLain, 'BUKU!AK7 = AK6');

  // BUKU!AL7 =IF(H>0,AL6*(AL30*AM30),0); AL6 = 299.6/2 (AL26=√ konstanta)
  add('Pisau Pound', H > 0 ? p.tarifPisauPerCm2 * (cfg.pisauW * cfg.pisauH) : 0,
    `BUKU!AL7: ${p.tarifPisauPerCm2} × ${cfg.pisauW}×${cfg.pisauH} cm²`);
  // BUKU!AM6 =(UMR/25)/AM28; BUKU!AM7 =IF(AND(H>0,eff*AM6<=50000),50000,IF(AND(H>0,eff*AM6>50000),eff*AM6,0)); eff = H/(O/N)
  const tarifPoundUnit = (p.umr / 25) / cfg.targetPound;
  const effUnit = O / N > 0 ? H / (O / N) : 0;
  const rawPound = effUnit * tarifPoundUnit;
  const biayaPound = H > 0 && rawPound <= p.minPound ? p.minPound : H > 0 && rawPound > p.minPound ? rawPound : 0;
  add('Pound', biayaPound,
    `BUKU!AM7: ${effUnit.toFixed(1)} unit × Rp ${tarifPoundUnit.toFixed(2)} (UMR/25/${cfg.targetPound})${rawPound <= p.minPound ? ` → min Rp ${p.minPound.toLocaleString('id-ID')}` : ''}`);
  // BUKU!AN7 =((H/(O/N))/500)*AN6 (tanpa gate H; AN26=√ konstanta)
  add('Sisir', (effUnit / 500) * p.tarifSisirPer500,
    `BUKU!AN7: ${effUnit.toFixed(1)}/500 × Rp ${p.tarifSisirPer500.toLocaleString('id-ID')}`);

  // Finishing mentah: BUKU!AP7/AS7/AV7 =((D+1)*(F+1)*rate)*H; gate √ dari Master!D19:
  // AQ27 Glossy √ saat D19=Laminasi Glossy,; AT27 Doff √ saat D19=Laminasi Doff,; AW27 UV √ saat D19=UV Varnish,
  const luasFin = (cfg.kartuW + 1) * (cfg.kartuH + 1);
  const finGated = (raw: number, gate: boolean): number =>
    (gate ? (raw === 0 ? 0 : raw > p.minFinishing ? raw : p.minFinishing) : 0);
  add('Laminasi Glossy', finGated(luasFin * p.tarifLaminasiGlossy * H, finishing === 'Laminasi Glossy,'),
    `BUKU!AQ7: ${luasFin.toFixed(2)} cm² × ${p.tarifLaminasiGlossy} × ${H}, floor Rp ${p.minFinishing.toLocaleString('id-ID')}`);
  add('Laminasi Doff', finGated(luasFin * p.tarifLaminasiDoff * H, finishing === 'Laminasi Doff,'),
    `BUKU!AT7: ${luasFin.toFixed(2)} cm² × ${p.tarifLaminasiDoff} × ${H}, floor Rp ${p.minFinishing.toLocaleString('id-ID')}`);
  add('UV Varnish', finGated(luasFin * p.tarifUvVarnish * H, finishing === 'UV Varnish,'),
    `BUKU!AW7: ${luasFin.toFixed(2)} cm² × ${p.tarifUvVarnish} × ${H}, floor Rp ${p.minFinishing.toLocaleString('id-ID')}`);

  // BUKU!AZ6 =BA30/196; BUKU!AZ7 =(H/AZ35)/AZ6; BUKU!BA7 =BA32*AZ7 (BA32 = Master!D20)
  const boxPerRoll = p.lakbanUkuranRoll / 196;
  const needRoll = H > 0 && boxPerRoll > 0 ? H / p.kardusIsiPcs / boxPerRoll : 0;
  const biayaLakban = p.tarifLakbanRoll * needRoll;
  // BUKU!BB7 =(ROUNDUP(H/AZ35,0)*BB6)+BA7 (AND ukuran, BB28=√ selalu benar per konstruksi varian=file)
  const biayaPacking = (H > 0 ? Math.ceil(H / p.kardusIsiPcs) * p.tarifKardusBox : 0) + biayaLakban;
  add('Packing Kardus & Lakban', biayaPacking,
    `BUKU!BB7: ${H > 0 ? Math.ceil(H / p.kardusIsiPcs) : 0} kardus × Rp ${p.tarifKardusBox.toLocaleString('id-ID')} + ${needRoll.toFixed(4)} roll × Rp ${p.tarifLakbanRoll.toLocaleString('id-ID')}`);

  breakdown.forEach((b) => { b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0; });

  // BUKU!BD7 =S+U+X+AF+AH+AJ+AN+AQ+AT+AW+AK+BB+AM+AL — dijumlah via add() di atas (urutan sama)
  // BUKU!BE7 =BD/H; BUKU!BF7 =BE*(E23%); BUKU!BH7 =(BE+BF)*H; BUKU!BI7 =BH/H; BUKU!BJ7 =ROUNDUP(BI,-1)
  const hppPerPcs = H > 0 ? totalHpp / H : 0;
  const labaPerPcs = hppPerPcs * (marginPct / 100);
  const totalHargaJual = Math.round((hppPerPcs + labaPerPcs) * H);
  const hargaJualPerPcs = H > 0 ? Math.ceil(((hppPerPcs + labaPerPcs)) / 10) * 10 : 0;
  const profitPerPcs = hargaJualPerPcs - hppPerPcs;

  return {
    input,
    breakdown,
    kebutuhanPlano: Q,
    kebutuhanCetak: P,
    totalHpp: Math.round(totalHpp),
    hppPerPcs,
    hargaJualPerPcs,
    totalHargaJual,
    profitPerPcs,
    profitTotal: totalHargaJual - Math.round(totalHpp),
    marginPct: hargaJualPerPcs > 0 ? profitPerPcs / hargaJualPerPcs : 0,
  };
}

export type SavedKartuKoperasiPromiseSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: KartuKoperasiPromiseSimulatorResult;
  paramsSnapshot?: KartuKoperasiPromiseMasterParams;
};
