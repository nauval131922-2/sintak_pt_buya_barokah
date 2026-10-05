# Database Sizing & Cleanup Guide — SINTAK ERP

Panduan lengkap untuk memantau, membersihkan, dan mengoptimalkan ruang penyimpanan database SQLite SINTAK ERP (`database.sqlite` & `database_dev.sqlite`).

---

## Analisis Ukuran Database

Berdasarkan analisis ukuran file database, total ukuran penyimpanan dapat mencapai **6 GB+** untuk production dan **4.5 GB+** untuk development. Tabel utama yang menyebabkan pembengkakan ini adalah **`activity_logs`**.

### Statistik Baris Data Terbesar
Berikut data perbandingan jumlah baris di database sebelum pembersihan pertama:

| Nama Database | Nama Tabel | Jumlah Baris (Sebelum) | Status |
|---------------|------------|------------------------|--------|
| `database.sqlite` (Prod) | `activity_logs` | **3.486.223** | 🔴 Penyebab Utama |
| | `jurnal_harian_produksi` | 168.350 | Normal |
| | `jurnal_umum` | 17.033 | Normal |
| `database_dev.sqlite` (Dev) | `activity_logs` | **2.921.458** | 🔴 Penyebab Utama |
| | `jurnal_umum` | 15.842 | Normal |

---

## Mengapa Ukuran Database Sangat Besar?

Ada dua alasan utama mengapa file database SQLite ini membengkak dengan cepat:

1. **Database Audit Triggers**:
   Sistem SINTAK ERP dilengkapi dengan pemicu database otomatis (*triggers*) pada hampir semua tabel. Setiap kali ada operasi data baru (`INSERT`, `UPDATE`, atau `DELETE`) seperti pada modul scraping otomatis, sinkronisasi, dan import massal, trigger ini akan menyisipkan satu baris log ke dalam tabel `activity_logs`. Jika proses import memasukkan ribuan baris data, jutaan log aktivitas akan tercipta dalam hitungan hari.
   
2. **Karakteristik Disk SQLite**:
   Saat data pada SQLite dihapus menggunakan perintah `DELETE`, SQLite **tidak akan langsung mengurangi ukuran file database di disk**. Ruang yang dihapus hanya ditandai sebagai ruang kosong (*free page*) untuk digunakan kembali nanti. Agar ukuran file database benar-benar menyusut secara fisik di hard disk, kita wajib menjalankan perintah **`VACUUM`**.

---

## Script Pembersihan Otomatis

Untuk menyederhanakan pemeliharaan database, telah dibuat script otomatis berbasis TypeScript di dalam proyek:

> [!NOTE]
> File Script: [scripts/cleanup-db.ts](file:///d:/repo%20github/sintak_pt_buya_barokah/scripts/cleanup-db.ts)

### Perilaku Script:
1. Mendeteksi file `database_dev.sqlite` and `database.sqlite` di root direktori.
2. Menghitung jumlah log saat ini dan ukuran file awal dalam Megabyte/Gigabyte.
3. Menghapus log aktivitas (`activity_logs`) yang sudah lebih tua dari hari retensi yang ditentukan.
4. Menjalankan perintah `VACUUM` untuk merestrukturisasi database dan menyusutkan ukuran file di disk secara langsung.
5. Menampilkan informasi detail mengenai ukuran akhir database serta total ruang penyimpanan yang berhasil dihemat.

---

## Cara Menjalankan Pembersihan

Jalankan perintah berikut di terminal/PowerShell workspace untuk membersihkan kedua database secara aman:

```powershell
npx tsx scripts/cleanup-db.ts
```

### Output Contoh Setelah Eksekusi:
```text
=== SINTAK DATABASE CLEANUP & VACUUM TOOL ===
Menyimpan log untuk 7 hari terakhir.

=============================================
[database_dev.sqlite] Memulai pembersihan...
[database_dev.sqlite] Ukuran awal: 4595.14 MB (4.49 GB)
[database_dev.sqlite] Jumlah activity_logs saat ini: 2.921.458 baris
[database_dev.sqlite] Menghapus log yang lebih tua dari 7 hari...
[database_dev.sqlite] Berhasil menghapus: 2.898.211 baris
[database_dev.sqlite] Sisa activity_logs: 23.247 baris
[database_dev.sqlite] Menjalankan VACUUM...
[database_dev.sqlite] VACUUM selesai dalam 11.9 detik.
[database_dev.sqlite] Ukuran akhir: 315.67 MB (0.31 GB)
[database_dev.sqlite] Menghemat ruang disk: 4279.47 MB
=============================================
```

---

## Konfigurasi Retensi Log

Secara default, script disetel untuk mempertahankan log selama **7 hari terakhir** (`DAYS_TO_KEEP = 7`). 

Jika Anda ingin menyimpan data log lebih lama atau lebih singkat, buka file `scripts/cleanup-db.ts` dan ubah variabel `DAYS_TO_KEEP` pada baris ke-5:

```typescript
// Contoh jika hanya ingin menyimpan log 3 hari terakhir (menghemat ruang lebih banyak)
const DAYS_TO_KEEP = 3;

// Contoh jika ingin menyimpan log 30 hari terakhir
const DAYS_TO_KEEP = 30;
```

---

## Rekomendasi Pemeliharaan Rutin

* **Jalankan Secara Berkala**: Disarankan untuk menjalankan script pembersihan ini **sebulan sekali** atau setiap kali performa server/pembacaan database terasa melambat.
* **Gunakan PM2 Task/Cron**: Script ini juga dapat dijadwalkan secara otomatis pada Windows Task Scheduler agar berjalan setiap minggu secara background tanpa mengganggu jalannya aplikasi.
