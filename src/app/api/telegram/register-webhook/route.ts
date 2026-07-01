import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/push';

export const dynamic = 'force-dynamic';

// Webhook dipanggil oleh bot saat ada pendaftaran baru
export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
