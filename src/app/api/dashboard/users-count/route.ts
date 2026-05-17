import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [totalRes, rolesRes] = await db.batch([
      'SELECT COUNT(*) as count FROM users',
      'SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC',
    ], 'read');

    const total = Number(totalRes.rows[0]?.count || 0);
    const roles = (rolesRes.rows as any[]).map((r) => ({
      role: String(r.role || 'Tanpa Role'),
      count: Number(r.count || 0),
    }));

    return NextResponse.json({ total, roles });
  } catch (err) {
    console.error('users-count error:', err);
    return NextResponse.json({ total: 0, roles: [] }, { status: 500 });
  }
}
