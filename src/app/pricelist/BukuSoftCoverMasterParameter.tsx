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
  BookCopy,
} from 'lucide-react';
import {
  DEFAULT_BUKU_SOFT_COVER_PARAMS,
  BukuSoftCoverMasterParams,
} from '@/lib/buku-soft-cover-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface BukuSoftCoverMasterParameterProps {
  customParams: BukuSoftCoverMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<BukuSoftCoverMasterParams>>;
}

const BSC_VISIBLE_KEYS: (keyof BukuSoftCoverMasterParams)[] = [
  'tarifPrintCoverA3',
  'tarifDesainCover',
  'tarifKertasHvs70Kg',
  'upKertasIsiPct',
  'tarifDesainIsiPerHlm',
  'tarifOliverPlatUnit',
  'tarifOliverMinIsi',
  'tarifLaminasiGlossyCm2',
  'tarifLaminasiDoffCm2',
  'tarifUvVarnishCm2',
  'minLaminasi',
  'tarifSisirPerPcs',
  'umr',
  'tarifKardusBox',
  'tarifLakbanRoll',
  'marginDefaultPct',
  'negoDefaultPct',
];

export default function BukuSoftCoverMasterParameter({
  customParams,
  setCustomParams,
}: BukuSoftCoverMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof BukuSoftCoverMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof BukuSoftCoverMasterParams) =>
    customParams[key] !== DEFAULT_BUKU_SOFT_COVER_PARAMS[key];

  const handleResetField = (key: keyof BukuSoftCoverMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_BUKU_SOFT_COVER_PARAMS[key] }));
  };

  const isModified = React.useMemo(
    () => BSC_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_BUKU_SOFT_COVER_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams(DEFAULT_BUKU_SOFT_COVER_PARAMS);
    toast.success('Semua parameter Buku Soft Cover dikembalikan ke nilai default.');
  };

  const fieldRow = (
    key: keyof BukuSoftCoverMasterParams,
    label: string,
    isRupiah = true,
    isDecimal = false
  ) => (
    <div
      key={key}
      className={`flex items-center justify-between gap-3 py-2 px-3 rounded-lg transition-colors ${
        isFieldModified(key) ? 'bg-amber-50 border border-amber-200' : 'hover:bg-slate-50'
      }`}
    >
      <label className="text-xs font-medium text-slate-700 flex-1 min-w-0">{label}</label>
      <div className="flex items-center gap-1.5 shrink-0">
        {isDecimal ? (
          <input
            type="number"
            step="0.01"
            min={0}
            value={customParams[key] as number}
            onChange={(e) => handleChange(key, parseFloat(e.target.value) || 0)}
            className="w-24 px-2 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right"
          />
        ) : (
          <ThousandInput
            prefix={isRupiah ? 'Rp' : ''}
            value={customParams[key] as number}
            onValueChange={(v) => handleChange(key, v || 0)}
            className="w-32 px-2 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right"
          />
        )}
        {isFieldModified(key) && (
          <button
            type="button"
            onClick={() => handleResetField(key)}
            title="Reset ke default"
            className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-md transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
      {/* Header */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <BookCopy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-emerald-950">
              Master Parameter Buku Soft Cover
              <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Katalog 17
              </span>
            </h3>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif produksi Buku Soft Cover A4 (21×29,7) & A5 (14,8×21) — 32 hal, cover AC 230 (Print Inter), isi HVS 70 gsm (Oliver offset).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all shadow-2xs cursor-pointer"
          >
            <BookOpen size={14} />
            <span>Panduan</span>
          </button>
          {isModified && (
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-2xs cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset Semua</span>
            </button>
          )}
        </div>
      </div>

      {isModified && (
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
          <Database size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Ada parameter yang dimodifikasi</strong> dari nilai default. Baris berwarna oranye menunjukkan perubahan aktif.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cover */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer size={15} className="text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tarif Cover (Art Carton 230 — Print Inter A3+)</h4>
          </div>
          {fieldRow('tarifPrintCoverA3', 'Tarif Print Cover A3+ All-In (Rp/lbr)', true)}
          {fieldRow('tarifDesainCover', 'Tarif Desain Cover (Rp/order)', true)}
        </div>

        {/* Isi Oliver */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers size={15} className="text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tarif Isi (HVS 70 gsm — Oliver Offset)</h4>
          </div>
          {fieldRow('tarifKertasHvs70Kg', 'Harga Kertas HVS 70 gsm (Rp/kg)', true)}
          {fieldRow('upKertasIsiPct', 'Mark-up Kertas Isi (%)', false)}
          {fieldRow('tarifDesainIsiPerHlm', 'Tarif Desain Isi (Rp/halaman)', true)}
          {fieldRow('tarifOliverPlatUnit', 'Tarif Plate CTP Oliver (Rp/plat)', true)}
          {fieldRow('tarifOliverMinIsi', 'Minimum Ongkos Oliver (Rp/order)', true)}
        </div>

        {/* Laminasi */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers size={15} className="text-blue-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tarif Laminasi Cover</h4>
          </div>
          {fieldRow('tarifLaminasiGlossyCm2', 'Laminasi Glossy (Rp/cm²)', false, true)}
          {fieldRow('tarifLaminasiDoffCm2', 'Laminasi Doff (Rp/cm²)', false, true)}
          {fieldRow('tarifUvVarnishCm2', 'UV Varnish (Rp/cm²)', false, true)}
          {fieldRow('minLaminasi', 'Minimum Laminasi (Rp/order)', true)}
        </div>

        {/* Finishing & Jasa */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Scissors size={15} className="text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Jasa Finishing & Operasional</h4>
          </div>
          {fieldRow('tarifSisirPerPcs', 'Tarif Sisir Binding (Rp/pcs)', true)}
          {fieldRow('umr', 'UMR Kabupaten (Rp/bulan)', true)}
          {fieldRow('tarifKardusBox', 'Tarif Kardus Box (Rp/box)', true)}
          {fieldRow('tarifLakbanRoll', 'Tarif Lakban Roll (Rp/roll)', true)}
        </div>

        {/* Margin */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Database size={15} className="text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Margin & Nego Default</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md">
            {fieldRow('marginDefaultPct', 'Margin Profit Default (%)', false)}
            {fieldRow('negoDefaultPct', 'Batas Nego Default (%)', false)}
          </div>
        </div>
      </div>

      {/* Manual Modal */}
      {showManualModal && (
        <div
          onClick={() => setShowManualModal(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700">
                  <BookCopy className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Panduan Master Parameter Buku Soft Cover</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">Katalog 17 · Referensi tarif Juli 2026</p>
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
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Parameter & Nilai Default</h4>
                <ul className="space-y-1.5">
                  {[
                    ['Print Cover A3+ All-In', 'Rp 2.700/lbr — termasuk bahan AC 230 gsm + cetak FC'],
                    ['Desain Cover', 'Rp 20.000/order'],
                    ['HVS 70 gsm', 'Rp 15.700/kg · berat plano 65×100 = 0,04549 kg'],
                    ['Mark-up Kertas Isi', '3% (margin/ppn kertas)'],
                    ['Desain Isi', 'Rp 15.000/halaman (32 hal = Rp 480.000)'],
                    ['Plate Oliver', 'Rp 45.000/plat CTP (1 plat per order)'],
                    ['Min Ongkos Oliver', 'Rp 90.000'],
                    ['Laminasi Glossy', 'Rp 0,35/cm² · min Rp 50.000'],
                    ['Laminasi Doff', 'Rp 0,40/cm²'],
                    ['UV Varnish', 'Rp 0,11/cm²'],
                    ['Sisir Binding', 'Rp 150/pcs'],
                    ['UMR', 'Rp 2.818.585 (jasa susun = UMR/20.000 per pcs)'],
                    ['Margin Default', '25% · Nego 4%'],
                  ].map(([k, v]) => (
                    <li key={k} className="flex gap-2">
                      <span className="font-semibold text-emerald-800 shrink-0 w-40">{k}:</span>
                      <span className="text-slate-600">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[11.5px] text-amber-900">
                <strong>Catatan:</strong> Staples tidak di sini — dihitung internal 9/pcs (dari pack 3.000 per 369 pcs, diverifikasi dari Excel). Parameter laminasi area per pcs sudah hardcoded: 21×29,7 cm = 1.320 cm² (22×30 cm), 14,8×21 cm = 660 cm² (15×22 cm).
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all cursor-pointer"
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
