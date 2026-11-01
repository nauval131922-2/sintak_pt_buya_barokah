import { NextRequest, NextResponse } from 'next/server';
import db from "@/lib/db";
import { requireApiPermission } from "@/lib/api-guard";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Guard: allow produksi_jhp_sopd, produksi_jhp, and produksi_hasil (called by HasilProduksiClient)
  const gate = await requireApiPermission(['produksi_jhp_sopd', 'produksi_jhp', 'produksi_hasil']);
  if (gate.error) return gate.error;
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    // Dates are stored as DD-MM-YYYY, so we use substr to sort them as YYYY-MM-DD
    const sortExpr = `substr(tgl,7,4)||'-'||substr(tgl,4,2)||'-'||substr(tgl,1,2)`;
    
    let sopdSql = `SELECT DISTINCT no_sopd, nama_order, tgl, qty_sopd, unit FROM sopd WHERE no_sopd IS NOT NULL AND no_sopd != ''`;
    let ordersSql = `SELECT DISTINCT faktur as no_sopd, nama_prd as nama_order, tgl, qty as qty_sopd, satuan as unit FROM orders WHERE faktur IS NOT NULL AND faktur != ''`;
    const args: any[] = [];

    const all = searchParams.get('all') === 'true' || searchParams.get('all') === '1';
    const limitParam = parseInt(searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : (search ? 500 : 300);

    if (search) {
      sopdSql += ` AND (no_sopd LIKE ? OR nama_order LIKE ?)`;
      ordersSql += ` AND (faktur LIKE ? OR nama_prd LIKE ?)`;
      const searchPattern = `%${search}%`;
      args.push(searchPattern, searchPattern);
    }

    if (!all) {
      sopdSql += ` ORDER BY ${sortExpr} DESC LIMIT ${limit}`;
      ordersSql += ` ORDER BY ${sortExpr} DESC LIMIT ${limit}`;
    } else {
      sopdSql += ` ORDER BY ${sortExpr} DESC`;
      ordersSql += ` ORDER BY ${sortExpr} DESC`;
    }

    const [sopdResult, ordersResult] = await db.batch([
      { sql: sopdSql, args },
      { sql: ordersSql, args }
    ], 'read');

    const combined = [
      ...ordersResult.rows.map((r) => {
        const row = r as Record<string, unknown>;
        return { 
          no_sopd: String(row.no_sopd || ''), 
          nama_order: String(row.nama_order || ''), 
          tgl: String(row.tgl || ''),
          qty: Number(row.qty_sopd || 0),
          unit: String(row.unit || '')
        };
      }),
      ...sopdResult.rows.map((r) => {
        const row = r as Record<string, unknown>;
        return { 
          no_sopd: String(row.no_sopd || ''), 
          nama_order: String(row.nama_order || ''), 
          tgl: String(row.tgl || ''),
          qty: Number(row.qty_sopd || 0),
          unit: String(row.unit || '')
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
