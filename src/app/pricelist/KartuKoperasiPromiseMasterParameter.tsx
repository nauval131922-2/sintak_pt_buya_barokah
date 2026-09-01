'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Printer,
  Layers,
  CreditCard,
} from 'lucide-react';
import {
  DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS,
  KartuKoperasiPromiseMasterParams,
} from '@/lib/kartu-koperasi-promise-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface KartuKoperasiPromiseMasterParameterProps {
  customParams: KartuKoperasiPromiseMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<KartuKoperasiPromiseMasterParams>>;
}

const KARTU_KOPERASI_PROMISE_VISIBLE_KEYS: (keyof KartuKoperasiPromiseMasterParams)[] = [
  'tarifKertasKg',
  'tarifDesign',
  'tarifPlatePerPlat',
  'tarifPoundPerUnit',
  'tarifSisirPer500',
  'tarifPisauPerCm2',
  'tarifCetakMinPerPlat',
  'marginDefaultPct',
  'negoDefaultPct',
];

export default function KartuKoperasiPromiseMasterParameter({
  customParams,
  setCustomParams,
}: KartuKoperasiPromiseMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof KartuKoperasiPromiseMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof KartuKoperasiPromiseMasterParams) =>
    customParams[key] !== DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[key];

  const handleResetField = (key: keyof KartuKoperasiPromiseMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => KARTU_KOPERASI_PROMISE_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      KARTU_KOPERASI_PROMISE_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Kartu Koperasi Promise dikembalikan ke standar master.');
  };

  const fieldRow = (
    key: keyof KartuKoperasiPromiseMasterParams,
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
                Master Parameter Kartu Koperasi Promise
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan Kartu Koperasi Promise 10,5×16,5 / 10,5×21,5 / 12,7×16,3 cm BC 160 gsm 2 Muka 1 Warna, Pound + Sisir + Packing.
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
            {fieldRow('tarifKertasKg', 'Kertas BC 160 / kg (Rp)')}
            {fieldRow('tarifDesign', 'Desain / Order (Rp)')}
            {fieldRow('tarifPlatePerPlat', 'Plate / Plat (Rp)')}
            {fieldRow('tarifCetakMinPerPlat', 'Min Cetak / Plat (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            BC 160 gsm Rp 34.800/kg +5% (12,7×16,3 Rp 33.000), insheet 40 lbr, plat Rp 10.000, min cetak Rp 15.000/plat, drek Rp 40, desain Rp 15.000 (12,7 tanpa desain).
          </p>
        </div>

        {/* Card 2: Finishing Pound & Sisir */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <CreditCard className="w-4 h-4 text-violet-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Finishing Pound &amp; Sisir</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifPoundPerUnit', 'Pound / Unit (Rp)')}
            {fieldRow('tarifSisirPer500', 'Sisir /500 unit (Rp)')}
            {fieldRow('tarifPisauPerCm2', 'Pisau / cm² (Rp)', true, true)}
          </div>
          <p className="text-[10px] text-slate-500">
            Pisau 149.8×luas (677cm²=101k / 443cm²=66k), pound (UMR/25)/800=140,93 min 50k, sisir 10k/500 unit (2,5k@500 pcs 4/plano).
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
            Margin 30% &amp; nego 4% sesuai HARGA JULI 2026 (N=ROUNDUP(M*130%,-1), O=ROUNDUP(N*96%,-1)). HPP dibulatkan ke kelipatan Rp 10.
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Kartu Koperasi Promise (15. Pricelist kartu Koperasi Promise)
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
                  Pemetaan Master Parameter ke File Excel (Folder 15. Pricelist kartu Koperasi Promise/*.xlsm)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan Kertas &amp; Ukuran</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>BC 160 gsm</strong>: <span className="font-mono text-emerald-700">Master!D11</span> Rp 34.800/kg (10,5) / 33.000 (12,7) + up 5%, insheet 40 lbr, 4/3/22 kartu/plano.</li>
                      <li>• <strong>Varian</strong>: 10,5×16,5 (4/plano), 10,5×21,5 (3/plano), 12,7×16,3 (22/plano, 11 potong) — BC 160 2 Muka 1 Warna.</li>
                      <li>• <strong>Kertas Plano</strong>: <span className="font-mono text-emerald-700">BUKU!Q7</span> =ROUNDUP(H/O+K/N,0), S=Q*414.8 (10,5) / 2769 (12,7) per plano.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Cetak Ryobi</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Plate</strong>: 2 plat (10,5) /1 plat (12,7) × Rp 10.000 (X6*Y).</li>
                      <li>• <strong>Min Order</strong>: <span className="font-mono text-blue-700">BUKU!AC7</span> Rp 15.000×Jml plat, over drek Rp 40 (10,5) /30 (12,7) ×(P-500).</li>
                      <li>• <strong>P</strong>: Q×N (10,5) / Q×N×2 (12,7). Over =MAX(0,P-500).</li>
                      <li>• <strong>Desain</strong>: Rp 15.000 (10,5) / 0 (12,7).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>3. Finishing Pound &amp; Sisir</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Pisau Pound</strong>: <span className="font-mono text-violet-700">AL6*AL30*AM30</span> 149.8×luas (677=101.452 / 443=66.466).</li>
                      <li>• <strong>Pound</strong>: <span className="font-mono text-violet-700">BUKU!AM7</span> MAX(50k, effective×140,93). effective=H×N/O.</li>
                      <li>• <strong>Sisir</strong>: <span className="font-mono text-violet-700">BUKU!AN7</span> effective/500×10.000 (2,5k@500 4/plano).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>4. Packing &amp; Margin</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Kardus</strong>: CEIL(H/3000)×8.500 + Lakban (H/3000)/39.03×8.000.</li>
                      <li>• <strong>Margin</strong>: 30% dari HPP, nego 4% dari harga jual (N=ROUNDUP(M*130%,-1), O=ROUNDUP(N*96%,-1)).</li>
                      <li>• Harga jual = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">ceil(HPP/pcs ×1.30 /10)*10</code>.</li>
                      <li>• Tier: 500–10.000 (15 tier HARGA JULI 2026), di simulator 100–5.000.</li>
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
