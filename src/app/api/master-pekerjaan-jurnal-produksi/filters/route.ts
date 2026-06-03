import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const result = await db.execute(
      `SELECT DISTINCT category FROM master_pekerjaan_jurnal_produksi 
       WHERE category IS NOT NULL AND category != '' 
       ORDER BY 
         CASE category
           WHEN 'Setting' THEN 1
           WHEN 'Quality Control' THEN 2
           WHEN 'Cetak' THEN 3
           WHEN 'Finishing' THEN 4
           WHEN 'Gudang' THEN 5
           WHEN 'Teknisi' THEN 6
           WHEN 'Mesin' THEN 7
           ELSE 99
         END ASC`
    );

    const categories = (result.rows as unknown as Array<{ category: string }>).map(r => r.category);

    return NextResponse.json({ success: true, categories });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Filter Master Pekerjaan Jurnal Produksi] Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
