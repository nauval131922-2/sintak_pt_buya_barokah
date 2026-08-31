'use client';

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  X,
  LayoutGrid,
  TableProperties,
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
      </div>

      {/* Table Content */}
      {viewMode === 'matrix' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center w-24">Jumlah Dus</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center w-24">Jumlah Lbr</th>
                  {activeVarians.map((v) => (
                    <th key={v} className="py-2.5 px-3 text-center border-r border-slate-200 last:border-r-0">
                      <div className="font-bold text-slate-900">{v}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{LABEL_KHQ_CONFIG[v].w} x {LABEL_KHQ_CONFIG[v].h} cm</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {matrixData.length === 0 ? (
                  <tr>
                    <td colSpan={2 + activeVarians.length} className="p-8 text-center text-slate-400 font-sans">
                      Tidak ada data yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  matrixData.map((row) => (
                    <tr key={row.kardus} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-2 px-3 font-black text-slate-800 text-center border-r border-slate-100 font-sans">
                        {row.kardus} Dus
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-600 text-center border-r border-slate-100 font-mono">
                        {row.lbr.toLocaleString('id-ID')}
                      </td>
                      {row.cols.map((col) => (
                        <td
                          key={col.varian}
                          className="py-2 px-3 text-center border-r border-slate-100 last:border-r-0 align-top"
                        >
                          <span className="block font-bold text-emerald-800 font-mono text-[11px]">
                            Rp {col.jual.toLocaleString('id-ID')} /lbr
                          </span>
                          <span className="block text-[9px] text-blue-600 font-mono">
                            Nego: Rp {col.nego.toLocaleString('id-ID')}
                          </span>
                          <span className="block text-[9px] text-slate-400 font-mono">
                            HPP: Rp {col.hpp.toFixed(1)} · Total: Rp {col.totalJual.toLocaleString('id-ID')}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 font-medium flex flex-wrap gap-4">
            <span>Harga dalam Rp / lembar label · Baris: Jual / <span className="text-blue-600">Nego</span> / <span className="text-slate-400">HPP</span></span>
            <span>Standar 1 Dus = 24 lembar · Margin 30% · Laminasi Glossy &amp; Rajang ON</span>
          </div>
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
