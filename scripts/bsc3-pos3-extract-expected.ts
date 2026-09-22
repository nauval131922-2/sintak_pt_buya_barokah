import ExcelJS from 'exceljs';
import { writeFileSync } from 'fs';

const BASE = 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/18. Pricelist Buku Soft Cover - 14,5 x 20,25 cm/Source';
const FILES: Record<string, string> = {
  'OO-14': 'BUKU UK. 14,5 x 20,25 - Cover Oliver - Isi Oliver',
  'OR-14': 'BUKU UK. 14,5 x 20,25 - Cover Oliver - Isi Ryobi',
  'PP-14': 'BUKU UK. 14,5 x 20,25 - Cover Print - Isi Print',
  'PR-14': 'BUKU UK. 14,5 x 20,25 - Cover Print - Isi Ryobi',
};
const COLS = ['H','Q','R','T','V','Y','AB','AD','AE','AF','AG','AI','AJ','AK','AL','AM','AN','AO','AP','AR','AT','AW','AX','AY','AZ','BA','BB','BC','BD','BF','BH','BI','BJ','BK','BL','BM','BN','BO','BP','BQ','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CE','CF','CG','CH','CI','CJ','CK','CL','CM','CN','CO','CP','CQ','CS','CT','CV','CW','CY','CZ','DA','DC','DD','DE','DF','DG','DH','DI'];

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
  for (const [combo, f] of Object.entries(FILES)) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(`${BASE}/${f}.xlsm`);
    const b = wb.getWorksheet('BUKU')!;
    const tiers: any[] = [];
    for (let r = 7; r <= 30; r++) {
      const h = num(b.getRow(r).getCell(8));
      if (h === null || h === 0) break;
      const t: any = {};
      for (const cl of COLS) t[cl] = num(b.getRow(r).getCell(cl));
      tiers.push(t);
    }
    out[combo] = tiers;
    console.log(combo, 'tiers:', tiers.map((t) => t.H).join(','), '| DI:', tiers.map((t) => t.DI).join(','));
  }
  writeFileSync('scripts/bsc3-expected.json', JSON.stringify(out, null, 1));
  console.log('wrote scripts/bsc3-expected.json');
}
main().catch((e) => { console.error('ERR', e); process.exit(1); });
