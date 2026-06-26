# 🎉 TELEGRAM BOT SIAP TESTING!

## ✅ Status: Bot SETTING sudah running!

Bot Username: **@SintakSettingBot**  
Bagian: **SETTING**  
Status: ✅ **ONLINE & READY**

---

## 🧪 PANDUAN TESTING LENGKAP

### Step 1: Pastikan SINTAK Dev Server Running

Di terminal 1 (SINTAK):
```bash
cd D:\repo github\sintak_pt_buya_barokah
npm run dev
```

Tunggu sampai muncul: `✓ Ready in ...`

---

### Step 2: Start Bot

Di terminal 2 (Bot):
```bash
cd D:\repo github\sintak_pt_buya_barokah\telegram-bot
npm run dev
```

Tunggu sampai muncul:
```
✅ Bot started: @SintakSettingBot
📍 Bagian: SETTING
🔗 SINTAK API: http://localhost:3000
```

---

### Step 3: Test di Telegram (User: Nauval)

#### 3.1 Registrasi

1. Buka Telegram
2. Cari bot: `@SintakSettingBot`
3. Klik **START** atau ketik `/start`
4. Bot akan minta nama, ketik:
   ```
   Nauval Gunawan
   ```
5. Bot akan balas:
   ```
   ⏳ Permintaan registrasi Anda telah dikirim ke admin.
   📋 Data Anda:
   👤 Nama: Nauval Gunawan
   📍 Posisi: (dari database)
   🆔 Absensi: (dari database)
   🏭 Bagian: SETTING
   ...
   ```

**CATATAN:** Nama "Nauval Gunawan" harus sudah ada di tabel `employees` SINTAK. Jika belum ada, tambahkan dulu atau gunakan nama karyawan lain yang sudah ada.

---

#### 3.2 Admin Approve User

**Cara 1: Via CLI Script (Recommended)**

Di terminal 3:
```bash
cd D:\repo github\sintak_pt_buya_barokah\telegram-bot

# Ganti <TELEGRAM_ID> dengan ID Telegram Anda
npm run approve <TELEGRAM_ID>

# Contoh (gunakan ID Anda yang sebenarnya):
npm run approve 123456789
```

Script akan menampilkan:
```
🔍 Mencari user dengan Telegram ID: 123456789...

📋 Data User:
   ID: 1
   Telegram ID: 123456789
   Username: @nauval131922
   Nama: Nauval Gunawan
   Bagian: SETTING
   Status: ⏳ Pending

✅ User berhasil diapprove!
```

**Cara 2: Manual via Database**

```bash
cd D:\repo github\sintak_pt_buya_barokah
sqlite3 database_dev.sqlite "UPDATE telegram_users SET is_active = 1, approved_at = CURRENT_TIMESTAMP, approved_by = 'admin' WHERE nama_karyawan = 'Nauval Gunawan'"
```

---

#### 3.3 Test Input Realisasi

Kembali ke Telegram, ketik:
```
/input
```

Bot akan minta template. Kirim:
```
Tgl: 2026-06-26
Shift: 1
Order: SO-12345
Pekerjaan: Setting Mesin Offset 4 Warna
Target: 100
Realisasi: 95
Kendala: Delay 15 menit karena ganti plate
```

Bot akan:
1. ✅ Validasi format template
2. 🔍 Validasi order (jika order tidak exist, akan kasih warning)
3. 💾 Simpan data
4. 📊 Tampilkan ringkasan

Expected response:
```
✅ Data realisasi berhasil disimpan!

📊 Ringkasan:
━━━━━━━━━━━━━━━━━━
👤 Nama      : Nauval Gunawan
📅 Tanggal   : 26 Jun 2026
⏰ Shift     : 1
🏭 Bagian    : SETTING
📦 Order     : SO-12345
⚙️ Pekerjaan : Setting Mesin Offset 4 Warna
🎯 Target    : 100
✔️ Realisasi : 95 (95%)
━━━━━━━━━━━━━━━━━━

Gunakan /history untuk melihat riwayat.
```

---

#### 3.4 Test History

Ketik:
```
/history
```

Bot akan tampilkan riwayat realisasi 7 hari terakhir.

---

#### 3.5 Test Help

Ketik:
```
/help
```

Bot akan tampilkan panduan lengkap.

---

## 🔍 Cara Cek Telegram ID Anda

Jika tidak tahu Telegram ID Anda:

1. Di Telegram, cari bot: `@userinfobot`
2. Klik START
3. Bot akan balas dengan info Anda termasuk ID:
   ```
   Id: 123456789
   First name: Nauval
   Username: @nauval131922
   ```
4. Copy ID tersebut untuk approve command

---

## 🐛 Troubleshooting

### Bot tidak response
- Pastikan bot running (cek terminal 2)
- Pastikan tidak ada error di console
- Coba /start ulang

### "Nama karyawan tidak ditemukan"
- Nama "Nauval Gunawan" harus ada di tabel `employees` SINTAK
- Cek: `http://localhost:3000/api/telegram/validate-karyawan?nama=Nauval+Gunawan`
- Tambahkan ke database jika belum ada, atau gunakan nama karyawan lain

### "Order tidak ditemukan"
- Itu hanya warning, bisa tetap lanjut
- Order akan disimpan sebagai manual order
- Untuk testing, bisa skip field Order atau gunakan order yang exist

### Registrasi stuck pending
- Jalankan approve command: `npm run approve <TELEGRAM_ID>`
- Atau update manual via sqlite3

---

## 📊 Verifikasi Data Tersimpan

Setelah input realisasi, cek di database:

```bash
cd D:\repo github\sintak_pt_buya_barokah
sqlite3 database_dev.sqlite "SELECT * FROM jurnal_harian_produksi WHERE nama_karyawan = 'Nauval Gunawan' ORDER BY created_at DESC LIMIT 1"
```

Atau buka SINTAK web:
```
http://localhost:3000/jurnal-harian-produksi
```

Filter by nama karyawan "Nauval Gunawan" dan cek data muncul.

---

## 🎯 Checklist Testing

- [ ] Bot bisa start (`npm run dev`)
- [ ] User bisa `/start` dan registrasi
- [ ] Validasi nama karyawan berhasil
- [ ] Admin bisa approve via CLI
- [ ] User bisa `/input` realisasi
- [ ] Template parsing bekerja
- [ ] Validasi tanggal & shift bekerja
- [ ] Data tersimpan di database
- [ ] User bisa `/history` lihat riwayat
- [ ] User bisa `/help` lihat panduan
- [ ] Data muncul di web SINTAK

---

## 🚀 NEXT STEPS

Setelah testing berhasil:

1. ✅ Deploy bot ke VPS (PM2)
2. ✅ Buat 5 bot lagi untuk bagian lain (QC, CETAK, FINISHING, GUDANG, TEKNISI)
3. ✅ Buat web interface admin untuk approve user
4. ✅ Testing dengan real user produksi

---

**Happy Testing!** 🎉

Jika ada error, cek console log di terminal bot untuk detail error message.
