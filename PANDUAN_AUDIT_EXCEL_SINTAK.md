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
3. **Keakuratan Pemetaan Cell Excel di Manual Pengguna (Wajib 100% Valid)**:
   - Setiap variabel di tab Master Parameter wajib memiliki pemetaan letak sheet dan alamat cell Excel yang benar dan terverifikasi nyata (contoh: `Master!D15`, `BUKU!AT6`, `Data_Buku!K4`).
   - Dilarang keras mencantumkan alamat cell fiktif, perkiraan, atau teks template lama yang belum dicocokkan dengan file Excel aslinya. Modal Manual Pengguna adalah jembatan audit antara staf estimator dan sistem web Sintak.

---

## 1.1 Rem Prosedural: 4 Pos Pemeriksaan Bertahap (Anti Asal Jalan & Cepat Selesai)
Pengerjaan audit **DILARANG KERAS** dilakukan secara borongan atau terburu-buru. Wajib melewati 4 pos pemeriksaan bertahap:
1. **Pos 1 (Bedah Cell)**: Buka file Excel via script/parser, kutip rumus formula aslinya (`BUKU!xxx = ...`). Jangan tulis kode sebelum rumus cell dipaparkan.
2. **Pos 2 (Direct Binding 1:1)**: Tulis kode kalkulator murni 1:1 terhubung ke `params.xxx` lengkap dengan komentar alamat cell Excel. DILARANG membuat *conditional hijacking* (seperti `isOplahBesar ? sm : oliver`).
3. **Pos 3 (Terminal Benchmark & Reaktivitas)**:
   - Jalankan benchmark seluruh tier oplah dan seluruh permutasi dropdown mesin di terminal.
   - Wajib menyertakan **Uji Reaktivitas Parameter** (mengubah nilai input form A ke B membuktikan $\Delta\text{HPP} > 0$).
4. **Pos 4 (Commit & Lapor)**: Lakukan commit lokal di terminal segera setelah berkas selesai diubah, pastikan `working tree clean`, lalu baru laporkan ke pengguna dengan bukti log terminal.

## 1.2 Aturan Stop & Tanya (Inkonsistensi Antar-File)
Jika ditemukan perbedaan angka master antar-file sejenis (misal file oplah kecil insheet 30/desain 2.500, sedangkan oplah besar insheet 300/desain 0):
- **DILARANG MEMBUAT RUMUS KOMPROMI SENDIRI** atau mematikan/membajak variabel di kode backend.
- **WAJIB BERHENTI** dan paparkan perbedaannya kepada pengguna untuk konfirmasi nilai default yang dikehendaki.

