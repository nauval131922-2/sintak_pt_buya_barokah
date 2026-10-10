import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/api-guard';
import { generateUsulan } from '@/lib/penonaktifan-engine';

export const dynamic = 'force-dynamic';

function todayIso(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  const y = wib.getFullYear();
  const m = String(wib.getMonth() + 1).padStart(2, '0');
  const d = String(wib.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// GET /api/penonaktifan-master-barang?cutoff=yyyy-mm-dd&limit=50&includeDitolak=1
// JSON preview usulan (tanpa menonaktifkan apa pun).
export async function GET(req: NextRequest) {
  const gate = await requireApiPermission('produksi_penonaktifan_master');
  if (gate.error) return gate.error;
  try {
    const { searchParams } = new URL(req.url);
    const cutoff = searchParams.get('cutoff') || todayIso();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoff)) {
      return NextResponse.json({ success: false, error: 'cutoff harus yyyy-mm-dd' }, { status: 400 });
    }
    const limitRaw = Number(searchParams.get('limit') || '');
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 5000) : undefined;
    const result = await generateUsulan(cutoff, limit);
    const includeDitolak = searchParams.get('includeDitolak') === '1';
    return NextResponse.json({
      success: true,
      ...result,
      ditolak: includeDitolak ? result.ditolak : undefined,
      ditolakCount: result.ditolakCount,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
