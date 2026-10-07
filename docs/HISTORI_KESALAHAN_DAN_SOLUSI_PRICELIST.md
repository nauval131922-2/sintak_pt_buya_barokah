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

### 11. Kebocoran Teks Sel Excel dari Return Object Kalkulator Backend (src/lib)
- **Kesalahan Nyata**: Alamat sel Excel teknis (`Master!D16`, `BUKU!AJ`, `BUKU!T7`, `Master!D17`, `BUKU!P7`) disisipkan ke properti `komponen` atau `keterangan` objek array breakdown di file kalkulator backend (`src/lib/*-calculator.ts`). Saat frontend merender `{row.komponen}` atau `{row.keterangan}`, teks teknis seperti `- 2 Jasa Desain Stiker (Master!D16)` atau `BUKU!T7: 15 lbr A3+...` langsung tercetak ke layar browser pengguna.
- **Alasan Kesalahan Terjadi**: Skrip linter `check-clean-ui.mjs` awal hanya memeriksa file di `src/app/pricelist/`, sehingga kebocoran pada file backend di `src/lib/` lolos tanpa terdeteksi sama sekali.
- **Solusi Permanen**: 
  - Seluruh string literal pada return object di `src/lib/*-calculator.ts` wajib bersih dari nama sel Excel teknis dan menggunakan deskripsi bisnis yang ramah (`Tarif flat per order`, `Biaya setting desain`, `Tarif flat per pesanan`, dll.).
  - Skrip linter `check-clean-ui.mjs` diperluas untuk menyapu seluruh file `src/lib/*.ts` (0 kebocoran pada string literal).
- **Penerapan Nyata**: Dibersihkan tuntas di 11 file backend (`stiker`, `amplop`, `buku-tabungan-ns`, `kartu-koperasi`, `kop-surat`, `lebel-kartu-obat`, `raport-kaleb`, `sertifikat`, `stopmap`, `syahadah`, `undangan`).

---

