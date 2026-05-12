import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import db from "@/lib/db";
import { getCachedSession, setCachedSession, clearCachedSession, getSession as getScraperSession } from "@/lib/session-cache";
import { getSession } from "@/lib/session";

const API_EMAIL = process.env.SCRAPER_EMAIL || "nauval";
const API_PASSWORD = process.env.SCRAPER_PASSWORD || "312admin2";
const BASE_URL = "https://buyapercetakan.mdthoster.com/il/";
const API_KEY = "bismillah-m377-4j76-bb34-c450-7a62-ad3f";

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

    const reqData = {
      limit: 5000,
      offset: 0,
      bsearch: {
        sroyalti: ""
      },
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
    const rawRecords = jsonData.records || jsonData.data || jsonData.rows || jsonData.result || [];

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
    
    // Prepare batch inserts
    const batchOps: any[] = [];
    for (const record of finalRecords) {
      if (!record.kode) continue;
      
      batchOps.push({
        sql: `
          INSERT INTO stok_master_barang (
            kode, barcode, nama, kd_satuan, spesifikasi, berat_kg, 
            kd_golongan, kd_kelompok, tampil, prd_std, saldo, 
            qty_order, hj_ppn, ppn, status, pj_hide, royalti, 
            create_at, updated_at, username, recid, raw_data
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(kode) DO UPDATE SET
            barcode = excluded.barcode,
            nama = excluded.nama,
            kd_satuan = excluded.kd_satuan,
            spesifikasi = excluded.spesifikasi,
            berat_kg = excluded.berat_kg,
            kd_golongan = excluded.kd_golongan,
            kd_kelompok = excluded.kd_kelompok,
            tampil = excluded.tampil,
            prd_std = excluded.prd_std,
            saldo = excluded.saldo,
            qty_order = excluded.qty_order,
            hj_ppn = excluded.hj_ppn,
            ppn = excluded.ppn,
            status = excluded.status,
            pj_hide = excluded.pj_hide,
            royalti = excluded.royalti,
            create_at = excluded.create_at,
            updated_at = excluded.updated_at,
            username = excluded.username,
            recid = excluded.recid,
            raw_data = excluded.raw_data,
            fetched_at = CURRENT_TIMESTAMP
        `,
        args: [
          record.kode || '',
          record.barcode || '',
          record.nama || '',
          record.kd_satuan || '',
          record.spesifikasi || '',
          record.berat_kg || 0,
          record.kd_golongan || '',
          record.kd_kelompok || '',
          record.tampil || '',
          record.prd_std || '',
          record.saldo || 0,
          record.qty_order || 0,
          record.hj_ppn || '',
          record.ppn || 0,
          record.status || '',
          record.pj_hide || '',
          record.royalti || '',
          record.create_at || null,
          record.updated_at || null,
          record.username || '',
          record.recid || '',
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
        args: ['last_scrape_master_barang', lastUpdated]
      }
    ];

    await db.batch(finalOps, "write");

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
      { error: "Failed to scrape data", details: error.message },
      { status: 500 }
    );
  }
}
