const store = new Map<string, { data: unknown; expiresAt: number }>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function cacheClear(pattern?: string): void {
  if (!pattern) { store.clear(); return; }
  for (const k of store.keys()) {
    if (k.includes(pattern)) store.delete(k);
  }
}
