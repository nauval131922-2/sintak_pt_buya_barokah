# SOP & Panduan Standar Audit Excel Pricelist vs SINTAK
> **Standar Operasional Prosedur (SOP) Universal** untuk mengaudit, membongkar logika, mendeteksi cacat rumus, dan menyelaraskan kalkulasi file Excel pricelist percetakan ke sistem web SINTAK (Buku Yasin, Kalender, Brosur, Nota, Box/Packaging, Label, dll).

---

## 1. Prinsip Utama (Prinsip Anti-Hardcode)
> **"Apapun yang di Excel berstatus manual (non-rumus/angka ketik), di SINTAK DILARANG KERAS di-hardcode."**

1. **Sel Manual Excel = Variabel Dinamis SINTAK**:
   - Jika suatu nilai di Excel tidak berawalan tanda sama dengan (`=`), nilai tersebut adalah variabel bisnis (biaya bahan, tarif mesin, ongkos jilid, insheet waste, margin).
   - Nilai tersebut wajib masuk ke interface `*MasterParams` dan memiliki kontrol input di UI `*MasterParameter.tsx`.
2. **Koreksi Human Error Excel**:
   - Rumus Excel buatan manusia sering memiliki salah drag sel / typo baris tetangga. SINTAK mengadopsi logika teknis fisik cetak yang benar, bukan mereplikasi bug manusia di Excel.

---

## 2. Pemetaan 4 Lapisan Arsitektur Excel Percetakan
Setiap workbook kalkulasi percetakan wajib dipetakan ke dalam 4 lapisan:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INPUT LAYER (Sheet Master / Form Order)                  │
│    - Spesifikasi: Ukuran, Oplah, Bahan, Varian, Margin      │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Lookup / Referensi)
┌──────────────────────────────▼──────────────────────────────┐
│ 2. DATABASE LAYER (Sheet Data / Tabel Bahan)                │
│    - Harga Plano Kertas, Tarif Mesin, Biaya Kitab Kosongan  │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Kalkulasi per Tier)
┌──────────────────────────────▼──────────────────────────────┐
│ 3. ENGINE LAYER (Sheet Kalkulasi Biaya / Sheet Jilid/Buku)  │
│    - Rincian Biaya per Oplah: Bahan, Cetak, Finishing, Pack │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Pembulatan & Ringkasan)
┌──────────────────────────────▼──────────────────────────────┐
│ 4. OUTPUT LAYER (Sheet Matriks Pricelist Final)             │
│    - Tabel Harga Jual Akhir siap tayang ke Sales/Customer   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Tujuh (7) Tahapan Standar Audit

### Tahap 1: Discovery & Pemetaan Relasi Workbook
1. Buka file Excel dan catat nama semua worksheet.
2. Identifikasi peran masing-masing sheet sesuai 4 lapisan di atas.
3. Periksa **Dynamic Named Range** (`Ctrl + F3` di Excel atau inspeksi XML `workbook.xml`):
   - Catat range seperti `Oplah`, `Penerbit`, `Bahan`, `Harga_Final` yang menjadi jembatan antar-sheet melalui formula `VLOOKUP`, `INDEX-MATCH`, atau `INDIRECT`.

### Tahap 2: Ekstraksi Data Manual (Audit Non-Rumus)
1. Filter sel tanpa formula (`!cell.f`):
   - Kumpulkan semua angka statis: tarif print per plano/A3+, insheet lembar cadangan, ongkos jilid (sisip, staples, lem, jahit, casing-in), biaya aksesoris, harga kemasan plastik/dus.
2. Buat daftar parameter yang akan dibuatkan ke interface TypeScript (`*MasterParams`).

### Tahap 3: Audit Data Validation List & Catatan Sel (Comments)
1. **Inspeksi Aturan Data Validation**:
   - Ekstrak seluruh sel yang memiliki validasi (`list`, `wholeNumber`, `decimal`).
   - Jadikan daftar dropdown Excel sebagai acuan opsi form simulator di Sintak (dropdown ukuran, varian isi, jenis laminasi, dsb.).
2. **Inspeksi Cell Comments (`<comment>`)**:
   - Periksa segitiga merah pada pojok sel. Catatan estimator sering menyimpan biaya tersembunyi (contoh temuan: `BUKU!AX6` mencatat *"jika tambah pembatas : 275/pcs"*).

