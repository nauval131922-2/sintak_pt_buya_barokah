// ============================================================================
// KALKULATOR & MASTER PARAMETER RAPORT KALEB (09. Pricelist Raport Kaleb)
// 1:1 DIRECT BINDING KE EXCEL MASTER BUYA BAROKAH:
// 1. Source/Pricelist RAPORT KALEB - kosongan.xlsm (Sheet Master & BUKU)
// 2. Source/Pricelist RAPORT KALEB - isi 6.xlsm (Sheet Master & BUKU)
// 3. Pricelist Raport Kaleb.xlsx (Sheet HARGA JULI 2026 & Source Buku Tulis)
// ============================================================================

export interface RaportKalebMasterParams {
  // A. Bahan Map Kaleb & Isi Mika (Master!D12, Master!E12, Master!D13)
  hargaMapKosongan: number;         // Master!D12 = Rp 16.000 (Harga dasar map kosongan)
  upMapKosonganPct: number;         // Master!E12 = 0% (Markup kertas map)
  hargaIsiPerLbr: number;           // Master!D13 = Rp 900 (Harga isi kantong mika per lembar)

  // B. Setting Desain & Klise Foil Emas (Master!D14, Master!D15, BUKU!P7)
  tarifDesign: number;              // Master!D14 = Rp 10.000 (Biaya setting desain per order)
  tarifKlise: number;               // Master!D15 = Rp 350.000 (Biaya klise foil untuk oplah <= 120 pcs)
  batasOplahKlise: number;          // BUKU!P7 = 120 (Batas oplah toleransi klise gratis jika > 120 pcs)

  // C. Packing Kardus & Lakban (Master!D17, Master!D18, BUKU!V35, BUKU!W30, BUKU!V6)
  tarifLakbanRoll: number;          // Master!D17 = Rp 8.000 (Lakban transparan per roll)
  tarifKardusBox: number;           // Master!D18 = Rp 8.500 (Kardus packing per box)
  kapasitasKardus: number;          // BUKU!V35 = 100 (1 box muat 100 map raport)
  cmPerRollLakban: number;          // BUKU!W30 = 7.650 cm per roll
  cmLakbanPerBox: number;           // BUKU!V6 = 196 cm lakban per kardus

  // D. Standar Margin & Penawaran (HARGA JULI 2026!S4, HARGA JULI 2026!T4, HARGA JULI 2026!B11)
  marginDefaultPct: number;         // HARGA JULI 2026!S4 = 25% (Margin default)
  negoDefaultPct: number;           // HARGA JULI 2026!T4 = 4% (Nego default)
  tarifPenambahanIsiPricelist: number; // HARGA JULI 2026!B11 = Rp 1.200 (Tarif penambahan isi eceran pricelist)

  // Kompatibilitas Sinkronisasi Global Master
  tarifKertasKalebKg?: number;      // Deprecated alias kompatibilitas
  upKertasPct?: number;             // Deprecated alias kompatibilitas
  tarifPrintA3?: number;            // Deprecated alias kompatibilitas
  tarifFoilPerPcs?: number;         // Deprecated alias kompatibilitas
  tarifSisir?: number;              // Deprecated alias kompatibilitas
  tarifKardus?: number;             // Deprecated alias kompatibilitas (alias tarifKardusBox)
  tarifIsiPerLbr?: number;          // Deprecated alias kompatibilitas (alias hargaIsiPerLbr)
}

