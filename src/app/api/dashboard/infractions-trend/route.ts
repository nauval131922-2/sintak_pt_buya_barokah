import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const now = new Date();
  const tz = 'Asia/Jakarta';
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now);
  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - 29);
  const defaultStartStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(defaultStart);

  const from = searchParams.get('from') || defaultStartStr;
  const to = searchParams.get('to') || todayStr;

  try {
    // Agregasi per hari: jumlah kasus (COUNT) dan total beban (SUM total)
    const [dailyRes, severityRes, topEmpRes] = await Promise.all([
      db.execute({
        sql: `
          SELECT DATE(date) as tgl,
                 COUNT(*) as kasus,
                 SUM(COALESCE(total, 0)) as beban,
                 SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high,
                 SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as medium,
                 SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low
          FROM infractions
          WHERE DATE(date) >= ? AND DATE(date) <= ?
          GROUP BY tgl ORDER BY tgl ASC
        `,
        args: [from, to],
      }),
      db.execute({
        sql: `
          SELECT
            SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high,
            SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as medium,
            SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low,
            SUM(CASE WHEN severity = 'High' THEN COALESCE(total, 0) ELSE 0 END) as beban_high,
            SUM(CASE WHEN severity = 'Medium' THEN COALESCE(total, 0) ELSE 0 END) as beban_medium,
            SUM(CASE WHEN severity = 'Low' THEN COALESCE(total, 0) ELSE 0 END) as beban_low
          FROM infractions
          WHERE DATE(date) >= ? AND DATE(date) <= ?
        `,
        args: [from, to],
      }),
      db.execute({
        sql: `
          SELECT
            COALESCE(employee_name, 'Tidak Diketahui') as nama,
            COUNT(*) as kasus,
            SUM(COALESCE(total, 0)) as beban,
            SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high,
            SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as medium,
            SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low
          FROM infractions
          WHERE DATE(date) >= ? AND DATE(date) <= ?
          GROUP BY employee_name
          ORDER BY beban DESC
          LIMIT 10
        `,
        args: [from, to],
      }),
    ]);

    const rawMap = new Map(
      (dailyRes.rows as any[]).map((r) => [
        r.tgl as string,
        {
          kasus: Number(r.kasus), beban: Number(r.beban),
          high: Number(r.high), medium: Number(r.medium), low: Number(r.low),
        },
      ])
    );

    const data: { date: string; kasus: number; beban: number; high: number; medium: number; low: number }[] = [];
    const cursor = new Date(`${from}T00:00:00+07:00`);
    const end = new Date(`${to}T00:00:00+07:00`);
    while (cursor <= end) {
      const key = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(cursor);
      const row = rawMap.get(key) ?? { kasus: 0, beban: 0, high: 0, medium: 0, low: 0 };
      data.push({ date: key, ...row });
      cursor.setDate(cursor.getDate() + 1);
    }

    const sv = severityRes.rows[0] as any;
    const severity = {
      high: Number(sv?.high ?? 0),
      medium: Number(sv?.medium ?? 0),
      low: Number(sv?.low ?? 0),
      beban_high: Number(sv?.beban_high ?? 0),
      beban_medium: Number(sv?.beban_medium ?? 0),
      beban_low: Number(sv?.beban_low ?? 0),
    };

    const topEmployees = (topEmpRes.rows as any[]).map((r) => ({
      nama: r.nama as string,
      kasus: Number(r.kasus),
      beban: Number(r.beban),
      high: Number(r.high),
      medium: Number(r.medium),
      low: Number(r.low),
    }));

    return NextResponse.json({ data, severity, topEmployees, from, to });
  } catch (err) {
    console.error('infractions-trend error:', err);
    return NextResponse.json({ data: [], from, to }, { status: 500 });
  }
}
