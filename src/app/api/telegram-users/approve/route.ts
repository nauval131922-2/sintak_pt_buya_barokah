import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function sendTelegramMessage(chatId: string, text: string) {
  try {
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      console.log('[TELEGRAM] BOT_TOKEN not set, skipping notification');
      return;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    const json = await res.json();
    if (!json.ok) {
      console.error('[TELEGRAM] Failed to send notification:', JSON.stringify(json));
    }
  } catch (error: any) {
    console.error('[TELEGRAM] Error sending notification:', error.message);
  }
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

    // Send notification to user
    await sendTelegramMessage(
      String(telegram_id),
      `✅ Registrasi Anda telah disetujui!\n\n` +
      `👤 Nama: ${user.nama_karyawan}\n` +
      `🏭 Bagian: ${user.bagian}\n\n` +
      `Gunakan /input untuk mulai input realisasi.`
    );

    return NextResponse.json({ success: true, nama_karyawan: user.nama_karyawan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
