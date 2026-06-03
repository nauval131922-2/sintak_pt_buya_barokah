export type ActivityLogSource = 'active' | 'archive';

export type DatePreset = 'today' | '7d' | 'month' | 'last_month';

export interface ActivityLogRow {
  id: number | string;
  action_type?: string | null;
  table_name?: string | null;
  record_id?: number | null;
  message?: string | null;
  raw_data?: string | null;
  recorded_by?: string | null;
  recorded_by_name?: string | null;
  created_at?: string | null;
  archived_at?: string | null;
}

function getTodayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}

function addDaysStr(base: string, days: number) {
  const d = new Date(`${base}T12:00:00+07:00`);
  d.setDate(d.getDate() + days);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
}

export function getDefaultLogRange() {
  const today = getTodayStr();
  return { from: today.slice(0, 8) + '01', to: today };
}

export function getDatePresetRange(preset: DatePreset): { from: string; to: string } {
  const today = getTodayStr();
  if (preset === 'today') return { from: today, to: today };
  if (preset === '7d') return { from: addDaysStr(today, -6), to: today };
  if (preset === 'month') return { from: today.slice(0, 8) + '01', to: today };
  const d = new Date(`${today}T12:00:00+07:00`);
  d.setMonth(d.getMonth() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, d.getMonth() + 1, 0).getDate();
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(lastDay).padStart(2, '0')}` };
}

export const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Hari ini' },
  { key: '7d', label: '7 hari' },
  { key: 'month', label: 'Bulan ini' },
  { key: 'last_month', label: 'Bulan lalu' },
];

export function detectActiveDatePreset(from: string, to: string): DatePreset | null {
  for (const p of DATE_PRESETS) {
    const r = getDatePresetRange(p.key);
    if (r.from === from && r.to === to) return p.key;
  }
  return null;
}

/** Format YYYY-MM-DD untuk tampilan UI — selalu WIB agar SSR/client konsisten */
export function formatDateStrId(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${dateStr}T12:00:00+07:00`));
}

export function getDefaultActivityLogFilters() {
  const range = getDatePresetRange('today');
  return {
    source: 'active' as ActivityLogSource,
    from: range.from,
    to: range.to,
    tableName: '',
    actionType: '',
    recordedBy: '',
    search: '',
    datePreset: 'today' as DatePreset,
  };
}

