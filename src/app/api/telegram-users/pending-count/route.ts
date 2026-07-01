import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.execute({
      sql: `SELECT COUNT(*) as count 
            FROM telegram_users 
            WHERE is_active = 0`,
      args: []
    });

    const count = (result.rows[0] as any)?.count || 0;

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error('[API] /api/telegram-users/pending-count error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
