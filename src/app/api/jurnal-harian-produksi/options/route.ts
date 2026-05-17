import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Gunakan shared db — hindari buka koneksi baru setiap request
    // Query DISTINCT pada kolom yang sudah terindex (bagian, nama_karyawan)
    const [bagianResult, karyawanResult] = await db.batch([
      {
        sql: `SELECT DISTINCT bagian 
              FROM jurnal_harian_produksi 
              WHERE bagian IS NOT NULL AND bagian != ''
                AND deleted_at IS NULL
              ORDER BY bagian ASC 
              LIMIT 50`,
        args: []
      },
      {
        sql: `SELECT DISTINCT nama_karyawan, bagian 
              FROM jurnal_harian_produksi 
              WHERE nama_karyawan IS NOT NULL AND nama_karyawan != ''
                AND (nama_karyawan NOT LIKE '-%' AND bagian NOT LIKE '-%')
                AND deleted_at IS NULL
              ORDER BY nama_karyawan ASC 
              LIMIT 500`,
        args: []
      }
    ], 'read');

    const bagian = bagianResult.rows.map((r: any) => r.bagian as string);
    const karyawan = karyawanResult.rows.map((r: any) => ({ nama: r.nama_karyawan as string, bagian: r.bagian as string }));

    return NextResponse.json({ success: true, bagian, karyawan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
