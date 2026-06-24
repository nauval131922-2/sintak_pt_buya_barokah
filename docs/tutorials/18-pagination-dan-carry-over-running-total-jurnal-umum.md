# Tutorial 18: Pagination dan Carry-over Running Total Jurnal Umum

Tutorial ini menjelaskan transisi dari *infinite scroll* ke *server-side pagination* dan bagaimana menjaga akurasi akumulasi Laba/Rugi serta Arus Kas antar halaman.

## 1. Problem Statement
- **Infinite Scroll UX**: Beban memori browser meningkat seiring banyaknya data yang di-*load*, dan sulit melakukan navigasi ke halaman spesifik.
- **Running Total Reset**: Saat data di-*replace* per halaman (pagination standar), kalkulasi Laba/Rugi dan Arus Kas kembali ke nol di setiap awal halaman karena kehilangan referensi data halaman sebelumnya.

## 2. Solusi Teknis

### A. Migrasi ke Server-Side Pagination
Mengganti logika *append* data dengan *replace* data menggunakan komponen `TableFooter` standar yang konsisten dengan modul lain.

### B. Kalkulasi Akumulasi Sebelumnya (Server-Side)
Untuk menjaga kontinuitas running total, API sekarang menghitung saldo akumulasi dari seluruh baris transaksi *sebelum* offset halaman saat ini.

**Query di `src/app/api/jurnal-umum/route.ts`:**
```sql
-- Mengambil saldo LR dan Kas dari transaksi SEBELUM halaman ini
SELECT 
  SUM(CASE WHEN kepala_rekening BETWEEN 4 AND 9 THEN kredit - debit ELSE 0 END) as lr,
  SUM(CASE WHEN is_kas THEN debit - kredit ELSE 0 END) as ak
FROM jurnal_umum
WHERE is_child = 1
  AND parent_faktur IN (
    SELECT faktur FROM jurnal_umum 
    WHERE is_child = 0 
    ORDER BY create_at ASC, faktur ASC, id ASC 
    LIMIT ? -- offset halaman
  )
```

### C. Sinkronisasi Frontend
Frontend menerima `prevLabaRugi` dan `prevArusKas` dari API dan menggunakannya sebagai *starting point* untuk fungsi `flattenJurnal`.

```typescript
const startLR = json.prevLabaRugi ?? (hasCatFilter ? saldoAwal : 0);
const startAK = json.prevArusKas  ?? (hasCatFilter ? saldoAwalKas : 0);

const { flat: incoming } = flattenJurnal(json.data || [], startLR, startAK);
```

## 3. Hasil Akhir
- **Konsistensi UI**: Navigasi halaman menggunakan style standar aplikasi (TableFooter).
- **Akurasi Finansial**: Kolom Laba/Rugi dan Arus Kas menunjukkan saldo akumulasi yang benar dan berlanjut meskipun pengguna berpindah halaman atau menggunakan filter.
- **Performa**: Memori browser lebih efisien karena hanya merender 50 baris per halaman.
