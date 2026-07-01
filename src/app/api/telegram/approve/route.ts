import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function sendTelegramMessage(chatId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    console.log('[TELEGRAM] BOT_TOKEN not set, skipping notification');
    return { ok: false, error: 'BOT_TOKEN not set' };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      const json = await res.json();
      if (json.ok) return { ok: true };
      console.error(`[TELEGRAM] Attempt ${attempt}:`, json.description || 'unknown');
      if (attempt === 1) await new Promise(r => setTimeout(r, 1000));
    } catch (error: any) {
      console.error(`[TELEGRAM] Attempt ${attempt} error:`, error.message);
      if (attempt === 1) await new Promise(r => setTimeout(r, 1000));
    }
  }
  return { ok: false, error: 'Gagal kirim notifikasi setelah 2 percobaan' };
}

export async function POST(req: NextRequest) {
  try {
    // Auth check - harus login sebagai admin
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cek role - hanya Super Admin yang bisa approve
    if (session.role !== 'Super Admin') {
      return NextResponse.json({ 
        error: 'Hanya Super Admin yang dapat menyetujui registrasi bot' 
      }, { status: 403 });
    }

    const body = await req.json();
    const { telegram_user_id, action } = body;

    if (!telegram_user_id || !action) {
      return NextResponse.json({ 
        error: 'Field wajib: telegram_user_id, action (approve/reject)' 
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'Action harus "approve" atau "reject"' 
      }, { status: 400 });
    }

    // Ambil data user
    const userCheck = await db.execute({
      sql: `SELECT id, telegram_id, telegram_username, nama_karyawan, bagian, is_active
            FROM telegram_users
            WHERE id = ?
            LIMIT 1`,
      args: [telegram_user_id]
    });

    if (userCheck.rows.length === 0) {
      return NextResponse.json({ 
        error: 'User tidak ditemukan' 
      }, { status: 404 });
    }

    const user = userCheck.rows[0] as any;

    if (action === 'approve') {
      // Approve: set is_active = 1
      await db.execute({
        sql: `UPDATE telegram_users 
              SET is_active = 1, approved_at = CURRENT_TIMESTAMP, approved_by = ?
              WHERE id = ?`,
        args: [session.username, telegram_user_id]
      });

      // Log activity
      await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          'UPDATE',
          'telegram_users',
          telegram_user_id,
          `Approve registrasi Telegram Bot: ${user.nama_karyawan} (@${user.telegram_username || user.telegram_id})`,
          JSON.stringify({ telegram_id: user.telegram_id, nama_karyawan: user.nama_karyawan, bagian: user.bagian }),
          session.username
        ]
      });

      // Send notification to user
      const notif = await sendTelegramMessage(
        String(user.telegram_id),
        `✅ Registrasi Anda telah disetujui!\n\n` +
        `👤 Nama: ${user.nama_karyawan}\n` +
        `🏭 Bagian: ${user.bagian}\n\n` +
        `/input - Input realisasi baru (standalone)\n` +
        `/input_realisasi_by_target - Isi realisasi ke target yang sudah ada\n\n` +
        `Gunakan /help untuk bantuan lengkap.`
      );

      return NextResponse.json({
        success: true,
        action: 'approved',
        message: `User ${user.nama_karyawan} telah disetujui`,
        telegram_id: user.telegram_id,
        notification_sent: notif.ok,
        notification_error: notif.error
      });

    } else {
      // Reject: delete record
      await db.execute({
        sql: `DELETE FROM telegram_users WHERE id = ?`,
        args: [telegram_user_id]
      });

      // Log activity
      await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          'DELETE',
          'telegram_users',
          telegram_user_id,
          `Reject registrasi Telegram Bot: ${user.nama_karyawan} (@${user.telegram_username || user.telegram_id})`,
          JSON.stringify({ telegram_id: user.telegram_id, nama_karyawan: user.nama_karyawan, bagian: user.bagian }),
          session.username
        ]
      });

      return NextResponse.json({
        success: true,
        action: 'rejected',
        message: `Registrasi ${user.nama_karyawan} ditolak`
      });
    }

  } catch (error: any) {
    console.error('[API] approve error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
