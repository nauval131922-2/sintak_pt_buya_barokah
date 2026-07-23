'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Database, 
  Clock, 
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import DateRangeCard from '@/components/DateRangeCard';

import { formatLastUpdate } from '@/lib/date-utils';
import { formatScrapedPeriodDate, getDefaultScraperDateRange, persistScraperPeriod, hydrateScraperPeriod } from '@/lib/scraper-period';

const MODULE_GROUPS = [
  {
    group: 'Stok',
    color: 'indigo',
    modules: [
      { id: 'master-barang', name: 'Master Barang', endpoint: '/api/scrape-master-barang', description: 'Data master barang stok', noDateRange: true },
    ]
  },
  {
    group: 'Pembelian',
    color: 'blue',
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
    modules: [
      { id: 'bom', name: 'Bill of Material Produksi', endpoint: '/api/scrape-bom', description: 'Data formula produksi' },
      { id: 'orders', name: 'Order Produksi', endpoint: '/api/scrape-orders', description: 'Surat Perintah Kerja' },
      { id: 'produksi-selesai', name: 'Produksi Selesai', endpoint: '/api/scrape-produksi-selesai', description: 'Laporan produksi selesai' },
      { id: 'bahan-baku', name: 'BBB Produksi', endpoint: '/api/scrape-bahan-baku', description: 'Pengeluaran bahan produksi' },
      { id: 'barang-jadi', name: 'Penerimaan Barang Hasil Produksi', endpoint: '/api/scrape-barang-jadi', description: 'Stok produk siap kirim' },
    ]
  },
  {
    group: 'Penjualan',
    color: 'purple',
    modules: [
      { id: 'sph-out', name: 'SPH Keluar', endpoint: '/api/scrape-sph-out', description: 'Surat Penawaran Harga Keluar' },
      { id: 'sales-orders', name: 'Sales Order Barang', endpoint: '/api/scrape-sales-orders', description: 'Pesanan dari pelanggan' },
      { id: 'sales', name: 'Laporan Penjualan', endpoint: '/api/scrape-sales', description: 'Faktur penjualan barang' },
      { id: 'pengiriman', name: 'Pengiriman', endpoint: '/api/scrape-pengiriman', description: 'Logistik barang keluar' },
      { id: 'pelunasan-piutang', name: 'Pelunasan Piutang Penjualan', endpoint: '/api/scrape-pelunasan-piutang', description: 'Penerimaan dari pelanggan' },
    ]
  },
  {
    group: 'Akuntansi & Keuangan',
    color: 'amber',
    modules: [
      { id: 'rek-akuntansi', name: 'Rekening Akuntansi', endpoint: '/api/scrape-rek-akuntansi', description: 'Master rekening akuntansi', noDateRange: true },
      { id: 'jurnal-umum', name: 'Jurnal Umum', endpoint: '/api/scrape-jurnal-umum', description: 'Transaksi jurnal akuntansi' },
    ]
  },
];

// Flat list for batch processing
const MODULES = MODULE_GROUPS.flatMap(g => g.modules);

