import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import ExcelJS from "exceljs";
import { logActivity } from '@/lib/activity';
import fs from "fs";
import path from "path";
import { tmpdir } from "os";

export const dynamic = 'force-dynamic';

function cleanNumberOrText(val: unknown): number | string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str === '') return '';
  const num = Number(str);
  return isNaN(num) ? str : num;
}

function tglToExcelSerial(tgl: unknown): number | string {
  if (!tgl) return '';
  const str = String(tgl).split('T')[0];
  const parts = str.split('-');
  if (parts.length === 3) {
    const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    if (!isNaN(d.getTime())) return (d.getTime() / 86400000) + 25569;
  }
  return str;
}

export async function GET(request: NextRequest) {
  let tempFilePath = '';
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");

    const whereParts: string[] = [];
    const args: string[] = [];

    if (year && year !== 'all') {
      whereParts.push(`(tgl BETWEEN ? AND ?)`);
      args.push(`${year}-01-01`, `${year}-12-31`);
    }
    whereParts.push('deleted_at IS NULL');
    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    // Single SELECT with INDEXED BY to force expression index usage
    const result = await db.execute({
      sql: `SELECT * FROM jurnal_harian_produksi INDEXED BY idx_jurnal_main ${whereClause} 
        ORDER BY 
           tgl ASC, 
           CASE UPPER(bagian)
             WHEN 'SETTING' THEN 1
             WHEN 'QUALITY CONTROL' THEN 2
             WHEN 'CETAK' THEN 3
             WHEN 'FINISHING' THEN 4
             WHEN 'GUDANG' THEN 5
             WHEN 'TEKNISI' THEN 6
             WHEN 'MESIN' THEN 7
             ELSE 8
           END ASC,
           CASE WHEN jenis_pekerjaan LIKE '%Koordinasi%' THEN 0 ELSE 1 END ASC,
           absensi ASC, 
           id ASC`,
      args,
    });
    const rows = result.rows as any[];

    tempFilePath = path.join(tmpdir(), `export_jurnal_${Date.now()}_${Math.random().toString(36).substring(7)}.xlsx`);

    const workbookWriter = new ExcelJS.stream.xlsx.WorkbookWriter({
      filename: tempFilePath,
      useSharedStrings: false,
      useStyles: true,
    });

    const sheet = workbookWriter.addWorksheet('JURNAL', {
      views: [{
        showGridLines: false,
        state: 'frozen',
        xSplit: 4,
        ySplit: 3,
        topLeftCell: 'E4',
        activeCell: 'E4',
        zoomScale: 80,
      }],
    });

    sheet.columns = [
      { header: 'No.', key: 'no', width: 5 },
      { header: 'Posisi', key: 'posisi', width: 15 },
      { header: 'Abs.', key: 'absensi', width: 8 },
      { header: 'Tanggal', key: 'tgl', width: 12, style: { numFmt: 'dd/mm/yyyy' } as const },
      { header: 'Sift', key: 'shift', width: 8 },
      { header: 'Nama Karyawan', key: 'nama_karyawan', width: 20 },
      { header: 'NO. Order (PPIC)', key: 'no_order', width: 18 },
      { header: 'Nama Order', key: 'nama_order', width: 25 },
      { header: 'Jenis Pekerjaan', key: 'jenis_pekerjaan', width: 20 },
      { header: 'Keterangan', key: 'keterangan', width: 20 },
      { header: 'Target', key: 'target', width: 10 },
      { header: 'Realisasi', key: 'realisasi', width: 10 },
      { header: 'No. Order ', key: 'no_order_2', width: 18 },
      { header: 'Nama Order ', key: 'nama_order_2', width: 25 },
      { header: 'Jenis Pekerjaan ', key: 'jenis_pekerjaan_2', width: 20 },
      { header: 'Bahan Kertas', key: 'bahan_kertas', width: 15 },
      { header: 'Jml. Plate', key: 'jml_plate', width: 10 },
      { header: 'Warna', key: 'warna', width: 10 },
      { header: 'Inscheet', key: 'inscheet', width: 10 },
      { header: 'Rijek', key: 'rijek', width: 10 },
      { header: 'Jam', key: 'jam', width: 15 },
      { header: 'Kendala', key: 'kendala', width: 20 },
      { header: 'Bagian', key: 'bagian', width: 15 },
    ];

    sheet.properties.defaultRowHeight = 15;

    const headerRow = sheet.getRow(1);
    headerRow.font = { name: 'Calibri', size: 10, bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.commit();

    // Write rows directly (no intermediate .map() copy)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      sheet.addRow([
        i + 1,
        row.posisi || '',
        cleanNumberOrText(row.absensi),
        tglToExcelSerial(row.tgl),
        row.shift || '',
        row.nama_karyawan || '',
        row.no_order || '',
        row.nama_order || '',
        row.jenis_pekerjaan || '',
        row.keterangan || '',
        cleanNumberOrText(row.target),
        cleanNumberOrText(row.realisasi),
        row.no_order_2 || '',
        row.nama_order_2 || '',
        row.jenis_pekerjaan_2 || '',
        row.bahan_kertas || '',
        cleanNumberOrText(row.jml_plate),
        row.warna || '',
        cleanNumberOrText(row.inscheet),
        cleanNumberOrText(row.rijek),
        row.jam || '',
        row.kendala || '',
        row.bagian || '',
      ]).commit();
    }

    await workbookWriter.commit();

    const buffer = fs.readFileSync(tempFilePath);
    fs.unlink(tempFilePath, (err) => {
      if (err) console.error(`Failed to clean up temp file ${tempFilePath}:`, err);
    });

    const filename = year && year !== 'all'
      ? `JADWAL PRODUKSI HARIAN ${year}.xlsx`
      : 'JADWAL PRODUKSI HARIAN.xlsx';

    logActivity('EXPORT', 'jurnal_harian_produksi', `Export ${rows.length} baris jurnal ke Excel (${filename})`).catch(() => {});

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch { /* ignore */ }
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
