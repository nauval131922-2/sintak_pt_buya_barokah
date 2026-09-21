// Amplop — kalkulator murni 1:1 engine BUKU dari 3 file master:
//   Harga AMPLOP JADI - Besar 1 Warna.xlsm / Besar FC.xlsm / Tgg FC.xlsm
//   (11. Pricelist Amplop/Source)
// Lapisan: Master (input) → BUKU (engine per tier pcs) → Harga_Final (output).
// Oplah Excel dalam PCS (BUKU!H7:H19 = 100..900, 1000, 2000, 3000, 5000).
// Terminologi 1:1 Excel: Insheet, Plate, Drek, Desain, Film, BTKL, BOP, Transp,
//   Print Ungu, Print Buya, Ryobi. Harga jual per PACK @100 pcs (BUKU!AP7/AQ7).

export type AmplopUkuran = '9,5 x 15,5' | '11 x 23';
export type AmplopMesin = 'Print Ungu' | 'Print Buya' | 'Ryobi';

export const AMPLOP_UKURAN: AmplopUkuran[] = ['9,5 x 15,5', '11 x 23'];
export const AMPLOP_MESIN: AmplopMesin[] = ['Print Ungu', 'Print Buya', 'Ryobi'];
export const AMPLOP_WARNA_OPTIONS = ['1 Warna', '2 Warna', '3 Warna', '4 Warna']; // Master!D14

export interface AmplopMasterParams {
  umr: number; // Master!D8 — informatif, tidak dipakai rumus BUKU
  hargaPackBesar: number; // Master!D12 cabang "11 x 23" (Ryobi)
  hargaPackTgg: number; // Master!D12 cabang "9,5 x 15,5" (Ryobi)
  insheetLembar: number; // Master!D13 — hidup hanya saat Tanggung (K2=0)
  desainStandar: number; // Master!D16 default (5000)
  desainBesarPrint: number; // Master!D16 file Besar FC (2500, Besar + Print Ungu/Buya)
  btklPct: number; // Master!D17 → BUKU!AF6
  bopPct: number; // Master!D18 → BUKU!AG6
  labaPct: number; // Master!E20 → BUKU!AL6
  tarifPrintUnguBesar: number; // BUKU!P2 cabang Besar + Print Ungu
  tarifPrintBuyaBesar: number; // BUKU!P2 cabang Besar + Print Buya
  tarifPrintUnguTgg: number; // BUKU!P2 cabang Tgg + Print Ungu
  tarifPrintBuyaTgg: number; // BUKU!P2 cabang Tgg + Print Buya
  platOverride: number; // BUKU!V6 (0 = otomatis = jumlah warna)
  transportPerOrder: number; // BUKU!AE6 (0; berlaku 500≤H<1000)
}

export const DEFAULT_AMPLOP_PARAMS: AmplopMasterParams = {
  umr: 2818585,
  hargaPackBesar: 25000,
  hargaPackTgg: 15800,
  insheetLembar: 0,
  desainStandar: 5000,
  desainBesarPrint: 2500,
  btklPct: 20,
  bopPct: 10,
  labaPct: 30,
  tarifPrintUnguBesar: 55000,
  tarifPrintBuyaBesar: 50000,
  tarifPrintUnguTgg: 35000,
  tarifPrintBuyaTgg: 35000,
  platOverride: 0,
  transportPerOrder: 0,
};

// Master!D6 label produk per ukuran (gramatur hardcode "80 gsm" di rumus Excel)
export const AMPLOP_PRODUK_LABEL: Record<AmplopUkuran, string> = {
  '9,5 x 15,5': 'Amplop Kabinet Putih Tanggung 80 gsm',
  '11 x 23': 'Amplop Kabinet Putih Besar 80 gsm',
};

export const AMPLOP_TIERS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 5000]; // BUKU!H7:H19

export interface AmplopSimulatorInput {
  oplahPcs: number; // BUKU!H
  ukuran: AmplopUkuran; // Master!D5 (= A02.Ukuran)
  nWarna: 1 | 2 | 3 | 4; // Master!D14 → BUKU!L7/V2
  mesin: AmplopMesin; // Master!D15
  insheetLembar: number; // Master!D13 (dipakai hanya bila Tanggung)
  desain: number; // Master!D16 (default ikut file per kombinasi)
  marginPct: number; // override BUKU!AL6 (= Master!E20)
}

