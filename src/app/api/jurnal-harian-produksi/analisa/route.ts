import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireApiPermission } from "@/lib/api-guard";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Guard: samakan dengan halaman (permission produksi_jhp_analisa)
  const gate = await requireApiPermission('produksi_jhp_analisa');
  if (gate.error) return gate.error;
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');
    const noOrder = searchParams.get('no_order');

    if (noOrder) {
      const result = await db.execute({
        sql: `SELECT id, tgl, shift, bagian,
          no_order, nama_order,
          jenis_pekerjaan as pekerjaan_target,
          no_order_2, nama_order_2,
          jenis_pekerjaan_2 as pekerjaan_realisasi,
          target, realisasi, nama_karyawan, keterangan, jam, kendala
        FROM jurnal_harian_produksi
        WHERE no_order = ? AND deleted_at IS NULL
        ORDER BY
          tgl ASC,
          CASE UPPER(bagian)
            WHEN 'SETTING' THEN 1 WHEN 'QUALITY CONTROL' THEN 2
            WHEN 'CETAK' THEN 3 WHEN 'FINISHING' THEN 4
            WHEN 'GUDANG' THEN 5 WHEN 'TEKNISI' THEN 6
            ELSE 7
          END ASC,
          id ASC`,
        args: [noOrder]
      });

      const orderInfo = await db.execute({
        sql: `SELECT 
                COALESCE(o.faktur, s.no_sopd, ?) as faktur,
                COALESCE(o.nama_prd, s.nama_order) as nama_prd,
                COALESCE(o.qty, s.qty_sopd) as qty,
                COALESCE(o.satuan, s.unit) as satuan,
                o.nama_pelanggan,
                COALESCE(o.tgl, s.tgl) as tgl_order,
                sh.deadline_date,
                sh.finished_date
              FROM (SELECT ? as req_no) r
              LEFT JOIN orders o ON o.faktur = r.req_no
              LEFT JOIN sopd s ON s.no_sopd = r.req_no
              LEFT JOIN sopd_harga sh ON sh.no_sopd = r.req_no`,
        args: [noOrder, noOrder]
      });

      return NextResponse.json({
        success: true,
        entries: result.rows,
        order: orderInfo.rows[0] || null
      });
    }

    if (q && q.length >= 2) {
      const searchStr = `%${q}%`;
      const result = await db.execute({
        sql: `SELECT jhp.no_order, jhp.nama_order,
          o.nama_prd, o.qty, o.satuan, o.nama_pelanggan, o.tgl as tgl_order
        FROM (
          SELECT no_order, nama_order
          FROM jurnal_harian_produksi
          WHERE (no_order LIKE ? OR nama_order LIKE ?) AND deleted_at IS NULL
          GROUP BY no_order
        ) jhp
        LEFT JOIN orders o ON o.faktur = jhp.no_order
        ORDER BY substr(o.tgl,7,4) DESC, substr(o.tgl,4,2) DESC, substr(o.tgl,1,2) DESC
        LIMIT 50`,
        args: [searchStr, searchStr]
      });

      return NextResponse.json({
        success: true,
        orders: result.rows
      });
    }

    const recent = searchParams.get('recent');
    if (recent === 'true') {
      const result = await db.execute({
        sql: `SELECT jhp.no_order, jhp.nama_order,
          o.nama_prd, o.qty, o.satuan, o.nama_pelanggan, o.tgl as tgl_order
        FROM (
          SELECT no_order, nama_order
          FROM jurnal_harian_produksi
          WHERE deleted_at IS NULL
          GROUP BY no_order
        ) jhp
        LEFT JOIN orders o ON o.faktur = jhp.no_order
        ORDER BY substr(o.tgl,7,4) DESC, substr(o.tgl,4,2) DESC, substr(o.tgl,1,2) DESC
        LIMIT 20`,
        args: []
      });

      return NextResponse.json({
        success: true,
        orders: result.rows
      });
    }

    return NextResponse.json({ success: true, orders: [], entries: [], order: null });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
