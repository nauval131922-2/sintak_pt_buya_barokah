import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getReview } from '@/lib/penonaktifan-review';

export const dynamic = 'force-dynamic';

// GET /api/penonaktifan-master-barang/review/search?token=xxx&q=buku&limit=10
// Publik via token review (reviewer TANPA login). Token invalid -> 404.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = (searchParams.get('token') || '').trim();
    const rev = await getReview(token);
    if (!rev) return NextResponse.json({ success: false, error: 'Link tidak valid' }, { status: 404 });
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
