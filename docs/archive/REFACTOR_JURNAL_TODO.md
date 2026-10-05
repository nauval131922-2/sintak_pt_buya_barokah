# Refactor JurnalClient.tsx — TODO & Context

**Dibuat:** 2026-07-03 20:38 WIB  
**Target:** Pecah `JurnalClient.tsx` (3,412 LOC) menjadi 7-8 file modular  
**Lokasi file asli:** VPS `202.10.34.157:/var/www/sintak/src/app/jurnal-harian-produksi/JurnalClient.tsx`  
**Lokasi refactor:** Local laptop Windows `D:/repo github/sintak_pt_buya_barokah/`

---

## 📊 File Stats (dari VPS production)

- **Total LOC:** 3,412
- **useState declarations:** 50+
- **Hooks (useEffect/useMemo/useCallback):** 42
- **API calls (fetch/POST/PUT/DELETE):** 41
- **Main sections:**
  - List view dengan filters (bagian, karyawan, tanggal, no order, belum realisasi)
  - Form view (tab target/realisasi)
  - Copy Jadwal modal (copy from → to dengan filter bagian/karyawan)
  - Cek Karyawan modal (tab belum/sudah dapat pekerjaan)
  - Export Excel (by year)
  - Inline keterangan editor (editable cell)

---

## 🎯 Target Struktur

```
src/app/jurnal-harian-produksi/
├── JurnalClient.tsx              (~400 LOC - orchestrator only)
├── components/
│   ├── JurnalTable.tsx           (DataTable + columns + KeteranganEditableCell)
│   ├── JurnalFilters.tsx         (Search, DatePicker, Bagian, Nama, No Order, Belum Realisasi)
│   ├── JurnalForm.tsx            (Tab target/realisasi, form fields)
│   ├── KeteranganEditableCell.tsx (Inline editor dengan paste support)
│   ├── CopyJadwalModal.tsx       (BaseModal + copy logic)
│   └── CekKaryawanModal.tsx      (BaseModal + tab belum/sudah)
├── hooks/
│   ├── useJurnalData.ts          (fetch, reload, pagination, sorting)
│   ├── useJurnalFilters.ts       (filter state + derived data)
│   └── useJurnalActions.ts       (CRUD: create, update, delete, copy, revert)
└── utils/
    ├── formatters.ts             (formatIndoDateStr, evaluateMathExpression, formatFormulaNumbers)
    └── constants.ts              (BAGIAN_CATEGORY_MAP, BAGIAN_LIST, SHIFT_JAM, PAGE_SIZE)
```

---

## 🪜 Extraction Order (Ladder)

Urutan extract dari yang paling aman (low-risk) ke high-risk:

### Step 1: Utils & Constants (10 menit)
**Risk:** ⚪️ Low — pure functions, no state, no side effects

- Extract `formatIndoDateStr`, `evaluateMathExpression`, `formatFormulaNumbers` → `utils/formatters.ts`
- Extract `BAGIAN_CATEGORY_MAP`, `BAGIAN_LIST`, `SHIFT_JAM`, `PAGE_SIZE` → `utils/constants.ts`
- **Verify:** Import di `JurnalClient.tsx` dan test fungsi formatter

### Step 2: KeteranganEditableCell Component (15 menit)
**Risk:** ⚪️ Low — self-contained component dengan props jelas

- Extract `KeteranganEditableCell` function → `components/KeteranganEditableCell.tsx`
- Props: `row`, `onSave`, `onCancel`
- Internal state: `isEditing`, `value`, `localVal`, `isSaving`
- **Verify:** Cell masih bisa edit/save/paste di tabel

### Step 3: CopyJadwalModal Component (20 menit)
**Risk:** 🟡 Medium — modal dengan banyak state, tapi independent

- Extract Copy Jadwal modal → `components/CopyJadwalModal.tsx`
- Props: `isOpen`, `onClose`, `onCopy`, `bagianOptions`, `karyawanByBagian`
- Internal state: `copyFrom`, `copyTo`, `copyBagian`, `copyKaryawan`, `copyModalError`, dll
- **Verify:** Modal bisa dibuka, filter bagian/karyawan jalan, copy action works

