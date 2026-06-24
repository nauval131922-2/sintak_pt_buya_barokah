# AI Project Rules & Guidelines

Dokumen ini adalah **Hukum Tertinggi** bagi asisten AI yang bekerja pada repository ini. **BACA DAN PATUHI** sebelum melakukan perubahan kode apa pun.

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
