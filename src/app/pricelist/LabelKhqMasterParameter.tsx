'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  Sparkles,
  BookOpen,
  X,
  FileSpreadsheet,
  Layers,
  Printer,
  Scissors,
  DollarSign,
} from 'lucide-react';
import {
  LabelKhqMasterParams,
  DEFAULT_LABEL_KHQ_PARAMS,
} from '@/lib/label-khq-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface LabelKhqMasterParameterProps {
  customParams?: LabelKhqMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<LabelKhqMasterParams>>;
  onBackToSimulator?: () => void;
}

// Hanya pantau field-field yang ada di form
const VISIBLE_KEYS: (keyof LabelKhqMasterParams)[] = [
  'tarifPrintA3',
  'insheetWasteLbr',
  'tarifRajangPerPcs',
  'tarifLaminasiGlossyCm2',
  'minLaminasi',
  'tarifDesain',
  'marginDefaultPct',
  'negoDefaultPct',
];

export default function LabelKhqMasterParameter({
  customParams = DEFAULT_LABEL_KHQ_PARAMS,
  setCustomParams,
  onBackToSimulator,
}: LabelKhqMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof LabelKhqMasterParams, val: number) => {
    if (!setCustomParams) return;
    setCustomParams((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const isFieldModified = (key: keyof LabelKhqMasterParams) => {
    return customParams[key] !== DEFAULT_LABEL_KHQ_PARAMS[key];
  };

  const handleResetField = (key: keyof LabelKhqMasterParams) => {
    if (!setCustomParams) return;
    setCustomParams((prev) => ({
      ...prev,
      [key]: DEFAULT_LABEL_KHQ_PARAMS[key],
    }));
    toast.success(`Parameter "${key}" dikembalikan ke standar.`);
  };

  const handleResetAll = () => {
    if (!setCustomParams) return;
    setCustomParams(DEFAULT_LABEL_KHQ_PARAMS);
    toast.success('Semua parameter Label KHQ berhasil dikembalikan ke standar.');
  };

  const isModified = VISIBLE_KEYS.some((key) => isFieldModified(key));

  const renderField = (
    key: keyof LabelKhqMasterParams,
    label: string,
    unit: string,
    step = 1,
    isCurrency = true
  ) => {
    const val = customParams[key];
    const modified = isFieldModified(key);

    return (
      <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700">{label}</label>
          {modified && (
            <button
              type="button"
              onClick={() => handleResetField(key)}
              className="text-[10px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-0.5 cursor-pointer"
              title="Reset ke standar"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isCurrency ? (
            <div className="flex-1">
              <ThousandInput
                prefix="Rp"
                value={val}
                onValueChange={(v) => handleChange(key, v || 0)}
                className={`w-full pr-2 py-1 text-xs font-mono font-bold bg-white border rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none ${
                  modified
                    ? 'border-amber-300 bg-amber-50/40 text-amber-900 focus:border-amber-500'
                    : 'border-slate-200 focus:border-emerald-500'
                }`}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center">
              <input
                type="number"
                step={step}
                value={val}
                onChange={(e) => handleChange(key, Number(e.target.value))}
                className={`w-full px-3 py-1.5 text-xs font-bold rounded-lg border focus:outline-none transition-all ${
                  modified
                    ? 'border-amber-300 bg-amber-50/40 text-amber-900 focus:border-amber-500'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>
          )}
          <span className="text-[11px] font-bold text-slate-500 shrink-0">{unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
                Master Parameter Label KHQ
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Acuan tarif digital print A3+, insheet waste, finishing rajang &amp; laminasi, setup desain, serta margin default label botol KHQ.
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

      {/* Grid Parameter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Print Digital POD A3+ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Printer size={16} className="text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Cetak Print Digital POD A3+
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {renderField('tarifPrintA3', 'Tarif Print A3+ (Bahan Art Paper)', 'Rp / lembar')}
            {renderField('insheetWasteLbr', 'Insheet Waste per Order', 'lembar', 1, false)}
          </div>
          <p className="text-[11px] text-slate-500 italic mt-1">
            *Ukuran 220ml (19 label/lbr), 330ml (20 label/lbr), 600ml (17 label/lbr A3+).
          </p>
        </div>

        {/* Card 2: Finishing & Potong */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Scissors size={16} className="text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Finishing Rajang &amp; Laminasi
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {renderField('tarifRajangPerPcs', 'Ongkos Rajang / Potong', 'Rp / lbr label')}
            {renderField('tarifLaminasiGlossyCm2', 'Tarif Laminasi Glossy', 'Rp / cm²', 0.01, false)}
            {renderField('minLaminasi', 'Minimum Biaya Laminasi', 'Rp / order')}
          </div>
        </div>

        {/* Card 3: Desain Artwork */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Sparkles size={16} className="text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Desain &amp; Setup Artwork
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {renderField('tarifDesain', 'Tarif Jasa Desain Label KHQ', 'Rp / order')}
          </div>
          <p className="text-[11px] text-slate-500 italic mt-1">
            *Biaya desain dibebankan per batch order cetak label botol KHQ.
          </p>
        </div>

        {/* Card 4: Margin & Nego */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <DollarSign size={16} className="text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              4. Margin &amp; Nego Standar
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {renderField('marginDefaultPct', 'Margin Profit Standar', '%', 1, false)}
            {renderField('negoDefaultPct', 'Diskon Nego Standar', '%', 1, false)}
          </div>
          <p className="text-[11px] text-slate-500 italic mt-1">
            *Harga jual dibulatkan ke atas kelipatan Rp 10 (ROUNDUP,-1).
          </p>
        </div>
      </div>

      {/* Modal Manual Excel */}
      {showManualModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="text-sm font-bold">Pemetaan Master Parameter Label KHQ ke File Excel</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <p className="font-bold text-emerald-900">
                  Sumber File: Folder <code>05. Pricelist Label KHQ/Pricelist Label KHQ JUNI 2026.xlsm</code>
                </p>
                <p className="mt-1 text-emerald-800">
                  Sub-file kalkulasi: <code>Label KHQ 220 ml 5 - 22 kardus.xlsm</code>, <code>Label KHQ 330 ml...</code>, <code>Label KHQ 600 ml...</code>
                </p>
              </div>

              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="p-2 border border-slate-200">Bagian Parameter</th>
                    <th className="p-2 border border-slate-200">Cell / Sheet Acuan</th>
                    <th className="p-2 border border-slate-200">Nilai Standar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  <tr>
                    <td className="p-2 border border-slate-200 font-sans">Tarif Print A3+</td>
                    <td className="p-2 border border-slate-200">Master!D18</td>
                    <td className="p-2 border border-slate-200">Rp 2.000 / lbr</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-200 font-sans">Insheet Waste Cetak</td>
                    <td className="p-2 border border-slate-200">Master!D13</td>
                    <td className="p-2 border border-slate-200">7 lembar</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-200 font-sans">Ongkos Rajang / Potong</td>
                    <td className="p-2 border border-slate-200">BUKU!AN6</td>
                    <td className="p-2 border border-slate-200">Rp 50 / label</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-200 font-sans">Laminasi Glossy</td>
                    <td className="p-2 border border-slate-200">BUKU!AP6 &amp; AR7</td>
                    <td className="p-2 border border-slate-200">Rp 0.35/cm² (min Rp 50k)</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-200 font-sans">Tarif Desain</td>
                    <td className="p-2 border border-slate-200">Master!D17</td>
                    <td className="p-2 border border-slate-200">Rp 30.000</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-200 font-sans">Margin Profit</td>
                    <td className="p-2 border border-slate-200">Pricelist Label!F8</td>
                    <td className="p-2 border border-slate-200">30% (Roundup -1)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
