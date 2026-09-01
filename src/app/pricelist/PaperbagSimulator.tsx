'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { saveCalculationToDb } from \'@/lib/pricelist-db-sync\';
import {
  Calculator,
  RotateCcw,
  Copy,
  Check,
  Settings2,
  ShoppingBag,
  Info,
  CheckCircle2,
  HelpCircle,
  X,
  Printer,
  Layers,
  Sparkles,
  Scissors,
  Wrench,
  Package,
} from 'lucide-react';
import {
  PaperbagUkuran,
  PaperbagFinishing,
  PaperbagMasterParams,
  DEFAULT_PAPERBAG_PARAMS,
  calculatePaperbag,
  PAPERBAG_UKURAN_OPTIONS,
  PAPERBAG_FINISHING_OPTIONS,
  PAPERBAG_OPLAH_OPTIONS,
  PaperbagSimulatorResult,
  PAPERBAG_VARIANTS,
} from '@/lib/paperbag-calculator';

export type SavedPaperbagSimulationItem = {
  id: string;
  savedAt: string;
  title: string;
  oplah: number;
  data: PaperbagSimulatorResult;
  paramsSnapshot?: any;
};

interface PaperbagSimulatorProps {
  customParams: PaperbagMasterParams;
  viewMode?: 'user' | 'developer';
  setActiveSimulationTitle?: (title: string) => void;
}

