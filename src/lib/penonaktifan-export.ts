import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

export interface PenonaktifanExportRow {
  kode: string;
  nama: string;
  satuan: string;
  golongan: string;
  kelompok: string;
  saldo: string;
  alasan: string;
}

const NAVY = 'FF2F5597';
const BORDER_GRAY = 'FFD9D9D9';
const ZEBRA = 'FFF9FAFB';

const thin = { style: 'thin' as const, color: { argb: BORDER_GRAY } };
const cellBorder = { left: thin, right: thin, top: thin, bottom: thin };

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function tglId(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, '0')} ${BULAN[m - 1]} ${y}`;
}

// ExcelJS tak punya autofit: hitung jumlah baris hasil wrap agar teks tidak terpotong.
function wrapLines(text: string, perLine: number): number {
  let lines = 1;
  let used = 0;
  for (const word of (text || '').split(/\s+/)) {
    if (!word) continue;
    if (used > 0 && used + 1 + word.length <= perLine) {
      used += 1 + word.length;
      continue;
    }
    if (used > 0) lines++;
    lines += Math.ceil(word.length / perLine) - 1;
    used = word.length % perLine;
  }
  return lines;
}

// Tulis workbook usulan (11 kolom A-K + footer 3 kolom), kembalikan Buffer xlsx.
export async function buildPenonaktifanWorkbook(cutoff: string, rows: PenonaktifanExportRow[], signer: string): Promise<Buffer> {
  const tempFilePath = path.join(tmpdir(), `penonaktifan_${Date.now()}_${Math.random().toString(36).substring(7)}.xlsx`);
  try {
    const wb = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: tempFilePath, useSharedStrings: false, useStyles: true });
    const ws = wb.addWorksheet('TOTAL', {
      views: [{ showGridLines: false, state: 'frozen', xSplit: 0, ySplit: 4, topLeftCell: 'A5', activeCell: 'A5' }],
    });
    // Ringkasan outline di kiri (tombol group kolom ALASAN ada di kolom J).
    ws.properties.outlineProperties = { summaryBelow: true, summaryRight: false };
    ws.columns = [
      { header: '', key: 'no', width: 6 },
      { header: '', key: 'kode', width: 14 },
      { header: '', key: 'nama', width: 60 },
      { header: '', key: 'satuan', width: 10 },
      { header: '', key: 'nonaktif', width: 12 },
      { header: '', key: 'golongan', width: 22 },
      { header: '', key: 'kelompok', width: 36 },
      { header: '', key: 'aktif', width: 10 },
      { header: '', key: 'saldo', width: 12 },
      { header: '', key: 'npersd', width: 12 },
       { header: '', key: 'alasan', width: 75, outlineLevel: 1 },
    ];
     ws.mergeCells('A1:J1');
    const t1 = ws.getCell('A1');
     t1.value = 'PENONAKTIFAN MASTER BARANG JADI';
    t1.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FF1F4E78' } };
    t1.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 26;
    ws.getRow(1).commit();
     ws.mergeCells('A2:J2');
    const t2 = ws.getCell('A2');
    t2.value = `Tanggal Data Terakhir (${tglId(cutoff)})`;
    t2.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF595959' } };
    t2.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 18;
    ws.getRow(2).commit();
    ws.getRow(3).height = 8;
    ws.getRow(3).commit();
    const headers = ['NO', 'KODE', 'NAMA BARANG', 'SATUAN', 'NONAKTIF', 'GOLONGAN', 'KELOMPOK', 'AKTIF', 'SALDO', 'N PERSD', 'ALASAN'];
    const hr = ws.getRow(4);
    hr.height = 26;
    headers.forEach((h, i) => {
      const c = hr.getCell(i + 1);
      c.value = h;
      c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      c.border = cellBorder;
    });
     hr.commit();
    rows.forEach((r, idx) => {
      const row = ws.getRow(5 + idx);
      // Tinggi baris mengikuti teks terpanjang yang wrap (NAMA width 60, ALASAN width 75).
      const lines = Math.max(wrapLines(r.nama, 55), wrapLines(r.alasan, 70));
      row.height = Math.max(20, Math.round(lines * 14.5));
      const vals = [idx + 1, r.kode, r.nama, r.satuan, '', r.golongan, r.kelompok, 'Aktif', r.saldo, '0.00', r.alasan];
      const aligns = ['center', 'center', 'left', 'center', 'center', 'left', 'left', 'center', 'right', 'right', 'left'] as const;
      vals.forEach((v, i) => {
        const c = row.getCell(i + 1);
        c.value = v;
        c.font = { name: 'Calibri', size: 10.5, bold: i === 1, color: { argb: 'FF1F1F1F' } };
        if (idx % 2 === 1) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } };
        c.alignment = { horizontal: aligns[i], vertical: 'middle', wrapText: i === 2 || i === 10 };
        c.border = cellBorder;
      });
      row.commit();
    });
    const footLabel = 5 + rows.length + 1;
    const nameRow = footLabel + 4;
    const titleRow = footLabel + 5;
    const labels: Record<number, string> = { 2: 'Hormat Kami,', 5: 'Menyetujui,', 8: 'Mengetahui,' };
    const names: Record<number, string> = { 2: signer, 5: '(Sri Yatun)', 8: '(Triswadi)' };
    const titles: Record<number, string> = { 2: 'PPIC', 5: 'Customer Service', 8: 'Manager' };
    const lr = ws.getRow(footLabel);
    Object.entries(labels).forEach(([col, v]) => {
      const c = lr.getCell(Number(col));
      c.value = v;
      c.font = { name: 'Calibri', size: 10.5, color: { argb: 'FF333333' } };
    });
    lr.commit();
    const nr = ws.getRow(nameRow);
    Object.entries(names).forEach(([col, v]) => {
      const c = nr.getCell(Number(col));
      c.value = v;
      c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F1F1F' } };
    });
    nr.commit();
    const tr = ws.getRow(titleRow);
    Object.entries(titles).forEach(([col, v]) => {
      const c = tr.getCell(Number(col));
      c.value = v;
      c.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF595959' } };
    });
    tr.commit();
    // Ctrl+P langsung rapi: A4 landscape, skala 1 halaman lebar, header (row 4) jadi print titles.
    // Area cetak A:J — kolom ALASAN (group K) tidak ikut mengecilkan skala cetak.
    ws.pageSetup = {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      printTitlesRow: '4:4',
      printArea: `A1:J${titleRow}`,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    };
    await wb.commit();
    return fs.readFileSync(tempFilePath);
  } finally {
    if (fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch { /* abaikan */ }
    }
  }
}
