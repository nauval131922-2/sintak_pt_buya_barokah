import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireApiPermission } from "@/lib/api-guard";

export const dynamic = 'force-dynamic';

const SORT_COLS: Record<string, string> = {
  kode: 'kode', nama: 'nama', kd_satuan: 'kd_satuan', saldo: 'saldo',
  n_persd: 'n_persd', status: 'status', kd_golongan: 'kd_golongan', kd_kelompok: 'kd_kelompok',
};

function getOrderBy(sortParam: string | null): string {
  let states: { id?: string; desc?: boolean }[] = [];
  try {
    const parsed: unknown = JSON.parse(sortParam || '[]');
    if (Array.isArray(parsed)) states = parsed as { id?: string; desc?: boolean }[];
  } catch { /* abaikan sort rusak */ }
  const mapped = states
    .filter((st) => st && st.id && SORT_COLS[st.id])
    .map((st) => `${SORT_COLS[st.id as string]} ${st.desc ? 'DESC' : 'ASC'}`);
  if (mapped.length === 0) return 'kode ASC';
  mapped.push('kode ASC');
  return mapped.join(', ');
}

// GET /api/saldo-barang?tgl=yyyy-mm-dd&q=&golongan=&status=&page=1&limit=50
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
    const status = (searchParams.get('status') || '').trim();
    const orderBy = getOrderBy(searchParams.get('sort'));

    const where: string[] = [];
    const params: unknown[] = [];
    if (tgl) { where.push(`tgl = ?`); params.push(tgl); }
    if (golongan) { where.push(`kd_golongan = ?`); params.push(golongan); }
    if (status) { where.push(`status = ?`); params.push(status); }
    if (q) {
      where.push(`(kode LIKE ? OR nama LIKE ? OR kd_golongan LIKE ? OR kd_kelompok LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const [dataRes, countRes, tglRes, lastRes, golRes, statRes] = await Promise.all([
      db.execute({
        sql: `SELECT kode, tgl, nama, kd_satuan, saldo, kd_golongan, kd_kelompok, status, n_persd, n_hp
              FROM saldo_barang ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
        args: [...params, limit, offset],
      }),
      db.execute({ sql: `SELECT COUNT(*) as total FROM saldo_barang ${whereClause}`, args: params }),
      db.execute({ sql: `SELECT tgl, COUNT(*) as n FROM saldo_barang GROUP BY tgl ORDER BY tgl DESC LIMIT 10` }),
      db.execute({ sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_saldo_barang'` }),
      db.execute({ sql: `SELECT DISTINCT kd_golongan FROM saldo_barang WHERE kd_golongan IS NOT NULL AND kd_golongan != '' ORDER BY kd_golongan` }),
      db.execute({ sql: `SELECT DISTINCT status FROM saldo_barang WHERE status IS NOT NULL AND status != '' ORDER BY status` }),
    ]);

    const rows = dataRes.rows as Record<string, unknown>[];
    const total = (countRes.rows[0] as Record<string, unknown> | undefined)?.total as number ?? 0;
    const available = (tglRes.rows ?? []) as Record<string, unknown>[];
    const lastUpdated = (lastRes.rows[0] as Record<string, unknown> | undefined)?.value ?? null;
    const golonganList = (golRes.rows as Record<string, unknown>[]).map((r) => String(r.kd_golongan ?? '')).filter(Boolean);
    const statusList = (statRes.rows as Record<string, unknown>[]).map((r) => String(r.status ?? '')).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: rows,
      total,
      page,
      limit,
      available,
      lastUpdated,
      golonganList,
      statusList,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