const PERSISTENCE_KEYS: Record<string, { stateKey: string; periodKey: string }> = {
  'master-barang': { stateKey: 'masterBarangState', periodKey: 'MasterBarangClient_scrapedPeriod' },
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
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '' });

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
              
              // Hydrate period from API first, then fall back to individual module's localStorage
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
                const date = new Date(lastUpdatedTimestamp);
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

    setSyncStates(prev => ({
      ...prev,
      [modId]: { ...prev[modId], status: 'loading', message: 'Menghubungkan ke server...' }
    }));

    try {
      const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const startStr = formatDate(startDate);
      const endStr = formatDate(endDate);
      const url = (mod as any).noDateRange
        ? `${mod.endpoint}`
        : `${mod.endpoint}?start=${startStr}&end=${endStr}&metaStart=${startStr}&metaEnd=${endStr}`;

      const response = await fetch(url, { method: 'GET', cache: 'no-store' });
      const data = await response.json();

      if (data.success || !data.error) {
        const now = new Date();
        const formattedNow = formatLastUpdate(now);

        const keys = PERSISTENCE_KEYS[modId];
        if (keys && !(mod as any).noDateRange) {
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
            period: (mod as any).noDateRange ? null : { 
              start: startDate.toLocaleDateString('en-GB').replace(/\//g, '-'), 
              end: endDate.toLocaleDateString('en-GB').replace(/\//g, '-') 
            },
            message: `Berhasil menarik ${processedCount} data.` 
          }
        }));

        return { success: true, count: processedCount };
      } else {
        throw new Error(data.error || 'Server returned error status');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Gagal sinkronasi';
      setSyncStates(prev => ({
        ...prev,
        [modId]: { ...prev[modId], status: 'error', message: errorMsg }
      }));
      return { success: false, count: 0 };
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

    // Process in parallel batches of 4 (avoids overloading MDT host)
    const CONCURRENCY = 4;
    for (let i = 0; i < allowedMods.length; i += CONCURRENCY) {
      const batch = allowedMods.slice(i, i + CONCURRENCY);

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
    }

    setCurrentModuleId(null);
    setIsBatchProcessing(false);

    setDialog({
      isOpen: true,
      title: 'Berhasil',
      message: `Berhasil menarik total ${totalSuccessCount.toLocaleString('id-ID')} data dari ${totalModulesSuccess} modul.`
    });
  };

  return (
    <div className="w-full flex-1 min-h-0 overflow-hidden flex flex-col gap-3 animate-in fade-in duration-500">
      {/* Control Bar */}
      <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-gray-900/5 p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <DatePicker name="startDate" value={startDate} onChange={setStartDate} />
          <div className="w-2 h-px bg-gray-300 shrink-0"></div>
          <DatePicker name="endDate" value={endDate} onChange={setEndDate} popupAlign="right" />
        </div>
        
        <div className="hidden sm:block w-px h-8 bg-gray-200/60"></div>
        
        <button
          onClick={runBatchSync}
          disabled={isBatchProcessing}
          className="flex items-center justify-center gap-2 px-5 h-8 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded-xl transition-colors shadow-sm"
        >
          {isBatchProcessing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          <span>{isBatchProcessing ? 'Memproses...' : 'Scrape Semua Modul'}</span>
        </button>
      </div>

      {/* Grouped Modules */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 pb-10 flex flex-col gap-8">
        {MODULE_GROUPS.map((group) => {
          // Filter modules in this group by permission 
          const visibleMods = group.modules.filter(mod => {
            const pKey = SYNC_TO_PERM_MAP[mod.id];
            return !pKey || userPermissions[pKey] !== false; 
          });

          if (visibleMods.length === 0) return null;

          const groupStyles: Record<string, { badge: string; card: string }> = {
            indigo: {
              badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
              card: 'hover:border-indigo-200'
            },
            green: {
              badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              card: 'hover:border-emerald-200'
            },
            blue: {
              badge: 'bg-blue-50 text-blue-700 border-blue-200',
              card: 'hover:border-blue-200'
            },
            purple: {
              badge: 'bg-purple-50 text-purple-700 border-purple-200',
              card: 'hover:border-purple-200'
            },
            amber: {
              badge: 'bg-amber-50 text-amber-700 border-amber-200',
              card: 'hover:border-amber-200'
            },
          };
          const gs = groupStyles[group.color] || groupStyles.green;

          return (
            <div key={group.group} className="flex flex-col gap-4">
              {/* Group Header */}
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold tracking-wide px-3 py-1.5 rounded-lg border ${gs.badge}`}>
                  {group.group}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] font-bold text-gray-400 tracking-wide">{visibleMods.length} Modul</span>
              </div>

              {/* Module Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {visibleMods.map((mod) => {
                  const state = syncStates[mod.id];
                  const isActive = currentModuleId === mod.id;

                  return (
                    <div
                      key={mod.id}
                      className={`
                        relative bg-white/80 backdrop-blur-md rounded-2xl p-4 transition-all duration-300 border shadow-sm group
                        ${isActive ? 'border-emerald-300 shadow-lg shadow-emerald-900/5' : `border-white/20 ${gs.card}`}
                      `}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col min-w-0 flex-1">
                            <h3 className="text-[12px] font-bold text-gray-800 leading-tight mb-0.5">{mod.name}</h3>
                            <p className="text-[10px] text-gray-400 font-medium leading-tight">{mod.description}</p>
                          </div>
                          <div className={`
                            w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all
                            ${state?.status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                              state?.status === 'error' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                              isActive ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-gray-50 text-gray-300 border-gray-200'}
                          `}>
                            {state?.status === 'success' ? <CheckCircle2 size={16} /> :
                             state?.status === 'error' ? <AlertCircle size={16} /> :
                             isActive ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-start gap-2 text-[10px] font-medium text-gray-400 leading-tight">
                            <Clock size={12} className="shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-0.5">
                              <span>{state?.lastUpdate || 'Belum pernah disinkronkan'}</span>
                              {state?.period && (
                                <span className="text-[9px] text-gray-400">
                                  {formatScrapedPeriodDate(state.period.start)} - {formatScrapedPeriodDate(state.period.end)}
                                </span>
                              )}
                            </div>
                          </div>

                          {state?.message && (
                            <div className={`
                              text-[10px] font-medium px-2.5 py-2 rounded-lg border leading-tight
                              ${state.status === 'success' ? 'bg-emerald-50/50 text-emerald-700 border-emerald-200' : 'bg-rose-50/50 text-rose-700 border-rose-200'}
                            `}>
                              {state.message}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => runSync(mod.id)}
                          disabled={isBatchProcessing}
                          className={`
                            w-full h-8 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5
                            ${isBatchProcessing 
                              ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed' 
                              : 'bg-white/60 text-gray-700 border-gray-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-500'}
                          `}
                        >
                          <RefreshCw size={12} className={isActive ? 'animate-spin' : ''} />
                          Sinkronkan
                        </button>
                      </div>

                      {isActive && (
                        <div className="absolute top-3 right-3">
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="bg-amber-50/80 backdrop-blur-md border border-amber-200/60 rounded-2xl p-4 flex items-start gap-4 shadow-sm shrink-0">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-600 border border-amber-200 shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div className="flex flex-col gap-0.5">
          <h4 className="text-[11px] font-bold text-amber-900">Catatan Keamanan & Performa</h4>
          <p className="text-[10px] text-amber-800/70 font-medium leading-relaxed">
            Batch sinkronisasi menjalankan perintah secara paralel terbatas untuk mencegah beban berlebih pada server host. 
            Proses ini mungkin memakan waktu beberapa menit. Pastikan koneksi internet stabil selama proses berlangsung.
          </p>
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


















