<?xml version="1.0" encoding="utf-8"?>
<map version="1.0.1">
  <node ID="ID_1" TEXT="ALUR END-TO-END SISTEM SINTAK (LIFECYCLE LENGKAP ORDER PERCETAKAN PT BUYA BAROKAH)" COLOR="#0f172a">
    <font NAME="SansSerif" BOLD="true" SIZE="16"/>
    <icon BUILTIN="bookmark"/>
    <node ID="ID_2" TEXT="LANGKAH 01. LOGIN, AUTENTIKASI &amp; PENENTUAN MENU SIDEBAR" POSITION="right" COLOR="#0f766e">
      <edge COLOR="#0f766e" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="1"/>
      <node ID="ID_3" TEXT="👤 PENANGGUNG JAWAB (AKTOR): Seluruh Karyawan / Pengguna Sistem (Sesuai Role)" COLOR="#0f172a">
        <font NAME="SansSerif" BOLD="true"/>
      </node>
      <node ID="ID_4" TEXT="🌐 MENU / HALAMAN SISTEM: Halaman Login (/login)" COLOR="#0369a1">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="bookmark"/>
      </node>
      <node ID="ID_5" TEXT="📌 FUNGSI TAHAP INI: Pintu masuk autentikasi pengguna ke dalam sistem SINTAK dan penentuan menu sidebar yang aktif sesuai wewenang." COLOR="#334155">
        <font NAME="SansSerif" ITALIC="true"/>
      </node>
      <node ID="ID_6" TEXT="📥 ASAL DATA / MASUKAN TAHAP INI:" COLOR="#0284c7">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="forward"/>
        <node ID="ID_7" TEXT="Database akun pengguna (tabel `users`): Username, Password terenkripsi, Role, dan ID Karyawan"/>
      </node>
      <node ID="ID_8" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (LANGKAH OPERASIONAL):" COLOR="#b45309">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="edit"/>
        <node ID="ID_9" TEXT="1. Pengguna membuka aplikasi SINTAK di browser dan diarahkan ke '/login'"/>
        <node ID="ID_10" TEXT="2. Masukkan Username dan Password"/>
        <node ID="ID_11" TEXT="3. Klik tombol 'Masuk' (Sistem memvalidasi kredensial &amp; membuat cookie sesi terenkripsi)"/>
        <node ID="ID_12" TEXT="4. Sistem membaca hak akses RBAC (Role-Based Access Control) pengguna"/>
        <node ID="ID_13" TEXT="5. Pengguna diarahkan ke Dashboard sesuai jabatannya dan sidebar otomatis menyaring menu yang berhak diakses:"/>
        <node ID="ID_14" TEXT="   - Super Admin: Akses penuh seluruh menu"/>
        <node ID="ID_15" TEXT="   - Estimator / Sales: Terfokus pada menu Kalkulasi &amp; Penjualan"/>
        <node ID="ID_16" TEXT="   - Mandor / Operator Produksi: Terfokus pada menu SOPd, JHP, Target, Hasil Produksi"/>
        <node ID="ID_17" TEXT="   - Pengawas / HRD: Terfokus pada menu Catat Kesalahan &amp; Dashboard HRD"/>
        <node ID="ID_18" TEXT="   - Bagian Keuangan: Terfokus pada menu Jurnal Umum &amp; Pelunasan"/>
      </node>
      <node ID="ID_19" TEXT="📤 HASIL (OUTPUT) &amp; MENGALIR KE LANGKAH BERIKUTNYA:" COLOR="#15803d">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="launch"/>
        <node ID="ID_20" TEXT="-&gt; Menentukan menu aktif di sidebar"/>
        <node ID="ID_21" TEXT="-&gt; Mengalir ke LANGKAH 02 bagi Tim Estimator/Sales untuk memproses permintaan cetak pelanggan"/>
      </node>
    </node>
    <node ID="ID_22" TEXT="LANGKAH 02. ESTIMASI HARGA CETAK &amp; KALKULASI HPP" POSITION="right" COLOR="#0369a1">
      <edge COLOR="#0369a1" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="2"/>
      <node ID="ID_23" TEXT="👤 PENANGGUNG JAWAB (AKTOR): Tim Estimator &amp; Sales" COLOR="#0f172a">
        <font NAME="SansSerif" BOLD="true"/>
      </node>
      <node ID="ID_24" TEXT="🌐 MENU / HALAMAN SISTEM: Menu Kalkulasi -&gt; Pricelist (/pricelist) &amp; HPP Kalkulasi (/hpp-kalkulasi)" COLOR="#0369a1">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="bookmark"/>
      </node>
      <node ID="ID_25" TEXT="📌 FUNGSI TAHAP INI: Menghitung secara presisi kebutuhan bahan baku (kertas plano, plat, tinta), ongkos mesin, finishing, dan menentukan harga jual sebelum membuat penawaran ke pelanggan." COLOR="#334155">
        <font NAME="SansSerif" ITALIC="true"/>
      </node>
      <node ID="ID_26" TEXT="📥 ASAL DATA / MASUKAN TAHAP INI:" COLOR="#0284c7">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="forward"/>
        <node ID="ID_27" TEXT="Permintaan spesifikasi cetak dari pelanggan (oplah, ukuran buku/cetakan, jumlah halaman, jenis kertas, jenis jilid/finishing)"/>
        <node ID="ID_28" TEXT="Tabel Master Parameter Global: Harga dasar plano kertas (HVS, Art Paper, Ivory), plat cetak, ongkos potong, ongkos jilid"/>
      </node>
      <node ID="ID_29" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (LANGKAH OPERASIONAL):" COLOR="#b45309">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="edit"/>
        <node ID="ID_30" TEXT="1. Buka menu 'Kalkulasi Harga' (/pricelist)"/>
        <node ID="ID_31" TEXT="2. Pilih tab kategori produk yang sesuai (Buku Soft Cover, Hard Cover, Buku Tabungan, Stopmap, Brosur, Paperbag, Amplop, dll.)"/>
        <node ID="ID_32" TEXT="3. Masukkan parameter teknis:"/>
        <node ID="ID_33" TEXT="   - Oplah (misal: 1.000 buku)"/>
        <node ID="ID_34" TEXT="   - Ukuran jadi (misal: A5 / 14.5 x 20.5 cm)"/>
        <node ID="ID_35" TEXT="   - Jumlah halaman isi (misal: 192 halaman)"/>
        <node ID="ID_36" TEXT="   - Jenis &amp; gramatur kertas isi (misal: Bookpaper 57.5 gr atau HVS 70 gr)"/>
        <node ID="ID_37" TEXT="   - Jenis cover (Art Carton 260 gr, laminasi doff/glossy)"/>
        <node ID="ID_38" TEXT="   - Jenis penjilidan (Lem Panas / Perfect Binding, Jahit Benang)"/>
        <node ID="ID_39" TEXT="4. Sistem otomatis mengkalkulasi kebutuhan lembar plano kertas, jumlah plat cetak, durasi mesin, dan biaya produksi per pcs"/>
        <node ID="ID_40" TEXT="5. Klik tab 'Matrix View' untuk melihat harga satuan pada variasi oplah (500, 1.000, 2.000, 3.000, 5.000 pcs) secara instan"/>
        <node ID="ID_41" TEXT="6. Klik tombol 'Simpan Kalkulasi' untuk merekam hasil simulasi ke database"/>
      </node>
      <node ID="ID_42" TEXT="📤 HASIL (OUTPUT) &amp; MENGALIR KE LANGKAH BERIKUTNYA:" COLOR="#15803d">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="launch"/>
        <node ID="ID_43" TEXT="-&gt; Hasil kalkulasi menjadi acuan membuat dokumen SPH Keluar (Surat Penawaran Harga)"/>
        <node ID="ID_44" TEXT="-&gt; Mengalir ke LANGKAH 03 untuk penerbitan penawaran resmi dan konfirmasi Sales Order (SO)"/>
      </node>
    </node>
    <node ID="ID_45" TEXT="LANGKAH 03. PENERBITAN PENAWARAN (SPH) &amp; SALES ORDER (SO)" POSITION="right" COLOR="#d97706">
      <edge COLOR="#d97706" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="3"/>
      <node ID="ID_46" TEXT="👤 PENANGGUNG JAWAB (AKTOR): Tim Sales &amp; Administrasi Penjualan" COLOR="#0f172a">
        <font NAME="SansSerif" BOLD="true"/>
      </node>
      <node ID="ID_47" TEXT="🌐 MENU / HALAMAN SISTEM: Menu Penjualan -&gt; SPH Keluar (/sph-out) &amp; Sales Order (/sales-orders)" COLOR="#0369a1">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="bookmark"/>
      </node>
      <node ID="ID_48" TEXT="📌 FUNGSI TAHAP INI: Menerbitkan surat penawaran harga resmi kepada customer, dan menerbitkan Sales Order (SO) setelah customer setuju memesan." COLOR="#334155">
        <font NAME="SansSerif" ITALIC="true"/>
      </node>
      <node ID="ID_49" TEXT="📥 ASAL DATA / MASUKAN TAHAP INI:" COLOR="#0284c7">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="forward"/>
        <node ID="ID_50" TEXT="Hasil perhitungan harga dari Pricelist Simulator / HPP Kalkulasi (Langkah 02)"/>
        <node ID="ID_51" TEXT="Data identitas customer (Nama instansi/pemesan, alamat, kontak)"/>
      </node>
      <node ID="ID_52" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (LANGKAH OPERASIONAL):" COLOR="#b45309">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="edit"/>
        <node ID="ID_53" TEXT="1. Buka menu 'SPH Keluar' (/sph-out)"/>
        <node ID="ID_54" TEXT="2. Buat dokumen penawaran harga resmi berdasarkan angka simulasi dari Pricelist"/>
        <node ID="ID_55" TEXT="3. Kirimkan dokumen SPH ke customer via email / cetak fisik"/>
        <node ID="ID_56" TEXT="4. KETIKA CUSTOMER SETUJU (DEAL): Customer menerbitkan PO atau konfirmasi pemesanan"/>
        <node ID="ID_57" TEXT="5. Tim Sales membuka menu 'Sales Order' (/sales-orders)"/>
        <node ID="ID_58" TEXT="6. Terbitkan Sales Order (SO) resmi dengan nomor faktur unik, rincian oplah, nominal total, dan uang muka (DP)"/>
        <node ID="ID_59" TEXT="7. Klik 'Simpan SO'"/>
      </node>
      <node ID="ID_60" TEXT="📤 HASIL (OUTPUT) &amp; MENGALIR KE LANGKAH BERIKUTNYA:" COLOR="#15803d">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="launch"/>
        <node ID="ID_61" TEXT="-&gt; Nomor Faktur SO menjadi identitas utama pesanan di seluruh sistem SINTAK"/>
        <node ID="ID_62" TEXT="-&gt; Memicu Divisi PPIC/Produksi untuk membuat SOPd dan Bill of Material (BOM) pada LANGKAH 04 &amp; 05"/>
      </node>
    </node>
    <node ID="ID_63" TEXT="LANGKAH 04. PERENCANAAN BAHAN BAKU (BOM) &amp; PENGADAAN (PROCUREMENT)" POSITION="right" COLOR="#b45309">
      <edge COLOR="#b45309" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="4"/>
      <node ID="ID_64" TEXT="👤 PENANGGUNG JAWAB (AKTOR): Divisi Gudang Bahan, PPIC &amp; Bagian Pembelian" COLOR="#0f172a">
        <font NAME="SansSerif" BOLD="true"/>
      </node>
      <node ID="ID_65" TEXT="🌐 MENU / HALAMAN SISTEM: Menu Data Digit -&gt; Stok (/stok/master-barang) &amp; Pembelian (/pr, /spph-out, /purchase-orders, /penerimaan-pembelian)" COLOR="#0369a1">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="bookmark"/>
      </node>
      <node ID="ID_66" TEXT="📌 FUNGSI TAHAP INI: Memeriksa stok kertas, plat, dan tinta di gudang; jika kurang, memproses pengadaan bahan baku ke supplier hingga barang tiba di pabrik." COLOR="#334155">
        <font NAME="SansSerif" ITALIC="true"/>
      </node>
      <node ID="ID_67" TEXT="📥 ASAL DATA / MASUKAN TAHAP INI:" COLOR="#0284c7">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="forward"/>
        <node ID="ID_68" TEXT="Kebutuhan bahan dari Bill of Material (BOM) pesanan SO"/>
        <node ID="ID_69" TEXT="Stok fisik yang tercatat di tabel `stok_master_barang`"/>
      </node>
      <node ID="ID_70" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (LANGKAH OPERASIONAL):" COLOR="#b45309">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="edit"/>
        <node ID="ID_71" TEXT="1. Tim PPIC mengecek menu 'Master Barang' (/data-digit/stok/master-barang) apakah kertas plano/plat mencukupi"/>
        <node ID="ID_72" TEXT="2. JIKA STOK KURANG: Divisi Gudang membuka menu 'Purchase Request' (/pr) untuk mengajukan pembelian bahan"/>
        <node ID="ID_73" TEXT="3. Tim Pembelian membuka menu 'SPPH Keluar' (/spph-out) untuk meminta harga ke beberapa vendor supplier"/>
        <node ID="ID_74" TEXT="4. Input penawaran supplier yang masuk di menu 'SPH Masuk' (/sph-in) untuk perbandingan harga"/>
        <node ID="ID_75" TEXT="5. Pilih supplier terbaik, lalu terbitkan 'Purchase Order' (/purchase-orders) resmi ke vendor"/>
        <node ID="ID_76" TEXT="6. BARANG TIBA DARI SUPPLIER: Petugas gudang membuka menu 'Penerimaan Barang' (/penerimaan-pembelian)"/>
        <node ID="ID_77" TEXT="7. Cocokkan fisik barang datang (jumlah rim, gramatur, ukuran) dengan PO -&gt; Klik 'Konfirmasi Terima'"/>
        <node ID="ID_78" TEXT="8. Stok bahan baku di sistem otomatis bertambah"/>
        <node ID="ID_79" TEXT="9. Bagian Keuangan mencatat invoice masuk di menu 'Pelunasan Hutang' (/pelunasan-hutang)"/>
      </node>
      <node ID="ID_80" TEXT="📤 HASIL (OUTPUT) &amp; MENGALIR KE LANGKAH BERIKUTNYA:" COLOR="#15803d">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="launch"/>
        <node ID="ID_81" TEXT="-&gt; Bahan baku fisik (kertas plano, plat, tinta) telah siap di lantai pabrik"/>
        <node ID="ID_82" TEXT="-&gt; Mengalir ke LANGKAH 05: Penyiapan Surat Order Produksi Digital (SOPd) dan penjadwalan mesin"/>
      </node>
    </node>
    <node ID="ID_83" TEXT="LANGKAH 05. PENYIAPAN SPESIFIKASI SOPd &amp; MASTER STANDAR MESIN" POSITION="right" COLOR="#c2410c">
      <edge COLOR="#c2410c" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="5"/>
      <node ID="ID_84" TEXT="👤 PENANGGUNG JAWAB (AKTOR): Kepala Bagian Produksi / Administrasi Pabrik" COLOR="#0f172a">
        <font NAME="SansSerif" BOLD="true"/>
      </node>
      <node ID="ID_85" TEXT="🌐 MENU / HALAMAN SISTEM: Menu Produksi -&gt; SOPd (/jurnal-harian-produksi/data/excel-sopd) &amp; Master Pekerjaan (/master-pekerjaan)" COLOR="#0369a1">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="bookmark"/>
      </node>
      <node ID="ID_86" TEXT="📌 FUNGSI TAHAP INI: Memverifikasi rincian spesifikasi teknis cetak di SOPd, mengontrol status kesiapan kerja (pending/ready), dan memastikan parameter mesin sudah terkalibrasi." COLOR="#334155">
        <font NAME="SansSerif" ITALIC="true"/>
      </node>
      <node ID="ID_87" TEXT="📥 ASAL DATA / MASUKAN TAHAP INI:" COLOR="#0284c7">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="forward"/>
        <node ID="ID_88" TEXT="Data pesanan dari Sales Order (SO) yang disinkronkan dari ERP Digit (/sync) atau diimpor dari Excel"/>
        <node ID="ID_89" TEXT="Data unit mesin dari tabel `master_pekerjaan` (Offset Heidelberg, Web, Digital, Mesin Potong Polar, Lipat, Lem)"/>
      </node>
      <node ID="ID_90" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (LANGKAH OPERASIONAL):" COLOR="#b45309">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="edit"/>
        <node ID="ID_91" TEXT="1. Buka menu 'SOPd' (/jurnal-harian-produksi/data/excel-sopd)"/>
        <node ID="ID_92" TEXT="2. Atur filter rentang tanggal order untuk menampilkan pesanan yang siap dikerjakan"/>
        <node ID="ID_93" TEXT="3. Periksa spesifikasi: No SOPd, Nama Order, Oplah (Qty), Ukuran potong, dan Deadline pengerjaan"/>
        <node ID="ID_94" TEXT="4. Edit Cepat (Inline Edit): Klik 2x pada cell 'Perkiraan Harga', 'Deadline', atau 'Keterangan' jika ada penyesuaian"/>
        <node ID="ID_95" TEXT="5. JIKA ADA KENDALA BAHAN/FILE: Centang kotak 'Pending Produksi' dan ketik alasannya (misal: 'Menunggu Plat ACC')"/>
        <node ID="ID_96" TEXT="6. Buka menu 'Master Pekerjaan' (/master-pekerjaan) untuk memastikan standar target mesin (waktu persiapan menit, waktu ganti plate, target lembar/jam) sudah tepat"/>
      </node>
      <node ID="ID_97" TEXT="📤 HASIL (OUTPUT) &amp; MENGALIR KE LANGKAH BERIKUTNYA:" COLOR="#15803d">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="launch"/>
        <node ID="ID_98" TEXT="-&gt; No SOPd yang siap (tidak pending) otomatis muncul sebagai opsi di menu Jurnal Harian Produksi"/>
        <node ID="ID_99" TEXT="-&gt; Mengalir ke LANGKAH 06 untuk penjadwalan harian shift dan eksekusi cetak"/>
      </node>
    </node>
    <node ID="ID_100" TEXT="LANGKAH 06. EKSEKUSI CETAK &amp; JURNAL HARIAN PRODUKSI (JHP) [INTI LANTAI PABRIK]" POSITION="left" COLOR="#b91c1c">
      <edge COLOR="#b91c1c" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="6"/>
      <node ID="ID_101" TEXT="👤 PENANGGUNG JAWAB (AKTOR): Kepala Produksi (Target) &amp; Operator Mesin Cetak (Realisasi)" COLOR="#0f172a">
        <font NAME="SansSerif" BOLD="true"/>
      </node>
      <node ID="ID_102" TEXT="🌐 MENU / HALAMAN SISTEM: Menu Produksi -&gt; Jurnal Harian Produksi (/jurnal-harian-produksi)" COLOR="#0369a1">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="bookmark"/>
      </node>
      <node ID="ID_103" TEXT="📌 FUNGSI TAHAP INI: Menjadwalkan pembagian mesin dan target per shift, lalu operator mencatat realisasi lembar cetak, durasi waktu kerja riil, dan jumlah lembar rusak (waste/rijek)." COLOR="#334155">
        <font NAME="SansSerif" ITALIC="true"/>
      </node>
      <node ID="ID_104" TEXT="📥 ASAL DATA / MASUKAN TAHAP INI:" COLOR="#0284c7">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="forward"/>
        <node ID="ID_105" TEXT="Nomor Order &amp; Spesifikasi dari SOPd (Langkah 05)"/>
        <node ID="ID_106" TEXT="Daftar Mesin dari Master Pekerjaan (`master_pekerjaan`)"/>
        <node ID="ID_107" TEXT="Daftar Operator dari Master Karyawan (`employees`)"/>
      </node>
      <node ID="ID_108" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (LANGKAH OPERASIONAL):" COLOR="#b45309">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="edit"/>
        <node ID="ID_109" TEXT="BAGIAN 1 - PENJADWALAN TARGET (Oleh Kepala Produksi):"/>
        <node ID="ID_110" TEXT="  1. Pilih Tanggal Kerja dan pilih Bagian (misal: 'CETAK')"/>
        <node ID="ID_111" TEXT="  2. Klik tombol 'Tambah Jadwal' atau klik 'Copy Jadwal' (salin jadwal shift kemarin ke hari ini secara instan)"/>
        <node ID="ID_112" TEXT="  3. Pilih Shift (Shift 1 / Shift 2 / Shift 3), pilih Mesin, pilih No SOPd, pilih Operator, dan masukkan Target Lembar"/>
        <node ID="ID_113" TEXT="BAGIAN 2 - EKSEKUSI &amp; REALISASI (Oleh Operator Mesin):"/>
        <node ID="ID_114" TEXT="  4. Operator menyiapkan mesin (pasang plat, gosok plat, tarik kertas, setel tinta)"/>
        <node ID="ID_115" TEXT="  5. Mesin berjalan memproduksi pesanan"/>
        <node ID="ID_116" TEXT="  6. Di aplikasi JHP, operator mengisi:"/>
        <node ID="ID_117" TEXT="     - Jam Mulai &amp; Jam Selesai pengerjaan"/>
        <node ID="ID_118" TEXT="     - Absensi / Jam Kerja Efektif"/>
        <node ID="ID_119" TEXT="     - Realisasi Cetak: Jumlah lembar cetak berhasil yang selesai"/>
        <node ID="ID_120" TEXT="     - Rijek / Waste: Jumlah lembar rusak afdruk setup dan afdruk jalan"/>
        <node ID="ID_121" TEXT="     - Keterangan Kendala: Klik 2x cell Keterangan jika ada trouble (misal: 'Ganti blangket', 'Kertas keriting')"/>
        <node ID="ID_122" TEXT="  7. Formula otomatis dievaluasi di cell (misal ketik '2000+500' langsung jadi '2500')"/>
        <node ID="ID_123" TEXT="  8. Data tersimpan real-time ke database"/>
      </node>
      <node ID="ID_124" TEXT="📤 HASIL (OUTPUT) &amp; MENGALIR KE LANGKAH BERIKUTNYA:" COLOR="#15803d">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="launch"/>
        <node ID="ID_125" TEXT="-&gt; Mengalir ke menu 'Target Harian' (/target) untuk rekap capaian harian shift"/>
        <node ID="ID_126" TEXT="-&gt; Mengalir ke menu 'Analisa Produksi' (/analisa) untuk kalkulasi persentase efisiensi mesin"/>
        <node ID="ID_127" TEXT="-&gt; Jika hasil cetak cacat akibat kelalaian operator -&gt; Mengalir ke LANGKAH 07 (Catat Kesalahan)"/>
        <node ID="ID_128" TEXT="-&gt; Jika hasil cetak berhasil dan lolos QC -&gt; Mengalir ke LANGKAH 08 (Finishing)"/>
      </node>
    </node>
    <node ID="ID_129" TEXT="LANGKAH 07. QUALITY CONTROL (QC) &amp; PENCATATAN KESALAHAN KARYAWAN" POSITION="left" COLOR="#e11d48">
      <edge COLOR="#e11d48" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="7"/>
      <node ID="ID_130" TEXT="👤 PENANGGUNG JAWAB (AKTOR): Petugas QC &amp; Divisi HRD / Pengawas" COLOR="#0f172a">
        <font NAME="SansSerif" BOLD="true"/>
      </node>
      <node ID="ID_131" TEXT="🌐 MENU / HALAMAN SISTEM: Menu Sistem -&gt; HRD -&gt; Catat Kesalahan (/records) &amp; Telegram Alert" COLOR="#0369a1">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="bookmark"/>
      </node>
      <node ID="ID_132" TEXT="📌 FUNGSI TAHAP INI: Menginspeksi mutu hasil cetakan; jika ditemukan cacat akibat kelalaian kerja, mencatat insiden kesalahan, menghitung estimasi kerugian biaya, dan menerbitkan sanksi/SP." COLOR="#334155">
        <font NAME="SansSerif" ITALIC="true"/>
      </node>
      <node ID="ID_133" TEXT="📥 ASAL DATA / MASUKAN TAHAP INI:" COLOR="#0284c7">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="forward"/>
        <node ID="ID_134" TEXT="Hasil fisik cetakan dari mesin cetak (Langkah 06)"/>
        <node ID="ID_135" TEXT="Laporan jumlah rijek/waste berlebih dari Jurnal Harian Produksi"/>
      </node>
      <node ID="ID_136" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (LANGKAH OPERASIONAL):" COLOR="#b45309">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="edit"/>
        <node ID="ID_137" TEXT="1. Petugas QC memeriksa lembar cetak (ketajaman register warna, tidak blobor, susunan halaman, ukuran potong)"/>
        <node ID="ID_138" TEXT="2. JIKA CETAKAN SESUAI STANDAR: Lembar cetak diberi label lolos QC dan diteruskan ke divisi Finishing"/>
        <node ID="ID_139" TEXT="3. JIKA DITEMUKAN CACAT/KELALAIAN FATAL (misal: warna terbalik, plat baret, salah potong 10 rim):"/>
        <node ID="ID_140" TEXT="   - Buka menu 'Catat Kesalahan Karyawan' (/records)"/>
        <node ID="ID_141" TEXT="   - Klik tombol 'Tambah Catatan Kesalahan'"/>
        <node ID="ID_142" TEXT="   - Pilih Karyawan/Operator yang bersangkutan"/>
        <node ID="ID_143" TEXT="   - Masukkan Tanggal Kejadian dan Bagian Kerja"/>
        <node ID="ID_144" TEXT="   - Tulis deskripsi kesalahan secara transparan dan jelas"/>
        <node ID="ID_145" TEXT="   - Masukkan Taksiran Nilai Kerugian Finansial (Rp)"/>
        <node ID="ID_146" TEXT="   - Pilih Tingkat Pelanggaran &amp; Sanksi (Teguran Lisan / SP-1 / SP-2 / SP-3 / Ganti Rugi Bahan)"/>
        <node ID="ID_147" TEXT="   - Klik 'Simpan Catatan'"/>
        <node ID="ID_148" TEXT="4. Bot Telegram secara otomatis mem-broadcast notifikasi alert ke grup manajemen pimpinan"/>
      </node>
      <node ID="ID_149" TEXT="📤 HASIL (OUTPUT) &amp; MENGALIR KE LANGKAH BERIKUTNYA:" COLOR="#15803d">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="launch"/>
        <node ID="ID_150" TEXT="-&gt; Mengalir ke Dashboard HRD (/dashboard-hrd) membentuk grafik tren pelanggaran dan evaluasi KPI"/>
        <node ID="ID_151" TEXT="-&gt; Bahan baku pengganti diproses ulang agar order customer tetap tuntas tepat waktu"/>
        <node ID="ID_152" TEXT="-&gt; Mengalir ke LANGKAH 08 untuk pekerjaan pasca cetak (Finishing)"/>
      </node>
    </node>
    <node ID="ID_153" TEXT="LANGKAH 08. FINISHING PASCA CETAK &amp; PENERIMAAN BARANG JADI" POSITION="left" COLOR="#4f46e5">
      <edge COLOR="#4f46e5" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="8"/>
      <node ID="ID_154" TEXT="👤 PENANGGUNG JAWAB (AKTOR): Divisi Finishing &amp; Staf Gudang Barang Jadi" COLOR="#0f172a">
        <font NAME="SansSerif" BOLD="true"/>
      </node>
      <node ID="ID_155" TEXT="🌐 MENU / HALAMAN SISTEM: Menu Produksi -&gt; Hasil Produksi (/hasil-produksi) &amp; Gudang Jadi (/barang-jadi)" COLOR="#0369a1">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="bookmark"/>
      </node>
      <node ID="ID_156" TEXT="📌 FUNGSI TAHAP INI: Memproses pekerjaan lanjutan (potong, lipat, laminasi, jilid lem panas, jahit kawat), memverifikasi jumlah produk jadi utuh, dan serah terima ke gudang." COLOR="#334155">
        <font NAME="SansSerif" ITALIC="true"/>
      </node>
      <node ID="ID_157" TEXT="📥 ASAL DATA / MASUKAN TAHAP INI:" COLOR="#0284c7">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="forward"/>
        <node ID="ID_158" TEXT="Lembar cetak lolos QC dari Langkah 06 &amp; 07"/>
        <node ID="ID_159" TEXT="Spesifikasi finishing di SOPd (Laminasi doff/glossy, jilid spiral/lem panas, packaging box)"/>
      </node>
      <node ID="ID_160" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (LANGKAH OPERASIONAL):" COLOR="#b45309">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="edit"/>
        <node ID="ID_161" TEXT="1. Divisi Finishing mengerjakan tahapan pasca cetak sesuai instruksi kerja"/>
        <node ID="ID_162" TEXT="2. Operator finishing mencatat aktivitasnya di menu 'Laporan Pekerjaan' (/laporan-pekerjaan)"/>
        <node ID="ID_163" TEXT="3. Pengepakan produk akhir (wrapping plastik kedap air, packing kardus, penempelan label)"/>
        <node ID="ID_164" TEXT="4. Buka menu 'Hasil Produksi' (/hasil-produksi):"/>
        <node ID="ID_165" TEXT="   - Verifikasi jumlah barang jadi yang tuntas"/>
        <node ID="ID_166" TEXT="   - Tandai status 'Produksi Selesai' pada pesanan terkait"/>
        <node ID="ID_167" TEXT="5. Petugas Gudang Barang Jadi membuka menu 'Penerimaan Barang Hasil Produksi' (/barang-jadi):"/>
        <node ID="ID_168" TEXT="   - Lakukan serah terima fisik dari pabrik ke gudang"/>
        <node ID="ID_169" TEXT="   - Stok fisik barang jadi resmi bertambah di sistem"/>
      </node>
      <node ID="ID_170" TEXT="📤 HASIL (OUTPUT) &amp; MENGALIR KE LANGKAH BERIKUTNYA:" COLOR="#15803d">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="launch"/>
        <node ID="ID_171" TEXT="-&gt; Barang jadi siap diambil atau dikirimkan ke pelanggan"/>
        <node ID="ID_172" TEXT="-&gt; Mengalir ke LANGKAH 09 untuk proses ekspedisi, pengiriman, dan penerbitan surat jalan"/>
      </node>
    </node>
    <node ID="ID_173" TEXT="LANGKAH 09. LOGISTIK, PENERBITAN SURAT JALAN &amp; PENGIRIMAN" POSITION="left" COLOR="#2563eb">
      <edge COLOR="#2563eb" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="9"/>
      <node ID="ID_174" TEXT="👤 PENANGGUNG JAWAB (AKTOR): Divisi Logistik, Ekspedisi &amp; Kurir" COLOR="#0f172a">
        <font NAME="SansSerif" BOLD="true"/>
      </node>
      <node ID="ID_175" TEXT="🌐 MENU / HALAMAN SISTEM: Menu Penjualan -&gt; Pengiriman (/pengiriman)" COLOR="#0369a1">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="bookmark"/>
      </node>
      <node ID="ID_176" TEXT="📌 FUNGSI TAHAP INI: Menyiapkan armada ekspedisi, menerbitkan Surat Jalan resmi, mengantar pesanan ke alamat pelanggan, dan memperoleh bukti tanda terima fisik." COLOR="#334155">
        <font NAME="SansSerif" ITALIC="true"/>
      </node>
      <node ID="ID_177" TEXT="📥 ASAL DATA / MASUKAN TAHAP INI:" COLOR="#0284c7">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="forward"/>
        <node ID="ID_178" TEXT="Produk jadi yang sudah masuk di Gudang Barang Jadi (Langkah 08)"/>
        <node ID="ID_179" TEXT="Alamat kirim dan kontak penerima dari dokumen Sales Order (SO)"/>
      </node>
      <node ID="ID_180" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (LANGKAH OPERASIONAL):" COLOR="#b45309">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="edit"/>
        <node ID="ID_181" TEXT="1. Petugas Logistik membuka menu 'Pengiriman' (/pengiriman)"/>
        <node ID="ID_182" TEXT="2. Pilih nomor faktur SO yang barangnya sudah siap di gudang"/>
        <node ID="ID_183" TEXT="3. Terbitkan dokumen Surat Jalan (SJ) resmi dengan rincian jumlah koli/kardus dan armada kurir"/>
        <node ID="ID_184" TEXT="4. Cetak dokumen Surat Jalan fisik rangkap"/>
        <node ID="ID_185" TEXT="5. Muat barang ke armada truk/mobil boks"/>
        <node ID="ID_186" TEXT="6. Kurir mengantar pesanan ke lokasi pelanggan"/>
        <node ID="ID_187" TEXT="7. Pelanggan memeriksa barang dan menandatangani lembar tanda terima Surat Jalan"/>
        <node ID="ID_188" TEXT="8. Kurir mengunggah/mengonfirmasi status 'Barang Diterima' di sistem"/>
      </node>
      <node ID="ID_189" TEXT="📤 HASIL (OUTPUT) &amp; MENGALIR KE LANGKAH BERIKUTNYA:" COLOR="#15803d">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="launch"/>
        <node ID="ID_190" TEXT="-&gt; Mengurangi stok barang jadi di gudang"/>
        <node ID="ID_191" TEXT="-&gt; Salinan Surat Jalan bertandatangan diserahkan ke Bagian Keuangan untuk penagihan di LANGKAH 10"/>
      </node>
    </node>
    <node ID="ID_192" TEXT="LANGKAH 10. PENAGIHAN, PEMBUKUAN JURNAL UMUM &amp; EVALUASI DASHBOARD" POSITION="left" COLOR="#7c3aed">
      <edge COLOR="#7c3aed" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="10"/>
      <node ID="ID_193" TEXT="👤 PENANGGUNG JAWAB (AKTOR): Divisi Keuangan, Akuntansi &amp; Direksi / Manajemen" COLOR="#0f172a">
        <font NAME="SansSerif" BOLD="true"/>
      </node>
      <node ID="ID_194" TEXT="🌐 MENU / HALAMAN SISTEM: Menu Akuntansi (/jurnal-umum), Piutang (/pelunasan-piutang), &amp; 4 Dashboard" COLOR="#0369a1">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="bookmark"/>
      </node>
      <node ID="ID_195" TEXT="📌 FUNGSI TAHAP INI: Menerbitkan faktur penjualan, menagih dan merekonsiliasi pembayaran piutang pelanggan, membukukan transaksi ke Jurnal Umum, serta evaluasi performa bisnis di Dashboard." COLOR="#334155">
        <font NAME="SansSerif" ITALIC="true"/>
      </node>
      <node ID="ID_196" TEXT="📥 ASAL DATA / MASUKAN TAHAP INI:" COLOR="#0284c7">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="forward"/>
        <node ID="ID_197" TEXT="Surat Jalan yang telah ditandatangani pelanggan (Langkah 09)"/>
        <node ID="ID_198" TEXT="Seluruh transaksi operasional dari tahap awal hingga akhir"/>
      </node>
      <node ID="ID_199" TEXT="🛠️ CARA PAKAI DI HALAMAN INI (LANGKAH OPERASIONAL):" COLOR="#b45309">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="edit"/>
        <node ID="ID_200" TEXT="1. Bagian Keuangan menerbitkan Faktur Penjualan resmi di menu 'Laporan Penjualan' (/sales)"/>
        <node ID="ID_201" TEXT="2. Sistem mencatat Piutang Usaha customer di menu 'Pelunasan Piutang' (/pelunasan-piutang)"/>
        <node ID="ID_202" TEXT="3. KETIKA CUSTOMER MEMBAYAR (Transfer/Tunai):"/>
        <node ID="ID_203" TEXT="   - Buka menu 'Pelunasan Piutang' -&gt; Input pelunasan faktur -&gt; Status lunas"/>
        <node ID="ID_204" TEXT="4. Buka menu 'Jurnal Umum' (/akuntansi/laporan/jurnal-umum):"/>
        <node ID="ID_205" TEXT="   - Periksa pembukuan double-entry: Kas/Bank (Debet) vs Piutang/Pendapatan Cetak (Kredit)"/>
        <node ID="ID_206" TEXT="   - Klik tombol 'Analisis Jurnal' untuk memastikan keseimbangan neraca dan tidak ada transaksi selisih"/>
        <node ID="ID_207" TEXT="5. PENGWASAN &amp; EVALUASI MANAJEMEN:"/>
        <node ID="ID_208" TEXT="   - Buka menu 'Tracking Manufaktur' (/tracking-manufaktur) untuk audit histori seluruh alur faktur"/>
        <node ID="ID_209" TEXT="   - Buka menu 'Analisa Produksi' (/analisa) untuk review efisiensi mesin &amp; lembar afdruk"/>
        <node ID="ID_210" TEXT="   - Buka '4 Dashboard Eksekutif' (Umum, Manufaktur, HRD, Akuntansi) untuk meninjau omzet, kapasitas, dan kinerja karyawan"/>
      </node>
      <node ID="ID_211" TEXT="📤 HASIL (OUTPUT) &amp; MENGALIR KE LANGKAH BERIKUTNYA:" COLOR="#15803d">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="launch"/>
        <node ID="ID_212" TEXT="-&gt; Siklus order cetak tuntas 100% dari hulu (penawaran) hingga hilir (uang masuk &amp; laporan keuangan)"/>
        <node ID="ID_213" TEXT="-&gt; Menjadi data historis untuk peningkatan efisiensi order-order berikutnya"/>
      </node>
    </node>
  </node>
</map>
