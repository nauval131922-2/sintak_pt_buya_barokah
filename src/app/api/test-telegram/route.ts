import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('[TEST FLAT] Route called!');
  
  const apiKey = req.headers.get('X-API-Key');
  console.log('[TEST FLAT] API Key:', apiKey);
  
  if (apiKey !== process.env.SCRAPER_API_KEY) {
    return NextResponse.json({ 
      error: 'Unauthorized',
      received: apiKey,
      expected: process.env.SCRAPER_API_KEY?.substring(0, 10) + '...'
    }, { status: 401 });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Flat API route works!',
    telegram_id: req.nextUrl.searchParams.get('telegram_id')
  });
}
