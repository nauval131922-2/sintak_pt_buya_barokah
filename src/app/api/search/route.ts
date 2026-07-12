import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { searchableMenuItems } from '@/lib/menu-registry';
import { buildFtsQuery } from '@/lib/fts';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const pattern = `%${q}%`;
  const lowerQuery = q.toLowerCase();
  const ftsQuery = buildFtsQuery(q);

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

    // 2. Search data using FTS5 virtual tables with fallback to LIKE for non-FTS tables
    let dataResults: any[] = [];
    try {
      if (ftsQuery) {
        const dbResult = await db.execute({
          sql: `
            SELECT 'PO' as type, faktur as id, faktur as label, 'purchase_orders' as source, kd_supplier as category
            FROM purchase_orders WHERE faktur LIKE ? COLLATE NOCASE OR kd_supplier LIKE ? COLLATE NOCASE
            UNION ALL
            SELECT 'SO' as type, f.faktur as id, f.faktur as label, 'sales_orders' as source, f.nama_pelanggan as category
            FROM sales_orders f JOIN sales_orders_fts fts ON f.id = fts.rowid WHERE sales_orders_fts MATCH ?
            UNION ALL
            SELECT 'Barang' as type, CAST(f.id as TEXT) as id, f.nama_barang as label, 'bahan_baku' as source, f.kd_barang as category
            FROM bahan_baku f JOIN bahan_baku_fts fts ON f.id = fts.rowid WHERE bahan_baku_fts MATCH ?
            UNION ALL
            SELECT 'Karyawan' as type, CAST(f.id as TEXT) as id, f.name as label, 'employees' as source, f.employee_no as category
            FROM employees f JOIN employees_fts fts ON f.id = fts.rowid WHERE employees_fts MATCH ?
            UNION ALL
            SELECT 'Produksi Selesai' as type, f.faktur as id, f.faktur as label, 'produksi_selesai' as source, f.nama_prd as category
            FROM produksi_selesai f WHERE f.faktur LIKE ? COLLATE NOCASE OR f.nama_prd LIKE ? COLLATE NOCASE
            UNION ALL
            SELECT 'Order Produksi' as type, f.faktur as id, f.faktur as label, 'orders' as source, f.nama_prd as category
            FROM orders f JOIN orders_fts fts ON f.id = fts.rowid WHERE orders_fts MATCH ?
            UNION ALL
            SELECT 'SPH Out' as type, f.faktur as id, f.faktur as label, 'sph_out' as source, f.barang as category
            FROM sph_out f JOIN sph_out_fts fts ON f.id = fts.rowid WHERE sph_out_fts MATCH ?
            LIMIT 30
          `,
          args: [
            pattern, pattern, // PO (No FTS virtual table created for purchase_orders in schema.ts yet)
            ftsQuery,         // SO FTS
            ftsQuery,         // Bahan Baku FTS
            ftsQuery,         // Employees FTS
            pattern, pattern, // Produksi Selesai (No FTS)
            ftsQuery,         // Orders FTS
            ftsQuery          // SPH Out FTS
          ]
        });
        dataResults = dbResult.rows || [];
      } else {
        // Fallback to standard LIKE matching
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
            UNION ALL
            SELECT 'Produksi Selesai' as type, faktur as id, faktur as label, 'produksi_selesai' as source, nama_prd as category
            FROM produksi_selesai WHERE faktur LIKE ? COLLATE NOCASE OR nama_prd LIKE ? COLLATE NOCASE
            UNION ALL
            SELECT 'Order Produksi' as type, faktur as id, faktur as label, 'orders' as source, nama_prd as category
            FROM orders WHERE faktur LIKE ? COLLATE NOCASE OR nama_prd LIKE ? COLLATE NOCASE
            LIMIT 30
          `,
          args: [
            pattern, pattern,  // PO
            pattern, pattern,  // SO
            pattern, pattern,  // Barang
            pattern, pattern,  // Karyawan
            pattern, pattern,  // Produksi Selesai
            pattern, pattern   // Orders
          ]
        });
        dataResults = dbResult.rows || [];
      }
    } catch (dbError) {
      console.error('[SEARCH API] Database search error:', dbError);
    }

    // Gabungkan: Menu dulu, lalu Data
    const combinedResults = [
      ...menuResults,
      ...dataResults
    ];

    return NextResponse.json({ results: combinedResults.slice(0, 15) });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] });
  }
}
