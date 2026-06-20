'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * Deeply sanitizes data for Server Action returns.
 * Next.js Server Actions cannot serialize BigInt, which libsql often returns for IDs or counts.
 */
function sanitizeData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'bigint') return Number(data);
  if (Array.isArray(data)) return data.map(sanitizeData);
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      sanitized[key] = sanitizeData(data[key]);
    }
    return sanitized;
  }
  return data;
}

// Caching Karyawan (Master Data) — Di-cache 1 jam (3600 detik)
// karena data karyawan jarang berubah. Menghemat ratusan query DB per hari.
export const getEmployees = cache(
  unstable_cache(
    async () => {
      const result = await db.execute('SELECT * FROM employees WHERE is_active = 1 ORDER BY id ASC');
      return sanitizeData(result.rows.map((row: any) => ({ ...row })));
    },
    ['master-employees-active'],
    { revalidate: 3600, tags: ['karyawan'] }
  )
);

// Caching Total Karyawan — Di-cache 1 jam (3600 detik)
export const getEmployeeCount = cache(
  unstable_cache(
    async () => {
      const result = await db.execute('SELECT COUNT(*) as count FROM employees');
      return Number(result.rows[0]?.count || 0);
    },
    ['total-employees-count'],
    { revalidate: 3600, tags: ['karyawan'] }
  )
);

// Caching Order Produksi — Di-cache 5 menit (300 detik) 
// Membantu meringankan beban join table saat query log infraction.
export const fetchProductionOrders = cache(
  unstable_cache(
    async () => {
      const result = await db.execute(`
        SELECT id, faktur, nama_prd 
        FROM orders 
        ORDER BY id DESC
        LIMIT 2000
      `);
      return sanitizeData(result.rows.map((row: any) => ({ ...row })));
    },
    ['master-production-orders-latest'],
    { revalidate: 300, tags: ['orders'] }
  )
);

export async function addEmployee(name: string, position: string, department: string) {
  const result = await db.execute({
    sql: 'INSERT INTO employees (name, position, department) VALUES (?, ?, ?)',
    args: [name, position, department]
  });
  return sanitizeData(result);
}

export const getInfractions = cache(async (startDate?: string, endDate?: string) => {
  let query = `
    SELECT 
      i.*,
      COALESCE(i.employee_name, e.name) as employee_name, 
      i.employee_no, 
      COALESCE(i.employee_position, e.position) as employee_position,
      COALESCE(i.recorded_by_name, r.name, i.recorded_by) as recorded_by_name, 
      COALESCE(i.recorded_by_position, r.position) as recorded_by_position,
      COALESCE(i.order_name, o.nama_prd) as order_name_display,
      COALESCE(i.nama_barang, bb.nama_barang, bj.nama_barang) as nama_barang_display
    FROM infractions i 
    LEFT JOIN employees e ON (i.employee_id = e.id OR (i.employee_no IS NOT NULL AND i.employee_no = e.employee_no))
    LEFT JOIN employees r ON (i.recorded_by_id = r.id OR (i.recorded_by_no IS NOT NULL AND i.recorded_by_no = r.employee_no))
    LEFT JOIN orders o ON (i.order_faktur = o.faktur)
    LEFT JOIN bahan_baku bb ON (i.item_faktur = bb.faktur AND i.jenis_barang = 'BBB Produksi' AND i.order_name = bb.nama_prd)
    LEFT JOIN barang_jadi bj ON (i.item_faktur = bj.faktur AND i.jenis_barang = 'Penerimaan Barang Hasil Produksi' AND i.order_name = bj.nama_prd)
  `;

  const params: any[] = [];
  if (startDate && endDate) {
    query += ` WHERE i.date >= ? AND i.date <= ? `;
    params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
  }

  query += ` ORDER BY i.date DESC, i.id DESC `;
  
  const result = await db.execute({
    sql: query,
    args: params
  });
  return sanitizeData(result.rows.map((row: any) => ({ ...row })));
});


