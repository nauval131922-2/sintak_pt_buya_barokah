import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

// GET: ambil data yang sudah di-soft delete (untuk Super Admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'Super Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const result = await db.execute({
      sql: `SELECT id, tgl, shift, nama_karyawan, bagian, jenis_pekerjaan, jenis_pekerjaan_2,
              no_order, nama_order, no_order_2, nama_order_2,
              target, realisasi, created_at, updated_at, deleted_at
            FROM jurnal_harian_produksi
            WHERE deleted_at IS NOT NULL
            ORDER BY deleted_at DESC
            LIMIT ? OFFSET ?`,
      args: [limit, offset],
    });

    const countResult = await db.execute(`SELECT COUNT(*) as count FROM jurnal_harian_produksi WHERE deleted_at IS NOT NULL`);

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: Number((countResult.rows[0] as any)?.count ?? 0),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: restore data yang sudah di-soft delete
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'Super Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs tidak valid' }, { status: 400 });
    }

    const placeholders = ids.map(() => '?').join(', ');
    await db.execute({
      sql: `UPDATE jurnal_harian_produksi SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
      args: ids,
    });

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['RESTORE', 'jurnal_harian_produksi', 0, `Restore ${ids.length} baris Jurnal Harian Produksi`, JSON.stringify({ ids }), session.username || 'System'],
    });

    return NextResponse.json({ success: true, restoredCount: ids.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
