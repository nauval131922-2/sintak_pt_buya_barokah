'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Layers,
  Printer,
  FileText,
  Box,
} from 'lucide-react';
import {
  DEFAULT_NOTA_PARAMS,
  NotaMasterParams,
} from '@/lib/nota-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface NotaMasterParameterProps {
  customParams: NotaMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<NotaMasterParams>>;
}

const NOTA_VISIBLE_KEYS: (keyof NotaMasterParams)[] = [
  'tarifNcrTopRim',
  'tarifNcrMiddleRim',
  'tarifNcrBottomRim',
  'tarifPlatRyobi',
  'minOngkosCetakRyobi',
  'tarifDrekOverRyobi',
  'tarifDesainNota',
  'tarifKertasSamson',
  'tarifKertasBoard',
  'tarifSusunKomplit',
  'tarifStaplesNota',
  'tarifLemNgetruk',
  'tarifPorporasiPerRim',
  'tarifNomoratorPerRim',
];

export default function NotaMasterParameter({
  customParams,
  setCustomParams,
}: NotaMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof NotaMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof NotaMasterParams) => {
    return customParams[key] !== DEFAULT_NOTA_PARAMS[key];
  };

  const handleResetField = (key: keyof NotaMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_NOTA_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_NOTA_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(() => {
    return NOTA_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_NOTA_PARAMS[key]);
  }, [customParams]);

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      NOTA_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_NOTA_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Nota dikembalikan ke standar master.');
  };

  const fieldRow = (
    key: keyof NotaMasterParams,
    label: string,
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
          value={customParams[key] as number}
          onValueChange={(v) => handleChange(key, v || 0)}
          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
          prefix={isRupiah ? 'Rp' : undefined}
          suffix={isRupiah ? undefined : '%'}
          allowDecimals={isDecimal}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
      {/* Header Info */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
                Master Parameter Nota 1 Warna
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan harga kertas HVS 70 & NCR 55 (Top/Middle/Bottom), plat & cetak mesin Ryobi, jilid staples, porporasi, dan nomorator.
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
        {/* Card 1: Bahan Kertas NCR Nota */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800">1. Bahan Kertas NCR Nota</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifNcrTopRim', 'NCR Top (Rp/Rim Folio)')}
            {fieldRow('tarifNcrMiddleRim', 'NCR Middle (Rp/Rim Folio)')}
            {fieldRow('tarifNcrBottomRim', 'NCR Bottom (Rp/Rim Folio)')}
          </div>
        </div>

        {/* Card 2: Mesin Cetak Toko / Ryobi */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Mesin Cetak Toko / Ryobi</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifPlatRyobi', 'Plat CTP Ryobi (Rp/plat)')}
            {fieldRow('minOngkosCetakRyobi', 'Ongkos Min Cetak Ryobi (Rp/500 drek)')}
            {fieldRow('tarifDrekOverRyobi', 'Ongkos Drek Over (Rp/drek)')}
            {fieldRow('tarifDesainNota', 'Biaya Desain Setting (Rp)')}
          </div>
        </div>

        {/* Card 3: Ongkos Jilid & Finishing */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Ongkos Jilid & Finishing</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div
              className={`p-2.5 rounded-lg border transition-all ${
                isFieldModified('tarifKertasSamson') || isFieldModified('tarifKertasBoard')
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <label className="text-xs font-semibold text-slate-700 truncate" title="Cover Samson & Board (Rp/Rim)">
                  Cover Samson & Board (Rp/Rim)
                </label>
                {(isFieldModified('tarifKertasSamson') || isFieldModified('tarifKertasBoard')) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleResetField('tarifKertasSamson');
                      handleResetField('tarifKertasBoard');
                    }}
                    className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                    title="Reset ke default"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Def
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <ThousandInput
                  value={customParams.tarifKertasSamson + customParams.tarifKertasBoard}
                  onValueChange={(v) => {
                    handleChange('tarifKertasSamson', Math.round((v || 0) * 0.56));
                    handleChange('tarifKertasBoard', Math.round((v || 0) * 0.44));
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  prefix="Rp"
                />
              </div>
            </div>

            {fieldRow('tarifSusunKomplit', 'Susun Komplit (Rp/Rim)')}

            <div
              className={`p-2.5 rounded-lg border transition-all ${
                isFieldModified('tarifStaplesNota') || isFieldModified('tarifLemNgetruk')
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <label className="text-xs font-semibold text-slate-700 truncate" title="Staples & Lem Ngetruk (Rp/Rim)">
                  Staples & Lem Ngetruk (Rp/Rim)
                </label>
                {(isFieldModified('tarifStaplesNota') || isFieldModified('tarifLemNgetruk')) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleResetField('tarifStaplesNota');
                      handleResetField('tarifLemNgetruk');
                    }}
                    className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                    title="Reset ke default"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Def
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <ThousandInput
                  value={customParams.tarifStaplesNota + customParams.tarifLemNgetruk}
                  onValueChange={(v) => {
                    handleChange('tarifStaplesNota', Math.round((v || 0) * 0.6));
                    handleChange('tarifLemNgetruk', Math.round((v || 0) * 0.4));
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  prefix="Rp"
                />
              </div>
            </div>

            {fieldRow('tarifPorporasiPerRim', 'Porporasi Sobekan (Rp/Rim)')}
            {fieldRow('tarifNomoratorPerRim', 'Nomorator Seri (Rp/Rim)')}
          </div>
        </div>
      </div>

      {/* Modal Manual Pengguna Master Parameter */}
      {showManualModal && (
        <div
          onClick={() => setShowManualModal(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Manual Pengguna & Pemetaan Sumber Excel</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Nota 1 Warna
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
              {/* Bagian 1: Pemetaan 4 Kelompok Master Parameter */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Pemetaan 4 Bagian Master Parameter ke File Excel (Folder 03. Pricelist Nota 1 Warna/*.xlsx)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Poin 1 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan Kertas (HVS 70 & NCR 55)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Kertas HVS 70</strong>: <span className="font-mono text-emerald-700">Master!D12</span> (Rp 15.700/kg, up 7%). Formula: <code className="text-[10px] bg-white px-1 py-0.5 rounded border">(21.5*33*70)/20.000 * 15.700 * 1.07 = Rp 41.716/rim</code>.</li>
                      <li>• <strong>Kertas NCR 55</strong>: Top (Rp 65.500), Middle (Rp 65.500), Bottom (Rp 62.000) dengan presentase up 5% (<span className="font-mono text-emerald-700">Master!E11</span>).</li>
                    </ul>
                  </div>

                  {/* Poin 2 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Mesin Cetak Toko / Ryobi</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Biaya Plat CTP Ryobi</strong>: <span className="font-mono text-blue-700">BUKU!U6</span> (Rp 10.000 / plat).</li>
                      <li>• <strong>Ongkos Cetak Min Order</strong>: <span className="font-mono text-blue-700">BUKU!W6</span> (Rp 15.000 / 500 drek).</li>
                      <li>• <strong>Tarif Drek Over</strong>: <span className="font-mono text-blue-700">BUKU!X6</span> (Rp 30 / drek over).</li>
                      <li>• <strong>Biaya Desain</strong>: <span className="font-mono text-blue-700">Master!D16</span> (Rp 0 / free standard).</li>
                    </ul>
                  </div>

                  {/* Poin 3 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Ongkos Jilid & Perakitan (Per Rim Rangkap)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Kertas Samson Sampul</strong>: <span className="font-mono text-amber-700">BUKU!AF6</span> (Rp 1.600 / rim).</li>
                      <li>• <strong>Kertas Board Alas</strong>: <span className="font-mono text-amber-700">BUKU!AG6</span> (Rp 1.250 / rim).</li>
                      <li>• <strong>Susun Komplit</strong>: <span className="font-mono text-amber-700">BUKU!AH6</span> (Rp 2.500 / rim).</li>
                      <li>• <strong>Staples & Lem Ngetruk</strong>: <span className="font-mono text-amber-700">BUKU!AI6</span> (Rp 1.500) + <span className="font-mono text-amber-700">BUKU!AJ6</span> (Rp 1.000).</li>
                      <li>• <strong>Potong Sisir Sisi</strong>: <span className="font-mono text-amber-700">BUKU!AK6</span> (Rp 5.000 / rim).</li>
                    </ul>
                  </div>

                  {/* Poin 4 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Finishing Porporasi, Nomorator & Margin</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Porporasi Sobekan</strong>: <span className="font-mono text-violet-700">BUKU!AM6</span> (Rp 5.000 / rim rangkap).</li>
                      <li>• <strong>Nomorator Otomatis</strong>: <span className="font-mono text-violet-700">BUKU!AO6</span> (Rp 10.000 / rim rangkap).</li>
                      <li>• <strong>Target Margin Standar</strong>: <span className="font-mono text-violet-700">Master!E19</span> (30%).</li>
                      <li>• <strong>Batas Nego Diskon</strong>: 4% dari harga jual standar.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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
