import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { logId } = await req.json();
    if (!logId) {
      return NextResponse.json({ error: 'Log ID required' }, { status: 400 });
    }

    // 1. Ambil data log aktivitas
    const logResult = await db.execute({
      sql: `SELECT id, action_type, table_name, record_id, raw_data FROM activity_logs WHERE id = ?`,
      args: [logId]
    });

    if (logResult.rows.length === 0) {
      return NextResponse.json({ error: 'Log tidak ditemukan' }, { status: 404 });
    }

    const log = logResult.rows[0] as any;
    if (log.action_type !== 'UPDATE') {
      return NextResponse.json({ error: 'Hanya log bertipe UPDATE yang dapat dibatalkan (undo).' }, { status: 400 });
    }

    if (String(log.message || '').startsWith('Undo Perubahan')) {
      return NextResponse.json({ error: 'Log bertipe Undo tidak dapat dibatalkan (undo) kembali.' }, { status: 400 });
    }

    // Cek apakah log ini sudah pernah di-undo sebelumnya
    const checkAlreadyUndo = await db.execute({
      sql: `SELECT id FROM activity_logs WHERE message = ? LIMIT 1`,
      args: [`Undo Perubahan (Log #${logId})`]
    });

    if (checkAlreadyUndo.rows.length > 0) {
      return NextResponse.json({ error: 'Perubahan ini sudah pernah dibatalkan (undo) sebelumnya.' }, { status: 400 });
    }

    let rawData: any = {};
    try {
      rawData = JSON.parse(log.raw_data || '{}');
    } catch {
      return NextResponse.json({ error: 'Payload log tidak valid' }, { status: 400 });
    }

    const beforeData = rawData.before;
    if (!beforeData || typeof beforeData !== 'object') {
      return NextResponse.json({ error: 'Data kondisi awal (before) tidak ditemukan di dalam log.' }, { status: 400 });
    }

    const table = log.table_name;
    const recordId = log.record_id;

    // Sanity check nama tabel untuk mencegah SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      return NextResponse.json({ error: 'Nama tabel tidak valid' }, { status: 400 });
    }

    // 2. Validasi kolom tabel target menggunakan PRAGMA table_info
    const colsResult = await db.execute(`PRAGMA table_info(${table})`);
    if (colsResult.rows.length === 0) {
      return NextResponse.json({ error: `Tabel ${table} tidak ditemukan` }, { status: 400 });
    }

    const validCols = new Set(colsResult.rows.map((c: any) => c.name));

    // 3. Bangun field update dari data "before"
    const updateFields: string[] = [];
    const updateArgs: any[] = [];

    for (const [key, val] of Object.entries(beforeData)) {
      if (key === 'id' || !validCols.has(key)) continue;
      updateFields.push(`${key} = ?`);
      // Kembalikan ke format stringified jika field aslinya bertipe object/array (seperti json)
      updateArgs.push(typeof val === 'object' && val !== null ? JSON.stringify(val) : val);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data kolom yang dapat dikembalikan' }, { status: 400 });
    }

    // Set context bypass agar trigger DB tidak mencatat log dobel/berulang
    await db.execute({
      sql: `INSERT OR REPLACE INTO session_context (id, username, last_menu) VALUES (1, ?, 'BYPASS_TRIGGER')`,
      args: [session.username || 'System']
    });

    try {
      // 4. Lakukan update/revert ke tabel target
      const updateResult = await db.execute({
        sql: `UPDATE ${table} SET ${updateFields.join(', ')} WHERE id = ?`,
        args: [...updateArgs, recordId]
      });

      if (updateResult.rowsAffected === 0) {
        return NextResponse.json({ error: 'Gagal mengembalikan data. Baris tersebut mungkin sudah dihapus.' }, { status: 404 });
      }

      // Hapus baris tambahan yang dibuat jika ini adalah aksi Multi Realisasi
      const additionalIds = rawData.after?.additional_ids;
      if (Array.isArray(additionalIds) && additionalIds.length > 0) {
        const placeholders = additionalIds.map(() => '?').join(',');
        await db.execute({
          sql: `DELETE FROM ${table} WHERE id IN (${placeholders})`,
          args: additionalIds
        });
      }

      // 5. Ambil data kondisi sesudah untuk dicatat di log pembalikan
      const afterResult = await db.execute({
        sql: `SELECT * FROM ${table} WHERE id = ?`,
        args: [recordId]
      });
      const afterRow = afterResult.rows[0];

      // 6. Catat log pembalikan manual
      await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          'UPDATE',
          table,
          recordId,
          `Undo Perubahan (Log #${logId})`,
          JSON.stringify({
            before: rawData.after || {}, // Sebelum undo adalah kondisi 'after' di log lama
            after: afterRow || {}
          }),
          session.username || 'System'
        ]
      });

    } finally {
      // Kembalikan session_context ke normal
      await db.execute({
        sql: `INSERT OR REPLACE INTO session_context (id, username, last_menu) VALUES (1, ?, 'Log Aktivitas')`,
        args: [session.username || 'System']
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
