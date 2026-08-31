'use client';

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  X,
  LayoutGrid,
  TableProperties,
  Layers,
} from 'lucide-react';
import { useAutoFitColumns } from '@/hooks/useAutoFitColumns';
import {
  calculateBukuTulisHpp,
  DEFAULT_BUKU_TULIS_PARAMS,
  BukuTulisMasterParams,
  BukuTulisUkuranType,
  BUKU_TULIS_TIERS,
  BUKU_TULIS_CONFIG,
} from '@/lib/buku-tulis-calculator';

interface BukuTulisMatrixViewProps {
  customParams?: BukuTulisMasterParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

const UKURAN_LIST: BukuTulisUkuranType[] = ['15,5 x 21', '16 x 21'];

export default function BukuTulisMatrixView({
  customParams = DEFAULT_BUKU_TULIS_PARAMS,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
}: BukuTulisMatrixViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUkuranFilter, setSelectedUkuranFilter] = useState<BukuTulisUkuranType | 'ALL'>('ALL');
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;
  const { ref: gridRef, cols: autoCols } = useAutoFitColumns(380);

  const calc = (oplah: number, ukuran: BukuTulisUkuranType) =>
    calculateBukuTulisHpp(
      { oplah, ukuran, jumlahHalaman: 72, opsiLaminasi: true, opsiSisir: true, marginPct: 20, negoDiskonPct: 4 },
      customParams
    );

  // Matrix: baris = oplah, kolom = ukuran (2 varian)
  const matrixData = useMemo(() => {
    const ukurans = selectedUkuranFilter === 'ALL' ? UKURAN_LIST : [selectedUkuranFilter];
    return BUKU_TULIS_TIERS.map((oplah) => {
      const q = searchTerm.trim();
      if (q && !oplah.toString().includes(q)) return null;
      return {
        oplah,
        cols: ukurans.map((ukuran) => {
          const r = calc(oplah, ukuran);
          return { ukuran, hpp: r.hppPerPcs, jual: r.hargaJualPerPcs, nego: r.hargaNegoPerPcs, totalJual: r.totalHargaJual };
        }),
      };
    }).filter(Boolean) as { oplah: number; cols: { ukuran: BukuTulisUkuranType; hpp: number; jual: number; nego: number; totalJual: number }[] }[];
  }, [customParams, searchTerm, selectedUkuranFilter]);

  // Flat table
  const flatTableRows = useMemo(() => {
    const list: {
      oplah: number; ukuran: BukuTulisUkuranType; hpp: number; jual: number; nego: number; totalJual: number; margin: number;
    }[] = [];

    const ukurans = selectedUkuranFilter === 'ALL' ? UKURAN_LIST : [selectedUkuranFilter];

    ukurans.forEach((ukuran) => {
      BUKU_TULIS_TIERS.forEach((oplah) => {
        const q = searchTerm.toLowerCase().trim();
        if (q) {
          const match =
            oplah.toString().includes(q) ||
            ukuran.toLowerCase().includes(q);
          if (!match) return;
        }
        const r = calc(oplah, ukuran);
        list.push({
          oplah, ukuran,
          hpp: r.hppPerPcs,
          jual: r.hargaJualPerPcs,
          nego: r.hargaNegoPerPcs,
          totalJual: r.totalHargaJual,
          margin: r.marginPct,
        });
      });
    });

    return list;
  }, [customParams, searchTerm, selectedUkuranFilter]);

