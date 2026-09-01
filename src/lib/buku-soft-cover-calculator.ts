// ponytail: kalkulator Buku Soft Cover (17. Pricelist Buku Soft Cover)
// Referensi: Pricelist Buku Soft Cover.xlsx + Source/Pricelist Buku Soft Cover 21 x 29,7.xlsm
// Varian: 21×29,7 cm dan 14,8×21 cm — 32 hal, cover Art Carton 230 gsm (Print Inter A3+), isi HVS 70 gsm (Oliver offset)
//
// Formula HPP terverifikasi dari xlsm (semua baris diff=0):
//   Cover     : kertas_cover = (oplah + 5) * tarifPrintCoverA3  (Print Inter all-in, bahan+cetak)
//               desain_cover = tarifDesainCover (20000)
//   Isi Oliver: kebutuhan_plano = 2*oplah + 200  (empirical untuk 32 hal)
//               insirt          = 4*oplah + 400   (= 2 * kebutuhan_plano)
//               kertas_isi      = kebutuhan_plano * 0.04549 * tarifHvs70 * (1 + upKertasIsiPct/100)
//               desain_isi      = jumlahHalaman * tarifDesainIsiPerHlm
//               plate_isi       = tarifOliverPlatUnit (1 plat)
//               ongkos_isi      = tarifOliverMinIsi (90000)
//               tambahan        = (insirt - 500) * 80  (over-drek Oliver @ 2×40/drek)
//   Laminasi  : area_cm2 per unit: 21x29,7→1320, 14,8x21→660 (oversize cover terbuka)
//               total = max(area_cm2 * tarifLaminasiGlossy * oplah, minLaminasi)
//   Jasa      : jasa_susun = oplah * umr / 20000
//               staples    = oplah * 9  (per pcs, dari pack 3000/369 pcs)
//               sisir      = oplah * tarifSisirPerPcs

export interface BukuSoftCoverMasterParams {
  // Bahan Cover: Art Carton 230 gsm (Print Inter — tarif all-in termasuk bahan)
  tarifPrintCoverA3: number;      // Rp 2.700 / lbr A3+ (Print Inter all-in)
  tarifDesainCover: number;       // Rp 20.000 / order

  // Bahan Isi: HVS 70 gsm + Oliver offset
  tarifKertasHvs70Kg: number;     // Rp 15.700 / kg
  upKertasIsiPct: number;         // 3% margin/ppn
  tarifDesainIsiPerHlm: number;   // Rp 15.000 / halaman
  tarifOliverPlatUnit: number;    // Rp 45.000 / plat CTP
  tarifOliverMinIsi: number;      // Rp 90.000 minimum order

  // Laminasi Cover
  tarifLaminasiGlossyCm2: number; // Rp 0.35 / cm² (default aktif)
  tarifLaminasiDoffCm2: number;   // Rp 0.40 / cm²
  tarifUvVarnishCm2: number;      // Rp 0.11 / cm²
  minLaminasi: number;            // Rp 50.000 minimum

  // Finishing & Jasa
  tarifSisirPerPcs: number;       // Rp 150 / pcs
  umr: number;                    // Rp 2.818.585 (untuk jasa susun)

  // Kemasan & Packing
  tarifKardusBox: number;         // Rp 8.500 / box
  tarifLakbanRoll: number;        // Rp 8.000 / roll

  // Margin & Nego default
  marginDefaultPct: number;       // 25%
  negoDefaultPct: number;         // 4%
}

export const DEFAULT_BUKU_SOFT_COVER_PARAMS: BukuSoftCoverMasterParams = {
  tarifPrintCoverA3: 2700,
  tarifDesainCover: 20000,

  tarifKertasHvs70Kg: 15700,
  upKertasIsiPct: 3,
  tarifDesainIsiPerHlm: 15000,
  tarifOliverPlatUnit: 45000,
  tarifOliverMinIsi: 90000,

  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  tarifUvVarnishCm2: 0.11,
  minLaminasi: 50000,

  tarifSisirPerPcs: 150,
  umr: 2818585,

  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,

  marginDefaultPct: 25,
  negoDefaultPct: 4,
};

export type BukuSoftCoverVarianType = '21 x 29,7 cm' | '14,8 x 21 cm';

export const BUKU_SOFT_COVER_VARIANTS: BukuSoftCoverVarianType[] = [
  '21 x 29,7 cm',
  '14,8 x 21 cm',
];

