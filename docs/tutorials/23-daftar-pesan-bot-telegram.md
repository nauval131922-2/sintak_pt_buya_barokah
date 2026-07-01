# Daftar Pesan Telegram Bot SINTAK

> Update terakhir: 29 Jun 2026
> Berlaku untuk Bot Bagian SETTING (variabel `BAGIAN` otomatis menyesuaikan).

---

## bot.ts

**1 — Perintah tidak dikenali**
```
ℹ️ Perintah tidak dikenali.

Gunakan:
/start - Menu utama
/register - Daftar ke bot
/cari - Cari karyawan
/cariorder - Cari order
/input - Input realisasi
/history - Lihat riwayat
/help - Bantuan
```

---

## start.ts

**2 — /start (welcome)**
```
👋 Selamat datang di SINTAK Bot - Bagian {BAGIAN}!

Perintah yang tersedia:

/register - Daftar ke bot
/cari - Cari karyawan
/cariorder - Cari order
/input - Input realisasi
/history - Lihat riwayat
/help - Bantuan
```

---

## register.ts

**3 — /register saat user sudah aktif**
```
✅ Anda sudah terdaftar dan aktif!

👤 Nama: {status.nama_karyawan}
🏭 Bagian: {status.bagian}

Gunakan /input untuk melapor realisasi produksi.
```

**4 — /register saat masih pending**
```
⏳ Permintaan registrasi Anda sedang menunggu persetujuan admin.

Anda akan menerima notifikasi di Telegram jika sudah disetujui.
```

**5 — /register saat belum terdaftar**
```
📝 Pendaftaran SINTAK Bot - Bagian {BAGIAN}

Ketik nama lengkap Anda sesuai database SINTAK.

Tip: Cari nama Anda dulu dengan /cari budi
```

**6 — Validasi nama karyawan**
```
🔍 Memvalidasi nama karyawan...
```

**7 — Nama tidak ditemukan**
```
❌ Nama karyawan tidak ditemukan di database.

Pastikan nama sesuai data SINTAK.

Gunakan /register untuk mencoba lagi.
```

**8 — Registrasi berhasil dikirim**
```
✅ Permintaan registrasi telah dikirim ke admin!

📋 Data Anda:
👤 Nama: {validation.nama_karyawan}
📍 Posisi: {validation.posisi}
🆔 Absensi: {validation.absensi}
🏭 Bagian: {BAGIAN}

⏳ Tunggu persetujuan admin.
Anda akan mendapat notifikasi di Telegram jika disetujui.
```

**9 — Error registrasi**
```
❌ Gagal mendaftar: {error.message}
```

---

## search.ts

**10 — /cari tanpa query**
```
🔎 Gunakan format:

/cari budi

Bot akan mencari semua karyawan aktif.
```

**11 — /cari user belum terdaftar**
```
❌ Anda belum terdaftar atau belum disetujui. Gunakan /register
```

**12 — /cari tidak ditemukan**
```
❌ Tidak ditemukan karyawan aktif dengan kata kunci "{query}".
```

**13 — Hasil pencarian**
```
🔎 Hasil pencarian untuk "{query}":

{daftar hasil}

Untuk input realisasi, pakai field `Nama:` di template /input.
```

**14 — Error search**
```
❌ Gagal mencari karyawan: {error.message}
```

---

## searchorder.ts

**15 — /cariorder tanpa query**
```
🔎 Gunakan format:

/cariorder OP.001.SOPd

Bot akan mencari order berdasarkan no. SOPd atau nama order.
```

**16 — /cariorder user belum terdaftar**
```
❌ Anda belum terdaftar atau belum disetujui. Gunakan /register
```

**17 — /cariorder tidak ditemukan**
```
❌ Tidak ditemukan order dengan kata kunci "{query}".
```

**18 — Hasil pencarian order**
```
🔎 Hasil pencarian order untuk "{query}":

{daftar hasil}

Gunakan nomor order tersebut di field `Order:` template /input.
```

**19 — Error cariorder**
```
❌ Gagal mencari order: {error.message}
```

---

## input.ts

**20 — /input user belum terdaftar**
```
❌ Anda belum terdaftar.

Gunakan /register untuk registrasi terlebih dahulu.
```

**16 — /input user belum disetujui**
```
⏳ Akun Anda belum disetujui admin.

Tunggu persetujuan terlebih dahulu.
```

**17 — /input kirim template (contoh)**
```
📝 Kirim template realisasi Anda:

Contoh:
```
Nama: Budi
Tgl: {today}
Shift: 1
Order: OP.001.SOPd.{year}
Pekerjaan: Setting Mesin
Bahan Kertas:
Jml. Plate:
Warna:
Insheet:
Rijek:
Jam Kerja:
Kendala:
Keterangan:
Target: 100
Realisasi: 95
```

Field wajib: Nama, Tgl, Shift, Order, Pekerjaan, Target, Realisasi

💡 Jam Kerja kosong? Otomatis terisi sesuai Shift (1=07:00-15:00, 2=15:00-23:00, 3=23:00-07:00).

Cari nama karyawan dengan /cari budi

Ketik /help untuk panduan lengkap.
```

