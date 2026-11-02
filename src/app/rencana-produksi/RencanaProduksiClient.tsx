'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Search, X, Loader2, Package, Hash, Users, Target, CheckCircle2, 
  Layers, RefreshCw, BarChart3, AlertTriangle, Flag, CalendarRange, 
  ArrowLeft, Clock, Factory, ChevronRight, TableProperties
} from 'lucide-react';
import MultiOrderGanttChart, { type ProductionOrderSummary } from '@/components/MultiOrderGanttChart';
import OrderGanttChart, { type JhpEntryForGantt, type OrderInfoForGantt } from '@/components/OrderGanttChart';

interface SummaryData {
  totalActiveOrders: number;
  criticalOrdersCount: number;
  completedCount: number;
  totalTarget: number;
  totalRealisasi: number;
  overallProgress: number;
  busiestStation: string;
}

interface MachineStationLoad {
  bagian: string;
  orderCount: number;
  totalTarget: number;
  totalRealisasi: number;
}

export default function RencanaProduksiClient() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [orders, setOrders] = useState<ProductionOrderSummary[]>([]);
  const [machineStations, setMachineStations] = useState<MachineStationLoad[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'COMPLETED'>('ACTIVE');
  const [bagianFilter, setBagianFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Detail Drilldown
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedOrderEntries, setSelectedOrderEntries] = useState<JhpEntryForGantt[]>([]);
  const [selectedOrderInfo, setSelectedOrderInfo] = useState<OrderInfoForGantt | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'gantt' | 'table'>('gantt');

  // Search Autocomplete Dropdown
  type SearchOrderResult = {
    no_order: string;
    nama_order: string;
    tgl_awal: string;
    tgl_akhir: string;
    total_target: number;
    total_realisasi: number;
  };
  const [orderSearchResults, setOrderSearchResults] = useState<SearchOrderResult[]>([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchingOrders, setSearchingOrders] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Multi-Order Schedule
  const fetchSchedule = useCallback(async (qSearch: string, sFilter: string, bFilter: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (qSearch) params.set('search', qSearch);
      if (sFilter !== 'ALL') params.set('status', sFilter);
      if (bFilter !== 'ALL') params.set('bagian', bFilter);
      params.set('limit', '50');

      const res = await fetch(`/api/rencana-produksi?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setOrders(data.orders || []);
        setMachineStations(data.machineStations || []);
      }
    } catch (err) {
      console.error('Failed to load production schedule:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule(search, statusFilter, bagianFilter);
  }, [fetchSchedule, statusFilter, bagianFilter]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSchedule(val, statusFilter, bagianFilter);
      searchOrdersApi(val);
    }, 350);
  };
  const searchOrdersApi = useCallback(async (q: string) => {
    const query = q.trim();
    if (query.length < 2) {
      setOrderSearchResults([]);
      setIsSearchDropdownOpen(false);
      return;
    }
    setSearchingOrders(true);
    try {
      const res = await fetch(`/api/jurnal-harian-produksi/analisa?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setOrderSearchResults(data.orders || []);
      setIsSearchDropdownOpen(true);
    } catch {
      setOrderSearchResults([]);
    } finally {
      setSearchingOrders(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const bagianColor = (bagian: string) => {
    const b = (bagian || '').toUpperCase();
    if (b.includes('SETTING')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (b.includes('QC') || b.includes('QUALITY CONTROL')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (b.includes('CETAK')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (b.includes('FINISHING')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (b.includes('GUDANG')) return 'bg-slate-100 text-slate-800 border-slate-200';
    if (b.includes('TEKNISI')) return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const bagianSummary = useMemo(() => {
    const map = new Map<string, { bagian: string; target: number; realisasi: number }>();
    for (const e of selectedOrderEntries) {
      const b = e.bagian || '-';
      const item = map.get(b) || { bagian: b, target: 0, realisasi: 0 };
      item.target += Number(e.target) || 0;
      item.realisasi += Number(e.realisasi) || 0;
      map.set(b, item);
    }
    return Array.from(map.values());
  }, [selectedOrderEntries]);

  // 2. Fetch Single Order Drilldown
  const handleSelectOrder = async (noOrder: string) => {
    setSelectedOrder(noOrder);
    setIsSearchDropdownOpen(false);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/jurnal-harian-produksi/analisa?no_order=${encodeURIComponent(noOrder)}`);
      const data = await res.json();
      setSelectedOrderEntries(data.entries || []);
      setSelectedOrderInfo(data.order || null);
    } catch {
      setSelectedOrderEntries([]);
      setSelectedOrderInfo(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBackToMulti = () => {
    setSelectedOrder(null);
    setSelectedOrderEntries([]);
    setSelectedOrderInfo(null);
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col gap-6">
      
      {/* 1. Header Metrics Cards (PPIC Command Bar) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {/* Card 1: Active Orders */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-medium text-xs block">Order Berjalan</span>
            <span className="text-2xl font-bold text-gray-900 mt-0.5 block">
              {summary ? summary.totalActiveOrders : '-'}
            </span>
            <span className="text-[11px] text-gray-400 mt-1 block">Aktif di lini produksi</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package size={20} />
          </div>
        </div>

        {/* Card 2: Critical / Approaching Deadline */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-medium text-xs block">Order Kritis / Deadline</span>
            <span className="text-2xl font-bold text-amber-600 mt-0.5 block">
              {summary ? summary.criticalOrdersCount : '-'}
            </span>
            <span className="text-[11px] text-amber-700 font-medium mt-1 block">&le; 5 hari / overdue</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Card 3: Busiest Station / Bottleneck */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-medium text-xs block">Stasiun Mesin Terpadat</span>
            <span className="text-sm font-bold text-gray-900 mt-1 block truncate max-w-[150px]">
              {summary ? summary.busiestStation : '-'}
            </span>
            <span className="text-[11px] text-gray-400 mt-1 block">Antrean pengerjaan terbanyak</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Factory size={20} />
          </div>
        </div>

        {/* Card 4: Overall Progress */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-medium text-xs block">Akumulasi Realisasi</span>
            <span className="text-2xl font-bold text-emerald-600 mt-0.5 block">
              {summary ? `${summary.overallProgress}%` : '-'}
            </span>
            <span className="text-[11px] text-gray-400 mt-1 block truncate max-w-[160px]">
              {summary ? `${summary.totalRealisasi.toLocaleString('id-ID')} / ${summary.totalTarget.toLocaleString('id-ID')}` : '-'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* 2. Mode Drilldown Single Order vs Master Timeline */}
      {selectedOrder ? (
        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto">
          {/* Back Button & Single Order Header */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToMulti}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
              >
                <ArrowLeft size={16} />
                <span>Kembali ke Master Timeline</span>
              </button>

              <div className="h-6 w-px bg-gray-200 hidden sm:block" />

              <div>
                <span className="text-xs text-gray-400 block">Detail WBS Pesanan</span>
                <span className="text-sm font-bold text-gray-900">{selectedOrder}</span>
              </div>
            </div>

            {selectedOrderInfo && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-600">
                <span className="font-semibold text-gray-900">{selectedOrderInfo.nama_prd}</span>
                <span>Oplah: <b>{selectedOrderInfo.qty.toLocaleString('id-ID')} {selectedOrderInfo.satuan}</b></span>
                {selectedOrderInfo.deadline_date && (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <Flag size={12} /> Deadline: {selectedOrderInfo.deadline_date}
                  </span>
                )}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 text-xs ml-auto sm:ml-0">
                  <button
                    onClick={() => setViewMode('gantt')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                      viewMode === 'gantt'
                        ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BarChart3 size={14} />
                    <span>Gantt Timeline</span>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                      viewMode === 'table'
                        ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <TableProperties size={14} />
                    <span>Tabel Riwayat</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {detailLoading ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
              <span>Memuat rincian alur mesin...</span>
            </div>
          ) : viewMode === 'gantt' ? (
            <OrderGanttChart entries={selectedOrderEntries} orderInfo={selectedOrderInfo} />
          ) : (
            <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-4">
              <div className="flex-1 min-h-0 flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">Tabel Transaksi JHP</h3>
                  <span className="text-xs text-gray-400 font-medium">({selectedOrderEntries.length} transaksi)</span>
                </div>
                <div className="flex-1 min-h-0 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-white shadow-sm">
                      <tr className="border-b border-gray-100 bg-gray-50/30">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Tgl</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Shift</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Bagian</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Karyawan</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Pekerjaan Target</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Pekerjaan Realisasi</th>
                        <th className="text-right px-3 py-2.5 text-xs font-medium text-gray-500">Target</th>
                        <th className="text-right px-3 py-2.5 text-xs font-medium text-gray-500">Realisasi</th>
                        <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedOrderEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{entry.tgl}</td>
                          <td className="px-4 py-2.5 text-gray-600">{entry.shift}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium border ${bagianColor(entry.bagian)}`}>
                              {entry.bagian}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-800">{entry.nama_karyawan || '-'}</td>
                          <td className="px-4 py-2.5 text-gray-800">{entry.pekerjaan_target || '-'}</td>
                          <td className="px-4 py-2.5 text-gray-800">{entry.pekerjaan_realisasi || '-'}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700 font-medium">{entry.target ?? '-'}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700 font-medium">{entry.realisasi ?? '-'}</td>
                          <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[200px] truncate">{entry.keterangan || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bagian Flow Summary */}
              <div className="xl:w-80 shrink-0">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Layers size={16} /> Alur Bagian
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {bagianSummary.map((item, i) => (
                      <div key={item.bagian} className="flex items-center gap-1">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${bagianColor(item.bagian)}`}>
                          {item.bagian}
                        </span>
                        {i < bagianSummary.length - 1 && (
                          <span className="text-gray-300 text-xs">&rarr;</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    {bagianSummary.map((item) => (
                      <div key={item.bagian} className="flex items-center justify-between text-xs text-gray-600">
                        <span className="font-medium">{item.bagian}</span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5">
                            <Target size={12} className="text-gray-400" />
                            {item.target.toLocaleString('id-ID')}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            {item.realisasi.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Master Multi-Order View */
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          
          {/* Filter & Search Toolbar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shrink-0">
            
            {/* Search Input */}
            <div className="relative max-w-sm w-full" ref={searchDropdownRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                placeholder="Cari no SPK / nama buku / lacak order..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (orderSearchResults.length > 0) setIsSearchDropdownOpen(true);
                }}
                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 focus:border-emerald-500"
              />
              {search && (
                <button
                  onClick={() => {
                    handleSearchChange('');
                    setIsSearchDropdownOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={15} />
                </button>
              )}

              {/* Autocomplete Dropdown to Jump Directly to an Order's Lifecycle */}
              {isSearchDropdownOpen && orderSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-gray-100">
                  <div className="px-3 py-1.5 bg-gray-50/80 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Lacak Alur Order Spesifik ({orderSearchResults.length} hasil)
                  </div>
                  {orderSearchResults.map((item) => (
                    <button
                      key={item.no_order}
                      type="button"
                      onClick={() => handleSelectOrder(item.no_order)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/60 transition-colors flex items-center justify-between gap-2 group"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-700 truncate">
                          {item.nama_order || item.no_order}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono truncate">
                          {item.no_order}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-gray-400 group-hover:text-emerald-600 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 text-xs">
                <button
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Aktif Berjalan
                </button>
                <button
                  onClick={() => setStatusFilter('CRITICAL')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === 'CRITICAL'
                      ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Kritis / Deadline
                </button>
                <button
                  onClick={() => setStatusFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === 'COMPLETED'
                      ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Selesai
                </button>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Semua
                </button>
              </div>

              {/* Station Filter Dropdown */}
              <select
                value={bagianFilter}
                onChange={(e) => setBagianFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Stasiun Mesin</option>
                <option value="SETTING">Prepress / Setting</option>
                <option value="QUALITY CONTROL">QC &amp; CTP Plate</option>
                <option value="POTONG">Potong Bahan</option>
                <option value="CETAK">Cetak Offset</option>
                <option value="FINISHING">Finishing &amp; Jilid</option>
                <option value="GUDANG">Gudang / Ekspedisi</option>
              </select>

              <button
                onClick={() => fetchSchedule(search, statusFilter, bagianFilter)}
                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-gray-200"
                title="Muat Ulang Jadwal"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Gantt Timeline Multi-Order */}
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 shadow-sm">
              <Loader2 size={28} className="animate-spin text-emerald-600 mx-auto mb-2" />
              <span className="text-xs font-medium">Memuat master schedule dan timeline produksi...</span>
            </div>
          ) : (
            <MultiOrderGanttChart orders={orders} onSelectOrder={handleSelectOrder} />
          )}

        </div>
      )}
    </div>
  );
}
