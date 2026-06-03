import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.execute({
      sql: `
        SELECT al.*, u.name AS recorded_by_name
        FROM activity_logs al
        LEFT JOIN users u ON al.recorded_by = u.username
        ORDER BY al.created_at DESC
        LIMIT 8
      `,
      args: [],
    });

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
