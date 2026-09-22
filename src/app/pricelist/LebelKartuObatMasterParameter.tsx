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
  Package,
} from 'lucide-react';
import {
  DEFAULT_LEBEL_KARTU_OBAT_PARAMS,
  LebelKartuObatMasterParams,
} from '@/lib/lebel-kartu-obat-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface LebelKartuObatMasterParameterProps {
  customParams: LebelKartuObatMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<LebelKartuObatMasterParams>>;
}

const LEBEL_KARTU_OBAT_VISIBLE_KEYS: (keyof LebelKartuObatMasterParams)[] = [
  'tarifKertasKg',
  'upKertasPct',
  'gramaturGsm',
  'insheetLbr',
  'tarifDesain',
  'tarifPlatePerPlat',
  'tarifCetakMinPerPlat',
  'tarifDrekPerWarna',
  'tarifRoyaltyPerPcs',
  'biayaTransport',
  'tarifSisirPer500',
  'marginDefaultPct',
];

export default function LebelKartuObatMasterParameter({
  customParams,
  setCustomParams,
}: LebelKartuObatMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof LebelKartuObatMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof LebelKartuObatMasterParams) =>
    customParams[key] !== DEFAULT_LEBEL_KARTU_OBAT_PARAMS[key];

  const handleResetField = (key: keyof LebelKartuObatMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_LEBEL_KARTU_OBAT_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_LEBEL_KARTU_OBAT_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => LEBEL_KARTU_OBAT_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_LEBEL_KARTU_OBAT_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      LEBEL_KARTU_OBAT_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_LEBEL_KARTU_OBAT_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Lebel Kartu Obat dikembalikan ke standar master.');
  };

  const fieldRow = (
    key: keyof LebelKartuObatMasterParams,
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
            value={customParams[key] ?? DEFAULT_LEBEL_KARTU_OBAT_PARAMS[key]}
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
                Master Parameter Lebel Kartu Obat
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan Lebel Kartu Obat 3,5×7 / 4×6 / 5×6,7 cm HVS 70 gsm Folio — Cetak / Ongkos Cetak, Sisir + Packing.
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
        {/* Card 1: Kertas & Desain */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">1. Kertas &amp; Desain (Master!D12–D16)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifKertasKg', 'Kertas HVS / kg (Rp) — D13')}
            {fieldRow('upKertasPct', 'Up Kertas (%) — E13', { rupiah: false, suffix: '%' })}
            {fieldRow('gramaturGsm', 'Gramatur (gsm) — D12', { rupiah: false })}
            {fieldRow('insheetLbr', 'Insheet (lbr) — D15', { rupiah: false })}
            {fieldRow('tarifDesain', 'Desain / Order (Rp) — D16')}
          </div>
          <p className="text-[10px] text-slate-500">
            HVS 70 gsm Folio 21,5×33 cm Rp 15.700/kg +5% (rim Rp 40.936/500), insheet 30 lbr polos (BUKU!K7 tanpa koefisien), desain Rp 10.000/order.
          </p>
        </div>

        {/* Card 2: Cetak */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Scissors className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Plate, Cetak &amp; Sisir (BUKU!W6/Z6/AA7/AJ6)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifPlatePerPlat', 'Plate / Plat (Rp) — W6')}
            {fieldRow('tarifCetakMinPerPlat', 'Min Cetak / Plat (Rp) — Z6')}
            {fieldRow('tarifDrekPerWarna', 'Drek / Warna (Rp) — AA7')}
            {fieldRow('tarifSisirPer500', 'Sisir /500 lbr (Rp) — AJ6')}
            {fieldRow('tarifRoyaltyPerPcs', 'Royalty / rim (Rp) — AG6')}
            {fieldRow('biayaTransport', 'Transport / order (Rp) — AI6')}
          </div>
          <p className="text-[10px] text-slate-500">
            Plate Rp 10.000×(warna×muka) — Rp 0 saat ONGKOS CETAK. Over = P−500 (Rp 30×plat). Sisir (Q/500)×Rp 10.000 hanya saat finishing SISIR.
          </p>
        </div>

        {/* Card 3: Margin */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Margin Standar (Master!E21)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md">
            {fieldRow('marginDefaultPct', 'Margin Default (%) — E21', { rupiah: false, suffix: '%' })}
          </div>
          <p className="text-[10px] text-slate-500">
            Margin 30% dari HPP per rim, harga dibulatkan ke puluhan (BUKU!AR7 =ROUNDUP(AQ,−1)). Excel tidak punya kolom nego — nego dihapus.
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
                    Referensi sheet, cell, dan formula master Lebel Kartu Obat (16. Pricelist Lebel Kartu Obat/Source/*.xlsm)
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
                  <p>• <strong>Master!D6 Ukuran</strong>: 1 item per file (= varian 3,5×7 / 4×6 / 5×6,7 — tanpa efek biaya, ketiga file klon identik).</p>
                  <p>• <strong>Master!D7 Oplah</strong>: named range <span className="font-mono text-emerald-700">Oplah</span> → 10 tier rim BUKU!H7:H16 = 1–10 (1 rim = 500 lbr).</p>
                  <p>• <strong>Master!D10 Jenis Cetak</strong>: <span className="font-mono text-emerald-700">CETAK, ONGKOS CETAK,</span> — ONGKOS CETAK menolkan biaya plate (BUKU!W6), min &amp; drek tetap jalan.</p>
                  <p>• <strong>Master!D17 Warna</strong> (1–4) &amp; <strong>Master!D18 Muka</strong> (1/2): jumlah plat = warna×muka (BUKU!X7), pengali drek over = plat.</p>
                  <p>• <strong>Master!D20 Finishing</strong>: <span className="font-mono text-emerald-700">SISIR, TANPA SISIR,</span> → gate biaya sisir BUKU!AJ7.</p>
                  <p>• <strong>Master!D5/D11/D12</strong>: FOLIO, bahan HVS/BC/CD (label saja), gramatur angka 55–160 → BUKU!U27.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Alur Hitung BUKU (per tier rim H)
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• <strong>Plano BUKU!Q7</strong>: =(H·500)/O + K/N (K = insheet 30 polos, tanpa koefisien &amp; tanpa ROUNDUP). <strong>Cetak BUKU!P7</strong>: =N·Q.</p>
                  <p>• <strong>Kertas BUKU!R7</strong>: =(U28/500)·Q dengan <span className="font-mono text-emerald-700">BUKU!U28</span> =((21,5·33)·70)/20000·(15.700·1,05) = Rp 40.936/rim.</p>
                  <p>• <strong>Plat BUKU!W7</strong>: =W6·(warna×muka). <strong>Cetak BUKU!AE7</strong>: =15.000·plat + over·30·plat, over = P−500 (Rp 0 hanya jika P−500 tepat 0).</p>
                  <p>• <strong>Sisir BUKU!AJ7</strong>: =(Q/500)·10.000 (saat SISIR). <strong>Total BUKU!AL7</strong>: =SUM(R+T+W+AE+AG+AI+AJ).</p>
                  <p>• <strong>Harga BUKU!AR7</strong>: =ROUNDUP(AQ,−1) ke puluhan, laba 30% (Master!E21).</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  Sel Mati di Excel (sengaja tidak jadi parameter)
                </h4>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• <strong>Master!D8 UMR Rp 2.818.585</strong>: tidak direferensikan rumus BUKU mana pun — engine tidak menghitung upah/jasa.</p>
                  <p>• <strong>BUKU!U6 Film (=0) + T29, BUKU!X6 (=0), BUKU!C6</strong>: konstanta/sel mati tanpa efek biaya.</p>
                  <p>• Ketiga file varian klon identik — pemilih varian hanya label ukuran, bukan pembeda biaya.</p>
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
