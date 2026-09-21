'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Printer,
  Layers,
  Package,
  Info,
} from 'lucide-react';
import {
  DEFAULT_SERTIFIKAT_PARAMS,
  SertifikatMasterParams,
  SERTIFIKAT_GRAMATUR_OPTIONS,
} from '@/lib/sertifikat-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface SertifikatMasterParameterProps {
  customParams: SertifikatMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<SertifikatMasterParams>>;
}

type NumKey = {
  [K in keyof SertifikatMasterParams]: SertifikatMasterParams[K] extends number ? K : never;
}[keyof SertifikatMasterParams];

const SERTIFIKAT_VISIBLE_KEYS: NumKey[] = [
  'hargaKgAc',
  'hargaKgBc',
  'hargaKgLinen',
  'upAcOffset',
  'upAcPrint',
  'upBcOffset',
  'upBcPrint',
  'upLinenOffset',
  'upLinenPrint',
  'gramaturAc',
  'gramaturBc',
  'gramaturLinen',
  'insheetOffset',
  'insheetPrint',
  'desain',
  'tarifPrintAc',
  'tarifPrintBc',
  'tarifPrintLinen',
  'tarifSisir',
  'tarifLamGlossy',
  'tarifLamDoff',
  'tarifUv',
  'tarifLakbanRoll',
  'tarifKardusBox',
  'tarifFoilPlastikRoll',
  'royaltyPerPcs',
  'transportPerOrder',
  'labaPct',
];

