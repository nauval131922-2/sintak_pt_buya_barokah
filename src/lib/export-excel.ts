'use client';

import XLSX from 'xlsx-js-style';

export interface JurnalUmumExportRow {
  isSaldoAwal?: boolean;
  isChild?: boolean;
  isKas?: boolean;
  tgl?: string;
  faktur?: string;
  rekening?: string;
  keterangan?: string;
  debit?: number | null;
  kredit?: number | null;
  username?: string;
  create_at?: string;
  debitLR?: number | null;
  kreditLR?: number | null;
  labaRugi?: number | null;
  arusKas?: number | null;
}

function parseDateOnly(str?: string | null): Date | null {
  if (!str) return null;
  const m = String(str).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return null;
}

function parseDateTime(str?: string | null): Date | null {
  if (!str) return null;
  const m = String(str).trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4] || 0),
      Number(m[5] || 0),
      Number(m[6] || 0)
    );
  }
  return null;
}

export interface JurnalUmumExportMeta {
  startDate?: string;
  endDate?: string;
}

/**
 * Export Jurnal Umum ke Excel dengan format resmi akuntansi:
 * - Judul laporan & metadata periode di bagian atas tabel
 * - Kolom Tanggal dan Dibuat bertipe Date Excel asli (bukan string)
 * - Kolom Laba/Rugi dan Arus Kas berisi RUMUS Excel dinamis (=K2+I3-J3 & =L2+E3-F3)
 * - Pewarnaan baris otomatis: Ungu (Arus Kas), Hijau (Pendapatan/Debit LR), Merah (Beban/Kredit LR), Kuning (Saldo Awal)
 * - Kolom angka berformat currency (#,##0.00) dengan perataan kanan
 * - Header bergaya Emerald khas SINTAK dengan teks putih tebal
 * - Freeze header (baris 1-5 beku saat scroll) & auto-filter
 * - Lebar kolom proporsional agar teks tidak terpotong
 */
