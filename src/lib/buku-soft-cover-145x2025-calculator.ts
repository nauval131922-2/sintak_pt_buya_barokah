// ponytail: kalkulator dan master parameter Buku Soft Cover 14,5 x 20,25 cm (18. Pricelist Buku Soft Cover - 14,5 x 20,25 cm)
// Referensi: Pricelist Buku Soft Cover - 14,5 x 20,25 cm.xlsx sheets HARGA JULI 2026 + Source/*.xlsm
// Ukuran: 14,5 x 20,25 cm (tertutup), 32 halaman (8 lbr), bolak-balik
// Cover: Art Carton 230 gsm 1 muka FC
// Isi: HVS 70 gsm 1 warna BB
// Proses bertingkat:
// - Oplah 20–200: Cover Print (Print Inter A3+) - Isi Print (Print Buya A4/A3+)
// - Oplah 250–600: Cover Print (Print Inter A3+) - Isi Ryobi (Offset 1 Warna)
// - Oplah 650–900: Cover Oliver (Offset 4 Warna) - Isi Ryobi (Offset 1 Warna)
// - Oplah 1000–3000: Cover Oliver (Offset 4 Warna) - Isi Oliver (Offset 1 Warna)

export interface BukuSoftCover145x2025MasterParams {
  // A. Cover & Cetak Cover
  tarifPrintCoverA3: number;        // Rp 2.700 / lbr A3+ (Print Inter)
  tarifKertasAc230Kg: number;       // Rp 16.400 / kg (+5% PPN)
  tarifDesainCover: number;          // Rp 20.000 / order
  tarifPlateCoverOliver: number;    // Rp 45.000 / plat (4 plat = Rp 180.000)
  minOngkosCoverOliver: number;     // Rp 90.000 / plat (4 plat = Rp 360.000)
  drekCoverOliver: number;          // Rp 40 / drek (di atas 1000 drek)

  // B. Isi & Cetak Isi
  tarifKertasHvs70Kg: number;       // Rp 15.700 / kg (+5% PPN)
  tarifDesainIsi: number;           // Rp 20.000 / order (Rp 2.500 × 8 lbr)
  tarifPrintIsiPerLbr: number;      // Rp 350 / lbr (Print Buya)
  tarifPlateIsiRyobi: number;       // Rp 10.000 / plat (16 plat = Rp 160.000)
  minOngkosIsiRyobi: number;        // Rp 15.000 / plat (16 plat = Rp 240.000)
  drekIsiRyobi: number;             // Rp 30 / drek (di atas 500 drek)
  tarifPlateIsiOliver: number;      // Rp 45.000 / plat (8 plat = Rp 360.000)
  minOngkosIsiOliver: number;       // Rp 90.000 / plat (8 plat = Rp 720.000)
  drekIsiOliver: number;            // Rp 40 / drek (di atas 1000 drek)

  // C. Finishing
  jasaFinishingStandar: number;     // Rp 140.9425 / pcs (Susun, Staples, Lipat untuk Print & Ryobi)
  tarifStaplesPcs: number;          // Rp 9 / pcs
  tarifSisirPerPcs: number;         // Rp 150 / pcs
  tarifKardusBox: number;           // Rp 8.500 / box (kapasitas 200 pcs)
  tarifLakbanRoll: number;          // Rp 8.000 / roll

  // D. Finishing Tambahan (Laminasi & Bending)
  tarifLaminasiGlossyCm2: number;   // Rp 0.35 / cm²
  tarifLaminasiDoffCm2: number;     // Rp 0.40 / cm²
  tarifUvVarnishCm2: number;        // Rp 0.11 / cm²
  minLaminasi: number;              // Rp 50.000 / order
  tarifBendingPerCm: number;        // Rp 50 / cm (min Rp 100.000)

  // E. Margin & Nego Standar
  marginDefaultPct: number;         // 30% (HARGA JULI 2026: ROUNDUP(HPP * 1.30, -2))
  negoDefaultPct: number;           // 5% (HARGA JULI 2026: ROUNDUP(Harga * 0.95, -2))
}

