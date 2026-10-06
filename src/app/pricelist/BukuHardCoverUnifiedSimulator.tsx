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

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-140px)] min-h-0 space-y-3 pb-2">
      {/* Banner Mode Edit Riwayat */}
      {activeSimulationId && (
        <div className="shrink-0 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <BookmarkCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-bold text-amber-800 truncate">
              Sedang Mengedit Riwayat: <span className="underline">{activeSimulationTitle || activeSimulationId}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleExitEdit}
            className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-white/80 hover:bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Tutup</span>
          </button>
        </div>
      )}

      {/* Grid Dual Scroll Baku Standar SINTAK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 min-h-0 pb-1">
        {/* KOLOM KIRI: FORM INPUT SIMULATOR */}
        <div className="lg:col-span-5 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          {/* Card 1: Spesifikasi Ukuran, Oplah, & Halaman */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800">1. Spesifikasi Buku</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                Hard Cover
              </span>
            </div>

            {/* Pilihan Ukuran Buku */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Ukuran Buku</label>
              <div className="grid grid-cols-3 gap-2">
                {(['10,5×14,8', '14,5×20,25', '21×29,7'] as HardCoverUkuran[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUkuran(u)}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                      ukuran === u
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {u} cm
                  </button>
                ))}
              </div>
            </div>

            {/* Oplah & Halaman */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Oplah (Eksemplar)</label>
                <input
                  type="number"
                  min={1}
                  value={oplah}
                  onChange={(e) => setOplah(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jumlah Halaman Isi</label>
                <input
                  type="number"
                  min={4}
                  step={4}
                  value={halaman}
                  onChange={(e) => setHalaman(Math.max(4, parseInt(e.target.value) || 4))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                />
              </div>
            </div>

            {/* Pilihan Cepat Oplah Standar */}
            <div>
              <span className="block text-[10px] font-semibold text-slate-400 mb-1">Tier Oplah Cepat:</span>
              <div className="flex flex-wrap gap-1">
                {[50, 100, 200, 300, 500, 600, 1000, 1500, 2000, 2500].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOplah(t)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded border cursor-pointer ${
                      oplah === t
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Mesin Cetak Cover & Mesin Cetak Isi */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-slate-800">2. Mesin Cetak Cover & Isi</h3>
              </div>
            </div>

            {/* Mesin Cetak Cover */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-600">Mesin Cover (4 Warna Fullcolor)</label>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  Aktif: {calcResult.mesinCoverTerpilih}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['OTOMATIS', 'PRINT INTER', 'OLIVER', 'SM'] as MesinCoverHC[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMesinCover(m)}
                    className={`py-1.5 px-1 text-[11px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                      mesinCover === m
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {m === 'OTOMATIS' ? '⚙️ Auto' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Mesin Cetak Isi */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-600">Mesin Isi (1 Warna HVS 70)</label>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Aktif: {calcResult.mesinIsiTerpilih}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {(['OTOMATIS', 'PRINT BUYA', 'RYOBI', 'OLIVER', 'SM'] as MesinIsiHC[]).map((m) => {
                  const disabled = ukuran === '21×29,7' && m === 'RYOBI';
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={disabled}
                      onClick={() => setMesinIsi(m)}
                      title={disabled ? 'Ryobi tidak muat ukuran A4 21x29,7' : undefined}
                      className={`py-1.5 px-1 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        mesinIsi === m
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m === 'OTOMATIS' ? '⚙️ Auto' : m.replace('PRINT BUYA', 'Print')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 3: Finishing Khusus Cover & Packing */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-600" />
                <h3 className="text-xs font-bold text-slate-800">3. Finishing Khusus & Packing</h3>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Finishing Cover</label>
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
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sertakanShrink}
                  onChange={(e) => setSertakanShrink(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Bungkus Plastik Shrink Per Buku (Wrap Segel)
                </span>
              </label>
            </div>
          </div>

          {/* Card 4: Catatan Standar Master Buku Hard Cover (Terbuka Penuh) */}
          <div className="bg-slate-50/70 rounded-xl border border-slate-200 shadow-2xs p-4 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <h4 className="font-bold text-slate-700">Standar Konstruksi Hard Cover</h4>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
              <li>Cover Art Paper 150 gsm fullcolor + Yellow Board No. 30 (tebal kokoh).</li>
              <li>Blok buku: jahit benang + lem press punggung + pita pembatas + headband kain + backing craft.</li>
              <li>Skiblat: Art Carton 230 gsm polos gantung cover (casing-in).</li>
              <li>Packing rapi dus isi 120 buku + segel lakban keliling.</li>
            </ul>
          </div>
        </div>

        {/* KOLOM KANAN: TABEL RINCIAN BIAYA & SIMPAN KALKULASI */}
        <div className="lg:col-span-7 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          {/* Card Header Ringkasan Harga Final */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-xs p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Pricelist Hard Cover {ukuran} cm
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    Rp {calcResult.hargaFinal.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs text-slate-300">/ eksemplar</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Total Order: Rp {calcResult.totalHargaJual.toLocaleString('id-ID', { maximumFractionDigits: 0 })} ({oplah} exp, {halaman} hlm)
                </p>
              </div>

              <div className="flex flex-col sm:items-end gap-1 border-t sm:border-t-0 border-slate-700/60 pt-2 sm:pt-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>HPP / Exp: Rp {calcResult.hppPerExp.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Margin Profit: {customParams.marginPersen}%</span>
                </div>
                {onOpenMasterParam && (
                  <button
                    type="button"
                    onClick={onOpenMasterParam}
                    className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Ubah Master Parameter</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabel Rincian Breakdown Biaya Transparan */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">Rincian Komponen Biaya (HPP)</h4>
              <span className="text-[10px] font-bold text-slate-500">
                Total HPP: Rp {calcResult.hppTotal.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2 px-3">Kategori</th>
                    <th className="py-2 px-3">Komponen</th>
                    <th className="py-2 px-3">Spesifikasi Fisik</th>
                    <th className="py-2 px-3 text-right">Biaya (Rp)</th>
                    <th className="py-2 px-3 text-right">Porsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {calcResult.breakdown.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-[11px] font-semibold text-slate-500">{item.kategori}</td>
                      <td className="py-2 px-3 text-xs font-bold text-slate-800">{item.item}</td>
                      <td className="py-2 px-3 text-[11px] text-slate-500">{item.spekTeknis}</td>
                      <td className="py-2 px-3 text-xs font-bold text-slate-900 text-right">
                        {item.biaya.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-2 px-3 text-[11px] font-mono text-slate-500 text-right">
                        {item.persen.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel Simpan Kalkulasi Full-Width (Baku Standar SINTAK) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Bookmark className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800">Simpan Kalkulasi ke Database</h4>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Judul / Keterangan Order (Opsional)
              </label>
              <input
                type="text"
                value={simulationTitle}
                onChange={(e) => setSimulationTitle(e.target.value)}
                placeholder={`Hard Cover ${ukuran} - ${oplah} exp (${halaman} hlm)`}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
            </div>

            {/* Tombol Simpan Full-Width */}
            {activeSimulationId ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleSaveCalculation(false)}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Update Perubahan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCalculation(true)}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Simpan Baru</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleSaveCalculation(false)}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
                <span>Simpan Kalkulasi Ini ke Daftar Kalkulasi</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
