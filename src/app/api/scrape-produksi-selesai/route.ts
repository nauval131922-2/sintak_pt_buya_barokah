import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import db from "@/lib/db";
import { getErrorMessage } from "@/lib/api-utils";
import { clearCachedSession, getSession as getScraperSession } from "@/lib/session-cache";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";

const API_EMAIL = process.env.SCRAPER_EMAIL || "nauval";
if (!process.env.SCRAPER_PASSWORD) throw new Error("SCRAPER_PASSWORD env tidak diset");
const API_PASSWORD = process.env.SCRAPER_PASSWORD;
const BASE_URL = "https://buyapercetakan.mdthoster.com/il/";
if (!process.env.SCRAPER_API_KEY) throw new Error("SCRAPER_API_KEY env tidak diset");
const API_KEY = process.env.SCRAPER_API_KEY;

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let startParam = searchParams.get("start"); // YYYY-MM-DD
    let endParam = searchParams.get("end");

    if (!startParam || !endParam) {
      const today = new Date();
      startParam = today.toISOString().split("T")[0];
      endParam = startParam;
    }

    const startDate = new Date(startParam);
    const endDate = new Date(endParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    // Range yang diminta user (untuk metadata & log)
    const startStr = formatDate(startDate);
    const endStr   = formatDate(endDate);
    const metaStart = searchParams.get("metaStart") || startStr;
    const metaEnd   = searchParams.get("metaEnd")   || endStr;

    // Perlebar request ke Digit mundur 60 hari dari startDate
    // karena filter Digit berdasarkan tgl (tanggal order), bukan tglclose (tanggal selesai)
    const fetchStart = new Date(startDate);
    fetchStart.setDate(fetchStart.getDate() - 60);
    const fetchStartStr = formatDate(fetchStart);
    // endDate tetap sama

    // Login / ambil session
    let cookies = await getScraperSession(async () => {
      const loginRes = await fetch(BASE_URL + "v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json; charset=utf-8",
          "X-Bismillah-Api-Key": API_KEY,
        },
        body: JSON.stringify({ username: API_EMAIL, password: API_PASSWORD }),
      });
      if (!loginRes.ok) return null;
      return loginRes.headers.get("set-cookie");
    });

    if (!cookies) {
      return NextResponse.json({ error: "Failed to login. No cookies returned." }, { status: 401 });
    }

    // Ambil data produksi selesai — pakai fetchStartStr (mundur 60 hari) agar
    // order yang dibuat sebelum range tapi selesai di dalam range ikut tertangkap
    const reqData = {
      limit: 10000,
      offset: 0,
      bsearch: {
        stgl_awal: fetchStartStr,
        stgl_akhir: endStr,
      },
    };

    const dataUrl = BASE_URL + "v1/prd/trprd_s/gr1?request=" + encodeURIComponent(JSON.stringify(reqData));

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

    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed with status ${res.status}` }, { status: res.status });
    }

    const jsonData = await res.json();
    const rawRecords: any[] = jsonData.records || jsonData.data || jsonData.rows || jsonData.result || [];

    const parseNum = (val: any): number => {
      if (!val) return 0;
      if (typeof val === "number") return val;
      return parseFloat(String(val).replace(/,/g, "")) || 0;
    };

    const validRecords = rawRecords.filter((r) => r.faktur);

    if (validRecords.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        lastUpdated: new Date().toISOString(),
        scrapedPeriod: { start: startStr, end: endStr },
      });
    }

    // Multi-row INSERT per 200 record — paralel
    const COLS = [
      "faktur", "faktur_bom", "faktur_so", "faktur_pb",
      "kd_cabang", "kd_gudang", "tgl", "kd_mtd", "kd_pelanggan", "nama_prd",
      "status", "perbaikan", "regu", "bbb", "pers_btkl", "btkl",
      "pers_bop", "bop", "hp", "datetime_mulai", "datetime_selesai",
      "fkt_selesai", "tglclose", "wip", "kd_regu",
      "created_at", "username", "edited_at", "username_edited", "recid",
    ];
    const MARKER = `(${COLS.map(() => "?").join(", ")})`;
    const UPDATE_SET = COLS.filter((c) => c !== "faktur")
      .map((c) => `${c} = excluded.${c}`)
      .join(", ") + ", fetched_at = CURRENT_TIMESTAMP";

    const rowArgs = (r: any) => [
      r.faktur || "",
      r.faktur_bom || "",
      r.faktur_so || "",
      r.faktur_pb || "",
      r.kd_cabang || "",
      r.kd_gudang || "",
      r.tgl || "",
      r.kd_mtd || "",
      r.kd_pelanggan || "",
      (r.nama_prd || "").trim(),
      r.status || "",
      r.perbaikan || "",
      r.regu || null,
      parseNum(r.bbb),
      parseNum(r.pers_btkl),
      parseNum(r.btkl),
      parseNum(r.pers_bop),
      parseNum(r.bop),
      parseNum(r.hp),
      r.datetime_mulai || null,
      r.datetime_selesai || null,
      r.fkt_selesai || "",
      r.tglclose || "",
      parseNum(r.wip),
      r.kd_regu || "",
      r.created_at || null,
      r.username || "",
      r.edited_at || null,
      r.username_edited || "",
      r.recid || "",
    ];

    const CHUNK = 200;
    const stmts: { sql: string; args: any[] }[] = [];
    for (let i = 0; i < validRecords.length; i += CHUNK) {
      const chunk = validRecords.slice(i, i + CHUNK);
      stmts.push({
        sql: `INSERT INTO produksi_selesai (${COLS.join(", ")}) VALUES ${chunk.map(() => MARKER).join(", ")}
              ON CONFLICT(faktur) DO UPDATE SET ${UPDATE_SET}`,
        args: chunk.flatMap(rowArgs),
      });
    }

    await Promise.all(stmts.map((s) => db.execute(s)));

    const lastUpdated = new Date().toISOString();

    // Update metadata — simpan juga period untuk ditampilkan di ScrapingHeader
    await db.batch([
      {
        sql: `INSERT INTO system_settings (key, value, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        args: ["last_scrape_produksi_selesai", lastUpdated],
      },
      {
        sql: `INSERT INTO system_settings (key, value, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        args: ["last_scrape_produksi_selesai_period", JSON.stringify({ start: metaStart, end: metaEnd })],
      },
    ], "write");

    const isSilent = searchParams.get("silent") === "true";
    if (!isSilent) {
      await logActivity(
        "SCRAPE",
        "produksi_selesai",
        `Scrape produksi selesai berhasil: ${validRecords.length} baris (${metaStart} - ${metaEnd}).`,
        { total: validRecords.length, start: metaStart, end: metaEnd }
      );
    }

    return NextResponse.json({
      success: true,
      total: validRecords.length,
      lastUpdated,
      scrapedPeriod: { start: startStr, end: endStr },
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });

  } catch (error: any) {
    console.error("Scrape produksi selesai error:", error);
    return NextResponse.json(
      { error: "Failed to scrape data", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
