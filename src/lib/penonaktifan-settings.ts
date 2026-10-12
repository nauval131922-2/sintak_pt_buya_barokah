// penonaktifan-settings.ts — konfigurasi Lap. Penonaktifan via system_settings.
// - routine_codes: kode rutin eksplisit yang DILARANG dinonaktifkan (pasti, tanpa cocok nama)
// - idle_days: batas idle kategori B Batal (default 7)
import db from '@/lib/db';

type DbVal = string | number | null | undefined | Uint8Array | unknown;
type DbRow = Record<string, DbVal>;

function str(v: DbVal): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Uint8Array) return Buffer.from(v).toString('utf-8');
  return String(v);
}

 export interface PenonaktifanSettings {
   routine_codes: string[];
   routine_keywords: string[];
   idle_days: number;
 }

 export const DEFAULT_SETTINGS: PenonaktifanSettings = {
   routine_codes: [],
   routine_keywords: [],
   idle_days: 7,
 };

 const CODES_KEY = 'penonaktifan_routine_codes';
 const KEYWORDS_KEY = 'penonaktifan_routine_keywords';
 const IDLE_KEY = 'penonaktifan_idle_days';

function parseList(raw: string, fallback: string[]): string[] {
  try {
    const v: unknown = JSON.parse(raw);
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean);
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  } catch {
    return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : fallback;
  }
}

function parseIdle(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DEFAULT_SETTINGS.idle_days;
}

 export async function getPenonaktifanSettings(): Promise<PenonaktifanSettings> {
   const res = await db.execute({
     sql: `SELECT key, value FROM system_settings WHERE key IN (?, ?, ?)`,
     args: [CODES_KEY, KEYWORDS_KEY, IDLE_KEY],
   });
   const map = new Map<string, string>();
   for (const r of res.rows as DbRow[]) map.set(str(r.key), str(r.value));
   return {
     routine_codes: map.has(CODES_KEY) ? parseList(map.get(CODES_KEY) ?? '', []) : [],
     routine_keywords: map.has(KEYWORDS_KEY) ? parseList(map.get(KEYWORDS_KEY) ?? '', []) : [],
     idle_days: map.has(IDLE_KEY) ? parseIdle(map.get(IDLE_KEY) ?? '') : DEFAULT_SETTINGS.idle_days,
   };
 }

export async function savePenonaktifanSettings(s: PenonaktifanSettings): Promise<PenonaktifanSettings> {
  const clean: PenonaktifanSettings = {
     routine_codes: [...new Set(s.routine_codes.map((x) => String(x).trim()).filter((x) => /^\d+$/.test(x)))],
     routine_keywords: [...new Set((s.routine_keywords ?? []).map((x) => String(x).trim().toLowerCase()).filter((x) => x.length >= 3))],
    idle_days: Number.isFinite(s.idle_days) && s.idle_days >= 0 ? Math.floor(s.idle_days) : DEFAULT_SETTINGS.idle_days,
  };
   const pairs: Array<[string, string]> = [
     [CODES_KEY, JSON.stringify(clean.routine_codes)],
     [KEYWORDS_KEY, JSON.stringify(clean.routine_keywords)],
     [IDLE_KEY, String(clean.idle_days)],
  ];
  for (const [k, v] of pairs) {
    await db.execute({
      sql: `INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      args: [k, v],
    });
  }
  return clean;
}

 // Rutin = kode ada di daftar eksplisit ATAU nama mengandung salah satu keyword (case-insensitive).
 export function isRoutineProduct(nama: string, kode: string, s: PenonaktifanSettings): boolean {
   if (s.routine_codes.some((c) => c === kode.trim())) return true;
   const nm = (nama ?? '').toLowerCase();
   return (s.routine_keywords ?? []).some((kw) => kw && nm.includes(kw));
 }