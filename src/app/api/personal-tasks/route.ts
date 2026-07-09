import { NextRequest, NextResponse } from 'next/server';
import db from '../../../lib/db';
import { getSession } from '../../../lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mengambil semua task. Bisa juga difilter berdasarkan session.username jika ingin private,
    // tapi karena ini SINTAK ERP internal, kita biarkan admin melihat semuanya.
    const result = await db.execute({
      sql: 'SELECT * FROM personal_tasks ORDER BY status DESC, id DESC',
      args: [],
    });

    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task } = await req.json();
    if (!task || !task.trim()) {
      return NextResponse.json({ error: 'Task text is required' }, { status: 400 });
    }

    const result = await db.execute({
      sql: 'INSERT INTO personal_tasks (task, sender, source, status) VALUES (?, ?, ?, ?)',
      args: [task.trim(), session.username, 'web', 'pending'],
    });

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Task created successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, task, status } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    if (status) {
      const completedAt = status === 'completed' ? new Date().toISOString() : null;
      await db.execute({
        sql: 'UPDATE personal_tasks SET status = ?, completed_at = ? WHERE id = ?',
        args: [status, completedAt, id],
      });
    } else if (task && task.trim()) {
      await db.execute({
        sql: 'UPDATE personal_tasks SET task = ? WHERE id = ?',
        args: [task.trim(), id],
      });
    } else {
      return NextResponse.json({ error: 'Missing status or task parameter' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Task updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await db.execute({
      sql: 'DELETE FROM personal_tasks WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
