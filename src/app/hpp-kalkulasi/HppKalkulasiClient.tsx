'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Loader2, Calculator, Copy, Check } from 'lucide-react';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/DataTable';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import DateRangeCard from '@/components/DateRangeCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import ScrapingHeader from '@/components/ScrapingHeader';
import CopyButton from '@/components/ui/CopyButton';
import { splitDateRangeIntoMonths, formatLastUpdate } from '@/lib/date-utils';
import { getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod } from '@/lib/scraper-period';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateToYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const formatIDR = (val: string): string => {
  if (!val) return '';
  let work = val;
  if (work.endsWith('.')) work = work.slice(0, -1) + ',';
  work = work.replace(/\./g, '').replace(/,/g, '.');
  const isNeg = work.startsWith('-');
  if (isNeg) work = work.slice(1);
  const parts = work.split('.');
  const intRaw = parts[0].replace(/\D/g, '');
  const decRaw = parts.length > 1 ? parts[parts.length - 1].replace(/\D/g, '') : null;
  if (!intRaw && decRaw === null) return isNeg ? '-' : '';
  const intFmt = intRaw ? Number(intRaw).toLocaleString('id-ID') : '0';
  return (isNeg ? '-' : '') + intFmt + (decRaw !== null ? ',' + decRaw : '');
};

// ─── Inline editable cell ─────────────────────────────────────────────────────

interface HppRecord {
  id: number;
  nama_order: string;
  hpp_kalkulasi: number;
  keterangan: string | null;
  _fromOrders?: boolean;
}