export async function exportJurnalUmumExcel(
  rows: JurnalUmumExportRow[],
  filename: string,
  meta?: JurnalUmumExportMeta
): Promise<boolean> {
  if (!rows.length) return false;

  const headers = [
    'Tanggal',
    'No. Faktur',
    'Rekening',
    'Keterangan',
    'Debit',
    'Kredit',
    'User',
    'Dibuat',
    'Debit (Laba Rugi)',
    'Kredit (Laba Rugi)',
    'Laba / Rugi',
    'Arus Kas',
  ];

  const headerStyle = {
    font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '065F46' } }, // Emerald 800
    alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
    border: {
      top: { style: 'thin', color: { rgb: '047857' } },
      bottom: { style: 'medium', color: { rgb: '047857' } },
      left: { style: 'thin', color: { rgb: '047857' } },
      right: { style: 'thin', color: { rgb: '047857' } },
    },
  };

  const borderThin = {
    bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
    right: { style: 'thin', color: { rgb: 'F1F5F9' } },
    left: { style: 'thin', color: { rgb: 'F1F5F9' } },
  };

  const ws: Record<string, any> = {};

  // Row 2 (Excel Row 2, r: 1): Judul Utama
  ws['A2'] = {
    v: 'LAPORAN JURNAL UMUM & MUTASI ARUS KAS',
    t: 's',
    s: {
      font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: '065F46' } },
      alignment: { vertical: 'center' },
    },
  };

  // Row 3 (Excel Row 3, r: 2): Subtitle (Perusahaan, Periode, & Waktu Ekspor)
  const periodText = meta?.startDate && meta?.endDate
    ? `Periode Transaksi: ${meta.startDate} s/d ${meta.endDate}`
    : 'Semua Periode Transaksi';
  const now = new Date();
  const exportTimeStr = `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  ws['A3'] = {
    v: `PT. BUYA BAROKAH  •  ${periodText}  •  Waktu Ekspor: ${exportTimeStr}`,
    t: 's',
    s: {
      font: { name: 'Segoe UI', sz: 9, italic: true, color: { rgb: '64748B' } },
      alignment: { vertical: 'center' },
    },
  };

  // Baris Header Tabel berada di Excel Row 5 (r: 4)
  const TABLE_HEADER_ROW = 4;
  const DATA_START_ROW = 5;

  headers.forEach((h, colIdx) => {
    const cellRef = XLSX.utils.encode_cell({ r: TABLE_HEADER_ROW, c: colIdx });
    ws[cellRef] = {
      v: h,
      t: 's',
      s: headerStyle,
    };
  });

  // Tulis Data mulai Excel Row 6 (r: 5)
  rows.forEach((row, rowIdx) => {
    const r = DATA_START_ROW + rowIdx;
    const excelRow = r + 1; // 1-based row number di Excel
    const isSaldo = Boolean(row.isSaldoAwal);
    const isChild = Boolean(row.isChild);
    const hasDebitLR = row.debitLR !== null && row.debitLR !== undefined && Number(row.debitLR) > 0;
    const hasKreditLR = row.kreditLR !== null && row.kreditLR !== undefined && Number(row.kreditLR) > 0;
    // Pewarnaan baris identik dengan tampilan web:
    // 1. Saldo Awal: Amber / Kuning lembut
    // 2. Rekening Kas (mempengaruhi Arus Kas): Violet / Ungu lembut
    // 3. Penambah Laba (Debit LR > 0 / Pendapatan): Emerald / Hijau lembut
    // 4. Pengurang Laba (Kredit LR > 0 / Beban & HPP): Rose / Merah muda lembut
    // 5. Baris Induk (Parent Faktur): Slate / Abu terang dengan teks bold
    // 6. Baris Anak Lainnya: Putih
    let rowBg = 'FFFFFF';
    let baseFontColor = '475569';
    let isRowBold = false;

    if (isSaldo) {
      rowBg = 'FEF3C7';
      baseFontColor = '92400E';
      isRowBold = true;
    } else if (row.isKas) {
      rowBg = 'EDE9FE';
      baseFontColor = '5B21B6';
      isRowBold = false;
    } else if (hasDebitLR) {
      rowBg = 'ECFDF5';
      baseFontColor = '065F46';
      isRowBold = false;
    } else if (hasKreditLR) {
      rowBg = 'FFF1F2';
      baseFontColor = '9F1239';
      isRowBold = false;
    } else if (!isChild) {
      rowBg = 'F8FAFC';
      baseFontColor = '0F172A';
      isRowBold = true;
    } else {
      rowBg = rowIdx % 2 === 1 ? 'FAFAFA' : 'FFFFFF';
      baseFontColor = '475569';
      isRowBold = false;
    }

    const baseFont = {
      name: 'Segoe UI',
      sz: 10,
      bold: isRowBold,
      color: { rgb: baseFontColor },
    };

    const makeStyle = (align: 'left' | 'center' | 'right') => ({
      font: baseFont,
      fill: { fgColor: { rgb: rowBg } },
      alignment: { horizontal: align, vertical: 'center' },
      border: borderThin,
    });
    // Col 0: Tanggal (Date asli Excel)
    const c0 = XLSX.utils.encode_cell({ r, c: 0 });
    if (isSaldo) {
      ws[c0] = { v: '—', t: 's', s: makeStyle('center') };
    } else {
      const dateVal = parseDateOnly(row.tgl);
      if (dateVal) {
        ws[c0] = { v: dateVal, t: 'd', z: 'dd/mm/yyyy', s: makeStyle('center') };
      } else {
        ws[c0] = { v: row.tgl || '—', t: 's', s: makeStyle('center') };
      }
    }

    // Col 1: No. Faktur
    const c1 = XLSX.utils.encode_cell({ r, c: 1 });
    ws[c1] = {
      v: isSaldo ? '—' : (row.faktur || '—'),
      t: 's',
      s: makeStyle('center'),
    };

    // Col 2: Rekening
    const c2 = XLSX.utils.encode_cell({ r, c: 2 });
    ws[c2] = {
      v: isSaldo ? 'Saldo Awal' : (isChild ? `   ↳ ${row.rekening || ''}` : (row.rekening || '')),
      t: 's',
      s: makeStyle('left'),
    };

    // Col 3: Keterangan
    const c3 = XLSX.utils.encode_cell({ r, c: 3 });
    ws[c3] = {
      v: isSaldo ? 'Saldo Awal Periode' : (row.keterangan || ''),
      t: 's',
      s: makeStyle('left'),
    };

    // Col 4: Debit
    const c4 = XLSX.utils.encode_cell({ r, c: 4 });
    const debitNum = row.debit !== null && row.debit !== undefined ? Number(row.debit) : 0;
    ws[c4] = {
      v: debitNum,
      t: 'n',
      z: '#,##0.00;(#,##0.00);"-"',
      s: makeStyle('right'),
    };

    // Col 5: Kredit
    const c5 = XLSX.utils.encode_cell({ r, c: 5 });
    const kreditNum = row.kredit !== null && row.kredit !== undefined ? Number(row.kredit) : 0;
    ws[c5] = {
      v: kreditNum,
      t: 'n',
      z: '#,##0.00;(#,##0.00);"-"',
      s: makeStyle('right'),
    };

    // Col 6: User
    const c6 = XLSX.utils.encode_cell({ r, c: 6 });
    ws[c6] = {
      v: isSaldo ? '—' : (row.username || '—'),
      t: 's',
      s: makeStyle('center'),
    };

    // Col 7: Dibuat (Date/Time asli Excel)
    const c7 = XLSX.utils.encode_cell({ r, c: 7 });
    if (isSaldo) {
      ws[c7] = { v: '—', t: 's', s: makeStyle('center') };
    } else {
      const createdDate = parseDateTime(row.create_at);
      if (createdDate) {
        ws[c7] = { v: createdDate, t: 'd', z: 'dd/mm/yyyy hh:mm:ss', s: makeStyle('center') };
      } else {
        ws[c7] = { v: row.create_at || '—', t: 's', s: makeStyle('center') };
      }
    }

    // Col 8: Debit (Laba Rugi)
    const c8 = XLSX.utils.encode_cell({ r, c: 8 });
    const debitLR = row.debitLR !== null && row.debitLR !== undefined ? Number(row.debitLR) : 0;
    ws[c8] = {
      v: debitLR,
      t: 'n',
      z: '#,##0.00;(#,##0.00);"-"',
      s: makeStyle('right'),
    };

    // Col 9: Kredit (Laba Rugi)
    const c9 = XLSX.utils.encode_cell({ r, c: 9 });
    const kreditLR = row.kreditLR !== null && row.kreditLR !== undefined ? Number(row.kreditLR) : 0;
    ws[c9] = {
      v: kreditLR,
      t: 'n',
      z: '#,##0.00;(#,##0.00);"-"',
      s: makeStyle('right'),
    };

    // Col 10: Laba / Rugi (Rumus Excel Dinamis)
    const c10 = XLSX.utils.encode_cell({ r, c: 10 });
    const labaRugiVal = row.labaRugi !== null && row.labaRugi !== undefined ? Number(row.labaRugi) : 0;
    if (rowIdx === 0) {
      if (isSaldo) {
        ws[c10] = {
          v: labaRugiVal,
          t: 'n',
          z: '#,##0.00;[Red](#,##0.00);"-"',
          s: makeStyle('right'),
        };
      } else {
        ws[c10] = {
          f: `I${excelRow}-J${excelRow}`,
          v: labaRugiVal,
          t: 'n',
          z: '#,##0.00;[Red](#,##0.00);"-"',
          s: makeStyle('right'),
        };
      }
    } else {
      const prevRow = excelRow - 1;
      ws[c10] = {
        f: `K${prevRow}+I${excelRow}-J${excelRow}`,
        v: labaRugiVal,
        t: 'n',
        z: '#,##0.00;[Red](#,##0.00);"-"',
        s: makeStyle('right'),
      };
    }

    // Col 11: Arus Kas (Rumus Excel Dinamis)
    const c11 = XLSX.utils.encode_cell({ r, c: 11 });
    const arusKasVal = row.arusKas !== null && row.arusKas !== undefined ? Number(row.arusKas) : 0;
    if (rowIdx === 0) {
      if (isSaldo) {
        ws[c11] = {
          v: arusKasVal,
          t: 'n',
          z: '#,##0.00;[Red](#,##0.00);"-"',
          s: makeStyle('right'),
        };
      } else {
        if (row.isKas) {
          ws[c11] = {
            f: `E${excelRow}-F${excelRow}`,
            v: arusKasVal,
            t: 'n',
            z: '#,##0.00;[Red](#,##0.00);"-"',
            s: makeStyle('right'),
          };
        } else {
          ws[c11] = {
            v: 0,
            t: 'n',
            z: '#,##0.00;[Red](#,##0.00);"-"',
            s: makeStyle('right'),
          };
        }
      }
    } else {
      const prevRow = excelRow - 1;
      if (row.isKas) {
        ws[c11] = {
          f: `L${prevRow}+E${excelRow}-F${excelRow}`,
          v: arusKasVal,
          t: 'n',
          z: '#,##0.00;[Red](#,##0.00);"-"',
          s: makeStyle('right'),
        };
      } else {
        ws[c11] = {
          f: `L${prevRow}`,
          v: arusKasVal,
          t: 'n',
          z: '#,##0.00;[Red](#,##0.00);"-"',
          s: makeStyle('right'),
        };
      }
    }
  });

  const lastExcelRow = DATA_START_ROW + rows.length;
  ws['!ref'] = `A1:L${lastExcelRow}`;
  ws['!merges'] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }, // Judul A2:L2
    { s: { r: 2, c: 0 }, e: { r: 2, c: 11 } }, // Subtitle A3:L3
  ];
  ws['!cols'] = [
    { wch: 13 }, // Tanggal
    { wch: 16 }, // No. Faktur
    { wch: 32 }, // Rekening
    { wch: 42 }, // Keterangan
    { wch: 18 }, // Debit
    { wch: 18 }, // Kredit
    { wch: 14 }, // User
    { wch: 21 }, // Dibuat
    { wch: 18 }, // Debit (Laba Rugi)
    { wch: 18 }, // Kredit (Laba Rugi)
    { wch: 18 }, // Laba / Rugi
    { wch: 18 }, // Arus Kas
  ];
  ws['!rows'] = [
    { hpt: 8 },  // Row 1: Spacing
    { hpt: 24 }, // Row 2: Title
    { hpt: 18 }, // Row 3: Subtitle
    { hpt: 8 },  // Row 4: Spacing
    { hpt: 22 }, // Row 5: Table Header
  ];
  ws['!views'] = [{ state: 'frozen', ySplit: 5, xSplit: 0, activeCell: 'A6' }];
  ws['!autofilter'] = { ref: `A5:L${lastExcelRow}` };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Jurnal Umum');

  const finalName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, finalName);
  return true;
}

export async function exportRowsToExcel<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  columnOrder?: (keyof T)[]
) {
  if (!rows.length) return false;

  const keys = (columnOrder ?? (Object.keys(rows[0]) as (keyof T)[])) as string[];
  const data = rows.map((row) =>
    keys.reduce((acc, k) => {
      const v = row[k];
      acc[k] = typeof v === 'bigint' ? Number(v) : v;
      return acc;
    }, {} as Record<string, unknown>)
  );

  const ws = XLSX.utils.json_to_sheet(data, { header: keys as string[] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  return true;
}

export default exportRowsToExcel;
