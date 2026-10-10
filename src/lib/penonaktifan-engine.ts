// engine klasifikasi lap. penonaktifan: kandidat master -> agregat transaksi -> 4 pilar.
// Sumber: stok_master_barang, orders (PR), barang_jadi (PD), sales_reports,
// sales_orders, pengiriman, sph_out (QO), bill_of_materials, purchase_requests.
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

const iso = (tgl: unknown) => ddMmYyyyToIso(tgl);

export async function generateUsulan(cutoffIso: string, limit?: number): Promise<GenerateResult> {
  // 1. Kandidat Pilar 1: BJP + saldo 0 + masih aktif (checked).
  const masterRes = await db.execute({
    sql: `SELECT kode, nama, kd_satuan, kd_golongan, kd_kelompok, saldo, status
          FROM stok_master_barang
          WHERE kd_golongan = ? AND (saldo IS NULL OR saldo = 0)
          ORDER BY kode ASC${limit && limit > 0 ? ` LIMIT ${Math.floor(limit)}` : ''}`,
    args: [GOLONGAN_BJP],
  });
  const kandidatAll = (masterRes.rows as any[]).filter((m) => isMasterAktif(m.status));

  const rows: UsulanRow[] = [];
  const ditolak: GenerateResult['ditolak'] = [];

  for (const m of kandidatAll) {
    const kode: string = String(m.kode);
    const nama: string = String(m.nama ?? '');

    // 2a. PD s.d. cutoff + setelah cutoff (per kd_barang langsung).
    const pdRes = await db.execute({
      sql: `SELECT faktur_prd, qty, qty_wip_akhir, selesai, tgl FROM barang_jadi WHERE kd_barang = ?`,
      args: [kode],
    });
    const pdAll = (pdRes.rows as any[]).map((p) => ({ ...p, iso: iso(p.tgl) }));
    const pdCut = pdAll.filter((p) => p.iso && p.iso <= cutoffIso);
    const hasPostCutoffPD = pdAll.some((p) => p.iso && p.iso > cutoffIso);
    const totPD = pdCut.reduce((s, p) => s + (Number(p.qty) || 0), 0);
    const lastPD = pdCut.sort((a, b) => (a.iso < b.iso ? -1 : 1)).at(-1) ?? null;

    // 2b. PR via faktur_prd PD (strip HTML BOM) + cocok nama di orders.
    const prFakturs = [...new Set(pdAll.map((p) => extractFakturPrd(p.faktur_prd)).filter(Boolean))];
    let totPR = 0;
    if (prFakturs.length > 0) {
      const marks = prFakturs.map(() => '?').join(',');
      const prRes = await db.execute({
        sql: `SELECT qty, tgl FROM orders WHERE faktur IN (${marks})`,
        args: prFakturs,
      });
      totPR = (prRes.rows as any[])
        .filter((o) => { const d = iso(o.tgl); return !d || d <= cutoffIso; })
        .reduce((s, o) => s + (Number(o.qty) || 0), 0);
    }
    // Fallback: PR yang nama_prd-nya memuat kode (re-order lama tanpa link faktur).
    if (totPR === 0) {
      const prNameRes = await db.execute({
        sql: `SELECT qty, tgl FROM orders WHERE nama_prd LIKE ? LIMIT 20`,
        args: [`%${kode}%`],
      });
      totPR = (prNameRes.rows as any[])
        .filter((o) => { const d = iso(o.tgl); return !d || d <= cutoffIso; })
        .reduce((s, o) => s + (Number(o.qty) || 0), 0);
    }

    // 2c. Outflow: PJ / SO / pengiriman per kode.
    const [pjRes, soRes] = await Promise.all([
      db.execute({ sql: `SELECT 1 FROM sales_reports WHERE kd_barang = ? LIMIT 1`, args: [kode] }),
      db.execute({ sql: `SELECT 1 FROM sales_orders WHERE kd_barang = ? LIMIT 1`, args: [kode] }),
    ]);
    const hasOutflow = pjRes.rows.length > 0 || soRes.rows.length > 0;

    // 2d. Jejak hulu: BOM / PR-pembelian / QO (pendukung kategori Batal).
    const [bomRes, qoRes] = await Promise.all([
      db.execute({ sql: `SELECT 1 FROM bill_of_materials WHERE kd_barang = ? LIMIT 1`, args: [kode] }),
      db.execute({ sql: `SELECT 1 FROM sph_out WHERE barang LIKE ? LIMIT 1`, args: [`%${kode}%`] }),
    ]);
    const hasHulu = bomRes.rows.length > 0 || qoRes.rows.length > 0;

    const hasil = klasifikasiItem({
      kode,
      nama,
      totPR,
      totPD,
      lastSelesai: lastPD ? Number(lastPD.selesai) : null,
      lastWipAkhir: lastPD ? Number(lastPD.qty_wip_akhir ?? 0) : null,
      hasPostCutoffPD,
      hasOutflow,
      hasHulu,
    });

    if (!hasil.boleh) {
      ditolak.push({ kode, nama, alasan: hasil.alasan });
      continue;
    }
    rows.push({
      kode,
      nama,
      satuan: String(m.kd_satuan ?? ''),
      golongan: String(m.kd_golongan ?? GOLONGAN_BJP),
      kelompok: String(m.kd_kelompok ?? ''),
      saldo: '0.00',
      kategori: hasil.kategori!,
      alasan: hasil.alasan,
      totPR,
      totPD,
    });
  }

  return { cutoff: cutoffIso, kandidat: kandidatAll.length, bolehCount: rows.length, ditolakCount: ditolak.length, ditolak, rows };
}
