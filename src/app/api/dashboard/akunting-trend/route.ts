import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to   = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json({ success: false, error: 'Parameter from dan to wajib diisi' }, { status: 400 });
    }

    // Pastikan tabel ada
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

    // Tren harian: GROUP BY tgl transaksi (kolom tgl di parent, child ikut tgl parent)
    // Laba/Rugi: rekening akun 4-9 (Pendapatan & Biaya) → kredit - debit
    // Arus Kas: rekening yang ada di rek_akuntansi.arus_kas = 'Kas' → debit - kredit
    const trendSql = `
      SELECT
        j.tgl AS date,
        SUM(
          CASE
            WHEN CAST(substr(trim(j.rekening), 1, 1) AS INTEGER) BETWEEN 4 AND 9
            THEN (COALESCE(j.kredit, 0) - COALESCE(j.debit, 0))
            ELSE 0
          END
        ) AS laba_rugi,
        SUM(
          CASE
            WHEN trim(substr(j.rekening, 1,
              CASE WHEN instr(j.rekening, ' - ') > 0
                   THEN instr(j.rekening, ' - ') - 1
                   ELSE length(j.rekening) END
            )) IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas')
            THEN (COALESCE(j.debit, 0) - COALESCE(j.kredit, 0))
            ELSE 0
          END
        ) AS arus_kas
      FROM jurnal_umum j
      WHERE j.is_child = 1
        AND j.tgl BETWEEN ? AND ?
      GROUP BY j.tgl
      ORDER BY j.tgl ASC
    `;

    const result = await db.execute({ sql: trendSql, args: [from, to] });
    const rows = result.rows as any[];

    return NextResponse.json({
      success: true,
      data: rows.map(r => ({
        date:      String(r.date || ''),
        laba_rugi: Number(r.laba_rugi ?? 0) || 0,
        arus_kas:  Number(r.arus_kas  ?? 0) || 0,
      })),
    });

  } catch (error: any) {
    console.error('API Error (akunting-trend):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
