// ponytail: kalkulator dan master parameter Majalah 14,5 x 20,25 cm (20. Pricelist Majalah - 14,5 x 20,25 cm)
// Referensi: 20. Pricelist Majalah - 14,5 x 20,25 cm.xlsx sheets HARGA JULI 2026 + Source/*.xlsm
// Ukuran: 14,5 x 20,25 cm (tertutup), 32 Halaman (8 Lembar) bolak-balik
// Cover: Soft Cover | Art Carton 230 gsm | 1 Muka Full Colour
// Isi: Art Paper 120 gsm | Full Colour (32 Halaman)
// Finishing: Susun, Staples, Lipat, Sisir, Packing (+ Opsi Laminasi Glossy / Doff / UV Varnish / Lem Bending)
// Alur Proses Mesin:
// - Oplah 20–200: Cover Print (Print Inter A3+) - Isi Print (Print Inter A3+ FC 2 Muka)
// - Oplah 250–500: Cover Print (Print Inter A3+) - Isi Oliver (Offset Oliver 4 Warna)
// - Oplah 600–3000: Cover Oliver (Offset Oliver 4W) - Isi Oliver (Offset Oliver 4 Warna)

export interface MajalahMasterParams {
  // A. UMR & Acuan Upah
  umr: number;                       // Rp 2.818.850 / bulan (Rp 112.754 / hari)

  // B. Cover & Cetak Cover
  tarifPrintCoverA3: number;         // Rp 2.700 / lbr A3+ (Print Inter)
  tarifKertasAc230Kg: number;        // Rp 16.400 / kg
  tarifDesainCover: number;           // Rp 20.000 / order
  tarifPlateCoverOliver: number;     // Rp 45.000 / plat (4 plat = Rp 180.000)
  minOngkosCoverOliver: number;      // Rp 90.000 / plat (4 plat = Rp 360.000)
  drekCoverOliver: number;           // Rp 40 / drek (di atas 1000 drek)

  // C. Isi & Cetak Isi (Art Paper 120 gsm Full Colour)
  tarifKertasAp120Kg: number;        // Rp 17.400 / kg
  tarifDesainIsi: number;            // Rp 20.000 / order (8 unit × Rp 2.500)
  tarifPrintIsiA3: number;           // Rp 1.750 / sisi A3+ (Rp 3.500 / lbr 2 muka)
  tarifPlateIsiOliver: number;       // Rp 45.000 / plat (16 plat Oliver 4W)
  minOngkosIsiOliver: number;        // Rp 90.000 / plat
  drekIsiOliver: number;             // Rp 40 / drek (di atas 1000 drek)

  // D. Finishing & Kemasan Standar
  jasaFinishingStandar: number;      // Rp 140.9425 / pcs (model BNBO: UMR / 800)
  targetBN: number;                  // 800 (target susun staples lipat uk 14,5)
  targetLipat: number;               // 10.000
  targetSisip: number;               // 1.700
  targetSusunKomplit: number;        // 9.500
  targetKawatRoll: number;           // 25.500
  targetStiching: number;            // 10.000
  tarifKawatRoll: number;            // Rp 120.000 / roll
  tarifStaplesPcs: number;           // Rp 9 / pcs
  tarifSisirPcs: number;             // Rp 150 / pcs
  tarifKardusBox: number;            // Rp 8.500 / box (kapasitas 200 pcs)
  tarifLakbanRoll: number;           // Rp 8.000 / roll
  kardusIsi: number;                 // 200 pcs / box

  // E. Finishing Tambahan (Laminasi & Bending)
  tarifLaminasiGlossyCm2: number;    // Rp 0.35 / cm²
  tarifLaminasiDoffCm2: number;      // Rp 0.40 / cm²
  tarifUvVarnishCm2: number;         // Rp 0.11 / cm²
  minLaminasi: number;               // Rp 50.000 / order
  tarifBendingPerCm: number;         // Rp 50 / cm
  minBending: number;                // Rp 100.000 / order

