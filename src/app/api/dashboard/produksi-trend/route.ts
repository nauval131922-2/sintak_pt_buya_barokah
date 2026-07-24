import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/server-cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json({ error: 'from dan to diperlukan' }, { status: 400 });
    }

    const ck = `dashboard:produksi-trend:${from}:${to}`;
    const cached = cacheGet<unknown[]>(ck);
    if (cached) return NextResponse.json({ success: true, data: cached });

    // BBB menggunakan format dd/mm/yyyy → konversi di SQL
    const dateConvBBB = `(substr(tgl,7,4) || '-' || substr(tgl,4,2) || '-' || substr(tgl,1,2))`;
    // Barang jadi sama formatnya
    const dateConvBJ = `(substr(tgl,7,4) || '-' || substr(tgl,4,2) || '-' || substr(tgl,1,2))`;

    const [bbbResult, bjResult] = await db.batch([
      {
        sql: `
          SELECT
            ${dateConvBBB} as date,
            COALESCE(SUM(hp_total), 0) as nilai_bbb,
            COALESCE(SUM(qty), 0) as qty_bbb
          FROM bahan_baku
          WHERE ${dateConvBBB} >= ? AND ${dateConvBBB} <= ?
          GROUP BY date
          ORDER BY date ASC
        `,
        args: [from, to],
      },
      {
        sql: `
          SELECT
            ${dateConvBJ} as date,
            COALESCE(SUM(hp_total), 0) as hpp_total,
            COALESCE(SUM(qty), 0) as qty_hasil
          FROM barang_jadi
          WHERE ${dateConvBJ} >= ? AND ${dateConvBJ} <= ?
          GROUP BY date
          ORDER BY date ASC
        `,
        args: [from, to],
      },
    ], 'read');

    // Gabungkan per tanggal
    const mapBBB = new Map<string, { nilai_bbb: number; qty_bbb: number }>();
    for (const row of bbbResult.rows as any[]) {
      mapBBB.set(row.date, { nilai_bbb: Number(row.nilai_bbb), qty_bbb: Number(row.qty_bbb) });
    }
    const mapBJ = new Map<string, { hpp_total: number; qty_hasil: number }>();
    for (const row of bjResult.rows as any[]) {
      mapBJ.set(row.date, { hpp_total: Number(row.hpp_total), qty_hasil: Number(row.qty_hasil) });
    }

    // Buat array semua tanggal dalam range
    const points: any[] = [];
    const start = new Date(`${from}T00:00:00+07:00`);
    const end = new Date(`${to}T00:00:00+07:00`);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
      const bbb = mapBBB.get(dateStr);
      const bj = mapBJ.get(dateStr);
      points.push({
        date: dateStr,
        nilai_bbb: bbb?.nilai_bbb ?? 0,
        qty_bbb: bbb?.qty_bbb ?? 0,
        hpp_total: bj?.hpp_total ?? 0,
        qty_hasil: bj?.qty_hasil ?? 0,
      });
    }

    cacheSet(ck, points, 60_000);
    return NextResponse.json({ success: true, data: points });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
