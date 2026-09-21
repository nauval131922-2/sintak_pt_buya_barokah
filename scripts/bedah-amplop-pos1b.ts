import ExcelJS from 'exceljs';

const BASE = 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/11. Pricelist Amplop/Source';
const FILES = ['Harga AMPLOP JADI - Besar 1 Warna.xlsm', 'Harga AMPLOP JADI - Besar FC.xlsm', 'Harga AMPLOP JADI - Tgg FC.xlsm'];

function fmtVal(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if ('formula' in o) return '=' + String(o.formula).replace(/\s+/g, ' ') + (o.result !== undefined ? ' => ' + fmtVal(o.result) : '');
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  return String(v);
}

async function main() {
  const only = process.argv[2] ?? '';
  for (const f of FILES) {
    if (only && !f.includes(only)) continue;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(BASE + '/' + f);
    console.log('========== ' + f + ' ==========');
    const b = wb.getWorksheet('BUKU')!;
    for (let r = 1; r <= 2; r++) {
      const row = b.getRow(r);
      const cells: string[] = [];
      for (let c = 1; c <= b.columnCount; c++) {
        const cell = row.getCell(c);
        if (cell.value === null || cell.value === undefined || cell.value === '') continue;
        cells.push(`${cell.address}=${fmtVal(cell.value)}`);
      }
      if (cells.length > 0) console.log(`  R${r}: ` + cells.join(' | '));
    }
    for (let r = 25; r <= 31; r++) {
      const row = b.getRow(r);
      const cells: string[] = [];
      for (let c = 1; c <= b.columnCount; c++) {
        const cell = row.getCell(c);
        if (cell.value === null || cell.value === undefined || cell.value === '') continue;
        cells.push(`${cell.address}=${fmtVal(cell.value)}`);
      }
      console.log(`  R${r}: ` + (cells.length > 0 ? cells.join(' | ') : '(kosong)'));
    }
    // Master ringkas per file
    const m = wb.getWorksheet('Master')!;
    const keys = ['D5', 'D6', 'D7', 'D8', 'D10', 'D11', 'D12', 'E12', 'D13', 'D14', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'E20'];
    console.log('  [Master]');
    for (const a of keys) console.log(`    Master!${a} = ${fmtVal(m.getCell(a).value)}`);
    // BUKU row6-7 kunci
    const bkeys = ['C6', 'K6', 'R6', 'S6', 'U6', 'V6', 'X6', 'AE6', 'AF6', 'AG6', 'AL6', 'AR7', 'K2', 'P2', 'V2', 'R30', 'S28', 'U28'];
    console.log('  [BUKU kunci]');
    for (const a of bkeys) console.log(`    BUKU!${a} = ${fmtVal(b.getCell(a).value)}`);
    console.log('  [BUKU H7:H24 tiers]');
    const tiers: string[] = [];
    for (let r = 7; r <= 24; r++) tiers.push(fmtVal(b.getCell(`H${r}`).value));
    console.log('    ' + tiers.join(' | '));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
