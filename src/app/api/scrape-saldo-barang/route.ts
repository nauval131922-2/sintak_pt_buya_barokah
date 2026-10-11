import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import db from "@/lib/db";
import { getErrorMessage } from "@/lib/api-utils";
import { requireApiPermission } from "@/lib/api-guard";
import { getCachedSession, setCachedSession, clearCachedSession, getSession as getScraperSession } from "@/lib/session-cache";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";
const API_EMAIL = process.env.SCRAPER_EMAIL || "nauval";
if (!process.env.SCRAPER_PASSWORD) throw new Error("SCRAPER_PASSWORD env tidak diset");
const API_PASSWORD = process.env.SCRAPER_PASSWORD;
const BASE_URL = "https://buyapercetakan.mdthoster.com/il/";
if (!process.env.SCRAPER_API_KEY) throw new Error("SCRAPER_API_KEY env tidak diset");
const API_KEY = process.env.SCRAPER_API_KEY;

// Helper to format date object to DD-MM-YYYY
function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

function parseNumber(val: unknown): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  try {
    const s = String(val).replace(/,/g, "");
    return isNaN(parseFloat(s)) ? 0 : parseFloat(s);
  } catch {
    return 0;
  }
}

type SaldoRecord = Record<string, unknown>;

async function markProgress(payload: Record<string, unknown>) {
  await db.execute({
    sql: `INSERT INTO system_settings (key, value, updated_at) VALUES ('saldo_scrape_progress', ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
    args: [JSON.stringify(payload)],
  });
}

// GET /api/scrape-saldo-barang?tgl=YYYY-MM-DD
// Scrape posisi saldo barang Digit (v1/stk/r_brg_s/gr1, bsearch.stgl tunggal).
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    if (searchParams.get("progress") === "1") {
      const gate = await requireApiPermission('stok_saldo_barang');
      if (gate.error) return gate.error;
      const r = await db.execute({ sql: `SELECT value FROM system_settings WHERE key = 'saldo_scrape_progress'` });
      const raw = (r.rows[0] as Record<string, unknown> | undefined)?.value as string | undefined;
      let prog: Record<string, unknown> | null = null;
      try { prog = raw ? JSON.parse(String(raw)) : null; } catch { prog = null; }
      return NextResponse.json({ success: true, progress: prog }, { headers: { "Cache-Control": "no-store" } });
    }
    let tglParam = searchParams.get("tgl");
    if (!tglParam) tglParam = new Date().toISOString().split("T")[0];

    const tglDate = new Date(tglParam);
    if (isNaN(tglDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    const gate = await requireApiPermission('stok_saldo_barang');
    if (gate.error) return gate.error;
    const cookies = await getScraperSession(async () => {
      const loginReqUrl = BASE_URL + "v1/auth/login";
      const loginBody = JSON.stringify({ username: API_EMAIL, password: API_PASSWORD });
      const loginRes = await fetch(loginReqUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json; charset=utf-8",
          "X-Bismillah-Api-Key": API_KEY,
        },
        body: loginBody,
      });
      return loginRes.headers.get("set-cookie");
    });

    if (!cookies) {
      return NextResponse.json({ error: "Failed to login. No cookies returned." }, { status: 401 });
    }

     const stgl = formatDate(tglDate);
     const PAGE_LIMIT = 2000;
     const MAX_PAGES = 50; // ponytail: batas anti-hang; 50x2000 = 100rb baris, jauh di atas volume riil (~13rb)
     const rawRecords: SaldoRecord[] = [];
     let offset = 0;
     let truncated = false;
     for (let pageNum = 0; pageNum < MAX_PAGES; pageNum++) {
       const reqData = { limit: PAGE_LIMIT, offset, bsearch: { stgl, skondisi_stok: "" } };
       const reqJson = encodeURIComponent(JSON.stringify(reqData));
       const dataUrl = BASE_URL + "v1/stk/r_brg_s/gr1?request=" + reqJson;
       const res = await fetch(dataUrl, {
         method: "GET",
         headers: {
           Accept: "application/json; charset=utf-8",
           "X-Bismillah-Api-Key": API_KEY,
           Cookie: cookies,
         },
       });
       if (res.status === 401) {
         clearCachedSession();
         return NextResponse.json({ error: "Unauthorized. Session may have expired." }, { status: 401 });
       }
       const jsonData = await res.json();
       const page: SaldoRecord[] = jsonData.records || jsonData.data || jsonData.rows || jsonData.result || [];
       rawRecords.push(...page);
       await markProgress({ tgl: tglParam, page: pageNum + 1, fetched: rawRecords.length, done: false, at: new Date().toISOString() });
       if (page.length < PAGE_LIMIT) break;
       offset += PAGE_LIMIT;
       if (pageNum === MAX_PAGES - 1) truncated = true;
     }

     const cleanRows: unknown[][] = [];
     for (const r of rawRecords) {
       const kode = String(r.kode || "").trim();
       if (!kode || kode.toLowerCase() === "total") continue;
       cleanRows.push([
         kode, tglParam, String(r.nama || "").trim(), String(r.kd_satuan || ""),
         parseNumber(r.saldo), String(r.kd_golongan || ""), String(r.kd_kelompok || ""),
         String(r.status || ""), parseNumber(r.n_persd), parseNumber(r.n_hp),
       ]);
     }
 
     // ponytail: multi-row upsert (bukan 1 statement/baris). Sub 50 baris x 10 kolom = 500 variabel, aman di bawah batas 999 SQLite/libSQL.
     const ROW_CHUNK = 500;
     for (let i = 0; i < cleanRows.length; i += ROW_CHUNK) {
       const chunk = cleanRows.slice(i, i + ROW_CHUNK);
       for (let j = 0; j < chunk.length; j += 50) {
         const sub = chunk.slice(j, j + 50);
         const placeholders = sub.map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).join(',');
         await db.execute({
           sql: `INSERT INTO saldo_barang (kode, tgl, nama, kd_satuan, saldo, kd_golongan, kd_kelompok, status, n_persd, n_hp)
                 VALUES ${placeholders}
                 ON CONFLICT(kode, tgl) DO UPDATE SET
                   nama = excluded.nama, kd_satuan = excluded.kd_satuan, saldo = excluded.saldo,
                   kd_golongan = excluded.kd_golongan, kd_kelompok = excluded.kd_kelompok,
                   status = excluded.status, n_persd = excluded.n_persd, n_hp = excluded.n_hp`,
           args: sub.flat(),
         });
       }
     }
 
     const lastUpdated = new Date().toISOString();
     await db.batch([{
       sql: `INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
       args: ['last_scrape_saldo_barang', `${lastUpdated}|${tglParam}`],
     }] as never, "write");
 
     setCachedSession(cookies);
     await markProgress({ tgl: tglParam, page: -1, fetched: cleanRows.length, done: true, at: new Date().toISOString() });
     await logActivity('SCRAPE', 'saldo_barang', `Scrape saldo barang berhasil: ${cleanRows.length} baris (tgl ${stgl})${truncated ? ' [terpotong 50 page]' : ''}.`, { total: cleanRows.length, tgl: tglParam, truncated });
 
     return NextResponse.json({ success: true, total: cleanRows.length, tgl: tglParam, lastUpdated, truncated }, {
       headers: { "Cache-Control": "no-store, max-age=0" }
     });
   } catch (error: unknown) {
     console.error("Scraping error:", error);
     try { await markProgress({ page: -1, fetched: 0, done: true, error: getErrorMessage(error), at: new Date().toISOString() }); } catch { /* abaikan */ }
     return NextResponse.json({ error: "Failed to scrape data", details: getErrorMessage(error) }, { status: 500 });
   }
}
