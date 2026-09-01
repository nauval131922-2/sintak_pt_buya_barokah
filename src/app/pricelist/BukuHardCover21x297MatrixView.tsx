'use client';

import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  TableProperties,
  Layers,
  Sparkles,
  Info,
  Check,
  Search,
  Bookmark,
} from 'lucide-react';
import {
  BukuHardCover21x297MasterParams,
  BukuHardCover21x297FinishingOption,
  BUKU_HARD_COVER_21X297_TIERS,
  recalculateBukuHardCover21x297Matrix,
} from '@/lib/buku-hard-cover-21x297-calculator';

interface Props {
  customParams: BukuHardCover21x297MasterParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

const FINISHING_OPTIONS: BukuHardCover21x297FinishingOption[] = [
  'Tanpa Laminasi',
  'Laminasi Glossy',
  'Laminasi Doff',
];

export default function BukuHardCover21x297MatrixView({
  customParams,
  viewMode: controlledViewMode,
  setViewMode: controlledSetViewMode,
}: Props) {
  const [internalViewMode, setInternalViewMode] = useState<'matrix' | 'table'>('matrix');
  const viewMode = controlledViewMode || internalViewMode;
  const setViewMode = controlledSetViewMode || setInternalViewMode;

  const [finishing, setFinishing] = useState<BukuHardCover21x297FinishingOption>('Tanpa Laminasi');
  const [opsiFoil, setOpsiFoil] = useState<boolean>(false);
  const [marginPct, setMarginPct] = useState<number>(customParams.marginDefaultPct ?? 30);
  const [negoPct, setNegoPct] = useState<number>(customParams.negoDefaultPct ?? 5);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const matrixData = useMemo(() => {
    return recalculateBukuHardCover21x297Matrix(
      customParams,
      finishing,
      opsiFoil,
      marginPct,
      negoPct
    );
  }, [customParams, finishing, opsiFoil, marginPct, negoPct]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return matrixData;
    const q = searchTerm.toLowerCase();
    return matrixData.filter(
      (item) =>
        item.oplah.toString().includes(q) ||
        item.prosesCetak.toLowerCase().includes(q) ||
        item.hargaJualPerPcs.toString().includes(q)
    );
  }, [matrixData, searchTerm]);

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header Banner & Controls */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100/80 rounded-xl border border-emerald-200 text-emerald-800 shrink-0">
            <Bookmark size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-800 text-sm sm:text-base">
                Pricelist Matriks Buku Hard Cover 21×29,7 cm (A4)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Katalog 26
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Matriks harga 17 tier oplah (250 s/d 5.000 pcs) Buku Hard Cover A4 100 Halaman.
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Matriks Kartu</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableProperties size={14} />
              <span>Tabel Rinci</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Finishing */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 pl-1.5">Laminasi:</span>
            {FINISHING_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFinishing(f)}
                className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  finishing === f
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Foil Emas */}
          <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 px-2.5 rounded-lg border border-slate-200 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={opsiFoil}
              onChange={(e) => setOpsiFoil(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-bold text-slate-700 text-[11px]">Foil Emas (+Rp 450)</span>
          </label>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-56">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari oplah / alur..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
          />
        </div>
      </div>

      {/* Content View */}
      {viewMode === 'matrix' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {filteredData.map((item) => (
            <div
              key={item.oplah}
              className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3 border-t-4 border-t-emerald-700"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-800">
                    {item.oplah.toLocaleString('id-ID')} pcs
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {item.prosesCetak.includes('Isi SM') ? 'SM 52' : 'Oliver 4W'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {item.prosesCetak}
                </span>
              </div>

              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-slate-500">Harga / pcs</span>
                  <span className="font-black text-emerald-900">
                    Rp {item.hargaJualPerPcs.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Nego / pcs</span>
                  <span className="font-bold text-blue-900">
                    Rp {item.negoPerPcs.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] border-t border-slate-200/60 pt-1">
                  <span className="text-slate-400">HPP / pcs</span>
                  <span className="font-semibold text-slate-700">
                    Rp {Math.round(item.hppPerPcs).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Total Omset</span>
                <span className="font-black text-slate-800">
                  Rp {item.totalHargaJual.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Flat Table View */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3 font-bold text-center w-12">No</th>
                  <th className="py-2.5 px-3 font-bold">Oplah Pesanan</th>
                  <th className="py-2.5 px-3 font-bold">Alur Mesin / Proses</th>
                  <th className="py-2.5 px-3 font-bold text-right">HPP / pcs</th>
                  <th className="py-2.5 px-3 font-bold text-right text-emerald-900 bg-emerald-100/40">
                    Harga Jual / pcs (30%)
                  </th>
                  <th className="py-2.5 px-3 font-bold text-right text-blue-900 bg-blue-100/40">
                    Harga Nego / pcs (5%)
                  </th>
                  <th className="py-2.5 px-3 font-bold text-right">Total Omset Penawaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row, idx) => (
                  <tr key={row.oplah} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-semibold text-[10px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-black text-slate-800">
                      {row.oplah.toLocaleString('id-ID')} pcs
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-700">{row.prosesCetak}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-600">
                      Rp {Math.round(row.hppPerPcs).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-900 bg-emerald-50/30">
                      Rp {row.hargaJualPerPcs.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-900 bg-blue-50/30">
                      Rp {row.negoPerPcs.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-800">
                      Rp {row.totalHargaJual.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
