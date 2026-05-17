import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [allRes, activeRes] = await db.batch([
      'SELECT COUNT(*) as count FROM employees',
      'SELECT COUNT(*) as count FROM employees WHERE is_active = 1',
    ], 'read');

    return NextResponse.json({
      all: Number(allRes.rows[0]?.count || 0),
      active: Number(activeRes.rows[0]?.count || 0),
    });
  } catch (err) {
    console.error('karyawan-count error:', err);
    return NextResponse.json({ all: 0, active: 0 }, { status: 500 });
  }
}
