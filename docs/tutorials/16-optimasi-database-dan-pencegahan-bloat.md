# 16. Optimasi Database dan Pencegahan Bloat Log

Tutorial ini menjelaskan langkah-langkah untuk mengatasi masalah pembengkakan file database SQLite akibat log aktivitas yang berlebihan dan cara mencegahnya di masa depan.

## Masalah: Database Membengkak (Bloat)
Database `database_dev.sqlite` sempat mencapai ukuran **8GB+** meskipun data utamanya relatif sedikit. Penyebabnya adalah tabel `activity_logs` yang menyimpan jutaan baris log akibat *trigger* otomatis pada tabel-tabel dengan frekuensi perubahan data tinggi (seperti `jurnal_harian_produksi` saat proses sinkronisasi Excel).

## Langkah 1: Pembersihan Database (Maintenance)
Gunakan skrip Python `scripts/cleanup_db.py` untuk membersihkan log lama dan mengecilkan ukuran file fisik.

### Skrip Pembersihan (`scripts/cleanup_db.py`):
```python
import sqlite3
import os

db_path = "database_dev.sqlite"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Hapus log lama (sisakan 3 hari terakhir)
cursor.execute("DELETE FROM activity_logs WHERE created_at < date('now', '-3 days')")

# 2. Reclaim disk space
conn.execute("VACUUM")
conn.close()
```

## Langkah 2: Pencegahan Bloat (Optimasi Schema)
Untuk mencegah hal ini terulang, kita mengecualikan tabel-tabel dengan *churn* tinggi dari sistem audit otomatis per-baris.

### Perubahan pada `src/lib/schema.ts`:
Modifikasi fungsi `initDynamicTriggers` untuk menambahkan daftar tabel yang dikecualikan:

```typescript
// src/lib/schema.ts
const tablesResult = await db.execute(
  `SELECT name FROM sqlite_master 
   WHERE type='table' 
   AND name NOT LIKE 'sqlite_%' 
   AND name NOT LIKE '%_fts%' 
   AND name NOT IN (
     'activity_logs', 'session_context', 'sqlite_sequence', 'system_settings', 
     'db_indexing_status', 'faktur_sequences',
     'jurnal_harian_produksi', 'jurnal_umum', 'sopd', 'sopd_harga', 
     'bahan_baku', 'barang_jadi', 'sales_reports', 'sales_orders',
     'bill_of_materials', 'purchase_requests', 'purchase_orders', 
     'penerimaan_pembelian', 'rekap_pembelian_barang', 'pelunasan_hutang', 
     'pelunasan_piutang', 'pengiriman', 'spph_out', 'sph_in'
   )`
);
```

## Langkah 3: Menghapus Trigger yang Sudah Ada
Jika database sudah berjalan, *trigger* yang lama harus dihapus secara manual agar tidak terus menghasilkan log:

```sql
DROP TRIGGER IF EXISTS trg_jurnal_harian_produksi_insert;
DROP TRIGGER IF EXISTS trg_jurnal_harian_produksi_update;
DROP TRIGGER IF EXISTS trg_jurnal_harian_produksi_delete;
-- Lakukan hal yang sama untuk tabel lain yang dikecualikan
```

## Hasil Akhir
Setelah optimasi ini dilakukan, database yang tadinya **8.15 GB** berhasil menyusut menjadi **2.40 GB** (penghematan **~5.75 GB**) dan pertumbuhannya akan jauh lebih terkendali karena proses sinkronisasi Excel tidak lagi mencatat ribuan log per-baris.
