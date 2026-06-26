import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('[ULTRA SIMPLE] Called!');
  
  const apiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key');
  const expected = process.env.SCRAPER_API_KEY;
  
  console.log('[ULTRA SIMPLE] Received key:', apiKey);
  console.log('[ULTRA SIMPLE] Expected key:', expected);
  console.log('[ULTRA SIMPLE] Match:', apiKey === expected);
  
  // Return JSON immediately without any DB calls
  return NextResponse.json({
    test: 'success',
    apiKeyReceived: !!apiKey,
    apiKeyMatch: apiKey === expected,
    env: !!process.env.SCRAPER_API_KEY
  });
}
