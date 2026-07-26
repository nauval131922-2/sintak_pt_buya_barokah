# Checklist sesi OpenCode — Design System SINTAK

Centang di web setelah `npm run dev` (atau server yang biasa dipakai).

**Tanggal sesi:** 2026-07-20  
**Scope:** standardisasi UI (emerald, h-10, font, radius, glass) + hapus tombol log aktivitas

---

## A. Global (semua halaman ber-layout)

- [✅ ] Sidebar: active/hover warna **emerald** (bukan hijau lama)
- [✅ ] Dropdown (`SearchableDropdown`): tinggi ~**h-10**, item terpilih emerald
- [✅ ] DatePicker: tanggal terpilih emerald, proporsi wajar
- [✅ ] Pagination tabel: tombol ~**h-10**, aksen emerald
- [✅ ] Toast/dialog sukses: aksen emerald

---

## B. Halaman prioritas cek

### `/sync`

- [✅ ] Card header Sync: glass (putih transparan + blur)
- [✅ ] Button sync ~**h-10**
- [✅ ] Card modul: glass
- [✅ ] **Tidak ada** tombol/link Log Aktivitas di area header

### `/jurnal-harian-produksi`

- [✅ ] Filter bar (tanggal, dropdown, Belum Realisasi, Reset, Export) ~**h-10**
- [✅ ] Di judul: **tidak ada** tombol Log Aktivitas
- [✅ ] Empty/error: sentence case (**bukan** UPPERCASE)
- [✅ ] Panel/card: glass

### `/jurnal-harian-produksi/target`

- [✅ ] Refresh, DatePicker, “Tgl Order”, reset koordinator ~**h-10**
- [✅ ] Download Gambar / Print / Generate Jadwal ~**h-10**, sejajar
- [✅ ] Empty state tombol proporsional

### `/users`

- [✅ ] Card filter + **Tambah Akun Baru** ~**h-10**, emerald

### `/rekap-sales-order`

- [✅ ] 2 card atas: glass + tombol ~**h-10**
- [✅ ] Empty/error: sentence case

### `/akuntansi/laporan/jurnal-umum`

- [✅ ] Card scrape + filter: glass
- [ ✅] Tombol Reset filter ~**h-10**

### `/hasil-produksi`

- [✅ ] Stat/filter card: glass
- [✅ ] Filter/action ~**h-10**
- [✅ ] Label kecil ≥ **11px** (lebih terbaca)
- [✅ ] Filter Level + trigger SOPd sejajar **h-10** (fixed)

### `/records` (form + list)

- [ ✅] Card section form: glass
- [✅ ] Filter bar list: glass; badge radius lebih bulat (`rounded-lg`)

### `/employees`

- [✅ ] Empty/error sentence case
- [✅ ] Upload card label lebih terbaca

### Dashboard

- [✅ ] `/dashboard` — stat/chart card glass
- [✅ ] `/dashboard-hrd` — sama
- [✅ ] `/dashboard-manufaktur` — sama
- [✅ ] `/dashboard-akunting` — sama

### Halaman data scrape (sample 2–3 saja)

- [✅ ] `/bahan-baku` — empty/error sentence case, aksen emerald
- [✅ ] `/barang-jadi` / `/sales-orders` — sama
- [✅ ] Header “Hasil Scrapping…”: **tidak ada** tombol Log Aktivitas

---

## C. Design rules (visual)

- [✅ ] Warna utama UI: **emerald**, bukan `green-*` lama
- [✅ ] Kontrol form/button filter: tinggi seragam **h-10**
- [✅ ] Icon di kontrol: ~**14px**
- [✅ ] Label/badge UI: min **text-[11px]** (bukan 9/10)
- [✅ ] Badge kecil: **rounded-lg** (bukan rounded-md)
- [✅ ] Card panel: **glass** (`bg-white/80` + blur) di area yang sudah disentuh

---

## D. Git lokal (opsional)

- [ ] `bd1c6e8` — emerald + h-10 + hapus log aktivitas + docs Obsidian
- [ ] `4ef6b0b` — hapus uppercase empty/error
- [ ] `163f193` — font min 11px
- [ ] `20d959c` — rounded-lg + glassmorphism

```bash
git log --oneline -4
```

---

## E. Di luar web SINTAK (tidak wajib)

- [ ] Docs: `docs/OBSIDIAN_INTEGRATION.md`, `docs/OBSIDIAN_CAPTURE_SKILL.md`, `docs/OBSIDIAN_KNOWLEDGE_BASE.md`
- [ ] Skill capture: ketik `obsidian-capture` / “capture this session to obsidian” (bukan slash `/`)
- [ ] Note vault (jika sudah): `SINTAK-ERP/Sessions/Session-2026-07-20-...`

---

## F. Sengaja belum / residual

- [ ] Brand `uppercase` di login/sidebar (“SINTAK”, tagline) — **dibiarkan**
- [ ] Beberapa label cell table masih `uppercase` (data) — **dibiarkan**
- [ ] Push remote — **belum** (commit lokal saja)

---

## G. Smoke test cepat (5 menit)

1. [✅ ] `/sync` — glass + no log button
2. [✅ ] `/jurnal-harian-produksi` — filter h-10 + no log di judul
3. [✅ ] `/jurnal-harian-produksi/target` — bar kontrol sejajar
4. [✅ ] `/users` — tombol tambah h-10
5. [✅ ] `/dashboard` — kartu glass
6. [✅ ] Buka 1 DatePicker + 1 dropdown → emerald

---

## Lulus sesi

**Lulus** jika **A + G + mayoritas B** tercentang tanpa regresi jelas (layout pecah / warna biru paksa / kontrol beda tinggi di bar yang sama).

---

**File:** `docs/CHECKLIST_SESI_DESIGN_SYSTEM.md`
