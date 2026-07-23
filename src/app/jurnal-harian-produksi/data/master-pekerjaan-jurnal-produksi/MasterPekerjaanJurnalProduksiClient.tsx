'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, Database, RotateCcw, Filter, Wrench } from 'lucide-react';
import SearchableDropdown from '@/components/SearchableDropdown';
import { DataTable } from '@/components/ui/DataTable';
import MasterPekerjaanJurnalProduksiUpload from './MasterPekerjaanJurnalProduksiUpload';
import ImportInfo from '@/components/ImportInfo';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';

interface PekerjaanJurnalProduksiRecord {
  id: number;
  category: string;
  name: string;
  created_at: string;
}

const PAGE_SIZE = 100;

interface MasterPekerjaanJurnalProduksiClientProps {
  importInfo?: {
    fileName: string;
    time: string;
  };
}

export default function MasterPekerjaanJurnalProduksiClient({ importInfo }: MasterPekerjaanJurnalProduksiClientProps) {
  const [data, setData] = useState<PekerjaanJurnalProduksiRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadTime, setLoadTime] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('master_pekerjaan_jhp_columnWidths');
      if (saved) return JSON.parse(saved);
    }
    return {
      'no': 80,
      'category': 250,
      'name': 600,
    };
  });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { 
      setDebouncedQuery(searchQuery); 
      setPage(1); 
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => { 
    setPage(1); 
  }, [categoryFilter]);

  // Listen for cross-tab refresh
  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1);
    window.addEventListener('sintak:data-updated', handler);
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') setRefreshKey(k => k + 1);
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('sintak:data-updated', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  // Fetch filter categories
  const loadFilters = useCallback(async () => {
    try {
      const res = await fetch(`/api/master-pekerjaan-jurnal-produksi/filters`);
      if (!res.ok) return;
      const json = await res.json();
      setAvailableCategories(json.categories || []);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => { 
    loadFilters(); 
  }, [loadFilters]);

  // Fetch data
  const loadData = useCallback(async () => {
    setLoading(page === 1);
    setError('');
    const start = performance.now();
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (debouncedQuery) params.set('search', debouncedQuery);
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`/api/master-pekerjaan-jurnal-produksi?${params}`);
      if (!res.ok) throw new Error('Gagal memuat data.');
      const json = await res.json();

      setData(json.data || []);
      setTotalCount(json.total || 0);
      setTotalPages(Math.max(1, Math.ceil((json.total || 0) / PAGE_SIZE)));
      setLoadTime(Math.round(performance.now() - start));
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Gagal memuat data.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedQuery, categoryFilter, refreshKey]);

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  const columns = useMemo(() => {
    return [
      { 
        accessorKey: 'no', 
        header: 'No.', 
        size: 80,
        cell: ({ row }: { row: { index: number; getIsSelected: () => boolean } }) => (
          <span className={`font-medium tabular-nums ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-400'}`}>
            {(page - 1) * PAGE_SIZE + (row.index + 1)}
          </span>
        )
      },
      { 
        accessorKey: 'category', 
        header: 'Bagian', 
        size: 250,
        cell: ({ getValue, row }: { getValue: () => unknown; row: { getIsSelected: () => boolean } }) => (
          <span className={`text-[12px] font-bold tracking-tight transition-colors ${row.getIsSelected() ? 'text-emerald-600' : 'text-gray-700'}`}>
            {String(getValue())}
          </span> 
        )
      },
      { 
        accessorKey: 'name', 
        header: 'Nama Pekerjaan / Mesin', 
        size: 600,
        cell: ({ getValue, row }: { getValue: () => unknown; row: { getIsSelected: () => boolean } }) => (
          <span className={`text-[12px] font-medium transition-colors ${row.getIsSelected() ? 'text-emerald-900' : 'text-gray-800'}`}>
            {String(getValue())}
          </span> 
        )
      },
    ];
  }, [page]);

  const handleColumnWidthChange = useCallback((widths: Record<string, number>) => {
    setColumnWidths(widths);
    localStorage.setItem('master_pekerjaan_jhp_columnWidths', JSON.stringify(widths));
  }, []);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
      {/* Top Header Row: Upload & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
         {/* Upload Card */}
         <MasterPekerjaanJurnalProduksiUpload />

         {/* Filters Card */}
         <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 shadow-sm shadow-emerald-900/5 relative z-50">
          <div className="flex items-center gap-2 w-full">
               <SearchableDropdown
                 id="mp-jhp-category"
                 label="Bagian"
                 value={categoryFilter}
                 items={availableCategories}
                 allLabel="Semua"
                 searchPlaceholder="Cari bagian..."
                 triggerWidth="flex-1"
                 panelWidth="w-[280px]"
                 compact
                 icon={<Filter size={14} className={categoryFilter ? 'text-emerald-600' : 'text-gray-400'} />}
                 onChange={(val) => {
                   setCategoryFilter(val);
                   setPage(1);
                 }}
               />

               {/* Reset Filter Button */}
               <div className="flex flex-col gap-1">
                 <span className="text-[11px] font-semibold text-transparent ml-1 tracking-tight select-none">.</span>
                 <button
                   onClick={() => {
                     setCategoryFilter('');
                     setSearchQuery('');
                     setPage(1);
                   }}
                   className="h-10 px-3 bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-100 hover:border-rose-100 rounded-lg shadow-sm transition-all flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap"
                 >
                   <RotateCcw size={14} />
                   Reset
                 </button>
               </div>
            </div>
         </div>
      </div>

      {/* Results View */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        {/* Search Bar Section */}
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-5">
               <h3 className="text-[14px] font-bold text-gray-800 flex items-center gap-3 leading-none tracking-tight">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                    <Wrench size={16} />
                  </div>
                  <span>Daftar Master Pekerjaan</span>
               </h3>
               <ImportInfo info={importInfo} />
            </div>
            {loading && (data?.length || 0) > 0 && (
                <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm animate-pulse leading-none">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Loading Data...</span>
                </div>
            )}
          </div>

          <SearchAndReload 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onReload={() => setRefreshKey(k => k + 1)}
            loading={loading}
            placeholder="Cari berdasarkan nama pekerjaan atau nama mesin..."
          />
        </div>

        {/* Main Table Context */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
         {error ? (
           <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm shadow-emerald-900/5">
              <div className="w-20 h-20 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-center mb-6">
                  <AlertCircle className="text-rose-500" size={40} />
              </div>
              <p className="text-sm font-bold text-gray-800 mb-2">Terjadi Kesalahan</p>
              <p className="text-gray-500 text-sm mb-8 max-w-xs">{error}</p>
              <button 
                onClick={() => setRefreshKey(k => k + 1)}
                className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-900/10 hover:bg-emerald-700 hover:-translate-y-1 hover:shadow-sm hover:shadow-emerald-900/20 active:translate-y-0 text-[11px]"
              >
                Coba Lagi
              </button>
           </div>
         ) : data !== null && data.length === 0 ? (
           <div className="flex flex-col items-center justify-center flex-1 gap-5 rounded-2xl border border-gray-100 bg-white shadow-sm shadow-emerald-900/5">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center mb-2">
                <Database className="text-gray-400" size={40} strokeWidth={1.5} />
              </div>
              <div className="text-center max-w-sm">
                <p className="text-[14px] text-gray-800 font-bold mb-2">Data Tidak Ditemukan</p>
                <p className="text-[13px] text-gray-400 font-medium leading-relaxed px-6">
                  {debouncedQuery || categoryFilter
                    ? 'Coba ubah kata kunci pencarian atau bersihkan filter yang aktif.'
                    : 'Belum ada data. Upload file Excel Master Pekerjaan Jurnal Produksi untuk memulai.'}
                </p>
              </div>
              {(debouncedQuery || categoryFilter) && (
                <button
                  onClick={() => { 
                    setSearchQuery(''); 
                    setCategoryFilter(''); 
                    setPage(1);
                  }}
                  className="mt-4 px-8 py-3 bg-gray-800 text-white hover:bg-gray-900 text-[11px] font-bold rounded-lg transition-all shadow-sm"
                >
                  Reset Filter
                </button>
              )}
           </div>
         ) : (
           <DataTable
             data={data || []}
             columns={columns}
             columnWidths={columnWidths}
             onColumnWidthChange={handleColumnWidthChange}
             isLoading={loading && data === null}
             rowHeight="h-11"
             selectedIds={selectedId ? new Set([selectedId]) : undefined}
             onRowClick={(id) => setSelectedId(id === selectedId ? null : id)}
           />
         )}
        </div>

        <TableFooter 
          totalCount={totalCount}
          currentCount={data?.length || 0}
          label="Item Master Pekerjaan Jurnal Produksi"
          selectedCount={selectedId ? 1 : 0}
          onClearSelection={() => setSelectedId(null)}
          loadTime={loadTime}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
