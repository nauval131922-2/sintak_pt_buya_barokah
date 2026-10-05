# Auto-Generate Jadwal Produksi Harian

> Dokumen perencanaan fitur untuk membuat draft jadwal produksi hari berikutnya secara otomatis berdasarkan data historis JHP.

## Tujuan

Koordinator shift bisa membuat draft jadwal produksi untuk **hari berikutnya** dengan satu klik, tanpa harus menyalin manual dari hari sebelumnya. Hasil generate bersifat draft — koordinator tetap bisa review & edit sebelum dijadikan jadwal resmi.

---

## Data Referensi & Pertanyaan

### Tabel Pertanyaan

| # | Kategori | Pertanyaan | Jawaban | Status |
|---|----------|-----------|---------|--------|
| 1 | Shift | Apakah shift karyawan **tetap** (si A selalu shift 1) atau **rotasi**? | seringnya rotasi, tapi memungkinkan juga untuk semua karyawan dalam 1 shift| ⬜ |
| 2 | Shift | Kalau rotasi, apa polanya? (mingguan, bulanan, atau manual tiap hari?) | seringnya mingguan, tapi memungkinkan juga untuk diubah manual tiap hari| ⬜ |
| 3 | Bagian | Apakah 1 karyawan bisa kerja di **lebih dari 1 bagian**? (misal hari ini Setting, besok Finishing) | seharusnya tidak, tapi bisa jadi iya| ⬜ |
| 4 | Order | Apakah order (`no_order`) bisa **berlanjut** keesokan harinya? Atau tiap hari order baru? | bisa berlanjut, tergantung pekerjaan order itu sudah sampai tahap apa, besok bisa dilanjut tahap selanjutnya sesuai urutan pekerjaan pada ordernya| ⬜ |
| 5 | Order | Apakah ada kolom/flag yang menandakan **"order ini sudah selesai"** atau masih berjalan? | untuk sekarang belum ada| ⬜ |
| 6 | Pekerjaan | `jenis_pekerjaan` per karyawan itu **sama setiap hari** atau **berubah-ubah**? | bisa jadi berubah-ubah, tergantung dia sudah mencapai target dan pekerjaan selanjutnya apa untuk ordernya| ⬜ |
| 7 | Jadwal | **Hari apa saja** produksi jalan? (Senin-Sabtu? Senin-Jumat? Termasuk Minggu/libur?) | normalnya sabtu sampai kamis, tapi memungkinkan juga hari jumat ada lembur| ⬜ |
| 8 | Jadwal | Apakah jadwal hari Senin mirip dengan **hari Sabtu sebelumnya**, atau dengan **Senin minggu lalu**? | bisa jadi mirip bisa jadi ngga, dan ini konteks dari pertanyaan kamu jika liburnya minggu kan ya?, tapi kita liburnya jumat| ⬜ |
| 9 | Koordinator | Apakah data koordinator (`ks1/ks2/ks3`) ikut digenerate atau tetap diisi manual? | sementara diisi manual gapapa, atau bisa kamu jadikan seperti hari sebelumnya aja, tapi user tetap bisa ngubah| ⬜ |
| 10 | Review | Setelah jadwal digenerate, apakah koordinator **wajib review** dulu sebelum jadi resmi? | tentu saja wajib review, dan hasil reviewnya nanti user bisa mengetik kenapa kok itu salah, dan seharusnya seperti apa, dan jadikan itu sebagai baham belajar kamu (sebagai sistem), agar tetap berkembang menjadi lebih baik untuk kedepannya, apakah bisa?, dan apakah kita membutuhkan AI untuk SINTAK ini?| ⬜ |
| 11 | Eksternal | Apakah ada **file Excel / data terpisah** berisi roster shift atau jadwal karyawan? |untuk sekarang belum ada | ⬜ |
| 12 | Histori | Apakah histori JHP minimal **3 bulan terakhir** cukup lengkap untuk referensi? |bisa jadi tidak, soalnya ada order yang bahkan 1 tahun lebih itu bisa jadi belum selesai (masih dalam tahap proses produksi) | ⬜ |

---

## Pendekatan Algoritma

### Level 1: Exact Copy (Prioritas Pertama)

**Cara kerja:**
1. Ambil semua baris JHP dari **hari ini** yang `deleted_at IS NULL`
2. Ubah `tgl` menjadi **besok**
3. Reset `realisasi` dan field produksi ke 0/kosong
4. INSERT ke database

**Keakuratan:** Tinggi untuk produksi rutin.
**Kompleksitas:** Rendah — 90% sudah siap via `copy-jadwal/route.ts`.

### Level 2: + Filter Order Berlanjut

**Cara kerja:**
1. Copy seperti Level 1
2. Tapi hanya untuk baris yang `no_order`-nya belum selesai (`SUM(realisasi) < SUM(target)` per `no_order`)
3. Baris tanpa `no_order` (koordinasi, dll) tetap dicopy semua

### Level 3: + Frekuensi Karyawan

**Cara kerja:**
1. Analisa histori 30-90 hari terakhir
2. Untuk setiap `(bagian, shift)`, cari N karyawan yang paling sering masuk
3. Assign otomatis jika karyawan yang dijadwalkan hari ini tidak cocok dengan histori

### Level 4: + Same-Day-Last-Week

**Cara kerja:**
1. Cari jadwal dari **hari yang sama minggu lalu** (misal: Kamis minggu lalu → Kamis besok)
2. Bandingkan dengan jadwal hari ini
3. Ambil yang pola historisnya lebih dominan

---

## Rancangan Teknis (draft)

### Backend — API Baru

```
POST /api/jurnal-harian-produksi/auto-generate
Body: {
  mode: "exact" | "continuity" | "smart",
  date: "YYYY-MM-DD"  // target tanggal, default besok
}
Response: {
  success: true,
  copied: number,     // jumlah baris yang digenerate
  preview: boolean,   // true jika masih draft
}
```

Dibuat sebagai file terpisah, bukan modifikasi dari `copy-jadwal/route.ts`:
- `src/app/api/jurnal-harian-produksi/auto-generate/route.ts`

### Frontend — Halaman Target

- **Tombol "Generate Jadwal Besok"** di control panel halaman target (`TargetClient.tsx`)
- Muncul **hanya jika belum ada jadwal untuk besok** (cegah duplikasi)
- Setelah generate, tampilkan notifikasi toast + refresh data
- Koordinator bisa edit via form yang sudah ada

### Database

Tidak perlu perubahan skema — semua kolom sudah tersedia di `jurnal_harian_produksi`.
Yang mungkin ditambahkan nanti:

- `generate_source` TEXT — mencatat dari level/generate mana baris berasal (opsional)
- Atau cukup andalkan `activity_logs` dengan `action_type = 'AUTO_GENERATE'`

---

## Catatan Pengembangan

- Mulai dari **Level 1** dulu (exact copy) — implementasi cepat, risiko rendah
- **Jangan auto-approve** — hasil generate tetap draft, koordinator review via halaman target
- Gunakan logika `activity_logs` yang sudah ada untuk audit trail (action_type `AUTO_GENERATE`)
- Manfaatkan `copy-jadwal/route.ts` yang sudah mature sebagai referensi query & filter

---

## Referensi

- `src/app/api/jurnal-harian-produksi/copy-jadwal/route.ts` — fondasi utama
- `src/app/jurnal-harian-produksi/target/TargetClient.tsx` — halaman target
- `src/lib/schema.ts:578-610` — DDL tabel `jurnal_harian_produksi`
