'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Printer,
  Layers,
  Scissors,
  BookCopy,
} from 'lucide-react';
import {
  DEFAULT_BUKU_SOFT_COVER_PARAMS,
  BukuSoftCoverMasterParams,
} from '@/lib/buku-soft-cover-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface BukuSoftCoverMasterParameterProps {
  customParams: BukuSoftCoverMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<BukuSoftCoverMasterParams>>;
}

const BSC_VISIBLE_KEYS: (keyof BukuSoftCoverMasterParams)[] = [
  'insheetCover',
  'tarifDesainCover',
  'tarifPrintCoverA3',
  'tarifKertasIsiKg',
  'upIsiPct',
  'gramaturIsi',
  'insheetIsi',
  'tarifDesainIsiPerHlm',
  'tarifPlateIsi',
  'tarifCetakMinIsi',
  'tarifDrekIsi',
  'tarifRoyalti',
  'tarifSteplesPack',
  'umr',
  'tarifSisirPerPcs',
  'tarifBending',
  'minBending',
  'tarifLaminasiGlossy',
  'tarifLaminasiDoff',
  'tarifUvVarnish',
  'minFinishing',
  'marginDefaultPct',
];

export default function BukuSoftCoverMasterParameter({
  customParams,
  setCustomParams,
}: BukuSoftCoverMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof BukuSoftCoverMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof BukuSoftCoverMasterParams) =>
    customParams[key] !== DEFAULT_BUKU_SOFT_COVER_PARAMS[key];

  const handleResetField = (key: keyof BukuSoftCoverMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_BUKU_SOFT_COVER_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_BUKU_SOFT_COVER_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => BSC_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_BUKU_SOFT_COVER_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      BSC_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_BUKU_SOFT_COVER_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Buku Soft Cover dikembalikan ke standar master.');
  };

  const fieldRow = (
    key: keyof BukuSoftCoverMasterParams,
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
            value={customParams[key] ?? DEFAULT_BUKU_SOFT_COVER_PARAMS[key]}
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

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
                Master Parameter Buku Soft Cover 21×29,7
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan Buku Soft Cover 21×29,7 cm — Cover Art Carton 230 (Print Inter) + Isi HVS 70 (Oliver).
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
        {/* Card 1: Cover */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-800">1. Cover Art Carton — Print Inter (Master!D13–D18)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('insheetCover', 'Insheet Cover (lbr) — D13', { rupiah: false })}
            {fieldRow('tarifDesainCover', 'Desain Cover (Rp) — D17')}
            {fieldRow('tarifPrintCoverA3', 'Print Cover A3+ (Rp) — D18')}
          </div>
          <p className="text-[10px] text-slate-500">
            Print Inter all-in Rp 2.700/lbr (bahan+cetak, BUKU!T7=T2·R). Kertas cover D11/D12/E12 tidak masuk hitung jalur ini — lihat Manual.
          </p>
        </div>

        {/* Card 2: Isi */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <BookCopy className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Isi HVS — Oliver (Master!D21–D26)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifKertasIsiKg', 'Kertas HVS / kg (Rp) — D22')}
            {fieldRow('upIsiPct', 'Up Isi (%) — E22', { rupiah: false, suffix: '%' })}
            {fieldRow('gramaturIsi', 'Gramatur Isi — D21', { rupiah: false })}
            {fieldRow('insheetIsi', 'Insheet Isi (lbr) — D23', { rupiah: false })}
            {fieldRow('tarifDesainIsiPerHlm', 'Desain Isi / hlm (Rp) — D26')}
            {fieldRow('tarifPlateIsi', 'Plate Isi (Rp) — AW6')}
            {fieldRow('tarifCetakMinIsi', 'Min Cetak Isi (Rp) — AY6')}
            {fieldRow('tarifDrekIsi', 'Drek Isi (Rp) — AZ7')}
          </div>
          <p className="text-[10px] text-slate-500">
            HVS 70 Rp 15.700/kg +3% (rim 65×100 Rp 367.890/500), insheet 100, desain Rp 15.000/hlm, plate Rp 45.000, min Rp 90.000, drek Rp 40, over dari (oplah+100−1000).
          </p>
        </div>

        {/* Card 3: Jasa & Finishing */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Scissors className="w-4 h-4 text-violet-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Jasa, Staples, Sisir &amp; Bending</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('umr', 'UMR (Rp) — D8')}
            {fieldRow('tarifRoyalti', 'Royalty / pcs (Rp) — D35')}
            {fieldRow('tarifSteplesPack', 'Steples 369/Pack (Rp) — D32')}
            {fieldRow('tarifSisirPerPcs', 'Sisir / pcs (Rp) — BL6')}
            {fieldRow('tarifBending', 'Bending (Rp) — BX6')}
            {fieldRow('minBending', 'Floor Bending (Rp) — BZ7')}
          </div>
          <p className="text-[10px] text-slate-500">
            Susun (UMR/25)/target bracket halaman, steples ÷(1000/3)=Rp 9/pcs, sisir Rp 150/pcs, bending Rp 50 live saat halaman &gt;100.
          </p>
        </div>

        {/* Card 4: Laminasi & Margin */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Laminasi &amp; Margin (BUKU!CA6/CD6/CG6 + E36)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifLaminasiGlossy', 'Glossy /cm² — CA6', { decimal: true })}
            {fieldRow('tarifLaminasiDoff', 'Doff /cm² — CD6', { decimal: true })}
            {fieldRow('tarifUvVarnish', 'UV /cm² — CG6', { decimal: true })}
            {fieldRow('minFinishing', 'Floor Finishing (Rp)')}
            {fieldRow('marginDefaultPct', 'Margin Default (%) — E36', { rupiah: false, suffix: '%' })}
          </div>
          <p className="text-[10px] text-slate-500">
            Luas ((21·2+1)·(29,7+1))=1.320 cm²×rate×oplah, floor Rp 50.000. Margin 30%, harga ke puluhan. Tanpa nego (sesuai Excel).
          </p>
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
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Manual Pengguna &amp; Pemetaan Sumber Excel</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Referensi sheet, cell, dan formula master Buku Soft Cover 21×29,7 (17. Pricelist Buku Soft Cover/Source/*.xlsm)
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
                  Dropdown Master (diekstrak programatis via dataValidation)
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• <strong>Master!D5 Ukuran</strong>: 21×29,7 / 14,8×21 / 10,5×14,8 — engine hanya menghitung 21×29,7 (sisanya #DIV/0!, dikunci).</p>
                  <p>• <strong>Master!D6 Halaman</strong>: bebas angka (tersimpan 32) → punggung BUKU!M7, kebutuhan isi, target susun.</p>
                  <p>• <strong>Master!D7 Oplah</strong>: named range <span className="font-mono text-emerald-700">Oplah</span> → 12 tier BUKU!H7:H18 = 20–500.</p>
                  <p>• <strong>Cover</strong>: D14 muka (1/2) → BUKU!N7; D15 warna (1–4) → BUKU!Z2; D16 mesin dikunci Print Inter (mesin lain #DIV/0!).</p>
                  <p>• <strong>Isi</strong>: D24 warna (1–4) → BUKU!AJ7; D25 mesin dikunci Oliver (mesin lain #DIV/0!).</p>
                  <p>• <strong>Master!D29 Catatan</strong> (range H29:H39): 7 opsi terkomputasi — None, / UV / Glossy / Doff / Bending / UV+Bending / Doff+Bending.</p>
                  <p>• <strong>D10/D11/D20/D21</strong>: bahan (label) &amp; gramatur angka → BUKU!W28/AU28.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Alur Hitung BUKU (per tier oplah H, 32 halaman)
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• <strong>Cover BUKU!R7/Q7</strong>: R=(H/1)+(5/1), Q=R·muka. <strong>Cetak BUKU!T7</strong>: =2.700·R (all-in).</p>
                  <p>• <strong>Isi BUKU!AP7</strong>: =((H/2)·4+((100/2)·4)) → 240 @20. <strong>Kertas BUKU!AR7</strong>: =(AP/500)·367.890.</p>
                  <p>• <strong>Cetak isi BUKU!BD7</strong>: =90.000+over·40, over=(H+100−1000). <strong>Tambahan BUKU!BH7</strong>: =(2·AO−1000)·40 — negatif di oplah kecil (−1.600 @20).</p>
                  <p>• <strong>Jasa</strong>: susun H·(UMR/25)/800, steples 3000/(1000/3)·H = 9·H, sisir 150·H.</p>
                  <p>• <strong>Laminasi</strong>: 1.320 cm²·rate·H floor 50rb (gate D29). <strong>Total BUKU!CX7</strong>: 25 suku. <strong>Harga BUKU!DD7</strong>: =ROUNDUP(DC,−1), laba 30%.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  Batas Domain &amp; Sel Mati (sengaja tidak dihitung/ditawarkan)
                </h4>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• Ukuran selain 21×29,7 dan mesin selain Print Inter (cover)/Oliver (isi) → #DIV/0! di Excel.</p>
                  <p>• Finishing Glossy+Bending dan full-combo → #DIV/0! (CR7/BR7) untuk ukuran ini — tidak ada tombolnya.</p>
                  <p>• D11/D12/E12 kertas cover (W29 tak terpakai jalur Print Inter), D27 print isi A3+, D30 tinta SpotUV, D31 shrink, D33 lakban, D34 kardus (gate A02.Ukuran), film U6/T29/V30, X6/C2/M26 — mati, tanpa parameter.</p>
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