export type BukuSoftCoverFinishingType =
  | 'Laminasi Glossy'
  | 'Laminasi Doff'
  | 'UV Varnish'
  | 'Tanpa Laminasi';

export const BUKU_SOFT_COVER_FINISHING_OPTIONS: BukuSoftCoverFinishingType[] = [
  'Laminasi Glossy',
  'Laminasi Doff',
  'UV Varnish',
  'Tanpa Laminasi',
];

// Luas cover (terbuka, oversize untuk laminasi) per pcs, dalam cm²
// ponytail: oversize ~1 cm tiap sisi → 21×29,7 → 22×30 (1 muka) × 2 sisi = 1320 cm²
//           14,8×21 → 15×22 (1 muka) × 2 sisi = 660 cm²
// ceiling: jika ukuran di luar 2 varian, fallback ke 0 dan laminasi = minLaminasi saja
const LAMINASI_AREA_CM2: Record<BukuSoftCoverVarianType, number> = {
  '21 x 29,7 cm': 1320,
  '14,8 x 21 cm': 660,
};

// Berat plano HVS 70 gsm (65×100 cm) — terverifikasi dari xlsm
const BERAT_PLANO_HVS_KG = 0.04549;

// ponytail: tier dibatasi sampai 500 saja karena formula empiris
// '2*oplah+200' diverifikasi hingga oplah 500 di source xlsm 21×29,7;
// untuk 14,8×21 diasumsikan formula identik (HPP sama)
export const BUKU_SOFT_COVER_TIERS: number[] = [
  20, 50, 100, 150, 200, 250, 300, 350, 400, 500,
];

// Harga referensi Juli 2026 (digunakan sebagai default harga jual per tier)
// Berlaku untuk KEDUA varian (HPP dan harga identik di Excel)
const HARGA_REFERENSI: Record<number, { harga: number; nego: number }> = {
  20:  { harga: 58400, nego: 55500 },
  50:  { harga: 27000, nego: 25700 },
  100: { harga: 16500, nego: 15700 },
  150: { harga: 13200, nego: 12600 },
  200: { harga: 11500, nego: 11000 },
  250: { harga: 10600, nego: 10100 },
  300: { harga:  9900, nego:  9500 },
  350: { harga:  9400, nego:  9000 },
  400: { harga:  9100, nego:  8700 },
  500: { harga:  8600, nego:  8200 },
};

export interface BukuSoftCoverSimulatorInput {
  oplah: number;
  varian: BukuSoftCoverVarianType;
  jumlahHalaman: number;        // default 32
  finishing: BukuSoftCoverFinishingType;
  marginPct: number;
  negoDiskonPct: number;
}

export interface BukuSoftCoverBreakdownItem {
  no: number;
  komponen: string;
  keterangan: string;
  biaya: number;
  porsiPct: number;
}

export interface BukuSoftCoverSimulatorResult {
  input: BukuSoftCoverSimulatorInput;

  // Komponen HPP
  biayaCoverPrint: number;
  biayaDesainCover: number;
  biayaKertasIsi: number;
  biayaDesainIsi: number;
  biayaPlateIsi: number;
  biayaOngkosCetakIsi: number;
  biayaTambahanCetakIsi: number;
  biayaLaminasi: number;
  biayaJasaSusun: number;
  biayaStaples: number;
  biayaSisir: number;

  // Totals
  totalHpp: number;
  hppPerPcs: number;

  // Harga jual
  hargaJualPerPcs: number;
  totalHargaJual: number;

  // Nego
  negoPerPcs: number;
  totalNego: number;

  // Breakdown
  breakdown: BukuSoftCoverBreakdownItem[];

  // Detail
  kebutuhanCoverA3: number;
  kebutuhanPlanoIsi: number;
  areaCoverCm2: number;
  insirtIsi: number;
}

