// engine klasifikasi lap. penonaktifan: kandidat master -> agregat transaksi -> 4 pilar.
// Sumber: stok_master_barang, orders (PR), barang_jadi (PD), sales_reports,
// sales_orders, sph_out (QO), bill_of_materials, usr_log (outflow PJ/SM/SV).
// Settings (rutin + idle) dari system_settings via penonaktifan-settings.
import db from '@/lib/db';
import {
  GOLONGAN_BJP,
  extractFakturPrd,
  isMasterAktif,
  ddMmYyyyToIso,
  klasifikasiItem,
  type KategoriNonaktif,
  type OutflowBukti,
} from '@/lib/penonaktifan-master';
import { getPenonaktifanSettings, isRoutineProduct } from '@/lib/penonaktifan-settings';

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
  idleDays: number;
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

// tgl usr_log bisa 'yyyy-mm-dd' atau 'yyyy-mm-dd HH:MM:SS' -> potong 10 char.
function logTgl(v: DbVal): string {
  const s = str(v).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

interface ParsedLog {
  channel: string;
  tgl: string;
  payload: Record<string, unknown>;
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    const v: unknown = JSON.parse(raw);
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function generateUsulan(cutoffIso: string, limit?: number): Promise<GenerateResult> {
  const settings = await getPenonaktifanSettings();

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

  // 2. Bulk transaksi per kode (chunk IN 400).
  const CH = 400;
  const chunks: string[][] = [];
  for (let i = 0; i < kodes.length; i += CH) chunks.push(kodes.slice(i, i + CH));

  const pdByKode = new Map<string, PdAgg>();
  const huluTgl = new Map<string, string>(); // kode -> tgl hulu terakhir (BOM/QO/SO)
  const bomSet = new Set<string>();
  for (const ch of chunks) {
    const marks = ch.map(() => '?').join(',');
    const [pd, bom, so] = await Promise.all([
      db.execute({ sql: `SELECT kd_barang, faktur_prd, qty, qty_wip_akhir, selesai, tgl FROM barang_jadi WHERE kd_barang IN (${marks})`, args: [...ch] }),
      db.execute({ sql: `SELECT kd_barang, tgl FROM bill_of_materials WHERE kd_barang IN (${marks})`, args: [...ch] }),
      db.execute({ sql: `SELECT kd_barang, tgl FROM sales_orders WHERE kd_barang IN (${marks})`, args: [...ch] }),
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
    const touchHulu = (k: string, iso: string) => {
      if (!kodeSet.has(k) || !iso || iso > cutoffIso) return;
      const prev = huluTgl.get(k);
      if (!prev || iso > prev) huluTgl.set(k, iso);
    };
    for (const r of bom.rows as DbRow[]) {
      const k = str(r.kd_barang);
      bomSet.add(k);
      touchHulu(k, ddMmYyyyToIso(str(r.tgl)));
    }
    for (const r of so.rows as DbRow[]) touchHulu(str(r.kd_barang), ddMmYyyyToIso(str(r.tgl)));
  }

  // 3. PR: satu query untuk semua faktur_prd distinct + fallback scan nama.
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
  const needFallback = kodes.filter((k) => {
    const a = pdByKode.get(k);
    const tot = [...(a?.prFakturs ?? [])].reduce((s, f) => s + (prQty.get(f) ?? 0), 0);
    return tot === 0;
  });
  const fallbackPR = new Map<string, number>();
  if (needFallback.length > 0) {
    const allOrders = await db.execute({ sql: `SELECT qty, tgl, nama_prd FROM orders` });
    for (const r of allOrders.rows as DbRow[]) {
      const d = ddMmYyyyToIso(str(r.tgl));
      if (d && d > cutoffIso) continue;
      const nm = str(r.nama_prd);
      for (const k of needFallback) {
        if (nm.includes(k)) fallbackPR.set(k, (fallbackPR.get(k) ?? 0) + num(r.qty));
      }
    }
  }

  // 4. QO hulu bertanggal: cocokkan kode di teks barang (satu scan).
  const qoSet = new Set<string>();
  {
    const qo = await db.execute({ sql: `SELECT barang, tgl FROM sph_out` });
    for (const r of qo.rows as DbRow[]) {
      const d = ddMmYyyyToIso(str(r.tgl));
      if (d && d > cutoffIso) continue;
      const b = str(r.barang);
      for (const k of kodes) {
        if (b.includes(k)) {
          qoSet.add(k);
          if (d) {
            const prev = huluTgl.get(k);
            if (!prev || d > prev) huluTgl.set(k, d);
          }
          break;
        }
      }
    }
  }

  // 5. Outflow PJ/SM/SV dari usr_log (filter channel + tgl <= cutoff di SQL).
  const outflowByKode = new Map<string, OutflowBukti[]>();
  const pushOut = (k: string, o: OutflowBukti) => {
    if (!kodeSet.has(k)) return;
    const arr = outflowByKode.get(k);
    if (arr) arr.push(o);
    else outflowByKode.set(k, [o]);
  };
  {
    const logs = await db.execute({
      sql: `SELECT channel, tgl, data_json FROM usr_log
            WHERE channel IN ('Penjualan', 'Barang Keluar', 'Barang Konversi') AND tgl <= ?`,
      args: [cutoffIso],
    });
    for (const r of logs.rows as DbRow[]) {
      const channel = str(r.channel);
      const tgl = logTgl(r.tgl);
      if (!tgl || tgl > cutoffIso) continue;
      const p = safeJson(str(r.data_json));
      const faktur = str(p.faktur);
      const detil: unknown = p.detil;
      if (!Array.isArray(detil)) continue;
      for (const d of detil) {
        if (!d || typeof d !== 'object') continue;
        const row = d as Record<string, unknown>;
        if (channel === 'Barang Konversi') {
          const asal = str(row.kd_barang_asal);
          if (asal) pushOut(asal, { jenis: 'SV', faktur, tgl });
        } else {
          const kb = str(row.kd_barang);
          if (kb) pushOut(kb, { jenis: channel === 'Penjualan' ? 'PJ' : 'SM', faktur, tgl });
        }
      }
    }
  }

  // 6. Klasifikasi per kode (murni, tanpa I/O).
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
      totPR,
      totPD,
      lastSelesai: a?.lastSelesai ?? null,
      lastWipAkhir: a?.lastWip ?? null,
      hasPostCutoffPD: a?.hasPost ?? false,
      isRoutine: isRoutineProduct(nama, kode, settings),
      outflows: outflowByKode.get(kode) ?? [],
      lastHuluIso: huluTgl.get(kode) ?? '',
      idleDays: settings.idle_days,
      cutoffIso,
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

  return { cutoff: cutoffIso, kandidat: kandidat.length, bolehCount: rows.length, ditolakCount: ditolak.length, ditolak, rows, idleDays: settings.idle_days };
}
