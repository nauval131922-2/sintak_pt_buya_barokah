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
  DEFAULT_UNDANGAN_PARAMS,
  UndanganMasterParams,
  UNDANGAN_GRAMATUR_OPTIONS,
  UNDANGAN_BAHAN_OPTIONS,
} from '@/lib/undangan-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface UndanganMasterParameterProps {
  customParams: UndanganMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<UndanganMasterParams>>;
}

type NumKey = {
  [K in keyof UndanganMasterParams]: UndanganMasterParams[K] extends number ? K : never;
}[keyof UndanganMasterParams];

const UNDANGAN_VISIBLE_KEYS: NumKey[] = [
  'hargaPerKg',
  'upOffsetPct',
  'upPrintPct',
  'gramatur',
  'insheetOliver',
  'insheetPrint',
  'desain',
  'tarifPrintA3',
  'tarifLakbanRoll',
  'tarifPlastikOpp',
  'tarifLabel',
  'royaltyPerPcs',
  'transportOliver',
  'transportPrint',
  'tarifPrintLabel',
  'tarifSisirBase',
  'tarifLamGlossy',
  'tarifLamDoff',
  'tarifUv',
  'tarifKardusBox',
  'labaPct',
];

export default function UndanganMasterParameter({
  customParams,
  setCustomParams,
}: UndanganMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const safe: UndanganMasterParams = { ...DEFAULT_UNDANGAN_PARAMS, ...(customParams || {}) };

  const handleChange = (key: NumKey, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof UndanganMasterParams) =>
    safe[key] !== DEFAULT_UNDANGAN_PARAMS[key];

  const handleResetField = (key: keyof UndanganMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_UNDANGAN_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${String(DEFAULT_UNDANGAN_PARAMS[key])}).`);
  };

  const isModified = React.useMemo(
    () => (Object.keys(DEFAULT_UNDANGAN_PARAMS) as (keyof UndanganMasterParams)[]).some((key) => safe[key] !== DEFAULT_UNDANGAN_PARAMS[key]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_UNDANGAN_PARAMS });
    toast.success('Semua parameter Undangan dikembalikan ke standar master.');
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
                Master Parameter Undangan
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan 4 file Undangan (15×17, 15,5×15,5 × Oliver/Print) — kertas plano, Plate, OPP, Label, Sisir, Laminasi/UV, Kardus.
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
        {/* Card 1: Bahan & kertas */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800">1. Bahan &amp; Kertas (Master!D10–E12)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('hargaPerKg', 'Harga / kg (Rp)')}
            {fieldRow('gramatur', 'Gramatur (gsm)', false)}
            {fieldRow('upOffsetPct', 'Up Oliver (%)', false)}
            {fieldRow('upPrintPct', 'Up Print (%)', false)}
            {fieldRow('insheetOliver', 'Insheet Oliver (lbr)', false)}
            {fieldRow('insheetPrint', 'Insheet Print (lbr)', false)}
            {fieldRow('umr', 'UMR (lipat/pasang) (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Bahan file: Art Carton 230 gsm (opsi: {UNDANGAN_BAHAN_OPTIONS.join(', ')}; gramatur {UNDANGAN_GRAMATUR_OPTIONS.join(', ')}). Up: Oliver 5%, Print 0%.
          </p>
        </div>

        {/* Card 2: Cetak */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Cetak: Desain, Print, Plate (BUKU!T2–Y6)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('desain', 'Desain / Order (Rp)')}
            {fieldRow('tarifPrintA3', 'Print A3+ / lbr (Rp)')}
            {fieldRow('transportOliver', 'Transport Oliver (Rp)')}
            {fieldRow('transportPrint', 'Transport Print (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Plate Oliver Rp 45.000/plat (jml = warna×muka), min Rp 90.000/plat, drek over Rp 40 (Q−1000). Print Inter: tanpa plate, R×tarif.
          </p>
        </div>

        {/* Card 3: OPP, label & jasa */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-800">3. OPP, Label &amp; Jasa (Master!D22–D23)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifPlastikOpp', 'Plastik OPP /100 (Rp)')}
            {fieldRow('tarifLabel', 'Label /84 (Rp)')}
            {fieldRow('tarifPrintLabel', 'Print Label /12 (Rp)')}
            {fieldRow('royaltyPerPcs', 'Royalty /pcs (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Label + print label masuk total hanya bila AT26=√. Lipat &amp; pasang plastik ikut UMR (nunggu toggle di simulator, default X=0).
          </p>
        </div>

        {/* Card 4: Finishing & laba */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Info className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Sisir, Laminasi, Kardus &amp; Laba</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifSisirBase', 'Sisir base (Rp)')}
            {fieldRow('tarifLamGlossy', 'Laminasi Glossy (Rp/cm²)', false)}
            {fieldRow('tarifLamDoff', 'Laminasi Doff (Rp/cm²)', false)}
            {fieldRow('tarifUv', 'UV Varnish (Rp/cm²)', false)}
            {fieldRow('tarifLakbanRoll', 'Lakban /roll (Rp)')}
            {fieldRow('tarifKardusBox', 'Kardus /box (Rp)')}
            {fieldRow('labaPct', 'Laba Default (%)', false)}
          </div>
          <p className="text-[10px] text-slate-500">
            Sisir min Rp 7.000. Laminasi/UV bila dipilih (min Rp 50.000). Laba 30% → final ROUNDUP puluhan.
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
                    4 file Undangan (15×17, 15,5×15,5 × Oliver, Print) — sheet Master, BUKU, Oplah &amp; Harga_Final
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
                      <li>• <strong>Harga/kg</strong> <span className="font-mono text-emerald-700">Master!D12</span> = Rp 16.400 (Art Carton 230) → <span className="font-mono">BUKU!W30</span>.</li>
                      <li>• <strong>Up</strong> <span className="font-mono text-emerald-700">Master!E12</span>: Oliver 0,05, Print 0 → <span className="font-mono">BUKU!Y30</span>.</li>
                      <li>• <strong>Insheet</strong> <span className="font-mono text-emerald-700">Master!D13</span>: Oliver 150, Print 7 → <span className="font-mono">BUKU!K6/K7</span>.</li>
                      <li>• <strong>Plano</strong> <span className="font-mono text-emerald-700">BUKU!R7</span> = ceil(H/P7 + K7/O7); O7/P7: Oliver 4/12, Print 1/2 (15,5: 1/3).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>2. Cetak</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Oliver</strong>: plate Rp 45.000/plat (jml = warna×muka), min Rp 90.000/plat, over (Q−1000) × Rp 40 × warna.</li>
                      <li>• <strong>Print Inter</strong>: tanpa plate — <span className="font-mono">T7</span> = R7 × tarif Print A3+ (<span className="font-mono">D18</span> = Rp 4.500).</li>
                      <li>• <strong>Desain</strong> <span className="font-mono text-emerald-700">Master!D17</span> = Rp 20.000 → <span className="font-mono">BUKU!V6/V7</span>.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>3. OPP, Label &amp; Jasa</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Plastik OPP</strong> <span className="font-mono text-emerald-700">Master!D22</span> = Rp 12.000/100 pcs (AM26 selalu √).</li>
                      <li>• <strong>Label + print label</strong> bila <span className="font-mono">AT26</span>=√: ceil(H/84)×Rp 5.000 + ceil(H/12)×Rp 1.500.</li>
                      <li>• <strong>Lipat &amp; pasang plastik</strong> ikut UMR bila <span className="font-mono">AN26/AO26</span>=√ (tersimpan X di file).</li>
                      <li>• <strong>Kardus @ Rp 8.000</strong> (<span className="font-mono">D24</span>) sel mati — kardus dihitung pakai tarif lakban Rp 9.200.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Sisir, Laminasi &amp; Total</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Sisir</strong>: max(Rp 7.000, (H/500)×Rp 7.000). <strong>Laminasi/UV</strong> bila dipilih, min Rp 50.000.</li>
                      <li>• <strong>Kardus + lakban</strong> bila <span className="font-mono">BK28</span>=√: ceil(H/500)×Rp 9.200 + lakban.</li>
                      <li>• <strong>Total HPP</strong> <span className="font-mono text-emerald-700">BUKU!BM7</span> (14 komponen) → laba 30% → <span className="font-mono">BS7</span> = ROUNDUP(..., −1) puluhan.</li>
                      <li>• Output via <span className="font-mono">Oplah</span> (H7:H24) &amp; <span className="font-mono">Harga_Final</span> (BS7:BS24) + INDEX/MATCH di <span className="font-mono">B39</span>.</li>
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
