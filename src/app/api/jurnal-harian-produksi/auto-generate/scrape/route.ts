import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

function getFirstDayOfMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const start = getFirstDayOfMonth();
    const end = getTodayStr();

    // Jalankan scraping orders dan barang_jadi secara paralel
    const baseUrl = request.nextUrl.origin;

    const [ordersRes, barangJadiRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/scrape-orders?start=${start}&end=${end}&silent=true&metaStart=${start}&metaEnd=${end}`),
      fetch(`${baseUrl}/api/scrape-barang-jadi?start=${start}&end=${end}&silent=true&metaStart=${start}&metaEnd=${end}`),
    ]);

    const ordersResult = ordersRes.status === 'fulfilled' && ordersRes.value.ok
      ? await ordersRes.value.json()
      : { success: false, total: 0, error: ordersRes.status === 'rejected' ? ordersRes.reason?.message : 'Gagal' };

    const barangJadiResult = barangJadiRes.status === 'fulfilled' && barangJadiRes.value.ok
      ? await barangJadiRes.value.json()
      : { success: false, total: 0, error: barangJadiRes.status === 'rejected' ? barangJadiRes.reason?.message : 'Gagal' };

    return NextResponse.json({
      success: true,
      period: { start, end },
      orders: {
        success: !!ordersResult.success,
        total: ordersResult.total ?? 0,
        error: ordersResult.error ?? null,
      },
      barangJadi: {
        success: !!barangJadiResult.success,
        total: barangJadiResult.total ?? 0,
        error: barangJadiResult.error ?? null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
