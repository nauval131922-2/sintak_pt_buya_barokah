# Prompt: Samakan Isi DB Dev dengan DB Local Prod

## Tujuan
`database_dev.sqlite` (dipakai `npm run dev`) harus berisi data yang identik dengan `database.sqlite` (prod lokal).

## Constraints
- JANGAN edit/hapus `database.sqlite` (prod)
- JANGAN ubah kode aplikasi
- JANGAN commit, branch, push

## Langkah

1. **Stop dev server & PM2** (jika sedang jalan):
   ```powershell
   Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue; Start-Sleep 2
   ```

2. **Hapus file dev yang lama** (biar gak corrupt):
   ```powershell
   Remove-Item -LiteralPath "database_dev.sqlite" -Force -ErrorAction SilentlyContinue
   Remove-Item -LiteralPath "database_dev.sqlite-wal" -Force -ErrorAction SilentlyContinue
   Remove-Item -LiteralPath "database_dev.sqlite-shm" -Force -ErrorAction SilentlyContinue
   ```

3. **Checkpoint + VACUUM INTO** dari prod ke dev:
   ```powershell
   npx tsx -e "const { createClient } = require('@libsql/client'); const p = createClient({ url: 'file:database.sqlite' }); p.execute('PRAGMA wal_checkpoint(FULL)').then(() => p.execute(\"VACUUM INTO 'database_dev.sqlite'\")).then(() => p.close()).then(() => { const d = createClient({ url: 'file:database_dev.sqlite' }); return d.execute('PRAGMA integrity_check').then(r => { console.log('integrity:', JSON.stringify(r.rows)); d.close(); }); }).catch(e => { console.error('FAILED:', e.message); process.exit(1); })"
   ```

4. **Verifikasi** hasil integrity_check harus `[{"integrity_check":"ok"}]`

5. **Start ulang dev server**:
   ```powershell
   npm run dev
   ```

## Troubleshooting

- Jika VACUUM INTO gagal dengan `SQLITE_CORRUPT`, cek integritas prod dulu:
  ```powershell
  npx tsx -e "const { createClient } = require('@libsql/client'); const c = createClient({ url: 'file:database.sqlite' }); c.execute('PRAGMA integrity_check').then(r => console.log(r.rows)).finally(() => c.close())"
  ```
- Error `database is locked`: pastikan semua proses Node.js dimatikan (langkah 1)
- Pastikan working directory adalah root project (`D:\repo github\sintak_pt_buya_barokah`)
