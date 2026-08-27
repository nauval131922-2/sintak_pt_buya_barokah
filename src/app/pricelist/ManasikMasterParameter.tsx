'use client';

import React from 'react';
import {
  Database,
  BookOpen,
  RotateCcw,
  Sparkles,
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
    </div>
  );
    </div>
  );
}
