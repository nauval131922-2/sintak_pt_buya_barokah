'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  RefreshCw,
  X,
  Check,
  Calendar,
  Building2,
  Tag,
  Scale,
  Calculator,
  ExternalLink,
} from 'lucide-react';
import { GlobalMasterParams } from '@/lib/global-master-params';
import { toast } from '@/lib/toast';

interface RekapItem {
  id: number;
  tgl: string;
  faktur: string;
  kd_supplier: string;
  kd_barang: string;
  qty: number;
  harga: number;
  total_item: number;
  calculatedPricePerKg?: number;
  unitType?: 'kg' | 'lembar' | 'rim' | 'roll' | 'pcs' | 'box' | 'other';
}

interface RekapLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetKey: keyof GlobalMasterParams;
  targetLabel: string;
  currentValue: number;
  isRupiah?: boolean;
  isDecimal?: boolean;
  onSelectValue: (newValue: number, selectedItem: RekapItem) => void;
}

export default function RekapLookupModal({
  isOpen,
  onClose,
  targetKey,
  targetLabel,
  currentValue,
  isRupiah = true,
  isDecimal = false,
  onSelectValue,
}: RekapLookupModalProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [items, setItems] = useState<RekapItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch candidates from API dengan AbortController untuk membatalkan request lama
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          targetParam: targetKey,
          limit: limit.toString(),
        });
        if (debouncedQuery.trim()) {
          params.set('q', debouncedQuery.trim());
        }
        const res = await fetch(`/api/pricelist/rekap-lookup?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (active && json.success && Array.isArray(json.data)) {
          setItems(json.data);
          setTotalCount(json.total || json.data.length);
        } else if (active) {
          setItems([]);
          setTotalCount(0);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && active) {
          console.error('Failed to fetch rekap lookup candidates:', err);
          setItems([]);
          setTotalCount(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [isOpen, targetKey, debouncedQuery, limit, reloadKey]);

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setDebouncedQuery('');
      setSelectedId(null);
      setLimit(50);
    }
  }, [isOpen, targetKey]);
  if (!isOpen) return null;

  const isKgField = targetKey.toLowerCase().includes('hvs') || 
                    targetKey.toLowerCase().includes('ap') || 
                    targetKey.toLowerCase().includes('ac') || 
                    targetKey.toLowerCase().includes('kg');

  const handleApply = (item: RekapItem) => {
    let finalVal = item.harga;
    if (isKgField && item.calculatedPricePerKg && item.unitType !== 'kg') {
      finalVal = item.calculatedPricePerKg;
    }
    onSelectValue(finalVal, item);
    toast.success(`Berhasil menerapkan tarif Rp ${finalVal.toLocaleString('id-ID')} dari [${item.kd_barang}]`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-400 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl max-h-[88vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl border border-white/20 backdrop-blur-xs">
              <ShoppingCart className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Ambil dari Rekap Pembelian Barang</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-700/80 px-2 py-0.5 rounded-full border border-emerald-500/60">
                  Data Riil Pembelian
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Target Field: <span className="font-semibold text-white underline underline-offset-2">{targetLabel}</span> (Saat ini: <span className="font-bold text-amber-200">Rp {currentValue.toLocaleString('id-ID')}</span>)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Cari nama barang pembelian (mis: HVS 70, Art Paper 120, Plat CTP, dll)...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((prev) => prev + 1)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>

        {/* Quick Tips */}
        {isKgField && (
          <div className="px-5 py-2.5 bg-amber-50/70 border-b border-amber-200/60 flex items-center justify-between text-xs text-amber-900 shrink-0">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Konversi Otomatis ke /Kg:</strong> Untuk pembelian lembaran/plano/rim (misal <i>LEMBAR - HVS 70-65</i> seharga Rp 705), sistem otomatis mengonversikannya menjadi tarif per Kg (Rp 15.500/kg).
              </span>
            </div>
          </div>
        )}

        {/* Table List of Purchases */}
        <div className="overflow-x-auto overflow-y-auto flex-1 p-3 sm:p-5 custom-scrollbar">
          {loading && items.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto text-emerald-600 opacity-60" />
              <p className="text-xs font-semibold text-slate-600">Memuat riwayat transaksi pembelian...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-semibold text-slate-600">Tidak ada riwayat pembelian yang cocok dengan kata kunci.</p>
              <p className="text-[11px] text-slate-400">Coba gunakan kata kunci pencarian yang lebih umum.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 w-28">Tanggal</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Nama Barang & Faktur</th>
                    <th className="py-2.5 px-3 min-w-[140px]">Supplier</th>
                    <th className="py-2.5 px-3 text-right w-24">Qty</th>
                    {isKgField && (
                      <th className="py-2.5 px-3 text-right w-32 bg-emerald-50/80 text-emerald-950">
                        Hasil Konversi /Kg
                      </th>
                    )}
                    <th className="py-2.5 px-3 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {items.map((item) => {
                    const isSelected = selectedId === item.id;
                    const convertedVal = isKgField && item.calculatedPricePerKg && item.unitType !== 'kg'
                      ? item.calculatedPricePerKg
                      : item.harga;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/80 hover:bg-emerald-100/70 ring-1 ring-emerald-500/20'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Tanggal & Faktur */}
                        <td className="py-2.5 px-3 align-top">
                          <div className="flex items-center gap-1 font-bold text-slate-800 tabular-nums">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.tgl}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate max-w-[100px]" title={item.faktur}>
                            {item.faktur}
                          </span>
                        </td>

                        {/* Nama Barang */}
                        <td className="py-2.5 px-3 align-top">
                          <span className="font-bold text-slate-900 block leading-snug">
                            {item.kd_barang}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[9.5px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              Unit: {item.unitType?.toUpperCase() || 'PCS'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Total Faktur: Rp {Math.round(item.total_item).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </td>

                        {/* Supplier */}
                        <td className="py-2.5 px-3 align-top">
                          <div className="flex items-center gap-1 text-slate-700">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[130px]" title={item.kd_supplier || '-'}>
                              {item.kd_supplier || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Qty */}
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800 tabular-nums align-top">
                          {item.qty.toLocaleString('id-ID')}
                        </td>

                        {/* Harga Beli Asli */}
                        <td className="py-2.5 px-3 text-right align-top">
                          <span className="font-bold text-slate-900 tabular-nums block">
                            Rp {item.harga.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            /{item.unitType || 'item'}
                          </span>
                        </td>

                        {/* Hasil Konversi /Kg */}
                        {isKgField && (
                          <td className="py-2.5 px-3 text-right align-top bg-emerald-50/50">
                            <span className="font-black text-emerald-800 tabular-nums block text-xs">
                              Rp {convertedVal.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[9.5px] font-semibold text-emerald-600 uppercase">
                              / Kg Master
                            </span>
                          </td>
                        )}

                        {/* Tombol Terapkan */}
                        <td className="py-2.5 px-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApply(item);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-xs hover:shadow transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Pilih
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Menampilkan <strong>{items.length}</strong> dari total <strong>{totalCount.toLocaleString('id-ID')}</strong> riwayat pembelian cocok.
            </span>
          </div>
          <div className="flex items-center gap-2">
            {items.length < totalCount && (
              <button
                type="button"
                onClick={() => setLimit((prev) => prev + 50)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg transition-all cursor-pointer text-xs"
              >
                Muat Lebih Banyak (+50)
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-all cursor-pointer text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