## 1.3 Ketentuan Sumber Folder Master Excel (Baku & Permanen)
- **HANYA Buku Manasik** yang mengambil sumber dari folder **Master Harga**:
  `E:\percetakan buya barokah\backup\a1\02__PEMASARAN\0202_KALKULASI HARGA\020201 MASTER HARGA\02020107 BUKU, KITAB, MAJALAH\`
- **Seluruh Produk Lainnya** (Buku Yasin, Nota, Brosur, Label KHQ, Buku Tulis, Stopmap, Syahadah, Kalender, Amplop, Kop Surat, Raport, dst.):
  Wajib mengambil sumber dari folder rilis **Pricelist Juli 2026**:
  `E:\percetakan buya barokah\backup\a1\02__PEMASARAN\0203_SURAT PENAWARAN HARGA (SPH) out\020326 2026 SURAT PENAWARAN HARGA (SPH) out\Pricelist Juli 2026\`

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

### Tahap 3: Audit Data Validation List, Pilihan Mesin Cetak & Catatan Sel
1. **Inspeksi Aturan Data Validation & Dropdown Mesin Cetak (WAJIB)**:
   - Ekstrak seluruh sel yang memiliki validasi (`list`, `wholeNumber`, `decimal`).
   - **Pilihan Mesin Cetak (Cover & Isi) di Sheet Master**: Periksa sel dropdown penentu mesin cetak (contoh: `Master!D16` Cetak Cover & `Master!D25` Cetak Isi). Seluruh opsi mesin cetak di Excel (POD Print Inter, Ryobi, Oliver, Heidelberg Speedmaster SM 102, dll) **WAJIB TERSEDIA DINAMIS** di form simulator Sintak:
     - Sediakan opsi **⚙️ Otomatis** (default rekomendasi cerdas yang memilih mesin paling efisien sesuai jenjang oplah Excel).
     - Sediakan tombol pilihan mesin eksplisit agar estimator bebas mengubah mesin cetak secara manual kapan saja.
   - Jadikan daftar dropdown Excel lainnya sebagai acuan opsi form simulator di Sintak (dropdown ukuran, varian isi/halaman, jenis laminasi, dsb.).
2. **Audit Variasi Antar-File Sejenis (Perbedaan Skala Oplah)**:
   - Jika suatu produk memiliki beberapa file Excel master (misal file rentang 50–500 pcs, 600–2.500 pcs, 3.000–10.000 pcs), **WAJIB MEMERIKSA PERBEDAAN MESIN CETAK & FORMULA ANTAR-FILE**.
   - **DILARANG KERAS MENGUNCI 1 MESIN SAJA**: Jangan berasumsi produk hanya dicetak di 1 mesin (misal hanya digital POD). Kalkulator backend wajib mendukung transisi mesin sesuai skala oplah dan mendukung *override* pilihan mesin manual dari pengguna.
3. **Inspeksi Cell Comments (`<comment>`)**:
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

### Tahap 5: Sinkronisasi Arsitektur Sintak & Evaluasi Desain UI (Langsung Ubah Tanpa Konfirmasi)
1. **Interface Parameter (`src/lib/[produk]-calculator.ts`)**:
   - Daftarkan semua variabel ke interface `[Produk]MasterParams`.
   - Pasang nilai acuan Excel ke `DEFAULT_[PRODUK]_PARAMS`.
2. **Kalkulator Murni**:
   - Pastikan fungsi perhitungan membaca `params.xxx`. Tidak boleh ada angka tarif, insheet, atau ongkos yang ditulis mati di dalam kalkulator.
3. **Keputusan Desain Master Parameter (Langsung Eksekusi Tanpa Konfirmasi)**:
   - Evaluasi apakah produk bertipe **homogen** (cukup 1 tampilan terpadu global seperti Nota) atau memiliki **varian fisik/lini manufaktur berbeda** (dikelompokkan per jenis/sub-komponen seperti Yasin Softcover vs Hardcover, atau Manasik Cocard vs Buku).
   - Terapkan struktur kartu/grup yang paling efisien, **langsung eksekusi pada kode tanpa perlu konfirmasi**.
4. **Desain, Perilaku Scroll & Pembaruan Isi Tab Kalkulasi (Simulator) — Langsung Ubah Tanpa Konfirmasi**:
   - **Perilaku Scroll Standar Buku Manasik**: Tab Simulator **WAJIB** mengadopsi struktur dual scroll independen:
     - Outer container: `flex flex-col flex-1 h-[calc(100vh-140px)] min-h-0 space-y-3 pb-2`
     - Grid: `grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 min-h-0 pb-1`
     - Kolom Kiri (Input Form): `lg:col-span-5 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4`
     - Kolom Kanan (Breakdown & Hasil): `lg:col-span-7 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4`
     - Dilarang keras membiarkan simulator terpotong tanpa scrollbar atau terjebak dalam `overflow-hidden`.
   - **Pembaruan Isi Form & Fitur di Tab Kalkulasi (Langsung Ubah)**:
     - Evaluasi apakah seluruh opsi spesifikasi di Excel (dropdown ukuran, variasi gramatur kertas, pilihan mesin cetak, opsi finishing opsional seperti porporasi, nomorator, laminasi, kardus) sudah ada di form input simulator.
     - Evaluasi apakah tabel rincian (breakdown) biaya HPP dan kartu ringkasan harga jual sudah transparan dan lengkap mencerminkan seluruh komponen biaya di Excel.
     - **Jika ada opsi input atau isi kalkulasi yang perlu diperbarui/ditambahkan, WAJIB LANGSUNG UBAH PADA KODE TANPA PERLU KONFIRMASI**.

### Tahap 6: Uji Komparasi Parity Otomatis (Full Matrix Benchmark)
Buat skrip pengujian (via Node / TSX) untuk membandingkan kalkulasi Excel vs Sintak baris per baris:
1. Jalankan simulator Sintak untuk setiap tier oplah yang ada di Excel.
2. Cocokkan:
   - Komponen Biaya Cetak Cover & Isi
   - Komponen Biaya Finishing & Jilid
   - Total HPP (Kolom Total HPP Excel vs `summary.totalHpp` Sintak)
   - Harga Jual Final Bulat (Kolom Harga Jual Excel vs `summary.hargaJualPerPcs` Sintak)
3. **Kriteria Kelulusan**: Selisih wajib **Rp 0** di seluruh tier oplah standar.

### Tahap 7: Uji Stres Permutasi Dropdown Dinamis (Wajib - Dilarang Snapshot Statis Saja)
1. **Dilarang Keras Hanya Menguji Kondisi File yang Tersimpan (Snapshot Disk)**:
   - File Excel sering kali disimpan dalam 1 kondisi dropdown aktif tertentu (contoh: `Master!D25` tersimpan `SM`).
   - Audit dianggap **TIDAK SAH & GAGAL** jika hanya menguji kondisi statis tersebut.
2. **Uji Permutasi Seluruh Opsi Dropdown Mesin & Finishing (Dynamic Matrix)**:
   - Skrip benchmark **WAJIB** mengeksekusi perhitungan untuk SEMUA kemungkinan pilihan dropdown mesin cetak Cover (POD, Oliver, SM) dan Isi (Ryobi, Oliver, SM) yang diizinkan pada tier tersebut.
   - Uji opsi finishing aktif vs non-aktif (Laminasi Glossy vs Doff vs Tanpa, Sisir vs Tanpa).
   - Tampilkan log terminal untuk setiap permutasi mesin dengan bukti `PASSED (0 selisih)`.
3. **Anti-Magic Number & Komentar Alamat Cell Wajib**:
   - Di file kalkulator (`*-calculator.ts`), setiap rumus komponen **WAJIB** menyertakan komentar alamat cell Excel asli (`// BUKU!BK7: ... = BK2`).
   - Dilarang keras menebak angka pengali (misal mengalikan 2 jika di cell Excel tertulis 1, atau menebak dimensi bentangan jika di rumus Excel menggunakan sel lain).
