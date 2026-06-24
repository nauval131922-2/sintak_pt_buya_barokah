# PM2 Deployment Guide — SINTAK ERP

Panduan menjalankan dan men-deploy SINTAK ERP menggunakan PM2 agar server production tetap berjalan saat pengembangan berlangsung.

> **Catatan ringkas auto-start Windows (PM2 + terminal login):** lihat [`docs/STARTUP_WINDOWS_NOTE.md`](./STARTUP_WINDOWS_NOTE.md)

---

## Arsitektur

| Port | Tujuan | Perintah |
|------|--------|----------|
| `3000` | **Production** — diakses user kantor | `pm2 start ecosystem.config.js` |
| `3001` | **Development** — pengembangan lokal | `npm run dev -- -p 3001` |

Keduanya bisa berjalan **bersamaan** tanpa konflik.

---

## Setup Awal (hanya sekali)

> Sudah dilakukan. Lewati bagian ini jika PM2 sudah terinstall.

```powershell
# Install PM2 secara global
npm install -g pm2
```

---

## Menjalankan Server Production

```powershell
pm2 start ecosystem.config.js
```

Cek status:
```powershell
pm2 status
```

Output normal:
```
│ 0  │ sintak-prod │ ... │ online │ ...
```

---

## Workflow Deploy Fitur Baru

Ini adalah langkah yang dilakukan setiap kali fitur sudah selesai dikembangkan di port 3001 dan siap dipindahkan ke production.

### Langkah-langkah

**1. Pastikan fitur sudah siap di dev (port 3001)**
```powershell
npm run dev -- -p 3001
# Test fitur di http://192.168.2.75:3001
# Kalau sudah oke, lanjut ke langkah berikutnya
```

**2. Stop dev server (Ctrl+C)**

**3. Build production**
> Server di port 3000 tetap jalan selama proses build berlangsung.
```powershell
npm run build
```
Tunggu hingga build selesai (biasanya 1–3 menit).

**4. Reload server (zero-downtime)**
> User di kantor tidak merasakan gangguan sama sekali.
```powershell
pm2 reload sintak-prod
```

**5. Verifikasi**
```powershell
pm2 status
pm2 logs sintak-prod --lines 20 --nostream
```
Akses `http://192.168.2.75:3000` dan pastikan fitur baru sudah tampil.

---

## Perintah PM2 Sehari-hari

```powershell
# Cek status server
pm2 status

# Lihat log realtime (Ctrl+C untuk keluar)
pm2 logs sintak-prod

# Lihat log terakhir (tanpa realtime)
pm2 logs sintak-prod --lines 50 --nostream

# Reload setelah build (ZERO downtime) ← pakai ini saat deploy
pm2 reload sintak-prod

# Restart penuh (ada downtime singkat)
pm2 restart sintak-prod

# Stop server
pm2 stop sintak-prod

# Start ulang server (setelah stop)
pm2 start ecosystem.config.js
```

---

## Auto-start saat laptop/PC nyala (Windows)

Detail lengkap (PM2, terminal login, troubleshooting, kesalahan umum): **[`docs/STARTUP_WINDOWS_NOTE.md`](./STARTUP_WINDOWS_NOTE.md)**.

Ringkas:

```powershell
cd "D:\repo github\sintak_pt_buya_barokah"
npm run build
pm2 start ecosystem.config.js
pm2 save
npm install -g pm2-windows-startup
pm2-startup install
```

Terminal PowerShell Admin + Git Bash dev saat login:

```powershell
.\scripts\startup\install-logon-tasks.ps1
```

---

## Lokasi File Penting

| File | Keterangan |
|------|------------|
| `ecosystem.config.js` | Konfigurasi PM2 (port, env, log path) |
| `logs/pm2-out.log` | Log output server |
| `logs/pm2-error.log` | Log error server |

---

## Troubleshooting

### Status `stopped` / `errored` setelah `pm2 start`
Kemungkinan belum pernah build. Jalankan dulu:
```powershell
npm run build
pm2 start ecosystem.config.js
```

### Cek error detail
```powershell
pm2 logs sintak-prod --lines 30 --nostream
```

### Port 3000 sudah dipakai proses lain
```powershell
# Cek proses yang pakai port 3000
netstat -ano | findstr :3000
# Matikan proses tersebut, lalu start ulang PM2
pm2 start ecosystem.config.js
```
