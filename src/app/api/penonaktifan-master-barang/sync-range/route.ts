import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/api-guard';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

function addDaysIso(iso: string, n: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n, 12, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// GET /api/penonaktifan-master-barang/sync-range?cutoff=YYYY-MM-DD&forceFull=1
// Menentukan rentang tanggal sinkronisasi: inkremental (30 hari terakhir) vs penuh (sejak awal tahun).
export async function GET(req: NextRequest) {
  const gate = await requireApiPermission('produksi_penonaktifan_master');
  if (gate.error) return gate.error;

  try {
    const { searchParams } = new URL(req.url);
    const cutoff = searchParams.get('cutoff') || new Date().toISOString().slice(0, 10);
    const forceFull = searchParams.get('forceFull') === '1';
    const year = cutoff.slice(0, 4);
    const yearStart = `${year}-01-01`;
    const endDate = addDaysIso(cutoff, 7);

    if (forceFull) {
      return NextResponse.json({
        success: true,
        mode: 'full',
        startDate: yearStart,
        endDate,
        historyFound: true,
        message: 'Sync penuh dipaksa sejak awal tahun.',
      });
    }

    // Cek apakah database lokal sudah memiliki data histori tahun berjalan
    const check = await db.execute({
      sql: `
        SELECT
          EXISTS(SELECT 1 FROM bill_of_materials WHERE tgl LIKE ? LIMIT 1) AS has_bom,
          EXISTS(SELECT 1 FROM usr_log WHERE tgl >= ? LIMIT 1) AS has_log,
          EXISTS(SELECT 1 FROM orders WHERE tgl LIKE ? LIMIT 1) AS has_orders
      `,
      args: [`%${year}`, `${year}-01-01`, `%${year}`],
    });

    const row = (check.rows[0] as Record<string, unknown>) || {};
    const hasHistory = Number(row.has_bom) === 1 && Number(row.has_log) === 1 && Number(row.has_orders) === 1;

    if (hasHistory) {
      // Inkremental: 30 hari ke belakang dari cutoff
      const startCandidate = addDaysIso(cutoff, -30);
      const startDate = startCandidate < yearStart ? yearStart : startCandidate;
      return NextResponse.json({
        success: true,
        mode: 'incremental',
        startDate,
        endDate,
        historyFound: true,
        message: 'Data histori lokal tersedia. Menggunakan mode inkremental (30 hari terakhir).',
      });
    }

    return NextResponse.json({
      success: true,
      mode: 'full',
      startDate: yearStart,
      endDate,
      historyFound: false,
      message: 'Data tahun ini belum lengkap di database lokal. Menggunakan sync penuh sejak awal tahun.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
