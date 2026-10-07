import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { searchableMenuItems } from '@/lib/menu-registry';
import { buildFtsQuery } from '@/lib/fts';
import { getSession } from '@/lib/session';
import { getMergedPermissions } from '@/lib/permissions';

function normalizeDateToYYYYMMDD(d?: string | null): string | null {
  if (!d) return null;
  const trimmed = String(d).trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('-');
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  return null;
}

interface DataSubquery {
  fts?: { sql: string; argCount: number };
  like: { sql: string; argCount: number };
}

interface SearchResultRow {
  type: string;
  id: string;
  label: string;
  source: string;
  category?: string;
  date?: string | null;
}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // ponytail: otentikasi & hak akses wajib agar pencarian tidak membocorkan data antar-role
  const session = await getSession();
  if (!session || !session.userId) {
    return NextResponse.json({ results: [] });
  }

  const roles = Array.isArray(session.roles) && session.roles.length > 0 ? session.roles : [session.role];
  const isSuperAdmin = roles.includes('Super Admin');
  const permissions = await getMergedPermissions(roles);
  const hasAccess = (perm: string) => isSuperAdmin || permissions[perm] === true;

  const pattern = `%${q}%`;
  const lowerQuery = q.toLowerCase();
  const ftsQuery = buildFtsQuery(q);

  try {
    // 1. Search menu items yang diizinkan untuk role user
    const menuResults = searchableMenuItems
      .filter((item) => {
        if (item.permission && !hasAccess(item.permission)) return false;
        return (
          item.label.toLowerCase().includes(lowerQuery) ||
          item.category.toLowerCase().includes(lowerQuery) ||
          (item.keywords && item.keywords.toLowerCase().includes(lowerQuery))
        );
      })
      .slice(0, 5)
      .map((item) => ({
        type: 'Menu',
        id: item.href,
        label: item.label,
        source: 'menu',
        category: item.category,
      }));

    // 2. Definisi subquery data per modul hak akses
    const subqueries: DataSubquery[] = [];

    if (hasAccess('pembelian_po')) {
      subqueries.push({
        fts: {
          sql: `SELECT 'PO' as type, f.faktur as id, f.faktur as label, 'purchase_orders' as source,
                  f.kd_supplier || ' · PR: ' || COALESCE(f.faktur_pr,'') || ' · SPH: ' || COALESCE(f.faktur_sph,'') || ' · ' || COALESCE(f.status,'') as category,
                  f.tgl as date
                FROM purchase_orders f JOIN purchase_orders_fts fts ON f.id = fts.rowid WHERE purchase_orders_fts MATCH ?`,
          argCount: 1,
        },
        like: {
          sql: `SELECT 'PO' as type, faktur as id, faktur as label, 'purchase_orders' as source,
                  kd_supplier || ' · PR: ' || COALESCE(faktur_pr,'') || ' · SPH: ' || COALESCE(faktur_sph,'') || ' · ' || COALESCE(status,'') as category,
                  tgl as date
                FROM purchase_orders WHERE faktur LIKE ? COLLATE NOCASE OR kd_supplier LIKE ? COLLATE NOCASE`,
          argCount: 2,
        },
      });
    }

    if (hasAccess('penjualan_so')) {
      subqueries.push({
        fts: {
          sql: `SELECT 'SO' as type, f.faktur as id, f.faktur as label, 'sales_orders' as source,
                  f.nama_pelanggan || ' · ' || COALESCE(f.kd_pelanggan,'') || ' · ' || COALESCE(f.nama_prd,'') || ' · ' || COALESCE(f.kd_barang,'') as category,
                  f.tgl as date
                FROM sales_orders f JOIN sales_orders_fts fts ON f.id = fts.rowid WHERE sales_orders_fts MATCH ?`,
          argCount: 1,
        },
        like: {
          sql: `SELECT 'SO' as type, faktur as id, faktur as label, 'sales_orders' as source,
                  nama_pelanggan || ' · ' || COALESCE(kd_pelanggan,'') || ' · ' || COALESCE(nama_prd,'') || ' · ' || COALESCE(kd_barang,'') as category,
                  tgl as date
                FROM sales_orders WHERE faktur LIKE ? COLLATE NOCASE OR nama_pelanggan LIKE ? COLLATE NOCASE OR kd_pelanggan LIKE ? COLLATE NOCASE`,
          argCount: 3,
        },
      });
    }

    if (hasAccess('stok_master_barang')) {
      subqueries.push({
        fts: {
          sql: `SELECT 'Barang' as type, CAST(f.id as TEXT) as id, f.nama_barang as label, 'bahan_baku' as source,
                  f.kd_barang || ' · ' || COALESCE(f.nama_prd,'') || ' · Pelanggan: ' || COALESCE(f.kd_pelanggan,'') || ' · ' || COALESCE(f.keterangan,'') || ' · ' || COALESCE(f.status,'') as category,
                  NULL as date
                FROM bahan_baku f JOIN bahan_baku_fts fts ON f.id = fts.rowid WHERE bahan_baku_fts MATCH ?`,
          argCount: 1,
        },
        like: {
          sql: `SELECT 'Barang' as type, CAST(id as TEXT) as id, nama_barang as label, 'bahan_baku' as source,
                  kd_barang || ' · ' || COALESCE(nama_prd,'') || ' · Pelanggan: ' || COALESCE(kd_pelanggan,'') || ' · ' || COALESCE(keterangan,'') || ' · ' || COALESCE(status,'') as category,
                  NULL as date
                FROM bahan_baku WHERE nama_barang LIKE ? COLLATE NOCASE OR kd_barang LIKE ? COLLATE NOCASE OR kd_pelanggan LIKE ? COLLATE NOCASE`,
          argCount: 3,
        },
      });
    }

    if (hasAccess('karyawan')) {
      subqueries.push({
        fts: {
          sql: `SELECT 'Karyawan' as type, CAST(f.id as TEXT) as id, f.name as label, 'employees' as source,
                  f.employee_no || ' · ' || COALESCE(f.position,'') || ' · Dept: ' || COALESCE(f.department,'') as category,
                  NULL as date
                FROM employees f JOIN employees_fts fts ON f.id = fts.rowid WHERE employees_fts MATCH ?`,
          argCount: 1,
        },
        like: {
          sql: `SELECT 'Karyawan' as type, CAST(id as TEXT) as id, name as label, 'employees' as source,
                  employee_no || ' · ' || COALESCE(position,'') || ' · Dept: ' || COALESCE(department,'') as category,
                  NULL as date
                FROM employees WHERE name LIKE ? COLLATE NOCASE OR employee_no LIKE ? COLLATE NOCASE`,
          argCount: 2,
        },
      });
    }

    if (hasAccess('produksi_selesai')) {
      subqueries.push({
        fts: {
          sql: `SELECT 'Produksi Selesai' as type, f.faktur as id, f.faktur as label, 'produksi_selesai' as source,
                  f.nama_prd || ' · Pelanggan: ' || COALESCE(f.kd_pelanggan,'') || ' · Regu: ' || COALESCE(f.regu,'') as category,
                  f.tgl as date
                FROM produksi_selesai f JOIN produksi_selesai_fts fts ON f.id = fts.rowid WHERE produksi_selesai_fts MATCH ?`,
          argCount: 1,
        },
        like: {
          sql: `SELECT 'Produksi Selesai' as type, faktur as id, faktur as label, 'produksi_selesai' as source,
                  nama_prd || ' · Pelanggan: ' || COALESCE(kd_pelanggan,'') || ' · Regu: ' || COALESCE(regu,'') as category,
                  tgl as date
                FROM produksi_selesai WHERE faktur LIKE ? COLLATE NOCASE OR nama_prd LIKE ? COLLATE NOCASE OR kd_pelanggan LIKE ? COLLATE NOCASE`,
          argCount: 3,
        },
      });
    }

    if (hasAccess('produksi_orders')) {
      subqueries.push({
        fts: {
          sql: `SELECT 'Order Produksi' as type, f.faktur as id, f.faktur as label, 'orders' as source,
                  f.nama_prd || ' · Pelanggan: ' || COALESCE(f.nama_pelanggan,'') || ' · ' || COALESCE(f.satuan,'') as category,
                  f.tgl as date
                FROM orders f JOIN orders_fts fts ON f.id = fts.rowid WHERE orders_fts MATCH ?`,
          argCount: 1,
        },
        like: {
          sql: `SELECT 'Order Produksi' as type, faktur as id, faktur as label, 'orders' as source,
                  nama_prd || ' · Pelanggan: ' || COALESCE(nama_pelanggan,'') || ' · ' || COALESCE(satuan,'') as category,
                  tgl as date
                FROM orders WHERE faktur LIKE ? COLLATE NOCASE OR nama_prd LIKE ? COLLATE NOCASE OR nama_pelanggan LIKE ? COLLATE NOCASE`,
          argCount: 3,
        },
      });
    }

    if (hasAccess('penjualan_sph_out')) {
      subqueries.push({
        fts: {
          sql: `SELECT 'SPH Out' as type, f.faktur as id, f.faktur as label, 'sph_out' as source,
                  f.barang || ' · Pelanggan: ' || COALESCE(f.kd_pelanggan,'') || ' · SO: ' || COALESCE(f.faktur_so,'') as category,
                  f.tgl as date
                FROM sph_out f JOIN sph_out_fts fts ON f.id = fts.rowid WHERE sph_out_fts MATCH ?`,
          argCount: 1,
        },
        like: {
          sql: `SELECT 'SPH Out' as type, faktur as id, faktur as label, 'sph_out' as source,
                  barang || ' · Pelanggan: ' || COALESCE(kd_pelanggan,'') || ' · SO: ' || COALESCE(faktur_so,'') as category,
                  tgl as date
                FROM sph_out WHERE faktur LIKE ? COLLATE NOCASE OR kd_pelanggan LIKE ? COLLATE NOCASE OR barang LIKE ? COLLATE NOCASE`,
          argCount: 3,
        },
      });
    }

    if (hasAccess('produksi_jhp')) {
      subqueries.push({
        fts: {
          sql: `SELECT 'JHP' as type, CAST(f.id as TEXT) as id, f.nama_order as label, 'jurnal_harian_produksi' as source,
                  f.nama_karyawan || ' (' || COALESCE(f.jenis_pekerjaan,'') || ') · Order: ' || COALESCE(f.no_order,'') || ' · ' || COALESCE(f.bagian,'') as category,
                  f.tgl as date
                FROM jurnal_harian_produksi f JOIN jurnal_harian_produksi_fts fts ON f.id = fts.rowid WHERE jurnal_harian_produksi_fts MATCH ? AND f.deleted_at IS NULL`,
          argCount: 1,
        },
        like: {
          sql: `SELECT 'JHP' as type, CAST(id as TEXT) as id, nama_order as label, 'jurnal_harian_produksi' as source,
                  nama_karyawan || ' (' || COALESCE(jenis_pekerjaan,'') || ') · Order: ' || COALESCE(no_order,'') || ' · ' || COALESCE(bagian,'') as category,
                  tgl as date
                FROM jurnal_harian_produksi WHERE (nama_order LIKE ? COLLATE NOCASE OR nama_karyawan LIKE ? COLLATE NOCASE OR no_order LIKE ? COLLATE NOCASE) AND deleted_at IS NULL`,
          argCount: 3,
        },
      });
    }

    if (hasAccess('akt_jurnal_umum')) {
      subqueries.push({
        like: {
          sql: `SELECT 'Jurnal Umum' as type, f.faktur as id, f.faktur as label, 'jurnal_umum' as source,
                  COALESCE(f.tgl,'') || ' · ' || COALESCE(f.keterangan,'') || ' · ' || COALESCE(f.rekening,'') as category,
                  f.tgl as date
                FROM jurnal_umum f WHERE f.is_child = 0 AND (f.faktur LIKE ? COLLATE NOCASE OR f.keterangan LIKE ? COLLATE NOCASE OR f.rekening LIKE ? COLLATE NOCASE)`,
          argCount: 3,
        },
      });
    }

    if (hasAccess('pembelian_pr')) {
      subqueries.push({
        like: {
          sql: `SELECT 'PR' as type, f.faktur as id, f.faktur as label, 'purchase_requests' as source,
                  COALESCE(f.tgl,'') || ' · ' || COALESCE(f.keterangan,'') || ' · ' || COALESCE(f.status,'') as category,
                  f.tgl as date
                FROM purchase_requests f WHERE f.faktur LIKE ? COLLATE NOCASE OR f.keterangan LIKE ? COLLATE NOCASE OR f.faktur_po LIKE ? COLLATE NOCASE`,
          argCount: 3,
        },
      });
    }

    if (hasAccess('hpp_kalkulasi')) {
      subqueries.push({
        fts: {
          sql: `SELECT 'HPP' as type, CAST(f.id as TEXT) as id, f.nama_order as label, 'hpp_kalkulasi' as source,
                  'Rp ' || CAST(ROUND(f.hpp_kalkulasi) as TEXT) || ' · ' || COALESCE(f.keterangan,'') as category,
                  NULL as date
                FROM hpp_kalkulasi f JOIN hpp_kalkulasi_fts fts ON f.id = fts.rowid WHERE hpp_kalkulasi_fts MATCH ?`,
          argCount: 1,
        },
        like: {
          sql: `SELECT 'HPP' as type, CAST(id as TEXT) as id, nama_order as label, 'hpp_kalkulasi' as source,
                  'Rp ' || CAST(ROUND(hpp_kalkulasi) as TEXT) || ' · ' || COALESCE(keterangan,'') as category,
                  NULL as date
                FROM hpp_kalkulasi WHERE nama_order LIKE ? COLLATE NOCASE OR keterangan LIKE ? COLLATE NOCASE`,
          argCount: 2,
        },
      });
    }

    if (hasAccess('produksi_barang_jadi')) {
      subqueries.push({
        fts: {
          sql: `SELECT 'Barang Jadi' as type, f.faktur as id, f.nama_barang as label, 'barang_jadi' as source,
                  f.faktur || ' · ' || COALESCE(f.nama_prd,'') || ' · Pelanggan: ' || COALESCE(f.kd_pelanggan,'') as category,
                  f.tgl as date
                FROM barang_jadi f JOIN barang_jadi_fts fts ON f.id = fts.rowid WHERE barang_jadi_fts MATCH ?`,
          argCount: 1,
        },
        like: {
          sql: `SELECT 'Barang Jadi' as type, faktur as id, nama_barang as label, 'barang_jadi' as source,
                  faktur || ' · ' || COALESCE(nama_prd,'') || ' · Pelanggan: ' || COALESCE(kd_pelanggan,'') as category,
                  tgl as date
                FROM barang_jadi WHERE faktur LIKE ? COLLATE NOCASE OR nama_barang LIKE ? COLLATE NOCASE OR nama_prd LIKE ? COLLATE NOCASE`,
          argCount: 3,
        },
      });
    }

    if (hasAccess('penjualan_laporan')) {
      subqueries.push({
        fts: {
          sql: `SELECT 'Laporan Sales' as type, f.faktur as id, f.faktur as label, 'sales_reports' as source,
                  f.nama_pelanggan || ' · ' || COALESCE(f.nama_prd,'') || ' · ' || COALESCE(f.kd_barang,'') as category,
                  f.tgl as date
                FROM sales_reports f JOIN sales_reports_fts fts ON f.id = fts.rowid WHERE sales_reports_fts MATCH ?`,
          argCount: 1,
        },
        like: {
          sql: `SELECT 'Laporan Sales' as type, faktur as id, faktur as label, 'sales_reports' as source,
                  nama_pelanggan || ' · ' || COALESCE(nama_prd,'') || ' · ' || COALESCE(kd_barang,'') as category,
                  tgl as date
                FROM sales_reports WHERE faktur LIKE ? COLLATE NOCASE OR nama_pelanggan LIKE ? COLLATE NOCASE OR kd_pelanggan LIKE ? COLLATE NOCASE`,
          argCount: 3,
        },
      });
    }

    // 3. Eksekusi query database
    let dataResults: SearchResultRow[] = [];
    if (subqueries.length > 0) {
      try {
        let sql = '';
        const args: string[] = [];

        if (ftsQuery) {
          // Gabungkan subquery FTS (fallback ke LIKE untuk tabel yang tidak punya virtual table FTS)
          const parts = subqueries.map((s) => {
            if (s.fts) {
              for (let i = 0; i < s.fts.argCount; i++) args.push(ftsQuery);
              return s.fts.sql;
            }
            for (let i = 0; i < s.like.argCount; i++) args.push(pattern);
            return s.like.sql;
          });
          sql = parts.join('\nUNION ALL\n') + '\nLIMIT 30';
        } else {
          // Fallback LIKE murni
          const parts = subqueries.map((s) => {
            for (let i = 0; i < s.like.argCount; i++) args.push(pattern);
            return s.like.sql;
          });
          sql = parts.join('\nUNION ALL\n') + '\nLIMIT 30';
        }

        const dbResult = await db.execute({ sql, args });
        dataResults = (dbResult.rows || []).map((row) => {
          const r = row as Record<string, unknown>;
          return {
            type: String(r.type ?? ''),
            id: String(r.id ?? ''),
            label: String(r.label ?? ''),
            source: String(r.source ?? ''),
            category: r.category !== undefined && r.category !== null ? String(r.category) : undefined,
            date: normalizeDateToYYYYMMDD(typeof r.date === 'string' ? r.date : null),
          };
        });
      } catch (dbError) {
        console.error('[SEARCH API] Database search error:', dbError);
      }
    }

    // 4. Gabungkan: Menu dulu, lalu Data
    const combinedResults = [...menuResults, ...dataResults];

    return NextResponse.json({ results: combinedResults.slice(0, 20) });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] });
  }
}
