<?xml version="1.0" encoding="utf-8"?>
<map version="1.0.1">
  <node ID="ID_1" TEXT="SINTAK - PT. BUYA BAROKAH (Sistem Informasi &amp; Manajemen Terpadu Divisi Percetakan)" COLOR="#0f172a">
    <font NAME="SansSerif" BOLD="true" SIZE="16"/>
    <icon BUILTIN="bookmark"/>
    <node ID="ID_2" TEXT="1. DATA DIGIT (INTEGRASI ERP DIGIT)" POSITION="right" COLOR="#0284c7">
      <edge COLOR="#0284c7" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="folder"/>
      <node ID="ID_3" TEXT="Sinkronisasi All Data">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="refresh"/>
        <node ID="ID_4" TEXT="Modul sinkronisasi batch/terjadwal mengambil data dari ERP Digit"/>
        <node ID="ID_5" TEXT="Scraper Period Selector: Penarikan data per rentang bulan/tahun"/>
        <node ID="ID_6" TEXT="Dual-tier Persistence: Caching lokal + auto-merge ke database SQLite"/>
      </node>
      <node ID="ID_7" TEXT="Modul Stok">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="box"/>
        <node ID="ID_8" TEXT="Master Barang (stok_master_barang)">
          <font NAME="SansSerif" BOLD="true"/>
          <node ID="ID_9" TEXT="Atribut: Kode Barang, Barcode, Nama Barang, Satuan, Kategori"/>
          <node ID="ID_10" TEXT="Informasi Finansial: Harga Beli Terakhir, Harga Pokok, Harga Jual"/>
          <node ID="ID_11" TEXT="Saldo Persediaan: Saldo Awal, Total Masuk, Total Keluar, Saldo Akhir"/>
        </node>
      </node>
      <node ID="ID_12" TEXT="Modul Pembelian (Procurement)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="cart"/>
        <node ID="ID_13" TEXT="Purchase Request / PR (purchase_requests): Permintaan pengadaan bahan dari bagian produksi/gudang"/>
        <node ID="ID_14" TEXT="Penawaran Harga Pengadaan">
          <font NAME="SansSerif" BOLD="true"/>
          <node ID="ID_15" TEXT="SPPH Keluar (spph_out): Surat Permintaan Penawaran Harga kepada vendor kertas/plat/tinta"/>
          <node ID="ID_16" TEXT="SPH Masuk (sph_in): Rekam surat penawaran harga masuk dari berbagai supplier untuk seleksi harga"/>
        </node>
        <node ID="ID_17" TEXT="Purchase Order / PO (purchase_orders): Penerbitan PO resmi ke supplier terpilih"/>
        <node ID="ID_18" TEXT="Penerimaan Barang (penerimaan_pembelian): Verifikasi fisik datang vs PO, pencatatan surat jalan vendor"/>
        <node ID="ID_19" TEXT="Laporan Rekap Pembelian (rekap_pembelian_barang): Akumulasi nilai dan volume belanja"/>
        <node ID="ID_20" TEXT="Pelunasan Hutang (pelunasan_hutang): Tracking jatuh tempo invoice supplier dan bukti bayar"/>
      </node>
      <node ID="ID_21" TEXT="Modul Produksi (Digit)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="package"/>
        <node ID="ID_22" TEXT="Bill of Material / BOM (bill_of_materials): Resep &amp; formula kebutuhan bahan per produk"/>
        <node ID="ID_23" TEXT="Order Produksi (orders): Surat perintah kerja (SPK) resmi lantai pabrik"/>
        <node ID="ID_24" TEXT="Produksi Selesai (produksi_selesai): Status penutupan order kerja yang tuntas diproduksi"/>
        <node ID="ID_25" TEXT="Laporan BBB Produksi (bahan_baku): Realisasi Biaya Bahan Baku aktual yang diserap"/>
        <node ID="ID_26" TEXT="Penerimaan Barang Jadi (barang_jadi): Serah terima fisik produk jadi ke gudang"/>
      </node>
      <node ID="ID_27" TEXT="Modul Penjualan (Sales &amp; Distribution)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="trending-up"/>
        <node ID="ID_28" TEXT="SPH Keluar (sph_out): Surat Penawaran Harga resmi kepada customer/klien"/>
        <node ID="ID_29" TEXT="Sales Order / SO (sales_orders): Pesanan pasti pelanggan dengan nomor faktur resmi"/>
        <node ID="ID_30" TEXT="Laporan Penjualan (sales_reports): Omzet, histori transaksi, performa sales"/>
        <node ID="ID_31" TEXT="Pengiriman / SJ (pengiriman): Manajemen pengiriman logistik &amp; Surat Jalan"/>
        <node ID="ID_32" TEXT="Pelunasan Piutang (pelunasan_piutang): Monitoring saldo piutang dan penerimaan kas/bank"/>
      </node>
      <node ID="ID_33" TEXT="Modul Akuntansi &amp; Keuangan (Digit)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="book"/>
        <node ID="ID_34" TEXT="Rek Akuntansi (rek_akuntansi): Master Bagan Akun (Chart of Accounts)"/>
        <node ID="ID_35" TEXT="Jurnal Umum (jurnal_umum): Pencatatan double-entry transaksi buku besar"/>
        <node ID="ID_36" TEXT="Analisis Jurnal: Verifikasi keseimbangan debit/kredit dan deteksi anomali"/>
      </node>
      <node ID="ID_37" TEXT="Modul Sistem (Digit)">
        <icon BUILTIN="info"/>
        <node ID="ID_38" TEXT="Log Aktivitas User (usr_log): Log audit jejak aktivitas sistem ERP Digit"/>
      </node>
    </node>
    <node ID="ID_39" TEXT="2. OPERASIONAL PRODUKSI &amp; LANTAI PABRIK" POSITION="right" COLOR="#d97706">
      <edge COLOR="#d97706" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="gears"/>
      <node ID="ID_40" TEXT="SOPd (Surat Order Produksi Digital)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="list"/>
        <node ID="ID_41" TEXT="Tabel: sopd &amp; sopd_harga"/>
        <node ID="ID_42" TEXT="Spesifikasi Pekerjaan: Ukuran potong, jenis bahan, jumlah oplah, jenis jilid/finishing"/>
        <node ID="ID_43" TEXT="Kalkulasi Nilai Order: Perkiraan harga, biaya produksi, target selesai"/>
        <node ID="ID_44" TEXT="Status Kontrol: Status pending produksi &amp; alasan pending (kendala plat, kertas kosong, approval)"/>
      </node>
      <node ID="ID_45" TEXT="Master Pekerjaan, Mesin &amp; Standar Target">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="database"/>
        <node ID="ID_46" TEXT="Tabel: master_pekerjaan &amp; master_pekerjaan_jurnal_produksi"/>
        <node ID="ID_47" TEXT="Kategori Mesin: Mesin Cetak Offset (Sheet-fed), Mesin Web, Digital Printing, Mesin Potong, Lipat, Lem, Binding"/>
        <node ID="ID_48" TEXT="Standar Setup &amp; Waktu: Persiapan mesin (menit), waktu ganti plate, waktu &amp; frekuensi gosok plate"/>
        <node ID="ID_49" TEXT="Target Standar Output: Target per jam, target per jam plate, target per hari, jam kerja efektif"/>
      </node>
      <node ID="ID_50" TEXT="Jurnal Harian Produksi (JHP)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="edit"/>
        <node ID="ID_51" TEXT="Tabel: jurnal_harian_produksi"/>
        <node ID="ID_52" TEXT="Penjadwalan &amp; Target Harian: Alokasi order kerja per mesin, operator, dan shift kerja"/>
        <node ID="ID_53" TEXT="Pencatatan Realisasi Lapangan: Jam mulai kerja, jam selesai, durasi aktual (efektif vs idle time)"/>
        <node ID="ID_54" TEXT="Hasil Cetak Aktual: Kuantitas lembar cetak berhasil vs sisa order yang belum tercetak"/>
        <node ID="ID_55" TEXT="Pencatatan Waste / Rusak: Lembar afdruk saat penyetelan mesin (waste setup) dan saat proses lari cetak (waste run)"/>
        <node ID="ID_56" TEXT="Analisa Kinerja Produksi: Komparasi Target Standar Mesin vs Output Nyata &amp; Efisiensi (%)"/>
      </node>
      <node ID="ID_57" TEXT="Pelaporan &amp; Monitoring Produksi">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="table"/>
        <node ID="ID_58" TEXT="Hasil Produksi: Rekap akumulatif output hasil jadi cetak per shift dan operator"/>
        <node ID="ID_59" TEXT="Laporan Pekerjaan (laporan_pekerjaan): Log pencatatan tugas per bagian kerja (Pracetak, Cetak, Finishing, QC)"/>
        <node ID="ID_60" TEXT="Tracking Manufaktur: Visual monitoring alur faktur/SPK dari pemesanan sampai siap kirim"/>
      </node>
    </node>
    <node ID="ID_61" TEXT="3. ESTIMATOR HARGA &amp; KALKULASI CETAK" POSITION="right" COLOR="#4f46e5">
      <edge COLOR="#4f46e5" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="calculator"/>
      <node ID="ID_62" TEXT="HPP Kalkulasi (hpp_kalkulasi)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="coins"/>
        <node ID="ID_63" TEXT="Perhitungan Harga Pokok Produksi riil berbasis formula bahan, mesin, tenaga kerja, &amp; margin"/>
        <node ID="ID_64" TEXT="Penyimpanan HPP per nama order untuk referensi pricing penawaran"/>
      </node>
      <node ID="ID_65" TEXT="Simulator Pricelist Produk Percetakan (20+ Kategori)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="idea"/>
        <node ID="ID_66" TEXT="Buku Soft Cover (Unified, Offset, Custom: rumus plano kertas isi, cover art carton, laminasi, jilid lem panas)"/>
        <node ID="ID_67" TEXT="Buku Hard Cover (Ukuran 21x29.7, 14.5x20.25, 10.5x14.8: board karton, finishing jilid jahit benang, pembatas)"/>
        <node ID="ID_68" TEXT="Buku Tabungan (Security Print dengan watermark/microtext/nomor seri &amp; Non-Security standar koperasi)"/>
        <node ID="ID_69" TEXT="Kartu Anggota &amp; Keuangan (Kartu Koperasi, Kartu Promise / Angsuran)"/>
        <node ID="ID_70" TEXT="Label Farmasi &amp; Medis (Lebel Kartu Obat, Label KHQ)"/>
        <node ID="ID_71" TEXT="Kebutuhan Lembaga &amp; Sekolah (Raport Kaleb isi mika/emboss emas, Stopmap, Syahadah/Ijazah, Piagam/Sertifikat, Kop Surat)"/>
        <node ID="ID_72" TEXT="Kemasan &amp; Wadah (Paperbag tali kur/kertas, Packaging Box dupleks/ivory, Amplop resmi/jendela, Stiker)"/>
        <node ID="ID_73" TEXT="Publikasi Massal (Majalah/Buletin, Brosur lipat 2/3, Poster A3+/A2, Kalender Kop dinding/meja, Nota/NCR 2-4 rangkap, Buku Tulis, Buku Manasik, Buku Yasin)"/>
      </node>
      <node ID="ID_74" TEXT="Parameter &amp; Rekap Matrix View">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="gear"/>
        <node ID="ID_75" TEXT="Global Master Parameters: Konfigurasi harga dasar plano kertas, plat cetak, ongkos potong, ongkos jilid"/>
        <node ID="ID_76" TEXT="Matrix Table Views: Grid perhitungan harga otomatis untuk variasi oplah (500, 1000, 2000, 5000 pcs)"/>
        <node ID="ID_77" TEXT="Saved Calculations (pricelist_saved_calculations): Manajemen draft simulasi kalkulasi tersimpan"/>
      </node>
    </node>
    <node ID="ID_78" TEXT="4. HRD, KEAMANAN SISTEM &amp; DASHBOARD" POSITION="right" COLOR="#059669">
      <edge COLOR="#059669" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="shield"/>
      <node ID="ID_79" TEXT="Manajemen HRD &amp; Kedisiplinan Karyawan">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="kaddressbook"/>
        <node ID="ID_80" TEXT="Data Karyawan (employees): NIP, Nama, Jabatan, Departemen, Status Aktif"/>
        <node ID="ID_81" TEXT="Catat Kesalahan Karyawan (infractions)">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="messagebox_warning"/>
          <node ID="ID_82" TEXT="Pencatatan insiden kelalaian produksi: Salah potong, salah pasang plat, cacat warna, pelanggaran SOP/K3"/>
          <node ID="ID_83" TEXT="Analisis Dampak: Estimasi kerugian bahan/biaya, kronologi, tindakan perbaikan, dan penetapan sanksi/SP"/>
        </node>
      </node>
      <node ID="ID_84" TEXT="Keamanan Pengguna &amp; Hak Akses (RBAC)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="password"/>
        <node ID="ID_85" TEXT="User Management (users): Pengelolaan akun, enkripsi password, assignment karyawan"/>
        <node ID="ID_86" TEXT="Role &amp; Permission Matrix (role_permissions): Hak akses berbasis modul (Super Admin, Produksi, HRD, Sales, Keuangan, dll.)"/>
        <node ID="ID_87" TEXT="Audit Trail (activity_logs): Catatan riwayat aksi (Create, Read, Update, Delete) oleh setiap pengguna"/>
      </node>
      <node ID="ID_88" TEXT="Dashboard Eksekutif &amp; Analitik Bisnis">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="chart"/>
        <node ID="ID_89" TEXT="Dashboard Umum: Ringkasan performa menyeluruh, KPI utama perusahaan, overview operasional"/>
        <node ID="ID_90" TEXT="Dashboard Manufaktur: Tren volume cetak bulanan, utilisasi mesin, monitoring antrean SPK"/>
        <node ID="ID_91" TEXT="Dashboard Akuntansi: Tren transaksi jurnal, pergerakan debit/kredit, analitik biaya operasional"/>
        <node ID="ID_92" TEXT="Dashboard HRD: Tren pelanggaran karyawan, statistik kesalahan per divisi, evaluasi kedisiplinan"/>
      </node>
      <node ID="ID_93" TEXT="Layanan Notifikasi &amp; Konversi Data">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="bell"/>
        <node ID="ID_94" TEXT="Telegram Bot Notification: Push pesan otomatis order baru, kendala produksi, kesalahan operator, rekap harian"/>
        <node ID="ID_95" TEXT="Web Push Notification: Notifikasi browser real-time untuk event penting"/>
        <node ID="ID_96" TEXT="Konversi &amp; Migrasi Data: Fasilitas import/export file Excel warisan (HPP, SOPd, Jurnal Harian Produksi, Laporan Pekerjaan)"/>
      </node>
    </node>
    <node ID="ID_97" TEXT="I. ALUR PROSES BISNIS END-TO-END (ORDER LIFECYCLE)" POSITION="left" COLOR="#dc2626">
      <edge COLOR="#dc2626" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="launch"/>
      <node ID="ID_98" TEXT="TAHAP 1: Pra-Cetak &amp; Penjualan (Inquiry -&gt; Sales Order)" COLOR="#b91c1c">
        <font NAME="SansSerif" BOLD="true" SIZE="12"/>
        <icon BUILTIN="1"/>
        <node ID="ID_99" TEXT="1.1 Pelanggan mengajukan permintaan cetak dengan spesifikasi (oplah, bahan, ukuran, finishing)"/>
        <node ID="ID_100" TEXT="1.2 Bagian Estimator membuka simulator Pricelist &amp; HPP Kalkulasi untuk menghitung kebutuhan biaya"/>
        <node ID="ID_101" TEXT="1.3 Sistem menghitung biaya kertas (plano), ongkos plat, cetak, finishing, overhead, dan margin"/>
        <node ID="ID_102" TEXT="1.4 Tim Sales menerbitkan SPH Keluar (Surat Penawaran Harga) kepada pelanggan"/>
        <node ID="ID_103" TEXT="1.5 Negosiasi &amp; Kesepakatan -&gt; Pelanggan menerbitkan PO -&gt; Sales menerbitkan Sales Order (SO) resmi"/>
      </node>
      <node ID="ID_104" TEXT="TAHAP 2: Perencanaan &amp; Pengadaan (SO -&gt; Bahan Baku Masuk)" COLOR="#c2410c">
        <font NAME="SansSerif" BOLD="true" SIZE="12"/>
        <icon BUILTIN="2"/>
        <node ID="ID_105" TEXT="2.1 SO diturunkan menjadi SOPd (Surat Order Produksi Digital) &amp; BOM (Bill of Material)"/>
        <node ID="ID_106" TEXT="2.2 Sistem memeriksa ketersediaan stok kertas, plat, dan tinta di Master Barang Gudang"/>
        <node ID="ID_107" TEXT="2.3 Jika stok kurang, Divisi Produksi mengajukan Purchase Request (PR)"/>
        <node ID="ID_108" TEXT="2.4 Divisi Pembelian mengirim SPPH Keluar ke vendor dan menerima SPH Masuk untuk komparasi harga"/>
        <node ID="ID_109" TEXT="2.5 Tim Pembelian menerbitkan Purchase Order (PO) kepada supplier terpilih"/>
        <node ID="ID_110" TEXT="2.6 Supplier mengirim bahan -&gt; Petugas melakukan verifikasi Penerimaan Barang -&gt; Stok gudang bertambah"/>
        <node ID="ID_111" TEXT="2.7 Divisi Keuangan mencatat invoice dan memproses Pelunasan Hutang ke supplier"/>
      </node>
      <node ID="ID_112" TEXT="TAHAP 3: Eksekusi Produksi Percetakan (Shop Floor)" COLOR="#d97706">
        <font NAME="SansSerif" BOLD="true" SIZE="12"/>
        <icon BUILTIN="3"/>
        <node ID="ID_113" TEXT="3.1 Kepala Produksi menjadwalkan SPK pada Jurnal Harian Produksi (JHP - Target Harian)"/>
        <node ID="ID_114" TEXT="3.2 Penugasan unit mesin (Offset/Web/Digital) dan penetapan operator shift kerja"/>
        <node ID="ID_115" TEXT="3.3 Persiapan Mesin: Setting ukuran kertas, pasang plat cetak, gosok plat, dan penyetelan tinta"/>
        <node ID="ID_116" TEXT="3.4 Running Cetak: Mesin berjalan memproduksi pesanan sesuai target per jam"/>
        <node ID="ID_117" TEXT="3.5 Operator mencatat realisasi di JHP: Jam mulai, jam selesai, output cetak, dan sisa lembar order"/>
        <node ID="ID_118" TEXT="3.6 Pencatatan Afdruk/Waste: Jumlah lembar rusak saat setup dan running dicatat secara teliti"/>
      </node>
      <node ID="ID_119" TEXT="TAHAP 4: Quality Control &amp; Penanganan Kesalahan (QC &amp; HRD)" COLOR="#059669">
        <font NAME="SansSerif" BOLD="true" SIZE="12"/>
        <icon BUILTIN="4"/>
        <node ID="ID_120" TEXT="4.1 Bagian Quality Control (QC) memeriksa kesesuaian cetak (registrasi warna, ketajaman teks, kotoran)"/>
        <node ID="ID_121" TEXT="4.2 Jika ditemukan cacat fatal akibat kelalaian kerja (salah potong, salah plat, warna belang):"/>
        <node ID="ID_122" TEXT="     -&gt; Dicatat langsung pada modul Catat Kesalahan Karyawan (Infractions)"/>
        <node ID="ID_123" TEXT="     -&gt; Menghitung estimasi kerugian bahan &amp; menentukan sanksi/tindakan korektif"/>
        <node ID="ID_124" TEXT="4.3 Seluruh aktivitas shift dilaporkan dalam modul Laporan Pekerjaan per bagian"/>
        <node ID="ID_125" TEXT="4.4 Manajemen memantau seluruh progres secara langsung melalui Tracking Manufaktur"/>
      </node>
      <node ID="ID_126" TEXT="TAHAP 5: Finishing Pasca Cetak &amp; Gudang Jadi" COLOR="#2563eb">
        <font NAME="SansSerif" BOLD="true" SIZE="12"/>
        <icon BUILTIN="5"/>
        <node ID="ID_127" TEXT="5.1 Lembar cetak dipindahkan ke divisi Finishing (Potong sisir, Lipat, Laminasi doff/glossy, Foil, Lem, Jahit/Binding)"/>
        <node ID="ID_128" TEXT="5.2 Pengecekan produk jadi akhir &amp; pengepakan (wrapping plastik, strapping, atau packing kardus)"/>
        <node ID="ID_129" TEXT="5.3 Update status menjadi Produksi Selesai pada sistem SINTAK dan sinkronisasi ke ERP Digit"/>
        <node ID="ID_130" TEXT="5.4 Serah terima fisik barang jadi ke Gudang Barang Jadi (Penerimaan Barang Hasil Produksi)"/>
      </node>
      <node ID="ID_131" TEXT="TAHAP 6: Logistik, Pengiriman &amp; Penagihan (Logistics &amp; Sales)" COLOR="#4f46e5">
        <font NAME="SansSerif" BOLD="true" SIZE="12"/>
        <icon BUILTIN="6"/>
        <node ID="ID_132" TEXT="6.1 Bagian Logistik menyiapkan armada pengiriman dan menerbitkan Surat Jalan (SJ / Pengiriman)"/>
        <node ID="ID_133" TEXT="6.2 Ekspedisi mengantar pesanan ke alamat pelanggan dan meminta tanda tangan bukti serah terima"/>
        <node ID="ID_134" TEXT="6.3 Finance menerbitkan Faktur Penjualan (Sales Report) dan mencatat Piutang Usaha"/>
        <node ID="ID_135" TEXT="6.4 Pelanggan melakukan pembayaran kas/transfer -&gt; Finance mencatat Pelunasan Piutang"/>
      </node>
      <node ID="ID_136" TEXT="TAHAP 7: Akuntansi, Evaluasi Bisnis &amp; Reporting" COLOR="#7c3aed">
        <font NAME="SansSerif" BOLD="true" SIZE="12"/>
        <icon BUILTIN="7"/>
        <node ID="ID_137" TEXT="7.1 Seluruh mutasi kas, persediaan, pendapatan, dan beban tercatat di Jurnal Umum &amp; Rek Akuntansi"/>
        <node ID="ID_138" TEXT="7.2 Modul Analisa Produksi mengukur efisiensi mesin (Output Riil vs Target Standar Mesin)"/>
        <node ID="ID_139" TEXT="7.3 Telegram Bot otomatis menyiarkan notifikasi ringkasan produksi dan laporan penting ke grup manajemen"/>
        <node ID="ID_140" TEXT="7.4 Direksi dan Manajer memantau kinerja operasional, tren finansial, dan KPI SDM melalui 4 Dashboard Utama"/>
      </node>
    </node>
    <node ID="ID_141" TEXT="II. ARSITEKTUR TEKNOLOGI &amp; ARSITEKTUR DATA" POSITION="left" COLOR="#475569">
      <edge COLOR="#475569" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="desktop"/>
      <node ID="ID_142" TEXT="Frontend Layer (User Interface)">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_143" TEXT="Next.js 14 App Router, React 18, Tailwind CSS, Lucide React Icons"/>
        <node ID="ID_144" TEXT="Komponen Modular: DataTable, Modal Framework, SearchableDropdown, ThousandInput, DatePicker"/>
      </node>
      <node ID="ID_145" TEXT="Backend &amp; API Service Layer">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_146" TEXT="Next.js API Route Handlers (Serverless/Node.js runtime)"/>
        <node ID="ID_147" TEXT="RBAC Permissions Guard Middleware &amp; Secure Session Management"/>
      </node>
      <node ID="ID_148" TEXT="Database &amp; Storage Layer">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_149" TEXT="SQLite Engine: Mode WAL (Write-Ahead Logging), 64MB Cache, 256MB MMAP"/>
        <node ID="ID_150" TEXT="Indeksasi Tingkat Tinggi &amp; FTS (Full-Text Search) untuk jutaan data"/>
        <node ID="ID_151" TEXT="Batch Migration Safe: Auto-migration skema database tanpa kehilangan data lama"/>
      </node>
      <node ID="ID_152" TEXT="Integrasi Eksternal &amp; Layanan Otomatis">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_153" TEXT="Scraper Engine ERP Digit: Sinkronisasi data otomatis dengan throttling &amp; retry mechanism"/>
        <node ID="ID_154" TEXT="Telegram Bot API: Interactive bot handlers &amp; broadcast push notification"/>
        <node ID="ID_155" TEXT="Web Push Notification: VAPID push notification ke browser karyawan"/>
        <node ID="ID_156" TEXT="Excel Engine: Integrasi spreadsheet dua arah (import/export XLSX/CSV)"/>
      </node>
    </node>
  </node>
</map>
