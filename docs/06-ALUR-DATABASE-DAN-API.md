# DOKUMEN SISTEM SINTAK: ALUR DATABASE & ARSITEKTUR API
> **Sistem Informasi Cetak (SINTAK) — PT Buya Barokah**  
> Status Dokumen: *Resmi, Terverifikasi Sumber Kode & Menggunakan Standar Visual Mermaid*  
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

```mermaid
sequenceDiagram
    autonumber
    actor Client as Browser / Telegram / Cron
    participant Proxy as Gateway Proxy (src/proxy.ts)
    participant Route as Route Handler (src/app/api/*/route.ts)
    participant DB as DB Client Wrapper (src/lib/db.ts)
    participant SQLite as SQLite 3 (WAL Mode)
    participant Trg as Database Triggers (src/lib/schema.ts)

    Client->>Proxy: HTTP Request (Cookie / Bearer)
    
    alt Rute Publik (PUBLIC_PATHS)
        Proxy->>Route: Lolos tanpa token
    else Ada Header CRON_SECRET
        Proxy->>Route: Lolos sebagai Internal Worker
    else Cookie sintak_session
        Proxy->>Proxy: Verifikasi JWT (jose HS256)
        alt Token Valid
            Proxy->>Route: Lolos ke Route Handler
        else Token Invalid / Expired
            Proxy-->>Client: 401 Unauthorized / Redirect /login
        end
    end

    Route->>DB: db.execute(sql, args) / db.batch()
    alt Operasi Tulis (INSERT / UPDATE / DELETE)
        DB->>SQLite: injectContext() -> INSERT INTO session_context (id=1, username, last_menu)
        DB->>SQLite: Eksekusi SQL Mutasi
        SQLite->>Trg: Pemicuan Trigger AFTER INSERT / UPDATE / DELETE
        Trg->>SQLite: Baca session_context (id=1) -> Tulis ke activity_logs
    else Operasi Baca (SELECT)
        DB->>SQLite: Eksekusi Query Langsung (Tanpa injectContext)
    end
    SQLite-->>DB: Query Results / Rows Data
    DB-->>Route: Formatted Data / Record
    Route-->>Client: HTTP Response JSON (200 OK)
```

### Rincian Komponen Otorisasi:
1. **Public Paths Whitelist (`src/proxy.ts:12-27`)**: Rute aset statis, webhook telegram, cron, dan login dikecualikan dari pengecekan sesi.
2. **Machine-to-Machine Secret (`src/proxy.ts:34-37`)**: Header `Authorization: Bearer ${CRON_SECRET}` mengizinkan cron job OS Linux mengeksekusi sinkronisasi dan maintenance harian tanpa token browser.
3. **User Session Verification (`src/proxy.ts:29-51`)**: Validasi token JWT terenkripsi dengan algoritma HS256 dari cookie `sintak_session`.

---

## 2. ARSITEKTUR DATABASE ENGINE (SQLITE WAL & MEMORY-MAPPED I/O)

SINTAK menggunakan SQLite lokal yang dioptimalkan untuk konkurensi tinggi dan *read throughput* maksimal menggunakan konfigurasi level PRAGMA.

