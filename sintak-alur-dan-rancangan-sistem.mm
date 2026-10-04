<?xml version="1.0" encoding="utf-8"?>
<map version="1.0.1">
  <node ID="ID_1" TEXT="ALIRAN DATA END-TO-END SINTAK (PT BUYA BAROKAH)" COLOR="#0f172a">
    <font NAME="SansSerif" BOLD="true" SIZE="15"/>
    <icon BUILTIN="bookmark"/>
    <node ID="ID_2" TEXT="1. TARIK DATA DIGIT &amp; PERSIAPAN ORDER (SOPd)" POSITION="right" COLOR="#0284c7">
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="1"/>
      <node ID="ID_3" TEXT="Menu: Sinkronisasi (/sync) [Ditarik dari ERP Digit]">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_4" TEXT="SINTAK menarik data: Order/SO, Stok Master Barang, Pembelian, Penjualan, Jurnal dari ERP Digit"/>
        <node ID="ID_5" TEXT="Data masuk ke database lokal SQLite SINTAK"/>
      </node>
      <node ID="ID_6" TEXT="Kalkulasi Harga &amp; HPP (/pricelist &amp; /hpp-kalkulasi)">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_7" TEXT="Estimator hitung spek produk cetak (20+ produk) &amp; HPP per order -&gt; Menjadi acuan harga"/>
      </node>
      <node ID="ID_8" TEXT="Menu: SOPd (/jurnal-harian-produksi/data/excel-sopd)">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_9" TEXT="Data Masuk: Gabungan dari Order Produksi (tarikan Digit) dan upload Excel SOPd"/>
        <node ID="ID_10" TEXT="Fungsi: Memuat daftar antrean pesanan (No SOPd, Nama Order, Oplah, Deadline, Harga)"/>
        <node ID="ID_11" TEXT="Aliran Data: No SOPd otomatis menjadi pilihan order saat input jadwal di JHP"/>
      </node>
    </node>
    <node ID="ID_12" TEXT="2. OPERASIONAL JURNAL HARIAN PRODUKSI (JHP) &amp; ANALISA" POSITION="right" COLOR="#b91c1c">
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="2"/>
      <node ID="ID_13" TEXT="Menu: Jurnal Harian Produksi (/jurnal-harian-produksi)">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_14" TEXT="Master Pendukung: Master Pekerjaan Jurnal Produksi (kategori &amp; jenis pekerjaan) &amp; Master Karyawan (nama operator per bagian)"/>
        <node ID="ID_15" TEXT="1. Penjadwalan (Target): Pilih Bagian (Cetak/Finishing/Setting/QC/Gudang/Teknisi/Mesin), Shift (1/2/3), Operator, No SOPd, Target"/>
        <node ID="ID_16" TEXT="Fitur Penjadwalan Cepat: Tombol 'Copy Jadwal' untuk menyalin susunan target dari hari sebelumnya"/>
        <node ID="ID_17" TEXT="2. Input Realisasi (Web JHP): Jam Mulai/Selesai, Realisasi Lembar Berhasil, Rijek/Afdruk, dan Kendala"/>
        <node ID="ID_18" TEXT="3. Input Realisasi (Bot Telegram): Operator yang diapprove bisa kirim realisasi langsung via chat telegram-bot (/api/telegram/realisasi)"/>
      </node>
      <node ID="ID_19" TEXT="Menu: Target Harian (/target)">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_20" TEXT="Rekap pemenuhan target shift hari ini per bagian dan operator"/>
      </node>
      <node ID="ID_21" TEXT="Menu: Analisa Produksi (/analisa)">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_22" TEXT="Cari per No Order: menampilkan seluruh entri JHP untuk order tersebut, durasi pengerjaan &amp; kendala"/>
        <node ID="ID_23" TEXT="-&gt; Mengalir ke Dashboard Produksi (/dashboard-manufaktur) menampilkan Target vs Realisasi &amp; Tren BBB"/>
      </node>
    </node>
    <node ID="ID_24" TEXT="3. QC (CATAT KESALAHAN), GUDANG JADI &amp; PENGIRIMAN" POSITION="left" COLOR="#7c3aed">
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="3"/>
      <node ID="ID_25" TEXT="Menu: Catat Kesalahan Karyawan (/records) [HRD]">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_26" TEXT="Pencatatan insiden kelalaian kerja karyawan (infractions) &amp; rincian beban kerugian finansial"/>
        <node ID="ID_27" TEXT="-&gt; Mengalir ke Dashboard HRD (/dashboard-hrd) menampilkan Statistik Karyawan &amp; Grafik Tren Kesalahan"/>
      </node>
      <node ID="ID_28" TEXT="Menu: Hasil Produksi (/hasil-produksi)">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_29" TEXT="Tab Jurnal: Total target, realisasi &amp; rijek per jenis pekerjaan"/>
        <node ID="ID_30" TEXT="Tab Barang Jadi: Stok produk selesai dari Digit"/>
      </node>
      <node ID="ID_31" TEXT="Gudang Barang Jadi (/barang-jadi)">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_32" TEXT="Penerimaan barang hasil produksi (tarikan Digit) -&gt; Serah terima fisik &amp; stok siap kirim"/>
      </node>
      <node ID="ID_33" TEXT="Menu: Tracking Manufaktur (/tracking-manufaktur)">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_34" TEXT="Lacak data manufaktur dari BOM, Order Produksi, BBB, Barang Jadi hingga Pengiriman &amp; Piutang (dari Digit)"/>
      </node>
      <node ID="ID_35" TEXT="Menu: Pengiriman (/pengiriman)">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_36" TEXT="Data Surat Jalan (SJ) pengiriman barang ke customer (Ditarik dari ERP Digit)"/>
      </node>
    </node>
    <node ID="ID_37" TEXT="4. KEUANGAN, AKUNTANSI &amp; 4 DASHBOARD UTAMA" POSITION="left" COLOR="#059669">
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="4"/>
      <node ID="ID_38" TEXT="Penjualan &amp; Pelunasan Piutang (/sales &amp; /pelunasan-piutang)">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_39" TEXT="Laporan faktur penjualan &amp; status pelunasan piutang customer (Ditarik dari ERP Digit)"/>
      </node>
      <node ID="ID_40" TEXT="Menu: Jurnal Umum (/akuntansi/laporan/jurnal-umum)">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_41" TEXT="Tarikan jurnal dari Digit &amp; pencatatan transaksi internal"/>
        <node ID="ID_42" TEXT="Tombol 'Analisis Jurnal': Verifikasi balancing Debet = Kredit"/>
      </node>
      <node ID="ID_43" TEXT="4 Dashboard Utama di SINTAK:">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_44" TEXT="1. Dashboard Umum (/dashboard): Statistik User &amp; Role (UsersStatCard), Akses Cepat Administrasi, dan Log 8 Aktivitas Sistem Terbaru (AktivitasTerbaruCard)"/>
        <node ID="ID_45" TEXT="2. Dashboard Produksi (/dashboard-manufaktur): Statistik Order Produksi, Jurnal Produksi (Target vs Realisasi), dan Grafik Tren BBB &amp; Hasil Produksi"/>
        <node ID="ID_46" TEXT="3. Dashboard HRD (/dashboard-hrd): Statistik Karyawan (KaryawanStatCard) &amp; Grafik Tren Kesalahan Karyawan (InfractionsTrendChart dari /records)"/>
        <node ID="ID_47" TEXT="4. Dashboard Akuntansi (/dashboard-akunting): Grafik Tren Jurnal Umum (AkuntingTrendChart) &amp; Warning Barang Jadi"/>
      </node>
    </node>
  </node>
</map>
