import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatScrapedPeriodDate,
  buildScrapedPeriod,
  hydrateDailyDateStore,
  persistDailyDateStore,
  getTodayStorageDate,
} from '@/lib/scraper-period';

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
    // NOTE: buildScrapedPeriod pin timeZone Asia/Jakarta -> end (23:59:59Z) tampil
    // sebagai hari berikutnya di WIB (+7), deterministik di semua runner (CI=UTC).
    expect(period.end).toBe('01 Apr 2026');
    expect(typeof period.fetchedOn).toBe('string');
  });
});

describe('hydrateDailyDateStore & persistDailyDateStore', () => {
  const TEST_KEY = 'test_daily_date_store';
  const defaultStart = new Date('2026-04-01T00:00:00Z');
  const defaultEnd = new Date('2026-04-01T00:00:00Z');
  const getDefaults = () => ({ startDate: defaultStart, endDate: defaultEnd });

  // Mock in-memory localStorage for test environment
  const store: Record<string, string> = {};
  beforeEach(() => {
    for (const k in store) delete store[k];
    globalThis.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k in store) delete store[k]; },
      length: 0,
      key: () => null,
    } as any;
  });

  it('returns default dates when localStorage is empty', () => {
    const res = hydrateDailyDateStore(TEST_KEY, getDefaults);
    expect(res.startDate?.toISOString()).toBe(defaultStart.toISOString());
    expect(res.endDate?.toISOString()).toBe(defaultEnd.toISOString());
  });

  it('restores persisted dates across reload on the same day', () => {
    const chosenStart = new Date('2026-03-10T00:00:00Z');
    const chosenEnd = new Date('2026-03-20T00:00:00Z');
    persistDailyDateStore(TEST_KEY, chosenStart, chosenEnd);

    const reloaded = hydrateDailyDateStore(TEST_KEY, getDefaults);
    expect(reloaded.startDate?.toISOString()).toBe(chosenStart.toISOString());
    expect(reloaded.endDate?.toISOString()).toBe(chosenEnd.toISOString());
  });

  it('resets to default dates when day has changed', () => {
    const chosenStart = new Date('2026-03-10T00:00:00Z');
    const chosenEnd = new Date('2026-03-20T00:00:00Z');
    // Save with yesterday session date
    store[TEST_KEY] = JSON.stringify({
      startDate: chosenStart.toISOString(),
      endDate: chosenEnd.toISOString(),
      sessionDate: '2026-01-01',
    });

    const res = hydrateDailyDateStore(TEST_KEY, getDefaults);
    expect(res.startDate?.toISOString()).toBe(defaultStart.toISOString());
    expect(res.endDate?.toISOString()).toBe(defaultEnd.toISOString());
  });

  it('honors explicit reset on same day and resets to default on new day', () => {
    persistDailyDateStore(TEST_KEY, null, null, true);

    // Same day reload
    const reloadedSameDay = hydrateDailyDateStore(TEST_KEY, getDefaults);
    expect(reloadedSameDay.startDate).toBeNull();
    expect(reloadedSameDay.endDate).toBeNull();

    // Simulate next day
    const parsed = JSON.parse(store[TEST_KEY]);
    parsed.sessionDate = '2026-01-01';
    store[TEST_KEY] = JSON.stringify(parsed);

    const reloadedNextDay = hydrateDailyDateStore(TEST_KEY, getDefaults);
    expect(reloadedNextDay.startDate?.toISOString()).toBe(defaultStart.toISOString());
    expect(reloadedNextDay.endDate?.toISOString()).toBe(defaultEnd.toISOString());
  });
});
