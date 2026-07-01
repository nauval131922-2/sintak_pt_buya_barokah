import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// Debug endpoint untuk cek subscriptions
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.execute({
      sql: `SELECT id, user_id, created_at FROM push_subscriptions WHERE user_id = ?`,
      args: [session.userId]
    });

    return NextResponse.json({ 
      success: true, 
      subscribed: result.rows.length > 0
    });
  } catch (error: any) {
    console.error('[API] /api/push/check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
