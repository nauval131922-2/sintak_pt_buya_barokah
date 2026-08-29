import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { getSpreadsheetTasks } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pic = searchParams.get("pic")?.toLowerCase();
    const bagian = searchParams.get("bagian")?.toLowerCase();
    const status = searchParams.get("status")?.toLowerCase();
    const search = searchParams.get("search")?.toLowerCase();

    // Auto-seed dari Google Spreadsheet 1x saja jika database masih kosong
    const countRes = await db.execute("SELECT COUNT(*) as cnt FROM laporan_pekerjaan");
    const totalCount = Number(countRes.rows[0]?.cnt || 0);

    if (totalCount === 0) {
      try {
        const sheetTasks = await getSpreadsheetTasks("DATABASE_REPORT", true);
        if (sheetTasks.length > 0) {
          const PIC_MAPPING: Record<string, string> = {
            ADI: "Muhammad Adi Saputra",
            ALBILA: "Albilla Rizqi",
            ERIC: "Eric Fahri Emawan",
            RIFAN: "Rifan",
            RIKZA: "Muhammad Rikza Musthofa",
            SONI: "Sonny Yudha Bhirawa",
          };

          const now = new Date().toISOString();
          const insertBatch = sheetTasks.map((sheetTask) => {
            const rawPic = (sheetTask.pic || "").trim();
            const mappedPic = PIC_MAPPING[rawPic.toUpperCase()] || rawPic;

            return {
              sql: `INSERT INTO laporan_pekerjaan (task, project, division, bagian, pic, priority, start_date, end_date, work_days, note, status, source, created_at)
                    VALUES (?, ?, ?, 'SETTING', ?, ?, ?, ?, ?, ?, ?, 'sintak', ?)`,
              args: [
                sheetTask.task || sheetTask.project || "",
                sheetTask.project || "",
                sheetTask.division || "",
                mappedPic,
                sheetTask.priority || "Low",
                sheetTask.startDate || "",
                sheetTask.endDate || "",
                sheetTask.workDays || "",
                sheetTask.note || "",
                sheetTask.status || "BELUM DIKERJAKAN",
                now,
              ],
            };
          });
          await db.batch(insertBatch, "write");
        }
      } catch (err) {
        console.error("Gagal initial seed dari Google Sheet:", err);
      }
    }

    // Query data murni dari database lokal Sintak dengan join tgl_order dari sopd / orders
    let sql = `
      SELECT lp.*,
             COALESCE(
               (SELECT s.tgl FROM sopd s WHERE s.nama_order = lp.project LIMIT 1),
               (SELECT s.tgl FROM sopd s WHERE s.no_sopd = lp.project LIMIT 1),
               (SELECT o.tgl FROM orders o WHERE o.nama_prd = lp.project LIMIT 1),
               (SELECT o.tgl FROM orders o WHERE o.faktur = lp.project LIMIT 1),
               ''
             ) as tgl_order
      FROM laporan_pekerjaan lp
      WHERE 1=1
    `;
    const args: any[] = [];

    if (pic) {
      sql += " AND LOWER(lp.pic) = ?";
      args.push(pic);
    }
    if (bagian) {
      sql += " AND LOWER(lp.bagian) = ?";
      args.push(bagian);
    }
    if (status) {
      sql += " AND LOWER(lp.status) = ?";
      args.push(status);
    }
    if (search) {
      sql += " AND (LOWER(lp.task) LIKE ? OR LOWER(lp.project) LIKE ?)";
      args.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY lp.id DESC";

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
      tglOrder: String(row.tgl_order || ""),
      updated_at: row.updated_at,
    }));

    // Inklusi order SOPd yang belum ada di laporan_pekerjaan (jika tidak sedang difilter PIC spesifik)
    const shouldIncludeSopd = !pic && (!status || status === "all" || status === "belum dikerjakan");
    if (shouldIncludeSopd) {
      try {
        let sopdSql = `
          SELECT
            -s.id as id,
            '' as task,
            s.nama_order as project,
            '' as division,
            '' as bagian,
            '' as pic,
            'Low' as priority,
            '' as start_date,
            '' as end_date,
            '' as work_days,
            '' as note,
            'BELUM DIKERJAKAN' as status,
            'sopd' as source,
            NULL as updated_at,
            s.tgl as tgl_order
          FROM sopd s
          WHERE s.nama_order IS NOT NULL AND s.nama_order != ''
            AND (substr(s.tgl, 7, 4) >= '2026' OR s.tgl LIKE '%2026%')
            AND NOT EXISTS (
              SELECT 1 FROM laporan_pekerjaan lp WHERE lp.project = s.nama_order
            )
        `;
        const sopdArgs: any[] = [];
        if (search) {
          sopdSql += " AND LOWER(s.nama_order) LIKE ?";
          sopdArgs.push(`%${search}%`);
        }
        sopdSql += " GROUP BY s.nama_order ORDER BY s.id DESC";

        const sopdRes = await db.execute({ sql: sopdSql, args: sopdArgs });
        const sopdTasks = sopdRes.rows.map((row: any) => ({
          id: Number(row.id),
          task: "",
          project: String(row.project || ""),
          division: "",
          bagian: "",
          pic: "",
          priority: "Low",
          startDate: "",
          endDate: "",
          workDays: "",
          note: "",
          status: "BELUM DIKERJAKAN",
          source: "sopd",
          tglOrder: String(row.tgl_order || ""),
          updated_at: null,
        }));

        tasks.push(...sopdTasks);
      } catch (e) {
        console.error("Gagal menyertakan order SOPD baru:", e);
      }
    }

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