### Step 4: CekKaryawanModal Component (20 menit)
**Risk:** 🟡 Medium — modal dengan fetch internal + tab switching

- Extract Cek Karyawan modal → `components/CekKaryawanModal.tsx`
- Props: `isOpen`, `onClose`, `startDate`, `endDate`
- Internal: fetch `/api/jurnal-harian-produksi/cek-karyawan`, tab belum/sudah, search, pagination
- **Verify:** Modal load data, tab switching, search filter works

### Step 5: JurnalFilters Component (25 menit)
**Risk:** 🟡 Medium — banyak state + dropdown + DatePicker

- Extract filter section → `components/JurnalFilters.tsx`
- Props: `searchQuery`, `setSearchQuery`, `startDate`, `setStartDate`, `endDate`, `bagianFilter`, `namaKaryawanFilter`, dll + `bagianOptions`, `namaOptions`
- **Verify:** Semua filter trigger re-fetch data dengan benar

### Step 6: JurnalForm Component (30 menit)
**Risk:** 🟠 High — form dengan conditional logic, multi-realisasi mode, validasi

- Extract form section → `components/JurnalForm.tsx`
- Props: `activeTab`, `formSubTab`, `isAdding`, `editingId`, `formData`, `setFormData`, `multiRealisasi`, `isMultiRealisasiMode`, `onSave`, `onCancel`, `canInputTarget`, `canInputRealisasi`, dll
- **Verify:** Form bisa add target, add/edit realisasi, multi-realisasi mode works

### Step 7: JurnalTable Component (25 menit)
**Risk:** 🟡 Medium — DataTable + columns definition + actions

- Extract tabel section → `components/JurnalTable.tsx`
- Props: `data`, `columns`, `sorting`, `onSortingChange`, `totalCount`, `page`, `onPageChange`, `loading`
- Include: Delete action, Edit action, inline keterangan cell
- **Verify:** Tabel render, sorting, pagination, delete/edit actions works

### Step 8: Custom Hooks (40 menit total)
**Risk:** 🟠 High — core business logic + side effects

#### Step 8a: useJurnalData (15 menit)
- Extract: `fetchData`, `loading`, `data`, `error`, `loadTime`, `totalCount`, `refreshKey`, `reload`
- Deps: `searchQuery`, `debouncedQuery`, `startDate`, `endDate`, `page`, `sorting`, `bagianFilter`, `namaKaryawanFilter`, dll

#### Step 8b: useJurnalFilters (10 menit)
- Extract: filter states + derived data (`totalRealisasi`, `totalRijek`, `bagianOptions`, `namaOptions`, `karyawanByBagian`)
- Debounce logic untuk search

#### Step 8c: useJurnalActions (15 menit)
- Extract: `handleDelete`, `handleSave`, `handleCopyJadwal`, `handleRevert`, `handleExport`, dll
- Include: toast notifications, error handling, reload triggers

**Verify Step 8:** Semua CRUD operation + export + copy works tanpa regression

---

## ⚠️ Common Pitfalls

1. **State lifting terlalu agresif**
   - Jangan lift state yang cuma dipakai 1 component
   - Local state di component > global state di parent

2. **Props drilling hell**
   - Kalau props chain > 2 level, consider Context API atau state colocation

3. **useEffect dependencies**
   - Pastikan deps array benar, jangan skip atau over-specify
   - Pakai `useCallback` untuk function yang jadi dep

4. **Import cycle**
   - Jangan import parent dari child
   - Utils/constants harus leaf nodes (no imports dari feature code)

5. **TypeScript any**
   - Jangan pakai `any` untuk data types
   - Define proper interface untuk row data, form data, filter state

6. **Testing setiap step**
   - Jangan extract 3 file sekaligus baru test
   - Extract 1 → verify → commit → next

---

## ✅ Verification Checklist

Setelah semua file di-extract, test scenarios:

