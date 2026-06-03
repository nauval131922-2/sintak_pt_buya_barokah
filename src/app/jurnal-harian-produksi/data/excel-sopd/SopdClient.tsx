'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, ClipboardList, Pencil, Check, X, Calendar, Copy } from 'lucide-react';
import ImportInfo from '@/components/ImportInfo';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/DataTable';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import DatePicker from '@/components/DatePicker';
import TableTitle from '@/components/TableTitle';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';
import DateRangeCard from '@/components/DateRangeCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import ScrapingHeader from '@/components/ScrapingHeader';
import { splitDateRangeIntoMonths, formatLastUpdate } from '@/lib/date-utils';
import { getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod } from '@/lib/scraper-period';

function formatDateToYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface SopdRecord {
  id: number;
  no_sopd: string;
  tgl: string;
  nama_order: string;
  qty_sopd: number | string;
  unit: string;
  perkiraan_harga: number | null;
  keterangan: string | null;
  deadline_date: string | null;
  finished_date: string | null;
}

interface SopdClientProps {
  importInfo?: {
    fileName: string;
    time: string;
  };
}

const PAGE_SIZE = 50;

const formatIDR = (val: string): string => {
    if (!val) return '';
    
    let work = val;
    if (work.endsWith('.')) {
        work = work.slice(0, -1) + ',';
    }
    work = work.replace(/\./g, '').replace(/,/g, '.');
    const isNegative = work.startsWith('-');
    if (isNegative) work = work.slice(1);
    const parts = work.split('.');
    let intPartRaw = parts[0].replace(/\D/g, '');
    let decPartRaw = parts.length > 1 ? parts[parts.length - 1].replace(/\D/g, '') : null;
    if (intPartRaw === '' && decPartRaw === null) return isNegative ? '-' : '';
    const intFormatted = intPartRaw ? Number(intPartRaw).toLocaleString('id-ID') : '0';
    let result = intFormatted;
    if (decPartRaw !== null) {
        result += ',' + decPartRaw;
    }
    return isNegative ? '-' + result : result;
};

