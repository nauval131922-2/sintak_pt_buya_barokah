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
  calculateBukuTabunganSecurityHpp,
  DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS,
  BukuTabunganSecurityMasterParams,
  TabunganSecurityMesinIsi,
  BUKU_TABUNGAN_SECURITY_TIERS,
} from '@/lib/buku-tabungan-security-calculator';

interface BukuTabunganSecurityMatrixViewProps {
  customParams?: BukuTabunganSecurityMasterParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

const MESIN_FILTER: TabunganSecurityMesinIsi[] = ['Otomatis', 'Print Buya', 'Print Inter', 'Ryobi', 'Oliver', 'SM'];

export default function BukuTabunganSecurityMatrixView({
  customParams = DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
}: BukuTabunganSecurityMatrixViewProps) {
  const params: BukuTabunganSecurityMasterParams = { ...DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS, ...(customParams || {}) };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMesin, setSelectedMesin] = useState<TabunganSecurityMesinIsi>('Otomatis');
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;

  // Spesifikasi baku matriks = kondisi file tersimpan: 24 hal, cover Inter 1Muka 4W, isi 1W, Laminasi Glossy, toggle √√√X + kardus √, insheet 15/30, laba 30%
  const calc = (oplahPcs: number) =>
    calculateBukuTabunganSecurityHpp(
      {
        oplahPcs, jumlahHalaman: 24, mukaCover: 1, warnaCover: 4, mesinCover: 'Otomatis',
        bahanCover: 'Art Carton', gramaturCover: 260,
        warnaIsi: 1, mesinIsi: selectedMesin, bahanIsi: 'HVS', gramaturIsi: 70,
        finishing: 'Laminasi Glossy,', jahitAktif: true, pisauPoundAktif: true, jasaPoundAktif: true,
        sisirAktif: false, kardusAktif: true, insheetCover: 15, insheetIsi: 30, marginPct: 30,
      },
      params
    );

  const matrixData = useMemo(() => {
    return BUKU_TABUNGAN_SECURITY_TIERS.map((pcs) => {
      const q = searchTerm.trim();
      if (q && !pcs.toString().includes(q)) return null;
      const r = calc(pcs);
      return { pcs, hpp: r.hppPerPcs, final: r.hargaFinalPerPcs, total: r.totalHarga, mesinIsi: r.mesinIsiEfektif };
    }).filter(Boolean) as { pcs: number; hpp: number; final: number; total: number; mesinIsi: string }[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customParams, searchTerm, selectedMesin]);

  const flatTableRows = useMemo(() => {
    return matrixData.map((row) => ({ ...row, margin: 30 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrixData]);

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">Pricelist Matriks Buku Tabungan Security</h2>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              9 × 14,5 cm · 24 hal · Cover Print Inter 1Muka 4W · Laminasi Glossy · laba {params.labaPct ?? 30}%.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Cari pcs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-slate-500 font-semibold hidden sm:inline">Mesin Isi:</span>
          <select value={selectedMesin} onChange={(e) => setSelectedMesin(e.target.value as TabunganSecurityMesinIsi)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer">
            {MESIN_FILTER.map((m) => <option key={m} value={m}>{m === 'Otomatis' ? '⚙️ Otomatis' : m}</option>)}
          </select>
        </div>
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
          <button type="button" onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${viewMode === 'matrix' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`} title="Tampilan Matriks">
            <LayoutGrid size={13} /><span className="hidden sm:inline">Matriks</span>
          </button>
          <button type="button" onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`} title="Tampilan Tabel Rinci">
            <TableProperties size={13} /><span className="hidden sm:inline">Tabel</span>
          </button>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
              <h3 className="text-sm font-bold text-gray-800 tracking-tight">Buku Tabungan Security 9 × 14,5 cm — Isi {selectedMesin === 'Otomatis' ? 'Otomatis (Buya/Ryobi)' : selectedMesin}</h3>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">15 Tier</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="bg-sky-50/70 px-4 py-2 border-b border-sky-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-900 tracking-wider uppercase flex items-center gap-1.5">
                <Layers size={13} className="text-sky-600" />24 Hal · Cover Inter · Laminasi Glossy
              </span>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-xs">
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                    <th className="py-2.5 px-3 border-r border-gray-200 text-center w-20 bg-gray-100">Pcs</th>
                    <th className="py-1.5 px-2 text-center font-semibold bg-gray-50">Mesin Isi</th>
                    <th className="py-1.5 px-2 text-right font-semibold bg-gray-50">HPP/pcs</th>
                    <th className="py-1.5 px-2 text-right font-bold text-emerald-800 bg-emerald-100/50">Final/pcs</th>
                    <th className="py-1.5 px-2 text-right font-semibold bg-gray-50 border-r border-gray-200">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {matrixData.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Tidak ada data yang sesuai pencarian.</td></tr>
                  ) : matrixData.map((row) => (
                    <tr key={row.pcs} className="hover:bg-sky-50/30 transition-colors">
                      <td className="py-2 px-3 text-center font-bold text-gray-900 border-r border-gray-200 bg-gray-50/30">{row.pcs.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-2 text-center text-gray-500">{row.mesinIsi}</td>
                      <td className="py-2 px-2 text-right text-gray-500 font-mono">{Math.round(row.hpp).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-2 text-right font-bold text-emerald-700 font-mono bg-emerald-50/30">{row.final.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-2 text-right text-gray-600 font-mono border-r border-gray-200">{Math.round(row.total).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Pcs</th>
                  <th className="py-2.5 px-3">Mesin Isi</th>
                  <th className="py-2.5 px-3 text-right">HPP / pcs</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Final / pcs</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">Total Harga</th>
                  <th className="py-2.5 px-3 text-right text-slate-600">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {flatTableRows.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-sans">Tidak ada data yang sesuai dengan pencarian atau filter.</td></tr>
                ) : flatTableRows.map((row) => (
                  <tr key={row.pcs} className="hover:bg-sky-50/40 transition-colors">
                    <td className="py-2 px-3 font-bold text-slate-800 font-sans">{row.pcs.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-3 text-slate-500 font-sans">{row.mesinIsi}</td>
                    <td className="py-2 px-3 text-right text-slate-600">Rp {Math.round(row.hpp).toLocaleString('id-ID')}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700">Rp {row.final.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">Rp {Math.round(row.total).toLocaleString('id-ID')}</td>
                    <td className="py-2 px-3 text-right text-slate-500 font-sans">{row.margin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium">
            Menampilkan {flatTableRows.length} kombinasi tarif Buku Tabungan Security
          </div>
        </div>
      )}
    </div>
  );
}
