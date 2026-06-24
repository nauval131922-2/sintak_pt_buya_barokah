import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import db from "@/lib/db";
import { getErrorMessage } from "@/lib/api-utils";
import { ScrapedRecord, BatchOperation } from "@/lib/scraper-utils";
import { getCachedSession, setCachedSession, clearCachedSession, getSession as getScraperSession } from "@/lib/session-cache";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";

const API_EMAIL = process.env.SCRAPER_EMAIL || "nauval";
if (!process.env.SCRAPER_PASSWORD) throw new Error("SCRAPER_PASSWORD env tidak diset");
const API_PASSWORD = process.env.SCRAPER_PASSWORD;
const BASE_URL = "https://buyapercetakan.mdthoster.com/il/";
if (!process.env.SCRAPER_API_KEY) throw new Error("SCRAPER_API_KEY env tidak diset");
const API_KEY = process.env.SCRAPER_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const currentUserSession = await getSession();
    
    let cookies = await getScraperSession(async () => {
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

    // Pagination loop — ambil semua data sampai habis
    const PAGE_LIMIT = 2000;
    const rawRecords: any[] = [];
    let offset = 0;

    while (true) {
      const reqData = {
        limit: PAGE_LIMIT,
        offset,
        bsearch: { sroyalti: "" },
      };

      const reqJson = encodeURIComponent(JSON.stringify(reqData));
      const dataUrl = BASE_URL + "v1/stk/mbrg/gr1?request=" + reqJson;

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
      const page = jsonData.records || jsonData.data || jsonData.rows || jsonData.result || [];
      rawRecords.push(...page);

      // Berhenti kalau sudah halaman terakhir
      if (page.length < PAGE_LIMIT) break;
      offset += PAGE_LIMIT;
    }

    const parseNumber = (val: any) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      try {
        return parseFloat(String(val).replace(/,/g, "")) || 0;
      } catch {
        return 0;
      }
    };

    const finalRecords = rawRecords.map((r: any) => {
      return {
        ...r,
        berat_kg: parseNumber(r.berat_kg),
        saldo: parseNumber(r.saldo),
        qty_order: parseNumber(r.qty_order),
        ppn: parseNumber(r.ppn),
      };
    });
    
    // Prepare batch inserts — gunakan multi-row VALUES untuk minimasi round-trip
    const COLS = [
      'kode', 'barcode', 'nama', 'kd_satuan', 'spesifikasi', 'berat_kg',
      'kd_golongan', 'kd_kelompok', 'tampil', 'prd_std', 'saldo',
      'qty_order', 'hj_ppn', 'ppn', 'status', 'pj_hide', 'royalti',
      'create_at', 'updated_at', 'username', 'recid', 'raw_data'
    ];
    const MARKER = `(${COLS.map(() => '?').join(', ')})`;
    const UPDATE_SET = COLS.filter(c => c !== 'kode').map(c =>
      `${c} = excluded.${c}`
    ).join(', ') + ', fetched_at = CURRENT_TIMESTAMP';

    const validRecords = finalRecords.filter((r: any) => r.kode);

    // Bangun args per record
    const recordArgs = (r: any) => [
      r.kode || '',
      r.barcode || '',
      r.nama || '',
      r.kd_satuan || '',
      r.spesifikasi || '',
      r.berat_kg || 0,
      r.kd_golongan || '',
      r.kd_kelompok || '',
      r.tampil || '',
      r.prd_std || '',
      r.saldo || 0,
      r.qty_order || 0,
      r.hj_ppn || '',
      r.ppn || 0,
      r.status || '',
      r.pj_hide || '',
      r.royalti || '',
      r.create_at || null,
      r.updated_at || null,
      r.username || '',
      r.recid || '',
      null, // raw_data tidak disimpan untuk hemat storage
    ];

    // Kelompokkan per 200 record per statement, lalu jalankan semua PARALEL
    const CHUNK = 200;
    const batchStmts: { sql: string; args: any[] }[] = [];
    for (let i = 0; i < validRecords.length; i += CHUNK) {
      const chunk = validRecords.slice(i, i + CHUNK);
      const allMarkers = chunk.map(() => MARKER).join(', ');
      const allArgs = chunk.flatMap(recordArgs);
      batchStmts.push({
        sql: `INSERT INTO stok_master_barang (${COLS.join(', ')}) VALUES ${allMarkers}
              ON CONFLICT(kode) DO UPDATE SET ${UPDATE_SET}`,
        args: allArgs,
      });
    }

    // Jalankan semua chunk paralel (libSQL batch per statement)
    await Promise.all(batchStmts.map(stmt => db.execute(stmt)));

    const lastUpdated = new Date().toISOString();
    const finalOps = [
      {
        sql: `
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `,
        args: ['last_scrape_master_barang', lastUpdated]
      }
    ];

    await db.batch(finalOps, "write");

    await logActivity(
      'SCRAPE',
      'stok_master_barang',
      `Scrape master barang berhasil: ${validRecords.length} item.`,
      { total: validRecords.length }
    );

    return NextResponse.json({
      success: true,
      total: finalRecords.length,
      data: finalRecords,
      lastUpdated
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });

  } catch (error: any) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { error: "Failed to scrape data", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

