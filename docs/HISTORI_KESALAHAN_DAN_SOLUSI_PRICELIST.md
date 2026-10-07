# HISTORI KESALAHAN & SOLUSI PERMANEN PEMBUATAN MODUL KALKULASI HARGA SINTAK

> **DOKUMEN INI ADALAH CATATAN SEJARAH KEGAGALAN NYATA DAN SOLUSI PATEN.**
> Seluruh agent AI yang bekerja pada modul kalkulasi harga percetakan SINTAK **WAJIB MEMBACA DAN MEMATUHI** dokumen ini. Dilarang mengulangi satu pun dari kesalahan di bawah ini.

---

## 1. Kronologi Kesalahan Fatal dari Awal Proyek & Solusinya

### 1. Parity-Myopia (Terminal Lolos Rp 0 = Dianggap Selesai, UI Terbengkalai)
- **Kesalahan Nyata**: Saat mengaudit modul (misal Stiker, Soft Cover), begitu skrip kalkulator mencetak 100% lulus selisih Rp 0 di terminal, AI langsung merasa pekerjaan selesai. Akibatnya, UI visual di browser dibuat ala kadarnya, tidak dicek, dan banyak fitur penting tertinggal.
- **Dampak**: Sales & estimator tidak bisa memakai halaman web dengan nyaman karena interface belum siap pakai meskipun hitungan backend-nya benar.
- **Solusi Permanen**: 
  - **Prinsip 50-50**: Lolos benchmark angka Rp 0 di terminal **HANYA 50% kelulusan**. 50% sisanya adalah kepatuhan dan kebersihan UI visual 100%.
  - Audit **BARU BOLEH DINYATAKAN SELESAI** jika kalkulator backend lolos Rp 0 DAN seluruh checklist UI terverifikasi tuntas.

---

### 2. Inkonsistensi UI & Membuat Komponen Ad-Hoc dari Nol
- **Kesalahan Nyata**: Menulis komponen `*Simulator.tsx` dan `*MasterParameter.tsx` dari nol secara bebas tanpa melihat modul acuan yang sudah matang. Akibatnya:
  - Tombol aksi di toolbar header hilang (seperti tombol `Salin Penawaran` WhatsApp di Stiker).
  - Search bar pencarian parameter di Master Parameter tidak dibuat.
  - Kartu parameter tidak memakai kluster grup border warna (`sky`, `blue`, `violet`, `amber`).
- **Solusi Permanen**:
  - **DILARANG MERAKIT STRUKTUR DARI NOL**.
  - Wajib **100% mengkloning struktur Gold Standard**:
    - Simulator: Kloning dari `src/app/pricelist/PosterSimulator.tsx` / `ManasikSimulator.tsx`.
    - Master Parameter: Kloning dari `src/app/pricelist/PosterMasterParameter.tsx`.

---

### 3. Kebocoran Teks Sel Excel ke Tampilan Publik Pengguna
- **Kesalahan Nyata**: Alamat sel teknis Excel (`Master!D19`, `Master!D16`, `BUKU!AJ6`, `BUKU!P7`) malah dirender langsung ke UI sebagai badge abu-abu, label input, subtext kartu, atau nama baris tabel breakdown.
- **Dampak**: Tampilan sistem terlihat berantakan, membingungkan pengguna akhir, dan melanggar privasi/abstraksi internal perancangan.
- **Solusi Permanen**:
  - Alamat sel Excel (`Master!Dxx`, `BUKU!xxx`) **HANYA BOLEH ADA DI DUA TEMPAT**:
    1. Komentar baris kode TypeScript (`// BUKU!Q7: ...`).
    2. Di dalam teks modal manual panduan internal estimator (`ModalManualPengguna`).
  - **DILARANG KERAS** tampil di form input, kartu parameter, badge, atau tabel breakdown hasil kalkulasi.
  - Wajib diverifikasi dengan linter otomatis: `npm run check:clean-ui` (harus `0 kebocoran`).

---

### 4. False Sense of Security dari Skrip Pemeriksa yang Dangkal
- **Kesalahan Nyata**: Mengandalkan skrip `check-simulator-layout.mjs` lama yang hanya mencocokkan 4 string CSS container luar (`h-[calc(100vh-140px)]`, flex/grid). Karena skrip menghasilkan `[PASS]`, AI tertipu mengira UI sudah selesai, padahal isi komponen di dalamnya hancur/tidak lengkap.
- **Solusi Permanen**:
  - Skrip linter ditingkatkan untuk memeriksa isi dalam komponen:
    - Larangan keras banner hijau raksasa (`FORBIDDEN_GREEN_BANNER`).
    - Larangan keras header hitam pekat (`FORBIDDEN_DARK_HEADER`).
    - Pengecekan fungsi wajib (`stepChip`, `optBtn`, tombol salin penawaran, 3 kartu metrik ringkasan).

---

### 5. Kehilangan Data Form Saat Pindah Tab (Draft Reset Bug)
- **Kesalahan Nyata**: Pada 16 simulator lama, begitu pengguna berpindah ke tab Master Parameter, tab Pricelist Matriks, atau refresh halaman, seluruh pilihan dropdown dan angka oplah yang sudah diinput kembali ke nilai awal (reset ke 0 / default).
- **Dampak**: Estimator frustrasi karena harus mengulang input spesifikasi berkali-kali.
- **Solusi Permanen**:
  - Seluruh simulator **WAJIB memasang auto-persist `localStorage`** (`sintak_<produk>_draft`).
  - Wajib dipasang guard: jika mode edit riwayat aktif (`activeSimulationId`), auto-restore draft di-skip agar data riwayat tidak tertimpa.

