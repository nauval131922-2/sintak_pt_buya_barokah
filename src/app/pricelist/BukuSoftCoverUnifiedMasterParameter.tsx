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
  DEFAULT_SOFT_COVER_UNIFIED,
  SoftCoverUnifiedParams,
} from '@/lib/buku-soft-cover-unified';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface BukuSoftCoverUnifiedMasterParameterProps {
  customParams: SoftCoverUnifiedParams;
  setCustomParams: React.Dispatch<React.SetStateAction<SoftCoverUnifiedParams>>;
}

const VISIBLE_KEYS: (keyof SoftCoverUnifiedParams)[] = [
  'insheetCover',
  'tarifDesainCover',
  'tarifPrintCoverA3',
  'tarifKertasIsiKg',
  'upCoverPct',
  'upIsiPct',
  'gramaturIsi',
  'insheetIsi',
  'tarifDesainIsiPerUnit',
  'tarifDesainIsiPerHlm',
  'tarifPlateIsi',
  'tarifCetakMinIsi',
  'tarifDrekIsi',
  'tarifPrintBuyaIsi',
  'tarifPrintIsiA3',
  'targetLipat',
  'targetSisir',
  'targetSusunKomplit',
  'targetKawatRoll',
  'targetStiching',
  'tarifRoyalti',
  'tarifSteplesPack',
  'umr',
  'tarifKawatRoll',
  'tarifTintaSpotUV',
  'tarifShrinkRoll',
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

export default function BukuSoftCoverUnifiedMasterParameter({
  customParams,
  setCustomParams,
}: BukuSoftCoverUnifiedMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof SoftCoverUnifiedParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof SoftCoverUnifiedParams) =>
    customParams[key] !== DEFAULT_SOFT_COVER_UNIFIED[key];

  const handleResetField = (key: keyof SoftCoverUnifiedParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_SOFT_COVER_UNIFIED[key] }));
    toast.info(`Field dikembalikan ke standar (${DEFAULT_SOFT_COVER_UNIFIED[key]}).`);
  };

  const isModified = React.useMemo(
    () => VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_SOFT_COVER_UNIFIED[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_SOFT_COVER_UNIFIED[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Buku Soft Cover dikembalikan ke standar.');
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
                Master Parameter Buku Soft Cover
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              1 produk · 3 ukuran · 18 lini mesin (17 + 17-21×29,7 + 18-14,5 + 19/21 Custom + 24-10,5 Custom) — default per lini resolve otomatis, edit manual selalu menang.
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
            <h3 className="text-xs font-bold text-slate-800">1. Cover (semua lini)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('insheetCover', 'Insheet Cover (lbr) — Klasik 5, offset per file')}
            {fieldRow('tarifDesainCover', 'Desain Cover (Rp)')}
            {fieldRow('tarifPrintCoverA3', 'Print Cover A3+ (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Klasik &amp; Print-cover: all-in Rp 2.700/lbr. Oliver-cover: rim-based + plate/min per lini.
          </p>
        </div>

        {/* Card 2: Isi */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <BookCopy className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Isi HVS (semua lini)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifKertasIsiKg', 'Kertas HVS / kg (Rp)')}
            {fieldRow('upCoverPct', 'Up Cover (%)', { rupiah: false, suffix: '%' })}
            {fieldRow('upIsiPct', 'Up Isi (%) — Klasik 3, offset 0', { rupiah: false, suffix: '%' })}
            {fieldRow('gramaturIsi', 'Gramatur Isi', { rupiah: false })}
            {fieldRow('insheetIsi', 'Insheet Isi (lbr) — per file')}
            {fieldRow('tarifDesainIsiPerUnit', 'Desain Isi offset (Rp)')}
            {fieldRow('tarifDesainIsiPerHlm', 'Desain Isi Klasik /hlm (Rp)')}
            {fieldRow('tarifPlateIsi', 'Plate Isi Klasik (Rp)')}
            {fieldRow('tarifCetakMinIsi', 'Min Cetak Klasik (Rp)')}
            {fieldRow('tarifDrekIsi', 'Drek Isi Klasik (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Offset mengunci tarif plate/min/drek per file (config); 4 field Klasik hanya untuk lini Klasik.
          </p>
        </div>

        {/* Card 3: Jasa & Kemas */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Scissors className="w-4 h-4 text-violet-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Jasa, Kawat &amp; Kemas</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('umr', 'UMR (Rp) — Klasik 2818585, offset 2818850')}
            {fieldRow('tarifRoyalti', 'Royalty / pcs (Rp)')}
            {fieldRow('tarifKawatRoll', 'Kawat Stiching /roll (Rp) — offset')}
            {fieldRow('tarifTintaSpotUV', 'Tinta Spot UV /kg (Rp) — offset')}
            {fieldRow('tarifShrinkRoll', 'Shrink /roll (Rp) — per file')}
            {fieldRow('tarifSteplesPack', 'Steples 369/Pack (Rp)')}
            {fieldRow('tarifLakbanRoll', 'Lakban /roll (Rp)')}
            {fieldRow('tarifKardusBox', 'Kardus /box (Rp)')}
            {fieldRow('tarifSisirPerPcs', 'Sisir / pcs (Rp) — 150 flat')}
          </div>
          <p className="text-[10px] text-slate-500">
            Klasik: susun/steples-9/sisir. Offset: 5 jasa UMR atau BN/steples + SpotUV/Emboss/Shrink/Packing hidup.
          </p>
        </div>

        {/* Card 4: Finishing & Margin */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Bending, Laminasi &amp; Margin</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifBending', 'Bending (Rp)')}
            {fieldRow('minBending', 'Floor Bending (Rp)')}
            {fieldRow('tarifLaminasiGlossy', 'Glossy /cm²', { decimal: true })}
            {fieldRow('tarifLaminasiDoff', 'Doff /cm²', { decimal: true })}
            {fieldRow('tarifUvVarnish', 'UV /cm²', { decimal: true })}
            {fieldRow('minFinishing', 'Floor Finishing (Rp)')}
            {fieldRow('marginDefaultPct', 'Margin Default (%)', { rupiah: false, suffix: '%' })}
          </div>
          <p className="text-[10px] text-slate-500">
            Floor finishing Rp 50.000, bending Rp 100.000. Margin 30%, harga ke puluhan. Tanpa nego (3 folder).
          </p>
        </div>

        {/* Card 5: Custom F19/F21/F24 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <BookCopy className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800">5. Engine Custom — tarif print &amp; target jasa (10 lini F19/F21/F24)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {fieldRow('tarifPrintBuyaIsi', 'Print Isi Buya flat (Rp)')}
            {fieldRow('tarifPrintIsiA3', 'Print Isi A3+ (Rp) — per lini 350/2000/1750')}
            {fieldRow('targetLipat', 'Target Lipat /hari')}
            {fieldRow('targetSisir', 'Target Sisir /hari')}
            {fieldRow('targetSusunKomplit', 'Target Susun Komplit /hari')}
            {fieldRow('targetKawatRoll', 'Kawat 1 roll jadi (pcs)')}
            {fieldRow('targetStiching', 'Target Stiching /hari')}
          </div>
          <p className="text-[10px] text-slate-500">
            Laba custom = Margin Default (30%). Toggle jasa (Lipat/Sisir/Susun/Kawat vs Susun-Staples) default per lini di tab Kalkulasi.
            Temuan audit: file 24oo R7 tanpa ROUNDUP (9 file lain pakai) — diikat per lini; cabang mesin mati dikomposisi dari file yang hidup.
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
                  <h3 className="text-base font-bold tracking-tight">Manual Pengguna &amp; Pemetaan 6 Sumber Excel</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Folder 17, 17-21×29,7, 18-14,5, 19-14,5, 21-14,5 &amp; 24-10,5 · Pricelist Juli 2026 · 18 lini, 3 generasi engine
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
                  18 Lini dalam 1 Produk
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• <strong>21×29,7 Klasik Print Inter–Oliver</strong> (folder 17): tier 20–500, engine CX 25 suku, UMR 2818585, up isi 3%, desain isi Rp 15.000/hlm, SpotUV/Emboss/Shrink/Packing mati.</p>
                  <p>• <strong>21×29,7 Oliver–Oliver</strong>: tier 550–3000 · <strong>Print Inter–Oliver</strong>: 300–500 · <strong>Print Inter–Print Buya</strong>: 20–250 (engine DC 30 suku, UMR 2818850, up 0%, desain Rp 2.500×hal/4).</p>
                  <p>• <strong>14,5×20,25 OO/OR/PP/PR</strong> (folder 18): tier 1000–3000 / 650–900 / 20–200 / 250–600, engine DC + ROUNDUP R7, shrink Rp 1.162.500, AR2 Buya 350.</p>
                  <p>• <strong>14,5×20,25 Custom F19</strong>: Print Inter–Print Buya (20–200, insheet 10/7) &amp; Print Inter–Ryobi (250–600, insheet 10/30).</p>
                  <p>• <strong>14,5×20,25 Custom F21</strong>: Oliver–Oliver (1000–3000) &amp; Oliver–Ryobi (650–900) identik folder 18; Print Inter–Print Buya (20–200, insheet 7/5) &amp; Print Inter–Ryobi (250–600, insheet 7/30) MENANG atas F19 (keputusan user).</p>
                  <p>• <strong>10,5×14,8 Custom F24</strong>: Oliver–Oliver (1500–5000) · Print Inter–Oliver (700–1000) · Print Inter–Print Buya (20–200) · Print Inter–Ryobi (250–600); shrink Rp 832.500, drek isi 1750.</p>
                  <p>• Tiap lini terkunci ke filenya (ukuran/mesin bebas = #DIV/0! di Excel). Default per lini (UMR, up, insheet, shrink, D27) resolve otomatis; edit manual menang global.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Dropdown per Lini (diekstrak programatis)
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• Oplah: named range per file (12/12-5-8/5-5-7-8 tier). Halaman: bebas angka. Muka/warna cover &amp; warna isi: tombol penuh (plate = warna×muka).</p>
                  <p>• Finishing Master!D29 (9 opsi H29:H39): Klasik 7 terkomputasi; offset 9 terkomputasi (Glossy+Bending &amp; full-paket hanya di offset).</p>
                  <p>• Gramatur angka → rim; bahan = label. Sel mati (film, X6/C2/M26, D27 isi-PI, kardus/shrink Klasik) tanpa parameter.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  Rumus Kunci per Generasi
                </h4>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• Klasik: R=H+5, AP=((H/2)·4+(100/2)·4), BH=(2·AO−1000)·40 (negatif di oplah kecil), DD=ROUNDUP(−1).</p>
                  <p>• Offset: R=H/P+K/O (+ROUNDUP 14,5), AP=((H/AL)·AN+(AI/AL)·AN6), AN=hal/8, BD Buya=AR2·AO, packing ROUNDUP(H/isi)·kardus, DI=ROUNDUP(−1).</p>
                  <p>• Custom: C7=hal/4, R=H/P+K/O (file 24oo TANPA roundup — temuan audit Tahap-4), kertas rim V27/W27 &amp; AT27/AU27 per mesin×warna, ongkos Buya=AR2·AO (AR2=350), toggle jasa BI26:BO26, kardus CY35, DI=ROUNDUP(−1).</p>
                  <p>• Laba 30% semua file; tanpa nego (D39:H39 / D37:H37 identik). Komposisi cabang mesin-mati dari file yang hidup (disetujui user).</p>
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
