'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Database, 
  Clock, 
  ShieldCheck,
  Search,
  Check,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';

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
   color: string;
   badgeClass: string;
   modules: ModuleItem[];
 }
 
 interface FlattenedModule extends ModuleItem {
   groupName: string;
   badgeClass: string;
 }
 
 const MODULE_GROUPS: ModuleGroup[] = [
  {
    group: 'Stok',
    color: 'indigo',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    modules: [
      { id: 'master-barang', name: 'Master Barang', endpoint: '/api/scrape-master-barang', description: 'Data master barang stok', noDateRange: true },
      { id: 'saldo-barang', name: 'Saldo Barang', endpoint: '/api/scrape-saldo-barang', description: 'Posisi saldo & N persediaan (per tanggal akhir)', saldoTgl: true },
    ]
  },
  {
    group: 'Pembelian',
    color: 'blue',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
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
    color: 'green',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
    color: 'purple',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
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
    color: 'amber',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    modules: [
      { id: 'rek-akuntansi', name: 'Rekening Akuntansi', endpoint: '/api/scrape-rek-akuntansi', description: 'Master rekening akuntansi', noDateRange: true },
      { id: 'jurnal-umum', name: 'Jurnal Umum', endpoint: '/api/scrape-jurnal-umum', description: 'Transaksi jurnal akuntansi' },
    ]
  },
  {
    group: 'Sistem',
    color: 'slate',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    modules: [
      { id: 'usr-log', name: 'Log Aktivitas User', endpoint: '/api/scrape-usr-log', description: 'Audit trail aktivitas user Digit', usrLogRange: true },
    ]
  },
];

