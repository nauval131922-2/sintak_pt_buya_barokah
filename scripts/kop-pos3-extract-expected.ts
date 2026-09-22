import ExcelJS from 'exceljs';
import { writeFileSync } from 'fs';

const BASE = 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/15. Pricelist kartu Koperasi Promise/Source';
const FILES: Record<string, string> = {
  '10,5 x 16,5': '10,5 x 16,5',
  '10,5 x 21,5': '10,5 x 21,5',
  '12,7 x 16,3': '12,7 x 16,3',
};
// col index -> key
const COLS: Record<number, string> = {
  8: 'H', 11: 'K', 16: 'P', 17: 'Q', 19: 'S', 21: 'U', 24: 'X', 29: 'AC',
  30: 'AD', 31: 'AE', 32: 'AF', 34: 'AH', 36: 'AJ', 37: 'AK', 38: 'AL',
  39: 'AM', 40: 'AN', 43: 'AQ', 46: 'AT', 49: 'AW', 54: 'BB', 56: 'BD', 57: 'BE', 62: 'BJ',
};

const num = (c: any): number | null => {
  const v = c?.value;
  if (v == null) return null;
  if (typeof v === 'object') {
    if ('formula' in v || 'sharedFormula' in v) return typeof v.result === 'number' ? v.result : null;
    return null;
  }
  return typeof v === 'number' ? v : null;
};

async function main() {
  const out: any = {};
  for (const [varian, f] of Object.entries(FILES)) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(`${BASE}/KARTU KOPERASI - PROMISE ${f} cm.xlsm`);
    const b = wb.getWorksheet('BUKU')!;
    const tiers: any[] = [];
    for (let r = 7; r <= 21; r++) {
      const row = b.getRow(r);
      const t: any = { row: r };
      for (const [c, k] of Object.entries(COLS)) t[k] = num(row.getCell(Number(c)));
      tiers.push(t);
    }
    out[varian] = tiers;
    console.log(varian, 'tiers:', tiers.map((t) => t.H).join(','));
  }
  writeFileSync('scripts/kop-expected.json', JSON.stringify(out, null, 1));
  console.log('wrote scripts/kop-expected.json');
}
main().catch((e) => { console.error('ERR', e); process.exit(1); });
