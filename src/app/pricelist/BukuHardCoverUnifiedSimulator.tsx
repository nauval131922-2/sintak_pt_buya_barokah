'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { saveCalculationToDb } from '@/lib/pricelist-db-sync';
import {
  DollarSign,
  TrendingUp,
  FileText,
  Sliders,
  Bookmark,
  BookmarkCheck,
  X,
  Layers,
  Printer,
  BookOpen,
} from 'lucide-react';
import {
  calculateBukuHardCoverUnified,
  DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS,
  BukuHardCoverUnifiedParams,
  BukuHardCoverCalculationInput,
  HardCoverUkuran,
  MesinCoverHC,
  MesinIsiHC,
  FinishingCoverHC,
  OPLAH_TIERS_HC,
} from '@/lib/buku-hard-cover-unified';
import { toast } from '@/lib/toast';

const DRAFT_KEY = 'sintak_buku_hard_cover_draft';
const LS_KEY = 'sintak_saved_buku_hard_cover_simulations';

export interface SavedHardCoverItem {
  id: string;
  title: string;
  timestamp: string;
  data: {
    input: BukuHardCoverCalculationInput;
    result: {
      hppTotal: number;
      hppPerExp: number;
      totalHargaJual: number;
      hargaPerExp: number;
      hargaFinal: number;
    };
    paramsSnapshot?: BukuHardCoverUnifiedParams;
  };
}

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

const FINISHING_COVER_OPTIONS: FinishingCoverHC[] = [
  'None',
  'Laminasi Glossy',
  'Laminasi Doff',
  'Laminasi Glossy + Spot UV',
  'Laminasi Doff + Spot UV',
  'Laminasi Glossy + Foil',
  'Laminasi Doff + Foil',
  'Laminasi Glossy + Spot UV + Foil',
  'Laminasi Doff + Spot UV + Foil',
  'Laminasi Glossy + Spot UV + Foil + Emboss',
  'Laminasi Doff + Spot UV + Foil + Emboss',
];

