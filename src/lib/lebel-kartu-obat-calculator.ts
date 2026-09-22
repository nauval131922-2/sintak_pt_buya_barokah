// Kalkulator murni Lebel Kartu Obat — direct binding 1:1 ke Source Excel.
// Sumber: 16. Pricelist Lebel Kartu Obat/Source/Pricelist LABEL OBAT - {3,5 x 7 / 4 x 6 / 5 x 6,7} cm.xlsm
// Struktur tiap file: sheet Master (A3:F23, input) + sheet BUKU (A1:AS39, engine 10 tier rim H7:H16 + harga AR7:AR16).
// Ketiga file klon identik (nilai, rumus, tier, harga) — ukuran label tidak memengaruhi biaya.
// Setiap rumus mencantumkan alamat cell Excel aslinya.
// Mati di Excel (terbukti tak direferensikan rumus mana pun, didokumentasikan di Manual, TIDAK jadi parameter):
// Master!D8 UMR, BUKU!U6 Film (=0) + BUKU!T29, BUKU!X6 (=0), BUKU!C6.

export type LebelKartuObatJenisCetakType = 'CETAK' | 'ONGKOS CETAK'; // Master!D10
export type LebelKartuObatMukaType = '1 Muka' | '2 Muka'; // Master!D18
export type LebelKartuObatWarnaType = '1 Warna' | '2 Warna' | '3 Warna' | '4 Warna'; // Master!D17
export type LebelKartuObatFinishingType = 'SISIR' | 'TANPA SISIR'; // Master!D20

export const LEBEL_KARTU_OBAT_JENIS_CETAK_OPTIONS: LebelKartuObatJenisCetakType[] = ['CETAK', 'ONGKOS CETAK'];
export const LEBEL_KARTU_OBAT_MUKA_OPTIONS: LebelKartuObatMukaType[] = ['1 Muka', '2 Muka'];
export const LEBEL_KARTU_OBAT_WARNA_OPTIONS: LebelKartuObatWarnaType[] = ['1 Warna', '2 Warna', '3 Warna', '4 Warna'];
export const LEBEL_KARTU_OBAT_FINISHING_OPTIONS: LebelKartuObatFinishingType[] = ['SISIR', 'TANPA SISIR'];

export interface LebelKartuObatMasterParams {
  tarifKertasKg: number; // Master!D13 harga/kg HVS (Rp) — 15700
  upKertasPct: number; // Master!E13 up kertas (%) — 5
  gramaturGsm: number; // Master!D12 -> BUKU!U27 gramatur angka (opsi 55–160) — 70
  insheetLbr: number; // Master!D15 Insheet Lbr Cetak -> BUKU!K6 (lbr) — 30
  tarifDesain: number; // Master!D16 Desain (Rp/order) — 10000
  tarifPlatePerPlat: number; // BUKU!W6 CETAK (Rp/plat) — 10000 (0 saat ONGKOS CETAK via jenis)
  tarifCetakMinPerPlat: number; // BUKU!Z6 min order (Rp/plat) — 15000 (sama untuk CETAK & ONGKOS CETAK)
  tarifDrekPerWarna: number; // BUKU!AA7 per drek (Rp) — 30 (sama untuk CETAK & ONGKOS CETAK)
  tarifRoyaltyPerPcs: number; // BUKU!AG6 Royalty (Rp/rim) — 0
  biayaTransport: number; // BUKU!AI6 Transp (Rp/order) — 0 (BUKU!AI7 = AI6 tanpa gate H)
  tarifSisirPer500: number; // BUKU!AJ6 Sisir (Rp/500 lbr) — 10000, aktif saat D20=SISIR
  marginDefaultPct: number; // Master!E21 Laba (%) — 30
}

export const DEFAULT_LEBEL_KARTU_OBAT_PARAMS: LebelKartuObatMasterParams = {
  tarifKertasKg: 15700,
  upKertasPct: 5,
  gramaturGsm: 70,
  insheetLbr: 30,
  tarifDesain: 10000,
  tarifPlatePerPlat: 10000,
  tarifCetakMinPerPlat: 15000,
  tarifDrekPerWarna: 30,
  tarifRoyaltyPerPcs: 0,
  biayaTransport: 0,
  tarifSisirPer500: 10000,
  marginDefaultPct: 30,
};

export type LebelKartuObatVarianType = '3,5 x 7 cm' | '4 x 6 cm' | '5 x 6,7 cm';

export const LEBEL_KARTU_OBAT_VARIANTS: LebelKartuObatVarianType[] = ['3,5 x 7 cm', '4 x 6 cm', '5 x 6,7 cm'];

