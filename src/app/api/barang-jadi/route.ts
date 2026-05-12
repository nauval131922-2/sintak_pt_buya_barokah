import { NextResponse } from "next/server";
import db from "@/lib/db";
import { buildFtsQuery } from "@/lib/fts";
import { getScrapedPeriodSettingKey, parseScrapedPeriod } from "@/lib/server-scraped-period";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;
    const fromDate = searchParams.get('from') || '';
    const toDate = searchParams.get('to') || '';
    
    const warningOnly = searchParams.get('warning_only') === 'true';
    const warningFilterSQL = warningOnly ? `WHERE (harga_so_sales_order > 0 AND (harga_so_sales_order < hp OR harga_so_sales_order < hp_rata_rata)) OR (harga_so_penjualan > 0 AND (harga_so_penjualan < hp OR harga_so_penjualan < hp_rata_rata))` : '';

    const dateFilterSQL = (fromDate && toDate) 
      ? ` AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2) BETWEEN ? AND ?)`
      : ``;

    let records: any[] = [];
    let total = 0;

    if (search) {
      const ftsQuery = buildFtsQuery(search);

      if (ftsQuery) {
        const ftsResults = await db.batch([
          {
            sql: `WITH base_query AS (
                    SELECT bj.*, 
                      (SELECT SUM(hp_total)*1.0 / NULLIF(SUM(qty), 0) FROM barang_jadi bj_inner WHERE bj_inner.faktur_prd = bj.faktur_prd AND bj_inner.kd_barang = bj.kd_barang) AS hp_rata_rata,
                      (SELECT harga FROM sales_orders WHERE faktur = bj.faktur_so LIMIT 1) as harga_so_sales_order,
                      (SELECT harga FROM sales_reports WHERE faktur_so = bj.faktur_so LIMIT 1) as harga_so_penjualan
                    FROM barang_jadi bj JOIN barang_jadi_fts fts ON bj.id = fts.rowid
                    WHERE barang_jadi_fts MATCH ? ${dateFilterSQL}
                  )
                  SELECT * FROM base_query
                  ${warningFilterSQL}
                  ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC
                  LIMIT ? OFFSET ?`,
            args: [ftsQuery, ...(fromDate && toDate ? [fromDate, toDate] : []), limit, offset]
          },
          {
            sql: `WITH base_query AS (
                    SELECT bj.*, 
                      (SELECT SUM(hp_total)*1.0 / NULLIF(SUM(qty), 0) FROM barang_jadi bj_inner WHERE bj_inner.faktur_prd = bj.faktur_prd AND bj_inner.kd_barang = bj.kd_barang) AS hp_rata_rata,
                      (SELECT harga FROM sales_orders WHERE faktur = bj.faktur_so LIMIT 1) as harga_so_sales_order,
                      (SELECT harga FROM sales_reports WHERE faktur_so = bj.faktur_so LIMIT 1) as harga_so_penjualan
                    FROM barang_jadi bj JOIN barang_jadi_fts fts ON bj.id = fts.rowid
                    WHERE barang_jadi_fts MATCH ? ${dateFilterSQL}
                  )
                  SELECT COUNT(*) as count FROM base_query
                  ${warningFilterSQL}`,
            args: [ftsQuery, ...(fromDate && toDate ? [fromDate, toDate] : [])]
          }
        ], "read");

        records = ftsResults[0].rows;
        total = Number((ftsResults[1].rows[0] as any).count);
      }

      // 2. Fallback to LIKE if FTS fails (Robustness)
      if (total === 0) {
        const query = `%${search}%`;
        const likeArgs = Array(7).fill(query);
        if (fromDate && toDate) { likeArgs.push(fromDate, toDate); }

        const likeResults = await db.batch([
          {
            sql: `WITH base_query AS (
                    SELECT *, 
                      (SELECT SUM(hp_total)*1.0 / NULLIF(SUM(qty), 0) FROM barang_jadi bj_inner WHERE bj_inner.faktur_prd = barang_jadi.faktur_prd AND bj_inner.kd_barang = barang_jadi.kd_barang) AS hp_rata_rata,
                      (SELECT harga FROM sales_orders WHERE faktur = barang_jadi.faktur_so LIMIT 1) as harga_so_sales_order,
                      (SELECT harga FROM sales_reports WHERE faktur_so = barang_jadi.faktur_so LIMIT 1) as harga_so_penjualan
                    FROM barang_jadi 
                    WHERE (CAST(id AS TEXT) LIKE ? OR nama_barang LIKE ? OR nama_prd LIKE ? OR kd_barang LIKE ? OR faktur LIKE ? OR faktur_prd LIKE ? OR satuan LIKE ?) ${dateFilterSQL}
                  )
                  SELECT * FROM base_query
                  ${warningFilterSQL}
                  ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
                  LIMIT ? OFFSET ?`,
            args: [...likeArgs, limit, offset]
          },
          {
            sql: `WITH base_query AS (
                    SELECT *, 
                      (SELECT SUM(hp_total)*1.0 / NULLIF(SUM(qty), 0) FROM barang_jadi bj_inner WHERE bj_inner.faktur_prd = barang_jadi.faktur_prd AND bj_inner.kd_barang = barang_jadi.kd_barang) AS hp_rata_rata,
                      (SELECT harga FROM sales_orders WHERE faktur = barang_jadi.faktur_so LIMIT 1) as harga_so_sales_order,
                      (SELECT harga FROM sales_reports WHERE faktur_so = barang_jadi.faktur_so LIMIT 1) as harga_so_penjualan
                    FROM barang_jadi 
                    WHERE (CAST(id AS TEXT) LIKE ? OR nama_barang LIKE ? OR nama_prd LIKE ? OR kd_barang LIKE ? OR faktur LIKE ? OR faktur_prd LIKE ? OR satuan LIKE ?) ${dateFilterSQL}
                  )
                  SELECT COUNT(*) as count FROM base_query
                  ${warningFilterSQL}`,
            args: likeArgs
          }
        ], "read");

        records = likeResults[0].rows;
        total = Number((likeResults[1].rows[0] as any).count);
      }
    } else {
      // Regular Fetch (No Search)
      const baseArgs = [];
      if (fromDate && toDate) { baseArgs.push(fromDate, toDate); }

      const standardResults = await db.batch([
        {
          sql: `WITH base_query AS (
                  SELECT *, 
                    (SELECT SUM(hp_total)*1.0 / NULLIF(SUM(qty), 0) FROM barang_jadi bj_inner WHERE bj_inner.faktur_prd = barang_jadi.faktur_prd AND bj_inner.kd_barang = barang_jadi.kd_barang) AS hp_rata_rata,
                    (SELECT harga FROM sales_orders WHERE faktur = barang_jadi.faktur_so LIMIT 1) as harga_so_sales_order,
                    (SELECT harga FROM sales_reports WHERE faktur_so = barang_jadi.faktur_so LIMIT 1) as harga_so_penjualan
                  FROM barang_jadi 
                  ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}
                )
                SELECT * FROM base_query
                ${warningFilterSQL}
                ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
                LIMIT ? OFFSET ?`,
          args: [...baseArgs, limit, offset]
        },
        {
          sql: `WITH base_query AS (
                  SELECT *, 
                    (SELECT SUM(hp_total)*1.0 / NULLIF(SUM(qty), 0) FROM barang_jadi bj_inner WHERE bj_inner.faktur_prd = barang_jadi.faktur_prd AND bj_inner.kd_barang = barang_jadi.kd_barang) AS hp_rata_rata,
                    (SELECT harga FROM sales_orders WHERE faktur = barang_jadi.faktur_so LIMIT 1) as harga_so_sales_order,
                    (SELECT harga FROM sales_reports WHERE faktur_so = barang_jadi.faktur_so LIMIT 1) as harga_so_penjualan
                  FROM barang_jadi
                  ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}
                )
                SELECT COUNT(*) as count FROM base_query
                ${warningFilterSQL}`,
          args: baseArgs
        }
      ], "read");

      records = standardResults[0].rows;
      total = Number((standardResults[1].rows[0] as any).count);
    }

    // Execute metadata queries separately for clarity
    const metadataResults = await db.batch([
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_barang_jadi'`, args: [] },
      { sql: `SELECT value FROM system_settings WHERE key = ?`, args: [getScrapedPeriodSettingKey('last_scrape_barang_jadi')] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM barang_jadi`, args: [] }
    ], "read");

    const lastScrape = metadataResults[0].rows[0] as any;
    const lastUpdatedRaw = (metadataResults[2].rows[0] as any).lastUpdated;
    const lastUpdated = lastScrape ? lastScrape.value : lastUpdatedRaw;

    return NextResponse.json({
      success: true,
      data: records,
      total,
      lastUpdated,
      scrapedPeriod: parseScrapedPeriod((metadataResults[1].rows[0] as any)?.value),
      page,
      limit
    });

  } catch (error: any) {
    console.error("Fetch barang-jadi error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cached barang_jadi", details: error.message },
      { status: 500 }
    );
  }
}

