'use client';

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
  Bookmark,
} from 'lucide-react';
import {
  BukuHardCover145x2025MasterParams,
  DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS,
} from '@/lib/buku-hard-cover-145x2025-calculator';

interface Props {
  customParams: BukuHardCover145x2025MasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<BukuHardCover145x2025MasterParams>>;
}

export default function BukuHardCover145x2025MasterParameter({
  customParams,
  setCustomParams,
}: Props) {
  const [showManualModal, setShowManualModal] = useState(false);

  const isFieldModified = (key: keyof BukuHardCover145x2025MasterParams) => {
    return customParams[key] !== DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS[key];
  };

  const isModified = Object.keys(DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS).some((k) =>
    isFieldModified(k as keyof BukuHardCover145x2025MasterParams)
  );

  const handleResetField = (key: keyof BukuHardCover145x2025MasterParams) => {
    setCustomParams((prev) => ({
      ...prev,
      [key]: DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS[key],
    }));
  };

  const handleResetAll = () => {
    setCustomParams(DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS);
  };

  const handleChange = (
    key: keyof BukuHardCover145x2025MasterParams,
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
    key: keyof BukuHardCover145x2025MasterParams,
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
              ? `Rp ${DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS[key].toLocaleString('id-ID')}`
              : `${DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS[key]}${key.includes('Pct') ? '%' : ''}`}
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
            <Bookmark size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-800 text-sm sm:text-base">
                Master Parameter Buku Hard Cover 14,5×20,25 cm
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Katalog 25
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tarif bahan, board casing, mesin bertingkat (Print, Ryobi, Oliver, SM), dan jilid Hard Cover 14,5×20,25 cm.
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
        {/* Card 1: Cover, Board & Casing Hard Cover */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer size={15} className="text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Cover, Board &amp; Casing Hard Cover
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifPrintCoverA3', 'Print Cover A3+ (Rp/lbr)', true)}
            {fieldRow('tarifKertasAp150Kg', 'Kertas AP 150 / kg (Rp)', true)}
            {fieldRow('tarifDesainCover', 'Desain Cover (Rp/order)', true)}
            {fieldRow('tarifBoardPerPcs', 'Bahan Board No. 30/40 (Rp/pcs)', true, true)}
            {fieldRow('tarifJasaHardCover', 'Jasa Hard Cover (Rp/pcs)', true, true)}
            {fieldRow('tarifRoundingCover', 'Rounding Cover (Rp/pcs)', true, true)}
            {fieldRow('tarifKertasAc230Kg', 'Skiblat AC 230 / kg (Rp)', true)}
          </div>
          <p className="text-[10px] text-slate-500">
            Hard Cover AP 150 gsm 1 Muka Full Colour + Board tebal + Skiblat AC 230 polos.
          </p>
        </div>

        {/* Card 2: Isi & Mesin Cetak Isi */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers size={15} className="text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Isi &amp; Mesin Cetak Isi (100 Hal)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifKertasHvs70Kg', 'Kertas HVS 70 / kg (Rp)', true)}
            {fieldRow('tarifDesainIsi', 'Desain Isi 100 Hal (Rp)', true)}
            {fieldRow('tarifPrintIsiPerLbr', 'Print Isi Buya (Rp/lbr)', true)}
            {fieldRow('tarifPlateIsiRyobi', 'Plat Isi Ryobi (Rp/plat)', true)}
            {fieldRow('minOngkosIsiRyobi', 'Min Cetak Ryobi (Rp/plat)', true)}
            {fieldRow('tarifPlateIsiOliver', 'Plat Isi Oliver (Rp/plat)', true)}
            {fieldRow('minOngkosIsiOliver', 'Min Cetak Oliver (Rp/plat)', true)}
            {fieldRow('drekIsiOliver', 'Drek Over Oliver (Rp/drek)', true)}
          </div>
          <p className="text-[10px] text-slate-500">
            Print (50–250 pcs), Ryobi (300–500 pcs), Oliver (600–2500 pcs), Heidelberg SM 52 (≥3000 pcs).
          </p>
        </div>

        {/* Card 3: Finishing Jilid & Casing In */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Scissors size={15} className="text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Finishing Jilid &amp; Casing In
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifJahitBenang', 'Jahit Benang Isi (Rp/pcs)', true, true)}
            {fieldRow('tarifLemPressSkiblat', 'Lem Press Skiblat (Rp/pcs)', true, true)}
            {fieldRow('tarifCasingIn', 'Jasa Casing In (Rp/pcs)', true, true)}
            {fieldRow('tarifHeadband', 'Headband (Rp/pcs)', true, true)}
            {fieldRow('tarifPitaPembatas', 'Pita Pembatas (Rp/pcs)', true, true)}
            {fieldRow('tarifCraftPunggung', 'Craft Punggung (Rp/pcs)', true, true)}
            {fieldRow('tarifPilung', 'Pilung (Rp/pcs)', true, true)}
            {fieldRow('tarifSisirPcs', 'Sisir (Rp/pcs)', true)}
            {fieldRow('tarifKardusBox', 'Kardus Box (Rp/box)', true)}
          </div>
          <p className="text-[10px] text-slate-500">
            Lipat, susun, jahit benang, lem press, headband, pita, pilung, casing in, dan packing kardus @ 50 pcs.
          </p>
        </div>

        {/* Card 4: Laminasi & Margin Standar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Database size={15} className="text-blue-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              4. Laminasi &amp; Margin Standar
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifLaminasiGlossyCm2', 'Laminasi Glossy (Rp/cm²)', false, true)}
            {fieldRow('tarifLaminasiDoffCm2', 'Laminasi Doff (Rp/cm²)', false, true)}
            {fieldRow('minLaminasi', 'Min Laminasi (Rp/order)', true)}
            {fieldRow('marginDefaultPct', 'Margin Default (%)', false)}
            {fieldRow('negoDefaultPct', 'Nego Default (%)', false)}
          </div>
          <p className="text-[10px] text-slate-500">
            Luas cover terbuka: 30,5 × 21,75 cm = ~663 cm². Margin standar 30%, Nego 5%.
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
                  <h3 className="font-bold text-base">Panduan Parameter Buku Hard Cover 14,5×20,25 cm</h3>
                  <p className="text-xs text-emerald-200">Referensi: Pricelist Buku Hard Cover 14,5 x 20,25 cm.xlsx</p>
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
                  Spesifikasi Standar Buku Hard Cover
                </h5>
                <p>
                  Ukuran tertutup 14,5 × 20,25 cm. Cover Hard Cover Art Paper 150 gsm 1 Muka Full Colour + Board tebal No. 30/40.
                  Skiblat Art Carton 230 gsm polos. Isi HVS 70 gsm 1 Warna Bolak-Balik 100 Halaman (25 Lembar).
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Printer size={14} className="text-emerald-600" />
                  Alur Mesin Cetak Berdasarkan Oplah
                </h5>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li><strong>Oplah 50–250 pcs</strong>: Cover Print Inter A3+ + Isi Print Buya A4</li>
                  <li><strong>Oplah 300–500 pcs</strong>: Cover Print Inter A3+ + Isi Ryobi Offset 1W</li>
                  <li><strong>Oplah 600–2500 pcs</strong>: Cover Oliver Offset 4W + Isi Oliver Offset 1W</li>
                  <li><strong>Oplah 3000–5000 pcs</strong>: Cover Oliver Offset 4W + Isi Heidelberg Speedmaster 52</li>
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
