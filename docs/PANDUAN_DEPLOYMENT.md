# Panduan Pilihan Deployment — SINTAK ERP

Dokumen ini merangkum pembahasan mengenai opsi-opsi deployment agar SINTAK ERP dapat diakses oleh pengguna lain di luar jaringan lokal laptop/PC pengembang.

---

## Ringkasan Konsep Dasar (Analogi Restoran)

Untuk memahami komponen deployment, kita dapat membayangkan SINTAK ERP sebagai sebuah **Restoran**:
*   **Domain (Alamat Toko)**: Nama jalan/plang nama restoran (contoh: `sintak-buya.com`). Dibeli dari registrar seperti Rumahweb, Niagahoster, dll.
*   **Hosting / VPS (Dapur & Koki)**: Tempat mengolah kode program Next.js dan melayani pesanan halaman web pengguna.
*   **Database (Kulkas & Gudang)**: Tempat menyimpan data transaksi, karyawan, dan log aktivitas secara aman (SQLite atau Turso).

---

## Perbandingan Opsi Deployment

Berikut adalah 3 opsi utama untuk membuat SINTAK ERP online:

| Kriteria | Opsi 1: Tunneling (Ngrok/Cloudflare) | Opsi 2: Vercel + Turso Cloud | Opsi 3: Self-Hosted VPS (Rekomendasi) |
| :--- | :--- | :--- | :--- |
| **Lokasi Server** | Laptop Anda sendiri | Server Serverless Vercel & Turso | Virtual Private Server (VPS) Sewaan |
| **Biaya** | **Gratis** | **Gratis** (Hobby Tier) s.d. **$49/bln** (Pro) | **Rp 50.000 - Rp 150.000 / bulan** |
| **Batas Waktu Eksekusi** | Tergantung koneksi laptop | **Maksimal 60 detik** (Vercel Pro) | **Tanpa batasan** |
| **Batas Upload File** | Tergantung koneksi laptop | **Maksimal 150 MB** (Vercel Pro) | **Bisa disetel bebas** (e.g. 500MB+) |
| **Pengelolaan** | Sangat mudah | Sangat mudah (Otomatis via GitHub) | Perlu konfigurasi awal & maintenance |
| **Stabilitas** | Laptop harus menyala terus 24/7 | Sangat stabil, online 24/7 | Sangat stabil, online 24/7 |

---

## Detail Opsi Deployment

### Opsi 1: Tunneling dari Laptop (Uji Coba Cepat)
Menghubungkan port lokal `3000` laptop Anda langsung ke internet menggunakan proxy/tunnel.
*   **Cara kerja**: Menggunakan tool seperti **Ngrok** atau **Cloudflare Tunnel**.
*   **Kelebihan**: Gratis, setup instan (3 menit), data database tetap di laptop Anda.
*   **Kekurangan**: Laptop harus selalu menyala, tidak boleh sleep, dan kecepatan akses luar dibatasi oleh kecepatan upload internet rumah/kantor Anda.
*   **Cocok untuk**: Demo singkat ke klien atau testing internal sementara.

### Opsi 2: Vercel + Turso Cloud (Serverless)
Memindahkan frontend ke platform serverless Vercel dan database SQLite lokal ke Turso Cloud.
*   **Kelebihan**: Gratis untuk skala kecil, tidak perlu pusing mengelola OS/keamanan server, SSL otomatis aktif.
*   **Kekurangan**: Vercel memiliki limit upload data dan *timeout* eksekusi (maks 60 detik untuk akun berbayar). Proses berat seperti impor Excel berukuran besar atau scraping massal berisiko terputus (*timeout*).
*   **Cocok untuk**: Aplikasi ringan yang tidak memiliki pemrosesan data/unggah berkas berukuran besar.

### Opsi 3: Self-Hosted VPS (Rekomendasi Utama untuk SINTAK)
Menyewa komputer virtual (VPS) murah dan menyalin seluruh program beserta SQLite lokal ke dalamnya.
*   **Kelebihan**: Bebas dari batasan *timeout* dan ukuran upload file (bisa upload file Excel besar untuk SOPd/Master data). Database SQLite tetap berupa berkas lokal privat. Biaya bulanan relatif murah (Rp 50.000 - Rp 150.000).
*   **Kekurangan**: Perlu instalasi awal (Node.js, PM2, Nginx, SSL Let's Encrypt), namun proses ini bisa dibantu/dikonfigurasi oleh asisten AI.
*   **Cocok untuk**: ERP skala menengah seperti SINTAK yang aktif melakukan impor data besar dan scraping harian.

---

## Informasi Tambahan: Menggunakan Domain & Hosting yang Sudah Ada (Rumahweb/Niagahoster)

Jika Anda sudah memiliki Domain dan Hosting di penyedia lokal seperti Rumahweb:

1.  **Domain (Pasti Bisa)**:
    Domain tersebut (contoh: `kantorbuya.com`) bisa diarahkan ke VPS Anda (Opsi 3) atau dihubungkan ke Vercel (Opsi 2).
2.  **Hosting (Tergantung Tipe)**:
    *   **Shared Hosting Biasa (cPanel PHP)**: **Tidak bisa** digunakan untuk Next.js karena shared hosting tidak mendukung proses background Node.js yang persisten (seperti PM2) dan membatasi akses terminal.
    *   **VPS Rumahweb**: **Bisa digunakan** dengan setup yang sama seperti VPS pada umumnya.
