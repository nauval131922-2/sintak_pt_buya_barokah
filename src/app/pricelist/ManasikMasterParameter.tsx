'use client';

import React, { useState } from 'react';
import {
  Database,
  BookOpen,
  RotateCcw,
  Sparkles,
  X,
  Sliders,
  Layers,
  Printer,
  FileText,
  Box,
} from 'lucide-react';
import {
  DEFAULT_MANASIK_PARAMS,
  ManasikMasterParams,
} from '@/lib/manasik-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface ManasikMasterParameterProps {
  customParams: ManasikMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<ManasikMasterParams>>;
}

const MANASIK_VISIBLE_KEYS: (keyof ManasikMasterParams)[] = [
  'hargaIsiKosongan96',
  'hargaIsiKosongan128',
  'hargaIsiKosongan192',
  'hargaIsiKosongan208',
  'tarifPrintCoverA3',
  'tarifPrintMiniTikTokA3',
  'tarifDesainCover',
  'tarifDesainMiniTikTok',
  'insheetCover',
  'tarifKertasHvs70Kg',
  'tarifPrintSisipanA3',
  'tarifPrintBuyaPerLbr',
  'insheetIsiBuya',
  'insheetIsiRyobi',
  'insheetIsiOliver',
  'ryobiPlatUnitIsi',
  'oliverPlatUnitIsi',
  'tarifBendingPerCm2',
  'tarifLubangBor',
  'tarifPasangTali',
  'tarifStaplesPalu',
  'tarifCasingIn',
  'jasaPlastikOpp',
  'tarifTaliCocardMini',
  'tarifRingBinderMini',
  'tarifPlastikZiplockMini',
  'tarifPisauPoundMini',
];

