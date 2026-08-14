import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { getSpreadsheetTasks } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== "Super Admin") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Khusus Super Admin." },
        { status: 403 }
      );
    }

    // Fetch fresh spreadsheet tasks
    const sheetTasks = await getSpreadsheetTasks("DATABASE_REPORT", true);

    if (!sheetTasks || sheetTasks.length === 0) {
      return NextResponse.json(
        { success: false, error: "Gagal menarik data atau spreadsheet kosong." },
        { status: 400 }
      );
    }

    // Reset & insert data fresh ke database SINTAK
    await db.execute("DELETE FROM laporan_pekerjaan");

    const now = new Date().toISOString();
    const insertBatch = sheetTasks.map((sheetTask) => ({
      sql: `INSERT INTO laporan_pekerjaan (task, project, division, bagian, pic, priority, start_date, end_date, work_days, note, status, source, created_at)
            VALUES (?, ?, ?, 'SETTING', ?, ?, ?, ?, ?, ?, ?, 'sintak', ?)`,
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

    return NextResponse.json({
      success: true,
      message: `Berhasil mengosongkan database dan mengimpor ${sheetTasks.length} data fresh dari Google Spreadsheet!`,
      count: sheetTasks.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
