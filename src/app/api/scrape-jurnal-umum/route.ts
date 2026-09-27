import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getErrorMessage } from "@/lib/api-utils";
import { ScrapedRecord, BatchOperation } from "@/lib/scraper-utils";
import { clearCachedSession, getSession as getScraperSession } from "@/lib/session-cache";
import { encodeScrapedPeriod, getScrapedPeriodSettingKey } from "@/lib/server-scraped-period";
import { logActivity } from "@/lib/activity";
import { ensureJurnalUmumSchema } from "@/lib/jurnal-umum-schema";
import type { JurnalUmumExecutor } from "@/lib/jurnal-umum-schema";

export const dynamic = 'force-dynamic';

const API_EMAIL = process.env.SCRAPER_EMAIL || "nauval";
if (!process.env.SCRAPER_PASSWORD) throw new Error("SCRAPER_PASSWORD env tidak diset");
const API_PASSWORD = process.env.SCRAPER_PASSWORD;
const BASE_URL = "https://buyapercetakan.mdthoster.com/il/";
if (!process.env.SCRAPER_API_KEY) throw new Error("SCRAPER_API_KEY env tidak diset");
const API_KEY = process.env.SCRAPER_API_KEY;

function formatIndoDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return d + "-" + m + "-" + y;
}

function normalizeDate(raw: string): string {
  if (!raw) return "";
  const parts = raw.split(/[-/]/);
  if (parts.length !== 3) return raw;
  const d = parts[0].padStart(2, "0");
  const m = parts[1].padStart(2, "0");
  let y = parts[2];
  if (y.length === 2) y = "20" + y;
  return y + "-" + m + "-" + d;
}

