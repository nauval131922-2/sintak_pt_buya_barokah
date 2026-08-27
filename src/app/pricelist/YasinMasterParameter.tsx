'use client';

import React from 'react';
import {
  Database,
  BookOpen,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_YASIN_PARAMS,
  YasinMasterParams,
} from '@/lib/yasin-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface YasinMasterParameterProps {
  customParams: YasinMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<YasinMasterParams>>;
}

export default function YasinMasterParameter({
  customParams,
  setCustomParams,
}: YasinMasterParameterProps) {
  const handleChange = (key: keyof YasinMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof YasinMasterParams) => {
    return customParams[key] !== DEFAULT_YASIN_PARAMS[key];
  };

  const handleResetField = (key: keyof YasinMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_YASIN_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_YASIN_PARAMS[key]}).`);
  };

  const handleResetAll = () => {
    setCustomParams(DEFAULT_YASIN_PARAMS);
    toast.success('Semua parameter Buku Surat Yasin dikembalikan ke standar master.');
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
              Master Parameter Buku Surat Yasin & Tahlil
            </h3>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan harga blok kitab Yasin (64–192 hal), cetak sisipan foto/doa A3+, board hardcover, dan foil gembos emas.
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
        {/* Card 1: Harga Blok Isi Kitab Yasin */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Blok Isi Kitab Yasin (Ready)
          </h4>
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Yasin 64 Hal (Rp/buku)</label>
                {isFieldModified('hargaIsiYasin64') && (
                  <button onClick={() => handleResetField('hargaIsiYasin64')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiYasin64} onValueChange={(v) => handleChange('hargaIsiYasin64', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Yasin 96 Hal (Rp/buku)</label>
                {isFieldModified('hargaIsiYasin96') && (
                  <button onClick={() => handleResetField('hargaIsiYasin96')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiYasin96} onValueChange={(v) => handleChange('hargaIsiYasin96', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Yasin 128 Hal (Rp/buku)</label>
                {isFieldModified('hargaIsiYasin128') && (
                  <button onClick={() => handleResetField('hargaIsiYasin128')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiYasin128} onValueChange={(v) => handleChange('hargaIsiYasin128', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Yasin 192 Hal (Rp/buku)</label>
                {isFieldModified('hargaIsiYasin192') && (
                  <button onClick={() => handleResetField('hargaIsiYasin192')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiYasin192} onValueChange={(v) => handleChange('hargaIsiYasin192', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Card 2: Print Cover & Sisipan */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Cetak Digital Cover & Sisipan
          </h4>
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Print Cover A3+ (Rp/lbr)</label>
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
                <label className="font-medium text-slate-700">Print Sisipan Foto FC A3+ (Rp/lbr)</label>
                {isFieldModified('tarifPrintSisipanFotoA3') && (
                  <button onClick={() => handleResetField('tarifPrintSisipanFotoA3')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifPrintSisipanFotoA3} onValueChange={(v) => handleChange('tarifPrintSisipanFotoA3', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Jasa Desain Foto & Cover (Rp)</label>
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

        {/* Card 3: Komponen Hardcover & Aksesoris */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Hardcover, Siku & Foil
          </h4>
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Board HC + Casing in (Rp/buku)</label>
                {isFieldModified('tarifCasingInHardcover') && (
                  <button onClick={() => handleResetField('tarifCasingInHardcover')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifBoardHardcover + customParams.tarifCasingInHardcover} onValueChange={(v) => {
                handleChange('tarifBoardHardcover', Math.round((v || 0) * 0.3));
                handleChange('tarifCasingInHardcover', Math.round((v || 0) * 0.7));
              }} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Siku Emas + Pita (Rp/buku)</label>
                {isFieldModified('tarifSikuSudutEmas') && (
                  <button onClick={() => handleResetField('tarifSikuSudutEmas')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifSikuSudutEmas + customParams.tarifPitaRumbaiPapercraft} onValueChange={(v) => {
                handleChange('tarifSikuSudutEmas', Math.round((v || 0) * 0.5));
                handleChange('tarifPitaRumbaiPapercraft', Math.round((v || 0) * 0.5));
              }} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-slate-700">Foil Gembos Emboss Setup (Rp/12)</label>
                {isFieldModified('tarifEmbossFoilGembos') && (
                  <button onClick={() => handleResetField('tarifEmbossFoilGembos')} className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifEmbossFoilGembos} onValueChange={(v) => handleChange('tarifEmbossFoilGembos', v || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
