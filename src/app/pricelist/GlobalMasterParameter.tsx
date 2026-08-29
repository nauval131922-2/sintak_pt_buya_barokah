// ponytail: komponen master parameter tarif global (berlaku lintas seluruh produk)

'use client';

import React, { useState } from 'react';
import {
  Database,
  Printer,
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
  Box,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  GlobalMasterParams,
  DEFAULT_GLOBAL_PARAMS,
} from '@/lib/global-master-params';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface GlobalMasterParameterProps {
  globalParams: GlobalMasterParams;
  setGlobalParams: React.Dispatch<React.SetStateAction<GlobalMasterParams>>;
  onApplyToAllProducts: (paramsToApply?: GlobalMasterParams) => void;
}

export default function GlobalMasterParameter({
  globalParams,
  setGlobalParams,
  onApplyToAllProducts,
}: GlobalMasterParameterProps) {
  const [showAppliedToast, setShowAppliedToast] = useState(false);

  const handleChange = (key: keyof GlobalMasterParams, val: number) => {
    setGlobalParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof GlobalMasterParams) =>
    globalParams[key] !== DEFAULT_GLOBAL_PARAMS[key];

  const handleResetField = (key: keyof GlobalMasterParams) => {
    setGlobalParams((prev) => ({ ...prev, [key]: DEFAULT_GLOBAL_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar global (${DEFAULT_GLOBAL_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => JSON.stringify(globalParams) !== JSON.stringify(DEFAULT_GLOBAL_PARAMS),
    [globalParams]
  );

  const handleResetAll = () => {
    setGlobalParams(DEFAULT_GLOBAL_PARAMS);
    toast.success('Semua Master Parameter Global dikembalikan ke standar.');
  };

  const handleApply = () => {
    onApplyToAllProducts(globalParams);
    setShowAppliedToast(true);
    setTimeout(() => setShowAppliedToast(false), 3000);
    toast.success('Berhasil sinkronkan parameter global ke SEMUA jenis produk!');
  };

  const fieldRow = (
    key: keyof GlobalMasterParams,
    label: string,
    affectedProducts: string,
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
        <ThousandInput
          value={globalParams[key]}
          onValueChange={(val) => handleChange(key, val)}
          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
          prefix={isRupiah ? 'Rp' : undefined}
          suffix={isRupiah ? undefined : '%'}
          allowDecimals={isDecimal}
        />
      </div>
      <p className="text-[10px] text-slate-500 font-medium mt-1.5 truncate" title={affectedProducts}>
        Terkait: <span className="text-slate-600 font-semibold">{affectedProducts}</span>
      </p>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl border border-white/20 text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Master Parameter Global (Shared Rates)</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                Multi-Produk
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              Kelola tarif bahan baku, mesin offset, digital print, dan finishing yang dipakai bersama oleh seluruh produk.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {isModified && (
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/30 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Default
            </button>
          )}
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white text-emerald-800 hover:bg-emerald-50 rounded-lg shadow-md transition-all cursor-pointer hover:shadow-lg active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Terapkan ke Semua Produk
          </button>
        </div>
      </div>

      {showAppliedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Seluruh parameter produk (Kalender, Manasik, Yasin, Nota, Brosur) telah diperbarui dengan tarif global ini.</span>
        </div>
      )}

      {/* Grid Kategori Parameter */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* 1. Mesin Cetak Offset Oliver */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800">1. Mesin Offset (Oliver 58/52)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('oliverPlatUnit', 'Tarif Plat CTP / Unit', 'Kalender, Manasik, Brosur')}
            {fieldRow('oliverMinOngkos', 'Min. Cetak (≤1000 Drek)', 'Kalender, Manasik, Brosur')}
            {fieldRow('oliverDrekOver', 'Tarif Drek Over / Drek', 'Kalender, Manasik, Brosur')}
            {fieldRow('oliverTransport', 'Ongkos Transport Cetak', 'Kalender')}
          </div>
        </div>

        {/* 2. Bahan Kertas Dasar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Bahan Kertas Dasar (/Kg)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifHvs70', 'HVS 70 gsm / Kg', 'Kalender, Nota')}
            {fieldRow('tarifAp120', 'Art Paper 120 / Kg', 'Kalender, Brosur')}
            {fieldRow('tarifAp150', 'Art Paper 150 / Kg', 'Kalender')}
            {fieldRow('tarifAc230Kg', 'Art Carton 230 / Kg', 'Buku Manasik')}
            {fieldRow('tarifAc260Kg', 'Art Carton 260 / Kg', 'Buku Manasik')}
            {fieldRow('upKertasPct', 'Up / PPN Kertas Dasar (%)', 'Kalender, Nota, Brosur', false)}
          </div>
        </div>

        {/* 3. Print Digital POD A3+ */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Print Digital POD A3+</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifPrintA3', 'Print Cover POD A3+', 'Manasik, Yasin')}
            {fieldRow('tarifPrintInter1Muka', 'Print Inter 1 Muka', 'Brosur 2026')}
            {fieldRow('tarifPrintInter2Muka', 'Print Inter 2 Muka', 'Brosur 2026')}
          </div>
        </div>

        {/* 4. Tarif Laminasi Standar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Jasa Laminasi (/cm²)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifLaminasiGlossyCm2', 'Laminasi Glossy / cm²', 'Manasik, Yasin, Brosur', true, true)}
            {fieldRow('tarifLaminasiDoffCm2', 'Laminasi Doff / cm²', 'Manasik, Yasin, Brosur', true, true)}
            {fieldRow('tarifUvVarnishCm2', 'UV Varnish / cm²', 'Manasik, Brosur', true, true)}
            {fieldRow('minLaminasi', 'Min. Order Laminasi', 'Manasik, Yasin')}
          </div>
        </div>

        {/* 5. Finishing & Kemasan Standar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Box className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-slate-800">5. Packing & Finishing Umum</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifKardusBox', 'Kardus Box / Pcs', 'Manasik, Brosur')}
            {fieldRow('tarifLakbanRoll', 'Lakban Roll / Pcs', 'Kalender, Brosur')}
            {fieldRow('tarifPlastikOppPcs', 'Plastik OPP / Pcs', 'Manasik, Yasin')}
            {fieldRow('tarifSisirPcs', 'Ongkos Potong Sisir', 'Manasik, Yasin')}
            {fieldRow('tarifStaplesPcs', 'Ongkos Staples', 'Manasik, Yasin')}
          </div>
        </div>

        {/* Info Box Cara Kerja */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Cara Kerja Parameter Global:</span>
              <p>
                1. Ubah tarif standar di atas (misal kenaikan harga kertas atau tarif plat Oliver).
              </p>
              <p>
                2. Klik tombol <strong>&ldquo;Terapkan ke Semua Produk&rdquo;</strong> di atas untuk menyinkronkan seluruh parameter di modul Kalender, Manasik, Yasin, Nota, dan Brosur sekaligus.
              </p>
              <p>
                3. Jika ingin tarif khusus untuk produk tertentu saja, Anda tetap bisa mengubahnya di tab Parameter produk terkait.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
