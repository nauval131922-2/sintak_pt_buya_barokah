import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/penonaktifan-master-barang/generate-routine?minBom=3&limit=100
// Analisa frekuensi BOM per kode BJP aktif, kelompokkan kandidat rutin:
// - generik: nama tanpa prefix OP./PO./PR., tanpa no HP, tanpa "NN -"
// - custom: sisanya (sekali-cetak, tidak disarankan)
// Tidak menulis apa pun — hanya usulan, simpan via POST settings.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'Super Admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const minBomRaw = Number(searchParams.get('minBom') ?? '3');
    const minBom = Number.isFinite(minBomRaw) && minBomRaw > 0 ? Math.floor(minBomRaw) : 3;
    const limitRaw = Number(searchParams.get('limit') ?? '100');
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 500) : 100;

    const freqRes = await db.execute({
      sql: `SELECT kd_barang AS kode, COUNT(*) AS n FROM bill_of_materials WHERE kd_barang IS NOT NULL GROUP BY kd_barang`,
    });
    const freq = new Map<string, number>();
    for (const r of freqRes.rows as Array<Record<string, unknown>>) {
      freq.set(String(r.kode ?? ''), Number(r.n ?? 0));
    }

    const bjpRes = await db.execute({
      sql: `SELECT kode, nama FROM stok_master_barang WHERE kd_golongan = 'Barang Jadi Pesanan' AND status LIKE '%checked%'`,
    });
     type Cand = { kode: string; nama: string; bom: number; spk: boolean };
     // kode yang sudah punya SPK berjalan (tertahan engine otomatis, tak perlu rutin)
     const spkRes = await db.execute({
       sql: `SELECT DISTINCT b.kd_barang AS kode FROM bill_of_materials b JOIN orders o ON b.faktur = o.faktur_bom WHERE b.kd_barang IS NOT NULL`,
     });
     const berSpk = new Set((spkRes.rows as Array<Record<string, unknown>>).map((r) => String(r.kode ?? '')));
 
     const opRe = /^\s*(OP|PO|PR)\./i;
     const hpRe = /\+62|08\d{8,}/;
     const nnRe = /\bNN\b\s*-/;
     const generik: Cand[] = [];
     const custom: Cand[] = [];
     for (const r of bjpRes.rows as Array<Record<string, unknown>>) {
       const kode = String(r.kode ?? '');
       const nama = String(r.nama ?? '');
       const bom = freq.get(kode) ?? 0;
       if (bom < minBom) continue;
       const c: Cand = { kode, nama, bom, spk: berSpk.has(kode) };
       if (!opRe.test(nama) && !hpRe.test(nama) && !nnRe.test(nama)) generik.push(c);
       else custom.push(c);
     }
     generik.sort((a, b) => b.bom - a.bom);
     custom.sort((a, b) => b.bom - a.bom);

    return NextResponse.json({
      success: true,
      minBom,
      generik: generik.slice(0, limit),
      generikCount: generik.length,
      custom: custom.slice(0, limit),
      customCount: custom.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
