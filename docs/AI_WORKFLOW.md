# AI_WORKFLOW.md

Playbook utama agar sesi AI berikutnya bisa langsung lanjut kerja tanpa briefing ulang panjang.

## Tujuan

- Menyatukan alur **mulai sesi -> eksekusi -> tutup sesi** dalam satu dokumen.
- Menjadi referensi cepat untuk AI dan manusia sebelum mengubah kode.
- Menjaga konsistensi update dokumentasi dan proses commit.

## Bacaan Wajib (Urutan Tetap)

1. `AGENTS.md`
2. `docs/REPO_MAP.md`
3. `docs/DEV_RULES.md`
4. `docs/RESUME_SESSION.md`
5. `docs/AI_SESSION_SUMMARY.md`

Tambahan kondisional:
- Jika task terkait scraping/import/sync: baca `docs/SCRAPING_FLOW.md`.

## Alur Kerja Standar

### 1) Mulai Sesi

1. Baca seluruh bacaan wajib sesuai urutan.
2. Sinkronkan repository: `git pull`.
3. Cek kondisi kerja: `git status`.
4. Tentukan prioritas dari `docs/task.md` (In Progress dulu, lalu Backlog prioritas tertinggi).

### 2) Eksekusi

1. Kerjakan task sesuai scope, hindari perubahan di luar kebutuhan.
2. Setelah perubahan signifikan, validasi cepat secara lokal (sesuai jenis perubahan).
3. Jika ada perubahan keputusan/arsitektur/alur, update dokumen terkait saat itu juga.
4. Jika user sudah memberi izin eksplisit untuk lanjut otomatis, jalankan langkah aman tanpa minta persetujuan berulang.

### 3) Tutup Sesi

1. Review perubahan: `git status`, `git diff --check`, `git diff`.
2. Audit file staged dan pastikan tidak ada file sensitif/temporer.
3. Update ringkasan progres di `docs/AI_SESSION_SUMMARY.md` (apa yang dikerjakan + next step).
4. Update status kerja di `docs/task.md` (Done / In Progress / Backlog + statistik bila berubah).
5. Commit per kategori perubahan, lalu push jika sudah diizinkan.
6. Laporkan hasil akhir: perubahan utama, validasi, commit hash, dan langkah berikutnya.

## Checklist Cepat

- [ ] Sudah baca `AGENTS.md`, `docs/REPO_MAP.md`, `docs/DEV_RULES.md`
- [ ] Sudah cek `docs/RESUME_SESSION.md` dan `docs/AI_SESSION_SUMMARY.md`
- [ ] Sudah sinkron repo dan cek status branch
- [ ] Sudah eksekusi sesuai scope
- [ ] Sudah update dokumentasi relevan
- [ ] Sudah validasi diff sebelum commit
- [ ] Sudah catat next step agar sesi berikutnya bisa lanjut cepat
