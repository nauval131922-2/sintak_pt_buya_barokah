import db from '@/lib/db';

type DbRow = Record<string, string | number | null | undefined | Uint8Array | unknown>;

function str(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Uint8Array) return Buffer.from(v).toString('utf-8');
  return String(v);
}

async function ensureTables() {
  await db.execute(`CREATE TABLE IF NOT EXISTS penonaktifan_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    cutoff TEXT NOT NULL,
    created_by TEXT,
    snapshot TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS penonaktifan_review_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    kode TEXT NOT NULL,
    nama TEXT DEFAULT '',
    aksi TEXT NOT NULL,
    alasan TEXT DEFAULT '',
    reviewer TEXT DEFAULT '',
    keputusan TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

export interface ReviewItem {
  id: number;
  kode: string;
  nama: string;
  aksi: 'usul_hapus' | 'usul_tambah';
  alasan: string;
  reviewer: string;
  keputusan: 'pending' | 'setuju' | 'tolak';
}

export interface Review {
  id: number;
  token: string;
  cutoff: string;
  created_by: string;
  snapshot: Array<{ kode: string; nama: string; kategori: string; alasan: string }>;
  status: string;
  items: ReviewItem[];
}

export async function createReview(
  cutoff: string,
  createdBy: string,
  snapshot: Array<{ kode: string; nama: string; kategori: string; alasan: string }>,
): Promise<string> {
  await ensureTables();
  const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  await db.execute({
    sql: `INSERT INTO penonaktifan_reviews (token, cutoff, created_by, snapshot, status) VALUES (?, ?, ?, ?, 'open')`,
    args: [token, cutoff, createdBy, JSON.stringify(snapshot)],
  });
  return token;
}

export async function getReview(token: string): Promise<Review | null> {
  await ensureTables();
  const r = await db.execute({ sql: `SELECT * FROM penonaktifan_reviews WHERE token = ?`, args: [token.trim()] });
  const row = (r.rows as DbRow[])[0];
  if (!row) return null;
  const items = await db.execute({
    sql: `SELECT * FROM penonaktifan_review_items WHERE review_id = ? ORDER BY id ASC`,
    args: [row.id as number],
  });
  let snapshot: Review['snapshot'] = [];
  try {
    const v: unknown = JSON.parse(str(row.snapshot));
    if (Array.isArray(v)) snapshot = v as Review['snapshot'];
  } catch { /* snapshot rusak */ }
  return {
    id: Number(row.id),
    token: str(row.token),
    cutoff: str(row.cutoff),
    created_by: str(row.created_by),
    snapshot,
    status: str(row.status),
    items: (items.rows as DbRow[]).map((x) => ({
      id: Number(x.id),
      kode: str(x.kode),
      nama: str(x.nama),
      aksi: (str(x.aksi) === 'usul_tambah' ? 'usul_tambah' : 'usul_hapus') as ReviewItem['aksi'],
      alasan: str(x.alasan),
      reviewer: str(x.reviewer),
      keputusan: (['pending', 'setuju', 'tolak'].includes(str(x.keputusan)) ? str(x.keputusan) : 'pending') as ReviewItem['keputusan'],
    })),
  };
}

export async function addReviewItems(
  reviewId: number,
  reviewer: string,
  items: Array<{ kode: string; nama: string; aksi: 'usul_hapus' | 'usul_tambah'; alasan: string }>,
): Promise<number> {
  await ensureTables();
  let n = 0;
  for (const it of items) {
    const kode = String(it.kode ?? '').trim();
    if (!/^\d+$/.test(kode)) continue;
    if (it.aksi !== 'usul_hapus' && it.aksi !== 'usul_tambah') continue;
    await db.execute({
      sql: `INSERT INTO penonaktifan_review_items (review_id, kode, nama, aksi, alasan, reviewer, keputusan) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      args: [reviewId, kode, String(it.nama ?? '').slice(0, 200), it.aksi, String(it.alasan ?? '').slice(0, 500), String(reviewer ?? '').slice(0, 80)],
    });
    n++;
  }
  return n;
}

export async function decideReviewItem(id: number, keputusan: 'setuju' | 'tolak'): Promise<void> {
  await ensureTables();
  await db.execute({ sql: `UPDATE penonaktifan_review_items SET keputusan = ? WHERE id = ?`, args: [keputusan, id] });
}

export async function decideReviewItemsBatch(ids: number[], keputusan: 'setuju' | 'tolak'): Promise<void> {
  if (ids.length === 0) return;
  await ensureTables();
  const validIds = ids.filter((x) => Number.isFinite(x) && x > 0);
  if (validIds.length === 0) return;
  const placeholders = validIds.map(() => '?').join(',');
  await db.execute({ sql: `UPDATE penonaktifan_review_items SET keputusan = ? WHERE id IN (${placeholders})`, args: [keputusan, ...validIds] });
}
