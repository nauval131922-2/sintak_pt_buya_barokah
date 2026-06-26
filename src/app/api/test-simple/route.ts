import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('[TEST] Simple API route called!');
  return NextResponse.json({ 
    success: true, 
    message: 'API route works!',
    timestamp: new Date().toISOString()
  });
}