export function getActionColor(action: string) {
  switch (action) {
    case 'INSERT': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'UPDATE': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'DELETE': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'LOGIN': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'MAINTENANCE': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'CRON_SYNC': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'SCRAPE': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'UPLOAD':
    case 'IMPORT': return 'bg-teal-50 text-teal-700 border-teal-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

/** Route hint untuk record_id > 0 — null jika tidak ada halaman khusus */
export function getRecordHref(tableName?: string | null, recordId?: number | null): string | null {
  if (!tableName || !recordId || recordId <= 0) return null;
  const map: Record<string, string> = {
    jurnal_harian_produksi: '/jurnal-harian-produksi',
    jurnal_umum: '/akuntansi/laporan/jurnal-umum',
    sales_orders: '/sales-orders',
    sales_reports: '/sales',
    purchase_orders: '/purchase-orders',
    purchase_requests: '/pr',
    employees: '/employees',
    hpp_kalkulasi: '/hpp-kalkulasi',
    sopd: '/jurnal-harian-produksi/data/excel-sopd',
    master_pekerjaan: '/jurnal-harian-produksi/data/master-pekerjaan',
    master_pekerjaan_jurnal_produksi: '/jurnal-harian-produksi/data/master-pekerjaan-jurnal-produksi',
    orders: '/orders',
    bahan_baku: '/bahan-baku',
    barang_jadi: '/barang-jadi',
    bill_of_materials: '/bom',
    spph_out: '/spph-out',
    sph_in: '/sph-in',
    sph_out: '/sph-out',
    pengiriman: '/pengiriman',
    pelunasan_hutang: '/pelunasan-hutang',
    pelunasan_piutang: '/pelunasan-piutang',
    penerimaan_pembelian: '/penerimaan-pembelian',
    rekap_pembelian_barang: '/rekap-pembelian-barang',
    rek_akuntansi: '/akuntansi/data/rek-akuntansi',
  };
  return map[tableName] ?? null;
}

export function parseRawData(raw?: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export interface FieldDiff {
  key: string;
  before: string;
  after: string;
}

/** Bandingkan snapshot log dengan data live (untuk UPDATE) */
export function computeSnapshotLiveDiff(
  snapshot: Record<string, unknown> | null,
  live: Record<string, unknown> | null
): FieldDiff[] {
  if (!snapshot || !live) return [];
  const diffs: FieldDiff[] = [];
  const keys = new Set([...Object.keys(snapshot), ...Object.keys(live)]);
  for (const key of keys) {
    if (['id', 'created_at', 'updated_at', 'fetched_at', 'raw_data'].includes(key)) continue;
    const a = snapshot[key];
    const b = live[key];
    const sa = JSON.stringify(a ?? '');
    const sb = JSON.stringify(b ?? '');
    if (sa !== sb) {
      diffs.push({
        key,
        before: sa.length > 120 ? sa.slice(0, 120) + '…' : sa,
        after: sb.length > 120 ? sb.slice(0, 120) + '…' : sb,
      });
    }
  }
  return diffs.slice(0, 40);
}

/** Diff eksplisit old/new di raw_data jika ada */
export function computeExplicitDiff(raw: Record<string, unknown> | null): FieldDiff[] {
  if (!raw) return [];
  const pairs: [string, unknown, unknown][] = [];
  if (raw.before && raw.after) {
    const prev = raw.before as Record<string, unknown>;
    const curr = raw.after as Record<string, unknown>;
    for (const k of new Set([...Object.keys(prev), ...Object.keys(curr)])) {
      pairs.push([k, prev[k], curr[k]]);
    }
  } else if (raw.previous && raw.current) {
    const prev = raw.previous as Record<string, unknown>;
    const curr = raw.current as Record<string, unknown>;
    for (const k of new Set([...Object.keys(prev), ...Object.keys(curr)])) {
      pairs.push([k, prev[k], curr[k]]);
    }
  } else if (raw.old && raw.new) {
    const prev = raw.old as Record<string, unknown>;
    const curr = raw.new as Record<string, unknown>;
    for (const k of new Set([...Object.keys(prev), ...Object.keys(curr)])) {
      pairs.push([k, prev[k], curr[k]]);
    }
  }
  return pairs
    .filter(([, a, b]) => JSON.stringify(a) !== JSON.stringify(b))
    .map(([key, before, after]) => ({
      key,
      before: String(before ?? ''),
      after: String(after ?? ''),
    }))
    .slice(0, 40);
}

export function formatLogDateGroupLabel(createdAt?: string | null): string {
  if (!createdAt) return 'Tanpa tanggal';
  try {
    const normalized = createdAt.includes('T') || createdAt.endsWith('Z')
      ? createdAt
      : createdAt.replace(' ', 'T') + 'Z';
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return createdAt.slice(0, 10);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(d);
  } catch {
    return createdAt.slice(0, 10);
  }
}

export function groupActivityLogsByDate(logs: ActivityLogRow[]): {
  dateKey: string;
  label: string;
  items: ActivityLogRow[];
}[] {
  const map = new Map<string, ActivityLogRow[]>();
  for (const log of logs) {
    const dateKey = log.created_at?.slice(0, 10) ?? 'unknown';
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey)!.push(log);
  }
  return Array.from(map.entries()).map(([dateKey, items]) => ({
    dateKey,
    label: formatLogDateGroupLabel(items[0]?.created_at),
    items,
  }));
}

export function toPlainActivityRows(rows: Record<string, unknown>[]): ActivityLogRow[] {
  return rows.map((row) => {
    const plain: ActivityLogRow = { id: 0 };
    for (const key of Object.keys(row)) {
      const val = row[key];
      (plain as unknown as Record<string, unknown>)[key] = typeof val === 'bigint' ? Number(val) : val;
    }
    return plain;
  });
}