export default function ManasikMasterParameter({
  customParams,
  setCustomParams,
}: ManasikMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);
  const handleChange = (key: keyof ManasikMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof ManasikMasterParams) => {
    return (customParams[key] ?? DEFAULT_MANASIK_PARAMS[key]) !== DEFAULT_MANASIK_PARAMS[key];
  };

  const handleResetField = (key: keyof ManasikMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_MANASIK_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_MANASIK_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(() => {
    return MANASIK_VISIBLE_KEYS.some(
      (key) => (customParams[key] ?? DEFAULT_MANASIK_PARAMS[key]) !== DEFAULT_MANASIK_PARAMS[key]
    );
  }, [customParams]);

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_MANASIK_PARAMS });
    toast.success('Semua parameter Buku Manasik dikembalikan ke standar master 2026.');
  };

  const fieldRow = (
    key: keyof ManasikMasterParams,
    label: string,
    isRupiah = true,
    isDecimal = false,
    badge?: string,
    badgeColor: 'emerald' | 'amber' | 'blue' | 'purple' | 'cyan' | 'slate' = 'slate'
  ) => {
    const badgeBg = {
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      slate: 'bg-slate-100 text-slate-600 border-slate-200',
    }[badgeColor];

    const rawVal = customParams[key] ?? DEFAULT_MANASIK_PARAMS[key];
    const val = typeof rawVal === 'number' ? rawVal : 0;

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
          <div className="flex items-center gap-1 shrink-0">
            {badge && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeBg}`}>
                {badge}
              </span>
            )}
            {isFieldModified(key) && (
              <button
                type="button"
                onClick={() => handleResetField(key)}
                className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer"
                title="Reset ke default"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Def
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isRupiah ? (
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
      {/* Header Info */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
                Master Parameter Buku Manasik Haji / Umroh
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan harga blok kosongan (96–208 hal), bahan cover AC, ongkos jilid bending & tali cocard.
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

      {/* Grid Parameter: Dikelompokkan Presisi Sesuai 3 Model / Varian Produk (Urutan: Kosongan -> Custom Cover -> Cocard) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Varian 1: Kosongan (10 x 15,5 cm) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold text-slate-800">1. Kosongan (10 x 15,5 cm)</h3>
            </div>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              Varian 1
            </span>
          </div>

          {/* Sub: Bahan Baku Kertas */}
          <div>
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Bahan Baku Kertas:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {fieldRow('tarifKertasHvs70Kg', 'Kertas HVS 70 gsm / Kg', true, false, 'Folio HVS', 'emerald')}
            </div>
          </div>

          {/* Sub: Insheet Toleransi Mesin */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Insheet Kertas Cetak Isi (Toleransi):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {fieldRow('insheetIsiBuya', 'Insheet Buya', false, false, 'Print Buya', 'amber')}
              {fieldRow('insheetIsiRyobi', 'Insheet Ryobi', false, false, 'Ryobi', 'cyan')}
              {fieldRow('insheetIsiOliver', 'Insheet Oliver', false, false, 'Oliver', 'purple')}
            </div>
          </div>

          {/* Sub: Ongkos Cetak & Plat Mesin */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Ongkos Cetak & Plat CTP Mesin:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fieldRow('tarifPrintBuyaPerLbr', 'Cetak Print Buya', true, false, 'Rp/lbr', 'amber')}
              {fieldRow('ryobiPlatUnitIsi', 'Plat CTP Ryobi Isi', true, false, 'Rp/plat', 'cyan')}
              {fieldRow('oliverPlatUnitIsi', 'Plat CTP Oliver Isi', true, false, 'Rp/plat', 'purple')}
              {fieldRow('tarifSpiralManasik', 'Spiral Kawat Alternatif', true, false, 'Spiral', 'cyan')}
            </div>
          </div>
        </div>

        {/* Varian 2: Custom Cover (10 x 15,5 cm) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800">2. Custom Cover (10 x 15,5 cm)</h3>
            </div>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              Varian 2
            </span>
          </div>

          {/* Sub: Harga Isi Kosongan */}
          <div>
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Harga Isi Kosongan (per Buku):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fieldRow('hargaIsiKosongan208', 'Isi 212 Hal (2026)', true, false, '212 Hal', 'emerald')}
              {fieldRow('hargaIsiKosongan192', 'Isi 192 Hal (Lama)', true, false, '192 Hal', 'slate')}
              {fieldRow('hargaIsiKosongan128', 'Isi 128 Hal', true, false, '128 Hal', 'slate')}
              {fieldRow('hargaIsiKosongan96', 'Isi 96 Hal', true, false, '96 Hal', 'slate')}
            </div>
          </div>

          {/* Sub: Cetak Cover & Sisipan */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Cetak Cover & Sisipan PT:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {fieldRow('tarifPrintCoverA3', 'Print Digital Cover A3+', true, false, 'AC 230 POD', 'blue')}
              {fieldRow('tarifPrintSisipanA3', 'Print Sisipan PT A3+', true, false, 'Sisipan PT', 'blue')}
              {fieldRow('tarifDesainCover', 'Jasa Desain Cover', true, false, 'Cover Baru', 'blue')}
              {fieldRow('insheetCover', 'Insheet Print Digital', false, false, 'lbr A3+', 'amber')}
            </div>
          </div>

          {/* Sub: Cover Offset Oliver */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Cover Offset Oliver (Plano 79x109):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fieldRow('oliverPlatUnitCover', 'Plat CTP Oliver', true, false, 'Rp/plat', 'purple')}
              {fieldRow('oliverMinOngkosCover', 'Min. Cetak Oliver', true, false, '4 Plat', 'emerald')}
              {fieldRow('oliverDrekOverCover', 'Tarif Drek Over', true, false, 'Rp/drek', 'slate')}
              {fieldRow('insheetOffsetCover', 'Insheet Cover Oliver', false, false, 'plano', 'amber')}
            </div>
          </div>

          {/* Sub: Jilid & Tali Kur */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Jilid Staples, Tali & Finishing:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fieldRow('tarifTaliKurPerPcs', 'Bahan Tali Kur', true, false, 'Rp/pcs', 'amber')}
              {fieldRow('tarifPasangTali', 'Jasa Pasang Tali', true, false, 'Rp/pcs', 'amber')}
              {fieldRow('tarifLubangBor', 'Lubang Bor Mata Ayam', true, false, 'Rp/pcs', 'blue')}
              {fieldRow('tarifBendingPerCm2', 'Tarif Lem Panas', true, false, 'Bending', 'emerald')}
            </div>
          </div>
        </div>

        {/* Varian 3: Cocard Mini TikTok (6,3 x 10,3 cm) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-800">3. Cocard Mini TikTok (6,3 x 10,3 cm)</h3>
            </div>
            <span className="text-[10px] font-bold bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
              Varian 3
            </span>
          </div>

          {/* Sub: Bahan Cetak & Desain Cocard */}
          <div>
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Print Digital Cocard (A3+ 2 Muka):
            </span>
            <div className="grid grid-cols-1 gap-2">
              {fieldRow('tarifPrintMiniTikTokA3', 'Print Cocard AC 310 A3+', true, false, '20 Kartu/A3+', 'purple')}
              {fieldRow('tarifDesainMiniTikTok', 'Jasa Desain Cocard', true, false, 'Rp/order', 'purple')}
            </div>
          </div>

          {/* Sub: Cetak Offset Oliver Cocard */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Cetak Offset Oliver (Plano 79x109 AC 310):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fieldRow('oliverPlatUnitCover', 'Plat CTP Oliver (2 Muka)', true, false, '8 Plat CTP', 'purple')}
              {fieldRow('oliverMinOngkosCover', 'Min. Cetak Oliver', true, false, 'Rp/order', 'emerald')}
              {fieldRow('oliverDrekOverCover', 'Tarif Drek Over', true, false, 'Rp/drek', 'slate')}
              {fieldRow('insheetOffsetCover', 'Insheet Toleransi', false, false, 'plano', 'amber')}
            </div>
          </div>

          {/* Sub: Aksesoris & Perlengkapan Cocard */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Aksesoris & Perlengkapan Cocard:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fieldRow('tarifRingBinderMini', 'Ring Binder 3cm', true, false, 'Rp/pcs', 'purple')}
              {fieldRow('tarifTaliCocardMini', 'Tali Cocard Mini', true, false, 'Rp/pcs', 'purple')}
              {fieldRow('tarifPlastikZiplockMini', 'Plastik Ziplock', true, false, 'Rp/pcs', 'purple')}
              {fieldRow('tarifPisauPoundMini', 'Pisau Pond Custom', true, false, 'Rp/order', 'purple')}
            </div>
          </div>
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
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Manual Pengguna & Pemetaan Sumber Excel</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Buku Manasik
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
              {/* Bagian 1: Pemetaan 3 Varian Master File Excel */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Pemetaan 3 File Master Excel Buku Manasik (Katalog 02020107)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                    <span className="font-bold text-amber-950 text-xs block">1. Kosongan 10 x 15,5 cm</span>
                    <p className="text-[10.5px] text-amber-900 leading-snug">
                      <strong>File:</strong> <code>02020107 BUKU, KITAB SOFT COVER UK. 10 x 15,5 - BUKU MANASIK - Kosongan.xlsm</code><br />
                      <strong>Sheet:</strong> <span className="font-mono font-semibold">Master</span>, <span className="font-mono font-semibold">BUKU</span>, <span className="font-mono font-semibold">HARGA 2026</span>.<br />
                      <strong>Spesifikasi:</strong> Blok isi 212 Hal HVS 70 gsm (Rp 15.700/kg) cetak mesin Print Buya (Rp 350/lbr), Ryobi (Plat CTP), atau Oliver + lipat kuras + susun urut + lem panas bending + kardus master. Margin default 0% (HPP Netto).
                    </p>
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1.5">
                    <span className="font-bold text-emerald-950 text-xs block">2. Custom Cover 10 x 15,5 cm</span>
                    <p className="text-[10.5px] text-emerald-900 leading-snug">
                      <strong>File:</strong> <code>02020107 BUKU, KITAB SOFT COVER UK. 10 x 15,5 - BUKU MANASIK - Custom Cover 2026.xlsm</code><br />
                      <strong>Sheet:</strong> <span className="font-mono font-semibold">Master</span>, <span className="font-mono font-semibold">BUKU</span>, <span className="font-mono font-semibold">HARGA FILE BARU</span>.<br />
                      <strong>Spesifikasi:</strong> Cover AC 230 Print Digital (Rp 2.700) / Mesin Oliver (Plano 79x109) + Sisipan 4 hal PT (Rp 350 + Rp 225,49) + Blok isi 212 hal (Rp 3.620) + Staples kawat + Casing In + Bor + Tali Kur (Rp 285,71 + Rp 112,74) + OPP + Kardus.
                    </p>
                  </div>
                  <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 space-y-1.5">
                    <span className="font-bold text-purple-950 text-xs block">3. Cocard 6,3 x 10,3 cm</span>
                    <p className="text-[10.5px] text-purple-900 leading-snug">
                      <strong>File:</strong> <code>02020107 BUKU, KITAB SOFT COVER UK. 6,3 x 10,3 - BUKU MANASIK MINI TIKTOK.xlsm</code><br />
                      <strong>Sheet:</strong> <span className="font-mono font-semibold">Master</span> & <span className="font-mono font-semibold">BUKU</span>.<br />
                      <strong>Spesifikasi:</strong> AC 310 gsm (Rp 33.500/kg) bolak-balik (48 hal / 24 kartu) Print Digital A3+ (20 kartu/lbr) / Oliver (150 plano) + Pisau Pond Custom (Rp 258.595) + Jasa Pond + Ring Binder 3cm (Rp 925) + Tali cocard (Rp 2.500) + Ziplock (Rp 465) + Margin 32%.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Rincian 3 Kolom Varian Parameter Master */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                  Rincian Rumus & Komponen Parameter per Varian
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Poin 1: Kosongan */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>1. Parameter Kosongan 10 x 15,5</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Kertas HVS 70 gsm</strong>: <span className="font-mono text-amber-700">Kosongan!Master!D22</span> = Rp 15.700 / kg.</li>
                      <li>• <strong>Insheet Toleransi</strong>: Print Buya (5 lbr), Ryobi (100 lbr), Oliver (200 lbr plano).</li>
                      <li>• <strong>Ongkos Cetak Print Buya</strong>: <span className="font-mono text-amber-700">BUKU!AL6</span> = Rp 350 / lbr folio.</li>
                      <li>• <strong>Plat CTP Mesin</strong>: Ryobi (Rp 25.000), Oliver (Rp 40.000).</li>
                    </ul>
                  </div>

                  {/* Poin 2: Custom Cover */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>2. Parameter Custom Cover 10 x 15,5</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga Isi Kosongan 212 Hal</strong>: <span className="font-mono text-emerald-700">Master!D21</span> = Rp 3.620 / eks (192 hal: Rp 3.421, 128 hal: Rp 2.300, 96 hal: Rp 1.800).</li>
                      <li>• <strong>Print Cover AC 230 A3+</strong>: <span className="font-mono text-emerald-700">Master!D18</span> = Rp 2.700 / lbr A3+ (muat 4 cover + 5 insheet).</li>
                      <li>• <strong>Cover Oliver Offset</strong>: Plano 79x109 (16 cover/plano) + 4 Plat CTP (Rp 40.000) + Min Ongkos 4 Plat (Rp 360.000) + Drek Over Rp 40 x 4 + Insheet 200 plano.</li>
                      <li>• <strong>Sisipan 4 Hal PT</strong>: Print A3+ Rp 350 + Sisip Lipat Rp 225,49.</li>
                      <li>• <strong>Jilid Staples + Tali</strong>: Tali Kur Rp 285,71 + Pasang Rp 112,74 + Bor Rp 225,49 + Staples Rp 112,74 + Casing In Rp 225,49.</li>
                    </ul>
                  </div>

                  {/* Poin 3: Cocard TikTok */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>3. Parameter Cocard 6,3 x 10,3 cm</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Print Cocard AC 310 A3+</strong>: <span className="font-mono text-purple-700">Master!D18</span> = Rp 2.500 / lbr A3+ (20 kartu/A3+ bolak-balik).</li>
                      <li>• <strong>Oliver Offset AC 310</strong>: Plano 79x109 + 8 Plat CTP 2 Muka + Insheet 200 plano.</li>
                      <li>• <strong>Pisau & Jasa Pond</strong>: Pisau Rp 258.595/order + Jasa Pond Rp 225,49/lbr.</li>
                      <li>• <strong>Aksesoris</strong>: Ring Binder 3cm (Rp 925) + Tali Cocard (Rp 2.500) + Plastik Ziplock (Rp 465) + Susun Ring (Rp 751,62).</li>
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
