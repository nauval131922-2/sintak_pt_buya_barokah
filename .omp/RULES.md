# Aturan Wajib Proyek SINTAK — sticky, selalu berlaku tiap sesi

1. **Build**: DILARANG menjalankan `npm run build`.
2. **npx tsc / Changelog / Push**: HANYA dijalankan jika ada instruksi eksplisit dari pengguna. Dilarang menjalankan `npx tsc`, memperbarui changelog, atau melakukan `git push` tanpa diminta secara langsung.
3. **Changelog**: Jika diinstruksikan untuk update changelog, tanggal wajib akurat sesuai waktu pengerjaan nyata di hari itu, tidak boleh menghapus/menimpa log lama, dan hanya mencatat perubahan sesuai halaman/modul yang dimodifikasi.
4. **Commit**: Selalu lakukan commit Git lokal (`git commit -m "..."`) segera setelah setiap perubahan/perbaikan selesai dan diverifikasi di terminal. Respons yang mengubah berkas wajib menyertakan hash commit terminal.
5. **Konfirmasi & Tanya**: Jika ada hal yang belum jelas, ambigu, atau ragu mengenai kebutuhan bisnis/UI, tanyakan terlebih dahulu sebelum berasumsi atau mengeksekusi perubahan.
6. **Kecepatan Eksekusi & Anti-Looping**: DILARANG melakukan pengujian browser headless (Puppeteer / browser tab / eval) berulang-ulang saat menangani perbaikan styling/UI. Langsung terapkan solusi pada kode (read -> edit -> commit) untuk menghindari latency tinggi dan timeout proses.
7. **Protokol Audit Excel Pricelist (PANDUAN_AUDIT_EXCEL_SINTAK.md & AI_RULES.md)**:
   - **Ekstraksi Programatis di Awal (Pos 1)**: Wajib menjalankan skrip untuk mengekstrak seluruh aturan `dataValidation` (dropdown) dari sheet Master sebelum menulis kode apa pun. Dilarang melihat manual atau berasumsi.
   - **Anti-Conditional Hijacking & Direct Binding 1:1**: Setiap variabel parameter form input wajib terhubung langsung 1:1 ke rumusnya tanpa logika pengkondisian yang membelokkan variabel antar-mesin atau antar-tier oplah.
   - **Uji Reaktivitas Parameter Wajib**: Skrip benchmark wajib meng-assert bahwa perubahan nilai parameter form input menghasilkan perubahan HPP nyata (Delta HPP > 0). Jika Delta = 0, audit otomatis GAGAL/REJECT.
    - **Permutasi Dropdown & Opsi Wajib**: Seluruh opsi dropdown hasil ekstraksi (pilihan mesin cetak, varian bahan, ukuran, opsi finishing seperti laminasi/pond/spiral/poly/lem) wajib diuji kombinasinya di terminal dan menghasilkan selisih Rp 0.
    - **Konsistensi UI Simulator (POS 5)**: Tombol simpan kalkulasi WAJIB berada di bawah tabel breakdown HPP (kolom kanan `lg:col-span-7`) berupa tombol aksi full-width (`w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white` berlabel `Simpan Kalkulasi Ini ke Daftar Kalkulasi`). Dilarang meletakkan form teks input kecil dan tombol simpan mini di dalam kolom kiri input spesifikasi.
    - **Aturan Stop & Tanya**: Jika ditemukan inkonsistensi nilai/parameter antar file master sejenis, dilarang membuat rumus kompromi sendiri atau mematikan variabel. Wajib berhenti dan tanyakan kepada pengguna.
