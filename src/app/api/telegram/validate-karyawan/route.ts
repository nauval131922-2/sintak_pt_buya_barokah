import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== process.env.SCRAPER_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nama = req.nextUrl.searchParams.get('nama');
    if (!nama) {
      return NextResponse.json({ error: 'Parameter "nama" wajib diisi' }, { status: 400 });
    }

    // Query tabel employees
    const result = await db.execute({
      sql: `SELECT name, position, department, employee_no 
            FROM employees 
            WHERE name = ? AND is_active = 1
            LIMIT 1`,
      args: [nama]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        valid: false,
        message: 'Nama karyawan tidak ditemukan atau tidak aktif'
      });
    }

    const employee = result.rows[0] as any;

    return NextResponse.json({
      valid: true,
      nama_karyawan: employee.name,
      posisi: employee.position,
      absensi: employee.employee_no,
      department: employee.department
    });

  } catch (error: any) {
    console.error('[API] validate-karyawan error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
