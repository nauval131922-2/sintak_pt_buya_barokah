import { NextRequest, NextResponse } from 'next/server';
import db from "@/lib/db";
import { requireApiPermission } from "@/lib/api-guard";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Guard: allow produksi_jhp_sopd, produksi_jhp, produksi_hasil, and produksi_rencana_produksi
  const gate = await requireApiPermission(['produksi_jhp_sopd', 'produksi_jhp', 'produksi_hasil', 'produksi_rencana_produksi']);
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    // Dates are stored as DD-MM-YYYY, so we use substr to sort them as YYYY-MM-DD
    const sortExpr = `substr(tgl,7,4)||'-'||substr(tgl,4,2)||'-'||substr(tgl,1,2)`;
    
    let sopdSql = `SELECT DISTINCT s.no_sopd, s.nama_order, s.tgl, s.qty_sopd, s.unit, o.nama_pelanggan, sh.deadline_date, json_extract(o.raw_data, '$.spesifikasi') as spesifikasi
      FROM sopd s 
      LEFT JOIN orders o ON (o.faktur = s.no_sopd OR o.nama_prd LIKE '%' || s.no_sopd || '%')
      LEFT JOIN sopd_harga sh ON sh.no_sopd = s.no_sopd 
      WHERE s.no_sopd IS NOT NULL AND s.no_sopd != ''`;
    let ordersSql = `SELECT DISTINCT o.faktur as no_sopd, o.nama_prd as nama_order, o.tgl, o.qty as qty_sopd, o.satuan as unit, o.nama_pelanggan, sh.deadline_date, json_extract(o.raw_data, '$.spesifikasi') as spesifikasi
      FROM orders o 
      LEFT JOIN sopd_harga sh ON sh.no_sopd = o.faktur 
      WHERE o.faktur IS NOT NULL AND o.faktur != ''`;
    const args: any[] = [];

    const all = searchParams.get('all') === 'true' || searchParams.get('all') === '1';
    const limitParam = parseInt(searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : (search ? 500 : 300);

    if (search) {
      sopdSql += ` AND (s.no_sopd LIKE ? OR s.nama_order LIKE ? OR o.nama_pelanggan LIKE ?)`;
      ordersSql += ` AND (o.faktur LIKE ? OR o.nama_prd LIKE ? OR o.nama_pelanggan LIKE ?)`;
      const searchPattern = `%${search}%`;
      args.push(searchPattern, searchPattern, searchPattern);
    }

    if (!all) {
      sopdSql += ` ORDER BY substr(s.tgl,7,4)||'-'||substr(s.tgl,4,2)||'-'||substr(s.tgl,1,2) DESC, s.no_sopd DESC LIMIT ${limit}`;
      ordersSql += ` ORDER BY substr(o.tgl,7,4)||'-'||substr(o.tgl,4,2)||'-'||substr(o.tgl,1,2) DESC, o.faktur DESC LIMIT ${limit}`;
    } else {
      sopdSql += ` ORDER BY substr(s.tgl,7,4)||'-'||substr(s.tgl,4,2)||'-'||substr(s.tgl,1,2) DESC, s.no_sopd DESC`;
      ordersSql += ` ORDER BY substr(o.tgl,7,4)||'-'||substr(o.tgl,4,2)||'-'||substr(o.tgl,1,2) DESC, o.faktur DESC`;
    }

    const [sopdResult, ordersResult] = await db.batch([
      { sql: sopdSql, args },
      { sql: ordersSql, args }
    ], 'read');

    const combined = [
      ...ordersResult.rows.map((r) => {
        const row = r as Record<string, unknown>;
        const cust = String(row.nama_pelanggan || '').trim();
        return { 
          no_sopd: String(row.no_sopd || ''), 
          nama_order: String(row.nama_order || ''), 
          tgl: String(row.tgl || ''),
          qty: Number(row.qty_sopd || 0),
          unit: String(row.unit || ''),
          pelanggan: cust,
          nama_pelanggan: cust,
          deadline_date: String(row.deadline_date || ''),
          spesifikasi: String(row.spesifikasi || '')
        };
      }),
      ...sopdResult.rows.map((r) => {
        const row = r as Record<string, unknown>;
        const cust = String(row.nama_pelanggan || '').trim();
        return { 
          no_sopd: String(row.no_sopd || ''), 
          nama_order: String(row.nama_order || ''), 
          tgl: String(row.tgl || ''),
          qty: Number(row.qty_sopd || 0),
          unit: String(row.unit || ''),
          pelanggan: cust,
          nama_pelanggan: cust,
          deadline_date: String(row.deadline_date || ''),
          spesifikasi: String(row.spesifikasi || '')
        };
      })
    ];

    // Deduplicate by no_sopd, keeping the last occurrence (which is now SOPD due to the reversed spread)
    const unique = Array.from(new Map(combined.map(item => [item.no_sopd, item])).values());

    return NextResponse.json({ success: true, data: unique });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
