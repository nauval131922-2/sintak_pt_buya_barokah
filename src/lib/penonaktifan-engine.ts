// engine klasifikasi lap. penonaktifan: kandidat master -> agregat transaksi -> 4 pilar.
// BULK: 6 query total (tanpa N+1 per kode). Tabel kecil (2-7rb baris) diagregasi di JS.
// Sumber: stok_master_barang, orders (PR), barang_jadi (PD), sales_reports,
// sales_orders, sph_out (QO), bill_of_materials.
import db from '@/lib/db';
import {
  GOLONGAN_BJP,
  extractFakturPrd,
  isMasterAktif,
  ddMmYyyyToIso,
  klasifikasiItem,
  type KategoriNonaktif,
} from '@/lib/penonaktifan-master';

export interface UsulanRow {
  kode: string;
  nama: string;
  satuan: string;
  golongan: string;
  kelompok: string;
  saldo: string;
  kategori: KategoriNonaktif;
  alasan: string;
  totPR: number;
  totPD: number;
}

export interface GenerateResult {
  cutoff: string; // yyyy-mm-dd
  kandidat: number;
  bolehCount: number;
  ditolakCount: number;
  ditolak: { kode: string; nama: string; alasan: string }[];
  rows: UsulanRow[];
}

type DbVal = string | number | null | undefined | Uint8Array | unknown;
type DbRow = Record<string, DbVal>;

function str(v: DbVal): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Uint8Array) return Buffer.from(v).toString('utf-8');
  return String(v);
}

function num(v: DbVal): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

interface PdAgg {
  totPD: number;
  hasPost: boolean;
  lastSelesai: number | null;
  lastWip: number | null;
  prFakturs: Set<string>;
}

