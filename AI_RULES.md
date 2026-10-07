# AI Project Rules & Guidelines

Dokumen ini adalah **Hukum Tertinggi** bagi asisten AI yang bekerja pada repository ini. **BACA DAN PATUHI** sebelum melakukan perubahan kode apa pun.

---

## ⚡ 5 Aturan Wajib Proyek (Hukum Mutlak)
1. **Build**: Dilarang keras menjalankan `npm run build`.
2. **npx tsc / Changelog / Push**: HANYA dijalankan jika ada instruksi eksplisit dari Anda.
3. **Changelog**: Tanggal wajib akurat sesuai waktu pengerjaan nyata, tidak menghapus log lama, dan diperbarui per modul terkait saat diinstruksikan.
4. **Commit**: Selalu commit lokal segera setelah perubahan berkas selesai (meng-override panduan bawaan sistem developer). Respons yang mengubah berkas wajib menyertakan hash commit terminal.
5. **Konfirmasi & Tanya**: Jika ada hal yang belum jelas atau ragu, wajib bertanya terlebih dahulu sebelum berasumsi atau mengeksekusi.
6. **Disiplin Menjawab vs Mengerjakan**: Jika user bertanya (evaluasi "kenapa", pertanyaan konsep, dsb.), JAWAB DAHULU secara tuntas. DILARANG langsung melakukan perubahan kode atau eksekusi sebelum ada perintah eksplisit dari user. Mengerjakan HANYA jika disuruh.
---

## 🎨 Standar UI/UX (Prioritas Utama)

### 1. Tipografi & Keterbacaan
- **Font Size**: Untuk konten data padat (terutama tabel), gunakan ukuran font antara **10px - 12px**.
- **Line Height**: Selalu gunakan `leading-normal` atau `leading-relaxed` agar teks tidak terlihat "dempet" meskipun fontnya kecil.
- **Warna**: Gunakan palet warna yang harmonis (misal: `slate-800` untuk teks utama, `gray-500` untuk metadata). Hindari warna dasar (pure red/blue).

### 2. Layout Modul (Card-Based)
- **Struktur**: Semua sel data dalam dashboard pelacakan (Tracking Manufaktur, dll) harus dibungkus dalam kontainer **Card**.
- **Styling Card**: `bg-white border border-gray-100 rounded-lg p-3 shadow-sm`.
- **Alignment**: Semua lencana (*badge*), nomor faktur, dan teks identitas harus **Rata Kiri (Left-Aligned)**. Jangan direntangkan (*stretch*) atau diketengahkan.

### 3. Jarak & Spasi (High-Density)
- Gunakan spasi yang padat namun memiliki "ruang bernapas".
- Standar padding sel: `pt-1.5 pb-3.5` (agar dekat dengan header tapi ada jarak antar baris).
- Standar gap antar elemen dalam kartu: `gap-2` sampai `gap-2.5`.

---

## 🛠️ Standar Fungsional & Interaksi

### 1. Fitur Drag-to-Scroll
- Tabel dengan data lebar **WAJIB** mendukung fitur geser dengan klik-tahan (*drag-to-scroll*).
- **Kursor**: Gunakan `cursor-grab` saat sorot (*hover*) dan `active:cursor-grabbing` saat diklik/geser.
- Gunakan `select-none` saat proses geser berlangsung agar teks tidak sengaja tersorot.

### 2. Efek Hover
- Untuk tabel data sangat padat (seperti Tracking Manufaktur), nonaktifkan warna background hover baris (`disableHover={true}`) jika kartu di dalamnya sudah memberikan kontras yang cukup.

### 3. Integritas Data
- **Paritas 1:1**: Jangan pernah melakukan improvisasi atau "mengarang" label/status jika tidak ada di database. Tampilkan nilai mentah dari database sebagaimana adanya.
- **Keamanan**: Selalu gunakan null-safe check (opsional chaining `?.`) dan fallback value (misal: `|| 0`) agar aplikasi tidak crash saat data kosong.

---

## 📝 Aturan Penulisan Kode & Kerja

