'use client';

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Search,
  X,
  LayoutGrid,
  TableProperties,
  Layers,
} from 'lucide-react';
import {
  calculateYasinSimulator,
  DEFAULT_YASIN_PARAMS,
  YasinMasterParams,
} from '@/lib/yasin-calculator';

interface YasinMatrixViewProps {
  customParams?: YasinMasterParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

const OPLAH_TIERS = [
  20, 30, 50, 70, 100, 125, 150, 175, 200, 225, 250, 300, 400, 500, 600, 700, 800, 900, 1000
];

const YASIN_VARIANTS: Array<{ hal: 64 | 96 | 112 | 128 | 144 | 192; title: string }> = [
  { hal: 64, title: 'Yasin 64 Halaman' },
  { hal: 96, title: 'Yasin 96 Halaman (Populer)' },
  { hal: 128, title: 'Yasin 128 Halaman' },
  { hal: 192, title: 'Yasin 192 Halaman (Majmu Syarif)' },
];

export default function YasinMatrixView({
  customParams = DEFAULT_YASIN_PARAMS,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
}: YasinMatrixViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoverFilter, setSelectedCoverFilter] = useState<'ALL' | 'Softcover' | 'Hardcover'>('ALL');
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;
  const matrixData = useMemo(() => {
    return YASIN_VARIANTS.map(({ hal, title }) => {
      let rows = OPLAH_TIERS.map((oplah) => {
        // Model 1: Softcover Standar (2 Lembar Foto + 2 Lembar Doa/Keluarga)
        const soft = calculateYasinSimulator(
          {
            oplah,
            tipeCover: 'Softcover',
            ukuran: '11.7 x 15',
            jumlahHalamanIsi: hal,
            lembarSisipanFoto: 2,
            lembarSisipanKeluarga: 2,
            laminasiCover: 'Glossy',
            opsiPitaRumbai: false,
            opsiSikuEmas: false,
            opsiPlastikOpp: true,
            marginPct: 30,
            negoDiskonPct: 0,
          },
          customParams
        );

        // Model 2: Hardcover Mewah (Foil Emas + Siku Emas + Pita Rumbai)
        const hard = calculateYasinSimulator(
          {
            oplah,
            tipeCover: 'Hardcover',
            ukuran: '11.7 x 15',
            jumlahHalamanIsi: hal,
            lembarSisipanFoto: 2,
            lembarSisipanKeluarga: 2,
            laminasiCover: 'Glossy',
            opsiPitaRumbai: true,
            opsiSikuEmas: true,
            opsiPlastikOpp: true,
            marginPct: 30,
            negoDiskonPct: 0,
          },
          customParams
        );

        return {
          oplah,
          softHpp: soft.summary.hppPerPcs,
          softJual: soft.summary.hargaJualPerPcs,
          hardHpp: hard.summary.hppPerPcs,
          hardJual: hard.summary.hargaJualPerPcs,
        };
      });

      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        rows = rows.filter((r) => r.oplah.toString().includes(query));
      }

      return {
        hal,
        title,
        rows,
      };
    });
  }, [customParams, searchTerm]);

  // Flat table rows for table view
  const flatTableRows = useMemo(() => {
    const list: Array<{
      hal: number;
      title: string;
      oplah: number;
      tipeCover: string;
      hpp: number;
      hargaJual: number;
      omset: number;
      profitTot: number;
    }> = [];

    YASIN_VARIANTS.forEach(({ hal, title }) => {
      OPLAH_TIERS.forEach((oplah) => {
        const coverOptions: Array<{ type: 'Softcover' | 'Hardcover'; label: string; filterKey: 'Softcover' | 'Hardcover'; pitaSiku: boolean }> = [
          { type: 'Softcover', label: 'Soft Cover (AC 230)', filterKey: 'Softcover', pitaSiku: false },
          { type: 'Hardcover', label: 'Hard Cover Mewah', filterKey: 'Hardcover', pitaSiku: true },
        ];

        coverOptions.forEach(({ type, label, filterKey, pitaSiku }) => {
          if (selectedCoverFilter !== 'ALL' && selectedCoverFilter !== filterKey) return;

          const res = calculateYasinSimulator(
            {
              oplah,
              tipeCover: type,
              ukuran: '11.7 x 15',
              jumlahHalamanIsi: hal,
              lembarSisipanFoto: 2,
              lembarSisipanKeluarga: 2,
              laminasiCover: 'Glossy',
              opsiPitaRumbai: pitaSiku,
              opsiSikuEmas: pitaSiku,
              opsiPlastikOpp: true,
              marginPct: 30,
              negoDiskonPct: 0,
            },
            customParams
          );

          const q = searchTerm.toLowerCase().trim();
          if (q) {
            const match =
              title.toLowerCase().includes(q) ||
              label.toLowerCase().includes(q) ||
              oplah.toString().includes(q) ||
              res.summary.hargaJualPerPcs.toString().includes(q);
            if (!match) return;
          }

          list.push({
            hal,
            title,
            oplah,
            tipeCover: label,
            hpp: res.summary.hppPerPcs,
            hargaJual: res.summary.hargaJualPerPcs,
            omset: res.summary.totalHargaJual,
            profitTot: res.summary.totalProfit,
          });
        });
      });
    });

    return list;
  }, [customParams, searchTerm, selectedCoverFilter]);

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
              Pricelist Matriks Buku Surat Yasin & Tahlil
            </h2>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tabel perbandingan harga jual Softcover vs Hardcover (+ 2 lbr Foto FC & 2 lbr Doa Keluarga, Plastik OPP).
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kuantitas oplah (misal: 100, 200)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={() => setSelectedCoverFilter('ALL')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedCoverFilter === 'ALL' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua Cover
          </button>
          <button
            type="button"
            onClick={() => setSelectedCoverFilter('Softcover')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedCoverFilter === 'Softcover' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Soft Cover
          </button>
          <button
            type="button"
            onClick={() => setSelectedCoverFilter('Hardcover')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedCoverFilter === 'Hardcover' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Hard Cover
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
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
              viewMode === 'table'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
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
          {matrixData.every((s) => s.rows.length === 0) ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              Tidak ada data yang sesuai pencarian.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  <h3 className="text-sm font-bold text-gray-800 tracking-tight">Buku Surat Yasin &amp; Tahlil</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  11.7 x 15 cm · 2 Lbr Foto + 2 Lbr Keluarga
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {matrixData.map((section) => {
                if (section.rows.length === 0) return null;
                return (
                  <div key={section.hal} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="bg-amber-50/70 px-4 py-2 border-b border-amber-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900 tracking-wider uppercase flex items-center gap-1.5">
                        <Layers size={13} className="text-amber-600" />
                        Bahan: {section.title} — 11.7 x 15 cm
                      </span>
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-white shadow-xs">
                          <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                            <th className="py-2.5 px-3 border-r border-gray-200 text-center w-20 bg-gray-100" rowSpan={2}>
                              Oplah
                            </th>
                            {(selectedCoverFilter === 'ALL' || selectedCoverFilter === 'Softcover') && (
                              <th colSpan={2} className="py-1.5 px-2 text-center border-r border-gray-200 font-bold text-gray-900 bg-gray-200/80">
                                Soft Cover
                              </th>
                            )}
                            {(selectedCoverFilter === 'ALL' || selectedCoverFilter === 'Hardcover') && (
                              <th colSpan={2} className="py-1.5 px-2 text-center border-r border-gray-200 font-bold text-gray-900 bg-gray-200/80">
                                Hard Cover
                              </th>
                            )}
                          </tr>
                          <tr className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-600">
                            {(selectedCoverFilter === 'ALL' || selectedCoverFilter === 'Softcover') && (
                              <>
                                <th className="py-1.5 px-2 text-right font-semibold bg-gray-50">HPP</th>
                                <th className="py-1.5 px-2 text-right font-bold text-emerald-800 bg-emerald-100/50 border-r border-gray-200">Harga</th>
                              </>
                            )}
                            {(selectedCoverFilter === 'ALL' || selectedCoverFilter === 'Hardcover') && (
                              <>
                                <th className="py-1.5 px-2 text-right font-semibold bg-gray-50">HPP</th>
                                <th className="py-1.5 px-2 text-right font-bold text-emerald-800 bg-emerald-100/50 border-r border-gray-200">Harga</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {section.rows.map((row) => (
                            <tr key={row.oplah} className="hover:bg-amber-50/30 transition-colors">
                              <td className="py-2 px-3 text-center font-bold text-gray-900 border-r border-gray-200 bg-gray-50/30">
                                {row.oplah.toLocaleString('id-ID')}
                              </td>
                              {(selectedCoverFilter === 'ALL' || selectedCoverFilter === 'Softcover') && (
                                <>
                                  <td className="py-2 px-2 text-right text-gray-500 font-mono">{row.softHpp.toLocaleString('id-ID')}</td>
                                  <td className="py-2 px-2 text-right font-bold text-emerald-700 font-mono bg-emerald-50/30 border-r border-gray-200">
                                    {row.softJual.toLocaleString('id-ID')}
                                  </td>
                                </>
                              )}
                              {(selectedCoverFilter === 'ALL' || selectedCoverFilter === 'Hardcover') && (
                                <>
                                  <td className="py-2 px-2 text-right text-gray-500 font-mono">{row.hardHpp.toLocaleString('id-ID')}</td>
                                  <td className="py-2 px-2 text-right font-bold text-emerald-700 font-mono bg-emerald-50/30 border-r border-gray-200">
                                    {row.hardJual.toLocaleString('id-ID')}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Detailed Flat Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Halaman</th>
                  <th className="py-2.5 px-3">Tipe Cover</th>
                  <th className="py-2.5 px-3 text-center">Oplah</th>
                  <th className="py-2.5 px-3 text-right">HPP / Eks</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Harga Jual / Eks</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">Total Omset</th>
                  <th className="py-2.5 px-3 text-right text-blue-700">Total Profit</th>
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
                    <tr key={idx} className="hover:bg-amber-50/20">
                      <td className="py-2 px-3 font-semibold text-slate-800 font-sans">{row.title}</td>
                      <td className="py-2 px-3 font-medium text-slate-700 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                            row.tipeCover.includes('Hard')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {row.tipeCover}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">{row.oplah.toLocaleString('id-ID')} pcs</td>
                      <td className="py-2 px-3 text-right text-slate-500">Rp {row.hpp.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 bg-emerald-50/30">
                        Rp {row.hargaJual.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-800">
                        Rp {row.omset.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-blue-700">
                        Rp {row.profitTot.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium">
            Menampilkan {flatTableRows.length} kombinasi tarif Buku Surat Yasin
          </div>
        </div>
      )}
    </div>
  );
}
