import { describe, it, expect } from 'vitest';
import {
  formatDateToYYYYMMDD,
  formatIndoDateStr,
  parseLocalDate,
} from '@/lib/utils/date-formatters';

describe('formatDateToYYYYMMDD', () => {
  it('formats Date to zero-padded YYYY-MM-DD', () => {
    expect(formatDateToYYYYMMDD(new Date(2026, 2, 5))).toBe('2026-03-05');
    expect(formatDateToYYYYMMDD(new Date(2026, 11, 31))).toBe('2026-12-31');
    expect(formatDateToYYYYMMDD(new Date(2026, 0, 1))).toBe('2026-01-01');
  });

  it('uses local date components (not UTC)', () => {
    // Date at 23:30 local should still format by local day
    const d = new Date(2026, 2, 5, 23, 30, 0);
    expect(formatDateToYYYYMMDD(d)).toBe('2026-03-05');
  });
});

describe('formatIndoDateStr', () => {
  it('returns empty for empty input', () => {
    expect(formatIndoDateStr('')).toBe('');
  });

  it('formats YYYY-MM-DD to Indonesian long date', () => {
    const out = formatIndoDateStr('2026-03-18');
    // id-ID: "18 Mar 2026"
    expect(out).toMatch(/18\s+Mar\s+2026/);
  });

  it('formats DD-MM-YYYY to Indonesian long date', () => {
    const out = formatIndoDateStr('18-03-2026');
    expect(out).toMatch(/18\s+Mar\s+2026/);
  });

  it('truncates long timestamp input to first 10 chars', () => {
    const out = formatIndoDateStr('2026-03-18 14:30:00');
    expect(out).toMatch(/18\s+Mar\s+2026/);
  });

  it('passes through unparseable', () => {
    expect(formatIndoDateStr('bukan-tanggal')).toBe('bukan-tanggal');
  });
});

describe('parseLocalDate', () => {
  it('parses YYYY-MM-DD at local midnight', () => {
    const d = parseLocalDate('2026-03-18');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // March
    expect(d.getDate()).toBe(18);
    expect(d.getHours()).toBe(0);
  });

  it('parses DD-MM-YYYY', () => {
    const d = parseLocalDate('18-03-2026');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(18);
  });

  it('returns now for empty input', () => {
    const d = parseLocalDate('');
    expect(d instanceof Date).toBe(true);
    expect(isNaN(d.getTime())).toBe(false);
  });

  it('round-trips with formatDateToYYYYMMDD', () => {
    const s = '2026-07-04';
    const d = parseLocalDate(s);
    expect(formatDateToYYYYMMDD(d)).toBe(s);
  });
});
