import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 10_000; // 10 detik

export async function GET() {
  try {
    const cacheKey = 'jurnal-options';
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && now < cached.expiry) {
      return NextResponse.json(cached.data);
    }

    const [bagianResult, karyawanResult, yearsResult, totalResult, mappingResult] = await db.batch([
      {
        sql: `SELECT DISTINCT category
              FROM master_pekerjaan_jurnal_produksi
              WHERE category IS NOT NULL AND category != ''
              ORDER BY category ASC`,
        args: []
      },
      {
        sql: `SELECT name FROM employees
              WHERE is_active = 1 AND name IS NOT NULL AND name != ''
              ORDER BY name ASC`,
        args: []
      },
      {
        sql: `SELECT substr(tgl, 1, 4) as year, COUNT(*) as count
              FROM jurnal_harian_produksi
              WHERE tgl >= '2020-01-01' AND deleted_at IS NULL
              GROUP BY substr(tgl, 1, 4)
              ORDER BY year DESC`,
        args: []
      },
      {
        sql: `SELECT COUNT(*) as total_count
              FROM jurnal_harian_produksi
              WHERE deleted_at IS NULL`,
        args: []
      },
      {
        sql: `SELECT nama_karyawan, bagian FROM jurnal_harian_produksi
              WHERE deleted_at IS NULL AND nama_karyawan IS NOT NULL AND nama_karyawan != ''
                AND bagian IS NOT NULL AND bagian != ''
              GROUP BY nama_karyawan, bagian`,
        args: []
      }
    ], 'read');

    const bagian = bagianResult.rows.map((r) => ((r as Record<string, unknown>).category as string).toUpperCase());
    const karyawan = karyawanResult.rows.map((r) => (r as Record<string, unknown>).name as string);

    const yearsCount: Record<string, number> = {};
    const years: string[] = [];

    (yearsResult.rows as unknown as { year: string | null; count: number }[]).forEach((row) => {
      if (row.year) {
        const yVal = parseInt(row.year);
        if (yVal >= 2020 && yVal <= 2035) {
          years.push(row.year);
          yearsCount[row.year] = Number(row.count || 0);
        }
      }
    });

    const totalRows = totalResult.rows as unknown as { total_count: number }[];
    const totalCount = totalRows[0]?.total_count ? Number(totalRows[0].total_count) : 0;
    yearsCount['all'] = totalCount;

    const karyawanByBagian: Record<string, string[]> = {};
    for (const row of mappingResult.rows) {
      const r = row as Record<string, unknown>;
      const bag = r.bagian as string;
      const nama = r.nama_karyawan as string;
      if (!bag || !nama) continue;
      if (!karyawanByBagian[bag]) karyawanByBagian[bag] = [];
      karyawanByBagian[bag].push(nama);
    }

    const responseData = { success: true, bagian, karyawan, years, yearsCount, karyawanByBagian };
    cache.set(cacheKey, { data: responseData, expiry: now + CACHE_TTL });
    return NextResponse.json(responseData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
