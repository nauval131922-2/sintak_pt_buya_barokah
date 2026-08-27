'use client';

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  BookOpen,
  Search,
  Filter,
  X,
} from 'lucide-react';
import {
  calculateYasinSimulator,
  DEFAULT_YASIN_PARAMS,
  YasinMasterParams,
} from '@/lib/yasin-calculator';

interface YasinMatrixViewProps {
  customParams?: YasinMasterParams;
}

const OPLAH_TIERS = [20, 30, 50, 70, 100, 125, 150, 175, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000];

const YASIN_VARIANTS: Array<{ hal: 64 | 96 | 112 | 128 | 144 | 192; title: string }> = [
  { hal: 64, title: 'Yasin 64 Halaman' },
  { hal: 96, title: 'Yasin 96 Halaman (Populer)' },
  { hal: 128, title: 'Yasin 128 Halaman' },
  { hal: 192, title: 'Yasin 192 Halaman (Majmu Syarif)' },
];

export default function YasinMatrixView({
  customParams = DEFAULT_YASIN_PARAMS,
}: YasinMatrixViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoverFilter, setSelectedCoverFilter] = useState<'ALL' | 'Softcover' | 'Hardcover'>('ALL');

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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                  {section.title} (11.7 x 15 cm)
                </h4>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-2.5 pl-4">Oplah (Buku)</th>
                      {(selectedCoverFilter === 'ALL' || selectedCoverFilter === 'Softcover') && (
                        <th className="p-2.5 text-right">Soft Cover (AC 230)</th>
                      )}
                      {(selectedCoverFilter === 'ALL' || selectedCoverFilter === 'Hardcover') && (
                        <th className="p-2.5 text-right pr-4">Hard Cover (Mewah)</th>
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
                          {row.oplah.toLocaleString('id-ID')} pcs
                        </td>
                        {(selectedCoverFilter === 'ALL' || selectedCoverFilter === 'Softcover') && (
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            Rp {row.softJual.toLocaleString('id-ID')}
                            <span className="block text-[9px] text-slate-400 font-normal">
                              HPP: Rp {row.softHpp.toLocaleString('id-ID')}
                            </span>
                          </td>
                        )}
                        {(selectedCoverFilter === 'ALL' || selectedCoverFilter === 'Hardcover') && (
                          <td className="p-2.5 text-right pr-4 font-bold text-emerald-800 bg-emerald-50/30">
                            Rp {row.hardJual.toLocaleString('id-ID')}
                            <span className="block text-[9px] text-emerald-700/70 font-normal">
                              HPP: Rp {row.hardHpp.toLocaleString('id-ID')}
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
