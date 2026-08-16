import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jenis = searchParams.get("jenis");
    const bahan = searchParams.get("bahan");
    const ukuran = searchParams.get("ukuran");

    let query = "SELECT * FROM pricelist_items WHERE 1=1";
    const params: any[] = [];

    if (jenis) {
      query += " AND jenis_kalender = ?";
      params.push(jenis);
    }
    if (bahan) {
      query += " AND bahan = ?";
      params.push(bahan);
    }
    if (ukuran) {
      query += " AND ukuran = ?";
      params.push(ukuran);
    }

    query += " ORDER BY id ASC";

    const rows = await db.execute({ sql: query, args: params });

    const lastUploadRes = await db.execute({
      sql: "SELECT strftime('%Y-%m-%dT%H:%M:%SZ', created_at) as lastExcelUpdate, message, raw_data FROM activity_logs WHERE table_name = 'pricelist_items' AND action_type = 'UPLOAD' ORDER BY id DESC LIMIT 1",
      args: []
    });

    const lastUpload = lastUploadRes.rows?.[0] || null;
    let fileName = '';
    if (lastUpload?.raw_data) {
      try {
        const raw = JSON.parse(lastUpload.raw_data as string);
        fileName = raw.filename || '';
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      data: rows.rows || [],
      lastExcelUpdate: lastUpload?.lastExcelUpdate || null,
      fileName: fileName || null,
      lastMessage: lastUpload?.message || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data pricelist." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { filename, records, title, lastUpdatedDate, notes } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada data pricelist yang valid ditemukan." },
        { status: 400 }
      );
    }

    // Delete existing records and insert new records
    await db.execute("DELETE FROM pricelist_items");

    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const stmts = batch.map((r: any) => ({
        sql: `INSERT INTO pricelist_items (
          jenis_kalender, oplah, proses, bahan, ukuran,
          hpp, harga, harga_nego, profit_pct, profit_pct_nego,
          profit_tot, profit_tot_nego
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          r.jenis_kalender,
          r.oplah,
          r.proses,
          r.bahan,
          r.ukuran,
          r.hpp,
          r.harga,
          r.harga_nego,
          r.profit_pct,
          r.profit_pct_nego,
          r.profit_tot,
          r.profit_tot_nego,
        ],
      }));
      await db.batch(stmts, "write");
    }

    const recordedBy = session.username || "System";
    const logMsg = `Upload ${records.length} item pricelist dari file Excel: ${filename || 'Pricelist Kalender'}`;
    await db.execute({
      sql: "INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) VALUES (?, ?, ?, ?, ?, ?)",
      args: ['UPLOAD', 'pricelist_items', '0', logMsg, JSON.stringify({ filename, title, lastUpdatedDate, notesCount: notes?.length || 0 }), recordedBy]
    });

    return NextResponse.json({
      success: true,
      imported: records.length,
      message: `Berhasil mengimpor ${records.length} item pricelist.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan data pricelist." },
      { status: 500 }
    );
  }
}
