<?xml version="1.0" encoding="utf-8"?>
<map version="1.0.1">
  <node ID="ID_1" TEXT="SINTAK - PETA LENGKAP ALUR KERJA SELURUH ROLE (PT BUYA BAROKAH)" COLOR="#0f172a">
    <font NAME="SansSerif" BOLD="true" SIZE="15"/>
    <icon BUILTIN="bookmark"/>
    <node ID="ID_2" TEXT="SUPER ADMIN &amp; TIM OPERASIONAL PRODUKSI" POSITION="right" COLOR="#b91c1c">
      <edge COLOR="#b91c1c" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="1"/>
      <node ID="ID_3" TEXT="ROLE: SUPER ADMIN (Pilar Tata Kelola, Integrasi &amp; Supervisi)" COLOR="#1e293b">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="wizard"/>
        <node ID="ID_4" TEXT="• Hak Akses Menu: Akses penuh ke seluruh 45 modul (Bypass RBAC)"/>
        <node ID="ID_5" TEXT="1. Tata Kelola RBAC, User &amp; Keamanan">
          <font NAME="SansSerif" BOLD="true"/>
          <node ID="ID_6" TEXT="   - /users: Tambah/edit user, reset password bcrypt, tautkan ke NIP employees, status aktif"/>
          <node ID="ID_7" TEXT="   - /roles: Konfigurasi checklist 45 modul di role_permissions &amp; batasan divisi di role_laporan_pekerjaan_config"/>
          <node ID="ID_8" TEXT="   - /settings/telegram-users: Otorisasi/Approve akun operator untuk input via bot Telegram"/>
          <node ID="ID_9" TEXT="   - /log-aktivitas: Audit trail pemantauan histori seluruh aksi CRUD pengguna sistem"/>
        </node>
        <node ID="ID_10" TEXT="2. Integrasi Sinkronisasi Data Digit (/sync)">
          <font NAME="SansSerif" BOLD="true"/>
          <node ID="ID_11" TEXT="   - Tarik batch data Digit ke SQLite lokal: Stok Barang, Pembelian (7 menu), Penjualan (5 menu), Akuntansi, BBB &amp; Barang Jadi"/>
          <node ID="ID_12" TEXT="   - Data SPK masuk ke tabel orders (antrean SOPd), data stok masuk ke stok_master_barang"/>
        </node>
        <node ID="ID_13" TEXT="3. Migrasi Excel &amp; Master Operasional">
          <font NAME="SansSerif" BOLD="true"/>
          <node ID="ID_14" TEXT="   - /settings/konversi-data: Upload Excel HPP, Excel SOPd, dan Excel Laporan Pekerjaan"/>
          <node ID="ID_15" TEXT="   - /employees: Master data seluruh pegawai (NIP, Nama, Posisi, Bagian, Status)"/>
          <node ID="ID_16" TEXT="   - /data/master-pekerjaan-jurnal-produksi: Master jenis pekerjaan dan standar target"/>
        </node>
        <node ID="ID_17" TEXT="4. Supervisi Tracking Manufaktur &amp; 4 Dashboard">
          <font NAME="SansSerif" BOLD="true"/>
          <node ID="ID_18" TEXT="   - /tracking-manufaktur: Lacak rantai fisik SO -&gt; SPK -&gt; BOM -&gt; PR/PO -&gt; Penerimaan -&gt; BBB -&gt; Barang Jadi -&gt; Kirim (SJ) -&gt; Piutang"/>
          <node ID="ID_19" TEXT="   - Monitoring 4 Dashboard Eksekutif: Dashboard Umum, Dashboard Produksi, Dashboard HRD, dan Dashboard Akuntansi"/>
        </node>
      </node>
      <node ID="ID_20" TEXT="ROLE: Admin Penjadwalan (8 Modul)" COLOR="#ef4444">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_21" TEXT="• Hak Akses Menu: /data/excel-sopd, /jurnal-harian-produksi, /target, /hasil-produksi, /laporan-pekerjaan, /dashboard-manufaktur, master pekerjaan"/>
        <node ID="ID_22" TEXT="• Sumber Data: Tabel orders (Digit via /sync), Tabel sopd (Excel), Tabel employees (operator), Tabel master_pekerjaan"/>
        <node ID="ID_23" TEXT="• Step 1 (/data/excel-sopd): Buka antrean pesanan masuk, cek oplah &amp; deadline, inline edit estimasi jika perlu"/>
        <node ID="ID_24" TEXT="• Step 2 (/jurnal-harian-produksi): Susun target shift (Bagian, Shift 1/2/3, Operator, No SOPd, Target). Tombol 'Copy Jadwal' untuk salin susunan kemarin"/>
        <node ID="ID_25" TEXT="• Step 3 (/target): Evaluasi sebaran beban kerja harian antar operator di menu Target Harian"/>
        <node ID="ID_26" TEXT="• Output: Tabel jurnal_harian_produksi terisi target -&gt; Menjadi acuan kerja shift di lapangan"/>
      </node>
      <node ID="ID_27" TEXT="ROLE: Admin Realisasi (7 Modul)" COLOR="#ef4444">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_28" TEXT="• Hak Akses Menu: /jurnal-harian-produksi (Realisasi), /data/excel-sopd, /hasil-produksi, /laporan-pekerjaan, /dashboard-manufaktur, master pekerjaan"/>
        <node ID="ID_29" TEXT="• Sumber Data: Tabel jurnal_harian_produksi (jadwal target) &amp; Laporan fisik operator lapangan"/>
        <node ID="ID_30" TEXT="• Step 1: Buka tab realisasi JHP hari ini, validasi No SOPd &amp; nama operator"/>
        <node ID="ID_31" TEXT="• Step 2: Input Jam Mulai, Jam Selesai &amp; jumlah lembar Realisasi yang berhasil diselesaikan"/>
        <node ID="ID_32" TEXT="• Step 3: Input lembar Rijek (rusak afdruk setup &amp; jalan), Inscheet kertas, dan catat kendala lapangan"/>
        <node ID="ID_33" TEXT="• Output: Update kolom realisasi, rijek, inscheet, jam, kendala di jurnal_harian_produksi -&gt; Mengalir ke Hasil Produksi"/>
      </node>
      <node ID="ID_34" TEXT="ROLE: Produksi (Supervisor) (5 Modul)" COLOR="#ef4444">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_35" TEXT="• Hak Akses Menu: /dashboard-manufaktur, /jurnal-harian-produksi, /target, /hasil-produksi, /laporan-pekerjaan"/>
        <node ID="ID_36" TEXT="• Sumber Data: Tabel orders (Digit), Tabel jurnal_harian_produksi, Tabel produksi_barang_jadi"/>
        <node ID="ID_37" TEXT="• Step 1: Pantau Dashboard Produksi (OrdersStatCard, JurnalStatCard, tren BBB vs Hasil Produksi)"/>
        <node ID="ID_38" TEXT="• Step 2: Evaluasi menu /target untuk shift/operator yang tertinggal target"/>
        <node ID="ID_39" TEXT="• Step 3: Cek menu /hasil-produksi untuk akumulasi lembar dan barang jadi"/>
        <node ID="ID_40" TEXT="• Output: Stabilitas ritme kerja pabrik dan mitigasi bottleneck pengerjaan mesin"/>
      </node>
      <node ID="ID_41" TEXT="ROLE: Kepala Seksi Pra Cetak &amp; Pasca Cetak (3 Modul Masing-Masing)" COLOR="#ea580c">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_42" TEXT="• Hak Akses Menu: /data/excel-sopd, /laporan-pekerjaan, /hasil-produksi (Terkunci divisi SETTING atau FINISHING)"/>
        <node ID="ID_43" TEXT="• Step 1 (/data/excel-sopd): Kontrol antrean order mendekati deadline (Pra: cek file setting/plat; Pasca: cek jilid/finishing)"/>
        <node ID="ID_44" TEXT="• Step 2 (/laporan-pekerjaan): Supervisi kendala tim, durasi jam kerja, dan kecepatan output"/>
        <node ID="ID_45" TEXT="• Step 3 (/hasil-produksi): Verifikasi kesiapan plat CTP (Pra) atau validasi fisik barang jadi (Pasca)"/>
        <node ID="ID_46" TEXT="• Output: Menjamin kesiapan pra-cetak dan ketepatan serah terima produk finishing"/>
      </node>
    </node>
    <node ID="ID_47" TEXT="TEKNISI LAPANGAN, KALKULASI, HRD &amp; KEUANGAN" POSITION="left" COLOR="#047857">
      <edge COLOR="#047857" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="2"/>
      <node ID="ID_48" TEXT="DIVISI TEKNIS: Setting, Cetak, Finishing, Quality Control" COLOR="#f97316">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_49" TEXT="• Setting (1 Modul): Akses /laporan-pekerjaan (terkunci SETTING). Catat desain, layout, cek file, output Plat CTP, dan jumlah keping plat"/>
        <node ID="ID_50" TEXT="• Cetak (2 Modul): Akses /laporan-pekerjaan &amp; /hasil-produksi. Input lembar cetak harian via Web ATAU chat Bot Telegram (/api/telegram/realisasi)"/>
        <node ID="ID_51" TEXT="• Finishing (2 Modul): Akses /laporan-pekerjaan &amp; /hasil-produksi. Catat potong, lipat, jilid lem panas, jahit kawat, laminasi, hardcover via Web/Bot Telegram"/>
        <node ID="ID_52" TEXT="• Quality Control (2 Modul): Akses /laporan-pekerjaan &amp; /hasil-produksi. Inspeksi register cetak, ketepatan warna, kerapian potong/jilid, input lembar lolos/rijek, eskalasi ke HRD jika cacat fatal"/>
      </node>
      <node ID="ID_53" TEXT="KALKULASI &amp; KALKULASI2" COLOR="#d97706">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_54" TEXT="• Kalkulasi (3 Modul): /pricelist, /hpp-kalkulasi, /rekap-sales-order"/>
        <node ID="ID_55" TEXT="   - Step 1: Simulasi hitung harga 20+ produk cetak di /pricelist (Buku, Dus, Brosur, Stopmap, Undangan, dll.)"/>
        <node ID="ID_56" TEXT="   - Step 2: Masukkan biaya pokok acuan di /hpp-kalkulasi (tabel hpp_kalkulasi)"/>
        <node ID="ID_57" TEXT="   - Step 3: Analisa rincian Sales Order Digit di /rekap-sales-order untuk evaluasi margin keuntungan"/>
        <node ID="ID_58" TEXT="• Kalkulasi2 (1 Modul): Akses simulator /pricelist untuk hitung cepat estimasi harga jual penawaran Sales"/>
      </node>
      <node ID="ID_59" TEXT="ROLE: HRD (Personalia &amp; Kedisiplinan) (10 Modul)" COLOR="#e11d48">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_60" TEXT="• Hak Akses Menu: /employees, /records, /dashboard-hrd, /sync, /hpp-kalkulasi, data digit"/>
        <node ID="ID_61" TEXT="• Step 1 (/employees): Kelola master pegawai (NIP, Nama, Jabatan, Bagian, Status Aktif) -&gt; sumber dropdown operator"/>
        <node ID="ID_62" TEXT="• Step 2 (/records): Buka formulir catat kesalahan, pilih karyawan, tanggal, kronologi kesalahan, dan rincian beban ganti rugi finansial (tabel infractions)"/>
        <node ID="ID_63" TEXT="• Step 3 (/dashboard-hrd): Pantau grafik bulanan tren insiden kesalahan kerja (InfractionsTrendChart) &amp; sebaran karyawan (KaryawanStatCard)"/>
      </node>
      <node ID="ID_64" TEXT="ROLE: Akunting (Keuangan &amp; Buku Besar) (7 Modul)" COLOR="#16a34a">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_65" TEXT="• Hak Akses Menu: /sync, /akuntansi/data/rek-akuntansi, /akuntansi/laporan/jurnal-umum, /dashboard-akunting, /sales, /sales-orders, barang jadi"/>
        <node ID="ID_66" TEXT="• Step 1 (/sync): Sinkronisasi transaksi penjualan, pelunasan piutang, dan kas Digit ke database lokal"/>
        <node ID="ID_67" TEXT="• Step 2 (/akuntansi/laporan/jurnal-umum): Audit mutasi Debet/Kredit per tanggal/akun, klik 'Analisis Jurnal' untuk laba/rugi"/>
        <node ID="ID_68" TEXT="• Step 3 (/dashboard-akunting): Pantau grafik tren Debet vs Kredit bulanan (AkuntingTrendChart) &amp; warning barang jadi"/>
      </node>
      <node ID="ID_69" TEXT="ROLE: Demo &amp; Demo 2 (Akun Peninjauan / Tamu)" COLOR="#7c3aed">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_70" TEXT="• Demo (6 Modul): Stok Barang, PO Pembelian, Penerimaan, dan Tracking Manufaktur (presentasi alur Digit)"/>
        <node ID="ID_71" TEXT="• Demo 2 (2 Modul): Hasil Produksi dan Laporan Pekerjaan (demonstrasi monitoring kerja)"/>
        <node ID="ID_72" TEXT="• Output: Peninjauan fitur tanpa risiko merusak data riil operasional"/>
      </node>
    </node>
  </node>
</map>
