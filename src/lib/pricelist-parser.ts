// ponytail: parse sheet HARGA from Pricelist Kalender 2027 Spiral.xlsx
export interface ParsedPricelistRow {
  jenis_kalender: string;
  oplah: number;
  proses: string;
  bahan: string;
  ukuran: string;
  hpp: number;
  harga: number;
  harga_nego: number;
  profit_pct: number;
  profit_pct_nego: number;
  profit_tot: number;
  profit_tot_nego: number;
}

export interface ParsePricelistResult {
  title: string;
  lastUpdatedDate: string | null;
  notes: string[];
  records: ParsedPricelistRow[];
}

export function parsePricelistWorkbook(workbook: any): ParsePricelistResult {
  const sheetName = workbook.SheetNames.find((n: string) => n.toUpperCase() === 'HARGA');
  if (!sheetName) {
    throw new Error("Format file Excel tidak sesuai. File harus memiliki sheet bernama 'HARGA'.");
  }

  const ws = workbook.Sheets[sheetName];
  if (!ws) throw new Error("Sheet 'HARGA' tidak ditemukan atau kosong.");

  const getVal = (col: number, row: number) => {
    const colLetter = getColLetter(col);
    const cell = ws[`${colLetter}${row}`];
    return cell ? cell.v : null;
  };

  // Validasi struktur header baris 4 & baris 6
  const hvsHeader = String(getVal(9, 4) || '').trim().toUpperCase(); // Col I4: HVS 70
  const hppHeader = String(getVal(8, 6) || '').trim().toUpperCase(); // Col H6: HPP
  const hargaHeader = String(getVal(9, 6) || '').trim().toUpperCase(); // Col I6: HARGA

  if (!hvsHeader.includes('HVS') || hppHeader !== 'HPP' || hargaHeader !== 'HARGA') {
    throw new Error("Struktur kolom sheet 'HARGA' tidak sesuai format master Pricelist Kalender.");
  }

  const title = getVal(2, 1) ? String(getVal(2, 1)).trim() : 'Pricelist Kalender';
  const rawDate = getVal(3, 3);
  const lastUpdatedDate = rawDate ? String(rawDate).trim() : null;

  const materials: Array<{ name: string; sizes: Array<{ col: number; size: string }> }> = [
    {
      name: 'HVS 70',
      sizes: [
        { col: 8, size: '32 x 48' },
        { col: 16, size: '38 x 54' },
        { col: 24, size: '46 x 64' },
        { col: 32, size: '48 x 64' },
      ],
    },
    {
      name: 'ART PAPER 120',
      sizes: [
        { col: 41, size: '32 x 48' },
        { col: 49, size: '38 x 54' },
        { col: 57, size: '46 x 64' },
        { col: 65, size: '48 x 64' },
      ],
    },
    {
      name: 'ART PAPER 150',
      sizes: [
        { col: 74, size: '32 x 48' },
        { col: 82, size: '38 x 54' },
        { col: 90, size: '46 x 64' },
        { col: 98, size: '48 x 64' },
      ],
    },
  ];

  const blocks: Array<{ name: string; startRow: number; endRow: number }> = [
    { name: 'Eko Wulan (12 Lbr)', startRow: 7, endRow: 12 },
    { name: 'Dwi Wulan (6 Lbr)', startRow: 17, endRow: 22 },
    { name: 'Tri Wulan (4 Lbr)', startRow: 27, endRow: 32 },
  ];

  const records: ParsedPricelistRow[] = [];

  for (const block of blocks) {
    for (let r = block.startRow; r <= block.endRow; r++) {
      const oplahVal = getVal(5, r);
      if (oplahVal === null || oplahVal === undefined || oplahVal === '') continue;
      const oplah = Number(oplahVal) || 0;
      const proses = String(getVal(6, r) || '').trim();

      for (const mat of materials) {
        for (const s of mat.sizes) {
          const hpp = Number(getVal(s.col, r)) || 0;
          const harga = Number(getVal(s.col + 1, r)) || 0;
          const harga_nego = Number(getVal(s.col + 2, r)) || 0;
          const profit_pct = Number(getVal(s.col + 3, r)) || 0;
          const profit_pct_nego = Number(getVal(s.col + 4, r)) || 0;
          const profit_tot = Number(getVal(s.col + 5, r)) || 0;
          const profit_tot_nego = Number(getVal(s.col + 6, r)) || 0;

          records.push({
            jenis_kalender: block.name,
            oplah,
            proses,
            bahan: mat.name,
            ukuran: s.size,
            hpp,
            harga,
            harga_nego,
            profit_pct,
            profit_pct_nego,
            profit_tot,
            profit_tot_nego,
          });
        }
      }
    }
  }

  // Notes extraction
  const notes: string[] = [];
  for (let r = 35; r <= 44; r++) {
    const v = getVal(3, r);
    if (v && String(v).trim()) {
      notes.push(String(v).trim());
    }
  }

  return { title, lastUpdatedDate, notes, records };
}

function getColLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}
