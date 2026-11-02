import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireApiPermission } from '@/lib/api-guard';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

function parseToISO(str?: string | null): string | null {
  if (!str) return null;
  const s = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const gate = await requireApiPermission(['produksi_rencana_produksi', 'produksi_jhp_analisa']);
  if (gate.error) return gate.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const orderParam = searchParams.get('order')?.trim();

    // Jika ada parameter ?order=..., kembalikan detail rencana tunggal
    if (orderParam) {
      const planRes = await db.execute({
        sql: `SELECT * FROM rencana_produksi WHERE no_order = ?`,
        args: [orderParam],
      });
      const plan = planRes.rows[0] || null;
      let tahapan: unknown[] = [];
      if (plan) {
        const tahapanRes = await db.execute({
          sql: `SELECT * FROM rencana_produksi_tahapan WHERE rencana_id = ? ORDER BY urutan ASC`,
          args: [(plan as any).id],
        });
        tahapan = tahapanRes.rows;
      }
      return NextResponse.json({
        success: true,
        plan,
        tahapan,
      });
    }

    const search = searchParams.get('search')?.trim() || '';
    const filterBagian = searchParams.get('bagian')?.trim() || 'ALL';
    const statusFilter = searchParams.get('status')?.trim() || 'ALL';
    const startDate = searchParams.get('startDate')?.trim() || '';
    const endDate = searchParams.get('endDate')?.trim() || '';
    const limit = Math.min(100, Math.max(10, Number(searchParams.get('limit')) || 50));
    let whereClause = `WHERE deleted_at IS NULL AND no_order IS NOT NULL AND no_order != '' AND no_order != '-'`;
    const queryArgs: unknown[] = [];

    if (search.length >= 2) {
      whereClause += ` AND (no_order LIKE ? OR nama_order LIKE ?)`;
      queryArgs.push(`%${search}%`, `%${search}%`);
    }

    if (filterBagian !== 'ALL') {
      whereClause += ` AND UPPER(bagian) LIKE ?`;
      queryArgs.push(`%${filterBagian.toUpperCase()}%`);
    }
    if (startDate) {
      whereClause += ` AND tgl >= ?`;
      queryArgs.push(startDate);
    } else if (!search) {
      // Default jendela waktu 180 hari ke belakang agar memanfaatkan index idx_jurnal_del_tgl_order
      const defaultCutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      whereClause += ` AND tgl >= ?`;
      queryArgs.push(defaultCutoff);
    }
    if (endDate) {
      whereClause += ` AND tgl <= ?`;
      queryArgs.push(endDate);
    }

    // Kueri agregasi per nomor order dari JHP tanpa batas buatan
    const baseOrdersSql = `
      SELECT 
        jhp.no_order,
        COALESCE(o.nama_prd, s.nama_order, jhp.nama_order) as nama_order,
        COALESCE(o.qty, s.qty_sopd) as qty,
        COALESCE(o.satuan, s.unit, 'Eks') as satuan,
        o.nama_pelanggan,
        COALESCE(o.tgl, s.tgl) as tgl_order,
        sh.deadline_date,
        sh.finished_date,
        jhp.start_date,
        jhp.end_date,
        jhp.total_target,
        jhp.total_realisasi,
        jhp.count_bagian,
        jhp.daftar_bagian,
        jhp.has_kendala,
        rp.id as plan_id,
        rp.tgl_mulai_rencana as plan_start,
        rp.tgl_selesai_rencana as plan_end,
        rp.status as plan_status
      FROM (
        SELECT 
          no_order,
          MAX(nama_order) as nama_order,
          MIN(tgl) as start_date,
          MAX(tgl) as end_date,
          SUM(target) as total_target,
          SUM(realisasi) as total_realisasi,
          COUNT(DISTINCT bagian) as count_bagian,
          GROUP_CONCAT(DISTINCT bagian) as daftar_bagian,
          MAX(CASE WHEN kendala IS NOT NULL AND kendala != '' AND kendala != '-' THEN 1 ELSE 0 END) as has_kendala
        FROM jurnal_harian_produksi
        ${whereClause}
        GROUP BY no_order
      ) jhp
      LEFT JOIN orders o ON o.faktur = jhp.no_order
      LEFT JOIN sopd s ON s.no_sopd = jhp.no_order
      LEFT JOIN sopd_harga sh ON sh.no_sopd = jhp.no_order
      LEFT JOIN rencana_produksi rp ON rp.no_order = jhp.no_order
      ORDER BY 
        CASE 
          WHEN COALESCE(o.tgl, s.tgl) LIKE '__-__-____' 
            THEN substr(COALESCE(o.tgl, s.tgl),7,4) || '-' || substr(COALESCE(o.tgl, s.tgl),4,2) || '-' || substr(COALESCE(o.tgl, s.tgl),1,2)
          WHEN COALESCE(o.tgl, s.tgl) IS NOT NULL 
            THEN COALESCE(o.tgl, s.tgl)
          ELSE jhp.start_date
        END DESC,
        jhp.no_order DESC
      LIMIT ${limit}
    `;
    const ordersResult = await db.execute({
      sql: baseOrdersSql,
      args: queryArgs,
    });

    const rawOrders = ordersResult.rows as unknown as Array<{
      no_order: string;
      nama_order: string;
      qty: number | null;
      satuan: string | null;
      nama_pelanggan: string | null;
      tgl_order: string | null;
      deadline_date: string | null;
      finished_date: string | null;
      start_date: string;
      end_date: string;
      total_target: number | null;
      total_realisasi: number | null;
      count_bagian: number;
      daftar_bagian: string | null;
      has_kendala: number;
    }>;

    // Sertakan juga pesanan yang sudah direncanakan (rencana_produksi) meski belum ada entri di JHP
    const existingOrderNos = new Set(rawOrders.map(r => r.no_order));
    const pendingPlansResult = await db.execute({
      sql: `
        SELECT 
          rp.no_order,
          rp.nama_order,
          rp.qty_oplah as qty,
          rp.satuan,
          rp.nama_pelanggan,
          rp.tgl_order,
          rp.tgl_deadline as deadline_date,
          NULL as finished_date,
          rp.tgl_mulai_rencana as start_date,
          rp.tgl_selesai_rencana as end_date,
          0 as total_target,
          0 as total_realisasi,
          0 as count_bagian,
          '' as daftar_bagian,
          0 as has_kendala,
          rp.id as plan_id,
          rp.tgl_mulai_rencana as plan_start,
          rp.tgl_selesai_rencana as plan_end,
          rp.status as plan_status
        FROM rencana_produksi rp
        WHERE rp.status != 'SELESAI'
      `,
      args: [],
    });

    const unstartedPlans = (pendingPlansResult.rows as any[]).filter(p => !existingOrderNos.has(p.no_order));
    const combinedOrders = [...unstartedPlans, ...rawOrders];

    if (combinedOrders.length === 0) {
      return NextResponse.json({
        success: true,
        summary: {
          totalActiveOrders: 0,
          criticalOrdersCount: 0,
          onTrackOrdersCount: 0,
          completedCount: 0,
          totalTarget: 0,
          totalRealisasi: 0,
          overallProgress: 0,
          busiestStation: '-',
        },
        orders: [],
        machineStations: [],
      });
    }

    const orderNumbers = combinedOrders.map((o) => o.no_order);

    // 2. Fetch stage details for these orders in safe chunks (mencegah batas SQLite variable)
    const stageRows: Array<{
      no_order: string;
      bagian: string;
      start_date: string;
      end_date: string;
      target: number | null;
      realisasi: number | null;
      stage_kendala: number;
    }> = [];

    const CHUNK_SIZE = 400;
    for (let i = 0; i < orderNumbers.length; i += CHUNK_SIZE) {
      const chunk = orderNumbers.slice(i, i + CHUNK_SIZE);
      const placeholders = chunk.map(() => '?').join(',');
      const res = await db.execute({
        sql: `
          SELECT 
            no_order,
            bagian,
            MIN(tgl) as start_date,
            MAX(tgl) as end_date,
            SUM(target) as target,
            SUM(realisasi) as realisasi,
            MAX(CASE WHEN kendala IS NOT NULL AND kendala != '' AND kendala != '-' THEN 1 ELSE 0 END) as stage_kendala
          FROM jurnal_harian_produksi INDEXED BY idx_jurnal_order_del_bag
          WHERE deleted_at IS NULL AND no_order IN (${placeholders})
          GROUP BY no_order, bagian
          ORDER BY no_order, MIN(tgl) ASC
        `,
        args: chunk,
      });
      stageRows.push(...(res.rows as any[]));
    }
    // Ambil tahapan untuk pesanan yang baru direncanakan (belum ada transaksi JHP)
    if (unstartedPlans.length > 0) {
      const unstartedNos = unstartedPlans.map(p => p.no_order);
      const ph = unstartedNos.map(() => '?').join(',');
      const planStagesRes = await db.execute({
        sql: `
          SELECT 
            no_order,
            bagian,
            tgl_mulai_plan as start_date,
            tgl_selesai_plan as end_date,
            volume as target,
            0 as realisasi,
            0 as stage_kendala
          FROM rencana_produksi_tahapan
          WHERE no_order IN (${ph})
          ORDER BY no_order, urutan ASC
        `,
        args: unstartedNos,
      });
      stageRows.push(...(planStagesRes.rows as any[]));
    }

    const stagesByOrder: Record<string, Array<{
      bagian: string;
      start_date: string;
      end_date: string;
      target: number;
      realisasi: number;
      progress: number;
      has_kendala: boolean;
    }>> = {};

    const stationLoad: Record<string, { count: number; target: number; realisasi: number }> = {};

    for (const r of stageRows) {
      const ord = r.no_order;
      if (!stagesByOrder[ord]) stagesByOrder[ord] = [];

      const tVal = Number(r.target) || 0;
      const rVal = Number(r.realisasi) || 0;
      const prog = tVal > 0 ? Math.min(100, Math.round((rVal / tVal) * 100)) : (rVal > 0 ? 100 : 0);

      stagesByOrder[ord].push({
        bagian: r.bagian,
        start_date: r.start_date,
        end_date: r.end_date,
        target: tVal,
        realisasi: rVal,
        progress: prog,
        has_kendala: r.stage_kendala === 1,
      });

      const bg = String(r.bagian || 'LAINNYA').toUpperCase();
      if (!stationLoad[bg]) stationLoad[bg] = { count: 0, target: 0, realisasi: 0 };
      stationLoad[bg].count += 1;
      stationLoad[bg].target += tVal;
      stationLoad[bg].realisasi += rVal;
    }

    // 3. Process orders & compute scheduling status (On-track, Kritis, Overdue, Selesai)
    const todayISO = new Date().toISOString().split('T')[0];
    let criticalCount = 0;
    let completedCount = 0;
    let sumTotalTarget = 0;
    let sumTotalRealisasi = 0;

    const processedOrders = combinedOrders.map((ord) => {
      const tVal = Number(ord.total_target) || 0;
      const rVal = Number(ord.total_realisasi) || 0;
      sumTotalTarget += tVal;
      sumTotalRealisasi += rVal;

      const progress = tVal > 0 ? Math.min(100, Math.round((rVal / tVal) * 100)) : (rVal > 0 ? 100 : 0);
      const isFinished = !!ord.finished_date || progress >= 100;

      let status: 'Selesai' | 'Overdue' | 'Kritis' | 'On-track' | 'Baru Mulai' = 'On-track';
      const deadlineISO = parseToISO(ord.deadline_date);

      if (isFinished) {
        status = 'Selesai';
        completedCount++;
      } else if (deadlineISO && deadlineISO < todayISO) {
        status = 'Overdue';
        criticalCount++;
      } else if (deadlineISO) {
        // Check if within 5 days of deadline
        const diffMs = new Date(deadlineISO).getTime() - new Date(todayISO).getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays <= 5) {
          status = 'Kritis';
          criticalCount++;
        }
      } else if (progress === 0) {
        status = 'Baru Mulai';
      }

      return {
        no_order: ord.no_order,
        nama_order: ord.nama_order || '-',
        nama_pelanggan: ord.nama_pelanggan || '-',
        qty: ord.qty || 0,
        satuan: ord.satuan || 'Eks',
        tgl_order: ord.tgl_order || '-',
        deadline_date: ord.deadline_date || null,
        finished_date: ord.finished_date || null,
        start_date: ord.start_date,
        end_date: ord.end_date,
        total_target: tVal,
        total_realisasi: rVal,
        progress,
        has_kendala: ord.has_kendala === 1,
        status,
        stages: stagesByOrder[ord.no_order] || [],
        plan: (ord as any).plan_id ? {
          id: (ord as any).plan_id,
          start_date: (ord as any).plan_start,
          end_date: (ord as any).plan_end,
          status: (ord as any).plan_status,
        } : null,
      };
    });

    // 4. Status filter application
    const filteredOrders = processedOrders.filter((ord) => {
      if (statusFilter === 'ACTIVE') return ord.status !== 'Selesai';
      if (statusFilter === 'CRITICAL') return ord.status === 'Kritis' || ord.status === 'Overdue';
      if (statusFilter === 'COMPLETED') return ord.status === 'Selesai';
      return true;
    });

    // Format nama bagian kapital semua (UPPERCASE)
    const formatBagianTitle = (str: string) => {
      const upper = (str || '').toUpperCase().trim();
      if (upper.includes('QC') || upper.includes('QUALITY CONTROL')) return 'QUALITY CONTROL';
      return upper;
    };
    let busiestStation = '-';
    let maxLoadCount = 0;
    for (const [stName, stData] of Object.entries(stationLoad)) {
      if (stData.count > maxLoadCount) {
        maxLoadCount = stData.count;
        busiestStation = `${formatBagianTitle(stName)} (${stData.count} order)`;
      }
    }
    const overallProgress = sumTotalTarget > 0 ? Math.min(100, Math.round((sumTotalRealisasi / sumTotalTarget) * 100)) : 0;

    return NextResponse.json({
      success: true,
      summary: {
        totalActiveOrders: rawOrders.length - completedCount,
        criticalOrdersCount: criticalCount,
        onTrackOrdersCount: Math.max(0, (rawOrders.length - completedCount) - criticalCount),
        completedCount,
        totalTarget: sumTotalTarget,
        totalRealisasi: sumTotalRealisasi,
        overallProgress,
        busiestStation,
      },
      orders: filteredOrders,
      machineStations: Object.entries(stationLoad).map(([bagian, data]) => ({
        bagian,
        orderCount: data.count,
        totalTarget: data.target,
        totalRealisasi: data.realisasi,
      })),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireApiPermission('produksi_rencana_produksi');
  if (gate.error) return gate.error;

  try {
    const session = await getSession();
    const username = session?.username || session?.name || 'Admin';
    const body = await request.json();

    const no_order = String(body.no_order || '').trim();
    const nama_order = String(body.nama_order || '').trim();
    const qty_oplah = Number(body.qty_oplah) || 0;
    const satuan = String(body.satuan || 'Eks').trim();
    const nama_pelanggan = String(body.nama_pelanggan || '').trim();
    const tgl_order = body.tgl_order ? String(body.tgl_order).trim() : null;
    const tgl_deadline = body.tgl_deadline ? String(body.tgl_deadline).trim() : null;
    const tgl_mulai_rencana = String(body.tgl_mulai_rencana || '').trim();
    const tgl_selesai_rencana = String(body.tgl_selesai_rencana || '').trim();
    const status = String(body.status || 'DRAFT').trim();
    const catatan = body.catatan ? String(body.catatan).trim() : null;
    const tahapan = Array.isArray(body.tahapan) ? body.tahapan : [];

    if (!no_order || !nama_order) {
      return NextResponse.json({ error: 'Nomor order dan nama order wajib diisi.' }, { status: 400 });
    }
    if (!tgl_mulai_rencana || !tgl_selesai_rencana) {
      return NextResponse.json({ error: 'Tanggal mulai dan selesai rencana wajib diisi.' }, { status: 400 });
    }

    // Upsert rencana_produksi header
    await db.execute({
      sql: `
        INSERT INTO rencana_produksi (
          no_order, nama_order, qty_oplah, satuan, nama_pelanggan,
          tgl_order, tgl_deadline, tgl_mulai_rencana, tgl_selesai_rencana,
          status, catatan, created_by, updated_by, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(no_order) DO UPDATE SET
          nama_order = excluded.nama_order,
          qty_oplah = excluded.qty_oplah,
          satuan = excluded.satuan,
          nama_pelanggan = excluded.nama_pelanggan,
          tgl_order = excluded.tgl_order,
          tgl_deadline = excluded.tgl_deadline,
          tgl_mulai_rencana = excluded.tgl_mulai_rencana,
          tgl_selesai_rencana = excluded.tgl_selesai_rencana,
          status = excluded.status,
          catatan = excluded.catatan,
          updated_by = excluded.updated_by,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [
        no_order, nama_order, qty_oplah, satuan, nama_pelanggan,
        tgl_order, tgl_deadline, tgl_mulai_rencana, tgl_selesai_rencana,
        status, catatan, username, username
      ],
    });

    // Ambil ID header rencana_produksi
    const planRow = await db.execute({
      sql: `SELECT id FROM rencana_produksi WHERE no_order = ?`,
      args: [no_order],
    });
    const planId = Number((planRow.rows[0] as any)?.id);

    // Ganti tahapan lama dengan tahapan baru
    await db.execute({
      sql: `DELETE FROM rencana_produksi_tahapan WHERE rencana_id = ?`,
      args: [planId],
    });

    for (let i = 0; i < tahapan.length; i++) {
      const st = tahapan[i];
      await db.execute({
        sql: `
          INSERT INTO rencana_produksi_tahapan (
            rencana_id, no_order, urutan, bagian, mesin, nama_tahap,
            volume, target_per_hari, durasi_hari, tgl_mulai_plan, tgl_selesai_plan, catatan
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          planId,
          no_order,
          Number(st.urutan) || (i + 1),
          String(st.bagian || '').trim(),
          st.mesin ? String(st.mesin).trim() : null,
          String(st.nama_tahap || '').trim(),
          Number(st.volume) || 0,
          Number(st.target_per_hari) || 0,
          Number(st.durasi_hari) || 1,
          String(st.tgl_mulai_plan || '').trim(),
          String(st.tgl_selesai_plan || '').trim(),
          st.catatan ? String(st.catatan).trim() : null,
        ],
      });
    }

    return NextResponse.json({
      success: true,
      id: planId,
      no_order,
      message: 'Rencana produksi berhasil disimpan.',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const gate = await requireApiPermission('produksi_rencana_produksi');
  if (gate.error) return gate.error;

  try {
    const session = await getSession();
    const username = session?.username || session?.name || 'Admin';
    const body = await request.json();

    const id = Number(body.id);
    const no_order = String(body.no_order || '').trim();
    if (!id && !no_order) {
      return NextResponse.json({ error: 'ID atau nomor order wajib diberikan.' }, { status: 400 });
    }

    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP', 'updated_by = ?'];
    const args: unknown[] = [username];

    if (body.status !== undefined) {
      updates.push('status = ?');
      args.push(String(body.status).trim());
    }
    if (body.tgl_mulai_rencana !== undefined) {
      updates.push('tgl_mulai_rencana = ?');
      args.push(String(body.tgl_mulai_rencana).trim());
    }
    if (body.tgl_selesai_rencana !== undefined) {
      updates.push('tgl_selesai_rencana = ?');
      args.push(String(body.tgl_selesai_rencana).trim());
    }
    if (body.catatan !== undefined) {
      updates.push('catatan = ?');
      args.push(String(body.catatan).trim());
    }

    let where = 'id = ?';
    if (id) {
      args.push(id);
    } else {
      where = 'no_order = ?';
      args.push(no_order);
    }

    await db.execute({
      sql: `UPDATE rencana_produksi SET ${updates.join(', ')} WHERE ${where}`,
      args,
    });

    return NextResponse.json({
      success: true,
      message: 'Status rencana produksi berhasil diperbarui.',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const gate = await requireApiPermission('produksi_rencana_produksi');
  if (gate.error) return gate.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const order = searchParams.get('order')?.trim();
    const id = Number(searchParams.get('id'));

    if (!order && !id) {
      return NextResponse.json({ error: 'Parameter id atau order wajib diberikan.' }, { status: 400 });
    }

    let where = 'id = ?';
    let arg: unknown = id;
    if (order) {
      where = 'no_order = ?';
      arg = order;
    }

    const planRow = await db.execute({
      sql: `SELECT id FROM rencana_produksi WHERE ${where}`,
      args: [arg],
    });
    if (planRow.rows.length > 0) {
      const planId = (planRow.rows[0] as any).id;
      await db.execute({
        sql: `DELETE FROM rencana_produksi_tahapan WHERE rencana_id = ?`,
        args: [planId],
      });
    }

    await db.execute({
      sql: `DELETE FROM rencana_produksi WHERE ${where}`,
      args: [arg],
    });

    return NextResponse.json({
      success: true,
      message: 'Rencana produksi berhasil dihapus.',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
