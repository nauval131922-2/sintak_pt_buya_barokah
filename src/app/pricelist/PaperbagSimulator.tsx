'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { saveCalculationToDb } from '@/lib/pricelist-db-sync';
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
  TrendingUp,
  Sliders,
  DollarSign,
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

const DRAFT_KEY = 'sintak_paperbag_draft';
const draftVal = (key: string, fallback: any) => {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return fallback;
    const v = JSON.parse(raw)[key];
    return v === undefined || v === null ? fallback : v;
  } catch { return fallback; }
};

export type SavedPaperbagSimulationItem = {
  id: string;
  savedAt: string;
  title: string;
  oplah: number;
  data: PaperbagSimulatorResult;
  paramsSnapshot?: any;
};

interface PaperbagSimulatorProps {
  customParams?: PaperbagMasterParams;
  viewMode?: 'matrix' | 'table';
  setActiveSimulationTitle?: (title: string) => void;
}

export default function PaperbagSimulator({
  customParams = DEFAULT_PAPERBAG_PARAMS,
  viewMode = 'matrix',
  setActiveSimulationTitle,
}: PaperbagSimulatorProps) {
  // Input State
  const [ukuran, setUkuran] = useState<PaperbagUkuran>(() => draftVal('ukuran', '14 x 12 x 9 cm'));
  const [oplah, setOplah] = useState<number>(() => draftVal('oplah', 500));
  const [customOplahInput, setCustomOplahInput] = useState<string>('');
  const [isCustomOplah, setIsCustomOplah] = useState<boolean>(false);

  const [finishing, setFinishing] = useState<PaperbagFinishing>(() => draftVal('finishing', 'Tanpa Laminasi'));
  const [marginPct, setMarginPct] = useState<number>(() => draftVal('marginPct', customParams.marginDefaultPct || 30));
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(() => draftVal('negoDiskonPct', customParams.negoDefaultPct || 5));

  const [copiedQuote, setCopiedQuote] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [simName, setSimName] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  // Sync margin/nego if customParams defaults change
  useEffect(() => {
    setMarginPct(customParams.marginDefaultPct);
    setNegoDiskonPct(customParams.negoDefaultPct);
  }, [customParams.marginDefaultPct, customParams.negoDefaultPct]);

  // Restore draft settingan (persist saat pindah tab)
  useEffect(() => {
    try {
      const rawDraft = localStorage.getItem(DRAFT_KEY);
      if (rawDraft) {
        const d = JSON.parse(rawDraft);
        if (d.ukuran) setUkuran(d.ukuran);
        if (d.oplah) setOplah(Number(d.oplah));
        if (d.finishing) setFinishing(d.finishing);
        if (d.marginPct !== undefined) setMarginPct(Number(d.marginPct));
        if (d.negoDiskonPct !== undefined) setNegoDiskonPct(Number(d.negoDiskonPct));
      }
    } catch { /* abaikan draft rusak */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-persist draft settingan simulator (tidak reset saat pindah tab)
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ukuran, oplah, finishing, marginPct, negoDiskonPct }));
    } catch { /* abaikan */ }
  }, [ukuran, oplah, finishing, marginPct, negoDiskonPct]);

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
    const quote = `*PENAWARAN PAPERBAG (TAS KERTAS CUSTOM)*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Paperbag Custom Custom\n• *Ukuran*: ${ukuran} (Terbuka: ${result.spec.ukuranTerbuka})\n• *Bahan*: Art Carton 230 gsm Full Colour 1 Muka\n• *Alur Mesin*: ${result.prosesCetak}\n• *Finishing*: Pond + Double Tape + Tali Kur + Lipat Assembly + Packing Kardus${lamTxt}\n• *Kuantitas*: ${oplah.toLocaleString('id-ID')} pcs\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / pcs*: *Rp ${result.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Harga Nego / pcs*: *Rp ${result.negoPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${result.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._\n_Penawaran berlaku 14 hari._`;

    navigator.clipboard.writeText(quote);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  const optBtn = (active: boolean) =>
    `py-2 px-2.5 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
      active
        ? 'border-slate-500 bg-slate-200 text-slate-900 shadow-xs ring-1 ring-slate-400'
        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
    }`;

  const stepChip = (n: number | string) => (
    <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-emerald-700 text-white text-[10px] font-black shrink-0">
      {n}
    </span>
  );

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-140px)] min-h-0 space-y-3 pb-2">
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


      {/* Main Grid: Form Input & Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kolom Kiri: Form Input (5 Kolom di LG) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Spesifikasi Paperbag
              </h3>
            </div>

            {/* 1. Ukuran Paperbag */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                {stepChip(1)} Ukuran Paperbag (Tas Kertas)
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
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                {stepChip(2)} Finishing Tambahan (Opsional)
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
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  {stepChip(3)} Kuantitas Pesanan (Pcs)
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
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  {stepChip(4)} Margin Profit (%)
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
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  {stepChip(5)} Batas Nego (%)
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

          </div>
        </div>

        {/* Kolom Kanan: Rincian HPP (7 Kolom di LG) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Sticky 3-Kartu Metrik Ringkasan Finansial Baku */}
          <div className="sticky top-0 z-10 space-y-2 bg-slate-50/95 backdrop-blur-xs py-1 -my-1">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-900">
              {stepChip(6)} Kalkulasi Total
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Card 1: HPP Per Pcs */}
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold">HPP Per Pcs</span>
                  <DollarSign size={13} className="text-slate-400" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
                    Rp {Math.round(result.hppPerPcs).toLocaleString('id-ID')}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Total HPP: Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Card 2: Harga Per Pcs */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200 p-3.5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-800 mb-1">
                  <span className="text-[11px] font-bold">Harga Per Pcs (+{marginPct}%)</span>
                  <TrendingUp size={13} className="text-emerald-600" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                    Rp {result.hargaJualPerPcs.toLocaleString('id-ID')}
                  </span>
                  <span className="block text-[10px] text-emerald-700/80 mt-0.5">Laba {marginPct}%</span>
                </div>
              </div>

              {/* Card 3: Harga Total */}
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold">Harga Total</span>
                  <TrendingUp size={13} className="text-emerald-500" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                    Rp {result.totalHargaJual.toLocaleString('id-ID')}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">
                    Profit: Rp {Math.max(0, result.totalHargaJual - result.totalHpp).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
                  <tr className="bg-slate-50/90 font-bold border-t border-slate-200 text-xs">
                    <td colSpan={3} className="py-2.5 px-3 text-slate-800 font-sans">
                      Total HPP Biaya Produksi ({oplah.toLocaleString('id-ID')} pcs)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm">
                      Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">100%</td>
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
          {/* Simpan Simulasi & WhatsApp Action Bar */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                placeholder="Beri label / nama simulasi..."
                className="flex-1 py-2 px-3 text-xs text-slate-800 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
              <button
                onClick={handleSaveSimulation}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
              >
                {savedSuccess ? <Check size={14} /> : <CheckCircle2 size={14} />}
                <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Kalkulasi'}</span>
              </button>
            </div>
            <button
              onClick={handleCopyWhatsAppQuote}
              className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              {copiedQuote ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedQuote ? 'Tersalin!' : 'Salin WA'}</span>
            </button>
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
                Simulator ini menghitung estimasi biaya riil percetakan, pond, pengeleman double tape, pemasangan tali kur, dan pembentukan tas paperbag custom dari oplah 100 pcs hingga 10.000+ pcs.
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 font-medium">
                Komponen Biaya Meliputi: Kertas Art Carton 230g + Desain Paperbag (Rp 25.000) + Plat Cetak (4W) + Ongkos Cetak (Oliver/SM) + Transport + Pisau & Ongkos Pond + Double Tape & Lem + Tali Kur & Upah Pasang + Upah Lipat & Rakit Tas + Packing Kardus.
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
