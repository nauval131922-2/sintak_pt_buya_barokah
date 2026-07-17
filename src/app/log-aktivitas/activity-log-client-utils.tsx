import React from 'react';
import type { ActivityLogRow } from '@/lib/activity-log-utils';
import type { ActivityLogSortField } from '@/lib/activity-log-query';
import { toast } from '@/lib/toast';

export interface MatchInfo { 
  field: string; 
  label: string; 
  value: string; 
}

const MATCH_FIELDS: { key: keyof ActivityLogRow; label: string; extract: (l: ActivityLogRow) => string }[] = [
  { key: 'action_type', label: 'Aksi', extract: (l) => l.action_type || '' },
  { key: 'table_name', label: 'Tabel', extract: (l) => l.table_name || '' },
  { key: 'recorded_by', label: 'User', extract: (l) => l.recorded_by_name || l.recorded_by || '' },
  { key: 'message', label: 'Keterangan', extract: (l) => l.message || '' },
];

export function getMatchedFields(log: ActivityLogRow, q: string): MatchInfo[] {
  if (!q.trim()) return [];
  const t = q.toLowerCase();
  const fromFields = MATCH_FIELDS
    .map(({ label, extract }) => ({ field: label, value: extract(log), label }))
    .filter(({ value }) => value.toLowerCase().includes(t));
  if (fromFields.length >= 2) return fromFields.slice(0, 2);
  if (log.raw_data) {
    try {
      const raw = JSON.parse(log.raw_data as string);
      const data = raw.before || raw.after || raw;
      if (typeof data === 'object' && data) {
        for (const [key, val] of Object.entries(data)) {
          if (String(val).toLowerCase().includes(t)) {
            fromFields.push({ field: key, value: String(val).slice(0, 80), label: key });
            if (fromFields.length >= 2) break;
          }
        }
      }
    } catch {}
  }
  return fromFields.slice(0, 2);
}

// ponytail: highlight helper — wrap matches dengan <mark>
export function highlightText(text: string, search: string): React.ReactNode {
  if (!search.trim()) return text;
  const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === search.toLowerCase() 
      ? <mark key={i} className="bg-yellow-200 text-gray-900 px-0.5 rounded">{part}</mark>
      : part
  );
}

// ponytail: copy to clipboard helper
export function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} berhasil disalin`),
    () => toast.error('Gagal menyalin')
  );
}

export function strToDate(s: string): Date { 
  return new Date(`${s}T12:00:00+07:00`); 
}

export function dateToStr(d: Date): string { 
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d); 
}

export function buildBaseState(defaults: any) {
  return {
    ...defaults,
    sortBy: 'created_at' as ActivityLogSortField,
    sortDir: 'desc' as const,
  };
}
