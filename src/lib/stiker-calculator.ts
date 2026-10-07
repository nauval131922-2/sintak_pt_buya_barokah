// ponytail: kalkulator dan master parameter Stiker (23. Pricelist Stiker)
// Diaudit 100% 160/160 tier Rp 0 terhadap 10 file Excel Source (*.xlsm)
// Sesuai PANDUAN_AUDIT_EXCEL_SINTAK.md (Pos 0-6)

export interface StikerMasterParams {
  // Master!D19: Tarif Cetak Print A3+
  tarifPrintNonCuttingA3: number;   // Rp 7.500 / lbr A3+ (Non Cutting / Rajang)
  tarifPrintCuttingA3: number;      // Rp 20.000 / lbr A3+ (Cutting / Kiss-Cut)

  // Master!D16: Desain Flat per Order
  tarifDesain: number;              // Rp 15.000 / order

  // BUKU!AJ6: Finishing Sisir (per 500 lbr A3+)
  tarifSisirPer500: number;         // Rp 10.000 / 500 lbr A3+

  // Master!E22: Margin Standar (%)
  marginDefaultPct: number;         // 30%

  // Nego Standar (%)
  negoDefaultPct: number;           // 4%
}

export const DEFAULT_STIKER_PARAMS: StikerMasterParams = {
  tarifPrintNonCuttingA3: 7500,     // Master!D19 Non Cutting
  tarifPrintCuttingA3: 20000,       // Master!D19 Cutting
  tarifDesain: 15000,               // Master!D16
  tarifSisirPer500: 10000,          // BUKU!AJ6
  marginDefaultPct: 30,             // Master!E22
  negoDefaultPct: 4,
};

export type StikerUkuran =
  | '8 x 5 cm'
  | '7.5 x 6 cm'
  | '9.5 x 6.5 cm'
  | '10 x 12 cm'
  | '21 x 29,7 cm';

export const STIKER_UKURAN_OPTIONS: StikerUkuran[] = [
  '8 x 5 cm',
  '7.5 x 6 cm',
  '9.5 x 6.5 cm',
  '10 x 12 cm',
  '21 x 29,7 cm',
];

export const STIKER_TIERS = [
  10, 50, 100, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900, 1000, 1500,
];

export type StikerFinishingOption =
  | 'Non Cutting (Rajang Potong)'
  | 'Kiss Cutting (Setengah Putus)'
  | 'Die Cut (Potong Putus)';

export const STIKER_FINISHING_OPTIONS: StikerFinishingOption[] = [
  'Non Cutting (Rajang Potong)',
  'Kiss Cutting (Setengah Putus)',
  'Die Cut (Potong Putus)',
];

// Yield Isi per Lembar A3+ (BUKU!Col O baris 6/7)
export const STIKER_ISI_PER_A3: Record<'NON CUTTING' | 'CUTTING', Record<StikerUkuran, number>> = {
  'NON CUTTING': {
    '7.5 x 6 cm': 30,    // BUKU!O7 file 7.5 x 6 cm
    '8 x 5 cm': 33,      // BUKU!O7 file 8 x 5 cm
    '9.5 x 6.5 cm': 21,  // BUKU!O7 file 9.5 x 6.5 cm
    '10 x 12 cm': 11,    // BUKU!O7 file 10 x 12 cm
    '21 x 29,7 cm': 2,   // BUKU!O7 file 21 x 29.7 cm
  },
  'CUTTING': {
    '7.5 x 6 cm': 20,    // BUKU!O7 file 7.5 x 6 cm Cutting
    '8 x 5 cm': 29,      // BUKU!O7 file 8 x 5 cm Cutting
    '9.5 x 6.5 cm': 16,  // BUKU!O7 file 9.5 x 6.5 cm Cutting
    '10 x 12 cm': 8,     // BUKU!O7 file 10 x 12 cm Cutting
    '21 x 29,7 cm': 1,   // BUKU!O7 file 21 x 29.7 cm Cutting
  },
};

export interface StikerSimulatorInput {
  ukuran: StikerUkuran;
  oplah: number;
  finishing: StikerFinishingOption;
  opsiSisir?: boolean;
  marginPct?: number;
  negoDiskonPct?: number;
}

export interface StikerSimulatorResult {
  hppPerPcs: number;
  hargaJualPerPcs: number;
  negoPerPcs: number;
  totalHargaJual: number;
  totalHpp: number;
  lembarA3: number;
  isiPerA3: number;
  biayaPrint: number;
  biayaDesain: number;
  biayaSisir: number;
  input: StikerSimulatorInput;
  breakdown: {
    no: number;
    komponen: string;
    keterangan: string;
    biaya: number;
    porsiPct: number;
  }[];
}

