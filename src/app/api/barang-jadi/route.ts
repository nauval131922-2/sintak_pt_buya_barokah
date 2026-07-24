import { NextResponse } from "next/server";
import db from "@/lib/db";
import { buildFtsQuery } from "@/lib/fts";
import { getScrapedPeriodSettingKey, parseScrapedPeriod } from "@/lib/server-scraped-period";
import { stripRawData } from "@/lib/api-utils";

export const dynamic = 'force-dynamic';

// ponytail: JOIN once instead of 3 correlated subqueries per row (incl. COUNT)
const ENRICH_JOINS = `
  LEFT JOIN (
    SELECT faktur_prd, kd_barang,
      SUM(hp_total)*1.0 / NULLIF(SUM(qty), 0) AS hp_rata_rata
    FROM barang_jadi
    GROUP BY faktur_prd, kd_barang
  ) avg ON avg.faktur_prd = bj.faktur_prd AND avg.kd_barang = bj.kd_barang
  LEFT JOIN (
    SELECT faktur, MIN(harga) AS harga FROM sales_orders GROUP BY faktur
  ) so ON so.faktur = bj.faktur_so
  LEFT JOIN (
    SELECT faktur_so, MIN(harga) AS harga FROM sales_reports GROUP BY faktur_so
  ) sr ON sr.faktur_so = bj.faktur_so
`;

const ENRICH_SELECT = `bj.*, avg.hp_rata_rata, so.harga AS harga_so_sales_order, sr.harga AS harga_so_penjualan`;
const ORDER_BY = `ORDER BY substr(bj.tgl, 7, 4) DESC, substr(bj.tgl, 4, 2) DESC, substr(bj.tgl, 1, 2) DESC, bj.id DESC`;

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
    const soOnly = searchParams.get('so_only') === 'true';

    const warningFilterSQL = warningOnly
      ? `((so.harga > 0 AND (so.harga < bj.hp OR so.harga < avg.hp_rata_rata)) OR (sr.harga > 0 AND (sr.harga < bj.hp OR sr.harga < avg.hp_rata_rata)))`
      : '';
    const soFilterSQL = soOnly
      ? `(bj.faktur_so IS NOT NULL AND TRIM(bj.faktur_so) NOT IN ('', '-', '–', '—'))`
      : '';

    const postFilters = [warningFilterSQL, soFilterSQL].filter(Boolean);
    const postWhere = postFilters.length > 0
      ? ` AND ` + postFilters.map(f => `(${f})`).join(' AND ')
      : '';

    // COUNT needs enrich JOINs only when filtering on computed harga/hp_rata_rata
    const countJoins = warningOnly ? ENRICH_JOINS : '';
    const countPostWhere = postWhere;

    const dateFilterSQL = (fromDate && toDate)
      ? ` AND (substr(bj.tgl, 7, 4) || '-' || substr(bj.tgl, 4, 2) || '-' || substr(bj.tgl, 1, 2) BETWEEN ? AND ?)`
      : ``;
    const dateArgs = fromDate && toDate ? [fromDate, toDate] : [];

    let records: any[] = [];
    let total = 0;

    if (search) {
      const ftsQuery = buildFtsQuery(search);

      if (ftsQuery) {
        const ftsResults = await db.batch([
          {
            sql: `SELECT ${ENRICH_SELECT}
                  FROM barang_jadi bj
                  JOIN barang_jadi_fts fts ON bj.id = fts.rowid
                  ${ENRICH_JOINS}
                  WHERE barang_jadi_fts MATCH ? ${dateFilterSQL}${postWhere}
                  ${ORDER_BY}
                  LIMIT ? OFFSET ?`,
            args: [ftsQuery, ...dateArgs, limit, offset]
          },
          {
            sql: `SELECT COUNT(*) as count
                  FROM barang_jadi bj
                  JOIN barang_jadi_fts fts ON bj.id = fts.rowid
                  ${countJoins}
                  WHERE barang_jadi_fts MATCH ? ${dateFilterSQL}${countPostWhere}`,
            args: [ftsQuery, ...dateArgs]
          }
        ], "read");

        records = ftsResults[0].rows;
        total = Number((ftsResults[1].rows[0] as any).count);
      }

      if (total === 0) {
        const query = `%${search}%`;
        const likeArgs = [...Array(7).fill(query), ...dateArgs];
        const likeWhere = `(CAST(bj.id AS TEXT) LIKE ? OR bj.nama_barang LIKE ? OR bj.nama_prd LIKE ? OR bj.kd_barang LIKE ? OR bj.faktur LIKE ? OR bj.faktur_prd LIKE ? OR bj.satuan LIKE ?)`;

        const likeResults = await db.batch([
          {
            sql: `SELECT ${ENRICH_SELECT}
                  FROM barang_jadi bj
                  ${ENRICH_JOINS}
                  WHERE ${likeWhere}${dateFilterSQL}${postWhere}
                  ${ORDER_BY}
                  LIMIT ? OFFSET ?`,
            args: [...likeArgs, limit, offset]
          },
          {
            sql: `SELECT COUNT(*) as count
                  FROM barang_jadi bj
                  ${countJoins}
                  WHERE ${likeWhere}${dateFilterSQL}${countPostWhere}`,
            args: likeArgs
          }
        ], "read");

        records = likeResults[0].rows;
        total = Number((likeResults[1].rows[0] as any).count);
      }
    } else {
      const baseWhere = `WHERE 1=1${dateFilterSQL}`;

      const standardResults = await db.batch([
        {
          sql: `SELECT ${ENRICH_SELECT}
                FROM barang_jadi bj
                ${ENRICH_JOINS}
                ${baseWhere}${postWhere}
                ${ORDER_BY}
                LIMIT ? OFFSET ?`,
          args: [...dateArgs, limit, offset]
        },
        {
          sql: `SELECT COUNT(*) as count
                FROM barang_jadi bj
                ${countJoins}
                ${baseWhere}${countPostWhere}`,
          args: dateArgs
        }
      ], "read");

      records = standardResults[0].rows;
      total = Number((standardResults[1].rows[0] as any).count);
    }

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
      data: stripRawData(records),
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
