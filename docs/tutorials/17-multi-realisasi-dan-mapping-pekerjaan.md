# 17. Multi-Realisasi Input & Perbaikan Mapping Pekerjaan

Tutorial ini menjelaskan implementasi fitur Multi-Realisasi pada Jurnal Harian Produksi dan perbaikan mapping kategori pekerjaan di database.

## 🚀 Fitur Multi-Realisasi Input

Fitur ini memungkinkan Admin Realisasi untuk menginput lebih dari satu baris realisasi untuk satu baris target (penjadwalan) yang sama.

### 🛠️ Perubahan Teknis
1.  **Frontend (JurnalClient.tsx)**:
    *   Menambahkan state `multiRealisasi` untuk menampung baris input dinamis.
    *   Implementasi tombol **"Tambah Realisasi Lainnya (+)"** yang muncul jika `no_order_2` dan `jenis_pekerjaan_2` masih kosong.
    *   Validasi: Baris tambahan yang kosong (tanpa no order/jenis pekerjaan/target/realisasi) akan difilter sebelum dikirim ke API.
2.  **Backend (route.ts)**:
    *   Menggunakan `action = 'input_multi_realisasi'` untuk membedakan dengan update biasa.
    *   Logika: Baris pertama (index 0) melakukan `UPDATE` pada record asli (termasuk update field target utama). Baris selanjutnya (index 1 ke atas) melakukan `INSERT` record baru dengan flag `is_manual_input = 1`.

---

## 🛠️ Perbaikan Mapping Kategori Pekerjaan

Terdapat ketidaksinkronan antara UI dan Database pada kategori **FINISHING**.

### 🔍 Masalah
*   Di UI, bagian **FINISHING** seharusnya menampilkan pekerjaan **PASCA CETAK**.
*   Di Database, semua pekerjaan berkode `D.*` (Pasca Cetak) tersimpan dengan kategori `CETAK`, sehingga dropdown finishing sering kosong atau salah isi.

### ✅ Solusi
1.  **Update Database**: Menjalankan query untuk mengubah seluruh kode `D.%` dari kategori `CETAK` menjadi `PASCA CETAK`.
    ```sql
    UPDATE master_pekerjaan SET category = 'PASCA CETAK' WHERE code LIKE 'D.%';
    ```
2.  **Fix API Filter**: Mengubah filter kategori dari `LIKE` menjadi exact match (`=`).
    *   Sebelumnya: `LIKE '%CETAK%'` mencocokkan `PRA CETAK`, `CETAK`, dan `PASCA CETAK`.
    *   Sesudahnya: `category = ?` memastikan filter yang presisi.
3.  **Frontend Mapping**: Memastikan `BAGIAN_CATEGORY_MAP['FINISHING']` mengarah ke `'PASCA CETAK'`.

---

## 🔒 Sistem Permission & Pencegahan Race Condition

1.  **Pemisahan Permission Copy**:
    *   Menambahkan prop `canCopyJadwal` di `JurnalClient`.
    *   Admin Realisasi tetap bisa `canInputTarget = true` (untuk akses form), tapi tidak bisa `canCopyJadwal`.
2.  **Atomic Copy Jadwal**:
    *   Menggunakan `db.batch()` untuk operasi salin jadwal besok.
    *   Logika: Insert activity log dan Insert data jadwal dilakukan dalam satu transaksi atomic untuk mencegah duplikasi jika tombol diklik bersamaan.
3.  **Auto-Refresh Tombol Copy**:
    *   Menambahkan penghapusan log `COPY_JADWAL` saat Admin Penjadwalan melakukan upload ulang data JHP, sehingga tombol "Copy Jadwal Besok" muncul kembali secara otomatis.

---

## 💡 Tips Troubleshooting
*   Jika dropdown jenis pekerjaan masih salah, pastikan file database yang di-update sudah benar (`database.sqlite` vs `database_dev.sqlite`).
*   Selalu gunakan **Hard Refresh** (`Ctrl + Shift + R`) jika perubahan UI permission tidak langsung terlihat.
