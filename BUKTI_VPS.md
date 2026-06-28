# Laporan Gangguan VPS Rumahweb — 27 Juni 2026

**VPS**: 202.10.34.157 (TechnoVillage, Paket M)
**Domain**: sintak-ptbuya.cloud
**Waktu Test**: 16:32 - 16:40 WIB

---

## 1. Ping Test (10 kali, interval 1 detik)

| Percobaan | Hasil | Latensi |
|-----------|-------|---------|
| 1 | ❌ TIMEOUT | - |
| 2 | ❌ TIMEOUT | - |
| 3 | ❌ TIMEOUT | - |
| 4 | ✅ OK | 37ms |
| 5 | ✅ OK | 52ms |
| 6 | ✅ OK | 42ms |
| 7 | ✅ OK | 54ms |
| 8 | ✅ OK | 28ms |
| 9 | ✅ OK | 28ms |
| 10 | ✅ OK | 54ms |

**Packet loss: 30%** (3 dari 10 timeout)

## 2. SSH Connection Test

Sepanjang sesi (15:00 - 16:40), SSH gagal berkali-kali:
- `ssh: connect to host 202.10.34.157 port 22: Connection timed out`
- `ssh: connect to host 202.10.34.157 port 22: Connection refused`
- Hanya terkoneksi ~60% percobaan

## 3. Server Internal (saat berhasil SSH)

Resource VPS saat dicek:
- **RAM**: 2.2GB, terpakai 689MB, available 1.5GB ✅
- **CPU Load**: 0.02 — sangat rendah ✅
- **Swap**: 255MB, terpakai 24MB ✅
- **Next.js Response (localhost)**: 15-50ms ✅
- **PM2 Status**: online, uptime 111 menit, RAM 479MB ✅

**Kesimpulan**: Server dan aplikasi berjalan normal. Semua lambat yang dialami user disebabkan packet loss / koneksi jaringan VPS yang tidak stabil, bukan karena beban server.
