import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// Subscribe to push notifications
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await req.json();
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Store subscription in database
    await db.execute({
      sql: `INSERT OR REPLACE INTO push_subscriptions (user_id, subscription, created_at)
            VALUES (?, ?, datetime('now'))`,
      args: [session.userId, JSON.stringify(subscription)]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] /api/push/subscribe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Unsubscribe from push notifications
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.execute({
      sql: `DELETE FROM push_subscriptions WHERE user_id = ?`,
      args: [session.userId]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] /api/push/unsubscribe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
