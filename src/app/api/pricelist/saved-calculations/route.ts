// ponytail: API route CRUD dan sync database untuk riwayat kalkulasi Pricelist
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET: Ambil daftar seluruh kalkulasi tersimpan dari database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = "SELECT * FROM pricelist_saved_calculations WHERE 1=1";
    const params: any[] = [];

    if (category && category !== "ALL") {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY updated_at DESC";

    const result = await db.execute({ sql: query, args: params });
    const rows = result.rows || [];

    const parsedItems = rows.map((r: any) => {
      let rawItem: any = {};
      let parsedSnapshot: any = null;
      try {
        rawItem = typeof r.data === "string" ? JSON.parse(r.data) : (r.data || {});
      } catch {
        rawItem = {};
      }
      try {
        parsedSnapshot =
          typeof r.params_snapshot === "string"
            ? JSON.parse(r.params_snapshot)
            : r.params_snapshot;
      } catch {
        parsedSnapshot = r.params_snapshot;
      }

      return {
        id: r.id,
        category: r.category,
        title: r.title,
        oplah: r.oplah || rawItem.oplah || rawItem.data?.input?.oplah || 0,
        savedAt: r.created_at || r.updated_at,
        paramsSnapshot: parsedSnapshot || rawItem.paramsSnapshot || rawItem.customParams,
        ...rawItem,
        data: rawItem.data || rawItem,
        userId: r.user_id,
        createdBy: r.created_by,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: parsedItems,
      count: parsedItems.length,
    });
  } catch (error: any) {
    console.error("GET /api/pricelist/saved-calculations error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch saved calculations" },
      { status: 500 }
    );
  }
}

// POST: Simpan kalkulasi baru atau lakukan batch sync dari client
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.userId || null;
    const userName = session?.name || session?.username || "Staff";

    const body = await request.json();

    // Handle batch sync
    if (Array.isArray(body.items)) {
      const items = body.items;
      for (const item of items) {
        if (!item.id || !item.category || !item.title) continue;

        const dataStr = typeof item === "string" ? item : JSON.stringify(item);
        const snapshotStr = item.paramsSnapshot || item.customParams
          ? (typeof item.paramsSnapshot === "string" ? item.paramsSnapshot : JSON.stringify(item.paramsSnapshot || item.customParams))
          : null;
        const oplah = item.oplah || item.data?.input?.oplah || item.summary?.oplah || 0;
        const savedAt = item.savedAt || new Date().toISOString();

        await db.execute({
          sql: `INSERT INTO pricelist_saved_calculations 
                (id, category, title, oplah, data, params_snapshot, user_id, created_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  title = excluded.title,
                  oplah = excluded.oplah,
                  data = excluded.data,
                  params_snapshot = excluded.params_snapshot,
                  updated_at = excluded.updated_at`,
          args: [
            item.id,
            item.category,
            item.title,
            oplah,
            dataStr,
            snapshotStr,
            userId,
            userName,
            savedAt,
            savedAt,
          ],
        });
      }

      return NextResponse.json({
        success: true,
        message: `Synced ${items.length} calculations to database`,
      });
    }
    // Handle single item save
    const { id, category, title, oplah, data, paramsSnapshot, savedAt } = body;
    if (!id || !category || !title) {
      return NextResponse.json(
        { error: "Missing required fields: id, category, title" },
        { status: 400 }
      );
    }

    const fullPayload = { ...body, ...(typeof data === "object" ? data : {}) };
    const dataStr = JSON.stringify(fullPayload);
    const snapshotStr = paramsSnapshot || body.customParams
      ? (typeof (paramsSnapshot || body.customParams) === "string" ? (paramsSnapshot || body.customParams) : JSON.stringify(paramsSnapshot || body.customParams))
      : null;
    const timestamp = savedAt || new Date().toISOString();
    const oplahVal = oplah || body.data?.input?.oplah || body.summary?.oplah || 0;

    await db.execute({
      sql: `INSERT INTO pricelist_saved_calculations 
            (id, category, title, oplah, data, params_snapshot, user_id, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              title = excluded.title,
              oplah = excluded.oplah,
              data = excluded.data,
              params_snapshot = excluded.params_snapshot,
              updated_at = excluded.updated_at`,
      args: [
        id,
        category,
        title,
        oplahVal,
        dataStr,
        snapshotStr,
        userId,
        userName,
        timestamp,
        timestamp,
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Calculation saved to database",
    });
  } catch (error: any) {
    console.error("POST /api/pricelist/saved-calculations error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save calculation" },
      { status: 500 }
    );
  }
}

// PUT: Perbarui judul atau data kalkulasi
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, data, paramsSnapshot } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    let updates: string[] = ["updated_at = ?"];
    let args: any[] = [new Date().toISOString()];

    if (title !== undefined) {
      updates.push("title = ?");
      args.push(title);
    }
    if (data !== undefined) {
      updates.push("data = ?");
      args.push(typeof data === "string" ? data : JSON.stringify(data));
      if (data.input?.oplah) {
        updates.push("oplah = ?");
        args.push(data.input.oplah);
      }
    }
    if (paramsSnapshot !== undefined) {
      updates.push("params_snapshot = ?");
      args.push(
        paramsSnapshot
          ? (typeof paramsSnapshot === "string" ? paramsSnapshot : JSON.stringify(paramsSnapshot))
          : null
      );
    }

    args.push(id);
    const query = `UPDATE pricelist_saved_calculations SET ${updates.join(", ")} WHERE id = ?`;

    await db.execute({ sql: query, args });

    return NextResponse.json({
      success: true,
      message: "Calculation updated in database",
    });
  } catch (error: any) {
    console.error("PUT /api/pricelist/saved-calculations error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update calculation" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus kalkulasi dari database
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await db.execute({
      sql: "DELETE FROM pricelist_saved_calculations WHERE id = ?",
      args: [id],
    });

    return NextResponse.json({
      success: true,
      message: "Calculation deleted from database",
    });
  } catch (error: any) {
    console.error("DELETE /api/pricelist/saved-calculations error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete calculation" },
      { status: 500 }
    );
  }
}
