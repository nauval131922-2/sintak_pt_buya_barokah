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
  calculateSertifikatHpp,
  DEFAULT_SERTIFIKAT_PARAMS,
  SertifikatMasterParams,
  SertifikatVarianType,
  SertifikatLaminasiType,
  SERTIFIKAT_TIERS,
  SERTIFIKAT_CONFIG,
} from '@/lib/sertifikat-calculator';

interface SertifikatMatrixViewProps {
  customParams?: SertifikatMasterParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

const VARIAN_LIST: SertifikatVarianType[] = ['Art Carton 260 - 1 Muka', 'Art Carton 260 - 2 Muka', 'Ivory 260 - 1 Muka', 'Ivory 260 - 2 Muka'];
const LAMINASI_LIST: SertifikatLaminasiType[] = ['Tanpa Laminasi', 'Glossy', 'Doff'];

export default function SertifikatMatrixView({
  customParams = DEFAULT_SERTIFIKAT_PARAMS,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
}: SertifikatMatrixViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVarianFilter, setSelectedVarianFilter] = useState<SertifikatVarianType | 'ALL'>('ALL');
  const [selectedLaminasiFilter, setSelectedLaminasiFilter] = useState<SertifikatLaminasiType | 'ALL'>('ALL');
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;
  const calc = (oplah: number, varian: SertifikatVarianType, laminasi: SertifikatLaminasiType) =>
    calculateSertifikatHpp(
      { oplah, varian, laminasi, opsiFoil: false, marginPct: 30, negoDiskonPct: 4 },
      customParams
    );

  // Matrix: baris = oplah, kolom = varian (laminasi filter menentukan tarif laminasi)
  const effectiveLaminasi: SertifikatLaminasiType = selectedLaminasiFilter === 'ALL' ? 'Glossy' : selectedLaminasiFilter;

  const matrixData = useMemo(() => {
    const varians = selectedVarianFilter === 'ALL' ? VARIAN_LIST : [selectedVarianFilter];
    return SERTIFIKAT_TIERS.map((oplah) => {
      const q = searchTerm.trim();
      if (q && !oplah.toString().includes(q)) return null;
      return {
        oplah,
        cols: varians.map((varian) => {
          const r = calc(oplah, varian, effectiveLaminasi);
          return { varian, hpp: r.hppPerPcs, jual: r.hargaJualPerPcs, nego: r.hargaNegoPerPcs, totalJual: r.totalHargaJual };
        }),
      };
    }).filter(Boolean) as { oplah: number; cols: { varian: SertifikatVarianType; hpp: number; jual: number; nego: number; totalJual: number }[] }[];
  }, [customParams, searchTerm, selectedVarianFilter, effectiveLaminasi]);

  // Flat table
  const flatTableRows = useMemo(() => {
    const list: {
      oplah: number; varian: SertifikatVarianType; laminasi: SertifikatLaminasiType; hpp: number; jual: number; nego: number; totalJual: number; margin: number;
    }[] = [];

    const varians = selectedVarianFilter === 'ALL' ? VARIAN_LIST : [selectedVarianFilter];
    const laminasis = selectedLaminasiFilter === 'ALL' ? LAMINASI_LIST : [selectedLaminasiFilter];

    varians.forEach((varian) => {
      laminasis.forEach((laminasi) => {
        SERTIFIKAT_TIERS.forEach((oplah) => {
          const q = searchTerm.toLowerCase().trim();
          if (q) {
            const match =
              oplah.toString().includes(q) ||
              varian.toLowerCase().includes(q) ||
              laminasi.toLowerCase().includes(q);
            if (!match) return;
          }
          const r = calc(oplah, varian, laminasi);
          list.push({
            oplah, varian, laminasi,
            hpp: r.hppPerPcs,
            jual: r.hargaJualPerPcs,
            nego: r.hargaNegoPerPcs,
            totalJual: r.totalHargaJual,
            margin: r.marginPct,
          });
        });
      });
    });

    return list;
  }, [customParams, searchTerm, selectedVarianFilter, selectedLaminasiFilter]);

  const varianCols = selectedVarianFilter === 'ALL' ? VARIAN_LIST : [selectedVarianFilter];

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
              Pricelist Matriks Sertifikat
            </h2>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tabel perbandingan HPP &amp; harga jual Sertifikat A4 21×29,7 cm Art Carton/Ivory 260 gsm per oplah &amp; varian (margin 30%, nego 4%, laminasi + foil).
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
            placeholder="Cari oplah, varian, laminasi..."
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
            onChange={(e) => setSelectedVarianFilter(e.target.value as SertifikatVarianType | 'ALL')}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Varian</option>
            {VARIAN_LIST.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Filter Laminasi */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-slate-500 font-semibold hidden sm:inline">Laminasi:</span>
          <select
            value={selectedLaminasiFilter}
            onChange={(e) => setSelectedLaminasiFilter(e.target.value as SertifikatLaminasiType | 'ALL')}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Laminasi</option>
            {LAMINASI_LIST.map((l) => (
              <option key={l} value={l}>{l}</option>
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
                  <span className="w-2.5 h-2.5 rounded-full bg-lime-500 inline-block"></span>
                  <h3 className="text-sm font-bold text-gray-800 tracking-tight">Sertifikat A4 21×29,7 cm — Art Carton / Ivory 260 gsm · Laminasi {effectiveLaminasi}</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {selectedVarianFilter === 'ALL' ? 'Semua Varian (4)' : `${selectedVarianFilter}`} · {effectiveLaminasi}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {varianCols.map((varian) => (
                <div key={varian} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="bg-lime-50/70 px-4 py-2 border-b border-lime-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-lime-900 tracking-wider uppercase flex items-center gap-1.5">
                      <Layers size={13} className="text-lime-600" />
                      Varian: {varian} — {SERTIFIKAT_CONFIG[varian].w}×{SERTIFIKAT_CONFIG[varian].h} cm · {SERTIFIKAT_CONFIG[varian].pcsPerA3} pcs/A3+ · {SERTIFIKAT_CONFIG[varian].bahan}
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
                            {varian} · {effectiveLaminasi}
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
                            <tr key={row.oplah} className="hover:bg-lime-50/30 transition-colors">
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
                  <th className="py-2.5 px-3">Varian</th>
                  <th className="py-2.5 px-3">Laminasi</th>
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
                    <tr key={idx} className="hover:bg-lime-50/40 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-800 font-sans">{row.oplah.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-slate-700 font-sans">{row.varian}</td>
                      <td className="py-2 px-3 text-slate-500 font-sans">{row.laminasi}</td>
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
            Menampilkan {flatTableRows.length} kombinasi tarif Sertifikat
          </div>
        </div>
      )}
    </div>
  );
}