const EditableCell = ({ 
    row, 
    field, 
    onSave, 
    placeholder = 'klik 2x untuk isi',
    isNumericOnly = false,
    isSelected = false,
    pasteActive = false,
    onCopyValue,
    copiedValue,
    onPasteDone,
}: { 
    row: SopdRecord, 
    field: keyof SopdRecord,
    onSave: (no_sopd: string, value: string, field: string) => Promise<boolean>,
    placeholder?: string,
    isNumericOnly?: boolean,
    isSelected?: boolean,
    pasteActive?: boolean,
    onCopyValue?: (value: string) => void,
    copiedValue?: string | null,
    onPasteDone?: () => void,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isSavingGuard = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const initialVal = row[field];
  const [localVal, setLocalVal] = useState<any>(initialVal);

  useEffect(() => {
    setLocalVal(row[field]);
  }, [row[field], field]);

  useEffect(() => {
    if (pasteActive) setIsEditing(false);
  }, [pasteActive]);

  const handleSave = async () => {
    if (isSavingGuard.current) return;
    isSavingGuard.current = true;

    // Optimization: If value hasn't changed, just close without saving
    if (String(value) === String(initialVal)) {
      setIsEditing(false);
      setTimeout(() => { isSavingGuard.current = false; }, 300);
      return;
    }
    
    setIsSaving(true);
    setIsEditing(false);
    
    let displayVal: any = value;
    if (value !== '') {
        const parsed = Number(value.replace(/\./g, "").replace(',', '.'));
        if (!isNaN(parsed) && (isNumericOnly || !/[a-zA-Z]/.test(value))) {
            displayVal = parsed;
        }
    } else {
        displayVal = null;
    }
    setLocalVal(displayVal);

    const success = await onSave(row.no_sopd, value, field as string);
    if (!success) {
       setLocalVal(row[field]);
    }
    
    setIsSaving(false);
    setTimeout(() => { isSavingGuard.current = false; }, 300);
  };

  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // 1. If clicking inside our cell wrapper, ignore
      if (wrapperRef.current && wrapperRef.current.contains(target)) return;
      
      // 2. If clicking inside a date picker popup (portaled elements), ignore
      const isCalendarElement = 
        target.closest('.rdp') || 
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest('[role="dialog"]') || // Radix popovers often use role="dialog"
        target.closest('.rdp-root');

      if (isCalendarElement) return;

      // 3. Double check: if target is part of a button that might be a trigger
      if (target.closest('button')) return;

      handleSave();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isEditing, value]);

  const val = localVal;
  const parseClean = (v: any) => {
      if (v === null || v === undefined || v === '') return NaN;
      if (typeof v === 'number') return v;
      let s = String(v);
      if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
      return Number(s);
  };

  const numericVal = parseClean(val);
  const isActuallyNumeric = !isNaN(numericVal) && (isNumericOnly || !/[a-zA-Z]/.test(String(val)));
  
  const formatted = isActuallyNumeric
      ? numericVal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      : val;

  if (pasteActive) {
    return (
      <div className="flex items-center justify-end w-[calc(100%+2rem)] h-11 pr-2 -mr-4 gap-1 select-none overflow-hidden">
        {formatted ? (
          <span className={`font-bold transition-colors ${isSelected ? 'text-green-800' : 'text-green-700'} truncate ${!isActuallyNumeric ? 'text-[12px]' : 'tabular-nums'}`}>
            {formatted}
          </span>
        ) : (
          <span className="text-gray-300 italic text-[11px] font-bold">{placeholder}</span>
        )}
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (copiedValue) {
              await onSave(row.no_sopd, copiedValue, field as string);
            }
          }}
          className="p-1 hover:bg-emerald-100 rounded-md text-emerald-400 hover:text-emerald-600 transition-all shrink-0"
          title="Tempel value yang di-copy"
        >
          <ClipboardList size={12} />
        </button>
      </div>
    );
  }

  const smartFormatInput = (val: string) => {
    if (isNumericOnly) return formatIDR(val);
    if (/[a-zA-Z]/.test(val)) return val;
    return formatIDR(val);
  };

  if (isEditing) {
    return (
        <div ref={wrapperRef} className="relative w-full group/input z-[999]">
            <input
                type="text"
                autoFocus
                value={value}
                onChange={e => setValue(smartFormatInput(e.target.value))}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSave();
                    }
                    if (e.key === 'Escape') {
                        isSavingGuard.current = true;
                        setIsEditing(false);
                        setTimeout(() => { isSavingGuard.current = false; }, 300);
                    }
                }}
                className={`w-full text-right font-bold text-[13px] text-gray-800 bg-green-50 z-50 relative border border-green-200 rounded-lg py-1.5 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all ${(field === 'deadline_date' || field === 'finished_date') ? 'pr-10 pl-3' : 'px-3'}`}
            />
            {(field === 'deadline_date' || field === 'finished_date') && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-[60] flex items-center">
                    <DatePicker 
                        name="cellDatePicker"
                        value={
                            value && value.split('-').length === 3 
                              ? new Date(Number(value.split('-')[2]), Number(value.split('-')[1]) - 1, Number(value.split('-')[0])) 
                              : null
                        }
                        onChange={(d: Date) => {
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            setValue(`${day}-${m}-${y}`);
                        }}
                        popupAlign="right"
                        customTrigger={(toggle) => (
                            <button 
                                type="button"
                                tabIndex={-1}
                                onMouseDown={(e) => {
                                  e.preventDefault(); 
                                  e.stopPropagation(); 
                                  toggle();
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="p-1.5 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                            >
                                <Calendar size={16} />
                            </button>
                        )}
                    />
                </div>
            )}
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

  return (
      <div
          className="flex items-center justify-end w-[calc(100%+2rem)] h-11 pr-2 -mr-4 cursor-pointer group/cell select-none overflow-hidden transition-colors hover:bg-green-50/30 gap-1"
          onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              isSavingGuard.current = false;
              setIsEditing(true);
              let inputInit = '';
              if (val !== null && val !== undefined) {
                  if (isActuallyNumeric) {
                      inputInit = formatIDR(String(val).replace('.', ','));
                  } else {
                      inputInit = String(val);
                  }
              }
              setValue(inputInit);
          }}
          title="Klik 2x untuk mengisi"
      >
          {formatted ? (
              <span className={`font-bold transition-colors ${isSelected ? 'text-green-800' : 'text-green-700'} truncate ${!isActuallyNumeric ? 'text-[12px]' : 'tabular-nums'}`}>
                  {formatted}
              </span>
          ) : (
              <span className="text-gray-300 italic text-[11px] font-bold group-hover:text-green-400 transition-colors">{placeholder}</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const cellValue = val !== null && val !== undefined ? String(val) : '';
              onCopyValue?.(cellValue);
            }}
            className="p-1 hover:bg-green-100 rounded-md text-green-400 hover:text-green-600 transition-all shrink-0"
            title="Copy value cell ini"
          >
            <Copy size={12} />
          </button>
      </div>
  );
};


