'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  X,
  LayoutGrid,
  TableProperties,
  Layers,
  BookCopy,
} from 'lucide-react';
import {
  calculateSoftCoverUnified,
  DEFAULT_SOFT_COVER_UNIFIED,
  SoftCoverUnifiedParams,
  SoftCoverLini,
  SoftCoverFinishing,
  SOFT_COVER_LINI_LABEL,
  SOFT_COVER_LINIS_21,
  SOFT_COVER_LINIS_14,
  softCoverTiers,
  softCoverFinishingOptions,
} from '@/lib/buku-soft-cover-unified';

interface BukuSoftCoverUnifiedMatrixViewProps {
  customParams?: SoftCoverUnifiedParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

const FINISHING_SHORT: Record<string, string> = {
  'None,': 'Tanpa',
  'UV Varnish,': 'UV',
  'Laminasi Glossy,': 'Glossy',
  'Laminasi Doff,': 'Doff',
  'Lem Bending,': 'Bending',
  'UV Varnish + Bending,': 'UV+Bending',
  'Laminasi Glossy + Bending,': 'Glossy+Bending',
  'Laminasi Doff + Bending,': 'Doff+Bending',
  'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,': 'Full Paket',
};

export default function BukuSoftCoverUnifiedMatrixView({
  customParams = DEFAULT_SOFT_COVER_UNIFIED,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
}: BukuSoftCoverUnifiedMatrixViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [lini, setLini] = useState<SoftCoverLini>('Klasik');
  const [selectedFinishingFilter, setSelectedFinishingFilter] = useState<SoftCoverFinishing>('None,');
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;
  const tiers = softCoverTiers(lini);
  const finishingOptions = softCoverFinishingOptions(lini);
  // Spek default file tersimpan: 32 hal, 1 Muka, 4 Warna cover, 1 Warna isi, margin 30%.
  const calc = (oplah: number, finishing: SoftCoverFinishing) =>
    calculateSoftCoverUnified(
      { lini, oplah, jumlahHalaman: 32, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing, marginPct: 30 },
      customParams
    );

  const matrixData = useMemo(() => {
    const fin = finishingOptions.includes(selectedFinishingFilter) ? selectedFinishingFilter : 'None,';
    return tiers
      .map((oplah) => {
        const q = searchTerm.trim();
        if (q && !oplah.toString().includes(q)) return null;
        const r = calc(oplah, fin);
        return { oplah, hpp: r.hppPerPcs, jual: r.hargaJualPerPcs, totalJual: r.totalHargaJual };
      })
      .filter(Boolean) as { oplah: number; hpp: number; jual: number; totalJual: number }[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customParams, searchTerm, selectedFinishingFilter, lini]);

  const flatTableRows = useMemo(() => {
    const fin = finishingOptions.includes(selectedFinishingFilter) ? selectedFinishingFilter : 'None,';
    return tiers
      .map((oplah) => {
        const q = searchTerm.toLowerCase().trim();
        if (q && !oplah.toString().includes(q)) return null;
        const r = calc(oplah, fin);
        return { oplah, finishing: fin, hpp: r.hppPerPcs, jual: r.hargaJualPerPcs, totalJual: r.totalHargaJual };
      })
      .filter(Boolean) as { oplah: number; finishing: string; hpp: number; jual: number; totalJual: number }[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customParams, searchTerm, selectedFinishingFilter, lini]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <BookCopy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
              Pricelist Matriks Buku Soft Cover — Katalog 17–18
            </h2>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              1 produk · 2 ukuran · 8 lini — 32 hal · margin 30%.
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
            placeholder="Cari oplah..."
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

        {/* Filter Lini */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-slate-500 font-semibold hidden sm:inline">Lini:</span>
          <select
            value={lini}
            onChange={(e) => setLini(e.target.value as SoftCoverLini)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            <optgroup label="21 × 29,7 cm">
              {SOFT_COVER_LINIS_21.map((l) => (
                <option key={l} value={l}>{SOFT_COVER_LINI_LABEL[l]}</option>
              ))}
            </optgroup>
            <optgroup label="14,5 × 20,25 cm">
              {SOFT_COVER_LINIS_14.map((l) => (
                <option key={l} value={l}>{SOFT_COVER_LINI_LABEL[l]}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Filter Finishing */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-slate-500 font-semibold hidden sm:inline">Finishing:</span>
          <select
            value={finishingOptions.includes(selectedFinishingFilter) ? selectedFinishingFilter : 'None,'}
            onChange={(e) => setSelectedFinishingFilter(e.target.value as SoftCoverFinishing)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            {finishingOptions.map((f) => (
              <option key={f} value={f}>{FINISHING_SHORT[f]}</option>
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
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <h3 className="text-sm font-bold text-gray-800 tracking-tight">
                    Buku Soft Cover — {SOFT_COVER_LINI_LABEL[lini]} · 32 Hal
                  </h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {tiers.length} tier
                </span>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="bg-emerald-50/70 px-4 py-2 border-b border-emerald-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-900 tracking-wider uppercase flex items-center gap-1.5">
                    <Layers size={13} className="text-emerald-600" />
                    {SOFT_COVER_LINI_LABEL[lini]} · 32 Hal
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-white shadow-xs">
                      <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                        <th className="py-2.5 px-3 border-r border-gray-200 text-center w-20 bg-gray-100">
                          Oplah
                        </th>
                        <th className="py-2.5 px-3 text-right font-semibold">HPP/pcs</th>
                        <th className="py-2.5 px-3 text-right font-bold text-emerald-800 bg-emerald-100/50">Harga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {matrixData.map((row) => (
                        <tr key={row.oplah} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="py-2 px-3 text-center font-bold text-gray-900 border-r border-gray-200 bg-gray-50/30">
                            {row.oplah.toLocaleString('id-ID')} pcs
                          </td>
                          <td className="py-2 px-2 text-right text-gray-500 font-mono">{Math.round(row.hpp).toLocaleString('id-ID')}</td>
                          <td className="py-2 px-2 text-right font-bold text-emerald-700 font-mono bg-emerald-50/30">
                            {row.jual.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                  <th className="py-2.5 px-3">Finishing</th>
                  <th className="py-2.5 px-3 text-right">HPP / pcs</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Harga Jual / pcs</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">Total Omset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {flatTableRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-sans">
                      Tidak ada data yang sesuai dengan pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  flatTableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-800 font-sans">{row.oplah.toLocaleString('id-ID')} pcs</td>
                      <td className="py-2 px-3 text-slate-700 font-sans">{FINISHING_SHORT[row.finishing]}</td>
                      <td className="py-2 px-3 text-right text-slate-600">Rp {Math.round(row.hpp).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">Rp {row.jual.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">Rp {row.totalJual.toLocaleString('id-ID')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium">
            Menampilkan {flatTableRows.length} kombinasi tarif {SOFT_COVER_LINI_LABEL[lini]}
          </div>
        </div>
      )}
    </div>
  );
}
