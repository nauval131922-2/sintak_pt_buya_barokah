'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Printer,
  Layers,
  Box,
  FileText,
  Sliders,
} from 'lucide-react';
import {
  DEFAULT_BUKU_TULIS_PARAMS,
  BukuTulisMasterParams,
} from '@/lib/buku-tulis-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface BukuTulisMasterParameterProps {
  customParams: BukuTulisMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<BukuTulisMasterParams>>;
}

const BUKU_TULIS_VISIBLE_KEYS: (keyof BukuTulisMasterParams)[] = [
  'tarifArtCarton230Kg',
  'upArtCartonPct',
  'tarifHvs70Kg',
  'upHvsPct',
  'insheetCoverPod',
  'insheetCoverOffset',
  'insheetIsiRyobi',
  'insheetIsiOliver',
  'insheetIsiSm',
  'tarifPrintCoverA3',
  'tarifPlatRyobi',
  'minOrderRyobi',
  'tarifDrekRyobi',
  'tarifPlatOliver',
  'minOrderOliver',
  'tarifDrekOliver',
  'tarifPlatSm',
  'minOrderSm',
  'tarifDrekSm',
  'tarifDesignCover',
  'tarifDesignIsiPerHlm',
  'tarifLaminasiGlossyCm2',
  'minLaminasi',
  'tarifSisirPerPcs',
  'tarifTransport',
  'tarifKardusBox',
  'kapasitasKardus',
  'tarifLakbanRoll',
  'marginDefaultPct',
  'negoDefaultPct',
];

