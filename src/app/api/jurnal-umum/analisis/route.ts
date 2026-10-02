import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { ensureJurnalUmumSchema } from '@/lib/jurnal-umum-schema';
import type { JurnalUmumExecutor } from '@/lib/jurnal-umum-schema';

export const dynamic = 'force-dynamic';

async function ensureTable() {
  try {
    const executor = (db as unknown as { client?: JurnalUmumExecutor }).client || db;
    if (executor.execute) {
      await ensureJurnalUmumSchema(executor as unknown as JurnalUmumExecutor);
    }
  } catch {
    // Tabel belum ada / belum pernah scrape
  }
}

function classifyCounterpart(head: string, isKas: boolean): string {
  if (isKas) return 'Mutasi Antar Kas / Bank';
  if (head === '1') return 'Piutang & Aset Lancar';
  if (head === '2') return 'Hutang & Kewajiban';
  if (head === '3') return 'Modal & Ekuitas';
  if (head === '4') return 'Penjualan / Omset Tunai';
  if (head === '5') return 'Bahan Baku & HPP Tunai';
  if (head === '6') return 'Biaya & Beban Operasional';
  if (head === '7') return 'Pendapatan Non-Operasional';
  if (head === '8') return 'Beban Non-Operasional';
  if (head === '9') return 'Pajak Penghasilan';
  return 'Lainnya';
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();

    const { searchParams } = new URL(req.url);
    const search  = searchParams.get('q') || '';
    const from    = searchParams.get('from');
    const to      = searchParams.get('to');
    const catFrom = searchParams.get('cat_from');
    const catTo   = searchParams.get('cat_to');
    const rek     = searchParams.get('rek') || '';

    let parentWhere = 'is_child = 0';
    const parentParams: (string | number)[] = [];

    // Filter pencarian
    if (search) {
      const pat = `%${search}%`;
      parentWhere += ` AND (faktur LIKE ? OR keterangan LIKE ? OR rekening LIKE ? OR username LIKE ?)`;
      parentParams.push(pat, pat, pat, pat);
    }

    // Filter rentang tanggal transaksi
    if (from && to) {
      parentWhere += ` AND tgl BETWEEN ? AND ?`;
      parentParams.push(from, to);
    }

    // Filter tanggal dibuat (create_date)
    if (catFrom && catTo) {
      parentWhere += ` AND create_date BETWEEN ? AND ?`;
      parentParams.push(catFrom, catTo);
    }

    // Filter rekening tertentu
    if (rek) {
      parentWhere += ` AND faktur IN (SELECT parent_faktur FROM jurnal_umum WHERE is_child = 1 AND rek_kode = ?)`;
      parentParams.push(rek);
    }

    // Query 1: Total voucher (parent) yang cocok dengan filter
    const countSql = `SELECT COUNT(*) as total FROM jurnal_umum WHERE ${parentWhere}`;

    // Query 2: Agregasi per akun anak (Laba/Rugi: kepala 4-9, dan pos lainnya)
    const accSql = `
      WITH target_parents AS (
        SELECT faktur FROM jurnal_umum WHERE ${parentWhere}
      )
      SELECT
        j.rek_head,
        j.rek_kode,
        j.rekening,
        SUM(j.debit) as total_debit,
        SUM(j.kredit) as total_kredit,
        COUNT(*) as total_baris
      FROM jurnal_umum j
      WHERE j.is_child = 1
        AND j.parent_faktur IN (SELECT faktur FROM target_parents)
      GROUP BY j.rek_head, j.rek_kode, j.rekening
    `;

    // Query 3: Agregasi akun kas (Arus Kas)
    const kasSql = `
      WITH target_parents AS (
        SELECT faktur FROM jurnal_umum WHERE ${parentWhere}
      )
      SELECT
        j.rek_kode,
        j.rekening,
        SUM(j.debit) as kas_masuk,
        SUM(j.kredit) as kas_keluar
      FROM jurnal_umum j
      JOIN rek_akuntansi r ON j.rek_kode = r.kode AND r.arus_kas = 'Kas'
      WHERE j.is_child = 1
        AND j.parent_faktur IN (SELECT faktur FROM target_parents)
      GROUP BY j.rek_kode, j.rekening
      ORDER BY (SUM(j.debit) + SUM(j.kredit)) DESC
    `;

    // Query 4: Tren harian (tgl transaksi) untuk visualisasi grafik
    const trendSql = `
      WITH target_parents AS (
        SELECT faktur, tgl FROM jurnal_umum WHERE ${parentWhere}
      )
      SELECT
        p.tgl,
        COUNT(DISTINCT p.faktur) as total_faktur,
        SUM(CASE WHEN j.rek_head IN ('4','7') THEN j.kredit - j.debit ELSE 0 END) as pendapatan,
        SUM(CASE WHEN j.rek_head IN ('5','6','8','9') THEN j.debit - j.kredit ELSE 0 END) as beban,
        SUM(CASE WHEN r.arus_kas = 'Kas' THEN j.debit ELSE 0 END) as kas_masuk,
        SUM(CASE WHEN r.arus_kas = 'Kas' THEN j.kredit ELSE 0 END) as kas_keluar
      FROM target_parents p
      JOIN jurnal_umum j ON j.is_child = 1 AND j.parent_faktur = p.faktur
      LEFT JOIN rek_akuntansi r ON j.rek_kode = r.kode
      GROUP BY p.tgl
      ORDER BY p.tgl ASC
    `;

    // Query 5: Rincian Sumber Kas Masuk (Lawan rekening yang dikredit saat Kas didebit)
    const inflowSql = `
      WITH target_parents AS (
        SELECT faktur FROM jurnal_umum WHERE ${parentWhere}
      ),
      cash_inflow_vouchers AS (
        SELECT DISTINCT j.parent_faktur
        FROM jurnal_umum j
        JOIN rek_akuntansi r ON j.rek_kode = r.kode AND r.arus_kas = 'Kas'
        WHERE j.is_child = 1 AND j.debit > 0
          AND j.parent_faktur IN (SELECT faktur FROM target_parents)
      )
      SELECT
        other.rek_kode,
        other.rekening,
        other.rek_head,
        SUM(other.kredit) as total_nominal,
        COUNT(DISTINCT other.parent_faktur) as frekuensi,
        EXISTS(SELECT 1 FROM rek_akuntansi r2 WHERE r2.kode = other.rek_kode AND r2.arus_kas = 'Kas') as is_internal_kas
      FROM cash_inflow_vouchers civ
      JOIN jurnal_umum other ON other.parent_faktur = civ.parent_faktur AND other.is_child = 1 AND other.kredit > 0
      GROUP BY other.rek_kode, other.rekening, other.rek_head
      ORDER BY SUM(other.kredit) DESC
      LIMIT 12
    `;

    // Query 6: Rincian Tujuan Pengeluaran Kas (Lawan rekening yang didebit saat Kas dikredit)
    const outflowSql = `
      WITH target_parents AS (
        SELECT faktur FROM jurnal_umum WHERE ${parentWhere}
      ),
      cash_outflow_vouchers AS (
        SELECT DISTINCT j.parent_faktur
        FROM jurnal_umum j
        JOIN rek_akuntansi r ON j.rek_kode = r.kode AND r.arus_kas = 'Kas'
        WHERE j.is_child = 1 AND j.kredit > 0
          AND j.parent_faktur IN (SELECT faktur FROM target_parents)
      )
      SELECT
        other.rek_kode,
        other.rekening,
        other.rek_head,
        SUM(other.debit) as total_nominal,
        COUNT(DISTINCT other.parent_faktur) as frekuensi,
        EXISTS(SELECT 1 FROM rek_akuntansi r2 WHERE r2.kode = other.rek_kode AND r2.arus_kas = 'Kas') as is_internal_kas
      FROM cash_outflow_vouchers cov
      JOIN jurnal_umum other ON other.parent_faktur = cov.parent_faktur AND other.is_child = 1 AND other.debit > 0
      GROUP BY other.rek_kode, other.rekening, other.rek_head
      ORDER BY SUM(other.debit) DESC
      LIMIT 12
    `;

    // Query 7: Proporsi Kategori Pengeluaran Kas (Struktur Kas Keluar)
    const outflowCategoriesSql = `
      WITH target_parents AS (
        SELECT faktur FROM jurnal_umum WHERE ${parentWhere}
      ),
      cash_outflow_vouchers AS (
        SELECT DISTINCT j.parent_faktur
        FROM jurnal_umum j
        JOIN rek_akuntansi r ON j.rek_kode = r.kode AND r.arus_kas = 'Kas'
        WHERE j.is_child = 1 AND j.kredit > 0
          AND j.parent_faktur IN (SELECT faktur FROM target_parents)
      )
      SELECT
        other.rek_head,
        EXISTS(SELECT 1 FROM rek_akuntansi r2 WHERE r2.kode = other.rek_kode AND r2.arus_kas = 'Kas') as is_internal,
        SUM(other.debit) as amount
      FROM cash_outflow_vouchers cov
      JOIN jurnal_umum other ON other.parent_faktur = cov.parent_faktur AND other.is_child = 1 AND other.debit > 0
      GROUP BY 1, 2
    `;

    const [countRes, accRes, kasRes, trendRes, inflowRes, outflowRes, outflowCatRes] = await Promise.all([
      db.execute({ sql: countSql, args: parentParams }),
      db.execute({ sql: accSql, args: parentParams }),
      db.execute({ sql: kasSql, args: parentParams }),
      db.execute({ sql: trendSql, args: parentParams }),
      db.execute({ sql: inflowSql, args: parentParams }),
      db.execute({ sql: outflowSql, args: parentParams }),
      db.execute({ sql: outflowCategoriesSql, args: parentParams }),
    ]);
    const totalVouchers = Number((countRes.rows[0] as { total?: number })?.total ?? 0);

    const pendapatanItems: Array<{
      kode: string;
      rekening: string;
      head: string;
      kategori: string;
      amount: number;
    }> = [];

    const bebanItems: Array<{
      kode: string;
      rekening: string;
      head: string;
      kategori: string;
      amount: number;
    }> = [];

    let totPendapatan = 0;
    let totHpp = 0;
    let totOperasional = 0;
    let totBebanLain = 0;

    for (const raw of accRes.rows) {
      const row = raw as {
        rek_head?: string;
        rek_kode?: string;
        rekening?: string;
        total_debit?: number | null;
        total_kredit?: number | null;
      };
      const head = String(row.rek_head ?? '');
      const kode = String(row.rek_kode ?? '');
      const rekening = String(row.rekening ?? '');
      const debit = Number(row.total_debit ?? 0);
      const kredit = Number(row.total_kredit ?? 0);

      // Pendapatan: Kepala 4 (Usaha) & Kepala 7 (Lain-lain) -> Net = Kredit - Debit
      if (head === '4' || head === '7') {
        const net = kredit - debit;
        if (net !== 0) {
          const kategori = head === '4' ? 'Pendapatan Usaha (Omset)' : 'Pendapatan Lain-lain';
          pendapatanItems.push({ kode, rekening, head, kategori, amount: net });
          totPendapatan += net;
        }
      }
      // Beban: Kepala 5 (HPP), Kepala 6 (Operasional), Kepala 8 (Beban Lain), Kepala 9 (Pajak) -> Net = Debit - Kredit
      else if (head === '5' || head === '6' || head === '8' || head === '9') {
        const net = debit - kredit;
        if (net !== 0) {
          let kategori = 'Beban Operasional';
          if (head === '5') {
            kategori = 'Harga Pokok Penjualan (HPP)';
            totHpp += net;
          } else if (head === '6') {
            kategori = 'Beban Operasional';
            totOperasional += net;
          } else if (head === '8') {
            kategori = 'Beban Lain-lain';
            totBebanLain += net;
          } else {
            kategori = 'Pajak Penghasilan';
            totBebanLain += net;
          }
          bebanItems.push({ kode, rekening, head, kategori, amount: net });
        }
      }
    }

    const totBeban = totHpp + totOperasional + totBebanLain;
    const labaKotor = totPendapatan - totHpp;
    const labaBersih = totPendapatan - totBeban;
    const grossMarginPct = totPendapatan > 0 ? (labaKotor / totPendapatan) * 100 : 0;
    const netMarginPct = totPendapatan > 0 ? (labaBersih / totPendapatan) * 100 : 0;

    // Urutkan akun penyumbang laba terbesar & beban terbesar
    pendapatanItems.sort((a, b) => b.amount - a.amount);
    bebanItems.sort((a, b) => b.amount - a.amount);

    const topUntung = pendapatanItems.slice(0, 10).map((item) => ({
      ...item,
      percentage: totPendapatan > 0 ? Number(((item.amount / totPendapatan) * 100).toFixed(2)) : 0,
    }));

    const topRugi = bebanItems.slice(0, 10).map((item) => ({
      ...item,
      percentage: totBeban > 0 ? Number(((item.amount / totBeban) * 100).toFixed(2)) : 0,
    }));

    // Struktur Proporsi Beban
    const strukturBeban = [
      {
        kategori: 'Harga Pokok Penjualan (HPP)',
        amount: Math.max(0, totHpp),
        percentage: totBeban > 0 ? Number(((Math.max(0, totHpp) / totBeban) * 100).toFixed(1)) : 0,
        color: '#E11D48', // rose-600
      },
      {
        kategori: 'Beban Operasional',
        amount: Math.max(0, totOperasional),
        percentage: totBeban > 0 ? Number(((Math.max(0, totOperasional) / totBeban) * 100).toFixed(1)) : 0,
        color: '#EA580C', // orange-600
      },
      {
        kategori: 'Beban Lain & Pajak',
        amount: Math.max(0, totBebanLain),
        percentage: totBeban > 0 ? Number(((Math.max(0, totBebanLain) / totBeban) * 100).toFixed(1)) : 0,
        color: '#8B5CF6', // purple-500
      },
    ];

    // Arus Kas Breakdown
    let totalKasMasuk = 0;
    let totalKasKeluar = 0;
    const kasBreakdown = (kasRes.rows as Array<{
      rek_kode?: string;
      rekening?: string;
      kas_masuk?: number | null;
      kas_keluar?: number | null;
    }>).map((r) => {
      const masuk = Number(r.kas_masuk ?? 0);
      const keluar = Number(r.kas_keluar ?? 0);
      totalKasMasuk += masuk;
      totalKasKeluar += keluar;
      return {
        kode: String(r.rek_kode ?? ''),
        rekening: String(r.rekening ?? ''),
        kasMasuk: masuk,
        kasKeluar: keluar,
        net: masuk - keluar,
      };
    });
    const netCashflow = totalKasMasuk - totalKasKeluar;

    // Daily Trend — diisi lengkap per tanggal kalender (continuous timeline)
    // agar hari tanpa transaksi (cth: hari libur/Minggu) tidak membuat grafik bolong/melompat
    const trendMap = new Map<string, {
      pend: number;
      bbn: number;
      kMasuk: number;
      kKeluar: number;
      fakturCount: number;
    }>();

    for (const raw of trendRes.rows) {
      const r = raw as {
        tgl?: string;
        pendapatan?: number | null;
        beban?: number | null;
        kas_masuk?: number | null;
        kas_keluar?: number | null;
        total_faktur?: number | null;
      };
      const t = String(r.tgl ?? '');
      if (t) {
        trendMap.set(t, {
          pend: Number(r.pendapatan ?? 0),
          bbn: Number(r.beban ?? 0),
          kMasuk: Number(r.kas_masuk ?? 0),
          kKeluar: Number(r.kas_keluar ?? 0),
          fakturCount: Number(r.total_faktur ?? 0),
        });
      }
    }

    let rangeStart = from || catFrom;
    let rangeEnd = to || catTo;

    if (!rangeStart && trendRes.rows.length > 0) {
      rangeStart = String((trendRes.rows[0] as { tgl?: string }).tgl ?? '');
    }
    if (!rangeEnd && trendRes.rows.length > 0) {
      rangeEnd = String((trendRes.rows[trendRes.rows.length - 1] as { tgl?: string }).tgl ?? '');
    }

    const dailyTrend: Array<{
      date: string;
      pendapatan: number;
      beban: number;
      labaRugi: number;
      cumLabaRugi: number;
      kasMasuk: number;
      kasKeluar: number;
      netKas: number;
      cumCashflow: number;
      fakturCount: number;
    }> = [];

    let cumLabaRugi = 0;
    let cumCashflow = 0;

    if (rangeStart && rangeEnd && rangeStart <= rangeEnd) {
      const dCurr = new Date(rangeStart + 'T12:00:00Z');
      const dEnd = new Date(rangeEnd + 'T12:00:00Z');

      let safetyLimit = 366;
      while (dCurr <= dEnd && safetyLimit-- > 0) {
        const y = dCurr.getUTCFullYear();
        const m = String(dCurr.getUTCMonth() + 1).padStart(2, '0');
        const d = String(dCurr.getUTCDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const item = trendMap.get(dateStr) || { pend: 0, bbn: 0, kMasuk: 0, kKeluar: 0, fakturCount: 0 };
        const lrHari = item.pend - item.bbn;
        const akHari = item.kMasuk - item.kKeluar;
        cumLabaRugi += lrHari;
        cumCashflow += akHari;

        dailyTrend.push({
          date: dateStr,
          pendapatan: item.pend,
          beban: item.bbn,
          labaRugi: lrHari,
          cumLabaRugi,
          kasMasuk: item.kMasuk,
          kasKeluar: item.kKeluar,
          netKas: akHari,
          cumCashflow,
          fakturCount: item.fakturCount,
        });

        dCurr.setUTCDate(dCurr.getUTCDate() + 1);
      }
    } else {
      for (const [dateStr, item] of trendMap.entries()) {
        const lrHari = item.pend - item.bbn;
        const akHari = item.kMasuk - item.kKeluar;
        cumLabaRugi += lrHari;
        cumCashflow += akHari;
        dailyTrend.push({
          date: dateStr,
          pendapatan: item.pend,
          beban: item.bbn,
          labaRugi: lrHari,
          cumLabaRugi,
          kasMasuk: item.kMasuk,
          kasKeluar: item.kKeluar,
          netKas: akHari,
          cumCashflow,
          fakturCount: item.fakturCount,
        });
      }
    }
    const cashInflows = (inflowRes.rows as Array<{
      rek_kode?: string;
      rekening?: string;
      rek_head?: string;
      total_nominal?: number | null;
      frekuensi?: number | null;
      is_internal_kas?: number | boolean | null;
    }>).map((r) => {
      const amount = Number(r.total_nominal ?? 0);
      const isInternal = Boolean(r.is_internal_kas);
      const head = String(r.rek_head ?? '');
      return {
        kode: String(r.rek_kode ?? ''),
        rekening: String(r.rekening ?? ''),
        amount,
        frekuensi: Number(r.frekuensi ?? 0),
        isInternalKas: isInternal,
        kategori: classifyCounterpart(head, isInternal),
        percentage: totalKasMasuk > 0 ? Number(((amount / totalKasMasuk) * 100).toFixed(2)) : 0,
      };
    });

    const cashOutflows = (outflowRes.rows as Array<{
      rek_kode?: string;
      rekening?: string;
      rek_head?: string;
      total_nominal?: number | null;
      frekuensi?: number | null;
      is_internal_kas?: number | boolean | null;
    }>).map((r) => {
      const amount = Number(r.total_nominal ?? 0);
      const isInternal = Boolean(r.is_internal_kas);
      const head = String(r.rek_head ?? '');
      return {
        kode: String(r.rek_kode ?? ''),
        rekening: String(r.rekening ?? ''),
        amount,
        frekuensi: Number(r.frekuensi ?? 0),
        isInternalKas: isInternal,
        kategori: classifyCounterpart(head, isInternal),
        percentage: totalKasKeluar > 0 ? Number(((amount / totalKasKeluar) * 100).toFixed(2)) : 0,
      };
    });

    // Struktur Proporsi Pengeluaran Kas
    const kasOutflowGroups = {
      hutang: { kategori: 'Pembayaran Hutang Supplier', amount: 0, color: '#E11D48' },
      gaji: { kategori: 'Gaji Pabrik & Tenaga Kerja', amount: 0, color: '#EA580C' },
      bahan: { kategori: 'Pembelian Bahan & Porsekot', amount: 0, color: '#0284C7' },
      operasional: { kategori: 'Beban Operasional Kantor', amount: 0, color: '#D97706' },
      lainnya: { kategori: 'Bunga Bank & Beban Lain', amount: 0, color: '#8B5CF6' },
      internal: { kategori: 'Mutasi Antar Kas / Bank', amount: 0, color: '#64748B' },
    };

    let totOutflowCat = 0;
    for (const raw of outflowCatRes.rows as Array<{ rek_head?: string; is_internal?: number | boolean; amount?: number | null }>) {
      const amt = Number(raw.amount ?? 0);
      const isInternal = Boolean(raw.is_internal);
      const head = String(raw.rek_head ?? '');
      totOutflowCat += amt;

      if (isInternal) {
        kasOutflowGroups.internal.amount += amt;
      } else if (head === '2') {
        kasOutflowGroups.hutang.amount += amt;
      } else if (head === '5') {
        kasOutflowGroups.gaji.amount += amt;
      } else if (head === '1') {
        kasOutflowGroups.bahan.amount += amt;
      } else if (head === '6') {
        kasOutflowGroups.operasional.amount += amt;
      } else {
        kasOutflowGroups.lainnya.amount += amt;
      }
    }

    const strukturKasKeluar = Object.values(kasOutflowGroups)
      .filter((g) => g.amount > 0)
      .map((g) => ({
        ...g,
        percentage: totOutflowCat > 0 ? Number(((g.amount / totOutflowCat) * 100).toFixed(1)) : 0,
      }));

    return NextResponse.json({
      success: true,
      summary: {
        totalVouchers,
        totalPendapatan: totPendapatan,
        totalHpp: totHpp,
        labaKotor,
        grossMarginPct,
        totalBebanOperasional: totOperasional,
        totalBebanLain: totBebanLain,
        totalBeban: totBeban,
        labaBersih,
        netMarginPct,
        isProfit: labaBersih >= 0,
        totalKasMasuk,
        totalKasKeluar,
        netCashflow,
      },
      topUntung,
      topRugi,
      strukturBeban,
      kasBreakdown,
      cashInflows,
      cashOutflows,
      strukturKasKeluar,
      dailyTrend,
    });
  } catch (error: unknown) {
    console.error('API Error (jurnal-umum-analisis):', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
