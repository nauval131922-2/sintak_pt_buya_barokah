import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { canViewActivityLog } from '@/lib/activity-log-permissions';

function todayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}

function toIsoRange(from: string, to: string) {
  return {
    fromIso: new Date(`${from}T00:00:00+07:00`).toISOString(),
    toIso: new Date(`${to}T23:59:59.999+07:00`).toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await canViewActivityLog(session.role))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const today = todayStr();
    const from = searchParams.get('from') || today;
    const to = searchParams.get('to') || today;
    const { fromIso, toIso } = toIsoRange(from, to);

    const args = [fromIso, toIso];
    const [summary, rows] = await Promise.all([
      db.execute({
        sql: `
          SELECT
            COUNT(*) AS total,
            COALESCE(ROUND(AVG(duration_ms)), 0) AS avg_ms,
            COALESCE(MAX(duration_ms), 0) AS max_ms,
            SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS errors
          FROM performance_logs
          WHERE created_at >= ? AND created_at <= ?
        `,
        args,
      }),
      db.execute({
        sql: `
          SELECT id, created_at, username, type, module, action, endpoint, method,
                 duration_ms, status_code, success, message
          FROM performance_logs
          WHERE created_at >= ? AND created_at <= ?
          ORDER BY duration_ms DESC, created_at DESC
          LIMIT 10
        `,
        args,
      }),
    ]);

    return NextResponse.json({
      success: true,
      summary: summary.rows[0] || { total: 0, avg_ms: 0, max_ms: 0, errors: 0 },
      data: rows.rows,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
