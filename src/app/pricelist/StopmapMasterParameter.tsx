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
  Truck,
} from 'lucide-react';
import {
  DEFAULT_STOPMAP_PARAMS,
  StopmapMasterParams,
} from '@/lib/stopmap-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface StopmapMasterParameterProps {
  customParams: StopmapMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<StopmapMasterParams>>;
}

export default function StopmapMasterParameter({
  customParams,
  setCustomParams,
}: StopmapMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof StopmapMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof StopmapMasterParams) =>
    customParams[key] !== DEFAULT_STOPMAP_PARAMS[key];

  const handleResetField = (key: keyof StopmapMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_STOPMAP_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_STOPMAP_PARAMS[key]}).`);
  };

  const allKeys = Object.keys(DEFAULT_STOPMAP_PARAMS) as (keyof StopmapMasterParams)[];
  const isModified = React.useMemo(
    () => allKeys.some((key) => customParams[key] !== DEFAULT_STOPMAP_PARAMS[key]),
    [customParams, allKeys]
  );

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_STOPMAP_PARAMS });
    toast.success('Semua parameter Stopmap dikembalikan ke standar master.');
  };

  // Controlled input guard: fallback ke DEFAULT_STOPMAP_PARAMS[key] jika undefined
  const fieldRow = (
    key: keyof StopmapMasterParams,
    label: string,
    isRupiah = true,
    isDecimal = false,
    suffix?: string,
    helpText?: string
  ) => {
    const rawVal = customParams[key];
    const val = rawVal ?? DEFAULT_STOPMAP_PARAMS[key];

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
                Master Parameter Stopmap (07. Pricelist Stopmap)
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Sinkronisasi 1:1 terhadap sheet Master &amp; BUKU file Excel: <span className="font-semibold text-emerald-900">Pricelist STOPMAP A4.xlsm</span> dan <span className="font-semibold text-emerald-900">Pricelist STOPMAP FOLIO.xlsm</span>.
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
        {/* Card 1: Standar Upah & Bahan Kertas */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800">1. Standar Upah &amp; Bahan Kertas</h3>
          </div>
          <div className="space-y-2.5">
            {fieldRow('standarUMR', 'Standar UMR / Bulan (Rp)', true, false, undefined, 'Master!D8: Basis hitungan upah per hari (UMR / 25)')}
            {fieldRow('tarifArtCartonKg', 'Harga Art Carton 230 /Kg', true, false, undefined, 'Master!D12: Harga dasar bahan kertas per kg')}
            {fieldRow('upArtCartonPct', 'Markup Kertas (%)', false, false, '%', 'Master!E12: Kenaikan harga kertas (default 5%)')}
          </div>
        </div>

        {/* Card 2: Cetak Digital Print Inter (A4) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Cetak Digital Print Inter (A4)</h3>
          </div>
          <div className="space-y-2.5">
            {fieldRow('tarifPrintA3', 'Tarif Print A3+ Digital', true, false, undefined, 'Master!D18: Biaya cetak digital 4W per lbr A3+')}
            {fieldRow('insheetCoverPrintInter', 'Insheet Cetak Digital (Lembar)', false, false, 'Lbr', 'Master!D13: Cadangan cetak digital A4 (default 5 lbr)')}
            {fieldRow('tarifDesainA4', 'Desain Stopmap A4', true, false, undefined, 'Master!D17: Biaya artwork cover A4')}
            {fieldRow('tarifTransportA4', 'Transportasi A4', true, false, undefined, 'BUKU!AK6: Biaya transport A4 (default Rp 0)')}
          </div>
        </div>

        {/* Card 3: Cetak Offset Oliver 4 Warna (Folio) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Cetak Offset Oliver 4W</h3>
          </div>
          <div className="space-y-2.5">
            {fieldRow('tarifPlatOliver', 'Tarif Plat Oliver / Warna', true, false, undefined, 'BUKU!Y6: Biaya plat cetak offset per warna')}
            {fieldRow('minOrderOliver', 'Min. Order Cetak / Plat', true, false, undefined, 'BUKU!AB6: Ongkos dasar cetak per plat s.d 1.000 drek')}
            {fieldRow('tarifDrekOverOliver', 'Tarif Drek Over / Warna', true, false, undefined, 'BUKU!AC7: Drek over di atas 1.000 (per warna)')}
            {fieldRow('insheetCoverOliver', 'Insheet Cetak Oliver (Lembar)', false, false, 'Lbr', 'Master!D13: Cadangan cetak offset Folio (default 150 lbr)')}
            {fieldRow('tarifDesainFolio', 'Desain Stopmap Folio', true, false, undefined, 'Master!D17: Biaya artwork cover Folio')}
            {fieldRow('tarifTransportFolio', 'Transportasi Folio', true, false, undefined, 'BUKU!AK6: Biaya transport Folio (default Rp 30.000)')}
          </div>
        </div>

        {/* Card 4: Kupingan / Kantong Map */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Scissors className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Bahan Kupingan / Kantong</h3>
          </div>
          <div className="space-y-2.5">
            {fieldRow('kupinganPerPlano', 'Isi Kupingan / Lembar Plano', false, false, 'Pcs', 'BUKU!AN6: 1 plano 79×109 cm menghasilkan 15 kupingan')}
            {fieldRow('insheetPlanoKupinganA4', 'Insheet Kupingan A4 (Plano)', false, false, 'Plano', 'BUKU!AN7: Cadangan bahan kupingan A4 (default 3 plano)')}
            {fieldRow('insheetPlanoKupinganFolio', 'Insheet Kupingan Folio (Plano)', false, false, 'Plano', 'BUKU!AN7: Cadangan bahan kupingan Folio (default 8 plano)')}
            {fieldRow('biayaPisauPonzBaru', 'Biaya Pisau Ponz Baru', true, false, undefined, 'BUKU!AQ6: Biaya pisau ponz jika buat cetakan baru')}
          </div>
        </div>

        {/* Card 5: Jasa Tangan Finishing Tenaga UMR */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">5. Jasa Finishing Tenaga UMR</h3>
          </div>
          <div className="space-y-2.5">
            {fieldRow('targetLipatPerHari', 'Target Harian Lipat (Pcs)', false, false, 'Pcs', 'BUKU!AL28: Target harian lipat (UMR/25/Target)')}
            {fieldRow('targetPonzPerHari', 'Target Harian Ponz (Pcs)', false, false, 'Pcs', 'BUKU!AR28: Target harian ponz kupingan')}
            {fieldRow('biayaLemKupinganPerPcs', 'Biaya Lem Kupingan / Pcs', true, false, undefined, 'BUKU!AR6: Ongkos bahan lem perekat per pcs')}
            {fieldRow('targetPasangPerHari', 'Target Pasang Kupingan (Pcs)', false, false, 'Pcs', 'BUKU!AU28: Target harian tempel kantong ke map')}
          </div>
        </div>

        {/* Card 6: Laminasi & Pengemasan */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <PackageCheck className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-slate-800">6. Laminasi &amp; Pengemasan</h3>
          </div>
          <div className="space-y-2.5">
            {fieldRow('tarifLaminasiGlossyCm2', 'Tarif Laminasi Glossy / cm²', false, true, 'Rp', 'BUKU!AW6: Tarif glossy per cm² (default 0.35)')}
            {fieldRow('tarifLaminasiDoffCm2', 'Tarif Laminasi Doff / cm²', false, true, 'Rp', 'BUKU!AZ6: Tarif doff per cm² (default 0.40)')}
            {fieldRow('tarifUvVarnishCm2', 'Tarif UV Varnish / cm²', false, true, 'Rp', 'BUKU!BC6: Tarif UV per cm² (default 0.12)')}
            {fieldRow('minLaminasi', 'Min. Order Laminasi', true, false, undefined, 'BUKU!AW7..BE7: Minimum biaya finishing')}
            {fieldRow('tarifKardusBox', 'Harga Kardus / Box', true, false, undefined, 'Master!D22: Kardus per box (isi 300 pcs)')}
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Stopmap (07. Pricelist Stopmap)
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
                      <span>1. Bahan Kertas &amp; Standar Upah UMR</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Standar UMR</strong>: <span className="font-mono text-emerald-700">Master!D8</span> Rp 2.818.585 (dasar upah harian UMR / 25).</li>
                      <li>• <strong>Art Carton 230 gsm</strong>: <span className="font-mono text-emerald-700">Master!D12</span> Rp 16.400/kg.</li>
                      <li>• <strong>Markup Kertas</strong>: <span className="font-mono text-emerald-700">Master!E12</span> 5% (harga net per kg = Rp 17.220).</li>
                      <li>• <strong>Harga Plano 79×109</strong>: <span className="font-mono text-emerald-700">BUKU!W29</span> Berat rim = (79×109×230)/20.000 = 99,0265 kg → Rp 1.705.236/rim (Rp 3.410,47/lbr plano).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Cetak Digital (Print Inter) vs Offset (Oliver)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Print Inter A3+</strong>: <span className="font-mono text-emerald-700">Master!D18</span> Rp 2.500/lbr A3+ (sudah termasuk kertas dan cetak 4W).</li>
                      <li>• <strong>Insheet Digital</strong>: <span className="font-mono text-emerald-700">Master!D13</span> 5 lbr A3+ (flat).</li>
                      <li>• <strong>Insheet Oliver</strong>: <span className="font-mono text-emerald-700">Master!D13</span> 150 lbr plano offset.</li>
                      <li>• <strong>Plat Oliver</strong>: <span className="font-mono text-emerald-700">BUKU!Y6</span> Rp 45.000/plat (4 plat = Rp 180.000).</li>
                      <li>• <strong>Ongkos Cetak Oliver</strong>: <span className="font-mono text-emerald-700">BUKU!AB6</span> Min Rp 90.000/plat (Rp 360.000 dasar) + <span className="font-mono text-emerald-700">BUKU!AC7</span> drek over Rp 40/drek/warna.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>3. Kupingan (Kantong Stopmap) &amp; Jasa Finishing</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Yield Kupingan</strong>: <span className="font-mono text-emerald-700">BUKU!AN6</span> 1 plano 79×109 menghasilkan 15 kupingan.</li>
                      <li>• <strong>Cadangan Plano Kupingan</strong>: <span className="font-mono text-emerald-700">BUKU!AN7</span> A4 = 3 plano, Folio = 8 plano (120 kupingan cadangan).</li>
                      <li>• <strong>Lipat Stopmap</strong>: <span className="font-mono text-emerald-700">BUKU!AL7</span> (UMR/25/4.000) = Rp 28,18585/pcs.</li>
                      <li>• <strong>Ponz &amp; Lem</strong>: <span className="font-mono text-emerald-700">BUKU!AR7</span> (UMR/25/2.000) + Rp 50 lem = Rp 106,3717/pcs.</li>
                      <li>• <strong>Pasang Kupingan</strong>: <span className="font-mono text-emerald-700">BUKU!AU7</span> (UMR/25/500) = Rp 225,4868/pcs.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>4. Laminasi, Packing Kardus &amp; Margin</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Laminasi Glossy</strong>: <span className="font-mono text-emerald-700">BUKU!AW6</span> Rp 0,35/cm² × (2×W × H) (Min. Rp 50.000).</li>
                      <li>• <strong>Laminasi Doff</strong>: <span className="font-mono text-emerald-700">BUKU!AZ6</span> Rp 0,40/cm² × (2×W+1 × H+1) bleed (Min. Rp 50.000).</li>
                      <li>• <strong>Packing Lakban</strong>: <span className="font-mono text-emerald-700">BUKU!BH7</span> Rp 8.000/roll (panjang 7.650 cm / konsumsi 196 cm per box).</li>
                      <li>• <strong>Kardus</strong>: <span className="font-mono text-emerald-700">Master!D22</span> Rp 8.500/box (kapasitas 300 pcs map).</li>
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
