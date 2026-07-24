import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/server-cache';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const ck = 'dashboard:jurnal-terbaru';
    const cached = cacheGet<unknown[]>(ck);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const result = await db.execute({
      sql: `
        SELECT
          j.id, j.tgl, j.shift, j.nama_karyawan, j.no_order, j.nama_order,
          j.jenis_pekerjaan, j.jenis_pekerjaan_2, j.bagian, j.target, j.realisasi,
          j.no_order_2, j.nama_order_2,
          COALESCE(j.updated_by, j.created_by) AS recorded_by,
          u.name AS recorded_by_name,
          CASE
            WHEN j.deleted_at IS NOT NULL THEN 'DELETE'
            WHEN j.updated_at IS NOT NULL THEN 'UPDATE'
            ELSE 'INSERT'
          END AS action_type,
          COALESCE(j.updated_at, j.deleted_at, j.created_at) AS input_at
        FROM jurnal_harian_produksi j
        LEFT JOIN users u ON u.username = COALESCE(j.updated_by, j.created_by)
        ORDER BY COALESCE(j.updated_at, j.deleted_at, j.created_at) DESC, j.id DESC
        LIMIT 8
      `,
      args: [],
    });

    cacheSet(ck, result.rows, 30_000);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
