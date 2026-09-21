import ExcelJS from 'exceljs';

const BASE = 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/11. Pricelist Amplop/Source';
const FILES = ['Harga AMPLOP JADI - Besar 1 Warna.xlsm', 'Harga AMPLOP JADI - Besar FC.xlsm', 'Harga AMPLOP JADI - Tgg FC.xlsm'];

function num(v: unknown): number | string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const r = o.result;
    if (typeof r === 'number') return r;
    return 'ERR:' + String(r);
  }
  return typeof v === 'number' ? v : 'STR:' + String(v);
}

async function main() {
  for (const f of FILES) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(BASE + '/' + f);
    const b = wb.getWorksheet('BUKU')!;
    const tag = f.includes('Besar 1 Warna') ? 'BESAR1W' : f.includes('Besar FC') ? 'BESARFC' : 'TGGFC';
    console.log(`// ${tag} (h, ai, aj, ak, an, ao, ap, aq)`);
    const rows: string[] = [];
    for (let r = 7; r <= 19; r++) {
      rows.push(`  { h: ${num(b.getCell(`H${r}`).value)}, ai: ${num(b.getCell(`AI${r}`).value)}, aj: ${num(b.getCell(`AJ${r}`).value)}, ak: ${num(b.getCell(`AK${r}`).value)}, an: ${num(b.getCell(`AN${r}`).value)}, ao: ${num(b.getCell(`AO${r}`).value)}, ap: ${num(b.getCell(`AP${r}`).value)}, aq: ${num(b.getCell(`AQ${r}`).value)} },`);
    }
    console.log(`const EXP_${tag} = [\n${rows.join('\n')}\n];`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
