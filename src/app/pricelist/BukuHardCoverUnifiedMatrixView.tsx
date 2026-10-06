'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  X,
  LayoutGrid,
  TableProperties,
  Layers,
  BookOpen,
} from 'lucide-react';
import {
  calculateBukuHardCoverUnified,
  DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS,
  BukuHardCoverUnifiedParams,
  HardCoverUkuran,
  FinishingCoverHC,
  OPLAH_TIERS_HC,
} from '@/lib/buku-hard-cover-unified';

interface BukuHardCoverUnifiedMatrixViewProps {
  customParams?: BukuHardCoverUnifiedParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

const FINISHING_OPTIONS: FinishingCoverHC[] = [
  'None',
  'Laminasi Glossy',
  'Laminasi Doff',
  'Laminasi Glossy + Spot UV',
  'Laminasi Doff + Spot UV',
  'Laminasi Glossy + Foil',
  'Laminasi Doff + Foil',
  'Laminasi Glossy + Spot UV + Foil',
  'Laminasi Doff + Spot UV + Foil',
  'Laminasi Glossy + Spot UV + Foil + Emboss',
  'Laminasi Doff + Spot UV + Foil + Emboss',
];

export default function BukuHardCoverUnifiedMatrixView({
  customParams = DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
}: BukuHardCoverUnifiedMatrixViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ukuran, setUkuran] = useState<HardCoverUkuran>('14,5×20,25');
  const [finishingCover, setFinishingCover] = useState<FinishingCoverHC>('None');
  const [halaman, setHalaman] = useState<number>(100);
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;

  const matrixData = useMemo(() => {
    return OPLAH_TIERS_HC.map((oplah) => {
      const q = searchTerm.trim();
      if (q && !oplah.toString().includes(q)) return null;
      const res = calculateBukuHardCoverUnified(customParams, {
        ukuran,
        oplah,
        halaman,
        mesinCover: 'OTOMATIS',
        mesinIsi: 'OTOMATIS',
        finishingCover,
      });
      return {
        oplah,
        mesinCover: res.mesinCoverTerpilih,
        mesinIsi: res.mesinIsiTerpilih,
        hpp: res.hppPerExp,
        jual: res.hargaFinal,
        totalJual: res.totalHargaJual,
      };
    }).filter(Boolean) as {
      oplah: number;
      mesinCover: string;
      mesinIsi: string;
      hpp: number;
      jual: number;
      totalJual: number;
    }[];
  }, [customParams, ukuran, finishingCover, halaman, searchTerm]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Ukuran Selector */}
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-600 mr-1 hidden sm:inline">Ukuran:</span>
          {(['10,5×14,8', '14,5×20,25', '21×29,7'] as HardCoverUkuran[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUkuran(u)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                ukuran === u
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        {/* Finishing Dropdown */}
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={finishingCover}
            onChange={(e) => setFinishingCover(e.target.value as FinishingCoverHC)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
          >
            {FINISHING_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f === 'None' ? 'Tanpa Finishing Tambahan' : f}
              </option>
            ))}
          </select>
        </div>

        {/* Search & Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari oplah..."
              className="w-28 sm:w-36 bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-7 py-1 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`p-1 rounded cursor-pointer ${
                viewMode === 'matrix' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Tampilan Kartu Matriks"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1 rounded cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Tampilan Tabel"
            >
              <TableProperties className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MATRIX VIEW */}
      {viewMode === 'matrix' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {matrixData.map((item) => (
            <div
              key={item.oplah}
              className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 flex flex-col justify-between hover:border-emerald-400 transition-all hover:shadow-xs"
            >
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Oplah</span>
                <div className="text-lg font-black text-slate-900 leading-tight">{item.oplah.toLocaleString('id-ID')}</div>
                <span className="text-[10px] text-slate-400">eksemplar</span>
              </div>

              <div className="border-t border-slate-100 pt-2 mt-2 space-y-0.5">
                <div className="text-[11px] text-slate-500">
                  HPP: Rp {item.hpp.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm font-black text-emerald-800 leading-tight">
                  Rp {item.jual.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-400">
                  Total: Rp {item.totalJual.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Oplah</th>
                  <th className="py-2.5 px-4">Mesin Cetak</th>
                  <th className="py-2.5 px-4 text-right">HPP / Exp</th>
                  <th className="py-2.5 px-4 text-right">Harga Jual / Exp</th>
                  <th className="py-2.5 px-4 text-right">Total Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {matrixData.map((item) => (
                  <tr key={item.oplah} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-4 font-bold text-slate-900">{item.oplah.toLocaleString('id-ID')} exp</td>
                    <td className="py-2 px-4 text-slate-500 text-[11px]">
                      Cov: {item.mesinCover} | Isi: {item.mesinIsi}
                    </td>
                    <td className="py-2 px-4 text-right text-slate-600">
                      Rp {item.hpp.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2 px-4 text-right font-black text-emerald-700 text-sm">
                      Rp {item.jual.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-4 text-right text-slate-900 font-bold">
                      Rp {item.totalJual.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
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
