'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Loader2,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  X,
  LayoutGrid,
  TableProperties,
  Layers,
  Calculator,
  Database,
  BookOpen,
  Calendar,
  Bookmark,
} from 'lucide-react';
import PricelistExcelUpload from './PricelistExcelUpload';
import PricelistSimulator, { SavedSimulationItem } from './PricelistSimulator';
import PricelistMasterParameter from './PricelistMasterParameter';
import ManasikMasterParameter from './ManasikMasterParameter';
import YasinMasterParameter from './YasinMasterParameter';
import ManasikSimulator, { SavedManasikSimulationItem } from './ManasikSimulator';
import YasinSimulator, { SavedYasinSimulationItem } from './YasinSimulator';
import ManasikMatrixView from './ManasikMatrixView';
import YasinMatrixView from './YasinMatrixView';
import NotaMasterParameter from './NotaMasterParameter';
import NotaSimulator, { SavedNotaSimulationItem } from './NotaSimulator';
import NotaMatrixView from './NotaMatrixView';
import BrosurMasterParameter from './BrosurMasterParameter';
import BrosurSimulator, { SavedBrosurSimulationItem } from './BrosurSimulator';
import BrosurMatrixView from './BrosurMatrixView';
import SavedCalculationsList, { UnifiedCalculationItem } from './SavedCalculationsList';
import SquareDropdown from '@/components/SquareDropdown';
import GlobalMasterParameter from './GlobalMasterParameter';
import {
  GlobalMasterParams,
  DEFAULT_GLOBAL_PARAMS,
  applyGlobalParamsToAll,
} from '@/lib/global-master-params';
import { DEFAULT_MASTER_PARAMS, DEFAULT_MASTER_PARAMS_KLEM, SimulatorMasterParams } from '@/lib/pricelist-simulator';
import { DEFAULT_MANASIK_PARAMS, ManasikMasterParams } from '@/lib/manasik-calculator';
import { DEFAULT_YASIN_PARAMS, YasinMasterParams } from '@/lib/yasin-calculator';
import { DEFAULT_NOTA_PARAMS, NotaMasterParams } from '@/lib/nota-calculator';
import { DEFAULT_BROSUR_PARAMS, BrosurMasterParams } from '@/lib/brosur-calculator';
import { recalculatePricelistFromParams } from '@/lib/pricelist-calculator';

interface PricelistItem {
  id: number;
  jenis_kalender: string;
  oplah: number;
  proses: string;
  bahan: string;
  ukuran: string;
  hpp: number;
  harga: number;
  harga_nego: number;
  profit_pct: number;
  profit_pct_nego: number;
  profit_tot: number;
  profit_tot_nego: number;
}

