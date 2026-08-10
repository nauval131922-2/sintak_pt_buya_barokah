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

    const conflicts: any[] = [];

    // Fetch data manual dari DB
    let sqlManual = "SELECT * FROM laporan_pekerjaan WHERE source = 'manual'";
    const argsManual: any[] = [];
    
    if (pic) {
      sqlManual += " AND LOWER(pic) = ?";
      argsManual.push(pic);
    }
    if (status) {
      sqlManual += " AND LOWER(status) = ?";
      argsManual.push(status);
    }
    if (search) {
      sqlManual += " AND (LOWER(task) LIKE ? OR LOWER(project) LIKE ?)";
      argsManual.push(`%${search}%`, `%${search}%`);
    }
    
    const manualRes = await db.execute({ sql: sqlManual, args: argsManual });
    const manualData = manualRes.rows;

    // Fetch & sync data dari spreadsheet
    let sheetData: any[] = [];
    try {
      const sheetTasks = await getSpreadsheetTasks("DATABASE_REPORT", syncFromSheet);
      
      // Map sheet tasks dengan unique key
      const sheetMap = new Map();
      sheetTasks.forEach(t => {
        const key = `${t.task}-${t.project}`.toLowerCase().trim();
        sheetMap.set(key, t);
      });

      // Get existing sheet data dari DB
      const existingSheetRes = await db.execute("SELECT * FROM laporan_pekerjaan WHERE source = 'spreadsheet'");
      const existingSheetMap = new Map();
      existingSheetRes.rows.forEach((row: any) => {
        const key = `${row.task}-${row.project}`.toLowerCase().trim();
        existingSheetMap.set(key, row);
      });

      // Detect conflicts & sync
      const now = new Date().toISOString();
      const insertBatch: any[] = [];
      const updateBatch: any[] = [];

      sheetMap.forEach((sheetTask, key) => {
        const existing = existingSheetMap.get(key);
        
        if (!existing) {
          // New data dari spreadsheet
          insertBatch.push({
            sql: `INSERT INTO laporan_pekerjaan (task, project, division, pic, priority, start_date, end_date, work_days, note, status, source, sheet_sync_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'spreadsheet', ?)`,
            args: [
              sheetTask.task || "",
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
          });
        } else {
          // Cek apakah ada perubahan
          const hasChange = 
            sheetTask.task !== existing.task ||
            sheetTask.project !== existing.project ||
            sheetTask.division !== existing.division ||
            sheetTask.pic !== existing.pic ||
            sheetTask.priority !== existing.priority ||
            sheetTask.startDate !== existing.start_date ||
            sheetTask.endDate !== existing.end_date ||
            sheetTask.workDays !== existing.work_days ||
            sheetTask.note !== existing.note ||
            sheetTask.status !== existing.status;

          if (hasChange) {
            // Cek apakah ada versi manual yang conflict
            const manualConflict = manualData.find((m: any) => 
              `${m.task}-${m.project}`.toLowerCase().trim() === key
            );

            if (manualConflict) {
              // CONFLICT: Ada versi manual & spreadsheet berubah
              conflicts.push({
                key,
                manual: {
                  id: manualConflict.id,
                  task: manualConflict.task,
                  project: manualConflict.project,
                  division: manualConflict.division,
                  pic: manualConflict.pic,
                  priority: manualConflict.priority,
                  startDate: manualConflict.start_date,
                  endDate: manualConflict.end_date,
                  workDays: manualConflict.work_days,
                  note: manualConflict.note,
                  status: manualConflict.status,
                  updated_at: manualConflict.updated_at,
                },
                spreadsheet: {
                  task: sheetTask.task,
                  project: sheetTask.project,
                  division: sheetTask.division,
                  pic: sheetTask.pic,
                  priority: sheetTask.priority,
                  startDate: sheetTask.startDate,
                  endDate: sheetTask.endDate,
                  workDays: sheetTask.workDays,
                  note: sheetTask.note,
                  status: sheetTask.status,
                },
              });
            } else {
              // Update spreadsheet data (tidak ada conflict)
              updateBatch.push({
                sql: `UPDATE laporan_pekerjaan SET 
                        task = ?, project = ?, division = ?, pic = ?, priority = ?,
                        start_date = ?, end_date = ?, work_days = ?, note = ?, status = ?,
                        sheet_sync_at = ?
                      WHERE id = ?`,
                args: [
                  sheetTask.task || "",
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
                  existing.id,
                ],
              });
            }
          }
        }
      });

      if (insertBatch.length > 0) await db.batch(insertBatch, "write");
      if (updateBatch.length > 0) await db.batch(updateBatch, "write");

      // Fetch ulang sheet data setelah sync
      const sheetRes = await db.execute("SELECT * FROM laporan_pekerjaan WHERE source = 'spreadsheet'");
      sheetData = sheetRes.rows;
    } catch (err) {
      console.error("Gagal sync spreadsheet:", err);
    }

    // Filter sheet data berdasarkan query params
    let filteredSheetData = sheetData;
    if (pic) {
      filteredSheetData = filteredSheetData.filter((s: any) => 
        (s.pic || '').toLowerCase() === pic
      );
    }
    if (status) {
      filteredSheetData = filteredSheetData.filter((s: any) => 
        (s.status || '').toLowerCase() === status
      );
    }
    if (search) {
      filteredSheetData = filteredSheetData.filter((s: any) => 
        (s.task || '').toLowerCase().includes(search) || 
        (s.project || '').toLowerCase().includes(search)
      );
    }

    // Merge manual + sheet data
    const allTasks = [
      ...manualData.map((row: any) => ({
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
        source: "manual",
        updated_at: row.updated_at,
      })),
      ...filteredSheetData.map((row: any) => ({
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
        source: "spreadsheet",
        sheet_sync_at: row.sheet_sync_at,
      })),
    ];

    // Sort by id DESC
    allTasks.sort((a, b) => b.id - a.id);

    return NextResponse.json({
      success: true,
      total: allTasks.length,
      data: allTasks,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
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
      sql: `INSERT INTO laporan_pekerjaan (task, project, division, pic, priority, start_date, end_date, work_days, note, status, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')`,
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

    // Update & set source to manual (convert spreadsheet -> manual saat edit)
    await db.execute({
      sql: `UPDATE laporan_pekerjaan SET 
              task = ?, project = ?, division = ?, pic = ?, priority = ?, 
              start_date = ?, end_date = ?, work_days = ?, note = ?, status = ?,
              source = 'manual',
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
