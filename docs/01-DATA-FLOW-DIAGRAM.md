# DOKUMEN SISTEM SINTAK: DATA FLOW DIAGRAM (DFD) LEVEL 0 & LEVEL 1
**Sistem Informasi & Manajemen Manufaktur Percetakan PT Buya Barokah**

---

## 1. PENDAHULUAN & RUANG LINGKUP
Dokumen ini mendefinisikan arsitektur aliran data sistem **SINTAK** secara struktural menggunakan standar **Data Flow Diagram (DFD)**:
1. **DFD Level 0 (Diagram Konteks / Context Diagram)**: Memetakan batasan sistem (*system boundary*), seluruh aktor & entitas eksternal yang berinteraksi dengan SINTAK, serta aliran data masuk (*inflow*) dan informasi keluar (*outflow*).
2. **DFD Level 1 (Dekomposisi Sub-Proses & Data Store)**: Membedah SINTAK menjadi 5 proses bisnis utama, 9 penyimpanan data (*Data Store D1 – D9*), serta 1 proses rekonsiliasi audit lintas modul (*Tracking Manufaktur 14 Tabel*).

---

## 2. DFD LEVEL 0: DIAGRAM KONTEKS (CONTEXT DIAGRAM)

### 2.1 Simbol & Komponen Level 0
- **Proses Utama (Lingkaran Tengah)**:  
  `0.0 SISTEM INFORMASI & MANAJEMEN MANUFAKTUR (SINTAK)`
- **Entitas Eksternal (8 Entitas)**:

| No | Entitas Eksternal | Jenis | Peran / Deskripsi |
| :---: | :--- | :---: | :--- |
| **1** | **Digit ERP (Sistem Hulu)** | Sistem Luar | Database ERP eksternal penyedia data transaksi hulu percetakan. |
| **2** | **Bot Telegram SINTAK** | Kanal Mobile | Aplikasi bot interaktif untuk staf & operator lapangan. |
| **3** | **Google Spreadsheet (Cloud)** | Layanan Cloud | Lembar kerja cloud `DATABASE_REPORT` log tugas teknis divisi. |
| **4** | **Operator Mesin & Produksi** | Aktor Manusia | Staf lapangan operator cetak (Offset/Web), potong, laminasi, binding, dsb. |
| **5** | **Estimator & Marketing** | Aktor Manusia | Bagian kalkulasi biaya cetak, simulasi oplah, & penawaran klien. |
| **6** | **Admin Produksi & Kasi** | Aktor Manusia | Perencana antrean mesin (SOPd), master target jam, & pengawas disiplin. |
| **7** | **Keuangan & Akuntansi** | Aktor Manusia | Pengelola jurnal penyesuaian, bagan akun (COA), kas, & neraca. |
| **8** | **HRD & Super Admin IT** | Aktor Manusia | Manajemen kepegawaian, konfigurasi hak akses (RBAC), approval bot, & audit log. |

---

### 2.2 Kamus Aliran Data Masuk & Keluar (Inflow / Outflow)

```
       [1. Digit ERP]                  [2. Bot Telegram]              [3. Google Sheets]
         ↓ Data Scraping                  ↓ Realisasi Shift               ↓ Live Sync CSV
         ↑ Request Sync                   ↑ Alert & Konfirmasi            ↑ Export / Status
                   \                              |                              /
                    \                             |                             /
  [4. Operator] ----→ \                     [  0.0 SINTAK  ]                 / ←---- [5. Estimator]
    ↓ Input JHP        \                    [Core Processing]               /          ↓ Hitung HPP
    ↑ Antrean SOPd      -----------------→  [    Engine     ]  ←------------          ↑ Matriks Harga
                       /                          |                          \
                      /                           |                           \
                     /                            |                            \
         ↓ Jadwal SOPd                            ↓ Jurnal Penyesuaian         ↓ Upload Pegawai
         ↑ Dashboard Prod                         ↑ Lap. Kas & Neraca          ↑ Audit Trail
    [6. Admin / Kasi]                   [7. Keuangan / Akunting]           [8. HRD & Admin IT]
```

