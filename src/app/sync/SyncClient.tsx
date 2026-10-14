'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Database, 
  Clock, 
  Search,
} from 'lucide-react';
import DateRangeCard from '@/components/DateRangeCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import TableFooter from '@/components/TableFooter';

import { formatLastUpdate } from '@/lib/date-utils';
import { formatScrapedPeriodDate, getDefaultScraperDateRange, persistScraperPeriod, hydrateScraperPeriod } from '@/lib/scraper-period';

interface ModuleItem {
  id: string;
  name: string;
  endpoint: string;
  description: string;
  noDateRange?: boolean;
  saldoTgl?: boolean;
  usrLogRange?: boolean;
}

interface ModuleGroup {
  group: string;
  modules: ModuleItem[];
}

interface FlattenedModule extends ModuleItem {
  groupName: string;
}

type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface ModuleSyncState {
  status: SyncStatus;
  lastUpdate: string | null;
  message: string | null;
  period?: { start: string; end: string } | null;
}

interface TableRowData extends FlattenedModule {
  sync: ModuleSyncState;
}

const MODULE_GROUPS: ModuleGroup[] = [
  {
    group: 'Stok',
    modules: [
      { id: 'master-barang', name: 'Master Barang', endpoint: '/api/scrape-master-barang', description: 'Data master barang stok', noDateRange: true },
      { id: 'saldo-barang', name: 'Saldo Barang', endpoint: '/api/scrape-saldo-barang', description: 'Posisi saldo & N persediaan (per tanggal akhir)', saldoTgl: true },
    ]
  },
  {
    group: 'Pembelian',
    modules: [
      { id: 'pr', name: 'Purchase Request (PR)', endpoint: '/api/scrape-pr', description: 'Permintaan pembelian bahan' },
      { id: 'spph-out', name: 'SPPH Keluar', endpoint: '/api/scrape-spph-out', description: 'Permintaan penawaran supplier' },
      { id: 'sph-in', name: 'SPH Masuk', endpoint: '/api/scrape-sph-in', description: 'Penawaran masuk dari supplier' },
      { id: 'purchase-orders', name: 'Purchase Order (PO)', endpoint: '/api/scrape-purchase-orders', description: 'Pesanan resmi ke supplier' },
      { id: 'penerimaan-pembelian', name: 'Penerimaan Barang', endpoint: '/api/scrape-penerimaan-pembelian', description: 'Logistik barang masuk' },
      { id: 'rekap-pembelian-barang', name: 'Laporan Rekap Pembelian Barang', endpoint: '/api/scrape-rekap-pembelian-barang', description: 'Faktur pembelian barang' },
      { id: 'pelunasan-hutang', name: 'Pelunasan Hutang', endpoint: '/api/scrape-pelunasan-hutang', description: 'Pembayaran ke supplier' },
    ]
  },
  {
    group: 'Produksi',
    modules: [
      { id: 'bom', name: 'Bill of Material Produksi', endpoint: '/api/scrape-bom', description: 'Data formula produksi' },
      { id: 'orders', name: 'Order Produksi', endpoint: '/api/scrape-orders', description: 'Surat Perintah Kerja' },
      { id: 'produksi-selesai', name: 'Produksi Selesai', endpoint: '/api/scrape-produksi-selesai', description: 'Laporan produksi selesai' },
      { id: 'bahan-baku', name: 'BBB Produksi', endpoint: '/api/scrape-bahan-baku', description: 'Pengeluaran bahan produksi' },
      { id: 'barang-jadi', name: 'Penerimaan Hasil Produksi', endpoint: '/api/scrape-barang-jadi', description: 'Stok produk siap kirim' },
    ]
  },
  {
    group: 'Penjualan',
    modules: [
      { id: 'sph-out', name: 'SPH Keluar', endpoint: '/api/scrape-sph-out', description: 'Surat Penawaran Harga Keluar' },
      { id: 'sales-orders', name: 'Sales Order Barang', endpoint: '/api/scrape-sales-orders', description: 'Pesanan dari pelanggan' },
      { id: 'sales', name: 'Laporan Penjualan', endpoint: '/api/scrape-sales', description: 'Faktur penjualan barang' },
      { id: 'pelunasan-piutang', name: 'Pelunasan Piutang Penjualan', endpoint: '/api/scrape-pelunasan-piutang', description: 'Penerimaan dari pelanggan' },
      { id: 'pengiriman', name: 'Pengiriman', endpoint: '/api/scrape-pengiriman', description: 'Logistik barang keluar' },
    ]
  },
  {
    group: 'Akuntansi & Keuangan',
    modules: [
      { id: 'rek-akuntansi', name: 'Rekening Akuntansi', endpoint: '/api/scrape-rek-akuntansi', description: 'Master rekening akuntansi', noDateRange: true },
      { id: 'jurnal-umum', name: 'Jurnal Umum', endpoint: '/api/scrape-jurnal-umum', description: 'Transaksi jurnal akuntansi' },
    ]
  },
  {
    group: 'Sistem',
    modules: [
      { id: 'usr-log', name: 'Log Aktivitas User', endpoint: '/api/scrape-usr-log', description: 'Audit trail aktivitas user Digit', usrLogRange: true },
    ]
  },
];

