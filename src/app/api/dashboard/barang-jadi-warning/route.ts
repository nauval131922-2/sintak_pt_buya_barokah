import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// Definisi warning: SO lebih rendah dari HPP (barang jadi atau rata-rata)
const WARNING_SQL = `(
  (harga_so_sales_order > 0 AND (harga_so_sales_order < hp OR harga_so_sales_order < hp_rata_rata))
  OR
  (harga_so_penjualan > 0 AND (harga_so_penjualan < hp OR harga_so_penjualan < hp_rata_rata))
)`;

// barang_jadi.tgl format: DD-MM-YYYY → konversi ke YYYY-MM-DD untuk perbandingan
const TGL_ISO = `substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2)`;

// Hitung peringatan dalam rentang tanggal tertentu
const buildCTE = (from: string, to: string) => `
  WITH base AS (
    SELECT
      bj.*,
      (SELECT SUM(hp_total)*1.0 / NULLIF(SUM(qty), 0)
       FROM barang_jadi bj2
       WHERE bj2.faktur_prd = bj.faktur_prd AND bj2.kd_barang = bj.kd_barang
      ) AS hp_rata_rata,
      (SELECT harga FROM sales_orders WHERE faktur = bj.faktur_so LIMIT 1) AS harga_so_sales_order,
      (SELECT harga FROM sales_reports WHERE faktur_so = bj.faktur_so LIMIT 1) AS harga_so_penjualan
    FROM barang_jadi bj
    WHERE (${TGL_ISO}) BETWEEN '${from}' AND '${to}'
  )
  SELECT COUNT(*) AS count FROM base WHERE ${WARNING_SQL}
`;

export async function GET() {
  try {
    const now = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
    );
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day   = String(now.getDate()).padStart(2, '0');

    const today      = `${year}-${month}-${day}`;
    const monthStart = `${year}-${month}-01`;
    const yearStart  = `${year}-01-01`;

    const results = await db.batch([
      { sql: buildCTE(today, today),           args: [] }, // hari ini saja
      { sql: buildCTE(monthStart, today),      args: [] }, // awal bulan s.d. hari ini
      { sql: buildCTE(yearStart, today),       args: [] }, // awal tahun s.d. hari ini
    ], 'read');

    return NextResponse.json({
      success: true,
      today:      Number((results[0].rows[0] as unknown as { count: number })?.count ?? 0),
      this_month: Number((results[1].rows[0] as unknown as { count: number })?.count ?? 0),
      this_year:  Number((results[2].rows[0] as unknown as { count: number })?.count ?? 0),
      generated_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('barang-jadi-warning API error:', error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