export const DEFAULT_BUKU_SOFT_COVER_145X2025_PARAMS: BukuSoftCover145x2025MasterParams = {
  // A. Cover
  tarifPrintCoverA3: 2700,
  tarifKertasAc230Kg: 16400,
  tarifDesainCover: 20000,
  tarifPlateCoverOliver: 45000,
  minOngkosCoverOliver: 90000,
  drekCoverOliver: 40,

  // B. Isi
  tarifKertasHvs70Kg: 15700,
  tarifDesainIsi: 20000,
  tarifPrintIsiPerLbr: 350,
  tarifPlateIsiRyobi: 10000,
  minOngkosIsiRyobi: 15000,
  drekIsiRyobi: 30,
  tarifPlateIsiOliver: 45000,
  minOngkosIsiOliver: 90000,
  drekIsiOliver: 40,

  // C. Finishing
  jasaFinishingStandar: 140.9425,
  tarifStaplesPcs: 9,
  tarifSisirPerPcs: 150,
  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,

  // D. Finishing Tambahan
  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  tarifUvVarnishCm2: 0.11,
  minLaminasi: 50000,
  tarifBendingPerCm: 50,

  // E. Margin & Nego
  marginDefaultPct: 30,
  negoDefaultPct: 5,
};

export const BUKU_SOFT_COVER_145X2025_TIERS = [
  20, 30, 50, 60, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600,
  650, 700, 750, 800, 900, 1000, 1500, 2000, 2500, 3000,
];

export type BukuSoftCover145x2025FinishingOption =
  | 'Tanpa Laminasi'
  | 'Laminasi Glossy'
  | 'Laminasi Doff'
  | 'UV Varnish';

export type BukuSoftCover145x2025JilidOption = 'Staples Tengah' | 'Lem Bending';

export interface BukuSoftCover145x2025SimulatorInput {
  oplah: number;
  jumlahHalaman?: number; // default 32
  finishing: BukuSoftCover145x2025FinishingOption;
  jilid: BukuSoftCover145x2025JilidOption;
  marginPct: number;
  negoDiskonPct: number;
}

export interface BukuSoftCover145x2025SimulatorResult {
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
  totalHpp: number;
  prosesCetak: string;
  kebutuhanCover: number;
  kebutuhanIsi: number;
  areaCoverCm2: number;
  input: BukuSoftCover145x2025SimulatorInput;
  breakdown: {
    no: number;
    komponen: string;
    keterangan: string;
    biaya: number;
    porsiPct: number;
  }[];
}

export function getProsesCetak145x2025(oplah: number): string {
  if (oplah <= 200) return 'Cover Print - Isi Print';
  if (oplah <= 600) return 'Cover Print - Isi Ryobi';
  if (oplah <= 900) return 'Cover Oliver - Isi Ryobi';
  return 'Cover Oliver - Isi Oliver';
}

