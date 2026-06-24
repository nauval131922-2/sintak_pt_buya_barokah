# 📖 Tutorial 19: Penyalinan Jadwal Fleksibel & Audit Log Scraping

## 📌 Deskripsi
Tutorial ini menjelaskan pembaruan fitur **Copy Jadwal** pada modul Jurnal Harian Produksi dan standarisasi pencatatan aktivitas untuk proses *scraping* data.

---

## 🛠️ Langkah-Langkah Perubahan

### 1. Transformasi UI Copy Jadwal
Mengubah tombol penyalinan jadwal statis (besok) menjadi modal interaktif yang fleksibel.

**Perubahan di `JurnalClient.tsx`:**
- Menambahkan modal "Copy Jadwal" dengan input `from` (dari tanggal) dan `to` (ke tanggal).
- Implementasi filter **Bagian** dan **Karyawan** secara inline di dalam modal.
- Menambahkan fitur pencarian (*live search*) pada daftar bagian dan karyawan untuk memudahkan navigasi data besar.
- Mengubah tema warna dari biru ke **hijau/emerald** agar selaras dengan identitas visual SINTAK.

### 2. Backend Copy Jadwal Dinamis
Refactor API untuk mendukung parameter fleksibel dan operasi atomik.

**Perubahan di `api/jurnal-harian-produksi/copy-jadwal/route.ts`:**
- Endpoint kini menerima parameter `from`, `to`, `bagian`, dan `namaKaryawan`.
- Menggunakan `db.batch()` untuk menyalin data secara massal dalam satu transaksi.
- Menghapus batasan "copy hanya sekali sehari" untuk mendukung kebutuhan admin yang dinamis.

### 3. Audit Log untuk Scraping Jurnal Umum
Memastikan aktivitas penarikan data (scraping) tercatat di dashboard.

**Perubahan di `api/scrape-jurnal-umum/route.ts`:**
- Menambahkan `INSERT INTO activity_logs` setelah proses scraping berhasil.
- Mencatat jumlah transaksi yang ditarik dan rentang periodenya.

### 4. Standarisasi Aturan Pengembangan
Dibuatnya file `docs/DEV_RULES.md` untuk merumuskan aturan wajib bagi AI Agent:
- Wajib bertanya klarifikasi sebelum mengerjakan fitur signifikan.
- Wajib mencatat log aktivitas untuk fitur scraping/import massal.
- Wajib menggunakan tema warna hijau untuk elemen aksi utama.

---

## ✅ Cara Verifikasi
1. Buka **Jurnal Harian Produksi**.
2. Klik tombol **Copy Jadwal** (warna hijau).
3. Pilih rentang tanggal, filter bagian/karyawan, lalu klik **Salin Jadwal**.
4. Cek **Aktivitas Terkini** di Dashboard setelah melakukan tarik data Jurnal Umum untuk memastikan log muncul.
