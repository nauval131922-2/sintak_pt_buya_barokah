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
            SELECT 'PO' as type, f.faktur as id, f.faktur as label, 'purchase_orders' as source,
              f.kd_supplier || ' · PR: ' || COALESCE(f.faktur_pr,'') || ' · SPH: ' || COALESCE(f.faktur_sph,'') || ' · ' || COALESCE(f.status,'') as category
            FROM purchase_orders f JOIN purchase_orders_fts fts ON f.id = fts.rowid WHERE purchase_orders_fts MATCH ?
            UNION ALL
            SELECT 'SO' as type, f.faktur as id, f.faktur as label, 'sales_orders' as source,
              f.nama_pelanggan || ' · ' || COALESCE(f.kd_pelanggan,'') || ' · ' || COALESCE(f.nama_prd,'') || ' · ' || COALESCE(f.kd_barang,'') as category
            FROM sales_orders f JOIN sales_orders_fts fts ON f.id = fts.rowid WHERE sales_orders_fts MATCH ?
            UNION ALL
            SELECT 'Barang' as type, CAST(f.id as TEXT) as id, f.nama_barang as label, 'bahan_baku' as source,
              f.kd_barang || ' · ' || COALESCE(f.nama_prd,'') || ' · Pelanggan: ' || COALESCE(f.kd_pelanggan,'') || ' · ' || COALESCE(f.keterangan,'') || ' · ' || COALESCE(f.status,'') as category
            FROM bahan_baku f JOIN bahan_baku_fts fts ON f.id = fts.rowid WHERE bahan_baku_fts MATCH ?
            UNION ALL
            SELECT 'Karyawan' as type, CAST(f.id as TEXT) as id, f.name as label, 'employees' as source,
              f.employee_no || ' · ' || COALESCE(f.position,'') || ' · Dept: ' || COALESCE(f.department,'') as category
            FROM employees f JOIN employees_fts fts ON f.id = fts.rowid WHERE employees_fts MATCH ?
            UNION ALL
            SELECT 'Produksi Selesai' as type, f.faktur as id, f.faktur as label, 'produksi_selesai' as source,
              f.nama_prd || ' · Pelanggan: ' || COALESCE(f.kd_pelanggan,'') || ' · Regu: ' || COALESCE(f.regu,'') as category
            FROM produksi_selesai f JOIN produksi_selesai_fts fts ON f.id = fts.rowid WHERE produksi_selesai_fts MATCH ?
            UNION ALL
            SELECT 'Order Produksi' as type, f.faktur as id, f.faktur as label, 'orders' as source,
              f.nama_prd || ' · Pelanggan: ' || COALESCE(f.nama_pelanggan,'') || ' · ' || COALESCE(f.satuan,'') as category
            FROM orders f JOIN orders_fts fts ON f.id = fts.rowid WHERE orders_fts MATCH ?
            UNION ALL
            SELECT 'SPH Out' as type, f.faktur as id, f.faktur as label, 'sph_out' as source,
              f.barang || ' · Pelanggan: ' || COALESCE(f.kd_pelanggan,'') || ' · SO: ' || COALESCE(f.faktur_so,'') as category
            FROM sph_out f JOIN sph_out_fts fts ON f.id = fts.rowid WHERE sph_out_fts MATCH ?
            UNION ALL
            SELECT 'JHP' as type, CAST(f.id as TEXT) as id, f.nama_order as label, 'jurnal_harian_produksi' as source,
              f.nama_karyawan || ' (' || COALESCE(f.jenis_pekerjaan,'') || ') · Order: ' || COALESCE(f.nama_order,'') || ' · ' || COALESCE(f.keterangan,'') || ' · ' || COALESCE(f.bagian,'') as category
            FROM jurnal_harian_produksi f JOIN jurnal_harian_produksi_fts fts ON f.id = fts.rowid WHERE jurnal_harian_produksi_fts MATCH ? AND f.deleted_at IS NULL
            LIMIT 30
          `,
          args: [
            ftsQuery,         // PO FTS
            ftsQuery,         // SO FTS
            ftsQuery,         // Bahan Baku FTS
            ftsQuery,         // Employees FTS
            ftsQuery,         // Produksi Selesai FTS
            ftsQuery,         // Orders FTS
            ftsQuery,         // SPH Out FTS
            ftsQuery          // JHP FTS
          ]
        });
        dataResults = dbResult.rows || [];
      } else {
        // Fallback to standard LIKE matching
        const dbResult = await db.execute({
          sql: `
            SELECT 'PO' as type, faktur as id, faktur as label, 'purchase_orders' as source,
              kd_supplier || ' · PR: ' || COALESCE(faktur_pr,'') || ' · SPH: ' || COALESCE(faktur_sph,'') || ' · ' || COALESCE(status,'') as category
            FROM purchase_orders WHERE faktur LIKE ? COLLATE NOCASE OR kd_supplier LIKE ? COLLATE NOCASE
            UNION ALL
            SELECT 'SO' as type, faktur as id, faktur as label, 'sales_orders' as source,
              nama_pelanggan || ' · ' || COALESCE(kd_pelanggan,'') || ' · ' || COALESCE(nama_prd,'') || ' · ' || COALESCE(kd_barang,'') as category
            FROM sales_orders WHERE faktur LIKE ? COLLATE NOCASE OR nama_pelanggan LIKE ? COLLATE NOCASE OR kd_pelanggan LIKE ? COLLATE NOCASE
            UNION ALL
            SELECT 'Barang' as type, CAST(id as TEXT) as id, nama_barang as label, 'bahan_baku' as source,
              kd_barang || ' · ' || COALESCE(nama_prd,'') || ' · Pelanggan: ' || COALESCE(kd_pelanggan,'') || ' · ' || COALESCE(keterangan,'') || ' · ' || COALESCE(status,'') as category
            FROM bahan_baku WHERE nama_barang LIKE ? COLLATE NOCASE OR kd_barang LIKE ? COLLATE NOCASE OR kd_pelanggan LIKE ? COLLATE NOCASE
            UNION ALL
            SELECT 'Karyawan' as type, CAST(id as TEXT) as id, name as label, 'employees' as source,
              employee_no || ' · ' || COALESCE(position,'') || ' · Dept: ' || COALESCE(department,'') as category
            FROM employees WHERE name LIKE ? COLLATE NOCASE OR employee_no LIKE ? COLLATE NOCASE
            UNION ALL
            SELECT 'Produksi Selesai' as type, faktur as id, faktur as label, 'produksi_selesai' as source,
              nama_prd || ' · Pelanggan: ' || COALESCE(kd_pelanggan,'') || ' · Regu: ' || COALESCE(regu,'') as category
            FROM produksi_selesai WHERE faktur LIKE ? COLLATE NOCASE OR nama_prd LIKE ? COLLATE NOCASE OR kd_pelanggan LIKE ? COLLATE NOCASE
            UNION ALL
            SELECT 'Order Produksi' as type, faktur as id, faktur as label, 'orders' as source,
              nama_prd || ' · Pelanggan: ' || COALESCE(nama_pelanggan,'') || ' · ' || COALESCE(satuan,'') as category
            FROM orders WHERE faktur LIKE ? COLLATE NOCASE OR nama_prd LIKE ? COLLATE NOCASE OR nama_pelanggan LIKE ? COLLATE NOCASE
            UNION ALL
            SELECT 'SPH Out' as type, faktur as id, faktur as label, 'sph_out' as source,
              barang || ' · Pelanggan: ' || COALESCE(kd_pelanggan,'') || ' · SO: ' || COALESCE(faktur_so,'') as category
            FROM sph_out WHERE faktur LIKE ? COLLATE NOCASE OR kd_pelanggan LIKE ? COLLATE NOCASE OR barang LIKE ? COLLATE NOCASE
            UNION ALL
            SELECT 'JHP' as type, CAST(id as TEXT) as id, nama_order as label, 'jurnal_harian_produksi' as source,
              nama_karyawan || ' (' || COALESCE(jenis_pekerjaan,'') || ') · Order: ' || COALESCE(nama_order,'') || ' · ' || COALESCE(keterangan,'') || ' · ' || COALESCE(bagian,'') as category
            FROM jurnal_harian_produksi WHERE (nama_order LIKE ? COLLATE NOCASE OR nama_karyawan LIKE ? COLLATE NOCASE OR no_order LIKE ? COLLATE NOCASE) AND deleted_at IS NULL
            LIMIT 30
          `,
          args: [
            pattern, pattern,  // PO
            pattern, pattern, pattern,  // SO
            pattern, pattern, pattern, // Barang
            pattern, pattern,  // Karyawan
            pattern, pattern, pattern, // Produksi Selesai
            pattern, pattern, pattern, // Orders
            pattern, pattern, pattern, // SPH Out
            pattern, pattern, pattern // JHP
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
