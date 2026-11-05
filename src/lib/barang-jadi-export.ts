import ExcelJS from 'exceljs';
import db from '@/lib/db';
import { buildFtsQuery } from '@/lib/fts';

export interface BarangJadiFilterParams {
  from?: string;
  to?: string;
  search?: string;
  warningOnly?: boolean;
  soOnly?: boolean;
}

export interface BarangJadiExportRow {
  id: number;
  tgl: string;
  faktur: string;
  faktur_prd: string;
  faktur_so: string;
  kd_pelanggan: string;
  nama_barang: string;
  kd_barang?: string;
  qty: number;
  satuan: string;
  hp: number;
  hp_total: number;
  profit_30?: number;
  hp_rata_rata: number;
  harga_so_sales_order: number;
  harga_so_penjualan: number;
  keterangan: string;
}

export interface BarangJadiExportMeta {
  from?: string;
  to?: string;
  search?: string;
  warningOnly?: boolean;
  soOnly?: boolean;
  totalRows: number;
}

interface RawBarangJadiDbRow {
  id?: number | string | null;
  tgl?: string | null;
  faktur?: string | null;
  faktur_prd?: string | null;
  faktur_so?: string | null;
  kd_pelanggan?: string | null;
  nama_barang?: string | null;
  kd_barang?: string | null;
  qty?: number | string | null;
  satuan?: string | null;
  hp?: number | string | null;
  hp_total?: number | string | null;
  hp_rata_rata?: number | string | null;
  harga_so_sales_order?: number | string | null;
  harga_so_penjualan?: number | string | null;
  keterangan?: string | null;
}

const NAVY = 'FF2F5597';
const TITLE_NAVY = 'FF1F4E78';
const SUBTITLE_GRAY = 'FF595959';
const BORDER_GRAY = 'FFD9D9D9';
const ZEBRA = 'FFF9FAFB';
const WARNING_ROSE = 'FFFFF1F2';
const TOTAL_BG = 'FFF2F4F7';

const thin = { style: 'thin' as const, color: { argb: BORDER_GRAY } };
const cellBorder = { left: thin, right: thin, top: thin, bottom: thin };

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '';
  const sep = dateStr.includes('/') ? '/' : dateStr.includes('-') ? '-' : '';
  if (!sep) return dateStr;
  const parts = dateStr.split(sep);
  if (parts.length !== 3) return dateStr;

  let y = 0;
  let m = 0;
  let d = 0;

  if (parts[0].length === 4) {
    y = Number(parts[0]);
    m = Number(parts[1]);
    d = Number(parts[2]);
  } else if (parts[2].length === 4) {
    d = Number(parts[0]);
    m = Number(parts[1]);
    y = Number(parts[2]);
  } else {
    return dateStr;
  }

  if (!y || !m || !d || m < 1 || m > 12) return dateStr;
  return `${String(d).padStart(2, '0')} ${BULAN[m - 1]} ${y}`;
}

export function tglToExcelSerial(tgl: unknown): number | string {
  if (!tgl) return '';
  const str = String(tgl).trim().split('T')[0];
  const sep = str.includes('/') ? '/' : str.includes('-') ? '-' : '';
  if (!sep) return str;
  const parts = str.split(sep);
  if (parts.length !== 3) return str;

  let y = 0;
  let m = 0;
  let d = 0;

  if (parts[0].length === 4) {
    y = Number(parts[0]);
    m = Number(parts[1]);
    d = Number(parts[2]);
  } else if (parts[2].length === 4) {
    d = Number(parts[0]);
    m = Number(parts[1]);
    y = Number(parts[2]);
  } else {
    return str;
  }

  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) {
    return str;
  }

  const dt = new Date(Date.UTC(y, m - 1, d));
  if (isNaN(dt.getTime())) return str;
  return (dt.getTime() / 86400000) + 25569;
}

export function checkHasWarning(row: {
  hp: number;
  hp_rata_rata: number;
  harga_so_sales_order: number;
  harga_so_penjualan: number;
}): boolean {
  const hp = Number(row.hp || 0);
  const hp_avg = Number(row.hp_rata_rata || 0);
  const so_ord = Number(row.harga_so_sales_order || 0);
  const so_penj = Number(row.harga_so_penjualan || 0);
  return (so_ord > 0 && (so_ord < hp || so_ord < hp_avg)) ||
         (so_penj > 0 && (so_penj < hp || so_penj < hp_avg));
}

