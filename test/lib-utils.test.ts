import { describe, it, expect } from 'vitest';
import { buildFtsQuery } from '@/lib/fts';
import {
  getScrapedPeriodSettingKey,
  encodeScrapedPeriod,
  parseScrapedPeriod,
} from '@/lib/server-scraped-period';

describe('buildFtsQuery', () => {
  it('returns null for empty/whitespace', () => {
    expect(buildFtsQuery('')).toBeNull();
    expect(buildFtsQuery('   ')).toBeNull();
  });

  it('single token gets wildcard suffix', () => {
    expect(buildFtsQuery('motor')).toBe('motor*');
  });

  it('multi token becomes quoted phrase with wildcard', () => {
    expect(buildFtsQuery('buku tulis')).toBe('"buku tulis"*');
  });

  it('multi token with trailing space becomes exact phrase (no wildcard)', () => {
    expect(buildFtsQuery('buku tulis ')).toBe('"buku tulis"');
  });

  it('strips punctuation and quotes from tokens', () => {
    expect(buildFtsQuery('"buku"')).toBe('buku*');
    // multi-token without trailing space -> quoted phrase + wildcard
    expect(buildFtsQuery('halo, dunia!')).toBe('"halo dunia"*');
  });

  it('keeps unicode word chars (indonesian)', () => {
    expect(buildFtsQuery('méja')).toBe('méja*');
  });
});

describe('server-scraped-period', () => {
  it('getScrapedPeriodSettingKey appends _period', () => {
    expect(getScrapedPeriodSettingKey('last_scrape_orders')).toBe('last_scrape_orders_period');
  });

  it('encode/decode round-trips', () => {
    const period = { start: '2026-01-01', end: '2026-01-31' };
    const encoded = encodeScrapedPeriod(period);
    expect(parseScrapedPeriod(encoded)).toEqual(period);
  });

  it('parseScrapedPeriod returns null for empty', () => {
    expect(parseScrapedPeriod(undefined)).toBeNull();
    expect(parseScrapedPeriod(null)).toBeNull();
    expect(parseScrapedPeriod('')).toBeNull();
  });

  it('parseScrapedPeriod returns null for invalid JSON', () => {
    expect(parseScrapedPeriod('not json')).toBeNull();
  });

  it('parseScrapedPeriod returns null when missing start/end', () => {
    expect(parseScrapedPeriod(JSON.stringify({ start: '2026-01-01' }))).toBeNull();
    expect(parseScrapedPeriod(JSON.stringify({ end: '2026-01-31' }))).toBeNull();
  });
});
