'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { saveCalculationToDb } from '@/lib/pricelist-db-sync';
import {
  DollarSign,
  TrendingUp,
  BookmarkCheck,
  Bookmark,
  Share2,
  Settings2,
  BookOpen,
  Info,
  Check,
  CheckCircle2,
  Sliders,
  X,
  Printer,
  Scissors,
  Tag,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import ThousandInput from '@/components/ThousandInput';
import {
  StikerMasterParams,
  StikerSimulatorInput,
  StikerSimulatorResult,
  StikerUkuran,
  StikerFinishingOption,
  STIKER_UKURAN_OPTIONS,
  STIKER_TIERS,
  STIKER_FINISHING_OPTIONS,
  STIKER_ISI_PER_A3,
  calculateStikerSimulator,
  DEFAULT_STIKER_PARAMS,
} from '@/lib/stiker-calculator';

const DRAFT_KEY = 'sintak_stiker_draft';

const draftVal = (key: string, fallback: any) => {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return fallback;
    const v = JSON.parse(raw)[key];
    return v === undefined || v === null ? fallback : v;
  } catch {
    return fallback;
  }
};

export type SavedStikerSimulationItem = {
  id: string;
  savedAt: string;
  title: string;
  oplah: number;
  data: StikerSimulatorResult;
  paramsSnapshot?: any;
};

interface Props {
  customParams: StikerMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<StikerMasterParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

const stepChip = (n: number) => (
  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] font-black shrink-0">
    {n}
  </span>
);

const optBtn = (active: boolean) =>
  `py-2 px-2.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
    active
      ? 'border-slate-500 bg-slate-200 text-slate-900 shadow-xs ring-1 ring-slate-400'
      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
  }`;