export function calculateBukuSoftCoverHpp(
  input: BukuSoftCoverSimulatorInput,
  rawParams?: Partial<BukuSoftCoverMasterParams>
): BukuSoftCoverSimulatorResult {
  const p = { ...DEFAULT_BUKU_SOFT_COVER_PARAMS, ...(rawParams || {}) };
  const { oplah, varian, jumlahHalaman, finishing, marginPct, negoDiskonPct } = input;

  // --- Cover (Print Inter all-in) ---
  const kebutuhanCoverA3 = oplah + 5; // oplah + 5 lembar setup
  const biayaCoverPrint = kebutuhanCoverA3 * p.tarifPrintCoverA3;
  const biayaDesainCover = p.tarifDesainCover;

  // --- Isi (Oliver offset) ---
  // ponytail: formula 2*oplah+200 dan 4*oplah+400 terverifikasi dari xlsm untuk 32 hal;
  // ceiling: formula ini proporsional untuk jumlah halaman berbeda via (jumlahHalaman/32) multiplier
  const halamanFactor = jumlahHalaman / 32;
  const kebutuhanPlanoIsi = Math.ceil((2 * oplah + 200) * halamanFactor);
  const insirtIsi = 2 * kebutuhanPlanoIsi;

  const biayaKertasIsi = kebutuhanPlanoIsi * BERAT_PLANO_HVS_KG * p.tarifKertasHvs70Kg * (1 + p.upKertasIsiPct / 100);
  const biayaDesainIsi = jumlahHalaman * p.tarifDesainIsiPerHlm;
  const biayaPlateIsi = p.tarifOliverPlatUnit; // 1 plat
  const biayaOngkosCetakIsi = p.tarifOliverMinIsi;
  const biayaTambahanCetakIsi = (insirtIsi - 500) * 80; // over-drek fee, bisa negatif di oplah kecil

  // --- Laminasi ---
  const areaCoverCm2 = LAMINASI_AREA_CM2[varian] ?? 0;
  let tarifLaminasiPerCm2 = 0;
  if (finishing === 'Laminasi Glossy') tarifLaminasiPerCm2 = p.tarifLaminasiGlossyCm2;
  else if (finishing === 'Laminasi Doff') tarifLaminasiPerCm2 = p.tarifLaminasiDoffCm2;
  else if (finishing === 'UV Varnish') tarifLaminasiPerCm2 = p.tarifUvVarnishCm2;

  const biayaLaminasi =
    finishing !== 'Tanpa Laminasi'
      ? Math.max(areaCoverCm2 * tarifLaminasiPerCm2 * oplah, p.minLaminasi)
      : 0;

  // --- Jasa & Finishing ---
  const biayaJasaSusun = (oplah * p.umr) / 20000;
  const biayaStaples = oplah * 9; // 9/pcs dari pack 3000/369 ≈ 8.13, dibulatkan 9 per xlsm
  const biayaSisir = oplah * p.tarifSisirPerPcs;

  // --- Total HPP ---
  const totalHpp = Math.round(
    biayaCoverPrint +
    biayaDesainCover +
    biayaKertasIsi +
    biayaDesainIsi +
    biayaPlateIsi +
    biayaOngkosCetakIsi +
    biayaTambahanCetakIsi +
    biayaLaminasi +
    biayaJasaSusun +
    biayaStaples +
    biayaSisir
  );
  const hppPerPcs = totalHpp / oplah;

  // --- Harga Jual ---
  const hargaJualPerPcs = Math.round(hppPerPcs * (1 + marginPct / 100));
  const totalHargaJual = hargaJualPerPcs * oplah;

  // --- Nego ---
  const negoPerPcs = Math.round(hargaJualPerPcs * (1 - negoDiskonPct / 100));
  const totalNego = negoPerPcs * oplah;

  // --- Breakdown ---
  const items: Array<{ komponen: string; keterangan: string; biaya: number }> = [
    {
      komponen: 'Kertas Cover (Print Inter)',
      keterangan: `${kebutuhanCoverA3} lbr A3+ × Rp ${p.tarifPrintCoverA3.toLocaleString('id-ID')}`,
      biaya: biayaCoverPrint,
    },
    {
      komponen: 'Desain Cover',
      keterangan: 'AC 230 gsm · Full Colour 4/0',
      biaya: biayaDesainCover,
    },
    {
      komponen: 'Kertas Isi (HVS 70 gsm)',
      keterangan: `${kebutuhanPlanoIsi} plano 65×100 × ${BERAT_PLANO_HVS_KG}kg × Rp ${p.tarifKertasHvs70Kg.toLocaleString('id-ID')}/kg +${p.upKertasIsiPct}%`,
      biaya: Math.round(biayaKertasIsi),
    },
    {
      komponen: 'Desain Isi',
      keterangan: `${jumlahHalaman} hal × Rp ${p.tarifDesainIsiPerHlm.toLocaleString('id-ID')}/hal`,
      biaya: biayaDesainIsi,
    },
    {
      komponen: 'Plate Oliver Isi',
      keterangan: '1 plat CTP · 1 warna',
      biaya: biayaPlateIsi,
    },
    {
      komponen: 'Ongkos Cetak Isi (Oliver)',
      keterangan: `Min order Rp ${p.tarifOliverMinIsi.toLocaleString('id-ID')}`,
      biaya: biayaOngkosCetakIsi,
    },
    {
      komponen: 'Tambahan Cetak Isi (Over-Drek)',
      keterangan: `(${insirtIsi} insirt − 500) × 80`,
      biaya: Math.round(biayaTambahanCetakIsi),
    },
    ...(finishing !== 'Tanpa Laminasi'
      ? [{
          komponen: `Laminasi ${finishing}`,
          keterangan: `${areaCoverCm2} cm² × Rp ${tarifLaminasiPerCm2}/cm² × ${oplah} pcs (min Rp ${p.minLaminasi.toLocaleString('id-ID')})`,
          biaya: Math.round(biayaLaminasi),
        }]
      : []),
    {
      komponen: 'Jasa Susun + Staples + Lipat',
      keterangan: `${oplah} pcs × Rp ${(p.umr / 20000).toFixed(0)} (UMR/20.000)`,
      biaya: Math.round(biayaJasaSusun),
    },
    {
      komponen: 'Biaya Staples',
      keterangan: `${oplah} pcs × Rp 9/pcs`,
      biaya: biayaStaples,
    },
    {
      komponen: 'Sisir Binding',
      keterangan: `${oplah} pcs × Rp ${p.tarifSisirPerPcs}/pcs`,
      biaya: biayaSisir,
    },
  ];

  const breakdown: BukuSoftCoverBreakdownItem[] = items.map((item, i) => ({
    no: i + 1,
    ...item,
    porsiPct: totalHpp > 0 ? (item.biaya / totalHpp) * 100 : 0,
  }));

  return {
    input,
    biayaCoverPrint: Math.round(biayaCoverPrint),
    biayaDesainCover,
    biayaKertasIsi: Math.round(biayaKertasIsi),
    biayaDesainIsi,
    biayaPlateIsi,
    biayaOngkosCetakIsi,
    biayaTambahanCetakIsi: Math.round(biayaTambahanCetakIsi),
    biayaLaminasi: Math.round(biayaLaminasi),
    biayaJasaSusun: Math.round(biayaJasaSusun),
    biayaStaples,
    biayaSisir,
    totalHpp,
    hppPerPcs,
    hargaJualPerPcs,
    totalHargaJual,
    negoPerPcs,
    totalNego,
    breakdown,
    kebutuhanCoverA3,
    kebutuhanPlanoIsi,
    areaCoverCm2,
    insirtIsi,
  };
}

