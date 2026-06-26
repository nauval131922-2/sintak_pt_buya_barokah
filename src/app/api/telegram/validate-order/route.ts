import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== process.env.SCRAPER_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const no_order = req.nextUrl.searchParams.get('no_order');
    if (!no_order) {
      return NextResponse.json({ error: 'Parameter "no_order" wajib diisi' }, { status: 400 });
    }

    // Query tabel sopd
    const result = await db.execute({
      sql: `SELECT no_sopd, nama_order FROM sopd WHERE no_sopd = ? LIMIT 1`,
      args: [no_order]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({
        valid: false,
        message: 'Order tidak ditemukan di database'
      });
    }

    const order = result.rows[0] as any;

    return NextResponse.json({
      valid: true,
      no_order: order.no_sopd,
      nama_order: order.nama_order
    });

  } catch (error: any) {
    console.error('[API] validate-order error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
