<?xml version="1.0" encoding="utf-8"?>
<map version="1.0.1">
  <node ID="ID_1" TEXT="SINTAK - ALUR KERJA SETIAP ROLE PENGGUNA (PT BUYA BAROKAH)" COLOR="#0f172a">
    <font NAME="SansSerif" BOLD="true" SIZE="15"/>
    <icon BUILTIN="bookmark"/>
    <node ID="ID_2" TEXT="TIM OPERASIONAL PRODUKSI &amp; TEKNIS LAPANGAN" POSITION="right" COLOR="#b91c1c">
      <edge COLOR="#b91c1c" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="1"/>
      <node ID="ID_3" TEXT="Role: Admin Penjadwalan" COLOR="#ef4444">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_4" TEXT="• Sumber Data: Tabel orders (Digit via /sync), Tabel sopd (upload Excel), Tabel employees (operator), Tabel master_pekerjaan"/>
        <node ID="ID_5" TEXT="• Step 1 (SOPd /data/excel-sopd): Cek antrean pesanan (No SOPd, Oplah, Deadline, Harga), inline edit jika ada revisi"/>
        <node ID="ID_6" TEXT="• Step 2 (JHP /jurnal-harian-produksi): Susun target shift (pilih Bagian, Shift 1/2/3, Operator, No SOPd, Target). Pakai tombol 'Copy Jadwal'"/>
        <node ID="ID_7" TEXT="• Output: Tersimpan di tabel jurnal_harian_produksi -&gt; Mengalir ke menu Target Harian (/target)"/>
      </node>
      <node ID="ID_8" TEXT="Role: Admin Realisasi" COLOR="#ef4444">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_9" TEXT="• Sumber Data: Tabel jurnal_harian_produksi (jadwal dari Admin Penjadwalan) &amp; Laporan fisik pengerjaan harian operator"/>
        <node ID="ID_10" TEXT="• Step 1 (JHP Realisasi): Buka baris jadwal shift hari ini, input Jam Mulai/Selesai &amp; jumlah lembar Realisasi yang selesai"/>
        <node ID="ID_11" TEXT="• Step 2 (Catat Rijek &amp; Kendala): Input lembar rusak afdruk setup &amp; jalan (Rijek), Inscheet, dan catat kendala teknis lapangan"/>
        <node ID="ID_12" TEXT="• Output: Update tabel jurnal_harian_produksi (realisasi, rijek, inscheet, jam, kendala) -&gt; Mengalir ke menu Hasil Produksi (/hasil-produksi)"/>
      </node>
      <node ID="ID_13" TEXT="Role: Produksi (Supervisor)" COLOR="#ef4444">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_14" TEXT="• Sumber Data: Tabel orders (Digit), Tabel jurnal_harian_produksi, Tabel produksi_barang_jadi (Digit)"/>
        <node ID="ID_15" TEXT="• Step 1 (Dashboard Produksi /dashboard-manufaktur): Pantau total pesanan (OrdersStatCard), rasio target vs realisasi (JurnalStatCard), grafik tren BBB &amp; Hasil Produksi"/>
        <node ID="ID_16" TEXT="• Step 2 (Target &amp; Hasil): Buka /target untuk shift yang belum capai kuota, buka /hasil-produksi untuk akumulasi lembar dan barang jadi"/>
        <node ID="ID_17" TEXT="• Output: Kontrol performa ritme kerja dan evaluasi kendala mesin cetak"/>
      </node>
      <node ID="ID_18" TEXT="Role: Setting" COLOR="#f97316">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_19" TEXT="• Sumber Data: Tabel sopd &amp; orders; Filter divisi terkunci otomatis pada bagian SETTING di role_laporan_pekerjaan_config"/>
        <node ID="ID_20" TEXT="• Step 1 (/laporan-pekerjaan): Buka form laporan pekerjaan (terkunci SETTING), pilih PIC dari employees dan No Order"/>
        <node ID="ID_21" TEXT="• Step 2: Catat aktivitas desain, layout, cek file, output Plat CTP, jam kerja, dan jumlah plate yang dibuat"/>
        <node ID="ID_22" TEXT="• Output: Tabel laporan_pekerjaan terisi (bagian SETTING); Plat CTP siap naik mesin cetak"/>
      </node>
      <node ID="ID_23" TEXT="Role: Cetak" COLOR="#f97316">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_24" TEXT="• Sumber Data: Tabel sopd &amp; orders (No Order, oplah cetak); Akun operator di telegram_users"/>
        <node ID="ID_25" TEXT="• Step 1 (Opsi 1): Input Laporan Pekerjaan (/laporan-pekerjaan) untuk rekap lembar cetak mesin harian"/>
        <node ID="ID_26" TEXT="• Step 1 (Opsi 2): Chat Bot Telegram (/api/telegram/realisasi) kirim format chat: tgl, shift, no order, lembar realisasi &amp; rijek"/>
        <node ID="ID_27" TEXT="• Step 2: Pantau rekap lembar pengerjaan di menu Hasil Produksi (/hasil-produksi)"/>
        <node ID="ID_28" TEXT="• Output: Tersimpan di laporan_pekerjaan atau jurnal_harian_produksi (created_by: telegram-bot)"/>
      </node>
      <node ID="ID_29" TEXT="Role: Finishing" COLOR="#f97316">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_30" TEXT="• Sumber Data: Tabel sopd &amp; orders; Filter bagian terkunci pada FINISHING di role_laporan_pekerjaan_config"/>
        <node ID="ID_31" TEXT="• Step 1 (/laporan-pekerjaan): Catat tugas potong kertas, lipat, susun, lem panas/jilid, laminasi, pon, atau packing"/>
        <node ID="ID_32" TEXT="• Step 2: Dapat juga mengirim laporan via chat Bot Telegram (/api/telegram/realisasi)"/>
        <node ID="ID_33" TEXT="• Output: Tersimpan di tabel laporan_pekerjaan dan/atau jurnal_harian_produksi"/>
      </node>
      <node ID="ID_34" TEXT="Role: Quality Control" COLOR="#f97316">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_35" TEXT="• Sumber Data: Lembar cetak &amp; barang jadi finishing; Spesifikasi order di sopd &amp; orders"/>
        <node ID="ID_36" TEXT="• Step 1 (/laporan-pekerjaan): Pilih bagian QC, input hasil inspeksi ketepatan warna, register cetak, kerapian potong/jilid"/>
        <node ID="ID_37" TEXT="• Step 2 (/hasil-produksi): Verifikasi lembar bagus vs rijek; jika ada kelalaian fatal dilaporkan ke HRD"/>
        <node ID="ID_38" TEXT="• Output: Tersimpan di laporan_pekerjaan (bagian QC); jaminan mutu sebelum barang dikirim"/>
      </node>
      <node ID="ID_39" TEXT="Role: Kepala Seksi Pra Cetak &amp; Pasca Cetak" COLOR="#ea580c">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_40" TEXT="• Sumber Data: Tabel sopd &amp; orders, Tabel laporan_pekerjaan (sesuai bagian SETTING atau FINISHING)"/>
        <node ID="ID_41" TEXT="• Step 1 (/data/excel-sopd): Kontrol antrean order mendekati deadline (Pra: cek file setting/plat; Pasca: cek jilid/finishing)"/>
        <node ID="ID_42" TEXT="• Step 2 (/laporan-pekerjaan &amp; /hasil-produksi): Supervisi kendala tim, durasi jam kerja, dan validasi fisik barang jadi"/>
        <node ID="ID_43" TEXT="• Output: Memastikan kelancaran proses pra-cetak dan ketepatan jadwal finishing"/>
      </node>
    </node>
    <node ID="ID_44" TEXT="KALKULASI, HRD, AKUNTING &amp; ADMINISTRASI" POSITION="left" COLOR="#047857">
      <edge COLOR="#047857" WIDTH="2"/>
      <font NAME="SansSerif" BOLD="true" SIZE="13"/>
      <icon BUILTIN="2"/>
      <node ID="ID_45" TEXT="Role: Kalkulasi &amp; Kalkulasi2" COLOR="#d97706">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_46" TEXT="• Sumber Data: src/lib/global-master-params.ts (master tarif kertas, plat, mesin, jilid), Tabel sales_orders, Tabel hpp_kalkulasi"/>
        <node ID="ID_47" TEXT="• Step 1 (/pricelist): Simulasi hitung harga 20+ produk cetak (Buku, Dus, Brosur, Stopmap, Undangan, Kalender, dll.)"/>
        <node ID="ID_48" TEXT="• Step 2 (/hpp-kalkulasi): Input nilai HPP acuan per nama order produksi"/>
        <node ID="ID_49" TEXT="• Step 3 (/rekap-sales-order): Analisa rincian baris SO Digit untuk cek margin keuntungan"/>
        <node ID="ID_50" TEXT="• Khusus Kalkulasi2: Hanya memiliki akses simulator di menu /pricelist"/>
        <node ID="ID_51" TEXT="• Output: Tersimpan di tabel hpp_kalkulasi &amp; saved_calculations; referensi harga penawaran Sales"/>
      </node>
      <node ID="ID_52" TEXT="Role: HRD (Personalia)" COLOR="#e11d48">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_53" TEXT="• Sumber Data: Tabel employees (master karyawan perusahaan) &amp; Laporan insiden kelalaian dari divisi produksi"/>
        <node ID="ID_54" TEXT="• Step 1 (/employees): Kelola master pegawai (NIP, Nama, Jabatan, Bagian, Status Aktif) -&gt; dropdown operator di sistem"/>
        <node ID="ID_55" TEXT="• Step 2 (/records): Catat insiden kesalahan kerja, operator terkait, kronologi, dan nominal beban kerugian"/>
        <node ID="ID_56" TEXT="• Step 3 (/dashboard-hrd): Pantau grafik bulanan tren insiden kesalahan kerja &amp; sebaran karyawan aktif"/>
        <node ID="ID_57" TEXT="• Output: Tersimpan di tabel employees dan tabel infractions"/>
      </node>
      <node ID="ID_58" TEXT="Role: Akunting (Keuangan)" COLOR="#16a34a">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_59" TEXT="• Sumber Data: Pusat data Digit (penjualan, piutang, jurnal), Tabel jurnal_umum &amp; rek_akuntansi lokal"/>
        <node ID="ID_60" TEXT="• Step 1 (/sync): Sinkronisasi berkala data keuangan Digit ke database lokal SINTAK"/>
        <node ID="ID_61" TEXT="• Step 2 (/akuntansi/laporan/jurnal-umum): Audit mutasi Debet/Kredit per tanggal/akun, klik 'Analisis Jurnal' untuk laba/rugi"/>
        <node ID="ID_62" TEXT="• Step 3 (/dashboard-akunting): Pantau grafik tren Debet vs Kredit bulanan &amp; warning barang jadi"/>
        <node ID="ID_63" TEXT="• Output: Tersimpan di tabel jurnal_umum dan rek_akuntansi; rekap kesehatan finansial perusahaan"/>
      </node>
      <node ID="ID_64" TEXT="Role: Super Admin" COLOR="#475569">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_65" TEXT="• Sumber Data: Tabel users, app_roles, role_permissions, telegram_users, activity_logs"/>
        <node ID="ID_66" TEXT="• Step 1 (/users &amp; /roles): Buat akun pengguna, reset password bcrypt, konfigurasi hak akses RBAC per role"/>
        <node ID="ID_67" TEXT="• Step 2 (/settings/telegram-users): Verifikasi dan klik 'Approve' operator agar bisa kirim realisasi via Telegram"/>
        <node ID="ID_68" TEXT="• Step 3 (/settings/konversi-data &amp; /log-aktivitas): Fasilitas migrasi Excel &amp; audit trail seluruh aktivitas user"/>
        <node ID="ID_69" TEXT="• Output: Otoritas dan stabilitas operasional seluruh sistem SINTAK"/>
      </node>
      <node ID="ID_70" TEXT="Role: Demo &amp; Demo 2" COLOR="#7c3aed">
        <font NAME="SansSerif" BOLD="true"/>
        <node ID="ID_71" TEXT="• Sumber Data: database_dev.sqlite dengan hak akses terbatas"/>
        <node ID="ID_72" TEXT="• Demo: Hanya dapat mengakses Stok Barang, PO Pembelian, dan Tracking Manufaktur (presentasi alur Digit)"/>
        <node ID="ID_73" TEXT="• Demo 2: Hanya dapat mengakses Hasil Produksi dan Laporan Pekerjaan (demo monitoring kerja)"/>
        <node ID="ID_74" TEXT="• Output: Peninjauan fitur sistem tanpa risiko merusak data operasional riil"/>
      </node>
    </node>
  </node>
</map>
