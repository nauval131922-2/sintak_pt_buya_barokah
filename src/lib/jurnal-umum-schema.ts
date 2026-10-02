/**
 * Skema tunggal tabel jurnal_umum.
 *
 * Dulu ada 5 definisi CREATE TABLE yang beredar (scrape-jurnal-umum,
 * jurnal-umum, dashboard/akunting-jurnal-terbaru, dashboard/akunting-trend,
 * dashboard-akunting/page) — semua no-op setelah tabel ada, tapi tiap
 * perubahan skema harus diulang konsisten. Satu-satunya sumber kebenaran
 * sekarang fungsi ini.
 *
 * Kolom generated VIRTUAL (dihitung on-read, bisa diindeks — SQLite tidak
 * mengizinkan ALTER ADD COLUMN ... STORED, jadi VIRTUAL dipakai di kedua
 * jalur agar definisi seragam):
 * - create_date: substr(create_at,1,10). Seluruh create_at di DB berformat
 *   ISO YYYY-MM-DD HH:MM:SS (terverifikasi 95rb baris, 0 non-ISO).
 * - rek_head: digit pertama rekening. Parent ber-rekening '' -> '' (bukan
 *   4-9, jadi tidak ikut agregat LR — perilaku sama seperti CAST('')).
 * - rek_kode: kode sebelum ' - ', untuk join arus kas ke rek_akuntansi.
 */

export interface JurnalUmumExecutor {
  execute?: (
    stmt: string | { sql: string; args?: (string | number | null)[] },
  ) => Promise<{ rows?: unknown[] }>;
}
export const JURNAL_UMUM_COLS =
  `id, faktur, tgl, rekening, keterangan, debit, kredit, ` +
  `username, create_at, parent_faktur, is_child, child_order, created_at`;

const CREATE_SQL = `CREATE TABLE IF NOT EXISTS jurnal_umum (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  faktur TEXT NOT NULL,
  tgl TEXT,
  rekening TEXT,
  keterangan TEXT,
  debit REAL,
  kredit REAL,
  username TEXT,
  create_at TEXT,
  parent_faktur TEXT,
  is_child INTEGER DEFAULT 0,
  child_order INTEGER DEFAULT 0,
  raw_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  create_date TEXT GENERATED ALWAYS AS (substr(create_at, 1, 10)) VIRTUAL,
  rek_head TEXT GENERATED ALWAYS AS (substr(trim(rekening), 1, 1)) VIRTUAL,
  rek_kode TEXT GENERATED ALWAYS AS (trim(substr(rekening, 1,
    CASE WHEN instr(rekening, ' - ') > 0
         THEN instr(rekening, ' - ') - 1
         ELSE length(rekening) END))) VIRTUAL,
  UNIQUE(faktur, child_order, is_child)
)`;

let schemaEnsured = false;

export async function ensureJurnalUmumSchema(
  executor: JurnalUmumExecutor,
  force = false,
): Promise<void> {
  if (schemaEnsured && !force) return;

  // bind: Sqlite3Client.execute memakai private field (#db) — detach
  // method (const run = executor.execute) bikin `this` undefined dan
  // error "Cannot read properties of undefined (reading 'Sqlite3Client')"
  // pada build Turbopack. Ini yang merusak Tarik Data 27 Sep.
  const run = executor.execute?.bind(executor);
  if (!run) return;
  const colsRes = await run(`PRAGMA table_info(jurnal_umum)`);
  const colNames = ((colsRes.rows ?? []) as { name?: unknown }[]).map((r) =>
    String(r.name ?? ""),
  );

  // Tabel lama (sebelum child_order) diobrol total — warisan scraper lama.
  if (colNames.length > 0 && !colNames.includes("child_order")) {
    await run(`DROP TABLE IF EXISTS jurnal_umum`);
    colNames.length = 0;
  }

  if (colNames.length === 0) {
    await run(CREATE_SQL);
  } else {
    // Tiap ALTER dibungkus try/catch: dua ensure konkuren (scrape
    // concurrency=2 + page load) bisa sama-sama lolos cek colNames lalu
    // ALTER bersamaan → "duplicate column name". Abaikan yang itu saja.
    const tryAdd = async (sql: string) => {
      try {
        await run(sql);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes("duplicate column name")) throw e;
      }
    };
    if (!colNames.includes("create_date")) {
      await tryAdd(
        `ALTER TABLE jurnal_umum ADD COLUMN create_date TEXT ` +
          `GENERATED ALWAYS AS (substr(create_at, 1, 10)) VIRTUAL`,
      );
    }
    if (!colNames.includes("rek_head")) {
      await tryAdd(
        `ALTER TABLE jurnal_umum ADD COLUMN rek_head TEXT ` +
          `GENERATED ALWAYS AS (substr(trim(rekening), 1, 1)) VIRTUAL`,
      );
    }
    if (!colNames.includes("rek_kode")) {
      await tryAdd(
        `ALTER TABLE jurnal_umum ADD COLUMN rek_kode TEXT ` +
          `GENERATED ALWAYS AS (trim(substr(rekening, 1, ` +
          `CASE WHEN instr(rekening, ' - ') > 0 ` +
          `THEN instr(rekening, ' - ') - 1 ` +
          `ELSE length(rekening) END))) VIRTUAL`,
      );
    }
  }

  await run(
    `CREATE INDEX IF NOT EXISTS idx_jurnal_umum_parent ON jurnal_umum(parent_faktur)`,
  );
  await run(
    `CREATE INDEX IF NOT EXISTS idx_jurnal_umum_list ` +
      `ON jurnal_umum(is_child, tgl, create_at, faktur, id)`,
  );
  await run(
    `CREATE INDEX IF NOT EXISTS idx_jurnal_umum_create_date ` +
      `ON jurnal_umum(is_child, create_date)`,
  );
  await run(
    `CREATE INDEX IF NOT EXISTS idx_jurnal_umum_rek_head ` +
      `ON jurnal_umum(is_child, rek_head)`,
  );
  // Covering index untuk "20 jurnal terbaru": filter is_child + ORDER BY
  // create_at DESC, id DESC. Tanpa ini query terbaru = SCAN 68rb child +
  // sort (±1,3 detik legacy; ±340ms dgn rek_head). Dengan ini ±1ms.
  await run(
    `CREATE INDEX IF NOT EXISTS idx_jurnal_umum_terbaru ` +
      `ON jurnal_umum(is_child, create_at DESC, id DESC)`,
  );
  // Index composite untuk kalkulasi running total pagination (WHERE is_child = 1 AND parent_faktur IN (...))
  // Mengubah full scan 71rb child menjadi direct index seek.
  await run(
    `CREATE INDEX IF NOT EXISTS idx_jurnal_umum_child_parent ` +
      `ON jurnal_umum(is_child, parent_faktur)`,
  );
  await run(
    `CREATE INDEX IF NOT EXISTS idx_jurnal_umum_rek_kode ` +
      `ON jurnal_umum(is_child, rek_kode)`,
  );

  schemaEnsured = true;
}
