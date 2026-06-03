import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (typeof body.is_active !== 'number' && typeof body.is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active harus berupa boolean atau number.' }, { status: 400 });
    }

    const isActive = body.is_active ? 1 : 0;

    const result = await db.execute({
      sql: 'UPDATE employees SET is_active = ? WHERE id = ?',
      args: [isActive, id]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan.' }, { status: 404 });
    }

    const session = await getSession();
    const currentUser = session?.username || 'System';

    const emp = await db.execute({
      sql: 'SELECT name, employee_no FROM employees WHERE id = ?',
      args: [id]
    });

    const empName = emp.rows[0] ? (emp.rows[0] as any).name || `ID ${id}` : `ID ${id}`;
    const statusLabel = isActive ? 'diaktifkan' : 'dinonaktifkan';

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        'UPDATE',
        'employees',
        Number(id),
        `${empName} ${statusLabel}`,
        JSON.stringify({ id: Number(id), is_active: isActive }),
        currentUser
      ]
    });

    return NextResponse.json({ success: true, is_active: isActive });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
