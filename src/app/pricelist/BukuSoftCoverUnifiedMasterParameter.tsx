'use client';

import React from 'react';
import {
  RotateCcw,
  Printer,
  Layers,
  Scissors,
  BookCopy,
} from 'lucide-react';
import {
  DEFAULT_SOFT_COVER_UNIFIED,
  SoftCoverUnifiedParams,
} from '@/lib/buku-soft-cover-unified';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface BukuSoftCoverUnifiedMasterParameterProps {
  customParams: SoftCoverUnifiedParams;
  setCustomParams: React.Dispatch<React.SetStateAction<SoftCoverUnifiedParams>>;
}

export default function BukuSoftCoverUnifiedMasterParameter({
  customParams,
  setCustomParams,
}: BukuSoftCoverUnifiedMasterParameterProps) {
  const handleChange = (key: keyof SoftCoverUnifiedParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof SoftCoverUnifiedParams) =>
    customParams[key] !== DEFAULT_SOFT_COVER_UNIFIED[key];

  const handleResetField = (key: keyof SoftCoverUnifiedParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_SOFT_COVER_UNIFIED[key] }));
    toast.info(`Field dikembalikan ke standar (${DEFAULT_SOFT_COVER_UNIFIED[key]}).`);
  };

  const fieldRow = (
    key: keyof SoftCoverUnifiedParams,
    label: string,
    opts?: { rupiah?: boolean; decimal?: boolean; suffix?: string }
  ) => {
    const isRupiah = opts?.rupiah ?? true;
    const isDecimal = opts?.decimal ?? false;
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
          <ThousandInput
            value={customParams[key] ?? DEFAULT_SOFT_COVER_UNIFIED[key]}
            onValueChange={(v) => handleChange(key, v || 0)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
            prefix={isRupiah ? 'Rp' : undefined}
            suffix={opts?.suffix}
            allowDecimals={isDecimal}
          />
        </div>
      </div>
    );
  };

  const subGroup = (
    borderCls: string,
    labelCls: string,
    title: string,
    children: React.ReactNode
  ) => (
    <div className={`rounded-lg border ${borderCls} bg-white/70 p-2.5 space-y-2`}>
      <span className={`block text-[10px] font-black uppercase tracking-wider ${labelCls}`}>{title}</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{children}</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
      <div className="columns-1 md:columns-2 gap-4">
        {/* Card 1: Cover */}
        <div className="bg-sky-50/40 rounded-xl border border-sky-200 p-4 shadow-2xs flex flex-col gap-3 break-inside-avoid mb-4">
          <div className="flex items-center gap-2 border-b border-sky-100 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-900 bg-sky-200/80 px-2 py-0.5 rounded">Cover</span>
            <Printer className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-800">1. Cover</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {subGroup('border-sky-300', 'text-sky-800', 'Kertas', (<>
              {fieldRow('tarifKertasCoverKg', 'Kertas Cover / kg (Rp)')}
              {fieldRow('gramaturCover', 'Gramatur Cover', { rupiah: false })}
              {fieldRow('upCoverPct', 'Up Cover (%)', { rupiah: false, suffix: '%' })}
              {fieldRow('insheetCover', 'Insheet Cover (lbr) — mengikuti file')}
            </>))}
            {subGroup('border-cyan-300', 'text-cyan-800', 'Cetak', (<>
              {fieldRow('tarifDesainCover', 'Desain Cover (Rp)')}
              {fieldRow('tarifPrintCoverA3', 'Print Cover A3+ (Rp)')}
            </>))}
          </div>
          <p className="text-[10px] text-slate-500">
            Cover Print Inter: all-in Rp {customParams.tarifPrintCoverA3.toLocaleString('id-ID')}/lembar. Cover Oliver: mengikuti harga rim + plate per file.
          </p>
        </div>

        {/* Card 2: Isi */}
        <div className="bg-blue-50/40 rounded-xl border border-blue-200 p-4 shadow-2xs flex flex-col gap-3 break-inside-avoid mb-4">
          <div className="flex items-center gap-2 border-b border-blue-100 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 bg-blue-200/80 px-2 py-0.5 rounded">Isi</span>
            <BookCopy className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Isi HVS</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {subGroup('border-blue-300', 'text-blue-800', 'Kertas', (<>
              {fieldRow('tarifKertasIsiKg', 'Kertas HVS / kg (Rp)')}
              {fieldRow('upIsiPct', 'Up Isi (%)', { rupiah: false, suffix: '%' })}
              {fieldRow('gramaturIsi', 'Gramatur Isi', { rupiah: false })}
              {fieldRow('insheetIsi', 'Insheet Isi (lbr) — per file')}
            </>))}
            {subGroup('border-indigo-300', 'text-indigo-800', 'Desain', (<>
              {fieldRow('tarifDesainIsiPerUnit', 'Desain Isi per Lembar (Rp)')}
              {fieldRow('tarifDesainIsiPerHlm', 'Desain Isi per Halaman (Rp)')}
            </>))}
            {subGroup('border-sky-300', 'text-sky-800', 'Plate & Cetak', (<>
              {fieldRow('tarifPlateIsi', 'Plate Isi (Rp)')}
              {fieldRow('tarifCetakMinIsi', 'Min Cetak (Rp)')}
              {fieldRow('tarifDrekIsi', 'Drek Isi (Rp)')}
            </>))}
            {subGroup('border-teal-300', 'text-teal-800', 'Print Isi', (<>
              {fieldRow('tarifPrintBuyaIsi', 'Print Isi Buya flat (Rp)')}
              {fieldRow('tarifPrintIsiA3', 'Print Isi A3+ (Rp) — per lini 350/2000/1750')}
            </>))}
          </div>
          <p className="text-[10px] text-slate-500">
            Tarif plate/min/drek mengikuti file; 3 field di bawah hanya untuk file 17.
          </p>
        </div>

        {/* Card 3: Jasa & Kemas */}
        <div className="bg-violet-50/40 rounded-xl border border-violet-200 p-4 shadow-2xs flex flex-col gap-3 break-inside-avoid mb-4">
          <div className="flex items-center gap-2 border-b border-violet-100 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-900 bg-violet-200/80 px-2 py-0.5 rounded">Jasa</span>
            <Scissors className="w-4 h-4 text-violet-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Jasa, Kawat &amp; Kemas</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {subGroup('border-violet-300', 'text-violet-800', 'Tenaga', (<>
              {fieldRow('umr', 'UMR (Rp)')}
              {fieldRow('tarifRoyalti', 'Royalty / pcs (Rp)')}
            </>))}
            {subGroup('border-purple-300', 'text-purple-800', 'Habis Pakai', (<>
            {fieldRow('tarifKawatRoll', 'Kawat Stiching /roll (Rp)')}
            {fieldRow('tarifTintaSpotUV', 'Tinta Spot UV /kg (Rp)')}
              {fieldRow('tarifSteplesPack', 'Steples 369/Pack (Rp)')}
              {fieldRow('tarifSisirPerPcs', 'Sisir / pcs (Rp) — 150 flat')}
            </>))}
            {subGroup('border-fuchsia-300', 'text-fuchsia-800', 'Kemas', (<>
              {fieldRow('tarifShrinkRoll', 'Shrink /roll (Rp) — per file')}
              {fieldRow('tarifLakbanRoll', 'Lakban /roll (Rp)')}
              {fieldRow('tarifKardusBox', 'Kardus /box (Rp)')}
            </>))}
          </div>
          <p className="text-[10px] text-slate-500">
            Jasa harian, SpotUV/Emboss/Shrink/Packing mengikuti file dan saklar Komponen Tambahan.
          </p>
        </div>

        {/* Card 4: Finishing & Margin */}
        <div className="bg-amber-50/40 rounded-xl border border-amber-200 p-4 shadow-2xs flex flex-col gap-3 break-inside-avoid mb-4">
          <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">Finishing</span>
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Bending, Laminasi &amp; Margin</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {subGroup('border-amber-300', 'text-amber-800', 'Bending', (<>
              {fieldRow('tarifBending', 'Bending (Rp)')}
              {fieldRow('minBending', 'Floor Bending (Rp)')}
            </>))}
            {subGroup('border-orange-300', 'text-orange-800', 'Laminasi & UV', (<>
              {fieldRow('tarifLaminasiGlossy', 'Glossy /cm²', { decimal: true })}
              {fieldRow('tarifLaminasiDoff', 'Doff /cm²', { decimal: true })}
              {fieldRow('tarifUvVarnish', 'UV /cm²', { decimal: true })}
              {fieldRow('minFinishing', 'Floor Finishing (Rp)')}
            </>))}
            {subGroup('border-yellow-300', 'text-yellow-800', 'Laba', (<>
              {fieldRow('marginDefaultPct', 'Margin Default (%)', { rupiah: false, suffix: '%' })}
            </>))}
          </div>
          <p className="text-[10px] text-slate-500">
            Floor finishing Rp 50.000, bending Rp 100.000. Margin 30%, harga ke puluhan. Tanpa nego (3 folder).
          </p>
        </div>

        {/* Card 5: Tarif print & target */}
        <div className="bg-emerald-50/40 rounded-xl border border-emerald-200 p-4 shadow-2xs flex flex-col gap-3 break-inside-avoid mb-4">
          <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded">Target</span>
            <BookCopy className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800">5. Target Harian</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            <div className="lg:col-span-2">
              {subGroup('border-teal-300', 'text-teal-800', 'Target Harian', (<>
                {fieldRow('targetLipat', 'Target Lipat /hari')}
                {fieldRow('targetSisir', 'Target Sisir /hari')}
                {fieldRow('targetSusunKomplit', 'Target Susun Komplit /hari')}
                {fieldRow('targetKawatRoll', 'Kawat 1 roll jadi (pcs)')}
                {fieldRow('targetStiching', 'Target Stiching /hari')}
              </>))}
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Laba = Margin Default (30%). Toggle jasa default per lini di tab Kalkulasi.
          </p>
        </div>
      </div>
    </div>
  );
}
