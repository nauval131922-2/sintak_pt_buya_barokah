'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
} from 'lucide-react';
import {
  DEFAULT_BROSUR_PARAMS,
  BrosurMasterParams,
} from '@/lib/brosur-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface BrosurMasterParameterProps {
  customParams: BrosurMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<BrosurMasterParams>>;
}

export default function BrosurMasterParameter({
  customParams,
  setCustomParams,
}: BrosurMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof BrosurMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof BrosurMasterParams) =>
    customParams[key] !== DEFAULT_BROSUR_PARAMS[key];

  const handleResetField = (key: keyof BrosurMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_BROSUR_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_BROSUR_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => JSON.stringify(customParams) !== JSON.stringify(DEFAULT_BROSUR_PARAMS),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams(DEFAULT_BROSUR_PARAMS);
    toast.success('Semua parameter Brosur 2026 dikembalikan ke standar master.');
  };

  const fieldRow = (
    key: keyof BrosurMasterParams,
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
                Master Parameter Brosur 2026
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan kertas Art Paper 120gsm, ongkos cetak Print Inter &amp; Oliver, finishing sisir, laminasi, packing, dan desain brosur.
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
        {/* Card 1: Bahan Kertas Art Paper */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Bahan Kertas Art Paper
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Bahan Baku</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {fieldRow('tarifArtPaperKg', 'Art Paper 120gsm (Rp/Kg)')}
            {fieldRow('upKertasPct', 'Persentase Up Kertas (%)', false)}
          </div>
        </div>

        {/* Card 2: Cetak Print Inter & Oliver */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Mesin Cetak
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Print Inter &amp; Oliver</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {fieldRow('tarifPrintInter1Muka', 'Print Inter 1 Muka (Rp/lbr A3+)')}
            {fieldRow('tarifPrintInter2Muka', 'Print Inter 2 Muka (Rp/lbr A3+)')}
            {fieldRow('tarifPlatOliver', 'Plat CTP Oliver (Rp/plat)')}
            {fieldRow('jumlahPlatOliver', 'Jumlah Plat Oliver (pcs)', false)}
            {fieldRow('minOrderOliver', 'Min Order Oliver (Rp/plat)')}
            {fieldRow('tarifDrekOliver', 'Tarif Drek Oliver (Rp/drek)', false)}
          </div>
        </div>

        {/* Card 3: Finishing, Laminasi & Margin */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Finishing, Laminasi &amp; Margin
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Akhir</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {fieldRow('tarifSisirMin', 'Sisir/Potong Min (Rp)')}
            {fieldRow('tarifSisirPer1000', 'Sisir per 1000 pcs (Rp)')}
            {fieldRow('tarifKardus', 'Kardus Packing (Rp/box)')}
            {fieldRow('tarifLakbanRoll', 'Lakban (Rp/roll)')}
            {fieldRow('tarifLaminasiGlossy', 'Laminasi Glossy (Rp/cm²)', false, true)}
            {fieldRow('tarifLaminasiDoff', 'Laminasi Doff (Rp/cm²)', false, true)}
            {fieldRow('tarifUvVarnish', 'UV Varnish (Rp/cm²)', false, true)}
            {fieldRow('tarifDesainBrosur', 'Biaya Desain Brosur (Rp)')}
            {fieldRow('marginDefaultPct', 'Margin Default (%)', false)}
            {fieldRow('negoDefaultPct', 'Nego Default (%)', false)}
          </div>
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Brosur 2026
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
                  Pemetaan 4 Bagian Master Parameter ke File Excel (Folder 04. Pricelist Brosur 2026/*.xlsm)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan Kertas Art Paper 120gsm</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga Art Paper/kg</strong>: <span className="font-mono text-emerald-700">Master!D12</span> (Rp 16.900/kg). Formula berat plano 65×90: <code className="text-[10px] bg-white px-1 py-0.5 rounded border">120 × 0.65 × 0.90 / 1000 = 0.0702 kg</code>.</li>
                      <li>• <strong>Up Kertas</strong>: <span className="font-mono text-emerald-700">Master!E12</span> default 5%. Insheet per ukuran (Print Inter): <span className="font-mono text-emerald-700">BUKU!H6</span> (5 lembar per A3+).</li>
                      <li>• Plano Oliver 79×109 cm: berat 0.103284 kg/plano. Plano 65×90 cm: 0.0702 kg/plano.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Mesin Cetak Print Inter &amp; Oliver</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Print Inter 1 Muka</strong>: <span className="font-mono text-blue-700">Master!D18</span> = Rp 1.800/lbr A3+ (digital inkjet).</li>
                      <li>• <strong>Print Inter 2 Muka</strong>: <span className="font-mono text-blue-700">Master!D18 (col 8)</span> = Rp 3.300/lbr A3+.</li>
                      <li>• <strong>Plat CTP Oliver</strong>: <span className="font-mono text-blue-700">BUKU!Z6</span> = Rp 45.000/plat, jumlah plat <span className="font-mono text-blue-700">BUKU!Z2</span> = 4.</li>
                      <li>• <strong>Min Order Oliver</strong>: <span className="font-mono text-blue-700">BUKU!AB6</span> = Rp 90.000/plat. Drek over: <span className="font-mono text-blue-700">BUKU!AC6</span> = Rp 40/drek.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Finishing, Laminasi &amp; Packing</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Sisir/Potong min</strong>: <span className="font-mono text-amber-700">BUKU!AM6</span> = Rp 10.000 (≤500 pcs). &gt;500: Rp 10.000/1000 pcs.</li>
                      <li>• <strong>Kardus packing</strong>: <span className="font-mono text-amber-700">BUKU!AW6</span> = Rp 8.500/box.</li>
                      <li>• <strong>Lakban roll</strong>: <span className="font-mono text-amber-700">Master!D21</span> = Rp 8.000/roll.</li>
                      <li>• <strong>Laminasi</strong>: Glossy Rp 0.35/cm², Doff Rp 0.40/cm², UV Varnish Rp 0.12/cm² (×2 untuk 2 Muka).</li>
                      <li>• <strong>Desain brosur</strong>: <span className="font-mono text-amber-700">Master!D17</span> = Rp 20.000/artwork.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Margin &amp; Nego Default</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Target Margin Standar</strong>: 30% dari HPP (dapat diubah per simulasi).</li>
                      <li>• <strong>Batas Nego Diskon</strong>: 4% dari harga jual standar.</li>
                      <li>• Harga jual = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">ceil(HPP/pcs × (1 + margin%))</code>.</li>
                      <li>• Harga nego = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">ceil(hargaJual × (1 − nego%))</code>.</li>
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