export function formatAnalisaHarga(row: {
  hp: number;
  hp_rata_rata: number;
  harga_so_sales_order: number;
  harga_so_penjualan: number;
}): string {
  const hp = Number(row.hp || 0);
  const hp_avg = Number(row.hp_rata_rata || 0);
  const so_ord = Number(row.harga_so_sales_order || 0);
  const so_penj = Number(row.harga_so_penjualan || 0);

  if (so_ord === 0 && so_penj === 0) {
    return 'SO Kosong';
  }

  const formatCurrency = (val: number) => {
    const absVal = Math.abs(val);
    return (val < 0 ? '-' : '+') + 'Rp ' + absVal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatDiff = (label: string, diff: number, baseVal: number) => {
    const isLoss = diff < 0;
    let pctStr = '';
    if (baseVal > 0) {
      const pct = (Math.abs(diff) / baseVal) * 100;
      pctStr = ` (${pct.toFixed(1)}%)`;
    }
    const warn = isLoss ? '⚠️ ' : '';
    return `${warn}${label}: ${formatCurrency(diff)}${pctStr}`;
  };

  const lines: string[] = [];
  if (so_ord > 0) {
    lines.push(formatDiff('SO vs HP BJ', so_ord - hp, hp));
    lines.push(formatDiff('SO vs HP Rata2', so_ord - hp_avg, hp_avg));
  }
  if (so_penj > 0) {
    lines.push(formatDiff('Jual vs HP BJ', so_penj - hp, hp));
    lines.push(formatDiff('Jual vs HP Rata2', so_penj - hp_avg, hp_avg));
  }

  return lines.length > 0 ? lines.join('\n') : 'SO Kosong';
}

function wrapLines(text: string, perLine: number): number {
  if (!text) return 1;
  const paragraphs = String(text).split('\n');
  let totalLines = 0;
  for (const p of paragraphs) {
    let lines = 1;
    let used = 0;
    for (const word of p.split(/\s+/)) {
      if (!word) continue;
      if (used === 0) {
        used = word.length;
      } else if (used + 1 + word.length <= perLine) {
        used += 1 + word.length;
      } else {
        lines += 1;
        used = word.length;
      }
    }
    totalLines += lines;
  }
  return Math.max(1, totalLines);
}

const ENRICH_JOINS = `
  LEFT JOIN (
    SELECT faktur_prd, kd_barang,
      SUM(hp_total)*1.0 / NULLIF(SUM(qty), 0) AS hp_rata_rata
    FROM barang_jadi
    GROUP BY faktur_prd, kd_barang
  ) avg ON avg.faktur_prd = bj.faktur_prd AND avg.kd_barang = bj.kd_barang
  LEFT JOIN (
    SELECT faktur, MIN(harga) AS harga FROM sales_orders GROUP BY faktur
  ) so ON so.faktur = bj.faktur_so
  LEFT JOIN (
    SELECT faktur_so, MIN(harga) AS harga FROM sales_reports GROUP BY faktur_so
  ) sr ON sr.faktur_so = bj.faktur_so
`;

const SELECT_FIELDS = `
  bj.id,
  bj.tgl,
  bj.faktur,
  bj.faktur_prd,
  bj.faktur_so,
  bj.kd_pelanggan,
  bj.nama_barang,
  bj.kd_barang,
  bj.qty,
  COALESCE(bj.satuan, json_extract(bj.raw_data, '$.satuan')) AS satuan,
  bj.hp,
  COALESCE(NULLIF(bj.hp_total, 0), CAST(json_extract(bj.raw_data, '$.jmlhp') AS REAL), bj.qty * bj.hp, 0) AS hp_total,
  bj.keterangan,
  avg.hp_rata_rata,
  so.harga AS harga_so_sales_order,
  sr.harga AS harga_so_penjualan
`;

const ORDER_BY = `ORDER BY substr(bj.tgl, 7, 4) DESC, substr(bj.tgl, 4, 2) DESC, substr(bj.tgl, 1, 2) DESC, bj.id DESC`;

export async function fetchBarangJadiExportRows(params: BarangJadiFilterParams): Promise<BarangJadiExportRow[]> {
  const fromDate = params.from || '';
  const toDate = params.to || '';
  const search = params.search?.trim() || '';
  const warningOnly = Boolean(params.warningOnly);
  const soOnly = Boolean(params.soOnly);

  const dateFilterSQL = (fromDate && toDate)
    ? ` AND (substr(bj.tgl, 7, 4) || '-' || substr(bj.tgl, 4, 2) || '-' || substr(bj.tgl, 1, 2) BETWEEN ? AND ?)`
    : ``;
  const dateArgs = (fromDate && toDate) ? [fromDate, toDate] : [];

  const warningFilterSQL = warningOnly
    ? `((so.harga > 0 AND (so.harga < bj.hp OR so.harga < avg.hp_rata_rata)) OR (sr.harga > 0 AND (sr.harga < bj.hp OR sr.harga < avg.hp_rata_rata)))`
    : '';
  const soFilterSQL = soOnly
    ? `(bj.faktur_so IS NOT NULL AND TRIM(bj.faktur_so) NOT IN ('', '-', '–', '—'))`
    : '';

  const postFilters = [warningFilterSQL, soFilterSQL].filter(Boolean);
  const postWhere = postFilters.length > 0
    ? ` AND ` + postFilters.map(f => `(${f})`).join(' AND ')
    : '';

  let rawRows: RawBarangJadiDbRow[] = [];

  if (search) {
    const ftsQuery = buildFtsQuery(search);

    if (ftsQuery) {
      try {
        const res = await db.execute({
          sql: `SELECT ${SELECT_FIELDS}
                FROM barang_jadi bj
                JOIN barang_jadi_fts fts ON bj.id = fts.rowid
                ${ENRICH_JOINS}
                WHERE barang_jadi_fts MATCH ? ${dateFilterSQL}${postWhere}
                ${ORDER_BY}`,
          args: [ftsQuery, ...dateArgs],
        });
        rawRows = res.rows as unknown as RawBarangJadiDbRow[];
      } catch {
        rawRows = [];
      }
    }

    if (rawRows.length === 0) {
      const query = `%${search}%`;
      const likeArgs = [...Array(7).fill(query), ...dateArgs];
      const likeWhere = `(CAST(bj.id AS TEXT) LIKE ? OR bj.nama_barang LIKE ? OR bj.nama_prd LIKE ? OR bj.kd_barang LIKE ? OR bj.faktur LIKE ? OR bj.faktur_prd LIKE ? OR bj.satuan LIKE ?)`;

      const res = await db.execute({
        sql: `SELECT ${SELECT_FIELDS}
              FROM barang_jadi bj
              ${ENRICH_JOINS}
              WHERE ${likeWhere}${dateFilterSQL}${postWhere}
              ${ORDER_BY}`,
        args: likeArgs,
      });
      rawRows = res.rows as unknown as RawBarangJadiDbRow[];
    }
  } else {
    const baseWhere = `WHERE 1=1${dateFilterSQL}`;
    const res = await db.execute({
      sql: `SELECT ${SELECT_FIELDS}
            FROM barang_jadi bj
            ${ENRICH_JOINS}
            ${baseWhere}${postWhere}
            ${ORDER_BY}`,
      args: dateArgs,
    });
    rawRows = res.rows as unknown as RawBarangJadiDbRow[];
  }

  return rawRows.map(r => ({
    id: Number(r.id),
    tgl: String(r.tgl || ''),
    faktur: String(r.faktur || ''),
    faktur_prd: String(r.faktur_prd || ''),
    faktur_so: String(r.faktur_so || ''),
    kd_pelanggan: String(r.kd_pelanggan || ''),
    nama_barang: String(r.nama_barang || ''),
    kd_barang: String(r.kd_barang || ''),
    qty: Number(r.qty || 0),
    satuan: String(r.satuan || ''),
    hp: Number(r.hp || 0),
    hp_total: Number(r.hp_total || 0),
    profit_30: Number(r.hp || 0) * 1.3,
    hp_rata_rata: Number(r.hp_rata_rata || 0),
    harga_so_sales_order: Number(r.harga_so_sales_order || 0),
    harga_so_penjualan: Number(r.harga_so_penjualan || 0),
    keterangan: String(r.keterangan || ''),
  }));
}

export async function buildBarangJadiWorkbook(
  rows: BarangJadiExportRow[],
  meta: BarangJadiExportMeta
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('BARANG JADI', {
    views: [{ showGridLines: false, state: 'frozen', xSplit: 0, ySplit: 4, topLeftCell: 'A5', activeCell: 'A5' }],
  });

  ws.columns = [
    { key: 'no', width: 6 },
    { key: 'tgl', width: 12 },
    { key: 'faktur', width: 18 },
    { key: 'faktur_prd', width: 18 },
    { key: 'faktur_so', width: 18 },
    { key: 'kd_pelanggan', width: 22 },
    { key: 'nama_barang', width: 34 },
    { key: 'qty', width: 11 },
    { key: 'satuan', width: 9 },
    { key: 'hp', width: 14 },
    { key: 'hp_total', width: 15 },
    { key: 'profit_30', width: 14 },
    { key: 'hp_rata_rata', width: 14 },
    { key: 'harga_so', width: 14 },
    { key: 'harga_jual', width: 15 },
    { key: 'analisa_harga', width: 28 },
    { key: 'keterangan', width: 20 },
  ];

  // Row 1: Title
  ws.mergeCells('A1:Q1');
  const t1 = ws.getCell('A1');
  t1.value = 'PENERIMAAN BARANG HASIL PRODUKSI';
  t1.font = { name: 'Calibri', size: 15, bold: true, color: { argb: TITLE_NAVY } };
  t1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 26;

  // Row 2: Subtitle
  ws.mergeCells('A2:Q2');
  const t2 = ws.getCell('A2');
  const periodeText = (meta.from && meta.to)
    ? `${formatIndoDate(meta.from)} s/d ${formatIndoDate(meta.to)}`
    : 'Semua Periode';
  const filterList: string[] = [];
  if (meta.warningOnly) filterList.push('Peringatan Saja');
  if (meta.soOnly) filterList.push('Khusus Ada SO');
  const filterText = filterList.length > 0 ? filterList.join(', ') : 'Semua Data';
  const searchText = meta.search?.trim() ? `"${meta.search.trim()}"` : 'Semua';
  const totalText = `${meta.totalRows.toLocaleString('id-ID')} Baris`;

  t2.value = `Periode: ${periodeText} | Filter: ${filterText} | Pencarian: ${searchText} | Total: ${totalText}`;
  t2.font = { name: 'Calibri', size: 10, italic: true, color: { argb: SUBTITLE_GRAY } };
  t2.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 18;

  // Row 3: Spacing
  ws.getRow(3).height = 8;

  // Row 4: Header
  const headers = [
    'NO',
    'TANGGAL',
    'NO. FAKTUR',
    'FAKTUR PRD',
    'FAKTUR SO',
    'PELANGGAN',
    'NAMA BARANG',
    'QTY',
    'SATUAN',
    'HPP SATUAN',
    'HPP TOTAL',
    'PROFIT 30%',
    'HP RATA-RATA',
    'HARGA SO',
    'HARGA JUAL',
    'ANALISA HARGA',
    'KETERANGAN',
  ];
  const hr = ws.getRow(4);
  hr.height = 26;
  headers.forEach((h, i) => {
    const c = hr.getCell(i + 1);
    c.value = h;
    c.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = cellBorder;
  });

  // Rows 5+: Data rows
  const cellFont = { name: 'Calibri', size: 10, color: { argb: 'FF1F1F1F' } };

  rows.forEach((r, idx) => {
    const rowNum = 5 + idx;
    const row = ws.getRow(rowNum);

    const hasWarning = checkHasWarning(r);
    const analisaText = formatAnalisaHarga(r);

    const lines = Math.max(
      wrapLines(r.kd_pelanggan, 20),
      wrapLines(r.nama_barang, 32),
      wrapLines(analisaText, 26),
      wrapLines(r.keterangan, 18)
    );
    row.height = Math.max(20, Math.round(lines * 14.5));

    let rowFill: ExcelJS.Fill | undefined = undefined;
    if (hasWarning) {
      rowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WARNING_ROSE } };
    } else if (idx % 2 === 1) {
      rowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } };
    }

    // Col 1: NO
    const c1 = row.getCell(1);
    c1.value = idx + 1;
    c1.alignment = { horizontal: 'center', vertical: 'middle' };

    // Col 2: TANGGAL
    const c2 = row.getCell(2);
    const serialDate = tglToExcelSerial(r.tgl);
    c2.value = serialDate;
    if (typeof serialDate === 'number') {
      c2.numFmt = 'dd/mm/yyyy';
    }
    c2.alignment = { horizontal: 'center', vertical: 'middle' };

    // Col 3: NO. FAKTUR
    const c3 = row.getCell(3);
    c3.value = r.faktur || '';
    c3.alignment = { horizontal: 'center', vertical: 'middle' };

    // Col 4: FAKTUR PRD
    const c4 = row.getCell(4);
    c4.value = r.faktur_prd || '';
    c4.alignment = { horizontal: 'center', vertical: 'middle' };

    // Col 5: FAKTUR SO
    const c5 = row.getCell(5);
    c5.value = r.faktur_so || '';
    c5.alignment = { horizontal: 'center', vertical: 'middle' };

    // Col 6: PELANGGAN
    const c6 = row.getCell(6);
    c6.value = r.kd_pelanggan || '';
    c6.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

    // Col 7: NAMA BARANG
    const c7 = row.getCell(7);
    c7.value = r.nama_barang || '';
    c7.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

    // Col 8: QTY
    const c8 = row.getCell(8);
    c8.value = Number(r.qty || 0);
    c8.numFmt = '#,##0.00';
    c8.alignment = { horizontal: 'right', vertical: 'middle' };

    // Col 9: SATUAN
    const c9 = row.getCell(9);
    c9.value = r.satuan || '';
    c9.alignment = { horizontal: 'center', vertical: 'middle' };

    // Col 10: HPP SATUAN
    const c10 = row.getCell(10);
    c10.value = Number(r.hp || 0);
    c10.numFmt = '#,##0.00';
    c10.alignment = { horizontal: 'right', vertical: 'middle' };

    // Col 11: HPP TOTAL
    const c11 = row.getCell(11);
    c11.value = Number(r.hp_total || 0);
    c11.numFmt = '#,##0.00';
    c11.alignment = { horizontal: 'right', vertical: 'middle' };

    // Col 12: PROFIT 30%
    const c12 = row.getCell(12);
    c12.value = Number(r.hp || 0) * 1.3;
    c12.numFmt = '#,##0.00';
    c12.alignment = { horizontal: 'right', vertical: 'middle' };

    // Col 13: HP RATA-RATA
    const c13 = row.getCell(13);
    c13.value = Number(r.hp_rata_rata || 0);
    c13.numFmt = '#,##0.00';
    c13.alignment = { horizontal: 'right', vertical: 'middle' };

    // Col 14: HARGA SO
    const c14 = row.getCell(14);
    if (r.harga_so_sales_order > 0) {
      c14.value = r.harga_so_sales_order;
      c14.numFmt = '#,##0.00';
      c14.alignment = { horizontal: 'right', vertical: 'middle' };
    } else {
      c14.value = '-';
      c14.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // Col 15: HARGA JUAL
    const c15 = row.getCell(15);
    if (r.harga_so_penjualan > 0) {
      c15.value = r.harga_so_penjualan;
      c15.numFmt = '#,##0.00';
      c15.alignment = { horizontal: 'right', vertical: 'middle' };
    } else {
      c15.value = '-';
      c15.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // Col 16: ANALISA HARGA
    const c16 = row.getCell(16);
    c16.value = analisaText;
    c16.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

    // Col 17: KETERANGAN
    const c17 = row.getCell(17);
    c17.value = r.keterangan || '';
    c17.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

    for (let c = 1; c <= 17; c++) {
      const cell = row.getCell(c);
      cell.font = cellFont;
      cell.border = cellBorder;
      if (rowFill) cell.fill = rowFill;
    }
  });

  // Summary TOTAL row
  const totalRow = 5 + rows.length;
  ws.mergeCells(`A${totalRow}:G${totalRow}`);
  const totalCell = ws.getCell(`A${totalRow}`);
  totalCell.value = 'TOTAL';
  totalCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const totalRowObj = ws.getRow(totalRow);
  totalRowObj.height = 22;

  const boldFont = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF1F1F1F' } };
  const totalBorder = {
    top: { style: 'thin' as const, color: { argb: BORDER_GRAY } },
    bottom: { style: 'double' as const, color: { argb: 'FF1F1F1F' } },
    left: { style: 'thin' as const, color: { argb: BORDER_GRAY } },
    right: { style: 'thin' as const, color: { argb: BORDER_GRAY } },
  };

  const cTotQty = totalRowObj.getCell(8);
  if (rows.length > 0) {
    cTotQty.value = { formula: `SUM(H5:H${totalRow - 1})` };
  } else {
    cTotQty.value = 0;
  }
  cTotQty.numFmt = '#,##0.00';
  cTotQty.alignment = { horizontal: 'right', vertical: 'middle' };

  const cTotHp = totalRowObj.getCell(11);
  if (rows.length > 0) {
    cTotHp.value = { formula: `SUM(K5:K${totalRow - 1})` };
  } else {
    cTotHp.value = 0;
  }
  cTotHp.numFmt = '#,##0.00';
  cTotHp.alignment = { horizontal: 'right', vertical: 'middle' };

  for (let c = 1; c <= 17; c++) {
    const cell = totalRowObj.getCell(c);
    cell.font = boldFont;
    cell.border = totalBorder;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
  }

  // Page setup: A4 landscape, fit to 1 page wide
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    printTitlesRow: '4:4',
    printArea: `A1:Q${totalRow}`,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
  };

  return Buffer.from(await wb.xlsx.writeBuffer());
}
