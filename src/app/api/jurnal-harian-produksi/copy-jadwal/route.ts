import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const today = searchParams.get("today");

    if (!today) {
      return NextResponse.json({ error: 'Missing today parameter' }, { status: 400 });
    }

    // Cek apakah hari ini sudah pernah di-copy
    // Gunakan raw_data JSON prefix match (bisa pakai index) daripada LIKE '%...%' pada message
    const checkLog = await db.execute({
      sql: `SELECT id FROM activity_logs 
            WHERE action_type = 'COPY_JADWAL' 
              AND table_name = 'jurnal_harian_produksi'
              AND raw_data LIKE ?
            LIMIT 1`,
      args: [`{"from":"${today}"%`]
    });

    return NextResponse.json({ 
      success: true, 
      hasCopiedToday: checkLog.rows.length > 0 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    
    // Support new flexible params (from, to, bagian, namaKaryawan)
    // Also support old params (today, tomorrow) for backward compat
    const fromDate: string = body.from || body.today;
    const toDate: string = body.to || body.tomorrow;
    const bagianFilter: string = body.bagian || '';
    const namaKaryawanFilter: string = body.namaKaryawan || '';

    if (!fromDate || !toDate) {
      return NextResponse.json({ error: 'Missing date parameters' }, { status: 400 });
    }

    // Build conditional WHERE clauses for filters
    const filterClauses: string[] = [`tgl = ?`];
    const filterArgs: any[] = [fromDate];

    if (bagianFilter) {
      filterClauses.push(`bagian = ?`);
      filterArgs.push(bagianFilter);
    }
    if (namaKaryawanFilter) {
      filterClauses.push(`nama_karyawan = ?`);
      filterArgs.push(namaKaryawanFilter);
    }

    filterClauses.push('deleted_at IS NULL');
    const whereSQL = filterClauses.join(' AND ');

    // Pastikan ada data di tanggal asal dengan filter yang diberikan
    const countSource = await db.execute({
      sql: `SELECT count(*) as count FROM jurnal_harian_produksi WHERE ${whereSQL}`,
      args: filterArgs
    });
    
    if (Number((countSource.rows[0] as any).count) === 0) {
      return NextResponse.json({ error: 'Tidak ada jadwal yang cocok dengan filter untuk di-copy.' }, { status: 400 });
    }

    // Buat log message yang deskriptif
    const filterDesc = [
      bagianFilter ? `bagian: ${bagianFilter}` : '',
      namaKaryawanFilter ? `karyawan: ${namaKaryawanFilter}` : '',
    ].filter(Boolean).join(', ');
    
    const logMessage = `Copy jadwal dari ${fromDate} ke ${toDate}${filterDesc ? ` (${filterDesc})` : ''}`;
    
    await db.batch([
      // 1. Tulis log
      {
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['COPY_JADWAL', 'jurnal_harian_produksi', 0, logMessage, JSON.stringify(body), session.username || 'System']
      },
      // 2. Copy data jadwal dengan filter
      {
        sql: `INSERT INTO jurnal_harian_produksi (
                posisi, absensi, tgl, shift, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, target, 
                realisasi, no_order_2, nama_order_2, jenis_pekerjaan_2, bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala, bagian, is_manual_input
              )
              SELECT 
                posisi, absensi, ?, shift, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, target,
                0, '', '', '', '', 0, '', 0, 0, '', '', bagian, is_manual_input
              FROM jurnal_harian_produksi
              WHERE ${whereSQL}`,
        args: [toDate, ...filterArgs]
      }
    ], 'write');

    // Ambil jumlah data yang dicopy untuk response
    const copied = await db.execute({
      sql: `SELECT count(*) as count FROM jurnal_harian_produksi WHERE tgl = ? AND deleted_at IS NULL`,
      args: [toDate]
    });

    return NextResponse.json({ success: true, count: Number((copied.rows[0] as any).count) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
