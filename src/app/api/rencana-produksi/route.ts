import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireApiPermission } from '@/lib/api-guard';

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
    const search = searchParams.get('search')?.trim() || '';
    const filterBagian = searchParams.get('bagian')?.trim() || 'ALL';
    const statusFilter = searchParams.get('status')?.trim() || 'ALL';
    const limit = Math.min(100, Math.max(10, Number(searchParams.get('limit')) || 40));

    // 1. Fetch recent distinct orders from JHP with aggregated stats
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

    // Subquery scanning latest 3000 rows
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
        MIN(jhp.tgl) as start_date,
        MAX(jhp.tgl) as end_date,
        SUM(jhp.target) as total_target,
        SUM(jhp.realisasi) as total_realisasi,
        COUNT(DISTINCT jhp.bagian) as count_bagian,
        GROUP_CONCAT(DISTINCT jhp.bagian) as daftar_bagian,
        MAX(CASE WHEN jhp.kendala IS NOT NULL AND jhp.kendala != '' AND jhp.kendala != '-' THEN 1 ELSE 0 END) as has_kendala
      FROM (
        SELECT no_order, nama_order, tgl, target, realisasi, bagian, kendala
        FROM jurnal_harian_produksi
        ${whereClause}
        ORDER BY id DESC
        LIMIT 3000
      ) jhp
      LEFT JOIN orders o ON o.faktur = jhp.no_order
      LEFT JOIN sopd s ON s.no_sopd = jhp.no_order
      LEFT JOIN sopd_harga sh ON sh.no_sopd = jhp.no_order
      GROUP BY jhp.no_order
      ORDER BY MAX(jhp.tgl) DESC
      LIMIT ?
    `;
    queryArgs.push(limit);

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

    if (rawOrders.length === 0) {
      return NextResponse.json({
        success: true,
        summary: {
          totalActiveOrders: 0,
          criticalOrdersCount: 0,
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

    const orderNumbers = rawOrders.map((o) => o.no_order);

    // 2. Fetch stage details for these orders
    const placeholders = orderNumbers.map(() => '?').join(',');
    const stagesSql = `
      SELECT 
        no_order,
        bagian,
        MIN(tgl) as start_date,
        MAX(tgl) as end_date,
        SUM(target) as target,
        SUM(realisasi) as realisasi,
        MAX(CASE WHEN kendala IS NOT NULL AND kendala != '' AND kendala != '-' THEN 1 ELSE 0 END) as stage_kendala
      FROM jurnal_harian_produksi
      WHERE deleted_at IS NULL AND no_order IN (${placeholders})
      GROUP BY no_order, bagian
      ORDER BY no_order, MIN(tgl) ASC
    `;

    const stagesResult = await db.execute({
      sql: stagesSql,
      args: orderNumbers,
    });

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

    for (const r of stagesResult.rows as unknown as Array<{
      no_order: string;
      bagian: string;
      start_date: string;
      end_date: string;
      target: number | null;
      realisasi: number | null;
      stage_kendala: number;
    }>) {
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

      const bg = r.bagian.toUpperCase();
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

    const processedOrders = rawOrders.map((ord) => {
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
      };
    });

    // 4. Status filter application
    const filteredOrders = processedOrders.filter((ord) => {
      if (statusFilter === 'ACTIVE') return ord.status !== 'Selesai';
      if (statusFilter === 'CRITICAL') return ord.status === 'Kritis' || ord.status === 'Overdue';
      if (statusFilter === 'COMPLETED') return ord.status === 'Selesai';
      return true;
    });

    // Determine busiest station
    let busiestStation = '-';
    let maxLoadCount = 0;
    for (const [stName, stData] of Object.entries(stationLoad)) {
      if (stData.count > maxLoadCount) {
        maxLoadCount = stData.count;
        busiestStation = `${stName} (${stData.count} order)`;
      }
    }

    const overallProgress = sumTotalTarget > 0 ? Math.min(100, Math.round((sumTotalRealisasi / sumTotalTarget) * 100)) : 0;

    return NextResponse.json({
      success: true,
      summary: {
        totalActiveOrders: rawOrders.length - completedCount,
        criticalOrdersCount: criticalCount,
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
