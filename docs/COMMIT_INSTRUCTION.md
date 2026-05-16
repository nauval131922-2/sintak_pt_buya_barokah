# 📋 COMMIT_INSTRUCTION.md

> 🤖 **Untuk AI Agent yang baru memulai sesi**:
> Sebelum mengerjakan apa pun, baca urutan berikut (wajib):
> 1) `AGENTS.md`
> 2) `docs/DEV_RULES.md`
> 3) `docs/REPO_MAP.md`
>
> Catatan: untuk konteks lintas sesi, baca juga `docs/RESUME_SESSION.md`.

## 🚀 Prompt: Commit & Push Perubahan

Gunakan prompt ini di akhir sesi untuk menyimpan semua perubahan ke Git.
Cukup copy-paste prompt di bawah ini ke AI agent.

---

```text
Tolong lakukan commit dan push semua perubahan terbaru. Ikuti langkah-langkah berikut secara berurutan:

---

### 🗂️ LANGKAH 1 — Pastikan Struktur Dokumentasi
Pastikan struktur folder dokumentasi berikut sudah ada (buat jika belum):

docs/
├── COMMIT_INSTRUCTION.md      ← panduan akhir sesi
├── RESUME_SESSION.md          ← panduan awal sesi/lanjutan konteks
├── REPO_MAP.md                ← peta struktur repo & entry points
├── DEV_RULES.md               ← aturan development wajib
├── BUILD_FROM_SCRATCH.md      ← tutorial rebuild sistem dari nol
├── AI_SESSION_SUMMARY.md      ← ringkasan sesi terakhir
├── task.md                    ← backlog & progress
└── tutorials/
    ├── 01-setup.md
    ├── 02-fitur-[nama].md
    └── ...                    ← satu file per fitur/perbaikan

---

### 🧭 LANGKAH 2 — Verifikasi Bacaan Wajib (AI)
Sebelum lanjut, pastikan kamu sudah membaca dan mengikuti:
- `AGENTS.md`
- `docs/DEV_RULES.md`
- `docs/REPO_MAP.md`

Jika ada konflik instruksi, prioritaskan `AGENTS.md` dan aturan di `docs/DEV_RULES.md`.

---

### 📝 LANGKAH 3 — Buat/Perbarui Dokumentasi Tutorial Mandiri
Berdasarkan semua perubahan di sesi ini (lihat Changes di Source Control), buat/perbarui file tutorial step-by-step di dalam `docs/tutorials/`.

Aturan:
- Satu file per fitur atau perbaikan.
- Penamaan: `01-nama-fitur.md`, `02-nama-fitur.md`, dst.

---

### 🔄 LANGKAH 4 — Perbarui BUILD_FROM_SCRATCH.md
Tinjau seluruh perubahan di sesi ini, lalu perbarui `docs/BUILD_FROM_SCRATCH.md` agar selalu mencerminkan kondisi sistem terkini secara lengkap.

Yang harus diperbarui bila relevan:
- Fitur baru        → tambahkan langkah pembuatannya secara kronologis
- Bug fix           → perbarui langkah yang berubah cara kerjanya
- Perubahan folder  → perbarui bagian struktur proyek
- Dependency baru   → perbarui bagian instalasi & konfigurasi
- Perubahan skema   → perbarui bagian setup database
- Env var baru      → perbarui bagian konfigurasi `.env`

Prinsip utama:
- `BUILD_FROM_SCRATCH.md` harus bisa dipakai siapa pun untuk membangun ulang sistem dari nol dan menghasilkan sistem yang identik dengan kondisi saat ini.

---

### 🔍 LANGKAH 5 — Audit `.gitignore`
Periksa file `.gitignore`:
- Pastikan tidak ada file sampah (cache/log/database lokal) yang ikut ter-push.
- Pastikan tidak ada rule terlalu luas yang mengabaikan file penting.
- Jika ada masalah, perbaiki dan jelaskan perubahannya.

---

### 👥 LANGKAH 6 — Tanya Dulu Sebelum Push
Sebelum melanjutkan, tanyakan ke saya:
"Apakah kamu sedang bekerja sendiri atau dalam tim?"
- Jika sendiri → push ke branch aktif (mis. `master`).
- Jika tim     → push ke branch fitur/dev, jangan langsung ke `master`.

Tunggu jawaban saya sebelum lanjut.

---

### ✅ LANGKAH 7 — Review Sebelum Commit
Jalankan perintah berikut dan tampilkan hasilnya ke saya:
- `git status`
- `git diff`

Pastikan:
- Tidak ada file yang tidak sengaja ikut.
- Tidak ada perubahan penting yang terlewat.

---

### 📦 LANGKAH 8 — Kelompokkan & Commit
Kelompokkan perubahan berdasarkan fitur/perbaikan (jangan digabung jadi satu).
Gunakan Conventional Commits:

Tipe yang tersedia:
- feat     → fitur baru
- fix      → perbaikan bug
- docs     → perubahan dokumentasi
- refactor → refaktor tanpa ubah fungsi
- chore    → maintenance (dependency/konfigurasi)
- test     → menambah/memperbaiki test
- style    → formatting/style (tanpa ubah logika)

Format: `<tipe>: <deskripsi singkat dalam bahasa Indonesia>`

Contoh:
- `feat: tambah fitur login dengan Google OAuth`
- `fix: perbaiki bug validasi form registrasi`
- `docs: perbarui README dan tutorial onboarding`

---

### 🧾 LANGKAH 9 — Perbarui Ringkasan Sesi AI
Buat/perbarui:
- `docs/AI_SESSION_SUMMARY.md` (tanggal/waktu, PC, pekerjaan, keputusan, sisa pekerjaan)
- `docs/task.md` (status ✅/🔄/📌 dan statistik jika ada)

---

### 🚀 LANGKAH 10 — Commit Dokumentasi & Push
Commit dokumentasi (jika ada perubahan) dalam satu commit:
- `docs/AI_SESSION_SUMMARY.md`
- `docs/task.md`
- `docs/BUILD_FROM_SCRATCH.md`
- seluruh file baru/diperbarui di `docs/tutorials/`

Pesan commit:
- `docs: perbarui ringkasan sesi, tutorial, dan BUILD_FROM_SCRATCH`

Lalu push sesuai keputusan di Langkah 6.
Tampilkan konfirmasi hasil push ke saya.
```

---

## 💡 Referensi Cepat Format Commit

| Tipe | Kapan Digunakan | Contoh |
|------|------------------|--------|
| `feat:` | Fitur baru | `feat: tambah halaman profil pengguna` |
| `fix:` | Perbaikan bug | `fix: perbaiki crash saat upload foto` |
| `docs:` | Dokumentasi | `docs: perbarui README instalasi` |
| `refactor:` | Refaktor kode | `refactor: pisahkan logika auth ke service` |
| `chore:` | Maintenance | `chore: update dependency ke versi terbaru` |
| `test:` | Penambahan test | `test: tambah unit test untuk user model` |
| `style:` | Formatting/style | `style: rapikan indentasi file controller` |
