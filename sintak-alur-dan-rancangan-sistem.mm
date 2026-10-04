<?xml version="1.0" encoding="utf-8"?>
<map version="1.0.1">
  <node ID="ID_1" TEXT="SINTAK - PT. BUYA BAROKAH (ARSITEKTUR &amp; ALIRAN DATA LENGKAP)" COLOR="#0f172a">
    <font NAME="SansSerif" BOLD="true" SIZE="15"/>
    <icon BUILTIN="bookmark"/>
    <node ID="ID_2" TEXT="BAGIAN 1: LOGIN, ROLE DEV &amp; ALUR OPERASIONAL NYATA JHP" POSITION="right" COLOR="#b91c1c">
      <edge COLOR="#b91c1c" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="1"/>
      <node ID="ID_3" TEXT="0. Autentikasi Login &amp; Role Pengguna (Database Dev)" COLOR="#86198f">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_4" TEXT="• Halaman Login (/login): Input Username &amp; Password -&gt; Validasi password hash bcrypt &amp; status is_active = 1 di tabel users"/>
        <node ID="ID_5" TEXT="• Daftar Role Nyata (database_dev.sqlite):"/>
        <node ID="ID_6" TEXT="   - Manajemen / Admin: Super Admin, Admin Penjadwalan, Admin Realisasi"/>
        <node ID="ID_7" TEXT="   - Produksi &amp; Teknis: Produksi, Kepala Seksi Pra Cetak, Kepala Seksi Pasca Cetak, Setting, Cetak, Finishing, Quality Control"/>
        <node ID="ID_8" TEXT="   - Kalkulasi, HRD &amp; Keuangan: Kalkulasi, Kalkulasi2, HRD, Akunting"/>
        <node ID="ID_9" TEXT="   - Tamu / Pengujian: Demo, Demo 2"/>
        <node ID="ID_10" TEXT="• Hak Akses Role: Diatur di tabel role_permissions untuk memfilter menu sidebar yang tampil bagi masing-masing role"/>
      </node>
      <node ID="ID_11" TEXT="1. Sumber Data Order Produksi" COLOR="#0284c7">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_12" TEXT="• Digit (Pusat Data): Menyimpan data Order Produksi (orders) -&gt; ditarik ke database lokal via menu /sync"/>
        <node ID="ID_13" TEXT="• Upload Excel SOPd: Import file Excel data SOPd via menu /settings/konversi-data/jurnal-harian-produksi"/>
      </node>
      <node ID="ID_14" TEXT="2. Menu: SOPd (/jurnal-harian-produksi/data/excel-sopd)" COLOR="#d97706">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_15" TEXT="• Menggabungkan data dari tabel orders (Digit) &amp; sopd (Excel)"/>
        <node ID="ID_16" TEXT="• Memuat antrean pesanan: No SOPd, Nama Order, Oplah, Deadline, Harga"/>
        <node ID="ID_17" TEXT="• Fitur: Inline edit cepat 2x klik cell untuk estimasi harga, deadline, dan keterangan"/>
        <node ID="ID_18" TEXT="• Aliran Data: No SOPd otomatis menjadi pilihan order saat input jadwal di JHP (via /api/sopd)"/>
      </node>
      <node ID="ID_19" TEXT="3. Halaman Kerja: Jurnal Harian Produksi (/jurnal-harian-produksi) [INTI OPERASIONAL]" COLOR="#dc2626">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_20" TEXT="• Master Pendukung: Master Karyawan (/employees) untuk nama operator per bagian &amp; Master Pekerjaan (/data/master-pekerjaan-jurnal-produksi) untuk kategori &amp; jenis pekerjaan"/>
        <node ID="ID_21" TEXT="• CARA PAKAI 1 (Penjadwalan / Target): Pilih Bagian (Cetak, Finishing, Setting, QC, Gudang, Teknisi, Mesin), Shift (1/2/3), Operator, No SOPd, Target (Tersedia tombol 'Copy Jadwal')"/>
        <node ID="ID_22" TEXT="• CARA PAKAI 2 (Input Realisasi Lapangan): Operator isi Jam Mulai/Selesai &amp; Lembar Berhasil"/>
        <node ID="ID_23" TEXT="• CARA PAKAI 3 (Catat Rijek): Operator isi jumlah lembar rusak afdruk setup &amp; jalan"/>
        <node ID="ID_24" TEXT="• JALUR ALTERNATIF (Bot Telegram): Operator yang diapprove di /settings/telegram-users dapat langsung kirim realisasi via chat bot (/api/telegram/realisasi)"/>
      </node>
      <node ID="ID_25" TEXT="4. Menu Analisis &amp; Rekap Hasil (Menerima Data dari JHP)" COLOR="#9d174d">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_26" TEXT="• Target Harian (/jurnal-harian-produksi/target): Rekap pemenuhan target shift hari ini per bagian dan operator"/>
        <node ID="ID_27" TEXT="• Analisa Produksi (/jurnal-harian-produksi/analisa): Cari per No Order untuk melihat riwayat seluruh pengerjaan JHP, durasi jam, dan kendala"/>
        <node ID="ID_28" TEXT="• Hasil Produksi (/hasil-produksi): Tab Jurnal Produksi (total target, realisasi &amp; rijek per jenis pekerjaan) &amp; Tab Barang Jadi (dari Digit)"/>
        <node ID="ID_29" TEXT="• Laporan Pekerjaan (/laporan-pekerjaan): Monitoring &amp; pelaporan tugas kerja harian per karyawan/bagian (Setting, QC, Cetak, Finishing, Gudang, Teknisi, Mesin)"/>
      </node>
    </node>
    <node ID="ID_30" TEXT="BAGIAN 2: DATA DIGIT, TRACKING, HRD, KEUANGAN &amp; DASHBOARD" POSITION="left" COLOR="#047857">
      <edge COLOR="#047857" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="2"/>
      <node ID="ID_31" TEXT="1. Kelompok Data Digit (Tarikan Data dari Digit via /sync)" COLOR="#0284c7">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_32" TEXT="• Sinkronisasi All Data (/sync): Tarik data berkala dari Digit ke database lokal SQLite SINTAK"/>
        <node ID="ID_33" TEXT="• Stok (/data-digit/stok/master-barang): Master barang, barcode, saldo awal, masuk, keluar, saldo akhir, harga beli &amp; jual"/>
        <node ID="ID_34" TEXT="• Pembelian (7 Menu): PR (/pr), SPPH Keluar (/spph-out), SPH Masuk (/sph-in), PO (/purchase-orders), Penerimaan (/penerimaan-pembelian), Rekap Pembelian (/rekap-pembelian-barang), Pelunasan Hutang (/pelunasan-hutang) -&gt; Mengalirkan data PR, PO, Penerimaan, Hutang ke Tracking Manufaktur"/>
        <node ID="ID_35" TEXT="• Penjualan (5 Menu): SPH Keluar (/sph-out), Sales Order Barang (/sales-orders), Laporan Penjualan (/sales), Pengiriman (/pengiriman), Pelunasan Piutang (/pelunasan-piutang) -&gt; Mengalirkan data SO, Pengiriman, Piutang ke Tracking Manufaktur"/>
        <node ID="ID_36" TEXT="• Akuntansi (2 Menu): Rek Akuntansi (/akuntansi/data/rek-akuntansi) &amp; Jurnal Umum (/akuntansi/laporan/jurnal-umum)"/>
      </node>
      <node ID="ID_37" TEXT="2. Tracking Manufaktur (/tracking-manufaktur)" COLOR="#7c3aed">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_38" TEXT="• Menghubungkan seluruh dokumen manufaktur dari Digit secara terpadu:"/>
        <node ID="ID_39" TEXT="   Sales Order (SO) -&gt; Order Produksi -&gt; BOM -&gt; PR / PO -&gt; Penerimaan Barang -&gt; BBB -&gt; Barang Jadi -&gt; Pengiriman (SJ) -&gt; Pelunasan Piutang"/>
      </node>
      <node ID="ID_40" TEXT="3. Kelompok Kalkulasi (Modul Mandiri)" COLOR="#a855f7">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_41" TEXT="• Pricelist (/pricelist): Simulator mandiri kalkulasi harga 20+ produk cetak (Buku, Dus, Stopmap, Brosur, Undangan, dll.)"/>
        <node ID="ID_42" TEXT="• HPP Kalkulasi (/hpp-kalkulasi): Input nilai HPP per nama order"/>
        <node ID="ID_43" TEXT="• Rekap Sales Order Barang (/rekap-sales-order): Rekap detail baris Sales Order dari Digit"/>
      </node>
      <node ID="ID_44" TEXT="4. Kelompok HRD &amp; Kedisiplinan Karyawan" COLOR="#e11d48">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_45" TEXT="• Karyawan (/employees): Master data karyawan (NIP, Nama, Jabatan, Bagian, Status)"/>
        <node ID="ID_46" TEXT="• Catat Kesalahan Karyawan (/records): Pencatatan insiden kelalaian kerja &amp; beban kerugian (infractions) -&gt; Mengalir ke Dashboard HRD"/>
      </node>
      <node ID="ID_47" TEXT="5. Kelompok Keamanan &amp; Pengaturan Sistem" COLOR="#475569">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_48" TEXT="• Log Aktivitas (/log-aktivitas): Audit trail catatan aksi user (CREATE, UPDATE, DELETE)"/>
        <node ID="ID_49" TEXT="• Telegram Users (/settings/telegram-users): Persetujuan (Approve/Reject) akses operator ke Bot Telegram"/>
        <node ID="ID_50" TEXT="• Hak Akses (/roles) &amp; Kelola User (/users): Manajemen akun login dan permission RBAC"/>
        <node ID="ID_51" TEXT="• Konversi Data (/settings/konversi-data/): Fasilitas migrasi file Excel HPP, JHP, dan Laporan Pekerjaan"/>
      </node>
      <node ID="ID_52" TEXT="6. Kelompok Dashboard (4 Dashboard Eksekutif)" COLOR="#059669">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_53" TEXT="• Dashboard Umum (/dashboard): UsersStatCard (statistik user &amp; role), Akses Cepat Administrasi, AktivitasTerbaruCard (log 8 aktivitas terbaru dari activity_logs)"/>
        <node ID="ID_54" TEXT="• Dashboard Produksi (/dashboard-manufaktur): OrdersStatCard (total order), JurnalStatCard (target vs realisasi lembar), ProduksiTrendChart (tren BBB &amp; hasil produksi), JurnalTerbaruCard"/>
        <node ID="ID_55" TEXT="• Dashboard HRD (/dashboard-hrd): KaryawanStatCard (total karyawan per bagian) &amp; InfractionsTrendChart (grafik tren kesalahan karyawan dari /records)"/>
        <node ID="ID_56" TEXT="• Dashboard Akuntansi (/dashboard-akunting): AkuntingTrendChart (grafik tren Debet vs Kredit), WarningBarangJadiCard, JurnalAkuntansiTerbaru"/>
      </node>
    </node>
  </node>
</map>