  const ukuranCols = selectedUkuranFilter === 'ALL' ? UKURAN_LIST : [selectedUkuranFilter];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
              Pricelist Matriks Buku Tulis 72 Hal
            </h2>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tabel perbandingan HPP &amp; harga jual buku tulis 72 hal Soft Cover per oplah &amp; ukuran (margin 20%, nego 4%, laminasi glossy &amp; sisir ON).
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari oplah, ukuran..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Ukuran */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-slate-500 font-semibold hidden sm:inline">Ukuran:</span>
          <select
            value={selectedUkuranFilter}
            onChange={(e) => setSelectedUkuranFilter(e.target.value as BukuTulisUkuranType | 'ALL')}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Ukuran</option>
            {UKURAN_LIST.map((u) => (
              <option key={u} value={u}>{u} cm</option>
            ))}
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              viewMode === 'matrix' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Tampilan Matriks"
          >
            <LayoutGrid size={13} />
            <span className="hidden sm:inline">Matriks</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Tampilan Tabel Rinci"
          >
            <TableProperties size={13} />
            <span className="hidden sm:inline">Tabel</span>
          </button>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        <div className="flex flex-col gap-6">
          {matrixData.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              Tidak ada data yang sesuai pencarian.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  <h3 className="text-sm font-bold text-gray-800 tracking-tight">Buku Tulis 72 Hal</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {selectedUkuranFilter === 'ALL' ? 'Semua Ukuran · 72 hal' : `${selectedUkuranFilter} cm · 72 hal`}
                </span>
              </div>

              <div ref={gridRef} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${ukuranCols.length===1 ? 1 : autoCols}, minmax(0, 1fr))` }}>
                {ukuranCols.map((ukuran) => (
                <div key={ukuran} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="bg-amber-50/70 px-4 py-2 border-b border-amber-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 tracking-wider uppercase flex items-center gap-1.5">
                      <Layers size={13} className="text-amber-600" />
                      Bahan: {ukuran} cm — {BUKU_TULIS_CONFIG[ukuran].w}×{BUKU_TULIS_CONFIG[ukuran].h} cm · {BUKU_TULIS_CONFIG[ukuran].leavesPerA3} lbr/A3
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-white shadow-xs">
                        <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                          <th className="py-2.5 px-3 border-r border-gray-200 text-center w-20 bg-gray-100" rowSpan={2}>
                            Oplah
                          </th>
                          <th colSpan={3} className="py-1.5 px-2 text-center border-r border-gray-200 font-bold text-gray-900 bg-gray-200/80">
                            {ukuran} cm
                          </th>
                        </tr>
                        <tr className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-600">
                          <th className="py-1.5 px-2 text-right font-semibold bg-gray-50">HPP</th>
                          <th className="py-1.5 px-2 text-right font-bold text-emerald-800 bg-emerald-100/50">Harga</th>
                          <th className="py-1.5 px-2 text-right font-bold text-blue-800 bg-blue-100/50 border-r border-gray-200">Nego</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {matrixData.map((row) => {
                          const col = row.cols.find((c) => c.ukuran === ukuran);
                          if (!col) return null;
                          return (
                            <tr key={row.oplah} className="hover:bg-amber-50/30 transition-colors">
                              <td className="py-2 px-3 text-center font-bold text-gray-900 border-r border-gray-200 bg-gray-50/30">
                                {row.oplah.toLocaleString('id-ID')}
                              </td>
                              <td className="py-2 px-2 text-right text-gray-500 font-mono">{Math.round(col.hpp).toLocaleString('id-ID')}</td>
                              <td className="py-2 px-2 text-right font-bold text-emerald-700 font-mono bg-emerald-50/30">
                                {col.jual.toLocaleString('id-ID')}
                              </td>
                              <td className="py-2 px-2 text-right font-bold text-blue-700 font-mono bg-blue-50/30 border-r border-gray-200">
                                {col.nego.toLocaleString('id-ID')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Oplah</th>
                  <th className="py-2.5 px-3">Ukuran</th>
                  <th className="py-2.5 px-3">Halaman</th>
                  <th className="py-2.5 px-3 text-right">HPP / pcs</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Harga Jual / pcs</th>
                  <th className="py-2.5 px-3 text-right text-blue-700">Harga Nego / pcs</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">Total Omset</th>
                  <th className="py-2.5 px-3 text-right text-slate-600">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {flatTableRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                      Tidak ada data yang sesuai dengan pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  flatTableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-800 font-sans">{row.oplah.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-slate-700 font-sans">{row.ukuran} cm</td>
                      <td className="py-2 px-3 text-slate-500 font-sans">72</td>
                      <td className="py-2 px-3 text-right text-slate-600">Rp {Math.round(row.hpp).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">Rp {row.jual.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-bold text-blue-600">Rp {row.nego.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">Rp {row.totalJual.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right text-slate-500 font-sans">{Math.round(row.margin * 100)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium">
            Menampilkan {flatTableRows.length} kombinasi tarif Buku Tulis 72 Hal
          </div>
        </div>
      )}
    </div>
  );
}