export async function generateUsulan(cutoffIso: string, limit?: number): Promise<GenerateResult> {
  // 1. Kandidat Pilar 1: BJP + saldo 0 + masih aktif (checked).
  const cap = limit && limit > 0 ? ` LIMIT ${Math.floor(limit)}` : '';
  const masterRes = await db.execute({
    sql: `SELECT kode, nama, kd_satuan, kd_golongan, kd_kelompok, status
          FROM stok_master_barang
          WHERE kd_golongan = ? AND (saldo IS NULL OR saldo = 0)
          ORDER BY kode ASC${cap}`,
    args: [GOLONGAN_BJP],
  });
  const kandidat = (masterRes.rows as DbRow[]).filter((m) => isMasterAktif(str(m.status)));
  const kodes = kandidat.map((m) => str(m.kode));
  const kodeSet = new Set(kodes);

  // 2. Bulk transaksi (6 query, chunk IN 400 agar hemat variabel).
  const CH = 400;
  const chunks: string[][] = [];
  for (let i = 0; i < kodes.length; i += CH) chunks.push(kodes.slice(i, i + CH));

  const pdByKode = new Map<string, PdAgg>();
  const pjSet = new Set<string>();
  const soSet = new Set<string>();
  const bomSet = new Set<string>();
  for (const ch of chunks) {
    const marks = ch.map(() => '?').join(',');
    const [pd, pj, so, bom] = await Promise.all([
      db.execute({ sql: `SELECT kd_barang, faktur_prd, qty, qty_wip_akhir, selesai, tgl FROM barang_jadi WHERE kd_barang IN (${marks})`, args: [...ch] }),
      db.execute({ sql: `SELECT DISTINCT kd_barang FROM sales_reports WHERE kd_barang IN (${marks})`, args: [...ch] }),
      db.execute({ sql: `SELECT DISTINCT kd_barang FROM sales_orders WHERE kd_barang IN (${marks})`, args: [...ch] }),
      db.execute({ sql: `SELECT DISTINCT kd_barang FROM bill_of_materials WHERE kd_barang IN (${marks})`, args: [...ch] }),
    ]);
    for (const r of pd.rows as DbRow[]) {
      const k = str(r.kd_barang);
      if (!kodeSet.has(k)) continue;
      let a = pdByKode.get(k);
      if (!a) { a = { totPD: 0, hasPost: false, lastSelesai: null, lastWip: null, prFakturs: new Set<string>() }; pdByKode.set(k, a); }
      const d = ddMmYyyyToIso(str(r.tgl));
      const f = extractFakturPrd(str(r.faktur_prd));
      if (f) a.prFakturs.add(f);
      if (!d) continue;
      if (d > cutoffIso) { a.hasPost = true; continue; }
      a.totPD += num(r.qty);
      a.lastSelesai = num(r.selesai);
      a.lastWip = num(r.qty_wip_akhir);
    }
    for (const r of pj.rows as DbRow[]) pjSet.add(str(r.kd_barang));
    for (const r of so.rows as DbRow[]) soSet.add(str(r.kd_barang));
    for (const r of bom.rows as DbRow[]) bomSet.add(str(r.kd_barang));
  }

  // 3. PR: satu query untuk semua faktur_prd distinct + fallback nama per kode.
  const allPrFakturs = [...new Set([...pdByKode.values()].flatMap((a) => [...a.prFakturs]))];
  const prQty = new Map<string, number>();
  for (let i = 0; i < allPrFakturs.length; i += CH) {
    const ch = allPrFakturs.slice(i, i + CH);
    const marks = ch.map(() => '?').join(',');
    const pr = await db.execute({ sql: `SELECT faktur, qty, tgl FROM orders WHERE faktur IN (${marks})`, args: [...ch] });
    for (const r of pr.rows as DbRow[]) {
      const d = ddMmYyyyToIso(str(r.tgl));
      if (d && d > cutoffIso) continue;
      const f = str(r.faktur).toUpperCase();
      prQty.set(f, (prQty.get(f) ?? 0) + num(r.qty));
    }
  }
  // Fallback re-order lama: orders yang nama_prd-nya memuat kode (satu scan).
  const needFallback = kodes.filter((k) => {
    const a = pdByKode.get(k);
    const tot = [...(a?.prFakturs ?? [])].reduce((s, f) => s + (prQty.get(f) ?? 0), 0);
    return tot === 0;
  });
  const fallbackPR = new Map<string, number>();
  if (needFallback.length > 0) {
    const allOrders = await db.execute({ sql: `SELECT faktur, qty, tgl, nama_prd FROM orders` });
    for (const r of allOrders.rows as DbRow[]) {
      const d = ddMmYyyyToIso(str(r.tgl));
      if (d && d > cutoffIso) continue;
      const nm = str(r.nama_prd);
      for (const k of needFallback) {
        if (nm.includes(k)) fallbackPR.set(k, (fallbackPR.get(k) ?? 0) + num(r.qty));
      }
    }
  }

  // 4. QO hulu: satu scan sph_out, cocokkan kode di JS (kolom barang teks bebas).
  const qoSet = new Set<string>();
  if (needFallback.length > 0 || true) {
    const qo = await db.execute({ sql: `SELECT barang FROM sph_out` });
    for (const r of qo.rows as DbRow[]) {
      const b = str(r.barang);
      for (const k of kodes) {
        if (b.includes(k)) { qoSet.add(k); break; }
      }
    }
  }

  // 5. Klasifikasi per kode (murni, tanpa I/O).
  const rows: UsulanRow[] = [];
  const ditolak: GenerateResult['ditolak'] = [];
  for (const m of kandidat) {
    const kode = str(m.kode);
    const nama = str(m.nama);
    const a = pdByKode.get(kode);
    const totPD = a?.totPD ?? 0;
    let totPR = [...(a?.prFakturs ?? [])].reduce((s, f) => s + (prQty.get(f) ?? 0), 0);
    if (totPR === 0) totPR = fallbackPR.get(kode) ?? 0;

    const hasil = klasifikasiItem({
      kode,
      nama,
      totPR,
      totPD,
      lastSelesai: a?.lastSelesai ?? null,
      lastWipAkhir: a?.lastWip ?? null,
      hasPostCutoffPD: a?.hasPost ?? false,
      hasOutflow: pjSet.has(kode) || soSet.has(kode),
      hasHulu: bomSet.has(kode) || qoSet.has(kode),
    });

    if (!hasil.boleh) {
      ditolak.push({ kode, nama, alasan: hasil.alasan });
      continue;
    }
    rows.push({
      kode,
      nama,
      satuan: str(m.kd_satuan),
      golongan: str(m.kd_golongan) || GOLONGAN_BJP,
      kelompok: str(m.kd_kelompok),
      saldo: '0.00',
      kategori: hasil.kategori ?? 'B_BATAL',
      alasan: hasil.alasan,
      totPR,
      totPD,
    });
  }

  return { cutoff: cutoffIso, kandidat: kandidat.length, bolehCount: rows.length, ditolakCount: ditolak.length, ditolak, rows };
}
