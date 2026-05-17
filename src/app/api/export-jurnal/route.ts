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

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const bagian = searchParams.get("bagian");
    const namaKaryawan = searchParams.get("namaKaryawan");

    let whereParts: string[] = [];
    let args: any[] = [];

    if (search) {
      whereParts.push(`(nama_karyawan LIKE ? OR nama_order LIKE ? OR no_order LIKE ? OR jenis_pekerjaan LIKE ? OR nama_order_2 LIKE ? OR no_order_2 LIKE ?)`);
      const searchStr = `%${search}%`;
      args.push(searchStr, searchStr, searchStr, searchStr, searchStr, searchStr);
    }

    if (startDate && endDate) {
      whereParts.push(`(tgl BETWEEN ? AND ?)`);
      args.push(startDate, endDate);
    }

    if (bagian) {
      whereParts.push(`bagian = ?`);
      args.push(bagian);
    }

    if (namaKaryawan) {
      whereParts.push(`nama_karyawan = ?`);
      args.push(namaKaryawan);
    }

    // Selalu filter soft-deleted
    whereParts.push('deleted_at IS NULL');
    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const sqlData = `SELECT * FROM jurnal_harian_produksi ${whereClause} 
      ORDER BY 
        tgl ASC, 
        CASE UPPER(bagian)
          WHEN 'SETTING' THEN 1
          WHEN 'QUALITY CONTROL' THEN 2
          WHEN 'CETAK' THEN 3
          WHEN 'FINISHING' THEN 4
          WHEN 'GUDANG' THEN 5
          WHEN 'TEKNISI' THEN 6
          ELSE 7
        END ASC,
        CASE WHEN jenis_pekerjaan LIKE '%Koordinasi%' THEN 0 ELSE 1 END ASC,
        absensi ASC, 
        id ASC`;
        
    const result = await db.execute({ sql: sqlData, args });
    const data = result.rows;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Jurnal', {
      views: [
        {
          showGridLines: false,
          state: 'frozen',
          xSplit: 4, // Freeze A, B, C, D
          ySplit: 3, // Freeze rows 1, 2, 3
          topLeftCell: 'E4',
          activeCell: 'E4',
          zoomScale: 80 // Zoom level 80%
        }
      ]
    });

    const columns = [
      { header: 'No.', key: 'no', width: 5 },
      { header: 'Posisi', key: 'posisi', width: 15 },
      { header: 'Abs.', key: 'absensi', width: 8 },
      { header: 'Tanggal', key: 'tgl', width: 12 },
      { header: 'Sift', key: 'shift', width: 8 },
      { header: 'Nama Karyawan', key: 'nama_karyawan', width: 20 },
      { header: 'NO. Order (PPIC)', key: 'no_order', width: 18 },
      { header: 'Nama Order', key: 'nama_order', width: 25 },
      { header: 'Jenis Pekerjaan', key: 'jenis_pekerjaan', width: 20 },
      { header: 'Keterangan', key: 'keterangan', width: 20 },
      { header: 'Target', key: 'target', width: 10 },
      { header: 'Realisasi', key: 'realisasi', width: 10 },
      { header: 'No. Order ', key: 'no_order_2', width: 18 }, // Spasi ekstra
      { header: 'Nama Order ', key: 'nama_order_2', width: 25 }, // Spasi ekstra
      { header: 'Jenis Pekerjaan ', key: 'jenis_pekerjaan_2', width: 20 }, // Spasi ekstra
      { header: 'Bahan Kertas', key: 'bahan_kertas', width: 15 },
      { header: 'Jml. Plate', key: 'jml_plate', width: 10 },
      { header: 'Warna', key: 'warna', width: 10 },
      { header: 'Inscheet', key: 'inscheet', width: 10 },
      { header: 'Rijek', key: 'rijek', width: 10 },
      { header: 'Jam', key: 'jam', width: 15 },
      { header: 'Kendala', key: 'kendala', width: 20 },
      { header: 'Bagian', key: 'bagian', width: 15 }
    ];

    const tableRows = data.map((row: any, idx: number) => {
      let tglValue: number | string = '';
      if (row.tgl) {
        const parts = String(row.tgl).split('T')[0].split('-');
        if (parts.length === 3) {
          const dateUtc = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
          tglValue = (dateUtc.getTime() / 86400000) + 25569;
        } else {
          tglValue = formatIndoDateStr(row.tgl);
        }
      }

      return [
        idx + 1,
        row.posisi || '',
        Number(row.absensi || 0),
        tglValue,
        row.shift || '',
        row.nama_karyawan || '',
        row.no_order || '',
        row.nama_order || '',
        row.jenis_pekerjaan || '',
        row.keterangan || '',
        row.target !== null && row.target !== undefined ? row.target : '',
        row.realisasi !== null && row.realisasi !== undefined ? row.realisasi : '',
        row.no_order_2 || '',
        row.nama_order_2 || '',
        row.jenis_pekerjaan_2 || '',
        row.bahan_kertas || '',
        Number(row.jml_plate || 0),
        row.warna || '',
        Number(row.inscheet || 0),
        Number(row.rijek || 0),
        row.jam || '',
        row.kendala || '',
        row.bagian || ''
      ];
    });

    if (tableRows.length > 0) {
      sheet.addTable({
        name: 'TabelJurnal',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        style: {
          theme: 'TableStyleMedium2', // Tema tabel biru standar Excel
          showRowStripes: true,
        },
        columns: columns.map(c => ({ name: c.header, filterButton: true })),
        rows: tableRows
      });
    } else {
      // Jika data kosong, hanya tulis header
      sheet.addRow(columns.map(c => c.header));
    }

    // Set default row height
    sheet.properties.defaultRowHeight = 15;

    // Set width & styling untuk setiap kolom secara manual agar aman
    columns.forEach((c, idx) => {
      const col = sheet.getColumn(idx + 1); // getColumn 1-indexed
      col.width = c.width;
      col.font = { name: 'Calibri', size: 10 };
      col.alignment = { vertical: 'middle', horizontal: (idx === 0 || idx === 2) ? 'center' : 'left' };
    });

    // Formatting khusus kolom Tanggal (index ke-4)
    const colTgl = sheet.getColumn(4);
    colTgl.numFmt = 'dd/mm/yyyy';
    colTgl.alignment = { vertical: 'middle', horizontal: 'center' };

    // Format khusus Header Row (baris ke-1)
    const headerRow = sheet.getRow(1);
    headerRow.font = { name: 'Calibri', size: 10, bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Create buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const dateName = startDate ? `${startDate}_to_${endDate}` : 'All';
    const filename = `Jurnal_Produksi_${dateName}.xlsx`;

    return new NextResponse(buffer, {
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