### 12. Deviasi Kiblat Master Parameter (Improvisasi Tata Letak Sendiri)
- **Kesalahan Nyata**: Pada `StikerMasterParameter.tsx`, alih-alih meniru modul acuan utama (`BukuHardCoverUnifiedMasterParameter.tsx` - Image #4 & #6), AI mengimprovisasi layout sendiri:
  - Search bar dibuat kecil (`w-56`) di pojok kanan atas sejajar judul (Image #3), alih-alih search bar lebar penuh `w-full` sticky di bawah judul (Image #4).
  - Kartu parameter dibuat dengan baris vertikal 1 kolom, label di kiri dengan teks `Def: Rp ...` dan input di kanan (Image #5), alih-alih arsitektur baku grid 2 kolom (`grid-cols-1 sm:grid-cols-2`) dengan label di atas, input box di bawah, dan badge kategori di header (Image #6).
- **Alasan Kesalahan Terjadi**: Kurangnya kepatuhan pada kiblat tunggal; AI mengambil contoh acuan yang keliru atau merakit komponen ad-hoc saat membuat modul baru.
- **Solusi Permanen**:
  - Mengunci mati kiblat Master Parameter ke **`BukuHardCoverUnifiedMasterParameter.tsx`**:
    1. Search bar wajib lebar penuh `w-full` sticky dengan placeholder `"Cari parameter tarif, kertas, plat, atau upah…"`.
    2. Header kartu wajib memiliki badge kategori tegas (`text-sky-900 bg-sky-200/80 [Cetak]`, `text-amber-900 bg-amber-200/80 [Finishing]`) + Icon Lucide + Judul Kartu.
    3. Sub-group wajib berupa box ber-border warna dengan judul huruf kapital (`g.title`).
    4. Input wajib tersusun dalam grid 2 kolom (`grid grid-cols-1 sm:grid-cols-2 gap-2.5`), label di atas, `<ThousandInput>` di bawah dengan prefix `Rp` atau suffix `%`/`lbr` di dalam box secara proporsional.
- **Penerapan Nyata**: `StikerMasterParameter.tsx` ditulis ulang 100% mengikuti cetakan `BukuHardCoverUnifiedMasterParameter.tsx`.

---

### 13. Inkonsistensi Nomenklatur 3 Kartu Metrik Finansial pada Simulator
- **Kesalahan Nyata**: Pada `StikerSimulator.tsx` (dan `MajalahSimulator.tsx`), 3 kartu metrik ringkasan di kolom kanan menggunakan penamaan non-standar:
  - Kartu 1 tertulis `HPP / pcs` (bukan `HPP Per Pcs` / `HPP Per Exp`).
  - Kartu 2 tertulis `Harga Jual / pcs` tanpa persentase laba di label (bukan `Harga Per Pcs (+30%)`).
  - Kartu 3 tertulis `Total Omset` dengan subtext kuantitas (bukan `Harga Total` dengan subtext `Profit: Rp ...`).
- **Alasan Kesalahan Terjadi**: AI tidak memperhatikan detail mikro penamaan pada modul referensi `BukuSoftCoverUnifiedSimulator.tsx` (Image #2), sehingga menciptakan bahasa finansial yang tidak seragam antar-halaman.
- **Solusi Permanen**:
  - Mengunci mati kiblat 3 kartu metrik ke **`BukuSoftCoverUnifiedSimulator.tsx`**:
    1. Kartu 1: Label `HPP Per Pcs` (atau `HPP Per Exp`), icon `DollarSign size={13}`, subtext `Total HPP: Rp ...`.
    2. Kartu 2: Label `Harga Per Pcs (+{marginPct}%)`, icon `TrendingUp size={13}`, style hijau gradient `bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200`, subtext `Laba {marginPct}%`.
    3. Kartu 3: Label `Harga Total`, icon `TrendingUp size={13}`, value text-emerald-700 font-mono, subtext `Profit: Rp ...`.
    4. Kontainer wajib sticky: `sticky top-0 z-10 space-y-2 bg-slate-50/95 backdrop-blur-xs py-1 -my-1` dengan penomoran `{stepChip(N)} Kalkulasi Total`.
- **Penerapan Nyata**:
  - Diperbaiki di `StikerSimulator.tsx` dan `MajalahSimulator.tsx`.
  - Skrip `check-clean-ui.mjs` diperbarui untuk secara otomatis menolak simulator yang tidak memuat `"Harga Total"` dan `"Profit:"`.

---

### 14. Inkonsistensi Header Form Simulator: Menaruh Toolbar Tombol di Header Kartu Form
- **Kesalahan Nyata**: Menaruh 3 tombol aksi (`[Salin]`, `[Panduan]`, `[Master]`) di header kartu form input kiri simulator (`PARAMETER PESANAN STIKER` - Image #1), padahal standar acuan utama (`BukuHardCoverUnifiedSimulator.tsx` / `BukuSoftCoverUnifiedSimulator.tsx` - Image #2) memiliki header kartu yang bersih murni (`Sliders` + `SPESIFIKASI ...`), tanpa tombol apa pun di sebelah kanan.
- **Alasan Kesalahan Terjadi**: AI keliru mengadopsi checklist lama dari modul `Poster`, sehingga merusak keseragaman header form dengan Buku Hard Cover dan Buku Soft Cover.
- **Solusi Permanen**:
  - Header kartu form input kiri simulator **WAJIB BERSIH 100%**: hanya memuat icon `Sliders size={15}` dan judul teks kapital `SPESIFIKASI <PRODUK>`, tanpa tombol aksi di sebelah kanan (persis seperti Image #2).
  - Tautan ke Master Parameter diposisikan pada baris info Laba/Margin di bagian bawah form jika dibutuhkan, dan form langsung menyambung dari header ke `{stepChip(1)} Ukuran`.
- **Penerapan Nyata**: Diterapkan langsung pada `StikerSimulator.tsx`.

---

### 15. Runtime ReferenceError Variabel Tidak Terdefinisi Pasca-Refactoring
- **Kesalahan Nyata**: Muncul console runtime error `cellRef is not defined at fieldRow (RaportKalebMasterParameter.tsx:115:10)`.
- **Alasan Kesalahan Terjadi**: Parameter `cellRef` dihapus dari signature helper function `fieldRow`, namun blok render kondisional `{cellRef && (<p>{cellRef}</p>)}` di dalam JSX fungsi tersebut lupa dibersihkan.
- **Dampak**: Layar tab Master Parameter Raport Kaleb crash putih di browser pengguna.
- **Solusi Permanen**:
  - Setiap kali menghapus parameter fungsi atau prop, wajib melakukan verifikasi compiler statis (`grep` nama variabel di seluruh file) dan verifikasi import runtime via Node/TSX (`npx tsx -e "import('...')"`).
  - Bersihkan seluruh sisa panggilan variabel yang sudah dihapus tanpa terkecuali.
- **Penerapan Nyata**: Dibersihkan tuntas di `RaportKalebMasterParameter.tsx`.

---

### 16. Inkonsistensi Visual Lintas 26 Simulator (Banner Raksasa, Variasi Label Kartu, dan Tfoot)
- **Kesalahan Nyata**: Masih ada sisa simulator generasi awal yang memiliki banner hijau raksasa (`LebelKartuObat`, `PricelistSimulator`), label kartu metrik bervariasi (`Total Omset`, `Total Penawaran`, `Total Nilai Order`, `Total Profit`), form header berisi deretan tombol aksi di kanan, dan format tfoot breakdown tidak seragam.
- **Alasan Kesalahan Terjadi**: Pengerjaan simulator dilakukan bertahap di masa lalu tanpa ada linter otomatis yang menyapu ke-26 modul secara serentak.
- **Solusi Permanen**:
  - Seluruh 26 modul aktif diseragamkan 100% ke kiblat tunggal `BukuSoftCoverUnifiedSimulator.tsx`:
    1. Bebas banner hijau raksasa.
    2. Header form kiri bersih: `<Sliders /> Spesifikasi <Produk>` tanpa tombol di kanan.
    3. Tiga kartu metrik finansial seragam: Card 1 (HPP), Card 2 (Harga Jual), Card 3 (`Harga Total` + subtext `Profit: Rp ...`).
    4. Tfoot tabel breakdown seragam: `Total HPP Biaya Produksi (<oplah> pcs/eks/rim/buku)` rata kiri `font-sans font-bold`.
  - Mengintegrasikan pengecekan seluruh 26 simulator ke dalam `scripts/check-clean-ui.mjs` sebagai guardrail otomatis permanen.
- **Penerapan Nyata**: 26 modul aktif lulus audit 100% konsisten pada `node scripts/check-clean-ui.mjs` dan `node scripts/check-simulator-layout.mjs`.

---

## 2. Checklist Wajib Setiap Kali Mengerjakan Modul Kalkulasi (10-Point Gate)

Setiap kali user memerintahkan untuk mengerjakan atau mengaudit modul kalkulasi harga, AI **WAJIB MENAMPILKAN DAN MEMERIKSA CHECKLIST INI SATU PER SATU**:

```markdown
[ ] 1. BACKEND PARITY: 100% tier lolos selisih Rp 0 di terminal (tanpa .filter(), multi-file).
[ ] 2. REAKTIVITAS: Semua opsi input form diuji dan berdampak nyata (delta HPP > 0).
[ ] 3. CLONING GOLD STANDARD: Master Param wajib kloning BukuHardCoverUnifiedMasterParameter.tsx, Simulator wajib kloning BukuSoftCoverUnifiedSimulator.tsx.
[ ] 4. FORM KIRI (Pos 5a): Urutan ber-stepChip(1..N), tombol netral optBtn(active), tanpa kotakan warna-warni kontras.
[ ] 5. HEADER FORM BERSIH (Pos 5a): Hanya icon Sliders + judul uppercase, tanpa deretan tombol aksi di kanan (mengikuti Buku Hard Cover).
[ ] 6. HASIL KANAN (Pos 5b): Sticky 3 kartu metrik ringkasan (HPP, Harga Per Pcs (+Laba%), Harga Total + Profit) + tabel breakdown 5 kolom baku.
[ ] 7. TOMBOL SIMPAN (Pos 5c): Full-width di bawah tabel breakdown kolom kanan (bukan form mini di kiri).
[ ] 8. DRAFT PERSIST: Form auto-save & auto-restore dari localStorage (skip saat edit riwayat).
[ ] 9. CLEAN UI (NO CELL LEAK): 0 nama sel Excel di UI dan string return backend (lulus mutlak node scripts/check-clean-ui.mjs).
[ ] 10. LAYOUT CHECK: Lolos node scripts/check-simulator-layout.mjs (bebas banner hijau & bebas box gelap).
```
