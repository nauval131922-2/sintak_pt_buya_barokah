import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const search   = p.get("search") || "";
    const startDate = p.get("startDate"); // DD-MM-YYYY
    const endDate   = p.get("endDate");   // DD-MM-YYYY
    const page  = Math.max(1, parseInt(p.get("page")  || "1"));
    const limit = Math.max(1, parseInt(p.get("limit") || "50"));
    const offset = (page - 1) * limit;
    const sortBy  = p.get("sortBy")  || "";
    const sortDir = p.get("sortDir") === "asc" ? "ASC" : "DESC";

    // Convert DD-MM-YYYY → YYYY-MM-DD untuk perbandingan
    const toISO = (ddmmyyyy: string | null) => {
      if (!ddmmyyyy) return null;
      const parts = ddmmyyyy.split("-");
      if (parts.length !== 3) return null;
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    const startISO = toISO(startDate);
    const endISO   = toISO(endDate);
    // Filter berdasarkan tglclose (tanggal selesai produksi), bukan tgl (tanggal order)
    const closeExpr = `substr(tglclose,7,4)||'-'||substr(tglclose,4,2)||'-'||substr(tglclose,1,2)`;

    // Whitelist sort
    const SORT_MAP: Record<string, string> = {
      tgl:              `substr(tgl,7,4)||'-'||substr(tgl,4,2)||'-'||substr(tgl,1,2)`,
      faktur:           "faktur",
      nama_prd:         "nama_prd",
      kd_pelanggan:     "kd_pelanggan",
      tglclose:         closeExpr,
      datetime_mulai:   "datetime_mulai",
      datetime_selesai: "datetime_selesai",
      kd_gudang:        "kd_gudang",
      kd_mtd:           "kd_mtd",
      kd_regu:          "kd_regu",
      hp:               "hp",
      bbb:              "bbb",
    };
    const sortExpr  = SORT_MAP[sortBy];
    const ORDER_BY  = sortExpr
      ? `ORDER BY ${sortExpr} ${sortDir}, faktur ${sortDir}`
      : `ORDER BY ${closeExpr} DESC, faktur DESC`;

    const whereParts: string[] = [];
    const args: any[] = [];

    if (startISO && endISO) {
      // Filter berdasarkan tglclose
      whereParts.push(`${closeExpr} BETWEEN ? AND ?`);
      args.push(startISO, endISO);
    }
    if (search) {
      whereParts.push(`(faktur LIKE ? OR nama_prd LIKE ? OR kd_pelanggan LIKE ?)`);
      const pat = `%${search}%`;
      args.push(pat, pat, pat);
    }

    const WHERE = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    const [dataResult, countResult, metaResult] = await Promise.all([
      db.execute({
        sql: `SELECT * FROM produksi_selesai ${WHERE} ${ORDER_BY} LIMIT ? OFFSET ?`,
        args: [...args, limit, offset],
      }),
      db.execute({
        sql: `SELECT COUNT(*) as count FROM produksi_selesai ${WHERE}`,
        args,
      }),
      db.execute({
        sql: `SELECT key, value FROM system_settings WHERE key IN ('last_scrape_produksi_selesai', 'last_scrape_produksi_selesai_period')`,
        args: [],
      }),
    ]);

    const total       = Number((countResult.rows[0] as any).count);
    const metaMap     = Object.fromEntries((metaResult.rows as any[]).map(r => [r.key, r.value]));
    const lastUpdated = metaMap['last_scrape_produksi_selesai'] || null;
    let scrapedPeriod = null;
    try {
      if (metaMap['last_scrape_produksi_selesai_period']) {
        scrapedPeriod = JSON.parse(metaMap['last_scrape_produksi_selesai_period']);
      }
    } catch {}

    return NextResponse.json({
      success: true,
      data: dataResult.rows,
      total,
      page,
      limit,
      lastUpdated,
      scrapedPeriod,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
