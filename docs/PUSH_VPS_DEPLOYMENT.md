# Push Notification — VPS Deployment Checklist

Checklist khusus agar **Browser Push Notification** tetap jalan setelah deploy ke VPS.
Push butuh **secure context (HTTPS)** + **bot webhook nembak URL benar** + **subscription ada di DB VPS**.

> Latar: di lokal kita pakai self-signed cert (`.certs/`) + `NODE_EXTRA_CA_CERTS` di bot.
> Di VPS pakai **SSL asli (Let's Encrypt)** → Node trust otomatis, `NODE_EXTRA_CA_CERTS` TIDAK diperlukan.

---

## ⚠️ 3 Penyebab Push Gagal (cek semua)

1. **Server VPS bukan HTTPS** → browser tolak `Notification` + Service Worker.
2. **Bot `.env` masih `localhost`** → webhook nembak localhost, bukan domain VPS → 404/fetch failed.
3. **Subscription kosong di DB VPS** → user subscribe di localhost, tapi VPS baca DB sendiri (kosong).

---

## Pre-Deploy (lokal)

- [ ] `npm run build` sukses (pastikan `src/lib/push.ts` VAPID hardcoded aman — jangan diubah).
- [ ] Bot `.env` siap diubah ke domain VPS (lihat bawah).

---

## Deploy ke VPS

### 1. HTTPS wajib
Pastikan domain VPS pakai **SSL asli** (Let's Encrypt / Certbot / reverse proxy Caddy-Nginx).
- `https://domain-vps.com` harus opens lock (no warning).
- Push TIDAK jalan di HTTP polos.

### 2. Bot `.env` di VPS
Edit `telegram-bot/.env` di server VPS:
```env
SINTAK_API_URL=https://domain-vps.com
WEBHOOK_URL=https://domain-vps.com
```
> JANGAN biarkan `localhost:3001` — itu penyebab utama push mati di VPS.

Setelah edit, **restart bot**:
```bash
# kalau pm2
pm2 restart sintak-bot
# atau sesuaikan start command bot di VPS
```

### 3. Verifikasi health-check bot
Saat bot start, harus muncul:
```
✅ [WEBHOOK HEALTH] https://domain-vps.com/api/telegram/register-webhook -> 200 OK
```
Kalau `❌ 404` / `fetch failed` → bot nembak URL salah / server mati.

### 4. Subscription ada di DB VPS
User HARUS subscribe di **domain VPS** (bukan localhost):
- Buka `https://domain-vps.com/settings/telegram-users`
- Klik "Aktifkan Notifikasi Push" → `POST /api/push/subscribe 200`
- Cek DB VPS: `SELECT count(*) FROM push_subscriptions;` → harus > 0

> Subscription terikat origin. Subscribe di localhost ≠ subscribe di VPS.

### 5. VAPID
- `src/lib/push.ts` hardcode public key → konsisten di semua env.
- Private key dari `env.VAPID_PRIVATE_KEY` (pastikan ada di `.env` VPS).
- **Jangan** ganti VAPID tiap deploy (subscription lama jadi invalid).

---

## Post-Deploy Test

1. Buka `https://domain-vps.com/settings/telegram-users` di browser.
2. Subscribe push → cek `POST /api/push/subscribe 200` di log server.
3. Daftar lewat Telegram bot → **notif muncul di browser VPS-user**.
4. Cek bot log: `[WEBHOOK] Response status: 200` + server log `✅ Sent to subscription #N`.

---

## Local vs VPS — Perbedaan Kunci

| Item | Lokal | VPS |
|------|-------|-----|
| HTTPS | self-signed (`.certs/`) | SSL asli (Let's Encrypt) |
| Bot trust cert | `NODE_EXTRA_CA_CERTS` di script `dev` | TIDAK perlu (CA publik) |
| Bot `.env` | `https://localhost:3001` | `https://domain-vps.com` |
| DB subscription | `database_dev.sqlite` | DB VPS (prod) |
| Server mode | `npm run dev` (next dev) | `npm start` / pm2 `next start` |

---

## Rollback Cepat kalau Push Mati
1. Cek bot log health-check (URL benar?).
2. Cek server log ada `Found subscriptions:` > 0.
3. Cek browser buka `https://domain-vps.com` (lock hijau?).
4. Cek `env.VAPID_PRIVATE_KEY` ada di `.env` VPS.
