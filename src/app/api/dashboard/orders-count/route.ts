import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'today';

  const now = new Date();
  const tz = 'Asia/Jakarta';

  // Format DD/MM/YYYY untuk kolom tgl di tabel orders
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('id-ID', {
      timeZone: tz,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
      .format(d)
      .replace(/\//g, '-'); // DD-MM-YYYY sesuai format database

  const todayStr = fmt(now); // e.g. "17/05/2025"

  const year = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric' }).format(now); // "2025"
  const month = new Intl.DateTimeFormat('en-CA', { timeZone: tz, month: '2-digit' }).format(now); // "05"

  // Kolom tgl tersimpan sebagai DD/MM/YYYY
  // Untuk range, kita konversi tgl ke ISO agar bisa dibandingkan:
  // substr(tgl,7,4)||'-'||substr(tgl,4,2)||'-'||substr(tgl,1,2) → YYYY-MM-DD
  const tglAsIso = `substr(tgl,7,4)||'-'||substr(tgl,4,2)||'-'||substr(tgl,1,2)`;

  let sql: string;
  let args: (string | number)[] = [];

  if (period === 'today') {
    // Langsung match string DD/MM/YYYY
    sql = `SELECT COUNT(*) as count FROM orders WHERE tgl = ?`;
    args = [todayStr];
  } else if (period === 'month') {
    const start = `${year}-${month}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    sql = `SELECT COUNT(*) as count FROM orders WHERE ${tglAsIso} >= ? AND ${tglAsIso} <= ?`;
    args = [start, end];
  } else if (period === 'year') {
    sql = `SELECT COUNT(*) as count FROM orders WHERE ${tglAsIso} >= ? AND ${tglAsIso} <= ?`;
    args = [`${year}-01-01`, `${year}-12-31`];
  } else {
    sql = `SELECT COUNT(*) as count FROM orders`;
    args = [];
  }

  try {
    const result = await db.execute({ sql, args });
    const count = Number(result.rows[0]?.count || 0);
    return NextResponse.json({ count });
  } catch (err) {
    console.error('orders-count error:', err);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
