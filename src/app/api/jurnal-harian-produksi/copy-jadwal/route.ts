import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD UTC

    // Cek apakah hari ini (berdasarkan created_at) sudah ada COPY_JADWAL yang belum di-revert
    const todayCopyQuery = await db.execute({
      sql: `SELECT id, action_type FROM activity_logs
            WHERE action_type IN ('COPY_JADWAL', 'COPY_JADWAL_REVERTED')
              AND table_name = 'jurnal_harian_produksi'
              AND DATE(created_at) = ?
            ORDER BY id DESC LIMIT 1`,
      args: [todayStr]
    });

    // Dapatkan log COPY_JADWAL atau COPY_JADWAL_REVERTED terbaru (global, untuk canRevert)
    const lastCopyQuery = await db.execute({
      sql: `SELECT id, action_type FROM activity_logs
            WHERE action_type IN ('COPY_JADWAL', 'COPY_JADWAL_REVERTED')
              AND table_name = 'jurnal_harian_produksi'
            ORDER BY id DESC LIMIT 1`,
      args: []
    });

    // Dapatkan log REVERT_COPY_JADWAL terbaru
    const lastRevertQuery = await db.execute({
      sql: `SELECT id FROM activity_logs
            WHERE action_type = 'REVERT_COPY_JADWAL'
              AND table_name = 'jurnal_harian_produksi'
            ORDER BY id DESC LIMIT 1`,
      args: []
    });

    // hasCopiedToday: ada COPY_JADWAL hari ini yang belum di-revert
    let hasCopiedToday = false;
    if (todayCopyQuery.rows.length > 0) {
      const todayCopy = todayCopyQuery.rows[0] as any;
      hasCopiedToday = todayCopy.action_type === 'COPY_JADWAL'; // bukan COPY_JADWAL_REVERTED
    }

    // canRevert: copy terakhir (kapanpun) masih aktif belum di-revert
    let canRevert = false;
    if (lastCopyQuery.rows.length > 0) {
      const lastCopy = lastCopyQuery.rows[0] as any;
      const lastCopyId = Number(lastCopy.id);
      const isAlreadyReverted = lastCopy.action_type === 'COPY_JADWAL_REVERTED';

      if (!isAlreadyReverted) {
        if (lastRevertQuery.rows.length === 0) {
          canRevert = true;
        } else {
          const lastRevertId = Number((lastRevertQuery.rows[0] as any).id);
          canRevert = lastCopyId > lastRevertId;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      hasCopiedToday,
      canRevert
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
    const bagianFilter: string[] = Array.isArray(body.bagian) ? body.bagian : (body.bagian ? [body.bagian] : []);
    const namaKaryawanFilter: string[] = Array.isArray(body.namaKaryawan) ? body.namaKaryawan : (body.namaKaryawan ? [body.namaKaryawan] : []);

    if (!fromDate || !toDate) {
      return NextResponse.json({ error: 'Missing date parameters' }, { status: 400 });
    }

    // Build conditional WHERE clauses for filters
    const filterClauses: string[] = [`tgl = ?`];
    const filterArgs: any[] = [fromDate];

    if (bagianFilter.length > 0) {
      const placeholders = bagianFilter.map(() => '?').join(',');
      filterClauses.push(`bagian IN (${placeholders})`);
      filterArgs.push(...bagianFilter);
    }
    if (namaKaryawanFilter.length > 0) {
      const placeholders = namaKaryawanFilter.map(() => '?').join(',');
      filterClauses.push(`nama_karyawan IN (${placeholders})`);
      filterArgs.push(...namaKaryawanFilter);
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
                realisasi, no_order_2, nama_order_2, jenis_pekerjaan_2, bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala, bagian, is_manual_input, created_by
              )
              SELECT 
                posisi, absensi, ?, shift, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, target,
                0, '', '', '', '', 0, '', 0, 0, '', '', bagian, is_manual_input, ?
              FROM jurnal_harian_produksi
              WHERE ${whereSQL}`,
        args: [toDate, session.username || 'System', ...filterArgs]
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
