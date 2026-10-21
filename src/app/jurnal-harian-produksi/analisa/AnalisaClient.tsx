'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, X, Loader2, Package, Hash, Users, Target, CheckCircle2, 
  Layers, RefreshCw, BarChart3, TableProperties, Flag 
} from 'lucide-react';
import OrderGanttChart from '@/components/OrderGanttChart';

interface JhpEntry {
  id: number;
  tgl: string;
  shift: string;
  bagian: string;
  no_order: string;
  nama_order: string;
  pekerjaan_target: string | null;
  no_order_2: string | null;
  nama_order_2: string | null;
  pekerjaan_realisasi: string | null;
  target: number | null;
  realisasi: number | null;
  nama_karyawan: string | null;
  keterangan: string | null;
  jam: string | null;
  kendala: string | null;
}

interface OrderInfo {
  faktur: string;
  nama_prd: string;
  qty: number;
  satuan: string;
  nama_pelanggan: string;
  tgl_order?: string | null;
  deadline_date?: string | null;
  finished_date?: string | null;
}

interface SearchOrder {
  no_order: string;
  nama_order: string;
  nama_prd: string | null;
  qty: number | null;
  satuan: string | null;
  nama_pelanggan: string | null;
  tgl_order: string | null;
}

export default function AnalisaClient() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [entries, setEntries] = useState<JhpEntry[]>([]);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'gantt' | 'table'>('gantt');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<SearchOrder[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const displayOrders = query.length >= 2 ? results : recentOrders;

  // Load saved order on mount
  useEffect(() => {
    const saved = localStorage.getItem('analisa_selected_order');
    if (saved) selectOrder(saved);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/jurnal-harian-produksi/analisa?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.orders || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  const loadRecentOrders = useCallback(async () => {
    setRecentLoading(true);
    try {
      const res = await fetch('/api/jurnal-harian-produksi/analisa?recent=true');
      const data = await res.json();
      setRecentOrders(data.orders || []);
    } catch { setRecentOrders([]); }
    finally { setRecentLoading(false); }
  }, []);

  const openDropdown = () => {
    setIsDropdownOpen(true);
    if (query.length < 2 && recentOrders.length === 0) {
      loadRecentOrders();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectOrder = async (noOrder: string) => {
    setSelectedOrder(noOrder);
    setIsDropdownOpen(false);
    setQuery('');
    setResults([]);
    localStorage.setItem('analisa_selected_order', noOrder);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/jurnal-harian-produksi/analisa?no_order=${encodeURIComponent(noOrder)}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setOrderInfo(data.order || null);
    } catch {
      setEntries([]);
      setOrderInfo(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshEntries = useCallback(async () => {
    if (!selectedOrder) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/jurnal-harian-produksi/analisa?no_order=${encodeURIComponent(selectedOrder)}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setOrderInfo(data.order || null);
    } catch {
      setEntries([]);
      setOrderInfo(null);
    } finally {
      setDetailLoading(false);
    }
  }, [selectedOrder]);

  const clearSelection = () => {
    setSelectedOrder(null);
    setEntries([]);
    setOrderInfo(null);
    localStorage.removeItem('analisa_selected_order');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = displayOrders;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < items.length) {
      e.preventDefault();
      selectOrder(items[focusedIndex].no_order);
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

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

  const uniqueBagian = [...new Set(entries.map(e => e.bagian))];
  const totalTargetByBagian = (bagian: string) =>
    entries.filter(e => e.bagian === bagian).reduce((s, e) => s + (Number(e.target) || 0), 0);
  const totalRealisasiByBagian = (bagian: string) =>
    entries.filter(e => e.bagian === bagian).reduce((s, e) => s + (Number(e.realisasi) || 0), 0);

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col gap-6">
      {/* Search Input & Dropdown */}
      <div className="relative max-w-lg shrink-0" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari order (no order / nama order)..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setFocusedIndex(-1); setIsDropdownOpen(true); }}
            onFocus={openDropdown}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 focus:border-emerald-500"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setFocusedIndex(-1); inputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          )}
        </div>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
            {recentLoading && query.length < 2 && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" /> Memuat data...
              </div>
            )}

            {!recentLoading && displayOrders.length > 0 && displayOrders.map((order, i) => (
              <button
                key={order.no_order}
                onClick={() => selectOrder(order.no_order)}
                onMouseEnter={() => setFocusedIndex(i)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                  i === focusedIndex ? 'bg-emerald-50' : 'hover:bg-gray-50'
                }`}
              >
                <Hash size={16} className="text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900">{order.no_order}</div>
                  <div className="text-xs text-gray-500 truncate">{order.nama_order || order.nama_prd || '-'}</div>
                </div>
                <div className="ml-auto flex items-center gap-3 shrink-0">
                  {order.tgl_order && (
                    <span className="text-xs text-gray-400">{order.tgl_order}</span>
                  )}
                  {order.qty && (
                    <span className="text-xs text-gray-400">{order.qty} {order.satuan || ''}</span>
                  )}
                </div>
              </button>
            ))}

            {!recentLoading && query.length >= 2 && displayOrders.length === 0 && !loading && (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">
                Tidak ada order ditemukan.
              </div>
            )}

            {!recentLoading && query.length < 2 && displayOrders.length === 0 && !loading && (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">
                Ketik no order atau nama order untuk mulai.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6">
        {selectedOrder ? (
          <>
            {orderInfo && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Hash size={16} className="text-gray-400" />
                  <span className="font-semibold text-gray-900">{orderInfo.faktur}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-gray-400" />
                  <span className="text-gray-700">{orderInfo.nama_prd}</span>
                </div>
                {orderInfo.nama_pelanggan && (
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <span className="text-gray-600">{orderInfo.nama_pelanggan}</span>
                  </div>
                )}
                {orderInfo.qty && (
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-gray-400" />
                    <span className="text-gray-700 font-medium">{orderInfo.qty.toLocaleString('id-ID')} {orderInfo.satuan || ''}</span>
                  </div>
                )}
                {orderInfo.deadline_date && (
                  <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-xs">
                    <Flag size={14} className="text-amber-600" />
                    <span className="font-semibold">Deadline: {orderInfo.deadline_date}</span>
                  </div>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={refreshEntries}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                    title="Muat Ulang Data"
                  >
                    <RefreshCw size={16} className={detailLoading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={clearSelection}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Hapus Pilihan"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {detailLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
                <Loader2 size={16} className="animate-spin text-emerald-600" /> Memuat riwayat produksi...
              </div>
            )}

            {!detailLoading && entries.length > 0 && (
              <div className="flex flex-col gap-4">
                {/* View Switcher Toolbar */}
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-800">
                      {viewMode === 'gantt' ? 'Gantt Timeline Produksi' : 'Riwayat Produksi'}
                    </h3>
                    <span className="text-xs text-gray-400 font-medium">({entries.length} baris JHP)</span>
                  </div>

                  <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
                    <button
                      onClick={() => setViewMode('gantt')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        viewMode === 'gantt'
                          ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <BarChart3 size={14} />
                      <span>Gantt Timeline</span>
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        viewMode === 'table'
                          ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <TableProperties size={14} />
                      <span>Tabel Riwayat</span>
                    </button>
                  </div>
                </div>

                {/* Content: Gantt View or Table View */}
                {viewMode === 'gantt' ? (
                  <OrderGanttChart entries={entries} orderInfo={orderInfo} />
                ) : (
                  <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-4">
                    <div className="flex-1 min-h-0 flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
                        <h3 className="text-sm font-semibold text-gray-700">Tabel Transaksi JHP</h3>
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
                            {entries.map((entry) => (
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
                          {uniqueBagian.map((bagian, i) => (
                            <div key={bagian} className="flex items-center gap-1">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${bagianColor(bagian)}`}>
                                {bagian}
                              </span>
                              {i < uniqueBagian.length - 1 && (
                                <span className="text-gray-300 text-xs">&rarr;</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 space-y-2">
                          {uniqueBagian.map((bagian) => (
                            <div key={bagian} className="flex items-center justify-between text-xs text-gray-600">
                              <span className="font-medium">{bagian}</span>
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-0.5">
                                  <Target size={12} className="text-gray-400" />
                                  {totalTargetByBagian(bagian)}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <CheckCircle2 size={12} className="text-emerald-500" />
                                  {totalRealisasiByBagian(bagian)}
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
            )}

            {!detailLoading && entries.length === 0 && selectedOrder && (
              <div className="text-sm text-gray-500 text-center py-12">
                <Package size={48} className="mx-auto mb-3 text-gray-300" />
                Tidak ada data produksi untuk order ini.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-gray-400 text-center">
              <Search size={48} className="mx-auto mb-3 text-gray-200" />
              Ketik nomor order atau nama order di kolom pencarian di atas untuk menganalisis alur produksi.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
