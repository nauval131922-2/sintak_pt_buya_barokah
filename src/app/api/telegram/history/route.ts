import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== process.env.SCRAPER_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const telegram_id = req.nextUrl.searchParams.get('telegram_id');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');

    if (!telegram_id) {
      return NextResponse.json({ error: 'Parameter "telegram_id" wajib diisi' }, { status: 400 });
    }

    // Cek user
    const userCheck = await db.execute({
      sql: `SELECT nama_karyawan FROM telegram_users WHERE telegram_id = ? AND is_active = 1 LIMIT 1`,
      args: [telegram_id]
    });

    if (userCheck.rows.length === 0) {
      return NextResponse.json({ 
        error: 'User tidak ditemukan atau belum disetujui' 
      }, { status: 403 });
    }

    const user = userCheck.rows[0] as any;

    // Query riwayat realisasi user (7 hari terakhir)
    const result = await db.execute({
      sql: `SELECT 
              id, tgl, shift, bagian, no_order_2, nama_order_2, jenis_pekerjaan_2,
              target, realisasi, bahan_kertas, warna, inscheet, rijek, jam, kendala,
              created_at
            FROM jurnal_harian_produksi
            WHERE nama_karyawan = ? 
              AND deleted_at IS NULL
              AND created_by LIKE 'telegram-bot%'
              AND tgl >= date('now', '-7 days')
            ORDER BY tgl DESC, id DESC
            LIMIT ?`,
      args: [user.nama_karyawan, limit]
    });

    const data = result.rows.map((row: any) => ({
      id: row.id,
      tgl: row.tgl,
      shift: row.shift,
      bagian: row.bagian,
      no_order: row.no_order_2,
      nama_order: row.nama_order_2,
      pekerjaan: row.jenis_pekerjaan_2,
      target: row.target,
      realisasi: row.realisasi,
      bahan_kertas: row.bahan_kertas,
      warna: row.warna,
      inscheet: row.inscheet,
      rijek: row.rijek,
      jam: row.jam,
      kendala: row.kendala,
      created_at: row.created_at
    }));

    return NextResponse.json({
      success: true,
      nama_karyawan: user.nama_karyawan,
      data
    });

  } catch (error: any) {
    console.error('[API] history error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
