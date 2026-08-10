import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSpreadsheetTasks } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pic = searchParams.get("pic")?.toLowerCase();
    const status = searchParams.get("status")?.toLowerCase();
    const search = searchParams.get("search")?.toLowerCase();
    const syncFromSheet = searchParams.get("sync") === "true";

    // Cek jumlah data di DB local
    const countRes = await db.execute("SELECT COUNT(*) as cnt FROM laporan_pekerjaan");
    const count = Number(countRes.rows[0]?.cnt || 0);

    // Auto seed / sync jika requested atau tabel masih 0
    if (count === 0 || syncFromSheet) {
      try {
        const sheetTasks = await getSpreadsheetTasks("DATABASE_REPORT", true);
        if (sheetTasks && sheetTasks.length > 0) {
          if (syncFromSheet && count > 0) {
            await db.execute("DELETE FROM laporan_pekerjaan");
          }
          const batchQueries = sheetTasks.map((t) => ({
            sql: `INSERT INTO laporan_pekerjaan (task, project, division, pic, priority, start_date, end_date, work_days, note, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              t.task || "",
              t.project || "",
              t.division || "",
              t.pic || "",
              t.priority || "Low",
              t.startDate || "",
              t.endDate || "",
              t.workDays || "",
              t.note || "",
              t.status || "BELUM DIKERJAKAN",
            ],
          }));
          await db.batch(batchQueries, "write");
        }
      } catch (err) {
        console.error("Gagal auto-seed/sync spreadsheet ke laporan_pekerjaan:", err);
      }
    }

    let sql = "SELECT * FROM laporan_pekerjaan WHERE 1=1";
    const args: any[] = [];

    if (pic) {
      sql += " AND LOWER(pic) = ?";
      args.push(pic);
    }
    if (status) {
      sql += " AND LOWER(status) = ?";
      args.push(status);
    }
    if (search) {
      sql += " AND (LOWER(task) LIKE ? OR LOWER(project) LIKE ?)";
      args.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY id DESC";

    const res = await db.execute({ sql, args });

    const tasks = res.rows.map((row: any) => ({
      id: Number(row.id),
      task: String(row.task || ""),
      project: String(row.project || ""),
      division: String(row.division || ""),
      pic: String(row.pic || ""),
      priority: String(row.priority || ""),
      startDate: String(row.start_date || ""),
      endDate: String(row.end_date || ""),
      workDays: String(row.work_days || ""),
      note: String(row.note || ""),
      status: String(row.status || "BELUM DIKERJAKAN"),
    }));

    return NextResponse.json({
      success: true,
      total: tasks.length,
      data: tasks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, project, division, pic, priority, startDate, endDate, workDays, note, status } = body;

    if (!task || !task.trim()) {
      return NextResponse.json(
        { success: false, error: "Task / Nama pekerjaan wajib diisi" },
        { status: 400 }
      );
    }

    const res = await db.execute({
      sql: `INSERT INTO laporan_pekerjaan (task, project, division, pic, priority, start_date, end_date, work_days, note, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        task.trim(),
        project?.trim() || "",
        division?.trim() || "",
        pic?.trim() || "",
        priority?.trim() || "Low",
        startDate?.trim() || "",
        endDate?.trim() || "",
        workDays?.trim() || "",
        note?.trim() || "",
        status?.trim() || "BELUM DIKERJAKAN",
      ],
    });

    return NextResponse.json({
      success: true,
      id: Number(res.lastInsertRowid),
      message: "Data pekerjaan berhasil ditambahkan",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, task, project, division, pic, priority, startDate, endDate, workDays, note, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID pekerjaan wajib diisi" },
        { status: 400 }
      );
    }

    if (!task || !task.trim()) {
      return NextResponse.json(
        { success: false, error: "Task / Nama pekerjaan wajib diisi" },
        { status: 400 }
      );
    }

    await db.execute({
      sql: `UPDATE laporan_pekerjaan SET 
              task = ?, project = ?, division = ?, pic = ?, priority = ?, 
              start_date = ?, end_date = ?, work_days = ?, note = ?, status = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [
        task.trim(),
        project?.trim() || "",
        division?.trim() || "",
        pic?.trim() || "",
        priority?.trim() || "Low",
        startDate?.trim() || "",
        endDate?.trim() || "",
        workDays?.trim() || "",
        note?.trim() || "",
        status?.trim() || "BELUM DIKERJAKAN",
        id,
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Data pekerjaan berhasil diperbarui",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID pekerjaan wajib diisi" },
        { status: 400 }
      );
    }

    await db.execute({
      sql: "DELETE FROM laporan_pekerjaan WHERE id = ?",
      args: [id],
    });

    return NextResponse.json({
      success: true,
      message: "Data pekerjaan berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