// --- Matriks multi-varian × multi-oplah ---

export interface BukuSoftCoverMatrixRow {
  varian: BukuSoftCoverVarianType;
  finishing: BukuSoftCoverFinishingType;
  oplah: number;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
  // Referensi harga resmi Juli 2026
  hargaRef?: number;
  negoRef?: number;
}

export function generateBukuSoftCoverMatrix(
  params: BukuSoftCoverMasterParams = DEFAULT_BUKU_SOFT_COVER_PARAMS,
  marginPct = 25,
  negoDiskonPct = 4,
  finishing: BukuSoftCoverFinishingType = 'Laminasi Glossy',
): BukuSoftCoverMatrixRow[] {
  const rows: BukuSoftCoverMatrixRow[] = [];
  for (const varian of BUKU_SOFT_COVER_VARIANTS) {
    for (const oplah of BUKU_SOFT_COVER_TIERS) {
      const res = calculateBukuSoftCoverHpp(
        { oplah, varian, jumlahHalaman: 32, finishing, marginPct, negoDiskonPct },
        params
      );
      rows.push({
        varian,
        finishing,
        oplah,
        hppPerPcs: Math.round(res.hppPerPcs),
        hargaJualPerPcs: res.hargaJualPerPcs,
        negoPerPcs: res.negoPerPcs,
        totalHargaJual: res.totalHargaJual,
        hargaRef: HARGA_REFERENSI[oplah]?.harga,
        negoRef: HARGA_REFERENSI[oplah]?.nego,
      });
    }
  }
  return rows;
}

export type SavedBukuSoftCoverSimulationItem = {
  id: string;
  savedAt: string;
  title: string;
  oplah: number;
  data: BukuSoftCoverSimulatorResult;
  paramsSnapshot?: any;
};