export function calculateBukuSoftCover145x2025Simulator(
  input: BukuSoftCover145x2025SimulatorInput,
  customParams?: Partial<BukuSoftCover145x2025MasterParams>
): BukuSoftCover145x2025SimulatorResult {
  const p: BukuSoftCover145x2025MasterParams = {
    ...DEFAULT_BUKU_SOFT_COVER_145X2025_PARAMS,
    ...customParams,
  };

  const oplah = Math.max(1, input.oplah);
  const proses = getProsesCetak145x2025(oplah);
  const areaCoverCm2 = (14.5 * 2 + 1) * (20.25 + 1); // 30 × 21.25 = 637.5 cm²

  // 1. KERTAS & CETAK COVER
  let biayaKertasCover = 0;
  const biayaDesainCover = p.tarifDesainCover;
  let biayaPlateCover = 0;
  let biayaCetakCover = 0;
  let kebutuhanCover = 0;

  if (proses.startsWith('Cover Print')) {
    // Print Inter A3+ (2 cover/A3+, insheet 7 lbr)
    kebutuhanCover = Math.ceil(oplah / 2 + 7);
    biayaKertasCover = p.tarifPrintCoverA3 * kebutuhanCover;
    biayaPlateCover = 0;
    biayaCetakCover = 0;
  } else {
    // Cover Oliver (1 plano = 8 cover, insheet 100/4 = 25 plano)
    kebutuhanCover = Math.ceil(oplah / 8 + 25);
    // Harga kertas AC 230: (16400 * 1.05 * 0.23 * 0.79 * 1.09) * 500 / 500 = 1225900/500 per plano
    const hargaPlanoAc230 = 1225900;
    biayaKertasCover = (kebutuhanCover / 500) * hargaPlanoAc230;
    biayaPlateCover = p.tarifPlateCoverOliver * 4; // 4 plat
    const drekCover = kebutuhanCover * 4;
    const drekOverCover = drekCover > 1000 ? (drekCover - 1000) * p.drekCoverOliver * 4 : 0;
    biayaCetakCover = p.minOngkosCoverOliver * 4 + drekOverCover;
  }

  // 2. KERTAS & CETAK ISI
  let biayaKertasIsi = 0;
  const biayaDesainIsi = p.tarifDesainIsi;
  let biayaPlateIsi = 0;
  let biayaCetakIsi = 0;
  let kebutuhanIsi = 0;

  if (proses === 'Cover Print - Isi Print') {
    // Print Buya (A4/A3+, AP = oplah*8 + 40 lbr A4)
    kebutuhanIsi = oplah * 8 + 40;
    biayaKertasIsi = (kebutuhanIsi / 500) * 38987.025;
    biayaPlateIsi = 0;
    biayaCetakIsi = p.tarifPrintIsiPerLbr * kebutuhanIsi;
  } else if (proses.includes('Isi Ryobi')) {
    // Isi Ryobi (16 plat, AP = oplah*8 + 240)
    kebutuhanIsi = oplah * 8 + 240;
    biayaKertasIsi = (kebutuhanIsi / 500) * 38987.025;
    biayaPlateIsi = p.tarifPlateIsiRyobi * 16; // 16 plat = 160.000
    const drekOverIsi = (oplah + 30) > 500 ? ((oplah + 30) - 500) * 16 * p.drekIsiRyobi : 0;
    biayaCetakIsi = p.minOngkosIsiRyobi * 16 + drekOverIsi; // 240.000 + drek over
  } else {
    // Isi Oliver (8 plat, AP = oplah + 100 plano)
    kebutuhanIsi = oplah + 100;
    const hargaPlanoHvs70 = 357175;
    biayaKertasIsi = (kebutuhanIsi / 500) * hargaPlanoHvs70;
    biayaPlateIsi = p.tarifPlateIsiOliver * 8; // 8 plat = 360.000
    const drekOverIsi = (oplah + 100) > 1000 ? ((oplah + 100) - 1000) * 8 * p.drekIsiOliver : 0;
    biayaCetakIsi = p.minOngkosIsiOliver * 8 + drekOverIsi; // 720.000 + drek over
  }

  // 3. JASA FINISHING DASAR
  let biayaFinishingDasar = 0;
  let biayaStaples = 0;
  if (proses === 'Cover Oliver - Isi Oliver') {
    // Rinci: Lipat 45.1016 + Sisip 66.3259 + Susun 47.4754 + Kawat Stiching 4.7059 + Stiching 22.5508
    biayaFinishingDasar = (45.1016 + 66.32588235294118 + 47.47536842105263 + 4.705882352941177 + 22.5508) * oplah;
    biayaStaples = 0; // Sudah include di kawat stiching
  } else {
    biayaFinishingDasar = p.jasaFinishingStandar * oplah;
    biayaStaples = p.tarifStaplesPcs * oplah;
  }

  const biayaSisir = p.tarifSisirPerPcs * oplah;

  // 4. KEMASAN (Kardus + Lakban)
  const boxCount = Math.ceil(oplah / 200);
  const lakbanPcs = (oplah / 200) / 39.03061224489796;
  const biayaKemasan = boxCount * p.tarifKardusBox + lakbanPcs * p.tarifLakbanRoll;

  // 5. FINISHING TAMBAHAN (Laminasi / UV / Bending)
  let biayaLaminasi = 0;
  if (input.finishing === 'Laminasi Glossy') {
    biayaLaminasi = Math.max(p.minLaminasi, areaCoverCm2 * p.tarifLaminasiGlossyCm2 * oplah);
  } else if (input.finishing === 'Laminasi Doff') {
    biayaLaminasi = Math.max(p.minLaminasi, areaCoverCm2 * p.tarifLaminasiDoffCm2 * oplah);
  } else if (input.finishing === 'UV Varnish') {
    biayaLaminasi = Math.max(p.minLaminasi, areaCoverCm2 * p.tarifUvVarnishCm2 * oplah);
  }

  let biayaJilidTambahan = 0;
  if (input.jilid === 'Lem Bending') {
    // Bending: p.tarifBendingPerCm * 20.25 * punggung(0.5) * oplah
    biayaJilidTambahan = Math.max(100000, p.tarifBendingPerCm * 20.25 * 0.5 * oplah);
  }

  // TOTAL HPP
  const totalHpp =
    biayaKertasCover +
    biayaDesainCover +
    biayaPlateCover +
    biayaCetakCover +
    biayaKertasIsi +
    biayaDesainIsi +
    biayaPlateIsi +
    biayaCetakIsi +
    biayaFinishingDasar +
    biayaStaples +
    biayaSisir +
    biayaKemasan +
    biayaLaminasi +
    biayaJilidTambahan;

  const hppPerPcs = totalHpp / oplah;

  // HARGA JUAL & NEGO
  const marginPct = input.marginPct ?? p.marginDefaultPct;
  const negoDiskonPct = input.negoDiskonPct ?? p.negoDefaultPct;

  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + marginPct / 100)) / 100) * 100;
  const negoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 100) * 100;
  const totalHargaJual = hargaJualPerPcs * oplah;

  // BREAKDOWN
  const rawBreakdown = [
    {
      komponen: 'Bahan Cover (Art Carton 230)',
      keterangan: `${kebutuhanCover.toLocaleString('id-ID')} ${proses.startsWith('Cover Print') ? 'lbr A3+' : 'lbr plano'}`,
      biaya: biayaKertasCover,
    },
    {
      komponen: 'Desain Cover',
      keterangan: 'Artwork Cover',
      biaya: biayaDesainCover,
    },
    ...(biayaPlateCover > 0
      ? [
          {
            komponen: 'Plate Cetak Cover',
            keterangan: '4 Plat CTP Oliver',
            biaya: biayaPlateCover,
          },
        ]
      : []),
    ...(biayaCetakCover > 0
      ? [
          {
            komponen: 'Ongkos Cetak Cover',
            keterangan: 'Offset Oliver 4 Warna',
            biaya: biayaCetakCover,
          },
        ]
      : []),
    {
      komponen: 'Bahan Kertas Isi (HVS 70)',
      keterangan: `${kebutuhanIsi.toLocaleString('id-ID')} ${proses.includes('Oliver') ? 'lbr plano' : 'lbr cetak'}`,
      biaya: biayaKertasIsi,
    },
    {
      komponen: 'Desain Isi',
      keterangan: 'Layout Isi 32 Hal',
      biaya: biayaDesainIsi,
    },
    ...(biayaPlateIsi > 0
      ? [
          {
            komponen: 'Plate Cetak Isi',
            keterangan: `${proses.includes('Isi Oliver') ? '8 Plat Oliver' : '16 Plat Ryobi'}`,
            biaya: biayaPlateIsi,
          },
        ]
      : []),
    {
      komponen: 'Ongkos Cetak Isi',
      keterangan: `${proses.includes('Isi Print') ? 'Print Buya A4' : proses.includes('Isi Ryobi') ? 'Offset Ryobi 1W' : 'Offset Oliver 1W'}`,
      biaya: biayaCetakIsi,
    },
    {
      komponen: 'Jasa Finishing Standar',
      keterangan: `${proses.includes('Oliver-Isi Oliver') ? 'Lipat, Sisip, Susun, Stiching' : 'Susun, Lipat, Staples'}`,
      biaya: biayaFinishingDasar + biayaStaples,
    },
    {
      komponen: 'Ongkos Sisir',
      keterangan: `${oplah.toLocaleString('id-ID')} pcs @ Rp ${p.tarifSisirPerPcs}`,
      biaya: biayaSisir,
    },
    {
      komponen: 'Kemasan (Kardus & Lakban)',
      keterangan: `${boxCount} box + lakban`,
      biaya: biayaKemasan,
    },
    ...(biayaLaminasi > 0
      ? [
          {
            komponen: `Finishing Cover (${input.finishing})`,
            keterangan: `Area ${areaCoverCm2.toFixed(1)} cm²`,
            biaya: biayaLaminasi,
          },
        ]
      : []),
    ...(biayaJilidTambahan > 0
      ? [
          {
            komponen: `Jilid (${input.jilid})`,
            keterangan: 'Lem Bending Panas',
            biaya: biayaJilidTambahan,
          },
        ]
      : []),
  ];

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
    kebutuhanCover,
    kebutuhanIsi,
    areaCoverCm2,
    input,
    breakdown,
  };
}

export interface BukuSoftCover145x2025MatrixCell {
  oplah: number;
  prosesCetak: string;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
}

export function recalculateBukuSoftCover145x2025Matrix(
  customParams?: Partial<BukuSoftCover145x2025MasterParams>,
  finishing: BukuSoftCover145x2025FinishingOption = 'Tanpa Laminasi',
  jilid: BukuSoftCover145x2025JilidOption = 'Staples Tengah',
  marginPct = 30,
  negoDiskonPct = 5
): BukuSoftCover145x2025MatrixCell[] {
  return BUKU_SOFT_COVER_145X2025_TIERS.map((oplah) => {
    const res = calculateBukuSoftCover145x2025Simulator(
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