interface BukuHardCoverUnifiedSimulatorProps {
  customParams?: BukuHardCoverUnifiedParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<BukuHardCoverUnifiedParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

export default function BukuHardCoverUnifiedSimulator({
  customParams = DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS,
  setCustomParams,
  onOpenMasterParam,
  activeSimulationId: propActiveSimId,
  setActiveSimulationId: propSetActiveSimId,
  activeSimulationTitle: propActiveSimTitle,
  setActiveSimulationTitle: propSetActiveSimTitle,
}: BukuHardCoverUnifiedSimulatorProps) {
  const [ukuran, setUkuran] = useState<HardCoverUkuran>(() => draftVal('ukuran', '14,5×20,25'));
  const [oplah, setOplah] = useState<number>(() => draftVal('oplah', 600));
  const [halaman, setHalaman] = useState<number>(() => draftVal('halaman', 100));
  const [mesinCover, setMesinCover] = useState<MesinCoverHC>(() => draftVal('mesinCover', 'OTOMATIS'));
  const [mesinIsi, setMesinIsi] = useState<MesinIsiHC>(() => draftVal('mesinIsi', 'OTOMATIS'));
  const [finishingCover, setFinishingCover] = useState<FinishingCoverHC>(() => draftVal('finishingCover', 'None'));
  const [sertakanShrink, setSertakanShrink] = useState<boolean>(() => draftVal('sertakanShrink', false));

  const [savedSimulations, setSavedSimulations] = useState<SavedHardCoverItem[]>([]);
  const [simulationTitle, setSimulationTitle] = useState('');
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const [internalActiveTitle, setInternalActiveTitle] = useState<string | null>(null);

  const activeSimulationId = propActiveSimId !== undefined ? propActiveSimId : internalActiveId;
  const setActiveSimulationId = (id: string | null) => {
    if (propSetActiveSimId) propSetActiveSimId(id);
    else setInternalActiveId(id);
  };
  const activeSimulationTitle = propActiveSimTitle !== undefined ? propActiveSimTitle : internalActiveTitle;
  const setActiveSimulationTitle = (title: string | null) => {
    if (propSetActiveSimTitle) propSetActiveSimTitle(title);
    else setInternalActiveTitle(title);
  };

  // Load saved simulations from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const list: SavedHardCoverItem[] = JSON.parse(raw);
        setSavedSimulations(list);

        if (activeSimulationId) {
          const item = list.find((s) => s.id === activeSimulationId);
          if (item) {
            const inp = item.data.input;
            setUkuran(inp.ukuran);
            setOplah(inp.oplah);
            setHalaman(inp.halaman);
            setMesinCover(inp.mesinCover);
            setMesinIsi(inp.mesinIsi);
            setFinishingCover(inp.finishingCover ?? 'None');
            setSertakanShrink(inp.sertakanShrink ?? false);
            setSimulationTitle(item.title);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [activeSimulationId]);

  // Auto-persist draft
  useEffect(() => {
    if (activeSimulationId) return; // Skip saving draft when editing a saved item
    try {
      const draftData = {
        ukuran,
        oplah,
        halaman,
        mesinCover,
        mesinIsi,
        finishingCover,
        sertakanShrink,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    } catch {
      // ignore
    }
  }, [ukuran, oplah, halaman, mesinCover, mesinIsi, finishingCover, sertakanShrink, activeSimulationId]);

  const calcResult = useMemo(() => {
    return calculateBukuHardCoverUnified(customParams, {
      ukuran,
      oplah,
      halaman,
      mesinCover,
      mesinIsi,
      finishingCover,
      sertakanShrink,
    });
  }, [customParams, ukuran, oplah, halaman, mesinCover, mesinIsi, finishingCover, sertakanShrink]);

  const handleSaveCalculation = (isNew: boolean = false) => {
    const title = simulationTitle.trim() || `Hard Cover ${ukuran} - ${oplah} exp (${halaman} hlm)`;
    const newId = isNew || !activeSimulationId ? `hc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}` : activeSimulationId;

    const payload: SavedHardCoverItem = {
      id: newId,
      title,
      timestamp: new Date().toISOString(),
      data: {
        input: {
          ukuran,
          oplah,
          halaman,
          mesinCover,
          mesinIsi,
          finishingCover,
          sertakanShrink,
        },
        result: {
          hppTotal: calcResult.hppTotal,
          hppPerExp: calcResult.hppPerExp,
          totalHargaJual: calcResult.totalHargaJual,
          hargaPerExp: calcResult.hargaPerExp,
          hargaFinal: calcResult.hargaFinal,
        },
        paramsSnapshot: { ...customParams },
      },
    };

    let updatedList: SavedHardCoverItem[];
    if (isNew || !activeSimulationId) {
      updatedList = [payload, ...savedSimulations.filter((s) => s.id !== newId)];
    } else {
      updatedList = savedSimulations.map((s) => (s.id === activeSimulationId ? payload : s));
    }

    setSavedSimulations(updatedList);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(updatedList));
      saveCalculationToDb({
        id: payload.id,
        category: 'Buku Hard Cover',
        title: payload.title,
        unitPrice: calcResult.hargaFinal,
        totalPrice: calcResult.totalHargaJual,
        oplah,
        specSummary: `${ukuran}, ${halaman} hlm, Cov: ${calcResult.mesinCoverTerpilih}, Isi: ${calcResult.mesinIsiTerpilih}, Fin: ${finishingCover}`,
        details: payload.data,
      });
      toast.success(isNew || !activeSimulationId ? 'Kalkulasi berhasil disimpan' : 'Perubahan kalkulasi diperbarui');
      setActiveSimulationId(newId);
      setActiveSimulationTitle(title);
    } catch {
      toast.error('Gagal menyimpan kalkulasi');
    }
  };

  const handleExitEdit = () => {
    setActiveSimulationId(null);
    setActiveSimulationTitle(null);
    setSimulationTitle('');
    toast.info('Keluar dari mode edit riwayat');
  };
  const optBtn = (active: boolean) =>
    `py-2 px-2 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
      active
        ? 'border-slate-500 bg-slate-200 text-slate-900 shadow-xs'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
    }`;

  const saklarBtn = (on: boolean) =>
    `py-1.5 px-2 rounded-lg border text-[11px] font-bold text-center transition cursor-pointer ${
      on
        ? 'border-slate-500 bg-slate-200 text-slate-900'
        : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
    }`;

  const stepChip = (n: number | string) => (
    <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-emerald-700 text-white text-[10px] font-black shrink-0">
      {n}
    </span>
  );

  const isEkstra = !OPLAH_TIERS_HC.includes(oplah);

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-140px)] min-h-0 space-y-3 pb-2">
      {/* Banner riwayat aktif */}
      {activeSimulationId && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-200 text-amber-900 rounded-lg">
              <Bookmark className="w-4 h-4 fill-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                  Mode Riwayat Aktif
                </span>
                <h4 className="text-xs font-bold text-amber-950">{activeSimulationTitle || activeSimulationId}</h4>
              </div>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Anda sedang melihat atau mengedit data dari riwayat simulasi yang dimuat.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSaveCalculation(false)}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <BookmarkCheck size={14} />
              <span>Simpan Perubahan</span>
            </button>
            <button
              type="button"
              onClick={handleExitEdit}
              className="px-3 py-1.5 bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <X size={14} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid Dual Scroll Baku Standar SINTAK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 min-h-0 pb-1">
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-5 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Spesifikasi Buku Hard Cover</h3>
            </div>

            {/* 1. Ukuran */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                {stepChip(1)} Ukuran
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['10,5×14,8', '14,5×20,25', '21×29,7'] as HardCoverUkuran[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUkuran(u)}
                    className={optBtn(ukuran === u)}
                  >
                    {u} cm
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Oplah & Halaman */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                    {stepChip(2)} Oplah (pcs)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={oplah}
                    onChange={(e) => setOplah(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {OPLAH_TIERS_HC.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setOplah(t)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                          oplah === t
                            ? 'border-slate-500 bg-slate-200 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {t.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>
                  {isEkstra && (
                    <p className="mt-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                      Oplah di luar daftar tier — Mengikuti rumus.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah Halaman Isi
                  </label>
                  <input
                    type="number"
                    min={4}
                    step={4}
                    value={halaman}
                    onChange={(e) => setHalaman(Math.max(4, parseInt(e.target.value) || 4))}
                    className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Cetak Cover */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  {stepChip(3)} Cetak Cover (4 Warna Fullcolor)
                </label>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Aktif: {calcResult.mesinCoverTerpilih}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['OTOMATIS', 'PRINT INTER', 'OLIVER', 'SM'] as MesinCoverHC[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMesinCover(m)}
                    className={optBtn(mesinCover === m)}
                  >
                    {m === 'OTOMATIS' ? '⚙️ Auto' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Cetak Isi */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  {stepChip(4)} Cetak Isi (1 Warna HVS 70)
                </label>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Aktif: {calcResult.mesinIsiTerpilih}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {(['OTOMATIS', 'PRINT BUYA', 'RYOBI', 'OLIVER', 'SM'] as MesinIsiHC[]).map((m) => {
                  const disabled = ukuran === '21×29,7' && m === 'RYOBI';
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={disabled}
                      onClick={() => setMesinIsi(m)}
                      title={disabled ? 'Ryobi tidak muat ukuran A4 21x29,7' : undefined}
                      className={`py-1.5 px-1 rounded-lg border text-[11px] font-bold text-center transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        mesinIsi === m
                          ? 'border-slate-500 bg-slate-200 text-slate-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {m === 'OTOMATIS' ? '⚙️ Auto' : m.replace('PRINT BUYA', 'Print')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Finishing Cover & Packing */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                {stepChip(5)} Finishing Cover &amp; Packing
              </label>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pilihan Finishing Cover</label>
                <select
                  value={finishingCover}
                  onChange={(e) => setFinishingCover(e.target.value as FinishingCoverHC)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
                >
                  {FINISHING_COVER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'None' ? 'Tanpa Finishing Tambahan (Polos)' : opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setSertakanShrink(!sertakanShrink)}
                  className={saklarBtn(sertakanShrink)}
                >
                  {sertakanShrink ? '✓ ' : ''}Bungkus Plastik Shrink Per Buku (Wrap Segel)
                </button>
              </div>
            </div>
            {/* Standar Konstruksi Hard Cover — Selalu Terbuka */}
            <div className="rounded-xl border border-slate-300 bg-slate-50/70 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-800">Standar Konstruksi Hard Cover</label>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                <li>Cover Art Paper 150 gsm fullcolor + Yellow Board No. 30 (tebal kokoh).</li>
                <li>Blok buku: jahit benang + lem press punggung + pita pembatas + headband kain + backing craft.</li>
                <li>Skiblat: Art Carton 230 gsm polos gantung cover (casing-in).</li>
                <li>Packing rapi dus isi 120 buku + segel lakban keliling.</li>
              </ul>
            </div>

            {/* Laba / Margin Master */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <span>Laba Master Hard Cover: <strong>{customParams.marginPersen}%</strong></span>
              {onOpenMasterParam && (
                <button
                  type="button"
                  onClick={onOpenMasterParam}
                  className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                >
                  Atur di Master Parameter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Hasil */}
        <div className="lg:col-span-7 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          {/* 6. Hasil — sticky agar terlihat saat scroll breakdown */}
          <div className="sticky top-0 z-10 space-y-2 bg-slate-50/95 backdrop-blur-xs py-1 -my-1">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-900">
              {stepChip(6)} Kalkulasi Total
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
                    Rp {Math.round(calcResult.hppPerExp).toLocaleString('id-ID')}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Total HPP: Rp {Math.round(calcResult.hppTotal).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Card 2: Harga Per Pcs */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200 p-3.5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-800 mb-1">
                  <span className="text-[11px] font-bold">Harga Per Pcs (+{customParams.marginPersen}%)</span>
                  <TrendingUp size={13} className="text-emerald-600" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                    Rp {calcResult.hargaFinal.toLocaleString('id-ID')}
                  </span>
                  <span className="block text-[10px] text-emerald-700/80 mt-0.5">Laba {customParams.marginPersen}%</span>
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
                    Rp {Math.round(calcResult.totalHargaJual).toLocaleString('id-ID')}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">
                    Profit: Rp {Math.round(calcResult.totalHargaJual - calcResult.hppTotal).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Keterangan Rincian Biaya Hard Cover
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {oplah.toLocaleString('id-ID')} Pcs · {halaman} Hal · {ukuran} cm
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2 px-3 w-10 text-center">No.</th>
                    <th className="py-2 px-3">Jenis</th>
                    <th className="py-2 px-3">Keterangan</th>
                    <th className="py-2 px-3 text-right">Harga (Rp)</th>
                    <th className="py-2 px-3 text-right w-16">Porsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {calcResult.breakdown.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-800 font-sans">{item.item}</td>
                      <td className="py-2 px-3 text-slate-500 text-[10.5px] font-sans">{item.spekTeknis}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">
                        Rp {Math.round(item.biaya).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        {item.persen.toFixed(1)}%
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
                      Rp {Math.round(calcResult.hppTotal).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Simpan */}
          <div className="pt-1">
            {activeSimulationId ? (
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => handleSaveCalculation(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Perbarui kalkulasi yang sedang diedit"
                >
                  <BookmarkCheck size={15} />
                  <span>Update Perubahan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCalculation(true)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Simpan sebagai kalkulasi baru & keluar dari mode edit"
                >
                  <Bookmark size={14} />
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
  );
}
