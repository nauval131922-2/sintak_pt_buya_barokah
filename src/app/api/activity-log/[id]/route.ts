import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { getActivityLogTable } from '@/lib/activity-log-query';
import { canViewActivityLog } from '@/lib/activity-log-permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    const result = await db.execute({
      sql: `SELECT raw_data FROM ${table} WHERE id = ? LIMIT 1`,
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      raw_data: result.rows[0].raw_data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
