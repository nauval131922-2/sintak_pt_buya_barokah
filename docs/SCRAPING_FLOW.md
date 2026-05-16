# Scraping & Import Flow

Dokumen ini adalah playbook cepat untuk perubahan fitur scraping/import data. Baca setelah `AGENTS.md` dan `docs/REPO_MAP.md` saat task menyentuh endpoint scraping, import, sync, atau pencatatan aktivitas.

## Tujuan

- Menjaga alur scraping/import tetap konsisten, aman, dan mudah diaudit.
- Memastikan setiap proses simpan/update data penting meninggalkan jejak di `activity_logs`.
- Mengurangi briefing ulang saat sesi AI berikutnya melanjutkan pekerjaan scraping.

## Area Kode Utama

- `src/app/api/` - route handler scraping, import, sync, dan endpoint pendukung.
- `src/lib/` - helper database, logger, schema, session, dan utilitas backend.
- `src/components/` - komponen UI untuk trigger scraping/import, status, dan feedback user.
- `scripts/` - script operasional database, audit, import, atau validasi data.

## Pola Wajib Setelah Simpan Data

Setiap endpoint scraping/import yang berhasil membuat, memperbarui, atau menghapus data operasional wajib mencatat aktivitas.

Gunakan pola yang sudah ada di codebase, biasanya melalui helper logging seperti `logActivity` atau insert langsung ke tabel `activity_logs` bila endpoint terkait memang memakai pola tersebut.

Minimal payload aktivitas mencakup:

- aksi yang jelas, misalnya `scraping.success`, `import.upsert`, atau nama aksi sejenis yang sudah dipakai di modul terkait;
- target/modul data, misalnya jurnal umum, master barang, rekening akuntansi, atau data produksi;
- jumlah data diproses, dibuat, diperbarui, dilewati, dan gagal bila tersedia;
- konteks request aman seperti periode, sumber scraping, filter, atau batch id;
- error message yang sudah disanitasi untuk proses gagal, tanpa membocorkan secret.

## Checklist Perubahan Aman

- Pastikan auth/session/permission tetap sesuai pola endpoint sekitar.
- Pertahankan dedupe, upsert, atau guard anti-duplikasi sebelum insert data baru.
- Jangan log credential, token, cookie, password, atau response mentah dari sumber eksternal.
- Pisahkan error scraping eksternal dari error validasi data agar mudah didiagnosis.
- Kembalikan response API yang ringkas: status, message, count, dan detail aman yang dibutuhkan UI.
- Jika mengubah schema atau query database, cek pemakaian terkait di route, UI, dan script operasional.

## Validasi Cepat

Untuk perubahan kode scraping/import, lakukan validasi paling spesifik yang relevan:

1. Jalankan lint/test terarah untuk file endpoint atau komponen yang diubah.
2. Cek response sukses dan gagal tidak membocorkan secret.
3. Pastikan `activity_logs` bertambah untuk proses yang berhasil menyimpan data.
4. Review `git diff` agar perubahan tidak menyentuh modul lain tanpa alasan.

Jika perubahan hanya dokumentasi, cukup review diff tanpa lint/build penuh.
