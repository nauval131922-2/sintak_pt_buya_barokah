# 🔧 TROUBLESHOOTING - BOT TIDAK MERESPON

## ❌ MASALAH DITEMUKAN

Bot mendapat error: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**Root Cause:** API endpoints `/api/telegram/*` tidak ditemukan. Next.js mengembalikan HTML (login page) instead of JSON.

**Penyebab Kemungkinan:**
1. Next.js dev server belum detect file API baru
2. Cache Next.js masih lama
3. API route belum ter-compile dengan benar

---

## ✅ SOLUSI: MANUAL RESTART (RECOMMENDED)

Ikuti langkah ini **secara manual di terminal Anda**:

### **Step 1: Stop Semua Node Process**

Buka PowerShell/CMD dan jalankan:
```powershell
taskkill /F /IM node.exe
```

### **Step 2: Hapus Cache Next.js**

```powershell
cd "D:\repo github\sintak_pt_buya_barokah"
Remove-Item -Recurse -Force .next
```

### **Step 3: Start SINTAK Dev Server**

Buka terminal baru (Terminal 1):
```powershell
cd "D:\repo github\sintak_pt_buya_barokah"
npm run dev
```

Tunggu sampai muncul:
```
✓ Ready in X.Xs
```

### **Step 4: Test API Endpoint**

Buka browser atau terminal baru, test:
```
http://localhost:3000/api/telegram/check-status?telegram_id=123456789
```

Header: `X-API-Key: bismillah-m377-4j76-bb34-c450-7a62-ad3f`

**Expected response (JSON):**
```json
{
  "registered": false,
  "is_active": 0,
  "message": "User belum terdaftar"
}
```

**Jika masih dapat HTML:** API route belum terdeteksi. Coba:
1. Restart dev server lagi
2. Atau build production: `npm run build` lalu `npm run dev`

### **Step 5: Start Bot**

Setelah API endpoint bekerja, buka terminal baru (Terminal 2):
```powershell
cd "D:\repo github\sintak_pt_buya_barokah\telegram-bot"
npm run dev
```

Tunggu sampai muncul:
```
✅ Bot started: @SintakSettingBot
📍 Bagian: SETTING
🔗 SINTAK API: http://localhost:3000
```

### **Step 6: Test Bot di Telegram**

1. Buka Telegram
2. Cari: `@SintakSettingBot`
3. Kirim: `/start`
4. Bot seharusnya balas: "Selamat datang..."

---

## 🔍 DEBUGGING TIPS

### **Cek API Endpoint Available**

Coba akses langsung di browser:
```
http://localhost:3000/api/telegram/validate-karyawan?nama=Test
```

Dengan header `X-API-Key: bismillah-m377-4j76-bb34-c450-7a62-ad3f`

Jika dapat JSON → API OK  
Jika dapat HTML login page → API belum ter-detect

### **Cek Console Log**

Monitor terminal SINTAK saat bot kirim request. Seharusnya muncul log API call.

### **Test dengan curl (PowerShell)**

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/telegram/check-status?telegram_id=123" -Headers @{"X-API-Key"="bismillah-m377-4j76-bb34-c450-7a62-ad3f"}
```

---

## 🛠️ ALTERNATIVE: Verifikasi File API Ada

Pastikan file-file ini exist:

```
D:\repo github\sintak_pt_buya_barokah\src\app\api\telegram\
├── check-status\
│   └── route.ts          ← Harus ada
├── validate-karyawan\
│   └── route.ts          ← Harus ada
├── register-request\
│   └── route.ts          ← Harus ada
└── ... (dll)
```

Cek dengan:
```powershell
Get-ChildItem -Path "D:\repo github\sintak_pt_buya_barokah\src\app\api\telegram" -Recurse -Filter "route.ts"
```

Seharusnya list 8 file `route.ts`.

---

## 📝 CHECKLIST TROUBLESHOOTING

- [ ] Semua node process sudah di-kill
- [ ] Cache `.next` sudah dihapus
- [ ] SINTAK dev server running dan ready
- [ ] API endpoint test return JSON (bukan HTML)
- [ ] Bot server running tanpa error
- [ ] Bot merespon `/help` dengan benar
- [ ] Bot merespon `/start` dengan benar

---

## 💡 JIKA MASIH ERROR

Kemungkinan Next.js tidak detect API routes di `src/app/api/telegram/`.

**Solusi Extreme: Build Production Mode**

```powershell
cd "D:\repo github\sintak_pt_buya_barokah"
npm run build
npm run start
```

Production build akan force compile semua routes.

Atau restart VSCode/IDE Anda (kadang TypeScript server cache issue).

---

**Silakan coba manual steps di atas dan beritahu hasilnya!** 🚀

Jika API endpoint sudah return JSON, bot akan langsung bekerja.
