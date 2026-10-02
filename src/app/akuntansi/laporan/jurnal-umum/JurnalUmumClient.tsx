'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { Loader2, AlertCircle, Download } from 'lucide-react';
import { exportRowsToExcel } from '@/lib/export-excel';
import { toast } from '@/lib/toast';
import CopyButton from '@/components/ui/CopyButton';

import ConfirmDialog from '@/components/ConfirmDialog';
import { formatLastUpdate, splitDateRangeIntoMonths } from '@/lib/date-utils';
import { getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod, hydrateDailyDateStore, persistDailyDateStore, persistScraperPeriodFull } from '@/lib/scraper-period';
import { DataTable } from '@/components/ui/DataTable';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';
import DateRangeCard from '@/components/DateRangeCard';
import DatePicker from '@/components/DatePicker';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import ScrapingHeader from '@/components/ScrapingHeader';

function formatDateToYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatIndoDateStr(tglStr: string) {
  if (!tglStr) return '';
  const parts = tglStr.split('-');
  if (parts.length === 3) {
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return tglStr;
}

function formatRupiah(val: string | number) {
  const n = parseFloat(String(val || '0').replace(/,/g, ''));
  if (isNaN(n)) return '–';
  return n.toLocaleString('id-ID', { minimumFractionDigits: 2 });
}
// Kepala rekening laba rugi: 4, 5, 6, 7, 8, 9
function isLabaRugiRekening(rekening: string): boolean {
  const kode = rekening?.trim();
  if (!kode) return false;
  // First char of the account code
  return /^[456789]/.test(kode);
}

// Flatten parent rows + children into flat list for DataTable.
// Excel formula: laba_rugi[n] = IF(ISNUMBER(laba_rugi[n-1]), laba_rugi[n-1], 0) + debitLR[n] - kreditLR[n]
// Parent rows: debitLR=0, kreditLR=0  → laba_rugi stays the same as previous row.
// Child rows rekening 4-9: debitLR = child.kredit, kreditLR = child.debit → updates running total.
// Child rows lainnya: debitLR=0, kreditLR=0 → laba_rugi stays the same.
// Running total dihitung ulang mengikuti URUTAN TAMPIL (sort server-side):
// sort kolom lain → server kirim urutan baru + prevLabaRugi/prevArusKas baru,
// flatten jalan ulang dari titik nol itu. Bukan nilai mati per halaman.
interface JurnalParentRow {
  id?: string | number;
  faktur?: string;
  tgl?: string;
  rekening?: string;
  keterangan?: string;
  debit?: number | string | null;
  kredit?: number | string | null;
  username?: string;
  create_at?: string;
  is_kas?: boolean;
  children?: JurnalParentRow[];
}
interface JurnalFlatRow {
  id: string | number;
  _isChild: boolean;
  _isSaldoAwal?: boolean;
  _parentFaktur?: string;
  tgl?: string;
  faktur?: string;
  rekening?: string;
  keterangan?: string;
  debit?: number;
  kredit?: number;
  username?: string;
  create_at?: string;
  is_kas?: boolean;
  _debitLR?: number | null;
  _kreditLR?: number | null;
  _labaRugi?: number;
  _arusKas?: number;
  _rowBg?: string;
}
type JurnalCellCtx = { getValue: () => unknown; row: { original: JurnalFlatRow; getIsSelected: () => boolean } };
function flattenJurnal(rows: JurnalParentRow[], prevLabaRugi = 0, prevArusKas = 0): { flat: JurnalFlatRow[]; lastLabaRugi: number; lastArusKas: number } {
  const flat: JurnalFlatRow[] = [];
  let runningLR = prevLabaRugi;
  let runningAK = prevArusKas;


  for (const row of rows) {
    const children: JurnalParentRow[] = row.children || [];

    // Parent row: debitLR & kreditLR = 0, so laba_rugi = prev (no change)
    const { children: _ignored, ...parentFields } = row;
    flat.push({
      ...parentFields,
      id: row.id ?? `p_${row.faktur ?? ''}`,
      debit: Number(row.debit ?? 0) || 0,
      kredit: Number(row.kredit ?? 0) || 0,
      _isChild: false,
      _debitLR: null,   // shown as — in column
      _kreditLR: null,   // shown as — in column
      _labaRugi: runningLR,  // prev + 0 - 0
      _arusKas: runningAK,
    });

    // Child rows
    children.forEach((child, ci) => {
      const isLR = isLabaRugiRekening(child.rekening ?? '');
      let rowDebitLR  = 0;
      let rowKreditLR = 0;
      if (isLR) {
        // Debit LR = kredit of this child; Kredit LR = debit of this child
        rowDebitLR  = parseFloat(String(child.kredit || '0').replace(/,/g, '')) || 0;
        rowKreditLR = parseFloat(String(child.debit  || '0').replace(/,/g, '')) || 0;
      }
      // Apply formula: prev + debitLR - kreditLR
      runningLR = runningLR + rowDebitLR - rowKreditLR;

      // Arus Kas formula: Kas account increases with Debit, decreases with Kredit
      if (child.is_kas) {
        const debit = parseFloat(String(child.debit || '0').replace(/,/g, '')) || 0;
        const kredit = parseFloat(String(child.kredit || '0').replace(/,/g, '')) || 0;
        runningAK = runningAK + debit - kredit;
      }

      // _rowBg: green if this row contributes to Debit LR (kredit > 0), red if Kredit LR (debit > 0)
      let rowBg = '';
      if (isLR) {
        if (rowDebitLR > 0 && rowKreditLR === 0) rowBg = 'bg-emerald-50/60';   // pure debit LR → green
        else if (rowKreditLR > 0 && rowDebitLR === 0) rowBg = 'bg-rose-50/60'; // pure kredit LR → red
        else rowBg = 'bg-amber-50/40'; // both (rare, mixed)
      }

      flat.push({
        ...child,
        id: `c_${row.id ?? row.faktur}_${ci}_${child.rekening ?? ''}`, // more unique ID
        debit: Number(child.debit ?? 0) || 0,
        kredit: Number(child.kredit ?? 0) || 0,
        _isChild: true,
        _parentFaktur: row.faktur,
        tgl: row.tgl,          // inherit from parent
        faktur: '',
        username: row.username,     // inherit from parent
        create_at: row.create_at,   // inherit from parent
        _debitLR: isLR ? rowDebitLR : null,
        _kreditLR: isLR ? rowKreditLR : null,
        _labaRugi: runningLR,
        _arusKas: runningAK,
        _rowBg: rowBg,
      });
    });
  }

  return { flat, lastLabaRugi: runningLR, lastArusKas: runningAK };
}

const PAGE_SIZE = 50;

export default function JurnalUmumClient() {
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<JurnalFlatRow[] | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{ start: string; end: string } | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  // Filter create_at (server-side, default kosong)
  const [createAtFrom, setCreateAtFrom] = useState<Date | null>(null);
  const [createAtTo, setCreateAtTo]     = useState<Date | null>(null);
  // Filter rekening (kode, cth "1101") — dropdown dari rek_akuntansi
  const [rekFilter, setRekFilter] = useState('');
  const [rekOptions, setRekOptions] = useState<{ kode: string; keterangan: string }[]>([]);
  // Sort global server-side (lintas halaman). Default [] = urutan kronologis create_at.
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isExporting, setIsExporting] = useState(false);

  const mountedRef = useRef(true);

  const { selectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jurnalUmum_columnWidths');
      return saved ? JSON.parse(saved) : {
        tgl: 130, faktur: 200, rekening: 220, keterangan: 300,
        debit: 155, kredit: 155, username: 110,
        create_at: 150, _debitLR: 155, _kreditLR: 155, _labaRugi: 160, _arusKas: 160
      };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('jurnalUmum_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setIsMounted(true);
    const hydrated = hydrateScraperPeriod({ stateKey: 'jurnalUmumState', periodKey: 'JurnalUmumClient_scrapedPeriod' });
    setScrapedPeriod(hydrated.scrapedPeriod);
    setStartDate(hydrated.startDate);
    setEndDate(hydrated.endDate);

    // Filter Tanggal Dibuat: default kosong. Nilai tersimpan hanya dipakai bila
    // dibuat hari ini (daily store); besok otomatis kosong lagi.
    const hydratedFilter = hydrateDailyDateStore('jurnalUmum_createAt_dates', () => ({
      startDate: null,
      endDate: null,
    }));
    setCreateAtFrom(hydratedFilter.startDate);
    setCreateAtTo(hydratedFilter.endDate);

    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Persist Filter Tanggal Dibuat changes (same-day reload preserved, resets on new day)
  useEffect(() => {
    if (!isMounted) return;
    persistDailyDateStore(
      'jurnalUmum_createAt_dates',
      createAtFrom,
      createAtTo,
      !createAtFrom && !createAtTo
    );
  }, [createAtFrom, createAtTo, isMounted]);

  // Opsi dropdown rekening dari master (sekali per mount, limit besar)
  useEffect(() => {
    if (!isMounted) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/rek-akuntansi?page=1&limit=1000');
        if (!res.ok) return;
        const json: unknown = await res.json();
        if (active && json && typeof json === 'object' && 'data' in json && Array.isArray(json.data)) {
          const opts: { kode: string; keterangan: string }[] = [];
          for (const r of json.data) {
            if (r && typeof r === 'object' && 'kode' in r) {
              const kode: unknown = r.kode;
              const ket: unknown = 'keterangan' in r ? r.keterangan : '';
              if (typeof kode === 'string' || typeof kode === 'number') {
                opts.push({ kode: String(kode), keterangan: typeof ket === 'string' ? ket : String(ket ?? '') });
              }
            }
          }
          setRekOptions(opts.filter((o) => o.kode));
        }
      } catch { /* dropdown opsional — filter tetap bisa diketik manual */ }
    })();
    return () => { active = false; };
  }, [isMounted]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!active || !mountedRef.current || !isMounted) return;
      setLoading(true);
      const startTimer = performance.now();
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(), limit: PAGE_SIZE.toString(), q: debouncedQuery,
          from: formatDateToYYYYMMDD(startDate), to: formatDateToYYYYMMDD(endDate),
          ...(createAtFrom ? { cat_from: formatDateToYYYYMMDD(createAtFrom) } : {}),
          ...(createAtTo   ? { cat_to:   formatDateToYYYYMMDD(createAtTo) } : {}),
          ...(rekFilter ? { rek: rekFilter } : {}),
          // Sort global server-side: backend hanya kenal kolom parent.
          // Kolom turunan (_labaRugi dkk) tidak dikirim — running total dihitung
          // ulang mengikuti urutan tampil, bukan nilai mati per halaman.
          ...(sorting.length ? { sort: JSON.stringify(sorting.filter((s) => !s.id.startsWith('_') && s.id !== 'ketepatan_waktu')) } : {}),
          _t: Date.now().toString()
        });
        const res = await fetch(`/api/jurnal-umum?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Gagal memuat data');
        const json = await res.json();
        if (active) {
          const saldoAwal: number = json.saldoAwal ?? 0;
          const saldoAwalKas: number = json.saldoAwalKas ?? 0;
          const hasCatFilter = !!(createAtFrom && createAtTo);

          // Use prevLabaRugi/prevArusKas from server as starting point so
          // the running total continues correctly across pages.
          const startLR = json.prevLabaRugi ?? (hasCatFilter ? saldoAwal : 0);
          const startAK = json.prevArusKas  ?? (hasCatFilter ? saldoAwalKas : 0);

          const { flat: incoming } = flattenJurnal(json.data || [], startLR, startAK);

          let finalData = incoming;
          if (hasCatFilter && page === 1) {
            const saldoRow = {
              id: '__saldo_awal__',
              _isSaldoAwal: true,
              _isChild: false,
              faktur: '',
              tgl: '',
              rekening: '',
              keterangan: 'Saldo Awal',
              debit: 0, kredit: 0,
              username: '', create_at: '',
              _debitLR: null, _kreditLR: null,
              _labaRugi: saldoAwal,
              _arusKas: saldoAwalKas,
              _rowBg: '',
            };
            finalData = [saldoRow, ...incoming];
          }

          setData(finalData);
          setTotalCount(json.total || 0);
          setTotalPages(json.totalPages || 0);
          if (json.scrapedPeriod) setScrapedPeriod(json.scrapedPeriod);
          if (json.lastUpdated) setLastUpdated(formatLastUpdate(new Date(json.lastUpdated)));
          setLoadTime(Math.round(performance.now() - startTimer));
        }
      } catch (err: unknown) {
        if (active) { setError(err instanceof Error ? err.message : 'Gagal memuat data'); setData([]); }
      } finally {
        if (active) { setLoading(false); }
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate, createAtFrom, createAtTo, rekFilter, sorting, isMounted]);

  const handleSortingChange = useCallback((updater: SortingState | ((old: SortingState) => SortingState)) => {
    setSorting((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    setPage(1);
  }, []);

  const buildExportParams = useCallback((pageNum: number, limit: number) => new URLSearchParams({
    page: String(pageNum), limit: String(limit), q: debouncedQuery,
    from: formatDateToYYYYMMDD(startDate), to: formatDateToYYYYMMDD(endDate),
    ...(createAtFrom ? { cat_from: formatDateToYYYYMMDD(createAtFrom) } : {}),
    ...(createAtTo ? { cat_to: formatDateToYYYYMMDD(createAtTo) } : {}),
    ...(rekFilter ? { rek: rekFilter } : {}),
    ...(sorting.length ? { sort: JSON.stringify(sorting.filter((s) => !s.id.startsWith('_') && s.id !== 'ketepatan_waktu')) } : {}),
    _t: Date.now().toString(),
  }), [debouncedQuery, startDate, endDate, createAtFrom, createAtTo, rekFilter, sorting]);

  // Export Excel: fetch SEMUA halaman hasil filter bertahap (bukan halaman aktif
  // saja), flatten parent+child seperti tabel, running total dibawa antar halaman
  // agar kolom Laba/Rugi & Arus Kas konsisten dengan urutan tampil.
  const handleExportExcel = useCallback(async () => {
    if (!totalCount) { toast.error('Tidak ada data untuk diekspor'); return; }
    setIsExporting(true);
    try {
      // ponytail: 500 parent/req — satu fetch raksasa rawan timeout & OOM
      const EXPORT_PAGE_SIZE = 500;
      const hasCatFilter = !!(createAtFrom && createAtTo);
      const allFlat: JurnalFlatRow[] = [];
      let saldoAwal = 0;
      let saldoAwalKas = 0;
      let runningLR = 0;
      let runningAK = 0;
      let pageNum = 1;
      let totalPages = 1;
      do {
        const res = await fetch(`/api/jurnal-umum?${buildExportParams(pageNum, EXPORT_PAGE_SIZE).toString()}`);
        if (!res.ok) throw new Error('Gagal memuat data export');
        const json = await res.json();
        if (pageNum === 1) {
          saldoAwal = json.saldoAwal ?? 0;
          saldoAwalKas = json.saldoAwalKas ?? 0;
          totalPages = json.totalPages ?? 1;
          if (hasCatFilter) { runningLR = saldoAwal; runningAK = saldoAwalKas; }
        }
        // Server mengirim prevLabaRugi/prevArusKas per halaman — pakai itu agar
        // kumulatif tetap benar walau urutan sort berubah.
        const startLR = json.prevLabaRugi ?? runningLR;
        const startAK = json.prevArusKas ?? runningAK;
        const { flat, lastLabaRugi, lastArusKas } = flattenJurnal(json.data || [], startLR, startAK);
        allFlat.push(...flat);
        runningLR = lastLabaRugi;
        runningAK = lastArusKas;
        pageNum++;
      } while (pageNum <= totalPages);
      const toExport = hasCatFilter
        ? [{ Tanggal: '', 'No. Faktur': '', Rekening: 'Saldo Awal', Keterangan: 'Saldo Awal', Debit: '', Kredit: '', User: '', Dibuat: '', 'Debit (Laba Rugi)': '', 'Kredit (Laba Rugi)': '', 'Laba / Rugi': saldoAwal, 'Arus Kas': saldoAwalKas },
           ...allFlat.map((r) => ({
             Tanggal: formatIndoDateStr(r.tgl || ''),
             'No. Faktur': r._isChild ? (r._parentFaktur || '') : (r.faktur || ''),
             Rekening: r.rekening || '',
             Keterangan: r.keterangan || '',
             Debit: Number(r.debit || 0) || '',
             Kredit: Number(r.kredit || 0) || '',
             User: r.username || '',
             Dibuat: r.create_at || '',
             'Debit (Laba Rugi)': r._debitLR ?? '',
             'Kredit (Laba Rugi)': r._kreditLR ?? '',
             'Laba / Rugi': r._labaRugi ?? '',
             'Arus Kas': r._arusKas ?? '',
           }))]
        : allFlat.map((r) => ({
            Tanggal: formatIndoDateStr(r.tgl || ''),
            'No. Faktur': r._isChild ? (r._parentFaktur || '') : (r.faktur || ''),
            Rekening: r.rekening || '',
            Keterangan: r.keterangan || '',
            Debit: Number(r.debit || 0) || '',
            Kredit: Number(r.kredit || 0) || '',
            User: r.username || '',
            Dibuat: r.create_at || '',
            'Debit (Laba Rugi)': r._debitLR ?? '',
            'Kredit (Laba Rugi)': r._kreditLR ?? '',
            'Laba / Rugi': r._labaRugi ?? '',
            'Arus Kas': r._arusKas ?? '',
          }));
      const fname = `jurnal-umum_${formatDateToYYYYMMDD(startDate)}_sd_${formatDateToYYYYMMDD(endDate)}.xlsx`;
      const ok = await exportRowsToExcel(toExport, fname);
      if (!ok) toast.error('Tidak ada data untuk diekspor');
      else toast.success(`${toExport.length} baris berhasil diekspor`);
    } catch {
      toast.error('Gagal export Excel');
    } finally {
      setIsExporting(false);
    }
  }, [totalCount, buildExportParams, createAtFrom, createAtTo, startDate, endDate]);

  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');
  const [dialog, setDialog] = useState({ isOpen: false, type: 'success' as 'success' | 'error', title: '', message: '' });

  const handleFetch = async () => {
    if (!startDate || !endDate) return;
    localStorage.setItem('jurnalUmumState', JSON.stringify({
      startDate: startDate.toISOString(), endDate: endDate.toISOString(), sessionDate: new Date().toLocaleDateString('en-CA')
    }));
    setError(''); setData([]); setPage(1); setIsBatching(true); setLoading(true); setSearchQuery(''); setBatchProgress(0);
    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    let successCount = 0; let totalScraped = 0; let completedChunks = 0;

    const processChunk = async (chunk: { start: string; end: string }) => {
      try {
        const res = await fetch(`/api/scrape-jurnal-umum?start=${chunk.start}&end=${chunk.end}&metaStart=${startStr}&metaEnd=${endStr}&silent=true`);
        if (res.ok) {
          successCount++;
          const json = await res.json();
          totalScraped += (json.total || 0);
        } else {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Error ${res.status}`);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Gagal menarik data');
      } finally {
        completedChunks++;
        setBatchProgress(Math.round((completedChunks / chunks.length) * 100));
        setBatchStatus(`Memproses ${completedChunks}/${chunks.length} bulan...`);
      }
    };

    try {
      const concurrency = 2;
      const queue = [...chunks];
      const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
        while (queue.length > 0) { const chunk = queue.shift(); if (chunk) await processChunk(chunk); }
      });
      await Promise.all(workers);
      if (successCount > 0) {
        persistScraperPeriod({ stateKey: 'jurnalUmumState', periodKey: 'JurnalUmumClient_scrapedPeriod' }, startDate, endDate);
        persistScraperPeriodFull('last_scrape_jurnal_umum_period', startDate, endDate);
        setRefreshKey(prev => prev + 1);
        fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action_type: 'SCRAPE', table_name: 'jurnal_umum', message: `Scrape jurnal umum berhasil: ${totalScraped} baris (${startStr} - ${endStr}).`, raw_data: JSON.stringify({ total: totalScraped, start: startStr, end: endStr }) }),
        }).catch(() => {});
        setDialog({ isOpen: true, type: 'success', title: 'Berhasil', message: `Berhasil menarik ${totalScraped} transaksi Jurnal Umum.` });
      }
    } finally { setIsBatching(false); setLoading(false); }
  };

  const [totalPages, setTotalPages] = useState(0);

  const columns = useMemo<ColumnDef<JurnalFlatRow, unknown>[]>(() => [
    {
      accessorKey: 'tgl',
      header: 'Tanggal',
      size: 130,
      meta: { sticky: true },
      cell: ({ getValue, row }: JurnalCellCtx) => {
        const isChild = row.original._isChild;
        const val = formatIndoDateStr(String(getValue() ?? ''));
        if (isChild) return <span className="text-gray-400 tabular-nums">{val}</span>;
        return (
          <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-blue-700' : 'text-gray-700'}`}>
            {val}
          </span>
        );
      }
    },
    {
      accessorKey: 'faktur',
      header: 'No. Faktur',
      size: 200,
      meta: { sticky: true },
      cell: ({ getValue, row }: JurnalCellCtx) => {
        const isChild = row.original._isChild;
        if (isChild) return <span className="text-gray-400">{row.original._parentFaktur}</span>;
        return (
          <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-blue-600' : 'text-gray-700'}`}>
            {String(getValue() ?? '')}
          </span>
        );
      }
    },
    {
      accessorKey: 'rekening',
      header: 'Rekening',
      size: 220,
      meta: { sticky: true },
      cell: ({ getValue, row }: JurnalCellCtx) => {
        const isChild = row.original._isChild;
        const raw = String(getValue() ?? '');
        let display = raw || '–';
        
        // Format YYYY-MM-DD to DD MMM YYYY
        if (raw.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [y, m, d] = raw.split('-');
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          display = `${d} ${months[parseInt(m)-1]} ${y}`;
        }

        return (
          <span className={`font-medium ${
            isChild
              ? (row.getIsSelected() ? 'text-indigo-500' : 'text-indigo-600 font-semibold')
              : (row.getIsSelected() ? 'text-blue-700' : 'text-gray-700')
          }`}>
            {isChild && <span className="mr-1.5 text-indigo-300">↳</span>}
            {display}
          </span>
        );
      }
    },
    {
      accessorKey: 'keterangan',
      header: 'Keterangan',
      size: 300,
      meta: { sticky: true },
      cell: ({ getValue, row }: JurnalCellCtx) => {
        const isChild = row.original._isChild;
        const isSaldoAwal = row.original._isSaldoAwal;
        if (isSaldoAwal) return (
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-[11px] font-bold tracking-wide border border-amber-200">
              Saldo Awal
            </span>
          </span>
        );
        return (
          <span className={`truncate block ${
            isChild
              ? (row.getIsSelected() ? 'text-gray-500' : 'text-gray-400')
              : (row.getIsSelected() ? 'text-blue-800 font-medium' : 'text-gray-700 font-medium')
          }`}>
            {String(getValue() ?? '–')}
          </span>
        );
      }
    },
    {
      accessorKey: 'debit',
      header: 'Debit (Rp)',
      size: 160,
      meta: { align: 'right' },
      cell: ({ getValue, row }: JurnalCellCtx) => {
        const isChild = row.original._isChild;
        const val = Number(getValue() ?? 0);
        if (isChild && val === 0) return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        return (
          <div className={`flex items-center justify-between tabular-nums w-full ${
            isChild
              ? (row.getIsSelected() ? 'text-emerald-600 font-semibold' : 'text-emerald-600 font-semibold')
              : (row.getIsSelected() ? 'text-emerald-700 font-bold' : 'text-emerald-700 font-bold')
          }`}>
            <span className="opacity-40 mr-1">Rp</span>
            <span>{formatRupiah(val)}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'kredit',
      header: 'Kredit (Rp)',
      size: 160,
      meta: { align: 'right' },
      cell: ({ getValue, row }: JurnalCellCtx) => {
        const isChild = row.original._isChild;
        const val = Number(getValue() ?? 0);
        if (isChild && val === 0) return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        return (
          <div className={`flex items-center justify-between tabular-nums w-full ${
            isChild
              ? (row.getIsSelected() ? 'text-rose-500 font-semibold' : 'text-rose-500 font-semibold')
              : (row.getIsSelected() ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold')
          }`}>
            <span className="opacity-40 mr-1">Rp</span>
            <span>{formatRupiah(val)}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'username',
      header: 'User',
      size: 120,
      cell: ({ getValue, row }: JurnalCellCtx) => {
        const isChild = row.original._isChild;
        const val = String(getValue() ?? '');
        if (!val || val === 'undefined') return <span className="text-gray-200">—</span>;
        if (isChild) return <span className="text-gray-400 font-medium">{val}</span>;
        return <span className="font-bold text-gray-400">{val}</span>;
      }
    },
    {
      accessorKey: 'create_at',
      header: 'Dibuat',
      size: 150,
      cell: ({ getValue, row }: JurnalCellCtx) => {
        const isChild = row.original._isChild;
        const val = String(getValue() ?? '');
        if (!val) return <span className="text-gray-200">—</span>;
        return (
          <span className="group flex items-center gap-1.5">
            <span className={`tabular-nums ${isChild ? 'text-gray-400' : 'text-gray-500'}`}>{val}</span>
            <CopyButton text={val} size={11} />
          </span>
        );
      }
    },
    {
      id: 'ketepatan_waktu',
      header: 'Ketepatan Waktu',
      size: 160,
      enableSorting: false,
      meta: { headerBg: '#f5f3ff' }, // Violet 50 to indicate system-calculated column
      cell: ({ row }: { row: { original: JurnalFlatRow } }) => {
        const tgl = row.original.tgl;
        const createAt = row.original.create_at;

        try {
          if (!tgl || !createAt) return <span className="text-gray-200">—</span>;
          const d1 = new Date(tgl); // YYYY-MM-DD
          const d2 = new Date(createAt.substring(0, 10)); // YYYY-MM-DD

          if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return <span className="text-gray-200">—</span>;

          const diffTime = d2.getTime() - d1.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 0) {
            return (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-600 border border-purple-100 flex items-center gap-1 w-fit shadow-sm">
                <span className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
                Telat {diffDays} Hari
              </span>
            );
          }
          if (diffDays < 0) {
            return (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1 w-fit shadow-sm">
                Mendahului {Math.abs(diffDays)} Hari
              </span>
            );
          }
          return (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-600 border border-violet-100 flex items-center gap-1 w-fit shadow-sm">
              Tepat Waktu
            </span>
          );
        } catch {
          return <span className="text-gray-200">—</span>;
        }
      }
    },
    {
      accessorKey: '_debitLR',
      header: 'Debit (Laba Rugi)',
      size: 155,
      enableSorting: false,
      meta: { align: 'right', headerBg: '#f0fdf4' },
      cell: ({ getValue, row }: JurnalCellCtx) => {
        const isChild = row.original._isChild;
        // Parent rows: no value here, only child rekening 4-9 rows show this
        if (!isChild) return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        const val = getValue();
        if (val === null || val === undefined) {
          // Non-LR child
          return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        }
        const n = Number(val);
        if (n === 0) return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        return (
          <div className={`flex items-center justify-between tabular-nums w-full font-semibold ${
            row.getIsSelected() ? 'text-emerald-600' : 'text-emerald-600'
          }`}>
            <span className="opacity-40 mr-1">Rp</span>
            <span>{formatRupiah(n)}</span>
          </div>
        );
      }
    },
    {
      accessorKey: '_kreditLR',
      header: 'Kredit (Laba Rugi)',
      size: 155,
      enableSorting: false,
      meta: { align: 'right', headerBg: '#fff1f2' },
      cell: ({ getValue, row }: JurnalCellCtx) => {
        const isChild = row.original._isChild;
        // Parent rows: no value here
        if (!isChild) return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        const val = getValue();
        if (val === null || val === undefined) {
          return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        }
        const n = Number(val);
        if (n === 0) return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        return (
          <div className={`flex items-center justify-between tabular-nums w-full font-semibold ${
            row.getIsSelected() ? 'text-rose-500' : 'text-rose-500'
          }`}>
            <span className="opacity-40 mr-1">Rp</span>
            <span>{formatRupiah(n)}</span>
          </div>
        );
      }
    },
    {
      accessorKey: '_labaRugi',
      header: 'Laba / Rugi',
      size: 160,
      enableSorting: false,
      meta: { align: 'right', headerBg: '#fffbeb' },
      cell: ({ getValue, row }: JurnalCellCtx) => {
        const val = Number(getValue() ?? 0);
        const isChild = row.original._isChild;
        const isPositive = val >= 0;
        return (
          <div className={`flex items-center justify-between tabular-nums w-full ${
            row.getIsSelected()
              ? 'text-emerald-700 font-bold'
              : isChild
                ? (isPositive ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold')
                : (isPositive ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold')
          }`}>
            <span className="opacity-40 mr-1">Rp</span>
            <span>{formatRupiah(Math.abs(val))}<span className="ml-0.5 opacity-60">{isPositive ? '(L)' : '(R)'}</span></span>
          </div>
        );
      }
    },
    {
      accessorKey: '_arusKas',
      header: 'Arus Kas',
      size: 160,
      enableSorting: false,
      meta: { align: 'right', headerBg: '#f5f3ff' },
      cell: ({ getValue, row }: JurnalCellCtx) => {
        const val = Number(getValue() ?? 0);
        const isChild = row.original._isChild;
        const isPositive = val >= 0;
        return (
          <div className={`flex items-center justify-between tabular-nums w-full ${
            row.getIsSelected()
              ? 'text-violet-700 font-bold'
              : isChild
                ? (isPositive ? 'text-violet-600 font-semibold' : 'text-rose-500 font-semibold')
                : (isPositive ? 'text-violet-700 font-bold' : 'text-rose-600 font-bold')
          }`}>
            <span className="opacity-40 mr-1">Rp</span>
            <span>{formatRupiah(Math.abs(val))}</span>
          </div>
        );
      }
    },
  ], []);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 animate-in fade-in duration-500 overflow-hidden">
      {/* Top row: scrape date range + filter tanggal dibuat */}
      <div className="flex flex-col lg:flex-row items-stretch gap-3 shrink-0 relative z-[60]">
        <div className="flex-1 relative z-[62]">
          <DateRangeCard
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(d) => { setStartDate(d); setPage(1); }}
            onEndDateChange={(d) => { setEndDate(d); setPage(1); }}
            onFetch={handleFetch}
            isFetching={loading || isBatching}
            progress={isBatching ? batchProgress : undefined}
            statusText={isBatching ? batchStatus : undefined}
            fetchText="Tarik Data"
          />
        </div>

        {/* Filter Tanggal Dibuat + Rekening */}
        <div className="flex-1 bg-white/80 backdrop-blur-md border border-white/20 rounded-xl shadow-sm p-3 flex flex-col gap-3 shrink-0 relative z-[60]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <span className="text-[11px] font-bold text-gray-400 shrink-0 hidden sm:block">Filter Dibuat:</span>
            <div className="flex items-center gap-2 flex-1">
              <DatePicker
                name="createAtFrom"
                value={createAtFrom}
                onChange={(d) => { setCreateAtFrom(d); setPage(1); }}
              />
              <div className="w-2 h-px bg-gray-300 shrink-0"></div>
              <DatePicker
                name="createAtTo"
                value={createAtTo}
                onChange={(d) => { setCreateAtTo(d); setPage(1); }}
              />
            </div>

            {(createAtFrom || createAtTo) && (
              <>
                <div className="hidden sm:block w-px h-8 bg-gray-200/60"></div>
                <button
                  onClick={() => {
                    setCreateAtFrom(null);
                    setCreateAtTo(null);
                    setPage(1);
                    persistDailyDateStore('jurnalUmum_createAt_dates', null, null, true);
                  }}
                  className="flex items-center justify-center gap-2 px-5 h-10 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-xl transition-colors shadow-sm shrink-0"
                >
                  <span>&times;</span>
                  <span>Reset</span>
                </button>
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-gray-100 pt-3">
            <span className="text-[11px] font-bold text-gray-400 shrink-0 hidden sm:block">Rekening:</span>
            <input
              list="jurnal-rek-options"
              value={rekFilter}
              onChange={(e) => { setRekFilter(e.target.value.trim()); setPage(1); }}
              placeholder="Ketik kode, cth 1101…"
              className="flex-1 h-10 px-3 bg-white border border-gray-200 rounded-xl text-[12px] font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
            />
            <datalist id="jurnal-rek-options">
              {rekOptions.map((r) => (
                <option key={r.kode} value={r.kode}>{r.kode} — {r.keterangan}</option>
              ))}
            </datalist>
            {rekFilter && (
              <button
                onClick={() => { setRekFilter(''); setPage(1); }}
                className="flex items-center justify-center gap-2 px-5 h-10 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-xl transition-colors shadow-sm shrink-0"
              >
                <span>&times;</span>
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm shadow-red-900/5 text-sm font-bold flex items-start gap-3 animate-in fade-in shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <ScrapingHeader title="Hasil Scrapping Jurnal Umum" lastUpdated={lastUpdated} scrapedPeriod={scrapedPeriod} />
            {loading && data && data.length > 0 && (
              <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm animate-pulse leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses Data...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchAndReload
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onReload={() => setRefreshKey(prev => prev + 1)}
                loading={loading}
                placeholder="Cari faktur, rekening, atau keterangan..."
              />
            </div>
            <button
              onClick={handleExportExcel}
              disabled={isExporting || !totalCount}
              className="flex items-center gap-2 px-4 h-10 rounded-xl border border-emerald-200 bg-emerald-50 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Export Excel
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden relative">
          <DataTable
            columns={columns}
            data={data || []}
            isLoading={loading}
            selectedIds={selectedIds}
            onRowClick={handleRowClick}
            columnWidths={columnWidths}
            onColumnWidthChange={setColumnWidths}
            rowHeight="h-11"
            sorting={sorting}
            onSortingChange={handleSortingChange}
            manualSorting
            getRowClassName={(row: JurnalFlatRow) => {
              if (row._isSaldoAwal) return 'bg-amber-50 border-b-2 border-amber-200 amber';
              if (row.is_kas) return 'bg-violet-50 hover:bg-violet-100/60 violet text-violet-900';
              return row._rowBg || '';
            }}
          />
          <TableFooter
            totalCount={totalCount}
            currentCount={data?.length || 0}
            label="Jurnal Umum"
            selectedCount={selectedIds.size}
            onClearSelection={clearSelection}
            loadTime={loadTime}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog({ ...dialog, isOpen: false })}
      />
    </div>
  );
}