export async function addInfraction(employeeId: number, description: string, severity: string, date: string, recordedById: number|string, orderName?: string) {
  let fullDate = date;
  if (date.length === 10) {
    const time = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta'
    }).format(new Date());
    fullDate = `${date} ${time}`;
  }

  const empRes = await db.execute({
    sql: 'SELECT name, position, employee_no FROM employees WHERE id = ?',
    args: [employeeId]
  });
  const recRes = await db.execute({
    sql: 'SELECT name, position, employee_no FROM employees WHERE id = ?',
    args: [recordedById]
  });

  const emp = empRes.rows[0] as any;
  const rec = recRes.rows[0] as any;

  if (!emp || !rec) throw new Error('Data karyawan tidak ditemukan.');

  const result = await db.execute({
    sql: `INSERT INTO infractions (
            employee_id, employee_no, employee_name, employee_position,
            description, severity, date, 
            recorded_by_id, recorded_by_no, recorded_by_name, recorded_by_position,
            order_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      employeeId, emp.employee_no, emp.name, emp.position,
      description, severity, fullDate,
      recordedById, rec.employee_no, rec.name, rec.position,
      orderName || null
    ]
  }, "Catat Kesalahan");

  return sanitizeData(result);
}

export const getStats = cache(async (startDate?: string, endDate?: string) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const start = startDate ? `${startDate} 00:00:00` : `${currentYear}-01-01 00:00:00`;
  const end = endDate ? `${endDate} 23:59:59` : `${currentYear}-12-31 23:59:59`;

  const results = await db.batch([
    'SELECT COUNT(*) as count FROM employees WHERE is_active = 1',
    {
      sql: `SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high
            FROM infractions 
            WHERE (date >= ? AND date <= ?)`,
      args: [start, end]
    },
    'SELECT COUNT(*) as count FROM orders'
  ], "read");

  return sanitizeData({
    totalEmployees: Number(results[0].rows[0]?.count || 0),
    totalInfractions: Number(results[1].rows[0]?.total || 0),
    highSeverity: Number(results[1].rows[0]?.high || 0),
    totalOrders: Number(results[2].rows[0]?.count || 0)
  });
});

export const getDashboardSummary = cache(async () => {
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
  const thisMonth = ("0" + (now.getMonth() + 1)).slice(-2);
  const thisYear = now.getFullYear().toString();

  const startOfMonth = `${thisYear}-${thisMonth}-01 00:00:00`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const endOfMonth = `${thisYear}-${thisMonth}-${lastDay} 23:59:59`;

  // 7 hari terakhir untuk chart tren jurnal
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    last7Days.push(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d));
  }
  const trendStart = last7Days[0];
  const trendEnd = last7Days[last7Days.length - 1];

  const results = await db.batch([
    // 0: Karyawan aktif
    'SELECT COUNT(*) as count FROM employees WHERE is_active = 1',
    // 1: Kesalahan bulan ini
    {
      sql: `SELECT COUNT(*) as count FROM infractions WHERE (date >= ? AND date <= ?)`,
      args: [startOfMonth, endOfMonth]
    },
    // 2: Total order produksi
    'SELECT COUNT(*) as count FROM orders',
    // 3: Jurnal hari ini
    {
      sql: `SELECT COUNT(*) as count FROM jurnal_harian_produksi WHERE tgl = ?`,
      args: [today]
    },
    // 4: Tren 7 hari jurnal (group by tgl)
    {
      sql: `SELECT tgl, COUNT(*) as count FROM jurnal_harian_produksi WHERE tgl >= ? AND tgl <= ? GROUP BY tgl ORDER BY tgl ASC`,
      args: [trendStart, trendEnd]
    },
    // 5: Jurnal bulan ini
    {
      sql: `SELECT COUNT(*) as count FROM jurnal_harian_produksi WHERE tgl >= ? AND tgl <= ?`,
      args: [`${thisYear}-${thisMonth}-01`, `${thisYear}-${thisMonth}-${String(lastDay).padStart(2, '0')}`]
    },
    // 6: Total semua karyawan
    'SELECT COUNT(*) as count FROM employees',
  ], "read");

  const trendRaw = results[4].rows as any[];
  const trendMap = new Map(trendRaw.map(r => [r.tgl as string, Number(r.count)]));
  const jurnalTrend = last7Days.map(d => ({
    date: d,
    count: trendMap.get(d) ?? 0
  }));

  return sanitizeData({
    activeEmployees: Number(results[0].rows[0]?.count || 0),
    totalEmployees: Number(results[6].rows[0]?.count || 0),
    infractionsThisMonth: Number(results[1].rows[0]?.count || 0),
    totalOrders: Number(results[2].rows[0]?.count || 0),
    jurnalToday: Number(results[3].rows[0]?.count || 0),
    jurnalTrend,
    jurnalThisMonth: Number(results[5].rows[0]?.count || 0),
    todayDate: today,
  });
});

export const getProductionDashboardSummary = cache(async () => {
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
  const thisMonth = String(now.getMonth() + 1).padStart(2, '0');
  const thisYear = now.getFullYear().toString();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const startOfMonth = `${thisYear}-${thisMonth}-01`;
  const endOfMonth = `${thisYear}-${thisMonth}-${String(lastDay).padStart(2, '0')}`;

  const last14Days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    last14Days.push(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d));
  }
  const trendStart = last14Days[0];
  const trendEnd = last14Days[last14Days.length - 1];

  const results = await db.batch([
    {
      sql: `SELECT COUNT(*) as count FROM jurnal_harian_produksi WHERE tgl = ?`,
      args: [today]
    },
    {
      sql: `SELECT COUNT(*) as count FROM jurnal_harian_produksi WHERE tgl >= ? AND tgl <= ?`,
      args: [startOfMonth, endOfMonth]
    },
    'SELECT COUNT(*) as count FROM orders',
    {
      sql: `
        SELECT COUNT(DISTINCT no_order) as count
        FROM (
          SELECT no_order FROM jurnal_harian_produksi
          WHERE tgl >= ? AND tgl <= ? AND no_order IS NOT NULL AND TRIM(no_order) != ''
          UNION ALL
          SELECT no_order_2 as no_order FROM jurnal_harian_produksi
          WHERE tgl >= ? AND tgl <= ? AND no_order_2 IS NOT NULL AND TRIM(no_order_2) != ''
        ) active_orders
      `,
      args: [startOfMonth, endOfMonth, startOfMonth, endOfMonth]
    },
    {
      sql: `SELECT COALESCE(SUM(qty), 0) as total FROM barang_jadi WHERE tgl >= ? AND tgl <= ?`,
      args: [startOfMonth, endOfMonth]
    },
    {
      sql: `SELECT COALESCE(SUM(qty), 0) as total FROM bahan_baku WHERE tgl >= ? AND tgl <= ?`,
      args: [startOfMonth, endOfMonth]
    },
    {
      sql: `
        SELECT tgl, COUNT(*) as count
        FROM jurnal_harian_produksi
        WHERE tgl >= ? AND tgl <= ?
        GROUP BY tgl
        ORDER BY tgl ASC
      `,
      args: [trendStart, trendEnd]
    },
    {
      sql: `
        SELECT COALESCE(NULLIF(TRIM(bagian), ''), 'Tanpa Bagian') as label, COUNT(*) as count
        FROM jurnal_harian_produksi
        WHERE tgl >= ? AND tgl <= ?
        GROUP BY label
        ORDER BY count DESC
        LIMIT 5
      `,
      args: [startOfMonth, endOfMonth]
    },
    {
      sql: `
        SELECT
          j.id, j.tgl, j.shift, j.nama_karyawan, j.no_order, j.nama_order,
          j.jenis_pekerjaan, j.jenis_pekerjaan_2, j.bagian, j.target, j.realisasi,
          j.no_order_2, j.nama_order_2, j.created_at,
          COALESCE(j.updated_by, j.created_by) AS recorded_by,
          u.name AS recorded_by_name,
          CASE
            WHEN j.deleted_at IS NOT NULL THEN 'DELETE'
            WHEN j.updated_at IS NOT NULL THEN 'UPDATE'
            ELSE 'INSERT'
          END AS action_type,
          COALESCE(j.updated_at, j.deleted_at, j.created_at) AS input_at
        FROM jurnal_harian_produksi j
        LEFT JOIN users u ON u.username = COALESCE(j.updated_by, j.created_by)
        ORDER BY COALESCE(j.updated_at, j.deleted_at, j.created_at) DESC, j.id DESC
        LIMIT 8
      `
    },
  ], "read");

  const trendRaw = results[6].rows as any[];
  const trendMap = new Map(trendRaw.map((row) => [row.tgl as string, Number(row.count)]));
  const jurnalTrend = last14Days.map((date) => ({
    date,
    count: trendMap.get(date) ?? 0
  }));

  return sanitizeData({
    jurnalToday: Number(results[0].rows[0]?.count || 0),
    jurnalThisMonth: Number(results[1].rows[0]?.count || 0),
    totalOrders: Number(results[2].rows[0]?.count || 0),
    activeOrdersThisMonth: Number(results[3].rows[0]?.count || 0),
    finishedGoodsThisMonth: Number(results[4].rows[0]?.total || 0),
    rawMaterialsThisMonth: Number(results[5].rows[0]?.total || 0),
    jurnalTrend,
    topSections: results[7].rows.map((row: any) => ({
      label: row.label,
      count: Number(row.count || 0)
    })),
    latestJournals: results[8].rows.map((row: any) => ({
      ...row
    })),
    todayDate: today,
    monthStart: startOfMonth,
    monthEnd: endOfMonth,
  });
});

export const getDetailedStats = cache(async (startDate?: string, endDate?: string) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const start = startDate ? `${startDate} 00:00:00` : `${currentYear}-01-01 00:00:00`;
  const end = endDate ? `${endDate} 23:59:59` : `${currentYear}-12-31 23:59:59`;
  
  const [monthlyRes, repeatersRes, severityRes] = await db.batch([
    {
      sql: `
        SELECT 
          strftime('%Y-%m', date) as month_ym,
          COUNT(*) as total,
          SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low_count,
          SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as med_count,
          SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high_count,
          SUM(IFNULL(total, 0)) as amount
        FROM infractions
        WHERE date >= ? AND date <= ?
        GROUP BY month_ym
        ORDER BY month_ym ASC
      `,
      args: [start, end]
    },
    {
      sql: `
        SELECT 
          COALESCE(i.employee_name, e.name) as name,
          e.position,
          COUNT(*) as total,
          SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low_count,
          SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as med_count,
          SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high_count,
          SUM(IFNULL(i.total, 0)) as total_amount
        FROM infractions i
        LEFT JOIN employees e ON i.employee_id = e.id
        WHERE i.date >= ? AND i.date <= ?
        GROUP BY i.employee_id, COALESCE(i.employee_name, e.name)
        ORDER BY total_amount DESC
        LIMIT 5
      `,
      args: [start, end]
    },
    {
      sql: `
        SELECT severity, COUNT(*) as count 
        FROM infractions 
        WHERE date >= ? AND date <= ?
        GROUP BY severity
      `,
      args: [start, end]
    }
  ], "read");

  const startD = new Date(start);
  const endD = new Date(end);
  const monthsList = [];
  const curr = new Date(startD.getFullYear(), startD.getMonth(), 1);
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // Prevent infinite loops by capping at 60 months (5 years) just in case
  let loops = 0;
  while (loops < 60 && (curr < endD || (curr.getFullYear() === endD.getFullYear() && curr.getMonth() === endD.getMonth()))) {
    const ym = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
    // E.g., 'Jul 26'
    const name = `${monthNamesShort[curr.getMonth()]} '${String(curr.getFullYear()).slice(-2)}`;
    monthsList.push({ ym, name });
    curr.setMonth(curr.getMonth() + 1);
    loops++;
  }

  const monthlyData = monthsList.map((m) => {
    const dbRow = monthlyRes.rows.find((r: any) => r.month_ym === m.ym);
    return {
      name: m.name,
      total: dbRow ? Number(dbRow.total) : 0,
      low: dbRow ? Number(dbRow.low_count) : 0,
      medium: dbRow ? Number(dbRow.med_count) : 0,
      high: dbRow ? Number(dbRow.high_count) : 0,
      amount: dbRow ? Number(dbRow.amount) : 0
    };
  });

  return sanitizeData({
    monthlyData,
    topRepeaters: repeatersRes.rows.map((r: any) => ({ ...r, total: Number(r.total) })),
    severityData: severityRes.rows.reduce((acc: any, curr: any) => {
      acc[curr.severity] = Number(curr.count);
      return acc;
    }, { Low: 0, Medium: 0, High: 0 })
  });
});