export default function SertifikatMasterParameter({
  customParams,
  setCustomParams,
}: SertifikatMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const safe: SertifikatMasterParams = { ...DEFAULT_SERTIFIKAT_PARAMS, ...(customParams || {}) };

  const handleChange = (key: NumKey, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof SertifikatMasterParams) =>
    safe[key] !== DEFAULT_SERTIFIKAT_PARAMS[key];

  const handleResetField = (key: keyof SertifikatMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_SERTIFIKAT_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${String(DEFAULT_SERTIFIKAT_PARAMS[key])}).`);
  };

  const isModified = React.useMemo(
    () => (Object.keys(DEFAULT_SERTIFIKAT_PARAMS) as (keyof SertifikatMasterParams)[]).some((key) => safe[key] !== DEFAULT_SERTIFIKAT_PARAMS[key]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_SERTIFIKAT_PARAMS });
    toast.success('Semua parameter Sertifikat dikembalikan ke standar master.');
  };

  const fieldRow = (key: NumKey, label: string, isRupiah = true) => (
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
        {isRupiah ? (
          <ThousandInput
            value={safe[key] as number}
            onValueChange={(v) => handleChange(key, v || 0)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
            prefix="Rp"
          />
        ) : (
          <input
            type="number"
            min={0}
            step={key.startsWith('tarifLam') || key.startsWith('tarifUv') ? 0.01 : 1}
            value={safe[key] as number}
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
                Master Parameter Sertifikat
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan 6 file Sertifikat 1 Muka (Ac 230, BC, Linen × Oliver/Print) — kertas plano, Plate, Foil, Laminasi/UV, Kardus.
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
        {/* Card 1: Bahan per jenis */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800">1. Bahan per Jenis (Master!D10–E12)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('hargaKgAc', 'Ac 230 — Rp/kg')}
            {fieldRow('hargaKgBc', 'BC — Rp/kg')}
            {fieldRow('hargaKgLinen', 'Linen — Rp/kg')}
            {fieldRow('gramaturAc', 'Ac — gramatur', false)}
            {fieldRow('gramaturBc', 'BC — gramatur', false)}
            {fieldRow('gramaturLinen', 'Linen — gramatur', false)}
          </div>
          <p className="text-[10px] text-slate-500">
            Harga/rim BUKU!W29 = ((dim×gram)/20000) × (harga/kg + up). Gramatur Excel: {SERTIFIKAT_GRAMATUR_OPTIONS.join(', ')} gsm.
          </p>
        </div>

        {/* Card 2: Up per kombinasi */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Up Harga per Kombinasi (Master!E12)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('upAcOffset', 'Ac + Offset (%)', false)}
            {fieldRow('upAcPrint', 'Ac + Print (%)', false)}
            {fieldRow('upBcOffset', 'BC + Offset (%)', false)}
            {fieldRow('upBcPrint', 'BC + Print (%)', false)}
            {fieldRow('upLinenOffset', 'Linen + Offset (%)', false)}
            {fieldRow('upLinenPrint', 'Linen + Print (%)', false)}
          </div>
          <p className="text-[10px] text-slate-500">
            Nilai file: Ac 5/0, BC 5/5, Linen 0/0 (offset/print). SM &amp; Ryobi ikut pola offset.
          </p>
        </div>

        {/* Card 3: Cetak */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Cetak: Desain, Print, Insheet, Plate</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('desain', 'Desain / Order (Rp)')}
            {fieldRow('tarifPrintAc', 'Print Ac / lbr (Rp)')}
            {fieldRow('tarifPrintBc', 'Print BC / lbr (Rp)')}
            {fieldRow('tarifPrintLinen', 'Print Linen / lbr (Rp)')}
            {fieldRow('insheetOffset', 'Insheet Offset (lbr)', false)}
            {fieldRow('insheetPrint', 'Insheet Print (lbr)', false)}
            {fieldRow('platOverride', 'Override Plat Z6 (0=auto)', false)}
            {fieldRow('umr', 'UMR (jasa foil) (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Plate BUKU!Y6: Oliver Rp 45.000 / SM Rp 78.000 / Ryobi Rp 10.000 (jml = warna×muka). Min &amp; drek: 90000/40, 310000/100, 15000/30.
          </p>
        </div>

        {/* Card 4: Finishing & laba */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Info className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Finishing, Foil, Kardus &amp; Laba</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifSisir', 'Sisir (Rp)')}
            {fieldRow('tarifLamGlossy', 'Laminasi Glossy (Rp/cm²)', false)}
            {fieldRow('tarifLamDoff', 'Laminasi Doff (Rp/cm²)', false)}
            {fieldRow('tarifUv', 'UV Varnish (Rp/cm²)', false)}
            {fieldRow('tarifFoilPlastikRoll', 'Foil plastik /roll (Rp)')}
            {fieldRow('tarifLakbanRoll', 'Lakban /roll (Rp)')}
            {fieldRow('tarifKardusBox', 'Kardus /box (Rp)')}
            {fieldRow('royaltyPerPcs', 'Royalty /pcs (Rp)')}
            {fieldRow('transportPerOrder', 'Transport /order (Rp)')}
            {fieldRow('labaPct', 'Laba Default (%)', false)}
          </div>
          <p className="text-[10px] text-slate-500">
            Laminasi/UV dikenakan bila dipilih (min Rp 50.000). Foil masuk total hanya bila AP27=√. Laba 30% → final ROUNDUP puluhan.
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
                    6 file Sertifikat 1 Muka (Ac 230, BC, Linen × Oliver, Print) — sheet Master, BUKU, Oplah &amp; Harga_Final
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
                  Pemetaan Sel Excel → Parameter SINTAK
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan &amp; Kertas</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga/kg</strong> <span className="font-mono text-emerald-700">Master!D12</span>: Ac Rp 16.400, BC Rp 24.100, Linen Rp 29.900 → <span className="font-mono">BUKU!W30</span>.</li>
                      <li>• <strong>Up</strong> <span className="font-mono text-emerald-700">Master!E12</span>: Ac 5/0, BC 5/5, Linen 0/0 (offset/print) → <span className="font-mono">BUKU!Y30</span>.</li>
                      <li>• <strong>Harga/rim</strong> <span className="font-mono text-emerald-700">BUKU!W29</span> = ((dim×gram)/20000) × (harga/kg + up); plano <span className="font-mono">R7</span> = ceil(H/P7 + K7/O7).</li>
                      <li>• <strong>Insheet</strong> <span className="font-mono text-emerald-700">Master!D13</span>: offset 100, Print 7 → <span className="font-mono">BUKU!K6/K7</span>.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>2. Mesin Cetak</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Oliver</strong>: plate Rp 45.000, min Rp 90.000/plat, drek Rp 40, over Q−1000, 5 lbr/potongan, 10 sertifikat/plano.</li>
                      <li>• <strong>SM</strong>: plate Rp 78.000, min Rp 310.000, drek Rp 100, over Q−3000, 2/8.</li>
                      <li>• <strong>Print Inter</strong>: tanpa plate (Q×tarif Print A3+), 1/2. <strong>Ryobi</strong>: 10000/15000/30, over Q−500, 11/11.</li>
                      <li>• <strong>Desain</strong> <span className="font-mono text-emerald-700">Master!D17</span> = Rp 20.000 → <span className="font-mono">BUKU!V6/V7</span>.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>3. Foil, Laminasi &amp; Kardus</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Foil</strong>: klise Rp 53.200 + jasa (UMR/25)/500/pcs + plastik Rp 295.000/roll — masuk total hanya bila <span className="font-mono">AP27</span>=√.</li>
                      <li>• <strong>Laminasi Glossy/Doff &amp; UV</strong> <span className="font-mono text-emerald-700">Master!D20</span> → checkbox <span className="font-mono">AV27/AY27/BB27</span>; tarif 0,35/0,4/0,12 per cm², min Rp 50.000.</li>
                      <li>• <strong>Sisir</strong> Rp 5.000 selalu ditarik (<span className="font-mono">AS7</span> = ceil(H/500)×5000, tanpa syarat).</li>
                      <li>• <strong>Kardus + lakban</strong> bila <span className="font-mono">BG28</span>=√: ceil(H/1000)×Rp 8.500 + lakban (Rp 8.000/roll ÷ 196).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Total &amp; Harga Final</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Total HPP</strong> <span className="font-mono text-emerald-700">BUKU!BI7</span> = kertas + desain + plate + cetak + royalty + transp + sisir + laminasi/UV + kardus + foil + kebutuhan foil roll.</li>
                      <li>• <strong>Laba</strong> <span className="font-mono text-emerald-700">Master!E24</span> = 30% → <span className="font-mono">BK7</span> = BJ7 × 30%.</li>
                      <li>• <strong>Harga final</strong> <span className="font-mono text-emerald-700">BUKU!BO7</span> = ROUNDUP(BN7, −1), dibulatkan ke <strong>puluhan</strong>.</li>
                      <li>• Output via <span className="font-mono">Oplah</span> (H7:H24) &amp; <span className="font-mono">Harga_Final</span> (BO7:BO24) + INDEX/MATCH di <span className="font-mono">B39</span>.</li>
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
