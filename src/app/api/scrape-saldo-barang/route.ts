import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import db from "@/lib/db";
import { getErrorMessage } from "@/lib/api-utils";
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

// GET /api/scrape-saldo-barang?tgl=YYYY-MM-DD
// Scrape posisi saldo barang Digit (v1/stk/r_brg_s/gr1, bsearch.stgl tunggal).
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let tglParam = searchParams.get("tgl");
    if (!tglParam) tglParam = new Date().toISOString().split("T")[0];

    const tglDate = new Date(tglParam);
    if (isNaN(tglDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    await getSession();
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
    const rawRecords: SaldoRecord[] = [];
    let offset = 0;

    while (true) {
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
      if (page.length < PAGE_LIMIT) break;
      offset += PAGE_LIMIT;
    }

    const batchOps: { sql: string; args: unknown[] }[] = [];
    for (const r of rawRecords) {
      const kode = String(r.kode || "").trim();
      if (!kode || kode.toLowerCase() === "total") continue;
      batchOps.push({
        sql: `INSERT INTO saldo_barang (kode, tgl, nama, kd_satuan, saldo, kd_golongan, kd_kelompok, status, n_persd, n_hp)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(kode, tgl) DO UPDATE SET
                nama = excluded.nama, kd_satuan = excluded.kd_satuan, saldo = excluded.saldo,
                kd_golongan = excluded.kd_golongan, kd_kelompok = excluded.kd_kelompok,
                status = excluded.status, n_persd = excluded.n_persd, n_hp = excluded.n_hp`,
        args: [
          kode, tglParam, String(r.nama || "").trim(), String(r.kd_satuan || ""),
          parseNumber(r.saldo), String(r.kd_golongan || ""), String(r.kd_kelompok || ""),
          String(r.status || ""), parseNumber(r.n_persd), parseNumber(r.n_hp),
        ],
      });
    }

    const chunkSize = 100;
    for (let i = 0; i < batchOps.length; i += chunkSize) {
      await db.batch(batchOps.slice(i, i + chunkSize) as never, "write");
    }

    const lastUpdated = new Date().toISOString();
    await db.batch([{
      sql: `INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      args: ['last_scrape_saldo_barang', `${lastUpdated}|${tglParam}`],
    }] as never, "write");

    setCachedSession(cookies);
    await logActivity('SCRAPE', 'saldo_barang', `Scrape saldo barang berhasil: ${batchOps.length} baris (tgl ${stgl}).`, { total: batchOps.length, tgl: tglParam });

    return NextResponse.json({ success: true, total: batchOps.length, tgl: tglParam, lastUpdated }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  } catch (error: unknown) {
    console.error("Scraping error:", error);
    return NextResponse.json({ error: "Failed to scrape data", details: getErrorMessage(error) }, { status: 500 });
  }
}
