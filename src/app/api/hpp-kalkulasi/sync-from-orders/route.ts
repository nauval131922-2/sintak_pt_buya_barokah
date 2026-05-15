import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

// POST — sync nama_prd dari tabel orders ke hpp_kalkulasi
// Upsert: insert baru kalau belum ada, skip kalau sudah ada (jaga hpp_kalkulasi yang sudah diisi)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Ambil semua nama_prd unik dari orders
    const { rows } = await db.execute(
      `SELECT DISTINCT nama_prd FROM orders WHERE nama_prd IS NOT NULL AND TRIM(nama_prd) != '' ORDER BY nama_prd ASC`
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: true, synced: 0 });
    }

    // Upsert: insert jika belum ada, jangan overwrite hpp_kalkulasi yang sudah diisi
    const batchOps = rows.map((r: any) => ({
      sql: `INSERT INTO hpp_kalkulasi (nama_order, hpp_kalkulasi, keterangan)
            VALUES (?, 0, NULL)
            ON CONFLICT(nama_order) DO NOTHING`,
      args: [String(r.nama_prd).trim()],
    }));

    const chunkSize = 100;
    for (let i = 0; i < batchOps.length; i += chunkSize) {
      await db.batch(batchOps.slice(i, i + chunkSize), 'write');
    }

    // Record last sync time
    await db.execute({
      sql: `INSERT INTO system_settings (key, value) VALUES ('last_scrape_hpp_kalkulasi', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [new Date().toISOString()]
    });

    return NextResponse.json({ success: true, synced: rows.length });
  } catch (error: any) {
    console.error('[SYNC HPP] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
