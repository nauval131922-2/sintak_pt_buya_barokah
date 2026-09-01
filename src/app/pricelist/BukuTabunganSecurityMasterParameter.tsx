'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Printer,
  Layers,
  Shield,
} from 'lucide-react';
import {
  DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS,
  BukuTabunganSecurityMasterParams,
} from '@/lib/buku-tabungan-security-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface BukuTabunganSecurityMasterParameterProps {
  customParams: BukuTabunganSecurityMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<BukuTabunganSecurityMasterParams>>;
}

const BUKU_TABUNGAN_SECURITY_VISIBLE_KEYS: (keyof BukuTabunganSecurityMasterParams)[] = [
  'tarifDesignCover',
  'tarifSecurityPerPcs',
  'tarifNumberingPerPcs',
  'tarifSusunLipatPerPcs',
  'tarifJahitPerPcs',
  'marginDefaultPct',
  'negoDefaultPct',
];

export default function BukuTabunganSecurityMasterParameter({
  customParams,
  setCustomParams,
}: BukuTabunganSecurityMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof BukuTabunganSecurityMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof BukuTabunganSecurityMasterParams) =>
    customParams[key] !== DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS[key];

  const handleResetField = (key: keyof BukuTabunganSecurityMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => BUKU_TABUNGAN_SECURITY_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      BUKU_TABUNGAN_SECURITY_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Buku Tabungan Security dikembalikan ke standar master.');
  };

  const fieldRow = (
    key: keyof BukuTabunganSecurityMasterParams,
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
        {isRupiah && !isDecimal ? (
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
            step={isDecimal ? 0.01 : 1}
            value={customParams[key] as number}
            onChange={(e) => handleChange(key, Number(e.target.value) || 0)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
          />
        )}
      </div>
    </div>
  );

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
                Master Parameter Buku Tabungan Security
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan Buku Tabungan 9×14,5 cm Security 24/32/48 Hal, cover Ivory 260 gsm FC + laminasi glossy + foil emas + numbering, isi HVS 70 gsm 1W BB, jahit + pound + susun lipat + security.
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
        {/* Card 1: Desain & Finishing */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">1. Desain &amp; Finishing Buku Tabungan</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifDesignCover', 'Desain Cover / Order (Rp)')}
            {fieldRow('tarifSusunLipatPerPcs', 'Susun Lipat / pcs (Rp)')}
            {fieldRow('tarifJahitPerPcs', 'Jahit / pcs (Rp)')}
            {fieldRow('tarifPoundPerPcs', 'Pound / pcs (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Desain cover Rp 15.000 + isi Rp 1.500/lbr (24 hal = 6 lbr = Rp 9.000). Jahit min Rp 250.000, pound pisau Rp 52.377 + jasa Rp 300/pcs, laminasi glossy Rp 0,35/cm² min Rp 50.000.
          </p>
        </div>

        {/* Card 2: Security Foil & Numbering */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Shield className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Security Foil &amp; Numbering</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifSecurityPerPcs', 'Security Foil Emas / pcs (Rp)')}
            {fieldRow('tarifNumberingPerPcs', 'Numbering Seri / pcs (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Tambahan Security vs Non Security: Security Paper watermark + Foil Emas Rp 550/pcs, Numbering seri Rp 350/pcs. Harga sedikit lebih tinggi dari NS (heuristik Pricelist Juli 2026 tier sama 50–1500).
          </p>
        </div>

        {/* Card 3: Margin & Nego Standar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Margin &amp; Nego Standar</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md">
            {fieldRow('marginDefaultPct', 'Margin Default (%)', false)}
            {fieldRow('negoDefaultPct', 'Nego Default (%)', false)}
          </div>
          <p className="text-[10px] text-slate-500">
            Margin 30% &amp; nego 5% sesuai HARGA JULI 2026 (O=ROUNDUP(N*130%,-2) , P=ROUNDUP(O*95%,-2)). HPP dihitung per pcs dengan pembulatan ke kelipatan Rp 10.
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Buku Tabungan Security (15. Pricelist Buku Tabungan Security)
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
                  Pemetaan Master Parameter ke File Excel (Folder 15. Pricelist Buku Tabungan Security/*.xlsm)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan Kertas &amp; Ukuran</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Cover Ivory 260 gsm Security</strong>: <span className="font-mono text-emerald-700">Master!D12</span> Rp 16.400/kg + up 5%, insheet 15 lbr, 4 cover/A3+ (BUKU!P7).</li>
                      <li>• <strong>Isi HVS 70 gsm</strong>: <span className="font-mono text-emerald-700">Master!D22</span> Rp 15.700/kg + up 5%, insheet 30 lbr, 6-12 lbr/buku (24/32/48 hal ÷4), 6 lbr/A3+.</li>
                      <li>• <strong>Ukuran</strong>: <span className="font-mono text-emerald-700">9 × 14,5 cm</span> tertutup, AC 260 0,041 kg/A3+, HVS 70 0,011 kg/A3+.</li>
                      <li>• <strong>Varian</strong>: 24 Hal (6 lbr), 32 Hal (8 lbr), 48 Hal (12 lbr) — Security foil + numbering, HARGA JULI 2026 sama tier 50–1500.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Cetak &amp; Laminasi</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Cover Print Inter</strong>: 1 Muka FC Rp 3.500/A3+ (Master!D18) — BUKU!T7 =T2*R7.</li>
                      <li>• <strong>Isi Ryobi</strong>: 1 Warna BB ≤500 Rp 1.500/A3+, ＞500 Oliver 0.6× + plat 180k.</li>
                      <li>• <strong>Laminasi Glossy</strong>: <span className="font-mono text-blue-700">BUKU!CF7</span> Rp 0,35/cm² min Rp 50.000, luas (10×2+1)*(15.5+1)=≈346,5 cm² × oplah.</li>
                      <li>• <strong>Desain</strong>: Cover Rp 15.000 + Isi Rp 1.500/lbr × 6/8/12 lbr.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span>3. Security Foil &amp; Numbering</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Security Foil Emas</strong>: Rp 550/pcs (Foil Emas + Security Paper watermark — heuristik, harga sedikit lebih tinggi dari NS).</li>
                      <li>• <strong>Numbering Seri</strong>: Rp 350/pcs (Nomor seri + watermark).</li>
                      <li>• <strong>Porsi</strong>: Total +Rp 900/pcs di HPP, masuk breakdown setelah Pound.</li>
                      <li>• <strong>Sumber</strong>: Folder 15 vs 14, bahan cover Ivory (vs AC) + foil emas di pricelist Security.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>4. Finishing &amp; Packing</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Susun Lipat</strong>: Rp 125/pcs (BUKU!BI).</li>
                      <li>• <strong>Jahit</strong>: Rp 500/pcs min Rp 250.000.</li>
                      <li>• <strong>Pound</strong>: Pisau Rp 52.377 + Jasa Rp 300/pcs.</li>
                      <li>• <strong>Plastik Sring &amp; Kardus</strong>: Sring Rp 150/pcs + Kardus Rp 8.500 + Lakban Rp 8.000 per order.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 md:col-span-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>5. Margin &amp; Nego</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Margin</strong>: 30% dari HPP, nego 5% dari harga jual (O=ROUNDUP(N*130%,-2), P=ROUNDUP(O*95%,-2)).</li>
                      <li>• Harga jual = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">ceil(HPP/pcs ×1.30 /10)*10</code>.</li>
                      <li>• Tier global: 50–1500 pcs (15 tier HARGA JULI 2026) sama dengan Non Security.</li>
                    </ul>
                  </div>
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