function EditableCell({
  row,
  field,
  onSave,
  placeholder = 'klik 2x untuk isi',
  isSelected = false,
}: {
  row: HppRecord;
  field: 'hpp_kalkulasi' | 'keterangan';
  onSave: (id: number, nama_order: string, value: string, field: string) => Promise<{ success: boolean; newId?: number }>;
  placeholder?: string;
  isSelected?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [localVal, setLocalVal] = useState<any>(row[field]);
  const isSavingGuard = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLocalVal(row[field]); }, [row[field], field]);

  const handleSave = async () => {
    if (isSavingGuard.current) return;
    isSavingGuard.current = true;
    if (String(value) === String(row[field] ?? '')) {
      setIsEditing(false);
      setTimeout(() => { isSavingGuard.current = false; }, 300);
      return;
    }
    setIsSaving(true);
    setIsEditing(false);
    let displayVal: any = (field === 'keterangan') ? value.trim() : value;
    if (field === 'hpp_kalkulasi' && value !== '') {
      const parsed = Number(value.replace(/\./g, '').replace(',', '.'));
      if (!isNaN(parsed)) displayVal = parsed;
    } else if (value === '') {
      displayVal = field === 'hpp_kalkulasi' ? 0 : null;
    }
    setLocalVal(displayVal);
    const result = await onSave(row.id, row.nama_order, value, field);
    if (!result.success) setLocalVal(row[field]);
    setIsSaving(false);
    setTimeout(() => { isSavingGuard.current = false; }, 300);
  };

  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current?.contains(e.target as Node)) return;
      handleSave();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isEditing, value]);

  if (isEditing) {
    return (
      <div ref={wrapperRef} className="relative w-full z-[999]">
        <input
          type="text"
          autoFocus
          value={value}
          onChange={e => setValue(field === 'hpp_kalkulasi' ? formatIDR(e.target.value) : e.target.value)}
          onClick={e => e.stopPropagation()}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
            if (e.key === 'Escape') {
              isSavingGuard.current = true;
              setIsEditing(false);
              setTimeout(() => { isSavingGuard.current = false; }, 300);
            }
          }}
          className="w-full text-right font-bold text-[13px] text-gray-800 bg-green-50 border border-green-200 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all"
        />
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center justify-end gap-2 text-green-600 animate-pulse pr-4 h-11">
        <Loader2 size={14} className="animate-spin" />
        <span className="text-[11px] font-bold uppercase tracking-widest">Saving...</span>
      </div>
    );
  }

  const isNumeric = field === 'hpp_kalkulasi';
  const numVal = isNumeric ? Number(localVal || 0) : NaN;
  const formatted = isNumeric
    ? numVal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : localVal;

  return (
    <div
      className="flex items-center justify-end w-[calc(100%+2rem)] h-11 pr-8 -mr-4 cursor-pointer group select-none overflow-hidden transition-colors hover:bg-green-50/30"
      onDoubleClick={e => {
        e.preventDefault(); e.stopPropagation();
        isSavingGuard.current = false;
        setIsEditing(true);
        let init = '';
        if (localVal !== null && localVal !== undefined) {
          init = isNumeric ? formatIDR(String(localVal).replace('.', ',')) : String(localVal);
        }
        setValue(init);
      }}
      title="Klik 2x untuk mengisi"
    >
      {(isNumeric ? (localVal !== null && localVal !== undefined && localVal !== '') : !!formatted) ? (
        <span className={`font-bold transition-colors ${isSelected ? 'text-green-800' : 'text-green-700'} truncate ${isNumeric ? 'tabular-nums' : 'text-[12px]'}`}>
          {isNumeric && <span className="text-[10px] opacity-40 mr-1">Rp</span>}
          {formatted}
        </span>
      ) : (
        <span className="text-gray-300 italic text-[11px] font-bold group-hover:text-green-400 transition-colors">{placeholder}</span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function HppKalkulasiClient() {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HppRecord[] | null>(null);
  const [error, setError] = useState('');
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [lastExcelUpdate, setLastExcelUpdate] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{ start: string; end: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');
  const [dialog, setDialog] = useState({ isOpen: false, type: 'success' as any, title: '', message: '' });

  const { selectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hpp_columnWidths');
      if (saved) return JSON.parse(saved);
    }
    return { no: 60, nama_order: 450, hpp_kalkulasi: 200, keterangan: 250 };
  });

  useEffect(() => {
    setIsMounted(true);
    const hydrated = hydrateScraperPeriod({ stateKey: 'hppKalkulasiState', periodKey: 'HppKalkulasi_scrapedPeriod' });
    if (hydrated.scrapedPeriod) setScrapedPeriod(hydrated.scrapedPeriod);
    setStartDate(hydrated.startDate);
    setEndDate(hydrated.endDate);

    const savedLastUpdate = localStorage.getItem('HppKalkulasi_lastUpdated');
    if (savedLastUpdate) setLastUpdated(formatLastUpdate(new Date(savedLastUpdate)));

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated' || e.key === 'hpp_data_updated') setRefreshKey(k => k + 1);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(searchQuery); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch HPP data
  useEffect(() => {
    if (!isMounted) return;
    let active = true;
    async function load() {
      setLoading(true);
      const t = performance.now();
      try {
        const res = await fetch(`/api/hpp-kalkulasi?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&_t=${Date.now()}`);
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            // Assign pseudo-id untuk row dari orders yang belum ada di hpp_kalkulasi (id = null)
            let counter = -1;
            const normalized = (json.data || []).map((row: any) => ({
              ...row,
              id: row.id !== null && row.id !== undefined ? row.id : counter--,
              _fromOrders: row.id === null || row.id === undefined,
            }));
            setData(normalized);
            setTotalCount(json.total || 0);
            setLoadTime(Math.round(performance.now() - t));
            if (json.lastExcelUpdate) setLastExcelUpdate(formatLastUpdate(new Date(json.lastExcelUpdate)));
            if (json.lastUpdated) {
              const date = new Date(json.lastUpdated);
              setLastUpdated(formatLastUpdate(date));
              localStorage.setItem('HppKalkulasi_lastUpdated', date.toISOString());
            }
            setError('');
          }
        }
      } catch (e: any) {
        if (active) setError(e.message || 'Gagal memuat data');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, isMounted]);

  // Tarik data dari Digita → upsert ke orders → sync nama ke hpp_kalkulasi
  const handleFetch = async () => {
    if (!startDate || !endDate) return;
    localStorage.setItem('hppKalkulasiState', JSON.stringify({
      startDate: startDate.toISOString(), endDate: endDate.toISOString(),
      sessionDate: new Date().toLocaleDateString('en-CA'),
    }));
    setError(''); setPage(1); setIsBatching(true); setLoading(true); setBatchProgress(0);

    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    const fullStart = `${String(startDate.getDate()).padStart(2, '0')}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${startDate.getFullYear()}`;
    const fullEnd = `${String(endDate.getDate()).padStart(2, '0')}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${endDate.getFullYear()}`;

    let successCount = 0; let totalScraped = 0; let completedChunks = 0;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-orders?start=${chunk.start}&end=${chunk.end}&metaStart=${fullStart}&metaEnd=${fullEnd}&silent=true`);
        if (res.ok) { successCount++; const json = await res.json(); totalScraped += (json.total || 0); }
      } catch {}
      finally {
        completedChunks++;
        setBatchProgress(Math.round((completedChunks / chunks.length) * 100));
        setBatchStatus(`Memproses ${completedChunks}/${chunks.length} bulan...`);
      }
    };

    try {
      const concurrency = 15; const queue = [...chunks];
      await Promise.all(Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
        while (queue.length > 0) { const c = queue.shift(); if (c) await processChunk(c); }
      }));

      if (successCount > 0) {
        // Sync nama_prd unik dari orders ke hpp_kalkulasi (insert only, jaga nilai yang sudah diisi)
        await fetch('/api/hpp-kalkulasi/sync-from-orders', { method: 'POST' });

        persistScraperPeriod({ stateKey: 'hppKalkulasiState', periodKey: 'HppKalkulasi_scrapedPeriod' }, startDate, endDate);
        setScrapedPeriod({ start: fullStart, end: fullEnd });
        const now = new Date();
        setLastUpdated(formatLastUpdate(now));
        localStorage.setItem('HppKalkulasi_lastUpdated', now.toISOString());
        setRefreshKey(k => k + 1);
        localStorage.setItem('sintak_data_updated', Date.now().toString());
        setDialog({
          isOpen: true, type: 'success', title: 'Berhasil',
          message: `Berhasil menarik ${totalScraped} Order Produksi.\nNama order baru telah ditambahkan ke tabel HPP Kalkulasi.`,
        });
      }
    } finally {
      setIsBatching(false); setLoading(false);
    }
  };

  const handleSaveRecord = useCallback(async (id: number, nama_order: string, value: string, field: string): Promise<{ success: boolean; newId?: number }> => {
    try {
      // id negatif = pseudo-id untuk row dari orders, kirim null ke API
      const realId = id > 0 ? id : null;
      const payload: any = { id: realId, nama_order: nama_order.trim() };
      payload[field] = value;
      const res = await fetch('/api/hpp-kalkulasi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        let parsed: any = value;
        if (field === 'hpp_kalkulasi') {
          const num = Number(value.replace(/\./g, '').replace(',', '.'));
          if (!isNaN(num)) parsed = num;
        }
        // Update local data — update id ke id asli dari DB kalau sebelumnya pseudo
        setData(prev => prev ? prev.map(row => {
          if (row.nama_order !== nama_order) return row;
          return { ...row, id: json.id ?? row.id, _fromOrders: false, [field]: parsed };
        }) : prev);
        return { success: true, newId: json.id };
      }
      return { success: false };
    } catch { return { success: false }; }
  }, []);

  const handleResize = useCallback((widths: any) => {
    setColumnWidths(widths);
    localStorage.setItem('hpp_columnWidths', JSON.stringify(widths));
  }, []);

  const columns = useMemo(() => [
    {
      accessorKey: 'id', header: 'No.', size: columnWidths.no,
      cell: ({ row }: any) => (
        <span className={`font-medium tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-400'}`}>
          {(page - 1) * PAGE_SIZE + row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: 'nama_order', header: 'Nama Order', size: columnWidths.nama_order,
      cell: ({ getValue, row }: any) => {
        const val = String(getValue());
        return (
          <div className="flex items-center justify-between w-full pr-4 group relative h-full">
            <span className={`font-semibold tracking-tight ${row.getIsSelected() ? "text-green-600" : "text-gray-700"} truncate mr-2`}>
              {val}
            </span>
            <div className="shrink-0">
              <CopyButton text={val} />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'hpp_kalkulasi', header: 'HPP Kalkulasi', size: columnWidths.hpp_kalkulasi,
      meta: { align: 'right', headerBg: '#f0fdf4' },
      cell: (info: any) => (
        <EditableCell
          row={info.row.original}
          field="hpp_kalkulasi"
          onSave={handleSaveRecord}
          placeholder="klik 2x untuk HPP"
          isSelected={info.row.getIsSelected()}
        />
      ),
    },
    {
      accessorKey: 'keterangan', header: 'Keterangan', size: columnWidths.keterangan,
      meta: { align: 'right', headerBg: '#f0fdf4' },
      cell: (info: any) => (
        <EditableCell
          row={info.row.original}
          field="keterangan"
          onSave={handleSaveRecord}
          placeholder="klik 2x untuk ket."
          isSelected={info.row.getIsSelected()}
        />
      ),
    },
  ], [columnWidths, page, handleSaveRecord]);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">

      {/* Tarik Data */}
      <DateRangeCard
        title="Rentang Tanggal"
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onFetch={handleFetch}
        isFetching={loading || isBatching}
        progress={isBatching ? batchProgress : undefined}
        statusText={isBatching ? batchStatus : undefined}
        fetchText="Tarik Data Order"
      />

      {/* Tabel */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
        <div className="flex flex-col gap-3 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-4">
              <ScrapingHeader
                title="Data HPP Kalkulasi"
                icon={<Calculator size={16} />}
                lastExcelUpdate={lastExcelUpdate}
                lastScrapedUpdate={lastUpdated}
                scrapedPeriod={scrapedPeriod}
              />
            </div>
            {loading && (
              <div className="text-[10px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm animate-pulse uppercase tracking-widest leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memuat...</span>
              </div>
            )}
          </div>

          <SearchAndReload
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onReload={() => { setRefreshKey(k => k + 1); setPage(1); }}
            loading={loading}
            placeholder="Cari berdasarkan nama order..."
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          {error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-center mb-6">
                <AlertCircle className="text-rose-500" size={40} />
              </div>
              <p className="text-sm font-bold text-gray-800 uppercase tracking-[0.2em] mb-2">Terjadi Kesalahan</p>
              <p className="text-gray-500 text-sm mb-8 max-w-xs">{error}</p>
              <button
                onClick={() => setRefreshKey(k => k + 1)}
                className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 uppercase tracking-widest text-[11px] transition-all"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <DataTable
              data={data || []}
              columns={columns}
              columnWidths={columnWidths}
              onColumnWidthChange={handleResize}
              isLoading={loading || data === null}
              selectedIds={selectedIds}
              onRowClick={handleRowClick}
              rowHeight="h-11"
            />
          )}
        </div>

        <TableFooter
          totalCount={totalCount}
          currentCount={data?.length || 0}
          label="data HPP"
          selectedCount={selectedIds.size}
          onClearSelection={clearSelection}
          loadTime={loadTime}
          page={page}
          totalPages={totalPages}
          onPageChange={p => { setPage(p); clearSelection(); }}
        />
      </div>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => { setDialog(d => ({ ...d, isOpen: false })); router.refresh(); }}
      />
    </div>
  );
}
