import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { ensureJurnalUmumSchema } from '@/lib/jurnal-umum-schema';
import type { JurnalUmumExecutor } from '@/lib/jurnal-umum-schema';

export const dynamic = 'force-dynamic';

/**
 * Mengembalikan 20 transaksi jurnal umum terbaru yang rekeningnya berkaitan
 * dengan Laba/Rugi (akun 4-9) atau Arus Kas (rek_akuntansi.arus_kas = 'Kas').
 */
export async function GET(_req: NextRequest) {
  try {
    try {
      const executor = (db as unknown as { client?: JurnalUmumExecutor }).client || db;
      if (executor.execute) {
        await ensureJurnalUmumSchema(executor as unknown as JurnalUmumExecutor);
      }
    } catch {}

    // Ambil 20 child rows terbaru yang rekeningnya terkait LR atau Kas.
    // Username diambil dari parent row karena child rows tidak punya username sendiri.
    const sql = `
      SELECT
        j.id,
        j.faktur,
        j.tgl,
        j.rekening,
        j.keterangan,
        j.debit,
        j.kredit,
        COALESCE(NULLIF(j.username, ''), p.username) AS username,
        j.create_at,
        CASE
          WHEN j.rek_head BETWEEN '4' AND '9'
          THEN 'Laba/Rugi'
          WHEN j.rek_kode IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas')
          THEN 'Arus Kas'
          ELSE NULL
        END AS jenis_akun
      FROM jurnal_umum j
      LEFT JOIN jurnal_umum p
        ON p.faktur = j.parent_faktur AND p.is_child = 0
      WHERE j.is_child = 1
        AND (
          j.rek_head BETWEEN '4' AND '9'
          OR
          j.rek_kode IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas')
        )
      ORDER BY j.create_at DESC, j.id DESC
      LIMIT 20
    `;

    const result = await db.execute(sql);
    const rows = result.rows as any[];

    return NextResponse.json({ success: true, data: rows });

  } catch (error: any) {
    console.error('API Error (akunting-jurnal-terbaru):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
