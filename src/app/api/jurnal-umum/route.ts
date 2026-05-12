import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getScrapedPeriodSettingKey, parseScrapedPeriod } from '@/lib/server-scraped-period';

export const dynamic = 'force-dynamic';

async function ensureTable() {
  try {
    const executor = (db as any).client || db;
    if (executor.execute) {
      await executor.execute(`CREATE TABLE IF NOT EXISTS jurnal_umum (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        faktur TEXT NOT NULL,
        tgl TEXT,
        rekening TEXT,
        keterangan TEXT,
        debit REAL,
        kredit REAL,
        username TEXT,
        create_at TEXT,
        parent_faktur TEXT,
        is_child INTEGER DEFAULT 0,
        raw_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(faktur, rekening, tgl, is_child)
      )`);
    }
  } catch (e) {
    // Table already exists
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();

    const { searchParams } = new URL(req.url);
    const page    = parseInt(searchParams.get('page')   || '1');
    const limit   = parseInt(searchParams.get('limit')  || '50');
    const search  = searchParams.get('q')       || '';
    const from    = searchParams.get('from');
    const to      = searchParams.get('to');
    const catFrom = searchParams.get('cat_from');  // filter by create_at
    const catTo   = searchParams.get('cat_to');
    const offset  = (page - 1) * limit;

    // Only query parent rows (is_child = 0)
    let query      = `SELECT * FROM jurnal_umum WHERE is_child = 0`;
    let countQuery = `SELECT COUNT(*) as total FROM jurnal_umum WHERE is_child = 0`;
    const params: any[] = [];

    // Search
    if (search) {
      const pat = `%${search}%`;
      const clause = ` AND (faktur LIKE ? OR keterangan LIKE ? OR rekening LIKE ? OR username LIKE ?)`;
      query      += clause;
      countQuery += clause;
      params.push(pat, pat, pat, pat);
    }

    // Date filter: tgl is now normalized to YYYY-MM-DD
    if (from && to) {
      const clause = ` AND tgl BETWEEN ? AND ?`;
      query      += clause;
      countQuery += clause;
      params.push(from, to);
    }

    // Filter by create_at date range (YYYY-MM-DD prefix match)
    if (catFrom && catTo) {
      const clause = ` AND substr(create_at, 1, 10) BETWEEN ? AND ?`;
      query      += clause;
      countQuery += clause;
      params.push(catFrom, catTo);
    }

    query += ` ORDER BY create_at ASC, faktur ASC, id ASC LIMIT ? OFFSET ?`;
    const queryParams = [...params, limit, offset];

    const [dataResults, countResults] = await Promise.all([
      db.execute({ sql: query, args: queryParams }),
      db.execute({ sql: countQuery, args: params }),
    ]);

    const total = (countResults.rows[0]?.total as number) || 0;
    const parentRows = dataResults.rows as any[];

    // Fetch children for each parent
    if (parentRows.length > 0) {
      const fakturs = parentRows.map(r => r.faktur);
      const placeholders = fakturs.map(() => '?').join(',');
      const childRes = await db.execute({
        sql: `SELECT * FROM jurnal_umum WHERE is_child = 1 AND parent_faktur IN (${placeholders}) ORDER BY id ASC`,
        args: fakturs
      });

      const childrenMap: Record<string, any[]> = {};
      for (const child of childRes.rows as any[]) {
        const pf = child.parent_faktur || '';
        if (!childrenMap[pf]) childrenMap[pf] = [];
        childrenMap[pf].push(child);
      }

      for (const row of parentRows) {
        (row as any).children = childrenMap[row.faktur] || [];
      }
    }

    // Determine Kas accounts to attach is_kas flag
    try {
      const kasRes = await db.execute("SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas'");
      const kasKodes = new Set(kasRes.rows.map(r => String(r.kode)));
      
      const applyKasFlag = (row: any) => {
        const rekeningCode = String(row.rekening).split(' - ')[0]?.trim(); // Assuming format like "1100-00 - Kas" or just "1100-00"
        row.is_kas = kasKodes.has(rekeningCode);
        if (row.children && row.children.length > 0) {
          row.children.forEach(applyKasFlag);
        }
      };
      
      parentRows.forEach(applyKasFlag);
    } catch (e) {
      // Ignore if rek_akuntansi doesn't exist yet
      console.error("Failed to fetch rek_akuntansi for is_kas flag", e);
    }

    // Metadata
    const metadataResults = await db.batch([
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_jurnal_umum'`, args: [] },
      { sql: `SELECT value FROM system_settings WHERE key = ?`, args: [getScrapedPeriodSettingKey('last_scrape_jurnal_umum')] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM jurnal_umum WHERE is_child = 0`, args: [] }
    ], 'read');

    const lastScrape     = metadataResults[0].rows[0] as any;
    const lastUpdatedRaw = (metadataResults[2].rows[0] as any)?.lastUpdated;
    const lastUpdated    = lastScrape?.value || lastUpdatedRaw;

    // Saldo Awal: cumulative LR before cat_from date (only when create_at filter is active)
    let saldoAwal = 0;
    let saldoAwalKas = 0;
    if (catFrom) {
      let saldoSql = `SELECT
                        SUM(CASE WHEN CAST(substr(rekening,1,1) AS INTEGER) BETWEEN 4 AND 9 THEN kredit ELSE 0 END) -
                        SUM(CASE WHEN CAST(substr(rekening,1,1) AS INTEGER) BETWEEN 4 AND 9 THEN debit  ELSE 0 END) as saldo,
                        SUM(CASE WHEN trim(substr(rekening, 1, CASE WHEN instr(rekening, ' - ') > 0 THEN instr(rekening, ' - ') - 1 ELSE length(rekening) END)) IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas') THEN debit ELSE 0 END) -
                        SUM(CASE WHEN trim(substr(rekening, 1, CASE WHEN instr(rekening, ' - ') > 0 THEN instr(rekening, ' - ') - 1 ELSE length(rekening) END)) IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas') THEN kredit ELSE 0 END) as saldo_kas
                      FROM jurnal_umum
                      WHERE is_child = 1
                        AND substr(create_at, 1, 10) < ?`;
      const saldoParams: any[] = [catFrom];

      if (from && to) {
        saldoSql += ` AND tgl BETWEEN ? AND ?`;
        saldoParams.push(from, to);
      }

      if (search) {
        saldoSql += ` AND parent_faktur IN (
          SELECT faktur FROM jurnal_umum 
          WHERE is_child = 0 AND (faktur LIKE ? OR keterangan LIKE ? OR rekening LIKE ? OR username LIKE ?)
        )`;
        const pat = `%${search}%`;
        saldoParams.push(pat, pat, pat, pat);
      }

      const saldoRes = await db.execute({ sql: saldoSql, args: saldoParams });
      saldoAwal = Number((saldoRes.rows[0] as any)?.saldo ?? 0) || 0;
      saldoAwalKas = Number((saldoRes.rows[0] as any)?.saldo_kas ?? 0) || 0;
    }

    // prevLabaRugi & prevArusKas: running total from ALL child rows BEFORE this page's offset.
    // This lets the frontend continue the cumulative calculation correctly across pages.
    let prevLabaRugi = saldoAwal;
    let prevArusKas  = saldoAwalKas;
    if (offset > 0) {
      // Build the same WHERE clause used for parents, then get children of those parents
      let prevParentWhere = `is_child = 0`;
      const prevParentParams: any[] = [];

      if (search) {
        const pat = `%${search}%`;
        prevParentWhere += ` AND (faktur LIKE ? OR keterangan LIKE ? OR rekening LIKE ? OR username LIKE ?)`;
        prevParentParams.push(pat, pat, pat, pat);
      }
      if (from && to) {
        prevParentWhere += ` AND tgl BETWEEN ? AND ?`;
        prevParentParams.push(from, to);
      }
      if (catFrom && catTo) {
        prevParentWhere += ` AND substr(create_at, 1, 10) BETWEEN ? AND ?`;
        prevParentParams.push(catFrom, catTo);
      }

      // IDs of parents before this page (same ORDER BY, LIMIT offset)
      const prevParentsSql = `SELECT faktur FROM jurnal_umum WHERE ${prevParentWhere} ORDER BY create_at ASC, faktur ASC, id ASC LIMIT ?`;
      const prevParentsParams = [...prevParentParams, offset];

      const prevRunningSql = `
        SELECT
          SUM(CASE WHEN CAST(substr(rekening,1,1) AS INTEGER) BETWEEN 4 AND 9 THEN kredit ELSE 0 END) -
          SUM(CASE WHEN CAST(substr(rekening,1,1) AS INTEGER) BETWEEN 4 AND 9 THEN debit  ELSE 0 END) as lr,
          SUM(CASE WHEN trim(substr(rekening, 1, CASE WHEN instr(rekening, ' - ') > 0 THEN instr(rekening, ' - ') - 1 ELSE length(rekening) END)) IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas') THEN debit ELSE 0 END) -
          SUM(CASE WHEN trim(substr(rekening, 1, CASE WHEN instr(rekening, ' - ') > 0 THEN instr(rekening, ' - ') - 1 ELSE length(rekening) END)) IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas') THEN kredit ELSE 0 END) as ak
        FROM jurnal_umum
        WHERE is_child = 1
          AND parent_faktur IN (${prevParentsSql})
      `;

      try {
        const prevRes = await db.execute({ sql: prevRunningSql, args: prevParentsParams });
        const row = prevRes.rows[0] as any;
        prevLabaRugi = saldoAwal + (Number(row?.lr ?? 0) || 0);
        prevArusKas  = saldoAwalKas + (Number(row?.ak ?? 0) || 0);
      } catch (e) {
        // fallback: keep saldoAwal
        console.error('Failed to compute prevLabaRugi/prevArusKas', e);
      }
    }

    return NextResponse.json({
      success: true,
      data: parentRows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      lastUpdated,
      saldoAwal,
      saldoAwalKas,
      prevLabaRugi,
      prevArusKas,
      scrapedPeriod: parseScrapedPeriod((metadataResults[1].rows[0] as any)?.value),
    });

  } catch (error: any) {
    console.error('API Error (jurnal-umum):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
