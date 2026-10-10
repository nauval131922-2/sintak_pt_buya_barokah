import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireApiPermission } from "@/lib/api-guard";

export const dynamic = 'force-dynamic';

// GET /api/saldo-barang?tgl=yyyy-mm-dd&q=&golongan=&page=1&limit=50
// Baca posisi saldo hasil scrape (tabel saldo_barang).
export async function GET(req: NextRequest) {
  const gate = await requireApiPermission('stok_saldo_barang');
  if (gate.error) return gate.error;
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200);
    const offset = (page - 1) * limit;
    const q = (searchParams.get('q') || '').trim();
    const tgl = (searchParams.get('tgl') || '').trim();
    const golongan = (searchParams.get('golongan') || '').trim();

    const where: string[] = [];
    const params: unknown[] = [];
    if (tgl) { where.push(`tgl = ?`); params.push(tgl); }
    if (golongan) { where.push(`kd_golongan = ?`); params.push(golongan); }
    if (q) {
      where.push(`(kode LIKE ? OR nama LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`);
    }
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const [dataRes, countRes, tglRes] = await Promise.all([
      db.execute({
        sql: `SELECT kode, tgl, nama, kd_satuan, saldo, kd_golongan, kd_kelompok, status, n_persd, n_hp
              FROM saldo_barang ${whereClause} ORDER BY kode ASC LIMIT ? OFFSET ?`,
        args: [...params, limit, offset],
      }),
      db.execute({ sql: `SELECT COUNT(*) as total FROM saldo_barang ${whereClause}`, args: params }),
      db.execute({ sql: `SELECT tgl, COUNT(*) as n FROM saldo_barang GROUP BY tgl ORDER BY tgl DESC LIMIT 10` }),
    ]);

    const rows = dataRes.rows as Record<string, unknown>[];
    const total = (countRes.rows[0] as Record<string, unknown> | undefined)?.total as number ?? 0;
    const available = (tglRes.rows ?? []) as Record<string, unknown>[];

    return NextResponse.json({ success: true, data: rows, total, page, limit, available });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
