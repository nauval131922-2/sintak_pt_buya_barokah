# 🚀 FINAL TESTING SCRIPT - RUN MANUAL

## INSTRUCTIONS: Jalankan command ini di 3 terminal berbeda

### ✅ TERMINAL 1: SINTAK Production Server

```powershell
cd "D:\repo github\sintak_pt_buya_barokah"
npm run start
```

**Wait for:** `✓ Ready in XXXXms`

---

### ✅ TERMINAL 2: Test API Endpoint

Setelah Terminal 1 ready, test API:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/telegram/check-status?telegram_id=123" -Headers @{"X-API-Key"="bismillah-m377-4j76-bb34-c450-7a62-ad3f"}
```

**Expected Output:**
```json
{
  "registered": false,
  "is_active": 0,
  "message": "User belum terdaftar"
}
```

**Jika dapat JSON → API WORKS! ✅**

---

### ✅ TERMINAL 3: Start Bot

Setelah API test berhasil:

```powershell
cd "D:\repo github\sintak_pt_buya_barokah\telegram-bot"
npm run dev
```

**Wait for:**
```
✅ Bot started: @SintakSettingBot
📍 Bagian: SETTING
🔗 SINTAK API: http://localhost:3000
```

---

### ✅ TEST DI TELEGRAM

1. **Buka Telegram**
2. **Cari bot:** `@SintakSettingBot`
3. **Kirim:** `/start`

**Expected Response:**
```
👋 Selamat datang di SINTAK Bot - Bagian SETTING!

Untuk menggunakan bot ini, silakan daftarkan diri Anda terlebih dahulu.

Ketik nama lengkap Anda sesuai dengan yang terdaftar di SINTAK:
```

4. **Ketik nama:** `Nauval Gunawan`

**Expected Response:**
```
⏳ Permintaan registrasi Anda telah dikirim ke admin.

📋 Data Anda:
👤 Nama: Nauval Gunawan
📍 Posisi: ...
🆔 Absensi: ...
🏭 Bagian: SETTING
...
```

---

### ✅ APPROVE USER (Terminal 4)

```powershell
cd "D:\repo github\sintak_pt_buya_barokah\telegram-bot"

# Ganti <TELEGRAM_ID> dengan ID Anda (cek via @userinfobot di Telegram)
npm run approve <TELEGRAM_ID>
```

**Example:**
```powershell
npm run approve 1142157164
```

---

### ✅ TEST INPUT REALISASI

Kembali ke Telegram, kirim:

```
/input
```

Lalu kirim template:

```
Tgl: 2026-06-26
Shift: 1
Order: SO-12345
Pekerjaan: Setting Mesin Offset
Target: 100
Realisasi: 95
Kendala: Test input via bot
```

**Expected:** Bot tampilkan ringkasan data tersimpan ✅

---

### ✅ TEST HISTORY

```
/history
```

**Expected:** Bot tampilkan data yang baru diinput ✅

---

### ✅ TEST HELP

```
/help
```

**Expected:** Bot tampilkan panduan lengkap ✅

---

## 🎯 CHECKLIST SUCCESS

- [ ] SINTAK server running di port 3000
- [ ] API endpoint return JSON (bukan HTML)
- [ ] Bot server running tanpa error
- [ ] Bot merespon `/start`
- [ ] User bisa registrasi dengan nama valid
- [ ] Admin bisa approve via CLI
- [ ] User bisa `/input` realisasi
- [ ] Data masuk ke database `jurnal_harian_produksi`
- [ ] User bisa `/history` lihat data
- [ ] User bisa `/help` lihat panduan
- [ ] Data muncul di web SINTAK

---

## 🔧 JIKA MASIH ISSUE

### API Return HTML (Bukan JSON)

Restart server:
```powershell
# Kill all node
taskkill /F /IM node.exe

# Rebuild
cd "D:\repo github\sintak_pt_buya_barokah"
npm run build

# Start again
npm run start
```

### Bot Error "fetch failed"

Pastikan SINTAK server running di http://localhost:3000

Test manual:
```powershell
curl http://localhost:3000
```

Seharusnya return HTML (login page).

### Nama Karyawan Tidak Ditemukan

Tambahkan "Nauval Gunawan" ke tabel `employees` di SINTAK, atau gunakan nama karyawan lain yang sudah ada.

---

## 📁 FILES LOCATION

- **SINTAK:** `D:\repo github\sintak_pt_buya_barokah`
- **Bot:** `D:\repo github\sintak_pt_buya_barokah\telegram-bot`
- **Database:** `D:\repo github\sintak_pt_buya_barokah\database.sqlite`
- **Docs:** `telegram-bot/README.md`, `telegram-bot/TESTING.md`

---

## ✅ PRODUCTION BUILD COMPLETE!

API routes sudah compiled dan ready! Tinggal:
1. Start server (Terminal 1)
2. Test API (Terminal 2)
3. Start bot (Terminal 3)
4. Test di Telegram

**Estimated Time:** 5-10 menit

Good luck! 🚀
