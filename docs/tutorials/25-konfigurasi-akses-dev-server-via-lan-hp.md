# Konfigurasi Akses Dev Server via LAN IP dari HP & Solusi Auto-Reload Next.js 16

## 🎯 Tujuan
Memungkinkan pengembang mengakses dev server Next.js 16 (`npm run dev`) dari HP atau perangkat lain di jaringan lokal (Wi-Fi LAN) tanpa mengalami masalah re-connection / page reload terus-menerus (*auto-reload loop*).

## 📋 Masalah Utama
Saat dev server Next.js diakses lewat IP LAN (contoh: `http://10.203.201.220:3001`):
1. **Localhost di HP tidak bisa dipakai**: `localhost` di HP merujuk ke HP itu sendiri, bukan ke PC dev server.
2. **Auto-reload loop pada Next.js 16**: Dev server Next.js memblokir request HMR WebSocket dari origin IP LAN jika `allowedDevOrigins` tidak dikonfigurasi secara tepat. Pola wildcard tunggal `['*']` ditolak oleh CSRF domain matcher bawaan Next.js 16, menghasilkan error `403 Unauthorized` pada WebSocket yang memicu full page reload terus-menerus.

## 📝 Solusi & Konfigurasi

### 1. Dapatkan IP LAN PC
Buka terminal / Command Prompt di PC dan jalankan:
```bash
ipconfig
```
Cari bagian **IPv4 Address** pada adapter Wi-Fi / Ethernet (contoh: `10.203.201.220` atau `192.168.1.5`).

### 2. Konfigurasi `package.json`
Pastikan dev script mendengarkan di semua interface jaringan (`-H 0.0.0.0`) dan mengaktifkan Turbopack (`--turbo`):

```json
"scripts": {
  "dev": "next dev -p 3001 -H 0.0.0.0 --turbo"
}
```

### 3. Konfigurasi `next.config.ts`
Gunakan pola wildcard sub-segment/IP pada `allowedDevOrigins` agar request HMR WebSocket dari IP LAN diizinkan:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gunakan subnet wildcard yang valid agar WebSocket HMR dari LAN IP tidak kena 403 / auto-reload loop
  allowedDevOrigins: [
    '10.*.*.*',
    '192.168.*.*',
    '172.*.*.*',
    '*.local',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb'
    }
  }
};

export default nextConfig;
```

## ✅ Verifikasi
1. Jalankan ulang dev server: `npm run dev`
2. Pastikan HP dan PC terhubung ke Wi-Fi yang sama.
3. Buka browser HP dan akses: `http://<IP_PC>:3001` (contoh: `http://10.203.201.220:3001`).
4. Navigasikan halaman di HP — perhatikan bahwa halaman tidak lagi melakukan auto-reload terus menerus dan HMR berjalan lancar.

## ⚠️ Catatan Penting
- Jangan gunakan `allowedDevOrigins: ['*']` karena Next.js 16 CSRF matcher mengabaikan bare wildcard `*` untuk pertimbangan keamanan.
- Pastikan Windows Firewall tidak memblokir inbound connection pada port 3001.
