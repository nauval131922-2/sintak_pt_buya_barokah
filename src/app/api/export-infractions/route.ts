import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import ExcelJS from "exceljs";

export const dynamic = 'force-dynamic';

function formatIndoDateStr(tglStr: string) {
  if (!tglStr) return '';
  const parts = tglStr.split('-');
  if (parts.length === 3) {
    const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T12:00:00Z`);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return tglStr;
}

/** Konversi string tanggal "YYYY-MM-DD" atau "YYYY-MM-DD HH:mm:ss" ke serial number Excel (UTC) */
function toExcelDateSerial(tglStr: string): number | string {
  if (!tglStr) return '';
  // Tangani format dengan spasi maupun T sebagai pemisah waktu
  const datePart = String(tglStr).split('T')[0].split(' ')[0];
  const parts = datePart.split('-');
  if (parts.length === 3) {
    const dateUtc = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    if (!isNaN(dateUtc.getTime())) {
      return (dateUtc.getTime() / 86400000) + 25569;
    }
  }
  return String(tglStr);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    let whereParts: string[] = [];
    let args: any[] = [];

    if (startDate && endDate) {
      whereParts.push(`(i.date >= ? AND i.date <= ?)`);
      args.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    if (search) {
      whereParts.push(`(employee_name LIKE ? OR description LIKE ? OR faktur LIKE ?)`);
      const s = `%${search}%`;
      args.push(s, s, s);
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const sql = `
      SELECT
        i.*,
        COALESCE(i.employee_name, e.name) AS employee_name,
        COALESCE(i.employee_position, e.position) AS employee_position,
        COALESCE(i.order_name, o.nama_prd) AS order_name_display,
        COALESCE(i.nama_barang, bb.nama_barang, bj.nama_barang) AS nama_barang_display
      FROM infractions i
      LEFT JOIN employees e ON i.employee_id = e.id
      LEFT JOIN orders o ON i.order_faktur = o.faktur
      LEFT JOIN bahan_baku bb ON (i.item_faktur = bb.faktur AND i.jenis_barang = 'BBB Produksi')
      LEFT JOIN barang_jadi bj ON (i.item_faktur = bj.faktur AND i.jenis_barang = 'Penerimaan Barang Hasil Produksi')
      ${whereClause}
      ORDER BY i.date ASC, i.id ASC
    `;

    const result = await db.execute({ sql, args });
    const data = result.rows;

    const periodLabel = startDate && endDate
      ? `${formatIndoDateStr(startDate)} s/d ${formatIndoDateStr(endDate)}`
      : 'Semua Periode';

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Rekap Kesalahan', {
      views: [
        {
          showGridLines: false,
          state: 'frozen',
          xSplit: 2, // Freeze kolom A, B
          ySplit: 1, // Freeze baris header (baris 1)
          topLeftCell: 'C2',
          activeCell: 'C2',
        }
      ]
    });

    const columns = [
      { header: 'No',             key: 'no',           width: 5  },
      { header: 'Faktur',         key: 'faktur',        width: 16 },
      { header: 'Tanggal',        key: 'date',          width: 14 },
      { header: 'Nama Karyawan',  key: 'employee_name', width: 24 },
      { header: 'Posisi',         key: 'posisi',        width: 18 },
      { header: 'Deskripsi',      key: 'description',   width: 40 },
      { header: 'Nama Barang',    key: 'nama_barang',   width: 28 },
      { header: 'Kategori',       key: 'jenis_barang',  width: 18 },
      { header: 'No. Order / SPK',key: 'order_name',    width: 30 },
      { header: 'Qty',            key: 'jumlah',        width: 8  },
      { header: 'Harga Satuan',   key: 'harga',         width: 16 },
      { header: 'Total Beban',    key: 'total',         width: 16 },
    ];

    const tableRows = data.map((row: any, idx: number) => [
      idx + 1,
      row.faktur || '',
      toExcelDateSerial(String(row.date || '')),
      row.employee_name || '',
      row.employee_position || '',
      row.description || '',
      row.nama_barang_display || row.nama_barang || '',
      row.jenis_barang || '',
      row.order_name_display || row.order_name || '',
      row.jumlah !== null && row.jumlah !== undefined ? Number(row.jumlah) : '',
      row.harga  !== null && row.harga  !== undefined ? Number(row.harga)  : '',
      row.total  !== null && row.total  !== undefined ? Number(row.total)  : '',
    ]);

    if (tableRows.length > 0) {
      sheet.addTable({
        name: 'TblKesalahan',
        ref: 'A1', // Tabel langsung mulai di baris 1
        headerRow: true,
        totalsRow: false,
        style: {
          theme: 'TableStyleMedium7',
          showRowStripes: true,
        },
        columns: columns.map(c => ({ name: c.header, filterButton: true })),
        rows: tableRows,
      });
    } else {
      sheet.addRow(columns.map(c => c.header));
    }

    sheet.properties.defaultRowHeight = 15;

    // Lebar & font kolom
    columns.forEach((c, idx) => {
      const col = sheet.getColumn(idx + 1);
      col.width = c.width;
      col.font = { name: 'Calibri', size: 10 };
      col.alignment = { vertical: 'middle', horizontal: idx === 0 ? 'center' : 'left' };
    });

    // Format tanggal kolom C (index 3, 1-based)
    const colDate = sheet.getColumn(3);
    colDate.numFmt = 'dd/mm/yyyy';
    colDate.alignment = { vertical: 'middle', horizontal: 'center' };

    // Format angka kolom Harga & Total
    sheet.getColumn(11).numFmt = '#,##0';
    sheet.getColumn(12).numFmt = '#,##0';

    // Header baris ke-1 (header tabel) — bold
    const headerRow = sheet.getRow(1);
    headerRow.font = { name: 'Calibri', size: 10, bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };

    const buffer = await workbook.xlsx.writeBuffer();

    const dateName = startDate ? `${startDate}_sd_${endDate}` : 'all';
    const filename = `rekap-kesalahan_${dateName}.xlsx`;

    return new NextResponse(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
