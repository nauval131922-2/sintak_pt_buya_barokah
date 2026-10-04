<?xml version="1.0" encoding="utf-8"?>
<map version="1.0.1">
  <node ID="ID_1" TEXT="ALIRAN DATA END-TO-END SISTEM SINTAK" COLOR="#0f172a">
    <font NAME="SansSerif" BOLD="true" SIZE="15"/>
    <icon BUILTIN="bookmark"/>
    <node ID="ID_2" TEXT="1. SUMBER DATA AWAL (TARIK DIGIT &amp; ESTIMASI)" POSITION="right" COLOR="#0284c7">
      <edge COLOR="#0284c7" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="1"/>
      <node ID="ID_3" TEXT="Tarik Data ERP Digit (Menu: /sync)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="refresh"/>
        <node ID="ID_4" TEXT="Fungsi: SINTAK hanya menarik data dari ERP Digit (tidak buat transaksi baru di sini)">
          <font NAME="SansSerif" ITALIC="true"/>
        </node>
        <node ID="ID_5" TEXT="Data yang ditarik: Data Order/SO, Stok Master Barang, Pembelian, Hutang/Piutang, dan Jurnal Umum"/>
        <node ID="ID_6" TEXT="Cara pakai: Pilih periode tanggal/bulan -&gt; Klik 'Mulai Sinkronisasi' -&gt; Data otomatis masuk ke database SINTAK"/>
        <node ID="ID_7" TEXT="Aliran Data: Data Order masuk ke daftar antrean SOPd (/jurnal-harian-produksi/data/excel-sopd)"/>
      </node>
      <node ID="ID_8" TEXT="Estimasi Harga (Menu: /pricelist &amp; /hpp-kalkulasi)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="calculator"/>
        <node ID="ID_9" TEXT="Fungsi: Menghitung estimasi biaya cetak &amp; harga jual produk (Buku, Dus, Stopmap, dll.)"/>
        <node ID="ID_10" TEXT="Cara pakai: Masukkan oplah, ukuran, jumlah halaman, jenis kertas &amp; finishing -&gt; Sistem hitung kebutuhan plano &amp; harga"/>
        <node ID="ID_11" TEXT="Aliran Data: Menjadi acuan perkiraan harga saat order masuk ke SOPd"/>
      </node>
    </node>
    <node ID="ID_12" TEXT="2. DOKUMEN KERJA ORDER (SOPd)" POSITION="right" COLOR="#b45309">
      <edge COLOR="#b45309" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="2"/>
      <node ID="ID_13" TEXT="Menu: SOPd (/jurnal-harian-produksi/data/excel-sopd)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="table"/>
        <node ID="ID_14" TEXT="Asal Data: Otomatis terisi dari hasil tarikan ERP Digit (atau import file Excel SOPd)"/>
        <node ID="ID_15" TEXT="Cara Pakai di Halaman Ini:">
          <font NAME="SansSerif" BOLD="true"/>
          <node ID="ID_16" TEXT="- Filter tanggal order &amp; cari nomor SOPd / nama order"/>
          <node ID="ID_17" TEXT="- Edit cepat: Klik 2x cell 'Perkiraan Harga', 'Deadline', atau 'Keterangan' untuk ubah langsung"/>
          <node ID="ID_18" TEXT="- Jika order terkendala (kertas kosong / tunggu plat): Centang 'Pending Produksi' &amp; isi alasan pending"/>
        </node>
        <node ID="ID_19" TEXT="Aliran Data ke Mana:" COLOR="#15803d">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="launch"/>
          <node ID="ID_20" TEXT="-&gt; Nomor SOPd yang aktif (tidak pending) otomatis mengalir menjadi pilihan order di menu Jurnal Harian Produksi (JHP)"/>
          <node ID="ID_21" TEXT="-&gt; Status pending terbaca langsung di menu Tracking Manufaktur"/>
        </node>
      </node>
    </node>
    <node ID="ID_22" TEXT="3. LANTAI PABRIK (JURNAL HARIAN PRODUKSI / JHP)" POSITION="right" COLOR="#b91c1c">
      <edge COLOR="#b91c1c" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="3"/>
      <node ID="ID_23" TEXT="Menu: Jurnal Harian Produksi (/jurnal-harian-produksi) [INTI OPERASIONAL]">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="edit"/>
        <node ID="ID_24" TEXT="Asal Data: Menarik No Order dari SOPd + Mesin dari Master Pekerjaan + Operator dari Master Karyawan"/>
        <node ID="ID_25" TEXT="Cara Pakai di Halaman Ini (Step-by-Step):">
          <font NAME="SansSerif" BOLD="true"/>
          <node ID="ID_26" TEXT="1. Pilih Tanggal Kerja dan pilih Bagian (misal: CETAK / FINISHING)"/>
          <node ID="ID_27" TEXT="2. Penjadwalan: Klik 'Tambah Jadwal' atau 'Copy Jadwal' (salin susunan shift kemarin) -&gt; Pilih Mesin, No SOPd, Operator, &amp; Target Lembar"/>
          <node ID="ID_28" TEXT="3. Realisasi Cetak: Operator input Jam Mulai, Jam Selesai, dan Lembar Berhasil"/>
          <node ID="ID_29" TEXT="4. Catat Rijek/Waste: Operator input jumlah lembar rusak (afdruk setel mesin vs afdruk saat jalan)"/>
          <node ID="ID_30" TEXT="5. Hitung Cepat: Ketik rumus di cell (misal '2000+500') otomatis terhitung jadi 2500"/>
        </node>
        <node ID="ID_31" TEXT="Aliran Data dari JHP Mengalir ke 4 Arah:" COLOR="#15803d">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="launch"/>
          <node ID="ID_32" TEXT="-&gt; Arah 1: Ke menu 'Target Harian' (/target) untuk rekap capaian harian shift"/>
          <node ID="ID_33" TEXT="-&gt; Arah 2: Ke menu 'Analisa Produksi' (/analisa) untuk hitung persentase efisiensi mesin vs target"/>
          <node ID="ID_34" TEXT="-&gt; Arah 3: Ke menu 'Hasil Produksi' (/hasil-produksi) untuk rekap barang selesai cetak"/>
          <node ID="ID_35" TEXT="-&gt; Arah 4: Ke menu 'Catat Kesalahan' (/records) jika ada salah cetak/kelalaian fatal"/>
        </node>
      </node>
    </node>
    <node ID="ID_36" TEXT="4. KONTROL KUALITAS &amp; CATAT KESALAHAN" POSITION="left" COLOR="#e11d48">
      <edge COLOR="#e11d48" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="4"/>
      <node ID="ID_37" TEXT="Menu: Catat Kesalahan Karyawan (/records) [QC &amp; HRD]">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="messagebox_warning"/>
        <node ID="ID_38" TEXT="Asal Data: Laporan lembar rijek berlebih dari JHP atau temuan inspeksi fisik oleh petugas QC"/>
        <node ID="ID_39" TEXT="Cara Pakai di Halaman Ini:">
          <font NAME="SansSerif" BOLD="true"/>
          <node ID="ID_40" TEXT="- Klik 'Tambah Catatan Kesalahan'"/>
          <node ID="ID_41" TEXT="- Pilih Karyawan, Bagian Kerja, dan Tanggal Kejadian"/>
          <node ID="ID_42" TEXT="- Tulis deskripsi kesalahan (contoh: salah potong 5 rim, plat warna terbalik)"/>
          <node ID="ID_43" TEXT="- Masukkan taksiran Kerugian Biaya (Rp) &amp; pilih Tingkat Sanksi (Teguran/SP)"/>
        </node>
        <node ID="ID_44" TEXT="Aliran Data ke Mana:" COLOR="#15803d">
          <font NAME="SansSerif" BOLD="true"/>
          <icon BUILTIN="launch"/>
          <node ID="ID_45" TEXT="-&gt; Otomatis kirim pesan notifikasi alert via Bot Telegram ke grup manajemen pimpinan"/>
          <node ID="ID_46" TEXT="-&gt; Mengalir ke Dashboard HRD (/dashboard-hrd) untuk grafik tren kesalahan &amp; KPI karyawan"/>
        </node>
      </node>
    </node>
    <node ID="ID_47" TEXT="5. HASIL JADI, TRACKING &amp; PENGIRIMAN" POSITION="left" COLOR="#4f46e5">
      <edge COLOR="#4f46e5" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="5"/>
      <node ID="ID_48" TEXT="Menu: Hasil Produksi (/hasil-produksi) &amp; Gudang Jadi">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="package"/>
        <node ID="ID_49" TEXT="Asal Data: Kuantitas lembar selesai dari JHP setelah melewati tahap Finishing (potong/lipat/laminasi/jilid)"/>
        <node ID="ID_50" TEXT="Cara pakai: Verifikasi jumlah barang jadi fisik -&gt; Tandai status 'Produksi Selesai' -&gt; Masuk ke stok Gudang Barang Jadi"/>
        <node ID="ID_51" TEXT="Aliran Data: Menjadi barang siap kirim di menu Pengiriman"/>
      </node>
      <node ID="ID_52" TEXT="Menu: Tracking Manufaktur (/tracking-manufaktur)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="search"/>
        <node ID="ID_53" TEXT="Asal Data: Menggabungkan data SOPd + JHP + Hasil Produksi secara real-time"/>
        <node ID="ID_54" TEXT="Cara pakai: Masukkan No Faktur / No SOPd di kotak pencarian -&gt; Sistem tampilkan timeline posisi pesanan (Pra-Cetak -&gt; Cetak -&gt; Finishing -&gt; Siap Kirim)"/>
        <node ID="ID_55" TEXT="Aliran Data: Pusat pantau status bagi Tim Sales &amp; Manajemen"/>
      </node>
      <node ID="ID_56" TEXT="Menu: Pengiriman (/pengiriman)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="forward"/>
        <node ID="ID_57" TEXT="Asal Data: Nomor order yang sudah selesai diproduksi dan siap di gudang"/>
        <node ID="ID_58" TEXT="Cara pakai: Pilih nomor order -&gt; Terbitkan Surat Jalan (SJ) -&gt; Ekspedisi antar ke customer -&gt; Customer tanda tangan tanda terima"/>
        <node ID="ID_59" TEXT="Aliran Data: Bukti Surat Jalan diserahkan ke Bagian Keuangan untuk proses penagihan"/>
      </node>
    </node>
    <node ID="ID_60" TEXT="6. KEUANGAN &amp; 4 DASHBOARD EKSEKUTIF" POSITION="left" COLOR="#059669">
      <edge COLOR="#059669" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="12"/>
      <icon BUILTIN="6"/>
      <node ID="ID_61" TEXT="Menu: Jurnal Umum (/akuntansi/laporan/jurnal-umum)">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="book"/>
        <node ID="ID_62" TEXT="Asal Data: Tarikan data jurnal dari ERP Digit &amp; pencatatan keuangan internal"/>
        <node ID="ID_63" TEXT="Cara pakai: Filter tanggal -&gt; Cek mutasi debet/kredit -&gt; Klik tombol 'Analisis Jurnal' untuk verifikasi keseimbangan neraca"/>
        <node ID="ID_64" TEXT="Aliran Data: Mengalir ke grafik keuangan di Dashboard Akuntansi"/>
      </node>
      <node ID="ID_65" TEXT="Pusat Pantau: 4 Dashboard Eksekutif">
        <font NAME="SansSerif" BOLD="true"/>
        <icon BUILTIN="chart"/>
        <node ID="ID_66" TEXT="- Dashboard Umum (/dashboard): Ringkasan status order aktif dan ikhtisar harian"/>
        <node ID="ID_67" TEXT="- Dashboard Manufaktur (/dashboard-manufaktur): Tren volume cetak bulanan &amp; rasio efisiensi mesin (dari JHP)"/>
        <node ID="ID_68" TEXT="- Dashboard HRD (/dashboard-hrd): Tren catatan kesalahan operator &amp; kepatuhan SOP (dari records)"/>
        <node ID="ID_69" TEXT="- Dashboard Akuntansi (/dashboard-akunting): Tren pendapatan, beban, dan debit/kredit bulanan (dari Jurnal)"/>
      </node>
    </node>
  </node>
</map>
