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
  calculateBukuSoftCoverHpp,
  DEFAULT_BUKU_SOFT_COVER_PARAMS,
  BukuSoftCoverMasterParams,
  BukuSoftCoverVarianType,
  BukuSoftCoverFinishingType,
  BUKU_SOFT_COVER_TIERS,
  BUKU_SOFT_COVER_VARIANTS,
  BUKU_SOFT_COVER_FINISHING_OPTIONS,
} from '@/lib/buku-soft-cover-calculator';

interface BukuSoftCoverMatrixViewProps {
  customParams?: BukuSoftCoverMasterParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

export default function BukuSoftCoverMatrixView({
  customParams = DEFAULT_BUKU_SOFT_COVER_PARAMS,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
}: BukuSoftCoverMatrixViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVarianFilter, setSelectedVarianFilter] = useState<BukuSoftCoverVarianType | 'ALL'>('ALL');
  const [selectedFinishingFilter, setSelectedFinishingFilter] = useState<BukuSoftCoverFinishingType>('Laminasi Glossy');
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;
  const calc = (oplah: number, varian: BukuSoftCoverVarianType, finishing: BukuSoftCoverFinishingType) =>
    calculateBukuSoftCoverHpp(
      { oplah, varian, jumlahHalaman: 32, finishing, marginPct: 25, negoDiskonPct: 4 },
      customParams
    );

  const varianCols = selectedVarianFilter === 'ALL' ? BUKU_SOFT_COVER_VARIANTS : [selectedVarianFilter];

  const matrixData = useMemo(() => {
    const varians = selectedVarianFilter === 'ALL' ? BUKU_SOFT_COVER_VARIANTS : [selectedVarianFilter];
    return BUKU_SOFT_COVER_TIERS
      .map((oplah) => {
        const q = searchTerm.trim();
        if (q && !oplah.toString().includes(q)) return null;
        return {
          oplah,
          cols: varians.map((varian) => {
            const r = calc(oplah, varian, selectedFinishingFilter);
            return { varian, hpp: r.hppPerPcs, jual: r.hargaJualPerPcs, nego: r.negoPerPcs, totalJual: r.totalHargaJual };
          }),
        };
      })
      .filter(Boolean) as { oplah: number; cols: { varian: BukuSoftCoverVarianType; hpp: number; jual: number; nego: number; totalJual: number }[] }[];
  }, [customParams, searchTerm, selectedVarianFilter, selectedFinishingFilter]);

  const flatTableRows = useMemo(() => {
    const list: {
      oplah: number;
      varian: BukuSoftCoverVarianType;
      finishing: BukuSoftCoverFinishingType;
      hpp: number;
      jual: number;
      nego: number;
      totalJual: number;
    }[] = [];

    const varians = selectedVarianFilter === 'ALL' ? BUKU_SOFT_COVER_VARIANTS : [selectedVarianFilter];

    varians.forEach((varian) => {
      BUKU_SOFT_COVER_TIERS.forEach((oplah) => {
        const q = searchTerm.toLowerCase().trim();
        if (q && !oplah.toString().includes(q) && !varian.toLowerCase().includes(q)) return;
        const r = calc(oplah, varian, selectedFinishingFilter);
        list.push({
          oplah, varian, finishing: selectedFinishingFilter,
          hpp: r.hppPerPcs,
          jual: r.hargaJualPerPcs,
          nego: r.negoPerPcs,
          totalJual: r.totalHargaJual,
        });
      });
    });

    return list;
  }, [customParams, searchTerm, selectedVarianFilter, selectedFinishingFilter]);

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
              Pricelist Matriks Buku Soft Cover — Katalog 17
            </h2>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Perbandingan HPP &amp; harga jual per pcs — 32 hal · Cover AC 230 (Print Inter) + Isi HVS 70 (Oliver) · margin 25% nego 4%.
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
            placeholder="Cari oplah, varian..."
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
          <span className="text-slate-500 font-semibold hidden sm:inline">Varian:</span>
          <select
            value={selectedVarianFilter}
            onChange={(e) => setSelectedVarianFilter(e.target.value as BukuSoftCoverVarianType | 'ALL')}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Varian</option>
            {BUKU_SOFT_COVER_VARIANTS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Filter Finishing */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-slate-500 font-semibold hidden sm:inline">Laminasi:</span>
          <select
            value={selectedFinishingFilter}
            onChange={(e) => setSelectedFinishingFilter(e.target.value as BukuSoftCoverFinishingType)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            {BUKU_SOFT_COVER_FINISHING_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
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
                    Buku Soft Cover — 32 Hal · {selectedFinishingFilter}
                  </h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {selectedVarianFilter === 'ALL' ? 'Semua Varian (2)' : selectedVarianFilter}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {varianCols.map((varian) => (
                  <div key={varian} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="bg-emerald-50/70 px-4 py-2 border-b border-emerald-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-900 tracking-wider uppercase flex items-center gap-1.5">
                        <Layers size={13} className="text-emerald-600" />
                        Varian: {varian} · AC 230 Cover + HVS 70 Isi 32 Hal
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
                              {varian}
                            </th>
                          </tr>
                          <tr className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-600">
                            <th className="py-1.5 px-2 text-right font-semibold bg-gray-50">HPP/pcs</th>
                            <th className="py-1.5 px-2 text-right font-bold text-emerald-800 bg-emerald-100/50">Harga</th>
                            <th className="py-1.5 px-2 text-right font-bold text-blue-800 bg-blue-100/50 border-r border-gray-200">Nego</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {matrixData.map((row) => {
                            const col = row.cols.find((c) => c.varian === varian);
                            if (!col) return null;
                            return (
                              <tr key={row.oplah} className="hover:bg-emerald-50/30 transition-colors">
                                <td className="py-2 px-3 text-center font-bold text-gray-900 border-r border-gray-200 bg-gray-50/30">
                                  {row.oplah.toLocaleString('id-ID')} pcs
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
                  <th className="py-2.5 px-3">Varian</th>
                  <th className="py-2.5 px-3">Finishing</th>
                  <th className="py-2.5 px-3 text-right">HPP / pcs</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Harga Jual / pcs</th>
                  <th className="py-2.5 px-3 text-right text-blue-700">Harga Nego / pcs</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">Total Omset</th>
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
                    <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-800 font-sans">{row.oplah.toLocaleString('id-ID')} pcs</td>
                      <td className="py-2 px-3 text-slate-700 font-sans">{row.varian}</td>
                      <td className="py-2 px-3 text-slate-600 font-sans">{row.finishing}</td>
                      <td className="py-2 px-3 text-right text-slate-600">Rp {Math.round(row.hpp).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">Rp {row.jual.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-bold text-blue-600">Rp {row.nego.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">Rp {row.totalJual.toLocaleString('id-ID')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium">
            Menampilkan {flatTableRows.length} kombinasi tarif Buku Soft Cover
          </div>
        </div>
      )}
    </div>
  );
}
