import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getScrapedPeriodSettingKey, parseScrapedPeriod } from '@/lib/server-scraped-period';
import { JURNAL_UMUM_COLS, ensureJurnalUmumSchema } from '@/lib/jurnal-umum-schema';
import type { JurnalUmumExecutor } from '@/lib/jurnal-umum-schema';

export const dynamic = 'force-dynamic';

let cachedKasKodes: Set<string> | null = null;
let cachedKasExpiresAt = 0;

async function getKasKodes(): Promise<Set<string>> {
  const now = Date.now();
  if (cachedKasKodes && now < cachedKasExpiresAt) {
    return cachedKasKodes;
  }
  try {
    const kasRes = await db.execute("SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas'");
    const codes: string[] = [];
    for (const r of kasRes.rows) {
      if (r && typeof r === 'object' && 'kode' in r) {
        const kode: unknown = r.kode;
        if (typeof kode === 'string' || typeof kode === 'number') codes.push(String(kode));
      }
    }
    cachedKasKodes = new Set(codes);
    cachedKasExpiresAt = now + 60_000;
    return cachedKasKodes;
  } catch (e) {
    console.error("Failed to fetch rek_akuntansi for is_kas flag", e);
    return cachedKasKodes || new Set();
  }
}

async function ensureTable() {
  // Skema dimiliki modul bersama (lib/jurnal-umum-schema). Dulu definisi
  // CREATE TABLE duplikat di sini dengan versi basi — sumber drift.
  try {
    const executor = (db as unknown as { client?: JurnalUmumExecutor }).client || db;
    if (executor.execute) {
      await ensureJurnalUmumSchema(executor as unknown as JurnalUmumExecutor);
    }
  } catch {
    // Tabel belum ada (belum pernah scrape) — query di bawah gagal wajar
  }
}
const PARENT_SORT_COLS: Record<string, string> = {
  tgl: 'tgl', faktur: 'faktur', rekening: 'rekening', keterangan: 'keterangan',
  debit: 'debit', kredit: 'kredit', username: 'username', create_at: 'create_at',
};