const MODULES: FlattenedModule[] = MODULE_GROUPS.flatMap(g => 
  g.modules.map(m => ({ ...m, groupName: g.group }))
);

const PERSISTENCE_KEYS: Record<string, { stateKey: string; periodKey: string }> = {
  'master-barang': { stateKey: 'masterBarangState', periodKey: 'MasterBarangClient_scrapedPeriod' },
  'saldo-barang': { stateKey: 'saldoBarangState', periodKey: 'SaldoBarangClient_scrapedPeriod' },
  'usr-log': { stateKey: 'usrLogState', periodKey: 'UsrLog_scrapedPeriod' },
  'bom': { stateKey: 'bomReportState', periodKey: 'BOMClient_scrapedPeriod' },
  'sph-out': { stateKey: 'sphOutState', periodKey: 'SphOutClient_scrapedPeriod' },
  'sales-orders': { stateKey: 'salesOrderState', periodKey: 'SalesOrderClient_scrapedPeriod' },
  'orders': { stateKey: 'orderProduksiState', periodKey: 'OrderProduksiClient_scrapedPeriod' },
  'produksi-selesai': { stateKey: 'produksiSelesaiState', periodKey: 'ProduksiSelesaiClient_scrapedPeriod' },
  'pr': { stateKey: 'prReportState', periodKey: 'PRClient_scrapedPeriod' },
  'spph-out': { stateKey: 'spphOutState', periodKey: 'SpphOutClient_scrapedPeriod' },
  'sph-in': { stateKey: 'sphInState', periodKey: 'SphInClient_scrapedPeriod' },
  'purchase-orders': { stateKey: 'purchaseOrderState', periodKey: 'PurchaseOrderClient_scrapedPeriod' },
  'penerimaan-pembelian': { stateKey: 'penerimaanPembelianState', periodKey: 'PenerimaanPembelianClient_scrapedPeriod' },
  'rekap-pembelian-barang': { stateKey: 'rekapPembelianBarangState', periodKey: 'RekapPembelianBarangClient_scrapedPeriod' },
  'pelunasan-hutang': { stateKey: 'pelunasanHutangState', periodKey: 'PelunasanHutangClient_scrapedPeriod' },
  'bahan-baku': { stateKey: 'bahanBakuState', periodKey: 'BahanBakuClient_scrapedPeriod' },
  'barang-jadi': { stateKey: 'barangJadiState', periodKey: 'BarangJadiClient_scrapedPeriod' },
  'sales': { stateKey: 'salesReportState', periodKey: 'SalesReportClient_scrapedPeriod' },
  'pengiriman': { stateKey: 'pengirimanState', periodKey: 'PengirimanClient_scrapedPeriod' },
  'pelunasan-piutang': { stateKey: 'pelunasanPiutangState', periodKey: 'PelunasanPiutangClient_scrapedPeriod' },
  'jurnal-umum': { stateKey: 'jurnalUmumState', periodKey: 'JurnalUmumClient_scrapedPeriod' },
};

