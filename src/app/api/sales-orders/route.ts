import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { buildFtsQuery } from '@/lib/fts';
import { getScrapedPeriodSettingKey, parseScrapedPeriod } from '@/lib/server-scraped-period';
import { stripRawData, SALES_ORDERS_LIST_RAW_KEYS } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

// ponytail: JOIN FTS + LIMIT — never materialize all match ids into IN (...)
const ORDER_BY = `ORDER BY substr(so.tgl,7,4) DESC, substr(so.tgl,4,2) DESC, substr(so.tgl,1,2) DESC, so.id DESC`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const offset = (page - 1) * limit;

    const dateFilter = from && to
      ? ` AND (substr(so.tgl,7,4)||substr(so.tgl,4,2)||substr(so.tgl,1,2)) BETWEEN ? AND ?`
      : '';
    const dateArgs = from && to ? [from.replace(/-/g, ''), to.replace(/-/g, '')] : [];

    let records: any[] = [];
    let total = 0;

    if (search) {
      const ftsQuery = buildFtsQuery(search);
      let ftsHit = false;

      if (ftsQuery) {
        try {
          const ftsResults = await db.batch([
            {
              sql: `SELECT so.* FROM sales_orders so
                    JOIN sales_orders_fts fts ON so.id = fts.rowid
                    WHERE sales_orders_fts MATCH ? ${dateFilter}
                    ${ORDER_BY}
                    LIMIT ? OFFSET ?`,
              args: [ftsQuery, ...dateArgs, limit, offset],
            },
            {
              sql: `SELECT COUNT(*) as total FROM sales_orders so
                    JOIN sales_orders_fts fts ON so.id = fts.rowid
                    WHERE sales_orders_fts MATCH ? ${dateFilter}`,
              args: [ftsQuery, ...dateArgs],
            },
          ], 'read');
          records = ftsResults[0].rows as any[];
          total = Number((ftsResults[1].rows[0] as any)?.total || 0);
          ftsHit = total > 0;
        } catch { /* LIKE fallback */ }
      }

      if (!ftsHit) {
        const pat = `%${search}%`;
        const likeClause = ` AND (so.faktur LIKE ? OR so.kd_pelanggan LIKE ? OR so.nama_pelanggan LIKE ? OR so.nama_prd LIKE ? OR so.kd_barang LIKE ?)`;
        const likeArgs = [pat, pat, pat, pat, pat, ...dateArgs];
        const likeResults = await db.batch([
          {
            sql: `SELECT so.* FROM sales_orders so WHERE 1=1 ${likeClause}${dateFilter} ${ORDER_BY} LIMIT ? OFFSET ?`,
            args: [...likeArgs, limit, offset],
          },
          {
            sql: `SELECT COUNT(*) as total FROM sales_orders so WHERE 1=1 ${likeClause}${dateFilter}`,
            args: likeArgs,
          },
        ], 'read');
        records = likeResults[0].rows as any[];
        total = Number((likeResults[1].rows[0] as any)?.total || 0);
      }
    } else {
      const standard = await db.batch([
        {
          sql: `SELECT so.* FROM sales_orders so WHERE 1=1 ${dateFilter} ${ORDER_BY} LIMIT ? OFFSET ?`,
          args: [...dateArgs, limit, offset],
        },
        {
          sql: `SELECT COUNT(*) as total FROM sales_orders so WHERE 1=1 ${dateFilter}`,
          args: dateArgs,
        },
      ], 'read');
      records = standard[0].rows as any[];
      total = Number((standard[1].rows[0] as any)?.total || 0);
    }

    const metadataResults = await db.batch([
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_sales_orders'`, args: [] },
      { sql: `SELECT value FROM system_settings WHERE key = ?`, args: [getScrapedPeriodSettingKey('last_scrape_sales_orders')] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM sales_orders`, args: [] },
    ], 'read');

    const lastScrape = metadataResults[0].rows[0] as any;
    const lastUpdatedRaw = (metadataResults[2].rows[0] as any).lastUpdated;
    const lastUpdated = lastScrape?.value || lastUpdatedRaw;

    return NextResponse.json({
      success: true,
      data: stripRawData(records, SALES_ORDERS_LIST_RAW_KEYS),
      total,
      lastUpdated,
      scrapedPeriod: parseScrapedPeriod((metadataResults[1].rows[0] as any)?.value),
    });
  } catch (error: any) {
    console.error('API Error (sales-orders):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
