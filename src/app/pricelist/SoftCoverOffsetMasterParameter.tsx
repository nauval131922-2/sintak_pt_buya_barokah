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
  Package,
} from 'lucide-react';
import {
  DEFAULT_SOFT_COVER_OFFSET_PARAMS,
  defaultSoftCoverOffsetParams,
  SoftCoverOffsetMasterParams,
  SoftCoverOffsetComboId,
  SOFT_COVER_OFFSET_COMBOS,
} from '@/lib/buku-soft-cover-offset-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface SoftCoverOffsetMasterParameterProps {
  combo: SoftCoverOffsetComboId;
  customParams: SoftCoverOffsetMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<SoftCoverOffsetMasterParams>>;
}

const VISIBLE_KEYS: (keyof SoftCoverOffsetMasterParams)[] = [
  'insheetCover',
  'tarifDesainCover',
  'tarifPrintCoverA3',
  'tarifKertasIsiKg',
  'upIsiPct',
  'gramaturIsi',
  'insheetIsi',
  'tarifDesainIsiPerUnit',
  'tarifPlateIsi',
  'tarifCetakMinIsi',
  'tarifDrekIsi',
  'tarifJasaPrintBuyaIsi',
  'tarifRoyalti',
  'umr',
  'tarifKawatRoll',
  'tarifTintaSpotUV',
  'tarifShrinkRoll',
  'tarifSteplesPack',
  'tarifLakbanRoll',
  'tarifKardusBox',
  'tarifSisirPerPcs',
  'tarifBending',
  'minBending',
  'tarifLaminasiGlossy',
  'tarifLaminasiDoff',
  'tarifUvVarnish',
  'minFinishing',
  'marginDefaultPct',
];

