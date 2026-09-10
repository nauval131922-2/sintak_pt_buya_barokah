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
    return customParams[key] !== DEFAULT_MANASIK_PARAMS[key];
  };

  const handleResetField = (key: keyof ManasikMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_MANASIK_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_MANASIK_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(() => {
    return (Object.keys(DEFAULT_MANASIK_PARAMS) as (keyof ManasikMasterParams)[]).some(
      (key) => customParams[key] !== DEFAULT_MANASIK_PARAMS[key]
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
              value={customParams[key] as number}
              onValueChange={(v) => handleChange(key, v || 0)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
              prefix="Rp"
              allowDecimals={isDecimal}
            />
          ) : (
            <input
              type="number"
              value={customParams[key] as number}
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

      {/* Grid Parameter: Dikelompokkan Presisi Sesuai 3 Model / Varian Produk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Varian 1: Custom Cover (10 x 15,5 cm) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800">1. Custom Cover (10 x 15,5 cm)</h3>
            </div>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              Varian 1
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
              {fieldRow('tarifLubangBor', 'Lubang Bor Mata Ayam', true, false, 'Rp/pcs', 'indigo')}
              {fieldRow('tarifBendingPerCm2', 'Tarif Lem Panas', true, false, 'Bending', 'emerald')}
            </div>
          </div>
        </div>

        {/* Varian 2: Kosongan (10 x 15,5 cm) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold text-slate-800">2. Kosongan (10 x 15,5 cm)</h3>
            </div>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              Varian 2
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
              • Cetak Kartu & Desain (AC 310 gsm):
            </span>
            <div className="grid grid-cols-1 gap-2">
              {fieldRow('tarifPrintMiniTikTokA3', 'Print Cocard AC 310 A3+', true, false, '20 Kartu/A3+', 'purple')}
              {fieldRow('tarifDesainMiniTikTok', 'Jasa Desain Cocard', true, false, 'Rp/order', 'purple')}
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
                  Pemetaan Sumber Master Excel (3 File Referensi 2026)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                    <span className="font-bold text-emerald-950 text-xs block">1. Custom Cover 10 x 15,5 cm</span>
                    <p className="text-[10.5px] text-emerald-800 leading-snug">
                      Ref: <code>...UK. 10 x 15,5 - BUKU MANASIK - Custom Cover 2026.xlsm</code><br />
                      Sheet: <span className="font-mono font-semibold">HARGA FILE BARU</span> & <span className="font-mono font-semibold">BUKU</span>.<br />
                      Cover AC 230 Print Inter (Rp 2.700) / Oliver + Sisipan 4 hal PT (Rp 350 + Rp 225,49) + Blok 212 hal (Rp 3.620) + Tali Kur (Rp 285,71) + Staples 1213 (Rp 24.000).
                    </p>
                  </div>
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-1.5">
                    <span className="font-bold text-blue-950 text-xs block">2. Kosongan 10 x 15,5 cm</span>
                    <p className="text-[10.5px] text-blue-800 leading-snug">
                      Ref: <code>...UK. 10 x 15,5 - BUKU MANASIK - Kosongan.xlsm</code><br />
                      Sheet: <span className="font-mono font-semibold">HARGA 2026</span> & <span className="font-mono font-semibold">BUKU</span>.<br />
                      HVS 70 gsm (Rp 15.700/kg) cetak Oliver 1 warna 53 plat CTP + lipat kuras + susun urut + jilid lem panas (bending) + kardus master (200 pcs/box).
                    </p>
                  </div>
                  <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 space-y-1.5">
                    <span className="font-bold text-purple-950 text-xs block">3. Cocard 6,3 x 10,3 cm</span>
                    <p className="text-[10.5px] text-purple-800 leading-snug">
                      Ref: <code>...UK. 6,3 x 10,3 - BUKU MANASIK MINI TIKTOK.xlsm</code><br />
                      Sheet: <span className="font-mono font-semibold">Master</span> & <span className="font-mono font-semibold">BUKU</span>.<br />
                      Art Carton 310 gsm (Rp 33.500/kg) bolak-balik + pisau & jasa pond (Rp 524,79) + Ring Binder 3cm (Rp 925) + Tali cocard (Rp 2.500) + Ziplock (Rp 465).
                    </p>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Rincian 4 Kelompok Parameter */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                  Rincian Rumus & Komponen Parameter Master
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Poin 1 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Blok Isi Kosongan & Kertas HVS</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Isi 212 Halaman Standar 2026</strong>: <span className="font-mono text-emerald-700">Master!D21</span> = Rp 3.620 / eks (insheet 2 eks).</li>
                      <li>• <strong>Isi Klasik</strong>: 192 Hal (Rp 3.421), 128 Hal (Rp 2.300), 96 Hal (Rp 1.800).</li>
                      <li>• <strong>Kertas HVS 70 gsm</strong>: <span className="font-mono text-emerald-700">Kosongan!Master!D22</span> = Rp 15.700 / kg.</li>
                      <li>• <strong>Print Sisipan PT A3+</strong>: <span className="font-mono text-emerald-700">BUKU!AM6</span> = Rp 350 / lbr A3+ (4 hal per lembar).</li>
                    </ul>
                  </div>

                  {/* Kelompok 2 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Bahan Cover & Cetak Cover</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Tarif Print Cover AC 230</strong>: <span className="font-mono text-blue-700">Custom!Master!D18</span> = Rp 2.700 / lbr A3+.</li>
                      <li>• <strong>Tarif Print Cocard AC 310</strong>: <span className="font-mono text-blue-700">TikTok!Master!D18</span> = Rp 2.500 / lbr A3+.</li>
                      <li>• <strong>Kertas AC 230 / 260</strong>: Rp 16.400 / kg | <strong>AC 310</strong>: Rp 33.500 / kg.</li>
                      <li>• <strong>Desain Cover</strong>: Custom Cover Rp 20.000 | Cocard Rp 2.500.</li>
                      <li>• <strong>Offset Oliver</strong>: Plat Rp 45.000, Min Rp 90.000, Drek over Rp 40.</li>
                    </ul>
                  </div>

                  {/* Kelompok 3 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Ongkos Jilid & Finishing Custom</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Tali Kur Warna Leher</strong>: <span className="font-mono text-amber-700">BUKU!BQ6</span> (Rp 16.000/roll isi 56 pcs = Rp 285,71) + jasa pasang Rp 112,74.</li>
                      <li>• <strong>Isi Staples 1213</strong>: Rp 24.000/pack + tenaga Rp 112,74 + casing in Rp 225,49.</li>
                      <li>• <strong>Lubang Bor Mata Ayam</strong>: <span className="font-mono text-amber-700">BUKU!BM6</span> (Rp 225,49 / buku).</li>
                      <li>• <strong>Potong Sisir 3 Sisi</strong>: <span className="font-mono text-amber-700">BUKU!BK6</span> (Rp 150 / buku).</li>
                      <li>• <strong>Jasa Sisip & Lipat Nama PT</strong>: Rp 225,49 / buku.</li>
                    </ul>
                  </div>

                  {/* Kelompok 4 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>4. Aksesoris Khusus Cocard & Kemasan</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Ring Binder 3 cm</strong>: <span className="font-mono text-purple-700">TikTok!Master!D24</span> = Rp 925 / pcs.</li>
                      <li>• <strong>Tali Cocard</strong>: <span className="font-mono text-purple-700">TikTok!Master!D23</span> = Rp 2.500 / pcs.</li>
                      <li>• <strong>Plastik Ziplock</strong>: <span className="font-mono text-purple-700">TikTok!Master!D25</span> = Rp 465 / pcs.</li>
                      <li>• <strong>Pisau + Jasa Pond Cocard</strong>: Rp 299,30 + Rp 225,49.</li>
                      <li>• <strong>Plastik OPP Satuan</strong>: Rp 92 / pcs + jasa Rp 225,49 | <strong>Kardus</strong>: Rp 8.500/box.</li>
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
