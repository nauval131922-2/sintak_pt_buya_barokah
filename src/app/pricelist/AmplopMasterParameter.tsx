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
  DEFAULT_AMPLOP_PARAMS,
  AmplopMasterParams,
} from '@/lib/amplop-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface AmplopMasterParameterProps {
  customParams: AmplopMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<AmplopMasterParams>>;
}

type NumKey = {
  [K in keyof AmplopMasterParams]: AmplopMasterParams[K] extends number ? K : never;
}[keyof AmplopMasterParams];

const AMPLOP_VISIBLE_KEYS: NumKey[] = [
  'hargaPackBesar',
  'hargaPackTgg',
  'insheetLembar',
  'desainStandar',
  'desainBesarPrint',
  'btklPct',
  'bopPct',
  'labaPct',
  'tarifPrintUnguBesar',
  'tarifPrintBuyaBesar',
  'tarifPrintUnguTgg',
  'tarifPrintBuyaTgg',
  'platOverride',
  'transportPerOrder',
];

export default function AmplopMasterParameter({
  customParams,
  setCustomParams,
}: AmplopMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const safe: AmplopMasterParams = { ...DEFAULT_AMPLOP_PARAMS, ...(customParams || {}) };

  const handleChange = (key: NumKey, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof AmplopMasterParams) =>
    safe[key] !== DEFAULT_AMPLOP_PARAMS[key];

  const handleResetField = (key: keyof AmplopMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_AMPLOP_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${String(DEFAULT_AMPLOP_PARAMS[key])}).`);
  };

  const isModified = React.useMemo(
    () => (Object.keys(DEFAULT_AMPLOP_PARAMS) as (keyof AmplopMasterParams)[]).some((key) => safe[key] !== DEFAULT_AMPLOP_PARAMS[key]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_AMPLOP_PARAMS });
    toast.success('Semua parameter Amplop dikembalikan ke standar master.');
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
                Master Parameter Amplop
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan 3 file Harga AMPLOP JADI (Besar 1 Warna, Besar FC, Tgg FC) — pack @100 pcs, Plate, Min Order, Drek, BTKL/BOP.
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
        {/* Card 1: Bahan amplop jadi */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800">1. Amplop Jadi &amp; Insheet (Master!D12–D13)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('hargaPackBesar', 'Harga /pack Besar 11×23 (Rp)')}
            {fieldRow('hargaPackTgg', 'Harga /pack Tgg 9,5×15,5 (Rp)')}
            {fieldRow('insheetLembar', 'Insheet Tanggung (lbr)', false)}
            {fieldRow('umr', 'UMR Acuan (Rp, info)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Pack @100 pcs (Besar Rp 25.000, Tgg Rp 15.800). Insheet hanya hidup saat Tanggung; ukuran Besar otomatis 3% proporsional (BUKU!K2).
          </p>
        </div>

        {/* Card 2: Cetak Print */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Tarif Print /pack (BUKU!P2)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifPrintUnguBesar', 'Print Ungu Besar (Rp)')}
            {fieldRow('tarifPrintBuyaBesar', 'Print Buya Besar (Rp)')}
            {fieldRow('tarifPrintUnguTgg', 'Print Ungu Tgg (Rp)')}
            {fieldRow('tarifPrintBuyaTgg', 'Print Buya Tgg (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            P2 per pack @100. Besar: Ungu Rp 55.000 / Buya Rp 50.000 (file Besar 1 Warna). Tanggung: Rp 35.000 keduanya.
          </p>
        </div>

        {/* Card 3: Desain, Plate & jasa */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Desain, Plate &amp; Jasa (BUKU!R6–AE6)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('desainStandar', 'Desain Standar (Rp)')}
            {fieldRow('desainBesarPrint', 'Desain Besar+Print (Rp)')}
            {fieldRow('platOverride', 'Override Jml Plat V6 (0=auto)', false)}
            {fieldRow('transportPerOrder', 'Transport / order (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Desain Rp 5.000, kecuali Besar+Print Rp 2.500 (file Besar FC). Plate Rp 10.000/plat (Ryobi saja), min Rp 15.000/plat, drek over Rp 30. Desain hanya dihitung bila H &lt; 1000.
          </p>
        </div>

        {/* Card 4: BTKL, BOP & laba */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Info className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">4. BTKL, BOP &amp; Laba (Master!D17–E20)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('btklPct', 'BTKL (%)', false)}
            {fieldRow('bopPct', 'BOP (%)', false)}
            {fieldRow('labaPct', 'Laba Default (%)', false)}
          </div>
          <p className="text-[10px] text-slate-500">
            BTKL 20% &amp; BOP 10% hanya bila Ryobi dan H ≥ 1000. Laba 30% → harga final pack dibulatkan satuan (ROUNDUP 0).
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
                    3 file Harga AMPLOP JADI (Besar 1 Warna, Besar FC, Tgg FC) — sheet Master, BUKU, named range Oplah &amp; Harga_Final
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
                      <span>1. Bahan &amp; Insheet</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga/pack</strong> <span className="font-mono text-emerald-700">Master!D12</span> = Tgg Rp 15.800 / Besar Rp 25.000 (pack @100, khusus Ryobi).</li>
                      <li>• <strong>Insheet</strong> <span className="font-mono text-emerald-700">Master!D13</span> → <span className="font-mono">BUKU!K6</span>; hidup hanya saat Tanggung (<span className="font-mono">K2</span>=0). Besar otomatis 3%×H.</li>
                      <li>• <strong>Kebutuhan</strong> <span className="font-mono text-emerald-700">BUKU!N7</span> = H + K7; biaya bahan <span className="font-mono">P7</span> = (N7/100) × tarif pack.</li>
                      <li>• <strong>UMR</strong> <span className="font-mono text-emerald-700">Master!D8</span> informatif, tidak masuk rumus.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>2. Mesin Cetak</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Ryobi</strong> <span className="font-mono text-emerald-700">Master!D15</span>: Plate Rp 10.000/plat (<span className="font-mono">U6</span>, jml = warna), min Rp 15.000/plat, over (M−500) × Rp 30 × plat.</li>
                      <li>• <strong>Print Ungu / Print Buya</strong>: tarif per pack <span className="font-mono text-emerald-700">BUKU!P2</span> (Besar 55000/50000, Tgg 35000/35000); plate &amp; ongkos cetak = 0.</li>
                      <li>• <strong>Desain</strong> <span className="font-mono text-emerald-700">Master!D16</span>: Rp 5.000 (Besar+Print Rp 2.500); dihitung hanya bila H &lt; 1000 (<span className="font-mono">R7</span>).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>3. BTKL, BOP &amp; Transport</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>BTKL</strong> <span className="font-mono text-emerald-700">Master!D17</span> = 20% dan <strong>BOP</strong> <span className="font-mono">D18</span> = 10% dari (cetak+plate+desain+kertas) — hanya bila Ryobi dan H ≥ 1000.</li>
                      <li>• <strong>Transport</strong> <span className="font-mono text-emerald-700">BUKU!AE6</span> = 0, berlaku hanya 500 ≤ H &lt; 1000.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Total &amp; Harga Final</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Total HPP</strong> <span className="font-mono text-emerald-700">BUKU!AI7</span> = kertas + desain + plate + cetak + transp + BTKL + BOP.</li>
                      <li>• <strong>Laba</strong> <span className="font-mono text-emerald-700">Master!E20</span> = 30% → <span className="font-mono">AL7</span> = AJ7 × 30%.</li>
                      <li>• <strong>Harga final/pack</strong> <span className="font-mono text-emerald-700">BUKU!AQ7</span> = ROUNDUP(AP7, 0), dibulatkan satuan.</li>
                      <li>• Output via <span className="font-mono">Oplah</span> (H7:H24) &amp; <span className="font-mono">Harga_Final</span> (AQ7:AQ24) + INDEX/MATCH di <span className="font-mono">B39</span>.</li>
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
