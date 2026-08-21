import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import db from "@/lib/db";
import { clearCachedSession, getSession as getScraperSession } from "@/lib/session-cache";
import { encodeScrapedPeriod, getScrapedPeriodSettingKey } from "@/lib/server-scraped-period";
import { logActivity } from "@/lib/activity";
import { getErrorMessage } from "@/lib/api-utils";
import { ScrapedRecord, BatchOperation } from "@/lib/scraper-utils";

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
    let startParam = searchParams.get("start");
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
    
    const cookies = await getScraperSession(async () => {
      const loginReqUrl = BASE_URL + "v1/auth/login";
      const loginBody = JSON.stringify({
        username: API_EMAIL,
        password: API_PASSWORD,
      });

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

    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    // Support custom metadata period (useful for chunked requests)
    const metaStart = searchParams.get("metaStart") || startStr;
    const metaEnd = searchParams.get("metaEnd") || endStr;
    
    const reqData = {
      limit: 10000,
      offset: 0,
      bsearch: {
        stgl_awal: startStr,
        stgl_akhir: endStr,
        ppn: "semua",
        skondisi_diskon: "semua",
      },
    };

    const reqJson = encodeURIComponent(JSON.stringify(reqData));
    const dataUrl = BASE_URL + "v1/pj/r_jual_rkp/gr1?request=" + reqJson;

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
    const rawRecords = jsonData.records || jsonData.data || jsonData.rows || jsonData.result || [];
    
    const allRecords = rawRecords.filter((r: ScrapedRecord) => 
        String(r.kd_barang || "").toLowerCase().trim() !== "total"
    );

    // ponytail: ensure recid column and unique index exist defensively
    try {
      await db.execute(`ALTER TABLE sales_reports ADD COLUMN recid TEXT;`);
    } catch {}
    try {
      await db.execute(`UPDATE sales_reports SET recid = json_extract(raw_data, '$.recid') WHERE (recid IS NULL OR recid = '') AND raw_data LIKE '{%' AND json_extract(raw_data, '$.recid') IS NOT NULL;`);
      await db.execute(`UPDATE sales_reports SET recid = 'legacy_' || id WHERE (recid IS NULL OR recid = '');`);
      await db.execute(`DELETE FROM sales_reports WHERE id NOT IN (SELECT MAX(id) FROM sales_reports GROUP BY recid);`);
      await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_recid ON sales_reports(recid);`);
    } catch {}

    // ponytail: delete orphaned records for this date range that no longer exist in Digit
    const incomingRecids = allRecords.map((r: ScrapedRecord) => String(r.recid || r.id || '')).filter(Boolean);
    if (incomingRecids.length > 0) {
      const placeholders = incomingRecids.map(() => '?').join(',');
      await db.execute({
        sql: `
          DELETE FROM sales_reports 
          WHERE (substr(tgl,7,4)||'-'||substr(tgl,4,2)||'-'||substr(tgl,1,2)) BETWEEN ? AND ?
            AND recid NOT IN (${placeholders})
        `,
        args: [startParam, endParam, ...incomingRecids]
      });
    }

    // 1. Prepare batch inserts
    const batchOps: BatchOperation[] = [];
    for (const record of allRecords) {
      const rRecid = String(record.recid || record.id || '');
      batchOps.push({
        sql: `
          INSERT INTO sales_reports (
            faktur, kd_pelanggan, tgl, kd_barang, faktur_so, 
            jthtmp, harga, qty, jumlah, ppn, 
            faktur_prd, nama_prd, no_ref_pelanggan, nama_pelanggan, dati_2, 
            gol_barang, keterangan_so, recid, raw_data
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(recid) DO UPDATE SET
            faktur = excluded.faktur,
            kd_pelanggan = excluded.kd_pelanggan,
            tgl = excluded.tgl,
            kd_barang = excluded.kd_barang,
            faktur_so = excluded.faktur_so,
            jthtmp = excluded.jthtmp,
            harga = excluded.harga,
            qty = excluded.qty,
            jumlah = excluded.jumlah,
            ppn = excluded.ppn,
            faktur_prd = excluded.faktur_prd,
            nama_prd = excluded.nama_prd,
            no_ref_pelanggan = excluded.no_ref_pelanggan,
            nama_pelanggan = excluded.nama_pelanggan,
            dati_2 = excluded.dati_2,
            gol_barang = excluded.gol_barang,
            keterangan_so = excluded.keterangan_so,
            raw_data = excluded.raw_data
        `,
        args: [
          record.faktur || '',
          record.kd_pelanggan || '',
          record.tgl || '',
          record.kd_barang || '',
          record.faktur_so || '',
          record.jthtmp || '',
          parseFloat(record.harga || "0") || 0,
          parseFloat(record.qty || "0") || 0,
          parseFloat(record.jumlah || "0") || 0,
          parseFloat(record.ppn || "0") || 0,
          record.faktur_prd || '',
          record.nama_prd || '',
          record.no_ref_pelanggan || '',
          record.nama_pelanggan || '',
          record.dati_2 || '',
          record.gol_barang || '',
          record.keterangan_so || '',
          rRecid,
          JSON.stringify(record)
        ]
      });
    }

    const chunkSize = 100;
    for (let i = 0; i < batchOps.length; i += chunkSize) {
      await db.batch(batchOps.slice(i, i + chunkSize), "write");
    }

    const lastUpdated = new Date().toISOString();
    const finalOps = [
      {
        sql: `
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `,
        args: ['last_scrape_sales', lastUpdated]
      },
      {
        sql: `
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `,
        args: [getScrapedPeriodSettingKey('last_scrape_sales'), encodeScrapedPeriod({ start: metaStart, end: metaEnd })]
      }
    ];

    await db.batch(finalOps, "write");

    const isSilent = searchParams.get('silent') === 'true';
    if (!isSilent) {
      await logActivity(
        "SCRAPE",
        "sales_reports",
        `Scrape laporan penjualan berhasil: ${allRecords.length} baris (${metaStart} - ${metaEnd}).`,
        { total: allRecords.length, start: metaStart, end: metaEnd, scrapedPeriod: { start: metaStart, end: metaEnd } }
      );
    }

    return NextResponse.json({
      success: true,
      total: allRecords.length,
      newly_inserted: 0,
      lastUpdated,
      scrapedPeriod: { start: metaStart, end: metaEnd }
    });

  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
