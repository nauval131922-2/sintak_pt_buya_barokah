<?xml version="1.0" encoding="utf-8"?>
<map version="1.0.1">
  <node ID="ID_1" TEXT="SINTAK - PETA ALUR &amp; PANDUAN PENGGUNAAN SISTEM (END-TO-END WORKFLOW)" COLOR="#0f172a">
    <font NAME="SansSerif" BOLD="true" SIZE="16"/>
    <icon BUILTIN="bookmark"/>
    <node ID="ID_2" TEXT="1. LOGIN &amp; NAVIGASI MENU (PINTU MASUK SISTEM)" POSITION="right" COLOR="#0f766e">
      <edge COLOR="#0f766e" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="password"/>
      <node ID="ID_3" TEXT="Halaman Login (/login)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="key"/>
        <node ID="ID_4" TEXT="📌 FUNGSI: Gerbang autentikasi pengguna masuk ke sistem SINTAK PT Buya Barokah" COLOR="#1e293b">
          <font NAME="SansSerif" ITALIC="true"/>
        </node>
        <node ID="ID_5" TEXT="📥 DARI MANA ASAL DATANYA:" COLOR="#0369a1">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="forward"/>
          <node ID="ID_6" TEXT="Database tabel `users`: Username, Password Hash (bcrypt), Role, Is Active, dan Employee ID"/>
        </node>
        <node ID="ID_7" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (STEP-BY-STEP):" COLOR="#b45309">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="edit"/>
          <node ID="ID_8" TEXT="1. Masukkan Username dan Password terdaftar"/>
          <node ID="ID_9" TEXT="2. Klik tombol 'Masuk' / Login"/>
          <node ID="ID_10" TEXT="3. Sistem memverifikasi kredensial dan membuat HTTP-only secure cookie session"/>
          <node ID="ID_11" TEXT="4. Sistem membaca hak akses RBAC (Role-Based Access Control) pengguna"/>
          <node ID="ID_12" TEXT="5. Redirection otomatis ke Dashboard yang sesuai dengan wewenang jabatan"/>
        </node>
        <node ID="ID_13" TEXT="📤 ALUR DATA BERLANJUT KE MANA (NEXT DESTINATION):" COLOR="#15803d">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="launch"/>
          <node ID="ID_14" TEXT="Super Admin -&gt; Akses seluruh modul (Dashboard, Data Digit, Produksi, Kalkulasi, HRD, Akuntansi, Settings)"/>
          <node ID="ID_15" TEXT="Divisi Produksi -&gt; Menu Produksi (SOPd, JHP, Target, Hasil Produksi, Laporan Pekerjaan, Tracking)"/>
          <node ID="ID_16" TEXT="Divisi HRD -&gt; Menu HRD (Data Karyawan, Catat Kesalahan/Infractions, Dashboard HRD)"/>
          <node ID="ID_17" TEXT="Divisi Estimator/Sales -&gt; Menu Kalkulasi (Pricelist Simulator, HPP, Rekap SO, Penjualan)"/>
          <node ID="ID_18" TEXT="Divisi Keuangan -&gt; Menu Akuntansi (Rek Akuntansi, Jurnal Umum, Pelunasan Hutang/Piutang, Dashboard Akunting)"/>
          <node ID="ID_19" TEXT="Divisi Pengadaan/Gudang -&gt; Menu Stok Master Barang &amp; Pembelian (PR, SPPH, PO, Penerimaan Barang)"/>
        </node>
      </node>
      <node ID="ID_20" TEXT="Struktur Sidebar Menu Sesuai Role">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="list"/>
        <node ID="ID_21" TEXT="Group DASHBOARD: Dashboard Umum, Dashboard HRD, Dashboard Produksi, Dashboard Akuntansi"/>
        <node ID="ID_22" TEXT="Group DATA DIGIT: Sinkronisasi All Data, Stok, Pembelian, Produksi Digit, Penjualan Digit, Akuntansi Digit, Sistem"/>
        <node ID="ID_23" TEXT="Group SISTEM - UMUM: Tracking Manufaktur, Log Aktivitas"/>
        <node ID="ID_24" TEXT="Group SISTEM - HRD: Data Karyawan, Catat Kesalahan Karyawan"/>
        <node ID="ID_25" TEXT="Group SISTEM - KALKULASI: HPP Kalkulasi, Pricelist (Simulasi 20+ Produk)"/>
        <node ID="ID_26" TEXT="Group SISTEM - PRODUKSI: SOPd, Master Pekerjaan, Jurnal Harian Produksi (JHP), Target, Analisa, Hasil Produksi, Laporan Pekerjaan"/>
        <node ID="ID_27" TEXT="Group SISTEM - SETTINGS &amp; USER: Hak Akses (Roles), Kelola User, Telegram Users, Konversi Data"/>
      </node>
    </node>
    <node ID="ID_28" TEXT="2. ALUR OPERASIONAL PRODUKSI &amp; LANTAI PABRIK (DETIL CARA PAKAI)" POSITION="right" COLOR="#b45309">
      <edge COLOR="#b45309" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="gears"/>
      <node ID="ID_29" TEXT="Menu: SOPd (/jurnal-harian-produksi/data/excel-sopd)">
        <font NAME="SansSerif" BOLD="true" SIZE="11"/>
        <icon BUILTIN="table"/>
        <node ID="ID_30" TEXT="📌 FUNGSI: Melihat, mengontrol, dan melengkapi data Surat Order Produksi Digital (SOPd) yang menjadi dasar perintah cetak." COLOR="#1e293b">
          <font NAME="SansSerif" ITALIC="true"/>
        </node>
        <node ID="ID_31" TEXT="📥 DARI MANA ASAL DATANYA:" COLOR="#0369a1">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="forward"/>
          <node ID="ID_32" TEXT="Hasil Sinkronisasi Data Digit (modul /sync) dari ERP Digit"/>
          <node ID="ID_33" TEXT="Upload file Excel manual via menu Konversi Data / Import SOPd"/>
        </node>
        <node ID="ID_34" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (STEP-BY-STEP):" COLOR="#b45309">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="edit"/>
          <node ID="ID_35" TEXT="1. Pilih rentang tanggal order (Start Date &amp; End Date) di bagian atas untuk memuat data"/>
          <node ID="ID_36" TEXT="2. Gunakan kolom pencarian cepat untuk mencari nomor SOPd atau nama order"/>
          <node ID="ID_37" TEXT="3. Filter status produksi: Pilih 'Semua', 'Sudah Selesai', atau 'Belum Selesai'"/>
          <node ID="ID_38" TEXT="4. Edit Inline Nilai: Klik 2x pada cell 'Perkiraan Harga', 'Deadline', atau 'Keterangan' untuk mengedit langsung tanpa buka form baru"/>
          <node ID="ID_39" TEXT="5. Fitur Copy-Paste Cell: Klik ikon copy pada cell untuk menyalin nilai, lalu klik cell lain untuk paste massal"/>
          <node ID="ID_40" TEXT="6. Kontrol Status Pending: Centang checkbox 'Pending Produksi' jika order terhambat, lalu isi kolom 'Alasan Pending' (contoh: 'Menunggu Plat', 'Kertas Kosong', 'ACC Warna')"/>
        </node>
        <node ID="ID_41" TEXT="📤 ALUR DATA BERLANJUT KE MANA (NEXT DESTINATION):" COLOR="#15803d">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="launch"/>
          <node ID="ID_42" TEXT="-&gt; Mengalir ke Halaman 'Jurnal Harian Produksi' (/jurnal-harian-produksi): No SOPd dan Nama Order muncul sebagai pilihan saat Kepala Produksi membuat jadwal kerja"/>
          <node ID="ID_43" TEXT="-&gt; Mengalir ke Halaman 'Tracking Manufaktur' (/tracking-manufaktur): Status pending/aktif terbaca real-time oleh tim sales &amp; CS"/>
          <node ID="ID_44" TEXT="-&gt; Menjadi acuan kuantitas oplah di modul 'Hasil Produksi' (/hasil-produksi)"/>
        </node>
      </node>
      <node ID="ID_45" TEXT="Menu: Master Pekerjaan &amp; Mesin (/jurnal-harian-produksi/data/master-pekerjaan)">
        <font NAME="SansSerif" BOLD="true" SIZE="11"/>
        <icon BUILTIN="database"/>
        <node ID="ID_46" TEXT="📌 FUNGSI: Mengatur database mesin cetak/finishing dan standar target kinerja (waktu setup, ganti plat, gosok plat, target per jam/hari)." COLOR="#1e293b">
          <font NAME="SansSerif" ITALIC="true"/>
        </node>
        <node ID="ID_47" TEXT="📥 DARI MANA ASAL DATANYA:" COLOR="#0369a1">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="forward"/>
          <node ID="ID_48" TEXT="Input konfigurasi teknis oleh Kepala Produksi / Tim Engineering Pabrik"/>
        </node>
        <node ID="ID_49" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (STEP-BY-STEP):" COLOR="#b45309">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="edit"/>
          <node ID="ID_50" TEXT="1. Klik tombol 'Tambah Master Pekerjaan' untuk mendaftarkan unit mesin baru atau jenis pekerjaan baru"/>
          <node ID="ID_51" TEXT="2. Masukkan Kode &amp; Nama Pekerjaan/Mesin (misal: 'SM-52 Heidelberg', 'Mesin Potong Polar 115', 'Lipat MBO')"/>
          <node ID="ID_52" TEXT="3. Tentukan Bagian/Kategori (CETAK, FINISHING, SETTING, dll.)"/>
          <node ID="ID_53" TEXT="4. Tentukan Standar Waktu: Waktu persiapan mesin (menit), waktu ganti plat, waktu dan jumlah gosok plat"/>
          <node ID="ID_54" TEXT="5. Tentukan Standar Target: Target per jam (lembar cetak/jam) dan target harian (lembar/hari)"/>
          <node ID="ID_55" TEXT="6. Klik 'Simpan'"/>
        </node>
        <node ID="ID_56" TEXT="📤 ALUR DATA BERLANJUT KE MANA (NEXT DESTINATION):" COLOR="#15803d">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="launch"/>
          <node ID="ID_57" TEXT="-&gt; Mengalir ke Halaman 'Jurnal Harian Produksi': Menjadi parameter acuan saat input jadwal &amp; jenis pekerjaan"/>
          <node ID="ID_58" TEXT="-&gt; Mengalir ke Modul 'Analisa Produksi' (/jurnal-harian-produksi/analisa): Menjadi pembagi (denominator) dalam menghitung efisiensi (Realisasi Aktual vs Target Standar)"/>
        </node>
      </node>
      <node ID="ID_59" TEXT="Menu: Jurnal Harian Produksi (/jurnal-harian-produksi) [INTI OPERASIONAL]" COLOR="#b91c1c">
        <font NAME="SansSerif" BOLD="true" SIZE="12"/>
        <icon BUILTIN="edit"/>
        <node ID="ID_60" TEXT="📌 FUNGSI: Halaman kerja harian utama tempat Kepala Produksi menjadwalkan target dan operator menginput hasil realisasi kerja shift harian." COLOR="#1e293b">
          <font NAME="SansSerif" ITALIC="true"/>
        </node>
        <node ID="ID_61" TEXT="📥 DARI MANA ASAL DATANYA:" COLOR="#0369a1">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="forward"/>
          <node ID="ID_62" TEXT="Daftar Order dari SOPd (`sopd` &amp; `sopd_harga`)"/>
          <node ID="ID_63" TEXT="Daftar Mesin dari Master Pekerjaan (`master_pekerjaan`)"/>
          <node ID="ID_64" TEXT="Daftar Operator dari Master Karyawan (`employees`)"/>
        </node>
        <node ID="ID_65" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (STEP-BY-STEP):" COLOR="#b45309">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="edit"/>
          <node ID="ID_66" TEXT="LANGKAH 1 (FILTER AKTIVITAS): Pilih Tanggal Kerja, pilih Bagian (CETAK / FINISHING / SETTING / dll.), dan pilih Nama Operator"/>
          <node ID="ID_67" TEXT="LANGKAH 2 (PENJADWALAN / TARGET): Klik tombol 'Tambah Jadwal' atau klik 'Copy Jadwal' (untuk menyalin susunan shift kemarin ke hari ini secara instan). Isi No Order/SOPd, Mesin, Shift (1/2/3), dan Target Lembar"/>
          <node ID="ID_68" TEXT="LANGKAH 3 (REALISASI KERJA): Operator mengisi Jam Mulai &amp; Jam Selesai kerja, Absensi, serta jumlah Output Lembar Cetak yang berhasil diselesaikan"/>
          <node ID="ID_69" TEXT="LANGKAH 4 (CATAT AFDRUK / WASTE): Masukkan jumlah lembar rusak/afdruk di kolom Rijek (afdruk setup vs afdruk running)"/>
          <node ID="ID_70" TEXT="LANGKAH 5 (EVALUASI OTOMATIS): Sistem menghitung rumus matematika otomatis jika diinput di cell (misal '3000-150'), dan menampilkan sisa order yang belum selesai"/>
          <node ID="ID_71" TEXT="LANGKAH 6 (CATAT KENDALA): Klik 2x pada cell Keterangan jika ada kendala di mesin (misal: 'Roll panas', 'Ganti blangket', 'Mati lampu')"/>
        </node>
        <node ID="ID_72" TEXT="📤 ALUR DATA BERLANJUT KE MANA (NEXT DESTINATION):" COLOR="#15803d">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="launch"/>
          <node ID="ID_73" TEXT="-&gt; Mengalir ke Menu 'Target Harian' (/jurnal-harian-produksi/target): Menampilkan status pencapaian target harian pabrik"/>
          <node ID="ID_74" TEXT="-&gt; Mengalir ke Menu 'Analisa Produksi' (/jurnal-harian-produksi/analisa): Menghitung persentase efisiensi (Output Riil / Target Standar Mesin)"/>
          <node ID="ID_75" TEXT="-&gt; Mengalir ke Menu 'Hasil Produksi' (/hasil-produksi): Akumulasi barang jadi yang siap diserahterimakan"/>
          <node ID="ID_76" TEXT="-&gt; Mengalir ke Modul 'Catat Kesalahan Karyawan' (/records): Jika terjadi reject fatal akibat kelalaian operator"/>
          <node ID="ID_77" TEXT="-&gt; Mengalir ke Modul 'Tracking Manufaktur' (/tracking-manufaktur): Update posisi pengerjaan order pelanggan"/>
        </node>
      </node>
      <node ID="ID_78" TEXT="Menu: Target Harian &amp; Analisa Produksi (/target &amp; /analisa)">
        <font NAME="SansSerif" BOLD="true" SIZE="11"/>
        <icon BUILTIN="chart"/>
        <node ID="ID_79" TEXT="📌 FUNGSI: Memonitor pencapaian target harian per mesin/shift dan menganalisis efisiensi kapasitas pabrik." COLOR="#1e293b">
          <font NAME="SansSerif" ITALIC="true"/>
        </node>
        <node ID="ID_80" TEXT="📥 DARI MANA ASAL DATANYA:" COLOR="#0369a1">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="forward"/>
          <node ID="ID_81" TEXT="Seluruh transaksi target dan realisasi dari Jurnal Harian Produksi (JHP)"/>
        </node>
        <node ID="ID_82" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (STEP-BY-STEP):" COLOR="#b45309">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="edit"/>
          <node ID="ID_83" TEXT="1. Pilih rentang tanggal evaluasi (harian, mingguan, atau bulanan)"/>
          <node ID="ID_84" TEXT="2. Pilih Bagian kerja (Cetak, Finishing, dll.)"/>
          <node ID="ID_85" TEXT="3. Periksa Grafik Batang/Tren: Perbandingan antara Target Lembar vs Realisasi Lembar"/>
          <node ID="ID_86" TEXT="4. Cek Tabel Utilisasi: Lihat persentase efisiensi tiap operator dan mesin (apakah &gt; 90% atau di bawah standar)"/>
          <node ID="ID_87" TEXT="5. Analisis tabel Rijek/Afdruk: Identifikasi mesin atau shift yang paling banyak membuang kertas/bahan"/>
        </node>
        <node ID="ID_88" TEXT="📤 ALUR DATA BERLANJUT KE MANA (NEXT DESTINATION):" COLOR="#15803d">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="launch"/>
          <node ID="ID_89" TEXT="-&gt; Mengalir ke Dashboard Produksi (/dashboard-manufaktur) untuk laporan pimpinan"/>
          <node ID="ID_90" TEXT="-&gt; Menjadi dasar evaluasi rapat koordinasi produksi (briefing pagi / evaluasi shift)"/>
          <node ID="ID_91" TEXT="-&gt; Menjadi data pendukung evaluasi insentif/KPI operator oleh HRD"/>
        </node>
      </node>
      <node ID="ID_92" TEXT="Menu: Hasil Produksi &amp; Tracking Manufaktur (/hasil-produksi &amp; /tracking-manufaktur)">
        <font NAME="SansSerif" BOLD="true" SIZE="11"/>
        <icon BUILTIN="search"/>
        <node ID="ID_93" TEXT="📌 FUNGSI: Memverifikasi output jadi pabrik dan memantau status pesanan pelanggan secara end-to-end." COLOR="#1e293b">
          <font NAME="SansSerif" ITALIC="true"/>
        </node>
        <node ID="ID_94" TEXT="📥 DARI MANA ASAL DATANYA:" COLOR="#0369a1">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="forward"/>
          <node ID="ID_95" TEXT="Realisasi yang telah diverifikasi di JHP"/>
          <node ID="ID_96" TEXT="Data nomor faktur dari Sales Order (SO) dan SOPd"/>
        </node>
        <node ID="ID_97" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (STEP-BY-STEP):" COLOR="#b45309">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="edit"/>
          <node ID="ID_98" TEXT="DI HALAMAN HASIL PRODUKSI: Cek rekap jumlah barang jadi per order, klik 'Export Excel' untuk arsip gudang"/>
          <node ID="ID_99" TEXT="DI HALAMAN TRACKING MANUFAKTUR: Masukkan Nomor Faktur atau Nama Order di kotak pencarian"/>
          <node ID="ID_100" TEXT="Lihat Visual Timeline: Sistem menampilkan tahapan: 'Pra-Cetak -&gt; Antrean Cetak -&gt; Proses Cetak -&gt; Finishing -&gt; QC -&gt; Gudang Jadi -&gt; Pengiriman'"/>
        </node>
        <node ID="ID_101" TEXT="📤 ALUR DATA BERLANJUT KE MANA (NEXT DESTINATION):" COLOR="#15803d">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="launch"/>
          <node ID="ID_102" TEXT="-&gt; Mengalir ke Gudang Barang Jadi (`barang_jadi`): Memicu pembuatan dokumen serah terima produk jadi"/>
          <node ID="ID_103" TEXT="-&gt; Mengalir ke Divisi Logistik: Menjadi dasar penerbitan Surat Jalan / Pengiriman barang ke pelanggan"/>
          <node ID="ID_104" TEXT="-&gt; Menjadi sumber informasi Customer Service &amp; Sales saat pelanggan menanyakan status barangnya"/>
        </node>
      </node>
    </node>
    <node ID="ID_105" TEXT="3. ALUR OPERASIONAL KALKULASI HARGA (PRICELIST &amp; HPP)" POSITION="right" COLOR="#4338ca">
      <edge COLOR="#4338ca" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="calculator"/>
      <node ID="ID_106" TEXT="Menu: HPP Kalkulasi (/hpp-kalkulasi)">
        <font NAME="SansSerif" BOLD="true" SIZE="11"/>
        <icon BUILTIN="coins"/>
        <node ID="ID_107" TEXT="📌 FUNGSI: Menghitung Harga Pokok Produksi (HPP) riil sebelum surat penawaran harga dibuat." COLOR="#1e293b">
          <font NAME="SansSerif" ITALIC="true"/>
        </node>
        <node ID="ID_108" TEXT="📥 DARI MANA ASAL DATANYA:" COLOR="#0369a1">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="forward"/>
          <node ID="ID_109" TEXT="Input spesifikasi order baru dari pelanggan"/>
          <node ID="ID_110" TEXT="Master harga bahan baku di gudang (`stok_master_barang`)"/>
        </node>
        <node ID="ID_111" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (STEP-BY-STEP):" COLOR="#b45309">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="edit"/>
          <node ID="ID_112" TEXT="1. Masukkan Nama Order dan Tanggal Kalkulasi"/>
          <node ID="ID_113" TEXT="2. Masukkan rincian komponen: Biaya Kertas, Biaya Plat Cetak, Biaya Tinta, Ongkos Mesin, Ongkos Finishing, Biaya Packing"/>
          <node ID="ID_114" TEXT="3. Tentukan Margin Keuntungan yang diinginkan (%)"/>
          <node ID="ID_115" TEXT="4. Klik 'Hitung HPP': Sistem mengkalkulasi HPP per unit dan HPP total"/>
          <node ID="ID_116" TEXT="5. Klik 'Simpan' untuk merekam data ke database `hpp_kalkulasi`"/>
        </node>
        <node ID="ID_117" TEXT="📤 ALUR DATA BERLANJUT KE MANA (NEXT DESTINATION):" COLOR="#15803d">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="launch"/>
          <node ID="ID_118" TEXT="-&gt; Mengalir ke pembuatan Penawaran Harga (SPH Keluar) di menu Penjualan"/>
          <node ID="ID_119" TEXT="-&gt; Menjadi acuan anggaran biaya saat diterbitkan Order Produksi &amp; SOPd"/>
        </node>
      </node>
      <node ID="ID_120" TEXT="Menu: Pricelist Simulator (/pricelist) [20+ SIMULATOR PRODUK]">
        <font NAME="SansSerif" BOLD="true" SIZE="11"/>
        <icon BUILTIN="idea"/>
        <node ID="ID_121" TEXT="📌 FUNGSI: Simulator otomatis dan kalkulator interaktif untuk menghitung harga cetak 20+ produk percetakan secara presisi." COLOR="#1e293b">
          <font NAME="SansSerif" ITALIC="true"/>
        </node>
        <node ID="ID_122" TEXT="📥 DARI MANA ASAL DATANYA:" COLOR="#0369a1">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="forward"/>
          <node ID="ID_123" TEXT="Tabel Global Master Parameter: Harga dasar plano kertas (HVS, Art Paper, Ivory, Dupleks), plat cetak, ongkos lipat, jahit, laminasi"/>
        </node>
        <node ID="ID_124" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (STEP-BY-STEP):" COLOR="#b45309">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="edit"/>
          <node ID="ID_125" TEXT="1. Pilih Tab Kategori Produk (contoh: Buku Soft Cover, Buku Hard Cover, Buku Tabungan, Stopmap, Brosur, Paperbag, dll.)"/>
          <node ID="ID_126" TEXT="2. Input Parameter Spesifikasi:"/>
          <node ID="ID_127" TEXT="   - Oplah (misal: 1000 eks)"/>
          <node ID="ID_128" TEXT="   - Ukuran Jadi &amp; Jumlah Halaman"/>
          <node ID="ID_129" TEXT="   - Bahan Kertas Isi (Gramatur &amp; Jenis)"/>
          <node ID="ID_130" TEXT="   - Bahan Cover &amp; Laminasi (Doff/Glossy/Spot UV)"/>
          <node ID="ID_131" TEXT="   - Jilid (Lem Panas / Jahit Kawat / Spiral / Hardcover Jahit)"/>
          <node ID="ID_132" TEXT="3. Sistem seketika menghitung plano kertas yang dibutuhkan, pola potong, jumlah plat, ongkos mesin, dan harga satuan"/>
          <node ID="ID_133" TEXT="4. Buka Tab 'Matrix View': Lihat perbandingan harga satuan pada oplah 500, 1.000, 2.000, 3.000, 5.000 secara otomatis"/>
          <node ID="ID_134" TEXT="5. Klik 'Simpan Kalkulasi': Simpan hasil simulasi ke Saved Calculations untuk dibuka kembali sewaktu-waktu"/>
        </node>
        <node ID="ID_135" TEXT="📤 ALUR DATA BERLANJUT KE MANA (NEXT DESTINATION):" COLOR="#15803d">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="launch"/>
          <node ID="ID_136" TEXT="-&gt; Diterbitkan menjadi dokumen Surat Penawaran Harga (SPH Keluar)"/>
          <node ID="ID_137" TEXT="-&gt; Saat customer menyetujui, spesifikasi langsung dikonversi menjadi data SOPd"/>
        </node>
      </node>
    </node>
    <node ID="ID_138" TEXT="4. ALUR OPERASIONAL HRD, KESALAHAN &amp; DASHBOARD" POSITION="right" COLOR="#be185d">
      <edge COLOR="#be185d" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="kaddressbook"/>
      <node ID="ID_139" TEXT="Menu: Catat Kesalahan Karyawan (/records) [HRD &amp; QC]">
        <font NAME="SansSerif" BOLD="true" SIZE="11"/>
        <icon BUILTIN="messagebox_warning"/>
        <node ID="ID_140" TEXT="📌 FUNGSI: Mendokumentasikan insiden kesalahan kerja, kelalaian operator, atau kerusakan bahan selama proses produksi." COLOR="#1e293b">
          <font NAME="SansSerif" ITALIC="true"/>
        </node>
        <node ID="ID_141" TEXT="📥 DARI MANA ASAL DATANYA:" COLOR="#0369a1">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="forward"/>
          <node ID="ID_142" TEXT="Temuan cacat produk oleh QC / Pengawas Produksi"/>
          <node ID="ID_143" TEXT="Laporan kelebihan afdruk/waste dari Jurnal Harian Produksi (JHP)"/>
        </node>
        <node ID="ID_144" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (STEP-BY-STEP):" COLOR="#b45309">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="edit"/>
          <node ID="ID_145" TEXT="1. Klik tombol 'Tambah Catatan Kesalahan'"/>
          <node ID="ID_146" TEXT="2. Pilih Nama Karyawan yang terlibat (dari daftar master karyawan)"/>
          <node ID="ID_147" TEXT="3. Pilih Tanggal kejadian dan Bagian Kerja (CETAK, FINISHING, SETTING, dll.)"/>
          <node ID="ID_148" TEXT="4. Masukkan Deskripsi Kesalahan secara detail (contoh: 'Salah potong kertas isi buku 10 rim', 'Plat tertukar warna Cyan &amp; Black')"/>
          <node ID="ID_149" TEXT="5. Masukkan Estimasi Nilai Kerugian Finansial (Rp)"/>
          <node ID="ID_150" TEXT="6. Pilih Tingkat Pelanggaran &amp; Sanksi (Peringatan Lisan, SP-1, SP-2, SP-3, atau Ganti Rugi Bahan)"/>
          <node ID="ID_151" TEXT="7. Klik 'Simpan Catatan'"/>
        </node>
        <node ID="ID_152" TEXT="📤 ALUR DATA BERLANJUT KE MANA (NEXT DESTINATION):" COLOR="#15803d">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="launch"/>
          <node ID="ID_153" TEXT="-&gt; Mengalir ke Dashboard HRD (/dashboard-hrd): Membentuk grafik tren kesalahan bulanan dan analisis per bagian"/>
          <node ID="ID_154" TEXT="-&gt; Mengirimkan Notifikasi Otomatis via Bot Telegram ke grup manajemen"/>
          <node ID="ID_155" TEXT="-&gt; Menjadi catatan riwayat kedisiplinan dan bahan evaluasi penilaian kinerja (KPI) karyawan"/>
        </node>
      </node>
      <node ID="ID_156" TEXT="Menu: 4 Dashboard Eksekutif (/dashboard, /dashboard-hrd, /dashboard-manufaktur, /dashboard-akunting)">
        <font NAME="SansSerif" BOLD="true" SIZE="11"/>
        <icon BUILTIN="chart"/>
        <node ID="ID_157" TEXT="📌 FUNGSI: Pusat kendali eksekutif untuk memantau indikator kinerja utama (KPI) seluruh lini bisnis secara real-time." COLOR="#1e293b">
          <font NAME="SansSerif" ITALIC="true"/>
        </node>
        <node ID="ID_158" TEXT="📥 DARI MANA ASAL DATANYA:" COLOR="#0369a1">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="forward"/>
          <node ID="ID_159" TEXT="Agregasi otomatis dari seluruh transaksi JHP, Digit, HRD, dan Akuntansi"/>
        </node>
        <node ID="ID_160" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (STEP-BY-STEP):" COLOR="#b45309">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="edit"/>
          <node ID="ID_161" TEXT="1. Pilih Dashboard yang ingin dipantau:"/>
          <node ID="ID_162" TEXT="   - Dashboard Umum: Ikhtisar order aktif, total omzet, dan peringatan sistem"/>
          <node ID="ID_163" TEXT="   - Dashboard Manufaktur: Tren volume lembar cetak bulanan, utilisasi mesin, rasio lembar rusak/afdruk"/>
          <node ID="ID_164" TEXT="   - Dashboard HRD: Grafik frekuensi pelanggaran, rasio kepatuhan SOP per divisi, operator berprestasi vs berisiko"/>
          <node ID="ID_165" TEXT="   - Dashboard Akuntansi: Grafik tren debit/kredit, arus kas bulanan, dan perputaran piutang"/>
          <node ID="ID_166" TEXT="2. Gunakan filter periode (Tahun / Bulan) untuk melihat dinamika data tren"/>
        </node>
        <node ID="ID_167" TEXT="📤 ALUR DATA BERLANJUT KE MANA (NEXT DESTINATION):" COLOR="#15803d">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="launch"/>
          <node ID="ID_168" TEXT="-&gt; Menjadi bahan pertimbangan Direksi &amp; Manajer dalam pengambilan keputusan strategis dan investasi mesin baru"/>
        </node>
      </node>
    </node>
    <node ID="ID_169" TEXT="I. ALUR PROSES BISNIS END-TO-END (SOP LENGKAP ORDER)" POSITION="left" COLOR="#dc2626">
      <edge COLOR="#dc2626" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="launch"/>
      <node ID="ID_170" TEXT="FASE 1: Pre-Press &amp; Penjualan (Order Masuk)" COLOR="#b91c1c">
        <font NAME="SansSerif" BOLD="true" SIZE="11"/>
        <icon BUILTIN="1"/>
        <node ID="ID_171" TEXT="1. Pelanggan Mengajukan Spesifikasi Cetak (Buku / Undangan / Dus / Majalah / Stopmap / Kalender)"/>
        <node ID="ID_172" TEXT="2. Tim Estimator membuka menu '/pricelist' (Pricelist Simulator) &amp; '/hpp-kalkulasi'"/>
        <node ID="ID_173" TEXT="3. Input oplah, kertas plano, plat, dan finishing -&gt; Sistem menghitung biaya HPP &amp; harga jual"/>
        <node ID="ID_174" TEXT="4. Tim Sales menerbitkan Surat Penawaran Harga di menu '/sph-out'"/>
        <node ID="ID_175" TEXT="5. Customer Menyetujui -&gt; Diterbitkan Sales Order resmi di menu '/sales-orders'"/>
      </node>
      <node ID="ID_176" TEXT="FASE 2: Perencanaan &amp; Pengadaan Bahan Baku" COLOR="#c2410c">
        <font NAME="SansSerif" BOLD="true" SIZE="11"/>
        <icon BUILTIN="2"/>
        <node ID="ID_177" TEXT="1. Sales Order diturunkan menjadi SOPd di menu '/jurnal-harian-produksi/data/excel-sopd' &amp; BOM di '/bom'"/>
        <node ID="ID_178" TEXT="2. Sistem mengecek ketersediaan bahan di menu '/data-digit/stok/master-barang'"/>
        <node ID="ID_179" TEXT="3. Jika bahan kurang: Bagian Gudang menerbitkan Purchase Request di menu '/pr'"/>
        <node ID="ID_180" TEXT="4. Bagian Pembelian meminta penawaran via '/spph-out' &amp; menerima penawaran via '/sph-in'"/>
        <node ID="ID_181" TEXT="5. Pembelian menerbitkan Purchase Order di menu '/purchase-orders' ke supplier terpilih"/>
        <node ID="ID_182" TEXT="6. Barang datang -&gt; Dicek di '/penerimaan-pembelian' -&gt; Stok bertambah -&gt; Hutang dicatat di '/pelunasan-hutang'"/>
      </node>
      <node ID="ID_183" TEXT="FASE 3: Penjadwalan &amp; Eksekusi di Lantai Pabrik (JHP)" COLOR="#d97706">
        <font NAME="SansSerif" BOLD="true" SIZE="11"/>
        <icon BUILTIN="3"/>
        <node ID="ID_184" TEXT="1. Kepala Produksi membuka menu '/jurnal-harian-produksi' (JHP)"/>
        <node ID="ID_185" TEXT="2. Klik 'Tambah Jadwal' atau 'Copy Jadwal' -&gt; Alokasikan No SOPd ke Mesin dan Operator Shift"/>
        <node ID="ID_186" TEXT="3. Operator menyiapkan mesin sesuai parameter di menu '/master-pekerjaan' (pasang plat, gosok plat, setup tinta)"/>
        <node ID="ID_187" TEXT="4. Mesin berjalan -&gt; Operator mencatat jam mulai, jam selesai, output cetak, dan sisa lembar di JHP"/>
        <node ID="ID_188" TEXT="5. Operator mencatat jumlah lembar rusak (afdruk setup &amp; afdruk run) di kolom Rijek JHP"/>
      </node>
      <node ID="ID_189" TEXT="FASE 4: Quality Control &amp; Penanganan Reject" COLOR="#059669">
        <font NAME="SansSerif" BOLD="true" SIZE="11"/>
        <icon BUILTIN="4"/>
        <node ID="ID_190" TEXT="1. Petugas QC memeriksa hasil cetakan (registrasi warna, kerapian, kebersihan)"/>
        <node ID="ID_191" TEXT="2. JIKA ADA KELALAIAN/CACAT KERJA FATAL: Pengawas membuka menu '/records' (Catat Kesalahan Karyawan)"/>
        <node ID="ID_192" TEXT="3. Masukkan data operator, kronologi kesalahan, taksiran kerugian biaya (Rp), dan sanksi/SP"/>
        <node ID="ID_193" TEXT="4. Bot Telegram secara otomatis mengirim pesan alert ke manajemen mengenai kesalahan tersebut"/>
        <node ID="ID_194" TEXT="5. Seluruh staf melaporkan log pekerjaan non-mesin di menu '/laporan-pekerjaan'"/>
      </node>
      <node ID="ID_195" TEXT="FASE 5: Finishing, Gudang Jadi &amp; Pengiriman" COLOR="#2563eb">
        <font NAME="SansSerif" BOLD="true" SIZE="11"/>
        <icon BUILTIN="5"/>
        <node ID="ID_196" TEXT="1. Lembar cetak dikerjakan di divisi Finishing (Potong sisir, Lipat, Laminasi, Lem Panas/Jahit)"/>
        <node ID="ID_197" TEXT="2. Verifikasi kuantitas akhir di menu '/hasil-produksi' dan tandai 'Produksi Selesai'"/>
        <node ID="ID_198" TEXT="3. Serah terima fisik ke Gudang Barang Jadi di menu '/barang-jadi'"/>
        <node ID="ID_199" TEXT="4. Tim Logistik menerbitkan Surat Jalan Pengiriman di menu '/pengiriman'"/>
        <node ID="ID_200" TEXT="5. Barang dikirim ke customer -&gt; Customer menandatangani tanda terima Surat Jalan"/>
      </node>
      <node ID="ID_201" TEXT="FASE 6: Penagihan, Pembukuan &amp; Evaluasi Eksekutif" COLOR="#7c3aed">
        <font NAME="SansSerif" BOLD="true" SIZE="11"/>
        <icon BUILTIN="6"/>
        <node ID="ID_202" TEXT="1. Finance menerbitkan Faktur Penjualan di menu '/sales' &amp; memantau tagihan di '/pelunasan-piutang'"/>
        <node ID="ID_203" TEXT="2. Seluruh transaksi dicatat otomatis/manual di Jurnal Umum ('/akuntansi/laporan/jurnal-umum')"/>
        <node ID="ID_204" TEXT="3. Tim Akuntansi mengecek keseimbangan debit/kredit via tombol 'Analisis Jurnal'"/>
        <node ID="ID_205" TEXT="4. Kepala Pabrik membuka '/jurnal-harian-produksi/analisa' untuk melihat grafik efisiensi mesin"/>
        <node ID="ID_206" TEXT="5. Direksi &amp; Manajemen memantau ringkasan performa di 4 Dashboard Eksekutif"/>
      </node>
    </node>
    <node ID="ID_207" TEXT="II. ARSITEKTUR TEKNOLOGI &amp; ALIRAN DATA" POSITION="left" COLOR="#475569">
      <edge COLOR="#475569" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="desktop"/>
      <node ID="ID_208" TEXT="Stack Teknologi Modern">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_209" TEXT="Frontend: Next.js 14 App Router, React 18, Tailwind CSS, Lucide Icons, TanStack Table"/>
        <node ID="ID_210" TEXT="Backend API: Route Handlers (Serverless/Node.js), Next.js Middleware Auth, Session Management"/>
        <node ID="ID_211" TEXT="Database: SQLite Engine (WAL Mode, Cache 64MB, MMAP 256MB, FTS Search)"/>
      </node>
      <node ID="ID_212" TEXT="Pipeline Aliran Data Otomatis">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_213" TEXT="1. Scraper Service menarik data ERP Digit -&gt; Menyimpan ke database lokal SQLite"/>
        <node ID="ID_214" TEXT="2. Database SQLite melayani UI Next.js dengan query cepat &amp; terindeks"/>
        <node ID="ID_215" TEXT="3. Event Handler memicu notifikasi Bot Telegram saat ada aksi penting (catat kesalahan, target baru)"/>
        <node ID="ID_216" TEXT="4. Audit Trail Logger (`activity_logs`) merekam jejak setiap aksi Create, Update, Delete"/>
      </node>
    </node>
  </node>
</map>