export default function StikerSimulator({
  customParams,
  setCustomParams,
  onOpenMasterParam,
  activeSimulationId,
  setActiveSimulationId,
  activeSimulationTitle,
  setActiveSimulationTitle,
}: Props) {
  // Input State dengan Persist Draft
  const [ukuran, setUkuran] = useState<StikerUkuran>(() =>
    draftVal('ukuran', '8 x 5 cm')
  );
  const [oplah, setOplah] = useState<number>(() =>
    draftVal('oplah', 100)
  );
  const [finishing, setFinishing] = useState<StikerFinishingOption>(() =>
    draftVal('finishing', 'Non Cutting (Rajang Potong)')
  );
  const [opsiSisir, setOpsiSisir] = useState<boolean>(() =>
    draftVal('opsiSisir', false)
  );
  const [marginPct, setMarginPct] = useState<number>(() =>
    draftVal('marginPct', customParams.marginDefaultPct ?? 30)
  );
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(() =>
    draftVal('negoDiskonPct', customParams.negoDefaultPct ?? 4)
  );

  const [copiedQuote, setCopiedQuote] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Hasil Perhitungan Stiker 1:1 Excel
  const result = useMemo<StikerSimulatorResult>(() => {
    return calculateStikerSimulator(
      {
        ukuran,
        oplah,
        finishing,
        opsiSisir,
        marginPct,
        negoDiskonPct,
      },
      customParams
    );
  }, [ukuran, oplah, finishing, opsiSisir, marginPct, negoDiskonPct, customParams]);

  // Load Riwayat Aktif
  useEffect(() => {
    if (activeSimulationId) {
      try {
        const raw = localStorage.getItem('sintak_saved_stiker_simulations');
        if (raw) {
          const list: SavedStikerSimulationItem[] = JSON.parse(raw);
          const found = list.find((item) => item.id === activeSimulationId);
          if (found) {
            setUkuran(found.data.input.ukuran);
            setOplah(found.data.input.oplah);
            setFinishing(found.data.input.finishing);
            setOpsiSisir(!!found.data.input.opsiSisir);
            setMarginPct(found.data.input.marginPct ?? customParams.marginDefaultPct);
            setNegoDiskonPct(found.data.input.negoDiskonPct ?? customParams.negoDefaultPct);
          }
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        const rawDraft = localStorage.getItem(DRAFT_KEY);
        if (rawDraft) {
          const d = JSON.parse(rawDraft);
          if (d.ukuran) setUkuran(d.ukuran);
          if (d.oplah) setOplah(Number(d.oplah));
          if (d.finishing) setFinishing(d.finishing);
          if (d.opsiSisir !== undefined) setOpsiSisir(Boolean(d.opsiSisir));
          if (d.marginPct !== undefined) setMarginPct(Number(d.marginPct));
          if (d.negoDiskonPct !== undefined) setNegoDiskonPct(Number(d.negoDiskonPct));
        }
      } catch { /* abaikan draft rusak */ }
    }
  }, [activeSimulationId, customParams.marginDefaultPct, customParams.negoDefaultPct]);

  // Auto-persist Draft saat tidak dalam Mode Edit
  useEffect(() => {
    if (activeSimulationId) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ukuran, oplah, finishing, opsiSisir, marginPct, negoDiskonPct })
      );
    } catch { /* abaikan */ }
  }, [ukuran, oplah, finishing, opsiSisir, marginPct, negoDiskonPct, activeSimulationId]);

  const handleSaveSimulation = () => {
    try {
      const existingRaw = localStorage.getItem('sintak_saved_stiker_simulations');
      const list: SavedStikerSimulationItem[] = existingRaw ? JSON.parse(existingRaw) : [];

      const title =
        activeSimulationTitle ||
        `Stiker ${ukuran} • ${oplah.toLocaleString('id-ID')} pcs • ${finishing}`;

      if (activeSimulationId) {
        const updated = list.map((item) =>
          item.id === activeSimulationId
            ? {
                ...item,
                savedAt: new Date().toISOString(),
                title,
                oplah,
                data: result,
              }
            : item
        );
        localStorage.setItem('sintak_saved_stiker_simulations', JSON.stringify(updated));
        const targetItem = updated.find((item) => item.id === activeSimulationId);
        if (targetItem) saveCalculationToDb({ ...targetItem, category: 'Stiker' });
        toast.success('Simulasi berhasil diperbarui!');
        if (setActiveSimulationId) setActiveSimulationId(null);
        if (setActiveSimulationTitle) setActiveSimulationTitle(null);
      } else {
        const newItem: SavedStikerSimulationItem = {
          id: `stiker_${Date.now()}`,
          savedAt: new Date().toISOString(),
          title,
          oplah,
          data: result,
        };
        list.unshift(newItem);
        localStorage.setItem('sintak_saved_stiker_simulations', JSON.stringify(list));
        saveCalculationToDb({ ...newItem, category: 'Stiker' });
        if (setActiveSimulationId) setActiveSimulationId(newItem.id);
        if (setActiveSimulationTitle) setActiveSimulationTitle(newItem.title);
        toast.success('Kalkulasi berhasil disimpan ke daftar!');
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal menyimpan kalkulasi.');
    }
  };

  const handleSaveAsNew = () => {
    try {
      const existingRaw = localStorage.getItem('sintak_saved_stiker_simulations');
      const list: SavedStikerSimulationItem[] = existingRaw ? JSON.parse(existingRaw) : [];
      const title = `Stiker ${ukuran} • ${oplah.toLocaleString('id-ID')} pcs • ${finishing}`;
      const newItem: SavedStikerSimulationItem = {
        id: `stiker_${Date.now()}`,
        savedAt: new Date().toISOString(),
        title,
        oplah,
        data: result,
      };
      list.unshift(newItem);
      localStorage.setItem('sintak_saved_stiker_simulations', JSON.stringify(list));
      saveCalculationToDb({ ...newItem, category: 'Stiker' });
      if (setActiveSimulationId) setActiveSimulationId(null);
      if (setActiveSimulationTitle) setActiveSimulationTitle(null);
      toast.success('Simulasi berhasil disimpan sebagai kalkulasi baru & keluar dari mode edit!');
    } catch (e) {
      console.error(e);
      toast.error('Gagal menyimpan kalkulasi baru.');
    }
  };

  const handleCopyWhatsApp = () => {
    const text = `*PENAWARAN CETAK STIKER*
*PT Buya Barokah*
━━━━━━━━━━━━━━━━━━━━
• *Produk*: Stiker ${ukuran}
• *Bahan*: Sticker Vinyl Glossy 200 gsm (Full Colour 1 Muka)
• *Kuantitas*: ${oplah.toLocaleString('id-ID')} pcs
• *Proses*: ${finishing}${opsiSisir ? ' + Sisir' : ''}
━━━━━━━━━━━━━━━━━━━━
• *Harga / Pcs*: *Rp ${result.hargaJualPerPcs.toLocaleString('id-ID')}*
• *Harga Nego / Pcs*: *Rp ${result.negoPerPcs.toLocaleString('id-ID')}*
• *Total Penawaran*: *Rp ${result.totalHargaJual.toLocaleString('id-ID')}*
━━━━━━━━━━━━━━━━━━━━
_Harga belum termasuk PPN. Hasil cetak tajam, daya rekat kuat & tahan air._`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success('Format penawaran WhatsApp berhasil disalin!');
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  const isCutting = finishing !== 'Non Cutting (Rajang Potong)';
  const kapasitasIsi = STIKER_ISI_PER_A3[isCutting ? 'CUTTING' : 'NON CUTTING'][ukuran];

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-140px)] min-h-0 space-y-3 pb-2">
      {/* Grid Simulator: 4 Class Baku Manasik */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 min-h-0 pb-1">
        {/* Kolom Kiri: Form Input Spesifikasi */}
        <div className="lg:col-span-5 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Spesifikasi Stiker
              </h3>
            </div>

            {/* 1. Ukuran Stiker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  {stepChip(1)} Ukuran Stiker
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Isi {kapasitasIsi} pcs / lembar A3+
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STIKER_UKURAN_OPTIONS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUkuran(u)}
                    className={optBtn(ukuran === u)}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Kuantitas Oplah */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  {stepChip(2)} Kuantitas Pesanan (Oplah)
                </label>
                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {oplah.toLocaleString('id-ID')} pcs ({result.lembarA3} lbr A3+)
                </span>
              </div>

              {/* Tiers Preset Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {STIKER_TIERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOplah(t)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-all cursor-pointer ${
                      oplah === t
                        ? 'border-slate-500 bg-slate-200 text-slate-900 shadow-xs ring-1 ring-slate-400'
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

            {/* 3. Bahan Stiker */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                {stepChip(3)} Bahan Baku Utama
              </label>
              <div className="py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag size={13} className="text-emerald-700" />
                  <span>Sticker Vinyl Glossy 200 gsm</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  Vinyl Glossy
                </span>
              </div>
            </div>

            {/* 4. Mesin Cetak */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                {stepChip(4)} Mesin Cetak Digital
              </label>
              <div className="py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer size={13} className="text-emerald-700" />
                  <span>Print Inter A3+ (Full Colour 1 Muka)</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 font-bold">
                  Rp {(isCutting ? customParams.tarifPrintCuttingA3 : customParams.tarifPrintNonCuttingA3).toLocaleString('id-ID')} /lbr
                </span>
              </div>
            </div>

            {/* 5. Finishing & Proses Cutting */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                {stepChip(5)} Finishing &amp; Proses Cutting
              </label>
              <div className="grid grid-cols-1 gap-2">
                {STIKER_FINISHING_OPTIONS.map((f) => {
                  const active = finishing === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFinishing(f)}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all text-left cursor-pointer flex items-center justify-between ${
                        active
                          ? 'border-slate-500 bg-slate-200 text-slate-900 shadow-xs ring-1 ring-slate-400'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Scissors size={13} className={active ? 'text-slate-900' : 'text-slate-500'} />
                        <span>{f}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {f.includes('Cutting') || f.includes('Die') ? 'Rp 20.000/lbr' : 'Rp 7.500/lbr'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Opsi Sisir Potong Rapih */}
              <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opsiSisir}
                    onChange={(e) => setOpsiSisir(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Tambahan Finishing Sisir (Potong Rapih)</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  Rp {customParams.tarifSisirPer500.toLocaleString('id-ID')} / 500 lbr
                </span>
              </div>
            </div>

            {/* 6. Margin & Batas Nego */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Margin Target (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={marginPct === 0 ? '' : marginPct}
                    onChange={(e) => setMarginPct(parseFloat(e.target.value) || 0)}
                    className="w-full text-right text-xs font-bold py-1.5 pr-7 pl-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Batas Nego (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={negoDiskonPct === 0 ? '' : negoDiskonPct}
                    onChange={(e) => setNegoDiskonPct(parseFloat(e.target.value) || 0)}
                    className="w-full text-right text-xs font-bold py-1.5 pr-7 pl-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
                    %
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Kolom Kanan: 3 Kartu Finansial Baku + Tabel Breakdown HPP */}
        <div className="lg:col-span-7 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          {/* 6. Hasil — sticky agar terlihat saat scroll breakdown */}
          <div className="sticky top-0 z-10 space-y-2 bg-slate-50/95 backdrop-blur-xs py-1 -my-1">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-900">
              {stepChip(6)} Kalkulasi Total
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200 p-3.5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-800 mb-1">
                  <span className="text-[11px] font-bold">Harga Per Pcs (+{marginPct}%)</span>
                  <TrendingUp size={13} className="text-emerald-600" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                    Rp {result.hargaJualPerPcs.toLocaleString('id-ID')}
                  </span>
                  <span className="block text-[10px] text-emerald-700/80 mt-0.5">
                    Laba {marginPct}%{negoDiskonPct > 0 ? ` • Nego Rp ${result.negoPerPcs.toLocaleString('id-ID')}` : ''}
                  </span>
                </div>
              </div>

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
                    Profit: Rp {Math.round(result.totalHargaJual - result.totalHpp).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Baris Ringkasan Spek Teknis */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Tag size={13} className="text-emerald-700" />
              <span className="font-bold text-slate-900">
                Stiker {ukuran} • Sticker Vinyl Glossy 200 gsm
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {result.lembarA3} Lembar A3+ ({kapasitasIsi} pcs/lbr)
            </span>
          </div>

          {/* Tabel Rincian Breakdown Biaya HPP 5 Kolom Baku */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Rincian Komponen Biaya HPP
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                {result.breakdown.length} Komponen
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 text-slate-600 border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3 font-bold w-8 text-center">No</th>
                    <th className="py-2.5 px-3 font-bold">Komponen Biaya</th>
                    <th className="py-2.5 px-3 font-bold">Keterangan / Kuantitas</th>
                    <th className="py-2.5 px-3 font-bold text-right">Subtotal (Rp)</th>
                    <th className="py-2.5 px-3 font-bold text-right w-16">Porsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {result.breakdown.map((row) => (
                    <tr key={row.no} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-slate-400 text-center font-semibold text-[10px]">
                        {row.no}
                      </td>
                      <td className="py-2 px-3 font-sans font-bold text-slate-800">{row.komponen}</td>
                      <td className="py-2 px-3 font-sans text-slate-500 text-[11px]">{row.keterangan}</td>
                      <td className="py-2 px-3 text-right font-black text-slate-800">
                        Rp {row.biaya.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500 font-semibold text-[10px]">
                        {row.porsiPct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-black border-t-2 border-slate-300 text-slate-900">
                    <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px] font-sans">
                      Total HPP ({oplah.toLocaleString('id-ID')} pcs)
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm text-emerald-900">
                      Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[11px] text-slate-500">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Tombol Simpan Standar Full-Width */}
          <div className="pt-1">
            {activeSimulationId ? (
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={handleSaveSimulation}
                  className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Perbarui kalkulasi yang sedang diedit"
                >
                  <BookmarkCheck size={15} />
                  <span>Update Perubahan</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAsNew}
                  className="flex-1 py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Simpan sebagai kalkulasi baru & keluar dari mode edit"
                >
                  <Bookmark size={14} />
                  <span>Simpan Baru</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSaveSimulation}
                className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bookmark size={15} />
                <span>Simpan Kalkulasi Ini ke Daftar Kalkulasi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Panduan Simulator */}
      {showGuideModal && (
        <div
          onClick={() => setShowGuideModal(false)}
          className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600/30 rounded-xl border border-emerald-500/40">
                  <BookOpen size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Panduan Simulator Stiker</h3>
                  <p className="text-xs text-slate-400">Pricelist Juli 2026 — 23. Stiker</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
                <h5 className="font-bold mb-1 flex items-center gap-1.5 text-xs text-emerald-900">
                  <CheckCircle2 size={14} className="text-emerald-700" />
                  Alur Perhitungan Excel Master (10 File Source .xlsm)
                </h5>
                <p>
                  Perhitungan stiker berbasis jumlah lembar A3+ digital printing. Kebutuhan lembar dihitung dari{' '}
                  <code className="font-mono font-bold text-emerald-900">ROUNDUP(Oplah / Isi per A3+)</code>.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-800">1. Kapasitas Lembar A3+:</h5>
                <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold">
                      <th className="p-2 border border-slate-200">Ukuran</th>
                      <th className="p-2 border border-slate-200 text-center">Isi Non Cutting</th>
                      <th className="p-2 border border-slate-200 text-center">Isi Cutting (Kiss-Cut)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-2 border border-slate-200 font-bold">7,5 × 6 cm</td><td className="p-2 border border-slate-200 text-center">30 pcs</td><td className="p-2 border border-slate-200 text-center">20 pcs</td></tr>
                    <tr><td className="p-2 border border-slate-200 font-bold">8 × 5 cm</td><td className="p-2 border border-slate-200 text-center">33 pcs</td><td className="p-2 border border-slate-200 text-center">29 pcs</td></tr>
                    <tr><td className="p-2 border border-slate-200 font-bold">9,5 × 6,5 cm</td><td className="p-2 border border-slate-200 text-center">21 pcs</td><td className="p-2 border border-slate-200 text-center">16 pcs</td></tr>
                    <tr><td className="p-2 border border-slate-200 font-bold">10 × 12 cm</td><td className="p-2 border border-slate-200 text-center">11 pcs</td><td className="p-2 border border-slate-200 text-center">8 pcs</td></tr>
                    <tr><td className="p-2 border border-slate-200 font-bold">21 × 29,7 cm (A4)</td><td className="p-2 border border-slate-200 text-center">2 pcs</td><td className="p-2 border border-slate-200 text-center">1 pcs</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-800">2. Komponen Biaya &amp; Pembulatan:</h5>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Tarif Print Digital</strong>: Non Cutting Rp 7.500/lbr A3+ vs Cutting Rp 20.000/lbr A3+ (mencakup ongkos pisau kiss-cut digital).</li>
                  <li><strong>Jasa Desain</strong>: Flat Rp 15.000 per order (jika oplah &gt; 0).</li>
                  <li><strong>Finishing Sisir</strong>: Opsional Rp 10.000 per 500 lembar A3+.</li>
                  <li><strong>Harga Jual Final</strong>: HPP + Laba 30% dibulatkan ke atas ke kelipatan Rp 10 (<code className="font-mono">ROUNDUP(..., -1)</code>).</li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
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
