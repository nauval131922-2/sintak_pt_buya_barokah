# Sidebar Refactor — Catatan

## 1. Dual-mode state → Single mode
- Hapus `openMenuIds: Set<string> | null`
- `openMenuIds: Set<string>` aja (manual toggle biasa)
- Auto-open pas route change: `useEffect(() => { openMenuIds.add(...) }, [pathname])`
- `toggleMenuId` jadi pure toggle (add/delete tanpa `closeKey`)

## 2. `closeKey` pattern → Toggle biasa
- Hapus `__close__${id}` prefix
- Logic: `openMenuIds.has(id) ? delete(id) : add(id)`
- Auto-open useEffect handle isActive pas ganti halaman

## 3. Auto-fit width → `getBoundingClientRect()`
- Ganti canvas measure dengan ukur langsung dari DOM:
  ```ts
  navRef.current.querySelectorAll('a, button:not([tabindex="-1"])').forEach(el => {
    const w = el.getBoundingClientRect().width;
    if (w > maxWidth) maxWidth = w;
  });
  setExpandedWidth(Math.min(maxWidth + 24, MAX_WIDTH));
  ```
- Lebih presisi, gak perlu hitung overhead manual / border / padding
