import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Auth check - harus login sebagai admin
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cek role - hanya Super Admin yang bisa akses
    if (session.role !== 'Super Admin') {
      return NextResponse.json({ 
        error: 'Hanya Super Admin yang dapat mengakses data ini' 
      }, { status: 403 });
    }

    const status = req.nextUrl.searchParams.get('status'); // pending, active, all
    const bagian = req.nextUrl.searchParams.get('bagian'); // filter by bagian

    let whereClause = '';
    const args: any[] = [];

    if (status === 'pending') {
      whereClause = 'WHERE is_active = 0';
    } else if (status === 'active') {
      whereClause = 'WHERE is_active = 1';
    }

    if (bagian) {
      whereClause += whereClause ? ' AND bagian = ?' : 'WHERE bagian = ?';
      args.push(bagian);
    }

    // Query list users
    const result = await db.execute({
      sql: `SELECT 
              id, telegram_id, telegram_username, nama_karyawan, posisi, absensi, 
              bagian, is_active, registered_at, approved_at, approved_by
            FROM telegram_users
            ${whereClause}
            ORDER BY registered_at DESC`,
      args
    });

    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    console.error('[API] list-users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
