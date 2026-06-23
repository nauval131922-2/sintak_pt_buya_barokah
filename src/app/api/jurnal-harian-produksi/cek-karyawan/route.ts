import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/jurnal-harian-produksi/cek-karyawan?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD[&bagian=X]
 *
 * Mengembalikan:
 *  - belum: karyawan aktif yang tidak punya entri jurnal dalam rentang
 *  - sudah: satu baris per entri jurnal per karyawan (tgl, no_order, jenis_pekerjaan, target, realisasi)
 *
 * ponytail: dua query terpisah — kebutuhan kolomnya berbeda, lebih bersih dari UNION.
 * ceiling: full-scan employees (biasanya < 200 baris) + indexed scan jurnal via idx_jurnal_tgl_deleted.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const startDate = sp.get('startDate');
  const endDate   = sp.get('endDate');
  const bagian    = sp.get('bagian') || '';

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate dan endDate wajib diisi' }, { status: 400 });
  }

  try {
    const bagianClause = bagian ? `AND UPPER(e.department) = UPPER(?)` : '';

    // Query 1 — karyawan yang BELUM dapat pekerjaan
    // args: [bagian?, startDate, endDate] — bagian untuk clause WHERE, startDate/endDate untuk NOT EXISTS
    const sqlBelum = `
      SELECT e.id, e.name, e.position
      FROM employees e
      WHERE e.is_active = 1
        ${bagianClause}
        AND NOT EXISTS (
          SELECT 1 FROM jurnal_harian_produksi j
          WHERE j.nama_karyawan = e.name
            AND j.tgl BETWEEN ? AND ?
            AND j.deleted_at IS NULL
        )
      ORDER BY e.id ASC
    `;
    const belumArgs: string[] = bagian
      ? [bagian, startDate, endDate]
      : [startDate, endDate];

    // Query 2 — satu baris per entri jurnal untuk karyawan SUDAH dapat pekerjaan
    // args: [startDate, endDate, bagian?]
    const sqlSudah = `
      SELECT
        e.id              AS employee_id,
        e.name,
        e.position,
        j.id              AS jurnal_id,
        j.tgl,
        j.no_order,
        j.nama_order,
        j.jenis_pekerjaan,
        j.target,
        j.realisasi
      FROM employees e
      INNER JOIN jurnal_harian_produksi j
        ON j.nama_karyawan = e.name
        AND j.tgl BETWEEN ? AND ?
        AND j.deleted_at IS NULL
      WHERE e.is_active = 1
        ${bagianClause}
      ORDER BY j.tgl ASC, e.id ASC, j.id ASC
    `;
    const sudahArgs: string[] = bagian
      ? [startDate, endDate, bagian]
      : [startDate, endDate];

    const [resBelum, resSudah] = await db.batch([
      { sql: sqlBelum, args: belumArgs },
      { sql: sqlSudah, args: sudahArgs },
    ], 'read');

    type BelumRow = { id: number; name: string; position: string };
    type SudahRow = {
      employee_id: number; name: string; position: string;
      jurnal_id: number; tgl: string; no_order: string; nama_order: string;
      jenis_pekerjaan: string; target: number | null; realisasi: number | null;
    };

    const belum = resBelum.rows as unknown as BelumRow[];
    const sudah = resSudah.rows as unknown as SudahRow[];
    const sudahKaryawanIds = new Set(sudah.map(r => r.employee_id));

    return NextResponse.json({
      success: true,
      startDate,
      endDate,
      totalKaryawan: belum.length + sudahKaryawanIds.size,
      belum,
      sudah,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
