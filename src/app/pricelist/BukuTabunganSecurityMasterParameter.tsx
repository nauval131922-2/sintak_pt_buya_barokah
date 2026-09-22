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
  Percent,
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
  'jumlahHalaman', 'umr',
  'tarifKertasCoverKg', 'upKertasCoverPct', 'insheetCover', 'tarifDesainCover', 'tarifPrintCoverA3', 'tarifFilmBw',
  'tarifKertasIsiKg', 'upKertasIsiPct', 'insheetIsi', 'tarifDesainIsiPerLbr', 'tarifPrintIsiA3', 'tarifFilmWarna', 'tarifJasaPrintBuya',
  'tarifKawatStiching', 'tarifTintaSpotUvKg', 'tarifPlastikSringRoll', 'tarifSteplesPack', 'tarifLakbanRoll', 'tarifKardusBox', 'royalty',
  'targetSusunLipat', 'targetJahit', 'targetPound', 'targetSpotUv', 'targetEmboss', 'targetSring', 'targetLakban',
  'tarifPisauPound', 'tarifSisirPaket', 'tarifBending', 'tarifLamGlossy', 'tarifLamDoff', 'tarifUvVarnish',
  'minJahit', 'minPound', 'minBendingKombi', 'minLaminasi',
  'ukuranPlastikSringCm', 'ukuranLakbanCm', 'acuanSpotUvCm', 'labaPct',
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
    (customParams[key] ?? DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS[key]) !== DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS[key];

  const handleResetField = (key: keyof BukuTabunganSecurityMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => BUKU_TABUNGAN_SECURITY_VISIBLE_KEYS.some((key) => (customParams[key] ?? DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS[key]) !== DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS[key]),
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
            value={customParams[key] ?? DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS[key]}
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

  const card = (icon: React.ReactNode, title: string, desc: string, children: React.ReactNode) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        {icon}
        <h3 className="text-xs font-bold text-slate-800">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{children}</div>
      <p className="text-[10px] text-slate-500">{desc}</p>
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
              Tarif acuan Buku Tabungan 9 × 14,5 cm Security (2 file Source: Ryobi oplah besar, Print Buya oplah kecil). Engine klon Non Security 1:1 (tanpa Foil/Numbering). Default = file besar.
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
        {card(
          <Printer className="w-4 h-4 text-blue-600" />,
          '1. Umum & Kertas Cover',
          'Master!D6/D8/D12-D13/D17-D18. Cover Print Inter: kertas (R7/500)×W29 diganti jasa T2×R7; Plat/Min/Drek hanya mesin offset (BUKU!Y6/AB6/AC7).',
          <>
            {fieldRow('jumlahHalaman', 'Jumlah Halaman (Master!D6)', { rupiah: false })}
            {fieldRow('umr', 'UMR (Master!D8 → A07.UMR)')}
            {fieldRow('tarifKertasCoverKg', 'Kertas Cover /kg (Master!D12)')}
            {fieldRow('upKertasCoverPct', 'Up Kertas Cover % (Master!E12)', { rupiah: false, suffix: '%' })}
            {fieldRow('insheetCover', 'Insheet Cover lbr (Master!D13)', { rupiah: false })}
            {fieldRow('tarifDesainCover', 'Desain Cover /order (Master!D17)')}
            {fieldRow('tarifPrintCoverA3', 'Print Cover A3+ (Master!D18)')}
            {fieldRow('tarifFilmBw', 'Film BW (BUKU!W6, V30 mati)', { decimal: true })}
          </>
        )}

        {card(
          <Layers className="w-4 h-4 text-emerald-600" />,
          '2. Kertas Isi & Cetak Isi',
          'Master!D22-D23/D26-D27. Isi Print Buya: kertas (AP7/500)×AU29 diganti jasa 350×AO7; Inter: (AR2×2)×AP7 (BUKU!AR7/BD7).',
          <>
            {fieldRow('tarifKertasIsiKg', 'Kertas Isi /kg (Master!D22)')}
            {fieldRow('upKertasIsiPct', 'Up Kertas Isi % (Master!E22)', { rupiah: false, suffix: '%' })}
            {fieldRow('insheetIsi', 'Insheet Isi lbr (Master!D23)', { rupiah: false })}
            {fieldRow('tarifDesainIsiPerLbr', 'Desain Isi /lbr (Master!D26)')}
            {fieldRow('tarifPrintIsiA3', 'Print Isi A3+ (Master!D27)')}
            {fieldRow('tarifFilmWarna', 'Film Warna (BUKU!AU6, selalu 0)', { decimal: true })}
            {fieldRow('tarifJasaPrintBuya', 'Jasa Print Buya (BUKU!AR2)')}
          </>
        )}

        {card(
          <Scissors className="w-4 h-4 text-amber-600" />,
          '3. Jasa UMR & Finishing Mekanik',
          'Jasa = (UMR/25)÷target (BUKU!BI6/BJ6/BM6/BV6/BZ6/CV6). Jahit min 250rb & Pound min 50rb tetap jalan saat toggle X (1:1 Excel). Sisir = 3×50 (BUKU!BQ6).',
          <>
            {fieldRow('tarifPisauPound', 'Pisau Pound (BUKU!BL6 √)', { decimal: true })}
            {fieldRow('tarifSisirPaket', 'Sisir /pcs (BUKU!BQ6 √)')}
            {fieldRow('tarifBending', 'Bending (BUKU!CC6)')}
            {fieldRow('tarifTintaSpotUvKg', 'Tinta Spot UV /kg (Master!D31)')}
            {fieldRow('tarifPlastikSringRoll', 'Plastik Sring /roll (Master!D32)')}
            {fieldRow('tarifLakbanRoll', 'Lakban /roll (Master!D34)')}
            {fieldRow('tarifKardusBox', 'Kardus /box (Master!D35)')}
            {fieldRow('royalty', 'Royalty (Master!D36)')}
            {fieldRow('tarifKawatStiching', 'Kawat Stiching (info, Master!D30)')}
            {fieldRow('tarifSteplesPack', 'Steples /pack (info, Master!D33)')}
          </>
        )}

        {card(
          <Layers className="w-4 h-4 text-violet-600" />,
          '4. Laminasi, Target Harian & Batas Min',
          'Laminasi = luas (D7×2+1)×(F7+1) × tarif, min 50rb (BUKU!CG7/CJ7/CM7). Bending+kombi min 100rb (CE7). Target ÷UMR per ukuran 10 X 15.',
          <>
            {fieldRow('tarifLamGlossy', 'Laminasi Glossy /cm² (BUKU!CF6)', { decimal: true })}
            {fieldRow('tarifLamDoff', 'Laminasi Doff /cm² (BUKU!CI6)', { decimal: true })}
            {fieldRow('tarifUvVarnish', 'UV Varnish /cm² (BUKU!CL6)', { decimal: true })}
            {fieldRow('targetSusunLipat', 'Target Susun-Lipat (BUKU!BI28)', { rupiah: false })}
            {fieldRow('targetJahit', 'Target Jahit (BUKU!BJ28)', { rupiah: false })}
            {fieldRow('targetPound', 'Target Pound (BUKU!BM28)', { rupiah: false })}
            {fieldRow('targetSpotUv', 'Target Spot UV (BUKU!BT27)', { rupiah: false })}
            {fieldRow('targetEmboss', 'Target Emboss (BUKU!BZ27)', { rupiah: false })}
            {fieldRow('targetSring', 'Target Sring (BUKU!CV28)', { rupiah: false })}
            {fieldRow('targetLakban', 'Target Lakban (BUKU!CZ28)', { rupiah: false })}
            {fieldRow('minJahit', 'Min Jahit (BUKU!BJ7)')}
            {fieldRow('minPound', 'Min Pound (BUKU!BM7)')}
            {fieldRow('minBendingKombi', 'Min Bending Kombi (BUKU!CE7)')}
            {fieldRow('minLaminasi', 'Min Laminasi/UV (BUKU!CG7)')}
          </>
        )}

        {card(
          <Percent className="w-4 h-4 text-rose-600" />,
          '5. Konstanta Roll & Laba',
          'Acuan roll per ukuran 10 X 15 (BUKU!CT30/CZ30/BT30). Laba Master!E37 → BUKU!DE6; final ROUNDUP puluhan (BUKU!DI7).',
          <>
            {fieldRow('ukuranPlastikSringCm', 'Plastik Sring cm/roll (BUKU!CT30)', { rupiah: false })}
            {fieldRow('ukuranLakbanCm', 'Lakban cm/roll (BUKU!CZ30)', { rupiah: false })}
            {fieldRow('acuanSpotUvCm', 'Acuan Spot UV cm (BUKU!BT30)', { rupiah: false })}
            {fieldRow('labaPct', 'Laba % (Master!E37)', { rupiah: false, suffix: '%' })}
          </>
        )}
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
                    15. Pricelist Buku Tabungan Security/Source: Security Ryobi.xlsm (250–1500) + Security.xlsm (50–200) · sheet Master + BUKU (klon NS 1:1)
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
                  Alur hitung (1:1 BUKU)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Cover — plano &amp; cetak (BUKU!O7–AG7)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• Plano <span className="font-mono text-emerald-700">R7 = ROUNDUP(H/P7 + insheet/O7)</span>; kapasitas O7/P7 per mesin: Inter 1/4, Ryobi 9/9, Oliver 4/16, SM 2/16.</li>
                      <li>• Kertas <span className="font-mono text-emerald-700">T7</span>: offset = (R7/500)×W29 (ream <span className="font-mono text-emerald-700">W29 = V27×W27×gramatur/20000 × (harga+up)</span>); Print Inter = <span className="font-mono text-emerald-700">T2×R7</span> (<span className="font-mono text-emerald-700">T2 = Master!D18</span>).</li>
                      <li>• Plat <span className="font-mono text-emerald-700">Y6×Z7</span> (Ryobi 10rb, Oliver 45rb, SM 78rb; Inter 0) × warna×muka; ongkos <span className="font-mono text-emerald-700">AG7</span> = min/plat + drek×over (Ryobi Q−500, Oliver Q−1000, SM Q−3000).</li>
                      <li>• Desain <span className="font-mono text-emerald-700">V7 = Master!D17</span> flat 15.000. Film BW <span className="font-mono text-emerald-700">W7</span> selalu 0 (V30 kosong — sel mati).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Isi — naik cetak &amp; cetak (BUKU!AK7–BD7)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <span className="font-mono text-blue-700">AN7 = halaman/(AM7/AL7)</span>; AK/AL/AM per mesin: Buya 4/1/8, Inter 8/1/16, Ryobi 4/1/8, Oliver 16/2/64, SM 32/1/64.</li>
                      <li>• Plano <span className="font-mono text-blue-700">AP7 = (H/AL)×AN7 + (insheet/AL)×ceil(AN7)</span>; kertas <span className="font-mono text-blue-700">AR7</span>: offset (AP7/500)×AU29, Inter (AR2×2)×AP7, Buya 350×AO7.</li>
                      <li>• Desain <span className="font-mono text-blue-700">AT7 = Master!D26 × (halaman/4)</span> = 1.500×6 = 9.000. Film warna <span className="font-mono text-blue-700">AU7</span> selalu 0 (AU6=0 — sel mati).</li>
                      <li>• Plat &amp; ongkos isi <span className="font-mono text-blue-700">AW7/BD7</span> per mesin (Buya/Inter tanpa plat &amp; drek).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Jasa UMR &amp; finishing (BUKU!BI7–DA7)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• Jasa = (UMR/25)÷target: Susun-Lipat ÷900, Jahit ÷250 (min 250rb), Pound ÷450 (min 50rb), SpotUV ÷500, Emboss ÷1000, Sring 2×UMR÷500.</li>
                      <li>• Toggle √/X: Jahit <span className="font-mono text-amber-700">BJ26</span>, Pisau Pound <span className="font-mono text-amber-700">BL26</span> (299,3), Jasa Pound <span className="font-mono text-amber-700">BM26</span>, Sisir <span className="font-mono text-amber-700">BQ26</span> (150), Kardus <span className="font-mono text-amber-700">DA28</span>.</li>
                      <li>• Finishing <span className="font-mono text-amber-700">Master!D29</span> menggerakkan SpotUV/Emboss/Bending/Laminasi/kombo/Sring otomatis (BUKU!BW27/CA27/CC27/CG27/CJ27/CM27/CO27/CP27/CQ27/CW28).</li>
                      <li>• Quirk 1:1: <span className="font-mono text-amber-700">DC7</span> menjumlah BN7+BM7+BL7 sekaligus (Pound triple-count, bukan bug SINTAK).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Total &amp; harga (BUKU!DC7–DI7)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• Total HPP <span className="font-mono text-violet-700">DC7</span> (28 komponen, tanpa Film BW/Warna); HPP/pcs <span className="font-mono text-violet-700">DD7 = DC7/H</span>.</li>
                      <li>• Laba <span className="font-mono text-violet-700">DE7 = DD7×30%</span> (<span className="font-mono text-violet-700">Master!E37</span>); final <span className="font-mono text-violet-700">DI7 = ROUNDUP(DH7,−1)</span> puluhan → <span className="font-mono text-violet-700">Master!D39</span>.</li>
                      <li>• Tier: kecil 50–200 (isi Print Buya), besar 250–1500 (isi Ryobi); simulator menggabung 15 tier, mesin isi Otomatis (&lt;250 Buya, ≥250 Ryobi).</li>
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
