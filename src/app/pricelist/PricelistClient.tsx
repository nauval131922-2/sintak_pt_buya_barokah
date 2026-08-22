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
} from 'lucide-react';
import PricelistExcelUpload from './PricelistExcelUpload';
import PricelistSimulator from './PricelistSimulator';
import PricelistMasterParameter from './PricelistMasterParameter';
import SquareDropdown from '@/components/SquareDropdown';
import { DEFAULT_MASTER_PARAMS, SimulatorMasterParams } from '@/lib/pricelist-simulator';

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
  const [activeTab, setActiveTab] = useState<'matrix' | 'simulator' | 'parameter'>('matrix');
  const [customParams, setCustomParams] = useState<SimulatorMasterParams>(DEFAULT_MASTER_PARAMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJenis, setSelectedJenis] = useState<string>('ALL');
  const [selectedBahan, setSelectedBahan] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'matrix' | 'table'>('matrix');

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

  // Options for SquareDropdown
  const jenisOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      counts[i.jenis_kalender] = (counts[i.jenis_kalender] || 0) + 1;
    });

    const opts = [
      { value: 'ALL', label: 'Semua Jenis', count: items.length },
      ...Object.keys(counts).map((k) => ({
        value: k,
        label: k,
        count: counts[k],
      })),
    ];
    return opts;
  }, [items]);

  const bahanOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      counts[i.bahan] = (counts[i.bahan] || 0) + 1;
    });

    const opts = [
      { value: 'ALL', label: 'Semua Bahan', count: items.length },
      ...Object.keys(counts).map((k) => ({
        value: k,
        label: k,
        count: counts[k],
      })),
    ];
    return opts;
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return items.filter((item) => {
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
  }, [items, selectedJenis, selectedBahan, searchTerm]);

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
      {/* TABS Navigation - Presisi seperti JHP */}
      <div className="flex gap-2 sm:gap-6 border-b border-gray-100 shrink-0 px-2 mt-1">
        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center justify-center gap-1.5 pb-3 px-2 text-[13px] font-bold border-b-2 transition-all flex-1 sm:flex-initial cursor-pointer ${
            activeTab === 'matrix'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileSpreadsheet size={14} />
          <span>Master Pricelist</span>
          {items.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
              {items.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center justify-center gap-1.5 pb-3 px-2 text-[13px] font-bold border-b-2 transition-all flex-1 sm:flex-initial cursor-pointer ${
            activeTab === 'simulator'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calculator size={14} />
          <span>Simulator & Kalkulator Order</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('parameter')}
          className={`flex items-center justify-center gap-1.5 pb-3 px-2 text-[13px] font-bold border-b-2 transition-all flex-1 sm:flex-initial cursor-pointer ${
            activeTab === 'parameter'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Database size={14} />
          <span>Master Parameter</span>
        </button>
      </div>

      {activeTab === 'simulator' ? (
        <div className="flex-1 overflow-y-auto pr-1">
          <PricelistSimulator
            customParams={customParams}
            setCustomParams={setCustomParams}
            onOpenMasterParam={() => setActiveTab('parameter')}
          />
        </div>
      ) : activeTab === 'parameter' ? (
        <div className="flex-1 overflow-y-auto pr-1">
          <PricelistMasterParameter
            customParams={customParams}
            setCustomParams={setCustomParams}
          />
        </div>
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
                className="h-8 px-3 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-sm"
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
          ) : items.length === 0 ? (
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
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                      <h3 className="text-sm font-bold text-gray-800 tracking-tight">{jenis}</h3>
                    </div>

                    {Object.entries(bahanGroups).map(([bahan, oplahMap]) => (
                      <div key={bahan} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                        <div className="bg-amber-50/70 px-4 py-2 border-b border-amber-100 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-900 tracking-wider uppercase flex items-center gap-1.5">
                            <Layers size={13} className="text-amber-600" />
                            Bahan: {bahan}
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold">
                                <th className="py-2.5 px-3 border-r border-gray-200 text-center w-16" rowSpan={2}>
                                  Oplah
                                </th>
                                <th className="py-2.5 px-3 border-r border-gray-200 text-center w-20" rowSpan={2}>
                                  Mesin
                                </th>
                                {allSizes.map((size) => (
                                  <th
                                    key={size}
                                    colSpan={4}
                                    className="py-1.5 px-2 text-center border-r border-gray-200 font-bold text-gray-800 bg-gray-100/70"
                                  >
                                    {size}
                                  </th>
                                ))}
                              </tr>
                              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-500">
                                {allSizes.map((size) => (
                                  <React.Fragment key={size}>
                                    <th className="py-1.5 px-2 text-right font-medium">HPP</th>
                                    <th className="py-1.5 px-2 text-right font-semibold text-emerald-700 bg-emerald-50/20">Harga</th>
                                    <th className="py-1.5 px-2 text-right font-semibold text-blue-700 bg-blue-50/20">Nego</th>
                                    <th className="py-1.5 px-2 text-right font-medium border-r border-gray-200">%</th>
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
  );
}