// Flat list for processing and mapping
 const MODULES: FlattenedModule[] = MODULE_GROUPS.flatMap(g => 
   g.modules.map(m => ({ ...m, groupName: g.group, badgeClass: g.badgeClass }))
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

type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface ModuleSyncState {
  status: SyncStatus;
  lastUpdate: string | null;
  message: string | null;
  period?: { start: string; end: string } | null;
}

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
  
  const [syncStates, setSyncStates] = useState<Record<string, ModuleSyncState>>(
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

  // Hydrate global date picker on mount
  useEffect(() => {
    const defaultKeys = PERSISTENCE_KEYS['bom'];
    if (defaultKeys) {
      const hydrated = hydrateScraperPeriod(defaultKeys);
      if (hydrated.startDate) setStartDate(hydrated.startDate);
      if (hydrated.endDate) setEndDate(hydrated.endDate);
    }
  }, []);

  // Restore sync status on mount
  useEffect(() => {
    async function restoreStatus() {
      try {
        const response = await fetch('/api/sync-status');
        const data = await response.json();
        
        if (data.success && data.statuses) {
          setSyncStates(prev => {
            const newState = { ...prev };
            for (const modId of Object.keys(newState)) {
              const lastUpdatedTimestamp = data.statuses[modId];
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

    // Filter only permitted modules
    const allowedMods = MODULES.filter(mod => {
      const pKey = SYNC_TO_PERM_MAP[mod.id];
      return !pKey || userPermissions[pKey] !== false;
    });

    setBatchProgress({ done: 0, total: allowedMods.length });

    // Set all permitted modules to loading state immediately
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

    // Process in parallel batches of 4 (avoids overloading MDT host)
    const CONCURRENCY = 4;
    for (let i = 0; i < allowedMods.length; i += CONCURRENCY) {
      const batch = allowedMods.slice(i, i + CONCURRENCY);

      setBatchProgress({
        done: doneCount,
        total: allowedMods.length,
        currentModName: batch.map(b => b.name).join(', ')
      });

      // Mark batch as active
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

  // Filter modules by permissions, group, and search query
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

  // Status counts for summary chips
  const stats = useMemo(() => {
    let success = 0;
    let error = 0;
    let idle = 0;
    permittedModules.forEach(mod => {
      const st = syncStates[mod.id]?.status;
      if (st === 'success') success++;
      else if (st === 'error') error++;
      else idle++;
    });
    return { success, error, idle, total: permittedModules.length };
  }, [permittedModules, syncStates]);

  return (
    <div className="w-full flex-1 min-h-0 overflow-hidden flex flex-col gap-3 animate-in fade-in duration-300">
      
      {/* Top Toolbar: Date Range + Search + Batch Button */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:px-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Calendar size={13} className="text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500 mr-1">Rentang:</span>
            <DatePicker name="startDate" value={startDate} onChange={setStartDate} />
            <span className="text-slate-300 font-bold px-0.5">-</span>
            <DatePicker name="endDate" value={endDate} onChange={setEndDate} />
          </div>

          <div className="relative w-48 sm:w-60">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari modul operasional..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 justify-end">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold mr-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {stats.success} Siap
            </span>
            {stats.error > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {stats.error} Gagal
              </span>
            )}
            <span className="text-slate-400">
              Total {stats.total} Modul
            </span>
          </div>

          <button
            onClick={runBatchSync}
            disabled={isBatchProcessing}
            className="flex items-center justify-center gap-2 px-5 h-9 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[12px] font-bold rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
          >
            {isBatchProcessing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            <span>{isBatchProcessing ? 'Menjalankan Batch...' : 'Scrape Semua Modul'}</span>
          </button>
        </div>
      </div>

      {/* Progress Notification Bar (Active during batch sync) */}
      {batchProgress && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 shrink-0 flex flex-col gap-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
            <span className="flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-emerald-600" />
              <span>Memproses batch: {batchProgress.done} dari {batchProgress.total} modul selesai</span>
            </span>
            <span className="font-mono text-emerald-700">
              {Math.round((batchProgress.done / batchProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(batchProgress.done / batchProgress.total) * 100}%` }}
            />
          </div>
          {batchProgress.currentModName && (
            <p className="text-[11px] text-emerald-700 font-medium truncate">
              Aktif: {batchProgress.currentModName}
            </p>
          )}
        </div>
      )}

      {/* Group Navigation Tabs (Pill Filters) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
        <button
          onClick={() => setActiveGroup('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeGroup === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
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
              onClick={() => setActiveGroup(g.group)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span>{g.group}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Table View: Compact, High-Density, Non-Card */}
      <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 w-[280px]">Modul Operasional</th>
                <th className="py-3 px-4 w-[130px]">Kategori</th>
                <th className="py-3 px-4 w-[200px]">Status Sinkronisasi</th>
                <th className="py-3 px-4 w-[180px]">Terakhir Sinkron</th>
                <th className="py-3 px-4 w-[200px]">Rentang Data</th>
                <th className="py-3 px-4 w-[120px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredModules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada modul yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredModules.map((mod) => {
                  const state = syncStates[mod.id];
                  const isLoading = state?.status === 'loading' || currentModuleId === mod.id;
                  const isSuccess = state?.status === 'success';
                  const isError = state?.status === 'error';

                  return (
                    <tr 
                      key={mod.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isLoading ? 'bg-emerald-50/40' : ''}`}
                    >
                      {/* Modul Operasional */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-800 text-[12px] leading-tight">
                            {mod.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5 truncate max-w-[260px]">
                            {mod.description}
                          </span>
                        </div>
                      </td>

                      {/* Kategori Group */}
                      <td className="py-3 px-4">
                        <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${mod.badgeClass}`}>
                          {mod.groupName}
                        </span>
                      </td>

                      {/* Status Sinkronisasi */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          {isLoading ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold w-fit">
                              <Loader2 size={12} className="animate-spin text-amber-600" />
                              <span>{state?.message || 'Memproses...'}</span>
                            </div>
                          ) : isSuccess ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold w-fit">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>{state?.message || 'Sinkron'}</span>
                            </div>
                          ) : isError ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold w-fit" title={state?.message || ''}>
                              <AlertCircle size={12} className="text-rose-600" />
                              <span className="truncate max-w-[150px]">{state?.message || 'Gagal'}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 text-[11px] font-bold w-fit">
                              <Database size={12} className="text-slate-400" />
                              <span>Belum sinkron</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Terakhir Sinkron */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          <span className="text-[11px]">{state?.lastUpdate || 'Belum pernah'}</span>
                        </div>
                      </td>

                      {/* Rentang Data */}
                      <td className="py-3 px-4">
                        {mod.noDateRange ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                            Semua Data
                          </span>
                        ) : state?.period ? (
                          <span className="text-slate-600 font-medium text-[11px]">
                            {formatScrapedPeriodDate(state.period.start)} - {formatScrapedPeriodDate(state.period.end)}
                          </span>
                        ) : mod.saldoTgl ? (
                          <span className="text-slate-400 text-[11px]">Posisi akhir cutoff</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Aksi Per Baris */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => runSync(mod.id)}
                          disabled={isBatchProcessing || isLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-slate-700 font-bold text-[11px] transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
                          <span>Sinkron</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info strip */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>Batch sinkronisasi otomatis membatasi 4 modul paralel untuk menjaga stabilitas host Digit.</span>
          </div>
          <span className="font-bold text-slate-600">
            Menampilkan {filteredModules.length} dari {permittedModules.length} modul
          </span>
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
