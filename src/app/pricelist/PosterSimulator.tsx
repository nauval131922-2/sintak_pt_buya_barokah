'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { saveCalculationToDb } from '@/lib/pricelist-db-sync';
import {
  Calculator,
  BookmarkCheck,
  Bookmark,
  RotateCcw,
  Copy,
  Settings2,
  BookOpen,
  Info,
  Check,
  X,
  Printer,
  Layers,
  TrendingUp,
  DollarSign,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import ThousandInput from '@/components/ThousandInput';
import {
  PosterMasterParams,
  PosterUkuran,
  PosterMesinOption,
  PosterFinishingOption,
  POSTER_UKURAN_OPTIONS,
  POSTER_TIERS_MAP,
  DEFAULT_POSTER_PARAMS,
  calculatePosterSimulator,
  getProsesCetakPosterDefault,
  getProsesCetakPosterLabel,
} from '@/lib/poster-calculator';

export type SavedPosterSimulationItem = {
  id: string;
  savedAt: string;
  title: string;
  ukuran: PosterUkuran;
  oplah: number;
  finishing: PosterFinishingOption;
  mesin?: PosterMesinOption;
  marginPct: number;
  negoDiskonPct: number;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  totalHargaJual: number;
  customParams?: Partial<PosterMasterParams>;
};

interface PosterSimulatorProps {
  customParams: PosterMasterParams;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  setActiveSimulationTitle?: (title: string | null) => void;
}

const DRAFT_KEY = 'sintak_poster_draft';
const draftVal = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof window === 'undefined') return fallback;
    const item = localStorage.getItem(DRAFT_KEY);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return parsed[key] !== undefined ? parsed[key] : fallback;
  } catch {
    return fallback;
  }
};

const FINISHING_OPTIONS: PosterFinishingOption[] = [
  'Tanpa Laminasi',
  'Laminasi Glossy',
  'Laminasi Doff',
  'UV Varnish',
];

