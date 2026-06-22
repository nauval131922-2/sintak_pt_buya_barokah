# Cara Test Build di Port Berbeda (Tanpa Ganggu PM2)

PM2 jalan di port 3000 (`sintak-prod`). Untuk test build sebelum reload PM2:

1. **Build dulu**:
   ```powershell
   npm run build
   ```

2. **Jalankan di port lain** (contoh 3002):
   ```powershell
   npx next start -p 3002
   ```

3. Buka `http://localhost:3002`

PM2 tetap aman di port 3000, tidak perlu di-reload.
