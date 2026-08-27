'use client';

import React, { useState } from 'react';
import {
  Database,
  BookOpen,
  RotateCcw,
  Sparkles,
  X,
  Sliders,
  Layers,
} from 'lucide-react';
import {
  DEFAULT_MANASIK_PARAMS,
  ManasikMasterParams,
} from '@/lib/manasik-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface ManasikMasterParameterProps {
  customParams: ManasikMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<ManasikMasterParams>>;
}

export default function ManasikMasterParameter({
  customParams,
  setCustomParams,
}: ManasikMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);
  const handleChange = (key: keyof ManasikMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof ManasikMasterParams) => {
    return customParams[key] !== DEFAULT_MANASIK_PARAMS[key];
  };

  const handleResetField = (key: keyof ManasikMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_MANASIK_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_MANASIK_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(() => {
    return JSON.stringify(customParams) !== JSON.stringify(DEFAULT_MANASIK_PARAMS);
  }, [customParams]);

  const handleResetAll = () => {
    setCustomParams(DEFAULT_MANASIK_PARAMS);
    toast.success('Semua parameter Buku Manasik dikembalikan ke standar master.');
  };

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
      {/* Header Info */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
                Master Parameter Buku Manasik Haji / Umroh
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan harga blok kosongan (96–208 hal), bahan cover AC, ongkos jilid bending & tali cocard.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all cursor-pointer shadow-2xs"
          >
            <BookOpen size={13} />
            <span>Manual Pengguna</span>
          </button>
          <button
            type="button"
            onClick={handleResetAll}
            disabled={!isModified}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 ${
              isModified
                ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer ring-2 ring-amber-400/40'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70'
            }`}
          >
            <RotateCcw size={13} />
            <span>Reset Standar Master</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Harga Blok Isi Ready */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Blok Isi Kosongan (Ready)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Rp / eks</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('hargaIsiKosongan96')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Isi 96 Halaman</label>
                {isFieldModified('hargaIsiKosongan96') && (
                  <button onClick={() => handleResetField('hargaIsiKosongan96')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiKosongan96} onValueChange={(v) => handleChange('hargaIsiKosongan96', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('hargaIsiKosongan128')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Isi 128 Halaman</label>
                {isFieldModified('hargaIsiKosongan128') && (
                  <button onClick={() => handleResetField('hargaIsiKosongan128')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiKosongan128} onValueChange={(v) => handleChange('hargaIsiKosongan128', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('hargaIsiKosongan192')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Isi 192 Halaman</label>
                {isFieldModified('hargaIsiKosongan192') && (
                  <button onClick={() => handleResetField('hargaIsiKosongan192')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiKosongan192} onValueChange={(v) => handleChange('hargaIsiKosongan192', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('hargaIsiKosongan208')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Isi 208 Halaman</label>
                {isFieldModified('hargaIsiKosongan208') && (
                  <button onClick={() => handleResetField('hargaIsiKosongan208')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiKosongan208} onValueChange={(v) => handleChange('hargaIsiKosongan208', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Card 2: Cover & Cetak */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Bahan & Cetak Cover
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Bahan & Digital</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('tarifAc230Kg')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Kertas AC 230 (Rp/Kg)</label>
                {isFieldModified('tarifAc230Kg') && (
                  <button onClick={() => handleResetField('tarifAc230Kg')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifAc230Kg} onValueChange={(v) => handleChange('tarifAc230Kg', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('tarifPrintCoverA3')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Print Cover POD A3+ (Rp/lbr)</label>
                {isFieldModified('tarifPrintCoverA3') && (
                  <button onClick={() => handleResetField('tarifPrintCoverA3')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifPrintCoverA3} onValueChange={(v) => handleChange('tarifPrintCoverA3', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('tarifDesainCover')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Jasa Desain Cover (Rp)</label>
                {isFieldModified('tarifDesainCover') && (
                  <button onClick={() => handleResetField('tarifDesainCover')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifDesainCover} onValueChange={(v) => handleChange('tarifDesainCover', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Card 3: Finishing & Kemasan */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Jilid, Tali & Kemasan
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Finishing</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('tarifTaliKurPerPcs')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Tali Kur Leher (Rp/pcs)</label>
                {isFieldModified('tarifTaliKurPerPcs') && (
                  <button onClick={() => handleResetField('tarifTaliKurPerPcs')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifTaliKurPerPcs} onValueChange={(v) => handleChange('tarifTaliKurPerPcs', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('tarifLubangBor') || isFieldModified('tarifPasangTali')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Lubang Bor + Pasang Tali (Rp/pcs)</label>
                {(isFieldModified('tarifLubangBor') || isFieldModified('tarifPasangTali')) && (
                  <button onClick={() => {
                    handleResetField('tarifLubangBor');
                    handleResetField('tarifPasangTali');
                  }} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifLubangBor + customParams.tarifPasangTali} onValueChange={(v) => {
                handleChange('tarifLubangBor', Math.round((v || 0) * 0.67));
                handleChange('tarifPasangTali', Math.round((v || 0) * 0.33));
              }} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('tarifPlastikOppPack')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Plastik OPP Satuan (Rp/pack 100)</label>
                {isFieldModified('tarifPlastikOppPack') && (
                  <button onClick={() => handleResetField('tarifPlastikOppPack')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifPlastikOppPack} onValueChange={(v) => handleChange('tarifPlastikOppPack', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
        </div>
      </div>
      {/* Modal Manual Pengguna Master Parameter */}
      {showManualModal && (
        <div
          onClick={() => setShowManualModal(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Manual Pengguna & Pemetaan Sumber Excel</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Buku Manasik
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
              {/* Bagian 1: Pemetaan 4 Kelompok Master Parameter */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Pemetaan 4 Bagian Master Parameter ke File Excel (Folder 01. Pricelist Buku Manasik/*.xlsm)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Poin 1 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Blok Isi Kosongan (Ready)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga Netto HPP Blok Isi</strong>: <span className="font-mono text-emerald-700">Master!D21</span> & <span className="font-mono text-emerald-700">BUKU!AJ6</span>.</li>
                      <li>• <strong>Tarif Standar</strong>: 192 Hal: Rp 3.421, 208 Hal: Rp 3.650, 96 Hal: Rp 1.800, 128 Hal: Rp 2.300.</li>
                      <li>• <strong>Insheet Blok Isi</strong>: <span className="font-mono text-slate-600">Master!D22</span> = 2 eksemplar.</li>
                    </ul>
                  </div>

                  {/* Kelompok 2 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Bahan Cover & Print Inter A3+ / Offset</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga Kertas AC 230</strong>: <span className="font-mono text-blue-700">Master!D12</span> (Rp 15.100 / kg).</li>
                      <li>• <strong>Tarif Print Cover A3+ (POD)</strong>: <span className="font-mono text-blue-700">Master!D18</span> (Rp 2.500 / lbr).</li>
                      <li>• <strong>Desain Cover</strong>: <span className="font-mono text-blue-700">Master!D17</span> (Rp 20.000).</li>
                      <li>• <strong>Insheet Cover Cetak</strong>: <span className="font-mono text-blue-700">Master!D13</span> (5 lembar).</li>
                      <li>• <strong>Offset Oliver Cover</strong>: Plat CTP <span className="font-mono text-blue-700">BUKU!Y4</span> (Rp 45.000), Min Order <span className="font-mono text-blue-700">BUKU!AB4</span> (Rp 90.000).</li>
                    </ul>
                  </div>

                  {/* Kelompok 3 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Ongkos Jilid & Finishing</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Tali Kur Warna /Roll</strong>: <span className="font-mono text-amber-700">Master!D28</span> (Rp 16.000 / roll = Rp 285,71 / pcs).</li>
                      <li>• <strong>Steples 1213 /Pack</strong>: <span className="font-mono text-amber-700">Master!D27</span> (Rp 24.000 = Rp 112,74 / pcs).</li>
                      <li>• <strong>Casing-In Pasang Cover</strong>: <span className="font-mono text-amber-700">BUKU!AP6</span> (Rp 225,49 / buku).</li>
                      <li>• <strong>Lubang Bor Mata Ayam</strong>: <span className="font-mono text-amber-700">BUKU!AQ6</span> (Rp 225,49 / buku).</li>
                      <li>• <strong>Potong Sisir Sisi</strong>: <span className="font-mono text-amber-700">BUKU!AR6</span> (Rp 150 / buku).</li>
                      <li>• <strong>Laminasi Doff/Glossy</strong>: <span className="font-mono text-amber-700">Master!D24</span> & <span className="font-mono text-amber-700">BUKU!AO6</span>.</li>
                    </ul>
                  </div>

                  {/* Kelompok 4 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Kemasan OPP, Lakban & Kardus</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Plastik OPP /Pack 100</strong>: <span className="font-mono text-violet-700">Master!D26</span> (Rp 9.200 = Rp 92 / pcs).</li>
                      <li>• <strong>Jasa Kemas OPP</strong>: <span className="font-mono text-violet-700">BUKU!BE4</span> (Rp 225,49 / pcs).</li>
                      <li>• <strong>Kardus Master Box</strong>: <span className="font-mono text-violet-700">Master!D30</span> (Rp 8.500 / box isi 200 buku).</li>
                      <li>• <strong>Lakban Box</strong>: <span className="font-mono text-violet-700">Master!D29</span> (Rp 8.000 / roll).</li>
                      <li>• <strong>Target Margin Standar</strong>: <span className="font-mono text-violet-700">Master!E32</span> (30%).</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all cursor-pointer shadow-xs"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
