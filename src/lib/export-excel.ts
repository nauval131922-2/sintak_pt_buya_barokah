'use client';

import * as XLSX from 'xlsx';

// ponytail: client-side Excel export for any array of flat objects.
// Reuses the already-installed `xlsx` dep. No server route needed.

export function exportRowsToExcel<T extends Record<string, unknown>>(
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