### Tahap 4: Reverse Engineering Logika Rumus & Deteksi Bug Excel
1. **Bongkar *Magic Numbers* (Konstanta Tersembunyi)**:
   - **Kapasitas Lembar**: Mengapa dibagi 2, 4, atau 8? (Karena 1 lembar A3+/plano muat $N$ lembar produk).
   - **Insheet Waste**: Mengapa ditambah 5 atau 10? (Cadangan insheet mesin).
   - **Formula Upah / UMR**: Apakah jasa berbasis target harian `(UMR / 25 / target_harian)`?
   - **Batas Minimum Order**: Apakah ada fungsi `MAX(50000, luas * tarif)`?
   - **Pembulatan Harga**: Cek digit pembulatan akhir `ROUNDUP(..., -1)` (puluhan) atau `ROUNDUP(..., -2)` (ratusan).
2. **Audit Konsistensi Baris (Human Error Detection)**:
   - Bandingkan rumus baris demi baris dari oplah terendah sampai tertinggi.
   - *Waspadai anomali*: Salah ketik sel baris sebelumnya (misal kasus Oplah 1000 sel `U24` tertulis `=T24+S23` alih-alih `=T24+S24`, rugi Rp 100.000).

### Tahap 5: Sinkronisasi Arsitektur Sintak (Anti-Hardcode)
1. **Interface Parameter (`src/lib/[produk]-calculator.ts`)**:
   - Daftarkan semua variabel ke interface `[Produk]MasterParams`.
   - Pasang nilai acuan Excel ke `DEFAULT_[PRODUK]_PARAMS`.
2. **Kalkulator Murni**:
   - Pastikan fungsi perhitungan membaca `params.xxx`. Tidak boleh ada angka tarif, insheet, atau ongkos yang ditulis mati di dalam kalkulator.
3. **Komponen UI (`src/app/pricelist/[Produk]MasterParameter.tsx`)**:
   - Buat kelompok field input yang rapi (Bahan, Cetak, Finishing, Aksesoris, Laminasi).
   - Lengkapi dengan format Rupiah/desimal (`allowDecimals`), tombol reset ke default per-field, dan tombol *Reset All*.
   - Pasang deteksi perubahan `isModified` untuk memberi tahu user saat ada angka yang diubah dari standar master.

### Tahap 6: Uji Komparasi Parity Otomatis (Full Matrix Benchmark)
Buat skrip pengujian (via Node / TSX) untuk membandingkan kalkulasi Excel vs Sintak baris per baris:
1. Jalankan simulator Sintak untuk setiap tier oplah yang ada di Excel.
2. Cocokkan:
   - Komponen Biaya Cetak Cover & Isi
   - Komponen Biaya Finishing & Jilid
   - Total HPP (Kolom Total HPP Excel vs `summary.totalHpp` Sintak)
   - Harga Jual Final Bulat (Kolom Harga Jual Excel vs `summary.hargaJualPerPcs` Sintak)
3. **Kriteria Kelulusan**: Selisih wajib **Rp 0** di seluruh tier oplah standar.

### Tahap 7: Uji Stres & Modifikasi Dinamis (Stress Test)
1. **Ubah Dropdown Validasi**: Ganti ukuran cetak, ganti varian isi/halaman, ganti mode laminasi (Glossy vs Doff vs Tanpa).
2. **Ubah Nilai Manual Secara Ekstrem**: Ubah tarif cetak, insheet waste, biaya perakitan, dan margin profit di Master Parameter.
3. Rekalkulasi formula Excel vs Sintak dengan angka baru tersebut. Jika hasil keduanya **tetap identik**, integrasi dinyatakan **100% Selesai & Terverifikasi**.

---

## 4. Checklist Ringkas Audit

| No | Checklist Audit | Status |
| :---: | :--- | :---: |
| 1 | 4 Lapisan sheet (Input, Database, Engine, Output) sudah dipetakan | [ ] |
| 2 | Semua sel manual non-rumus sudah diekstrak ke `MasterParams` | [ ] |
| 3 | Semua aturan Data Validation List sudah tersedia di form simulator | [ ] |
| 4 | Catatan tersembunyi (*cell comments*) sudah diperiksa | [ ] |
| 5 | *Magic numbers* (insheet, kapasitas lembar, pembulatan) sudah teridentifikasi | [ ] |
| 6 | Formula Excel sudah dicek bebas dari salah drag / typo antar-baris | [ ] |
| 7 | UI Master Parameter sudah memunculkan semua variabel dinamis | [ ] |
| 8 | Benchmark otomatis seluruh tier oplah menghasilkan selisih Rp 0 | [ ] |
| 9 | Uji stres perubahan parameter dinamis menghasilkan angka yang identik | [ ] |
