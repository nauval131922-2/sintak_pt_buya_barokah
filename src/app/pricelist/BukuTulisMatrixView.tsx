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
  calculateBukuTulisHpp,
  DEFAULT_BUKU_TULIS_PARAMS,
  BukuTulisMasterParams,
  BukuTulisUkuranType,
  BUKU_TULIS_TIERS,
  BUKU_TULIS_CONFIG,
} from '@/lib/buku-tulis-calculator';

interface BukuTulisMatrixViewProps {
  customParams?: BukuTulisMasterParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

const UKURAN_LIST: BukuTulisUkuranType[] = ['15,5 x 21', '16 x 21'];

export default function BukuTulisMatrixView({
  customParams = DEFAULT_BUKU_TULIS_PARAMS,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
}: BukuTulisMatrixViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUkuranFilter, setSelectedUkuranFilter] = useState<BukuTulisUkuranType | 'ALL'>('ALL');
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;

  const calc = (oplah: number, ukuran: BukuTulisUkuranType) =>
    calculateBukuTulisHpp(
      { oplah, ukuran, jumlahHalaman: 72, opsiLaminasi: true, opsiSisir: true, marginPct: 20, negoDiskonPct: 4 },
      customParams
    );

  // Matrix: baris = oplah, kolom = ukuran (2 varian)
  const matrixData = useMemo(() => {
    const ukurans = selectedUkuranFilter === 'ALL' ? UKURAN_LIST : [selectedUkuranFilter];
    return BUKU_TULIS_TIERS.map((oplah) => {
      const q = searchTerm.trim();
      if (q && !oplah.toString().includes(q)) return null;
      return {
        oplah,
        cols: ukurans.map((ukuran) => {
          const r = calc(oplah, ukuran);
          return { ukuran, hpp: r.hppPerPcs, jual: r.hargaJualPerPcs, nego: r.hargaNegoPerPcs, totalJual: r.totalHargaJual };
        }),
      };
    }).filter(Boolean) as { oplah: number; cols: { ukuran: BukuTulisUkuranType; hpp: number; jual: number; nego: number; totalJual: number }[] }[];
  }, [customParams, searchTerm, selectedUkuranFilter]);

  // Flat table
  const flatTableRows = useMemo(() => {
    const list: {
      oplah: number; ukuran: BukuTulisUkuranType; hpp: number; jual: number; nego: number; totalJual: number; margin: number;
    }[] = [];

    const ukurans = selectedUkuranFilter === 'ALL' ? UKURAN_LIST : [selectedUkuranFilter];

    ukurans.forEach((ukuran) => {
      BUKU_TULIS_TIERS.forEach((oplah) => {
        const q = searchTerm.toLowerCase().trim();
        if (q) {
          const match =
            oplah.toString().includes(q) ||
            ukuran.toLowerCase().includes(q);
          if (!match) return;
        }
        const r = calc(oplah, ukuran);
        list.push({
          oplah, ukuran,
          hpp: r.hppPerPcs,
          jual: r.hargaJualPerPcs,
          nego: r.hargaNegoPerPcs,
          totalJual: r.totalHargaJual,
          margin: r.marginPct,
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
              Pricelist Matriks Buku Tulis 72 Hal
            </h2>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tabel perbandingan HPP &amp; harga jual buku tulis 72 hal Soft Cover per oplah &amp; ukuran (margin 20%, nego 4%, laminasi glossy &amp; sisir ON).
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
            placeholder="Cari oplah, ukuran..."
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
            onChange={(e) => setSelectedUkuranFilter(e.target.value as BukuTulisUkuranType | 'ALL')}
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
                  <th className="py-2.5 px-3 text-slate-700 font-bold whitespace-nowrap">
                    Oplah (pcs)
                  </th>
                  {ukuranCols.map((u) => (
                    <th
                      key={u}
                      className="py-2 px-3 text-center text-emerald-800 font-bold border-l border-slate-200 text-[11px]"
                    >
                      <div>{u} cm</div>
                      <div className="text-[10px] font-normal text-slate-500">{BUKU_TULIS_CONFIG[u].w}×{BUKU_TULIS_CONFIG[u].h} cm · {BUKU_TULIS_CONFIG[u].leavesPerA3} lbr/A3</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrixData.length === 0 ? (
                  <tr>
                    <td colSpan={1 + ukuranCols.length} className="p-8 text-center text-slate-400 font-sans text-xs">
                      Tidak ada data yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  matrixData.map((row) => (
                    <tr key={row.oplah} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-2 px-3 font-black text-slate-800 whitespace-nowrap font-mono">
                        {row.oplah.toLocaleString('id-ID')}
                      </td>
                      {row.cols.map((col) => (
                        <td
                          key={col.ukuran}
                          className="py-2 px-2 text-center border-l border-slate-100 align-top"
                        >
                          <span className="block font-bold text-emerald-800 font-mono text-[11px]">
                            Rp {col.jual.toLocaleString('id-ID')}
                          </span>
                          <span className="block text-[9px] text-blue-600 font-mono">
                            Nego Rp {col.nego.toLocaleString('id-ID')}
                          </span>
                          <span className="block text-[9px] text-slate-400 font-mono">
                            HPP Rp {Math.round(col.hpp).toLocaleString('id-ID')} · Total Rp {col.totalJual.toLocaleString('id-ID')}
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
            <span>Harga dalam Rp/pcs · Baris: Jual / <span className="text-blue-600">Nego</span> / <span className="text-slate-400">HPP</span></span>
            <span>72 hal (18 lembar) · Margin 20% · Nego -4% · Laminasi Glossy ON · Sisir ON</span>
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
                  <th className="py-2.5 px-3">Halaman</th>
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
                    <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-800 font-sans">{row.oplah.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-slate-700 font-sans">{row.ukuran} cm</td>
                      <td className="py-2 px-3 text-slate-500 font-sans">72</td>
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
            Menampilkan {flatTableRows.length} kombinasi tarif Buku Tulis 72 Hal
          </div>
        </div>
      )}
    </div>
  );
}
