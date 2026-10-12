import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/api-guard';
import { getSession } from '@/lib/session';
import { createReview, getReview, addReviewItems, decideReviewItem } from '@/lib/penonaktifan-review';

export const dynamic = 'force-dynamic';

// POST /api/penonaktifan-master-barang/review — buat link share (butuh login + permission).
// body: { cutoff, snapshot: [{kode,nama,kategori,alasan}] } -> { token }
export async function POST(req: NextRequest) {
  const gate = await requireApiPermission('produksi_penonaktifan_master');
  if (gate.error) return gate.error;
  try {
    const session = await getSession();
    const body = (await req.json()) as {
      cutoff?: string;
      snapshot?: Array<{ kode: string; nama: string; kategori: string; alasan: string }>;
    };
    const cutoff = String(body.cutoff ?? '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoff)) {
      return NextResponse.json({ success: false, error: 'cutoff harus yyyy-mm-dd' }, { status: 400 });
    }
    const snapshot = Array.isArray(body.snapshot) ? body.snapshot.slice(0, 5000) : [];
    const token = await createReview(cutoff, String(session?.username ?? session?.userId ?? ''), snapshot);
    return NextResponse.json({ success: true, token });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// GET /api/penonaktifan-master-barang/review?token=xxx — publik via token (pengecek TANPA login).
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') ?? '';
    const rev = await getReview(token);
    if (!rev) return NextResponse.json({ success: false, error: 'Link tidak valid' }, { status: 404 });
    return NextResponse.json({ success: true, review: rev });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// PUT /api/penonaktifan-master-barang/review — submit usulan koreksi (publik via token).
// body: { token, reviewer, items: [{kode,nama,aksi,alasan}] }
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      token?: string;
      reviewer?: string;
      items?: Array<{ kode: string; nama: string; aksi: 'usul_hapus' | 'usul_tambah'; alasan: string }>;
    };
    const rev = await getReview(String(body.token ?? ''));
    if (!rev) return NextResponse.json({ success: false, error: 'Link tidak valid' }, { status: 404 });
    if (rev.status !== 'open') return NextResponse.json({ success: false, error: 'Review sudah ditutup' }, { status: 400 });
    const n = await addReviewItems(rev.id, String(body.reviewer ?? 'pengecek'), Array.isArray(body.items) ? body.items : []);
    return NextResponse.json({ success: true, saved: n });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// PATCH /api/penonaktifan-master-barang/review — putuskan per item (butuh login + permission).
// body: { id, keputusan: 'setuju'|'tolak' }
export async function PATCH(req: NextRequest) {
  const gate = await requireApiPermission('produksi_penonaktifan_master');
  if (gate.error) return gate.error;
  try {
    const body = (await req.json()) as { id?: number; keputusan?: string };
    if (!Number.isFinite(Number(body.id))) return NextResponse.json({ success: false, error: 'id tidak valid' }, { status: 400 });
    if (body.keputusan !== 'setuju' && body.keputusan !== 'tolak') {
      return NextResponse.json({ success: false, error: 'keputusan harus setuju/tolak' }, { status: 400 });
    }
    await decideReviewItem(Number(body.id), body.keputusan);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