#### Rincian Data Masuk (Inflow ke SINTAK):
1. **Dari Digit ERP**: Data transaksi pembelian (`PR`, `SPPH`, `SPH In`, `PO`, `PB`, `Hutang`), penjualan (`SPH Out`, `SO`, `Laporan Penjualan`, `SJ`, `Piutang`), dan manufaktur (`BOM`, `orders SPK`, `Bahan Baku`, `Barang Jadi`).
2. **Dari Bot Telegram**: Rekaman realisasi kerja operator shift, target pekerjaan per jam/shift, registrasi akun bot.
3. **Dari Google Spreadsheet**: Sinkronisasi baris data CSV riil dari spreadsheet `DATABASE_REPORT` teknis divisi.
4. **Dari Operator Mesin**: Input Jurnal Harian Produksi (nomor order, jam mulai-selesai, kuantitas hasil cetak, lembar afdrul/rusak, kendala mesin).
5. **Dari Estimator & Marketing**: Parameter order cetak (oplah, ukuran kertas, jenis gramatur, jilid/finishing, markup keuntungan).
6. **Dari Admin Produksi & Kasi**: Jadwal antrean pekerjaan mesin (`SOPd`), standar target output per mesin/shift (`master_pekerjaan`), pencatatan kelalaian staf (`infractions`).
7. **Dari Keuangan & Akuntansi**: Input transaksi jurnal penyesuaian pembukuan dan pembaruan nomor rekening perkiraan (`rek_akuntansi`).
8. **Dari HRD & Super Admin IT**: Berkas Excel impor master data staf (`employees`), konfigurasi perizinan role pengguna (`app_roles`), approval user telegram, dan pemeliharaan sistem.

#### Rincian Informasi Keluar (Outflow dari SINTAK):
1. **Ke Digit ERP**: Token sesi scraper, parameter filter periode cut-off scraping.
2. **Ke Bot Telegram**: Konfirmasi keberhasilan simpan realisasi, notifikasi kelalaian kerja (SP/Infraction), peringatan mesin rusak/idle.
3. **Ke Google Spreadsheet**: Umpan balik status pengerjaan tugas teknis.
4. **Ke Operator Mesin**: Tampilan layar antrean kerja harian (`SOPd`), standar kuantitas target yang wajib dicapai per jam.
5. **Ke Estimator & Marketing**: Nilai HPP per eksemplar, simulasi matriks harga jual berjenjang, riwayat harga pembelian bahan baku nyata (*Rekap Lookup*).
6. **Ke Admin Produksi & Kasi**: `Dashboard Produksi`, analisa deviasi realisasi vs target SPK, rekapitulasi lembar rusak (afdrul).
7. **Ke Keuangan & Akuntansi**: `Dashboard Akuntansi` (grafik tren Debet vs Kredit), ringkasan kas masuk/keluar, visualisasi laporan keuangan.
8. **Ke HRD & Super Admin IT**: `Dashboard HRD` (analisa tren poin kesalahan per divisi/bulan), tabel audit trail riwayat perubahan data (`activity_logs`).

---

## 3. DFD LEVEL 1: DEKOMPOSISI SUB-PROSES & DATA STORE

Pada DFD Level 1, sistem SINTAK didekomposisi menjadi **5 Sub-Proses Utama**, **9 Data Store (D1 – D9)**, dan **1 Sub-Proses Audit Rekonsiliasi**:

### 3.1 Sub-Proses Utama (Level 1)
1. **Proses 1.0: Manajemen Pengadaan & Inventori**
   - Menangani siklus pembelian bahan baku percetakan (kertas, plat CTP, tinta, lem, plastik cover).
   - Menyimpan ke Data Store **D1** (`purchase_*`, `spph_*`, `sph_*`, `penerimaan_pembelian`, `rekap_pembelian_barang`, `pelunasan_hutang`) dan **D2** (`stok_master_barang`).
2. **Proses 2.0: Manajemen Penjualan & Piutang**
   - Menangani siklus pesanan pelanggan dari penawaran harga hingga penagihan.
   - Menyimpan ke Data Store **D3** (`sph_out`, `sales_orders`, `sales_reports`, `pengiriman`, `pelunasan_piutang`).
