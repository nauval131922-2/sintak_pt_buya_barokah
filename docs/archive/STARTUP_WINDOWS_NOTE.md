# Catatan — Auto-start SINTAK di Windows (Laptop Kantor)

> **Folder proyek:** `D:\repo github\sintak_pt_buya_barokah`  
> **Dokumen terkait:** `docs/PM2_DEPLOYMENT.md` (deploy & perintah harian)

---

## Ringkasan: apa yang jalan saat laptop hidup / login

| Urutan | Komponen | Port | Keterangan |
|--------|----------|------|------------|
| 1 | **PM2** → `sintak-prod` | **3000** | Production untuk user kantor |
| 2 | **PowerShell Admin** | — | Jendela terbuka, sudah `cd` ke folder SINTAK |
| 3 | **Git Bash** → `npm run dev` | **3001** | Development / uji fitur |

Production (3000) dan dev (3001) bisa jalan **bersamaan**.

---

## Setup sekali — PM2 auto-start (production)

Jalankan di **PowerShell Run as Administrator**, **satu baris per satu**, **setelah** `cd` ke folder proyek:

```powershell
cd "D:\repo github\sintak_pt_buya_barokah"

npm run build
pm2 start ecosystem.config.js
pm2 save

npm install -g pm2-windows-startup
pm2-startup install
```

Jika `pm2-startup` tidak dikenali (PATH belum update):

```powershell
& "C:\Users\nauval\AppData\Roaming\npm\pm2-startup.cmd" install
```

**Jangan** pakai `pm2 startup` di Windows — error: `Init system not found`.

Setelah deploy fitur baru:

```powershell
cd "D:\repo github\sintak_pt_buya_barokah"
npm run build
pm2 reload sintak-prod
pm2 save
```

**Copot PM2 auto-start:**

```powershell
pm2-startup uninstall
```

---

## Setup sekali — Terminal auto-open saat login

Membuka PowerShell Admin + Git Bash dev setiap kali user login Windows.

```powershell
cd "D:\repo github\sintak_pt_buya_barokah"
.\scripts\startup\install-logon-tasks.ps1
```

| Task Scheduler | Fungsi |
|----------------|--------|
| `SINTAK-Logon-AdminPowerShell` | Buka PowerShell elevated di folder proyek |
| `SINTAK-Logon-DevGitBash` | Buka Git Bash + `npm run dev -- -p 3001` |

**File skrip:**

| File | Fungsi |
|------|--------|
| `scripts/startup/install-logon-tasks.ps1` | Daftar / hapus task Windows |
| `scripts/startup/open-admin-powershell.ps1` | Buka PowerShell Admin + `cd` proyek |
| `scripts/startup/start-dev-gitbash.bat` | Buka Git Bash + dev server |

**Copot terminal auto-open:**

```powershell
cd "D:\repo github\sintak_pt_buya_barokah"
.\scripts\startup\install-logon-tasks.ps1 -Uninstall
```

Atau buka `taskschd.msc` → cari task `SINTAK-Logon-*` → Disable / Delete.

---

## Cek setelah reboot / login

```powershell
pm2 status
```

Harus ada `sintak-prod` status **online**.

- Production: `http://localhost:3000` atau `http://192.168.2.75:3000`
- Development: `http://localhost:3001` atau `http://192.168.2.75:3001`

```powershell
pm2 logs sintak-prod --lines 20 --nostream
```

---

## Kesalahan yang sering terjadi

### 1. Perintah di folder salah (`C:\Windows\system32`)

Selalu mulai dengan:

```powershell
cd "D:\repo github\sintak_pt_buya_barokah"
```

### 2. Paste banyak baris sekaligus di PowerShell

PowerShell bisa menjalankan urutan terbalik. **Ketik / paste satu baris**, tunggu selesai, baru baris berikutnya.

### 3. `pm2 save` sebelum `pm2 start`

Akan muncul: `PM2 is not managing any process, skipping save...`  
Urutan benar: **start dulu** → **save**.

### 4. `pm2-startup` sebelum `npm install -g pm2-windows-startup`

Install paket dulu, lalu `pm2-startup install` (atau path penuh `.cmd` di atas).

---

## Perintah cepat sehari-hari

```powershell
cd "D:\repo github\sintak_pt_buya_barokah"

pm2 status
pm2 logs sintak-prod
pm2 reload sintak-prod          # setelah npm run build (deploy)
pm2 restart sintak-prod         # restart penuh (ada downtime singkat)
pm2 stop sintak-prod
pm2 start ecosystem.config.js

npm run dev -- -p 3001          # dev manual (tanpa auto-login)
```

---

## Status setup di mesin ini (per 2026-05-21)

- [x] PM2 terinstall (v7.x)
- [x] `pm2-windows-startup` terinstall
- [x] `pm2-startup install` — registry entry OK
- [x] `sintak-prod` pernah di-`pm2 save`
- [ ] `install-logon-tasks.ps1` — jalankan manual jika ingin PowerShell Admin + Git Bash otomatis tiap login

---

## Hanya butuh production (tanpa dev otomatis)?

Cukup PM2 (bagian atas). **Jangan** jalankan `install-logon-tasks.ps1`.

## Hanya butuh buka terminal manual?

Jangan pakai Task Scheduler; cukup:

```powershell
cd "D:\repo github\sintak_pt_buya_barokah"
pm2 start ecosystem.config.js
npm run dev -- -p 3001
```
