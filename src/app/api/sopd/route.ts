import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate"); // DD-MM-YYYY
    const endDate = searchParams.get("endDate");     // DD-MM-YYYY
    const produksiSelesai = searchParams.get("produksiSelesai"); // 'yes' | 'no' | null
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Helper: convert DD-MM-YYYY to YYYY-MM-DD for comparisons
    const toISO = (ddmmyyyy: string | null) => {
      if (!ddmmyyyy) return null;
      const p = ddmmyyyy.split('-');
      if (p.length !== 3) return null;
      return `${p[2]}-${p[1]}-${p[0]}`;
    };

    const startISO = toISO(startDate);
    const endISO = toISO(endDate);

    // Date filter expression (stored as DD-MM-YYYY, convert for comparison)
    const dateExpr = `substr(tgl,7,4)||'-'||substr(tgl,4,2)||'-'||substr(tgl,1,2)`;

    // sopd (Excel upload) hanya untuk data pre-2025
    const SOPD_CUTOFF = '2024-12-31';

    const qPattern = search ? `%${search}%` : null;

    // Sorting server-side
    // Whitelist kolom yang boleh disort beserta ekspresi SQL-nya
    // Kolom tanggal disimpan DD-MM-YYYY sehingga perlu konversi ke YYYY-MM-DD untuk sort yang benar
    const SORT_COLUMNS: Record<string, string> = {
      tgl:              `substr(u.tgl,7,4)||'-'||substr(u.tgl,4,2)||'-'||substr(u.tgl,1,2)`,
      no_sopd:          `no_sopd`,
      nama_order:       `nama_order`,
      qty_sopd:         `qty_sopd`,
      unit:             `unit`,
      perkiraan_harga:  `h.perkiraan_harga`,
      keterangan:       `h.keterangan`,
      deadline_date:    `h.deadline_date`,
      finished_date:    `h.finished_date`,
      pending_produksi: `h.pending_produksi`,
      alasan_pending:   `h.alasan_pending`,
      kd_kelompok:          `COALESCE(mb_prefix.kd_kelompok, mb_strip.kd_kelompok, mb_exact.kd_kelompok)`,
      is_produksi_selesai:  `CASE WHEN ps.nama_prd IS NOT NULL THEN 1 ELSE 0 END`,
    };

    // Support multi-sort: ?sort=col1:asc,col2:desc — fallback ke legacy sortBy/sortDir
    const sortRaw = searchParams.get("sort") || '';
    const sortByRaw = searchParams.get("sortBy") || '';
    const sortDir   = searchParams.get("sortDir") === 'asc' ? 'ASC' : 'DESC';

    let ORDER_BY: string;
    if (sortRaw) {
      const clauses = sortRaw.split(',').flatMap(part => {
        const [col, dir] = part.split(':');
        const expr = SORT_COLUMNS[col];
        if (!expr) return [];
        return [`${expr} ${dir === 'asc' ? 'ASC' : 'DESC'}`];
      });
      ORDER_BY = clauses.length
        ? `ORDER BY ${clauses.join(', ')}`
        : `ORDER BY substr(u.tgl,7,4) DESC, substr(u.tgl,4,2) DESC, substr(u.tgl,1,2) DESC, no_sopd DESC`;
    } else {
      const sortExpr = SORT_COLUMNS[sortByRaw];
      ORDER_BY = sortExpr
        ? `ORDER BY ${sortExpr} ${sortDir}, no_sopd ${sortDir}`
        : `ORDER BY substr(u.tgl,7,4) DESC, substr(u.tgl,4,2) DESC, substr(u.tgl,1,2) DESC, no_sopd DESC`;
    }

    // Mode lookup tgl: return semua {no_sopd, tgl} dari sopd+orders untuk sort by tanggal order
    // ponytail: no pagination, no join — hanya 2 kolom; dipakai TargetClient untuk build tglMap
    if (searchParams.get('tglOnly') === 'true') {
      const sql = `
        SELECT no_sopd, tgl FROM sopd
        UNION ALL
        SELECT faktur as no_sopd, tgl FROM orders WHERE tgl IS NOT NULL AND tgl != ''`;
      const result = await db.execute({ sql, args: [] });
      return NextResponse.json({ success: true, data: result.rows });
    }

    // Mode khusus untuk dropdown (tanpa filter tanggal, ambil semua)
    const allMode = searchParams.get('all') === 'true';
    if (allMode) {
      const whereClause = search ? `WHERE no_sopd LIKE ? OR nama_order LIKE ?` : '';
      const args: any[] = search ? [`%${search}%`, `%${search}%`, limit] : [limit];
      const sql = `
        SELECT no_sopd, nama_order FROM (
          SELECT no_sopd, nama_order FROM sopd
          UNION
          SELECT faktur as no_sopd, nama_prd as nama_order FROM orders
        ) ${whereClause} ORDER BY no_sopd DESC LIMIT ?`;
      const result = await db.execute({ sql, args });
      return NextResponse.json({ success: true, data: result.rows, total: result.rows.length });
    }

    // sopd: selalu dibatasi <= 2024-12-31 (Excel upload hanya pre-2025)
    const sopdWhereParts: string[] = [`${dateExpr} <= '${SOPD_CUTOFF}'`];
    if (startDate && endDate) sopdWhereParts.push(`${dateExpr} BETWEEN ? AND ?`);
    if (search) sopdWhereParts.push(`(s.no_sopd LIKE ? OR s.nama_order LIKE ?)`);
    if (produksiSelesai === 'yes') sopdWhereParts.push(`EXISTS (SELECT 1 FROM produksi_selesai WHERE nama_prd = s.nama_order)`);
    if (produksiSelesai === 'no') sopdWhereParts.push(`NOT EXISTS (SELECT 1 FROM produksi_selesai WHERE nama_prd = s.nama_order)`);
    const sopdWhere = `WHERE ${sopdWhereParts.join(' AND ')}`;

    // orders: tidak dibatasi tahun, semua rentang
    const ordersWhereParts: string[] = [];
    if (startDate && endDate) ordersWhereParts.push(`${dateExpr} BETWEEN ? AND ?`);
    if (search) ordersWhereParts.push(`(o.faktur LIKE ? OR o.nama_prd LIKE ?)`);
    if (produksiSelesai === 'yes') ordersWhereParts.push(`EXISTS (SELECT 1 FROM produksi_selesai WHERE nama_prd = o.nama_prd)`);
    if (produksiSelesai === 'no') ordersWhereParts.push(`NOT EXISTS (SELECT 1 FROM produksi_selesai WHERE nama_prd = o.nama_prd)`);
    const ordersWhere = ordersWhereParts.length ? `WHERE ${ordersWhereParts.join(' AND ')}` : '';

    // WHERE untuk COUNT — tanpa alias tabel (s./o.) agar bisa dipakai langsung di sqlTotal
    const sopdWhereTotalParts: string[] = [`${dateExpr} <= '${SOPD_CUTOFF}'`];
    if (startDate && endDate) sopdWhereTotalParts.push(`${dateExpr} BETWEEN ? AND ?`);
    if (search) sopdWhereTotalParts.push(`(no_sopd LIKE ? OR nama_order LIKE ?)`);
    if (produksiSelesai === 'yes') sopdWhereTotalParts.push(`EXISTS (SELECT 1 FROM produksi_selesai WHERE nama_prd = sopd.nama_order)`);
    if (produksiSelesai === 'no') sopdWhereTotalParts.push(`NOT EXISTS (SELECT 1 FROM produksi_selesai WHERE nama_prd = sopd.nama_order)`);
    const sopdWhereTotal = `WHERE ${sopdWhereTotalParts.join(' AND ')}`;

    const ordersWhereTotalParts: string[] = [];
    if (startDate && endDate) ordersWhereTotalParts.push(`${dateExpr} BETWEEN ? AND ?`);
    if (search) ordersWhereTotalParts.push(`(faktur LIKE ? OR nama_prd LIKE ?)`);
    if (produksiSelesai === 'yes') ordersWhereTotalParts.push(`EXISTS (SELECT 1 FROM produksi_selesai WHERE nama_prd = orders.nama_prd)`);
    if (produksiSelesai === 'no') ordersWhereTotalParts.push(`NOT EXISTS (SELECT 1 FROM produksi_selesai WHERE nama_prd = orders.nama_prd)`);
    const ordersWhereTotal = ordersWhereTotalParts.length ? `WHERE ${ordersWhereTotalParts.join(' AND ')}` : '';

    const dateArgs = (startDate && endDate) ? [startISO!, endISO!] : [];
    const sopdArgs   = [...dateArgs, ...(search ? [qPattern!, qPattern!] : [])];
    const ordersArgs = [...dateArgs, ...(search ? [qPattern!, qPattern!] : [])];

    const sqlData = `
      SELECT u.*, h.perkiraan_harga, h.keterangan, h.deadline_date, h.finished_date, h.pending_produksi, h.alasan_pending,
        COALESCE(mb_prefix.kd_kelompok, mb_strip.kd_kelompok, mb_exact.kd_kelompok, mb_produk.kd_kelompok) as kd_kelompok,
        CASE WHEN ps.nama_prd IS NOT NULL THEN 1 ELSE 0 END as is_produksi_selesai
      FROM (
        SELECT s.id, s.no_sopd, s.tgl, s.nama_order, s.qty_sopd, s.unit, 'sopd' as src, NULL as produk FROM sopd s ${sopdWhere}
        UNION ALL
        SELECT o.id, o.faktur as no_sopd, o.tgl, o.nama_prd as nama_order, o.qty as qty_sopd, o.satuan as unit, 'orders' as src, json_extract(o.raw_data, '$.produk') as produk FROM orders o ${ordersWhere}
      ) u
      LEFT JOIN sopd_harga h ON h.no_sopd = u.no_sopd
      LEFT JOIN (SELECT TRIM(nama) as nama, kd_kelompok FROM stok_master_barang GROUP BY TRIM(nama)) mb_exact
        ON mb_exact.nama = TRIM(u.nama_order)
      -- mb_strip: strip prefix OP/OS dari nama_order SOPD, cocokkan ke nama bersih di master barang
      LEFT JOIN (SELECT TRIM(nama) as nama, kd_kelompok FROM stok_master_barang GROUP BY TRIM(nama)) mb_strip
        ON INSTR(u.nama_order, '-') > 0 AND mb_strip.nama = TRIM(SUBSTR(u.nama_order, INSTR(u.nama_order, '-') + 1))
      -- mb_prefix: ekstrak prefix OP/OS dari nama master barang → equality join ke nama_order SOPD
      LEFT JOIN (
        SELECT TRIM(SUBSTR(nama, 1, INSTR(nama, '-') - 1)) as prefix, MIN(kd_kelompok) as kd_kelompok
        FROM stok_master_barang
        WHERE (nama LIKE 'OP.%.SOPD.%-%' OR nama LIKE 'OS.%.SOPD.%-%') AND INSTR(nama, '-') > 0
        GROUP BY TRIM(SUBSTR(nama, 1, INSTR(nama, '-') - 1))
      ) mb_prefix ON mb_prefix.prefix = TRIM(SUBSTR(u.nama_order, 1, INSTR(u.nama_order, '-') - 1))
        AND (u.nama_order LIKE 'OP.%.SOPD.%-%' OR u.nama_order LIKE 'OS.%.SOPD.%-%')
      LEFT JOIN (SELECT TRIM(nama) as nama, kd_kelompok FROM stok_master_barang GROUP BY TRIM(nama)) mb_produk
        ON u.produk IS NOT NULL AND mb_produk.nama = TRIM(u.produk)
      LEFT JOIN (SELECT DISTINCT nama_prd FROM produksi_selesai) ps ON ps.nama_prd = u.nama_order
      ${ORDER_BY} LIMIT ? OFFSET ?`;

    const sqlTotal = `
      SELECT (
        (SELECT COUNT(*) FROM sopd ${sopdWhereTotal}) +
        (SELECT COUNT(*) FROM orders ${ordersWhereTotal})
      ) as count`;

    const argsData  = [...sopdArgs, ...ordersArgs, limit, offset];
    const argsTotal = [...sopdArgs, ...ordersArgs];

    // ponytail: semua query digabung satu batch — 2 round-trips → 1
    const batchResults = await db.batch([
      { sql: sqlData, args: argsData },
      { sql: sqlTotal, args: argsTotal },
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_orders'`, args: [] },
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_orders_period'`, args: [] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM activity_logs WHERE table_name = 'sopd' AND action_type = 'UPLOAD'`, args: [] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM orders`, args: [] },
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_orders_period_full'`, args: [] },
    ], "read");

    const data = batchResults[0].rows;
    const total = Number((batchResults[1].rows[0] as any).count);

    const lastScrape = batchResults[2].rows[0] as any;
    const lastUpload = (batchResults[4].rows[0] as any)?.lastUpdated;
    const lastScrapeOrders = (batchResults[5].rows[0] as any)?.lastUpdated;

    // Selalu tampilkan timestamp terbaru dari kedua sumber
    const lastUpdated = lastUpload || (lastScrape ? lastScrape.value : lastScrapeOrders);
    
    let scrapedPeriod = null;
    try {
      // Prioritas: period_full (range total dari SopdClient) > period (chunk terakhir dari scraper)
      const periodFull = (batchResults[6].rows[0] as any)?.value;
      const periodVal = periodFull || (batchResults[3].rows[0] as any)?.value;
      if (periodVal) scrapedPeriod = JSON.parse(periodVal);
    } catch(e) {}

    return NextResponse.json({ 
      success: true, 
      data, 
      total, 
      page, 
      limit,
      lastUpdated,
      lastExcelUpdate: lastUpload,
      lastScrapedUpdate: lastScrape ? lastScrape.value : lastScrapeOrders,
      scrapedPeriod,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { mode, filename, data: rawData } = await request.json();

    if (mode === 'start') {
      await db.batch([
        { sql: 'DELETE FROM sopd', args: [] },
        { sql: 'DELETE FROM sopd_harga', args: [] }
      ], "write");
      return NextResponse.json({ success: true });
    }

    if (mode === 'end') {
      const importedCount = rawData?.importedCount || 0;
      const session = await getSession();
      await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          'UPLOAD', 
          'sopd', 
          0, 
          `Upload SOPD dari Excel (${importedCount} data)`, 
          JSON.stringify({ fileName: filename, imported: importedCount }),
          session?.username || 'System'
        ]
      });
      return NextResponse.json({ success: true });
    }

    // Default or 'chunk' mode
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
       return NextResponse.json({ error: "Data chunk kosong." }, { status: 400 });
    }

    const processedSopd = new Set<string>();
    const batchOps: any[] = [];

    for (const row of rawData) {
      const noSopd = String(row.no_sopd || '').trim();
      const tgl = String(row.tgl || '').trim();
      const namaOrder = String(row.nama_order || '').trim();
      let qtySopd = 0;
      const unit = String(row.unit || '').trim();
      
      const perkiraanHarga = row.perkiraan_harga;
      const keterangan = row.keterangan;
      const deadlineDate = row.deadline_date;
      const finishedDate = row.finished_date;

      // Qty Parsing
      const rawQty = row.qty_sopd;
      if (typeof rawQty === 'number') {
        qtySopd = rawQty;
      } else if (typeof rawQty === 'string') {
        let cleanVal = rawQty.trim().replace(/\s/g, '');
        if (cleanVal.includes(',') && cleanVal.includes('.')) {
          if (cleanVal.lastIndexOf(',') > cleanVal.lastIndexOf('.')) {
            cleanVal = cleanVal.replace(/\./g, "").replace(",", ".");
          } else {
            cleanVal = cleanVal.replace(/,/g, "");
          }
        } else if (cleanVal.includes(',')) {
          cleanVal = cleanVal.replace(',', '.');
        }
        qtySopd = parseFloat(cleanVal) || 0;
      }

      if (!noSopd && !namaOrder) continue;

      batchOps.push({
        sql: `INSERT INTO sopd (no_sopd, tgl, nama_order, qty_sopd, unit) VALUES (?, ?, ?, ?, ?)`,
        args: [noSopd, tgl || null, namaOrder, qtySopd, unit || null]
      });

      if (noSopd && !processedSopd.has(noSopd)) {
        batchOps.push({
          sql: `INSERT INTO sopd_harga (no_sopd, perkiraan_harga, keterangan, deadline_date, finished_date) VALUES (?, ?, ?, ?, ?)`,
          args: [noSopd, perkiraanHarga || null, keterangan || null, deadlineDate || null, finishedDate || null]
        });
        processedSopd.add(noSopd);
      }
    }

    if (batchOps.length > 0) {
      await db.batch(batchOps, "write");
    }

    return NextResponse.json({ success: true, imported: rawData.length });

  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses chunk data", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { no_sopd, perkiraan_harga, keterangan, deadline_date, finished_date, pending_produksi, alasan_pending } = body;

    if (!no_sopd) {
      return NextResponse.json({ error: 'no_sopd diperlukan' }, { status: 400 });
    }

    if (perkiraan_harga !== undefined) {
        let harga: any = perkiraan_harga;
        if (perkiraan_harga === '' || perkiraan_harga === null) {
            harga = null;
        } else {
            const clean = String(perkiraan_harga).replace(/\./g, "").replace(',', '.');
            const num = Number(clean);
            if (!isNaN(num)) harga = num;
            else harga = String(perkiraan_harga);
        }

        await db.execute({
          sql: `INSERT INTO sopd_harga (no_sopd, perkiraan_harga, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(no_sopd) DO UPDATE SET perkiraan_harga = excluded.perkiraan_harga, updated_at = CURRENT_TIMESTAMP`,
          args: [no_sopd, harga]
        });
        await logActivity('UPDATE', 'sopd_harga', `Update perkiraan harga SOPD: ${no_sopd}`, { no_sopd, perkiraan_harga: harga });
        return NextResponse.json({ success: true, no_sopd, perkiraan_harga: harga });
    }

    if (keterangan !== undefined) {
        await db.execute({
          sql: `INSERT INTO sopd_harga (no_sopd, keterangan, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(no_sopd) DO UPDATE SET keterangan = excluded.keterangan, updated_at = CURRENT_TIMESTAMP`,
          args: [no_sopd, keterangan]
        });
        await logActivity('UPDATE', 'sopd_harga', `Update keterangan SOPD: ${no_sopd}`, { no_sopd, keterangan });
        return NextResponse.json({ success: true, no_sopd, keterangan });
    }

    if (deadline_date !== undefined) {
        await db.execute({
          sql: `INSERT INTO sopd_harga (no_sopd, deadline_date, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(no_sopd) DO UPDATE SET deadline_date = excluded.deadline_date, updated_at = CURRENT_TIMESTAMP`,
          args: [no_sopd, deadline_date]
        });
        await logActivity('UPDATE', 'sopd_harga', `Update deadline SOPD: ${no_sopd}`, { no_sopd, deadline_date });
        return NextResponse.json({ success: true, no_sopd, deadline_date });
    }

    if (finished_date !== undefined) {
        await db.execute({
          sql: `INSERT INTO sopd_harga (no_sopd, finished_date, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(no_sopd) DO UPDATE SET finished_date = excluded.finished_date, updated_at = CURRENT_TIMESTAMP`,
          args: [no_sopd, finished_date]
        });
        await logActivity('UPDATE', 'sopd_harga', `Update tanggal selesai SOPD: ${no_sopd}`, { no_sopd, finished_date });
        return NextResponse.json({ success: true, no_sopd, finished_date });
    }

    if (pending_produksi !== undefined) {
        const val = pending_produksi === true || pending_produksi === 1 || pending_produksi === '1' ? 1 : 0;
        await db.execute({
          sql: `INSERT INTO sopd_harga (no_sopd, pending_produksi, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(no_sopd) DO UPDATE SET pending_produksi = excluded.pending_produksi, updated_at = CURRENT_TIMESTAMP`,
          args: [no_sopd, val]
        });
        await logActivity('UPDATE', 'sopd_harga', `Update pending produksi SOPD: ${no_sopd}`, { no_sopd, pending_produksi: val });
        return NextResponse.json({ success: true, no_sopd, pending_produksi: val });
    }

    if (alasan_pending !== undefined) {
        await db.execute({
          sql: `INSERT INTO sopd_harga (no_sopd, alasan_pending, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(no_sopd) DO UPDATE SET alasan_pending = excluded.alasan_pending, updated_at = CURRENT_TIMESTAMP`,
          args: [no_sopd, alasan_pending || null]
        });
        await logActivity('UPDATE', 'sopd_harga', `Update alasan pending SOPD: ${no_sopd}`, { no_sopd, alasan_pending });
        return NextResponse.json({ success: true, no_sopd, alasan_pending });
    }

    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.batch([
      { sql: 'DELETE FROM sopd', args: [] },
      { sql: 'DELETE FROM sopd_harga', args: [] }
    ], "write");

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        'DELETE', 
        'sopd', 
        0, 
        'Menghapus seluruh data SOPD', 
        '{}',
        session?.username || 'System'
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
