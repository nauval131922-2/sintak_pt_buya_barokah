# Rekap Sesi — 25 Mei 2026

## 1. Fix Filter Log Aktivitas (Timezone UTC vs WIB)

**File**: `src/lib/activity-log-query.ts`

**Problem**: `created_at` di DB tersimpan dalam UTC (`DEFAULT CURRENT_TIMESTAMP`), filter dari client menggunakan WIB (UTC+7). Single-day filter "Hari ini" menghasilkan SQL `WHERE created_at >= '2026-05-25'` yang tidak cocok dengan data `2026-05-24 xx:xx:xx` UTC (padahal itu 25 Mei WIB).

**Perbaikan**: Konversi `from`/`to` dari WIB ke UTC sebelum query:
```
from WIB → new Date(`${from}T00:00:00+07:00`) → toISOString
to WIB   → new Date(`${to}T00:00:00+07:00`) +1 day → toISOString
```

**Hasil**:
| Filter | Sebelum | Sesudah |
|--------|---------|---------|
| Hari ini (25 Mei) | `>= '2026-05-25'` | `>= '2026-05-24 17:00:00'` |
| Upper bound | `< '2026-05-26'` | `< '2026-05-25 17:00:00'` |

---

## 2. Fix Trend Chart Log Aktivitas (Group by WIB)

**File**: `src/app/api/activity-log/trend/route.ts`

**Problem**: `date(al.created_at)` mengelompokkan berdasarkan tanggal UTC. Data 25 Mei WIB yang tersimpan sebagai `2026-05-24 xx:xx:xx` UTC muncul di bar chart sebagai 24 Mei.

**Perbaikan**: `date(datetime(al.created_at, '+7 hours'))` — group by WIB date.

---

## 3. Fix Glitch Klik Row Log Aktivitas

**File**: `src/app/log-aktivitas/ActivityLogClient.tsx`

**Problem**: `toggleExpand()` menggunakan `window.history.replaceState` untuk update URL (menambahkan `?id=xxx`). Tapi Next.js `useSearchParams()` tidak tahu perubahan ini. URL sync effect membaca `urlSearchParams` (masih old) dan memanggil `router.replace` — mengembalikan URL ke semula. Terjadi perang URL yang menyebabkan glitch visual di klik pertama.

**Perbaikan**:
- Hapus `window.history.replaceState` dari `toggleExpand`
- URL sync effect sekarang menggunakan `expandedId` dari state, bukan `urlSearchParams.get('id')`

---

## 4. Filter Nama Order di Halaman JHP

### Client (`src/app/jurnal-harian-produksi/JurnalClient.tsx`)
- Tambah state `noOrderFilter`
- Fetch SOPD list dari `/api/sopd?all=true&limit=5000` pada mount (tidak hanya saat form open)
- Tambah query param `noOrder` ke fetch data
- Dropdown "Filter Nama Order" menggunakan `SearchableDropdown`, data dari `sopdList` (sama seperti dropdown no. order di form realisasi)
- Reset filter ikut membersihkan `noOrderFilter`

### API (`src/app/api/jurnal-harian-produksi/route.ts`)
- Tambah parameter `noOrder`
- Filter SQL: `(no_order = ? OR no_order_2 = ? OR nama_order = ? OR nama_order_2 = ?)`

---

## 5. Operasional

| No | Tindakan | Detail |
|----|----------|--------|
| 1 | Matikan proses node liar | PID 10132 di port 3000 — `taskkill /PID 10132 /F` |
| 2 | Disable startup PM2 | `schtasks /change /tn "SINTAK-Logon-AdminPowerShell" /disable` |
| 3 | Disable startup dev 3001 | `schtasks /change /tn "SINTAK-Logon-DevGitBash" /disable` |
| 4 | Buat dokumentasi | `docs/LOCAL_PROD_TEST.md` — cara test build di port berbeda |
