import { describe, it, expect } from 'vitest';
import { formatScrapedPeriodDate, buildScrapedPeriod } from '@/lib/scraper-period';

describe('formatScrapedPeriodDate', () => {
  it('returns empty for empty input', () => {
    expect(formatScrapedPeriodDate('')).toBe('');
    expect(formatScrapedPeriodDate(undefined)).toBe('');
  });

  it('formats dd-mm-yyyy into id-ID short date', () => {
    const out = formatScrapedPeriodDate('27-03-2026');
    // id-ID: "27 Mar 2026"
    expect(out).toBe('27 Mar 2026');
  });

  it('passes through unparseable strings', () => {
    expect(formatScrapedPeriodDate('not-a-date')).toBe('not-a-date');
  });
});

describe('buildScrapedPeriod', () => {
  it('builds a period object with raw ISO + formatted display', () => {
    const start = new Date('2026-03-01T00:00:00Z');
    const end = new Date('2026-03-31T23:59:59Z');
    const period = buildScrapedPeriod(start, end);
    expect(period.startRaw).toBe(start.toISOString());
    expect(period.endRaw).toBe(end.toISOString());
    expect(period.start).toBe('01 Mar 2026');
    // NOTE: buildScrapedPeriod uses toLocaleDateString without TZ -> end (23:59:59Z) shifts to
    // next day in WIB (+7). This documents current behaviour; flag if display date matters.
    expect(period.end).toBe('01 Apr 2026');
    expect(typeof period.fetchedOn).toBe('string');
  });
});
