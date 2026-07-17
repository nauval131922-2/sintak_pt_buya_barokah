import { describe, it, expect } from 'vitest';
import { formatMdtDate, parseIndoDate, parseLooseNumber, toTitleCase } from '../src/app/tracking-manufaktur/tracking-utils';

describe('formatMdtDate', () => {
  it('returns dash for empty', () => {
    expect(formatMdtDate('')).toBe('-');
    expect(formatMdtDate(null as any)).toBe('-');
  });
  it('passes through DD-MM-YYYY', () => {
    expect(formatMdtDate('27-03-2026')).toBe('27-03-2026');
  });
  it('converts YYYY-MM-DD to DD-MM-YYYY', () => {
    expect(formatMdtDate('2026-03-27')).toBe('27-03-2026');
  });
  it('keeps HH:mm suffix', () => {
    expect(formatMdtDate('2026-03-27 08:30')).toBe('27-03-2026 08:30');
  });
});

describe('parseIndoDate', () => {
  it('parses DD-MM-YYYY', () => {
    const d = parseIndoDate('27-03-2026');
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(2); // March (0-indexed)
    expect(d?.getDate()).toBe(27);
  });
  it('parses YYYY-MM-DD', () => {
    const d = parseIndoDate('2026-03-27');
    expect(d?.getDate()).toBe(27);
  });
  it('handles slashes', () => {
    const d = parseIndoDate('27/03/2026');
    expect(d?.getDate()).toBe(27);
  });
  it('returns null for garbage', () => {
    expect(parseIndoDate('bukan')).toBeNull();
    expect(parseIndoDate('')).toBeNull();
  });
});

describe('parseLooseNumber', () => {
  it('returns 0 for null/undefined/empty', () => {
    expect(parseLooseNumber(null)).toBe(0);
    expect(parseLooseNumber(undefined)).toBe(0);
    expect(parseLooseNumber('')).toBe(0);
    expect(parseLooseNumber('<b>abc</b>')).toBe(0);
  });
  it('strips html and parses number', () => {
    expect(parseLooseNumber('<span>1.234</span>')).toBe(1.234);
  });
  it('handles comma thousands', () => {
    expect(parseLooseNumber('1,500')).toBe(1500);
  });
  it('passes through finite numbers', () => {
    expect(parseLooseNumber(42)).toBe(42);
  });
});

describe('toTitleCase', () => {
  it('title-cases snake_case', () => {
    expect(toTitleCase('kd_barang')).toBe('Kode Barang');
  });
  it('uses abbreviations', () => {
    expect(toTitleCase('qty')).toBe('Qty');
    expect(toTitleCase('no_ref_pelanggan')).toBe('No Ref Pelanggan');
  });
});
