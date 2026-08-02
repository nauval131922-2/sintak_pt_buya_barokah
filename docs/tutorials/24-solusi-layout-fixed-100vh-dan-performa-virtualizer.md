# Solusi Layout Fixed 1-Layar (100vh) & Optimasi Performa Table/Card Virtualizer

Panduan teknis ini mencatat pengalaman dan solusi penyelesaian masalah **layout yang melar / scroll ganda** serta **performa lag parah pada data besar** saat menggunakan Next.js App Router, Tailwind CSS, dan `@tanstack/react-virtual`.

---

## 1. Pokok Masalah

1. **Layout Melar / Scroll Ganda (Bukan 1-Layar Fixed) di Desktop**
   - Saat container utama Next.js `page.tsx` tidak mengunci rantai flexbox `flex-1 min-h-0 overflow-hidden`, komponen anak (`ClientComponent`) akan memanjang sesuai tinggi konten tabel.
   - Akibatnya, seluruh halaman web ikut ter-scroll (`window scroll`), footer terdorong ke bawah jauh dari viewport, dan tata letak 100vh di desktop (`lg:`, `2xl:`) rusak.

2. **Card View Melar Tanpa Batas di Mobile (`sm:`)**
   - Saat mode tampilan kartu (`viewMode === 'card'`) aktif, tanpa `max-h` dan `overflow-auto`, daftar kartu melar panjang ke bawah secara penuh. User kesulitan untuk kembali ke panel filter di bagian atas.
   - Solusi: Terapkan `max-h-[60vh] overflow-auto custom-scrollbar` pada container Card View sama seperti Table View.

3. **Performa Lag Parah / Stuck pada Data Besar (Ratusan - Ribuan Baris)**
   - `@tanstack/react-virtual` (`useVirtualizer`) membutuhkan elemen container scroll (`getScrollElement: () => ref.current`) dengan **tinggi piksel terukur / terbatas**.
   - Jika parent container kehilangan batas tinggi (`min-h-0` hilang atau `overflow-hidden` di parent tidak terpasang), virtualizer menganggap tinggi container tak terbatas (`unbounded scroll height`).
   - Dampaknya: Virtualizer **me-render seluruh ribuan baris DOM sekaligus** tanpa virtualisasi, menyebabkan browser patah-patah / lag berat.

---

## 2. Struktur Arsitektur Solusi Responsif

### A. Root Container di `page.tsx`
```tsx
// src/app/modul-anda/page.tsx
export default function Page() {
  return (
    <div className="flex flex-col lg:flex-1 lg:min-h-0 gap-3 lg:overflow-hidden">
      {/* Header Sticky / Topbar */}
      <div id="sticky-page-header" className="shrink-0 relative bg-[var(--bg-deep)]">
        <PageHeader title="Judul Halaman" description="Deskripsi..." />
      </div>
      
      {/* Client Component */}
      <HasilProduksiClient />
    </div>
  );
}
```

### B. Main Container, Table, & Card View di `HasilProduksiClient.tsx`
```tsx
// src/app/modul-anda/HasilProduksiClient.tsx
return (
  <div className="flex flex-col lg:flex-1 lg:min-h-0 gap-3 animate-in fade-in duration-500 lg:overflow-hidden">
    {/* Panel Control / Filter Area - Fixed Shrink */}
    <div className="shrink-0">
      {/* Search & Filter Dropdowns */}
    </div>

    {/* Table / Card Container Wrapper */}
    <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-xl shadow-lg flex flex-col lg:flex-1 lg:min-h-0 overflow-hidden">
      <div className="flex flex-col lg:flex-1 lg:min-h-0">
        
        {viewMode === 'card' ? (
          /* Card View Scrollable Container */
          <div className="flex flex-col gap-2 p-3 isolate overflow-auto custom-scrollbar max-h-[60vh] lg:max-h-[calc(100vh-280px)] lg:flex-1 lg:min-h-0">
            {jurnalCardContent}
          </div>
        ) : (
          /* Table View Scrollable Container */
          <div
            ref={tableBodyRef}
            className="overflow-auto custom-scrollbar bg-gray-50/20 max-h-[60vh] lg:max-h-[calc(100vh-280px)] lg:flex-1 lg:min-h-0"
          >
            <table className="w-full border-separate border-spacing-0">
              {/* Table Content / Virtualized Rows */}
            </table>
          </div>
        )}

      </div>
    </div>

    {/* Table Footer - Fixed Shrink */}
    <TableFooter totalCount={totalItems} currentCount={totalItems} />
  </div>
);
```

---

## 3. Checklist Penting

1. **Card View Bounds**:
   - `viewMode === 'card'` wajib menyertakan `overflow-auto custom-scrollbar max-h-[60vh] lg:max-h-[calc(100vh-280px)]` agar pengguna mobile tidak terdorong terlalu jauh ke bawah.

2. **Mobile (`sm:`) vs Desktop (`lg:`)**:
   - `max-h-[60vh]` pada mobile memberi ruang cukup untuk tabel/kartu tanpa mengunci seluruh viewport.
   - `lg:max-h-[calc(100vh-280px)] lg:flex-1 lg:min-h-0` mengunci 1-layar pas di desktop (`1920x879`).

---

*Dokumen ini diperbarui secara otomatis di Obsidian.*
