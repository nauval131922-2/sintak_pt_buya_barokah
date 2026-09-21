import ExcelJS from 'exceljs';
import fs from 'fs';
import JSZip from 'jszip';

const BASE = 'E:/percetakan buya barokah/backup/a1/02__PEMASARAN/0203_SURAT PENAWARAN HARGA (SPH) out/020326 2026 SURAT PENAWARAN HARGA (SPH) out/Pricelist Juli 2026/11. Pricelist Amplop/Source';
const FILES = ['Harga AMPLOP JADI - Besar 1 Warna.xlsm', 'Harga AMPLOP JADI - Besar FC.xlsm', 'Harga AMPLOP JADI - Tgg FC.xlsm'];

function fmtVal(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if ('formula' in o) return '=' + String(o.formula).replace(/\s+/g, ' ').slice(0, 220) + (o.result !== undefined ? ' => ' + fmtVal(o.result) : '');
    if ('richText' in o) return (o.richText as Array<{ text: string }>).map((t) => t.text).join('');
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  return String(v);
}

async function dumpSheet(wb: ExcelJS.Workbook, name: string, maxRows = 60) {
  const ws = wb.getWorksheet(name);
  if (!ws) { console.log(`  [${name} tidak ditemukan]`); return; }
  console.log(`--- ${name} (rows=${ws.rowCount} cols=${ws.columnCount}) ---`);
  for (let r = 1; r <= Math.min(ws.rowCount, maxRows); r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = 1; c <= ws.columnCount; c++) {
      const cell = row.getCell(c);
      if (cell.value === null || cell.value === undefined || cell.value === '') continue;
      cells.push(`${cell.address}=${fmtVal(cell.value)}`);
    }
    if (cells.length > 0) console.log(`  R${r}: ` + cells.join(' | '));
  }
}

async function dumpValidationsAndNames(f: string) {
  const buf = fs.readFileSync(BASE + '/' + f);
  const zip = await JSZip.loadAsync(buf);
  const wbXml = await zip.file('xl/workbook.xml')?.async('string') ?? '';
  const sheets = [...wbXml.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*>/g)].map((m) => m[1]);
  console.log('  sheets: ' + sheets.join(', '));
  // petakan sheetId -> nama via urutan file
  const sheetFiles = Object.keys(zip.files).filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p)).sort();
  console.log('  urutan file: ' + sheetFiles.join(', '));
  const names = [...wbXml.matchAll(/<definedName name="([^"]+)">([^<]*)<\/definedName>/g)]
    .filter((m) => !m[2].includes('#REF!') && !m[2].includes('['));
  console.log('  definedNames lokal:');
  for (const m of names) console.log(`    ${m[1]} = ${m[2]}`);
  for (const sf of sheetFiles) {
    const xml = await zip.file(sf)?.async('string') ?? '';
    const all = [...xml.matchAll(/<dataValidation\b([\s\S]*?)<\/dataValidation>/g)];
    // blok pertama bisa jadi wrapper <dataValidations>; lewati yang tanpa sqref
    let n = 0;
    for (const b of all) {
      const open = '<dataValidation' + b[1].slice(0, b[1].indexOf('>'));
      const sqref = /sqref="([^"]+)"/.exec(open)?.[1];
      if (!sqref) continue;
      n++;
      const type = /type="([^"]+)"/.exec(open)?.[1] ?? '?';
      const f1 = /<formula1>([\s\S]*?)<\/formula1>/.exec(b[1])?.[1]?.replace(/&quot;/g, '"').slice(0, 200) ?? '';
      console.log(`    [${sf}] ${sqref} type=${type} f1=${f1}`);
    }
    if (n > 0) console.log(`  -- ${sf}: ${n} dataValidation --`);
  }
  // jargon check
  const TERMS = ['POD', 'CTP', 'Artwork', 'Die Cut', 'Waste', 'Overhead'];
  for (const t of ['xl/sharedStrings.xml', ...sheetFiles]) {
    const xml = await zip.file(t)?.async('string') ?? '';
    for (const term of TERMS) {
      const m = new RegExp(term, 'gi');
      const hits = xml.match(m) ?? [];
      if (hits.length > 0) {
        const i = xml.search(m);
        console.log(`  [JARGON ${t}] "${term}" x${hits.length}: ...${xml.slice(Math.max(0, i - 70), i + 70).replace(/\s+/g, ' ')}...`);
      }
    }
  }
}

async function main() {
  const only = process.argv[2] ?? '';
  for (const f of FILES) {
    if (only && !f.includes(only)) continue;
    console.log('========== ' + f + ' ==========');
    await dumpValidationsAndNames(f);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(BASE + '/' + f);
    for (const ws of wb.worksheets) {
      if (/^Menu|02a|Digit/i.test(ws.name)) { console.log(`--- ${ws.name} (skip isi, rows=${ws.rowCount}) ---`); continue; }
      await dumpSheet(wb, ws.name, 60);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