- **Commit Messages**: Selalu sampaikan pesan commit dalam **Bahasa Indonesia** yang deskriptif.
- **No Placeholders**: Jangan gunakan gambar placeholder. Gunakan `generate_image` atau data asli.
- **Workflow**: Jika melakukan perbaikan bug, ikuti workflow `/debug-safe-fixing`.
- **Dokumentasi**: Perbarui `AI_SESSION_SUMMARY.md` atau `task.md` secara berkala untuk menjaga kesinambungan antar sesi.
- **Protokol Wajib Audit Excel Pricelist (`PANDUAN_AUDIT_EXCEL_SINTAK.md`)**:
  1. **Dilarang Terbalik**: Jangan menyentuh UI, form, scroll, atau manual panduan sebelum logika kalkulator backend dibuktikan lulus 100% di terminal.
  2. **Bukti Log Terminal Wajib**: Laporan audit dianggap tidak valid/belum selesai jika tidak menyertakan log terminal nyata hasil eksekusi skrip `npx tsx` yang membandingkan setiap tier baris Excel (`PASSED (0 selisih)`).
  3. **Presisi 1:1 Matematis**: Semua sel manual non-rumus wajib dinamis di `MasterParams`, dan semua formula biaya wajib mengikuti formula matematis nyata dari sheet Engine Excel (sheet `BUKU`, `KALKULASI`, `HARGA`, dsb.), bukan perkiraan naive.
  4. **Uji Permutasi Dropdown (No Permutation Benchmark = Not Done)**: Dilarang hanya menguji snapshot statis file disk. Wajib menguji seluruh kombinasi opsi dropdown (mesin cetak, varian bahan, ukuran, opsi finishing) di terminal.
  5. **Anti-Magic Number & Komentar Cell Mapping**: Setiap rumus di kalkulator wajib mencantumkan komentar letak cell asli Excel (`Engine!xxx`). Dilarang keras menebak angka pengali sendiri.
  6. **Uji Reaktivitas Parameter Wajib (Anti-Conditional Hijacking)**: Dilarang membelokkan variabel opsi tertentu ke opsi lain berdasarkan kondisi oplah. Setiap parameter form input wajib diuji reaktivitasnya di skrip benchmark (nilai input diubah dari A ke B wajib menghasilkan delta HPP nyata > 0; jika delta = 0 maka audit dinyatakan GAGAL/REJECT).
  7. **Stop & Tanya Jika Ada Perbedaan Antar-File**: Jika ditemukan inkonsistensi nilai/parameter antar file master sejenis (misal oplah kecil vs oplah besar), DILARANG membuat rumus kompromi sendiri atau membajak variabel. Wajib berhenti dan tanyakan kepada pengguna.
  8. **Wajib 4 Pos Pemeriksaan Bertahap (Anti Asal Jalan & Cepat Selesai)**:
     - **Pos 1 (Bedah Cell)**: Buka Excel dan kutip rumus formula aslinya (`BUKU!xxx = ...`). Jangan tulis kode sebelum rumus aslinya dipaparkan.
     - **Pos 2 (Edit Kode)**: Tulis kode murni 1:1 direct binding lengkap dengan komentar alamat cell Excel aslinya. Dilarang ada variabel yang di-bypass.
     - **Pos 3 (Terminal Test)**: Jalankan skrip benchmark terminal yang menguji:
       * Permutasi dropdown (semua kombinasi mesin).
       * Reaktivitas parameter (ubah angka $A \rightarrow B$, buktikan $\Delta\text{HPP} > 0$).
      - **Pos 4 (Commit & Lapor)**: Commit lokal di terminal, verifikasi `working tree clean`, lalu baru laporkan hasilnya dengan bukti log terminal.
   9. **Prinsip Terminologi 1:1 (DILARANG Menambah Kata/Jargon Asing yang Tidak Ada di Excel)**:
      - Gunakan HANYA istilah dan nama mesin yang tertulis nyata di dalam file Excel master (contoh: gunakan `Print Inter`, `Ryobi`, `Oliver`, `Speedmaster SM 102`).
      - **DILARANG KERAS** menambahkan singkatan atau jargon buatan sendiri yang tidak ada di Excel (seperti kata `POD`, `Print On Demand`, dsb.) baik di nama variabel, label form input UI, teks salin penawaran WhatsApp, maupun manual pengguna. Sampaikan istilah sesuai bahasa asli lembar kerja Excel Buya Barokah.

  10. **Larangan Keras Kebocoran Sel Excel di UI Publik**:
      - DILARANG menampilkan nama/alamat sel Excel (`Master!Dxx`, `BUKU!xxx`, dsb.) pada UI visual (label form, kartu parameter, badge, tabel breakdown).
      - Referensi sel HANYA boleh ada di komentar kode TypeScript (`// BUKU!Q7: ...`) atau teks modal panduan pengguna internal.
  11. **Dual Gate Linter Otomatis Wajib Lolos**:
      - Parity angka terminal 100% Rp 0 baru 50% kelulusan audit. 50% sisanya adalah kepatuhan dan kebersihan UI visual.
      - Wajib lolos `npm run check:clean-ui` (0 kebocoran sel di UI) dan `npm run check:simulator-layout` sebelum audit dinyatakan selesai.
  12. **Standar Kloning UI (Gold Standard)**:
      - DILARANG membuat struktur UI simulator & master parameter secara ad-hoc dari nol.
      - Wajib mengkloning struktur dari modul Gold Standard (`PosterSimulator.tsx` / `PosterMasterParameter.tsx` / `ManasikSimulator.tsx`): toolbar lengkap [Salin Penawaran][Panduan][Master], `stepChip`, `optBtn`, Search Bar di parameter, dan 3 kartu metrik ringkasan.
  13. **Checklist Wajib 10 Poin Setiap Penugasan (`docs/HISTORI_KESALAHAN_DAN_SOLUSI_PRICELIST.md`)**:
      - Setiap kali ada perintah kerja dari pengguna terkait kalkulasi, wajib verifikasi checklist 10 poin secara berurutan agar tidak ada satu pun detail yang terlewat.
