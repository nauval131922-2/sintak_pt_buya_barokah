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

  const handleResetAll = () => {
    setCustomParams(DEFAULT_MANASIK_PARAMS);
    toast.success('Semua parameter Buku Manasik dikembalikan ke standar master.');
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-emerald-950 flex items-center gap-2">
              Master Parameter Buku Manasik Haji / Umroh
            </h3>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan harga blok kosongan (96–208 hal), bahan cover AC, ongkos jilid bending & tali cocard.
            </p>
          </div>
        </div>
        <button
          onClick={handleResetAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 rounded-lg shadow-2xs transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Harga Blok Isi Ready */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Blok Isi Kosongan (Ready)
          </h4>
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Isi 96 Halaman (Rp/eks)</label>
                {isFieldModified('hargaIsiKosongan96') && (
                  <button onClick={() => handleResetField('hargaIsiKosongan96')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiKosongan96} onValueChange={(v) => handleChange('hargaIsiKosongan96', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Isi 128 Halaman (Rp/eks)</label>
                {isFieldModified('hargaIsiKosongan128') && (
                  <button onClick={() => handleResetField('hargaIsiKosongan128')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiKosongan128} onValueChange={(v) => handleChange('hargaIsiKosongan128', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Isi 192 Halaman (Rp/eks)</label>
                {isFieldModified('hargaIsiKosongan192') && (
                  <button onClick={() => handleResetField('hargaIsiKosongan192')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiKosongan192} onValueChange={(v) => handleChange('hargaIsiKosongan192', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Isi 208 Halaman (Rp/eks)</label>
                {isFieldModified('hargaIsiKosongan208') && (
                  <button onClick={() => handleResetField('hargaIsiKosongan208')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiKosongan208} onValueChange={(v) => handleChange('hargaIsiKosongan208', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Card 2: Cover & Cetak */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Bahan & Cetak Cover
          </h4>
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Kertas AC 230 (Rp/Kg)</label>
                {isFieldModified('tarifAc230Kg') && (
                  <button onClick={() => handleResetField('tarifAc230Kg')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifAc230Kg} onValueChange={(v) => handleChange('tarifAc230Kg', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Print Cover POD A3+ (Rp/lbr)</label>
                {isFieldModified('tarifPrintCoverA3') && (
                  <button onClick={() => handleResetField('tarifPrintCoverA3')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifPrintCoverA3} onValueChange={(v) => handleChange('tarifPrintCoverA3', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Jasa Desain Cover (Rp)</label>
                {isFieldModified('tarifDesainCover') && (
                  <button onClick={() => handleResetField('tarifDesainCover')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifDesainCover} onValueChange={(v) => handleChange('tarifDesainCover', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Card 3: Finishing & Aksesoris */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Jilid, Tali & Kemasan
          </h4>
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Tali Kur Leher (Rp/pcs)</label>
                {isFieldModified('tarifTaliKurPerPcs') && (
                  <button onClick={() => handleResetField('tarifTaliKurPerPcs')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifTaliKurPerPcs} onValueChange={(v) => handleChange('tarifTaliKurPerPcs', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Lubang Bor + Pasang Tali (Rp/pcs)</label>
                {isFieldModified('tarifLubangBor') && (
                  <button onClick={() => handleResetField('tarifLubangBor')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifLubangBor + customParams.tarifPasangTali} onValueChange={(v) => {
                handleChange('tarifLubangBor', Math.round((v || 0) * 0.67));
                handleChange('tarifPasangTali', Math.round((v || 0) * 0.33));
              }} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Plastik OPP Satuan (Rp/pack 100)</label>
                {isFieldModified('tarifPlastikOppPack') && (
                  <button onClick={() => handleResetField('tarifPlastikOppPack')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifPlastikOppPack} onValueChange={(v) => handleChange('tarifPlastikOppPack', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
