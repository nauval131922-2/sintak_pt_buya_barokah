import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

const cleanNumberOrText = (val: any) => {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val).trim();
  if (/^[0-9]+(\.[0-9]+)*$/.test(str)) {
    return Number(str.replace(/\./g, ''));
  }
  return str;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const noOrder = searchParams.get('noOrder');

    if (!noOrder) {
      return NextResponse.json({ success: true, data: [] });
    }

    const whereParts: string[] = [];
    const args: any[] = [];

    whereParts.push('(no_order = ? OR no_order_2 = ? OR nama_order = ? OR nama_order_2 = ?)');
    args.push(noOrder, noOrder, noOrder, noOrder);

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      whereParts.push('tgl BETWEEN ? AND ?');
      args.push(startDate, endDate);
    }

    const bagian = searchParams.get('bagian');
    if (bagian) {
      whereParts.push('bagian = ?');
      args.push(bagian);
    }

    const namaKaryawan = searchParams.get('namaKaryawan');
    if (namaKaryawan) {
      whereParts.push('nama_karyawan = ?');
      args.push(namaKaryawan);
    }

    const belumRealisasi = searchParams.get('belumRealisasi');
    if (belumRealisasi === 'true') {
      whereParts.push('((realisasi IS NULL OR realisasi = 0 OR realisasi = \'\') AND (no_order_2 IS NULL OR no_order_2 = \'\') AND (jenis_pekerjaan_2 IS NULL OR jenis_pekerjaan_2 = \'\'))');
    }

    whereParts.push('deleted_at IS NULL');
    whereParts.push('jenis_pekerjaan IS NOT NULL');
    whereParts.push('jenis_pekerjaan != ?');
    args.push('');

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const sql = `SELECT DISTINCT jenis_pekerjaan FROM jurnal_harian_produksi ${whereClause} ORDER BY jenis_pekerjaan ASC`;
    const result = await db.execute({ sql, args });
    const data = (result.rows as any[]).map((r: any) => r.jenis_pekerjaan).filter(Boolean);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}