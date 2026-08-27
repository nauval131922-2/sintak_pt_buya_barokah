'use client';

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  BookOpen,
  Info,
  Search,
  Filter,
  X,
} from 'lucide-react';
import {
  calculateManasikSimulator,
  DEFAULT_MANASIK_PARAMS,
  ManasikMasterParams,
} from '@/lib/manasik-calculator';

interface ManasikMatrixViewProps {
  customParams?: ManasikMasterParams;
}

const OPLAH_TIERS = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000];

const HALAMAN_LIST: Array<{ hal: 96 | 128 | 192 | 208; title: string }> = [
  { hal: 96, title: 'Buku Manasik 96 Hal' },
  { hal: 128, title: 'Buku Manasik 128 Hal' },
  { hal: 192, title: 'Buku Manasik 192 Hal (Standar)' },
  { hal: 208, title: 'Buku Manasik 208 Hal (Jumbo)' },
];

export default function ManasikMatrixView({
  customParams = DEFAULT_MANASIK_PARAMS,
}: ManasikMatrixViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJilidFilter, setSelectedJilidFilter] = useState<'ALL' | 'Softcover' | 'Cocard' | 'Spiral'>('ALL');

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
      </div>

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
    </div>
  );
}
