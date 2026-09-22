import { readFile } from 'xlsx';
import { writeFileSync } from 'fs';

const BASE = 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026';
// Kolom BUKU yang dibaca sebagai oracle (nilai cached): tier + seluruh intermediate + DI/DD.
const COLS = ['H', 'Q', 'R', 'T', 'V', 'Y', 'Z', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AR', 'AT', 'AW', 'AX', 'AY', 'AZ', 'BA', 'BB', 'BC', 'BD', 'BI', 'BJ', 'BK', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BS', 'BT', 'BV', 'BY', 'BZ', 'CD', 'CE', 'CF', 'CH', 'CI', 'CK', 'CL', 'CN', 'CS', 'CT', 'CV', 'CY', 'CZ', 'DA', 'DC', 'DD', 'DE', 'DH', 'DI'];
const FILES: [string, string][] = [
  ['custom-pp145-19', '19. Pricelist Buku Soft Cover - 14,5 x 20,25 cm/Source/BUKU UK. 14,5 x 20,25 - Cover Print - Isi Print.xlsm'],
  ['custom-pr145-19', '19. Pricelist Buku Soft Cover - 14,5 x 20,25 cm/Source/BUKU UK. 14,5 x 20,25 - Cover Print - Isi Ryobi.xlsm'],
  ['custom-oo145-21', '21. Pricelist Buku Soft Cover - 14,5 x 20,25 cm/Source/BUKU UK. 14,5 x 20,25 - Cover Oliver - Isi Oliver.xlsm'],
  ['custom-or145-21', '21. Pricelist Buku Soft Cover - 14,5 x 20,25 cm/Source/BUKU UK. 14,5 x 20,25 - Cover Oliver - Isi Ryobi.xlsm'],
  ['custom-pp145-21', '21. Pricelist Buku Soft Cover - 14,5 x 20,25 cm/Source/BUKU UK. 14,5 x 20,25 - Cover Print - Isi Print.xlsm'],
  ['custom-pr145-21', '21. Pricelist Buku Soft Cover - 14,5 x 20,25 cm/Source/BUKU UK. 14,5 x 20,25 - Cover Print - Isi Ryobi.xlsm'],
  ['custom-oo105-24', '24. Pricelist Buku Soft Cover - 10,5 x 14,8 cm/Source/BUKU UK. 10,5 X 14,8 - Cover Oliver - Isi Oliver.xlsm'],
  ['custom-po105-24', '24. Pricelist Buku Soft Cover - 10,5 x 14,8 cm/Source/BUKU UK. 10,5 X 14,8 - Cover Print - Isi Oliver.xlsm'],
  ['custom-pp105-24', '24. Pricelist Buku Soft Cover - 10,5 x 14,8 cm/Source/BUKU UK. 10,5 X 14,8 - Cover Print - Isi Print.xlsm'],
  ['custom-pr105-24', '24. Pricelist Buku Soft Cover - 10,5 x 14,8 cm/Source/BUKU UK. 10,5 X 14,8 - Cover Print - Isi Ryobi.xlsm'],
];

const out: Record<string, { oplah: number; DI: number; DD: number; row: Record<string, number> }[]> = {};
for (const [lini, rel] of FILES) {
  const wb = readFile(`${BASE}/${rel}`, { cellFormula: false });
  const B = wb.Sheets['BUKU'];
  const rows: { oplah: number; DI: number; DD: number; row: Record<string, number> }[] = [];
  for (let r = 7; r <= 40; r++) {
    const h = B[`H${r}`] ? B[`H${r}`].v : undefined;
    if (typeof h !== 'number' || h <= 0) continue;
    const row: Record<string, number> = {};
    for (const c of COLS) {
      const v = B[`${c}${r}`] ? B[`${c}${r}`].v : undefined;
      row[c] = typeof v === 'number' ? v : NaN;
    }
    rows.push({ oplah: h, DI: row['DI'], DD: row['DD'], row });
  }
  out[lini] = rows;
  console.log(lini, rows.length, 'tiers');
}
writeFileSync('scripts/bsc4-expected.json', JSON.stringify(out));
console.log('wrote scripts/bsc4-expected.json');