// Sort global (lintas halaman). Kolom turunan (_labaRugi, _arusKas,
// ketepatan_waktu) tidak masuk whitelist: running total dihitung ulang
// mengikuti urutan tampil, jadi sort di kolom itu dimatikan di klien.
function getParentOrderBy(sortParam: string | null): string {
  let states: { id?: string; desc?: boolean }[] = [];
  try {
    const parsed: unknown = JSON.parse(sortParam || '[]');
    if (Array.isArray(parsed)) states = parsed as { id?: string; desc?: boolean }[];
  } catch { /* abaikan sort rusak → urutan default */ }
  const mapped = states
    .filter((s) => s && s.id && PARENT_SORT_COLS[s.id])
    .map((s) => `${PARENT_SORT_COLS[s.id as string]} ${s.desc ? 'DESC' : 'ASC'}`);
  if (mapped.length === 0) return 'create_at ASC, faktur ASC, id ASC';
  // ponytail: tiebreak faktur+id agar pagination deterministik di semua sort
  if (!mapped.some((m) => m.startsWith('faktur '))) mapped.push('faktur ASC');
  mapped.push('id ASC');
  return mapped.join(', ');
}
export async function GET(req: NextRequest) {
  try {
    await ensureTable();

    const { searchParams } = new URL(req.url);
    const page    = Math.max(1, parseInt(searchParams.get('page')   || '1'));
    const limit   = Math.min(5000, Math.max(1, parseInt(searchParams.get('limit')  || '50')));
    const search  = searchParams.get('q')       || '';
    const from    = searchParams.get('from');
    const to      = searchParams.get('to');
    const catFrom = searchParams.get('cat_from');  // filter by create_at
    const catTo   = searchParams.get('cat_to');
    const rek     = searchParams.get('rek') || '';   // filter rekening (kode, exact match rek_kode)
    const orderBy = getParentOrderBy(searchParams.get('sort'));
    const offset  = (page - 1) * limit;

    // Tanpa raw_data: JSON mentah Digit ±13x bobot kolom terpakai
    // (±95KB/halaman) dan tidak pernah dirender klien.
    // Only query parent rows (is_child = 0)
    let query      = `SELECT ${JURNAL_UMUM_COLS} FROM jurnal_umum WHERE is_child = 0`;
    let countQuery = `SELECT COUNT(*) as total FROM jurnal_umum WHERE is_child = 0`;
    const params: (string | number)[] = [];

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

    // Filter by create_at date range via kolom generated create_date
    // (terindeks; substr() mentah tidak kepakai indeks).
    if (catFrom && catTo) {
      const clause = ` AND create_date BETWEEN ? AND ?`;
      query      += clause;
      countQuery += clause;
      params.push(catFrom, catTo);
    }

    // Filter rekening: voucher yang punya baris anak dengan kode tsb (exact match
    // ke kolom generated rek_kode, terindeks idx_jurnal_umum_rek_kode).
    if (rek) {
      const clause = ` AND faktur IN (SELECT parent_faktur FROM jurnal_umum WHERE is_child = 1 AND rek_kode = ?)`;
      query      += clause;
      countQuery += clause;
      params.push(rek);
    }

    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    const queryParams = [...params, limit, offset];

    const [dataResults, countResults] = await Promise.all([
      db.execute({ sql: query, args: queryParams }),
      db.execute({ sql: countQuery, args: params }),
    ]);

    const totalRow = countResults.rows[0];
    const total = (totalRow && typeof totalRow === 'object' && 'total' in totalRow)
      ? Number(totalRow.total) || 0
      : 0;
    interface JurnalRow { faktur?: unknown; parent_faktur?: unknown; rekening?: unknown; children?: JurnalRow[]; is_kas?: boolean; [key: string]: unknown }
    const parentRows = dataResults.rows as JurnalRow[];

    // Fetch children for each parent
    if (parentRows.length > 0) {
      const fakturs = parentRows.map((r) => String(r.faktur ?? ''));
      const placeholders = fakturs.map(() => '?').join(',');
      const childRes = await db.execute({
        sql: `SELECT ${JURNAL_UMUM_COLS} FROM jurnal_umum WHERE is_child = 1 AND parent_faktur IN (${placeholders}) ORDER BY id ASC`,
        args: fakturs
      });

      const childrenMap: Record<string, JurnalRow[]> = {};
      for (const child of childRes.rows as JurnalRow[]) {
        const pf = String(child.parent_faktur ?? '');
        if (!childrenMap[pf]) childrenMap[pf] = [];
        childrenMap[pf]?.push(child);
      }

      for (const row of parentRows) {
        row.children = childrenMap[String(row.faktur ?? '')] || [];
      }
    }

    // Determine Kas accounts to attach is_kas flag (cached 60s)
    const kasKodes = await getKasKodes();
    const applyKasFlag = (row: JurnalRow): void => {
      const rekeningCode = String(row.rekening ?? '').split(' - ')[0]?.trim() ?? '';
      row.is_kas = kasKodes.has(rekeningCode);
      if (row.children && row.children.length > 0) {
        row.children.forEach(applyKasFlag);
      }
    };
    parentRows.forEach(applyKasFlag);

    // Metadata: lastUpdated murni dari cache scrape. Query MAX(created_at)
    // sebelumnya full scan 27rb baris parent tiap buka halaman.
    const metadataResults = await db.batch([
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_jurnal_umum'`, args: [] },
      { sql: `SELECT value FROM system_settings WHERE key = ?`, args: [getScrapedPeriodSettingKey('last_scrape_jurnal_umum')] },
    ], 'read');

    const lastScrape     = metadataResults[0].rows[0] as { value?: string } | undefined;
    const lastUpdated    = lastScrape?.value || null;

    // Saldo Awal: cumulative LR before cat_from date (only when create_at filter is active)
    let saldoAwal = 0;
    let saldoAwalKas = 0;
    if (catFrom && catTo) {
      let saldoSql = `SELECT
                        SUM(CASE WHEN rek_head BETWEEN '4' AND '9' THEN kredit ELSE 0 END) -
                        SUM(CASE WHEN rek_head BETWEEN '4' AND '9' THEN debit  ELSE 0 END) as saldo,
                        SUM(CASE WHEN rek_kode IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas') THEN debit ELSE 0 END) -
                        SUM(CASE WHEN rek_kode IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas') THEN kredit ELSE 0 END) as saldo_kas
                      FROM jurnal_umum
                      WHERE is_child = 1
                        AND create_date < ?`;
      const saldoParams: (string | number)[] = [catFrom];

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

      // Filter rekening ikut di saldo, di level voucher (sama seperti data tampil:
      // voucher yang punya baris anak berkode tsb) agar kumulatif konsisten.
      if (rek) {
        saldoSql += ` AND parent_faktur IN (SELECT parent_faktur FROM jurnal_umum WHERE is_child = 1 AND rek_kode = ?)`;
        saldoParams.push(rek);
      }

      const saldoRes = await db.execute({ sql: saldoSql, args: saldoParams });
      const saldoRow = saldoRes.rows[0] as { saldo?: number | null; saldo_kas?: number | null } | undefined;
      saldoAwal = Number(saldoRow?.saldo ?? 0) || 0;
      saldoAwalKas = Number(saldoRow?.saldo_kas ?? 0) || 0;
    }

    // prevLabaRugi & prevArusKas: running total from ALL child rows BEFORE this page's offset.
    // This lets the frontend continue the cumulative calculation correctly across pages.
    let prevLabaRugi = saldoAwal;
    let prevArusKas  = saldoAwalKas;
    if (offset > 0) {
      // Build the same WHERE clause used for parents, then get children of those parents
      let prevParentWhere = `is_child = 0`;
      const prevParentParams: (string | number)[] = [];

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
        prevParentWhere += ` AND create_date BETWEEN ? AND ?`;
        prevParentParams.push(catFrom, catTo);
      }
      if (rek) {
        prevParentWhere += ` AND faktur IN (SELECT parent_faktur FROM jurnal_umum WHERE is_child = 1 AND rek_kode = ?)`;
        prevParentParams.push(rek);
      }

      // Parent sebelum halaman ini (ORDER BY sama dengan query utama: sort global)
      const prevParentsSql = `SELECT faktur FROM jurnal_umum WHERE ${prevParentWhere} ORDER BY ${orderBy} LIMIT ?`;
      const prevParentsParams = [...prevParentParams, offset];

      const prevRunningSql = `
        SELECT
          SUM(CASE WHEN rek_head BETWEEN '4' AND '9' THEN kredit ELSE 0 END) -
          SUM(CASE WHEN rek_head BETWEEN '4' AND '9' THEN debit  ELSE 0 END) as lr,
          SUM(CASE WHEN rek_kode IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas') THEN debit ELSE 0 END) -
          SUM(CASE WHEN rek_kode IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas') THEN kredit ELSE 0 END) as ak
        FROM jurnal_umum
        WHERE is_child = 1
          AND parent_faktur IN (${prevParentsSql})
      `;

      try {
        const prevRes = await db.execute({ sql: prevRunningSql, args: prevParentsParams });
        const row = prevRes.rows[0] as { lr?: number | null; ak?: number | null } | undefined;
        prevLabaRugi = saldoAwal + (Number(row?.lr ?? 0) || 0);
        prevArusKas  = saldoAwalKas + (Number(row?.ak ?? 0) || 0);
      } catch (e) {
        // fallback: keep saldoAwal
        console.error('Failed to compute prevLabaRugi/prevArusKas', e);
      }
    }

    const periodRow = metadataResults[1].rows[0];
    const periodValue = (periodRow && typeof periodRow === 'object' && 'value' in periodRow)
      ? String(periodRow.value ?? '')
      : '';
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
      scrapedPeriod: parseScrapedPeriod(periodValue),
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat jurnal umum';
    console.error('API Error (jurnal-umum):', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
