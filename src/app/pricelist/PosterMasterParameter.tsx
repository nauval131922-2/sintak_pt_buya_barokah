'use client';

import { toast } from '@/lib/toast';

import React, { useState } from 'react';
import {
  RotateCcw,
  Printer,
  Layers,
  Scissors,
  Database,
  HelpCircle,
  X,
  FileText,
  Image,
} from 'lucide-react';
import {
  PosterMasterParams,
  DEFAULT_POSTER_PARAMS,
} from '@/lib/poster-calculator';

interface Props {
  customParams: PosterMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<PosterMasterParams>>;
}

const POSTER_VISIBLE_KEYS: (keyof PosterMasterParams)[] = [
  'marginDefaultPct',
  'minLaminasi',
  'negoDefaultPct',
  'oliverDrekOver',
  'oliverMinOngkos',
  'oliverPlatUnit',
  'smDrekOver',
  'smMinOngkos',
  'smPlatUnit',
  'tarifArtCarton230Kg',
  'tarifKardusBox',
  'tarifLakbanRoll',
  'tarifLaminasiDoffCm2',
  'tarifLaminasiGlossyCm2',
  'tarifPrintA3',
  'tarifSisirPcs',
  'tarifUvVarnishCm2',
  'upKertasPct',
];

export default function PosterMasterParameter({
  customParams,
  setCustomParams,
}: Props) {
  const [showManualModal, setShowManualModal] = useState(false);

  const isFieldModified = (key: keyof PosterMasterParams) => {
    return customParams[key] !== DEFAULT_POSTER_PARAMS[key];
  };

  const isModified = React.useMemo(
    () => POSTER_VISIBLE_KEYS.some((k) => customParams[k] !== DEFAULT_POSTER_PARAMS[k]),
    [customParams]
  );

  const handleResetField = (key: keyof PosterMasterParams) => {
    setCustomParams((prev) => ({
      ...prev,
      [key]: DEFAULT_POSTER_PARAMS[key],
    }));
  };

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      POSTER_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_POSTER_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter dikembalikan ke nilai default.');
  };

  const handleChange = (
    key: keyof PosterMasterParams,
    value: string,
    isFloat = false
  ) => {
    const parsed = isFloat ? parseFloat(value) : parseInt(value, 10);
    setCustomParams((prev) => ({
      ...prev,
      [key]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  const fieldRow = (
    key: keyof PosterMasterParams,
    label: string,
    isCurrency = true,
    isFloat = false
  ) => {
    const modified = isFieldModified(key);
    const val = customParams[key];

    return (
      <div
        className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
          modified
            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
            : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
        }`}
      >
        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-xs font-semibold text-slate-700 truncate">{label}</span>
          <span className="text-[10px] text-slate-400">
            Def:{' '}
            {isCurrency
              ? `Rp ${DEFAULT_POSTER_PARAMS[key].toLocaleString('id-ID')}`
              : `${DEFAULT_POSTER_PARAMS[key]}${key.includes('Pct') ? '%' : ''}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            {isCurrency && (
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">
                Rp
              </span>
            )}
            <input
              type="number"
              step={isFloat ? '0.01' : '1'}
              value={val === 0 ? '' : val}
              placeholder="0"
              onChange={(e) => handleChange(key, e.target.value, isFloat)}
              className={`w-28 text-right text-xs font-bold py-1.5 rounded-lg border outline-hidden transition-all ${
                isCurrency ? 'pl-7 pr-2' : 'px-2'
              } ${
                modified
                  ? 'border-amber-400 bg-white text-amber-900 focus:ring-2 focus:ring-amber-400'
                  : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
              }`}
            />
            {!isCurrency && key.includes('Pct') && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                %
              </span>
            )}
          </div>

          {modified && (
            <button
              type="button"
              onClick={() => handleResetField(key)}
              title="Reset ke default"
              className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header Info Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100/80 rounded-xl border border-emerald-200 text-emerald-800 shrink-0">
            <Image size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-800 text-sm sm:text-base">
                Master Parameter Poster
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Katalog 19 / 21
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tarif bahan Art Carton 230, mesin bertingkat (Print, Oliver, Heidelberg SM), dan laminasi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
          >
            <HelpCircle size={14} className="text-emerald-600" />
            <span>Panduan Parameter</span>
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

      {isModified && (
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
          <Database size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Ada parameter yang dimodifikasi</strong> dari nilai default. Baris berwarna oranye menunjukkan perubahan aktif.
          </span>
        </div>
      )}

      {/* Grid 2 Kolom Standar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Bahan Kertas & Print Digital */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText size={15} className="text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Kertas &amp; Print Digital (A3+)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifArtCarton230Kg', 'Kertas AC 230 / kg (Rp)', true)}
            {fieldRow('upKertasPct', 'Up/PPN Kertas (%)', false)}
            {fieldRow('tarifPrintA3', 'Print Inter A3+ (Rp/lbr)', true)}
            {fieldRow('tarifSisirPcs', 'Ongkos Potong/Sisir (Rp/pcs)', true)}
            {fieldRow('tarifKardusBox', 'Kardus Box (Rp/box)', true)}
            {fieldRow('tarifLakbanRoll', 'Lakban Roll (Rp/roll)', true)}
          </div>
          <p className="text-[10px] text-slate-500">
            Kertas dasar Art Carton 230 gsm 1 Muka Full Colour.
          </p>
        </div>

        {/* Card 2: Mesin Cetak Offset (Oliver & SM) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer size={15} className="text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Mesin Offset (Oliver &amp; SM 52/72)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('oliverPlatUnit', 'Plat CTP Oliver (Rp/plat)', true)}
            {fieldRow('oliverMinOngkos', 'Min Cetak Oliver (Rp/plat)', true)}
            {fieldRow('oliverDrekOver', 'Drek Over Oliver (Rp/drek)', true)}
            {fieldRow('smPlatUnit', 'Plat CTP SM 52 (Rp/plat)', true)}
            {fieldRow('smMinOngkos', 'Min Cetak SM 52 (Rp/plat)', true)}
            {fieldRow('smDrekOver', 'Drek Over SM 52 (Rp/drek)', true)}
          </div>
          <p className="text-[10px] text-slate-500">
            Oliver 4W untuk ukuran 32×48 &amp; 48×64 cm. Heidelberg SM untuk ukuran besar / oplah tinggi.
          </p>
        </div>

        {/* Card 3: Finishing Laminasi & UV */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers size={15} className="text-blue-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Finishing Laminasi &amp; UV
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifLaminasiGlossyCm2', 'Laminasi Glossy (Rp/cm²)', false, true)}
            {fieldRow('tarifLaminasiDoffCm2', 'Laminasi Doff (Rp/cm²)', false, true)}
            {fieldRow('tarifUvVarnishCm2', 'UV Varnish (Rp/cm²)', false, true)}
            {fieldRow('minLaminasi', 'Min Laminasi (Rp/order)', true)}
          </div>
          <p className="text-[10px] text-slate-500">
            Laminasi dihitung berdasarkan luas poster terbuka (cm²).
          </p>
        </div>

        {/* Card 4: Margin & Nego Standar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Database size={15} className="text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              4. Margin &amp; Nego Standar
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('marginDefaultPct', 'Margin Default (%)', false)}
            {fieldRow('negoDefaultPct', 'Nego Default (%)', false)}
          </div>
          <p className="text-[10px] text-slate-500">
            Harga Jual = ROUNDUP(HPP × 130%, -2), Nego = ROUNDUP(Harga × 95%, -2).
          </p>
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
                  <Database size={18} className="text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Panduan Parameter Poster</h3>
                  <p className="text-xs text-emerald-200">Referensi: Pricelist Poster.xlsx</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/60 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText size={14} className="text-emerald-600" />
                  Spesifikasi Standar Poster
                </h5>
                <p>
                  Bahan: Art Carton 230 gsm 1 Muka Full Colour. Tersedia 4 ukuran: 32×48 cm, 48×64 cm, 50×70 cm, dan 70×100 cm.
                  Finishing potong lurus / sisir + packing kardus tebal.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Printer size={14} className="text-emerald-600" />
                  Alur Mesin Cetak Berdasarkan Ukuran &amp; Oplah
                </h5>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li><strong>32 × 48 cm</strong>: Print Inter A3+ (100–500 pcs) / Oliver Offset 4W (600–2000 pcs)</li>
                  <li><strong>48 × 64 cm</strong>: Oliver Offset 4W (300–3000 pcs) / Heidelberg SM 52 (3500–5000 pcs)</li>
                  <li><strong>50 × 70 cm</strong>: Heidelberg SM 52 (1000–10000 pcs)</li>
                  <li><strong>70 × 100 cm</strong>: Heidelberg SM 72/102 (1000–10000 pcs)</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Database size={14} className="text-emerald-600" />
                  Kebijakan Margin &amp; Nego
                </h5>
                <p>
                  Formula harga jual resmi: <code>Harga = ROUNDUP(HPP × 130%, -2)</code> (Margin 30%).
                  Batas nego marketing: <code>Nego = ROUNDUP(Harga × 95%, -2)</code> (Diskon 5%).
                </p>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
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
