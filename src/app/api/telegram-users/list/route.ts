import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await db.execute({
      sql: `SELECT id, telegram_id, telegram_username, nama_karyawan, posisi, absensi, bagian, is_active,
                   requested_at, approved_at, approved_by
            FROM telegram_users
            ORDER BY is_active ASC, registered_at DESC`,
      args: []
    });

    const data = result.rows.map((row: any) => ({
      id: row.id,
      telegram_id: row.telegram_id,
      telegram_username: row.telegram_username,
      nama_karyawan: row.nama_karyawan,
      posisi: row.posisi,
      absensi: row.absensi,
      bagian: row.bagian,
      is_active: Number(row.is_active),
      requested_at: row.registered_at,
      approved_at: row.approved_at,
      approved_by: row.approved_by,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
