'use client';

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  X,
  LayoutGrid,
  TableProperties,
  Layers,
  Wine,
} from 'lucide-react';
import {
  LabelKhqMasterParams,
  DEFAULT_LABEL_KHQ_PARAMS,
  LabelKhqVarianType,
  LABEL_KHQ_CONFIG,
  calculateLabelKhqHpp,
} from '@/lib/label-khq-calculator';

interface LabelKhqMatrixViewProps {
  customParams?: LabelKhqMasterParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

const VARIAN_LIST: LabelKhqVarianType[] = ['KHQ 220 ml', 'KHQ 330 ml', 'KHQ 600 ml'];
const KARDUS_ROWS = [
  5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37
];

export default function LabelKhqMatrixView({
  customParams = DEFAULT_LABEL_KHQ_PARAMS,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
}: LabelKhqMatrixViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVarianFilter, setSelectedVarianFilter] = useState<LabelKhqVarianType | 'ALL'>('ALL');
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;

  const calc = (varian: LabelKhqVarianType, jumlahKardus: number) =>
    calculateLabelKhqHpp(
      {
        varian,
        jumlahKardus,
        opsiLaminasi: true,
        opsiRajang: true,
        marginPct: 30,
        negoDiskonPct: 4,
      },
      customParams
    );

  // Matrix: baris = kardus/lembar, kolom = 3 varian KHQ
  const matrixData = useMemo(() => {
    const varians = selectedVarianFilter === 'ALL' ? VARIAN_LIST : [selectedVarianFilter];
    return KARDUS_ROWS.map((kardus) => {
      const lbr = kardus * 24;
      const q = searchTerm.trim().toLowerCase();
      if (q && !kardus.toString().includes(q) && !lbr.toString().includes(q)) return null;

      return {
        kardus,
        lbr,
        cols: varians.map((v) => {
          const r = calc(v, kardus);
          return {
            varian: v,
            hpp: r.hppPerLbr,
            jual: r.hargaJualPerLbr,
            nego: r.hargaNegoPerLbr,
            totalJual: r.totalHargaJual,
          };
        }),
      };
    }).filter(Boolean) as {
      kardus: number;
      lbr: number;
      cols: { varian: LabelKhqVarianType; hpp: number; jual: number; nego: number; totalJual: number }[];
    }[];
  }, [customParams, searchTerm, selectedVarianFilter]);

  // Flat table
  const flatTableRows = useMemo(() => {
    const list: {
      kardus: number;
      lbr: number;
      varian: LabelKhqVarianType;
      hpp: number;
      jual: number;
      nego: number;
      totalJual: number;
      margin: number;
    }[] = [];

    const varians = selectedVarianFilter === 'ALL' ? VARIAN_LIST : [selectedVarianFilter];

    varians.forEach((v) => {
      KARDUS_ROWS.forEach((kardus) => {
        const lbr = kardus * 24;
        const q = searchTerm.toLowerCase().trim();
        if (q) {
          const match =
            kardus.toString().includes(q) ||
            lbr.toString().includes(q) ||
            v.toLowerCase().includes(q);
          if (!match) return;
        }
        const r = calc(v, kardus);
        list.push({
          kardus,
          lbr,
          varian: v,
          hpp: r.hppPerLbr,
          jual: r.hargaJualPerLbr,
          nego: r.hargaNegoPerLbr,
          totalJual: r.totalHargaJual,
          margin: r.marginPct,
        });
      });
    });

    return list;
  }, [customParams, searchTerm, selectedVarianFilter]);

  const activeVarians = selectedVarianFilter === 'ALL' ? VARIAN_LIST : [selectedVarianFilter];

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
              Pricelist Matriks Label KHQ 2026
            </h2>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tabel perbandingan HPP &amp; harga jual label botol KHQ per kuantitas kardus (1 dus = 24 lembar label, margin 30%, laminasi glossy &amp; rajang ON).
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
            placeholder="Cari jumlah kardus, lembar, varian..."
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

        {/* Filter Varian */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-slate-500 font-semibold hidden sm:inline">Varian Botol:</span>
          <select
            value={selectedVarianFilter}
            onChange={(e) => setSelectedVarianFilter(e.target.value as LabelKhqVarianType | 'ALL')}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Varian</option>
            {VARIAN_LIST.map((v) => (
              <option key={v} value={v}>{v}</option>
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

      {/* Table Content */}
      {viewMode === 'matrix' ? (
        <div className="flex flex-col gap-6">
          {matrixData.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              Tidak ada data yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  <h3 className="text-sm font-bold text-gray-800 tracking-tight">Label KHQ</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {selectedVarianFilter === 'ALL' ? 'Semua Varian' : selectedVarianFilter}
                </span>
              </div>

              <div className={`grid gap-4 ${activeVarians.length === 1 ? 'grid-cols-1' : 'grid-cols-[repeat(auto-fit,minmax(360px,1fr))]'}`}>
                {activeVarians.map((varian) => (
                <div key={varian} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="bg-amber-50/70 px-4 py-2 border-b border-amber-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 tracking-wider uppercase flex items-center gap-1.5">
                      <Layers size={13} className="text-amber-600" />
                      Bahan: {varian} — {LABEL_KHQ_CONFIG[varian].w} x {LABEL_KHQ_CONFIG[varian].h} cm
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-white shadow-xs">
                        <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                          <th className="py-2.5 px-3 border-r border-gray-200 text-center w-24 bg-gray-100" rowSpan={2}>
                            Jumlah Dus
                          </th>
                          <th className="py-2.5 px-3 border-r border-gray-200 text-center w-24 bg-gray-100" rowSpan={2}>
                            Jumlah Lbr
                          </th>
                          <th colSpan={3} className="py-1.5 px-2 text-center border-r border-gray-200 font-bold text-gray-900 bg-gray-200/80">
                            {varian}
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
                          const col = row.cols.find((c) => c.varian === varian);
                          if (!col) return null;
                          return (
                            <tr key={row.kardus} className="hover:bg-amber-50/30 transition-colors">
                              <td className="py-2 px-3 text-center font-bold text-gray-900 border-r border-gray-200 bg-gray-50/30">
                                {row.kardus} Dus
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-gray-600 border-r border-gray-200 font-mono">
                                {row.lbr.toLocaleString('id-ID')}
                              </td>
                              <td className="py-2 px-2 text-right text-gray-500 font-mono">{col.hpp.toFixed(1)}</td>
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
                  <th className="py-2.5 px-3">Jumlah Dus</th>
                  <th className="py-2.5 px-3">Total Lbr</th>
                  <th className="py-2.5 px-3">Varian Botol</th>
                  <th className="py-2.5 px-3">Ukuran Label</th>
                  <th className="py-2.5 px-3 text-right">HPP / Lbr</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Harga Jual / Lbr</th>
                  <th className="py-2.5 px-3 text-right text-blue-700">Harga Nego / Lbr</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">Total Omset</th>
                  <th className="py-2.5 px-3 text-right text-slate-600">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {flatTableRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                      Tidak ada data yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  flatTableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-800 font-sans">{row.kardus} Dus</td>
                      <td className="py-2 px-3 text-slate-600 font-mono">{row.lbr.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 font-bold text-emerald-900 font-sans">{row.varian}</td>
                      <td className="py-2 px-3 text-slate-500 font-sans">
                        {LABEL_KHQ_CONFIG[row.varian].w} x {LABEL_KHQ_CONFIG[row.varian].h} cm
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">Rp {row.hpp.toFixed(2)}</td>
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
        </div>
      )}
    </div>
  );
}
