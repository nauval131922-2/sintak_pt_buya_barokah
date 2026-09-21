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
  Package,
  Sliders,
  DollarSign,
} from 'lucide-react';
import {
  DEFAULT_RAPORT_KALEB_PARAMS,
  RaportKalebMasterParams,
} from '@/lib/raport-kaleb-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface RaportKalebMasterParameterProps {
  customParams: RaportKalebMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<RaportKalebMasterParams>>;
}

const RAPORT_KALEB_VISIBLE_KEYS: (keyof RaportKalebMasterParams)[] = [
  'hargaMapKosongan',
  'upMapKosonganPct',
  'hargaIsiPerLbr',
  'tarifDesign',
  'tarifKlise',
  'batasOplahKlise',
  'tarifKardusBox',
  'tarifLakbanRoll',
  'kapasitasKardus',
  'marginDefaultPct',
  'negoDefaultPct',
  'tarifPenambahanIsiPricelist',
];

export default function RaportKalebMasterParameter({
  customParams,
  setCustomParams,
}: RaportKalebMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof RaportKalebMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof RaportKalebMasterParams) => {
    const current = customParams[key] ?? DEFAULT_RAPORT_KALEB_PARAMS[key];
    const def = DEFAULT_RAPORT_KALEB_PARAMS[key];
    return current !== def;
  };

  const handleResetField = (key: keyof RaportKalebMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_RAPORT_KALEB_PARAMS[key] }));
    toast.info(`Field ${key} dikembalikan ke standar master (${DEFAULT_RAPORT_KALEB_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () =>
      RAPORT_KALEB_VISIBLE_KEYS.some((key) => {
        const current = customParams[key] ?? DEFAULT_RAPORT_KALEB_PARAMS[key];
        return current !== DEFAULT_RAPORT_KALEB_PARAMS[key];
      }),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      RAPORT_KALEB_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_RAPORT_KALEB_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Raport Kaleb dikembalikan ke standar master.');
  };

  const fieldRow = (
    key: keyof RaportKalebMasterParams,
    label: string,
    isRupiah = true,
    isDecimal = false,
    suffix?: string,
    cellRef?: string
  ) => {
    const val = (customParams[key] ?? DEFAULT_RAPORT_KALEB_PARAMS[key]) as number;
    return (
      <div
        className={`p-2.5 rounded-lg border transition-all ${
          isFieldModified(key)
            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
            : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
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
        {cellRef && (
          <p className="text-[10px] text-slate-400 font-mono mb-1.5 truncate">
            {cellRef}
          </p>
        )}
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
            <div className="relative w-full">
              <input
                type="number"
                step={isDecimal ? 0.01 : 1}
                value={val}
                onChange={(e) => handleChange(key, Number(e.target.value) || 0)}
                className={`w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs ${suffix ? 'pr-7' : ''}`}
              />
              {suffix && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  {suffix}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
      {/* Banner Header */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
                Master Parameter Raport Kaleb
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Parameter 1:1 master Excel Map Raport Kaleb 24×34 cm: bahan map, kantong mika isi, matres klise foil emas, dan packing.
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Bahan Map Kaleb & Isi Mika */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800">1. Bahan Map Kaleb &amp; Kantong Mika</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('hargaMapKosongan', 'Harga Map Kosongan', true, false, undefined, 'Master!D12: Rp 16.000 / pcs')}
            {fieldRow('upMapKosonganPct', 'Markup Map (%)', false, false, '%', 'Master!E12: Default 0%')}
            {fieldRow('hargaIsiPerLbr', 'Tarif Kantong Mika /Lbr', true, false, undefined, 'Master!D13: Rp 900 / lbr mika')}
            {fieldRow('tarifPenambahanIsiPricelist', 'Acuan Tambah Isi Eceran', true, false, undefined, 'HARGA JULI 2026!B11: Rp 1.200 / lbr')}
          </div>
          <p className="text-[10px] text-slate-500">
            Biaya map kosongan dihitung per order oplah. Kantong plastik mika dihitung berdasarkan varian isi (4, 6, 8, 10, 12 lbr) atau custom.
          </p>
        </div>

        {/* Card 2: Setting Desain & Matres Klise Foil Emas */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Desain &amp; Matres Klise Foil Emas</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifDesign', 'Biaya Setting Desain', true, false, undefined, 'Master!D14: Rp 10.000 / order')}
            {fieldRow('tarifKlise', 'Tarif Klise Foil (≤120 pcs)', true, false, undefined, 'Master!D15: Rp 350.000 / order')}
            {fieldRow('batasOplahKlise', 'Batas Oplah Klise Gratis', false, false, 'pcs', 'BUKU!P7: > 120 pcs gratis')}
          </div>
          <p className="text-[10px] text-slate-500">
            Klise foil emas dibebankan Rp 350.000 untuk pesanan kecil (≤ 120 pcs). Untuk oplah di atas 120 pcs, biaya klise otomatis digratiskan (Rp 0).
          </p>
        </div>

        {/* Card 3: Finishing Packing Kardus & Lakban */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Package className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Packing Kardus &amp; Lakban</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifKardusBox', 'Kardus Packing / Box', true, false, undefined, 'Master!D18: Rp 8.500 / box')}
            {fieldRow('tarifLakbanRoll', 'Lakban / Roll', true, false, undefined, 'Master!D17: Rp 8.000 / roll')}
            {fieldRow('kapasitasKardus', 'Kapasitas Map / Box', false, false, 'map', 'BUKU!V35: 100 map / kardus')}
          </div>
          <p className="text-[10px] text-slate-500">
            Di sheet BUKU cell X6 default bernilai non-aktif ("X"). Jika diaktifkan, otomatis menghitung jumlah box kardus dan kebutuhan roll lakban.
          </p>
        </div>

        {/* Card 4: Standar Margin & Penawaran */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Margin Laba &amp; Nego Standar</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('marginDefaultPct', 'Margin Default (%)', false, false, '%', 'HARGA JULI 2026!S4: 25%')}
            {fieldRow('negoDefaultPct', 'Nego Default (%)', false, false, '%', 'HARGA JULI 2026!T4: 4%')}
          </div>
          <p className="text-[10px] text-slate-500">
            Standar pricelist resmi menggunakan margin 25% dan toleransi nego 4% dengan pembulatan ke atas ratusan (ROUNDUP -2).
          </p>
        </div>
      </div>

      {/* Modal Manual Pengguna */}
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Raport Kaleb (09. Pricelist Raport Kaleb)
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
                  Pemetaan Master Parameter ke File Excel (09. Pricelist Raport Kaleb)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan Map &amp; Kantong Mika</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga Map Kosongan</strong>: <span className="font-mono text-emerald-700">Master!D12</span> = Rp 16.000 / pcs (Ukuran 24×34 cm tertutup).</li>
                      <li>• <strong>Markup Kertas Map</strong>: <span className="font-mono text-emerald-700">Master!E12</span> = 0% default.</li>
                      <li>• <strong>Tarif Kantong Mika /Lbr</strong>: <span className="font-mono text-emerald-700">Master!D13</span> = Rp 900 / lbr mika.</li>
                      <li>• <strong>Varian Standar</strong>: Kosongan (0 lbr), Isi 4, Isi 6, Isi 8, Isi 10, Isi 12.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>2. Desain &amp; Matres Klise Foil</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Biaya Setting Desain</strong>: <span className="font-mono text-amber-700">Master!D14</span> = Rp 10.000 / order.</li>
                      <li>• <strong>Klise Foil Emas</strong>: <span className="font-mono text-amber-700">Master!D15</span> = Rp 350.000 / order.</li>
                      <li>• <strong>Batas Oplah Klise</strong>: <span className="font-mono text-amber-700">BUKU!P7</span> = <code>IF(Oplah &le; 120, 350.000, 0)</code>. Oplah &gt; 120 pcs otomatis bebas biaya klise.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>3. Finishing Packing Kardus &amp; Lakban</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Kardus Packing</strong>: <span className="font-mono text-blue-700">Master!D18</span> = Rp 8.500 / box (Kapasitas: <span className="font-mono text-blue-700">BUKU!V35</span> = 100 map/box).</li>
                      <li>• <strong>Lakban Transparan</strong>: <span className="font-mono text-blue-700">Master!D17</span> = Rp 8.000 / roll (Ukuran: 7.650 cm/roll, pemakaian: 196 cm/box).</li>
                      <li>• <strong>Opsi Default Master</strong>: <span className="font-mono text-blue-700">BUKU!X6</span> = "X" (non-aktif).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>4. Standar Margin &amp; Nego Pricelist</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Margin Laba Standar</strong>: <span className="font-mono text-purple-700">HARGA JULI 2026!S4</span> = 25% (di sheet BUKU!E20 = 30%).</li>
                      <li>• <strong>Nego Diskon Standar</strong>: <span className="font-mono text-purple-700">HARGA JULI 2026!T4</span> = 4%.</li>
                      <li>• <strong>Penambahan Isi Eceran</strong>: <span className="font-mono text-purple-700">HARGA JULI 2026!B11</span> = Rp 1.200 / lbr.</li>
                      <li>• <strong>Pembulatan</strong>: <code>ROUNDUP(..., -2)</code> ke atas ratusan penuh.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
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
