# 22 — Peta Alur Input Realisasi JHP dan Bot Telegram

Dokumen ini merangkum berbagai alur input realisasi atau hasil produksi yang saat ini didukung di modul `Jurnal Harian Produksi` (JHP), serta menjelaskan posisi alur `/input` pada Telegram Bot.

## 1. Konsep Dasar

Di JHP, satu tabel `jurnal_harian_produksi` dipakai untuk menampung dua sisi data sekaligus:

1. Sisi target atau penjadwalan
2. Sisi realisasi atau hasil produksi

Karena itu, alur input realisasi di sistem ini tidak tunggal. Realisasi bisa:

1. Menempel ke target yang sudah ada
2. Dipecah menjadi beberapa baris realisasi untuk satu target
3. Dibuat manual tanpa mengacu target tertentu
4. Dibuat sebagai baris baru yang sudah berisi target dan realisasi sekaligus

## 2. Alur Realisasi Berbasis Target Existing

Ini alur yang paling dekat dengan pola penjadwalan produksi.

Flow:

1. User melihat daftar JHP
2. User memilih baris target yang akan diisi hasilnya
3. User klik tombol `Input Realisasi (+)`
4. Form realisasi dibuka dengan `selectedTargetRow`
5. User mengisi hasil produksi
6. Data disimpan ke baris yang dipilih

Catatan teknis:

1. Frontend memulai flow ini lewat `startInputRealisasi()`
2. Data target lama ikut dipakai untuk membentuk realisasi pertama
3. Filter `belumRealisasi=true` menganggap data belum realisasi jika `realisasi`, `no_order_2`, dan `jenis_pekerjaan_2` masih kosong

Referensi:

1. `src/app/jurnal-harian-produksi/JurnalClient.tsx:1065-1097`
2. `src/app/api/jurnal-harian-produksi/route.ts:37-40`

## 3. Alur Multi-Realisasi untuk Satu Target

Ini adalah variasi lanjutan dari alur berbasis target existing.

Dipakai ketika satu target perlu dipecah menjadi beberapa hasil produksi terpisah.

Flow:

1. User memulai dari satu target existing
2. User masuk ke form realisasi
3. User klik `Tambah Realisasi Lainnya`
4. User menambah satu atau lebih baris realisasi tambahan
5. Sistem menyimpan semuanya dalam satu aksi

Logika simpan:

1. Baris pertama melakukan `UPDATE` ke record target asli
2. Baris kedua dan seterusnya melakukan `INSERT`
3. Baris tambahan diberi `is_manual_input = 1`

Catatan teknis:

1. Action backend yang dipakai adalah `input_multi_realisasi`
2. Baris tambahan yang kosong akan difilter sebelum dikirim
3. Tombol `Copy dari Realisasi Sebelumnya` hanya mempercepat pengisian baris tambahan, bukan mengubah logika simpan

Referensi:

1. `docs/tutorials/17-multi-realisasi-dan-mapping-pekerjaan.md:7-16`
2. `src/app/jurnal-harian-produksi/JurnalClient.tsx:1136-1158`
3. `src/app/jurnal-harian-produksi/JurnalClient.tsx:2649-2657`
4. `src/app/api/jurnal-harian-produksi/route.ts:237-355`

## 4. Alur Realisasi Manual Tanpa Mengacu Target Tertentu

JHP juga mendukung input realisasi yang tidak berasal dari target existing.

Flow:

1. User membuka form realisasi tanpa memilih baris target dari tabel
2. `selectedTargetRow` kosong
3. User mengisi realisasi secara manual
4. Sistem menyimpan sebagai baris jurnal baru

Di UI, mode ini ditandai dengan pesan bahwa user sedang mengisi form realisasi manual tanpa acuan target tertentu.

Referensi:

1. `src/app/jurnal-harian-produksi/JurnalClient.tsx:2423-2429`

## 5. Alur Insert Single: Baris Baru Berisi Target dan Realisasi Sekaligus

Ini adalah alur `insert_single` pada backend JHP.

Karakter alurnya:

1. Sistem membuat baris JHP baru
2. Baris itu bisa memuat data target
3. Baris itu juga bisa memuat data realisasi sekaligus
4. Baris baru ditandai `is_manual_input = 1`

Ini bukan update ke target existing, melainkan pembuatan record baru yang berdiri sendiri.

Catatan teknis:

1. Action backend yang dipakai adalah `insert_single`
2. Jika `no_order` kosong, sistem bisa memakai `nama_order_manual`
3. Jika sisi realisasi diisi dan `no_order_2` kosong, sistem bisa memakai `nama_order_manual_2`

Referensi:

1. `src/app/api/jurnal-harian-produksi/route.ts:183-235`

## 6. Alur Edit Baris Lama lalu Ubah Sisi Realisasi

Selain lewat tombol `+`, user juga bisa membuka baris lama dalam mode edit.

Flow:

1. User klik edit pada baris yang ada
2. User masuk ke tab target atau realisasi sesuai role
3. User mengubah sisi realisasi
4. Sistem melakukan `PUT`

Catatan teknis:

1. Saat edit di tab realisasi, frontend menyinkronkan kolom target dari nilai realisasi
2. Sinkronisasi ini menyentuh `no_order`, `nama_order`, dan `jenis_pekerjaan`
3. Jadi dalam mode edit, sisi target dan realisasi memang bisa dibuat konsisten mengikuti data terbaru

Referensi:

1. `src/app/jurnal-harian-produksi/JurnalClient.tsx:986-1027`
2. `src/app/jurnal-harian-produksi/JurnalClient.tsx:1161-1186`
3. `src/app/jurnal-harian-produksi/JurnalClient.tsx:1178-1183`

