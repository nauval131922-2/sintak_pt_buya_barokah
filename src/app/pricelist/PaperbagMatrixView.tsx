'use client';

import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  ShoppingBag,
  Search,
  Box,
} from 'lucide-react';
import {
  PaperbagUkuran,
  PaperbagFinishing,
  PaperbagMasterParams,
  DEFAULT_PAPERBAG_PARAMS,
  calculatePaperbag,
  PAPERBAG_UKURAN_OPTIONS,
  PAPERBAG_FINISHING_OPTIONS,
  PAPERBAG_OPLAH_OPTIONS,
  PAPERBAG_VARIANTS,
} from '@/lib/paperbag-calculator';

interface PaperbagMatrixViewProps {
  customParams?: PaperbagMasterParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

export default function PaperbagMatrixView({
  customParams = DEFAULT_PAPERBAG_PARAMS,
  viewMode = 'matrix',
  setViewMode,
}: PaperbagMatrixViewProps) {
  const [filterUkuran, setFilterUkuran] = useState<string>('ALL');
  const [selectedFinishing, setSelectedFinishing] =
    useState<PaperbagFinishing>('Tanpa Laminasi');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priceType, setPriceType] = useState<'harga' | 'nego' | 'hpp'>('harga');

  // Generate matrix data across all 3 variants and all oplahs
  const matrixData = useMemo(() => {
    return PAPERBAG_UKURAN_OPTIONS.map((uk) => {
      const spec = PAPERBAG_VARIANTS[uk];
      const rows = PAPERBAG_OPLAH_OPTIONS.map((oplah) => {
        const res = calculatePaperbag(
          {
            ukuran: uk,
            oplah,
            finishing: selectedFinishing,
            marginPct: customParams.marginDefaultPct,
            negoDiskonPct: customParams.negoDefaultPct,
          },
          customParams
        );
        return {
          oplah,
          proses: res.prosesCetak,
          hppPerPcs: res.hppPerPcs,
          hargaJualPerPcs: res.hargaJualPerPcs,
          negoPerPcs: res.negoPerPcs,
          totalHargaJual: res.totalHargaJual,
        };
      });

      return {
        ukuran: uk,
        spec,
        rows,
      };
    });
  }, [selectedFinishing, customParams]);

  // Filtered variants
  const filteredMatrix = useMemo(() => {
    return matrixData.filter((item) => {
      if (filterUkuran !== 'ALL' && item.ukuran !== filterUkuran) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.spec.namaProduk.toLowerCase().includes(q);
        const matchUk = item.spec.ukuran.toLowerCase().includes(q);
        const matchKet = item.spec.keterangan.toLowerCase().includes(q);
        if (!matchName && !matchUk && !matchKet) return false;
      }
      return true;
    });
  }, [matrixData, filterUkuran, searchTerm]);

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Matrix Pricelist Paperbag (Tas Kertas)
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                3 Ukuran Standar (AC 230g)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tabel perbandingan harga jual, nego, dan HPP tas paperbag untuk seluruh ukuran dan kuantitas oplah
            </p>
          </div>
        </div>

        {/* Filter Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Price Type Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setPriceType('harga')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                priceType === 'harga'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Harga Jual
            </button>
            <button
              onClick={() => setPriceType('nego')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                priceType === 'nego'
                  ? 'bg-white text-amber-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Harga Nego
            </button>
            <button
              onClick={() => setPriceType('hpp')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                priceType === 'hpp'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              HPP / Pcs
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Ukuran */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-600">Ukuran:</span>
            <select
              value={filterUkuran}
              onChange={(e) => setFilterUkuran(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Semua Ukuran (3)</option>
              {PAPERBAG_UKURAN_OPTIONS.map((uk) => (
                <option key={uk} value={uk}>
                  {uk}
                </option>
              ))}
            </select>
          </div>

          {/* Finishing Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-600">Finishing:</span>
            <select
              value={selectedFinishing}
              onChange={(e) =>
                setSelectedFinishing(e.target.value as PaperbagFinishing)
              }
              className="py-1 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
            >
              {PAPERBAG_FINISHING_OPTIONS.map((fin) => (
                <option key={fin} value={fin}>
                  {fin}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-60">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari spesifikasi / ukuran..."
            className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                  No
                </th>
                <th className="py-3 px-3 min-w-[200px] sticky left-10 bg-slate-50 z-10 border-r border-slate-200">
                  Spesifikasi Paperbag
                </th>
                <th className="py-3 px-2 text-center border-r border-slate-200 w-24">
                  Terbuka (cm)
                </th>
                <th className="py-3 px-2 text-center border-r border-slate-200 w-20">
                  Plano Yield
                </th>
                {PAPERBAG_OPLAH_OPTIONS.map((oplah) => (
                  <th
                    key={oplah}
                    className="py-3 px-2 text-right font-mono min-w-[85px] border-r border-slate-200 last:border-r-0"
                  >
                    <div>{oplah.toLocaleString('id-ID')}</div>
                    <div className="text-[9px] font-normal text-slate-600">
                      {oplah >= 3000 ? 'SM' : 'Oliver'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredMatrix.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + PAPERBAG_OPLAH_OPTIONS.length}
                    className="py-8 text-center text-slate-600"
                  >
                    Tidak ada ukuran paperbag yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((item, idx) => (
                  <tr
                    key={item.ukuran}
                    className="hover:bg-emerald-50/30 transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-600 text-[11px] font-mono sticky left-0 bg-white group-hover:bg-emerald-50/30 z-10 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-10 bg-white group-hover:bg-emerald-50/30 z-10 border-r border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag size={13} className="text-emerald-700 shrink-0" />
                        <span>{item.spec.namaProduk}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 font-normal pl-5">
                        Art Carton 230g · Tali Kur · {selectedFinishing}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-600 border-r border-slate-100">
                      {item.spec.panjangTerbukaCm} × {item.spec.lebarTerbukaCm}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-[11px] text-slate-700 border-r border-slate-100">
                      {item.spec.planoYieldTas} tas/pln
                    </td>
                    {item.rows.map((r) => {
                      const displayVal =
                        priceType === 'harga'
                          ? r.hargaJualPerPcs
                          : priceType === 'nego'
                          ? r.negoPerPcs
                          : Math.round(r.hppPerPcs);

                      return (
                        <td
                          key={r.oplah}
                          className="py-2.5 px-2 text-right font-mono font-semibold border-r border-slate-100 last:border-r-0"
                        >
                          <span
                            className={
                              priceType === 'harga'
                                ? 'text-emerald-950 font-bold'
                                : priceType === 'nego'
                                ? 'text-amber-950 font-bold'
                                : 'text-slate-700'
                            }
                          >
                            Rp {displayVal.toLocaleString('id-ID')}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
