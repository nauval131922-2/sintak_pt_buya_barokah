'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Printer,
  Scissors,
  Database,
  HelpCircle,
  X,
  FileText,
  Calendar,
} from 'lucide-react';
import {
  KalenderKopMasterParams,
  DEFAULT_KALENDER_KOP_PARAMS,
} from '@/lib/kalender-kop-calculator';

interface Props {
  customParams: KalenderKopMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<KalenderKopMasterParams>>;
}

export default function KalenderKopMasterParameter({
  customParams,
  setCustomParams,
}: Props) {
  const [showManualModal, setShowManualModal] = useState(false);

  const isFieldModified = (key: keyof KalenderKopMasterParams) => {
    return customParams[key] !== DEFAULT_KALENDER_KOP_PARAMS[key];
  };

  const isModified = Object.keys(DEFAULT_KALENDER_KOP_PARAMS).some((k) =>
    isFieldModified(k as keyof KalenderKopMasterParams)
  );

  const handleResetField = (key: keyof KalenderKopMasterParams) => {
    setCustomParams((prev) => ({
      ...prev,
      [key]: DEFAULT_KALENDER_KOP_PARAMS[key],
    }));
  };

  const handleResetAll = () => {
    setCustomParams(DEFAULT_KALENDER_KOP_PARAMS);
  };

  const handleChange = (
    key: keyof KalenderKopMasterParams,
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
    key: keyof KalenderKopMasterParams,
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
              ? `Rp ${DEFAULT_KALENDER_KOP_PARAMS[key].toLocaleString('id-ID')}`
              : `${DEFAULT_KALENDER_KOP_PARAMS[key]}${key.includes('Pct') ? '%' : ''}`}
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
            <Calendar size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-800 text-sm sm:text-base">
                Master Parameter Kalender Kop
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Katalog 27
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tarif blanko kalender 6 lembar AP 120 gsm, ongkos cetak kop per warna, klem seng, dan batas nego.
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
        {/* Card 1: Blanko & Desain Kop */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText size={15} className="text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Blanko Kalender &amp; Desain Kop
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifBlankoKalender6Lbr', 'Blanko Kalender 6 Lbr (Rp/eks)', true)}
            {fieldRow('tarifDesainKop', 'Desain Kop Kalender (Rp/order)', true)}
          </div>
          <p className="text-[10px] text-slate-500">
            Blanko Kalender Dwi Wulan (6 lembar) Art Paper 120 gsm ukuran 32 × 48 cm.
          </p>
        </div>

        {/* Card 2: Ongkos Cetak Kop per Warna */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer size={15} className="text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Ongkos Cetak Kop per Warna
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifCetakKop1Warna', 'Cetak Kop 1 Warna (Rp/eks)', true)}
            {fieldRow('tarifCetakKop2Warna', 'Cetak Kop 2 Warna (Rp/eks)', true)}
            {fieldRow('tarifCetakKop3Warna', 'Cetak Kop 3 Warna (Rp/eks)', true)}
            {fieldRow('tarifCetakKop4Warna', 'Cetak Kop 4 Warna (Rp/eks)', true)}
          </div>
          <p className="text-[10px] text-slate-500">
            Cetak sablon / offset header kop instansi pada blanko kalender.
          </p>
        </div>

        {/* Card 3: Finishing Jilid Klem Seng & Packing */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Scissors size={15} className="text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Finishing Jilid Klem &amp; Packing
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifKlemSeng', 'Jilid Klem Seng (Rp/eks)', true)}
            {fieldRow('tarifPackingKardus', 'Packing Kardus (Rp/box)', true)}
          </div>
          <p className="text-[10px] text-slate-500">
            Jilid jepit kaleng / klem seng 32 cm + packing kardus tebal.
          </p>
        </div>

        {/* Card 4: Margin & Nego Standar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Database size={15} className="text-blue-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              4. Margin &amp; Nego Standar
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('marginDefaultPct', 'Margin Tambahan (%)', false)}
            {fieldRow('negoDefaultPct', 'Batas Nego (%)', false)}
          </div>
          <p className="text-[10px] text-slate-500">
            Harga penawaran standar = ROUNDUP(HPP, -2). Batas nego marketing 4%.
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
                  <h3 className="font-bold text-base">Panduan Parameter Kalender Kop</h3>
                  <p className="text-xs text-emerald-200">Referensi: Pricelist Kalender Kop.xlsx</p>
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
                  Spesifikasi Kalender Kop
                </h5>
                <p>
                  Kalender Dinding Blanko Dwi Wulan (6 Lembar) Art Paper 120 gsm ukuran 32 × 48 cm.
                  Cetak sablon / offset header kop instansi, lembaga, atau perusahaan (1 s/d 4 Warna).
                  Jilid Klem Seng / Jepit Kaleng atas + packing rapi.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Printer size={14} className="text-emerald-600" />
                  Varian Jumlah Warna Kop
                </h5>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li><strong>1 Warna</strong>: Kop 1 warna cetak (hitam / biru / merah / hijau).</li>
                  <li><strong>2 Warna</strong>: Kop 2 warna kombinasi.</li>
                  <li><strong>3 Warna</strong>: Kop 3 warna logo &amp; teks.</li>
                  <li><strong>4 Warna (Full Colour)</strong>: Kop separasi warna lengkap / foto.</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Database size={14} className="text-emerald-600" />
                  Kebijakan Margin &amp; Nego
                </h5>
                <p>
                  Formula harga jual resmi: <code>Harga = ROUNDUP(HPP, -2)</code>.
                  Batas nego marketing: <code>Nego = ROUNDUP(Harga × 96%, -2)</code> (Diskon 4%).
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