const SYNC_TO_PERM_MAP: Record<string, string> = {
  'master-barang': 'stok_master_barang',
  'saldo-barang': 'stok_saldo_barang',
  'usr-log': 'usr_log_view',
  'pr': 'pembelian_pr',
  'spph-out': 'pembelian_spph',
  'sph-in': 'pembelian_sph_in',
  'purchase-orders': 'pembelian_po',
  'penerimaan-pembelian': 'pembelian_penerimaan',
  'rekap-pembelian-barang': 'pembelian_rekap',
  'pelunasan-hutang': 'pembelian_hutang',
  'bom': 'produksi_bom',
  'orders': 'produksi_orders',
  'produksi-selesai': 'produksi_selesai',
  'bahan-baku': 'produksi_bahan_baku',
  'barang-jadi': 'produksi_barang_jadi',
  'sph-out': 'penjualan_sph_out',
  'sales-orders': 'penjualan_so',
  'sales': 'penjualan_laporan',
  'pengiriman': 'penjualan_pengiriman',
  'pelunasan-piutang': 'penjualan_piutang',
  'jurnal-umum': 'akt_jurnal_umum',
  'rek-akuntansi': 'akt_mrek',
};

export default function SyncClient({ userPermissions = {} }: { userPermissions?: Record<string, boolean> }) {
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
  
  const [syncStates, setSyncStates] = useState<Record<string, ModuleSyncState>>(() =>
    MODULES.reduce((acc, mod) => ({
      ...acc,
      [mod.id]: { status: 'idle', lastUpdate: null, message: null, period: null }
    }), {})
  );

  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number; currentModName?: string } | null>(null);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('all');

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => ({
    modul: 300,
    kategori: 130,
    status: 220,
    lastUpdate: 170,
    period: 190,
    action: 100,
  }));

  // Hydrate global date picker on mount
  useEffect(() => {
    const defaultKeys = PERSISTENCE_KEYS['bom'];
    if (defaultKeys) {
      const hydrated = hydrateScraperPeriod(defaultKeys);
      if (hydrated.startDate) setStartDate(hydrated.startDate);
      if (hydrated.endDate) setEndDate(hydrated.endDate);
    }
  }, []);

  // Restore sync status on mount directly from server
  useEffect(() => {
    async function restoreStatus() {
      try {
        const response = await fetch('/api/sync-status');
        const data = (await response.json()) as {
          success?: boolean;
          statuses?: Record<string, string>;
          periods?: Record<string, { start?: string; end?: string }>;
        };
        
        if (data.success && data.statuses) {
          setSyncStates(prev => {
            const newState = { ...prev };
            for (const modId of Object.keys(newState)) {
              const lastUpdatedTimestamp = data.statuses?.[modId];
              const apiPeriod = data.periods?.[modId];
              
              let period: { start: string; end: string } | null = null;
              
              if (apiPeriod && apiPeriod.start && apiPeriod.end) {
                period = {
                  start: apiPeriod.start,
                  end: apiPeriod.end
                };
              } else {
                const keys = PERSISTENCE_KEYS[modId];
                if (keys) {
                  const hydrated = hydrateScraperPeriod(keys);
                  if (hydrated.scrapedPeriod) {
                    period = {
                      start: hydrated.scrapedPeriod.start,
                      end: hydrated.scrapedPeriod.end
                    };
                  }
                }
              }

              if (lastUpdatedTimestamp) {
                const date = new Date(String(lastUpdatedTimestamp).split('|')[0]);
                const formattedNow = formatLastUpdate(date);

                newState[modId] = {
                  ...newState[modId],
                  status: 'success',
                  lastUpdate: formattedNow,
                  period: period
                };
              }
            }
            return newState;
          });
        }
      } catch (err) {
        console.error("Failed to restore sync status:", err);
      }
    }
    restoreStatus();
  }, []);

  const runSync = useCallback(async (modId: string) => {
    const mod = MODULES.find(m => m.id === modId);
    if (!mod) return { success: false, count: 0 };

    setCurrentModuleId(modId);
    setSyncStates(prev => ({
      ...prev,
      [modId]: { ...prev[modId], status: 'loading', message: 'Menghubungkan ke server...' }
    }));

    try {
      const pad2 = (n: number) => String(n).padStart(2, '0');
      const startStr = `${startDate.getFullYear()}-${pad2(startDate.getMonth() + 1)}-${pad2(startDate.getDate())}`;
      const endStr = `${endDate.getFullYear()}-${pad2(endDate.getMonth() + 1)}-${pad2(endDate.getDate())}`;
      const url = mod.noDateRange
        ? mod.endpoint
        : mod.saldoTgl
          ? `${mod.endpoint}?tgl=${endStr}`
          : mod.usrLogRange
            ? `${mod.endpoint}?stgl_awal=${startStr.split('-').reverse().join('-')}&stgl_akhir=${endStr.split('-').reverse().join('-')}`
            : `${mod.endpoint}?start=${startStr}&end=${endStr}&metaStart=${startStr}&metaEnd=${endStr}`;

      const response = await fetch(url, { method: 'GET', cache: 'no-store' });
      const data = await response.json();

      if (data.success || !data.error) {
        const now = new Date();
        const formattedNow = formatLastUpdate(now);

        const keys = PERSISTENCE_KEYS[modId];
        if (keys && !mod.noDateRange) {
          persistScraperPeriod(keys, startDate, endDate);
        }

        localStorage.setItem('sintak_data_updated', Date.now().toString());
        localStorage.setItem('sintak_profile_updated', Date.now().toString());

        const processedCount = data.total || data.count || data.processed || 0;

        setSyncStates(prev => ({
          ...prev,
          [modId]: { 
            status: 'success', 
            lastUpdate: formattedNow, 
            period: mod.noDateRange ? null : { 
              start: startDate.toLocaleDateString('en-GB').replace(/\//g, '-'), 
              end: endDate.toLocaleDateString('en-GB').replace(/\//g, '-') 
            },
            message: `${processedCount.toLocaleString('id-ID')} baris ditarik` 
          }
        }));

        return { success: true, count: processedCount };
      } else {
        throw new Error(data.error || 'Server returned error status');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal sinkronisasi';
      setSyncStates(prev => ({
        ...prev,
        [modId]: { ...prev[modId], status: 'error', message: errorMsg }
      }));
      return { success: false, count: 0 };
    } finally {
      setCurrentModuleId(null);
    }
  }, [startDate, endDate]);

  const runBatchSync = async () => {
    if (isBatchProcessing) return;
    setIsBatchProcessing(true);

    const allowedMods = MODULES.filter(mod => {
      const pKey = SYNC_TO_PERM_MAP[mod.id];
      return !pKey || userPermissions[pKey] !== false;
    });

    setBatchProgress({ done: 0, total: allowedMods.length });

    setSyncStates(prev => {
      const next = { ...prev };
      for (const mod of allowedMods) {
        next[mod.id] = { ...prev[mod.id], status: 'loading', message: 'Menunggu giliran...' };
      }
      return next;
    });

    let totalSuccessCount = 0;
    let totalModulesSuccess = 0;
    let doneCount = 0;

    const CONCURRENCY = 4;
    for (let i = 0; i < allowedMods.length; i += CONCURRENCY) {
      const batch = allowedMods.slice(i, i + CONCURRENCY);

      setBatchProgress({
        done: doneCount,
        total: allowedMods.length,
        currentModName: batch.map(b => b.name).join(', ')
      });

      setSyncStates(prev => {
        const next = { ...prev };
        for (const mod of batch) {
          next[mod.id] = { ...prev[mod.id], status: 'loading', message: 'Sedang diproses...' };
        }
        return next;
      });

      const results = await Promise.all(batch.map(mod => runSync(mod.id)));
      for (const result of results) {
        if (result.success) {
          totalSuccessCount += result.count;
          totalModulesSuccess++;
        }
      }
      doneCount += batch.length;
      setBatchProgress({ done: Math.min(doneCount, allowedMods.length), total: allowedMods.length });
    }

    setCurrentModuleId(null);
    setIsBatchProcessing(false);
    setBatchProgress(null);

    setDialog({
      isOpen: true,
      title: 'Sinkronisasi Selesai',
      message: `Berhasil menarik total ${totalSuccessCount.toLocaleString('id-ID')} data dari ${totalModulesSuccess} modul.`
    });
  };

  const permittedModules = useMemo(() => {
    return MODULES.filter(mod => {
      const pKey = SYNC_TO_PERM_MAP[mod.id];
      return !pKey || userPermissions[pKey] !== false;
    });
  }, [userPermissions]);

  const filteredModules = useMemo(() => {
    return permittedModules.filter(mod => {
      const matchGroup = activeGroup === 'all' || mod.groupName === activeGroup;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = !q || mod.name.toLowerCase().includes(q) || mod.description.toLowerCase().includes(q) || mod.groupName.toLowerCase().includes(q);
      return matchGroup && matchQuery;
    });
  }, [permittedModules, activeGroup, searchQuery]);

  // Embed syncStates directly into table row data to guarantee TanStack reactivity
  const tableData = useMemo<TableRowData[]>(() => {
    return filteredModules.map(mod => ({
      ...mod,
      sync: syncStates[mod.id] ?? { status: 'idle', lastUpdate: null, message: null, period: null },
    }));
  }, [filteredModules, syncStates]);

  const stats = useMemo(() => {
    let success = 0;
    let error = 0;
    permittedModules.forEach(mod => {
      const st = syncStates[mod.id]?.status;
      if (st === 'success') success++;
      else if (st === 'error') error++;
    });
    return { success, error, total: permittedModules.length };
  }, [permittedModules, syncStates]);

  const columns = useMemo<ColumnDef<TableRowData>[]>(() => [
    {
      accessorKey: 'name',
      id: 'modul',
      header: 'Modul Operasional',
      size: 300,
      cell: ({ row }) => {
        const mod = row.original;
        return (
          <div className="flex flex-col min-w-0 py-0.5">
            <span className="font-bold text-gray-800 text-[12px] leading-tight block truncate" title={mod.name}>
              {mod.name}
            </span>
            <span className="text-[11px] text-gray-400 font-medium leading-tight truncate mt-0.5" title={mod.description}>
              {mod.description}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'groupName',
      id: 'kategori',
      header: 'Kategori',
      size: 130,
      cell: ({ getValue }) => {
        const val = String(getValue() ?? '');
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {val}
          </span>
        );
      }
    },
    {
      id: 'status',
      header: 'Status Sinkronisasi',
      size: 220,
      cell: ({ row }) => {
        const mod = row.original;
        const state = row.original.sync;
        const isLoading = state?.status === 'loading' || currentModuleId === mod.id;
        const isSuccess = state?.status === 'success';
        const isError = state?.status === 'error';

        if (isLoading) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
              <Loader2 size={12} className="animate-spin text-amber-600" />
              <span>{state?.message || 'Sedang proses...'}</span>
            </span>
          );
        }
        if (isSuccess) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>{state?.message || 'Sinkron'}</span>
            </span>
          );
        }
        if (isError) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold" title={state?.message || ''}>
              <AlertCircle size={12} className="text-rose-600" />
              <span className="truncate max-w-[150px]">{state?.message || 'Gagal'}</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 text-[11px] font-bold">
            <Database size={12} className="text-slate-400" />
            <span>Belum sinkron</span>
          </span>
        );
      }
    },
    {
      id: 'lastUpdate',
      header: 'Terakhir Sinkron',
      size: 170,
      cell: ({ row }) => {
        const state = row.original.sync;
        return (
          <div className="flex items-center gap-1.5 text-gray-600 font-medium text-[11px]">
            <Clock size={12} className="text-gray-400 shrink-0" />
            <span>{state?.lastUpdate || 'Belum pernah'}</span>
          </div>
        );
      }
    },
    {
      id: 'period',
      header: 'Rentang Scrape',
      size: 190,
      cell: ({ row }) => {
        const mod = row.original;
        const state = row.original.sync;
        if (mod.noDateRange) {
          return (
            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
              Semua Data
            </span>
          );
        }
        if (state?.period?.start && state?.period?.end) {
          return (
            <span className="text-gray-600 font-medium text-[11px]">
              {formatScrapedPeriodDate(state.period.start)} - {formatScrapedPeriodDate(state.period.end)}
            </span>
          );
        }
        if (mod.saldoTgl) {
          return <span className="text-gray-400 text-[11px]">Posisi akhir cutoff</span>;
        }
        return <span className="text-gray-400 text-[11px]">-</span>;
      }
    },
    {
      id: 'action',
      header: 'Aksi',
      size: 100,
      cell: ({ row }) => {
        const mod = row.original;
        const state = row.original.sync;
        const isLoading = state?.status === 'loading' || currentModuleId === mod.id;
        return (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => runSync(mod.id)}
              disabled={isBatchProcessing || isLoading}
              className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin text-emerald-600' : ''} />
              <span>Sync</span>
            </button>
          </div>
        );
      }
    }
  ], [currentModuleId, isBatchProcessing, runSync]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      
      {/* 1. DateRangeCard Baku SINTAK (Atas) */}
      <DateRangeCard
        title="Rentang Tanggal"
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onFetch={runBatchSync}
        isFetching={isBatchProcessing}
        progress={batchProgress ? Math.round((batchProgress.done / batchProgress.total) * 100) : undefined}
        statusText={batchProgress?.currentModName ? `Aktif: ${batchProgress.currentModName}` : undefined}
        fetchText="Scrape Semua Modul"
      />

      {/* 2. Main Area: Category Filter Tabs + Search Bar + DataTable + TableFooter */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-3 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px] flex-wrap">
            {/* Category Navigation Tabs (Pill Filters SINTAK) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
              <button
                type="button"
                onClick={() => setActiveGroup('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeGroup === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                Semua ({permittedModules.length})
              </button>
              {MODULE_GROUPS.map(g => {
                const count = permittedModules.filter(m => m.groupName === g.group).length;
                if (count === 0) return null;
                const isActive = activeGroup === g.group;
                return (
                  <button
                    key={g.group}
                    type="button"
                    onClick={() => setActiveGroup(g.group)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span>{g.group}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] font-bold text-gray-400 shrink-0">
              <span className="text-emerald-600 mr-2">{stats.success} Siap</span>
              {stats.error > 0 && <span className="text-rose-600 mr-2">{stats.error} Gagal</span>}
              <span>Total {stats.total} Modul</span>
            </div>
          </div>

          {/* Search Bar Standar SINTAK */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama modul, deskripsi, atau kategori…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-9 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* DataTable & TableFooter Baku */}
        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden relative">
          <DataTable
            columns={columns}
            data={tableData}
            isLoading={false}
            columnWidths={columnWidths}
            onColumnWidthChange={setColumnWidths}
            rowHeight="h-11"
          />
          <TableFooter
            totalCount={permittedModules.length}
            currentCount={tableData.length}
            label="Modul"
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        type="success"
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog({ ...dialog, isOpen: false })}
      />
    </div>
  );
}
