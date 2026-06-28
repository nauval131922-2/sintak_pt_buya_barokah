# 🤖 SINTAK Telegram Bot - Bagian SETTING

Bot Telegram untuk input realisasi produksi bagian SETTING.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configuration
File `.env` sudah dikonfigurasi:
```env
BOT_TOKEN=8970826779:AAGpI-s3Y_YzchOpGj1VEUbEAtM0lIKtHZA
BAGIAN=SETTING
SINTAK_API_URL=http://localhost:3000
SINTAK_API_KEY=bismillah-m377-4j76-bb34-c450-7a62-ad3f
TZ=Asia/Jakarta
```

### 3. Run Bot
```bash
# Development mode (dengan auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

## 📝 Testing Steps

### Step 1: Start SINTAK Dev Server
Di terminal lain:
```bash
cd D:\repo github\sintak_pt_buya_barokah
npm run dev
```

### Step 2: Start Bot
```bash
cd D:\repo github\sintak_pt_buya_barokah\telegram-bot
npm run dev
```

### Step 3: Test di Telegram

1. **Buka Telegram, cari bot:** `@SintakSettingBot`

2. **Registrasi:**
   ```
   /start
   ```
   Bot akan minta nama. Ketik:
   ```
   Nauval Gunawan
   ```

3. **Admin Approve (manual via database):**
   Di terminal SINTAK:
   ```bash
   sqlite3 database_dev.sqlite "UPDATE telegram_users SET is_active = 1, approved_at = CURRENT_TIMESTAMP, approved_by = 'admin' WHERE telegram_id = 'YOUR_TELEGRAM_ID'"
   ```
   
   Atau pakai script Node.js (buat nanti).

4. **Test Input Realisasi:**
   ```
   /input
   ```
   Lalu kirim template:
   ```
   Nama: Nauval Gunawan
   Absensi: 190
   Tgl: 2026-06-26
   Shift: 1
   Order: SO-12345
   Pekerjaan: Setting Mesin Offset
   Target: 100
   Realisasi: 95
   Kendala: Mesin delay 15 menit
   ```

5. **Lihat History:**
    ```
    /history
    ```

6. **Cari Karyawan jika lupa nama/absensi:**
   ```
   /cari nauval
   ```

7. **Help:**
    ```
    /help
    ```

## 🧪 Testing User

- **Nama:** Nauval Gunawan
- **Telegram ID:** nauval131922
- **Telegram Username:** @nauval131922
- **Bagian:** SETTING

## 📂 Project Structure

```
telegram-bot/
├── src/
│   ├── bot.ts                 # Main bot file
│   ├── handlers/
│   │   ├── start.ts          # /start - registrasi
│   │   ├── input.ts          # /input - input realisasi
│   │   ├── history.ts        # /history - view riwayat
│   │   └── help.ts           # /help - bantuan
│   └── utils/
│       ├── api.ts            # SINTAK API client
│       ├── parser.ts         # Template parser & validator
│       └── formatter.ts      # Message formatter
├── .env                      # Configuration
├── package.json
└── tsconfig.json
```

## 🔧 Troubleshooting

### Bot tidak response
- Pastikan bot token benar
- Pastikan SINTAK dev server berjalan di http://localhost:3000
- Cek console log untuk error

### Registrasi gagal
- Pastikan nama karyawan "Nauval Gunawan" ada di tabel `employees` SINTAK
- Cek API endpoint: `http://localhost:3000/api/telegram/validate-karyawan?nama=Nauval+Gunawan`

### Input realisasi gagal
- Pastikan user sudah diapprove (is_active = 1)
- Cek format template (wajib: Tgl, Shift, Realisasi)
- Jika pakai field `Absensi`, pastikan nomor ada di tabel `employees` dan masih aktif
- Jika pakai field `Nama`, pastikan nama ada di tabel `employees`, aktif, dan masih 1 bagian dengan akun Telegram penginput
- Cek console log bot untuk detail error

## 📊 API Endpoints Used

- `GET /api/telegram/validate-karyawan` - Validasi nama saat registrasi
- `POST /api/telegram/register-request` - Submit registrasi request
- `GET /api/telegram/check-status` - Cek status user (pending/approved)
- `GET /api/telegram/validate-order` - Validasi order exist
- `POST /api/telegram/realisasi` - Submit data realisasi
- `GET /api/telegram/history` - Ambil riwayat user

## 🔐 Security

- Semua API calls protected dengan `X-API-Key` header
- User validation sebelum input realisasi
- Admin approval required untuk aktivasi user

## 📝 Notes

- Bot ini untuk **bagian SETTING** saja
- Nanti bisa deploy 6 bot terpisah (1 per bagian)
- Approval sementara manual via database, nanti ada web interface
- Field `Nama` pada template bersifat opsional untuk input atas nama karyawan lain yang aktif di database. Activity log tetap menyimpan siapa akun Telegram penginputnya
- Field `Absensi` direkomendasikan jika user tidak ingat nama lengkap karyawan
- Command `/cari <kata kunci>` dipakai untuk mencari semua karyawan aktif

---

**Status:** ✅ Ready for Testing  
**Created:** 26 Juni 2026  
**Bot Username:** @SintakSettingBot
