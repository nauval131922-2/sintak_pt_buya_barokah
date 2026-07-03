import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { searchableMenuItems } from '@/lib/menu-registry';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const pattern = `%${q}%`;
  const lowerQuery = q.toLowerCase();

  try {
    // 1. Search menu items first (prioritas tertinggi)
    const menuResults = searchableMenuItems
      .filter(item => 
        item.label.toLowerCase().includes(lowerQuery) || 
        item.category.toLowerCase().includes(lowerQuery) ||
        (item.keywords && item.keywords.toLowerCase().includes(lowerQuery))
      )
      .slice(0, 5)
      .map(item => ({
        type: 'Menu',
        id: item.href,
        label: item.label,
        source: 'menu',
        category: item.category
      }));

    // 2. Search data - wrapped in try-catch untuk handle DB error
    let dataResults: any[] = [];
    try {
      const dbResult = await db.execute({
        sql: `
          SELECT 'PO' as type, faktur as id, faktur as label, 'purchase_orders' as source, kd_supplier as category
          FROM purchase_orders WHERE faktur LIKE ? COLLATE NOCASE OR kd_supplier LIKE ? COLLATE NOCASE
          UNION ALL
          SELECT 'SO' as type, faktur as id, faktur as label, 'sales_orders' as source, nama_pelanggan as category
          FROM sales_orders WHERE faktur LIKE ? COLLATE NOCASE OR nama_pelanggan LIKE ? COLLATE NOCASE
          UNION ALL
          SELECT 'Barang' as type, CAST(id as TEXT) as id, nama_barang as label, 'bahan_baku' as source, kd_barang as category
          FROM bahan_baku WHERE nama_barang LIKE ? COLLATE NOCASE OR kd_barang LIKE ? COLLATE NOCASE
          UNION ALL
          SELECT 'Karyawan' as type, CAST(id as TEXT) as id, name as label, 'employees' as source, employee_no as category
          FROM employees WHERE name LIKE ? COLLATE NOCASE OR employee_no LIKE ? COLLATE NOCASE
          LIMIT 20
        `,
        args: [
          pattern, pattern,  // PO
          pattern, pattern,  // SO
          pattern, pattern,  // Barang
          pattern, pattern   // Karyawan
        ]
      });
      dataResults = dbResult.rows || [];
    } catch (dbError) {
      console.error('[SEARCH API] Database search error:', dbError);
      // Continue with menu results only
    }

    // Gabungkan: Menu dulu, lalu Data
    const combinedResults = [
      ...menuResults,
      ...dataResults
    ];

    return NextResponse.json({ results: combinedResults.slice(0, 12) });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] });
  }
}