## 7. Alur Copy Jadwal lalu Lanjut Isi Realisasi

Ini bukan alur realisasi murni, tetapi sering menjadi bagian dari workflow operasional.

Flow:

1. User melakukan copy dari baris jadwal lama
2. Sistem membuat draft target baru
3. Field realisasi dikosongkan
4. User pindah ke tab realisasi
5. User mengisi hasil produksi

Referensi:

1. `src/app/jurnal-harian-produksi/JurnalClient.tsx:1099-1129`
2. `src/app/jurnal-harian-produksi/JurnalClient.tsx:2665-2668`

## 8. Variasi Order pada Input Realisasi

Di sisi realisasi, saat ini ada dua cara memasukkan order:

1. Order resmi dari daftar `sopd`
2. Order manual di luar daftar

### A. Order dari SOPD

Flow:

1. User memilih `No. Order` dari dropdown
2. Sistem mengisi `no_order_2`
3. Sistem mengambil `nama_order_2` dari tabel `sopd`

Referensi:

1. `src/app/jurnal-harian-produksi/JurnalClient.tsx:2453-2468`

### B. Order manual

Flow:

1. User tidak memilih `No. Order`
2. User mengisi `Nama Order (manual)`
3. Sistem mengosongkan `no_order_2`
4. Sistem menyimpan nama order manual tersebut di sisi realisasi

Referensi:

1. `src/app/jurnal-harian-produksi/JurnalClient.tsx:2471-2476`
2. `src/app/api/jurnal-harian-produksi/route.ts:200-205`
3. `src/app/api/jurnal-harian-produksi/route.ts:259-263`
4. `src/app/api/jurnal-harian-produksi/route.ts:309-317`

## 9. Posisi `/input` pada Telegram Bot Saat Ini

Telegram Bot saat ini belum meniru semua alur JHP web.

`/input` bot masuk ke alur:

1. Realisasi manual standalone
2. Satu template menghasilkan satu baris JHP baru
3. Penyimpanan dilakukan dengan `INSERT`, bukan update ke target existing

Artinya bot saat ini:

1. Tidak memilih target dari tabel JHP
2. Tidak menempel ke target existing
3. Tidak mendukung multi-realisasi
4. Tidak mengedit baris lama

Referensi:

1. `telegram-bot/src/handlers/input.ts:11-175`
2. `telegram-bot/src/utils/api.ts:91-165`

## 10. Bentuk Data yang Dihasilkan Bot Saat Ini

Baris yang dibuat bot bukan hanya berisi data realisasi murni. Baris tersebut adalah baris campuran yang memuat:

1. Sisi target
2. Sisi realisasi

Kolom yang diisi bot saat ini:

1. Sisi target:
   - `no_order`
   - `nama_order`
   - `jenis_pekerjaan`
   - `target`
2. Sisi realisasi:
   - `no_order_2`
   - `nama_order_2`
   - `jenis_pekerjaan_2`
   - `realisasi`
   - dan detail produksi lain seperti `bahan_kertas`, `warna`, `inscheet`, `rijek`, `jam`, `kendala`

Aturan sinkronisasi pada bot:

1. `no_order` mengikuti `no_order_2`
2. `nama_order` mengikuti `nama_order_2` atau `nama_order_manual_2`
3. `jenis_pekerjaan` mengikuti `jenis_pekerjaan_2`
4. `target` memakai nilai `target` jika ada, jika kosong fallback ke `realisasi`

Referensi:

1. `telegram-bot/src/utils/api.ts:125-140`
2. `telegram-bot/src/utils/api.ts:157-163`

## 11. Keterbatasan Bot Saat Ini

Sebelum dipakai lintas bagian, penting untuk paham batas saat ini.

Bot belum mendukung:

1. Memilih target existing dari JHP lalu mengisi realisasinya
2. Memecah satu target menjadi beberapa realisasi
3. Edit atau koreksi baris realisasi lama
4. Sinkronisasi terhadap workflow penjadwalan secara ketat

Bot saat ini paling cocok untuk:

1. Laporan cepat dari operator
2. Input manual sederhana
3. Kasus lapangan yang tidak perlu memilih target existing

## 12. Catatan Operasional untuk Bagian SETTING

Jika bagian SETTING ingin memakai bot sebagai jalur utama, ada dua model bisnis yang perlu dibedakan:

1. Bot sebagai input cepat manual
2. Bot sebagai pengisi realisasi atas target yang sudah dijadwalkan

Model saat ini adalah model pertama.

Konsekuensinya:

1. Data dari bot akan muncul sebagai baris JHP baru
2. Bukan sebagai update ke baris target existing
3. Jika order yang sama sudah ada di jadwal web, maka data bot bisa berdampingan dengan target lama sebagai baris terpisah

## 13. Ringkasan Cepat

Peta alur realisasi saat ini dapat diringkas sebagai berikut:

1. Input realisasi ke target existing
2. Multi-realisasi untuk satu target
3. Realisasi manual tanpa target tertentu
4. Insert single berisi target dan realisasi sekaligus
5. Edit baris lama di tab realisasi
6. Copy jadwal lalu lanjut isi realisasi
7. Bot Telegram sebagai manual single insert

Jika nanti bot perlu mengikuti workflow penjadwalan yang lebih ketat, maka perubahan berikut yang paling relevan adalah:

1. Bot harus bisa mencari target existing
2. Bot harus bisa memilih target yang akan diisi
3. Bot harus bisa membedakan update target existing vs insert manual baru
