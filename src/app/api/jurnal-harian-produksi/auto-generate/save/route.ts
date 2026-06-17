import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, rows, sourceDate, append } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Parameter date wajib (YYYY-MM-DD)' }, { status: 400 });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Tidak ada baris untuk disimpan' }, { status: 400 });
    }

    // Cegah duplikasi: cek apakah sudah ada data untuk tanggal tsb
    const existing = await db.execute({
      sql: `SELECT COUNT(*) as c FROM jurnal_harian_produksi WHERE tgl = ? AND deleted_at IS NULL`,
      args: [date]
    });
    const existingCount = Number((existing.rows[0] as any).c);

    if (existingCount > 0 && !append) {
      return NextResponse.json({
        error: `Tanggal ${date} sudah memiliki ${existingCount} baris jadwal.`,
        code: 'EXISTS',
        count: existingCount,
      }, { status: 409 });
    }

    const COLUMNS = [
      'posisi', 'absensi', 'tgl', 'shift', 'nama_karyawan', 'no_order', 'nama_order',
      'jenis_pekerjaan', 'keterangan', 'target', 'realisasi',
      'no_order_2', 'nama_order_2', 'jenis_pekerjaan_2', 'bahan_kertas',
      'jml_plate', 'warna', 'inscheet', 'rijek',
    ];
    const markers = `(${COLUMNS.map(() => '?').join(', ')})`;

    const rowValues: any[] = [];
    for (const row of rows) {
      rowValues.push(
        row.posisi ?? 0,
        row.absensi ?? 0,
        date,
        row.shift ?? '',
        row.nama_karyawan ?? '',
        row.no_order ?? '',
        row.nama_order ?? '',
        row.jenis_pekerjaan ?? '',
        row.keterangan ?? '',
        row.target ?? null,
        0,
        '', '', '', '',
        0, '', 0, 0,
      );
    }

    const FB_COLUMNS = [
      'sesi_generate', 'tgl_target', 'nama_karyawan', 'bagian',
      'shift_generated', 'shift_corrected',
      'bagian_generated', 'bagian_corrected',
      'jenis_pekerjaan_generated', 'jenis_pekerjaan_corrected',
      'no_order_generated', 'no_order_corrected',
      'target_generated', 'target_corrected',
      'keterangan_generated', 'keterangan_corrected',
      'dikoreksi_oleh',
    ];
    const fbMarkers = `(${FB_COLUMNS.map(() => '?').join(', ')})`;

    const sesiGenerate = `${session.username || 'System'}_${date}_${Date.now()}`;
    const fbValues: any[] = [];

    for (const row of rows) {
      fbValues.push(
        sesiGenerate,
        date,
        row.nama_karyawan ?? '',
        row.bagian ?? '',
        row.shift ?? '',
        null,
        row.bagian ?? '',
        null,
        row.jenis_pekerjaan ?? '',
        null,
        row.no_order ?? '',
        null,
        row.target ?? null,
        null,
        row.keterangan ?? '',
        null,
        session.username || 'System',
      );
    }

    const rowChunks: any[][] = [];
    const fbChunks: any[][] = [];
    const chunkSize = 50;

    for (let i = 0; i < rowValues.length; i += chunkSize * COLUMNS.length) {
      const end = Math.min(i + chunkSize * COLUMNS.length, rowValues.length);
      rowChunks.push(rowValues.slice(i, end));
    }
    for (let i = 0; i < fbValues.length; i += chunkSize * FB_COLUMNS.length) {
      const end = Math.min(i + chunkSize * FB_COLUMNS.length, fbValues.length);
      fbChunks.push(fbValues.slice(i, end));
    }

    const stmts: { sql: string; args: any[] }[] = [];

    for (const chunk of rowChunks) {
      const rowCount = chunk.length / COLUMNS.length;
      const allMarkers = Array.from({ length: rowCount }, () => markers).join(', ');
      stmts.push({
        sql: `INSERT INTO jurnal_harian_produksi (${COLUMNS.join(', ')}) VALUES ${allMarkers}`,
        args: chunk,
      });
    }

    for (const chunk of fbChunks) {
      const rowCount = chunk.length / FB_COLUMNS.length;
      const allMarkers = Array.from({ length: rowCount }, () => fbMarkers).join(', ');
      stmts.push({
        sql: `INSERT INTO generate_feedback (${FB_COLUMNS.join(', ')}) VALUES ${allMarkers}`,
        args: chunk,
      });
    }

    stmts.push({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        'AUTO_GENERATE',
        'jurnal_harian_produksi',
        0,
        `Generate jadwal otomatis dari ${sourceDate || '?'} ke ${date} (${rows.length} baris)`,
        JSON.stringify({ date, sourceDate, count: rows.length, sesiGenerate }),
        session.username || 'System',
      ],
    });

    await db.batch(stmts, 'write');

    return NextResponse.json({
      success: true,
      count: rows.length,
      sesiGenerate,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