### List View
- [ ] Load data on mount (with date range from localStorage)
- [ ] Search by query (debounced)
- [ ] Filter by bagian (dropdown multi-select)
- [ ] Filter by nama karyawan (dropdown multi-select)
- [ ] Filter by no order (text input)
- [ ] Filter by "belum realisasi" (checkbox)
- [ ] Date range filter (start/end)
- [ ] Sorting (asc/desc by column)
- [ ] Pagination (prev/next, total count correct)
- [ ] Reload button (refresh data)
- [ ] Total realisasi & rijek display correct

### Form View (Target)
- [ ] Switch to form tab
- [ ] Add target: fill fields → save → data muncul di list
- [ ] Bulk shift dropdown works
- [ ] Validation: required fields, date format, numeric fields

### Form View (Realisasi)
- [ ] Switch to realisasi sub-tab
- [ ] Add realisasi single: fill fields → save
- [ ] Add realisasi multi: toggle multi mode → add rows → save all
- [ ] Edit realisasi: click edit → form prefilled → update → save
- [ ] Validation: realisasi <= target, rijek numeric

### Inline Keterangan Edit
- [ ] Double-click cell → inline editor muncul
- [ ] Edit text → save (checkmark icon)
- [ ] Cancel edit (X icon)
- [ ] Paste from clipboard (paste icon)
- [ ] Click outside → auto-save

### Copy Jadwal Modal
- [ ] Open modal (button on toolbar)
- [ ] Select copyFrom date
- [ ] Select copyTo date
- [ ] Filter bagian (checkbox multi-select dengan search)
- [ ] Filter karyawan (checkbox multi-select dengan search)
- [ ] Copy action → success toast → data copied
- [ ] Validation: copyFrom & copyTo required

### Cek Karyawan Modal
- [ ] Open modal (button on toolbar)
- [ ] Load data for current date range
- [ ] Tab "Belum dapat pekerjaan" shows karyawan tanpa job
- [ ] Tab "Sudah dapat pekerjaan" shows karyawan dengan job details
- [ ] Search works on both tabs
- [ ] Pagination (load more) on "Sudah" tab

### Export Excel
- [ ] Click export button → year modal opens
- [ ] Select year (or "All")
- [ ] Export progress indicator
- [ ] File download success

### Delete Action
- [ ] Click delete icon → confirm dialog
- [ ] Confirm → row deleted → list reloads

### Revert Action (if canRevert)
- [ ] Button visible when revert available
- [ ] Click revert → confirm → data reverted

---

## 🚀 Implementasi di CLI

Saat jalankan refactor di Hermes CLI:

1. **Pull latest dari VPS production:**
   ```bash
   ssh root@202.10.34.157 "cat /var/www/sintak/src/app/jurnal-harian-produksi/JurnalClient.tsx" > /tmp/JurnalClient_vps.tsx
   ```

2. **Copy ke local repo:**
   ```bash
   cp /tmp/JurnalClient_vps.tsx "D:/repo github/sintak_pt_buya_barokah/src/app/jurnal-harian-produksi/JurnalClient.tsx"
   ```

3. **Jalankan extraction step-by-step** (ikuti Step 1-8 di atas)

4. **Test setiap step di local dev server** (`npm run dev`)

5. **Commit per step** (jangan 1 big commit):
   ```bash
   git add .
   git commit -m "refactor(jurnal): extract utils & constants"
   # ... dst
   ```

6. **Deploy ke VPS** (setelah semua step selesai + tested):
   ```bash
   git push origin main
   ssh root@202.10.34.157 "cd /var/www/sintak && git pull && pm2 restart sintak-prod"
   ```

---

## 📝 Notes

- **Estimasi total effort:** 3-4 jam (termasuk testing)
- **Ponytail mode:** Prioritas minimum LOC, reuse existing pattern, no premature abstraction
- **Jangan touch:** Database, .env, git operations (tunggu approval manual)
- **Activity log manual:** Tidak perlu (ini refactor UI, bukan data mutation)

---

**Ready untuk CLI session.** Load file ini saat mulai refactor dengan:
```
hermes chat
> Baca docs/REFACTOR_JURNAL_TODO.md dan mulai refactor step-by-step
```