// Konstanta per-file (satu file = satu varian). Dikutip dari BUKU!N6/O6/T26/U26 masing-masing file Source.
// Nilai identik di ketiga file — tetap diikat per varian agar provenance 1:1 terjaga.
export const LEBEL_KARTU_OBAT_CONFIG: Record<LebelKartuObatVarianType, {
  potongPerPlano: number; // BUKU!N6
  kopPerArea: number; // BUKU!O6
  planoW: number; // BUKU!T26 lebar folio (cm)
  planoH: number; // BUKU!U26 panjang folio (cm)
  description: string;
}> = {
  '3,5 x 7 cm': {
    potongPerPlano: 1, kopPerArea: 1, planoW: 21.5, planoH: 33,
    description: '3,5 × 7 cm · HVS 70 gsm 1 Warna 1 Muka · Folio 21,5×33 cm · Sisir + Packing',
  },
  '4 x 6 cm': {
    potongPerPlano: 1, kopPerArea: 1, planoW: 21.5, planoH: 33,
    description: '4 × 6 cm · HVS 70 gsm 1 Warna 1 Muka · Folio 21,5×33 cm · Sisir + Packing',
  },
  '5 x 6,7 cm': {
    potongPerPlano: 1, kopPerArea: 1, planoW: 21.5, planoH: 33,
    description: '5 × 6,7 cm · HVS 70 gsm 1 Warna 1 Muka · Folio 21,5×33 cm · Sisir + Packing',
  },
};

// BUKU!H7:H16 — tier oplah rim bawaan ketiga file (identik).
export const LEBEL_KARTU_OBAT_TIERS: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export interface LebelKartuObatSimulatorInput {
  oplah: number; // rim (1 rim = 500 lbr) — BUKU!H
  varian: LebelKartuObatVarianType; // Master!D6
  jenisCetak: LebelKartuObatJenisCetakType; // Master!D10
  muka: LebelKartuObatMukaType; // Master!D18
  warna: LebelKartuObatWarnaType; // Master!D17
  finishing: LebelKartuObatFinishingType; // Master!D20
  marginPct: number; // Master!E21
}

export interface LebelKartuObatBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface LebelKartuObatSimulatorResult {
  input: LebelKartuObatSimulatorInput;
  breakdown: LebelKartuObatBreakdownItem[];
  kebutuhanPlano: number; // BUKU!Q7 lbr plano
  kebutuhanCetak: number; // BUKU!P7
  totalHpp: number; // BUKU!AL7
  hppPerRim: number; // BUKU!AM7
  hppPerPcs: number; // turunan SINTAK: hppPerRim/500 (tidak ada di Excel)
  hargaJualPerRim: number; // BUKU!AR7
  totalHargaJual: number; // BUKU!AP7
  profitPerRim: number;
  profitTotal: number;
  marginPct: number;
}

const mukaCount = (m: LebelKartuObatMukaType): number => (m === '1 Muka' ? 1 : m === '2 Muka' ? 2 : 0); // BUKU!M6
const warnaCount = (w: LebelKartuObatWarnaType): number => // BUKU!L6
  (w === '1 Warna' ? 1 : w === '2 Warna' ? 2 : w === '3 Warna' ? 3 : w === '4 Warna' ? 4 : 0);