```mermaid
graph TD
    subgraph AppProcess ["Aplikasi Next.js (Node.js Port 3000)"]
        W1["Thread Web UI (User Admin)"]
        W2["Thread API Route (Scraper Ingestion)"]
    end

    subgraph BotProcess ["Proses Terpisah (Telegram Bot Daemon)"]
        B1["Telegram Handler Worker"]
    end

    subgraph MemoryBuffer ["Buffer Memori Kernel OS & Cache"]
        CACHE["RAM Cache 64MB<br>(PRAGMA cache_size = -64000)"]
        MMAP["Memory-Mapped I/O 256MB<br>(PRAGMA mmap_size = 268435456)"]
    end

    subgraph LockQueue ["Single-Writer Concurrency Gate"]
        QUEUE["Write Lock Mutex<br>(PRAGMA busy_timeout = 5000ms)<br>Antre maks 5 detik sebelum SQLITE_BUSY"]
    end

    subgraph DiskStorage ["Penyimpanan Berkas Disk (NVMe SSD)"]
        DBFILE[("database.sqlite / database_dev.sqlite<br>(Data Utama)")]
        WALFILE[("database.sqlite-wal<br>(Write-Ahead Log Transaksi)")]
        SHMFILE[("database.sqlite-shm<br>(Shared Memory Index)")]
    end

    W1 -->|Read Query| MMAP
    W2 -->|Read Query| MMAP
    B1 -->|Read Query| MMAP
    MMAP --> CACHE
    CACHE --> DBFILE

    W1 -->|Write Query| QUEUE
    W2 -->|Batch Write| QUEUE
    B1 -->|Direct Write| QUEUE

    QUEUE -->|Append Changes| WALFILE
    WALFILE -.->|01:00 WIB Maintenance Checkpoint| DBFILE
```

### Konfigurasi PRAGMA Utama (`src/lib/schema.ts:9-13`):
* `PRAGMA journal_mode = WAL;`: Mengaktifkan *Write-Ahead Logging*. Pembacaan tidak pernah memblokir penulisan, dan penulisan tidak memblokir pembacaan.
* `PRAGMA mmap_size = 268435456;`: Memetakan 256 MB file database langsung ke virtual address space memori untuk *zero-copy read*.
* `PRAGMA cache_size = -64000;`: Menyediakan 64 MB RAM cache SQLite internal.
* `PRAGMA busy_timeout = 5000;`: Memberi batas toleransi antrean penulisan hingga 5.000 ms sebelum melempar error `SQLITE_BUSY`.

---

## 3. MEKANISME CONTEXT INJECTION & AUDIT TRAIL OTOMATIS

Untuk melacak siapa yang melakukan perubahan data tanpa menulis kode audit manual di setiap fungsi, sistem menggunakan kombinasi **DB Wrapper Interception** dan **SQLite Triggers**.

```mermaid
flowchart TD
    START(["Panggilan db.execute(sql) / db.batch()"]) --> CHECK{Apakah Query Mutasi?<br>INSERT / UPDATE / DELETE}
    
    CHECK -- Tidak (SELECT) --> EXEC_DIRECT["Langsung Eksekusi SQL<br>Tanpa Overhead Konteks"]
    
    CHECK -- Ya (Mutasi) --> INJECT["injectContext(menuContext)<br>Ambil username dari cookies()"]
    
    INJECT --> SAVE_CTX["Tulis ke Tabel Satu-Baris:<br>INSERT OR REPLACE INTO session_context<br>(id=1, username, last_menu) VALUES (1, ?, ?)"]
    
    SAVE_CTX --> RUN_SQL["Eksekusi SQL Mutasi Pengguna"]
    
    RUN_SQL --> CHK_EXCLUDE{Apakah Tabel Masuk<br>EXCLUDED_TABLES?}
    
    CHK_EXCLUDE -- Ya (orders, jurnal, dll) --> SKIP_TRG["Bypass Trigger Otomatis<br>(Mencegah DB Lock)"]
    SKIP_TRG --> MANUAL_LOG["Scraper memanggil logActivity()<br>agregat 1 baris setelah selesai"]
    
    CHK_EXCLUDE -- Tidak (users, roles, dll) --> FIRE_TRG["Trigger Database Berjalan:<br>trg_table_insert / update / delete"]
    
    FIRE_TRG --> READ_CTX["Sub-query:<br>(SELECT username FROM session_context WHERE id = 1)"]
    
    READ_CTX --> INSERT_AUDIT["INSERT INTO activity_logs<br>• action_type (INSERT/UPDATE/DELETE)<br>• before & after (JSON object snapshot)<br>• recorded_by (Username aktif)"]
    
    INSERT_AUDIT --> FINISH(["Selesai (200 OK)"])
    MANUAL_LOG --> FINISH
    EXEC_DIRECT --> FINISH
```

