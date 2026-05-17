import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'today';

  const now = new Date();
  const tz = 'Asia/Jakarta';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now); // YYYY-MM-DD
  const year = today.slice(0, 4);
  const month = today.slice(5, 7);
  const lastDay = new Date(Number(year), Number(month), 0).getDate();

  let sql: string;
  let args: (string | number)[] = [];

  if (period === 'today') {
    sql = `SELECT COUNT(*) as count FROM jurnal_harian_produksi WHERE tgl = ? AND deleted_at IS NULL`;
    args = [today];
  } else if (period === 'month') {
    sql = `SELECT COUNT(*) as count FROM jurnal_harian_produksi WHERE tgl >= ? AND tgl <= ? AND deleted_at IS NULL`;
    args = [`${year}-${month}-01`, `${year}-${month}-${String(lastDay).padStart(2, '0')}`];
  } else {
    sql = `SELECT COUNT(*) as count FROM jurnal_harian_produksi WHERE tgl >= ? AND tgl <= ? AND deleted_at IS NULL`;
    args = [`${year}-01-01`, `${year}-12-31`];
  }

  try {
    const result = await db.execute({ sql, args });
    const count = Number(result.rows[0]?.count || 0);
    return NextResponse.json({ count });
  } catch (err) {
    console.error('jurnal-count error:', err);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
