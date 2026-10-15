import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/penonaktifan-master-barang/generate-routine?minBeli=0&minSo=0&minJual=1&limit=100
// Analisa frekuensi transaksi komersial (Pembelian PB, Sales Order, dan Penjualan PJ) per kode BJP aktif:
// - generik: produk massal tanpa prefix OP./PO., tanpa no HP, tanpa nama pemesan/sekolah/instansi
// - custom: pesanan khusus perorangan/lembaga (made-to-order)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'Super Admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const minBeli = Math.max(0, Math.floor(Number(searchParams.get('minBeli') ?? '0') || 0));
    const minSo = Math.max(0, Math.floor(Number(searchParams.get('minSo') ?? '0') || 0));
    const minJual = Math.max(0, Math.floor(Number(searchParams.get('minJual') ?? '1') || 1));
    const limitRaw = Number(searchParams.get('limit') ?? '100');
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 500) : 100;

    // Ambil data transaksi sales_reports, sales_orders, rekap_pembelian_barang, dan master BJP aktif
    const [salesRowsRes, soRowsRes, beliRowsRes, bjpRes] = await Promise.all([
      db.execute({ sql: `SELECT LOWER(kd_barang) AS b FROM sales_reports WHERE kd_barang IS NOT NULL` }),
      db.execute({ sql: `SELECT LOWER(kd_barang) AS b FROM sales_orders WHERE kd_barang IS NOT NULL` }),
      db.execute({ sql: `SELECT LOWER(kd_barang) AS b FROM rekap_pembelian_barang WHERE kd_barang IS NOT NULL` }),
      db.execute({ sql: `SELECT kode, nama FROM stok_master_barang WHERE kd_golongan = 'Barang Jadi Pesanan' AND status LIKE '%checked%'` }),
    ]);

    const cleanStr = (raw: unknown) => {
      const s = String(raw ?? '').trim().toLowerCase().replace(/^(exp|lembar|unit|pcs|bendel|bandel|rim|box|pak|roll|meter|plate|buku)\s*[-/:]\s*/i, '');
      return s.replace(/[`']/g, "'").replace(/\s+/g, ' ').trim();
    };

    // Hitung frekuensi exact per nama/kode ter-normalisasi (O(1) Map lookup)
    const salesCounts = new Map<string, number>();
    for (const r of salesRowsRes.rows as Array<Record<string, unknown>>) {
      const s = cleanStr(r.b);
      if (s) salesCounts.set(s, (salesCounts.get(s) ?? 0) + 1);
    }

    const soCounts = new Map<string, number>();
    for (const r of soRowsRes.rows as Array<Record<string, unknown>>) {
      const s = cleanStr(r.b);
      if (s) soCounts.set(s, (soCounts.get(s) ?? 0) + 1);
    }

    const beliCounts = new Map<string, number>();
    for (const r of beliRowsRes.rows as Array<Record<string, unknown>>) {
      const raw = String(r.b ?? '').trim().toLowerCase();
      // Abaikan bahan baku/penolong (plate, roll laminasi, yellow board, print art, kawat) agar tidak dikira barang jadi
      if (/^(plate|roll|yellow board|print\s+art|kawat|isi staples)/i.test(raw)) continue;
      const s = cleanStr(raw);
      if (s) beliCounts.set(s, (beliCounts.get(s) ?? 0) + 1);
    }

    const opRe = /^\s*(OP|PO|PR)\./i;
    const hpRe = /\+62|08\d{8,}/;
    const nnRe = /\bNN\b\s*-/i;
    const customRe = /\bcustom\b/i;
    const clientRe = /\b(tour|travel|pt\b|cv\b|biro|kbihu|haji|umrah|umroh|pesantren|pondok|ponpes|dayah|pp\b|ppsd|pptq|ptyq|smp\b|sma\b|smk\b|man\b|mi\b|mts\b|ma\b|sd\b|tk\b|paud|lmy|yqbs|klinik|dr\.|percetakan|perc\.|kemenag)\b/i;
    const customDocRe = /kalender|buku\s+manasik|^sampul\s+raport|^stopmap|^syahadah|^surat\s+keterangan|^nota\b|^kop\s+pp|^cetak\s+lembaran|rokok|notebook|\bspp\b|tabungan|setoran|\b(?:buku|kartu|lembar)\s+hafalan\b|mura?ja'?ah/i;
    const bookCoverRe = /^Buku\s+(Soft|Hard)\s+Cover|^Album\s+Kenangan/i;
    const sosmedRe = /·\s*(TikTok|Facebook)|@\w+/i;

    type Cand = { kode: string; nama: string; beli: number; so: number; jual: number };
    const generik: Cand[] = [];
    const custom: Cand[] = [];

    for (const r of bjpRes.rows as Array<Record<string, unknown>>) {
      const kode = String(r.kode ?? '');
      const nama = String(r.nama ?? '');
      const k = kode.toLowerCase();
      const nm = cleanStr(nama);

      // Exact match nama produk ter-normalisasi atau kode barang
      const nJual = (salesCounts.get(nm) ?? 0) + (salesCounts.get(k) ?? 0);
      const nSo = (soCounts.get(nm) ?? 0) + (soCounts.get(k) ?? 0);
      const nBeli = (beliCounts.get(nm) ?? 0) + (beliCounts.get(k) ?? 0);

      // Kriteria ambang batas transaksi komersial (pembelian, SO, penjualan)
      if ((minBeli > 0 && nBeli < minBeli) || (minSo > 0 && nSo < minSo) || (minJual > 0 && nJual < minJual)) {
        continue;
      }
      if (nJual === 0 && nSo === 0 && nBeli === 0) {
        continue;
      }

      const isCustomOrder =
        opRe.test(nama) ||
        hpRe.test(nama) ||
        nnRe.test(nama) ||
        customRe.test(nama) ||
        clientRe.test(nama) ||
        customDocRe.test(nama) ||
        bookCoverRe.test(nama) ||
        sosmedRe.test(nama);

      const c: Cand = { kode, nama, beli: nBeli, so: nSo, jual: nJual };
      if (!isCustomOrder) generik.push(c);
      else custom.push(c);
    }

    generik.sort((a, b) => b.jual + b.so + b.beli - (a.jual + a.so + a.beli));
    custom.sort((a, b) => b.jual + b.so + b.beli - (a.jual + a.so + a.beli));

    return NextResponse.json({
      success: true,
      minBeli,
      minSo,
      minJual,
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