  // F. Margin & Nego Standar
  marginDefaultPct: number;          // 30% (ROUNDUP(HPP * 1.30, -1))
  negoDefaultPct: number;            // 5% (ROUNDUP(Harga * 0.95, -1))
}

export const DEFAULT_MAJALAH_PARAMS: MajalahMasterParams = {
  umr: 2818850,

  tarifPrintCoverA3: 2700,
  tarifKertasAc230Kg: 16400,
  tarifDesainCover: 20000,
  tarifPlateCoverOliver: 45000,
  minOngkosCoverOliver: 90000,
  drekCoverOliver: 40,

  tarifKertasAp120Kg: 17400,
  tarifDesainIsi: 20000,
  tarifPrintIsiA3: 1750,
  tarifPlateIsiOliver: 45000,
  minOngkosIsiOliver: 90000,
  drekIsiOliver: 40,

  jasaFinishingStandar: 140.9425,
  targetBN: 800,
  targetLipat: 10000,
  targetSisip: 1700,
  targetSusunKomplit: 9500,
  targetKawatRoll: 25500,
  targetStiching: 10000,
  tarifKawatRoll: 120000,
  tarifStaplesPcs: 9,
  tarifSisirPcs: 150,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,
  kardusIsi: 200,

  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  tarifUvVarnishCm2: 0.11,
  minLaminasi: 50000,
  tarifBendingPerCm: 50,
  minBending: 100000,

  marginDefaultPct: 30,
  negoDefaultPct: 5,
};

export const MAJALAH_TIERS = [
  20, 30, 50, 60, 100, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800,
  900, 1000, 1500, 2000, 3000,
];

export type MajalahFinishingOption =
  | 'Tanpa Laminasi'
  | 'Laminasi Glossy'
  | 'Laminasi Doff'
  | 'UV Varnish';

export type MajalahJilidOption = 'Staples Tengah' | 'Lem Bending';

export interface MajalahSimulatorInput {
  oplah: number;
  finishing: MajalahFinishingOption;
  jilid: MajalahJilidOption;
  marginPct: number;
  negoDiskonPct: number;
}

export interface MajalahSimulatorResult {
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
  totalHpp: number;
  prosesCetak: string;
  areaCoverCm2: number;
  input: MajalahSimulatorInput;
  breakdown: {
    no: number;
    komponen: string;
    keterangan: string;
    biaya: number;
    porsiPct: number;
  }[];
}

export function getProsesCetakMajalah(oplah: number): string {
  if (oplah <= 200) return 'Cover Print - Isi Print';
  if (oplah <= 500) return 'Cover Print - Isi Oliver';
  return 'Cover Oliver - Isi Oliver';
}

