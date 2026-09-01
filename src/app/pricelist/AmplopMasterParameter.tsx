'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Printer,
  Layers,
} from 'lucide-react';
import {
  DEFAULT_AMPLOP_PARAMS,
  AmplopMasterParams,
} from '@/lib/amplop-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface AmplopMasterParameterProps {
  customParams: AmplopMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<AmplopMasterParams>>;
}

const AMPLOP_VISIBLE_KEYS: (keyof AmplopMasterParams)[] = [
  'tarifDesign',
  'tarifRyobi',
  'tarifLipatLemPerPcs',
  'marginDefaultPct',
  'negoDefaultPct',
];

export default function AmplopMasterParameter({
  customParams,
  setCustomParams,
}: AmplopMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof AmplopMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof AmplopMasterParams) =>
    customParams[key] !== DEFAULT_AMPLOP_PARAMS[key];

  const handleResetField = (key: keyof AmplopMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_AMPLOP_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_AMPLOP_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => AMPLOP_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_AMPLOP_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      AMPLOP_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_AMPLOP_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Amplop dikembalikan ke standar master.');
  };

  const fieldRow = (
    key: keyof AmplopMasterParams,
    label: string,
    isRupiah = true,
    isDecimal = false
  ) => (
    <div
      className={`p-2.5 rounded-lg border transition-all ${
        isFieldModified(key)
          ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <label className="text-xs font-semibold text-slate-700 truncate" title={label}>
          {label}
        </label>
        {isFieldModified(key) && (
          <button
            type="button"
            onClick={() => handleResetField(key)}
            className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
            title="Reset ke default"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Def
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {isRupiah && !isDecimal ? (
          <ThousandInput
            value={customParams[key] as number}
            onValueChange={(v) => handleChange(key, v || 0)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
            prefix="Rp"
            allowDecimals={isDecimal}
          />
        ) : (
          <input
            type="number"
            step={isDecimal ? 0.01 : 1}
            value={customParams[key] as number}
            onChange={(e) => handleChange(key, Number(e.target.value) || 0)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
          />
        )}
      </div>
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
                Master Parameter Amplop
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan Amplop HVS 80 gsm — 3 ukuran (Kecil 11×22 / Sedang 16×23 / Besar 24×35 cm), cetak 1 Warna Ryobi/Oliver, lipat & lem + packing.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Desain & Finishing */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">1. Desain &amp; Finishing Amplop</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifDesign', 'Desain Artwork / Order (Rp)')}
            {fieldRow('tarifRyobi', 'Cetak Ryobi 1 Warna / lbr (Rp)')}
            {fieldRow('tarifLipatLemPerPcs', 'Lipat & Lem / pcs (Rp)')}
            {fieldRow('tarifKardusBox', 'Kardus Packing / Order (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Cetak 1 Warna Ryobi Rp 1.900/warna/lbr (≤500 pcs) → Oliver ＞500 pcs plat Rp 45.000 + min Rp 90.000 + drek Rp 40. Lipat & lem amplop Rp 75/pcs.
          </p>
        </div>

        {/* Card 2: Margin & Nego Standar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Margin &amp; Nego Standar</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('marginDefaultPct', 'Margin Default (%)', false)}
            {fieldRow('negoDefaultPct', 'Nego Default (%)', false)}
          </div>
          <p className="text-[10px] text-slate-500">
            Margin 30% &amp; nego 4% sesuai HARGA JULI 2026. HPP dihitung per pcs dengan pembulatan ke kelipatan Rp 10 (Kecil 4/A3+ · Sedang 2/A3+ · Besar 1/A3+).
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Amplop (11. Pricelist Amplop)
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
                  Pemetaan Master Parameter ke File Excel (Folder 11. Pricelist Amplop/*.xlsx)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan Kertas &amp; Ukuran</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>HVS 80 gsm</strong>: <span className="font-mono text-emerald-700">HARGA JULI 2026</span> HVS 80 gsm 0,0127 kg/A3+; up kertas 5%, insheet 5 lbr.</li>
                      <li>• <strong>Ukuran</strong>: <span className="font-mono text-emerald-700">Kecil 11×22 cm (DL) 4/A3+ · Sedang 16×23 cm 2/A3+ · Besar 24×35 cm 1/A3+</span> pada A3+ 33×48.</li>
                      <li>• <strong>Varian</strong>: Kecil / Sedang / Besar — semua HVS 80 gsm 1 Muka 1 Warna (heuristik fallback jika Excel 1 ukuran saja).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Cetak</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>1W Ryobi</strong>: ≤500 pcs Rp 1.900/warna/lbr; <strong>Oliver 1W</strong>: ＞500 pcs plat Rp 45.000 + min Rp 90.000 + drek Rp 40.</li>
                      <li>• <strong>Desain</strong>: Rp 20.000/order.</li>
                      <li>• Amplop umumnya 1 warna hitam; Full Colour opsional via Print Inter Rp 2.500/A3+ jika dibutuhkan.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Finishing &amp; Packing</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Lipat &amp; Lem</strong>: Rp 75/pcs (lipat samping + lem perekat amplop).</li>
                      <li>• <strong>Packing</strong>: Kardus Rp 8.500 + Lakban Rp 8.000 per order.</li>
                      <li>• Tanpa laminasi / foil — kertas HVS polos.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Margin &amp; Nego</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Margin</strong>: 30% dari HPP, nego 4% dari harga jual.</li>
                      <li>• Harga jual = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">ceil(HPP/pcs ×1.30 /10)*10</code>.</li>
                      <li>• Tier global: 50–10000 pcs (union semua ukuran amplop).</li>
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
