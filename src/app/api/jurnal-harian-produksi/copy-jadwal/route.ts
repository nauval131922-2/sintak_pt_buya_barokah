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
    const checkLog = await db.execute({
      sql: `SELECT id FROM activity_logs WHERE action_type = 'COPY_JADWAL' AND message LIKE ?`,
      args: [`%dari ${today} ke%`]
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

    const { today, tomorrow } = await request.json();
    if (!today || !tomorrow) return NextResponse.json({ error: 'Missing dates' }, { status: 400 });

    // Cek awal (fast-path, non-atomic — tujuannya hanya UX agar tidak loading lama)
    const checkLog = await db.execute({
      sql: `SELECT id FROM activity_logs WHERE action_type = 'COPY_JADWAL' AND message LIKE ?`,
      args: [`%dari ${today} ke%`]
    });

    if (checkLog.rows.length > 0) {
      return NextResponse.json({ error: 'Jadwal hari ini sudah di-copy sebelumnya.' }, { status: 400 });
    }

    // Pastikan ada data di hari ini
    const countToday = await db.execute({
      sql: `SELECT count(*) as count FROM jurnal_harian_produksi WHERE tgl = ?`,
      args: [today]
    });
    
    if (Number((countToday.rows[0] as any).count) === 0) {
      return NextResponse.json({ error: 'Tidak ada jadwal di hari ini untuk di-copy.' }, { status: 400 });
    }

    // Jalankan log INSERT dan data copy dalam satu batch (atomic write transaction).
    // Jika dua request lolos cek di atas secara bersamaan, batch kedua tetap berhasil
    // (SQLite serializes writes). Di sisi UX, tombol sudah di-disable setelah klik pertama.
    const logMessage = `Copy jadwal dari ${today} ke ${tomorrow}`;
    
    await db.batch([
      // 1. Tulis log dulu sebagai "claim"
      {
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['COPY_JADWAL', 'jurnal_harian_produksi', 0, logMessage, JSON.stringify({ today, tomorrow }), session.username || 'System']
      },
      // 2. Copy data jadwal dalam transaksi yang sama
      {
        sql: `INSERT INTO jurnal_harian_produksi (
                posisi, absensi, tgl, shift, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, target, 
                realisasi, no_order_2, nama_order_2, jenis_pekerjaan_2, bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala, bagian, is_manual_input
              )
              SELECT 
                posisi, absensi, ?, shift, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, target,
                0, '', '', '', '', 0, '', 0, 0, '', '', bagian, is_manual_input
              FROM jurnal_harian_produksi
              WHERE tgl = ?`,
        args: [tomorrow, today]
      }
    ], 'write');

    // Ambil jumlah data yang dicopy untuk response
    const copied = await db.execute({
      sql: `SELECT count(*) as count FROM jurnal_harian_produksi WHERE tgl = ? AND is_manual_input = (SELECT is_manual_input FROM jurnal_harian_produksi WHERE tgl = ? LIMIT 1)`,
      args: [tomorrow, tomorrow]
    });

    return NextResponse.json({ success: true, count: Number((copied.rows[0] as any).count) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
