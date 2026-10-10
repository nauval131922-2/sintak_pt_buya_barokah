import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/api-guard';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/penonaktifan-master-barang/search?q=buku&limit=10
// Cari kode + nama di stok_master_barang untuk picker kode rutin.
export async function GET(req: Request) {
  const gate = await requireApiPermission('produksi_penonaktifan_master');
  if (gate.error) return gate.error;
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 10, 1), 20);
    if (q.length < 2) return NextResponse.json({ success: true, rows: [] });
    const pat = `%${q}%`;
    const res = await db.execute({
      sql: `SELECT kode, nama FROM stok_master_barang WHERE kode LIKE ? OR nama LIKE ? ORDER BY kode ASC LIMIT ?`,
      args: [pat, pat, limit],
    });
    const rows = (res.rows as Array<Record<string, unknown>>).map((r) => ({
      kode: String(r.kode ?? ''),
      nama: String(r.nama ?? ''),
    }));
    return NextResponse.json({ success: true, rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
