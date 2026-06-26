import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('[TELEGRAM API] check-status called!', req.nextUrl.toString());
  console.log('[TELEGRAM API] All headers:', Object.fromEntries(req.headers.entries()));
  try {
    // Auth check
    const apiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key');
    console.log('[TELEGRAM API] API Key received:', apiKey);
    console.log('[TELEGRAM API] Expected API Key:', process.env.SCRAPER_API_KEY);
    console.log('[TELEGRAM API] Match:', apiKey === process.env.SCRAPER_API_KEY);
    
    if (apiKey !== process.env.SCRAPER_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized', debug: { received: apiKey, expected: process.env.SCRAPER_API_KEY?.substring(0, 10) + '...' } }, { status: 401 });
    }

    const telegram_id = req.nextUrl.searchParams.get('telegram_id');
    if (!telegram_id) {
      return NextResponse.json({ error: 'Parameter "telegram_id" wajib diisi' }, { status: 400 });
    }

    // Query telegram_users
    const result = await db.execute({
      sql: `SELECT id, telegram_id, telegram_username, nama_karyawan, posisi, absensi, bagian, is_active
            FROM telegram_users
            WHERE telegram_id = ?
            LIMIT 1`,
      args: [telegram_id]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({
        registered: false,
        is_active: 0,
        message: 'User belum terdaftar'
      });
    }

    const user = result.rows[0] as any;

    return NextResponse.json({
      registered: true,
      is_active: user.is_active,
      nama_karyawan: user.nama_karyawan,
      posisi: user.posisi,
      absensi: user.absensi,
      bagian: user.bagian,
      telegram_username: user.telegram_username
    });

  } catch (error: any) {
    console.error('[API] check-status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
