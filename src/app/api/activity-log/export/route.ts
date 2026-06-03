import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { logActivity } from '@/lib/activity';
import {
  buildActivityLogWhere,
  buildActivityLogOrderBy,
  getActivityLogTable,
  type ActivityLogSortField,
} from '@/lib/activity-log-query';

import { canViewActivityLog } from '@/lib/activity-log-permissions';

function escapeCsv(val: unknown): string {
  const s = String(val ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
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
    const params = {
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      search: (searchParams.get('search') || '').trim() || undefined,
      tableName: searchParams.get('table') || searchParams.get('tableName') || undefined,
      actionType: searchParams.get('action') || searchParams.get('actionType') || undefined,
      recordedBy: searchParams.get('user') || searchParams.get('recordedBy') || undefined,
      source: source as 'active' | 'archive',
      // Skip raw_data in search unless export explicitly requests it
      opts: { skipRawDataSearch: searchParams.get('includeRawData') !== '1' },
    };
    const includeRawData = searchParams.get('includeRawData') === '1';
    const { whereClause, args } = buildActivityLogWhere(params);
    const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get('limit') || '5000', 10)));
    const sortByParam = searchParams.get('sortBy');
    const allowed: ActivityLogSortField[] = ['created_at', 'action_type', 'table_name', 'recorded_by'];
    const sortBy = sortByParam && allowed.includes(sortByParam as ActivityLogSortField)
      ? (sortByParam as ActivityLogSortField)
      : 'created_at';
    const sortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';
    const orderBy = buildActivityLogOrderBy(sortBy, sortDir);

    const baseCols = [
      'id', 'created_at', 'action_type', 'table_name', 'record_id',
      'message', 'recorded_by', 'recorded_by_name',
    ];
    const archiveCols = source === 'archive' ? ['archived_at'] : [];
    const rawCol = includeRawData ? ['raw_data'] : [];
    const headers = [...baseCols, ...archiveCols, ...rawCol];

    const selectCols = [
      'al.id', 'al.created_at', 'al.action_type', 'al.table_name', 'al.record_id',
      'al.message', 'al.recorded_by', 'u.name AS recorded_by_name',
      ...(source === 'archive' ? ['al.archived_at'] : []),
      ...(includeRawData ? ['al.raw_data'] : []),
    ].join(', ');

    const result = await db.execute({
      sql: `
        SELECT ${selectCols}
        FROM ${table} al
        LEFT JOIN users u ON al.recorded_by = u.username
        ${whereClause}
        ${orderBy}
        LIMIT ?
      `,
      args: [...args, limit],
    });

    const lines = [headers.join(',')];
    for (const row of result.rows) {
      lines.push(headers.map((h) => escapeCsv((row as Record<string, unknown>)[h])).join(','));
    }

    const csv = lines.join('\n');
    const filename = `log-aktivitas-${source}-${params.from || 'all'}_${params.to || 'all'}.csv`;

    logActivity('EXPORT', 'activity_logs', `Export ${result.rows.length} baris aktivitas ke CSV (${filename})`).catch(() => {});

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
