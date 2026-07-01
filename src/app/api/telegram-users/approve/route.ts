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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { telegram_id } = body;

    if (!telegram_id) {
      return NextResponse.json({ error: 'telegram_id is required' }, { status: 400 });
    }

    const existing = await db.execute({
      sql: `SELECT id, nama_karyawan, bagian, telegram_username FROM telegram_users WHERE telegram_id = ? LIMIT 1`,
      args: [String(telegram_id)]
    });

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const user = existing.rows[0] as any;

    await db.execute({
      sql: `UPDATE telegram_users SET is_active = 1, approved_at = CURRENT_TIMESTAMP, approved_by = ? WHERE telegram_id = ?`,
      args: [session.username || 'admin', String(telegram_id)]
    });

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['APPROVE', 'telegram_users', String(telegram_id), `User ${user.nama_karyawan} di-approve`, '', session.username || 'admin']
    });

    // Send notification to user
    const notif = await sendTelegramMessage(
      String(telegram_id),
      `✅ Registrasi Anda telah disetujui!\n\n` +
      `👤 Nama: ${user.nama_karyawan}\n` +
      `🏭 Bagian: ${user.bagian}\n\n` +
      `/input - Input realisasi baru (standalone)\n` +
      `/input_realisasi_by_target - Isi realisasi ke target yang sudah ada\n\n` +
      `Gunakan /help untuk bantuan lengkap.`
    );

    return NextResponse.json({
      success: true,
      nama_karyawan: user.nama_karyawan,
      notification_sent: notif.ok,
      notification_error: notif.error
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