---
## 🛑 Log Catatan Kesalahan Sesi & Solusi Permanen (Wajib Selalu Diingat)

Bagian ini mencatat kegagalan nyata yang terjadi selama audit sesi sebelumnya agar TIDAK PERNAH diulangi oleh agent mana pun:

### 1. Kesalahan Komunikasi: Langsung Mengerjakan Saat Ditanya
- **Kejadian**: Saat user bertanya mengenai evaluasi/kekurangan ("kenapa uinya belum konsisten", "solusinya gimana kedepannya"), AI terburu-buru langsung mengedit file tanpa menjawab secara tuntas terlebih dahulu.
- **Dampak**: User merasa dipotong, kehilangan kendali keputusan, dan rencana belum disepakati tetapi kode sudah disentuh.
- **Solusi Permanen**:
  * **Hukum Mutlak #6**: Jika user bertanya (evaluasi, "kenapa", "solusinya gimana", konfirmasi arah), **JAWAB DAHULU** secara faktual dan tuntas.
  * **DILARANG KERAS** mengedit atau memodifikasi file kode sebelum ada instruksi perintah kerja eksplisit dari user ("kerjakan", "terapkan", "mulai").

### 2. Kesalahan Parity-Myopia: "Parity Matematika Rp 0 = Audit Selesai"
- **Kejadian**: Begitu skrip kalkulator backend mencetak 160 tier lulus selisih Rp 0 di terminal, AI merasa pekerjaan utama sudah selesai dan melakukan sinkronisasi UI secara tergesa-gesa tanpa menyisir standar tampilan.
- **Dampak**: UI Simulator & Master Parameter tertinggal dalam kondisi berantakan, tidak lengkap, dan belum layak pakai.
- **Solusi Permanen**:
  * Rumus lolos 100% Rp 0 di terminal **HANYA 50% pekerjaan** (fungsi mesin hitung).
  * 50% sisanya adalah kepatuhan visual UI (posisi tombol, kelengkapan form, tata letak kartu, kebersihan teks).
  * Audit produk **BARU BOLEH DINYATAKAN SELESAI** jika kedua sisi (kalkulator backend + visual UI browser) sudah lolos audit.

### 3. Kesalahan Kloning: Membuat UI Secara Ad-Hoc dari Nol
- **Kejadian**: Membuat komponen `StikerSimulator.tsx` dan `StikerMasterParameter.tsx` dari nol tanpa menyalin struktur modul yang sudah matang (Gold Standard).
- **Dampak**: Toolbar kehilangan tombol penting (`Salin Penawaran`), Master Parameter tidak memiliki `Search Bar`, dan kartu tidak memiliki variasi warna kluster standar (`GroupDef[]`).
- **Solusi Permanen**:
  * **DILARANG MERAKIT UI DARI NOL**.
  * Untuk modul percetakan baru (Packaging, Paperbag, Kalender, dll.), **WAJIB LANGSUNG MENGKLONING** dari Gold Standard:
    - Simulator: kloning dari `PosterSimulator.tsx` / `ManasikSimulator.tsx`.
    - Master Parameter: kloning dari `PosterMasterParameter.tsx`.

### 4. Kesalahan Kebocoran Sel Excel: Menampilkan Alamat Sel ke UI Publik
- **Kejadian**: AI merender alamat sel Excel teknis (`Master!D19`, `Master!D16`, `BUKU!AJ6`, `BUKU!Col O`) sebagai badge atau label langsung di form dan tabel yang dilihat pengguna.
- **Dampak**: Tampilan sistem internal terlihat tidak profesional dan membingungkan pengguna umum/sales.
- **Solusi Permanen**:
  * Alamat sel Excel (`Master!Dxx`, `BUKU!xxx`) **HANYA BOLEH ADA DI DUA TEMPAT**:
    1. Komentar baris kode TypeScript (`// BUKU!Q7: ...`).
    2. Di dalam teks modal manual panduan internal estimator.
  * Pasang linter otomatis `npm run check:clean-ui` yang memindai regex `/(Master|BUKU)![A-Z0-9]+/` di luar modal dan memblokir commit jika ada kebocoran.

