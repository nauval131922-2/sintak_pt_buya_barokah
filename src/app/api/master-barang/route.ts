import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('q') || '';
    
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];
    
    if (search) {
      whereClause = `WHERE kode LIKE ? OR nama LIKE ? OR kd_golongan LIKE ?`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const [dataResult, countResult, settingsResult] = await Promise.all([
      db.execute({
        sql: `SELECT id, kode, barcode, nama, kd_satuan, spesifikasi, berat_kg, kd_golongan, kd_kelompok, tampil, prd_std, saldo, qty_order, hj_ppn, ppn, status, pj_hide, royalti, username, create_at, updated_at FROM stok_master_barang ${whereClause} ORDER BY kode ASC LIMIT ? OFFSET ?`,
        args: [...params, limit, offset]
      }),
      db.execute({
        sql: `SELECT COUNT(*) as total FROM stok_master_barang ${whereClause}`,
        args: params
      }),
      db.execute("SELECT value FROM system_settings WHERE key = 'last_scrape_master_barang'")
    ]);

    const total = (countResult.rows[0] as any)?.total || 0;
    const lastUpdated = (settingsResult.rows[0] as any)?.value || null;

    return NextResponse.json({
      success: true,
      data: dataResult.rows,
      total,
      lastUpdated,
      page,
      limit
    });

  } catch (error: any) {
    console.error("API Error (master-barang):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
