'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, X, Loader2, Package, Hash, Users, Target, CheckCircle2, 
  Layers, RefreshCw, BarChart3, AlertTriangle, Flag, CalendarRange, 
  ArrowLeft, Clock, Factory, ChevronRight
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
    }, 350);
  };

  // 2. Fetch Single Order Drilldown
  const handleSelectOrder = async (noOrder: string) => {
    setSelectedOrder(noOrder);
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
              </div>
            )}
          </div>

          {detailLoading ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
              <span>Memuat rincian alur mesin...</span>
            </div>
          ) : (
            <OrderGanttChart entries={selectedOrderEntries} orderInfo={selectedOrderInfo} />
          )}
        </div>
      ) : (
        /* Master Multi-Order View */
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          
          {/* Filter & Search Toolbar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shrink-0">
            
            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                placeholder="Cari no SPK / nama buku..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 focus:border-emerald-500"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={15} />
                </button>
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