export default function PosterSimulator({
  customParams,
  onOpenMasterParam,
  activeSimulationId,
  setActiveSimulationId,
  setActiveSimulationTitle,
}: PosterSimulatorProps) {
  // State Input
  const [ukuran, setUkuran] = useState<PosterUkuran>(() =>
    draftVal('ukuran', '32 x 48 cm')
  );
  const [oplah, setOplah] = useState<number>(() => draftVal('oplah', 1000));
  const [mesin, setMesin] = useState<PosterMesinOption>(() =>
    draftVal('mesin', 'Otomatis')
  );
  const [finishing, setFinishing] = useState<PosterFinishingOption>(() =>
    draftVal('finishing', 'Tanpa Laminasi')
  );
  const [marginPct, setMarginPct] = useState<number>(() =>
    draftVal('marginPct', customParams.marginDefaultPct ?? 30)
  );
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(() =>
    draftVal('negoDiskonPct', customParams.negoDefaultPct ?? 5)
  );

  const [copiedQuote, setCopiedQuote] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Auto-persist draft ke localStorage (skip saat sedang mode edit riwayat)
  useEffect(() => {
    if (activeSimulationId) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          ukuran,
          oplah,
          mesin,
          finishing,
          marginPct,
          negoDiskonPct,
        })
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [ukuran, oplah, mesin, finishing, marginPct, negoDiskonPct, activeSimulationId]);

  // Handle Load from Saved Simulation
  useEffect(() => {
    if (!activeSimulationId) return;
    try {
      const raw = localStorage.getItem('sintak_saved_poster_simulations');
      if (raw) {
        const list: SavedPosterSimulationItem[] = JSON.parse(raw);
        const found = list.find((item) => item.id === activeSimulationId);
        if (found) {
          setUkuran(found.ukuran || '32 x 48 cm');
          setOplah(found.oplah || 1000);
          setMesin(found.mesin || 'Otomatis');
          setFinishing(found.finishing || 'Tanpa Laminasi');
          setMarginPct(found.marginPct ?? 30);
          setNegoDiskonPct(found.negoDiskonPct ?? 5);
        }
      }
    } catch {
      // Ignore
    }
  }, [activeSimulationId]);

  const availableTiers = useMemo(() => {
    return POSTER_TIERS_MAP[ukuran] || [1000];
  }, [ukuran]);

  // Mesin otomatis bawaan ukuran & oplah
  const defaultMesin = useMemo(() => {
    return getProsesCetakPosterDefault(ukuran, oplah);
  }, [ukuran, oplah]);

  // Hitung Hasil Kalkulasi
  const calcResult = useMemo(() => {
    return calculatePosterSimulator(
      {
        ukuran,
        oplah,
        mesin,
        finishing,
        marginPct,
        negoDiskonPct,
      },
      customParams
    );
  }, [ukuran, oplah, mesin, finishing, marginPct, negoDiskonPct, customParams]);

  const profitTotal = useMemo(() => {
    return Math.max(0, calcResult.totalHargaJual - calcResult.totalHpp);
  }, [calcResult.totalHargaJual, calcResult.totalHpp]);

  const handleUkuranChange = (newUkuran: PosterUkuran) => {
    setUkuran(newUkuran);
    const tiers = POSTER_TIERS_MAP[newUkuran];
    if (tiers && !tiers.includes(oplah)) {
      setOplah(tiers[0]);
    }
  };

  const handleSaveCalculation = (isUpdate = false) => {
    try {
      const existingRaw = localStorage.getItem('sintak_saved_poster_simulations');
      const list: SavedPosterSimulationItem[] = existingRaw ? JSON.parse(existingRaw) : [];

      const title = `Poster ${ukuran} • ${oplah.toLocaleString('id-ID')} pcs • ${finishing}`;

      if (isUpdate && activeSimulationId) {
        const updated = list.map((item) =>
          item.id === activeSimulationId
            ? {
                ...item,
                title,
                ukuran,
                oplah,
                mesin,
                finishing,
                marginPct,
                negoDiskonPct,
                hppPerPcs: calcResult.hppPerPcs,
                hargaJualPerPcs: calcResult.hargaJualPerPcs,
                totalHargaJual: calcResult.totalHargaJual,
              }
            : item
        );
        localStorage.setItem('sintak_saved_poster_simulations', JSON.stringify(updated));
        const targetItem = updated.find((item) => item.id === activeSimulationId);
        if (targetItem) saveCalculationToDb({ ...targetItem, category: 'Poster' });
        toast.success('Kalkulasi berhasil diperbarui!');
      } else {
        const newItem: SavedPosterSimulationItem = {
          id: `poster_${Date.now()}`,
          savedAt: new Date().toISOString(),
          title,
          ukuran,
          oplah,
          mesin,
          finishing,
          marginPct,
          negoDiskonPct,
          hppPerPcs: calcResult.hppPerPcs,
          hargaJualPerPcs: calcResult.hargaJualPerPcs,
          totalHargaJual: calcResult.totalHargaJual,
        };
        list.unshift(newItem);
        localStorage.setItem('sintak_saved_poster_simulations', JSON.stringify(list));
        saveCalculationToDb({ ...newItem, category: 'Poster' });
        if (setActiveSimulationId) setActiveSimulationId(newItem.id);
        if (setActiveSimulationTitle) setActiveSimulationTitle(newItem.title);
        toast.success('Kalkulasi berhasil disimpan ke riwayat!');
      }
    } catch {
      toast.error('Gagal menyimpan kalkulasi.');
    }
  };

  const handleCopyQuote = () => {
    const text = `*PENAWARAN HARGA POSTER*
PT Buya Barokah
-------------------------------------------
• Produk: Poster ${ukuran}
• Bahan: Art Carton 230 gsm (1 Muka Full Colour)
• Mesin: ${getProsesCetakPosterLabel(calcResult.mesinTerpilih)}
• Finishing: ${finishing}
• Jumlah Oplah: ${oplah.toLocaleString('id-ID')} pcs
-------------------------------------------
• Harga Jual Satuan: Rp ${calcResult.hargaJualPerPcs.toLocaleString('id-ID')} / pcs
• Total Investasi: Rp ${calcResult.totalHargaJual.toLocaleString('id-ID')}
• Toleransi Nego: Rp ${calcResult.negoPerPcs.toLocaleString('id-ID')} / pcs
-------------------------------------------
*Harga dapat disesuaikan dengan volume dan spesifikasi pesanan.`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success('Teks penawaran berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  // Helper stepChip bulat hijau emerald
  const stepChip = (n: number | string) => (
    <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-emerald-700 text-white text-[10px] font-black shrink-0">
      {n}
    </span>
  );

  // Helper tombol opsi netral (abu netral lembut)
  const optBtn = (active: boolean) =>
    `py-2 px-2.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
      active
        ? 'border-slate-500 bg-slate-200 text-slate-900 shadow-xs'
        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
    }`;

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-140px)] min-h-0 space-y-3 pb-2">
      {/* Header Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100/80 rounded-xl border border-emerald-200 text-emerald-800 shrink-0">
            <ImageIcon className="w-5 h-5 text-emerald-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                Simulator Kalkulasi Poster
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">
                Katalog 19 / 21
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulasi interaktif 4 ukuran poster Art Carton 230 gsm dengan opsi mesin Print Inter, Oliver Offset, dan Heidelberg SM.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyQuote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
          >
            {copiedQuote ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-emerald-600" />
                <span>Salin Penawaran</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
          >
            <BookOpen size={14} className="text-emerald-600" />
            <span>Panduan</span>
          </button>

          {onOpenMasterParam && (
            <button
              type="button"
              onClick={onOpenMasterParam}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white transition-all shadow-2xs cursor-pointer"
            >
              <Settings2 size={14} />
              <span>Master Parameter</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Simulator: 4 Class Baku Manasik */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 min-h-0 pb-1">
        {/* Kolom Kiri: Form Input Mandiri (Netral, Flat & Bersih) */}
        <div className="lg:col-span-5 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Parameter Pesanan Poster
              </h4>
            </div>

            {/* 1. Ukuran Poster */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                {stepChip(1)} Ukuran Poster
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POSTER_UKURAN_OPTIONS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => handleUkuranChange(u)}
                    className={optBtn(ukuran === u)}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Oplah Pesanan */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  {stepChip(2)} Jumlah Pesanan / Oplah (pcs)
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  {oplah.toLocaleString('id-ID')} pcs
                </span>
              </div>

              {/* Tiers Preset Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {availableTiers.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOplah(t)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                      oplah === t
                        ? 'border-slate-500 bg-slate-200 text-slate-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {t >= 1000 ? `${t / 1000}k` : t}
                  </button>
                ))}
              </div>

              <div className="relative">
                <ThousandInput
                  value={oplah}
                  onValueChange={(val) => setOplah(Math.max(1, val || 1))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  suffix=" pcs"
                />
              </div>
            </div>

            {/* 3. Bahan Baku */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                {stepChip(3)} Bahan Baku Utama
              </label>
              <div className="py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Art Carton 230 gsm (1 Muka Full Colour)</span>
                <span className="text-[10px] font-mono text-slate-500">
                  Rp {customParams.tarifArtCarton230Kg.toLocaleString('id-ID')} /kg
                </span>
              </div>
            </div>

            {/* 4. Selektor Mesin Cetak */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  {stepChip(4)} Mesin Cetak
                </label>
                <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
                  Rekomendasi: {getProsesCetakPosterLabel(defaultMesin)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['Otomatis', 'Print Inter', 'Oliver', 'SM'] as PosterMesinOption[]).map((m) => {
                  const isAuto = m === 'Otomatis';
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMesin(m)}
                      className={optBtn(mesin === m)}
                    >
                      {isAuto ? 'Otomatis (Rekomendasi)' : m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Finishing Tambahan (Laminasi / UV) */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                {stepChip(5)} Finishing Permukaan (Laminasi)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FINISHING_OPTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFinishing(f)}
                    className={optBtn(finishing === f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Target Margin & Batas Nego */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                {stepChip(6)} Target Margin &amp; Batas Nego
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Target Margin (%)
                  </label>
                  <ThousandInput
                    value={marginPct}
                    onValueChange={(val) => setMarginPct(val ?? 30)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                    suffix="%"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Batas Nego (%)
                  </label>
                  <ThousandInput
                    value={negoDiskonPct}
                    onValueChange={(val) => setNegoDiskonPct(val ?? 5)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                    suffix="%"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Hasil Finansial Baku & Breakdown Tabel Mandiri */}
        <div className="lg:col-span-7 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          {/* Sticky 3-Kartu Metrik Ringkasan Finansial Baku */}
          <div className="sticky top-0 z-10 space-y-2 bg-slate-50/95 backdrop-blur-xs py-1 -my-1">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-900">
              {stepChip(7)} Kalkulasi Total
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Card 1: HPP Per Exp */}
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold">HPP Per Exp</span>
                  <DollarSign size={13} className="text-slate-400" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
                    Rp {Math.round(calcResult.hppPerPcs).toLocaleString('id-ID')}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Total HPP: Rp {Math.round(calcResult.totalHpp).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Card 2: Harga Per Pcs (+Laba%) */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200 p-3.5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-800 mb-1">
                  <span className="text-[11px] font-bold">Harga Per Pcs (+{marginPct}%)</span>
                  <TrendingUp size={13} className="text-emerald-600" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                    Rp {calcResult.hargaJualPerPcs.toLocaleString('id-ID')}
                  </span>
                  <span className="block text-[10px] text-emerald-700/80 mt-0.5">
                    Laba {marginPct}%
                  </span>
                </div>
              </div>

              {/* Card 3: Harga Total & Profit */}
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold">Harga Total</span>
                  <TrendingUp size={13} className="text-emerald-500" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                    Rp {calcResult.totalHargaJual.toLocaleString('id-ID')}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">
                    Profit: Rp {Math.round(profitTotal).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-Card Info Toleransi Nego Diskon */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs">
              <span className="text-amber-800 font-bold flex items-center gap-1.5">
                <Info size={14} className="text-amber-600 shrink-0" />
                Batas Toleransi Nego Diskon ({negoDiskonPct}%):
              </span>
              <span className="font-mono font-black text-amber-900">
                Rp {calcResult.negoPerPcs.toLocaleString('id-ID')} / pcs
              </span>
            </div>
          </div>

          {/* Workflow & Mesin Banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Printer size={16} className="text-emerald-700 shrink-0" />
              <span>Mesin Terpilih:</span>
              <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                {getProsesCetakPosterLabel(calcResult.mesinTerpilih)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <Layers size={14} className="text-slate-400 shrink-0" />
              <span>Finishing:</span>
              <span className="font-bold text-slate-700">{finishing}</span>
            </div>
          </div>

          {/* Tabel Rincian Breakdown Biaya HPP 5 Kolom Baku */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Calculator size={14} className="text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800">
                  Rincian Komponen Biaya HPP (Breakdown Transparan)
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {calcResult.breakdown.length} Komponen
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3 w-8 text-center">No</th>
                    <th className="py-2.5 px-3">Jenis</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-3 text-right">Harga (Rp)</th>
                    <th className="py-2.5 px-3 text-right w-16">Porsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {calcResult.breakdown.map((row) => (
                    <tr key={row.no} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-400 text-[11px]">
                        {row.no}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-800 font-sans">
                        {row.komponen}
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-sans text-[11px]">
                        {row.keterangan}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-800 font-bold">
                        Rp {row.biaya.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500 text-[11px]">
                        {row.porsiPct.toFixed(1)}%
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
                      Rp {Math.round(calcResult.totalHpp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800 font-bold text-[11px]">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Tombol Simpan Full-Width Standar di Bawah Tabel Breakdown */}
            <div className="p-3 bg-slate-50/70 border-t border-slate-200">
              {activeSimulationId ? (
                <div className="flex items-center gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => handleSaveCalculation(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    title="Perbarui data pada item riwayat ini"
                  >
                    <BookmarkCheck size={16} />
                    <span>Update Perubahan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveCalculation(false)}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    title="Simpan sebagai salinan baru tanpa menimpa item yang sedang diedit"
                  >
                    <Bookmark size={15} />
                    <span>Simpan Baru</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSaveCalculation(false)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bookmark size={16} />
                  <span>Simpan Kalkulasi Ini ke Daftar Kalkulasi</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Panduan Poster */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    Panduan Simulator Poster
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Katalog 19 / 21 • PT Buya Barokah
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Spesifikasi Standar Produk:
                </span>
                <p>
                  Bahan Art Carton 230 gsm 1 Muka Full Colour. Ukuran yang tersedia meliputi:
                  <strong> 32×48 cm, 48×64 cm, 50×70 cm, dan 70×100 cm</strong>.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Alur Rekomendasi Mesin:
                </span>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                  <li><strong>32×48 cm:</strong> Oplah 100–500 pcs menggunakan Print Inter A3+; Oplah 600–2.000 pcs menggunakan Oliver Offset 4 Warna.</li>
                  <li><strong>48×64 cm:</strong> Oplah 300–3.000 pcs via Oliver Offset; Oplah 3.500–5.000 pcs via Heidelberg SM 52.</li>
                  <li><strong>50×70 cm & 70×100 cm:</strong> Dicetak menggunakan Heidelberg SM full-colour.</li>
                </ul>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