export async function getLastEmployeeImport() {
  try {
    const result = await db.execute(`SELECT * FROM activity_logs WHERE table_name = 'employees' AND action_type = 'IMPORT' ORDER BY id DESC LIMIT 1`);
    return result.rows.length > 0 ? sanitizeData({ ...result.rows[0] }) : null;
  } catch (err) {
    console.error('Failed to get last employee import log', err);
    return null;
  }
}

export async function getLastHppImport() {
  try {
    const result = await db.execute(`SELECT * FROM activity_logs WHERE table_name = 'hpp_kalkulasi' AND action_type = 'UPLOAD' ORDER BY id DESC LIMIT 1`);
    return result.rows.length > 0 ? sanitizeData({ ...result.rows[0] }) : null;
  } catch (err) {
    console.error('Failed to get last hpp kalkulasi import log', err);
    return null;
  }
}

export async function getLastSopdImport() {
  try {
    const result = await db.execute(`SELECT * FROM activity_logs WHERE table_name = 'sopd' AND action_type = 'UPLOAD' ORDER BY id DESC LIMIT 1`);
    return result.rows.length > 0 ? sanitizeData({ ...result.rows[0] }) : null;
  } catch (err) {
    console.error('Failed to get last sopd import log', err);
    return null;
  }
}