async function ensureTable() {
  const executor = (db as unknown as { client?: JurnalUmumExecutor }).client || db;
  if (!executor.execute) return;
  await ensureJurnalUmumSchema(executor as unknown as JurnalUmumExecutor);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    if (!startParam || !endParam) {
      return NextResponse.json({ success: false, error: "Start and end dates are required" }, { status: 400 });
    }

    const startDate = new Date(startParam);
    const endDate = new Date(endParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    await ensureTable();

    const cookies = await getScraperSession(async () => {
      const loginRes = await fetch(BASE_URL + "v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Bismillah-Api-Key": API_KEY,
        },
        body: JSON.stringify({ username: API_EMAIL, password: API_PASSWORD }),
      });
      return loginRes.ok ? loginRes.headers.get("set-cookie") : null;
    });

    if (!cookies) {
      return NextResponse.json({ error: "Failed to login to Digit." }, { status: 401 });
    }

    const startStr = formatIndoDate(startDate);
    const endStr = formatIndoDate(endDate);

    const metaStart = searchParams.get("metaStart") || startStr;
    const metaEnd = searchParams.get("metaEnd") || endStr;

    const payload = {
      limit: 5000,
      offset: 0,
      bsearch: {
        stgl_awal: startStr,
        stgl_akhir: endStr,
      }
    };

    const reqJson = encodeURIComponent(JSON.stringify(payload));
    const dataUrl = BASE_URL + "v1/akt/r_jurnal/gr1?request=" + reqJson;

    const res = await fetch(dataUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json, text/plain, */*",
        "X-Bismillah-Api-Key": API_KEY,
        "Cookie": cookies
      }
    });

    if (res.status === 401) {
      clearCachedSession();
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    if (!res.ok) throw new Error("Digit API Error: " + res.status);

    const resultJson = await res.json();
    const rows = resultJson.data || resultJson.records || [];

    if (rows.length === 0) {
      return NextResponse.json({ success: true, total: 0 });
    }

    const insertSql = `
      INSERT INTO jurnal_umum (
        faktur, tgl, rekening, keterangan, debit, kredit,
        username, create_at, parent_faktur, is_child, child_order, raw_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(faktur, child_order, is_child) DO UPDATE SET
        tgl=excluded.tgl,
        rekening=excluded.rekening,
        keterangan=excluded.keterangan,
        debit=excluded.debit,
        kredit=excluded.kredit,
        username=excluded.username,
        create_at=excluded.create_at,
        parent_faktur=excluded.parent_faktur,
        raw_data=excluded.raw_data
    `;

    const queries: { sql: string; args: (string | number)[] }[] = [];
    const seenFaktur = new Set<string>();
    const resetDone = new Set<string>();

    for (const r of rows) {
      const fakturKey: string = r.faktur || "";
      seenFaktur.add(fakturKey);
      queries.push({
        sql: insertSql,
        args: [
          fakturKey,
          normalizeDate(r.tgl || ""),
          r.rekening || "",
          r.keterangan || "",
          parseFloat(String(r.debit || "0").replace(/,/g, "")) || 0,
          parseFloat(String(r.kredit || "0").replace(/,/g, "")) || 0,
          r.username || "",
          r.create_at || "",
          "",
          0,
          0,
          JSON.stringify(r)
        ]
      });

      // Kumpulkan faktur unik saja; reset anak di-batch terpisah di bawah.
      resetDone.add(fakturKey);

      const children: { rekening?: string; keterangan?: string; debit?: string | number; kredit?: string | number; username?: string }[] = r.w2ui?.children || [];
      children.forEach((child, ci) => {
        queries.push({
          sql: insertSql,
          args: [
            fakturKey,
            normalizeDate(r.tgl || ""),
            child.rekening || "",
            child.keterangan || "",
            parseFloat(String(child.debit || "0").replace(/,/g, "")) || 0,
            parseFloat(String(child.kredit || "0").replace(/,/g, "")) || 0,
            child.username || "",
            r.create_at || "",
            fakturKey,
            1,
            ci + 1,
            JSON.stringify(child)
          ]
        });
      });
    }

    // Reset baris anak per faktur SEBELUM upsert. child_order di Digit itu
    // posisional (ci+1): saat voucher dikoreksi di sumber (baris
    // berkurang/bergeser), upsert posisional menyisakan ekor yatim. Kasus
    // nyata: PH00126080800012 sisa 1 baris Kas Besar Rp365rb.
    const delChildSize = 200;
    const resetList = [...resetDone];
    for (let i = 0; i < resetList.length; i += delChildSize) {
      const chunk = resetList.slice(i, i + delChildSize);
      const placeholders = chunk.map(() => "?").join(",");
      await db.execute({
        sql: `DELETE FROM jurnal_umum WHERE is_child = 1 AND parent_faktur IN (${placeholders})`,
        args: chunk,
      });
    }

    const chunkSize = 500;
    for (let i = 0; i < queries.length; i += chunkSize) {
      await db.batch(queries.slice(i, i + chunkSize));
    }

    // Hapus voucher yang sudah tidak ada di Digit pada rentang ini. Tanpa
    // ini, faktur yang dihapus di sumber tetap abadi di SINTAK (upsert-only).
    // Kasus nyata: PD00126083000006 dan PJ00126081800016.
    // Dilewati bila respons menyentuh limit (data mungkin terpotong).
    if (rows.length < 5000 && startParam && endParam) {
      const rangeStart: string = startParam;
      const rangeEnd: string = endParam;
      const existingRes = await db.execute({
        sql: `SELECT DISTINCT faktur FROM jurnal_umum WHERE tgl BETWEEN ? AND ?`,
        args: [rangeStart, rangeEnd],
      });
      const gone: string[] = [];
      for (const row of existingRes.rows) {
        if (row && typeof row === "object" && "faktur" in row) {
          const f = row.faktur;
          if (typeof f === "string" && f !== "" && !seenFaktur.has(f)) gone.push(f);
        }
      }
      const delSize = 200;
      for (let i = 0; i < gone.length; i += delSize) {
        const chunk = gone.slice(i, i + delSize);
        const placeholders = chunk.map(() => "?").join(",");
        await db.execute({
          sql: `DELETE FROM jurnal_umum WHERE faktur IN (${placeholders}) AND tgl BETWEEN ? AND ?`,
          args: [...chunk, rangeStart, rangeEnd],
        });
      }
    }

    const lastUpdated = new Date().toISOString();
    await db.batch([
      {
        sql: `INSERT INTO system_settings (key, value, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        args: ["last_scrape_jurnal_umum", lastUpdated]
      },
      {
        sql: `INSERT INTO system_settings (key, value, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        args: [getScrapedPeriodSettingKey("last_scrape_jurnal_umum"), encodeScrapedPeriod({ start: metaStart, end: metaEnd })]
      }
    ], "write");

    // Catat aktivitas scraping ke activity_logs
    const silent = searchParams.get('silent') === 'true';
    if (!silent) {
      await logActivity(
        'SCRAPE',
        'jurnal_umum',
        `Scrape jurnal umum berhasil: ${rows.length} baris (${metaStart} - ${metaEnd}).`,
        { total: rows.length, start: metaStart, end: metaEnd, scrapedPeriod: { start: metaStart, end: metaEnd } }
      );
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      lastUpdated,
      scrapedPeriod: { start: metaStart, end: metaEnd }
    });

  } catch (error: any) {
    console.error("Scrape API Error (jurnal-umum):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