**18 — Error /input**
```
❌ Terjadi kesalahan: {error.message}
```

**19 — Confirm manual order: belum terdaftar**
```
❌ Anda belum terdaftar atau belum disetujui. Gunakan /register
```

**20 — Data template sebelumnya hilang**
```
❌ Data template sebelumnya tidak ditemukan. Kirim ulang template dengan /input.
```

**21 — Confirm manual order: perintah tidak jelas**
```
⚠️ Balas dengan "lanjut" untuk tetap simpan order manual, atau kirim template baru untuk koreksi.
```

**22 — Error confirm manual order**
```
❌ Gagal memproses konfirmasi: {error.message}
```

**23 — Template tidak valid**
```
❌ Format template tidak valid.

Field wajib:
• Tgl: YYYY-MM-DD
• Shift: 1/2/3
• Nama: atau Absensi:
• Order: (pilih dari SOPd atau ketik manual)
• Pekerjaan:
• Target: (angka)
• Realisasi: (angka)

Ketik /help untuk melihat contoh.
```

**24 — Data tidak valid**
```
❌ Data tidak valid:

{daftar error}

Perbaiki dan kirim ulang.
```

**25 — Memvalidasi order**
```
🔍 Memvalidasi order...
```

**26 — Order tidak ditemukan**
```
⚠️ Order "{data.order}" tidak ditemukan di database.

Apakah Anda yakin ingin melanjutkan dengan order manual?

Ketik "lanjut" untuk tetap simpan, atau kirim template baru untuk koreksi.
```

**27 — Error proses template**
```
❌ Gagal memproses template: {error.message}
```

**28 — Menyimpan data**
```
💾 Menyimpan data...
```

---

## formatter.ts — getHelpText (dipanggil /help)

**29 — /help**
```
🤖 SINTAK Bot - Bagian {BAGIAN}

📝 Cara Input Realisasi:

Ketik /input lalu kirim template berikut:

```
Nama: Budi
Tgl: 2026-06-29
Shift: 1
Order: OP.001.SOPd.2026
Pekerjaan: Setting Mesin
Bahan Kertas:
Jml. Plate:
Warna:
Insheet:
Rijek:
Jam Kerja:
Kendala:
Keterangan:
Target: 100
Realisasi: 95
\`\`\`

⚡ Field Wajib: Nama, Tgl, Shift, Order, Pekerjaan, Target, Realisasi

⚡ Tips:
• Order akan divalidasi otomatis
• Pakai \`/cari <nama>\` jika tidak ingat nama lengkap
• Pakai \`/cariorder <keyword>\` untuk cari no. SOPd atau nama order
• Jam Kerja kosong? Otomatis terisi sesuai Shift (1=07:00-15:00, 2=15:00-23:00, 3=23:00-07:00)

📌 Perintah Lain:
/start - Menu utama
/register - Daftar ke bot
/cari - Cari karyawan
/cariorder - Cari order
/history - Lihat riwayat
/help - Bantuan ini
```

---

## formatter.ts — formatHistoryList (dipanggil /history)

**30 — /history tidak ada data**
```
📊 Belum ada riwayat realisasi dalam 7 hari terakhir.
```

**31 — /history ada data**
```
📊 {title} (7 hari terakhir):
{item1}
{item2}
...
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**32 — Format per item history**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 {nama_karyawan}
📅 {tanggal} | Shift {shift}
🏭 {bagian}
📦 {order} - {pekerjaan}
✔️ {realisasi} / 🎯 {target} ({percentage}%)
```

---

## formatter.ts — formatRealisasiSummary (setelah submit)

**33 — Summary berhasil simpan**
```
✅ Data realisasi berhasil disimpan!

📊 Ringkasan:
━━━━━━━━━━━━━━━━━━
👤 Nama      : {nama_karyawan}
📝 Diinput oleh: {input_by}   ← hanya jika berbeda
📅 Tanggal   : {tanggal}
⏰ Shift     : {shift}
🏭 Bagian    : {bagian}
📦 Order     : {order}
⚙️ Pekerjaan : {pekerjaan}
🎯 Target    : {target}       ← hanya jika diisi
✔️ Realisasi : {realisasi} ({percentage}%)
📄 Inscheet  : {inscheet}     ← hanya jika diisi
❌ Rijek     : {rijek}        ← hanya jika diisi
━━━━━━━━━━━━━━━━━━

Gunakan /history untuk melihat riwayat.
```

---

## history.ts

**34 — /history user belum terdaftar**
```
❌ Anda belum terdaftar.

Gunakan /register untuk daftar.
```

**35 — /history user belum disetujui**
```
⏳ Akun Anda belum disetujui admin.

Tunggu persetujuan terlebih dahulu.
```

**36 — /history loading**
```
🔍 Mengambil riwayat realisasi...
```

**37 — Error history**
```
❌ Terjadi kesalahan: {error.message}
```