export function calculateMajalahSimulator(
  input: MajalahSimulatorInput,
  customParams?: Partial<MajalahMasterParams>
): MajalahSimulatorResult {
  const p: MajalahMasterParams = {
    ...DEFAULT_MAJALAH_PARAMS,
    ...customParams,
  };

  const oplah = Math.max(1, input.oplah);
  const H = oplah;
  const proses = getProsesCetakMajalah(H);
  const uh = p.umr / 25; // Rp 112.754 per hari

  // 1. COVER & CETAK COVER
  let biayaKertasCover = 0;
  let ketKertasCover = '';
  let biayaPlatCover = 0;
  let ketPlatCover = '';
  let biayaOngkosCover = 0;
  let ketOngkosCover = '';

  const biayaDesainCover = H > 0 ? p.tarifDesainCover : 0;

  if (H <= 500) {
    // Print Inter A3+ (Oplah 20–500)
    // 1 Plano muat 2 lembar A3+; Insheet 10 lembar
    const R = Math.ceil(H / 2 + 10);
    biayaKertasCover = R * p.tarifPrintCoverA3;
    ketKertasCover = `Print Inter A3+: ${R} lbr × Rp ${p.tarifPrintCoverA3.toLocaleString('id-ID')}`;
    ketPlatCover = 'Digital (Tanpa Plat)';
    ketOngkosCover = 'Termasuk di biaya print';
  } else {
    // Offset Oliver 4W (Oplah 600–3000)
    // Plano 65 × 100 cm, AC 230 gsm
    const rimCover = ((65 * 100 * 230) / 20000) * p.tarifKertasAc230Kg;
    const R = Math.ceil(H / 8 + 100 / 4); // 8 cover per plano, insheet 100 plano potong 4
    biayaKertasCover = (R / 500) * rimCover;
    ketKertasCover = `Art Carton 230: ${R} plano × Rp ${Math.round(rimCover / 500).toLocaleString('id-ID')}`;

    biayaPlatCover = 4 * p.tarifPlateCoverOliver;
    ketPlatCover = `4 Plat Oliver × Rp ${p.tarifPlateCoverOliver.toLocaleString('id-ID')}`;

    const overCover = Math.max(0, R * 4 - 1000);
    biayaOngkosCover = 4 * p.minOngkosCoverOliver + overCover * p.drekCoverOliver * 4;
    ketOngkosCover = `Min ongkos 4 plat + over ${overCover} drek`;
  }

  // 2. ISI & CETAK ISI
  let biayaKertasIsi = 0;
  let ketKertasIsi = '';
  let biayaPlatIsi = 0;
  let ketPlatIsi = '';
  let biayaOngkosIsi = 0;
  let ketOngkosIsi = '';

  const biayaDesainIsi = H > 0 ? p.tarifDesainIsi : 0;

  if (H <= 200) {
    // Print Inter A3+ 2 Muka (Oplah 20–200)
    // 32 hal / 8 hal per A3+ bolak-balik = 4 lembar A3+ per majalah; insheet 7
    const AP = H * 4 + 7 * 4;
    biayaKertasIsi = (p.tarifPrintIsiA3 * 2) * AP;
    ketKertasIsi = `Print Inter A3+ FC 2 Muka: ${AP} lbr × Rp ${(p.tarifPrintIsiA3 * 2).toLocaleString('id-ID')}`;
    ketPlatIsi = 'Digital (Tanpa Plat)';
    ketOngkosIsi = 'Termasuk di biaya print';
  } else {
    // Offset Oliver 4W (Oplah 250–3000)
    // Plano 65 × 100 cm, AP 120 gsm
    const rimIsi = ((65 * 100 * 120) / 20000) * p.tarifKertasAp120Kg;
    const AP = H + 150; // Insheet 150 plano
    biayaKertasIsi = (AP / 500) * rimIsi;
    ketKertasIsi = `Art Paper 120: ${AP} plano × Rp ${Math.round(rimIsi / 500).toLocaleString('id-ID')}`;

    const AX = 16; // 4 set katern × 4 warna = 16 plat
    biayaPlatIsi = AX * p.tarifPlateIsiOliver;
    ketPlatIsi = `16 Plat Oliver 4W × Rp ${p.tarifPlateIsiOliver.toLocaleString('id-ID')}`;

    const overDrek = Math.max(0, (H + 150 - 1000) * AX);
    biayaOngkosIsi = AX * p.minOngkosIsiOliver + overDrek * p.drekIsiOliver;
    ketOngkosIsi = `Min ongkos 16 plat + over ${overDrek} drek`;
  }

  // 3. JILID & FINISHING STANDAR
  let biayaJilidStandar = 0;
  let ketJilidStandar = '';

  if (H <= 200) {
    // Model BNBO: Susun Staples Lipat
    const tarifFin = p.jasaFinishingStandar || (uh / p.targetBN);
    const BN = H * tarifFin;
    const BO = H * p.tarifStaplesPcs;
    const BQ = H * p.tarifSisirPcs;
    biayaJilidStandar = BN + BO + BQ;
    ketJilidStandar = `Susun staples lipat (Rp ${tarifFin.toFixed(2)}) + staples + sisir`;
  } else {
    // Model UMR5: Lipat, Sisip, Susun, Kawat Stiching, Stiching, Sisir
    const BI = ((uh / p.targetLipat) * 2) * H;
    const BJ = (uh / p.targetSisip) * H;
    const BK = ((uh / p.targetSusunKomplit) * 2) * H;
    const BL = (p.tarifKawatRoll / p.targetKawatRoll) * H;
    const BM = ((uh * 2) / p.targetStiching) * H;
    const BQ = H * p.tarifSisirPcs;
    biayaJilidStandar = BI + BJ + BK + BL + BM + BQ;
    ketJilidStandar = `Lipat + Sisip + Susun + Kawat + Stiching + Sisir (${H} pcs)`;
  }

  // 4. KEMASAN (KARDUS & LAKBAN)
  const kardusCount = Math.ceil(H / p.kardusIsi);
  const CY = (H / p.kardusIsi) / (7650 / 196);
  const CZ = CY * p.tarifLakbanRoll;
  const biayaKemasan = H > 0 ? kardusCount * p.tarifKardusBox + CZ : 0;
  const ketKemasan = `${kardusCount} Kardus Box + ${CY.toFixed(3)} Roll Lakban`;

  // 5. FINISHING TAMBAHAN (LAMINASI & BENDING)
  const areaCoverCm2 = (14.5 * 2 + 1) * (20.25 + 1); // 637.5 cm²
  let biayaLaminasi = 0;
  let ketLaminasi = '';

  if (input.finishing === 'Laminasi Glossy') {
    const raw = areaCoverCm2 * p.tarifLaminasiGlossyCm2 * H;
    biayaLaminasi = Math.max(p.minLaminasi, raw);
    ketLaminasi = `Laminasi Glossy (${areaCoverCm2.toFixed(1)} cm² × Rp ${p.tarifLaminasiGlossyCm2})`;
  } else if (input.finishing === 'Laminasi Doff') {
    const raw = areaCoverCm2 * p.tarifLaminasiDoffCm2 * H;
    biayaLaminasi = Math.max(p.minLaminasi, raw);
    ketLaminasi = `Laminasi Doff (${areaCoverCm2.toFixed(1)} cm² × Rp ${p.tarifLaminasiDoffCm2})`;
  } else if (input.finishing === 'UV Varnish') {
    const raw = areaCoverCm2 * p.tarifUvVarnishCm2 * H;
    biayaLaminasi = Math.max(p.minLaminasi, raw);
    ketLaminasi = `UV Varnish (${areaCoverCm2.toFixed(1)} cm² × Rp ${p.tarifUvVarnishCm2})`;
  }

  let biayaBending = 0;
  let ketBending = '';
  if (input.jilid === 'Lem Bending') {
    const raw = p.tarifBendingPerCm * 20.25 * 0.5 * H;
    biayaBending = Math.max(p.minBending, raw);
    ketBending = `Lem Bending Panas (Rp ${p.tarifBendingPerCm} × 20,25 × 0,5)`;
  }

  // TOTAL HPP
  const totalHpp =
    biayaKertasCover +
    biayaDesainCover +
    biayaPlatCover +
    biayaOngkosCover +
    biayaKertasIsi +
    biayaDesainIsi +
    biayaPlatIsi +
    biayaOngkosIsi +
    biayaJilidStandar +
    biayaKemasan +
    biayaLaminasi +
    biayaBending;

  const hppPerPcs = totalHpp / H;

  // Margin & Nego (ROUNDUP -1 persis Excel BUKU!DI)
  const marginPct = input.marginPct ?? p.marginDefaultPct;
  const negoDiskonPct = input.negoDiskonPct ?? p.negoDefaultPct;

  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + marginPct / 100)) / 10) * 10;
  const negoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 10) * 10;
  const totalHargaJual = Math.round(hargaJualPerPcs * H);

  // Raw Breakdown Transparan
  const rawBreakdown: Array<{ komponen: string; keterangan: string; biaya: number }> = [
    { komponen: 'Kertas Cover', keterangan: ketKertasCover, biaya: biayaKertasCover },
    { komponen: 'Desain Cover', keterangan: 'Setting cover majalah per order', biaya: biayaDesainCover },
  ];

  if (biayaPlatCover > 0) {
    rawBreakdown.push({ komponen: 'Plat Cover Oliver', keterangan: ketPlatCover, biaya: biayaPlatCover });
  }
  if (biayaOngkosCover > 0) {
    rawBreakdown.push({ komponen: 'Ongkos Cetak Cover Oliver', keterangan: ketOngkosCover, biaya: biayaOngkosCover });
  }

  rawBreakdown.push(
    { komponen: 'Kertas Isi (Art Paper 120)', keterangan: ketKertasIsi, biaya: biayaKertasIsi },
    { komponen: 'Desain Layout Isi', keterangan: 'Layout isi 32 halaman', biaya: biayaDesainIsi }
  );

  if (biayaPlatIsi > 0) {
    rawBreakdown.push({ komponen: 'Plat Isi Oliver', keterangan: ketPlatIsi, biaya: biayaPlatIsi });
  }
  if (biayaOngkosIsi > 0) {
    rawBreakdown.push({ komponen: 'Ongkos Cetak Isi Oliver', keterangan: ketOngkosIsi, biaya: biayaOngkosIsi });
  }

  rawBreakdown.push(
    { komponen: 'Jilid & Finishing Standar', keterangan: ketJilidStandar, biaya: biayaJilidStandar },
    { komponen: 'Kemasan (Kardus & Lakban)', keterangan: ketKemasan, biaya: biayaKemasan }
  );

  if (biayaLaminasi > 0) {
    rawBreakdown.push({ komponen: `Laminasi Cover (${input.finishing})`, keterangan: ketLaminasi, biaya: biayaLaminasi });
  }
  if (biayaBending > 0) {
    rawBreakdown.push({ komponen: 'Jilid Lem Bending', keterangan: ketBending, biaya: biayaBending });
  }

  const breakdown = rawBreakdown.map((item, idx) => ({
    no: idx + 1,
    komponen: item.komponen,
    keterangan: item.keterangan,
    biaya: Math.round(item.biaya),
    porsiPct: totalHpp > 0 ? Number(((item.biaya / totalHpp) * 100).toFixed(1)) : 0,
  }));

  return {
    hppPerPcs,
    hargaJualPerPcs,
    negoPerPcs,
    totalHargaJual,
    totalHpp,
    prosesCetak: proses,
    areaCoverCm2,
    input,
    breakdown,
  };
}

export interface MajalahMatrixCell {
  oplah: number;
  prosesCetak: string;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
}

export function recalculateMajalahMatrix(
  customParams?: Partial<MajalahMasterParams>,
  finishing: MajalahFinishingOption = 'Tanpa Laminasi',
  jilid: MajalahJilidOption = 'Staples Tengah',
  marginPct = 30,
  negoDiskonPct = 5
): MajalahMatrixCell[] {
  return MAJALAH_TIERS.map((oplah) => {
    const res = calculateMajalahSimulator(
      {
        oplah,
        finishing,
        jilid,
        marginPct,
        negoDiskonPct,
      },
      customParams
    );

    return {
      oplah,
      prosesCetak: res.prosesCetak,
      hppPerPcs: res.hppPerPcs,
      hargaJualPerPcs: res.hargaJualPerPcs,
      negoPerPcs: res.negoPerPcs,
      totalHargaJual: res.totalHargaJual,
    };
  });
}
