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
  calculateNotaSimulator,
  DEFAULT_NOTA_PARAMS,
  NotaMasterParams,
  NotaRangkapType,
  NotaUkuranType,
} from '@/lib/nota-calculator';

interface NotaMatrixViewProps {
  customParams?: NotaMasterParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

const OPLAH_TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50];

const RANGKAP_LIST: Array<{ rangkap: NotaRangkapType; title: string; subtitle: string }> = [
  { rangkap: 1, title: 'Nota 1 Rangkap (HVS 70 gr)', subtitle: 'Isi 100 lembar per buku (5 buku Folio/rim)' },
  { rangkap: 2, title: 'Nota 2 Rangkap (NCR 55 gr)', subtitle: 'Isi 50 set per buku (10 buku Folio/rim)' },
  { rangkap: 3, title: 'Nota 3 Rangkap (NCR 55 gr)', subtitle: 'Isi 50 set per buku (10 buku Folio/rim)' },
];

export default function NotaMatrixView({
  customParams = DEFAULT_NOTA_PARAMS,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
}: NotaMatrixViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRangkapFilter, setSelectedRangkapFilter] = useState<'ALL' | '1' | '2' | '3'>('ALL');
  const [selectedUkuran, setSelectedUkuran] = useState<NotaUkuranType>('1/4 Folio (10.7 x 16.5)');
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;

  // Matrix data per rangkap
  const matrixData = useMemo(() => {
    return RANGKAP_LIST.map(({ rangkap, title, subtitle }) => {
      let rows = OPLAH_TIERS.map((oplahRim) => {
        const res = calculateNotaSimulator(
          {
            oplahRim,
            rangkap,
            ukuran: selectedUkuran,
            jumlahWarna: 1,
            opsiPorporasi: true,
            opsiNomorator: false,
            marginPct: 30,
            negoDiskonPct: 4,
          },
          customParams
        );

        return {
          oplahRim,
          jumlahBuku: res.jumlahBukuBendel,
          hppPerRim: res.summary.hppPerRim,
          hargaJualPerRim: res.summary.hargaJualPerRim,
          hargaNegoPerRim: res.summary.hargaNegoPerRim,
          hargaJualPerBuku: res.summary.hargaJualPerBuku,
          profitTot: res.summary.totalProfit,
        };
      });

      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        rows = rows.filter(
          (r) =>
            r.oplahRim.toString().includes(query) ||
            r.hargaJualPerRim.toString().includes(query) ||
            r.jumlahBuku.toString().includes(query)
        );
      }

      return {
        rangkap,
        title,
        subtitle,
        rows,
      };
    });
  }, [customParams, searchTerm, selectedUkuran]);

  // Flat table rows for table view
  const flatTableRows = useMemo(() => {
    const list: Array<{
      title: string;
      rangkap: number;
      oplahRim: number;
      jumlahBuku: number;
      ukuran: string;
      hppPerRim: number;
      hargaJualPerRim: number;
      hargaNegoPerRim: number;
      totalOmset: number;
      totalProfit: number;
    }> = [];

    RANGKAP_LIST.forEach(({ rangkap, title }) => {
      if (selectedRangkapFilter !== 'ALL' && selectedRangkapFilter !== rangkap.toString()) return;

      OPLAH_TIERS.forEach((oplahRim) => {
        const res = calculateNotaSimulator(
          {
            oplahRim,
            rangkap,
            ukuran: selectedUkuran,
            jumlahWarna: 1,
            opsiPorporasi: true,
            opsiNomorator: false,
            marginPct: 30,
            negoDiskonPct: 4,
          },
          customParams
        );

        const q = searchTerm.toLowerCase().trim();
        if (q) {
          const match =
            title.toLowerCase().includes(q) ||
            oplahRim.toString().includes(q) ||
            res.summary.hargaJualPerRim.toString().includes(q) ||
            res.jumlahBukuBendel.toString().includes(q);
          if (!match) return;
        }

        list.push({
          title,
          rangkap,
          oplahRim,
          jumlahBuku: res.jumlahBukuBendel,
          ukuran: selectedUkuran,
          hppPerRim: res.summary.hppPerRim,
          hargaJualPerRim: res.summary.hargaJualPerRim,
          hargaNegoPerRim: res.summary.hargaNegoPerRim,
          totalOmset: res.summary.totalHargaJual,
          totalProfit: res.summary.totalProfit,
        });
      });
    });

    return list;
  }, [customParams, searchTerm, selectedRangkapFilter, selectedUkuran]);

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
              Pricelist Matriks Nota 1 Warna (HVS 70 & NCR 55)
            </h2>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tabel perbandingan tarif per Rim Folio (+30% margin, porporasi, sampul samson, alas board) cetak mesin Ryobi.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kuantitas rim (misal: 1, 2, 5, 10)..."
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

        {/* Filter Ukuran Buku */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-slate-500 font-semibold hidden sm:inline">Ukuran:</span>
          <select
            value={selectedUkuran}
            onChange={(e) => setSelectedUkuran(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="Folio (21.5 x 33)">Folio (1/1 Folio)</option>
            <option value="1/2 Folio (16.5 x 21.5)">1/2 Folio (Kwitansi)</option>
            <option value="1/3 Folio (11 x 21.5)">1/3 Folio (Kasir)</option>
            <option value="1/4 Folio (10.7 x 16.5)">1/4 Folio (Standar Populer)</option>
            <option value="1/6 Folio (10.7 x 11)">1/6 Folio (Mini)</option>
            <option value="1/8 Folio (10.75 x 8.25)">1/8 Folio (Karcis)</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 w-full md:w-auto justify-center">
          <button
            type="button"
            onClick={() => setSelectedRangkapFilter('ALL')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedRangkapFilter === 'ALL' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setSelectedRangkapFilter('1')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedRangkapFilter === '1' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            1 Ply (HVS)
          </button>
          <button
            type="button"
            onClick={() => setSelectedRangkapFilter('2')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedRangkapFilter === '2' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            2 Ply (NCR)
          </button>
          <button
            type="button"
            onClick={() => setSelectedRangkapFilter('3')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedRangkapFilter === '3' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            3 Ply (NCR)
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {matrixData.map((section) => {
            if (
              selectedRangkapFilter !== 'ALL' &&
              selectedRangkapFilter !== section.rangkap.toString()
            )
              return null;
            if (section.rows.length === 0) return null;

            return (
              <div
                key={section.rangkap}
                className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col"
              >
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col gap-0.5">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    {section.title}
                  </h4>
                  <span className="text-[10.5px] text-slate-500">
                    {section.subtitle}
                  </span>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="p-2.5 pl-3">Oplah (Rim)</th>
                        <th className="p-2.5 text-center">Buku</th>
                        <th className="p-2.5 text-right">Harga / Rim</th>
                        <th className="p-2.5 text-right pr-3">Nego (-4%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {section.rows.map((row) => (
                        <tr
                          key={row.oplahRim}
                          className="hover:bg-emerald-50/40 transition-colors"
                        >
                          <td className="p-2.5 pl-3 font-bold text-slate-800">
                            {row.oplahRim} Rim
                          </td>
                          <td className="p-2.5 text-center text-slate-500 font-sans text-xs">
                            {row.jumlahBuku.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-800 bg-emerald-50/30">
                            Rp {row.hargaJualPerRim.toLocaleString('id-ID')}
                            <span className="block text-[9px] text-slate-400 font-normal">
                              HPP: Rp {row.hppPerRim.toLocaleString('id-ID')}
                            </span>
                          </td>
                          <td className="p-2.5 text-right pr-3 font-bold text-blue-700">
                            Rp {row.hargaNegoPerRim.toLocaleString('id-ID')}
                            <span className="block text-[9px] text-blue-600/70 font-normal">
                              ~Rp {row.hargaJualPerBuku.toLocaleString('id-ID')}/bk
                            </span>
                          </td>
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
                  <th className="py-2.5 px-3">Jenis Nota</th>
                  <th className="py-2.5 px-3 text-center">Kuantitas</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Buku</th>
                  <th className="py-2.5 px-3">Ukuran Potongan</th>
                  <th className="py-2.5 px-3 text-right">HPP / Rim</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Harga Jual / Rim</th>
                  <th className="py-2.5 px-3 text-right text-blue-700">Harga Nego / Rim</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">Total Omset</th>
                  <th className="py-2.5 px-3 text-right text-emerald-900">Total Profit</th>
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
                      <td className="py-2 px-3 font-semibold text-slate-800 font-sans">{row.title}</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">{row.oplahRim} Rim</td>
                      <td className="py-2 px-3 text-center font-medium text-slate-600 font-sans">
                        {row.jumlahBuku.toLocaleString('id-ID')} Buku
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-700">{row.ukuran}</td>
                      <td className="py-2 px-3 text-right text-slate-500">Rp {row.hppPerRim.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 bg-emerald-50/30">
                        Rp {row.hargaJualPerRim.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-blue-700">
                        Rp {row.hargaNegoPerRim.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-800">
                        Rp {row.totalOmset.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-900">
                        Rp {row.totalProfit.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium">
            Menampilkan {flatTableRows.length} kombinasi tarif Nota 1 Warna
          </div>
        </div>
      )}
    </div>
  );
}
