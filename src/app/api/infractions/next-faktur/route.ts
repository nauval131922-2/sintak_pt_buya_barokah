import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireApiPermission } from "@/lib/api-guard";

export async function GET(req: NextRequest) {
  // Guard: samakan dengan halaman (permission catat_kesalahan)
  const gate = await requireApiPermission('catat_kesalahan');
  if (gate.error) return gate.error;
  try {
    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get('date');

    if (!dateQuery) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const dateObj = new Date(dateQuery);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).substring(2);
    const datePrefix = `${dd}${mm}${yy}`;

    const result = await db.execute({
      sql: `SELECT last_seq FROM faktur_sequences WHERE prefix = ?`,
      args: [datePrefix]
    });
    const countRow = result.rows[0] as any;

    const seq = String((countRow?.last_seq ?? 0) + 1).padStart(3, '0');
    const nextFaktur = `ERR-${datePrefix}-${seq}`;

    return NextResponse.json({ nextFaktur });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