export const DEFAULT_RAPORT_KALEB_PARAMS: RaportKalebMasterParams = {
  // A. Bahan Map & Isi Mika
  hargaMapKosongan: 16000,
  upMapKosonganPct: 0,
  hargaIsiPerLbr: 900,

  // B. Desain & Klise Foil
  tarifDesign: 10000,
  tarifKlise: 350000,
  batasOplahKlise: 120,

  // C. Packing Kardus & Lakban
  tarifLakbanRoll: 8000,
  tarifKardusBox: 8500,
  kapasitasKardus: 100,
  cmPerRollLakban: 7650,
  cmLakbanPerBox: 196,

  // D. Standar Margin & Penawaran
  marginDefaultPct: 25,
  negoDefaultPct: 4,
  tarifPenambahanIsiPricelist: 1200,

  // Kompatibilitas cadangan
  tarifKertasKalebKg: 16400,
  upKertasPct: 5,
  tarifPrintA3: 2500,
  tarifFoilPerPcs: 450,
  tarifSisir: 150,
  tarifKardus: 8500,
  tarifIsiPerLbr: 900,
};

export type RaportKalebVarianType =
  | 'Kosongan'
  | 'Isi 4'
  | 'Isi 6'
  | 'Isi 8'
  | 'Isi 10'
  | 'Isi 12';

export type RaportKalebUkuranType = '24 x 34 cm';

export const RAPORT_KALEB_VARIANTS: RaportKalebVarianType[] = [
  'Kosongan',
  'Isi 4',
  'Isi 6',
  'Isi 8',
  'Isi 10',
  'Isi 12',
];

export const RAPORT_KALEB_CONFIG: Record<
  RaportKalebVarianType,
  {
    w: number;
    h: number;
    jumlahIsi: number;
    description: string;
  }
> = {
  Kosongan: {
    w: 24,
    h: 34,
    jumlahIsi: 0,
    description: 'Ukuran 24 x 34 cm (Tertutup) · Bahan Kaleb Foil Emas · Tanpa Lembar Mika (Kosongan)',
  },
  'Isi 4': {
    w: 24,
    h: 34,
    jumlahIsi: 4,
    description: 'Ukuran 24 x 34 cm (Tertutup) · Bahan Kaleb Foil Emas · Isi 4 Lembar Mika Lampiran',
  },
  'Isi 6': {
    w: 24,
    h: 34,
    jumlahIsi: 6,
    description: 'Ukuran 24 x 34 cm (Tertutup) · Bahan Kaleb Foil Emas · Isi 6 Lembar Mika Lampiran',
  },
  'Isi 8': {
    w: 24,
    h: 34,
    jumlahIsi: 8,
    description: 'Ukuran 24 x 34 cm (Tertutup) · Bahan Kaleb Foil Emas · Isi 8 Lembar Mika Lampiran',
  },
  'Isi 10': {
    w: 24,
    h: 34,
    jumlahIsi: 10,
    description: 'Ukuran 24 x 34 cm (Tertutup) · Bahan Kaleb Foil Emas · Isi 10 Lembar Mika Lampiran',
  },
  'Isi 12': {
    w: 24,
    h: 34,
    jumlahIsi: 12,
    description: 'Ukuran 24 x 34 cm (Tertutup) · Bahan Kaleb Foil Emas · Isi 12 Lembar Mika Lampiran',
  },
};

// 18 Tiers Oplah Master (BUKU!H7:H24 & HARGA JULI 2026!M4:M21)
export const RAPORT_KALEB_TIERS: number[] = [
  10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 250, 300, 400, 500, 1000,
];

export interface RaportKalebSimulatorInput {
  oplah: number;
  varian: RaportKalebVarianType;
  tambahanIsiLbr?: number;          // Penambahan kantong mika di luar varian
  opsiPacking?: boolean;            // BUKU!X6: Opsi kardus + lakban (default false / "X")
  marginPct: number;                // HARGA JULI 2026!S4 = 25% (atau BUKU!AB6 = 30%)
  negoDiskonPct: number;            // HARGA JULI 2026!T4 = 4%
}

