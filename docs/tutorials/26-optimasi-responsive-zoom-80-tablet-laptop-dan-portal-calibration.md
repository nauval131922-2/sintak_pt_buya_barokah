# Tutorial 26: Optimasi Responsive Zoom 80% (Tablet & Laptop) dan Portal Dropdown Calibration

Dokumen ini mencatat bug, akar masalah, dan solusi arsitektur terkait penyesuaian skala tampilan (80% Zoom) dan posisi Portal Dropdown pada Sistem SINTAK untuk Tablet (`md:`) dan Laptop (`lg:`).

---

## 🎯 1. Ringkasan Masalah

1. **Outer Scrollbar Melar pada Zoom 80% (Laptop & Tablet)**
   - Saat container utama diberi CSS `zoom: 0.82` dan dikompensasi `121.95vw / 121.95vh`, browser secara default membuat scrollbar ganda di level viewport terluar (`<html>` / `<body>`).
2. **Posisi Dropdown & DatePicker Meleset (~18% Ke Kiri/Atas)**
   - Panel `<SearchableDropdown />` dan `<DatePicker />` menggunakan `<Portal />` ke `document.body`.
   - Ketika wrapper Portal ikut diberi kelas `[zoom:0.82]`, browser mengalikan koordinat `position: fixed` dari `getBoundingClientRect()` dua kali (double scale).
3. **Bagian Bawah Melayang di Tablet (`md:`)**
   - Kelas `h-full` hanya terpasang di breakpoint `lg:` (laptop). Pada tablet (`md:`), container terkunci di `h-screen` (100vh) sehingga terdapat sisa area menggantung setinggi `21.95vh`.
4. **Halaman Berkonten Panjang Tidak Bisa Di-scroll**
   - Penambahan `md:overflow-hidden` di `#main-content-scroll` mematikan scrollbar utama untuk seluruh halaman, termasuk Log Aktivitas, Users, dan Roles.
5. **Card Mobile (HP) & Layout Form Input JHP**
   - Baris info umum melar dengan scrollbar horizontal.
   - Form input JHP membutuhkan header (sub-tab) dan footer (tombol aksi) yang terkunci (fixed) saat isi form di-scroll.

---

## 🛠️ 2. Solusi Teknis & Arsitektur

### A. Penguncian Viewport di Root Layout (`layout.tsx`)
Mengunci `<html>` dan `<body>` agar tidak pernah memicu scrollbar terluar browser.

```tsx
// src/app/layout.tsx
<html lang="id" className="overflow-hidden">
  <body className={`${outfit.className} overflow-hidden h-screen w-screen`}>
    <MainContentWrapper user={user} permissions={permissions}>
      {children}
    </MainContentWrapper>
  </body>
</html>
```

### B. Zoom 80% Responsif & Content Scroll (`MainContentWrapper.tsx`)
Pemasangan `md:[zoom:0.82]` dengan kompensasi ukuran viewport dari Tablet hingga Desktop:

```tsx
// src/components/MainContentWrapper.tsx
return (
  <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-deep)] md:[zoom:0.82] md:w-[121.95vw] md:h-[121.95vh]">
    <Sidebar user={user} permissions={permissions} />
    <div className="flex-1 flex flex-col min-w-0 h-screen md:h-full overflow-hidden">
      {/* Header Bar */}
      <div className="...">...</div>
      
      {/* Main Content Area: Tetap overflow-y-auto secara universal */}
      <div id="main-content-scroll" className="flex-1 min-h-0 flex flex-col min-w-0 overflow-y-auto custom-scrollbar bg-[var(--bg-deep)] px-4 xl:px-8 pt-2 xl:pt-3 pb-4 xl:pb-6">
        {children}
      </div>
    </div>
  </div>
);
```

### C. Pembetulan Komponen Portal (`Portal.tsx`)
Komponen `<Portal />` dijaga **murni tanpa wrapper zoom** agar `getBoundingClientRect()` membaca koordinat piksel layar absolut secara 100% presisi:

```tsx
// src/components/Portal.tsx
export default function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted ? createPortal(children, document.body) : null;
}
```

### D. Sidebar Height untuk Tablet & Laptop (`Sidebar.tsx`)
Menyesuaikan tinggi sidebar agar memenuhi `121.95vh` mulai dari breakpoint `md:`:

```tsx
// src/components/Sidebar.tsx
<aside className="fixed xl:sticky xl:top-0 h-screen md:h-full bg-white border-r border-gray-100 shrink-0 flex flex-col z-[100] ...">
```

### E. Structuring Form Input JHP Fixed Header & Footer (`JurnalClient.tsx`)
```tsx
<form className="bg-white border border-gray-100 rounded-2xl shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
  {/* HEADER FIXED */}
  <div className="shrink-0 p-4 border-b border-gray-100 bg-white/95 z-10">
    {/* Sub-tab Target / Realisasi */}
  </div>

  {/* BODY SCROLLABLE */}
  <div className="flex-1 min-h-0 overflow-y-auto p-6 custom-scrollbar">
    {/* Field-field form */}
  </div>

  {/* FOOTER FIXED */}
  <div className="shrink-0 p-4 border-t border-gray-100 bg-white/95 z-10 flex justify-between">
    {/* Tombol Batal & Simpan Data */}
  </div>
</form>
```

---

## ✅ 3. Verifikasi & Pengujian

1. **Tablet & Laptop Zoom Test**:
   - Buka aplikasi di resolusi Tablet (≥768px) & Laptop. Seluruh UI berada dalam zoom 80% tanpa scrollbar ganda di tepi layar.
2. **Dropdown Alignment Test**:
   - Klik DatePicker dan SearchableDropdown di berbagai posisi halaman. Panel popup harus menempel tepat di bawah tombol trigger.
3. **Long Content Scroll Test**:
   - Buka halaman Log Aktivitas / Users / Roles. Halaman dapat di-scroll lancar hingga paling bawah.
4. **Form JHP Scroll Test**:
   - Buka form Tambah/Edit JHP. Scroll bagian isi form, pastikan tombol Simpan dan Tab Target/Realisasi tetap diam di tempatnya.
