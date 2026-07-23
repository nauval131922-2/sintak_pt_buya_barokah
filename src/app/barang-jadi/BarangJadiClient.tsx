'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Loader2, Search, AlertCircle, Clock, RefreshCw, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';

import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import { splitDateRangeIntoMonths, formatLastUpdate } from '@/lib/date-utils';
import { formatScrapedPeriodDate, getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod, persistScraperPeriodFull } from '@/lib/scraper-period';
import { DataTable } from '@/components/ui/DataTable';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';
import DateRangeCard from '@/components/DateRangeCard';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import ScrapingHeader from '@/components/ScrapingHeader';
import CopyButton from '@/components/ui/CopyButton';

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

const PAGE_SIZE = 50;



export default function BarangJadiClient() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{start: string, end: string} | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const mountedRef = useRef(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [warningOnly, setWarningOnly] = useState(false);
  const [soOnly, setSoOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');

  const { selectedIds, setSelectedIds, handleRowClick, clearSelection } = useTableSelection(data);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('barangJadi_columnWidths');
      return saved ? JSON.parse(saved) : {
        no: 60, faktur: 180, tgl: 120, kd_barang: 150, qty: 100, hp_total: 130, hp_barang_jadi: 130, hp_rata_rata: 130, harga_so_sales_order: 170, harga_so_penjualan: 170, analisa_harga: 320
      };
    }
    return {};
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [warningOnly, soOnly]);

  useEffect(() => {
    localStorage.setItem('barangJadi_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    setIsMounted(true);
    const hydratedPeriod = hydrateScraperPeriod({ stateKey: 'barangJadiState', periodKey: 'BarangJadiClient_scrapedPeriod' });
    setScrapedPeriod(hydratedPeriod.scrapedPeriod);
    setStartDate(hydratedPeriod.startDate);
    setEndDate(hydratedPeriod.endDate);

    const savedLastUpdate = localStorage.getItem('BarangJadiClient_lastUpdated');
    if (savedLastUpdate) setLastUpdated(formatLastUpdate(new Date(savedLastUpdate)));

    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        setRefreshKey(prev => prev + 1);
        router.refresh();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => { window.removeEventListener('storage', handleStorageChange); };
  }, [router]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!active || !mountedRef.current || !isMounted) return;
      setLoading(page === 1);
      const startTimer = performance.now();
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(), limit: PAGE_SIZE.toString(), search: debouncedQuery,
          from: formatDateToYYYYMMDD(startDate), to: formatDateToYYYYMMDD(endDate), _t: Date.now().toString(),
          warning_only: warningOnly.toString(),
          so_only: soOnly.toString()
        });
        const res = await fetch(`/api/barang-jadi?${queryParams.toString()}`);
        if (res.ok && active) {
          const json = await res.json();
          if (json.success) {
            setData(prev => {
              const processData = (items: any[]) => (items || []).map((d: any) => {
                let parsed = {};
                if (d.raw_data) { try { parsed = JSON.parse(d.raw_data); } catch(e){} }
                return { ...d, ...parsed };
              });
              return processData(json.data);
            });
            setTotalCount(json.total || 0);
            if (json.scrapedPeriod) setScrapedPeriod(json.scrapedPeriod);
            if (json.lastUpdated) {
              const date = new Date(json.lastUpdated);
              setLastUpdated(formatLastUpdate(date));
              localStorage.setItem('BarangJadiClient_lastUpdated', date.toISOString());
            }
            setLoadTime(Math.round(performance.now() - startTimer));
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
  }, [page, debouncedQuery, refreshKey, startDate, endDate, isMounted, warningOnly, soOnly]);

  const [dialog, setDialog] = useState({ isOpen: false, type: 'success' as any, title: '', message: '' });

  const handleFetch = async () => {
    if (!startDate || !endDate) return;
    localStorage.setItem('barangJadiState', JSON.stringify({
      startDate: startDate.toISOString(), endDate: endDate.toISOString(), sessionDate: new Date().toLocaleDateString('en-CA')
    }));
    setLoading(true); setError(''); setData([]); setPage(1); setIsBatching(true); setBatchProgress(0); setSearchQuery('');
    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    let successCount = 0; let totalScraped = 0; let completedChunks = 0;
    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-barang-jadi?start=${chunk.start}&end=${chunk.end}&silent=true&metaStart=${startStr}&metaEnd=${endStr}`);
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
        persistScraperPeriod({ stateKey: 'barangJadiState', periodKey: 'BarangJadiClient_scrapedPeriod' }, startDate, endDate);
        persistScraperPeriodFull('last_scrape_barang_jadi_period', startDate, endDate);
        setRefreshKey(prev => prev + 1);
        localStorage.setItem('sintak_data_updated', Date.now().toString());
        fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action_type: 'SCRAPE', table_name: 'barang_jadi', message: `Scrape barang jadi berhasil: ${totalScraped} baris (${startStr} - ${endStr}).`, raw_data: JSON.stringify({ total: totalScraped, start: startStr, end: endStr }) }),
        }).catch(() => {});
        setDialog({ isOpen: true, type: 'success', title: 'Berhasil', message: `Berhasil menarik ${totalScraped} data Penerimaan Barang Hasil Produksi.` });
      }
    } finally {
      setIsBatching(false); setLoading(false);
    }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // No-op for pagination
  }, []);

  const columns = useMemo(() => [
    {
      id: 'no',
      header: 'No.',
      size: 60,
      cell: ({ row }: any) => <span className={`font-medium tabular-nums ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-400'}`}>{(page - 1) * PAGE_SIZE + row.index + 1}</span>
    },
    {
      accessorKey: 'faktur',
      header: 'Faktur',
      size: 180,
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight transition-colors ${row.getIsSelected() ? 'text-emerald-600' : 'text-gray-700'}`}>{String(getValue())}</span>
    },
    {
      accessorKey: 'tgl',
      header: 'Tanggal',
      size: 120,
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-700'}`}>{formatIndoDateStr(getValue() as string)}</span>
    },
    {
      accessorKey: 'faktur_prd',
      header: 'Faktur Prd',
      size: 200,
      cell: ({ getValue, row }: any) => <div className={`font-bold tracking-tight transition-colors truncate ${row.getIsSelected() ? 'text-emerald-600' : 'text-gray-500'}`} dangerouslySetInnerHTML={{ __html: String(getValue() || '–') }} />
    },
    {
      accessorKey: 'faktur_so',
      header: 'Faktur SO',
      size: 200,
      cell: ({ getValue, row }: any) => {
        const val = String(getValue() || '').replace(/<[^>]*>/g, '').trim();
        const hasValue = val && val !== '–' && val !== '-' && val !== '---';
        return (
          <div className="flex items-center justify-between group w-full pr-2">
             <div 
              className={`font-bold tracking-tight transition-colors truncate flex-1 ${row.getIsSelected() ? 'text-emerald-600' : 'text-gray-500'}`} 
              dangerouslySetInnerHTML={{ __html: String(getValue() || '–') }} 
            />
            {hasValue && (
              <div className="shrink-0 ml-2">
                <CopyButton text={val} />
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'kd_pelanggan',
      header: 'Pelanggan',
      size: 250,
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-emerald-900' : 'text-gray-800'}`}>{String(getValue())}</span>
    },
    {
      accessorKey: 'nama_barang',
      header: 'Nama Barang',
      size: 350,
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-emerald-900' : 'text-gray-800'}`}>{String(getValue())}</span>
    },
    {
      accessorKey: 'qty',
      header: 'Qty',
      size: 100,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-emerald-700' : 'text-slate-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
    },
    {
      accessorKey: 'satuan',
      header: 'Satuan',
      size: 100,
      cell: ({ getValue, row }: any) => <span className={`font-bold transition-colors ${row.getIsSelected() ? 'text-emerald-700' : 'text-slate-600'}`}>{String(getValue() || '—')}</span>
    },
    {
      accessorKey: 'hp',
      header: 'HPP Satuan',
      size: 130,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => (
        <div className={`flex items-center justify-between font-semibold tabular-nums transition-colors w-full ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-700'}`}>
          <span className={`text-[11px] opacity-40 ${row.getIsSelected() ? 'text-emerald-400' : 'text-gray-400'}`}>Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
        </div>
      )
    },
    {
      accessorKey: 'hp_total',
      header: 'HPP Total',
      size: 130,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => (
        <div className={`flex items-center justify-between font-semibold tabular-nums w-full ${row.getIsSelected() ? 'text-emerald-700' : 'text-emerald-700'}`}>
          <span className="text-[11px] opacity-40 mr-1">Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
        </div>
      )
    },
    {
      accessorKey: 'keterangan',
      header: 'Keterangan',
      size: 250,
      cell: ({ getValue, row }: any) => <span className={`font-medium transition-colors truncate block ${row.getIsSelected() ? 'text-emerald-800' : 'text-gray-700'}`}>{String(getValue() || '–')}</span>
    },
    {
      id: 'hp_barang_jadi',
      accessorKey: 'hp',
      header: () => <span className="text-orange-600">HP Barang Jadi</span>,
      size: 130,
      meta: { align: 'right', headerBg: '#fff7ed' },
      cell: ({ getValue, row }: any) => (
        <div className={`flex items-center justify-between font-semibold tabular-nums w-full ${row.getIsSelected() ? 'text-emerald-700' : 'text-orange-700'}`}>
          <span className="text-[11px] opacity-40 mr-1">Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
        </div>
      )
    },
    {
      accessorKey: 'hp_rata_rata',
      header: () => <span className="text-purple-600">HP Rata-rata</span>,
      size: 130,
      meta: { align: 'right', headerBg: '#faf5ff' },
      cell: ({ getValue, row }: any) => (
        <div className={`flex items-center justify-between font-semibold tabular-nums w-full ${row.getIsSelected() ? 'text-emerald-700' : 'text-purple-700'}`}>
          <span className="text-[11px] opacity-40 mr-1">Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
        </div>
      )
    },
    {
      accessorKey: 'harga_so_sales_order',
      header: () => <span className="text-blue-600">Harga SO (Sales Order)</span>,
      size: 170,
      meta: { align: 'right', headerBg: '#eff6ff' },
      cell: ({ getValue, row }: any) => {
        const val = Number(getValue() || 0);
        const fakturSo = String(row.original.faktur_so || '').trim();
        const hasNoSo = fakturSo === '' || fakturSo === '–' || fakturSo === '-';

        if (hasNoSo && val === 0) {
           return <span className="text-[11px] font-bold text-gray-300 italic">Tidak ada SO</span>;
        }

        return (
          <div className={`flex items-center justify-between font-semibold tabular-nums w-full ${row.getIsSelected() ? 'text-emerald-700' : 'text-blue-700'}`}>
            <span className="text-[11px] opacity-40 mr-1">Rp</span>
            <span>{val.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'harga_so_penjualan',
      header: () => <span className="text-teal-600">Harga SO (Penjualan)</span>,
      size: 170,
      meta: { align: 'right', headerBg: '#f0fdfa' },
      cell: ({ getValue, row }: any) => {
        const val = Number(getValue() || 0);
        if (val === 0) {
           return <span className="text-[11px] font-bold text-teal-400/60 italic leading-tight">Belum dilakukan transaksi Penjualan</span>;
        }
        return (
          <div className={`flex items-center justify-between font-semibold tabular-nums w-full ${row.getIsSelected() ? 'text-emerald-700' : 'text-teal-700'}`}>
            <span className="text-[11px] opacity-40 mr-1">Rp</span>
            <span>{val.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
          </div>
        );
      }
    },
    {
      id: 'analisa_harga',
      header: () => <span className="text-rose-600 font-bold">Analisa Harga</span>,
      size: 320,
      meta: { headerBg: '#fff1f2' },
      cell: ({ row }: any) => {
        const hp = Number(row.original.hp || 0);
        const hp_avg = Number(row.original.hp_rata_rata || 0);
        const so_ord = Number(row.original.harga_so_sales_order || 0);
        const so_penj = Number(row.original.harga_so_penjualan || 0);

        if (so_ord === 0 && so_penj === 0) {
          return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg text-[11px] font-bold w-fit shadow-sm">
              <AlertCircle size={12} />
              <span>SO Kosong</span>
            </div>
          );
        }

        const formatCurrency = (val: number) => {
          const absVal = Math.abs(val);
          return (val < 0 ? '-' : '+') + 'Rp' + absVal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        };

        const renderBadge = (label: string, diff: number, baseVal: number) => {
          const isLoss = diff < 0;
          let percentStr = "";
          if (baseVal > 0) {
            const pct = (Math.abs(diff) / baseVal) * 100;
            percentStr = `(${pct.toFixed(1)}%)`;
          }
          return (
            <div className={`px-2 py-0.5 rounded text-[11px] font-bold shadow-sm flex items-center justify-between border w-full ${isLoss ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'}`}>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11px]">{isLoss ? '⚠️' : '✅'}</span>
                <span>{label}</span>
              </div>
              <span className="font-mono tracking-tighter text-right">{formatCurrency(diff)} <span className="opacity-70 font-sans ml-0.5 text-[11px]">{percentStr}</span></span>
            </div>
          );
        };

        return (
          <div className="flex flex-col gap-1 py-1 w-[280px]">
            {so_ord > 0 && (
              <>
                {renderBadge("SO vs HP Barang Jadi", so_ord - hp, hp)}
                {renderBadge("SO vs HP Rata-rata", so_ord - hp_avg, hp_avg)}
              </>
            )}
            {so_penj > 0 && (
              <>
                {renderBadge("Jual vs HP Barang Jadi", so_penj - hp, hp)}
                {renderBadge("Jual vs HP Rata-rata", so_penj - hp_avg, hp_avg)}
              </>
            )}
          </div>
        );
      }
    }
  ], [page]);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      <DateRangeCard
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onFetch={handleFetch}
        isFetching={loading || isBatching}
        progress={isBatching ? batchProgress : undefined}
        statusText={isBatching ? batchStatus : undefined}
        fetchText="Tarik Data"
        fetchDisabled={!startDate || !endDate}
      />

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm shadow-red-900/5 text-sm font-bold flex items-start gap-3 animate-in fade-in shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-3 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <ScrapingHeader title="Hasil Scrapping Penerimaan Barang Hasil Produksi" lastUpdated={lastUpdated} scrapedPeriod={scrapedPeriod} />

            {loading && data && data.length > 0 && (
              <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm animate-pulse leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses Data...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1">
              <SearchAndReload searchQuery={searchQuery} setSearchQuery={setSearchQuery} onReload={() => setRefreshKey(prev => prev + 1)} loading={loading} placeholder="Cari ID, faktur, barang, atau produk..." />
            </div>
            <button
              onClick={() => setWarningOnly(!warningOnly)}
              className={`h-10 px-4 rounded-xl flex items-center gap-2 transition-all border shrink-0 shadow-sm ${warningOnly ? 'bg-red-500 text-white border-red-600 ring-2 ring-red-500/30 shadow-md font-bold' : 'bg-white text-red-500 border-red-200 hover:bg-red-50 font-medium'}`}
              title="Filter peringatan"
            >
              <span>⚠️</span>
              <span className="text-[13px] hidden sm:inline">Tampilkan Peringatan</span>
            </button>

            <button
              onClick={() => setSoOnly(!soOnly)}
              className={`h-10 px-4 rounded-xl flex items-center gap-2 transition-all border shrink-0 shadow-sm ${soOnly ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/30 shadow-md font-bold' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 font-medium'}`}
              title="Hanya tampilkan yang ada SO"
            >
              <span>📋</span>
              <span className="text-[13px] hidden sm:inline">Hanya Ada SO</span>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          <DataTable 
            columns={columns} 
            data={data || []} 
            isLoading={loading} 
            totalCount={totalCount} 
            selectedIds={selectedIds} 
            onRowClick={handleRowClick} 
            columnWidths={columnWidths} 
            onColumnWidthChange={setColumnWidths} 
            rowHeight="h-auto min-h-[48px] py-2" 
            getRowClassName={(row: any) => {
              const hp = Number(row.hp || 0);
              const hp_avg = Number(row.hp_rata_rata || 0);
              const so_ord = Number(row.harga_so_sales_order || 0);
              const so_penj = Number(row.harga_so_penjualan || 0);
              const hasWarning = (so_ord > 0 && (so_ord < hp || so_ord < hp_avg)) || (so_penj > 0 && (so_penj < hp || so_penj < hp_avg));
              return hasWarning ? 'bg-rose-50/60 hover:bg-rose-100/60 transition-colors' : '';
            }}
          />
        </div>

        <TableFooter 
          totalCount={totalCount} 
          currentCount={data?.length || 0} 
          label="Penerimaan Barang Hasil Produksi" 
          selectedCount={selectedIds.size} 
          onClearSelection={clearSelection} 
          loadTime={loadTime}
          page={page}
          totalPages={Math.ceil(totalCount / PAGE_SIZE)}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      <ConfirmDialog isOpen={dialog.isOpen} type={dialog.type as any} title={dialog.title} message={dialog.message} onConfirm={() => setDialog(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
}



