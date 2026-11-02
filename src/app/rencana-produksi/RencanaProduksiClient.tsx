'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Search, X, Loader2, Package, Hash, Users, Target, CheckCircle2, 
  Layers, RefreshCw, BarChart3, AlertTriangle, AlertCircle, Flag, CalendarRange, 
  ArrowLeft, Clock, Factory, ChevronRight, TableProperties, Calendar,
  RotateCcw, Filter, Plus
} from 'lucide-react';
import MultiOrderGanttChart, { type ProductionOrderSummary } from '@/components/MultiOrderGanttChart';
import OrderGanttChart, { type JhpEntryForGantt, type OrderInfoForGantt } from '@/components/OrderGanttChart';
import DatePicker from '@/components/DatePicker';
import SquareDropdown from '@/components/SquareDropdown';
import BuatRencanaProduksiModal from '@/components/BuatRencanaProduksiModal';
import BaseModal from '@/components/ui/BaseModal';

interface SummaryData {
  totalActiveOrders: number;
  criticalOrdersCount: number;
  completedCount: number;
  totalTarget: number;
  totalRealisasi: number;
  overallProgress: number;
  busiestStation?: string;
  onTrackOrdersCount?: number;
}
const formatDateDisplay = (d: Date | null): string => {
  if (!d) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()}-${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
};


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

  // Date Range Filter
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  // Detail Drilldown
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const bagianDropdownOptions = useMemo(() => [
    { value: 'ALL', label: 'Semua Bagian' },
    { value: 'SETTING', label: 'SETTING' },
    { value: 'QUALITY CONTROL', label: 'QUALITY CONTROL' },
    { value: 'CETAK', label: 'CETAK' },
    { value: 'FINISHING', label: 'FINISHING' },
    { value: 'GUDANG', label: 'GUDANG' },
  ], []);

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCardInfo, setActiveCardInfo] = useState<{
    title: string;
    source: string;
    explanation: string;
    calculation: string;
  } | null>(null);


  // 1. Fetch Multi-Order Schedule
  const fetchSchedule = useCallback(async (
    qSearch: string, 
    sFilter: string, 
    bFilter: string,
    sDate: Date | null,
    eDate: Date | null
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (qSearch) params.set('search', qSearch);
      if (sFilter !== 'ALL') params.set('status', sFilter);
      if (bFilter !== 'ALL') params.set('bagian', bFilter);
      if (sDate) {
        const sStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
        params.set('startDate', sStr);
      }
      if (eDate) {
        const eStr = `${eDate.getFullYear()}-${String(eDate.getMonth() + 1).padStart(2, '0')}-${String(eDate.getDate()).padStart(2, '0')}`;
        params.set('endDate', eStr);
      }


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
    fetchSchedule(search, statusFilter, bagianFilter, startDate, endDate);
  }, [fetchSchedule, statusFilter, bagianFilter, startDate, endDate]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSchedule(val, statusFilter, bagianFilter, startDate, endDate);
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
    <div className="w-full flex flex-col gap-3.5 pb-8">
      
      {/* 1. Header Metrics Cards (PPIC Command Bar) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {/* Card 1: Active Orders */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium text-xs block">Order Berjalan</span>
              <button
                type="button"
                onClick={() => setActiveCardInfo({
                  title: 'Order Berjalan',
                  source: 'Database tabel rencana_produksi dan log aktivitas produksi jurnal_harian_produksi',
                  explanation: 'Menampilkan akumulasi jumlah nomor order produksi (SOPD) yang sedang aktif dijadwalkan atau dikerjakan di lini lantai pabrik.',
                  calculation: 'Menghitung seluruh pesanan dengan status rencana belum selesai (status != SELESAI) pada rentang tanggal jadwal terpilih.'
                })}
                className="w-4 h-4 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Keterangan & Sumber Data"
              >
                <AlertCircle size={10} />
              </button>
            </div>
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
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium text-xs block">Order Kritis / Deadline</span>
              <button
                type="button"
                onClick={() => setActiveCardInfo({
                  title: 'Order Kritis / Deadline',
                  source: 'Tanggal selesai rencana (rencana_produksi) dibandingkan deadline pesanan (sopd_harga) & laporan kendala mesin',
                  explanation: 'Menampilkan jumlah order yang membutuhkan perhatian khusus karena berisiko terlambat atau mengalami hambatan operasional mesin.',
                  calculation: 'Dihitung apabila sisa hari sebelum batas deadline ≤ 5 hari kerja, sudah melewati tanggal deadline (overdue), atau terdapat laporan kendala mesin yang aktif.'
                })}
                className="w-4 h-4 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-500 hover:text-amber-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Keterangan & Sumber Data"
              >
                <AlertCircle size={10} />
              </button>
            </div>
            <span className="text-2xl font-bold text-amber-600 mt-0.5 block">
              {summary ? summary.criticalOrdersCount : '-'}
            </span>
            <span className="text-[11px] text-amber-700 font-medium mt-1 block">&le; 5 hari / overdue</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Card 3: Order On-Track */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium text-xs block">Order On-Track</span>
              <button
                type="button"
                onClick={() => setActiveCardInfo({
                  title: 'Order On-Track (Aman & Lancar)',
                  source: 'Kalkulasi selisih Order Berjalan dikurangi Order Kritis',
                  explanation: 'Menampilkan jumlah pesanan aktif yang jadwal tahapan mesinnya berjalan lancar, aman, dan tanpa kendala.',
                  calculation: 'Formula: (Total Order Berjalan - Order Kritis). Order berada pada rentang waktu aman (> 5 hari sebelum deadline) dan proses mesin lancar.'
                })}
                className="w-4 h-4 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-500 hover:text-emerald-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Keterangan & Sumber Data"
              >
                <AlertCircle size={10} />
              </button>
            </div>
            <span className="text-2xl font-bold text-emerald-600 mt-0.5 block">
              {summary ? (summary.onTrackOrdersCount ?? Math.max(0, summary.totalActiveOrders - summary.criticalOrdersCount)) : '-'}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium mt-1 block">Jadwal aman &amp; lancar</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Card 4: Overall Progress */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium text-xs block">Akumulasi Realisasi</span>
              <button
                type="button"
                onClick={() => setActiveCardInfo({
                  title: 'Akumulasi Realisasi Produksi',
                  source: 'Agregasi kolom realisasi dan target pada tabel jurnal_harian_produksi',
                  explanation: 'Menampilkan persentase pencapaian kuantitas fisik (eks/lembar) yang sudah terealisasi dibandingkan total target rencana kerja.',
                  calculation: 'Formula: (Total Realisasi ÷ Total Target) × 100% untuk seluruh baris tahapan mesin dari pesanan yang sedang difilter.'
                })}
                className="w-4 h-4 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-500 hover:text-emerald-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Keterangan & Sumber Data"
              >
                <AlertCircle size={10} />
              </button>
            </div>
            <span className="text-2xl font-bold text-teal-600 mt-0.5 block">
              {summary ? `${summary.overallProgress}%` : '-'}
            </span>
            <span 
              className="text-[11px] text-gray-400 mt-1 block truncate max-w-full"
              title={summary ? `Total Realisasi: ${summary.totalRealisasi.toLocaleString('id-ID')} / Total Target: ${summary.totalTarget.toLocaleString('id-ID')}` : undefined}
            >
              {summary ? `${summary.totalRealisasi.toLocaleString('id-ID')} / ${summary.totalTarget.toLocaleString('id-ID')}` : '-'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <BarChart3 size={20} />
          </div>
        </div>
      </div>

      {/* 2. Mode Drilldown Single Order vs Master Timeline */}
      {selectedOrder ? (
        <div className="flex flex-col gap-4">
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
                <span className="text-xs text-gray-400 block">Detail Alur Pesanan</span>
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
                          {item.bagian.toUpperCase()}
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
                        <span className="font-medium uppercase">{item.bagian}</span>
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
        <div className="flex flex-col gap-3">
          
          {/* Toolbar Search & Filters (Format Laporan Pekerjaan) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm flex flex-col gap-2.5 shrink-0">
            {/* Baris 1: Search & Reload */}
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => fetchSchedule(search, statusFilter, bagianFilter, startDate, endDate)}
                disabled={loading}
                className="h-9 px-3 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
                title="Reload Jadwal Produksi"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
                <span className="hidden sm:inline">Reload</span>
              </button>


              <div className="relative flex-1 min-w-0" ref={searchDropdownRef}>
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nomor order atau nama order..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (orderSearchResults.length > 0) setIsSearchDropdownOpen(true);
                  }}
                  className="w-full pl-9 pr-8 h-9 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSearchChange('');
                      setIsSearchDropdownOpen(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}

                {/* Autocomplete Dropdown */}
                {isSearchDropdownOpen && orderSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-gray-100">
                    <div className="px-3 py-1.5 bg-gray-50/80 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Lacak Alur Order ({orderSearchResults.length} hasil)
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

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                title="Buat rencana jadwal produksi baru"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Buat Rencana</span>
              </button>
            </div>

            {/* Baris 2: Controls Filter (Status, Tanggal, Bagian, Clear Filter) */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="hidden sm:flex items-center text-xs text-slate-500 font-medium shrink-0">
                <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" /> Filter:
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 text-xs">
                <button
                  type="button"
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
                  type="button"
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
                  type="button"
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
                  type="button"
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

              {/* Date Range Filter (Style Laporan Pekerjaan) */}
              <div className="flex items-center justify-between gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200 min-w-0">
                <div className="w-24 sm:w-28">
                  <DatePicker
                    name="startDate"
                    value={startDate}
                    onChange={(d) => setStartDate(d)}
                    popupAlign="left"
                    customTrigger={() => (
                      <div
                        className="h-7 px-1.5 sm:px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 hover:text-emerald-700 hover:border-emerald-500 transition-all flex items-center gap-1 shadow-2xs cursor-pointer w-full"
                        title={startDate ? `Dari Tgl: ${formatDateDisplay(startDate)}` : "Dari Tanggal"}
                      >
                        <Calendar size={11} className="text-slate-400 shrink-0" />
                        <span className={`truncate ${!startDate ? "text-slate-400 font-normal" : ""}`}>
                          {startDate ? formatDateDisplay(startDate) : "Dari Tgl"}
                        </span>
                      </div>
                    )}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-bold px-0.5 shrink-0">-</span>
                <div className="w-24 sm:w-28">
                  <DatePicker
                    name="endDate"
                    value={endDate}
                    onChange={(d) => setEndDate(d)}
                    popupAlign="left"
                    customTrigger={() => (
                      <div
                        className="h-7 px-1.5 sm:px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 hover:text-emerald-700 hover:border-emerald-500 transition-all flex items-center gap-1 shadow-2xs cursor-pointer w-full"
                        title={endDate ? `Sampai Tgl: ${formatDateDisplay(endDate)}` : "Sampai Tanggal"}
                      >
                        <Calendar size={11} className="text-slate-400 shrink-0" />
                        <span className={`truncate ${!endDate ? "text-slate-400 font-normal" : ""}`}>
                          {endDate ? formatDateDisplay(endDate) : "Sampai Tgl"}
                        </span>
                      </div>
                    )}
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => { setStartDate(null); setEndDate(null); }}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                    title="Reset Tanggal"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Bagian Filter (SquareDropdown) */}
              <div className="w-full sm:w-auto">
                <SquareDropdown
                  options={bagianDropdownOptions}
                  value={bagianFilter}
                  onChange={setBagianFilter}
                  searchPlaceholder="Cari Bagian..."
                  widthClass="w-full sm:w-36 md:w-40 lg:w-44"
                />
              </div>

              {/* Tombol Reset Filter (Tepat setelah Filter Bagian, tanpa align right) */}
              {(search || statusFilter !== 'ACTIVE' || bagianFilter !== 'ALL' || startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ACTIVE');
                    setBagianFilter('ALL');
                    setStartDate(null);
                    setEndDate(null);
                    fetchSchedule('', 'ACTIVE', 'ALL', null, null);
                  }}
                  className="h-7 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  title="Reset Semua Filter"
                >
                  <RotateCcw size={12} />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* Gantt Timeline Multi-Order */}
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 shadow-sm flex-1 min-h-0 flex flex-col items-center justify-center">
              <Loader2 size={28} className="animate-spin text-emerald-600 mx-auto mb-2" />
              <span className="text-xs font-medium">Memuat master schedule dan timeline produksi...</span>
            </div>
          ) : (
            <MultiOrderGanttChart orders={orders} onSelectOrder={handleSelectOrder} />
          )}

        </div>
      )}
      {/* Modal Wizard Buat Rencana Produksi Baru */}
      <BuatRencanaProduksiModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchSchedule(search, statusFilter, bagianFilter, startDate, endDate)}
      />

      {/* Modal Keterangan Sumber Data Kartu */}
      {activeCardInfo && (
        <BaseModal
          isOpen={true}
          onClose={() => setActiveCardInfo(null)}
          title={`Keterangan Metrik: ${activeCardInfo.title}`}
          subtitle="Informasi asal-usul sumber data dan logika perhitungan"
          icon={AlertCircle}
          maxWidth="max-w-md"
        >
          <div className="space-y-3.5 text-xs text-gray-700">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Sumber Data
              </span>
              <p className="font-semibold text-slate-800 leading-relaxed">
                {activeCardInfo.source}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Fungsi &amp; Keterangan
              </span>
              <p className="text-slate-600 leading-relaxed">
                {activeCardInfo.explanation}
              </p>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Logika Perhitungan
              </span>
              <p className="text-emerald-900 font-medium leading-relaxed">
                {activeCardInfo.calculation}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveCardInfo(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Mengerti &amp; Tutup
              </button>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
}
