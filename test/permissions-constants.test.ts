import { describe, it, expect } from 'vitest';
import { MODULE_REGISTRY, type ModuleKey } from '@/lib/permissions-constants';

describe('MODULE_REGISTRY', () => {
  it('is non-empty', () => {
    expect(MODULE_REGISTRY.length).toBeGreaterThan(0);
  });

  it('has unique keys', () => {
    const keys = MODULE_REGISTRY.map((m) => m.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('every entry has key, label and group', () => {
    for (const m of MODULE_REGISTRY) {
      expect(typeof m.key).toBe('string');
      expect(m.key.length).toBeGreaterThan(0);
      expect(typeof m.label).toBe('string');
      expect(typeof m.group).toBe('string');
    }
  });

  it('keys are assignable to ModuleKey', () => {
    const sample: ModuleKey = MODULE_REGISTRY[0].key;
    expect(typeof sample).toBe('string');
  });
});
