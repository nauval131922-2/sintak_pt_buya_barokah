import { describe, it, expect } from 'vitest';
import { buildFtsQuery } from '@/lib/fts';

describe('buildFtsQuery', () => {
  it('returns null for empty / whitespace', () => {
    expect(buildFtsQuery('')).toBeNull();
    expect(buildFtsQuery('   ')).toBeNull();
    expect(buildFtsQuery('\t\n')).toBeNull();
  });

  it('single token becomes prefix match', () => {
    expect(buildFtsQuery('buku')).toBe('buku*');
  });

  it('multi token becomes quoted phrase with prefix', () => {
    expect(buildFtsQuery('buku tulis')).toBe('"buku tulis"*');
  });

  it('strips quotes inside tokens', () => {
    expect(buildFtsQuery('"buku"')).toBe('buku*');
  });

  it('strips non-letter/number characters between tokens', () => {
    expect(buildFtsQuery('buku@#tulis!')).toBe('"buku tulis"*');
  });

  it('trailing space/dot makes it an exact phrase (no prefix)', () => {
    expect(buildFtsQuery('buku tulis ')).toBe('"buku tulis"');
    expect(buildFtsQuery('buku tulis.')).toBe('"buku tulis"');
  });

  it('handles unicode (indonesian chars) tokens', () => {
    expect(buildFtsQuery('warung café')).toBe('"warung café"*');
  });
});