export async function getLastMasterPekerjaanImport() {
  try {
    const result = await db.execute(`SELECT * FROM activity_logs WHERE table_name = 'master_pekerjaan' AND action_type = 'UPLOAD' ORDER BY id DESC LIMIT 1`);
    return result.rows.length > 0 ? sanitizeData({ ...result.rows[0] }) : null;
  } catch (err) {
    console.error('Failed to get last master pekerjaan import log', err);
    return null;
  }
}

export async function getLastMasterPekerjaanJurnalProduksiImport() {
  try {
    const result = await db.execute(`SELECT * FROM activity_logs WHERE table_name = 'master_pekerjaan_jurnal_produksi' AND action_type = 'UPLOAD' ORDER BY id DESC LIMIT 1`);
    return result.rows.length > 0 ? sanitizeData({ ...result.rows[0] }) : null;
  } catch (err) {
    console.error('Failed to get last master pekerjaan jurnal produksi import log', err);
    return null;
  }
}

export async function getLastJurnalHarianImport() {
  try {
    const result = await db.execute(`SELECT * FROM activity_logs WHERE table_name = 'jurnal_harian_produksi' AND action_type = 'UPLOAD' ORDER BY id DESC LIMIT 1`);
    return result.rows.length > 0 ? sanitizeData({ ...result.rows[0] }) : null;
  } catch (err) {
    console.error('Failed to get last jurnal harian import log', err);
    return null;
  }
}


