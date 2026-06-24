# 📐 DEV_RULES.md — Aturan Pengembangan SINTAK ERP

> ⚠️ **Untuk AI Agent**: File ini WAJIB dibaca di awal setiap sesi sebelum menulis kode apapun.
> Aturan di sini berlaku otomatis — tidak perlu user mengingatkan satu per satu.

---

## 0. ❓ Tanya Dulu Sebelum Mengerjakan

**Aturan**: Setiap menerima permintaan fitur baru atau perubahan yang cukup signifikan, AI agent **WAJIB** mengajukan pertanyaan klarifikasi terlebih dahulu sebelum mulai menulis kode.

**Yang perlu ditanyakan** (jika belum jelas):
- Apa hasil akhir yang diharapkan?
- Ada batasan atau kasus khusus yang perlu diperhatikan?
- Ada desain/perilaku yang sudah ada yang harus dipertahankan?

**Boleh langsung kerjakan** (tanpa tanya dulu):
- Permintaan sudah sangat spesifik (contoh: "ganti warna tombol ini jadi hijau")
- Perbaikan bug yang penyebabnya sudah jelas dari konteks

**Format**: Cukup satu pesan ringkas sebelum eksekusi, contoh:
> "Sebelum mulai, ada beberapa hal yang ingin saya klarifikasi: ..."

---

## 1. 🔔 Activity Log — Scraping & Import Massal

**Aturan**: Setiap fitur **scraping dari API eksternal** atau **upload/import file Excel massal** WAJIB menulis satu entri ke `activity_logs` setelah data berhasil disimpan.

**Kenapa**: Tabel bervolume tinggi (lihat daftar di bawah) dikecualikan dari trigger otomatis di `schema.ts`. Tanpa log manual, aksi scraping tidak akan muncul di halaman **Aktivitas Terkini** di dashboard.

**Tabel yang dikecualikan dari trigger otomatis** (wajib log manual):
```
jurnal_umum, jurnal_harian_produksi, sopd, sopd_harga,
bahan_baku, barang_jadi, sales_reports, sales_orders,
bill_of_materials, purchase_requests, purchase_orders,
penerimaan_pembelian, rekap_pembelian_barang, pelunasan_hutang,
pelunasan_piutang, pengiriman, spph_out, sph_in
```

**Pola wajib** — tambahkan di akhir handler scraping/import yang berhasil:
```typescript
try {
  const session = await getSession();
  await db.execute({
    sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      'SCRAPE',   // atau 'IMPORT' untuk upload Excel
      'nama_tabel',
      0,
      `Tarik data NamaModul: ${total} record (${periodStart} s/d ${periodEnd})`,
      JSON.stringify({ total, start: periodStart, end: periodEnd }),
      session?.username || 'System'
    ]
  });
} catch (_) {
  // Jangan gagalkan response jika logging error
}
```

**Untuk tabel baru**: Jika membuat tabel baru untuk scraping massal, tambahkan nama tabelnya ke exclusion list di `src/lib/schema.ts` fungsi `initDynamicTriggers`, lalu ikuti pola log manual di atas.

---

## 2. 🎨 Desain & Tema

- **Warna utama sistem**: Emerald/Green (`emerald-600`, `green-600`) — bukan biru
- Semua tombol aksi utama dan elemen aktif menggunakan tema hijau
- Hindari `blue-*` kecuali ada alasan spesifik (misalnya link eksternal)
- Referensi lengkap desain: lihat **Bagian 3** di `BUILD_FROM_SCRATCH.md`

---

## 3. 🧩 Komponen Standar

Gunakan komponen yang sudah ada, jangan buat duplikat:

| Kebutuhan | Komponen |
|-----------|----------|
| Dropdown dengan search | `SearchableDropdown` (`src/components/SearchableDropdown.tsx`) |
| Pilih tanggal | `DatePicker` (`src/components/DatePicker.tsx`) |
| Notifikasi sukses/gagal | `Toast` — jangan pakai `alert()` atau modal konfirmasi |
| Pagination tabel | `TableFooter` (`src/components/TableFooter.tsx`) |
| Popup di dalam modal | Pastikan z-index panel > z-index modal (min `z-[400]`) |

---

## 4. 📋 Checklist Sebelum Selesai

Sebelum menyatakan fitur selesai, pastikan:
- [ ] Fitur scraping/import → sudah ada log ke `activity_logs`
- [ ] Tabel baru untuk scraping massal → sudah masuk exclusion list
- [ ] Warna tema konsisten (hijau, bukan biru)
- [ ] Tidak ada `alert()` atau `window.confirm()` — ganti dengan Toast atau modal proper
- [ ] Dropdown dalam modal → z-index panel sudah lebih tinggi dari modal

---

*File ini dikelola bersama antara developer dan AI agent. Perbarui jika ada aturan baru yang disepakati.*