export default function BukuTulisMasterParameter({
  customParams,
  setCustomParams,
}: BukuTulisMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof BukuTulisMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof BukuTulisMasterParams) =>
    (customParams[key] ?? DEFAULT_BUKU_TULIS_PARAMS[key]) !== DEFAULT_BUKU_TULIS_PARAMS[key];

  const handleResetField = (key: keyof BukuTulisMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_BUKU_TULIS_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_BUKU_TULIS_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => BUKU_TULIS_VISIBLE_KEYS.some((key) => (customParams[key] ?? DEFAULT_BUKU_TULIS_PARAMS[key]) !== DEFAULT_BUKU_TULIS_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      BUKU_TULIS_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_BUKU_TULIS_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Buku Tulis dikembalikan ke standar master.');
  };

  const fieldRow = (
    key: keyof BukuTulisMasterParams,
    label: string,
    isRupiah = true,
    isDecimal = false
  ) => {
    const rawVal = customParams[key] ?? DEFAULT_BUKU_TULIS_PARAMS[key];
    const val = typeof rawVal === 'number' ? rawVal : 0;
    return (
      <div
        key={key}
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
              value={val}
              onValueChange={(v) => handleChange(key, v || 0)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
              prefix="Rp"
              allowDecimals={isDecimal}
            />
          ) : (
            <input
              type="number"
              step={isDecimal ? 0.01 : 1}
              value={val}
              onChange={(e) => handleChange(key, Number(e.target.value) || 0)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
            />
          )}
        </div>
      </div>
    );
  };

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
                Master Parameter Buku Tulis 72 Hal
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan kertas Art Carton 230 gsm & HVS 70 gsm, cetak cover/isi, laminasi glossy, finishing susun-staples-sisir, dan desain buku tulis 72 hal soft cover.
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
        {/* Card 1: Bahan Kertas & Insheet */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800">1. Bahan Kertas &amp; Insheet</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifArtCarton230Kg', 'Art Carton 230 (Rp/Kg)')}
            {fieldRow('upArtCartonPct', 'Markup AC 230 (%)', false)}
            {fieldRow('tarifHvs70Kg', 'Kertas HVS 70 (Rp/Kg)')}
            {fieldRow('upHvsPct', 'Markup HVS 70 (%)', false)}
            {fieldRow('insheetCoverPod', 'Insheet Cover POD (lbr)', false)}
            {fieldRow('insheetCoverOffset', 'Insheet Cover Offset (lbr)', false)}
            {fieldRow('insheetIsiRyobi', 'Insheet Isi Ryobi (lbr)', false)}
            {fieldRow('insheetIsiOliver', 'Insheet Isi Oliver (lbr)', false)}
            {fieldRow('insheetIsiSm', 'Insheet Isi SM (lbr)', false)}
          </div>
        </div>

        {/* Card 2: Cetak & Desain */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Cetak &amp; Desain</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifPrintCoverA3', 'Print Cover POD (Rp/lbr)')}
            {fieldRow('tarifPlatRyobi', 'Plat Ryobi (Rp/plat)')}
            {fieldRow('minOrderRyobi', 'Min Order Ryobi (Rp)')}
            {fieldRow('tarifDrekRyobi', 'Ongkos Drek Ryobi (Rp/drek)')}
            {fieldRow('tarifPlatOliver', 'Plat Oliver (Rp/plat)')}
            {fieldRow('minOrderOliver', 'Min Order Oliver (Rp)')}
            {fieldRow('tarifDrekOliver', 'Ongkos Drek Oliver (Rp/drek)')}
            {fieldRow('tarifPlatSm', 'Plat SM (Rp/plat)')}
            {fieldRow('minOrderSm', 'Min Order SM (Rp)')}
            {fieldRow('tarifDrekSm', 'Ongkos Drek SM (Rp/drek)')}
            {fieldRow('tarifDesignCover', 'Desain Setting Cover (Rp)')}
            {fieldRow('tarifDesignIsiPerHlm', 'Desain Setting Isi/Hal (Rp)')}
          </div>
        </div>

        {/* Card 3: Finishing, Laminasi & Packing */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800">3. Finishing &amp; Packing</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifLaminasiGlossyCm2', 'Laminasi Glossy (Rp/cm²)', true, true)}
            {fieldRow('minLaminasi', 'Min. Order Laminasi (Rp)')}
            {fieldRow('tarifSisirPerPcs', 'Ongkos Sisir / pcs (Rp)')}
            {fieldRow('tarifTransport', 'Ongkos Transport (Rp)')}
            {fieldRow('tarifKardusBox', 'Kardus Box (Rp/box)')}
            {fieldRow('kapasitasKardus', 'Kapasitas Box (pcs/box)', false)}
            {fieldRow('tarifLakbanRoll', 'Lakban Roll (Rp/roll)')}
          </div>
        </div>

        {/* Card 4: Margin & Nego Standar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Margin &amp; Nego Standar</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('marginDefaultPct', 'Margin Default (%)', false)}
            {fieldRow('negoDefaultPct', 'Nego Default (%)', false)}
          </div>
          <p className="text-[10px] text-slate-500">
            Margin 20% &amp; nego 4% sesuai PRICELIST 2026 sheet HARGA JULI 2026. HPP dihitung per pcs dengan pembulatan ke kelipatan Rp 10.
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Buku Tulis 72 Hal (06. Pricelist Buku Tulis)
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
                  Pemetaan Master Parameter ke File Excel (Folder 06. Pricelist Buku Tulis/*.xlsx)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan Kertas Cover &amp; Isi</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Art Carton 230 gsm</strong>: <span className="font-mono text-emerald-700">Master!D12</span> Rp 16.400/kg + up 0–5% (<span className="font-mono text-emerald-700">Master!E12</span>).</li>
                      <li>• <strong>Insheet Cover</strong>: <span className="font-mono text-emerald-700">Master!D13 / BUKU!K6</span> (Print Inter: 7 lbr, Oliver: 100 lbr).</li>
                      <li>• <strong>HVS 70 gsm</strong>: <span className="font-mono text-emerald-700">Master!D22</span> Rp 15.700/kg + up 3% (<span className="font-mono text-emerald-700">Master!E22</span>).</li>
                      <li>• <strong>Insheet Isi</strong>: <span className="font-mono text-emerald-700">Master!D23 / BUKU!AI6</span> (Ryobi: 30 lbr, Oliver: 100 lbr), 72 hal = 18 lembar isi/buku.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Cetak Cover &amp; Isi</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Cover Print A3+</strong>: <span className="font-mono text-blue-700">Master!D18</span> Print Inter 1 muka 4W @ Rp 2.500/A3+.</li>
                      <li>• <strong>Isi Ryobi / Oliver</strong>: <span className="font-mono text-blue-700">Master!D27 / BUKU!BD</span> Ryobi 1W bolak-balik @ Rp 2.000/A3+ (≤500 eks), Oliver/SM untuk oplah besar.</li>
                      <li>• <strong>Desain Setting</strong>: Cover <span className="font-mono text-blue-700">Master!D17</span> Rp 20.000 + Isi <span className="font-mono text-blue-700">Master!D26</span> Rp 2.500/hal × 72 hal.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Finishing &amp; Packing</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Laminasi Glossy</strong>: <span className="font-mono text-amber-700">BUKU!CI6</span> Rp 0,35/cm² (min <span className="font-mono text-amber-700">CJ7</span> Rp 50.000) × luas bentangan cover terbuka.</li>
                      <li>• <strong>Potong Sisir 3 Sisi</strong>: <span className="font-mono text-amber-700">BUKU!BT6</span> Rp 150/pcs.</li>
                      <li>• <strong>Ongkos Transport</strong>: Rp 15.000 flat per batch.</li>
                      <li>• <strong>Kardus &amp; Lakban</strong>: <span className="font-mono text-amber-700">BUKU!DD7</span> Kardus Box Rp 8.500 (kapasitas 300 pcs) + Lakban <span className="font-mono text-amber-700">Master!D34</span> Rp 9.600/roll.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Margin &amp; Nego</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Margin Standar</strong>: <span className="font-mono text-violet-700">BUKU!DH6</span> 20% dari HPP, nego 4% dari harga jual.</li>
                      <li>• <strong>Pembulatan Harga Jual</strong>: <span className="font-mono text-violet-700">BUKU!DL7</span> = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">ROUNDUP(DK7, -1)</code> (kelipatan 10 terdekat).</li>
                      <li>• Tier oplah: 15,5×21 (20–500 eks), 16×21 (600–10.000 eks).</li>
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