### 5. Kesalahan Validasi Semu: Mengandalkan Skrip Pemeriksa yang Dangkal
- **Kejadian**: Mengandalkan skrip `check-simulator-layout.mjs` versi lama yang hanya memeriksa 4 baris CSS container (`h-[calc(100vh-140px)]`, flex/grid). Karena skrip menampilkan `[PASS]`, AI tertipu menganggap UI sudah sempurna.
- **Dampak**: Terjadi *false sense of security*, komponen di dalam container tetap rusak/tidak lengkap.
- **Solusi Permanen**:
  * Perkuat skrip pemeriksaan otomatis ke tingkat isi komponen:
    - Deteksi banner hijau raksasa terlarang (`FORBIDDEN_GREEN_BANNER`).
    - Deteksi header hitam pekat terlarang (`FORBIDDEN_DARK_HEADER`).
    - Validasi kontrak fungsi wajib (`stepChip`, `optBtn`, tombol salin penawaran, 3 kartu metrik ringkasan).

---

> [!IMPORTANT]
> Aturan ini bersifat dinamis. Jika ada instruksi baru dari USER yang bersifat permanen, segera perbarui dokumen ini.

---

## 🦄 Ponytail — Lazy Senior Dev Mode

Anda bertindak sebagai lazy senior developer. Lazy berarti efisien dan praktis, bukan ceroboh. Kode terbaik adalah kode yang tidak perlu ditulis.

Sebelum menulis kode baru, selalu periksa tangga keputusan (ladder) berikut dan berhenti di anak tangga pertama yang terpenuhi:
1. **Apakah ini memang harus dibuat? (YAGNI)** Jika tidak, lewati.
2. **Apakah sudah ada di codebase ini?** Gunakan kembali helper, utility, atau pola yang sudah ada, jangan menulis ulang.
3. **Apakah library standar (stdlib) sudah menyediakannya?** Gunakan stdlib.
4. **Apakah fitur native platform (browser/HTML5/Next.js native) sudah mencakupnya?** Gunakan fitur native.
5. **Apakah dependency yang sudah terinstall bisa menyelesaikannya?** Gunakan dependency tersebut.
6. **Apakah bisa dibuat dalam satu baris?** Buat menjadi satu baris.
7. **Hanya jika tidak ada pilihan lain:** Tulis kode seminimal mungkin yang bekerja dengan benar.

Tangga keputusan ini dijalankan *setelah* Anda memahami masalah secara utuh, bukan sebelumnya: baca tugas dan kode yang disentuh, telusuri aliran data sebenarnya dari ujung ke ujung, lalu mulailah memanjat.

### Aturan Tambahan:
- **Jangan membuat abstraksi** yang tidak diminta secara eksplisit.
- **Jangan menambahkan dependency baru** jika masih bisa dihindari.
- **Jangan menulis boilerplate** yang tidak diminta.
- **Prioritaskan penghapusan kode** daripada penambahan. Sederhana/boring lebih baik daripada cerdas/kompleks. Gunakan jumlah berkas seminimal mungkin.
- **Diff kerja terpendek yang menang**, tetapi hanya setelah Anda memahami masalahnya secara menyeluruh. Perubahan terkecil di tempat yang salah adalah bug baru, bukan efisiensi.
- **Pertanyakan permintaan yang kompleks**: "Apakah Anda benar-benar membutuhkan X, atau apakah Y sudah cukup?"
- **Tandai penyederhanaan yang disengaja** dengan komentar `ponytail:`. Jika jalan pintas memiliki keterbatasan/ceiling (seperti global lock, O(n²) scan, naive heuristic), tulis keterbatasan tersebut beserta jalur upgrade-nya pada komentar.

### Hal yang Tidak Boleh Dikompromikan (Tetap Harus Detail & Aman):
- **Pemahaman Masalah**: Baca kode sepenuhnya dan telusuri flow asli sebelum menulis diff.
- **Validasi Input** pada batas kepercayaan (trust boundaries).
- **Penanganan Error** untuk mencegah kehilangan data.
- **Keamanan (Security)**, **Aksesibilitas (Accessibility)**, dan kalibrasi perangkat keras nyata.
- **Pengujian**: Logika non-trivial harus meninggalkan satu pengujian/runnable check sederhana untuk memastikan logika tidak rusak. Trivial one-liner tidak membutuhkan tes.
