# Menggunakan Database Production di `npm run dev`

Untuk testing dengan data riil production di mode development.

## Cara Copy DB Production ke Dev (Paling Aman)

Pindahkan data prod ke `database_dev.sqlite` tanpa risiko data korup atau concurrency:

```powershell
# 1. Paksa SQLite pindahin semua data dari WAL ke file utama
npx tsx -e "process.env.DB_PATH='database.sqlite'; import('./src/lib/db').then(m => m.default.execute('PRAGMA wal_checkpoint(FULL)'))"

# 2. Copy (replace) DB dev dengan data prod
Copy-Item "database.sqlite" "database_dev.sqlite" -Force

# 3. (Opsional) Hapus sisa file WAL/SHM dev yang lama
Remove-Item "database_dev.sqlite-wal" -ErrorAction SilentlyContinue
Remove-Item "database_dev.sqlite-shm" -ErrorAction SilentlyContinue
```

Setelah ini, `npm run dev` otomatis pakai data prod.

## Cara Balikin DB Dev ke Kosong

```powershell
Remove-Item "database_dev.sqlite"
Remove-Item "database_dev.sqlite-wal" -ErrorAction SilentlyContinue
Remove-Item "database_dev.sqlite-shm" -ErrorAction SilentlyContinue
npm run init-db:dev
```

## Cara Pakai DB Production Langsung (Alternatif, Beresiko)

Lewati langkah copy, langsung arahkan dev ke file prod:

```powershell
$env:DB_PATH='database.sqlite'; npm run dev
```
