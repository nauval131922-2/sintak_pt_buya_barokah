import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/server-cache';

export const dynamic = 'force-dynamic';

// Definisi warning: SO lebih rendah dari HPP (barang jadi atau rata-rata)
const WARNING_SQL = `(
  (so.harga > 0 AND (so.harga < bj.hp OR so.harga < avg.hp_rata_rata))
  OR
  (sr.harga > 0 AND (sr.harga < bj.hp OR sr.harga < avg.hp_rata_rata))
)`;

// barang_jadi.tgl format: DD-MM-YYYY → konversi ke YYYY-MM-DD untuk perbandingan
const TGL_ISO = `substr(bj.tgl, 7, 4) || '-' || substr(bj.tgl, 4, 2) || '-' || substr(bj.tgl, 1, 2)`;

// ponytail: 1 scan + JOIN instead of 3× correlated-subquery full scans
export async function GET() {
  try {
    const now = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
    );
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day   = String(now.getDate()).padStart(2, '0');

    const today      = `${year}-${month}-${day}`;
    const monthStart = `${year}-${month}-01`;
    const yearStart  = `${year}-01-01`;

    const ck = `dashboard:bj-warning:${today}`;
    const cached = cacheGet<{ today: number; this_month: number; this_year: number }>(ck);
    if (cached) {
      return NextResponse.json({ success: true, ...cached, generated_at: new Date().toISOString() });
    }

    const result = await db.execute({
      sql: `
        SELECT
          SUM(CASE WHEN (${TGL_ISO}) = ? AND ${WARNING_SQL} THEN 1 ELSE 0 END) AS today,
          SUM(CASE WHEN (${TGL_ISO}) >= ? AND ${WARNING_SQL} THEN 1 ELSE 0 END) AS this_month,
          SUM(CASE WHEN ${WARNING_SQL} THEN 1 ELSE 0 END) AS this_year
        FROM barang_jadi bj
        LEFT JOIN (
          SELECT faktur_prd, kd_barang,
            SUM(hp_total)*1.0 / NULLIF(SUM(qty), 0) AS hp_rata_rata
          FROM barang_jadi
          GROUP BY faktur_prd, kd_barang
        ) avg ON avg.faktur_prd = bj.faktur_prd AND avg.kd_barang = bj.kd_barang
        LEFT JOIN (
          SELECT faktur, MIN(harga) AS harga FROM sales_orders GROUP BY faktur
        ) so ON so.faktur = bj.faktur_so
        LEFT JOIN (
          SELECT faktur_so, MIN(harga) AS harga FROM sales_reports GROUP BY faktur_so
        ) sr ON sr.faktur_so = bj.faktur_so
        WHERE (${TGL_ISO}) BETWEEN ? AND ?
      `,
      args: [today, monthStart, yearStart, today],
    });

    const row = result.rows[0] as unknown as { today: number; this_month: number; this_year: number } | undefined;
    const payload = {
      today:      Number(row?.today ?? 0),
      this_month: Number(row?.this_month ?? 0),
      this_year:  Number(row?.this_year ?? 0),
    };
    cacheSet(ck, payload, 120_000); // 2 min

    return NextResponse.json({
      success: true,
      ...payload,
      generated_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('barang-jadi-warning API error:', error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
