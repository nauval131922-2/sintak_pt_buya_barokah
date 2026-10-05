# DOKUMEN SISTEM SINTAK: ALUR DATABASE & ARSITEKTUR API
> **Sistem Informasi Cetak (SINTAK) — PT Buya Barokah**  
> Status Dokumen: *Resmi, Terverifikasi Sumber Kode & Disertai Diagram Visual Box-Drawing*  
> Komponen: `Next.js 16 API Routes (132 Endpoints) | libSQL/SQLite 3 (WAL / MMAP) | Telegram Bot Daemon | Scraper Digit`

---

## DAFTAR ISI
1. [Siklus Hidup Request & Gateway Otorisasi](#1-siklus-hidup-request--gateway-otorisasi)
2. [Arsitektur Database Engine (SQLite WAL & Memory-Mapped I/O)](#2-arsitektur-database-engine-sqlite-wal--memory-mapped-io)
3. [Mekanisme Context Injection & Audit Trail Otomatis](#3-mekanisme-context-injection--audit-trail-otomatis)
4. [Pipeline Ingestion Scraper (Digit ERP)](#4-pipeline-ingestion-scraper-digit-erp)
5. [Integrasi Database Langsung Telegram Bot](#5-integrasi-database-langsung-telegram-bot)
6. [Pipeline Pencarian Data & FTS5 Fallback](#6-pipeline-pencarian-data--fts5-fallback)
7. [Matriks Risiko Arsitektur & Langkah Mitigasi](#7-matriks-risiko-arsitektur--langkah-mitigasi)

---

## 1. SIKLUS HIDUP REQUEST & GATEWAY OTORISASI

Setiap permintaan HTTP dari klien (Browser, Bot Telegram, atau Crontab) diproses melalui rantai penyaringan gateway sebelum mencapai Route Handler dan Database.

```text
┌───────────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
│ Browser/Telegram/Cron │     │ Gateway Proxy         │     │ Route Handler         │     │ DB Client Wrapper     │     │ SQLite 3 (WAL Mode)   │     │ Database Triggers     │
│                       │     │ (src/proxy.ts)        │     │ (src/app/api/*/route) │     │ (src/lib/db.ts)       │     │ (Local / Turso)       │     │ (src/lib/schema.ts)   │
└───────────┬───────────┘     └───────────┬───────────┘     └───────────┬───────────┘     └───────────┬───────────┘     └───────────┬───────────┘     └───────────┬───────────┘
            │                             │                             │                             │                             │                             │
            │ HTTP Request (Cookie/Bearer)│                             │                             │                             │                             │
            │────────────────────────────►│                             │                             │                             │                             │
            │                             │                             │                             │                             │                             │
      ┌─alt │ [1. Rute Publik (PUBLIC_PATHS)]                           │                             │                             │                             │
      │     │                             │ Lolos tanpa token           │                             │                             │                             │
      │     │                             │────────────────────────────►│                             │                             │                             │
      │     │                             │                             │                             │                             │                             │
      ├─────┼─────────────────────────────┼─────────────────────────────┤                             │                             │                             │
      │     │ [2. Header Authorization: Bearer ${CRON_SECRET}]          │                             │                             │                             │
      │     │                             │ Lolos sebagai Worker        │                             │                             │                             │
      │     │                             │────────────────────────────►│                             │                             │                             │
      │     │                             │                             │                             │                             │                             │
      ├─────┼─────────────────────────────┼─────────────────────────────┤                             │                             │                             │
      │     │ [3. Cookie 'sintak_session']│                             │                             │                             │                             │
      │     │                             │──┐                          │                             │                             │                             │
      │     │                             │  │ Verifikasi JWT HS256     │                             │                             │                             │
      │     │                             │◄─┘                          │                             │                             │                             │
      │     │                             │                             │                             │                             │                             │
      │     │ [Token Valid]               │ Lolos ke Route Handler      │                             │                             │                             │
      │     │                             │────────────────────────────►│                             │                             │                             │
      │     │                             │                             │                             │                             │                             │
      │     │ [Token Invalid / Expired]   │                             │                             │                             │                             │
      │     │ 401 Unauthorized / Redirect │                             │                             │                             │                             │
      │     │◄────────────────────────────│                             │                             │                             │                             │
      └─────┴─────────────────────────────┴─────────────────────────────┴─────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
            │                             │                             │                             │                             │                             │
            │                             │                             │ db.execute() / db.batch()   │                             │                             │
            │                             │                             │────────────────────────────►│                             │                             │
            │                             │                             │                             │                             │                             │
      ┌─alt │ [A. Operasi Tulis (INSERT / UPDATE / DELETE)]             │                             │                             │                             │
      │     │                             │                             │                             │ injectContext()             │                             │
      │     │                             │                             │                             │ (INSERT session_context)    │                             │
      │     │                             │                             │                             │────────────────────────────►│                             │
      │     │                             │                             │                             │                             │                             │
      │     │                             │                             │                             │                             │ Eksekusi SQL Mutasi         │
      │     │                             │                             │                             │────────────────────────────►│                             │
      │     │                             │                             │                             │                             │ Pemicuan Trigger            │
      │     │                             │                             │                             │                             │────────────────────────────►│
      │     │                             │                             │                             │                             │                             │
      │     │                             │                             │                             │                             │ Tulis ke activity_logs      │
      │     │                             │                             │                             │                             │◄────────────────────────────│
      │     │                             │                             │                             │                             │                             │
      ├─────┼─────────────────────────────┼─────────────────────────────┼─────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
      │     │ [B. Operasi Baca (SELECT)]  │                             │                             │                             │                             │
      │     │                             │                             │                             │ Eksekusi Query Langsung     │                             │
      │     │                             │                             │                             │ (Bypass injectContext)      │                             │
      │     │                             │                             │                             │────────────────────────────►│                             │
      └─────┴─────────────────────────────┴─────────────────────────────┴─────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
            │                             │                             │                             │                             │                             │
            │                             │                             │                             │ Query Results / Rows Data   │                             │
            │                             │                             │                             │◄────────────────────────────│                             │
            │                             │                             │                             │                             │                             │
            │                             │                             │ Formatted Data / Record     │                             │                             │
            │                             │                             │◄────────────────────────────│                             │                             │
            │                             │                             │                             │                             │                             │
            │ HTTP Response JSON (200 OK) │                             │                             │                             │                             │
            │◄──────────────────────────────────────────────────────────│                             │                             │                             │
            │                             │                             │                             │                             │                             │
```

### Rincian Komponen Otorisasi:
1. **Public Paths Whitelist (`src/proxy.ts:12-27`)**: Rute aset statis, webhook telegram, cron, dan login dikecualikan dari pengecekan sesi.
2. **Machine-to-Machine Secret (`src/proxy.ts:34-37`)**: Header `Authorization: Bearer ${CRON_SECRET}` mengizinkan cron job OS Linux mengeksekusi sinkronisasi dan maintenance harian tanpa token browser.
3. **User Session Verification (`src/proxy.ts:29-51`)**: Validasi token JWT terenkripsi dengan algoritma HS256 dari cookie `sintak_session`.

---

## 2. ARSITEKTUR DATABASE ENGINE (SQLITE WAL & MEMORY-MAPPED I/O)

SINTAK menggunakan SQLite lokal yang dioptimalkan untuk konkurensi tinggi dan *read throughput* maksimal menggunakan konfigurasi level PRAGMA.

```text
+---------------------------------------------------------------------------------------------------------+
|                                    PROSES APLIKASI & KONEKSI RUNTIME                                    |
|                                                                                                         |
|   +---------------------------------------+             +-------------------------------------------+   |
|   |   Node.js Server App (Port 3000)      |             |   Telegram Bot Daemon (Background)        |   |
|   |   • Next.js Web UI Thread             |             |   • Polling / Webhook Worker              |   |
|   |   • Scraper Ingestion Thread          |             |   • Direct @libsql/client (src/db.ts)     |   |
|   +-------------------+-------------------+             +---------------------+---------------------+   |
+-----------------------│───────────────────────────────────────────────────────│────────────────---------+
                        │ (Read / Write)                                        │ (Read / Write)
                        ▼                                                       ▼
+---------------------------------------------------------------------------------------------------------+
|                                      BUFFER MEMORI KERNEL OS & CACHE                                    |
|                                                                                                         |
|       +------------------------------------+             +------------------------------------+         |
|       |  RAM Cache SQLite: 64 MB           |             |  Memory-Mapped (MMAP): 256 MB      |         |
|       |  (PRAGMA cache_size = -64000)      |             |  (PRAGMA mmap_size = 268435456)    |         |
|       |  Query in-memory hotspot data      |             |  Zero-copy fast disk seek paging   |         |
|       +-----------------+------------------+             +-----------------+------------------+         |
+-------------------------│──────────────────────────────────────────────────│----------------------------+
                          │                                                  │
                          │                 [JALUR PENULISAN]                │
                          │                                                  │
                          ▼                                                  │
+----------------------------------------------------------------------------│----------------------------+
|                                  SINGLE-WRITER CONCURRENCY GATE            │                            |
|                                                                            │                            |
|   +---------------------------------------------------------------------+  │                            |
|   |  Write Lock Mutex (PRAGMA busy_timeout = 5000 ms)                   |  │                            |
|   |  Antrean penulisan berurutan; toleransi tunggu 5 detik              |  │                            |
|   +----------------------------------+----------------------------------+  │                            |
+--------------------------------------│-------------------------------------│----------------------------+
                                       │                                     │
                                       │ Write Stream                        │ Read Paging
                                       ▼                                     ▼
+---------------------------------------------------------------------------------------------------------+
|                                       PENYIMPANAN BERKAS FISIK DISK                                     |
|                                                                                                         |
|   +-------------------------------+   +-------------------------------+   +-------------------------+   |
|   |  database.sqlite-wal          |   |  database.sqlite-shm          |   |  database.sqlite        |   |
|   |  (Write-Ahead Log Transaksi)  |──►|  (Shared Memory Index Index)  |──►|  (Berkas Utama Database)|   |
|   |  Perubahan di-append di sini  |   |  Peta frame buffer WAL        |   |  Checkpoint 01:00 WIB   |   |
|   +-------------------------------+   +-------------------------------+   +-------------------------+   |
+---------------------------------------------------------------------------------------------------------+
```

### Konfigurasi PRAGMA Utama (`src/lib/schema.ts:9-13`):
* `PRAGMA journal_mode = WAL;`: Mengaktifkan *Write-Ahead Logging*. Pembacaan tidak pernah memblokir penulisan, dan penulisan tidak memblokir pembacaan.
* `PRAGMA mmap_size = 268435456;`: Memetakan 256 MB file database langsung ke virtual address space memori untuk *zero-copy read*.
* `PRAGMA cache_size = -64000;`: Menyediakan 64 MB RAM cache SQLite internal.
* `PRAGMA busy_timeout = 5000;`: Memberi batas toleransi antrean penulisan hingga 5.000 ms sebelum melempar error `SQLITE_BUSY`.

---

## 3. MEKANISME CONTEXT INJECTION & AUDIT TRAIL OTOMATIS

Untuk melacak siapa yang melakukan perubahan data tanpa menulis kode audit manual di setiap fungsi, sistem menggunakan kombinasi **DB Wrapper Interception** dan **SQLite Triggers**.

```text
               +------------------------------------------------------------+
               | Panggilan db.execute(sql, args) atau db.batch(statements)  |
               +-----------------------------+------------------------------+
                                             │
                                             ▼
                             /───────────────────────────────\
                            <   Apakah Query Mutasi?          >
                            <   (INSERT / UPDATE / DELETE)    >
                             \───────────────────────────────/
                                      │             │
                          TIDAK (SELECT)             YA (Mutasi)
                                      │             │
                                      │             ▼
                                      │  +----------------------------------------------------+
                                      │  | injectContext(menuContext)                         |
                                      │  | Ambil username dari session cookies()              |
                                      │  +------------------+---------------------------------+
                                      │                     │
                                      │                     ▼
                                      │  +----------------------------------------------------+
                                      │  | Tulis ke Tabel Satu-Baris Konteks:                 |
                                      │  | INSERT OR REPLACE INTO session_context             |
                                      │  | (id, username, last_menu) VALUES (1, ?, ?)         |
                                      │  +------------------+---------------------------------+
                                      │                     │
                                      ▼                     ▼
                       +──────────────────────────────────────────────────────+
                       | Eksekusi Statement SQL Mutasi / Pembacaan Pengguna   |
                       +────────────────────────────+─────────────────────────+
                                                    │
                                                    ▼
                                    /───────────────────────────────\
                                   <   Tabel Masuk EXCLUDED_TABLES?  >
                                   <   (orders, jurnal, bahan, dll)  >
                                    \───────────────────────────────/
                                             │             │
                                    YA (Excluded)           TIDAK (Normal Table)
                                             │             │
                                             │             ▼
                                             │  +---------------------------------------------+
                                             │  | Trigger Database Aktif:                     |
                                             │  | trg_table_insert / update / delete          |
                                             │  +------------------+--------------------------+
                                             │                     │
                                             │                     ▼
                                             │  +---------------------------------------------+
                                             │  | Subquery Pembaca Konteks:                   |
                                             │  | (SELECT username FROM session_context id=1) |
                                             │  +------------------+--------------------------+
                                             │                     │
                                             │                     ▼
                                             │  +---------------------------------------------+
                                             │  | INSERT INTO activity_logs                   |
                                             │  | • action_type: INSERT/UPDATE/DELETE         |
                                             │  | • before & after: json_object snapshot      |
                                             │  | • recorded_by: username dari session        |
                                             │  +------------------+--------------------------+
                                             │                     │
                                             ▼                     │
                      +─────────────────────────────────────────+  │
                      | Manual Agregasi: logActivity()          |  │
                      | 1 Baris Log Setelah Impor Batch Selesai |  │
                      +──────────────────────+──────────────────+  │
                                             │                     │
                                             ▼                     ▼
                               +─────────────────────────────────────────+
                               |     Mutasi Berhasil Disimpan (200 OK)   |
                               +-----------------------------------------+
```

### Implementasi Teknis:
* **Context Interceptor (`src/lib/db.ts:98-134`)**: Mengekstrak user dari `getSession()` dan menyimpan ke `session_context WHERE id = 1`.
* **Triggers Template (`src/lib/schema.ts:1824-1863`)**: Otomatis membuat snapshot `before` dan `after` menggunakan fungsi native `json_object(...)`.
* **Exclusion List (`src/lib/schema.ts:1760-1770`)**: Tabel bervolume tinggi (`jurnal_umum`, `jurnal_harian_produksi`, `orders`, `bahan_baku`, `barang_jadi`, dll.) dikeluarkan dari trigger agar impor ribuan baris tidak menyebabkan *write amplification*.

---

## 4. PIPELINE INGESTION SCRAPER (DIGIT ERP)

Scraper bertugas menarik data transaksi dari sistem Digit secara periodik atau manual tanpa memicu deadlock pada sistem operasional harian.

```text
+---------------------------------------------------------------------------------------------------------+
|                                    1. INISIASI & AUTENTIKASI SESI                                       |
|                                                                                                         |
|   [Trigger Scraper] ──► [getScraperSession()] ──► [POST v1/auth/login ke Digit] ──► [Cookie Caching]    |
|   (Web UI / Cron)        Cek memory cache          Headers: X-Bismillah-Api-Key      Simpan ke RAM      |
+---------------------------------------------------│-----------------------------------------------------+
                                                    │
                                                    ▼
+---------------------------------------------------------------------------------------------------------+
|                                    2. PENARIKAN & NORMALISASI DATA                                      |
|                                                                                                         |
|   [HTTP GET Data Periode] ───────────────► [Parser & Sanitasi] ─────────────► [Cek Faktur Duplikat]     |
|   Rentang: DD-MM-YYYY                      • Konversi DD/MM/YYYY ke ISO        SELECT faktur FROM table |
|   Format JSON Array Transaksi              • Parse format desimal/angka        WHERE faktur IN (...)    |
+---------------------------------------------------│-----------------------------------------------------+
                                                    │
                                                    ▼
+---------------------------------------------------------------------------------------------------------+
|                                    3. CHUNKED BATCH INGESTION (SQLITE)                                  |
|                                                                                                         |
|   +-------------------------------------------------------------------------------------------------+   |
|   |  Perulangan Chunk: 100 baris per eksekusi batch                                                 |   |
|   |                                                                                                 |   |
|   |  INSERT INTO table (faktur, tgl, nama_prd, qty, ..., raw_data) VALUES (?, ?, ?, ...)            |   |
|   |  ON CONFLICT(faktur) DO UPDATE SET                                                              |   |
|   |     qty = excluded.qty, harga = excluded.harga, raw_data = excluded.raw_data                    |   |
|   +-----------------------------------------------+-------------------------------------------------+   |
+---------------------------------------------------│-----------------------------------------------------+
                                                    │
                                                    ▼
+---------------------------------------------------------------------------------------------------------+
|                                    4. SINKRONISASI RELASI & METADATA                                    |
|                                                                                                         |
|   +───────────────────────────────+               +─────────────────────────────────────────────────+   |
|   | Apakah Tahun >= 2026?         |──(Ya)────────►| Upsert ke tabel 'sopd' (no_sopd = faktur)       |   |
|   +───────────────────────────────+               +────────────────────────┬────────────────────────+   |
|                   │ (Tidak)                                                │                            |
|                   ▼                                                        ▼                            |
|   +─────────────────────────────────────────────────────────────────────────────────────────────────+   |
|   | Update system_settings:                                                                         |   |
|   | • last_scrape_orders = CURRENT_TIMESTAMP                                                        |   |
|   | • last_scrape_orders_period = {"start": "...", "end": "..."}                                     |   |
|   +───────────────────────────────────────────────┬─────────────────────────────────────────────────+   |
|                                                   │                                                     |
|                                                   ▼                                                     |
|   +─────────────────────────────────────────────────────────────────────────────────────────────────+   |
|   | logActivity(): Rekam 1 ringkasan agregat ke activity_logs:                                      |   |
|   | "Scraped 150 records (12 new, 138 updated) for range 2026-10-01 to 2026-10-05"                  |   |
|   +-------------------------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------------------------+
```

### Poin Kritis Ingestion (`src/app/api/scrape-orders/route.ts:154-250`):
1. **Idempotensi `ON CONFLICT`**: Mencegah data ganda jika scraper dijalankan ulang pada rentang tanggal yang sama.
2. **Chunking 100 Baris**: Membatasi ukuran *write transaction* SQLite agar memori tidak melonjak dan tidak memblokir antrean tulis thread lain terlalu lama.
3. **Penyimpanan Metadata**: Status rentang tanggal terakhir yang sukses dicatat ke `system_settings` sehingga UI tahu data terupdate kapan.

---

## 5. INTEGRASI DATABASE LANGSUNG TELEGRAM BOT

Telegram Bot (`telegram-bot/`) tidak memanggil API Next.js melalui HTTP, melainkan terhubung langsung ke berkas database SQLite lokal.

```text
 [Operator Mesin di Lantai Pabrik]
               │
               │ Kirim Pesan: /input (Nomor Order, Realisasi, Inscheet, Rijek, Jam)
               ▼
 [Telegram Cloud Server (Bot API)]
               │
               │ Long-Polling / Webhook Event
               ▼
 [Telegram Bot Daemon: telegram-bot/src/bot.ts]
               │
               │ Teruskan ke Handler
               ▼
 [Validation Pipeline: telegram-bot/src/utils/api.ts]
               │
               ├─► [1. Validasi Operator] ──► SELECT FROM telegram_users WHERE is_active = 1
               │   (Jika belum diapprove: Tolak pengerjaan)
               │
               ├─► [2. Validasi Order]   ──► SELECT FROM sopd WHERE no_sopd = ?
               │   (Jika nomor order fiktif: Beri peringatan order tidak ada)
               │
               └─► [3. Validasi Job]     ──► SELECT FROM master_pekerjaan_jurnal_produksi
                   (Pastikan jenis pekerjaan cetak/finishing sesuai divisi)
               │
               │ Seluruh Validasi Lulus (Data Valid)
               ▼
 [Direct LibSQL Execution: @libsql/client file:../database.sqlite]
               │
               ├─► 1. INSERT INTO jurnal_harian_produksi
               │      (posisi, absensi, tgl, shift, nama_karyawan, bagian,
               │       no_order, nama_order, jenis_pekerjaan, target, realisasi, rijek, kendala)
               │
               └─► 2. INSERT INTO activity_logs (Audit Trail Mandiri)
                      (action_type: 'INSERT', table_name: 'jurnal_harian_produksi',
                       message: 'Input JHP: No Order ... (via Telegram Bot)',
                       recorded_by: '<Nama Operator> (via Telegram Bot)')
               │
               │ Selesai Tulis Disk
               ▼
 [Balas Pesan Telegram ke Operator]
 "Data Realisasi Berhasil Disimpan! ID JHP: #4829 - Order: BUKU YASIN 128 HAL - Realisasi: 2.500 pcs"
```

### Keuntungan & Karakteristik Desain:
* **Zero HTTP Overhead**: Akses lokal langsung via `@libsql/client` (`telegram-bot/src/db.ts:14`) memberikan latensi simpan $< 5\text{ ms}$.
* **Audit Trail Mandiri**: Karena `jurnal_harian_produksi` tidak memakai database trigger otomatis, bot bertanggung jawab langsung menyisipkan baris audit di `activity_logs` (`telegram-bot/src/utils/api.ts:301-304`).

---

## 6. PIPELINE PENCARIAN DATA & FTS5 FALLBACK

Untuk menjaga kecepatan respons pencarian faktur dan nama barang di antara ratusan ribu baris data, sistem menggunakan virtual table **SQLite FTS5** dengan *graceful fallback*.

```text
                  [Request API: GET /api/orders?search=al-fath&page=1&limit=10]
                                                │
                                                ▼
                            [buildFtsQuery(search) di src/lib/fts.ts]
                            • Buang karakter spesial / operator SQL berbahaya
                            • Bentuk FTS token: '"al" * "fath" *'
                                                │
                                                ▼
                         /─────────────────────────────────────────────\
                        <  Eksekusi Query Virtual Table FTS5:           >
                        <  SELECT o.* FROM orders o JOIN orders_fts fts >
                        <  ON o.id = fts.rowid WHERE orders_fts MATCH ? >
                         \─────────────────────────────────────────────/
                                                │
                                                ▼
                                    /───────────────────────\
                                   <   Apakah Total Data > 0 >
                                    \───────────────────────/
                                           │         │
                                   YA (Ada)           TIDAK (0 Hasil)
                                           │         │
                                           │         ▼
                                           │  +───────────────────────────────────────────────+
                                           │  | Graceful Fallback ke Standard LIKE:           |
                                           │  | SELECT * FROM orders WHERE                    |
                                           │  | (id LIKE ? OR faktur LIKE ? OR                |
                                           │  |  nama_prd LIKE ? OR raw_data LIKE ?)          |
                                           │  | args: ['%al-fath%', '%al-fath%', ...]         |
                                           │  +──────────────────────+────────────────────────+
                                           │                         │
                                           ▼                         ▼
                         +─────────────────────────────────────────────────────────────+
                         | Pagination, Date Filter & Sorting:                          |
                         | ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC...  |
                         | LIMIT ? OFFSET ?                                            |
                         +──────────────────────────────+──────────────────────────────+
                                                        │
                                                        ▼
                         +─────────────────────────────────────────────────────────────+
                         | stripRawData(records, ORDERS_LIST_RAW_KEYS):                |
                         | Bersihkan field raw_data mentah agar payload JSON ringan    |
                         +──────────────────────────────+──────────────────────────────+
                                                        │
                                                        ▼
                         +─────────────────────────────────────────────────────────────+
                         | Kirim Response JSON:                                        |
                         | { success: true, data: [...], total: 42, page: 1, limit: 10}|
                         +─────────────────────────────────────────────────────────────+
```

### Mekanisme Resiliensi (`src/app/api/orders/route.ts:27-74`):
1. **FTS5 Index Seek**: Menggunakan pencarian berbasis *inverted index* untuk pencocokan kata instan.
2. **Fallback Robustness**: Jika pengguna mencari teks parsial yang tidak dikenali FTS tokenizer (misal: kode acak di tengah kata), sistem otomatis turun ke query `LIKE %keyword%` parameterized tanpa menimbulkan error.

---

## 7. MATRIKS RISIKO ARSITEKTUR & LANGKAH MITIGASI

Berdasarkan audit alur database dan API, berikut adalah identifikasi risiko dan panduan penanganannya:

| No | Komponen Terkait | Potensi Risiko | Penjelasan & Dampak | Rekomendasi Solusi Teknis |
|:---:|---|---|---|---|
| **1** | `session_context`<br>(`src/lib/db.ts:118`) | **Race Condition pada Audit Log** | `session_context` hanya memiliki 1 baris (`id = 1`). Jika dua user melakukan simpan bersamaan dalam hitungan milidetik, User B bisa menimpa username User A sebelum trigger User A berjalan. | Sertakan `connection/transaction-scoped context` atau teruskan `username` langsung pada statement mutasi. |
| **2** | API Routes<br>(`src/app/api/*/route.ts`) | **IDOR / Bypass Izin Modul** | `src/proxy.ts` hanya memverifikasi login (sesi valid), sedangkan `requirePermission()` hanya dipanggil di Server Component UI (`page.tsx`). User login dengan role apa pun bisa memanggil endpoint API secara langsung via cURL. | Tambahkan pemanggilan `requirePermission()` di awal fungsi handler API mutasi (POST, PATCH, DELETE). |
| **3** | Ingestion vs Bot<br>(`scrape-*/route.ts`) | **Database Lock (`SQLITE_BUSY`)** | SQLite hanya mengizinkan **1 thread penulisan** dalam satu waktu. Jika scraper sedang mengeksekusi batch besar $> 5$ detik, Telegram bot akan timeout dan melempar error *database locked*. | Jaga `chunkSize = 100` pada scraper, sisipkan jeda `await sleep(10)` antar-chunk jika antrean sedang padat. |

---
> *Dokumen ini disinkronkan langsung dari basis kode aktif SINTAK pada 5 Oktober 2026.*