export async function getActivityLogs(limit = 1000) {
  const [recordsResult] = await db.batch([
    {
      sql: `
        SELECT al.*, u.name as recorded_by_name
        FROM activity_logs al
        LEFT JOIN users u ON al.recorded_by = u.username
        ORDER BY al.created_at DESC
        LIMIT ?
      `,
      args: [limit]
    }
  ], "read");

  return sanitizeData(recordsResult.rows.map(row => ({ ...row })));
}

export async function getLiveRecord(tableName: string, recordId: number | string) {
  try {
    const allowedTables = [
      'users', 'employees', 'infractions', 'orders', 'bahan_baku', 'barang_jadi', 'hpp_kalkulasi', 
      'sales_reports', 'sph_out', 'sales_orders', 'bill_of_materials', 'purchase_requests', 
      'spph_out', 'sph_in', 'purchase_orders'
    ];
    if (!allowedTables.includes(tableName)) throw new Error('Table not allowed');
    const result = await db.execute({
      sql: `SELECT * FROM ${tableName} WHERE id = ?`,
      args: [recordId]
    });
    return result.rows.length > 0 ? sanitizeData({ ...result.rows[0] }) : null;
  } catch (err) {
    console.error('Failed to get live record', err);
    return null;
  }
}

export async function cleanupActivityLogs(daysToKeep: number) {
  const session = await getSession();
  const { canAdminActivityLog } = await import('@/lib/activity-log-permissions');
  if (!session || !(await canAdminActivityLog(
    Array.isArray(session.roles) && session.roles.length > 0 ? session.roles : session.role
  ))) {
    throw new Error('Unauthorized: Hanya role dengan hak Log Aktivitas (Kelola) yang diizinkan menghapus log.');
  }

  const { revalidatePath } = await import('next/cache');
  const fs = await import('fs');
  const path = await import('path');

  const isDev = process.env.NODE_ENV === 'development';
  const isVercel = !!process.env.VERCEL;
  const useRemote = (isVercel || process.env.USE_REMOTE_DB === 'true') && !!process.env.TURSO_DATABASE_URL;

  let dbPath = '';
  let initialSize = 0;

  if (!useRemote) {
    const defaultDbName = isDev ? 'database_dev.sqlite' : 'database.sqlite';
    dbPath = path.join(process.cwd(), process.env.DB_PATH || defaultDbName);
    if (fs.existsSync(dbPath)) {
      initialSize = fs.statSync(dbPath).size / (1024 * 1024); // in MB
    }
  }

  try {
    // 1. Get count before
    const countBeforeRes = await db.execute(`SELECT COUNT(*) as count FROM activity_logs`);
    const countBefore = Number((countBeforeRes.rows[0] as any).count ?? 0);

    // 2. Delete logs older than daysToKeep
    await db.execute({
      sql: `DELETE FROM activity_logs WHERE created_at < date('now', ?)`,
      args: [`-${daysToKeep} days`]
    });

    // 3. Get count after
    const countAfterRes = await db.execute(`SELECT COUNT(*) as count FROM activity_logs`);
    const countAfter = Number((countAfterRes.rows[0] as any).count ?? 0);
    const deletedCount = countBefore - countAfter;

    // 4. Run VACUUM
    const startVacuum = Date.now();
    await db.execute(`VACUUM`);
    const vacuumDurationSec = Number(((Date.now() - startVacuum) / 1000).toFixed(1));

    // 5. Get size after
    let finalSize = 0;
    let savedSize = 0;
    if (!useRemote && dbPath && fs.existsSync(dbPath)) {
      finalSize = fs.statSync(dbPath).size / (1024 * 1024);
      savedSize = initialSize - finalSize;
    }

    // 6. Record activity log for maintenance
    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        'MAINTENANCE', 
        'activity_logs', 
        0, 
        `Pembersihan log aktivitas berhasil dilakukan (retensi ${daysToKeep} hari terakhir). Terhapus: ${deletedCount.toLocaleString('id-ID')} baris.`, 
        JSON.stringify({ 
          daysToKeep, 
          deletedCount, 
          spaceSavedMb: savedSize.toFixed(2), 
          vacuumDurationSec 
        }), 
        session.username || 'System'
      ]
    });

    revalidatePath('/dashboard');
    revalidatePath('/log-aktivitas');

    return {
      success: true,
      deletedCount,
      countBefore,
      countAfter,
      initialSizeMb: initialSize,
      finalSizeMb: finalSize,
      savedSizeMb: savedSize,
      vacuumDurationSec,
    };
  } catch (error: any) {
    console.error('[CLEANUP ACTION] Error:', error);
    throw new Error(`Gagal melakukan pembersihan: ${error.message}`);
  }
}
