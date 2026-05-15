import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { buildFtsQuery } from "@/lib/fts";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const unionBase = `
      SELECT
        h.id,
        h.nama_order,
        h.hpp_kalkulasi,
        h.keterangan,
        MAX(substr(o.tgl,7,4)||substr(o.tgl,4,2)||substr(o.tgl,1,2)) AS sort_tgl
      FROM hpp_kalkulasi h
      LEFT JOIN orders o ON o.nama_prd = h.nama_order
      GROUP BY h.id

      UNION ALL

      SELECT
        NULL AS id,
        o.nama_prd AS nama_order,
        0 AS hpp_kalkulasi,
        NULL AS keterangan,
        MAX(substr(o.tgl,7,4)||substr(o.tgl,4,2)||substr(o.tgl,1,2)) AS sort_tgl
      FROM orders o
      WHERE NOT EXISTS (
        SELECT 1 FROM hpp_kalkulasi h2 WHERE h2.nama_order = o.nama_prd
      )
      GROUP BY o.nama_prd
    `;

    const ORDER_BY = `ORDER BY
      CASE WHEN sort_tgl IS NULL THEN 1 ELSE 0 END,
      sort_tgl DESC,
      nama_order ASC`;

    let sqlData: string;
    let sqlTotal: string;
    let argsData: any[] = [];
    let argsTotal: any[] = [];

    if (search) {
      const qPattern = `%${search}%`;
      sqlData  = `SELECT id, nama_order, hpp_kalkulasi, keterangan FROM (${unionBase}) WHERE (nama_order LIKE ? OR keterangan LIKE ?) ${ORDER_BY} LIMIT ? OFFSET ?`;
      sqlTotal = `SELECT COUNT(*) as count FROM (${unionBase}) WHERE (nama_order LIKE ? OR keterangan LIKE ?)`;
      argsData  = [qPattern, qPattern, limit, offset];
      argsTotal = [qPattern, qPattern];
    } else {
      sqlData  = `SELECT id, nama_order, hpp_kalkulasi, keterangan FROM (${unionBase}) ${ORDER_BY} LIMIT ? OFFSET ?`;
      sqlTotal = `SELECT COUNT(*) as count FROM (${unionBase})`;
      argsData  = [limit, offset];
      argsTotal = [];
    }

    const batchResults = await db.batch([
      { sql: sqlData,  args: argsData  },
      { sql: sqlTotal, args: argsTotal },
      { sql: "SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastExcelUpdate FROM activity_logs WHERE table_name = 'hpp_kalkulasi' AND action_type = 'UPLOAD'", args: [] },
      { sql: "SELECT value FROM system_settings WHERE key = 'last_scrape_hpp_kalkulasi'", args: [] }
    ], "read");

    const data  = batchResults[0].rows;
    const total = Number((batchResults[1].rows[0] as any).count);
    const lastExcelUpdate = (batchResults[2].rows[0] as any)?.lastExcelUpdate || null;
    const lastUpdated = (batchResults[3].rows[0] as any)?.value || null;

    return NextResponse.json({ success: true, data, total, page, limit, lastExcelUpdate, lastUpdated });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { filename, data: rawData } = await request.json();

    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
       return NextResponse.json({ error: "Data Excel kosong atau format tidak sesuai." }, { status: 400 });
    }

    const batchOps: any[] = [];

    let importedCount = 0;
    for (const row of rawData) {
      let namaOrder = '';
      let hppValue = 0;
      let keterangan = '';

      for (const key of Object.keys(row)) {
        const lowerKey = key.toLowerCase().trim();
        const rawVal = row[key];

        if (lowerKey.includes('nama order')) {
          namaOrder = String(rawVal || '').trim();
        } else if (lowerKey.includes('hpp kalkulasi')) {
          if (typeof rawVal === 'number') {
            hppValue = rawVal;
          } else if (typeof rawVal === 'string') {
            let cleanVal = rawVal.trim().replace(/\s/g, '');
            if (cleanVal.includes(',') && cleanVal.includes('.')) {
                if (cleanVal.lastIndexOf(',') > cleanVal.lastIndexOf('.')) {
                    cleanVal = cleanVal.replace(/\./g, "").replace(",", ".");
                } else {
                    cleanVal = cleanVal.replace(/,/g, "");
                }
            } else if (cleanVal.includes(',')) {
                cleanVal = cleanVal.replace(',', '.');
            }
            hppValue = parseFloat(cleanVal) || 0;
          }
        } else if (lowerKey.includes('keterangan')) {
          keterangan = String(rawVal || '').trim();
        }
      }

      if (!namaOrder) continue;

      batchOps.push({
        sql: "INSERT INTO hpp_kalkulasi (nama_order, hpp_kalkulasi, keterangan) VALUES (?, ?, ?) ON CONFLICT(nama_order) DO UPDATE SET hpp_kalkulasi = excluded.hpp_kalkulasi, keterangan = COALESCE(excluded.keterangan, hpp_kalkulasi.keterangan)",
        args: [namaOrder, hppValue, keterangan || null]
      });
      importedCount++;
    }

    await db.batch(batchOps, "write");

    const session = await getSession();

    await db.execute({
      sql: "INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) VALUES (?, ?, ?, ?, ?, ?)",
      args: [
        'UPLOAD', 
        'hpp_kalkulasi', 
        0, 
        "Upsert HPP Kalkulasi dari Excel (" + importedCount + " data)", 
        JSON.stringify({ fileName: filename, imported: importedCount }),
        session?.username || 'System'
      ]
    });

    return NextResponse.json({
      success: true,
      message: "Berhasil upsert " + importedCount + " data HPP Kalkulasi (data lama yang tidak ada di Excel tetap tersimpan).",
      imported: importedCount
    });

  } catch (error: any) {
    console.error("Upload Excel Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses file Excel", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const id = body.id;
    const nama_order = typeof body.nama_order === 'string' ? body.nama_order.trim() : body.nama_order;
    const hpp_kalkulasi = body.hpp_kalkulasi;
    const keterangan = body.keterangan;

    if (!id && !nama_order) return NextResponse.json({ error: 'id atau nama_order diperlukan' }, { status: 400 });

    if (!id && nama_order) {
      await db.execute({
        sql: "INSERT INTO hpp_kalkulasi (nama_order, hpp_kalkulasi, keterangan) VALUES (?, 0, NULL) ON CONFLICT(nama_order) DO NOTHING",
        args: [nama_order],
      });
    }

    const whereClause = id ? "WHERE id = ?" : "WHERE nama_order = ?";
    const whereArg = id ? id : nama_order;

    if (hpp_kalkulasi !== undefined) {
      let val: any = hpp_kalkulasi;
      if (hpp_kalkulasi === '' || hpp_kalkulasi === null) {
        val = 0;
      } else {
        const clean = String(hpp_kalkulasi).replace(/\./g, '').replace(',', '.');
        const num = Number(clean);
        if (!isNaN(num)) val = num;
      }
      await db.execute({
        sql: "UPDATE hpp_kalkulasi SET hpp_kalkulasi = ? " + whereClause,
        args: [val, whereArg],
      });
      const row = await db.execute({ sql: "SELECT id FROM hpp_kalkulasi " + whereClause, args: [whereArg] });
      return NextResponse.json({ success: true, id: row.rows[0]?.id ?? id, hpp_kalkulasi: val });
    }

    if (keterangan !== undefined) {
      await db.execute({
        sql: "UPDATE hpp_kalkulasi SET keterangan = ? " + whereClause,
        args: [keterangan || null, whereArg],
      });
      const row = await db.execute({ sql: "SELECT id FROM hpp_kalkulasi " + whereClause, args: [whereArg] });
      return NextResponse.json({ success: true, id: row.rows[0]?.id ?? id, keterangan });
    }

    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await db.execute({ sql: 'DELETE FROM hpp_kalkulasi', args: [] });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}