4. **Parameter Spesifik Skala Oplah (Cross-Tier Parameter Drift)**:
   - Jika file oplah kecil (≤500) dan oplah besar (≥3.000) memiliki nilai acuan master berbeda (misal setting desain gratis pada oplah besar atau insheet waste berbeda), kalkulator dan simulator wajib memperlakukan parameter tersebut sesuai tier oplahnya atau mendokumentasikannya secara presisi.
5. **Uji Reaktivitas Parameter Wajib (Anti-Conditional Hijacking)**:
   - Skrip benchmark **WAJIB** menyertakan pengujian reaktivitas (*sensitivity test*) untuk parameter input form.
   - Uji dengan membandingkan hasil saat parameter diubah (misal insheet 100 vs 300, tarif desain 0 vs 2.500, markup 0% vs 5%).
   - Skrip **WAJIB meng-assert bahwa perubahan nilai input menghasilkan perubahan biaya nyata (`deltaHpp > 0`)**. Jika nilai parameter diubah tetapi hasil kalkulasi tetap sama (`delta === 0`), audit dinyatakan **GAGAL TOTAL (terindikasi hardcode/variabel dibajak)**.

### Tahap 8: Audit & Sinkronisasi Dokumentasi (Manual Pengguna & Panduan Simulator)
Setiap kali ada audit atau perubahan parameter/rumus, **WAJIB** mengaudit dan memperbarui modal petunjuk di kedua komponen:
1. **Manual Pengguna di Tab Master Parameter (`*MasterParameter.tsx`)**:
   - **Pemetaan Cell Wajib 100% Akurat**: Cantumkan letak sheet dan cell referensi Excel (`Master!Dxx`, `BUKU!Xxx`) yang tepat untuk setiap variabel tarif, bahan, dan jasa.
   - Jelaskan formula acuan (misal: turunan UMR harian `(UMR / 25 / target)`, pembagian luas plano, rasio insheet).
2. **Panduan Penggunaan di Tab Kalkulasi / Simulator (`*Simulator.tsx`)**:
   - Panduan langkah pemilihan spesifikasi produk (ukuran, gramatur, metode cetak, opsi finishing).
   - Penjelasan struktur rincian breakdown biaya HPP, strategi margin/nego diskon, dan tips penawaran sales.
3. **Langsung Update**: Jika ada perbedaan letak cell, teks formula lama, atau variabel baru, **langsung update teks modal panduan tanpa perlu konfirmasi**.

---

## 4. Checklist Ringkas Audit

| No | Checklist Audit | Status |
| :---: | :--- | :---: |
| 1 | 4 Lapisan sheet (Input, Database, Engine, Output) sudah dipetakan | [ ] |
| 2 | Semua sel manual non-rumus sudah diekstrak ke `MasterParams` | [ ] |
| 3 | Semua aturan Data Validation List sudah tersedia di form simulator | [ ] |
| 4 | Pilihan mesin cetak Cover & Isi dari sel Master Excel sudah tersedia dinamis di form Simulator (Otomatis + Pilihan Mesin Eksplisit) | [ ] |
| 5 | Variasi mesin & formula antar-file sejenis (skala oplah kecil, sedang, besar) sudah didukung penuh di kalkulator | [ ] |
| 6 | Catatan tersembunyi (*cell comments*) sudah diperiksa | [ ] |
| 7 | *Magic numbers* (insheet, kapasitas lembar, pembulatan) sudah teridentifikasi | [ ] |
| 8 | Formula Excel sudah dicek bebas dari salah drag / typo antar-baris | [ ] |
| 9 | UI Master Parameter sudah memunculkan semua variabel dinamis (per jenis atau global) | [ ] |
| 10 | Tab Kalkulasi/Simulator sudah menerapkan dual scroll independen standar Manasik | [ ] |
| 11 | Isi opsi form input spesifikasi & breakdown biaya di Tab Kalkulasi sudah lengkap sesuai Excel | [ ] |
| 12 | Benchmark otomatis seluruh tier oplah menghasilkan selisih Rp 0 | [ ] |
| 13 | Uji stres perubahan parameter dinamis menghasilkan angka yang identik | [ ] |
| 14 | Uji reaktivitas parameter membuktikan semua input form berdampak nyata pada kalkulasi (tidak ada variabel mati / conditional hijacking) | [ ] |
| 15 | Pemetaan cell Excel pada Manual Pengguna di Tab Master Parameter akurat 100% | [ ] |
| 16 | Panduan Penggunaan di Tab Kalkulasi sudah sinkron dengan fitur simulator | [ ] |
