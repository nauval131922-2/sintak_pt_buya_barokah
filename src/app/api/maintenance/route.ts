import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyBearerToken } from '@/lib/crypto-compare';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    // Keamanan via Bearer token — fail-closed + timing-safe compare
    if (!verifyBearerToken(request.headers.get('authorization'), process.env.CRON_SECRET)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const start = Date.now();

    // Jalankan perintah VACUUM untuk mendefrag file SQLite
    // SQL ini merestrukturisasi database, membuang cell kosong dari DELETE/UPDATE (Scraper massal)
    await db.execute('VACUUM');

    // Kosongkan log lama (opsional: simpan hanya 30 hari terakhir)
    await db.execute(`
      DELETE FROM activity_logs 
      WHERE created_at < datetime('now', '-30 days')
    `);

    // Catat log maintenance
    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, changed_data, user_id, message) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['MAINTENANCE', 'system', '0', null, 0, 'Sistem menjalankan DB VACUUM & Pembersihan Log otomatis.']
    });

    // Rapatkan WAL setelah VACUUM + prune agar file -wal tidak menumpuk (pernah 65 MB).
    // TRUNCATE hanya jalan bila tak ada pembaca aktif; best-effort, jangan gagalkan maintenance.
    try {
      await db.execute('PRAGMA wal_checkpoint(TRUNCATE)');
    } catch (err) {
      console.warn('[MAINTENANCE] WAL checkpoint dilewati:', err);
    }

    const durationMs = Date.now() - start;

    return NextResponse.json({ 
      success: true, 
      message: 'Database vacuumed and cleaned successfully.',
      durationMs 
    });

  } catch (error: any) {
    console.error('[MAINTENANCE] Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
