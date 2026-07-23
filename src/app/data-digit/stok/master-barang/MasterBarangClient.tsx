'use client';

import { useState, useMemo, useTransition, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Box, RefreshCw, Loader2, Download, Search, DownloadCloud, AlertCircle } from 'lucide-react';
import TableFooter from '@/components/TableFooter';
import SearchAndReload from '@/components/SearchAndReload';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import ScrapingHeader from '@/components/ScrapingHeader';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import { formatLastUpdate } from '@/lib/date-utils';
import { highlightText } from '@/lib/highlight';

import { useSearchParams } from 'next/navigation';

const PAGE_SIZE = 50;

export default function MasterBarangClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get('search') || '');
  const [highlightQuery, setHighlightQuery] = useState(() => searchParams.get('highlight') || searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const isLoadingMore = useRef(false);
  const mountedRef = useRef(true);
  const urlSearchRef = useRef<string | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState({ isOpen: false, type: 'success' as any, title: '', message: '' });

  const { selectedIds, setSelectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('masterBarang_columnWidths');
      return saved ? JSON.parse(saved) : {
        kode: 120, barcode: 120, nama: 350, kd_satuan: 100, berat_kg: 120, saldo: 120, kd_golongan: 150, kd_kelompok: 150
      };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('masterBarang_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    // If URL search parameter changes, sync it to state
    const urlSearch = searchParams.get('search');
    const urlHighlight = searchParams.get('highlight');
    if (urlSearch !== null) {
      urlSearchRef.current = urlSearch;
      setSearchQuery(urlSearch);
      setDebouncedQuery(urlSearch);
      setHighlightQuery(urlHighlight || urlSearch);
      setPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery !== urlSearchRef.current) setHighlightQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setIsMounted(true);
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!active || !mountedRef.current || !isMounted) return;
      setLoading(page === 1);
      const startTimer = performance.now();
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(), limit: PAGE_SIZE.toString(), q: debouncedQuery,
          _t: Date.now().toString()
        });
        const res = await fetch(`/api/master-barang?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Gagal memuat data');
        const json = await res.json();
        if (active) {
          setData(prev => {
            if (page === 1) return json.data || [];
            const existingIds = new Set((prev || []).map((d: any) => String(d.id)));
            return [...(prev || []), ...(json.data || []).filter((d: any) => !existingIds.has(String(d.id)))];
          });
          setTotalCount(json.total || 0);
          if (json.lastUpdated) setLastUpdated(formatLastUpdate(new Date(json.lastUpdated)));
          setLoadTime(Math.round(performance.now() - startTimer));
        }
      } catch (err: any) {
        if (active) { setError(err.message || 'Gagal memuat data'); setData([]); }
      } finally {
        if (active) { setLoading(false); isLoadingMore.current = false; }
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, isMounted]);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setError('');
      setData([]);
      setPage(1);
      setLoading(true);
      
      const res = await fetch('/api/scrape-master-barang');
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Gagal sinkronisasi data');
      }

      setRefreshKey(prev => prev + 1);
      setDialog({ isOpen: true, type: 'success', title: 'Berhasil', message: `Berhasil menarik ${json.total || 0} data Master Barang.` });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSyncing(false);
      setLoading(false);
    }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && !isLoadingMore.current && (data?.length || 0) < totalCount) {
      isLoadingMore.current = true;
      setPage(prev => prev + 1);
    }
  }, [loading, data, totalCount]);

  const columns = useMemo(() => [
    {
      accessorKey: 'kode',
      header: 'Kode',
      size: 120,
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight transition-colors ${row.getIsSelected() ? 'text-emerald-600' : 'text-gray-700'}`}>{highlightText(String(getValue()), highlightQuery)}</span>
    },
    {
      accessorKey: 'barcode',
      header: 'Barcode',
      size: 120,
      cell: ({ getValue, row }: any) => <span className={`font-medium tracking-tight transition-colors ${row.getIsSelected() ? 'text-emerald-600' : 'text-gray-600'}`}>{String(getValue() || '—')}</span>
    },
    {
      accessorKey: 'nama',
      header: 'Nama Barang',
      size: 350,
      cell: ({ getValue, row }: any) => <span className={`font-bold tracking-tight ${row.getIsSelected() ? 'text-emerald-900' : 'text-gray-800'}`}>{highlightText(String(getValue()), highlightQuery)}</span>
    },
    {
      accessorKey: 'kd_satuan',
      header: 'Satuan',
      size: 100,
      cell: ({ getValue, row }: any) => <span className={`font-bold transition-colors ${row.getIsSelected() ? 'text-emerald-700' : 'text-slate-600'}`}>{String(getValue() || '—')}</span>
    },
    {
      accessorKey: 'berat_kg',
      header: 'Berat (KG)',
      size: 120,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-emerald-700' : 'text-slate-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
    },
    {
      accessorKey: 'saldo',
      header: 'Saldo',
      size: 120,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => <span className={`font-extrabold tabular-nums px-2 py-1 rounded bg-emerald-50/50 ${row.getIsSelected() ? 'text-emerald-800' : 'text-emerald-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
    },
    {
      accessorKey: 'kd_golongan',
      header: 'Golongan',
      size: 150,
      cell: ({ getValue, row }: any) => <span className={`font-medium transition-colors ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-600'}`}>{String(getValue() || '—')}</span>
    },
    {
      accessorKey: 'kd_kelompok',
      header: 'Kelompok',
      size: 150,
      cell: ({ getValue, row }: any) => <span className={`font-medium transition-colors ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-600'}`}>{String(getValue() || '—')}</span>
    },
    {
      accessorKey: 'spesifikasi',
      header: 'Spesifikasi',
      size: 150,
      cell: ({ getValue, row }: any) => <span className={`text-[11px] font-medium transition-colors ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-500'}`}>{String(getValue() || '—')}</span>
    },
    {
      accessorKey: 'qty_order',
      header: 'Qty Order',
      size: 100,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-emerald-700' : 'text-slate-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
    },
    {
      accessorKey: 'hj_ppn',
      header: 'HJ PPN',
      size: 100,
      cell: ({ getValue, row }: any) => {
        const val = String(getValue() || '');
        const isChecked = val.includes('checked');
        return <input type="checkbox" checked={isChecked} readOnly className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 disabled:opacity-50 cursor-default" />;
      }
    },
    {
      accessorKey: 'ppn',
      header: 'PPN',
      size: 100,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => <span className={`font-medium tabular-nums ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-600'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      cell: ({ getValue, row }: any) => {
        const val = String(getValue() || '');
        const isChecked = val.includes('checked');
        return <input type="checkbox" checked={isChecked} readOnly className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 disabled:opacity-50 cursor-default" />;
      }
    },
    {
      accessorKey: 'tampil',
      header: 'Tampil',
      size: 100,
      cell: ({ getValue, row }: any) => <span className={`text-[11px] ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-500'}`}>{String(getValue() || '—')}</span>
    },
    {
      accessorKey: 'prd_std',
      header: 'PRD STD',
      size: 100,
      cell: ({ getValue, row }: any) => <span className={`text-[11px] ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-500'}`}>{String(getValue() || '—')}</span>
    },
    {
      accessorKey: 'pj_hide',
      header: 'PJ Hide',
      size: 100,
      cell: ({ getValue, row }: any) => <span className={`text-[11px] ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-500'}`}>{String(getValue() || '—')}</span>
    },
    {
      accessorKey: 'royalti',
      header: 'Royalti',
      size: 100,
      cell: ({ getValue, row }: any) => <span className={`text-[11px] ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-500'}`}>{String(getValue() || '—')}</span>
    },
    {
      accessorKey: 'username',
      header: 'User',
      size: 140,
      cell: ({ getValue }: any) => <span className="text-[11px] font-bold text-gray-400">@{String(getValue() || '–')}</span>
    }
  ], [highlightQuery]);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm shadow-red-900/5 text-sm font-bold flex items-start gap-3 animate-in fade-in shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-4">
              <ScrapingHeader title="Data Master Barang" lastUpdated={lastUpdated} scrapedPeriod={null} />

              {loading && data && data.length > 0 && (
                <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm animate-pulse leading-none">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Memuat...</span>
                </div>
              )}
            </div>

            <button
               onClick={handleSync}
               disabled={isSyncing || loading}
               className="shrink-0 w-full sm:w-auto min-w-[140px] px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-[12px] font-bold shadow-sm shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn relative overflow-hidden"
             >
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
               <span className="relative z-10 flex items-center gap-2">
                 {isSyncing ? (
                   <><Loader2 size={16} className="animate-spin" /> Sedang Menarik...</>
                 ) : (
                   <><DownloadCloud size={16} className="group-hover/btn:-translate-y-0.5 transition-transform duration-300" /> Tarik Data</>
                 )}
               </span>
            </button>
          </div>
          <SearchAndReload 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            onReload={() => setRefreshKey(prev => prev + 1)} 
            loading={loading} 
            placeholder="Cari berdasarkan kode, nama barang, atau golongan..." 
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden relative">
          <DataTable 
            columns={columns} 
            data={data || []} 
            isLoading={loading} 
            onScroll={handleScroll}
            selectedIds={selectedIds} 
            onRowClick={handleRowClick} 
            columnWidths={columnWidths} 
            onColumnWidthChange={setColumnWidths} 
            rowHeight="h-11" 
          />
          <TableFooter 
            totalCount={totalCount} 
            currentCount={data?.length || 0} 
            label="Master Barang" 
            selectedCount={selectedIds.size} 
            onClearSelection={clearSelection} 
            loadTime={loadTime}
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
