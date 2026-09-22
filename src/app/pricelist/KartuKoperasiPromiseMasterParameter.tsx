'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Printer,
  Layers,
  CreditCard,
  Package,
} from 'lucide-react';
import {
  DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS,
  KartuKoperasiPromiseMasterParams,
} from '@/lib/kartu-koperasi-promise-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface KartuKoperasiPromiseMasterParameterProps {
  customParams: KartuKoperasiPromiseMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<KartuKoperasiPromiseMasterParams>>;
}

const KARTU_KOPERASI_PROMISE_VISIBLE_KEYS: (keyof KartuKoperasiPromiseMasterParams)[] = [
  'umr',
  'tarifKertasKg',
  'upKertasPct',
  'insheet',
  'koefInsheet',
  'gramaturGsm',
  'tarifDesign',
  'tarifPrintA3Plus',
  'tarifPlatePerPlat',
  'tarifCetakMinPerPlat',
  'tarifRoyaltyPerPcs',
  'biayaTransport',
  'biayaLain',
  'tarifPisauPerCm2',
  'tarifSisirPer500',
  'minPound',
  'tarifLaminasiGlossy',
  'tarifLaminasiDoff',
  'tarifUvVarnish',
  'minFinishing',
  'tarifKardusBox',
  'tarifLakbanRoll',
  'lakbanUkuranRoll',
  'kardusIsiPcs',
  'marginDefaultPct',
];