### Implementasi Teknis:
* **Context Interceptor (`src/lib/db.ts:98-134`)**: Mengekstrak user dari `getSession()` dan menyimpan ke `session_context WHERE id = 1`.
* **Triggers Template (`src/lib/schema.ts:1824-1863`)**: Otomatis membuat snapshot `before` dan `after` menggunakan fungsi native `json_object(...)`.
* **Exclusion List (`src/lib/schema.ts:1760-1770`)**: Tabel bervolume tinggi (`jurnal_umum`, `jurnal_harian_produksi`, `orders`, `bahan_baku`, `barang_jadi`, dll.) dikeluarkan dari trigger agar impor ribuan baris tidak menyebabkan *write amplification*.

---

## 4. PIPELINE INGESTION SCRAPER (DIGIT ERP)

Scraper bertugas menarik data transaksi dari sistem Digit secara periodik atau manual tanpa memicu deadlock pada sistem operasional harian.

```mermaid
flowchart TD
    TRIGGER(["Trigger Scraper<br>(Web UI / Cron)"]) --> AUTH_CHECK["Autentikasi Session Scraper<br>getScraperSession() via Memory Cache"]
    
    AUTH_CHECK --> DIGIT_REQ["HTTP POST Login ke Digit ERP<br>Headers: X-Bismillah-Api-Key<br>Origin: buyapercetakan.mdthoster.com"]
    
    DIGIT_REQ --> FETCH_DATA["HTTP GET Tarik Data Periode<br>Format: DD-MM-YYYY (Rentang Tanggal)"]
    
    FETCH_DATA --> PARSE["Parsing & Normalisasi Data<br>• Tanggal DD/MM/YYYY ke YYYY-MM-DD<br>• String sanitization<br>• Ekstraksi raw JSON payload"]
    
    PARSE --> DEDUP["Cek Faktur Duplikat<br>SELECT faktur FROM table WHERE faktur IN (...)"]
    
    DEDUP --> CHUNK["Bagi Mutasi Menjadi Chunks<br>chunkSize = 100 baris"]
    
    subgraph BatchLoop ["Batch Execution (db.batch)"]
        CHUNK --> UPSERT["INSERT INTO table (...)<br>ON CONFLICT(faktur) DO UPDATE SET ..."]
    end
    
    UPSERT --> SYNC_SOPD{"Tahun >= 2026 &<br>Ada Hubungan SOPd?"}
    SYNC_SOPD -- Ya --> UPSERT_SOPD["Upsert ke tabel sopd (no_sopd = faktur)"]
    SYNC_SOPD -- Tidak --> META_UPD
    UPSERT_SOPD --> META_UPD
    
    META_UPD["Update Metadata di system_settings<br>• last_scrape_table<br>• last_scraped_period"]
    
    META_UPD --> LOG_SUMMARY["logActivity()<br>Tulis 1 baris ringkasan audit log:<br>'Scraped N records, updated M'"]
    
    LOG_SUMMARY --> SUCCESS(["Kirim Response JSON 200 OK"])
```

### Poin Kritis Ingestion (`src/app/api/scrape-orders/route.ts:154-250`):
1. **Idempotensi `ON CONFLICT`**: Mencegah data ganda jika scraper dijalankan ulang pada rentang tanggal yang sama.
2. **Chunking 100 Baris**: Membatasi ukuran *write transaction* SQLite agar memori tidak melonjak dan tidak memblokir antrean tulis thread lain terlalu lama.
3. **Penyimpanan Metadata**: Status rentang tanggal terakhir yang sukses dicatat ke `system_settings` sehingga UI tahu data terupdate kapan.

---

## 5. INTEGRASI DATABASE LANGSUNG TELEGRAM BOT

Telegram Bot (`telegram-bot/`) tidak memanggil API Next.js melalui HTTP, melainkan terhubung langsung ke berkas database SQLite lokal.

