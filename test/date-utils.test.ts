import { describe, it, expect } from 'vitest';
import { splitDateRangeIntoMonths, formatLastUpdate } from '@/lib/date-utils';

describe('splitDateRangeIntoMonths', () => {
  it('splits a cross-month range into monthly chunks', () => {
    const chunks = splitDateRangeIntoMonths('2026-01-31', '2026-03-01');
    expect(chunks).toEqual([
      { start: '2026-01-31', end: '2026-01-31' },
      { start: '2026-02-01', end: '2026-02-28' },
      { start: '2026-03-01', end: '2026-03-01' },
    ]);
  });

  it('single-day range yields one chunk', () => {
    const chunks = splitDateRangeIntoMonths('2026-02-15', '2026-02-15');
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({ start: '2026-02-15', end: '2026-02-15' });
  });

  it('within-month range yields one chunk', () => {
    const chunks = splitDateRangeIntoMonths('2026-05-01', '2026-05-31');
    expect(chunks).toHaveLength(1);
    expect(chunks[0].end).toBe('2026-05-31');
  });

  it('handles year boundary', () => {
    const chunks = splitDateRangeIntoMonths('2025-12-15', '2026-01-10');
    expect(chunks).toHaveLength(2);
    expect(chunks[0].start).toBe('2025-12-15');
    expect(chunks[1].end).toBe('2026-01-10');
  });
});

describe('formatLastUpdate', () => {
  it('returns empty string for null/undefined/empty', () => {
    expect(formatLastUpdate(null)).toBe('');
    expect(formatLastUpdate(undefined)).toBe('');
    expect(formatLastUpdate('')).toBe('');
  });

  it('formats a space-separated sqlite timestamp with WIB month name', () => {
    // 2026-03-27 00:31:32 UTC -> WIB +7 -> 27 Mar 2026, 07.31.32
    const out = formatLastUpdate('2026-03-27 00:31:32');
    expect(out).toContain('27 Mar 2026');
    expect(out).toMatch(/07\.31\.32$/);
  });

  it('formats a Date object', () => {
    const d = new Date('2026-03-27T00:31:32Z');
    const out = formatLastUpdate(d);
    expect(out).toContain('27 Mar 2026');
  });
});