export default function KartuKoperasiPromiseMasterParameter({
  customParams,
  setCustomParams,
}: KartuKoperasiPromiseMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof KartuKoperasiPromiseMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof KartuKoperasiPromiseMasterParams) =>
    customParams[key] !== DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[key];

  const handleResetField = (key: keyof KartuKoperasiPromiseMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => KARTU_KOPERASI_PROMISE_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      KARTU_KOPERASI_PROMISE_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Kartu Koperasi Promise dikembalikan ke standar master.');
  };

  const fieldRow = (
    key: keyof KartuKoperasiPromiseMasterParams,
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
            value={customParams[key] ?? DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[key]}
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
                Master Parameter Kartu Koperasi Promise
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan Kartu Koperasi Promise 10,5×16,5 / 10,5×21,5 / 12,7×16,3 cm BC 160 gsm — Print Inter / Ryobi, Pound + Sisir + Packing.
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
            <h3 className="text-xs font-bold text-slate-800">1. Kertas &amp; Desain (Master!D10–D17)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifKertasKg', 'Kertas / kg (Rp) — D11')}
            {fieldRow('upKertasPct', 'Up Kertas (%) — E11', { rupiah: false, suffix: '%' })}
            {fieldRow('gramaturGsm', 'Gramatur (gsm) — D10', { rupiah: false })}
            {fieldRow('insheet', 'Insheet (lbr) — D12', { rupiah: false })}
            {fieldRow('koefInsheet', 'Koef. Insheet — BUKU!K2', { rupiah: false, decimal: true })}
            {fieldRow('tarifDesign', 'Desain / Order (Rp) — D16')}
            {fieldRow('tarifPrintA3Plus', 'Print A3+ (Rp) — D17')}
          </div>
          <p className="text-[10px] text-slate-500">
            Default file: kertas Rp 34.800 +5% &amp; desain Rp 15.000 (varian 10,5) vs Rp 33.000 +0% &amp; tanpa desain (12,7×16,3) — simulator otomatis memakai bawaan tiap file kecuali field diubah manual.
          </p>
        </div>

        {/* Card 2: Cetak */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <CreditCard className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Plate, Cetak &amp; Jasa (BUKU!X6/AA6/AH6/AJ6/AK6)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifPlatePerPlat', 'Plate / Plat (Rp) — X6')}
            {fieldRow('tarifCetakMinPerPlat', 'Min Cetak / Plat (Rp) — AA6')}
            {fieldRow('tarifRoyaltyPerPcs', 'Royalty / pcs (Rp) — D22')}
            {fieldRow('biayaTransport', 'Transport / order (Rp) — AJ6')}
            {fieldRow('biayaLain', 'Biaya Lain-Lain (Rp) — AK6')}
          </div>
          <p className="text-[10px] text-slate-500">
            Plate Rp 10.000 &amp; min cetak Rp 15.000 per plat hanya untuk Ryobi (Print Inter = Rp 0). Jumlah plat = warna × muka (12,7 override 1 plat). Drek over: Rp 40 (10,5) / Rp 30 (12,7).
          </p>
        </div>

        {/* Card 3: Finishing */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-violet-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Finishing Pound, Sisir &amp; Laminasi (BUKU!AL6/AN6/AP6/AS6/AV6)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('umr', 'UMR (Rp) — D7')}
            {fieldRow('tarifPisauPerCm2', 'Pisau / cm² (Rp) — AL6', { decimal: true })}
            {fieldRow('tarifSisirPer500', 'Sisir /500 unit (Rp) — AN6')}
            {fieldRow('minPound', 'Min Pound (Rp) — AM7')}
            {fieldRow('tarifLaminasiGlossy', 'Laminasi Glossy /cm² — AP6', { decimal: true })}
            {fieldRow('tarifLaminasiDoff', 'Laminasi Doff /cm² — AS6', { decimal: true })}
            {fieldRow('tarifUvVarnish', 'UV Varnish /cm² — AV6', { decimal: true })}
            {fieldRow('minFinishing', 'Floor Finishing (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Pound = (UMR/25)/target (target 800 utk 10,5 / 1.200 utk 12,7), min Rp 50.000. Laminasi/UV = luas×rate×oplah, floor Rp 50.000, aktif sesuai pilihan Catatan Master!D19.
          </p>
        </div>

        {/* Card 4: Packing & Margin */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Package className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Packing &amp; Margin (Master!D20/D21/E23)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifKardusBox', 'Kardus / box (Rp) — D21')}
            {fieldRow('tarifLakbanRoll', 'Lakban / roll (Rp) — D20')}
            {fieldRow('lakbanUkuranRoll', 'Ukuran Lakban /Roll — BA30', { rupiah: false })}
            {fieldRow('kardusIsiPcs', 'Isi Kardus (pcs) — AZ35', { rupiah: false })}
            {fieldRow('marginDefaultPct', 'Margin Default (%) — E23', { rupiah: false, suffix: '%' })}
          </div>
          <p className="text-[10px] text-slate-500">
            Kardus CEIL(oplah/3000)×Rp 8.500 + lakban (oplah/3000)/(7650/196)×Rp 8.000. Margin 30% dari HPP, harga dibulatkan ke puluhan (Excel tidak punya kolom nego — nego dihapus).
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
                    Referensi sheet, cell, dan formula master Kartu Koperasi Promise (15. Pricelist kartu Koperasi Promise/Source/*.xlsm)
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
                  Dropdown Master!D5–D19 (diekstrak programatis via dataValidation)
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• <strong>Master!D5 Ukuran</strong>: 1 item per file (= varian: 10,5×16,5 / 10,5×21,5 / 12,7×16,3).</p>
                  <p>• <strong>Master!D6 Oplah</strong>: named range <span className="font-mono text-emerald-700">Oplah</span> → 15 tier BUKU!H7:H21 = 500–10.000.</p>
                  <p>• <strong>Master!D13 Muka</strong>: <span className="font-mono text-emerald-700">1 Muka, 2 Muka</span> → BUKU!M7 (jumlah plat &amp; P file 12,7).</p>
                  <p>• <strong>Master!D14 Warna</strong>: <span className="font-mono text-emerald-700">1–4 Warna</span> → BUKU!Y2/L7 (jumlah plat &amp; pengali drek over).</p>
                  <p>• <strong>Master!D15 Cetak</strong>: <span className="font-mono text-emerald-700">Print Inter, Ryobi</span> → potong/plano (N7), kartu/plano (O7), jalur biaya kertas &amp; cetak.</p>
                  <p>• <strong>Master!D19 Catatan</strong>: <span className="font-mono text-emerald-700">None, / UV Varnish, / Laminasi Glossy, / Laminasi Doff,</span> → gate √ BUKU!AQ27/AT27/AW27.</p>
                  <p>• <strong>Master!D9 Bahan</strong> (BC/HVS/…): hanya label tampilan BUKU!X28, tanpa efek biaya. <strong>Master!D10 Gramatur</strong> (17 opsi): dipetakan ke angka BUKU!V28 → harga rim.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Alur Hitung BUKU!K7–BJ7 (per tier oplah H)
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• <strong>Insheet BUKU!K7</strong>: =IF(K2·H≤40, 40, IF(K2·H&gt;30, K2·H, insheet)) dengan K2 = <span className="font-mono text-emerald-700">BUKU!K2</span> 0,025.</p>
                  <p>• <strong>Plano BUKU!Q7</strong>: =ROUNDUP(H/O+K/N,0). <strong>Cetak BUKU!P7</strong>: =Q·N (×muka hanya file 12,7).</p>
                  <p>• <strong>Kertas BUKU!S7</strong>: Print Inter = Rp 2.500×Q; Ryobi = (V29/500)×Q dengan <span className="font-mono text-emerald-700">BUKU!V29</span> =((planoW×planoH)×gsm)/20000×(kg×(1+up)).</p>
                  <p>• <strong>Plat BUKU!X7</strong>: =X6×Y7; Y7 = override Y6 (12,7: 1 plat) atau warna×muka. <strong>Cetak BUKU!AF7</strong>: =min×plat + over×drek×warna, over = P−500 jika &gt;1.</p>
                  <p>• <strong>Pound BUKU!AM7</strong>: =MAX(50.000, H/(O/N)×(UMR/25)/target); target 800 (10,5) / 1.200 (12,7). <strong>Sisir BUKU!AN7</strong>: =(H/(O/N)/500)×10.000.</p>
                  <p>• <strong>Pisau BUKU!AL7</strong>: =149,8×(21,5×31,5) / (17×26,1 utk 12,7). <strong>Packing BUKU!BB7</strong>: =ROUNDUP(H/3000)×8.500 + lakban.</p>
                  <p>• <strong>Total BUKU!BD7</strong>: =S+U+X+AF+AH+AJ+AN+AQ+AT+AW+AK+BB+AM+AL. <strong>Harga BUKU!BJ7</strong>: =ROUNDUP(BI,−1), laba 30% (Master!E23).</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  Perbedaan Bawaan Antar-File (diikat per varian, bukan kompromi)
                </h4>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• Kertas <span className="font-mono">D11</span> Rp 34.800 + up 5% (10,5) vs Rp 33.000 + up 0% (12,7); desain <span className="font-mono">D16</span> Rp 15.000 vs Rp 0.</p>
                  <p>• Drek over Rp 40 (10,5) vs Rp 30 (12,7); plano 21,5×33 vs 61×86; Ryobi 1/4, 1/3 vs 11/22 (potong/kartu); P 12,7 dikali muka.</p>
                  <p>• Simulator memakai bawaan file tiap varian secara otomatis; setiap field yang diubah di tab ini menang secara global.</p>
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
