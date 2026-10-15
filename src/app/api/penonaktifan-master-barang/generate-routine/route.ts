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
    type Cand = { kode: string; nama: string; bom: number; beli: number; so: number; jual: number; spk: boolean };
    const candidateCodes: string[] = [];
    for (const r of bjpRes.rows as Array<Record<string, unknown>>) {
      const kode = String(r.kode ?? '');
      if ((freq.get(kode) ?? 0) >= minBom) {
        candidateCodes.push(kode);
      }
    }

    // Cek kode yang sudah punya SPK berjalan (tertahan engine otomatis, tak perlu rutin)
    // Optimasi: gunakan hash lookup faktur_bom dari orders + filter IN chunk untuk kandidat
    const berSpk = new Set<string>();
    if (candidateCodes.length > 0) {
      const orderFaktursRes = await db.execute({
        sql: `SELECT DISTINCT UPPER(TRIM(faktur_bom)) AS f FROM orders WHERE faktur_bom IS NOT NULL AND TRIM(faktur_bom) != ''`,
      });
      const orderFakturs = new Set(
        (orderFaktursRes.rows as Array<Record<string, unknown>>)
          .map((r) => String(r.f ?? ''))
          .filter(Boolean)
      );

      if (orderFakturs.size > 0) {
        const CH = 400;
        for (let i = 0; i < candidateCodes.length; i += CH) {
          const chunk = candidateCodes.slice(i, i + CH);
          const placeholders = chunk.map(() => '?').join(',');
          const bomRes = await db.execute({
            sql: `SELECT kd_barang, UPPER(TRIM(faktur)) AS f FROM bill_of_materials WHERE kd_barang IN (${placeholders}) AND faktur IS NOT NULL`,
            args: chunk,
          });
          for (const row of bomRes.rows as Array<Record<string, unknown>>) {
            const f = String(row.f ?? '');
            if (orderFakturs.has(f)) {
              berSpk.add(String(row.kd_barang ?? ''));
            }
          }
        }
      }
    }

    // Ambil data teks transaksi sales_reports, sales_orders, dan rekap_pembelian_barang
    const [salesRowsRes, soRowsRes, beliRowsRes] = await Promise.all([
      db.execute({ sql: `SELECT LOWER(kd_barang) AS b FROM sales_reports WHERE kd_barang IS NOT NULL` }),
      db.execute({ sql: `SELECT LOWER(kd_barang) AS b FROM sales_orders WHERE kd_barang IS NOT NULL` }),
      db.execute({ sql: `SELECT LOWER(kd_barang) AS b FROM rekap_pembelian_barang WHERE kd_barang IS NOT NULL` }),
    ]);
    const cleanTx = (raw: unknown) => String(raw ?? '').trim().toLowerCase().replace(/^[a-z0-9]+\s*-\s*/, '');
    const salesTexts = (salesRowsRes.rows as Array<Record<string, unknown>>).map((r) => cleanTx(r.b)).filter(Boolean);
    const soTexts = (soRowsRes.rows as Array<Record<string, unknown>>).map((r) => cleanTx(r.b)).filter(Boolean);
    const beliTexts = (beliRowsRes.rows as Array<Record<string, unknown>>).map((r) => cleanTx(r.b)).filter(Boolean);
    const opRe = /^\s*(OP|PO|PR)\./i;
    const hpRe = /\+62|08\d{8,}/;
    const nnRe = /\bNN\b\s*-/i;
    const customRe = /\bcustom\b/i;
    const clientRe = /\b(tour|travel|pt\b|cv\b|biro|kbihu|haji|umrah|umroh|pesantren|pondok|ponpes|dayah|pp\b|ppsd|pptq|ptyq|smp\b|sma\b|smk\b|man\b|mi\b|mts\b|ma\b|sd\b|tk\b|paud|lmy|yqbs|klinik|dr\.|percetakan|perc\.|kemenag)\b/i;
    const customDocRe = /kalender|buku\s+manasik|^sampul\s+raport|^stopmap|^syahadah|^surat\s+keterangan|^nota\b|^kop\s+pp|^cetak\s+lembaran|rokok|notebook|\bspp\b|tabungan|setoran|hafalan|mura?ja'?ah/i;
    const bookCoverRe = /^Buku\s+(Soft|Hard)\s+Cover|^Album\s+Kenangan/i;
    const sosmedRe = /·\s*(TikTok|Facebook)|@\w+/i;
    const generik: Cand[] = [];
    const custom: Cand[] = [];
    for (const r of bjpRes.rows as Array<Record<string, unknown>>) {
      const kode = String(r.kode ?? '');
      const nama = String(r.nama ?? '');
      const bom = freq.get(kode) ?? 0;
      if (bom < minBom) continue;

      const nm = nama.trim().toLowerCase();
      const isQuddus = nm.includes('quddus');
      const isYanbua = nm.includes('yanbu');
      const isKitab = nm.includes('qorib') || nm.includes('muta') || nm.includes("ta'lim") || nm.includes('talim');

      let nJual = 0;
      let nSo = 0;
      let nBeli = 0;

      if (isQuddus) {
        const varMatch = nm.match(/\b(a97|a1|b1\.d|b1|b2|b3|b5|b97|d65)\b/);
        const variant = varMatch ? varMatch[1] : null;
        if (variant) {
          const varClean = variant.replace('.d', '');
          for (const s of salesTexts) {
            if (s.includes('quddus') && (s.includes(variant) || s.includes(varClean))) nJual++;
          }
          for (const s of soTexts) {
            if (s.includes('quddus') && (s.includes(variant) || s.includes(varClean))) nSo++;
          }
          for (const s of beliTexts) {
            if (s.includes('quddus') && (s.includes(variant) || s.includes(varClean))) nBeli++;
          }
        } else {
          const key = nm.includes('juz 30') ? 'juz 30' : nm.slice(0, 20);
          for (const s of salesTexts) {
            if (s.includes('quddus') && s.includes(key)) nJual++;
          }
          for (const s of soTexts) {
            if (s.includes('quddus') && s.includes(key)) nSo++;
          }
          for (const s of beliTexts) {
            if (s.includes('quddus') && s.includes(key)) nBeli++;
          }
        }
      } else if (isYanbua) {
        for (const s of salesTexts) if (s.includes('yanbu')) nJual++;
        for (const s of soTexts) if (s.includes('yanbu')) nSo++;
        for (const s of beliTexts) if (s.includes('yanbu')) nBeli++;
      } else if (isKitab) {
        for (const s of salesTexts) if (s.includes('qorib') || s.includes('muta') || s.includes("ta'lim") || s.includes('talim')) nJual++;
        for (const s of soTexts) if (s.includes('qorib') || s.includes('muta') || s.includes("ta'lim") || s.includes('talim')) nSo++;
        for (const s of beliTexts) if (s.includes('qorib') || s.includes('muta') || s.includes("ta'lim") || s.includes('talim')) nBeli++;
      } else {
        const words = nm.replace(/[\(\)\[\]\-\,\.]+/g, ' ').trim().split(/\s+/);
        const sub = words.length >= 2 ? words.slice(0, 3).join(' ') : nm;
        for (const s of salesTexts) if (s.includes(sub)) nJual++;
        for (const s of soTexts) if (s.includes(sub)) nSo++;
        for (const s of beliTexts) if (s.includes(sub)) nBeli++;
      }

      const c: Cand = { kode, nama, bom, beli: nBeli, so: nSo, jual: nJual, spk: berSpk.has(kode) };
      const isCustomOrder =
        opRe.test(nama) ||
        hpRe.test(nama) ||
        nnRe.test(nama) ||
        customRe.test(nama) ||
        clientRe.test(nama) ||
        customDocRe.test(nama) ||
        bookCoverRe.test(nama) ||
        sosmedRe.test(nama) ||
        (nJual === 0 && nSo === 0 && nBeli === 0);
      if (!isCustomOrder) generik.push(c);
      else custom.push(c);
    }
    generik.sort((a, b) => b.jual + b.so + b.beli + b.bom - (a.jual + a.so + a.beli + a.bom));
    custom.sort((a, b) => b.jual + b.so + b.beli + b.bom - (a.jual + a.so + a.beli + a.bom));

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