export default function SoftCoverOffsetMasterParameter({
  combo,
  customParams,
  setCustomParams,
}: SoftCoverOffsetMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);
  const cfg = SOFT_COVER_OFFSET_COMBOS[combo];
  const COMBO_DEFAULT = defaultSoftCoverOffsetParams(combo);

  const handleChange = (key: keyof SoftCoverOffsetMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof SoftCoverOffsetMasterParams) =>
    customParams[key] !== COMBO_DEFAULT[key];

  const handleResetField = (key: keyof SoftCoverOffsetMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: COMBO_DEFAULT[key] }));
    toast.info(`Field dikembalikan ke standar master (${COMBO_DEFAULT[key]}).`);
  };

  const isModified = React.useMemo(
    () => VISIBLE_KEYS.some((key) => customParams[key] !== COMBO_DEFAULT[key]),
    [customParams, combo]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = COMBO_DEFAULT[k];
      });
      return resetObj;
    });
    toast.success(`Semua parameter ${cfg.label} dikembalikan ke standar master.`);
  };

  const fieldRow = (
    key: keyof SoftCoverOffsetMasterParams,
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
            value={customParams[key] ?? DEFAULT_SOFT_COVER_OFFSET_PARAMS[key]}
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
                Master Parameter {cfg.label} 21×29,7
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              {cfg.description} — tier {cfg.tiers[0]}–{cfg.tiers[cfg.tiers.length - 1]} pcs.
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
            <h3 className="text-xs font-bold text-slate-800">1. Cover {cfg.coverMesin} (Master!D13–D18)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('insheetCover', `Insheet Cover (D13) — file: ${COMBO_DEFAULT.insheetCover}`, { rupiah: false })}
            {fieldRow('tarifDesainCover', 'Desain Cover (Rp) — D17')}
            {fieldRow('tarifPrintCoverA3', 'Print Cover A3+ (Rp) — D18')}
          </div>
          <p className="text-[10px] text-slate-500">
            {combo === 'Oliver-Oliver'
              ? 'Cover Oliver rim-based (R/500×W29) + plate Rp 45.000×warna.'
              : 'Cover Print Inter all-in Rp 2.700/lbr (plate/min Rp 0).'}
          </p>
        </div>

        {/* Card 2: Isi */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <BookCopy className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Isi {cfg.isiMesin} (Master!D21–D26)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifKertasIsiKg', 'Kertas HVS / kg (Rp) — D22')}
            {fieldRow('upIsiPct', 'Up Isi (%) — E22', { rupiah: false, suffix: '%' })}
            {fieldRow('gramaturIsi', 'Gramatur Isi — D21', { rupiah: false })}
            {fieldRow('insheetIsi', `Insheet Isi (D23) — file: ${COMBO_DEFAULT.insheetIsi}`, { rupiah: false })}
            {fieldRow('tarifDesainIsiPerUnit', 'Desain Isi ×C7 (Rp) — D26')}
            {fieldRow('tarifPlateIsi', 'Plate Isi (Rp) — AW6')}
            {fieldRow('tarifCetakMinIsi', 'Min Cetak Isi (Rp) — AY6')}
            {fieldRow('tarifDrekIsi', 'Drek Isi (Rp) — AZ7')}
            {combo === 'Print-Print' && fieldRow('tarifJasaPrintBuyaIsi', 'Jasa Print Buya (Rp) — AR2')}
          </div>
          <p className="text-[10px] text-slate-500">
            {combo === 'Print-Print'
              ? 'Isi Print Buya: cetak = Rp 700×AO (tanpa plate/min), C7 = halaman/4.'
              : 'Isi Oliver: plate Rp 45.000×plat, min Rp 90.000×plat, over Rp 40 dari (oplah+insheet−1000).'}
          </p>
        </div>

        {/* Card 3: Jasa */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Scissors className="w-4 h-4 text-violet-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Jasa UMR, Kawat &amp; Kemas (Master!D8/D30–D35)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('umr', 'UMR (Rp) — D8')}
            {fieldRow('tarifRoyalti', 'Royalty / pcs (Rp) — D36')}
            {fieldRow('tarifKawatRoll', 'Kawat Stiching /roll (Rp) — D30')}
            {fieldRow('tarifTintaSpotUV', 'Tinta Spot UV /kg (Rp) — D31')}
            {fieldRow('tarifShrinkRoll', 'Shrink /roll (Rp) — D32')}
            {fieldRow('tarifSteplesPack', 'Steples 369/Pack (Rp) — D33')}
            {fieldRow('tarifLakbanRoll', 'Lakban /roll (Rp) — D34')}
            {fieldRow('tarifKardusBox', 'Kardus /box (Rp) — D35')}
            {fieldRow('tarifSisirPerPcs', 'Sisir / pcs (Rp) — BQ6')}
          </div>
          <p className="text-[10px] text-slate-500">
            {cfg.jasaModel === 'UMR5'
              ? 'Jasa BI/BJ/BK/BL/BM aktif (UMR/target); BN/BO mati.'
              : 'Jasa BN/BO aktif (UMR/tabel halaman + steples); BI–BM mati.'}
            {' '}Sisir flat Rp 150/pcs, packing kardus isi ikut bracket halaman.
          </p>
        </div>

        {/* Card 4: Finishing & Margin */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Bending, Laminasi &amp; Margin</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifBending', 'Bending (Rp) — CC6')}
            {fieldRow('minBending', 'Floor Bending (Rp) — CE7')}
            {fieldRow('tarifLaminasiGlossy', 'Glossy /cm² — CF6', { decimal: true })}
            {fieldRow('tarifLaminasiDoff', 'Doff /cm² — CI6', { decimal: true })}
            {fieldRow('tarifUvVarnish', 'UV /cm² — CL6', { decimal: true })}
            {fieldRow('minFinishing', 'Floor Finishing (Rp)')}
            {fieldRow('marginDefaultPct', 'Margin Default (%) — E37', { rupiah: false, suffix: '%' })}
          </div>
          <p className="text-[10px] text-slate-500">
            Laminasi 1.320 cm²×rate×oplah×muka, floor Rp 50.000; bending floor Rp 100.000. Margin 30%, harga ke puluhan. Tanpa nego.
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
                    BUKU UK. 21 x 29,7 - {cfg.label}.xlsm (17. Pricelist Buku Soft Cover - 21 x 29,7 cm/Source)
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
                  Dropdown &amp; Tier File Ini
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• <strong>Master!D7 Oplah</strong>: {cfg.tiers.join(', ')} pcs (named range Oplah).</p>
                  <p>• <strong>Cover {cfg.coverMesin}</strong>: D14 muka → BUKU!N7; D15 warna → BUKU!Z2; insheet D13 = {COMBO_DEFAULT.insheetCover}.</p>
                  <p>• <strong>Isi {cfg.isiMesin}</strong>: D24 warna → BUKU!AJ7 + dimensi area; insheet D23 = {COMBO_DEFAULT.insheetIsi}.</p>
                  <p>• <strong>Master!D29</strong>: 9 opsi H29:H39, semua terkomputasi (SpotUV/Emboss/Shrink/Packing hidup untuk 21×29,7).</p>
                  <p>• UMR {COMBO_DEFAULT.umr.toLocaleString('id-ID')}, up 0%, desain isi Rp 2.500×C7 (C7 = halaman/4).</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Alur Hitung BUKU!DC7 (30 suku → DI7)
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• <strong>Cover</strong>: R=(H/P)+(K/O), Q=R·O·muka; {combo === 'Oliver-Oliver' ? 'T=(R/500)·W29 rim-based, plate 45rb×warna, min 90rb×warna.' : 'T=2.700·R all-in (plate/min Rp 0).'}</p>
                  <p>• <strong>Isi</strong>: AP=((H/2)·AN+(AI/2)·AN6), AN=hal/8; AR=(AP/500)·rim; AT=2.500·(hal/4).</p>
                  <p>• <strong>Cetak isi</strong>: {combo === 'Print-Print' ? 'BD = 700·AO (Jasa Print Buya, tanpa plate/min).' : 'BD = 90.000·plat + over·40 (dari oplah+insheet−1000).'}</p>
                  <p>• <strong>Jasa</strong>: {cfg.jasaModel === 'UMR5' ? 'BI/BJ/BK/BL/BM (UMR ÷ target); kawat D30/25500.' : 'BN (UMR ÷ tabel halaman) + steples D33/(1000/3).'} Sisir flat 150·H.</p>
                  <p>• <strong>Total DC7</strong>: 30 suku termasuk SpotUV/Emboss/Shrink/Packing (gate D29). Harga DI7 =ROUNDUP(DH,−1), laba 30%.</p>
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
