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
  calculateBrosurSimulator,
  DEFAULT_BROSUR_PARAMS,
  BrosurMasterParams,
  BrosurUkuranType,
  BrosurGramaturType,
  BrosurMukaType,
  BrosurMesinType,
} from '@/lib/brosur-calculator';

interface BrosurMatrixViewProps {
  customParams?: BrosurMasterParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

const OPLAH_TIERS = [100, 150, 200, 300, 400, 500, 1000, 1500, 2000, 2500, 3000];
const UKURAN_LIST: BrosurUkuranType[] = ['10,5 x 21', '14,5 x 21', '21 x 29,7', '21,5 x 33', '29,7 x 42'];

type SubVariant = { muka: BrosurMukaType; mesin: BrosurMesinType; label: string };
const VARIANTS: SubVariant[] = [
  { muka: '1 Muka', mesin: 'Print Inter', label: 'PI 1M' },
  { muka: '2 Muka', mesin: 'Print Inter', label: 'PI 2M' },
  { muka: '1 Muka', mesin: 'Oliver', label: 'Olv 1M' },
  { muka: '2 Muka', mesin: 'Oliver', label: 'Olv 2M' },
];

export default function BrosurMatrixView({
  customParams = DEFAULT_BROSUR_PARAMS,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
}: BrosurMatrixViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGramaturFilter, setSelectedGramaturFilter] = useState<BrosurGramaturType>('Art Paper 120 gsm');
  const [selectedUkuranFilter, setSelectedUkuranFilter] = useState<BrosurUkuranType | 'ALL'>('ALL');
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;

  const calc = (oplah: number, ukuran: BrosurUkuranType, muka: BrosurMukaType, mesin: BrosurMesinType) =>
    calculateBrosurSimulator(
      { oplah, gramatur: selectedGramaturFilter, ukuran, muka, mesin, laminasi: 'Tanpa Laminasi', opsiSisir: false, opsiPacking: true, marginPct: 30, negoDiskonPct: 4 },
      customParams
    );

  // Matrix: baris = oplah, kolom = ukuran, sub = 4 varian
  const matrixData = useMemo(() => {
    const ukurans = selectedUkuranFilter === 'ALL' ? UKURAN_LIST : [selectedUkuranFilter];
    return OPLAH_TIERS.map((oplah) => {
      const q = searchTerm.trim();
      if (q && !oplah.toString().includes(q)) return null;
      return {
        oplah,
        cols: ukurans.map((ukuran) => ({
          ukuran,
          variants: VARIANTS.map((v) => {
            const r = calc(oplah, ukuran, v.muka, v.mesin);
            return { label: v.label, hpp: r.hppPerPcs, jual: r.hargaJualPerPcs, nego: r.hargaNegoPerPcs };
          }),
        })),
      };
    }).filter(Boolean) as { oplah: number; cols: { ukuran: BrosurUkuranType; variants: { label: string; hpp: number; jual: number; nego: number }[] }[] }[];
  }, [customParams, searchTerm, selectedUkuranFilter, selectedGramaturFilter]);

