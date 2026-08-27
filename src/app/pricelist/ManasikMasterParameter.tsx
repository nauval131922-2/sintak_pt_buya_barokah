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
                  <button onClick={() => handleResetField('hargaIsiKosongan96')} className="text-[10px] text-amber-600 font-bold">↺ Reset</button>
                )}
              </div>
              <ThousandInput value={customParams.hargaIsiKosongan96} onChange={(v) => handleChange('hargaIsiKosongan96', v)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs font-bold" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Isi 128 Halaman (Rp/eks)</label>
                {isFieldModified('hargaIsiKosongan128') && (
                  <button onClick={() => handleResetField('hargaIsiKosongan128')} className="text-[10px] text-amber-600 font-bold">↺ Reset</button>
                )}
              </div>
              <ThousandInput value={customParams.hargaIsiKosongan128} onChange={(v) => handleChange('hargaIsiKosongan128', v)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs font-bold" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Isi 192 Halaman (Rp/eks)</label>
                {isFieldModified('hargaIsiKosongan192') && (
                  <button onClick={() => handleResetField('hargaIsiKosongan192')} className="text-[10px] text-amber-600 font-bold">↺ Reset</button>
                )}
              </div>
              <ThousandInput value={customParams.hargaIsiKosongan192} onChange={(v) => handleChange('hargaIsiKosongan192', v)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs font-bold" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Isi 208 Halaman (Rp/eks)</label>
                {isFieldModified('hargaIsiKosongan208') && (
                  <button onClick={() => handleResetField('hargaIsiKosongan208')} className="text-[10px] text-amber-600 font-bold">↺ Reset</button>
                )}
              </div>
              <ThousandInput value={customParams.hargaIsiKosongan208} onChange={(v) => handleChange('hargaIsiKosongan208', v)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs font-bold" />
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
                  <button onClick={() => handleResetField('tarifAc230Kg')} className="text-[10px] text-amber-600 font-bold">↺ Reset</button>
                )}
              </div>
              <ThousandInput value={customParams.tarifAc230Kg} onChange={(v) => handleChange('tarifAc230Kg', v)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs font-bold" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Print Cover POD A3+ (Rp/lbr)</label>
                {isFieldModified('tarifPrintCoverA3') && (
                  <button onClick={() => handleResetField('tarifPrintCoverA3')} className="text-[10px] text-amber-600 font-bold">↺ Reset</button>
                )}
              </div>
              <ThousandInput value={customParams.tarifPrintCoverA3} onChange={(v) => handleChange('tarifPrintCoverA3', v)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs font-bold" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Jasa Desain Cover (Rp)</label>
                {isFieldModified('tarifDesainCover') && (
                  <button onClick={() => handleResetField('tarifDesainCover')} className="text-[10px] text-amber-600 font-bold">↺ Reset</button>
                )}
              </div>
              <ThousandInput value={customParams.tarifDesainCover} onChange={(v) => handleChange('tarifDesainCover', v)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs font-bold" />
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
                  <button onClick={() => handleResetField('tarifTaliKurPerPcs')} className="text-[10px] text-amber-600 font-bold">↺ Reset</button>
                )}
              </div>
              <ThousandInput value={customParams.tarifTaliKurPerPcs} onChange={(v) => handleChange('tarifTaliKurPerPcs', v)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs font-bold" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Lubang Bor + Pasang Tali (Rp/pcs)</label>
                {isFieldModified('tarifLubangBor') && (
                  <button onClick={() => handleResetField('tarifLubangBor')} className="text-[10px] text-amber-600 font-bold">↺ Reset</button>
                )}
              </div>
              <ThousandInput value={customParams.tarifLubangBor + customParams.tarifPasangTali} onChange={(v) => {
                handleChange('tarifLubangBor', Math.round(v * 0.67));
                handleChange('tarifPasangTali', Math.round(v * 0.33));
              }} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs font-bold" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Plastik OPP Satuan (Rp/pack 100)</label>
                {isFieldModified('tarifPlastikOppPack') && (
                  <button onClick={() => handleResetField('tarifPlastikOppPack')} className="text-[10px] text-amber-600 font-bold">↺ Reset</button>
                )}
              </div>
              <ThousandInput value={customParams.tarifPlastikOppPack} onChange={(v) => handleChange('tarifPlastikOppPack', v)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs font-bold" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
