import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Gunakan shared db — hindari buka koneksi baru setiap request
    // Query DISTINCT pada kolom yang sudah terindex (bagian, nama_karyawan)
    const [bagianResult, karyawanResult, yearsResult] = await db.batch([
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
      },
      {
        sql: `SELECT MIN(tgl) as min_tgl, MAX(tgl) as max_tgl 
              FROM jurnal_harian_produksi 
              WHERE tgl >= '2020-01-01'`,
        args: []
      }
    ], 'read');

    const bagian = bagianResult.rows.map((r) => (r as Record<string, unknown>).bagian as string);
    const karyawan = karyawanResult.rows.map((r) => {
      const row = r as Record<string, unknown>;
      return { nama: row.nama_karyawan as string, bagian: row.bagian as string };
    });
    
    const minTgl = yearsResult.rows[0]?.min_tgl as string | null;
    const maxTgl = yearsResult.rows[0]?.max_tgl as string | null;
    const minYear = minTgl ? parseInt(minTgl.substring(0, 4)) : 2022;
    const maxYear = maxTgl ? parseInt(maxTgl.substring(0, 4)) : new Date().getFullYear();
    const years: string[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      if (y >= 2020 && y <= 2035) {
        years.push(String(y));
      }
    }

    return NextResponse.json({ success: true, bagian, karyawan, years });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