export interface AmplopBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface AmplopSimulatorResult {
  input: AmplopSimulatorInput;
  breakdown: AmplopBreakdownItem[];
  insheetPakai: number; // BUKU!K7
  kebutuhanPcs: number; // BUKU!N7 (= M7)
  totalHpp: number; // BUKU!AI7
  hppPerPcs: number; // BUKU!AJ7
  hppPerPack: number; // BUKU!AK7
  labaPerPcs: number; // BUKU!AL7
  labaTotal: number; // BUKU!AM7
  totalHarga: number; // BUKU!AN7
  hargaPerPcs: number; // BUKU!AO7
  hargaPerPack: number; // BUKU!AP7
  hargaFinalPerPack: number; // BUKU!AQ7
  marginPct: number;
}

// Default desain mengikuti file (jawaban STOP&ASK): Besar + Print = 2500, sisanya 5000
export function desainDefaultForSpec(ukuran: AmplopUkuran, mesin: AmplopMesin, p: AmplopMasterParams): number {
  return ukuran === '11 x 23' && mesin !== 'Ryobi' ? p.desainBesarPrint : p.desainStandar;
}

export function calculateAmplopHpp(
  input: AmplopSimulatorInput,
  rawParams: AmplopMasterParams = DEFAULT_AMPLOP_PARAMS
): AmplopSimulatorResult {
  const p: AmplopMasterParams = { ...DEFAULT_AMPLOP_PARAMS, ...(rawParams || {}) };
  const { oplahPcs, ukuran, nWarna, mesin, insheetLembar, desain, marginPct } = input;
  const H = Math.max(1, oplahPcs);
  const isBesar = ukuran === '11 x 23';
  const isRyobi = mesin === 'Ryobi';

  const breakdown: AmplopBreakdownItem[] = [];
  let totalHpp = 0;
  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal * 100) / 100, pct: 0, keterangan });
    totalHpp += nominal;
  };

  // BUKU!K2 = IF(ukuran Besar, 3%, 0) — BUKU!K7 = IF(K2>0, K2*H, K6=D13)
  const K2 = isBesar ? 0.03 : 0; // BUKU!K2
  const K7 = K2 > 0 ? K2 * H : insheetLembar; // BUKU!K7
  // BUKU!N7 = H7+K7 — BUKU!M7 = N7 (C6 = 1)
  const N7 = H + K7; // BUKU!N7
  // BUKU!P7: Ryobi → (N7/100)*D12 ; Print → (N7/100)*P2
  const tarifPackRyobi = isBesar ? p.hargaPackBesar : p.hargaPackTgg; // Master!D12
  const tarifPackPrint = // BUKU!P2
    isBesar
      ? (mesin === 'Print Ungu' ? p.tarifPrintUnguBesar : p.tarifPrintBuyaBesar)
      : (mesin === 'Print Ungu' ? p.tarifPrintUnguTgg : p.tarifPrintBuyaTgg);
  const P7 = (N7 / 100) * (isRyobi ? tarifPackRyobi : tarifPackPrint);
  add(isRyobi ? 'Kertas Amplop Jadi' : 'Cetak Print per Pack', P7,
    `(${N7.toLocaleString('id-ID')}/100) × Rp ${(isRyobi ? tarifPackRyobi : tarifPackPrint).toLocaleString('id-ID')} (${mesin})`);
  // BUKU!R7 = IF(H>=1000, 0, IF(H<1000, R6=D16, 0))
  const R7 = H >= 1000 ? 0 : desain; // BUKU!R7 (H>0 selalu benar untuk H≥1)
  add('Desain', R7, H < 1000 ? `Master!D16 Rp ${desain.toLocaleString('id-ID')}` : 'H ≥ 1000 → 0');
  // BUKU!V7 = IF(V6>0, V6, V2=nWarna) — BUKU!U7 = U6*V7, U6 = 10000 (Ryobi) else 0
  const V7 = p.platOverride > 0 ? p.platOverride : nWarna; // BUKU!V7
  const U6 = isRyobi ? 10000 : 0; // BUKU!U6 = IF(D15 Ryobi, 10000, 0)
  add('Plate', U6 * V7, `${V7} plat × Rp ${U6.toLocaleString('id-ID')} (${mesin})`);
  // BUKU!Z7 = X7*V7 (X6 = 15000 Ryobi else 0) — BUKU!AA7 over = M7-500 (>1, Ryobi)
  // BUKU!AB7 = AA7*Y7*V7 (Y7 drek 30 Ryobi) — BUKU!AC7 = AB7+Z7 (Ryobi; Print → 0)
  const X7 = isRyobi ? 15000 : 0; // BUKU!X6
  const Z7 = X7 * V7; // BUKU!Z7
  const AA7 = isRyobi && N7 - 500 > 1 ? N7 - 500 : 0; // BUKU!AA7 (M7 = N7)
  const Y7 = isRyobi ? 30 : 0; // BUKU!Y7 drek
  const AB7 = (AA7 === 0 ? 0 : (AA7 > 1 ? AA7 : 0)) * Y7 * V7; // BUKU!AB7
  add('Ongkos Cetak Min Order', Z7, `${V7} plat × Rp ${X7.toLocaleString('id-ID')} (≤500)`);
  add('Ongkos Cetak Over', AB7, AA7 > 0 ? `${AA7} × Rp ${Y7}/drek × ${V7} plat` : 'M ≤ 500 → 0');
  // BUKU!AE7 = IF(H>=1000, 0, IF(H<500, 0, IF(H<1000, AE6, 0)))
  const AE7 = H >= 1000 ? 0 : (H < 500 ? 0 : p.transportPerOrder); // BUKU!AE7
  add('Transport', AE7, '500 ≤ H < 1000 → AE6, sisanya 0');
  // BUKU!AF7/AG7 = (Ryobi & H≥1000) ? (AC+U+R+P)*BTKL/BOP% : 0 ; (Ryobi & H<1000) → 0
  const dasarOverhead = (AB7 + Z7) + U6 * V7 + R7 + P7; // AC7+U7+R7+P7
  const AF7 = isRyobi && H >= 1000 ? dasarOverhead * (p.btklPct / 100) : 0; // BUKU!AF7 BTKL
  const AG7 = isRyobi && H >= 1000 ? dasarOverhead * (p.bopPct / 100) : 0; // BUKU!AG7 BOP
  add(`BTKL ${p.btklPct}%`, AF7, isRyobi && H >= 1000 ? `${p.btklPct}% × (cetak+plate+desain+kertas)` : 'Ryobi & H ≥ 1000 saja');
  add(`BOP ${p.bopPct}%`, AG7, isRyobi && H >= 1000 ? `${p.bopPct}% × (cetak+plate+desain+kertas)` : 'Ryobi & H ≥ 1000 saja');

  breakdown.forEach((b) => { b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0; });

  // BUKU!AI7 = AG+AF+AE+AC+U+R+P — AJ7 = AI/H — AK7 = AI/(H/100)
  // BUKU!AL7 = AJ*(AL6/100) — AM7 = AL*H — AN7 = (AJ+AL)*H
  // BUKU!AO7 = AN/H — AP7 = AN/(H/100) — AQ7 = ROUNDUP(AP7, AR7=0)
  const AI7 = totalHpp;
  const AJ7 = AI7 / H;
  const AK7 = AI7 / (H / 100);
  const AL7 = AJ7 * (marginPct / 100);
  const AM7 = AL7 * H;
  const AN7 = (AJ7 + AL7) * H;
  const AO7 = AN7 / H;
  const AP7 = AN7 / (H / 100);
  const AQ7 = Math.ceil(AP7); // BUKU!AQ7 = ROUNDUP(AP7, AR7=0), AP7 > 0 selalu = ROUNDUP(AP7, 0)

  return {
    input,
    breakdown,
    insheetPakai: K7,
    kebutuhanPcs: N7,
    totalHpp: AI7,
    hppPerPcs: AJ7,
    hppPerPack: AK7,
    labaPerPcs: AL7,
    labaTotal: AM7,
    totalHarga: AN7,
    hargaPerPcs: AO7,
    hargaPerPack: AP7,
    hargaFinalPerPack: AQ7,
    marginPct: marginPct / 100,
  };
}

export type SavedAmplopSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: AmplopSimulatorResult;
  paramsSnapshot?: AmplopMasterParams;
};
