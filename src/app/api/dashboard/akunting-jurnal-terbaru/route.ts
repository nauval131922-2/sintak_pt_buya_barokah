import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Mengembalikan 20 transaksi jurnal umum terbaru yang rekeningnya berkaitan
 * dengan Laba/Rugi (akun 4-9) atau Arus Kas (rek_akuntansi.arus_kas = 'Kas').
 */
export async function GET(_req: NextRequest) {
  try {
    // Pastikan tabel ada dulu
    try {
      const executor = (db as any).client || db;
      if (executor.execute) {
        await executor.execute(`CREATE TABLE IF NOT EXISTS jurnal_umum (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          faktur TEXT NOT NULL,
          tgl TEXT,
          rekening TEXT,
          keterangan TEXT,
          debit REAL,
          kredit REAL,
          username TEXT,
          create_at TEXT,
          parent_faktur TEXT,
          is_child INTEGER DEFAULT 0,
          child_order INTEGER DEFAULT 0,
          raw_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(faktur, child_order, is_child)
        )`);
      }
    } catch (_) {}

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
          WHEN CAST(substr(trim(j.rekening), 1, 1) AS INTEGER) BETWEEN 4 AND 9
          THEN 'Laba/Rugi'
          WHEN trim(substr(j.rekening, 1,
            CASE WHEN instr(j.rekening, ' - ') > 0
                 THEN instr(j.rekening, ' - ') - 1
                 ELSE length(j.rekening) END
          )) IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas')
          THEN 'Arus Kas'
          ELSE NULL
        END AS jenis_akun
      FROM jurnal_umum j
      LEFT JOIN jurnal_umum p
        ON p.faktur = j.parent_faktur AND p.is_child = 0
      WHERE j.is_child = 1
        AND (
          CAST(substr(trim(j.rekening), 1, 1) AS INTEGER) BETWEEN 4 AND 9
          OR
          trim(substr(j.rekening, 1,
            CASE WHEN instr(j.rekening, ' - ') > 0
                 THEN instr(j.rekening, ' - ') - 1
                 ELSE length(j.rekening) END
          )) IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas')
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
