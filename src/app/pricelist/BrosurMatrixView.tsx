'use client';

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  X,
  LayoutGrid,
  TableProperties,
} from 'lucide-react';
import {
  calculateBrosurSimulator,
  DEFAULT_BROSUR_PARAMS,
  BrosurMasterParams,
  BrosurUkuranType,
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
  const [selectedUkuranFilter, setSelectedUkuranFilter] = useState<BrosurUkuranType | 'ALL'>('ALL');
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;

  const calc = (oplah: number, ukuran: BrosurUkuranType, muka: BrosurMukaType, mesin: BrosurMesinType) =>
    calculateBrosurSimulator(
      { oplah, ukuran, muka, mesin, laminasi: 'Tanpa Laminasi', opsiSisir: false, opsiPacking: true, marginPct: 30, negoDiskonPct: 4 },
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
  }, [customParams, searchTerm, selectedUkuranFilter]);

  // Flat table
  const flatTableRows = useMemo(() => {
    const list: {
      oplah: number; ukuran: BrosurUkuranType; muka: BrosurMukaType; mesin: BrosurMesinType;
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
              ukuran.toLowerCase().includes(q) ||
              muka.toLowerCase().includes(q) ||
              mesin.toLowerCase().includes(q);
            if (!match) return;
          }
          const r = calc(oplah, ukuran, muka, mesin);
          list.push({
            oplah, ukuran, muka, mesin,
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
              Pricelist Matriks Brosur 2026
            </h2>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tabel perbandingan HPP &amp; harga jual brosur Art Paper 120gsm per oplah &amp; ukuran (+30% margin, tanpa laminasi, packing ON).
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[640px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-slate-700 font-bold whitespace-nowrap" rowSpan={2}>
                    Oplah (pcs)
                  </th>
                  {ukuranCols.map((u) => (
                    <th
                      key={u}
                      colSpan={4}
                      className="py-2 px-3 text-center text-emerald-800 font-bold border-l border-slate-200 text-[11px]"
                    >
                      {u} cm
                    </th>
                  ))}
                </tr>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {ukuranCols.map((u) =>
                    VARIANTS.map((v) => (
                      <th
                        key={u + v.label}
                        className="py-1.5 px-2 text-center text-slate-600 font-semibold text-[10px] whitespace-nowrap border-l border-slate-100"
                      >
                        {v.label}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrixData.length === 0 ? (
                  <tr>
                    <td colSpan={1 + ukuranCols.length * 4} className="p-8 text-center text-slate-400 font-sans text-xs">
                      Tidak ada data yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  matrixData.map((row) => (
                    <tr key={row.oplah} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-2 px-3 font-black text-slate-800 whitespace-nowrap font-mono">
                        {row.oplah.toLocaleString('id-ID')}
                      </td>
                      {row.cols.map((col) =>
                        col.variants.map((v) => (
                          <td
                            key={col.ukuran + v.label}
                            className="py-2 px-2 text-center border-l border-slate-100 align-top"
                          >
                            <span className="block font-bold text-emerald-800 font-mono text-[11px]">
                              {v.jual.toLocaleString('id-ID')}
                            </span>
                            <span className="block text-[9px] text-blue-600 font-mono">
                              {v.nego.toLocaleString('id-ID')}
                            </span>
                            <span className="block text-[9px] text-slate-400 font-mono">
                              HPP {Math.round(v.hpp).toLocaleString('id-ID')}
                            </span>
                          </td>
                        ))
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 font-medium flex flex-wrap gap-4">
            <span>Harga dalam Rp/pcs · Baris: Jual / <span className="text-blue-600">Nego</span> / <span className="text-slate-400">HPP</span></span>
            <span>Margin 30% · Nego -4% · Tanpa laminasi · Packing ON</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Oplah</th>
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
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                      Tidak ada data yang sesuai dengan pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  flatTableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/20">
                      <td className="py-2 px-3 font-bold text-slate-900">{row.oplah.toLocaleString('id-ID')} pcs</td>
                      <td className="py-2 px-3 font-sans text-slate-700">{row.ukuran} cm</td>
                      <td className="py-2 px-3 font-sans text-slate-700">{row.muka}</td>
                      <td className="py-2 px-3 font-sans text-slate-700">{row.mesin}</td>
                      <td className="py-2 px-3 text-right text-slate-500">Rp {Math.round(row.hpp).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 bg-emerald-50/30">
                        Rp {row.jual.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-blue-700">
                        Rp {row.nego.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-800">
                        Rp {row.totalJual.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {(row.margin * 100).toFixed(1)}%
                      </td>
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