```mermaid
flowchart TD
    OPERATOR(["Operator Mesin di Lantai Pabrik"]) -->|Kirim Pesan /input| TG_SERVER["Telegram Cloud Server (Bot API)"]
    
    TG_SERVER -->|Long-Polling / Webhook| BOT_DAEMON["Telegram Bot Daemon<br>(telegram-bot/src/bot.ts)"]
    
    BOT_DAEMON --> HANDLER["Handler Realisasi (input.ts)"]
    
    HANDLER --> V1{"1. Validasi Operator<br>telegram_users & employees"}
    V1 -- Tidak Terdaftar / Nonaktif --> REJECT_1["Balas: User belum diapprove"]
    
    V1 -- Valid --> V2{"2. Validasi Nomor Order<br>SELECT no_sopd FROM sopd"}
    V2 -- Order Tidak Ada --> REJECT_2["Balas: Nomor SOPd tidak ditemukan"]
    
    V2 -- Valid --> V3{"3. Validasi Pekerjaan<br>master_pekerjaan_jurnal_produksi"}
    V3 -- Pekerjaan Salah --> REJECT_3["Balas: Jenis pekerjaan tidak valid"]
    
    V3 -- Valid --> WRITE_DB["INSERT INTO jurnal_harian_produksi<br>(posisi, absensi, no_order, target, realisasi, rijek, kendala)"]
    
    WRITE_DB --> WRITE_AUDIT["INSERT INTO activity_logs<br>recorded_by: 'Nama Operator (via Telegram Bot)'"]
    
    WRITE_AUDIT --> REPLY_OK["Balas Pesan Sukses ke Operator<br>ID JHP, Nomor Order, dan Realisasi"]
```

### Keuntungan & Karakteristik Desain:
* **Zero HTTP Overhead**: Akses lokal langsung via `@libsql/client` (`telegram-bot/src/db.ts:14`) memberikan latensi simpan $< 5\text{ ms}$.
* **Audit Trail Mandiri**: Karena `jurnal_harian_produksi` tidak memakai database trigger otomatis, bot bertanggung jawab langsung menyisipkan baris audit di `activity_logs` (`telegram-bot/src/utils/api.ts:301-304`).

---

## 6. PIPELINE PENCARIAN DATA & FTS5 FALLBACK

Untuk menjaga kecepatan respons pencarian faktur dan nama barang di antara ratusan ribu baris data, sistem menggunakan virtual table **SQLite FTS5** dengan *graceful fallback*.

```mermaid
flowchart TD
    SEARCH_REQ(["Request API Search (?search=keyword)"]) --> BUILD_FTS["buildFtsQuery(search)<br>Sanitasi token FTS5 & wildcard"]
    
    BUILD_FTS --> RUN_FTS["Query Virtual Table FTS5:<br>SELECT o.* FROM orders o<br>JOIN orders_fts fts ON o.id = fts.rowid<br>WHERE orders_fts MATCH ?"]
    
    RUN_FTS --> COUNT_CHECK{"Apakah Hasil FTS > 0?"}
    
    COUNT_CHECK -- Ya (Ditemukan) --> RETURN_DATA["Kembalikan Data FTS<br>(Diurutkan Tanggal & Limit/Offset)"]
    
    COUNT_CHECK -- Tidak (0 Hasil) --> RUN_LIKE["Graceful Fallback ke LIKE:<br>SELECT * FROM orders WHERE<br>(faktur LIKE ? OR nama_prd LIKE ? OR raw_data LIKE ?)"]
    
    RUN_LIKE --> RETURN_LIKE["Kembalikan Data Hasil LIKE"]
    
    RETURN_DATA --> CLEAN["stripRawData()<br>Buang field internal mentah sebelum dikirim ke UI"]
    RETURN_LIKE --> CLEAN
    
    CLEAN --> RESP(["JSON Response 200 OK"])
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
