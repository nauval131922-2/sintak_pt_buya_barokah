'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
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
}

const LABEL_KHQ_VISIBLE_KEYS: (keyof LabelKhqMasterParams)[] = [
  'tarifRajangPerPcs',
  'tarifDesain',
  'marginDefaultPct',
  'negoDefaultPct',
];

export default function LabelKhqMasterParameter({
  customParams = DEFAULT_LABEL_KHQ_PARAMS,
  setCustomParams,
}: LabelKhqMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof LabelKhqMasterParams, val: number) => {
    if (!setCustomParams) return;
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof LabelKhqMasterParams) =>
    customParams[key] !== DEFAULT_LABEL_KHQ_PARAMS[key];

  const handleResetField = (key: keyof LabelKhqMasterParams) => {
    if (!setCustomParams) return;
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_LABEL_KHQ_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_LABEL_KHQ_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => LABEL_KHQ_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_LABEL_KHQ_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    if (!setCustomParams) return;
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      LABEL_KHQ_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_LABEL_KHQ_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Label KHQ dikembalikan ke standar master.');
  };

  const fieldRow = (
    key: keyof LabelKhqMasterParams,
    label: string,
    isRupiah = true,
    isDecimal = false
  ) => (
    <div
      className={`p-2.5 rounded-lg border transition-all ${
        isFieldModified(key)
          ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <label className="block text-[11px] font-bold text-slate-700">{label}</label>
        {isFieldModified(key) && (
          <button
            onClick={() => handleResetField(key)}
            className="text-[9px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={9} /> Reset
          </button>
        )}
      </div>
      {isRupiah && !isDecimal ? (
        <ThousandInput
          prefix="Rp"
          value={customParams[key] as number}
          onValueChange={(v) => handleChange(key, v || 0)}
          className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />
      ) : (
        <input
          type="number"
          step={isDecimal ? 0.01 : 1}
          value={customParams[key] as number}
          onChange={(e) => handleChange(key, Number(e.target.value) || 0)}
          className="w-full px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
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
              Tarif acuan finishing rajang &amp; desain, laminasi, packing, dan margin label botol KHQ (print A3+ &amp; bahan via Master Global).
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Finishing & Desain */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Finishing &amp; Desain Label
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Spesifik Produk</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fieldRow('tarifRajangPerPcs', 'Rajang/Potong per lbr (Rp)')}
            {fieldRow('tarifDesain', 'Biaya Desain Label (Rp)')}
          </div>
          <p className="px-4 pb-3 text-[11px] text-slate-500 italic">
            *Finishing via Master Global: print A3+ (Rp 2.000/lbr), laminasi glossy 0,35/cm² (min 50k), insheet 7 lbr.
          </p>
        </div>

        {/* Card 2: Margin & Nego Default */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Margin &amp; Nego Standar
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Keuangan</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fieldRow('marginDefaultPct', 'Margin Default (%)', false)}
            {fieldRow('negoDefaultPct', 'Nego Default (%)', false)}
          </div>
          <p className="px-4 pb-3 text-[11px] text-slate-500 italic">
            *Harga jual = ceil(HPP/lbr × (1+margin%)), nego = ceil(jual × (1−nego%)) kelipatan Rp 10.
          </p>
        </div>
      </div>

      {showManualModal && (
        <div
          onClick={() => setShowManualModal(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Manual Pengguna &amp; Pemetaan Sumber Excel</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Label KHQ
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

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Pemetaan Master Parameter ke File Excel (Folder 05. Pricelist Label KHQ/*.xlsm)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan &amp; Cetak Print A3+ (via Master Global)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Tarif Print A3+</strong>: <span className="font-mono text-emerald-700">Master!D18</span> = Rp 2.000/lbr A3+.</li>
                      <li>• <strong>Insheet Waste</strong>: <span className="font-mono text-emerald-700">Master!D13</span> = 7 lembar/order.</li>
                      <li>• Kapasitas: 220ml 19 pcs/A3+, 330ml 20 pcs/A3+, 600ml 17 pcs/A3+.</li>
                      <li>• Kebutuhan A3+ = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">ceil(lbr / pcsPerA3) + 7</code>.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Finishing, Laminasi &amp; Desain</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Rajang/Potong</strong>: <span className="font-mono text-blue-700">BUKU!AN6</span> = Rp 50/lembar label.</li>
                      <li>• <strong>Laminasi Glossy</strong>: <span className="font-mono text-blue-700">BUKU!AP6</span> = Rp 0,35/cm² (min <span className="font-mono text-blue-700">AQ27</span> Rp 50.000).</li>
                      <li>• <strong>Desain</strong>: <span className="font-mono text-blue-700">Master!D17</span> = Rp 30.000/order.</li>
                      <li>• Finishing rajang &amp; laminasi via POD A3+ (33,5×49 cm ≈ 1.641 cm²).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Kemasan (Standar Dus)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• 1 Dus = 24 lembar label (standar KHQ 220/330/600 ml).</li>
                      <li>• Tidak ada biaya kardus/lakban tambahan di Label KHQ (inklusif).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Margin &amp; Nego Default</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Margin Standar</strong>: 30% dari HPP (Pricelist Label!F8).</li>
                      <li>• <strong>Nego</strong>: 4% dari harga jual. Harga dibulatkan ke kelipatan Rp 10 (<code className="text-[10px] bg-white px-1 py-0.5 rounded border">ROUNDUP,-1</code>).</li>
                      <li>• HPP/lbr = Total HPP / total lembar label.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

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
