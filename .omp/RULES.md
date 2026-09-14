# Aturan Wajib Proyek SINTAK — sticky, selalu berlaku tiap sesi

1. **Build**: DILARANG menjalankan `npm run build`.
2. **npx tsc / Changelog / Push**: HANYA dijalankan jika ada instruksi eksplisit dari pengguna. Dilarang menjalankan `npx tsc`, memperbarui changelog, atau melakukan `git push` tanpa diminta secara langsung.
3. **Changelog**: Jika diinstruksikan untuk update changelog, tanggal wajib akurat sesuai waktu pengerjaan nyata di hari itu, tidak boleh menghapus/menimpa log lama, dan hanya mencatat perubahan sesuai halaman/modul yang dimodifikasi.
4. **Commit**: Selalu lakukan commit Git lokal (`git commit -m "..."`) setelah setiap perubahan/perbaikan selesai dan diverifikasi.
5. **Konfirmasi & Tanya**: Jika ada hal yang belum jelas, ambigu, atau ragu mengenai kebutuhan bisnis/UI, tanyakan terlebih dahulu sebelum berasumsi atau mengeksekusi perubahan.
6. **Kecepatan Eksekusi & Anti-Looping**: DILARANG melakukan pengujian browser headless (Puppeteer / browser tab / eval) berulang-ulang saat menangani perbaikan styling/UI. Langsung terapkan solusi pada kode (read -> edit -> commit) untuk menghindari latency tinggi dan timeout proses.
