'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Printer,
  Layers,
  Scissors,
} from 'lucide-react';
import {
  DEFAULT_LEBEL_KARTU_OBAT_PARAMS,
  LebelKartuObatMasterParams,
} from '@/lib/lebel-kartu-obat-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface LebelKartuObatMasterParameterProps {
  customParams: LebelKartuObatMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<LebelKartuObatMasterParams>>;
}

const LEBEL_KARTU_OBAT_VISIBLE_KEYS: (keyof LebelKartuObatMasterParams)[] = [
  'tarifKertasKg',
  'tarifDesain',
  'tarifPlatePerPlat',
  'tarifSisirPer500',
  'marginDefaultPct',
  'negoDefaultPct',
];

export default function LebelKartuObatMasterParameter({
  customParams,
  setCustomParams,
}: LebelKartuObatMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof LebelKartuObatMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof LebelKartuObatMasterParams) =>
    customParams[key] !== DEFAULT_LEBEL_KARTU_OBAT_PARAMS[key];

  const handleResetField = (key: keyof LebelKartuObatMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_LEBEL_KARTU_OBAT_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_LEBEL_KARTU_OBAT_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => LEBEL_KARTU_OBAT_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_LEBEL_KARTU_OBAT_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      LEBEL_KARTU_OBAT_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_LEBEL_KARTU_OBAT_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Lebel Kartu Obat dikembalikan ke standar master.');
  };

  const fieldRow = (
    key: keyof LebelKartuObatMasterParams,
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
                Master Parameter Lebel Kartu Obat
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan Lebel Kartu Obat 3,5×7 / 4×6 / 5×6,7 cm HVS 70 gsm 1 Warna 1 Muka, Rajang + Packing.
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
        {/* Card 1: Kertas & Desain */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">1. Kertas &amp; Desain</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifKertasKg', 'Kertas HVS 70 / kg (Rp)')}
            {fieldRow('tarifDesain', 'Desain / Order (Rp)')}
            {fieldRow('tarifPlatePerPlat', 'Plate / Plat (Rp)')}
            {fieldRow('tarifCetakMinPerPlat', 'Min Cetak / Plat (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            HVS 70 gsm Folio 21,5×33 cm Rp 15.700/kg +5% → Rp 40.936/rim (500 lbr), insheet 30 lbr, plat Rp 10.000, min cetak Rp 15.000/plat, drek Rp 30, desain Rp 10.000.
          </p>
        </div>

        {/* Card 2: Finishing Sisir */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Scissors className="w-4 h-4 text-violet-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Finishing Rajang &amp; Sisir</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifSisirPer500', 'Sisir /500 lbr (Rp)')}
            {fieldRow('tarifDrek', 'Drek Over / lbr (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Sisir/Rajang (Q/500)×10.000 (10600@1 rim 530 lbr), drek over 30×(P-500) per plat, plate 1 plat untuk 1 Warna 1 Muka.
          </p>
        </div>

        {/* Card 3: Margin & Nego Standar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Margin &amp; Nego Standar</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md">
            {fieldRow('marginDefaultPct', 'Margin Default (%)', false)}
            {fieldRow('negoDefaultPct', 'Nego Default (%)', false)}
          </div>
          <p className="text-[10px] text-slate-500">
            Margin 30% &amp; nego 4% sesuai HARGA JULI 2026 (N=ROUNDUP(M*130%,-2), O=ROUNDUP(N*96%,-2)). Harga per rim dibulatkan ke kelipatan Rp 100.
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Lebel Kartu Obat (16. Pricelist Lebel Kartu Obat)
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
                  Pemetaan Master Parameter ke File Excel (Folder 16. Pricelist Lebel Kartu Obat/*.xlsm)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan Kertas &amp; Ukuran</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>HVS 70 gsm</strong>: <span className="font-mono text-emerald-700">Master!D13</span> Rp 15.700/kg + up 5% → <span className="font-mono text-emerald-700">BUKU!U28</span> Rp 40.936/rim (500 lbr Folio 21,5×33 cm).</li>
                      <li>• <strong>Varian</strong>: 3,5×7 / 4×6 / 5×6,7 cm — 1 Warna 1 Muka, 1 plano/potong, semua HVS 70 sama kertas.</li>
                      <li>• <strong>Kebutuhan Plano</strong>: <span className="font-mono text-emerald-700">BUKU!Q7</span> =H×500+insheet (30), P=Q, H=oplah rim.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Cetak 1 Warna 1 Muka</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Plate</strong>: 1 plat × Rp 10.000 (W6). Min Order Rp 15.000/plat (Z6).</li>
                      <li>• <strong>Drek Over</strong>: Rp 30 × (P-500) × plat (AA7*X7). AB=X×Z, AD=AC×AA×X, AE=AB+AD.</li>
                      <li>• <strong>Desain</strong>: Rp 10.000 (T6) per order.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>3. Finishing Sisir / Rajang</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Sisir</strong>: <span className="font-mono text-violet-700">BUKU!AJ7</span> (Q/500)×10.000 (10600@530 lbr, 20600@1030 lbr).</li>
                      <li>• <strong>Finishing</strong>: Rajang + Packing (tidak ada laminasi / pound tambahan).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>4. Margin &amp; Pembulatan</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Margin</strong>: 30% dari HPP per rim, nego 4% dari harga jual (N=ROUNDUP(M*130%,-2), O=ROUNDUP(N*96%,-2)).</li>
                      <li>• Harga per rim = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">ceil(HPP/rim ×1.30 /100)*100</code> (ratusan).</li>
                      <li>• Tier: 1–10 rim (HARGA JULI 2026), 1 rim = 500 lbr, HPP total = SUM(R+T+W+AE+AJ).</li>
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
