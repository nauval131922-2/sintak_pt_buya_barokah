import { describe, it, expect } from 'vitest';
import type { DatePreset } from '@/lib/activity-log-utils';
import {
  parseActivityLogUrl,
  buildActivityLogUrl,
  hasActivityLogUrlFilters,
  mergeActivityLogState,
  buildActivityLogHref,
} from '@/lib/activity-log-url';

describe('parseActivityLogUrl', () => {
  it('returns empty object for empty params', () => {
    const r = parseActivityLogUrl(new URLSearchParams(''));
    expect(Object.keys(r).length).toBe(0);
  });

  it('parses source only when valid', () => {
    expect(parseActivityLogUrl(new URLSearchParams('source=archive')).source).toBe('archive');
    expect(parseActivityLogUrl(new URLSearchParams('source=active')).source).toBe('active');
    // invalid source ignored
    expect(parseActivityLogUrl(new URLSearchParams('source=xxx')).source).toBeUndefined();
  });

  it('parses from/to and sets datePreset field (may be null if not a known preset)', () => {
    const r = parseActivityLogUrl(new URLSearchParams('from=2026-01-01&to=2026-01-31'));
    expect(r.from).toBe('2026-01-01');
    expect(r.to).toBe('2026-01-31');
    expect('datePreset' in r).toBe(true);
  });

  it('accepts table/tableName and action/actionType aliases', () => {
    const r1 = parseActivityLogUrl(new URLSearchParams('table=bahan_baku&action=INSERT'));
    expect(r1.tableName).toBe('bahan_baku');
    expect(r1.actionType).toBe('INSERT');
    const r2 = parseActivityLogUrl(new URLSearchParams('tableName=sopd&actionType=UPDATE'));
    expect(r2.tableName).toBe('sopd');
    expect(r2.actionType).toBe('UPDATE');
  });

  it('validates sortBy against whitelist', () => {
    expect(parseActivityLogUrl(new URLSearchParams('sortBy=created_at')).sortBy).toBe('created_at');
    // not in whitelist -> ignored
    expect(parseActivityLogUrl(new URLSearchParams('sortBy=hack')).sortBy).toBeUndefined();
  });

  it('validates sortDir', () => {
    expect(parseActivityLogUrl(new URLSearchParams('sortDir=asc')).sortDir).toBe('asc');
    expect(parseActivityLogUrl(new URLSearchParams('sortDir=desc')).sortDir).toBe('desc');
    expect(parseActivityLogUrl(new URLSearchParams('sortDir=sideways')).sortDir).toBeUndefined();
  });

  it('parses page only when > 1', () => {
    expect(parseActivityLogUrl(new URLSearchParams('page=3')).page).toBe(3);
    expect(parseActivityLogUrl(new URLSearchParams('page=1')).page).toBeUndefined();
    expect(parseActivityLogUrl(new URLSearchParams('page=abc')).page).toBeUndefined();
  });
});

describe('buildActivityLogUrl', () => {
  const state = {
    source: 'active' as const,
    from: '2026-01-01',
    to: '2026-01-31',
    tableName: 'bahan_baku',
    actionType: 'INSERT',
    recordedBy: 'john',
    search: 'meja',
    sortBy: 'created_at' as const,
    sortDir: 'desc' as const,
    datePreset: null,
  };

  it('builds base path when no filters', () => {
    const url = buildActivityLogUrl({
      source: 'active',
      from: '',
      to: '',
      tableName: '',
      actionType: '',
      recordedBy: '',
      search: '',
      sortBy: 'created_at',
      sortDir: 'desc',
      datePreset: null,
    });
    expect(url).toBe('/log-aktivitas');
  });

  it('serializes filters to query string', () => {
    const url = buildActivityLogUrl(state);
    expect(url).toContain('/log-aktivitas?');
    expect(url).toContain('from=2026-01-01');
    expect(url).toContain('table=bahan_baku');
    expect(url).toContain('action=INSERT');
    expect(url).toContain('user=john');
    expect(url).toContain('search=meja');
  });

  it('omits sortBy/sortDir when default', () => {
    const url = buildActivityLogUrl(state);
    expect(url).not.toContain('sortBy');
    expect(url).not.toContain('sortDir');
  });

  it('includes sortBy/sortDir when non-default', () => {
    const url = buildActivityLogUrl({ ...state, sortBy: 'table_name', sortDir: 'asc' });
    expect(url).toContain('sortBy=table_name');
    expect(url).toContain('sortDir=asc');
  });

  it('appends logId as id param', () => {
    const url = buildActivityLogUrl(state, 'log-123');
    expect(url).toContain('id=log-123');
  });

  it('serializes page when > 1', () => {
    const url = buildActivityLogUrl({ ...state, page: 2 });
    expect(url).toContain('page=2');
  });
});

describe('hasActivityLogUrlFilters', () => {
  it('false for empty', () => {
    expect(hasActivityLogUrlFilters(new URLSearchParams(''))).toBe(false);
  });
  it('false for page=1 only', () => {
    expect(hasActivityLogUrlFilters(new URLSearchParams('page=1'))).toBe(false);
  });
  it('true for any real filter', () => {
    expect(hasActivityLogUrlFilters(new URLSearchParams('search=x'))).toBe(true);
    expect(hasActivityLogUrlFilters(new URLSearchParams('table=y'))).toBe(true);
    expect(hasActivityLogUrlFilters(new URLSearchParams('page=2'))).toBe(true);
  });
});

describe('mergeActivityLogState', () => {
  const base = {
    source: 'active' as const,
    from: '2026-01-01',
    to: '2026-01-31',
    tableName: '',
    actionType: '',
    recordedBy: '',
    search: '',
    sortBy: 'created_at' as const,
    sortDir: 'desc' as const,
    datePreset: null as DatePreset | null,
  };

  it('falls back to base when parsed empty', () => {
    const merged = mergeActivityLogState(base, {});
    expect(merged.source).toBe('active');
    expect(merged.from).toBe('2026-01-01');
  });

  it('overrides with parsed values', () => {
    const merged = mergeActivityLogState(base, { source: 'archive', from: '2026-02-01' });
    expect(merged.source).toBe('archive');
    expect(merged.from).toBe('2026-02-01');
    expect(merged.to).toBe('2026-01-31'); // unchanged
  });

  it('preserves datePreset from parsed when explicitly provided', () => {
    const merged = mergeActivityLogState(base, { datePreset: 'this_week' as any });
    expect(merged.datePreset).toBe('this_week');
  });
});

describe('buildActivityLogHref', () => {
  it('produces a /log-aktivitas URL', () => {
    const href = buildActivityLogHref({ tableName: 'bahan_baku' });
    expect(href.startsWith('/log-aktivitas')).toBe(true);
    expect(href).toContain('table=bahan_baku');
  });
});
