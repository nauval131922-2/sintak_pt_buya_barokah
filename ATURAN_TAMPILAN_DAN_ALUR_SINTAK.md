# ATURAN BAKU DIAGRAM ALIRAN DATA & ARSITEKTUR SINTAK

Dokumen ini adalah aturan wajib yang HARUS selalu dibaca dan dipatuhi setiap kali memodifikasi diagram SINTAK (Draw.io maupun FreeMind).

---

## 1. PANDUAN TATA LETAK & UKURAN KOTAK (ANTI TULISAN MENABRAK / TERPOTONG)
1. **Perhitungan Tinggi Kotak (Height)**:
   - Setiap baris teks rata-rata membutuhkan tinggi 18–20px.
   - Padding atas-bawah + header box minimal 30px.
   - Rumus: `Tinggi Kotak = (Jumlah Baris x 20px) + 35px`.
   - Contoh: Kotak dengan 5 baris teks WAJIB memiliki tinggi minimal **135px** (JANGAN 90px!).
   - Berikan clearance (jarak bebas) minimal 15px antara baris teks terbawah dan border bawah kotak.
2. **Lebar Kotak (Width)**:
   - Lebar harus cukup longgar agar teks tidak terlipat menjadi terlalu banyak baris vertikal.
   - Gunakan `spacingLeft=12; spacingRight=12; spacingTop=10; spacingBottom=10;` pada styling mxCell.

---

## 2. PANDUAN PANAH & LABEL (ANTI PANAH RUWET / LABEL BERTUMPUK)
1. **Jarak Bebas Antar Kotak (Gap Distance)**:
   - Jarak horizontal antara kotak sumber dan kotak tujuan yang memiliki panah berlabel minimal **140px – 180px**.
   - DILARANG meletakkan kotak berjarak hanya 40–50px jika ada panah dan label di antaranya!
2. **Posisi Label Panah**:
   - Label panah orthogonal wajib diletakkan di atas garis horizontal (`label_offset=[0, -12]`) dengan background putih (`labelBackgroundColor=#ffffff`).
   - Label DILARANG memotong garis panah vertikal lain atau menempel pada sudut kotak tujuan.
3. **Pencabangan Panah**:
   - Jika satu node mengarah ke beberapa node anak (seperti JHP ke Target, Analisa, Hasil), beri ruang vertikal dan horizontal yang lega agar tiap cabang panah terpisah jelas dan bersih.

---

## 3. PANDUAN ALUR ROLE (FLOW OF ROLES BERDASARKAN DATABASE DEV)
Role di SINTAK BUKAN sekadar daftar nama teks, melainkan aktor yang menggerakkan alur sistem:
1. **Super Admin**:
   - Rute: `/users`, `/roles`, `/settings/telegram-users`, `/log-aktivitas`, seluruh modul.
   - Aksi: Manajemen akun, konfigurasi hak akses RBAC, persetujuan user Telegram bot, audit log.
2. **Admin Penjadwalan**:
   - Rute: `/data/excel-sopd`, `/jurnal-harian-produksi`, `/jurnal-harian-produksi/target`.
   - Aksi: Mengambil antrean pesanan dari SOPd, menyusun target kerja per shift & operator, menyalin jadwal hari sebelumnya (Copy Jadwal).
3. **Admin Realisasi**:
   - Rute: `/jurnal-harian-produksi`, `/hasil-produksi`.
   - Aksi: Memvalidasi dan menginput jam mulai/selesai pengerjaan, jumlah lembar berhasil, dan lembar rijek di lapangan.
4. **Operator Teknis & Kasi (Cetak, Finishing, Setting, QC, Pra/Pasca Cetak)**:
   - Rute: `/laporan-pekerjaan`, `/hasil-produksi`, serta Bot Telegram (`/api/telegram/realisasi`).
   - Aksi: Operator mencatat lembar kerja harian per mesin/divisi atau mengirim update realisasi via chat bot Telegram. Kepala Seksi mengontrol antrean SOPd & laporan divisi.
5. **Kalkulasi & Kalkulasi2**:
   - Rute: `/pricelist`, `/hpp-kalkulasi`, `/rekap-sales-order`.
   - Aksi: Mensimulasikan estimasi harga cetak 20+ produk, menginput nilai HPP order, dan menganalisa rekapitulasi Sales Order.
6. **HRD**:
   - Rute: `/employees`, `/records`, `/dashboard-hrd`.
   - Aksi: Mengelola data karyawan, mencatat insiden kesalahan kerja & nominal kerugian operator, memantau tren pelanggaran di Dashboard HRD.
7. **Akunting**:
   - Rute: `/akuntansi/data/rek-akuntansi`, `/akuntansi/laporan/jurnal-umum`, `/dashboard-akunting`, `/sync`.
   - Aksi: Sinkronisasi data keuangan dari Digit, memantau bagan akun, menganalisis Debet/Kredit Jurnal Umum, dan memantau tren finansial di Dashboard Akuntansi.
