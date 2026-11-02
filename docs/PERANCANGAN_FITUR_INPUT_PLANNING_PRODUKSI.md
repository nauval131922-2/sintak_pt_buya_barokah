# Dokumen Perancangan Fitur Input Planning Rencana Produksi SINTAK

## 1. Latar Belakang & Analisis Sistem Excel Historis
Perancangan fitur ini mengacu langsung pada sistem kerja **41 file Excel Macro (`.xlsm`)** pada folder:
`E:\percetakan buya barokah\backup\a1\06__PRODUKSI\0604 JADWAL PRODUKSI\060401 RENCANA PRODUKSI\06040126 RENCANA PRODUKSI`

### A. Struktur File Excel
* **File Stasiun/Mesin Spesifik (40 File):**
  * `06040126_C01. PLAN SETTING.xlsm`
  * `06040126_B01. PLAN QUALITY CONTROL.xlsm`
  * `06040126_E01. PLAN CETAK SM 102.xlsm`, `Oliver 72E.xlsm`, dll.
  * `06040126_A01. PLAN POTONG QZ 104.xlsm` (Finishing Potong)
  * `06040126_F01` s/d `F14` untuk seluruh stasiun Finishing (Laminasi, UV, Hot Print, Lipat, Jahit, dsb.).
* **File Konsolidasi Master:**
  * `06040126_JADWAL TOTAL.xlsm` yang menggabungkan seluruh jadwal tahapan menjadi satu jadwal master produksi pabrik.

### B. Lembar Pendukung pada Setiap File
1. `Order Digit` & `03 SOPd`: Data master nomor SPK dan pesanan dari ERP Digit.
2. `DATA TARGET`: Standar kapasitas produksi per jam/hari tiap mesin.
3. `KALENDER LIBUR`: Daftar tanggal libur operasional (khususnya hari **Jumat** dan libur nasional).

---

## 2. Skema Basis Data SQLite

Telah ditambahkan 2 tabel inti pada `src/lib/schema.ts` dan dieksekusi ke database:

### A. Tabel `rencana_produksi` (Header Jadwal SPK)
```sql
CREATE TABLE IF NOT EXISTS rencana_produksi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  no_order TEXT UNIQUE NOT NULL,
  nama_order TEXT NOT NULL,
  qty_oplah INTEGER DEFAULT 0,
  satuan TEXT DEFAULT 'Eks',
  nama_pelanggan TEXT,
  tgl_order TEXT,
  tgl_deadline TEXT,
  tgl_mulai_rencana TEXT,
  tgl_selesai_rencana TEXT,
  status TEXT DEFAULT 'DRAFT', -- DRAFT, DISETUJUI, BERJALAN, SELESAI
  catatan TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rencana_produksi_no_order ON rencana_produksi(no_order);
CREATE INDEX IF NOT EXISTS idx_rencana_produksi_status ON rencana_produksi(status);
```

### B. Tabel `rencana_produksi_tahapan` (Detail Rencana Per Mesin/Tahapan)
```sql
CREATE TABLE IF NOT EXISTS rencana_produksi_tahapan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rencana_id INTEGER,
  no_order TEXT NOT NULL,
  urutan INTEGER DEFAULT 1,
  bagian TEXT NOT NULL,       -- Setting, Quality Control, Cetak, Finishing, Gudang
  mesin TEXT,                 -- SM 102, Oliver 72E, Potong QZ, Stall K66, dll.
  nama_tahap TEXT NOT NULL,   -- Cetak Isi, Setting Mockup, Lipat K66, dll.
  volume REAL DEFAULT 0,
  target_per_hari REAL DEFAULT 0,
  durasi_hari INTEGER DEFAULT 1,
  tgl_mulai_plan TEXT,
  tgl_selesai_plan TEXT,
  catatan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rencana_id) REFERENCES rencana_produksi(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_rencana_tahapan_no_order ON rencana_produksi_tahapan(no_order);
CREATE INDEX IF NOT EXISTS idx_rencana_tahapan_rencana_id ON rencana_produksi_tahapan(rencana_id);
```

---

## 3. Logika Bisnis & Penjadwalan Otomatis (Workday)

Diimplementasikan pada `src/lib/rencana-produksi-utils.ts`:

1. **Durasi Hari Kerja:**
   $$\text{Durasi (Hari)} = \max\left(1, \left\lceil \frac{\text{Volume}}{\text{Target Mesin per Hari}} \right\rceil\right)$$
2. **Penentuan Tanggal Selesai (`addWorkdays`):**
   * Mulai dari `tgl_mulai_plan`, penambahan hari melompati hari **Jumat** (`day === 5`) yang merupakan hari libur operasional resmi PT Buya Barokah.
   * Jika tanggal awal jatuh di hari libur, sistem otomatis menggeser awal pengerjaan ke hari kerja aktif berikutnya.

---

## 4. Spesifikasi API Endpoint (`src/app/api/rencana-produksi/route.ts`)

* **`GET /api/rencana-produksi?order=:no_order`**:
  Mengambil header rencana dan rincian tahapan mesin untuk pesanan tertentu.
* **`GET /api/rencana-produksi`**:
  Mengambil daftar master jadwal produksi. Setiap order kini menyertakan field `plan`:
  ```json
  {
    "id": 1,
    "start_date": "2026-11-05",
    "end_date": "2026-11-20",
    "status": "DISETUJUI"
  }
  ```
* **`POST /api/rencana-produksi`**:
  Menyimpan atau memperbarui (*upsert*) rencana produksi beserta seluruh tahapan mesinnya dalam satu transaksi.
* **`PUT /api/rencana-produksi`**:
  Memperbarui status rencana (*DRAFT*, *DISETUJUI*, *SELESAI*) atau mengubah rentang tanggal.
* **`DELETE /api/rencana-produksi?order=:no_order`**:
  Menghapus jadwal rencana produksi (otomatis *cascade* menghapus tahapan mesin terkait).
