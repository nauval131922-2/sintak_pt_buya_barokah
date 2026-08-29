'use client';

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Search,
  X,
  LayoutGrid,
  TableProperties,
} from 'lucide-react';
import {
  calculateManasikSimulator,
  DEFAULT_MANASIK_PARAMS,
  ManasikMasterParams,
} from '@/lib/manasik-calculator';

interface ManasikMatrixViewProps {
  customParams?: ManasikMasterParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

const OPLAH_TIERS = [
  50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 1500, 2000, 2500, 3000
];

const HALAMAN_LIST: Array<{ hal: 96 | 128 | 192 | 208; title: string }> = [
  { hal: 96, title: 'Buku Manasik 96 Hal' },
  { hal: 128, title: 'Buku Manasik 128 Hal' },
  { hal: 192, title: 'Buku Manasik 192 Hal (Standar)' },
  { hal: 208, title: 'Buku Manasik 208 Hal (Jumbo)' },
];

export default function ManasikMatrixView({
  customParams = DEFAULT_MANASIK_PARAMS,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
}: ManasikMatrixViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJilidFilter, setSelectedJilidFilter] = useState<'ALL' | 'Softcover' | 'Cocard' | 'Spiral'>('ALL');
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;

  // Generate Matrix data dinamis sesuai formula master parameter
  const matrixData = useMemo(() => {
    return HALAMAN_LIST.map(({ hal, title }) => {
      let rows = OPLAH_TIERS.map((oplah) => {
        // Model 1: Softcover Bending
        const softBending = calculateManasikSimulator(
          {
            oplah,
            jumlahHalaman: hal,
            tipeJilid: 'Softcover (Bending/Lem Panas)',
            metodeCetakCover: 'Otomatis',
            laminasiCover: 'Glossy',
            opsiPlastikOpp: true,
            opsiKardus: true,
            marginPct: 30,
            negoDiskonPct: 0,
          },
          customParams
        );

        // Model 2: Tali Cocard
        const taliCocard = calculateManasikSimulator(
          {
            oplah,
            jumlahHalaman: hal,
            tipeJilid: 'Tali Cocard',
            metodeCetakCover: 'Otomatis',
            laminasiCover: 'Glossy',
            opsiPlastikOpp: true,
            opsiKardus: true,
            marginPct: 30,
            negoDiskonPct: 0,
          },
          customParams
        );

        // Model 3: Spiral Kawat
        const spiral = calculateManasikSimulator(
          {
            oplah,
            jumlahHalaman: hal,
            tipeJilid: 'Spiral Kawat',
            metodeCetakCover: 'Otomatis',
            laminasiCover: 'Glossy',
            opsiPlastikOpp: true,
            opsiKardus: true,
            marginPct: 30,
            negoDiskonPct: 0,
          },
          customParams
        );

        return {
          oplah,
          metode: oplah >= 300 ? 'Cetak Oliver' : 'Print Digital',
          softBendingHpp: softBending.summary.hppPerPcs,
          softBendingJual: softBending.summary.hargaJualPerPcs,
          taliCocardHpp: taliCocard.summary.hppPerPcs,
          taliCocardJual: taliCocard.summary.hargaJualPerPcs,
          spiralHpp: spiral.summary.hppPerPcs,
          spiralJual: spiral.summary.hargaJualPerPcs,
        };
      });

      // Filter berdasarkan Oplah jika search term diisi angka
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        rows = rows.filter((r) => r.oplah.toString().includes(query) || r.metode.toLowerCase().includes(query));
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
      tipeJilid: string;
      metode: string;
      hpp: number;
      hargaJual: number;
      omset: number;
      profitTot: number;
    }> = [];

    HALAMAN_LIST.forEach(({ hal, title }) => {
      OPLAH_TIERS.forEach((oplah) => {
        const jilidOptions: Array<{ type: 'Softcover (Bending/Lem Panas)' | 'Tali Cocard' | 'Spiral Kawat'; label: string; filterKey: 'Softcover' | 'Cocard' | 'Spiral' }> = [
          { type: 'Softcover (Bending/Lem Panas)', label: 'Softcover Bending', filterKey: 'Softcover' },
          { type: 'Tali Cocard', label: 'Tali Cocard', filterKey: 'Cocard' },
          { type: 'Spiral Kawat', label: 'Spiral Kawat', filterKey: 'Spiral' },
        ];

        jilidOptions.forEach(({ type, label, filterKey }) => {
          if (selectedJilidFilter !== 'ALL' && selectedJilidFilter !== filterKey) return;

          const res = calculateManasikSimulator(
            {
              oplah,
              jumlahHalaman: hal,
              tipeJilid: type,
              metodeCetakCover: 'Otomatis',
              laminasiCover: 'Glossy',
              opsiPlastikOpp: true,
              opsiKardus: true,
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
            tipeJilid: label,
            metode: oplah >= 300 ? 'Cetak Oliver' : 'Print Digital',
            hpp: res.summary.hppPerPcs,
            hargaJual: res.summary.hargaJualPerPcs,
            omset: res.summary.totalHargaJual,
            profitTot: res.summary.totalProfit,
          });
        });
      });
    });

    return list;
  }, [customParams, searchTerm, selectedJilidFilter]);

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
              Pricelist Matriks Buku Manasik Haji & Umroh
            </h2>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tabel acuan harga jual per eksemplar (+30% margin) berdasarkan kuantitas oplah dan model jilid.
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
            placeholder="Cari kuantitas oplah (misal: 500, 1000)..."
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
            onClick={() => setSelectedJilidFilter('ALL')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedJilidFilter === 'ALL' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua Jilid
          </button>
          <button
            type="button"
            onClick={() => setSelectedJilidFilter('Softcover')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedJilidFilter === 'Softcover' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Softcover
          </button>
          <button
            type="button"
            onClick={() => setSelectedJilidFilter('Cocard')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedJilidFilter === 'Cocard' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tali Cocard
          </button>
          <button
            type="button"
            onClick={() => setSelectedJilidFilter('Spiral')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedJilidFilter === 'Spiral' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Spiral
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
        <div className="space-y-6">
        {matrixData.map((section) => {
          if (section.rows.length === 0) return null;
          return (
            <div
              key={section.hal}
              className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden"
            >
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  {section.title} (Ukuran 10 x 15.5 cm)
                </h4>
                <span className="text-[11px] font-mono text-slate-500">
                  Bahan Cover AC 230 + Laminasi Glossy
                </span>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-2.5 pl-4">Oplah (Eks)</th>
                      <th className="p-2.5">Metode Cover</th>
                      {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Softcover') && (
                        <th className="p-2.5 text-right">Softcover Bending</th>
                      )}
                      {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Cocard') && (
                        <th className="p-2.5 text-right">Tali Cocard</th>
                      )}
                      {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Spiral') && (
                        <th className="p-2.5 text-right pr-4">Spiral Kawat</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {section.rows.map((row) => (
                      <tr
                        key={row.oplah}
                        className="hover:bg-emerald-50/40 transition-colors"
                      >
                        <td className="p-2.5 pl-4 font-bold text-slate-800">
                          {row.oplah.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2.5 text-slate-500 font-sans text-xs">
                          {row.metode}
                        </td>
                        {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Softcover') && (
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            Rp {row.softBendingJual.toLocaleString('id-ID')}
                            <span className="block text-[9px] text-slate-400 font-normal">
                              HPP: Rp {row.softBendingHpp.toLocaleString('id-ID')}
                            </span>
                          </td>
                        )}
                        {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Cocard') && (
                          <td className="p-2.5 text-right font-bold text-emerald-800 bg-emerald-50/30">
                            Rp {row.taliCocardJual.toLocaleString('id-ID')}
                            <span className="block text-[9px] text-emerald-700/70 font-normal">
                              HPP: Rp {row.taliCocardHpp.toLocaleString('id-ID')}
                            </span>
                          </td>
                        )}
                        {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Spiral') && (
                          <td className="p-2.5 text-right pr-4 font-bold text-slate-900">
                            Rp {row.spiralJual.toLocaleString('id-ID')}
                            <span className="block text-[9px] text-slate-400 font-normal">
                              HPP: Rp {row.spiralHpp.toLocaleString('id-ID')}
                            </span>
                          </td>
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
      ) : (
        /* Detailed Flat Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Halaman</th>
                  <th className="py-2.5 px-3">Tipe Jilid</th>
                  <th className="py-2.5 px-3 text-center">Oplah</th>
                  <th className="py-2.5 px-3 text-center">Metode Cover</th>
                  <th className="py-2.5 px-3 text-right">HPP / Eks</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Harga Jual / Eks</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">Total Omset</th>
                  <th className="py-2.5 px-3 text-right text-blue-700">Total Profit</th>
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
                    <tr key={idx} className="hover:bg-amber-50/20">
                      <td className="py-2 px-3 font-semibold text-slate-800 font-sans">{row.title}</td>
                      <td className="py-2 px-3 font-medium text-slate-700 font-sans">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10.5px]">
                          {row.tipeJilid}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">{row.oplah.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.metode.includes('Oliver') ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {row.metode}
                        </span>
                      </td>
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
            Menampilkan {flatTableRows.length} kombinasi tarif Buku Manasik
          </div>
        </div>
      )}
    </div>
  );
}
