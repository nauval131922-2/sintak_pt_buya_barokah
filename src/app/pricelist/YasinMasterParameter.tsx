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
  const [showManualModal, setShowManualModal] = useState(false);
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

  const isModified = React.useMemo(() => {
    return JSON.stringify(customParams) !== JSON.stringify(DEFAULT_YASIN_PARAMS);
  }, [customParams]);

  const handleResetAll = () => {
    setCustomParams(DEFAULT_YASIN_PARAMS);
    toast.success('Semua parameter Buku Surat Yasin dikembalikan ke standar master.');
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
                Master Parameter Buku Surat Yasin & Tahlil
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan harga blok kitab Yasin (64–192 hal), cetak sisipan foto/doa A3+, board hardcover, dan foil gembos emas.
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
        {/* Card 1: Harga Blok Isi Kitab Yasin */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Blok Isi Kitab Yasin (Ready)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Rp / buku</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('hargaIsiYasin64')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Yasin 64 Hal</label>
                {isFieldModified('hargaIsiYasin64') && (
                  <button onClick={() => handleResetField('hargaIsiYasin64')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiYasin64} onValueChange={(v) => handleChange('hargaIsiYasin64', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('hargaIsiYasin96')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Yasin 96 Hal</label>
                {isFieldModified('hargaIsiYasin96') && (
                  <button onClick={() => handleResetField('hargaIsiYasin96')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiYasin96} onValueChange={(v) => handleChange('hargaIsiYasin96', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('hargaIsiYasin128')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Yasin 128 Hal</label>
                {isFieldModified('hargaIsiYasin128') && (
                  <button onClick={() => handleResetField('hargaIsiYasin128')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiYasin128} onValueChange={(v) => handleChange('hargaIsiYasin128', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('hargaIsiYasin192')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Yasin 192 Hal</label>
                {isFieldModified('hargaIsiYasin192') && (
                  <button onClick={() => handleResetField('hargaIsiYasin192')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.hargaIsiYasin192} onValueChange={(v) => handleChange('hargaIsiYasin192', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Card 2: Print Sisipan & Desain */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Sisipan &amp; Desain Yasin
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Digital POD</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('tarifPrintSisipanFotoA3')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Print Sisipan Foto FC A3+ (Rp/lbr)</label>
                {isFieldModified('tarifPrintSisipanFotoA3') && (
                  <button onClick={() => handleResetField('tarifPrintSisipanFotoA3')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifPrintSisipanFotoA3} onValueChange={(v) => handleChange('tarifPrintSisipanFotoA3', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('tarifPrintSisipanTeksA3')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Print Sisipan Teks A3+ (Rp/lbr)</label>
                {isFieldModified('tarifPrintSisipanTeksA3') && (
                  <button onClick={() => handleResetField('tarifPrintSisipanTeksA3')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifPrintSisipanTeksA3} onValueChange={(v) => handleChange('tarifPrintSisipanTeksA3', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('tarifDesainCover')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Jasa Desain Foto &amp; Cover (Rp)</label>
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

        {/* Card 3: Komponen Hardcover & Aksesoris */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Hardcover, Siku & Foil
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Finishing HC</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('tarifBoardHardcover') || isFieldModified('tarifCasingInHardcover')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Board HC + Casing in (Rp/buku)</label>
                {(isFieldModified('tarifBoardHardcover') || isFieldModified('tarifCasingInHardcover')) && (
                  <button onClick={() => {
                    handleResetField('tarifBoardHardcover');
                    handleResetField('tarifCasingInHardcover');
                  }} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifBoardHardcover + customParams.tarifCasingInHardcover} onValueChange={(v) => {
                handleChange('tarifBoardHardcover', Math.round((v || 0) * 0.3));
                handleChange('tarifCasingInHardcover', Math.round((v || 0) * 0.7));
              }} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('tarifSikuSudutEmas') || isFieldModified('tarifPitaRumbaiPapercraft')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Siku Emas + Pita (Rp/buku)</label>
                {(isFieldModified('tarifSikuSudutEmas') || isFieldModified('tarifPitaRumbaiPapercraft')) && (
                  <button onClick={() => {
                    handleResetField('tarifSikuSudutEmas');
                    handleResetField('tarifPitaRumbaiPapercraft');
                  }} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifSikuSudutEmas + customParams.tarifPitaRumbaiPapercraft} onValueChange={(v) => {
                handleChange('tarifSikuSudutEmas', Math.round((v || 0) * 0.5));
                handleChange('tarifPitaRumbaiPapercraft', Math.round((v || 0) * 0.5));
              }} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className={`p-2.5 rounded-lg border transition-all ${
              isFieldModified('tarifEmbossFoilGembos')
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Foil Gembos Emboss Setup (Rp/12)</label>
                {isFieldModified('tarifEmbossFoilGembos') && (
                  <button onClick={() => handleResetField('tarifEmbossFoilGembos')} className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer">
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
              </div>
              <ThousandInput prefix="Rp" value={customParams.tarifEmbossFoilGembos} onValueChange={(v) => handleChange('tarifEmbossFoilGembos', v || 0)} className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Buku Surat Yasin
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
                  Pemetaan 4 Bagian Master Parameter ke File Excel (Folder 02. Pricelist Yasin/*.xlsx)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Poin 1 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Blok Isi Kitab Yasin (Ready)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Database Harga Isi</strong>: <span className="font-mono text-emerald-700">Data_Yasin!A1:P104</span> & <span className="font-mono text-emerald-700">Master!D36</span>.</li>
                      <li>• <strong>Harga Netto</strong>: 64 Hal: Rp 1.650, 96 Hal: Rp 2.250, 112 Hal: Rp 2.470, 128 Hal: Rp 2.600, 144 Hal: Rp 3.200, 192 Hal: Rp 3.800.</li>
                      <li>• <strong>Kode Master</strong>: <span className="font-mono text-slate-600">Master!D34</span> = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">Bo-[96-2250]-11,5[0#2250]Tgg</code>.</li>
                    </ul>
                  </div>

                  {/* Poin 2 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Cetak Cover & Sisipan (Print Inter A3+)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Print Cover AC 230 / AP 150</strong>: <span className="font-mono text-blue-700">Master!D15</span> (Softcover: Rp 2.500, Hardcover: Rp 2.000 / lbr A3+).</li>
                      <li>• <strong>Print Sisipan Foto (4 Warna)</strong>: <span className="font-mono text-blue-700">Master!D23</span> (Rp 1.750 / lbr A3+ AP 120).</li>
                      <li>• <strong>Print Sisipan Doa Keluarga</strong>: <span className="font-mono text-blue-700">Master!D31</span> (Rp 3.300 / 1.500 / lbr A3+).</li>
                      <li>• <strong>Desain Setting Cover</strong>: <span className="font-mono text-blue-700">Master!D14</span> (Rp 25.000).</li>
                    </ul>
                  </div>

                  {/* Poin 3 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Perakitan Jilid & Skiblat Hardcover</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Skiblat Sambung Dalam</strong>: <span className="font-mono text-amber-700">BUKU!AT6</span> (Rp 350 / buku).</li>
                      <li>• <strong>Susun Sisipan Lembar</strong>: <span className="font-mono text-amber-700">BUKU!AU6</span> (Rp 100 / lbr).</li>
                      <li>• <strong>Steples Tengah</strong>: <span className="font-mono text-amber-700">BUKU!AV6</span> (Rp 50 / buku).</li>
                      <li>• <strong>Potong Sisir 3 Sisi</strong>: <span className="font-mono text-amber-700">BUKU!AW6</span> (Rp 150 / buku).</li>
                      <li>• <strong>Casing-In Hardcover</strong>: <span className="font-mono text-amber-700">BUKU!AZ6</span> (Rp 751,62 / buku).</li>
                    </ul>
                  </div>

                  {/* Poin 4 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Aksesoris Mewah, Gembos Emas & OPP</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Pita Pembatas Rumbai</strong>: <span className="font-mono text-violet-700">BUKU!AY6</span> (Rp 470 / buku).</li>
                      <li>• <strong>Siku Sudut Emas (4 Pcs)</strong>: <span className="font-mono text-violet-700">Master Parameter</span> (Rp 400 / set).</li>
                      <li>• <strong>Gembos Klise Foil Emas</strong>: <span className="font-mono text-violet-700">Master!D40</span> (Rp 195.000 / pack = Rp 4.875 / 12 pcs).</li>
                      <li>• <strong>Plastik OPP /Pack</strong>: <span className="font-mono text-violet-700">Master!D42</span> (Rp 9.000 / pack).</li>
                      <li>• <strong>Target Margin Standar</strong>: <span className="font-mono text-violet-700">Master!E43</span> (30%).</li>
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
