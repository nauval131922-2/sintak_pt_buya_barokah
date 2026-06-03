const STORAGE_KEY = 'sintak_activity_log_refresh_ms';

export const REFRESH_INTERVAL_OPTIONS = [
  { label: 'Mati', ms: 0 },
  { label: '30 detik', ms: 30_000 },
  { label: '1 menit', ms: 60_000 },
  { label: '2 menit', ms: 120_000 },
  { label: '5 menit', ms: 300_000 },
] as const;

export function loadActivityLogRefreshMs(): number {
  if (typeof window === 'undefined') return 120_000;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 120_000;
    const n = parseInt(raw, 10);
    if (REFRESH_INTERVAL_OPTIONS.some((o) => o.ms === n)) return n;
  } catch { /* ignore */ }
  return 120_000;
}

export function saveActivityLogRefreshMs(ms: number): void {
  localStorage.setItem(STORAGE_KEY, String(ms));
}

export const QUICK_ACTION_CHIPS = ['SCRAPE', 'IMPORT', 'UPLOAD', 'UPDATE', 'DELETE'] as const;