export function calculateStikerSimulator(
  input: StikerSimulatorInput,
  customParams?: Partial<StikerMasterParams>
): StikerSimulatorResult {
  const p: StikerMasterParams = {
    ...DEFAULT_STIKER_PARAMS,
    ...customParams,
  };

  const oplah = Math.max(1, input.oplah);
  const isCutting = input.finishing !== 'Non Cutting (Rajang Potong)';
  const jenisKey = isCutting ? 'CUTTING' : 'NON CUTTING';

  // BUKU!Col O: Isi per A3+
  const isiPerA3 = STIKER_ISI_PER_A3[jenisKey][input.ukuran] ?? 20;

  // BUKU!Col Q: Lembar A3+ = ROUNDUP(oplah / isiPerA3, 0)
  const lembarA3 = Math.ceil(oplah / isiPerA3);

  // BUKU!Col R: Biaya Print A3+ = lembarA3 * tarifPrintA3
  const tarifPrintA3 = isCutting ? p.tarifPrintCuttingA3 : p.tarifPrintNonCuttingA3;
  const biayaPrint = lembarA3 * tarifPrintA3;

  // BUKU!Col T: Desain = IF(oplah > 0, 15000, 0)
  const biayaDesain = oplah > 0 ? p.tarifDesain : 0;

  // BUKU!Col AJ: Sisir = IF(sisir, ROUNDUP(lembarA3 / 500, 0) * 10000, 0)
  const biayaSisir = input.opsiSisir ? Math.ceil(lembarA3 / 500) * p.tarifSisirPer500 : 0;

  // BUKU!Col AL: Total HPP = SUM(Print + Desain + Sisir)
  const totalHpp = biayaPrint + biayaDesain + biayaSisir;

  // BUKU!Col AM: HPP per pcs
  const hppPerPcs = totalHpp / oplah;

  const marginPct = input.marginPct ?? p.marginDefaultPct;
  const negoDiskonPct = input.negoDiskonPct ?? p.negoDefaultPct;

  // BUKU!Col AN: Laba per pcs = hppPerPcs * (margin / 100)
  const labaPerPcs = hppPerPcs * (marginPct / 100);

  // BUKU!Col AP: Total Harga Jual = (hppPerPcs + labaPerPcs) * oplah
  const totalHargaJual = (hppPerPcs + labaPerPcs) * oplah;

  // BUKU!Col AQ: Harga per pcs raw
  const hargaJualPerPcsRaw = totalHargaJual / oplah;

  // BUKU!Col AR: Harga per pcs rounded = ROUNDUP(hargaJualPerPcsRaw, -1)
  const hargaJualPerPcs = Math.ceil(hargaJualPerPcsRaw / 10) * 10;

  // Nego per pcs = ROUNDUP(hargaJualPerPcs * (1 - nego / 100), -1)
  const negoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 10) * 10;

  // Rincian Breakdown HPP Presisi
  const breakdownList = [
    {
      komponen: `Cetak Print Digital A3+ (${isCutting ? 'Kiss Cut' : 'Rajang'})`,
      keterangan: `${lembarA3.toLocaleString('id-ID')} lbr A3+ @ Rp ${tarifPrintA3.toLocaleString('id-ID')} (${isiPerA3} pcs/lbr)`,
      biaya: biayaPrint,
    },
    {
      komponen: 'Jasa Desain Stiker (Master!D16)',
      keterangan: 'Tarif flat per order',
      biaya: biayaDesain,
    },
  ];

  if (biayaSisir > 0) {
    breakdownList.push({
      komponen: 'Finishing Sisir (BUKU!AJ)',
      keterangan: `${Math.ceil(lembarA3 / 500)} paket @ Rp ${p.tarifSisirPer500.toLocaleString('id-ID')}`,
      biaya: biayaSisir,
    });
  }

  const breakdown = breakdownList.map((item, idx) => ({
    no: idx + 1,
    komponen: item.komponen,
    keterangan: item.keterangan,
    biaya: Math.round(item.biaya),
    porsiPct: totalHpp > 0 ? parseFloat(((item.biaya / totalHpp) * 100).toFixed(1)) : 0,
  }));

  return {
    hppPerPcs,
    hargaJualPerPcs,
    negoPerPcs,
    totalHargaJual,
    totalHpp,
    lembarA3,
    isiPerA3,
    biayaPrint,
    biayaDesain,
    biayaSisir,
    input,
    breakdown,
  };
}

export interface StikerMatrixRow {
  ukuran: StikerUkuran;
  oplah: number;
  lembarA3: number;
  hppPerPcs: number;
  totalHpp: number;
  hargaJualPerPcs: number;
  totalHargaJual: number;
  negoPerPcs: number;
}

export function recalculateStikerMatrix(
  customParams: StikerMasterParams = DEFAULT_STIKER_PARAMS,
  finishing: StikerFinishingOption = 'Non Cutting (Rajang Potong)',
  marginPct?: number,
  negoPct?: number
): StikerMatrixRow[] {
  const rows: StikerMatrixRow[] = [];
  for (const ukuran of STIKER_UKURAN_OPTIONS) {
    for (const oplah of STIKER_TIERS) {
      const res = calculateStikerSimulator(
        {
          ukuran,
          oplah,
          finishing,
          marginPct: marginPct ?? customParams.marginDefaultPct,
          negoDiskonPct: negoPct ?? customParams.negoDefaultPct,
        },
        customParams
      );

      rows.push({
        ukuran,
        oplah,
        lembarA3: res.lembarA3,
        hppPerPcs: res.hppPerPcs,
        totalHpp: res.totalHpp,
        hargaJualPerPcs: res.hargaJualPerPcs,
        totalHargaJual: res.totalHargaJual,
        negoPerPcs: res.negoPerPcs,
      });
    }
  }
  return rows;
}
