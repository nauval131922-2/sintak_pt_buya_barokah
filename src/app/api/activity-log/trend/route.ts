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

    // Guard: range > 31 hari terlalu berat untuk GROUP BY date(created_at)
    const fromMs = new Date(from).getTime();
    const toMs = new Date(to).getTime();
    if (!isNaN(fromMs) && !isNaN(toMs) && (toMs - fromMs) > 31 * 86400_000) {
      return NextResponse.json({ success: true, days: [], source, note: 'range too wide, max 31 days' });
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
        SELECT date(datetime(al.created_at, '+7 hours')) AS day, al.action_type, COUNT(*) AS cnt
        FROM ${table} al
        ${whereClause}
        GROUP BY day, al.action_type
        ORDER BY day ASC
      `,
      args,
    });

    const dayMap = new Map<string, ActivityLogTrendDay>();
    for (const row of result.rows) {
      const date = String(row.day ?? '');
      if (!date) continue;
      const action = String(row.action_type ?? 'OTHER');
      const cnt = Number(row.cnt ?? 0);
      if (!dayMap.has(date)) {
        dayMap.set(date, { date, total: 0, byAction: {} });
      }
      const entry = dayMap.get(date)!;
      entry.byAction[action] = cnt;
      entry.total += cnt;
    }

    const days = Array.from(dayMap.values());
    return NextResponse.json({ success: true, days, source });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
