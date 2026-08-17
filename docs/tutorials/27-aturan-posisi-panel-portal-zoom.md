# Tutorial 27: Aturan Posisi Panel Popup di Arsitektur Zoom 80% (Portal & getZoomScale)

Dokumen ini merangkum **aturan baku** penentuan posisi panel popup (dropdown, datepicker, filter, tooltip) pada arsitektur zoom 80% SINTAK, hasil audit portal 17 Agu 2026. Baca sebelum membuat komponen popup baru atau memperbaiki posisi panel yang meleset.

---

## 1. Arsitektur Zoom (Kenapa Ini Ada)

- Seluruh konten app dibungkus `MainContentWrapper` dengan `md:[zoom:0.82]` (+ kompensasi `121.95vw/vh`) agar UI tablet & laptop tampak proporsional; monitor `>=1920px` = zoom 1.
- Komponen `<Portal>` (`src/components/Portal.tsx`) merender ke `document.body` dengan wrapper zoom yang **sama** (`[zoom:0.90] md:[zoom:0.82] min-[1920px]:[zoom:1]`).
- `getZoomScale()` (diekspor dari `Portal.tsx`) mengembalikan skala aktif: `1` (>=1920px), `0.82` (>=768px), `0.90` (<768px).

### Fakta empiris (diverifikasi Chrome headless, 17 Agu 2026)

1. `getBoundingClientRect()` mengembalikan koordinat **visual (post-zoom)**. Contoh: `top:100px; width:320px` di dalam wrapper zoom `0.82` -> `rect.top = 82`, `rect.width = 262.4`.
2. Offset & ukuran `position: fixed` di dalam wrapper zoom ikut ter-skalakan: `top: T` tampil di `T * 0.82`.
3. `position: fixed; inset: 0` **tetap** menutup penuh viewport (0 x 0.82 = 0) - aman untuk overlay modal (`BaseModal`).

---

## 2. Tiga Aturan Baku

### Aturan 1 — Panel di dalam `<Portal>` (wrapper ber-zoom): WAJIB bagi `getZoomScale()`

Karena wrapper Portal menskalakan offset `fixed`, koordinat dari `getBoundingClientRect()` (sudah visual) harus **dibagi skala** agar tampil presisi di bawah trigger:

```tsx
const rect = triggerRef.current.getBoundingClientRect();
const scale = getZoomScale();
setPanelStyle({
  position: 'fixed',
  top: (rect.bottom + 8) / scale,
  left: rect.left / scale,
  width: rect.width / scale, // ukuran ikut dibagi agar sama lebar dengan trigger
  zIndex: 9999,
});
```

Contoh implementasi benar: `StatCardDropdown`, `UserFormModal` (dropdown Role), `SearchableDropdown` (jalur `usePortal`), panel **Filter Harga** `/rekap-sales-order`.

### Aturan 2 — `createPortal` mentah ke `document.body` (tanpa wrapper zoom): pakai koordinat MENTAH, jangan dibagi

Panel di body level (zoom 1) tidak ter-skalakan -> `getBoundingClientRect()` visual bisa langsung dipakai:

```tsx
createPortal(
  <div style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left }}>...</div>,
  document.body
)
```

Contoh: tooltip deskripsi header (`MainContentWrapper`), tooltip card hasil-produksi. **Posisi benar; catatan kosmetik**: kontennya render di skala 100% (teks ~22% lebih besar dari app) - jika ingin konsisten, pindahkan ke `<Portal>` + Aturan 1.

### Aturan 3 — `fixed inset-0` aman

Overlay modal (`BaseModal`) tetap menutup penuh viewport meski di dalam wrapper zoom - tidak perlu penyesuaian.

---

## 3. Kesalahan yang Pernah Terjadi (referensi)

| Komponen | Kesalahan | Status |
|---|---|---|
| `InlineDropdown` | `createPortal` mentah ke body **tapi** koordinat dibagi scale -> panel meleset ~22% (62px lebih bawah, 36px lebih kanan, 58px lebih lebar) di layar ber-zoom | Sudah diperbaiki 17 Agu 2026 -> render lewat `<Portal>` (Aturan 1) |
| Panel Filter Harga `/rekap-sales-order` | `<Portal>` + koordinat mentah (tanpa `/scale`) -> posisi tidak sesuai trigger | Sudah diperbaiki 17 Agu 2026 -> `/getZoomScale()` |
| Datepicker `/rekap-sales-order` | Popup inline (bukan portal) tertutup komponen lain karena kartu induk tanpa z-index | Sudah diperbaiki 17 Agu 2026 -> `relative z-[60]` pada kartu tanggal (pola `DateRangeCard`) |

---

## 4. Verifikasi Cepat

Cara memastikan posisi panel benar di layar ber-zoom (mis. lebar 1280px, zoom 0.82):

1. Buka halaman dengan komponen popup.
2. Klik trigger -> panel harus menempel tepat di bawah/samping trigger (bukan melayang lebih jauh atau menabrak batas).
3. Cek skala konten panel: di dalam `<Portal>` tampil 82% (konsisten dengan app); di body mentah tampil 100%.
4. (Opsional) Tes otomatis: file HTML kecil dengan wrapper `zoom:0.82` + panel `fixed` - bandingkan `getBoundingClientRect()` panel vs trigger, jalankan via Chrome headless `--dump-dom`.

---

## Referensi

- `src/components/Portal.tsx` - komponen portal + `getZoomScale()`
- `docs/tutorials/26-optimasi-responsive-zoom-80-tablet-laptop-dan-portal-calibration.md` - arsitektur zoom awal
- Komponen acuan benar: `src/components/StatCardDropdown.tsx`, `src/app/users/UserFormModal.tsx` (dropdown Role), `src/app/rekap-sales-order/RekapSalesOrderClient.tsx` (panel Filter Harga)
