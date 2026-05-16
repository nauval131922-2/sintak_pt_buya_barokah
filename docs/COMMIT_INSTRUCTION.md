# Instruksi Commit dan Akhir Sesi AI

Dokumen ini adalah checklist penutup sesi kerja. Tujuannya agar setiap perubahan selesai dengan rapi, terdokumentasi, mudah dilanjutkan, dan aman untuk di-commit/push.

## Prinsip Utama

- Baca konteks repo sebelum mengubah atau menutup sesi.
- Dokumentasikan perubahan penting, bukan semua detail kecil.
- Commit dipisah berdasarkan jenis perubahan yang masuk akal.
- Jangan ikutkan file lokal besar, cache, database, log, atau secret.
- Jika user sudah memberi izin eksplisit untuk lanjut tanpa persetujuan ulang, eksekusi aman boleh dilakukan langsung.

## Bacaan Wajib Awal Sesi

Sebelum bekerja atau menutup sesi, baca minimal:

1. `AGENTS.md`
2. `docs/REPO_MAP.md`
3. `docs/DEV_RULES.md`
4. `docs/RESUME_SESSION.md`
5. `docs/AI_SESSION_SUMMARY.md`

Jika task menyentuh scraping, import, sync, marketplace, atau activity log, baca juga:

- `docs/SCRAPING_FLOW.md`

Jika ada konflik instruksi, prioritaskan urutan berikut:

1. Instruksi langsung user/developer/system.
2. `AGENTS.md` yang scope-nya berlaku.
3. `docs/DEV_RULES.md`.
4. Dokumen pendukung lain di `docs/`.

## Struktur Dokumen yang Perlu Dijaga

```text
docs/
├── REPO_MAP.md              # peta repo dan entry point utama
├── RESUME_SESSION.md        # panduan lanjut sesi berikutnya
├── AI_SESSION_SUMMARY.md    # ringkasan sesi terakhir
├── DEV_RULES.md             # aturan teknis pengembangan
├── COMMIT_INSTRUCTION.md    # checklist akhir sesi ini
├── BUILD_FROM_SCRATCH.md    # cara membangun ulang sistem dari nol
├── SCRAPING_FLOW.md         # playbook scraping/import/sync/activity log
├── task.md                  # backlog, status, dan statistik progress
└── tutorials/               # tutorial per fitur/perbaikan bila relevan
```

## Checklist Akhir Sesi

### 1. Review Perubahan

Jalankan dan cek:

```bash
git status
git diff --check
git diff
```

Pastikan:

- Tidak ada file yang tidak sengaja ikut.
- Tidak ada whitespace error dari `git diff --check`.
- Tidak ada perubahan unrelated yang ikut dalam commit.
- Tidak ada file lokal besar seperti database SQLite, cache, log, atau file secret.

### 2. Update Dokumentasi Relevan

Update dokumen sesuai jenis perubahan:

- `README.md` jika cara menjalankan, onboarding, atau alur utama berubah.
- `docs/REPO_MAP.md` jika struktur folder, entry point, atau modul penting berubah.
- `docs/RESUME_SESSION.md` jika ada arahan awal sesi yang perlu diingat AI berikutnya.
- `docs/AI_SESSION_SUMMARY.md` untuk ringkasan pekerjaan, keputusan, dan sisa pekerjaan.
- `docs/task.md` untuk status task dan statistik progress.
- `docs/BUILD_FROM_SCRATCH.md` jika perubahan memengaruhi cara membangun sistem dari nol.
- `docs/SCRAPING_FLOW.md` jika perubahan menyentuh scraping, import, sync, marketplace, atau activity log.
- `docs/tutorials/` jika perubahan butuh tutorial step-by-step mandiri.

### 3. Audit `.gitignore`

Cek `.gitignore` bila ada file baru atau generated file baru.

Pastikan:

- Database lokal tidak ter-commit.
- Cache/build output tidak ter-commit.
- File `.env` atau secret tidak ter-commit.
- Rule tidak terlalu luas sampai mengabaikan source penting.

### 4. Kelompokkan Commit

Pisahkan commit berdasarkan kategori yang jelas.

Gunakan Conventional Commits:

- `feat:` fitur baru.
- `fix:` perbaikan bug.
- `docs:` dokumentasi.
- `refactor:` refaktor tanpa perubahan perilaku.
- `chore:` maintenance dependency/konfigurasi.
- `test:` penambahan/perbaikan test.
- `style:` formatting tanpa perubahan logika.

Contoh:

```text
docs: rapikan panduan onboarding AI
fix: perbaiki validasi import marketplace
feat: tambah filter activity log scraping
```

### 5. Stage dengan Aman

Stage hanya file yang relevan:

```bash
git add <file-1> <file-2>
```

Hindari `git add .` jika working tree berisi file lokal/generated yang belum diaudit.

### 6. Commit

Commit dengan pesan singkat dan jelas:

```bash
git commit -m "docs: rapikan instruksi commit akhir sesi"
```

Jika ada beberapa kategori perubahan, buat beberapa commit terpisah.

### 7. Push

Jika user sudah memberi izin eksplisit untuk langsung lanjut tanpa persetujuan ulang, push ke branch aktif dengan aman:

```bash
git push
```

Jika belum ada izin eksplisit:

- Tanyakan apakah user bekerja sendiri atau dalam tim.
- Jika sendiri, boleh push ke branch aktif.
- Jika tim, gunakan branch fitur/dev dan jangan langsung push ke `master` tanpa konfirmasi.

### 8. Laporkan Hasil

Ringkas hasil akhir ke user:

- File yang diubah.
- Commit hash/pesan commit.
- Status push.
- Validasi yang sudah dijalankan.
- Sisa risiko atau langkah berikutnya bila ada.

## Checklist Khusus Scraping/Import/Sync

Jika sesi menyentuh scraping, import, sync, marketplace, atau activity log:

- Baca `docs/SCRAPING_FLOW.md` sebelum edit dan sebelum commit.
- Pastikan setiap operasi penting tercatat di activity log bila pola kode mengharuskannya.
- Pastikan validasi cepat sesuai playbook sudah dijalankan atau dicatat alasannya jika belum.
- Update `docs/SCRAPING_FLOW.md` bila ada pola baru yang perlu jadi standar.
- Sebutkan dampaknya di `docs/AI_SESSION_SUMMARY.md` dan `docs/task.md` bila relevan.

## Ringkasan Urutan Cepat

```text
Mulai sesi:
1. Baca AGENTS.md, docs/REPO_MAP.md, dan docs/DEV_RULES.md.
2. Baca docs/RESUME_SESSION.md dan docs/AI_SESSION_SUMMARY.md.
3. Baca docs/SCRAPING_FLOW.md jika task terkait scraping/import/sync.

Eksekusi:
4. Kerjakan task sesuai scope dan dokumen teknis terkait.
5. Update dokumen relevan jika ada perubahan alur, struktur, atau keputusan.

Tutup sesi:
6. Review git status, git diff --check, dan git diff.
7. Audit .gitignore, staged files, lalu commit per kategori perubahan.
8. Push jika aman atau sudah diizinkan.
9. Laporkan hasil, commit hash, validasi, dan next step.
```