export function calculateLebelKartuObatHpp(
  input: LebelKartuObatSimulatorInput,
  rawParams: LebelKartuObatMasterParams = DEFAULT_LEBEL_KARTU_OBAT_PARAMS
): LebelKartuObatSimulatorResult {
  const p: LebelKartuObatMasterParams = { ...DEFAULT_LEBEL_KARTU_OBAT_PARAMS, ...(rawParams || {}) };
  const { oplah, varian, jenisCetak, muka, warna, finishing, marginPct } = input;
  void varian;
  const H = Math.max(0, Math.round(oplah));
  const cfg = LEBEL_KARTU_OBAT_CONFIG[input.varian];
  const ongkosOnly = jenisCetak === 'ONGKOS CETAK';
  const M = mukaCount(muka); // BUKU!M6
  const L = warnaCount(warna); // BUKU!L6

  const breakdown: LebelKartuObatBreakdownItem[] = [];
  let totalHpp = 0;
  const add = (nama: string, nominal: number, keterangan = '') => {
    if (!(nominal > 0)) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // BUKU!K7 =IF(H>0,K6,0); BUKU!Q7 =IF(H>0,((H*500)/O)+(K/N),0) — tanpa ROUNDUP
  const K = H > 0 ? p.insheetLbr : 0;
  const N = cfg.potongPerPlano; // BUKU!N7
  const O = cfg.kopPerArea; // BUKU!O7
  const Q = H > 0 ? ((H * 500) / O) + (K / N) : 0;
  const P = N * Q; // BUKU!P7

  // BUKU!U28 harga/rim =((T26*U26)*U27)/20000*((U29*W29)+U29); BUKU!R7 =(U28/500)*Q
  const hargaRim = ((cfg.planoW * cfg.planoH) * p.gramaturGsm) / 20000 * (p.tarifKertasKg * (1 + p.upKertasPct / 100));
  add('Kertas HVS 70 gsm Folio', (hargaRim / 500) * Q,
    `BUKU!R7: ${Q} lbr × Rp ${(hargaRim / 500).toFixed(2)} (rim Rp ${Math.round(hargaRim).toLocaleString('id-ID')}/500)`);

  // BUKU!T7 =IF(H>0,T6,0); BUKU!T6 =Master!D16
  add('Desain', H > 0 ? p.tarifDesain : 0, `BUKU!T7: Rp ${p.tarifDesain.toLocaleString('id-ID')}/order`);

  // BUKU!X7 =IF(X6>0,X6,IF(X6<=0,L6*M6,0)) — X6=0 konstanta mati → X7 = warna×muka
  const jmlPlat = L * M;
  // BUKU!W7 =IF(H>0,W6*X7,0); W6 = 0 saat ONGKOS CETAK, 10000 saat CETAK
  add('Plate Cetak', H > 0 ? (ongkosOnly ? 0 : p.tarifPlatePerPlat) * jmlPlat : 0,
    `BUKU!W7: ${jmlPlat} plat × Rp ${(ongkosOnly ? 0 : p.tarifPlatePerPlat).toLocaleString('id-ID')} (${jenisCetak})`);

  // BUKU!Z7 =IF(H>0,Z6,0); BUKU!AB7 =X7*Z7; Z6 = 15000 untuk CETAK & ONGKOS CETAK
  const minOrder = H > 0 ? p.tarifCetakMinPerPlat * jmlPlat : 0;
  // BUKU!AC7 =IF(P-500=0,0,IF(P-500>=1,P-500,0))
  const overDrek = P - 500 === 0 ? 0 : P - 500 >= 1 ? P - 500 : 0;
  // BUKU!AD7 =IF(AC=0,0,IF(AC>=1,AC*AA7*X7,0)) — pengali JUMLAH PLAT, bukan warna
  const overRp = overDrek === 0 ? 0 : overDrek >= 1 ? overDrek * p.tarifDrekPerWarna * jmlPlat : 0;
  // BUKU!AE7 =AD7+AB7
  add('Cetak ' + jenisCetak, minOrder + overRp,
    `BUKU!AE7: min Rp ${Math.round(minOrder).toLocaleString('id-ID')} + over ${overDrek}×Rp ${p.tarifDrekPerWarna}×${jmlPlat} plat (P=${P})`);

  // BUKU!AG7 =H*AG6 (royalty); BUKU!AI7 =AI6 tanpa gate H (transport)
  if (H * p.tarifRoyaltyPerPcs > 0) add('Royalty', H * p.tarifRoyaltyPerPcs, `BUKU!AG7: ${H} × Rp ${p.tarifRoyaltyPerPcs}`);
  if (p.biayaTransport > 0) add('Transport', p.biayaTransport, 'BUKU!AI7 = AI6');

  // BUKU!AJ7 =IF(D20=SISIR,(Q/500)*AJ6,0)
  add('Sisir', finishing === 'SISIR' ? (Q / 500) * p.tarifSisirPer500 : 0,
    `BUKU!AJ7: ${Q}/500 × Rp ${p.tarifSisirPer500.toLocaleString('id-ID')} (${finishing})`);

  breakdown.forEach((b) => { b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0; });

  // BUKU!AL7 =SUM(R+T+W+AE+AG+AI+AJ) — dijumlah via add() di atas (urutan sama)
  // BUKU!AM7 =AL/H; BUKU!AN7 =AM*(E21%); BUKU!AP7 =(AM+AN)*H; BUKU!AQ7 =AP/H; BUKU!AR7 =ROUNDUP(AQ,-1)
  const hppPerRim = H > 0 ? totalHpp / H : 0;
  const labaPerRim = hppPerRim * (marginPct / 100);
  const totalHargaJual = Math.round((hppPerRim + labaPerRim) * H);
  const hargaJualPerRim = H > 0 ? Math.ceil((hppPerRim + labaPerRim) / 10) * 10 : 0;
  const profitPerRim = hargaJualPerRim - hppPerRim;

  return {
    input,
    breakdown,
    kebutuhanPlano: Q,
    kebutuhanCetak: P,
    totalHpp: Math.round(totalHpp),
    hppPerRim,
    hppPerPcs: hppPerRim / 500,
    hargaJualPerRim,
    totalHargaJual,
    profitPerRim,
    profitTotal: totalHargaJual - Math.round(totalHpp),
    marginPct: hargaJualPerRim > 0 ? profitPerRim / hargaJualPerRim : 0,
  };
}

export type SavedLebelKartuObatSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: LebelKartuObatSimulatorResult;
  paramsSnapshot?: LebelKartuObatMasterParams;
};
