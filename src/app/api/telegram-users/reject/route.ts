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
      }),
    });

    const json = await res.json();
    if (!json.ok) {
      console.error('[TELEGRAM] Failed to send notification:', json.description || 'unknown');
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

    // Get user data before deleting
    const existing = await db.execute({
      sql: `SELECT nama_karyawan, bagian FROM telegram_users WHERE telegram_id = ? LIMIT 1`,
      args: [String(telegram_id)]
    });

    const user = existing.rows[0] as any;

    await db.execute({
      sql: `DELETE FROM telegram_users WHERE telegram_id = ?`,
      args: [String(telegram_id)]
    });

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['REJECT', 'telegram_users', Number(telegram_id) || 0, `User ${user?.nama_karyawan || '-'} dihapus/ditolak`, '', session.username || 'admin']
    });

    // Send notification
    if (user) {
      await sendTelegramMessage(
        String(telegram_id),
        `❌ Permintaan registrasi Anda ditolak oleh admin.\n\n` +
        `👤 Nama: ${user.nama_karyawan}\n` +
        `🏭 Bagian: ${user.bagian}\n\n` +
        `Gunakan /register jika ingin mencoba lagi.`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