export interface RaportKalebBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface RaportKalebSimulatorResult {
  input: RaportKalebSimulatorInput;
  breakdown: RaportKalebBreakdownItem[];
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

export function calculateRaportKalebHpp(
  input: RaportKalebSimulatorInput,
  rawParams: RaportKalebMasterParams = DEFAULT_RAPORT_KALEB_PARAMS
): RaportKalebSimulatorResult {
  const p: RaportKalebMasterParams = { ...DEFAULT_RAPORT_KALEB_PARAMS, ...(rawParams || {}) };
  const {
    oplah,
    varian,
    tambahanIsiLbr = 0,
    opsiPacking = false,
    marginPct,
    negoDiskonPct,
  } = input;

  const validOplah = Math.max(1, oplah);
  const cfg = RAPORT_KALEB_CONFIG[varian] || RAPORT_KALEB_CONFIG['Kosongan'];
  const totalLembarIsi = Math.max(0, cfg.jumlahIsi + (tambahanIsiLbr || 0));

  const breakdown: RaportKalebBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // -------------------------------------------------------------
  // 1. MAP RAPORT KALEB KOSONGAN (BUKU!K7)
  // BUKU!K7: =IF(A02.Ukuran="24 x 34", (H7 * ((Master!$D$12 * Master!$E$12) + Master!$D$12)), 0)
  // -------------------------------------------------------------
  const hargaMapSatuan = p.hargaMapKosongan * (1 + (p.upMapKosonganPct || 0) / 100);
  const biayaMapKosongan = validOplah * hargaMapSatuan;
  add(
    'Bahan Map Kaleb Standar (24×34 cm)',
    biayaMapKosongan,
    `${validOplah.toLocaleString('id-ID')} pcs × Rp ${Math.round(hargaMapSatuan).toLocaleString('id-ID')}${p.upMapKosonganPct > 0 ? ` (+${p.upMapKosonganPct}%)` : ''}`
  );

  // -------------------------------------------------------------
  // 2. KANTONG PLASTIK ISI MIKA RAPORT (BUKU!M7)
  // BUKU!M7: =(($M$6 * C7) * H7)
  // Dimana $M$6 = Master!D13 (Rp 900), C7 = total lembar mika, H7 = oplah
  // -------------------------------------------------------------
  if (totalLembarIsi > 0) {
    const tarifPerLbrMika = p.hargaIsiPerLbr ?? (p.tarifIsiPerLbr || 900);
    const biayaIsiMika = validOplah * totalLembarIsi * tarifPerLbrMika;
    const ketIsi =
      tambahanIsiLbr > 0
        ? `${validOplah.toLocaleString('id-ID')} pcs × ${totalLembarIsi} lbr (${cfg.jumlahIsi} varian + ${tambahanIsiLbr} custom) × Rp ${tarifPerLbrMika.toLocaleString('id-ID')}/lbr`
        : `${validOplah.toLocaleString('id-ID')} pcs × ${totalLembarIsi} lbr mika × Rp ${tarifPerLbrMika.toLocaleString('id-ID')}/lbr`;
    add('Kantong Plastik Isi Mika Raport', biayaIsiMika, ketIsi);
  }

  // -------------------------------------------------------------
  // 3. BIAYA SETTING DESAIN RAPORT (BUKU!N7)
  // BUKU!N7: =N6 = Master!D14 (Rp 10.000 per order)
  // -------------------------------------------------------------
  if (p.tarifDesign > 0) {
    add('Biaya Setting Desain Raport', p.tarifDesign, 'Master!D14: Biaya setting layout & teks map raport');
  }

  // -------------------------------------------------------------
  // 4. MATRES / KLISE FOIL EMAS (BUKU!P7)
  // BUKU!P7: =IF(H7 <= 120, $P$6, 0)
  // Dimana $P$6 = Master!D15 (Rp 350.000). Oplah <= 120 kena Rp 350.000, oplah > 120 GRATIS (Rp 0).
  // -------------------------------------------------------------
  const batasKlise = p.batasOplahKlise || 120;
  if (validOplah <= batasKlise && p.tarifKlise > 0) {
    add(
      'Klise Foil Emas (≤120 pcs)',
      p.tarifKlise,
      `BUKU!P7: Oplah ${validOplah} ≤ ${batasKlise} pcs kena biaya klise matres Rp ${p.tarifKlise.toLocaleString('id-ID')} (> ${batasKlise} pcs gratis)`
    );
  }

  // -------------------------------------------------------------
  // 5. PACKING KARDUS + LAKBAN (BUKU!X7)
  // BUKU!X7: =IF(AND(A02.Ukuran="24 x 34", $X$6="√"), ((H7 / $V$35) * $W$32) + W7, 0)
  // Dimana $V$35 = 100 (kapasitas/box), $W$32 = Rp 8.000, W7 = biaya lakban = $W$32 * ((H7 / 100) / (7650/196))
  // Default master: X6 = "X" (non-aktif / 0)
  // -------------------------------------------------------------
  if (opsiPacking) {
    const tarifKardus = p.tarifKardusBox ?? (p.tarifKardus || 8500);
    const kapasitas = p.kapasitasKardus || 100;
    const jmlBox = Math.ceil(validOplah / kapasitas);
    const rollLengthCm = p.cmPerRollLakban || 7650;
    const usagePerBoxCm = p.cmLakbanPerBox || 196;
    const rollPerBox = usagePerBoxCm / rollLengthCm;
    const kebutuhanLakbanRoll = (validOplah / kapasitas) * rollPerBox;
    const biayaLakban = kebutuhanLakbanRoll * p.tarifLakbanRoll;
    const biayaKardus = jmlBox * tarifKardus;
    const biayaPackingTotal = biayaKardus + biayaLakban;

    add(
      'Packing Kardus & Lakban',
      biayaPackingTotal,
      `BUKU!X7: ${jmlBox} box kardus (@ Rp ${tarifKardus.toLocaleString('id-ID')}) + ${kebutuhanLakbanRoll.toFixed(3)} roll lakban`
    );
  }

  // Hitung Porsi Persentase Tiap Komponen
  breakdown.forEach((b) => {
    b.pct = totalHpp > 0 ? (b.nominal / totalHpp) * 100 : 0;
  });

  // -------------------------------------------------------------
  // 6. TOTAL HPP & HARGA PENAWARAN (HARGA JULI 2026)
  // HPP/Pcs = Total HPP / Oplah (BUKU!AA7)
  // Harga Jual = ROUNDUP((HPP * (1 + Margin/100)), -2) (HARGA JULI 2026!O4)
  // Harga Nego = ROUNDUP(Harga Jual * (1 - Nego/100), -2) (HARGA JULI 2026!P4)
  // -------------------------------------------------------------
  const hppPerPcs = validOplah > 0 ? totalHpp / validOplah : 0;
  const targetMargin = marginPct !== undefined ? marginPct : (p.marginDefaultPct || 25);
  const targetNego = negoDiskonPct !== undefined ? negoDiskonPct : (p.negoDefaultPct || 4);

  // Pembulatan ke atas ratusan (ROUNDUP -2) persis Excel HARGA JULI 2026
  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + targetMargin / 100)) / 100) * 100;
  const hargaNegoPerPcs = Math.ceil((hargaJualPerPcs * (1 - targetNego / 100)) / 100) * 100;

  const totalHargaJual = Math.round(hargaJualPerPcs * validOplah);
  const totalHargaNego = Math.round(hargaNegoPerPcs * validOplah);

  const profitPerPcs = hargaJualPerPcs - hppPerPcs;
  const profitNegoPerPcs = hargaNegoPerPcs - hppPerPcs;
  const profitTotal = totalHargaJual - totalHpp;
  const profitNegoTotal = totalHargaNego - totalHpp;

  const marginPctActual = hargaJualPerPcs > 0 ? (profitPerPcs / hargaJualPerPcs) * 100 : 0;
  const marginNegoPct = hargaNegoPerPcs > 0 ? (profitNegoPerPcs / hargaNegoPerPcs) * 100 : 0;

  return {
    input,
    breakdown,
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

export type SavedRaportKalebSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: RaportKalebSimulatorResult;
  paramsSnapshot?: RaportKalebMasterParams;
};