3. **Proses 3.0: Operasional Manufaktur Percetakan (JHP & SOPd)**
   - Jantung operasional lantai pabrik: menghubungkan SPK dari Digit dengan antrean mesin (`SOPd`), target per jam (`master_pekerjaan`), dan realisasi riil operator (`jurnal_harian_produksi`).
   - Menyimpan ke Data Store **D4** (`bill_of_materials`, `orders`, `bahan_baku`, `barang_jadi`, `produksi_selesai`) dan **D5** (`sopd`, `sopd_harga`, `jurnal_harian_produksi`, `master_pekerjaan`).
4. **Proses 4.0: Kalkulasi Biaya, Pricelist & Laporan Pekerjaan**
   - Menangani estimasi harga cetak 20+ kategori buku/kemasan dan sinkronisasi log tugas teknis Google Sheets.
   - Menyimpan ke Data Store **D6** (`laporan_pekerjaan`) dan **D7** (`hpp_kalkulasi`, `saved_calculations`, `global_master_params`).
5. **Proses 5.0: Akuntansi, SDM & Tata Kelola Sistem**
   - Menangani akuntansi pembukuan umum, manajemen 154 staf percetakan, penegakan SOP kerja, serta RBAC pengguna.
   - Menyimpan ke Data Store **D8** (`rek_akuntansi`, `jurnal_umum`) dan **D9** (`employees`, `infractions`, `users`, `app_roles`, `telegram_users`, `activity_logs`).

---

### 3.2 Katalog Data Store (Penyimpanan Data D1 – D9)

| Kode | Nama Data Store | Tabel-Tabel Terkait di Database SQLite | Volume Data Riil |
| :---: | :--- | :--- | :---: |
| **D1** | **Data Pengadaan Digit** | `purchase_requests`, `spph_out`, `sph_in`, `purchase_orders`, `penerimaan_pembelian`, `rekap_pembelian_barang`, `pelunasan_hutang` | ~44.500 baris |
| **D2** | **Data Master Stok** | `stok_master_barang` | 12.958 baris |
| **D3** | **Data Penjualan Digit** | `sph_out`, `sales_orders`, `sales_reports`, `pengiriman`, `pelunasan_piutang` | ~21.800 baris |
| **D4** | **Data Produksi Digit** | `bill_of_materials`, `orders`, `bahan_baku`, `barang_jadi`, `produksi_selesai` | ~35.700 baris |
| **D5** | **Data Operasional SINTAK** | `sopd`, `sopd_harga`, `jurnal_harian_produksi`, `master_pekerjaan` | ~200.000 baris |
| **D6** | **Data Laporan Pekerjaan** | `laporan_pekerjaan` | 5.194 baris |
| **D7** | **Data Kalkulasi & HPP** | `hpp_kalkulasi`, `saved_calculations`, `global_master_params` | ~2.500 baris |
| **D8** | **Data Akuntansi (COA & Jurnal)** | `rek_akuntansi`, `jurnal_umum` | 100.603 baris |
| **D9** | **Data SDM, Hak Akses & Audit** | `employees`, `infractions`, `users`, `app_roles`, `telegram_users`, `activity_logs` | ~17.500 baris |

---

### 3.3 Sub-Proses Khusus: 6.0 Engine Rekonsiliasi & Pelacakan Manufaktur
Sub-proses **6.0** adalah engine audit rekonsiliasi yang mengonsolidasikan data secara horizontal dari 3 pilar:
- Aliran Pengadaan (**D1**)
- Aliran Penjualan (**D3**)
- Aliran Manufaktur (**D4 & D5**)

Pengguna cukup memasukkan 1 nomor dokumen acuan (Faktur BOM / SPK / PO / PB / SO), lalu engine ini merekonstruksi riwayat siklus hidup dokumen secara terpadu tanpa mengharuskan pengguna membuka puluhan menu terpisah.

---

## 4. AKSES FILE DIAGRAM ASLI (DRAW.IO)
Diagram grafis resmi untuk dokumen ini tersimpan di:
- **Lokal Proyek**: `D:\Projects\sintak_pt_buya_barokah\sintak-dfd.drawio`
- **Desktop Komputer**: `C:\Users\nauval\Desktop\sintak-dfd.drawio`

File tersebut memiliki **2 Tab Halaman (Multi-Page)** yang dapat langsung dibuka dan diedit di aplikasi Draw.io Desktop:
- **Halaman 1**: `DFD Level 0 - Diagram Konteks`
- **Halaman 2**: `DFD Level 1 - Rincian Sub-Proses & Data Store`