export default function SopdClient({ importInfo }: SopdClientProps) {
  const router = useRouter();
  const mountedRef = useRef(true);
  
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SopdRecord[] | null>(null);
  const [error, setError] = useState('');
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
  
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [lastExcelUpdate, setLastExcelUpdate] = useState<string | null>(null);
  const [lastScrapedUpdate, setLastScrapedUpdate] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{start: string, end: string} | null>(null);
  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');
  const [dialog, setDialog] = useState({ isOpen: false, type: 'success' as any, title: '', message: '' });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pasteActive, setPasteActive] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const handleCopyValue = useCallback((value: string) => {
    setCopiedValue(value);
    setPasteActive(true);
  }, []);
  const handlePasteDone = useCallback(() => {
    setPasteActive(false);
    setCopiedValue(null);
  }, []);

  useEffect(() => {
    if (!pasteActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handlePasteDone();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [pasteActive, handlePasteDone]);

  const { selectedIds, setSelectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sopd_columnWidths');
      if (saved) return JSON.parse(saved);
    }
    return {
      'id': 60, 'no_sopd': 180, 'nama_order': 400, 'qty_sopd': 150, 'unit': 120,
      'perkiraan_harga': 180, 'keterangan': 250, 'deadline_date': 180, 'finished_date': 180
    };
  });

  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedQuery(searchQuery);
        setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setIsMounted(true);
    const hydrated = hydrateScraperPeriod({ stateKey: 'sopdState', periodKey: 'SopdClient_scrapedPeriod' });
    if (hydrated.scrapedPeriod) setScrapedPeriod(hydrated.scrapedPeriod);
    setStartDate(hydrated.startDate);
    setEndDate(hydrated.endDate);

    const handleDataUpdated = () => {
      setRefreshKey(prev => prev + 1);
      router.refresh();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated' || e.key === 'sopd_data_updated') {
        handleDataUpdated();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sintak:data-updated', handleDataUpdated);
    return () => { 
        mountedRef.current = false;
        window.removeEventListener('storage', handleStorageChange); 
        window.removeEventListener('sintak:data-updated', handleDataUpdated);
    };
  }, [router]);

  // State persistence managed by scraper-period in effects or directly in handlers

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      const startTime = performance.now();
      try {
        const fmtDate = (d: Date | null) => {
           if (!d) return '';
           const y = d.getFullYear();
           const m = String(d.getMonth() + 1).padStart(2, '0');
           const day = String(d.getDate()).padStart(2, '0');
           return `${day}-${m}-${y}`;
        };
        const startParam = fmtDate(startDate);
        const endParam = fmtDate(endDate);
        const res = await fetch(`/api/sopd?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&startDate=${startParam}&endDate=${endParam}&_t=${Date.now()}`);
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setLoadTime(Math.round(performance.now() - startTime));
            setData(json.data || []);
            setTotalCount(json.total || 0);
            setTotalPages(Math.ceil((json.total || 0) / PAGE_SIZE));
            setError('');
            if (json.lastUpdated) setLastUpdated(formatLastUpdate(new Date(json.lastUpdated)));
            if (json.lastExcelUpdate) setLastExcelUpdate(formatLastUpdate(new Date(json.lastExcelUpdate)));
            if (json.lastScrapedUpdate) setLastScrapedUpdate(formatLastUpdate(new Date(json.lastScrapedUpdate)));
            if (json.scrapedPeriod) setScrapedPeriod(json.scrapedPeriod);
          }
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Gagal memuat data');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate]);

  const handleSaveRecord = useCallback(async (no_sopd: string, value: string, field: string): Promise<boolean> => {
    try {
      const payload: any = { no_sopd };
      payload[field] = value;
      const res = await fetch('/api/sopd', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setData(prev => prev ? prev.map(row => {
          if (row.no_sopd !== no_sopd) return row;
          let parsedVal: any = value;
          if (field === 'perkiraan_harga' && value !== '' && !/[a-zA-Z]/.test(value)) {
            const num = Number(value.replace(/\./g, "").replace(',', '.'));
            if (!isNaN(num)) parsedVal = num;
          }
          return { ...row, [field]: parsedVal };
        }) : prev);
        localStorage.setItem('sintak_data_updated', Date.now().toString());
        return true;
      }
      return false;
    } catch (e) { return false; }
  }, []);

  const handleFetch = async () => {
    if (!startDate || !endDate) return;
    localStorage.setItem('sopdState', JSON.stringify({
      startDate: startDate.toISOString(), endDate: endDate.toISOString(), sessionDate: new Date().toLocaleDateString('en-CA')
    }));
    setError(''); setData([]); setPage(1); setIsBatching(true); setLoading(true); setBatchProgress(0);
    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    let successCount = 0; let totalScraped = 0; let completedChunks = 0;
    const fullStart = `${String(startDate.getDate()).padStart(2, '0')}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${startDate.getFullYear()}`;
    const fullEnd = `${String(endDate.getDate()).padStart(2, '0')}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${endDate.getFullYear()}`;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-orders?start=${chunk.start}&end=${chunk.end}&metaStart=${chunk.start}&metaEnd=${chunk.end}&silent=true`);
        if (res.ok) {
          successCount++; const json = await res.json(); totalScraped += (json.total || 0);
        }
      } catch (e) {} finally {
        completedChunks++; setBatchProgress(Math.round((completedChunks / chunks.length) * 100));
        setBatchStatus(`Memproses ${completedChunks}/${chunks.length} bulan...`);
      }
    };
    try {
      const concurrency = 15; const queue = [...chunks];
      const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
        while (queue.length > 0) { const chunk = queue.shift(); if (chunk) await processChunk(chunk); }
      });
      await Promise.all(workers);
      if (successCount > 0) {
        persistScraperPeriod({ stateKey: 'sopdState', periodKey: 'SopdClient_scrapedPeriod' }, startDate, endDate);
        setRefreshKey(prev => prev + 1);
        localStorage.setItem('sintak_data_updated', Date.now().toString());
        fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'SCRAPE', table_name: 'orders',
            message: `Scrape orders berhasil: ${totalScraped} baris (${fullStart} - ${fullEnd}).`,
            raw_data: JSON.stringify({ total: totalScraped, start: fullStart, end: fullEnd })
          })
        });
        setDialog({ isOpen: true, type: 'success', title: 'Berhasil', message: `Berhasil menarik ${totalScraped} Order Produksi.` });
      }
    } finally { setIsBatching(false); setLoading(false); }
  };

  const columns = useMemo(() => [
    { 
        accessorKey: 'id', 
        header: 'No.', 
        size: 80,
        meta: { sticky: true },
        cell: ({ row }: any) => <span className={`font-medium tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-400'}`}>{(page - 1) * PAGE_SIZE + (row.index + 1)}</span>
    },
    { 
        accessorKey: 'tgl', header: 'Tanggal', size: 130, meta: { sticky: true },
        cell: ({ getValue, row }: any) => {
            const val = getValue();
            if (!val) return <span className="text-gray-200">??-??-????</span>;
            const parts = String(val).split('-');
            if (parts.length === 3) {
                const day = parts[0];
                const monthIdx = parseInt(parts[1], 10) - 1;
                const year = parts[2];
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                const monthName = months[monthIdx] || parts[1];
                return <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{day} {monthName} {year}</span>;
            }
            return <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{String(val)}</span>;
        }
    },
    { 
        accessorKey: 'no_sopd', 
        header: 'No. Order', 
        size: 180, 
        meta: { sticky: true },
        cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-700'}`}>{String(getValue() || '—')}</span> 
    },
    { 
        accessorKey: 'nama_order', 
        header: 'Nama Order', 
        size: 400, 
        meta: { sticky: true },
        cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight transition-colors ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'} truncate block`} title={String(getValue())}>{String(getValue() || '—')}</span> 
    },
    { 
        accessorKey: 'qty_sopd', header: 'Jumlah Order', size: 150, meta: { align: 'right' },
        cell: ({ getValue, row }: any) => {
            const val = getValue();
            if (!val && val !== 0) return <span className="text-gray-200 italic">—</span>;
            const num = Number(val);
            const formatted = isNaN(num) ? val : num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return (
              <div className={`flex items-center justify-between font-semibold tabular-nums w-full ${row.getIsSelected() ? 'text-green-700' : 'text-blue-600'}`}>
                <span>{String(formatted)}</span>
              </div>
            );
        }
    },
    { 
        accessorKey: 'unit', 
        header: 'Satuan', 
        size: 120, 
        cell: ({ getValue }: any) => <span className="text-[11px] font-bold text-gray-400">{String(getValue() || '—')}</span> 
    },
    { accessorKey: 'perkiraan_harga', header: 'Perkiraan Harga', size: 180, meta: { align: 'right', headerBg: '#fffbeb' }, cell: (info: any) => <EditableCell row={info.row.original} isSelected={info.row.getIsSelected()} field="perkiraan_harga" onSave={handleSaveRecord} placeholder="klik 2x untuk harga" pasteActive={pasteActive} onCopyValue={handleCopyValue} copiedValue={copiedValue} onPasteDone={handlePasteDone} /> },
    { accessorKey: 'keterangan', header: 'Keterangan', size: 250, meta: { align: 'right', headerBg: '#fffbeb' }, cell: (info: any) => <EditableCell row={info.row.original} isSelected={info.row.getIsSelected()} field="keterangan" onSave={handleSaveRecord} placeholder="klik 2x untuk ket." pasteActive={pasteActive} onCopyValue={handleCopyValue} copiedValue={copiedValue} onPasteDone={handlePasteDone} /> },
    { accessorKey: 'deadline_date', header: 'Tanggal Deadline', size: 180, meta: { align: 'right', overflowVisible: true, headerBg: '#f5f3ff' }, cell: (info: any) => <EditableCell row={info.row.original} isSelected={info.row.getIsSelected()} field="deadline_date" onSave={handleSaveRecord} placeholder="klik 2x untuk deadline" pasteActive={pasteActive} onCopyValue={handleCopyValue} copiedValue={copiedValue} onPasteDone={handlePasteDone} /> },
    { accessorKey: 'finished_date', header: 'Tanggal Selesai', size: 180, meta: { align: 'right', overflowVisible: true, headerBg: '#f5f3ff' }, cell: (info: any) => <EditableCell row={info.row.original} isSelected={info.row.getIsSelected()} field="finished_date" onSave={handleSaveRecord} placeholder="klik 2x untuk selesai" pasteActive={pasteActive} onCopyValue={handleCopyValue} copiedValue={copiedValue} onPasteDone={handlePasteDone} /> }
  ], [page, handleSaveRecord, pasteActive, handleCopyValue, copiedValue, handlePasteDone]);

  const handleResize = useCallback((widths: any) => {
    setColumnWidths(widths);
    localStorage.setItem('sopd_columnWidths', JSON.stringify(widths));
  }, []);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
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
        fetchText="Tarik Data"
      />
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-5">
               <ScrapingHeader 
                 title="Data Order Produksi (SOPd)" 
                 lastUpdated={lastUpdated} 
                 lastExcelUpdate={lastExcelUpdate}
                 lastScrapedUpdate={lastScrapedUpdate}
                 scrapedPeriod={scrapedPeriod}
                 activityLogTable="sopd"
               />
               <ImportInfo info={importInfo} />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setPasteActive(false); setCopiedValue(null); }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] leading-none font-bold transition-all ${
                  pasteActive
                    ? 'opacity-100 visible bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                    : 'opacity-0 invisible pointer-events-none'
                }`}
              >
                <X size={12} />
                Stop Copy (Esc)
              </button>
              {loading && (data?.length || 0) > 0 && (
                  <div className="text-[10px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm animate-pulse uppercase tracking-widest leading-none">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Memproses Data...</span>
                  </div>
              )}
            </div>
          </div>
          <SearchAndReload searchQuery={searchQuery} setSearchQuery={setSearchQuery} onReload={() => setRefreshKey(k => k + 1)} loading={loading} placeholder="Cari berdasarkan nama order..." />
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          <DataTable data={data || []} columns={columns} columnWidths={columnWidths} onColumnWidthChange={handleResize} isLoading={loading || data === null} selectedIds={selectedIds} onRowClick={handleRowClick} rowHeight="h-11" />
        </div>

        <TableFooter totalCount={totalCount} currentCount={data?.length || 0} label="SOPd" selectedCount={selectedIds.size} onClearSelection={clearSelection} loadTime={loadTime} page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
      <ConfirmDialog isOpen={dialog.isOpen} type={dialog.type} title={dialog.title} message={dialog.message} onConfirm={() => setDialog({ ...dialog, isOpen: false })} />
    </div>
  );
}



