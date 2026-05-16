# AGENTS.md — Panduan Agent untuk SINTAK ERP

## Ringkasan Project
- Project ini adalah aplikasi ERP/internal web berbasis Next.js App Router untuk PT Buya Barokah/SINTAK.
- Fokus utama mencakup dashboard, tracking manufaktur, akuntansi, sales order, purchase order, stok, scraping/import data, jurnal harian produksi, dan manajemen user/role.
- Bahasa utama: TypeScript, React, Next.js, Tailwind CSS, SQLite/libSQL.
- Gunakan Bahasa Indonesia saat menjelaskan pekerjaan, ringkasan perubahan, dan rekomendasi commit.

## Perintah Utama
- Install dependency: `npm install`
- Jalankan dev server: `npm run dev`
- Build produksi: `npm run build`
- Lint: `npm run lint`
- Init database default: `npm run init-db`
- Init database dev: `npm run init-db:dev`
- Migrasi sales 2025: `npm run migrate:sales2025`

Catatan: `npm run build` menjalankan `prebuild`, yaitu `npm run init-db`, sebelum build.

## Struktur Repository
- `src/app/` — Next.js App Router; halaman, layout, dan route handler API.
- `src/app/api/` — endpoint backend internal, scraping, import, export, sync, dan CRUD data.
- `src/components/` — komponen UI reusable dan tabel domain.
- `src/components/ui/` — komponen UI dasar seperti modal, table, copy button.
- `src/lib/` — utilitas server/client: database, auth/session, permissions, schema, logger, date utils, activity log.
- `scripts/` — script operasional database, audit, migration, import, debug, dan data checking.
- `test/` — test JavaScript/Node untuk validasi behavior tertentu.
- `scratch/` — script eksperimen/debug sementara; jangan jadikan sumber utama tanpa verifikasi.
- `docs/` — dokumentasi kerja, aturan development, resume sesi, tutorial perubahan, dan backlog.
- `public/` — aset statis.
- `Referensi/` — bahan referensi eksternal/internal jika tersedia.

## File Konteks yang Wajib Diperhatikan
- `AI_RULES.md` — aturan UI/UX, workflow, integritas data, dan aturan kerja AI.
- `docs/REPO_MAP.md` — peta struktur repo (entry point penting, modul, dan lokasi file kunci).
- `docs/DEV_RULES.md` — aturan pengembangan wajib, terutama activity log untuk scraping/import.
- `docs/RESUME_SESSION.md` — cara memahami konteks lanjutan antar sesi.
- `docs/AI_SESSION_SUMMARY.md` — ringkasan sesi terakhir.
- `docs/task.md` — backlog/progress yang sedang berjalan.
- `docs/BUILD_FROM_SCRATCH.md` — panduan rebuild/setup dari awal.
- `PANDUAN_OPERASIONAL.md` — panduan operasional aplikasi jika relevan.

## Workflow Saat Menerima Task
- Untuk fitur baru atau perubahan signifikan, klarifikasi dulu jika hasil akhir, batasan, atau perilaku yang harus dipertahankan belum jelas.
- Untuk bug yang spesifik atau penyebabnya sudah jelas, boleh langsung investigasi dan perbaiki.
- Sebelum edit, pahami pola file sekitar dan ikuti style yang sudah ada.
- Buat perubahan kecil, fokus, dan langsung ke root cause.
- Jangan memperbaiki bug lain yang tidak diminta kecuali diperlukan untuk menyelesaikan task.
- Setelah perubahan, jalankan validasi paling spesifik yang relevan; gunakan `npm run lint` atau `npm run build` jika perubahan cukup luas dan memungkinkan.
- Jangan commit, branch, push, atau reset git kecuali diminta eksplisit.

