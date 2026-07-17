import { describe, it, expect } from 'vitest';
import { formatToDayMonthYear } from '../src/app/hasil-produksi/hasil-produksi-utils';

describe('formatToDayMonthYear', () => {
  it('returns empty for empty', () => {
    expect(formatToDayMonthYear('')).toBe('');
  });

  it('formats YYYY-MM-DD (ISO) to DD MMM YYYY', () => {
    // toLocaleDateString id-ID: "27 Mar 2026"
    expect(formatToDayMonthYear('2026-03-27')).toBe('27 Mar 2026');
  });

  it('formats DD-MM-YYYY (Gudang) to DD MMM YYYY', () => {
    expect(formatToDayMonthYear('27-03-2026')).toBe('27 Mar 2026');
  });

  it('passes through / does not crash on unparseable', () => {
    const out = formatToDayMonthYear('bukan-tanggal');
    // Node returns 'Invalid Date', some runtimes return the raw string — both are non-crashing
    expect(out).not.toBe('27 Mar 2026');
    expect(typeof out).toBe('string');
  });
});