---

### 6. Pembajakan Variabel / Conditional Hijacking di Backend
- **Kesalahan Nyata**: Menghubungkan dropdown mesin ke kondisi hardcode, contoh: `if (oplah > 1000) mesin = 'SM' else mesin = 'Oliver'`, sehingga tombol pilihan mesin pengguna diabaikan secara diam-diam.
- **Dampak**: Pilihan dropdown di UI menjadi pajangan mati yang tidak berpengaruh pada harga.
- **Solusi Permanen**:
  - **Uji Reaktivitas Parameter Wajib**: Setiap input form wajib diuji di skrip terminal dengan mengubah nilainya dari A ke B. Jika $\Delta\text{HPP} == 0$, kalkulator **DITOLAK / GAGAL AUDIT**.

---

### 7. Penggunaan Magic Numbers & Mengarang Rumus Tanpa Menelusuri Sheet Engine
- **Kesalahan Nyata**: Menulis angka pengali sembarangan (misal `* 2` atau `+ 10`) tanpa menelusuri asal-usulnya di sheet Engine Excel (`BUKU`, `KALKULASI`).
- **Solusi Permanen**:
  - Setiap konstanta wajib dibongkar alasannya (apakah kapasitas lembar, insheet waste, atau pembagian plano).
  - Wajib menyertakan komentar formula asli: `// BUKU!Q7 = ROUNDUP(...)`.

---

### 8. Penambahan Jargon & Istilah Asing Karangan AI
- **Kesalahan Nyata**: Mengganti nama mesin asli di Excel dengan singkatan modern karangan AI seperti `POD`, `Print On Demand`, `Artwork File`, `CTP Plate`.
- **Dampak**: Estimator dan operator Buya Barokah tidak mengenali istilah tersebut karena berbeda dengan bahasa operasional harian kantor.
- **Solusi Permanen**:
  - Gunakan **HANYA istilah asli dari file Excel master Buya Barokah** (`Print Inter`, `Ryobi`, `Oliver`, `Heidelberg Speedmaster SM 102`, `Plat`, `Desain`).

---

### 9. Merumuskan Kompromi Sendiri Saat Master Excel Tidak Konsisten
- **Kesalahan Nyata**: Menemukan perbedaan tarif antar-file master sejenis (misal file oplah kecil vs oplah besar beda insheet), lalu AI berinisiatif membuat rata-rata atau rumus kompromi sendiri tanpa konfirmasi.
- **Solusi Permanen**:
  - **STOP GATE**: Jika ada perbedaan nilai antar-file master sejenis, AI **WAJIB BERHENTI** dan memaparkan perbedaannya kepada user untuk meminta konfirmasi nilai default yang dikehendaki.

---

### 10. Pelanggaran Disiplin Komunikasi: Langsung Mengerjakan Saat Ditanya
- **Kesalahan Nyata**: Saat user mengajukan pertanyaan konseptual, evaluasi, atau *"kenapa"*, AI terburu-buru langsung mengedit file kode tanpa menjawab pertanyaan user secara tuntas.
- **Dampak**: User merasa diabaikan, kehilangan kendali keputusan, dan rencana belum disepakati tetapi file sudah diacak-acak.
- **Solusi Permanen**:
  - **HUKUM MUTLAK**: Jika user bertanya (evaluasi, "kenapa", "solusinya gimana", konfirmasi arah), **JAWAB DAHULU** secara faktual dan tuntas.
  - **DILARANG KERAS** mengedit atau memodifikasi file kode sebelum ada instruksi perintah kerja eksplisit dari user ("kerjakan", "terapkan", "mulai").

---

## 2. Checklist Wajib Setiap Kali Mengerjakan Modul Kalkulasi (10-Point Gate)

Setiap kali user memerintahkan untuk mengerjakan atau mengaudit modul kalkulasi harga, AI **WAJIB MENAMPILKAN DAN MEMERIKSA CHECKLIST INI SATU PER SATU**:

```markdown
[ ] 1. BACKEND PARITY: 100% tier lolos selisih Rp 0 di terminal (tanpa .filter(), multi-file).
[ ] 2. REAKTIVITAS: Semua opsi input form diuji dan berdampak nyata (delta HPP > 0).
[ ] 3. CLONING GOLD STANDARD: Struktur dikloning dari Poster/Manasik, bukan dirakit ad-hoc.
[ ] 4. FORM KIRI (Pos 5a): Urutan ber-stepChip(1..N), tombol netral optBtn(active), tanpa kotakan warna-warni kontras.
[ ] 5. TOOLBAR HEADER (Pos 5a): Memuat 3 tombol lengkap [Salin Penawaran], [Panduan], dan [Master].
[ ] 6. HASIL KANAN (Pos 5b): Sticky 3 kartu metrik ringkasan + tabel breakdown 5 kolom baku ber-footer emerald 100%.
[ ] 7. TOMBOL SIMPAN (Pos 5c): Full-width di bawah tabel breakdown kolom kanan (bukan form mini di kiri).
[ ] 8. DRAFT PERSIST: Form auto-save & auto-restore dari localStorage (skip saat edit riwayat).
[ ] 9. CLEAN UI (NO CELL LEAK): 0 nama sel Excel di tampilan publik (lulus npm run check:clean-ui).
[ ] 10. LAYOUT CHECK: Lolos npm run check:simulator-layout (bebas banner hijau & bebas box gelap).
```
