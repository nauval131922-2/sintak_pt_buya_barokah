import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { getSpreadsheetTasks } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pic = searchParams.get("pic")?.toLowerCase();
    const status = searchParams.get("status")?.toLowerCase();
    const search = searchParams.get("search")?.toLowerCase();

    // Auto-seed dari Google Spreadsheet 1x saja jika database masih kosong
    const countRes = await db.execute("SELECT COUNT(*) as cnt FROM laporan_pekerjaan");
    const totalCount = Number(countRes.rows[0]?.cnt || 0);

    if (totalCount === 0) {
      try {
        const sheetTasks = await getSpreadsheetTasks("DATABASE_REPORT", true);
        if (sheetTasks.length > 0) {
          const now = new Date().toISOString();
          const insertBatch = sheetTasks.map((sheetTask) => ({
            sql: `INSERT INTO laporan_pekerjaan (task, project, division, pic, priority, start_date, end_date, work_days, note, status, source, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sintak', ?)`,
            args: [
              sheetTask.task || sheetTask.project || "",
              sheetTask.project || "",
              sheetTask.division || "",
              sheetTask.pic || "",
              sheetTask.priority || "Low",
              sheetTask.startDate || "",
              sheetTask.endDate || "",
              sheetTask.workDays || "",
              sheetTask.note || "",
              sheetTask.status || "BELUM DIKERJAKAN",
              now,
            ],
          }));
          await db.batch(insertBatch, "write");
        }
      } catch (err) {
        console.error("Gagal initial seed dari Google Sheet:", err);
      }
    }

    // Query data murni dari database lokal Sintak
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
      bagian: String(row.bagian || ""),
      pic: String(row.pic || ""),
      priority: String(row.priority || ""),
      startDate: String(row.start_date || ""),
      endDate: String(row.end_date || ""),
      workDays: String(row.work_days || ""),
      note: String(row.note || ""),
      status: String(row.status || "BELUM DIKERJAKAN"),
      source: String(row.source || "sintak"),
      updated_at: row.updated_at,
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
    const { task, project, division, bagian, pic, priority, startDate, endDate, workDays, note, status } = body;

    if (!task || !task.trim()) {
      return NextResponse.json(
        { success: false, error: "Task / Nama pekerjaan wajib diisi" },
        { status: 400 }
      );
    }

    const res = await db.execute({
      sql: `INSERT INTO laporan_pekerjaan (task, project, division, bagian, pic, priority, start_date, end_date, work_days, note, status, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sintak')`,
      args: [
        task.trim(),
        project?.trim() || "",
        division?.trim() || "",
        bagian?.trim() || "",
        pic?.trim() || "",
        priority?.trim() || "Low",
        startDate?.trim() || "",
        endDate?.trim() || "",
        workDays?.trim() || "",
        note?.trim() || "",
        status?.trim() || "BELUM DIKERJAKAN",
      ],
    });

    const insertId = Number(res.lastInsertRowid);

    const afterData = {
      task: task.trim(),
      project: project?.trim() || "",
      division: division?.trim() || "",
      bagian: bagian?.trim() || "",
      pic: pic?.trim() || "",
      priority: priority?.trim() || "Low",
      start_date: startDate?.trim() || "",
      end_date: endDate?.trim() || "",
      work_days: workDays?.trim() || "",
      note: note?.trim() || "",
      status: status?.trim() || "BELUM DIKERJAKAN",
    };

    logActivity(
      "CREATE",
      "laporan_pekerjaan",
      `Menambahkan laporan pekerjaan: "${task.trim()}" (Project: ${project?.trim() || "-"}, PIC: ${pic?.trim() || "-"})`,
      { id: insertId, before: null, after: afterData }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      id: insertId,
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
    const { id, task, project, division, bagian, pic, priority, startDate, endDate, workDays, note, status } = body;

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

    // Ambil data lama sebelum update untuk mencatat Diff di audit log
    const oldRowRes = await db.execute({
      sql: "SELECT * FROM laporan_pekerjaan WHERE id = ?",
      args: [id],
    });
    const oldData = oldRowRes.rows?.[0] as any;

    const beforeData = oldData ? {
      task: oldData.task || "",
      project: oldData.project || "",
      division: oldData.division || "",
      bagian: oldData.bagian || "",
      pic: oldData.pic || "",
      priority: oldData.priority || "",
      start_date: oldData.start_date || "",
      end_date: oldData.end_date || "",
      work_days: oldData.work_days || "",
      note: oldData.note || "",
      status: oldData.status || "",
    } : null;

    const afterData = {
      task: task.trim(),
      project: project?.trim() || "",
      division: division?.trim() || "",
      bagian: bagian?.trim() || "",
      pic: pic?.trim() || "",
      priority: priority?.trim() || "Low",
      start_date: startDate?.trim() || "",
      end_date: endDate?.trim() || "",
      work_days: workDays?.trim() || "",
      note: note?.trim() || "",
      status: status?.trim() || "BELUM DIKERJAKAN",
    };

    // Update data di database lokal Sintak
    await db.execute({
      sql: `UPDATE laporan_pekerjaan SET 
              task = ?, project = ?, division = ?, bagian = ?, pic = ?, priority = ?, 
              start_date = ?, end_date = ?, work_days = ?, note = ?, status = ?,
              source = 'sintak',
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [
        afterData.task,
        afterData.project,
        afterData.division,
        afterData.bagian,
        afterData.pic,
        afterData.priority,
        afterData.start_date,
        afterData.end_date,
        afterData.work_days,
        afterData.note,
        afterData.status,
        id,
      ],
    });

    logActivity(
      "UPDATE",
      "laporan_pekerjaan",
      `Mengubah laporan pekerjaan #${id}: "${task.trim()}"`,
      { id, before: beforeData, after: afterData }
    ).catch(() => {});

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

    // Ambil data lengkap sebelum dihapus untuk snapshot log aktivitas
    const rowRes = await db.execute({
      sql: "SELECT * FROM laporan_pekerjaan WHERE id = ?",
      args: [id],
    });
    const deletedRow = rowRes.rows?.[0] as any;

    await db.execute({
      sql: "DELETE FROM laporan_pekerjaan WHERE id = ?",
      args: [id],
    });

    const taskName = deletedRow?.task || `#${id}`;

    const beforeData = deletedRow ? {
      task: deletedRow.task || "",
      project: deletedRow.project || "",
      division: deletedRow.division || "",
      bagian: deletedRow.bagian || "",
      pic: deletedRow.pic || "",
      priority: deletedRow.priority || "",
      start_date: deletedRow.start_date || "",
      end_date: deletedRow.end_date || "",
      work_days: deletedRow.work_days || "",
      note: deletedRow.note || "",
      status: deletedRow.status || "",
    } : { id };

    logActivity(
      "DELETE",
      "laporan_pekerjaan",
      `Menghapus laporan pekerjaan #${id}: "${taskName}"`,
      {
        id,
        before: beforeData,
        after: null,
      }
    ).catch(() => {});

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
