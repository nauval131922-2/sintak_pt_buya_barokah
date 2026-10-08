import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/push';

export const dynamic = 'force-dynamic';

// Webhook dipanggil oleh bot saat ada pendaftaran baru
export async function POST(request: NextRequest) {
  // Guard: hanya pemegang SCRAPER_API_KEY (bot internal) — tutup broadcast push publik
  const expected = process.env.SCRAPER_API_KEY;
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
  if (!expected || !apiKey || apiKey !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { nama_karyawan, bagian } = body;

    if (!nama_karyawan) {
      return NextResponse.json({ error: 'nama_karyawan is required' }, { status: 400 });
    }

    // Trigger push notification ke semua admin
    await sendPushNotification(
      'SINTAK - Pendaftaran Baru',
      `${nama_karyawan} (${bagian}) meminta akses Telegram Bot`,
      '/settings/telegram-users'
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[WEBHOOK] Push notification error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