export default function PaperbagSimulator({
  customParams,
  viewMode = 'user',
  setActiveSimulationTitle,
}: PaperbagSimulatorProps) {
  // Input State
  const [ukuran, setUkuran] = useState<PaperbagUkuran>('14 x 12 x 9 cm');
  const [oplah, setOplah] = useState<number>(500);
  const [customOplahInput, setCustomOplahInput] = useState<string>('');
  const [isCustomOplah, setIsCustomOplah] = useState<boolean>(false);

  const [finishing, setFinishing] = useState<PaperbagFinishing>('Tanpa Laminasi');
  const [marginPct, setMarginPct] = useState<number>(customParams.marginDefaultPct || 30);
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(customParams.negoDefaultPct || 5);

  const [copiedQuote, setCopiedQuote] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [simName, setSimName] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  // Sync margin/nego if customParams defaults change
  useEffect(() => {
    setMarginPct(customParams.marginDefaultPct);
    setNegoDiskonPct(customParams.negoDefaultPct);
  }, [customParams.marginDefaultPct, customParams.negoDefaultPct]);

  // Main Calculation
  const result: PaperbagSimulatorResult = useMemo(() => {
    return calculatePaperbag(
      {
        ukuran,
        oplah,
        finishing,
        marginPct,
        negoDiskonPct,
      },
      customParams
    );
  }, [ukuran, oplah, finishing, marginPct, negoDiskonPct, customParams]);

  // Update simulation title
  useEffect(() => {
    if (setActiveSimulationTitle) {
      setActiveSimulationTitle(
        `Paperbag ${ukuran} · Art Carton 230g · ${oplah.toLocaleString('id-ID')} pcs`
      );
    }
  }, [ukuran, oplah, setActiveSimulationTitle]);

  const handleOplahSelect = (val: number) => {
    setOplah(val);
    setIsCustomOplah(false);
    setCustomOplahInput('');
  };

  const handleCustomOplahChange = (valStr: string) => {
    setCustomOplahInput(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setOplah(parsed);
      setIsCustomOplah(true);
    }
  };

  const handleReset = () => {
    setUkuran('14 x 12 x 9 cm');
    setOplah(500);
    setIsCustomOplah(false);
    setCustomOplahInput('');
    setFinishing('Tanpa Laminasi');
    setMarginPct(customParams.marginDefaultPct || 30);
    setNegoDiskonPct(customParams.negoDefaultPct || 5);
  };

  const handleSaveSimulation = () => {
    try {
      const existingStr = localStorage.getItem('sintak_saved_paperbag_simulations');
      const list: SavedPaperbagSimulationItem[] = existingStr ? JSON.parse(existingStr) : [];
      const title =
        simName.trim() ||
        `Paperbag ${ukuran} (AC 230g) - ${oplah.toLocaleString('id-ID')} pcs`;

      const newItem: SavedPaperbagSimulationItem = {
        id: `paperbag_${Date.now()}`,
        savedAt: new Date().toISOString(),
        title,
        oplah,
        data: result,
      };

      list.unshift(newItem);
      localStorage.setItem('sintak_saved_paperbag_simulations', JSON.stringify(list));
    saveCalculationToDb({ ...newItem, category: 'Paperbag' });
      setSavedSuccess(true);
      setSimName('');
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save simulation:', err);
    }
  };

  const handleCopyWhatsAppQuote = () => {
    const lamTxt = finishing !== 'Tanpa Laminasi' ? ` + ${finishing}` : '';
    const quote = `*PENAWARAN PAPERBAG (TAS KERTAS CUSTOM)*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Paperbag Custom Custom\n• *Ukuran*: ${ukuran} (Terbuka: ${result.spec.ukuranTerbuka})\n• *Bahan*: Art Carton 230 gsm Full Colour 1 Muka\n• *Alur Mesin*: ${result.prosesCetak}\n• *Finishing*: Pond Die Cut + Double Tape + Tali Kur + Lipat Assembly + Packing Kardus${lamTxt}\n• *Kuantitas*: ${oplah.toLocaleString('id-ID')} pcs\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / pcs*: *Rp ${result.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Harga Nego / pcs*: *Rp ${result.negoPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${result.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._\n_Penawaran berlaku 14 hari._`;

    navigator.clipboard.writeText(quote);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Simulator Biaya & Harga Jual Paperbag
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                Pricelist 29
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kalkulator instan HPP, cetak offset (Oliver/SM), die cut, perakitan tali kur, dan penawaran tas kertas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer"
          >
            <HelpCircle size={14} />
            <span>Panduan Rumus</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all cursor-pointer shadow-2xs"
          >
            <RotateCcw size={13} />
            <span>Reset Input</span>
          </button>
        </div>
      </div>

      {/* 4 Kartu Hasil Finansial */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: HPP / pcs */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">HPP / pcs</span>
              <span className="p-1 rounded-md bg-slate-100 text-slate-600">
                <Calculator size={14} />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Rp {Math.round(result.hppPerPcs).toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Total HPP:</span>
            <span className="font-semibold text-slate-700">
              Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Card 2: Harga Jual / pcs */}
        <div className="bg-emerald-900 text-white rounded-2xl p-4 border border-emerald-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-emerald-200 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Harga Jual / pcs</span>
              <span className="p-1 rounded-md bg-emerald-800/80 text-emerald-300">
                <Sparkles size={14} />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 tracking-tight">
              Rp {result.hargaJualPerPcs.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-800/80 text-[11px] text-emerald-200 flex justify-between">
            <span>Margin Profit:</span>
            <span className="font-bold text-emerald-300">{marginPct}%</span>
          </div>
        </div>

        {/* Card 3: Harga Nego / pcs */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200/80 bg-amber-50/20 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Harga Nego / pcs</span>
              <span className="p-1 rounded-md bg-amber-100 text-amber-800">
                <Info size={14} />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight">
              Rp {result.negoPerPcs.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-amber-100 text-[11px] text-amber-800 flex justify-between">
            <span>Batas Diskon:</span>
            <span className="font-semibold text-amber-900">{negoDiskonPct}%</span>
          </div>
        </div>

        {/* Card 4: Total Penawaran */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Penawaran</span>
              <span className="p-1 rounded-md bg-slate-100 text-slate-600">
                <ShoppingBag size={14} />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
              Rp {result.totalHargaJual.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Kuantitas:</span>
            <span className="font-semibold text-slate-700">{oplah.toLocaleString('id-ID')} pcs</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Input & Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kolom Kiri: Form Input (5 Kolom di LG) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings2 size={16} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Parameter Spesifikasi Paperbag
              </h3>
            </div>

            {/* 1. Ukuran Paperbag */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                1. Ukuran Paperbag (Tas Kertas)
              </label>
              <div className="flex flex-col gap-2">
                {PAPERBAG_UKURAN_OPTIONS.map((opt) => {
                  const spec = PAPERBAG_VARIANTS[opt];
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setUkuran(opt)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer flex items-center justify-between ${
                        ukuran === opt
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-bold">{spec.namaProduk}</span>
                        <span
                          className={`text-[10px] font-normal ${
                            ukuran === opt ? 'text-emerald-200' : 'text-slate-600'
                          }`}
                        >
                          {spec.keterangan}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                          ukuran === opt
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {spec.planoYieldTas} tas/pln
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Bahan Kertas & Finishing */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                2. Finishing Tambahan (Opsional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PAPERBAG_FINISHING_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFinishing(opt)}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                      finishing === opt
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Pilihan Kuantitas (Oplah) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  3. Kuantitas Pesanan (Pcs)
                </label>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {result.prosesCetak}
                </span>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {PAPERBAG_OPLAH_OPTIONS.map((optVal) => (
                  <button
                    key={optVal}
                    type="button"
                    onClick={() => handleOplahSelect(optVal)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      !isCustomOplah && oplah === optVal
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {optVal.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Custom:</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={customOplahInput}
                    onChange={(e) => handleCustomOplahChange(e.target.value)}
                    placeholder="Ketik oplah khusus..."
                    className={`w-full py-1.5 px-3 text-xs font-bold text-slate-800 rounded-lg border focus:outline-none transition-all ${
                      isCustomOplah
                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30'
                        : 'border-slate-300 bg-slate-50 focus:bg-white'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                    pcs
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Margin Profit & Batas Nego */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Margin Profit (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={marginPct}
                    onChange={(e) => setMarginPct(parseFloat(e.target.value) || 0)}
                    className="w-full py-1.5 px-3 text-xs font-bold text-slate-800 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 font-bold">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Batas Nego (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={negoDiskonPct}
                    onChange={(e) => setNegoDiskonPct(parseFloat(e.target.value) || 0)}
                    className="w-full py-1.5 px-3 text-xs font-bold text-slate-800 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 font-bold">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Simpan Simulasi & WhatsApp Action Bar */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  placeholder="Beri label / nama simulasi..."
                  className="flex-1 py-1.5 px-3 text-xs text-slate-800 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSaveSimulation}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 transition-all cursor-pointer shrink-0 shadow-2xs flex items-center gap-1.5"
                >
                  {savedSuccess ? <Check size={14} /> : <CheckCircle2 size={14} />}
                  <span>{savedSuccess ? 'Tersimpan!' : 'Simpan'}</span>
                </button>
              </div>

              <button
                onClick={handleCopyWhatsAppQuote}
                className="w-full py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
              >
                {copiedQuote ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedQuote ? 'Teks Penawaran Disalin!' : 'Salin Format Penawaran WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rincian HPP (7 Kolom di LG) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Calculator size={16} className="text-emerald-700" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Rincian Breakdown HPP Paperbag
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-600 font-mono">
                {oplah.toLocaleString('id-ID')} pcs
              </span>
            </div>

            {/* Table Breakdown */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-1.5 w-8 text-center">No</th>
                    <th className="py-2 px-2">Komponen Biaya</th>
                    <th className="py-2 px-2">Keterangan Spesifikasi</th>
                    <th className="py-2 px-2 text-right">Biaya (Rp)</th>
                    <th className="py-2 px-2 text-right w-16">Porsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {result.breakdown.map((item) => (
                    <tr key={item.no} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-1.5 text-center text-slate-600 text-[11px] font-mono">
                        {item.no}
                      </td>
                      <td className="py-2 px-2 font-bold text-slate-900">{item.komponen}</td>
                      <td className="py-2 px-2 text-slate-600 text-[11px]">{item.keterangan}</td>
                      <td className="py-2 px-2 text-right font-mono font-semibold text-slate-900">
                        Rp {item.biaya.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-mono text-[10px] text-slate-500">
                            {item.porsiPct.toFixed(1)}%
                          </span>
                          <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${Math.min(100, item.porsiPct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 font-bold text-slate-900 bg-slate-50/60">
                    <td colSpan={3} className="py-2.5 px-3 text-right">
                      Total HPP ({oplah.toLocaleString('id-ID')} pcs):
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-emerald-950 font-black">
                      Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-600 text-[10px]">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Quick Spec Card Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Kebutuhan Plano</span>
                <span className="text-xs font-bold text-slate-800">
                  {result.kebutuhanPlano.toLocaleString('id-ID')} lbr plano
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Yield / Plano</span>
                <span className="text-xs font-bold text-slate-800">
                  {result.spec.planoYieldTas} tas ({result.spec.planoYieldPotong} lbr)
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Ukuran Terbuka</span>
                <span className="text-xs font-bold text-slate-800">
                  {result.spec.ukuranTerbuka}
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Alur Mesin</span>
                <span className="text-xs font-bold text-emerald-800">
                  {result.prosesCetak}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Panduan Rumus */}
      {showManualModal && (
        <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer">
          <div
            className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Panduan Simulator Paperbag</h3>
                  <p className="text-xs text-emerald-200">Pricelist Juli 2026</p>
                </div>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-emerald-300 hover:text-white p-1.5 rounded-lg hover:bg-emerald-800/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs text-slate-700 space-y-4 leading-relaxed">
              <p>
                Simulator ini menghitung estimasi biaya riil percetakan, pond die cut, pengeleman double tape, pemasangan tali kur, dan pembentukan tas paperbag custom dari oplah 100 pcs hingga 10.000+ pcs.
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 font-medium">
                Komponen Biaya Meliputi: Kertas Art Carton 230g + Desain Paperbag (Rp 25.000) + Plat Cetak (4W) + Ongkos Cetak (Oliver/SM) + Transport + Pisau & Ongkos Pond Die Cut + Double Tape & Lem + Tali Kur & Upah Pasang + Upah Lipat & Rakit Tas + Packing Kardus.
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowManualModal(false)}
                className="px-4 py-1.5 bg-emerald-800 text-white font-bold rounded-lg hover:bg-emerald-900 transition-all cursor-pointer text-xs"
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
