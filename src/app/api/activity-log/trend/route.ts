import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { buildActivityLogWhere, getActivityLogTable } from '@/lib/activity-log-query';
import { canViewActivityLog } from '@/lib/activity-log-permissions';

export interface ActivityLogTrendDay {
  date: string;
  total: number;
  byAction: Record<string, number>;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await canViewActivityLog(session.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source') === 'archive' ? 'archive' : 'active';
    const table = getActivityLogTable(source);
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    // Safety guard: trend tanpa date range bakal scan semua baris — tolak
    if (!from || !to) {
      return NextResponse.json({ success: true, days: [], source, note: 'date range required' });
    }

    // ponytail: adaptive grouping based on range size
    const fromMs = new Date(from).getTime();
    const toMs = new Date(to).getTime();
    const rangeDays = Math.round((toMs - fromMs) / 86400_000);
    
    let groupBy = 'day';
    let dateFormat = '%Y-%m-%d'; // daily
    
    if (rangeDays > 90) {
      groupBy = 'month';
      dateFormat = '%Y-%m'; // monthly
    } else if (rangeDays > 31) {
      groupBy = 'week';
      dateFormat = '%Y-W%W'; // weekly (year-week)
    }

    const params = {
      from,
      to,
      search: (searchParams.get('search') || '').trim() || undefined,
      tableName: searchParams.get('tableName') || searchParams.get('table') || undefined,
      actionType: searchParams.get('actionType') || searchParams.get('action') || undefined,
      recordedBy: searchParams.get('recordedBy') || searchParams.get('user') || undefined,
      source: source as 'active' | 'archive',
      // Trend doesn't need user name search or raw_data search — skip expensive scans
      opts: { skipUserNameSearch: true, skipRawDataSearch: true },
    };
    const { whereClause, args } = buildActivityLogWhere(params);

    const result = await db.execute({
      sql: `
        SELECT strftime('${dateFormat}', datetime(al.created_at, '+7 hours')) AS period, al.action_type, COUNT(*) AS cnt
        FROM ${table} al
        ${whereClause}
        GROUP BY period, al.action_type
        ORDER BY period ASC
      `,
      args,
    });

    const hourlyResult = await db.execute({
      sql: `
        SELECT strftime('%H', datetime(al.created_at, '+7 hours')) AS hour, COUNT(*) AS cnt
        FROM ${table} al
        ${whereClause}
        GROUP BY hour
        ORDER BY hour ASC
      `,
      args,
    });

    const dayMap = new Map<string, ActivityLogTrendDay>();
    for (const row of result.rows) {
      const period = String(row.period ?? '');
      if (!period) continue;
      const action = String(row.action_type ?? 'OTHER');
      const cnt = Number(row.cnt ?? 0);
      
      if (!dayMap.has(period)) {
        dayMap.set(period, { date: period, total: 0, byAction: {} });
      }
      const entry = dayMap.get(period)!;
      entry.byAction[action] = cnt;
      entry.total += cnt;
    }

    const days = Array.from(dayMap.values());
    const hourly = hourlyResult.rows.map((r) => ({
      hour: String(r.hour ?? '').padStart(2, '0'),
      count: Number(r.cnt ?? 0),
    }));

    return NextResponse.json({ success: true, days, hourly, source, groupBy, rangeDays });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
