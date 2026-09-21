'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Printer,
  Layers,
  Sparkles,
  PackageCheck,
  Scissors,
  DollarSign,
  Stamp,
} from 'lucide-react';
import {
  DEFAULT_SYAHADAH_PARAMS,
  SyahadahMasterParams,
} from '@/lib/syahadah-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface SyahadahMasterParameterProps {
  customParams: SyahadahMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<SyahadahMasterParams>>;
}

export default function SyahadahMasterParameter({
  customParams,
  setCustomParams,
}: SyahadahMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof SyahadahMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof SyahadahMasterParams) =>
    customParams[key] !== DEFAULT_SYAHADAH_PARAMS[key];

  const handleResetField = (key: keyof SyahadahMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_SYAHADAH_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_SYAHADAH_PARAMS[key]}).`);
  };

  const allKeys = Object.keys(DEFAULT_SYAHADAH_PARAMS) as (keyof SyahadahMasterParams)[];
  const isModified = React.useMemo(
    () => allKeys.some((key) => customParams[key] !== DEFAULT_SYAHADAH_PARAMS[key]),
    [customParams, allKeys]
  );

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_SYAHADAH_PARAMS });
    toast.success('Semua parameter Syahadah dikembalikan ke standar master.');
  };

  // Controlled input guard: fallback ke DEFAULT_SYAHADAH_PARAMS[key] jika undefined
  const fieldRow = (
    key: keyof SyahadahMasterParams,
    label: string,
    isRupiah = true,
    isDecimal = false,
    suffix?: string,
    helpText?: string
  ) => {
    const rawVal = customParams[key];
    const val = rawVal ?? DEFAULT_SYAHADAH_PARAMS[key];

    return (
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
              value={val}
              onValueChange={(v) => handleChange(key, v || 0)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
              prefix="Rp"
              allowDecimals={false}
            />
          ) : (
            <div className="relative w-full">
              <input
                type="number"
                step={isDecimal ? 0.01 : 1}
                value={val}
                onChange={(e) => handleChange(key, Number(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
              />
              {suffix && (
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 pointer-events-none">
                  {suffix}
                </span>
              )}
            </div>
          )}
        </div>
        {helpText && (
          <p className="text-[10px] text-slate-400 mt-1 leading-tight">{helpText}</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
                Master Parameter Syahadah (08. Pricelist Syahadah)
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Sinkronisasi 1:1 terhadap sheet Master &amp; BUKU file Excel: <span className="font-semibold text-emerald-900">Pricelist Syahadah - 1 Muka &amp; 2 Muka FC/1W/2W (Print Inter &amp; Ryobi)</span>.
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

      {/* Grid Kartu Master Parameter */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Bahan Kertas & Desain */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800">1. Bahan Kertas &amp; Desain</h3>
          </div>
          <div className="space-y-2.5">
            {fieldRow('tarifKertasLinenKg', 'Harga Kertas Linen/Hammer /Kg', true, false, undefined, 'Master!D12: Hammer Crem / Linen Tebal 300 gsm')}
            {fieldRow('upKertasPct', 'Markup Kertas (%)', false, false, '%', 'Master!E12: Kenaikan harga kertas (default 0%)')}
            {fieldRow('tarifDesign', 'Desain Artwork / Order', true, false, undefined, 'Master!D17: Biaya setting layout syahadah (Rp 20.000)')}
            {fieldRow('tarifSisirPer500', 'Potong Sisir / 500 Pcs', true, false, undefined, 'BUKU!AS6: Ongkos potong sisir (Rp 5.000 per 500 pcs)')}
          </div>
        </div>

        {/* Card 2: Cetak Digital Print Inter (POD) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Cetak Digital Print Inter (POD)</h3>
          </div>
          <div className="space-y-2.5">
            {fieldRow('tarifPrintA3', 'Tarif Print A3+ Digital', true, false, undefined, 'Master!D18: Biaya cetak per lbr A3+ (muat 2 syahadah)')}
            {fieldRow('insheetPod', 'Insheet Cetak POD (Lembar A3+)', false, false, 'Lbr', 'Master!D13: Cadangan cetak digital POD (default 5 lbr)')}
          </div>
        </div>

        {/* Card 3: Cetak Offset Ryobi (1W / 2W) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Cetak Offset Ryobi</h3>
          </div>
          <div className="space-y-2.5">
            {fieldRow('tarifPlatRyobi', 'Tarif Plat Ryobi / Warna', true, false, undefined, 'BUKU!Y6: Biaya plat cetak offset toko (Rp 10.000/plat)')}
            {fieldRow('minOrderRyobi', 'Min. Order Cetak / Plat', true, false, undefined, 'BUKU!AB6: Ongkos dasar cetak per plat s.d. 500 drek')}
            {fieldRow('tarifDrekOverRyobi', 'Tarif Drek Over / Warna', true, false, undefined, 'BUKU!AC7: Drek over di atas 500 (Rp 30/drek/warna)')}
            {fieldRow('insheetRyobi', 'Insheet Cetak Ryobi (Lembar)', false, false, 'Lbr', 'Master!D13: Cadangan cetak offset Ryobi (default 50 lbr)')}
            {fieldRow('syahadahPerPlanoRyobi', 'Kapasitas Plano (Pcs / Plano)', false, false, 'Pcs', 'BUKU!O15: 1 plano 79×109 cm dipotong jadi 11 lembar folio')}
          </div>
        </div>

        {/* Card 4: Cetak Offset Oliver */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Cetak Offset Oliver</h3>
          </div>
          <div className="space-y-2.5">
            {fieldRow('tarifPlatOliver', 'Tarif Plat Oliver / Warna', true, false, undefined, 'BUKU!Y6: Biaya plat cetak offset Oliver (Rp 43.000/plat)')}
            {fieldRow('minOrderOliver', 'Min. Order Cetak / Plat', true, false, undefined, 'BUKU!AB6: Ongkos dasar cetak per plat s.d. 1.000 drek')}
            {fieldRow('tarifDrekOverOliver', 'Tarif Drek Over / Warna', true, false, undefined, 'BUKU!AC7: Drek over di atas 1.000 (Rp 40/drek/warna)')}
          </div>
        </div>

        {/* Card 5: Finishing Foil Emas (Hotprint) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Stamp className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">5. Finishing Foil Emas</h3>
          </div>
          <div className="space-y-2.5">
            {fieldRow('tarifKliseMasterFoil', 'Biaya Klise Master Foil', true, false, undefined, 'BUKU!AN6: Biaya pembuatan plat/matris foil per muka')}
            {fieldRow('tarifFoilPerPcs', 'Tarif Hotprint Foil / Pcs', true, false, undefined, 'HARGA JULI 2026: Ongkos hotprint per pcs (Rp 450/pcs)')}
            {fieldRow('minOrderFoil', 'Min. Order Hotprint Foil', true, false, undefined, 'HARGA JULI 2026: Minimum ongkos foil (Rp 100.000)')}
          </div>
        </div>

        {/* Card 6: Packing & Margin */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <PackageCheck className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-slate-800">6. Packing &amp; Margin</h3>
          </div>
          <div className="space-y-2.5">
            {fieldRow('tarifKardusBox', 'Harga Kardus / Box', true, false, undefined, 'Master!D22: Kardus per box (kapasitas 1.000 pcs)')}
            {fieldRow('tarifLakbanRoll', 'Harga Lakban / Roll', true, false, undefined, 'Master!D21: Lakban 90 yard per roll')}
            {fieldRow('marginDefaultPct', 'Margin Laba Default (%)', false, false, '%', 'Master!E24: Standar margin profit 30%')}
            {fieldRow('negoDefaultPct', 'Nego Diskon Default (%)', false, false, '%', 'HARGA JULI 2026: Batas diskon sales 5%')}
          </div>
        </div>
      </div>

      {/* Modal Manual Pengguna & Pemetaan Sumber Excel */}
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Syahadah (08. Pricelist Syahadah)
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
                  Pemetaan Cell Excel Asli ke Parameter SINTAK
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan Kertas Linen/Hammer Crem</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga Kertas</strong>: <span className="font-mono text-emerald-700">Master!D12</span> Rp 29.900/kg (Hammer Crem / Linen Tebal 300 gsm).</li>
                      <li>• <strong>Plano 79×109</strong>: <span className="font-mono text-emerald-700">BUKU!W29</span> Berat rim = (79×109×300)/20.000 = 129,165 kg → Rp 3.862.033,5/rim (Rp 7.724,07/lbr plano).</li>
                      <li>• <strong>Kapasitas Plano Ryobi</strong>: <span className="font-mono text-emerald-700">BUKU!O15/P16</span> 1 plano 79×109 cm menghasilkan 11 lembar folio 21,5×33 cm.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Cetak POD (Print Inter) vs Offset (Ryobi)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Print Inter A3+</strong>: <span className="font-mono text-emerald-700">Master!D18</span> Rp 3.800/lbr A3+ (1 lbr A3+ muat 2 lembar folio).</li>
                      <li>• <strong>Insheet POD</strong>: <span className="font-mono text-emerald-700">Master!D13</span> 5 lbr A3+ (flat).</li>
                      <li>• <strong>Insheet Ryobi</strong>: <span className="font-mono text-emerald-700">Master!D13</span> 50 lbr folio offset.</li>
                      <li>• <strong>Plat Ryobi</strong>: <span className="font-mono text-emerald-700">BUKU!Y6</span> Rp 10.000/plat (1W = 1 plat, 2W = 2 plat per muka).</li>
                      <li>• <strong>Ongkos Cetak Ryobi</strong>: <span className="font-mono text-emerald-700">BUKU!AB6</span> Min Rp 15.000/plat + <span className="font-mono text-emerald-700">BUKU!AC7</span> drek over Rp 30/drek/warna (&gt;500 drek).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>3. Finishing Sisir &amp; Foil Emas (Hotprint)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Potong Sisir</strong>: <span className="font-mono text-emerald-700">BUKU!AS7</span> ROUNDUP(oplah/500, 0) × Rp 5.000.</li>
                      <li>• <strong>Klise Master Foil</strong>: <span className="font-mono text-emerald-700">BUKU!AN6</span> Rp 53.200 per muka.</li>
                      <li>• <strong>Tarif Hotprint</strong>: Catatan <span className="font-mono text-emerald-700">HARGA JULI 2026</span> Rp 450/pcs (min. Rp 100.000).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>4. Packing Kardus &amp; Margin Jual</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Kardus Box</strong>: <span className="font-mono text-emerald-700">Master!D22</span> Rp 8.500/box (kapasitas 1.000 pcs syahadah).</li>
                      <li>• <strong>Lakban Roll</strong>: <span className="font-mono text-emerald-700">Master!D21</span> Rp 8.000/roll (7.650 cm / 196 cm = 39,03 box/roll).</li>
                      <li>• <strong>Margin &amp; Nego</strong>: Margin 30% (<span className="font-mono text-emerald-700">Master!E24</span>), Nego 5% (<span className="font-mono text-emerald-700">HARGA JULI 2026</span>).</li>
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