  // Flat table
  const flatTableRows = useMemo(() => {
    const list: {
      oplah: number; gramatur: BrosurGramaturType; ukuran: BrosurUkuranType; muka: BrosurMukaType; mesin: BrosurMesinType;
      hpp: number; jual: number; nego: number; totalJual: number; margin: number;
    }[] = [];

    const ukurans = selectedUkuranFilter === 'ALL' ? UKURAN_LIST : [selectedUkuranFilter];

    ukurans.forEach((ukuran) => {
      VARIANTS.forEach(({ muka, mesin }) => {
        OPLAH_TIERS.forEach((oplah) => {
          const q = searchTerm.toLowerCase().trim();
          if (q) {
            const match =
              oplah.toString().includes(q) ||
              selectedGramaturFilter.toLowerCase().includes(q) ||
              ukuran.toLowerCase().includes(q) ||
              muka.toLowerCase().includes(q) ||
              mesin.toLowerCase().includes(q);
            if (!match) return;
          }
          const r = calc(oplah, ukuran, muka, mesin);
          list.push({
            oplah, gramatur: selectedGramaturFilter, ukuran, muka, mesin,
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
  }, [customParams, searchTerm, selectedUkuranFilter, selectedGramaturFilter]);

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
              Pricelist Matriks Brosur 2026 ({selectedGramaturFilter})
            </h2>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tabel perbandingan HPP &amp; harga jual brosur {selectedGramaturFilter} per oplah &amp; ukuran (+30% margin, tanpa laminasi, packing ON).
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
            placeholder="Cari oplah, ukuran, mesin..."
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

        {/* Filter Gramatur */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-slate-500 font-semibold hidden sm:inline">Gramatur:</span>
          <select
            value={selectedGramaturFilter}
            onChange={(e) => setSelectedGramaturFilter(e.target.value as BrosurGramaturType)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="Art Paper 120 gsm">Art Paper 120 gsm</option>
            <option value="Art Paper 150 gsm">Art Paper 150 gsm</option>
          </select>
        </div>

        {/* Filter Ukuran */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-slate-500 font-semibold hidden sm:inline">Ukuran:</span>
          <select
            value={selectedUkuranFilter}
            onChange={(e) => setSelectedUkuranFilter(e.target.value as BrosurUkuranType | 'ALL')}
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
                  <h3 className="text-sm font-bold text-gray-800 tracking-tight">Brosur 2026</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {selectedGramaturFilter}
                  {selectedUkuranFilter !== 'ALL' ? ` · ${selectedUkuranFilter} cm` : ''}
                </span>
              </div>

              <div className={`grid gap-4 ${ukuranCols.length === 1 ? 'grid-cols-1' : 'grid-cols-[repeat(auto-fit,minmax(360px,1fr))]'}`}>
                {ukuranCols.map((ukuran) => (
                <div key={ukuran} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="bg-amber-50/70 px-4 py-2 border-b border-amber-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 tracking-wider uppercase flex items-center gap-1.5">
                      <Layers size={13} className="text-amber-600" />
                      Bahan: {ukuran} cm
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-white shadow-xs">
                        <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                          <th className="py-2.5 px-3 border-r border-gray-200 text-center w-20 bg-gray-100" rowSpan={2}>
                            Oplah
                          </th>
                          {VARIANTS.map((v) => (
                            <th
                              key={v.label}
                              colSpan={3}
                              className="py-1.5 px-2 text-center border-r border-gray-200 font-bold text-gray-900 bg-gray-200/80"
                            >
                              {v.label}
                            </th>
                          ))}
                        </tr>
                        <tr className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-600">
                          {VARIANTS.map((v) => (
                            <React.Fragment key={v.label}>
                              <th className="py-1.5 px-2 text-right font-semibold bg-gray-50">HPP</th>
                              <th className="py-1.5 px-2 text-right font-bold text-emerald-800 bg-emerald-100/50">Harga</th>
                              <th className="py-1.5 px-2 text-right font-bold text-blue-800 bg-blue-100/50 border-r border-gray-200">Nego</th>
                            </React.Fragment>
                          ))}
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
                              {col.variants.map((v) => (
                                <React.Fragment key={v.label}>
                                  <td className="py-2 px-2 text-right text-gray-500 font-mono">{Math.round(v.hpp).toLocaleString('id-ID')}</td>
                                  <td className="py-2 px-2 text-right font-bold text-emerald-700 font-mono bg-emerald-50/30">
                                    {v.jual.toLocaleString('id-ID')}
                                  </td>
                                  <td className="py-2 px-2 text-right font-bold text-blue-700 font-mono bg-blue-50/30 border-r border-gray-200">
                                    {v.nego.toLocaleString('id-ID')}
                                  </td>
                                </React.Fragment>
                              ))}
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
                  <th className="py-2.5 px-3">Bahan</th>
                  <th className="py-2.5 px-3">Ukuran</th>
                  <th className="py-2.5 px-3">Muka</th>
                  <th className="py-2.5 px-3">Mesin</th>
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
                    <td colSpan={10} className="p-8 text-center text-slate-400 font-sans">
                      Tidak ada data yang sesuai dengan pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  flatTableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-800 font-sans">{row.oplah.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-slate-600 font-sans text-[10px]">{row.gramatur}</td>
                      <td className="py-2 px-3 text-slate-700 font-sans">{row.ukuran}</td>
                      <td className="py-2 px-3 text-slate-700 font-sans">{row.muka}</td>
                      <td className="py-2 px-3 font-sans">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          row.mesin === 'Oliver' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {row.mesin}
                        </span>
                      </td>
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
            Menampilkan {flatTableRows.length} kombinasi tarif Brosur 2026
          </div>
        </div>
      )}
    </div>
  );
}
