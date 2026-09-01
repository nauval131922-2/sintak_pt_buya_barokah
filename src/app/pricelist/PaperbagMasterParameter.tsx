'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  ShoppingBag,
  Database,
  HelpCircle,
  X,
  Printer,
  Scissors,
  Layers,
  Sparkles,
  Package,
  Wrench,
} from 'lucide-react';
import {
  PaperbagMasterParams,
  DEFAULT_PAPERBAG_PARAMS,
} from '@/lib/paperbag-calculator';

interface PaperbagMasterParameterProps {
  customParams: PaperbagMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<PaperbagMasterParams>>;
}

export default function PaperbagMasterParameter({
  customParams,
  setCustomParams,
}: PaperbagMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (field: keyof PaperbagMasterParams, value: number) => {
    setCustomParams((prev) => ({
      ...prev,
      [field]: isNaN(value) ? 0 : value,
    }));
  };

  const handleReset = () => {
    if (confirm('Kembalikan semua parameter Master Paperbag ke nilai default?')) {
      setCustomParams(DEFAULT_PAPERBAG_PARAMS);
    }
  };

  const isModified =
    JSON.stringify(customParams) !== JSON.stringify(DEFAULT_PAPERBAG_PARAMS);

  const fieldRow = (
    field: keyof PaperbagMasterParams,
    label: string,
    isCurrency: boolean = true,
    suffix?: string
  ) => {
    const isFieldModified = customParams[field] !== DEFAULT_PAPERBAG_PARAMS[field];
    return (
      <div
        className={`p-2.5 rounded-lg border transition-all ${
          isFieldModified
            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <label className="text-xs font-semibold text-slate-700 leading-tight flex items-center gap-1.5">
            {label}
            {isFieldModified && (
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"
                title="Nilai diubah dari default"
              />
            )}
          </label>
          <span className="text-[10px] text-slate-600 font-mono">
            Def: {DEFAULT_PAPERBAG_PARAMS[field]?.toLocaleString('id-ID')}
            {suffix || (isCurrency ? ' Rp' : '')}
          </span>
        </div>
        <div className="relative">
          {isCurrency && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">
              Rp
            </span>
          )}
          <input
            type="number"
            value={customParams[field] ?? 0}
            onChange={(e) => handleChange(field, parseFloat(e.target.value))}
            className={`w-full py-1.5 text-xs font-bold text-slate-800 rounded-md border focus:outline-none focus:ring-1 transition-all ${
              isCurrency ? 'pl-8 pr-2.5' : 'px-2.5'
            } ${
              isFieldModified
                ? 'border-amber-400 bg-amber-50/30 focus:border-amber-500 focus:ring-amber-500/30'
                : 'border-slate-300 bg-slate-50/50 focus:border-emerald-500 focus:ring-emerald-500/30 focus:bg-white'
            }`}
          />
          {suffix && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-600">
              {suffix}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Master Parameter Paperbag (Tas Kertas)
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                Pricelist 29
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Konfigurasi tarif kertas Art Carton 230g, cetak offset (Oliver & SM), pisau pond, double tape, tali kur, lipat, dan packing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer"
          >
            <HelpCircle size={14} />
            <span>Panduan Rumus</span>
          </button>
          <button
            onClick={handleReset}
            disabled={!isModified}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isModified
                ? 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer shadow-2xs'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70'
            }`}
          >
            <RotateCcw size={13} />
            <span>Reset Standar</span>
          </button>
        </div>
      </div>

      {isModified && (
        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900">
          <Database size={15} className="text-amber-700 shrink-0" />
          <span>
            <strong>Ada parameter yang dimodifikasi</strong> dari nilai default. Baris berwarna orange menunjukkan perubahan aktif.
          </span>
        </div>
      )}

      {/* Grid Kategori Parameter (2 Kolom di md/2xl) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Kertas Dasar & Desain */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <ShoppingBag className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Kertas Dasar & Desain Paperbag
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('hargaPlanoAC230', 'Art Carton 230 gsm (Rp/Plano)')}
            {fieldRow('biayaDesain', 'Jasa Desain Paperbag (Rp/Order)')}
            {fieldRow('insheetPlanoOliver', 'Insheet Oliver (Lbr Plano)', false, ' lbr')}
            {fieldRow('insheetPlanoSM', 'Insheet SM 52/72 (Lbr Plano)', false, ' lbr')}
          </div>
        </div>

        {/* Card 2: Plat & Ongkos Cetak Offset */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Plat & Ongkos Cetak Offset (4 Warna)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifPlatOliverPerWarna', 'Tarif Plat Oliver (Rp/Plat)')}
            {fieldRow('tarifPlatSMPerWarna', 'Tarif Plat SM (Rp/Plat)')}
            {fieldRow('oliverMinOngkosPerWarna', 'Min Oliver 4W s/d 1rb (Rp/Plat)')}
            {fieldRow('oliverDrekOverPerWarna', 'Oliver Drek Over (Rp/Drek/Warna)')}
            {fieldRow('smMinOngkosPerWarna', 'Min SM 4W s/d 3rb (Rp/Plat)')}
            {fieldRow('smDrekOverPerWarna', 'SM Drek Over (Rp/Drek/Warna)')}
          </div>
        </div>

        {/* Card 3: Pond Die Cut & Transport */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Scissors className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Pond (Die Cut) & Transport
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('biayaTransport', 'Transport Ekspedisi (Rp/Order)')}
            {fieldRow('tarifPisauPondMin', 'Min Pisau Pond (Rp/Order)')}
            {fieldRow('tarifPisauPondPerCm2', 'Pisau Pond (Rp/cm²)', true, ' /cm²')}
            {fieldRow('tarifOngkosPondPerPcs', 'Ongkos Pond (Rp/pcs)', true, ' /pcs')}
          </div>
        </div>

        {/* Card 4: Assembly Paperbag (Tape, Tali, Lipat) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Wrench className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              4. Assembly Paperbag (Tape, Tali, Lipat)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifDoubleTapePerPcs', 'Bahan Double Tape (Rp/pcs)')}
            {fieldRow('tarifTenagaTapePerPcs', 'Upah Tempel Tape (Rp/pcs)')}
            {fieldRow('tarifTaliKurPerPcs', 'Bahan Tali Kur (Rp/pcs)')}
            {fieldRow('tarifPasangTaliPerPcs', 'Upah Pasang Tali (Rp/pcs)')}
            {fieldRow('tarifFinishingLipatPerPcs', 'Upah Lipat & Rakit Tas (Rp/pcs)')}
          </div>
        </div>

        {/* Card 5: Packing Kardus & Bungkus */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Package className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              5. Packing Kardus & Bungkus
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifKardusPerPcs', 'Tarif Kardus Packing (Rp/Kardus)')}
            {fieldRow('kapasitasKardusPcs', 'Isi per Kardus (Tas)', false, ' tas')}
            {fieldRow('tarifLakbanPerRoll', 'Tarif Lakban (Rp/Roll)')}
          </div>
        </div>

        {/* Card 6: Finishing Tambahan & Margin */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              6. Finishing Tambahan & Margin
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifLaminasiGlossyPerCm2', 'Laminasi Glossy (Rp/cm²)', true, ' /cm²')}
            {fieldRow('tarifLaminasiDoffPerCm2', 'Laminasi Doff (Rp/cm²)', true, ' /cm²')}
            {fieldRow('tarifUVVarnishPerCm2', 'UV Varnish (Rp/cm²)', true, ' /cm²')}
            {fieldRow('minBiayaLaminasi', 'Min Biaya Laminasi (Rp/Order)')}
            {fieldRow('marginDefaultPct', 'Margin Profit Default (%)', false, ' %')}
            {fieldRow('negoDefaultPct', 'Batas Nego Default (%)', false, ' %')}
          </div>
        </div>
      </div>

      {/* Modal Panduan Rumus */}
      {showManualModal && (
        <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer">
          <div
            className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Panduan Rumus Paperbag (Tas Kertas)</h3>
                  <p className="text-xs text-emerald-200">Referensi: Pricelist Paperbag 2026 & Source .xlsm</p>
                </div>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-emerald-300 hover:text-white p-1.5 rounded-lg hover:bg-emerald-800/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs text-slate-700 space-y-4 leading-relaxed">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 font-medium">
                Kalkulasi Paperbag mencakup 3 ukuran standar: 14x12x9 cm (Kecil), 15x20x10 cm (Sedang), dan 23x30x11 cm (Besar) berbahan Art Carton 230 gsm.
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">1. Kebutuhan Kertas Plano</h4>
                <p>
                  Satu tas paperbag terdiri dari 2 lembar potongan sisi. Rumus plano:<br />
                  <code>Kebutuhan Plano = CEIL((2 × Oplah / Yield_Potong) + (Insheet / Yield_Potong))</code>
                </p>
                <p className="text-slate-500 mt-0.5">
                  14x12x9: 6 potong (3 tas)/plano.<br />
                  15x20x10: 6 potong (3 tas)/plano.<br />
                  23x30x11: 4 potong (2 tas)/plano.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">2. Alur Mesin & Finishing Assembly</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Oplah 100 s/d 2.500 pcs:</strong> Oliver 58 / 52 (4 plat @ Rp 45.000, min cetak 4x Rp 90.000).</li>
                  <li><strong>Oplah ≥ 3.000 pcs:</strong> Heidelberg SM 52 / SM 72 (4 plat @ Rp 78.000, min cetak 4x Rp 310.000).</li>
                  <li><strong>Finishing Assembly:</strong> Pond Die Cut + Double Tape + Pasang Tali Kur 2 Sisi + Lipat Bentuk Tas + Packing Kardus.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">3. Formula Harga Jual & Nego</h4>
                <p>
                  <code>Harga Jual = CEIL(HPP × (1 + Margin/100) / 100) × 100</code> (Default Margin 30%)<br />
                  <code>Harga Nego = CEIL(Harga × (1 - Nego/100) / 100) × 100</code> (Default Nego 5%)
                </p>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowManualModal(false)}
                className="px-4 py-1.5 bg-emerald-800 text-white font-bold rounded-lg hover:bg-emerald-900 transition-all cursor-pointer text-xs"
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