## Aturan UI/UX Penting
- Untuk tabel/data padat, gunakan font 10–12px dengan `leading-normal` atau `leading-relaxed`.
- Gunakan warna harmonis seperti `slate-800` untuk teks utama dan `gray-500` untuk metadata; hindari warna pure/basic yang terlalu keras.
- Data dalam dashboard/tracking sebaiknya memakai pola card: `bg-white border border-gray-100 rounded-lg p-3 shadow-sm`.
- Badge, nomor faktur, dan teks identitas harus left-aligned.
- Tabel lebar wajib nyaman untuk horizontal scroll; jika memakai drag-to-scroll, gunakan `cursor-grab`, `active:cursor-grabbing`, dan cegah text selection saat drag.
- Untuk tabel sangat padat, boleh nonaktifkan hover row jika card di dalam tabel sudah memberi kontras cukup.

## Aturan Data dan Backend
- Jangan mengarang label/status. Tampilkan nilai dari database/API apa adanya kecuali ada mapping resmi di kode.
- Gunakan null-safe check dan fallback yang aman agar UI/API tidak crash saat data kosong.
- Jaga paritas data 1:1 untuk modul tracking, scraping, import, dan laporan.
- Setiap scraping API eksternal atau upload/import Excel massal wajib menulis activity log manual setelah data berhasil disimpan, terutama untuk tabel bervolume tinggi.
- Tabel bervolume tinggi yang perlu perhatian activity log manual meliputi: `jurnal_umum`, `jurnal_harian_produksi`, `sopd`, `sopd_harga`, `bahan_baku`, `barang_jadi`, `sales_reports`, `sales_orders`, `bill_of_materials`, `purchase_requests`, `purchase_orders`, `penerimaan_pembelian`, `rekap_pembelian_barang`, `pelunasan_hutang`, `pelunasan_piutang`, `pengiriman`, `spph_out`, dan `sph_in`.
- Untuk database, cek `src/lib/db.ts`, `src/lib/schema.ts`, dan script di `scripts/` sebelum mengubah struktur data.

## Konvensi Kode
- Ikuti pola TypeScript/React/Next.js yang sudah ada di file sekitar.
- Hindari placeholder palsu; gunakan data nyata atau state kosong yang jelas.
- Hindari komentar inline yang tidak perlu.
- Gunakan nama variabel deskriptif; jangan gunakan nama satu huruf.
- Pertahankan pemisahan page/client component/API route sesuai pola `src/app/`.
- Untuk utilitas reusable, prefer tambah di `src/lib/` atau komponen existing daripada duplikasi logic.
- Untuk permission/auth, cek `src/lib/permissions.ts`, `src/lib/permissions-actions.ts`, `src/lib/permissions-constants.ts`, `src/lib/auth.ts`, dan `src/lib/session.ts`.

## Testing dan Validasi
- Mulai dari test/command paling dekat dengan perubahan.
- Jika menyentuh route API atau logic database, pertimbangkan script check terkait di `scripts/` atau test di `test/`.
- Jika menyentuh UI luas, pertimbangkan `npm run lint` dan `npm run build`.
- Jangan menambah framework test baru tanpa diminta.
- Jika validasi gagal karena isu yang tidak terkait perubahan, laporkan jelas dan jangan memperbaiki di luar scope.

## Dokumentasi dan Kontinuitas
- Untuk perubahan besar atau keputusan penting, update dokumentasi relevan di `docs/`, terutama `docs/AI_SESSION_SUMMARY.md` atau `docs/task.md` bila diminta atau perlu menjaga konteks antar sesi.
- Tutorial historis ada di `docs/tutorials/`; gunakan sebagai referensi pola perubahan sebelumnya.
- Jika user meminta melanjutkan sesi lama, baca `docs/RESUME_SESSION.md`, `docs/AI_SESSION_SUMMARY.md`, dan `docs/task.md` terlebih dahulu.

## Batasan dan Kehati-hatian
- Jangan menghapus database lokal, file `.env`, atau data hasil scraping/import tanpa instruksi eksplisit.
- Jangan menjalankan operasi destruktif seperti `git reset`, `rm`, migrasi besar, atau cleanup database tanpa persetujuan jelas.
- Perlakukan file database (`*.sqlite`, `*.db`) sebagai data kerja penting.
- Jangan menyentuh file temporary/debug kecuali relevan dengan task.
