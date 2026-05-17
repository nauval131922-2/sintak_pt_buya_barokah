import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const result = await db.execute({
      sql: `
        SELECT
          id, tgl, shift, nama_karyawan, no_order, nama_order,
          jenis_pekerjaan, jenis_pekerjaan_2, bagian, target, realisasi,
          no_order_2, nama_order_2,
          COALESCE(updated_by, created_by) AS recorded_by,
          CASE
            WHEN deleted_at IS NOT NULL THEN 'DELETE'
            WHEN updated_at IS NOT NULL THEN 'UPDATE'
            ELSE 'INSERT'
          END AS action_type,
          COALESCE(updated_at, deleted_at, created_at) AS input_at
        FROM jurnal_harian_produksi
        ORDER BY COALESCE(updated_at, deleted_at, created_at) DESC, id DESC
        LIMIT 8
      `,
      args: [],
    });


    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
