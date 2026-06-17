import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Cari log copy jadwal terakhir
    const logQuery = await db.execute({
      sql: `SELECT id, raw_data, message FROM activity_logs 
            WHERE action_type = 'COPY_JADWAL' 
              AND table_name = 'jurnal_harian_produksi' 
            ORDER BY id DESC LIMIT 1`,
      args: []
    });

    if (logQuery.rows.length === 0) {
      return NextResponse.json({ error: 'Tidak ada riwayat penyalinan jadwal yang dapat dibatalkan.' }, { status: 404 });
    }

    const log = logQuery.rows[0] as any;
    const logId = log.id;

    // Cari log revert terakhir untuk membandingkan ID
    const revertQuery = await db.execute({
      sql: `SELECT id FROM activity_logs 
            WHERE action_type = 'REVERT_COPY_JADWAL' 
              AND table_name = 'jurnal_harian_produksi' 
            ORDER BY id DESC LIMIT 1`,
      args: []
    });

    if (revertQuery.rows.length > 0) {
      const lastRevertId = Number((revertQuery.rows[0] as any).id);
      if (Number(logId) < lastRevertId) {
        return NextResponse.json({ error: 'Penyalinan jadwal terakhir sudah pernah dibatalkan sebelumnya.' }, { status: 400 });
      }
    }
    let rawData: any = {};
    
    try {
      rawData = JSON.parse(log.raw_data || '{}');
    } catch (e) {
      return NextResponse.json({ error: 'Data log tidak valid, tidak dapat di-revert.' }, { status: 400 });
    }

    const toDate: string = rawData.to || rawData.tomorrow;
    const bagianFilter: string[] = Array.isArray(rawData.bagian) ? rawData.bagian : (rawData.bagian ? [rawData.bagian] : []);
    const namaKaryawanFilter: string[] = Array.isArray(rawData.namaKaryawan) ? rawData.namaKaryawan : (rawData.namaKaryawan ? [rawData.namaKaryawan] : []);

    if (!toDate) {
      return NextResponse.json({ error: 'Tanggal tujuan penyalinan tidak ditemukan di log.' }, { status: 400 });
    }

    // 2. Susun clause WHERE untuk soft delete data yang telah disalin
    const filterClauses: string[] = [`tgl = ?`];
    const filterArgs: any[] = [toDate];

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

    // 3. Cari jumlah data yang akan di-revert untuk keperluan log & response
    const countQuery = await db.execute({
      sql: `SELECT COUNT(*) as count FROM jurnal_harian_produksi WHERE ${whereSQL}`,
      args: filterArgs
    });
    const revertCount = Number((countQuery.rows[0] as any).count || 0);

    if (revertCount === 0) {
      // Tandai saja log lama sebagai reverted jika datanya sudah tidak ada/dihapus manual
      await db.execute({
        sql: `UPDATE activity_logs SET action_type = 'COPY_JADWAL_REVERTED' WHERE id = ?`,
        args: [logId]
      });
      return NextResponse.json({ 
        success: true, 
        count: 0,
        message: 'Tidak ada data jadwal aktif yang perlu dihapus (kemungkinan sudah dihapus manual).' 
      });
    }

    const username = session.username || 'System';
    const logMessage = `Revert copy jadwal ke ${toDate} (${revertCount} data dihapus)`;

    // 4. Jalankan batch query: soft-delete data JHP, ubah status log lama, dan catat log revert baru
    await db.batch([
      // A. Soft delete data di jurnal_harian_produksi
      {
        sql: `UPDATE jurnal_harian_produksi 
              SET deleted_at = CURRENT_TIMESTAMP, updated_by = ? 
              WHERE ${whereSQL}`,
        args: [username, ...filterArgs]
      },
      // B. Tandai log copy terakhir sebagai reverted
      {
        sql: `UPDATE activity_logs 
              SET action_type = 'COPY_JADWAL_REVERTED' 
              WHERE id = ?`,
        args: [logId]
      },
      // C. Tulis log aktivitas baru untuk aksi revert ini
      {
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['REVERT_COPY_JADWAL', 'jurnal_harian_produksi', 0, logMessage, log.raw_data, username]
      }
    ], 'write');

    // Wajib catat ke activity log manual sesuai aturan docs/DEV_RULES.md (Bagian 1)
    // Tabel jurnal_harian_produksi dikecualikan dari log otomatis. Aksi revert massal ini wajib mencatat ke activity_logs
    // Kita sudah mencatatnya di langkah C di atas, sehingga aturan manual terpenuhi secara atomis dalam batch transaction.

    return NextResponse.json({ 
      success: true, 
      count: revertCount 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
