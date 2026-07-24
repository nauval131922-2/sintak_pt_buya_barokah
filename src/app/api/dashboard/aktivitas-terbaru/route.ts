import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { cacheGet, cacheSet } from '@/lib/server-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ck = 'dashboard:aktivitas-terbaru';
    const cached = cacheGet<unknown[]>(ck);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const result = await db.execute({
      sql: `
        SELECT al.id, al.created_at, al.action_type, al.table_name, al.record_id,
               al.message, al.recorded_by, u.name AS recorded_by_name
        FROM activity_logs al
        LEFT JOIN users u ON al.recorded_by = u.username
        ORDER BY al.created_at DESC
        LIMIT 8
      `,
      args: [],
    });

    cacheSet(ck, result.rows, 30_000);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
