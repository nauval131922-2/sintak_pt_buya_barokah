// date-sort.ts
// Parser tanggal fleksibel (dipindah dari LaporanPekerjaanClient agar bisa dipakai server: API filter & backfill).
// Format didukung: "3-Jan-26", "9-Agu-26", "03/01/2026", "3-1-26", "2026-01-03", dsb.

const dateSortCache = new Map<string, number>();

const MONTH_MAP: Record<string, number> = {
  jan: 0, januari: 0, january: 0,
  feb: 1, februari: 1, february: 1,
  mar: 2, maret: 2, march: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  agu: 7, ags: 7, agt: 7, aug: 7, agustus: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  okt: 9, oct: 9, oktober: 9, october: 9,
  nov: 10, november: 10,
  des: 11, dec: 11, desember: 11, december: 11,
};

export function parseDateToSort(str: string): number {
  if (!str || !str.trim()) return 0;
  const s = str.trim();
  const cached = dateSortCache.get(s);
  if (cached !== undefined) return cached;

  let result = 0;

  // 1. Format text-month: "3-Jan-26", "18-Jan-2026", "9-Agu-26", "13-Mei-26", "30-Okt-25", "3.Jan.26", "3 Jan 26"
  const m1 = s.match(/^(\d{1,2})[\s\-\/\.]([a-zA-Z]+)[\s\-\/\.](\d{2,4})$/);
  if (m1) {
    const day = parseInt(m1[1], 10);
    const mStr = m1[2].toLowerCase();
    const month = MONTH_MAP[mStr];
    let year = parseInt(m1[3], 10);
    if (year < 100) year += 2000;
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      result = new Date(year, month, day, 12, 0, 0).getTime();
    }
  }

  // 2. Format text-month reversed: "Jan-3-26", "Jan 3 2026"
  if (!result) {
    const mRev = s.match(/^([a-zA-Z]+)[\s\-\/\.](\d{1,2})[\s\-\/\.,\s]*(\d{2,4})$/);
    if (mRev) {
      const month = MONTH_MAP[mRev[1].toLowerCase()];
      const day = parseInt(mRev[2], 10);
      let year = parseInt(mRev[3], 10);
      if (year < 100) year += 2000;
      if (month !== undefined && !isNaN(day) && !isNaN(year)) {
        result = new Date(year, month, day, 12, 0, 0).getTime();
      }
    }
  }

  // 3. Format numerik DD/MM/YYYY atau DD-MM-YYYY atau D/M/YY (contoh: "03/01/2026", "3-1-26", "23-08-2026")
  if (!result) {
    const ddmmyyyy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1;
      let year = parseInt(ddmmyyyy[3], 10);
      if (year < 100) year += 2000;
      if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        result = new Date(year, month, day, 12, 0, 0).getTime();
      }
    }
  }

  // 4. Format YYYY-MM-DD
  if (!result) {
    const yyyymmdd = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
    if (yyyymmdd) {
      const year = parseInt(yyyymmdd[1], 10);
      const month = parseInt(yyyymmdd[2], 10) - 1;
      const day = parseInt(yyyymmdd[3], 10);
      result = new Date(year, month, day, 12, 0, 0).getTime();
    }
  }

  // 5. Fallback Date.parse
  if (!result) {
    const parsed = Date.parse(s);
    result = isNaN(parsed) ? 0 : parsed;
  }

  dateSortCache.set(s, result);
  return result;
}

// Normalisasi tanggal bebas -> "YYYY-MM-DD" (untuk kolom *_norm & filter SQL). Kosong/tak dikenali -> "".
export function toNormDateString(str?: string | null): string {
  if (!str || !str.trim()) return "";
  const time = parseDateToSort(str);
  if (!time) return "";
  const d = new Date(time);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Validasi param rentang API: wajib "YYYY-MM-DD".
export function isValidRangeDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Self-heal kolom norm + backfill (dipakai initSchema & retry API).
// Idempoten: no-op jika kolom sudah ada dan tidak ada baris yang norm-nya kosong.
export async function ensureLaporanPekerjaanNorms(db: any): Promise<number> {
  for (const col of ["start_date_norm", "end_date_norm", "tgl_order_norm"]) {
    try {
      await db.execute(`ALTER TABLE laporan_pekerjaan ADD COLUMN ${col} TEXT DEFAULT ''`);
    } catch {}
  }
  try {
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_laporan_pekerjaan_start_norm ON laporan_pekerjaan(start_date_norm)`);
  } catch {}
  let total = 0;
  for (;;) {
    const missing = await db.execute(
      "SELECT id, start_date, end_date, tgl_order FROM laporan_pekerjaan WHERE (COALESCE(start_date,'') != '' AND COALESCE(start_date_norm,'') = '') OR (COALESCE(end_date,'') != '' AND COALESCE(end_date_norm,'') = '') OR (COALESCE(tgl_order,'') != '' AND COALESCE(tgl_order_norm,'') = '') LIMIT 2000"
    );
    const rows = ((missing as any).rows as any[]) || [];
    if (rows.length === 0) break;
    const batch = rows.map((r: any) => ({
      sql: "UPDATE laporan_pekerjaan SET start_date_norm = ?, end_date_norm = ?, tgl_order_norm = ? WHERE id = ?",
      args: [
        toNormDateString(String(r.start_date || "")),
        toNormDateString(String(r.end_date || "")),
        toNormDateString(String(r.tgl_order || "")),
        r.id,
      ],
    }));
    if (typeof db.batch === "function") await db.batch(batch, "write");
    else for (const b of batch) await db.execute(b);
    total += rows.length;
    if (rows.length < 2000) break;
  }
  return total;
}
