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
import {
  calculateKopSuratHpp,
  DEFAULT_KOP_SURAT_PARAMS,
  KopSuratMasterParams,
  KOP_SURAT_TIERS,
  KOP_SURAT_UKURAN_LABEL,
  insheetDefaultForWarna,
} from '@/lib/kop-surat-calculator';

interface KopSuratMatrixViewProps {
  customParams?: KopSuratMasterParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

type Warna = 1 | 2 | 3 | 4;
const WARNA_LIST: Warna[] = [1, 2, 3, 4];

export default function KopSuratMatrixView({
  customParams = DEFAULT_KOP_SURAT_PARAMS,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
}: KopSuratMatrixViewProps) {
  const params: KopSuratMasterParams = { ...DEFAULT_KOP_SURAT_PARAMS, ...(customParams || {}) };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarnaFilter, setSelectedWarnaFilter] = useState<Warna | 'ALL'>('ALL');
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;

  // Spesifikasi baku matriks = kondisi file tersimpan: FOLIO, 1 Muka, CETAK, TANPA SISIR
  const calc = (oplahRim: number, nWarna: Warna) =>
    calculateKopSuratHpp(
      {
        oplahRim,
        jenisKop: 'FOLIO',
        nWarna,
        muka: 1,
        jenisCetak: 'CETAK',
        finishingSisir: false,
        insheetLembar: insheetDefaultForWarna(nWarna, params),
        marginPct: params.labaPct ?? 30,
      },
      params
    );

  // Matrix: baris = rim, kolom = warna
  const matrixData = useMemo(() => {
    const warnas = selectedWarnaFilter === 'ALL' ? WARNA_LIST : [selectedWarnaFilter];
    return KOP_SURAT_TIERS.map((rim) => {
      const q = searchTerm.trim();
      if (q && !rim.toString().includes(q)) return null;
      return {
        rim,
        cols: warnas.map((nWarna) => {
          const r = calc(rim, nWarna);
          return { nWarna, hpp: r.hppPerRim, final: r.hargaFinalPerRim, total: r.totalHarga };
        }),
      };
    }).filter(Boolean) as { rim: number; cols: { nWarna: Warna; hpp: number; final: number; total: number }[] }[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customParams, searchTerm, selectedWarnaFilter]);

  // Flat table
  const flatTableRows = useMemo(() => {
    const list: {
      rim: number; nWarna: Warna; hpp: number; final: number; total: number; margin: number;
    }[] = [];

    const warnas = selectedWarnaFilter === 'ALL' ? WARNA_LIST : [selectedWarnaFilter];

    warnas.forEach((nWarna) => {
      KOP_SURAT_TIERS.forEach((rim) => {
        const q = searchTerm.toLowerCase().trim();
        if (q) {
          const match =
            rim.toString().includes(q) ||
            `${nWarna} warna`.includes(q);
          if (!match) return;
        }
        const r = calc(rim, nWarna);
        list.push({
          rim, nWarna,
          hpp: r.hppPerRim,
          final: r.hargaFinalPerRim,
          total: r.totalHarga,
          margin: r.marginPct,
        });
      });
    });

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customParams, searchTerm, selectedWarnaFilter]);

  const warnaCols = selectedWarnaFilter === 'ALL' ? WARNA_LIST : [selectedWarnaFilter];

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
              Pricelist Matriks Kop Surat
            </h2>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              FOLIO {KOP_SURAT_UKURAN_LABEL.FOLIO} · 1 Muka · CETAK · TANPA SISIR · rim @500 lbr · laba {params.labaPct ?? 30}% (insheet ikut file: 30/30/40/50).
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
            placeholder="Cari rim, warna..."
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

        {/* Filter Warna */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-slate-500 font-semibold hidden sm:inline">Warna:</span>
          <select
            value={selectedWarnaFilter}
            onChange={(e) => setSelectedWarnaFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value) as Warna)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Warna</option>
            {WARNA_LIST.map((w) => (
              <option key={w} value={w}>{w} Warna</option>
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
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                  <h3 className="text-sm font-bold text-gray-800 tracking-tight">Kop Surat FOLIO 21,5×33 — per rim @500 lbr</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {selectedWarnaFilter === 'ALL' ? 'Semua Warna (4)' : `${selectedWarnaFilter} Warna`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {warnaCols.map((nWarna) => (
                <div key={nWarna} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="bg-sky-50/70 px-4 py-2 border-b border-sky-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-900 tracking-wider uppercase flex items-center gap-1.5">
                      <Layers size={13} className="text-sky-600" />
                      {nWarna} Warna — insheet {insheetDefaultForWarna(nWarna, params)} lbr
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-white shadow-xs">
                        <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                          <th className="py-2.5 px-3 border-r border-gray-200 text-center w-20 bg-gray-100">
                            Rim
                          </th>
                          <th className="py-1.5 px-2 text-right font-semibold bg-gray-50">HPP/rim</th>
                          <th className="py-1.5 px-2 text-right font-bold text-emerald-800 bg-emerald-100/50">Final/rim</th>
                          <th className="py-1.5 px-2 text-right font-semibold bg-gray-50 border-r border-gray-200">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {matrixData.map((row) => {
                          const col = row.cols.find((c) => c.nWarna === nWarna);
                          if (!col) return null;
                          return (
                            <tr key={row.rim} className="hover:bg-sky-50/30 transition-colors">
                              <td className="py-2 px-3 text-center font-bold text-gray-900 border-r border-gray-200 bg-gray-50/30">
                                {row.rim} <span className="font-normal text-gray-400">({(row.rim * 500).toLocaleString('id-ID')})</span>
                              </td>
                              <td className="py-2 px-2 text-right text-gray-500 font-mono">{Math.round(col.hpp).toLocaleString('id-ID')}</td>
                              <td className="py-2 px-2 text-right font-bold text-emerald-700 font-mono bg-emerald-50/30">
                                {col.final.toLocaleString('id-ID')}
                              </td>
                              <td className="py-2 px-2 text-right text-gray-600 font-mono border-r border-gray-200">
                                {Math.round(col.total).toLocaleString('id-ID')}
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
                  <th className="py-2.5 px-3">Rim</th>
                  <th className="py-2.5 px-3">Warna</th>
                  <th className="py-2.5 px-3">Lembar</th>
                  <th className="py-2.5 px-3 text-right">HPP / rim</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Final / rim</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">Total Harga</th>
                  <th className="py-2.5 px-3 text-right text-slate-600">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {flatTableRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-sans">
                      Tidak ada data yang sesuai dengan pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  flatTableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-sky-50/40 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-800 font-sans">{row.rim}</td>
                      <td className="py-2 px-3 text-slate-700 font-sans">{row.nWarna} Warna</td>
                      <td className="py-2 px-3 text-slate-500 font-sans">{(row.rim * 500).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right text-slate-600">Rp {Math.round(row.hpp).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">Rp {row.final.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">Rp {Math.round(row.total).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right text-slate-500 font-sans">{Math.round(row.margin * 100)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium">
            Menampilkan {flatTableRows.length} kombinasi tarif Kop Surat
          </div>
        </div>
      )}
    </div>
  );
}
