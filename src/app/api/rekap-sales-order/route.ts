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
    const search = searchParams.get('q') || '';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const minHarga = searchParams.get('min');
    const maxHarga = searchParams.get('max');
    const offset = (page - 1) * limit;

    const filters: string[] = [];
    const filterArgs: any[] = [];

    if (from && to) {
      filters.push(`(substr(so.tgl,7,4)||substr(so.tgl,4,2)||substr(so.tgl,1,2)) BETWEEN ? AND ?`);
      filterArgs.push(from.replace(/-/g, ''), to.replace(/-/g, ''));
    }
    if (minHarga !== null && minHarga !== '') {
      filters.push(`so.harga >= ?`);
      filterArgs.push(parseFloat(minHarga));
    }
    if (maxHarga !== null && maxHarga !== '') {
      filters.push(`so.harga <= ?`);
      filterArgs.push(parseFloat(maxHarga));
    }
    const extraWhere = filters.length ? ` AND ${filters.join(' AND ')}` : '';

    let records: any[] = [];
    let total = 0;

    if (search) {
      const ftsQuery = buildFtsQuery(search);
      let ftsHit = false;

      if (ftsQuery) {
        try {
          const ftsResults = await db.batch([
            {
              sql: `SELECT so.*, so.jumlah AS total FROM sales_orders so
                    JOIN sales_orders_fts fts ON so.id = fts.rowid
                    WHERE sales_orders_fts MATCH ? ${extraWhere}
                    ${ORDER_BY}
                    LIMIT ? OFFSET ?`,
              args: [ftsQuery, ...filterArgs, limit, offset],
            },
            {
              sql: `SELECT COUNT(*) as total FROM sales_orders so
                    JOIN sales_orders_fts fts ON so.id = fts.rowid
                    WHERE sales_orders_fts MATCH ? ${extraWhere}`,
              args: [ftsQuery, ...filterArgs],
            },
          ], 'read');
          records = ftsResults[0].rows as any[];
          total = Number((ftsResults[1].rows[0] as any)?.total || 0);
          ftsHit = total > 0;
        } catch { /* LIKE fallback */ }
      }

      if (!ftsHit) {
        const pat = `%${search}%`;
        const likeClause = ` AND (so.faktur LIKE ? OR so.faktur_sph LIKE ? OR so.kd_barang LIKE ? OR so.faktur_prd LIKE ? OR so.nama_prd LIKE ?)`;
        const likeArgs = [pat, pat, pat, pat, pat, ...filterArgs];
        const likeResults = await db.batch([
          {
            sql: `SELECT so.*, so.jumlah AS total FROM sales_orders so WHERE 1=1 ${likeClause}${extraWhere} ${ORDER_BY} LIMIT ? OFFSET ?`,
            args: [...likeArgs, limit, offset],
          },
          {
            sql: `SELECT COUNT(*) as total FROM sales_orders so WHERE 1=1 ${likeClause}${extraWhere}`,
            args: likeArgs,
          },
        ], 'read');
        records = likeResults[0].rows as any[];
        total = Number((likeResults[1].rows[0] as any)?.total || 0);
      }
    } else {
      const standard = await db.batch([
        {
          sql: `SELECT so.*, so.jumlah AS total FROM sales_orders so WHERE 1=1 ${extraWhere} ${ORDER_BY} LIMIT ? OFFSET ?`,
          args: [...filterArgs, limit, offset],
        },
        {
          sql: `SELECT COUNT(*) as total FROM sales_orders so WHERE 1=1 ${extraWhere}`,
          args: filterArgs,
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
      page,
      totalPages: Math.ceil(total / limit) || 1,
      lastUpdated,
      scrapedPeriod: parseScrapedPeriod((metadataResults[1].rows[0] as any)?.value),
    });
  } catch (error: any) {
    console.error('API Error (rekap-sales-order):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