export default function PricelistClient() {
  const [items, setItems] = useState<PricelistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastExcelUpdate, setLastExcelUpdate] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Filters state
  const [activeTab, setActiveTab] = useState<'parameter' | 'simulator' | 'matrix' | 'saved'>('saved');
  const [selectedFinishing, setSelectedFinishing] = useState<'Spiral' | 'Klem'>('Spiral');

  // Parameter Buku Manasik, Yasin, Nota, Brosur & Global
  const [paramsGlobal, setParamsGlobal] = useState<GlobalMasterParams>(DEFAULT_GLOBAL_PARAMS);
  const [showGlobalParamModal, setShowGlobalParamModal] = useState(false);
  const [paramsManasik, setParamsManasik] = useState<ManasikMasterParams>(DEFAULT_MANASIK_PARAMS);
  const [paramsYasin, setParamsYasin] = useState<YasinMasterParams>(DEFAULT_YASIN_PARAMS);
  const [paramsNota, setParamsNota] = useState<NotaMasterParams>(DEFAULT_NOTA_PARAMS);
  const [paramsBrosur, setParamsBrosur] = useState<BrosurMasterParams>(DEFAULT_BROSUR_PARAMS);
  const [selectedProductCategory, setSelectedProductCategory] = useState<'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026'>('Kalender');
  const [paramsSpiral, setParamsSpiral] = useState<SimulatorMasterParams>(DEFAULT_MASTER_PARAMS);
  const [paramsKlem, setParamsKlem] = useState<SimulatorMasterParams>(DEFAULT_MASTER_PARAMS_KLEM);

  // Active loaded simulation state (persisted across tabs)
  const [activeSimulationId, setActiveSimulationId] = useState<string | null>(null);
  const [activeSimulationTitle, setActiveSimulationTitle] = useState<string | null>(null);
  const [backupParamsSpiral, setBackupParamsSpiral] = useState<SimulatorMasterParams | null>(null);
  const [backupParamsKlem, setBackupParamsKlem] = useState<SimulatorMasterParams | null>(null);

  // Load preferences from localStorage after mount (client-only) to prevent hydration mismatch
  useEffect(() => {
    try {
      const savedTab = localStorage.getItem('sintak_pricelist_active_tab');
      if (savedTab === 'parameter' || savedTab === 'simulator' || savedTab === 'matrix' || savedTab === 'saved') {
        setActiveTab(savedTab as any);
      }

      const savedFinishing = localStorage.getItem('sintak_pricelist_finishing');
      if (savedFinishing === 'Spiral' || savedFinishing === 'Klem') {
        setSelectedFinishing(savedFinishing);
      }

      const savedSpiral = localStorage.getItem('sintak_pricelist_master_params_spiral')
        ?? localStorage.getItem('sintak_pricelist_master_params');
      if (savedSpiral) {
        setParamsSpiral({ ...DEFAULT_MASTER_PARAMS, ...JSON.parse(savedSpiral) });
      }

      const savedKlem = localStorage.getItem('sintak_pricelist_master_params_klem');
      if (savedKlem) {
        setParamsKlem({ ...DEFAULT_MASTER_PARAMS_KLEM, ...JSON.parse(savedKlem) });
      }

      const savedView = localStorage.getItem('sintak_pricelist_view_mode');
      if (savedView === 'matrix' || savedView === 'table') {
        setViewMode(savedView);
      }

      const savedCategory = localStorage.getItem('sintak_pricelist_selected_category');
      if (
        savedCategory === 'Kalender' ||
        savedCategory === 'Buku Manasik' ||
        savedCategory === 'Buku Yasin' ||
        savedCategory === 'Nota 1 Warna' ||
        savedCategory === 'Brosur 2026'
      ) {
        setSelectedProductCategory(savedCategory);
      }

      const savedGlobal = localStorage.getItem('sintak_pricelist_master_params_global');
      if (savedGlobal) {
        setParamsGlobal({ ...DEFAULT_GLOBAL_PARAMS, ...JSON.parse(savedGlobal) });
      }
    } catch (e) {
      console.error('Failed to load localStorage preferences:', e);
    }
  }, []);

  // Sync selectedProductCategory across tabs
  const handleProductCategoryChange = (
    category: 'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026'
  ) => {
    setSelectedProductCategory(category);
    try {
      localStorage.setItem('sintak_pricelist_selected_category', category);
    } catch (e) {
      console.error(e);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJenis, setSelectedJenis] = useState<string>('ALL');
  const [selectedBahan, setSelectedBahan] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'matrix' | 'table'>('matrix');

  const isKlemActive = selectedFinishing === 'Klem';
  const customParams = isKlemActive ? paramsKlem : paramsSpiral;

  const setCustomParams: React.Dispatch<React.SetStateAction<SimulatorMasterParams>> = (
    valueOrUpdater
  ) => {
    const target = selectedFinishing === 'Klem' ? setParamsKlem : setParamsSpiral;
    if (typeof valueOrUpdater === 'function') {
      target((prev) =>
        (valueOrUpdater as (prev: SimulatorMasterParams) => SimulatorMasterParams)(prev)
      );
    } else {
      target(valueOrUpdater);
    }
  };

  const setParamsForFinishing = (mode: 'Spiral' | 'Klem', params: SimulatorMasterParams) => {
    if (mode === 'Klem') {
      setParamsKlem(params);
    } else {
      setParamsSpiral(params);
    }
  };

  const handleLoadSimulationFromList = (item: UnifiedCalculationItem) => {
    handleProductCategoryChange(item.category as any);
    setActiveSimulationId(item.id);
    setActiveSimulationTitle(item.title);
    setActiveTab('simulator');
  };

  // Simpan posisi tab aktif dan view mode ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sintak_pricelist_active_tab', activeTab);
    } catch (e) {
      console.error('Failed to save active tab to localStorage:', e);
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('sintak_pricelist_view_mode', viewMode);
    } catch (e) {
      console.error('Failed to save view mode to localStorage:', e);
    }
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem('sintak_pricelist_finishing', selectedFinishing);
    } catch (e) {
      console.error('Failed to save finishing mode to localStorage:', e);
    }
  }, [selectedFinishing]);

  // Simpan master parameter ke localStorage per profil (debounced 400ms agar tidak lag saat mengetik)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('sintak_pricelist_master_params_spiral', JSON.stringify(paramsSpiral));
        localStorage.setItem('sintak_pricelist_master_params_klem', JSON.stringify(paramsKlem));
        localStorage.setItem('sintak_pricelist_master_params_global', JSON.stringify(paramsGlobal));
      } catch (e) {
        console.error('Failed to save master params to localStorage:', e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [paramsSpiral, paramsKlem, paramsGlobal]);

  // Fungsi sebarkan parameter global ke seluruh produk
  const handleApplyGlobalParams = (targetGlobal?: GlobalMasterParams) => {
    const g = targetGlobal || paramsGlobal;
    const { nextSpiral, nextKlem, nextManasik, nextYasin, nextNota, nextBrosur } = applyGlobalParamsToAll(
      g,
      paramsSpiral,
      paramsKlem,
      paramsManasik,
      paramsYasin,
      paramsNota,
      paramsBrosur
    );

    setParamsSpiral(nextSpiral);
    setParamsKlem(nextKlem);
    setParamsManasik(nextManasik);
    setParamsYasin(nextYasin);
    setParamsNota(nextNota);
    setParamsBrosur(nextBrosur);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pricelist?_t=${Date.now()}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
        setLastExcelUpdate(json.lastExcelUpdate || null);
        setFileName(json.fileName || null);
      }
    } catch (e) {
      console.error('Failed to fetch pricelist:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Data terhitung secara reaktif: selalu sinkron dengan Master Parameter yang sedang aktif & pilihan finishing (Spiral / Klem)
  const activeItems = useMemo(() => {
    return recalculatePricelistFromParams(customParams, items, selectedFinishing);
  }, [customParams, items, selectedFinishing]);

  // Options for SquareDropdown
  const jenisOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    activeItems.forEach((i) => {
      counts[i.jenis_kalender] = (counts[i.jenis_kalender] || 0) + 1;
    });

    const opts = [
      { value: 'ALL', label: 'Semua Jenis', count: activeItems.length },
      ...Object.keys(counts).map((k) => ({
        value: k,
        label: k,
        count: counts[k],
      })),
    ];
    return opts;
  }, [activeItems]);

  const bahanOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    activeItems.forEach((i) => {
      counts[i.bahan] = (counts[i.bahan] || 0) + 1;
    });

    const opts = [
      { value: 'ALL', label: 'Semua Bahan', count: activeItems.length },
      ...Object.keys(counts).map((k) => ({
        value: k,
        label: k,
        count: counts[k],
      })),
    ];
    return opts;
  }, [activeItems]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return activeItems.filter((item) => {
      if (selectedJenis !== 'ALL' && item.jenis_kalender !== selectedJenis) return false;
      if (selectedBahan !== 'ALL' && item.bahan !== selectedBahan) return false;
      if (q) {
        const matchesSearch =
          item.jenis_kalender.toLowerCase().includes(q) ||
          item.bahan.toLowerCase().includes(q) ||
          item.ukuran.toLowerCase().includes(q) ||
          item.proses.toLowerCase().includes(q) ||
          item.oplah.toString().includes(q) ||
          item.harga.toString().includes(q);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [activeItems, selectedJenis, selectedBahan, searchTerm]);

  // Grouping for matrix view: Jenis -> Bahan -> List of Rows (grouped by Oplah + Proses)
  const groupedData = useMemo(() => {
    const res: Record<string, Record<string, Record<number, { proses: string; sizes: Record<string, PricelistItem> }>>> = {};

    filteredItems.forEach((item) => {
      if (!res[item.jenis_kalender]) res[item.jenis_kalender] = {};
      if (!res[item.jenis_kalender][item.bahan]) res[item.jenis_kalender][item.bahan] = {};
      if (!res[item.jenis_kalender][item.bahan][item.oplah]) {
        res[item.jenis_kalender][item.bahan][item.oplah] = {
          proses: item.proses,
          sizes: {},
        };
      }
      res[item.jenis_kalender][item.bahan][item.oplah].sizes[item.ukuran] = item;
    });

    return res;
  }, [filteredItems]);

  const allSizes = ['32 x 48', '38 x 54', '46 x 64', '48 x 64'];

  const formatRupiah = (val: number) => {
    if (!val) return '0';
    return Math.round(val).toLocaleString('id-ID');
  };

  const formatPercent = (val: number) => {
    if (!val) return '0%';
    return `${(val * 100).toFixed(1)}%`;
  };

  const isFiltered = selectedJenis !== 'ALL' || selectedBahan !== 'ALL' || searchTerm !== '';

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* TABS Navigation & Product Category Selector - Bersandingan Sebaris */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-gray-100 shrink-0 pb-2 gap-3 mt-1 relative z-50">
        <div className="flex gap-2 sm:gap-6 px-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`flex items-center justify-center gap-1.5 pb-2 px-2 text-[13px] font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bookmark size={14} />
            <span>Daftar Kalkulasi</span>
          </button>

          <div
            className={`flex items-center gap-1.5 pb-2 px-2 border-b-2 transition-all ${
              activeTab === 'parameter'
                ? 'border-emerald-600'
                : 'border-transparent'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab('parameter')}
              className={`flex items-center justify-center gap-1.5 text-[13px] font-bold cursor-pointer ${
                activeTab === 'parameter'
                  ? 'text-emerald-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Database size={14} />
              <span>Master Parameter</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowGlobalParamModal(true);
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100/70 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold transition-all shadow-2xs cursor-pointer shrink-0"
              title="Kelola Master Parameter Global (Shared Rates antar produk)"
            >
              <Globe size={10} className="text-emerald-700" />
              <span>Global</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center justify-center gap-1.5 pb-2 px-2 text-[13px] font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calculator size={14} />
            <span>Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center justify-center gap-1.5 pb-2 px-2 text-[13px] font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileSpreadsheet size={14} />
            <span>Pricelist</span>
          </button>
        </div>

        {/* Global Product Category Selector - Dropdown Searchable */}
        <div className="flex items-center gap-2 mx-2 self-start lg:self-auto shrink-0 text-xs sm:text-sm">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Jenis Produk:</span>
          <div className="text-xs sm:text-sm font-semibold">
            <SquareDropdown
              options={[
                { value: 'Kalender', label: '🗓️ Kalender 2027' },
                { value: 'Buku Manasik', label: '📖 Buku Manasik Haji' },
                { value: 'Buku Yasin', label: '📗 Buku Surat Yasin' },
                { value: 'Nota 1 Warna', label: '📋 Nota 1 Warna' },
                { value: 'Brosur 2026', label: '🗞️ Brosur 2026' },
              ]}
              value={selectedProductCategory}
              onChange={(val) => handleProductCategoryChange(val as any)}
              searchPlaceholder="Cari jenis produk..."
              widthClass="w-56"
            />
          </div>
        </div>
      </div>

      {activeTab === 'parameter' ? (
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
          {selectedProductCategory === 'Buku Manasik' ? (
            <ManasikMasterParameter
              customParams={paramsManasik}
              setCustomParams={setParamsManasik}
            />
          ) : selectedProductCategory === 'Buku Yasin' ? (
            <YasinMasterParameter
              customParams={paramsYasin}
              setCustomParams={setParamsYasin}
            />
          ) : selectedProductCategory === 'Nota 1 Warna' ? (
            <NotaMasterParameter
              customParams={paramsNota}
              setCustomParams={setParamsNota}
            />
          ) : selectedProductCategory === 'Brosur 2026' ? (
            <BrosurMasterParameter
              customParams={paramsBrosur}
              setCustomParams={setParamsBrosur}
            />
          ) : (
            <PricelistMasterParameter
              customParams={customParams}
              setCustomParams={setCustomParams}
              activeFinishing={selectedFinishing}
              onChangeFinishing={setSelectedFinishing}
              activeSimulationId={activeSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              onBackToSimulator={() => setActiveTab('simulator')}
            />
          )}
        </div>
      ) : activeTab === 'simulator' ? (
        <div className="flex-1 overflow-y-auto pr-1">
          {selectedProductCategory === 'Buku Manasik' ? (
            <ManasikSimulator
              customParams={paramsManasik}
              setCustomParams={setParamsManasik}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Buku Yasin' ? (
            <YasinSimulator
              customParams={paramsYasin}
              setCustomParams={setParamsYasin}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Nota 1 Warna' ? (
            <NotaSimulator
              customParams={paramsNota}
              setCustomParams={setParamsNota}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Brosur 2026' ? (
            <BrosurSimulator
              customParams={paramsBrosur}
              setCustomParams={setParamsBrosur}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : (
            <PricelistSimulator
              customParams={customParams}
              setCustomParams={setCustomParams}
              setParamsForFinishing={setParamsForFinishing}
              finishingJilid={selectedFinishing}
              onChangeFinishingJilid={setSelectedFinishing}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
              paramsSpiral={paramsSpiral}
              paramsKlem={paramsKlem}
              backupParamsSpiral={backupParamsSpiral}
              setBackupParamsSpiral={setBackupParamsSpiral}
              backupParamsKlem={backupParamsKlem}
              setBackupParamsKlem={setBackupParamsKlem}
            />
          )}
        </div>
      ) : activeTab === 'matrix' ? (
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
          {selectedProductCategory === 'Buku Manasik' ? (
            <ManasikMatrixView
              customParams={paramsManasik}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Buku Yasin' ? (
            <YasinMatrixView
              customParams={paramsYasin}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Nota 1 Warna' ? (
            <NotaMatrixView
              customParams={paramsNota}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Brosur 2026' ? (
            <BrosurMatrixView
              customParams={paramsBrosur}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : (
            <>
          {/* Upload card */}
          <PricelistExcelUpload lastExcelUpdate={lastExcelUpdate} fileName={fileName} onUploadSuccess={fetchData} />

          {/* Filter & Search Bar - Style Laporan Pekerjaan */}
          <div className="shrink-0 bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center gap-2 flex-1 w-full">
              {/* Tombol Reload Data */}
              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="h-8 px-3 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-sm"
                title="Reload Data Pricelist"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
                <span className="hidden sm:inline">Reload</span>
              </button>

              {/* Input Search */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari jenis kalender, bahan, ukuran, oplah, atau mesin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto min-w-0">
              <div className="flex items-center text-xs text-slate-500 font-medium shrink-0">
                <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" /> Filter:
              </div>

              {isFiltered && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedJenis('ALL');
                    setSelectedBahan('ALL');
                    setSearchTerm('');
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shrink-0"
                  title="Reset Semua Filter"
                >
                  <X size={12} /> Reset
                </button>
              )}

              <SquareDropdown
                options={jenisOptions}
                value={selectedJenis}
                onChange={setSelectedJenis}
                searchPlaceholder="Cari Jenis..."
                widthClass="w-44"
              />

              <SquareDropdown
                options={bahanOptions}
                value={selectedBahan}
                onChange={setSelectedBahan}
                searchPlaceholder="Cari Bahan..."
                widthClass="w-44"
              />

              {/* Finishing Jilid Switcher (Spiral vs Klem) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedFinishing('Spiral')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    selectedFinishing === 'Spiral'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Jilid Spiral Kawat Gantung"
                >
                  <span>Spiral</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFinishing('Klem')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    selectedFinishing === 'Klem'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Jilid Klem Seng (Jepit Kaleng)"
                >
                  <span>Klem</span>
                </button>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0 ml-1">
                <button
                  type="button"
                  onClick={() => setViewMode('matrix')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'matrix'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tampilan Matriks"
                >
                  <LayoutGrid size={13} />
                  <span className="hidden sm:inline">Matriks</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tampilan Tabel Rinci"
                >
                  <TableProperties size={13} />
                  <span className="hidden sm:inline">Tabel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {loading ? (
            <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200">
              <Loader2 size={32} className="animate-spin text-amber-500 mb-2" />
              <p className="text-xs text-slate-500 font-medium">Memuat data pricelist...</p>
            </div>
          ) : activeItems.length === 0 ? (
            <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
                <FileSpreadsheet size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">Belum Ada Data Pricelist</h4>
              <p className="text-xs text-slate-500 max-w-md mb-4">
                Silakan unggah file master <strong>Pricelist Kalender 2027 Spiral.xlsx</strong> melalui tombol upload di atas.
              </p>
            </div>
          ) : viewMode === 'matrix' ? (
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
              {Object.keys(groupedData).length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                  Tidak ada data yang sesuai dengan pencarian atau filter yang dipilih.
                </div>
              ) : (
                Object.entries(groupedData).map(([jenis, bahanGroups]) => (
                  <div key={jenis} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                        <h3 className="text-sm font-bold text-gray-800 tracking-tight">{jenis}</h3>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Finishing: {selectedFinishing === 'Klem' ? 'Klem Seng' : 'Spiral Gantung'}
                      </span>
                    </div>

                    {Object.entries(bahanGroups).map(([bahan, oplahMap]) => (
                      <div key={bahan} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                        <div className="bg-amber-50/70 px-4 py-2 border-b border-amber-100 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-900 tracking-wider uppercase flex items-center gap-1.5">
                            <Layers size={13} className="text-amber-600" />
                            Bahan: {bahan}
                          </span>
                        </div>

                        <div className="overflow-x-auto max-h-[500px]">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-white shadow-xs">
                              <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                                <th className="py-2.5 px-3 border-r border-gray-200 text-center w-16 bg-gray-100" rowSpan={2}>
                                  Oplah
                                </th>
                                <th className="py-2.5 px-3 border-r border-gray-200 text-center w-20 bg-gray-100" rowSpan={2}>
                                  Mesin
                                </th>
                                {allSizes.map((size) => (
                                  <th
                                    key={size}
                                    colSpan={4}
                                    className="py-1.5 px-2 text-center border-r border-gray-200 font-bold text-gray-900 bg-gray-200/80"
                                  >
                                    {size}
                                  </th>
                                ))}
                              </tr>
                              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-600">
                                {allSizes.map((size) => (
                                  <React.Fragment key={size}>
                                    <th className="py-1.5 px-2 text-right font-semibold bg-gray-50">HPP</th>
                                    <th className="py-1.5 px-2 text-right font-bold text-emerald-800 bg-emerald-100/50">Harga</th>
                                    <th className="py-1.5 px-2 text-right font-bold text-blue-800 bg-blue-100/50">Nego</th>
                                    <th className="py-1.5 px-2 text-right font-semibold border-r border-gray-200 bg-gray-50">%</th>
                                  </React.Fragment>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {Object.entries(oplahMap)
                                .sort(([a], [b]) => Number(a) - Number(b))
                                .map(([oplah, { proses, sizes }]) => (
                                  <tr key={oplah} className="hover:bg-amber-50/30 transition-colors">
                                    <td className="py-2 px-3 text-center font-bold text-gray-900 border-r border-gray-200 bg-gray-50/30">
                                      {Number(oplah).toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-2 px-3 text-center text-gray-600 border-r border-gray-200 font-medium">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          proses === 'SM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                        }`}
                                      >
                                        {proses}
                                      </span>
                                    </td>
                                    {allSizes.map((size) => {
                                      const cell = sizes[size];
                                      if (!cell) {
                                        return (
                                          <td key={size} colSpan={4} className="py-2 px-2 text-center text-gray-400 border-r border-gray-200">
                                            -
                                          </td>
                                        );
                                      }
                                      return (
                                        <React.Fragment key={size}>
                                          <td className="py-2 px-2 text-right text-gray-500 font-mono">
                                            {formatRupiah(cell.hpp)}
                                          </td>
                                          <td className="py-2 px-2 text-right font-bold text-emerald-700 font-mono bg-emerald-50/30">
                                            {formatRupiah(cell.harga)}
                                          </td>
                                          <td className="py-2 px-2 text-right font-bold text-blue-700 font-mono bg-blue-50/30">
                                            {formatRupiah(cell.harga_nego)}
                                          </td>
                                          <td className="py-2 px-2 text-right text-gray-600 border-r border-gray-200 font-mono">
                                            {formatPercent(cell.profit_pct)}
                                          </td>
                                        </React.Fragment>
                                      );
                                    })}
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Detailed Flat Table View */
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold sticky top-0">
                      <th className="py-2.5 px-3">Jenis Kalender</th>
                      <th className="py-2.5 px-3">Bahan</th>
                      <th className="py-2.5 px-3 text-center">Ukuran</th>
                      <th className="py-2.5 px-3 text-center">Oplah</th>
                      <th className="py-2.5 px-3 text-center">Proses</th>
                      <th className="py-2.5 px-3 text-right">HPP</th>
                      <th className="py-2.5 px-3 text-right text-emerald-700">Harga Jual</th>
                      <th className="py-2.5 px-3 text-right text-blue-700">Harga Nego</th>
                      <th className="py-2.5 px-3 text-right">Margin %</th>
                      <th className="py-2.5 px-3 text-right">Margin Nego %</th>
                      <th className="py-2.5 px-3 text-right">Profit Total</th>
                      <th className="py-2.5 px-3 text-right">Profit Nego</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-amber-50/20">
                        <td className="py-2 px-3 font-semibold text-gray-800">{item.jenis_kalender}</td>
                        <td className="py-2 px-3 text-gray-700">{item.bahan}</td>
                        <td className="py-2 px-3 text-center font-medium text-gray-600">{item.ukuran}</td>
                        <td className="py-2 px-3 text-center font-bold text-gray-900">{item.oplah.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.proses === 'SM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {item.proses}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-gray-600">{formatRupiah(item.hpp)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                          {formatRupiah(item.harga)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-700 bg-blue-50/30">
                          {formatRupiah(item.harga_nego)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-gray-700">{formatPercent(item.profit_pct)}</td>
                        <td className="py-2 px-3 text-right font-mono text-gray-700">{formatPercent(item.profit_pct_nego)}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700">{formatRupiah(item.profit_tot)}</td>
                        <td className="py-2 px-3 text-right font-mono text-blue-700">{formatRupiah(item.profit_tot_nego)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 font-medium">
                Menampilkan {filteredItems.length} dari {items.length} kombinasi tarif
              </div>
            </div>
          )}
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1">
          <SavedCalculationsList
            selectedCategory={selectedProductCategory}
            onLoadSimulation={handleLoadSimulationFromList}
            activeSimulationId={activeSimulationId}
          />
        </div>
      )}

      {/* Modal Master Parameter Global */}
      {showGlobalParamModal && (
        <div
          onClick={() => setShowGlobalParamModal(false)}
          className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden cursor-default"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Master Parameter Global (Shared Rates)</h3>
                  <p className="text-xs text-slate-500">Kalkulasi dan sinkronisasi tarif dasar lintas semua jenis produk</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGlobalParamModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <GlobalMasterParameter
                globalParams={paramsGlobal}
                setGlobalParams={setParamsGlobal}
                onApplyToAllProducts={(applied) => {
                  handleApplyGlobalParams(applied);
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowGlobalParamModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
