import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const FILES = [
  {
    jenis: 'NON CUTTING',
    ukuran: '7.5 x 6 cm',
    file: 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/23. Stiker/Source/Pricelist Stiker Uk. 7.5 x 6 cm.xlsm',
  },
  {
    jenis: 'NON CUTTING',
    ukuran: '8 x 5 cm',
    file: 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/23. Stiker/Source/Pricelist Stiker Uk. 8 x 5 cm.xlsm',
  },
  {
    jenis: 'NON CUTTING',
    ukuran: '9.5 x 6.5 cm',
    file: 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/23. Stiker/Source/Pricelist Stiker Uk. 9.5 x 6.5 cm.xlsm',
  },
  {
    jenis: 'NON CUTTING',
    ukuran: '10 x 12 cm',
    file: 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/23. Stiker/Source/Pricelist Stiker Uk. 10 x 12 cm.xlsm',
  },
  {
    jenis: 'NON CUTTING',
    ukuran: '21 x 29,7 cm',
    file: 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/23. Stiker/Source/Pricelist Stiker Uk. 21 x 29,7 cm.xlsm',
  },
  {
    jenis: 'CUTTING',
    ukuran: '7.5 x 6 cm',
    file: 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/23. Pricelist Stiker/Backup/Pricelist Stiker Uk. 7.5 x 6 cm Cutting.xlsm',
  },
  {
    jenis: 'CUTTING',
    ukuran: '8 x 5 cm',
    file: 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/23. Pricelist Stiker/Backup/Pricelist Stiker Uk. 8 x 5 cm Cutting.xlsm',
  },
  {
    jenis: 'CUTTING',
    ukuran: '9.5 x 6.5 cm',
    file: 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/23. Pricelist Stiker/Backup/Pricelist Stiker Uk. 9.5 x 6.5 cm Cutting.xlsm',
  },
  {
    jenis: 'CUTTING',
    ukuran: '10 x 12 cm',
    file: 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/23. Pricelist Stiker/Backup/Pricelist Stiker Uk. 10 x 12 cm Cutting.xlsm',
  },
  {
    jenis: 'CUTTING',
    ukuran: '21 x 29,7 cm',
    file: 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/23. Pricelist Stiker/Backup/Pricelist Stiker Uk. 21 x 29,7 cm Cutting.xlsm',
  },
];

const getNum = (cell: any): number | null => {
  if (!cell || cell.value == null) return null;
  const v = cell.value;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && 'result' in v) {
    return typeof v.result === 'number' ? v.result : null;
  }
  return null;
};

export interface StikerExpectedTier {
  row: number;
  oplah: number;
  isiPerA3: number;
  lembarA3: number;
  biayaPrint: number;
  desain: number;
  sisir: number;
  totalHpp: number;
  hppPerPcs: number;
  labaPerPcs: number;
  totalHargaJual: number;
  hargaJualPerPcs: number;
}

export interface StikerExpectedEntry {
  jenis: string;
  ukuran: string;
  file: string;
  masterParams: {
    jenisStiker: string;
    ukuran: string;
    umr: number;
    jenisCetak: string;
    bahan: string;
    gramatur: number;
    hargaPerKg: number;
    insheet: number;
    desain: number;
    jenisWarna: string;
    mukaCetak: string;
    hargaPrintA3: number;
    finishing: string;
    marginPct: number;
  };
  tiers: StikerExpectedTier[];
}

async function extractAll() {
  console.log('=== MEMULAI EKSTRAKSI 10 FILE EXCEL STIKER ===');
  const results: Record<string, StikerExpectedEntry> = {};

  for (const item of FILES) {
    const key = `${item.jenis}__${item.ukuran}`;
    console.log(`\nEkstraksi ${key}...`);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(item.file);
    const master = wb.getWorksheet('Master')!;
    const buku = wb.getWorksheet('BUKU')!;

    const masterParams = {
      jenisStiker: String(master.getRow(5).getCell(4).value ?? ''),
      ukuran: String(master.getRow(6).getCell(4).value ?? ''),
      umr: Number(getNum(master.getRow(8).getCell(4)) ?? 0),
      jenisCetak: String(master.getRow(10).getCell(4).value ?? ''),
      bahan: String(master.getRow(11).getCell(4).value ?? ''),
      gramatur: Number(getNum(master.getRow(12).getCell(4)) ?? 0),
      hargaPerKg: Number(getNum(master.getRow(13).getCell(4)) ?? 0),
      insheet: Number(getNum(master.getRow(15).getCell(4)) ?? 0),
      desain: Number(getNum(master.getRow(16).getCell(4)) ?? 0),
      jenisWarna: String(master.getRow(17).getCell(4).value ?? ''),
      mukaCetak: String(master.getRow(18).getCell(4).value ?? ''),
      hargaPrintA3: Number(getNum(master.getRow(19).getCell(4)) ?? 0),
      finishing: String(master.getRow(21).getCell(4).value ?? ''),
      marginPct: Number(getNum(master.getRow(22).getCell(5)) ?? 30),
    };

    const tiers: StikerExpectedTier[] = [];
    for (let r = 7; r <= 22; r++) {
      const row = buku.getRow(r);
      const oplah = getNum(row.getCell(8));
      if (!oplah || oplah <= 0) continue;

      tiers.push({
        row: r,
        oplah,
        isiPerA3: getNum(row.getCell(15)) ?? 0,
        lembarA3: getNum(row.getCell(17)) ?? 0,
        biayaPrint: getNum(row.getCell(18)) ?? 0,
        desain: getNum(row.getCell(20)) ?? 0,
        sisir: getNum(row.getCell(36)) ?? 0,
        totalHpp: getNum(row.getCell(38)) ?? 0,
        hppPerPcs: getNum(row.getCell(39)) ?? 0,
        labaPerPcs: getNum(row.getCell(40)) ?? 0,
        totalHargaJual: getNum(row.getCell(42)) ?? 0,
        hargaJualPerPcs: getNum(row.getCell(44)) ?? 0,
      });
    }

    console.log(`  -> Berhasil ekstrak ${tiers.length} tier (Oplah ${tiers[0].oplah} s.d. ${tiers[tiers.length - 1].oplah})`);
    results[key] = {
      jenis: item.jenis,
      ukuran: item.ukuran,
      file: item.file,
      masterParams,
      tiers,
    };
  }

  const outPath = 'scripts/stiker-expected.json';
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n[OK] Seluruh data acuan berhasil disimpan ke ${outPath} (${Object.keys(results).length} file / kombinasi)`);
}

extractAll().catch(err => {
  console.error('Extraction error:', err);
  process.exit(1);
});
