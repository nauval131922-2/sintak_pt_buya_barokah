import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { getSpreadsheetTasks } from "@/lib/google-sheets";
import { toNormDateString, isValidRangeDate, ensureLaporanPekerjaanNorms } from "@/lib/date-sort";

export const dynamic = "force-dynamic";

// ponytail: in-memory flag untuk skip `SELECT COUNT(*)` berulang setelah DB terbukti sudah terisi
let isInitialSeedChecked = false;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pic = searchParams.get("pic")?.toLowerCase();
    const bagian = searchParams.get("bagian")?.toLowerCase();
    const status = searchParams.get("status")?.toLowerCase();
    const search = searchParams.get("search")?.toLowerCase();
    // Filter rentang tanggal server-side (mirror logika overlap client; 1 sisi boleh kosong)
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const hasFrom = isValidRangeDate(from);
    const hasTo = isValidRangeDate(to);
    const hasRange = hasFrom || hasTo;

    // Auto-seed dari Google Spreadsheet 1x saja jika database masih kosong
    if (!isInitialSeedChecked) {
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
      isInitialSeedChecked = true;
    }

    // Query data murni dari database lokal Sintak dengan join tgl_order dari sopd / orders (fallback ke lp.tgl_order)
    let sql = `
      SELECT lp.*,
             COALESCE(
               NULLIF(lp.tgl_order, ''),
               (SELECT s.tgl FROM sopd s WHERE s.nama_order = lp.project LIMIT 1),
               (SELECT s.tgl FROM sopd s WHERE s.no_sopd = lp.project LIMIT 1),
               (SELECT o.tgl FROM orders o WHERE o.nama_prd = lp.project LIMIT 1),
               (SELECT o.tgl FROM orders o WHERE o.faktur = lp.project LIMIT 1),
               ''
             ) as calculated_tgl_order
      FROM laporan_pekerjaan lp
      WHERE 1=1
    `;
    const args: unknown[] = [];

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
    if (hasRange) {
      // Mirror filter client: task tanpa start_date disingkirkan; overlap [start, end||start] vs [from, to]
      sql += " AND lp.start_date_norm != ''";
      if (hasFrom) {
        sql += " AND COALESCE(NULLIF(lp.end_date_norm,''), lp.start_date_norm) >= ?";
        args.push(from);
      }
      if (hasTo) {
        sql += " AND lp.start_date_norm <= ?";
        args.push(to);
      }
    }

    sql += " ORDER BY lp.id DESC";

    // ponytail: self-heal jika kolom norm belum ada (mis. server lama belum restart) — tambah + backfill lalu ulangi
    let res;
    try {
      res = await db.execute({ sql, args });
    } catch (e: any) {
      if (String(e?.message || e).includes("no such column")) {
        await ensureLaporanPekerjaanNorms(db);
        res = await db.execute({ sql, args });
      } else {
        throw e;
      }
    }
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
      startTime: String(row.start_time || ""),
      endTime: String(row.end_time || ""),
      sortOrder: Number((row as any).sort_order || 0),
      workDays: String(row.work_days || ""),
      note: String(row.note || ""),
      status: String(row.status || "BELUM DIKERJAKAN"),
      source: String(row.source || "sintak"),
      tglOrder: String(row.calculated_tgl_order || row.tgl_order || ""),
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
        if (hasRange) {
          // s.tgl berformat DD-MM-YYYY -> samakan ke ISO agar bisa difilter rentang (mirror tglOrder client)
          const sopdIso = "(substr(s.tgl,7,4)||'-'||substr(s.tgl,4,2)||'-'||substr(s.tgl,1,2))";
          if (hasFrom) {
            sopdSql += ` AND ${sopdIso} >= ?`;
            sopdArgs.push(from);
          }
          if (hasTo) {
            sopdSql += ` AND ${sopdIso} <= ?`;
            sopdArgs.push(to);
          }
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
          startTime: "",
          endTime: "",
          sortOrder: 0,
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
    const { task, project, division, bagian, pic, priority, startDate, endDate, startTime, endTime, workDays, note, status, tglOrder } = body;

    // Jika membuat Order Manual (tanpa task), buat placeholder record order
    const isOrderOnly = body.isOrderOnly || (!task && project?.trim());
    const finalTask = (task || "").trim();
    const finalProject = (project || "").trim();

    if (!finalProject && !finalTask) {
      return NextResponse.json(
        { success: false, error: "Nama Order atau Task wajib diisi" },
        { status: 400 }
      );
    }

    if (!isOrderOnly && !finalTask) {
      return NextResponse.json(
        { success: false, error: "Task / Nama pekerjaan wajib diisi" },
        { status: 400 }
      );
    }

    // Jika menambahkan task nyata (bukan order-only), bersihkan placeholder kosong (task = '') dari project yang sama
    if (!isOrderOnly && finalProject) {
      await db.execute({
        sql: "DELETE FROM laporan_pekerjaan WHERE project = ? AND (task IS NULL OR task = '')",
        args: [finalProject],
      });
    }

    const startNorm = toNormDateString(startDate?.trim() || "");
    const endNorm = toNormDateString(endDate?.trim() || "");
    const tglOrderNorm = toNormDateString(tglOrder?.trim() || "");

    const insertStmt = {
      sql: `INSERT INTO laporan_pekerjaan (task, project, division, bagian, pic, priority, start_date, end_date, start_time, end_time, work_days, note, status, source, tgl_order, start_date_norm, end_date_norm, tgl_order_norm)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sintak', ?, ?, ?, ?)`,
      args: [
        finalTask,
        finalProject,
        division?.trim() || "",
        bagian?.trim() || (isOrderOnly ? "" : "SETTING"),
        pic?.trim() || "",
        priority?.trim() || "Low",
        startDate?.trim() || "",
        endDate?.trim() || "",
        startTime?.trim() || "",
        endTime?.trim() || "",
        workDays?.trim() || "",
        note?.trim() || "",
        status?.trim() || "BELUM DIKERJAKAN",
        tglOrder?.trim() || "",
        startNorm,
        endNorm,
        tglOrderNorm,
      ],
    };
    let res;
    try {
      res = await db.execute(insertStmt);
    } catch (e: any) {
      if (String(e?.message || e).includes("no such column")) {
        await ensureLaporanPekerjaanNorms(db);
        res = await db.execute(insertStmt);
      } else {
        throw e;
      }
    }

    const insertId = Number(res.lastInsertRowid);

    const afterData = {
      task: finalTask,
      project: finalProject,
      division: division?.trim() || "",
      bagian: bagian?.trim() || (isOrderOnly ? "" : "SETTING"),
      pic: pic?.trim() || "",
      priority: priority?.trim() || "Low",
      start_date: startDate?.trim() || "",
      end_date: endDate?.trim() || "",
      start_time: startTime?.trim() || "",
      end_time: endTime?.trim() || "",
      work_days: workDays?.trim() || "",
      note: note?.trim() || "",
      status: status?.trim() || "BELUM DIKERJAKAN",
      tgl_order: tglOrder?.trim() || "",
    };

    const actionDesc = isOrderOnly
      ? `Menambahkan Order Baru Manual: "${finalProject}"`
      : `Menambahkan laporan pekerjaan: "${finalTask}" (Project: ${finalProject || "-"}, PIC: ${pic?.trim() || "-"})`;

    logActivity(
      "CREATE",
      "laporan_pekerjaan",
      actionDesc,
      { id: insertId, before: null, after: afterData }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      id: insertId,
      message: isOrderOnly ? "Order baru berhasil ditambahkan" : "Data pekerjaan berhasil ditambahkan",
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
    const { id, task, project, division, bagian, pic, priority, startDate, endDate, startTime, endTime, workDays, note, status } = body;

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
      start_time: oldData.start_time || "",
      end_time: oldData.end_time || "",
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
      start_time: startTime?.trim() || "",
      end_time: endTime?.trim() || "",
      work_days: workDays?.trim() || "",
      note: note?.trim() || "",
      status: status?.trim() || "BELUM DIKERJAKAN",
    };

    // Update data di database lokal Sintak
    const updateStmt = {
      sql: `UPDATE laporan_pekerjaan SET
              task = ?, project = ?, division = ?, bagian = ?, pic = ?, priority = ?,
              start_date = ?, end_date = ?, start_time = ?, end_time = ?, work_days = ?, note = ?, status = ?,
              start_date_norm = ?, end_date_norm = ?,
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
        afterData.start_time,
        afterData.end_time,
        afterData.work_days,
        afterData.note,
        afterData.status,
        toNormDateString(afterData.start_date),
        toNormDateString(afterData.end_date),
        id,
      ],
    };
    try {
      await db.execute(updateStmt);
    } catch (e: any) {
      if (String(e?.message || e).includes("no such column")) {
        await ensureLaporanPekerjaanNorms(db);
        await db.execute(updateStmt);
      } else {
        throw e;
      }
    }

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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { project, orderedIds } = body as { project?: string; orderedIds?: number[] };

    if (!project?.trim() || !Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Project dan orderedIds wajib diisi" },
        { status: 400 }
      );
    }

    const ids = orderedIds.map(Number).filter((n) => Number.isFinite(n) && n > 0);
    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "orderedIds tidak valid" },
        { status: 400 }
      );
    }

    const runUpdates = () =>
      db.batch(
        ids.map((id, i) => ({
          sql: "UPDATE laporan_pekerjaan SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND project = ?",
          args: [i + 1, id, project.trim()],
        })),
        "write"
      );

    try {
      await runUpdates();
    } catch (e: any) {
      // Self-heal jika kolom belum ada di DB lama
      if (String(e?.message || e).includes("no such column")) {
        await db.execute("ALTER TABLE laporan_pekerjaan ADD COLUMN sort_order INTEGER DEFAULT 0");
        await runUpdates();
      } else {
        throw e;
      }
    }

    logActivity(
      "UPDATE",
      "laporan_pekerjaan",
      `Menyusun ulang urutan pekerjaan project: "${project.trim()}" (${ids.length} baris)`,
      { project: project.trim(), orderedIds: ids }
    ).catch(() => {});

    return NextResponse.json({ success: true, message: "Urutan pekerjaan berhasil disimpan" });
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
    const project = searchParams.get("project");

    if (!id && !project) {
      return NextResponse.json(
        { success: false, error: "ID pekerjaan atau Nama Project wajib diisi" },
        { status: 400 }
      );
    }

    if (project) {
      // Hapus seluruh pekerjaan/order yang ber-project tersebut dari tabel laporan_pekerjaan
      const countRes = await db.execute({
        sql: "SELECT COUNT(*) as cnt FROM laporan_pekerjaan WHERE project = ?",
        args: [project],
      });
      const totalCount = Number(countRes.rows[0]?.cnt || 0);

      await db.execute({
        sql: "DELETE FROM laporan_pekerjaan WHERE project = ?",
        args: [project],
      });

      logActivity(
        "DELETE",
        "laporan_pekerjaan",
        `Menghapus seluruh order & aktivitas project: "${project}" (${totalCount} baris)`,
        { project, totalDeleted: totalCount }
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Order "${project}" beserta seluruh aktivitasnya berhasil dihapus`,
      });
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
