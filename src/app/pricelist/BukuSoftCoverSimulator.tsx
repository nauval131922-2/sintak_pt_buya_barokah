'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { saveCalculationToDb } from '@/lib/pricelist-db-sync';
import {
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  Percent,
  FileText,
  Copy,
  Check,
  Share2,
  Sliders,
  Bookmark,
  BookmarkCheck,
  X,
  Settings2,
  Calculator,
  Info,
  Layers,
  RefreshCw,
  BookCopy,
} from 'lucide-react';
import {
  calculateBukuSoftCoverHpp,
  DEFAULT_BUKU_SOFT_COVER_PARAMS,
  BukuSoftCoverMasterParams,
  BukuSoftCoverVarianType,
  BukuSoftCoverFinishingType,
  BUKU_SOFT_COVER_TIERS,
  BUKU_SOFT_COVER_VARIANTS,
  BUKU_SOFT_COVER_FINISHING_OPTIONS,
  SavedBukuSoftCoverSimulationItem,
} from '@/lib/buku-soft-cover-calculator';
import { toast } from '@/lib/toast';

export type { SavedBukuSoftCoverSimulationItem };

const LS_KEY = 'sintak_saved_buku_soft_cover_simulations';

interface BukuSoftCoverSimulatorProps {
  customParams?: BukuSoftCoverMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<BukuSoftCoverMasterParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

export default function BukuSoftCoverSimulator({
  customParams = DEFAULT_BUKU_SOFT_COVER_PARAMS,
  setCustomParams,
  onOpenMasterParam,
  activeSimulationId: propActiveSimId,
  setActiveSimulationId: propSetActiveSimId,
  activeSimulationTitle: propActiveSimTitle,
  setActiveSimulationTitle: propSetActiveSimTitle,
}: BukuSoftCoverSimulatorProps) {
  const [oplah, setOplah] = useState<number>(100);
  const [varian, setVarian] = useState<BukuSoftCoverVarianType>('21 x 29,7 cm');
  const [finishing, setFinishing] = useState<BukuSoftCoverFinishingType>('Laminasi Glossy');
  const [marginPct, setMarginPct] = useState(customParams.marginDefaultPct);
  const [negoDiskonPct, setNegoDiskonPct] = useState(customParams.negoDefaultPct);
  const [copiedQuote, setCopiedQuote] = useState(false);

  const [savedSimulations, setSavedSimulations] = useState<SavedBukuSoftCoverSimulationItem[]>([]);
  const [simulationTitle, setSimulationTitle] = useState('');
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const [internalActiveTitle, setInternalActiveTitle] = useState<string | null>(null);
  const [showSimulatorManual, setShowSimulatorManual] = useState(false);

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const list: SavedBukuSoftCoverSimulationItem[] = JSON.parse(raw);
        setSavedSimulations(list);

        if (activeSimulationId) {
          const item = list.find((s) => s.id === activeSimulationId);
          if (item) {
            const inp = item.data.input;
            setOplah(inp.oplah);
            setVarian(inp.varian);
            setFinishing(inp.finishing);
            setMarginPct(inp.marginPct);
            setNegoDiskonPct(inp.negoDiskonPct);
            setSimulationTitle(item.title);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load saved buku soft cover simulations:', e);
    }
  }, [activeSimulationId]);

  const result = useMemo(
    () =>
      calculateBukuSoftCoverHpp(
        { oplah, varian, jumlahHalaman: 32, finishing, marginPct, negoDiskonPct },
        customParams
      ),
    [oplah, varian, finishing, marginPct, negoDiskonPct, customParams]
  );

  const defaultTitle = () =>
    `Buku Soft Cover ${varian} 32 Hal (${oplah} pcs) ${finishing}`;

  const handleSaveSimulation = () => {
    const title = simulationTitle.trim() || defaultTitle();
    const newItem: SavedBukuSoftCoverSimulationItem = {
      id: 'buku_soft_cover_' + Date.now(),
      title,
      savedAt: new Date().toISOString(),
      oplah,
      data: result,
        paramsSnapshot: customParams,
        paramsSnapshot: customParams,
    };
    const updated = [newItem, ...savedSimulations.slice(0, 49)];
    setSavedSimulations(updated);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save buku soft cover simulation:', e);
    }
    setSimulationTitle('');
    toast.success(`Kalkulasi "${title}" berhasil disimpan!`);
  };
    try { saveCalculationToDb({ ...newItem, category: 'Buku Soft Cover' }); } catch {}

  const handleUpdateSavedSimulation = () => {
    if (!activeSimulationId) return;
    const title = simulationTitle.trim() || activeSimulationTitle || defaultTitle();
    const updated = savedSimulations.map((item) =>
      item.id === activeSimulationId
        ? { ...item, title, savedAt: new Date().toISOString(), data: result,
        paramsSnapshot: customParams }
        : item
    );
    setSavedSimulations(updated);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update buku soft cover simulation:', e);
    }
    setActiveSimulationTitle(title);
    toast.success(`Perubahan "${title}" berhasil disimpan!`);
  };
    try { const targetItem = updated.find((x) => x.id === activeSimulationId); if (targetItem) saveCalculationToDb({ ...targetItem, category: 'Buku Soft Cover' }); } catch {}

  const handleCopyQuote = () => {
    const fmt = (n: number) => n.toLocaleString('id-ID');
    const text =
      `*PENAWARAN BUKU SOFT COVER*\n` +
      `*PT Buya Barokah*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Produk*: Buku Soft Cover ${varian}\n` +
      `• *Spesifikasi*: 32 halaman · Cover AC 230 FC + Isi HVS 70 1 Warna\n` +
      `• *Ukuran*: ${varian} · Finishing: ${finishing}\n` +
      `• *Cetak Cover*: Print Inter A3+ All-In (${result.kebutuhanCoverA3} lbr)\n` +
      `• *Cetak Isi*: Oliver Offset (${result.kebutuhanPlanoIsi} plano)\n` +
      `• *Finishing*: ${finishing} + Staples + Sisir Binding\n` +
      `• *Kuantitas*: ${fmt(oplah)} pcs\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Harga / pcs*: *Rp ${fmt(result.hargaJualPerPcs)}*\n` +
      `• *Harga Nego / pcs*: *Rp ${fmt(result.negoPerPcs)}*\n` +
      `• *Total Penawaran*: *Rp ${fmt(result.totalHargaJual)}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Harga belum termasuk PPN. Buku Soft Cover ${varian} 32 Hal, AC 230 Cover + HVS 70 Isi, ${finishing} + Sisir._`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success('Penawaran Buku Soft Cover berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <BookCopy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-emerald-950 flex items-center gap-2">
              Simulator &amp; Kalkulator Buku Soft Cover — Katalog 17
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Katalog 17
              </span>
            </h3>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Hitung HPP, harga penawaran, dan estimasi profit Buku Soft Cover 21×29,7 / 14,8×21 cm · 32 hal · Cover AC 230 (Print Inter) + Isi HVS 70 (Oliver) · Laminasi + Sisir.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyQuote}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
              copiedQuote
                ? 'bg-emerald-700 text-white'
                : 'bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300'
            }`}
          >
            {copiedQuote ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copiedQuote ? 'Tersalin!' : 'Salin Penawaran'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSimulatorManual(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all shadow-2xs cursor-pointer"
          >
            <Info size={14} />
            <span>Panduan</span>
          </button>
          {onOpenMasterParam && (
            <button
              type="button"
              onClick={onOpenMasterParam}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all shadow-2xs cursor-pointer"
            >
              <Settings2 size={14} />
              <span>Master Parameter</span>
            </button>
          )}
        </div>
      </div>

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
                <h4 className="text-xs font-bold text-amber-950">{activeSimulationTitle}</h4>
              </div>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Anda sedang melihat atau mengedit data dari riwayat simulasi yang dimuat.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleUpdateSavedSimulation}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <BookmarkCheck size={14} />
              <span>Simpan Perubahan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSimulationId(null);
                setActiveSimulationTitle(null);
                setSimulationTitle('');
              }}
              className="p-1.5 bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
              title="Tutup mode riwayat"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Input Spesifikasi Buku Soft Cover</h3>
            </div>

            {/* Varian Ukuran */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Varian Ukuran Buku
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BUKU_SOFT_COVER_VARIANTS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVarian(v)}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-bold text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      varian === v
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <BookCopy size={14} className={varian === v ? 'text-white' : 'text-slate-500'} />
                    <span className="leading-tight text-[11px]">{v}</span>
                    <span className={`text-[10px] leading-tight font-normal ${varian === v ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {v === '21 x 29,7 cm' ? 'A4 · 1.320 cm²' : 'A5 · 660 cm²'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Finishing Laminasi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Finishing Laminasi Cover
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BUKU_SOFT_COVER_FINISHING_OPTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFinishing(f)}
                    className={`py-2 px-2.5 rounded-lg border text-[11px] font-bold text-center transition cursor-pointer ${
                      finishing === f
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Oplah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kuantitas Oplah (pcs)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={BUKU_SOFT_COVER_TIERS.includes(oplah) ? oplah : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') setOplah(Number(e.target.value));
                  }}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {BUKU_SOFT_COVER_TIERS.map((t) => (
                    <option key={t} value={t}>{t.toLocaleString('id-ID')} pcs</option>
                  ))}
                  {!BUKU_SOFT_COVER_TIERS.includes(oplah) && (
                    <option value="custom">{oplah.toLocaleString('id-ID')} pcs (custom)</option>
                  )}
                </select>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  step={1}
                  value={oplah}
                  onChange={(e) => setOplah(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  placeholder="Custom..."
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Cover: {result.kebutuhanCoverA3} lbr A3+ · Plano isi: {result.kebutuhanPlanoIsi} · Insirt: {result.insirtIsi}
              </p>
            </div>

            {/* Margin & Nego */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Margin Profit (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={marginPct}
                    onChange={(e) => setMarginPct(Number(e.target.value) || 0)}
                    className="w-full pl-3 pr-7 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batas Nego (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={negoDiskonPct}
                    onChange={(e) => setNegoDiskonPct(Number(e.target.value) || 0)}
                    className="w-full pl-3 pr-7 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Judul Simpan */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Judul Kalkulasi (opsional)
              </label>
              <input
                type="text"
                value={simulationTitle}
                onChange={(e) => setSimulationTitle(e.target.value)}
                placeholder={defaultTitle()}
                className="w-full px-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Hasil */}
        <div className="lg:col-span-7 space-y-5">
          {/* 4 Kartu Finansial */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">HPP / pcs</span>
                <DollarSign size={13} className="text-slate-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
                  Rp {Math.round(result.hppPerPcs).toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  Total HPP: Rp {result.totalHpp.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[11px] font-bold">Harga Jual (+{marginPct}%)</span>
                <TrendingUp size={13} className="text-emerald-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                  Rp {result.hargaJualPerPcs.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-emerald-700/80 mt-0.5">/ pcs</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-800 mb-1">
                <span className="text-[11px] font-bold">Harga Nego (-{negoDiskonPct}%)</span>
                <Percent size={13} className="text-blue-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-blue-800 font-mono">
                  Rp {result.negoPerPcs.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-blue-700/80 mt-0.5">/ pcs</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">Total Harga Jual</span>
                <TrendingUp size={13} className="text-emerald-500" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                  Rp {result.totalHargaJual.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  {oplah.toLocaleString('id-ID')} pcs
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Rincian Estimasi Komponen Biaya Buku Soft Cover
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {oplah.toLocaleString('id-ID')} pcs · {varian} · {finishing}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2 px-3 w-10 text-center">No</th>
                    <th className="py-2 px-3">Komponen Biaya</th>
                    <th className="py-2 px-3">Keterangan Teknis</th>
                    <th className="py-2 px-3 text-right">Biaya (Rp)</th>
                    <th className="py-2 px-3 text-right w-16">Porsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {result.breakdown.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-400">{item.no}</td>
                      <td className="py-2 px-3 font-medium text-slate-800 font-sans">{item.komponen}</td>
                      <td className="py-2 px-3 text-slate-500 text-[10.5px] font-sans">{item.keterangan}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">
                        Rp {Math.round(item.biaya).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        {item.porsiPct.toFixed(1)}%
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
                      Rp {result.totalHpp.toLocaleString('id-ID')}
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
              <button
                type="button"
                onClick={handleUpdateSavedSimulation}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookmarkCheck size={16} />
                <span>Simpan Perubahan ke Daftar Kalkulasi</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveSimulation}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bookmark size={16} />
                <span>Simpan Kalkulasi Ini ke Daftar Kalkulasi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Panduan */}
      {showSimulatorManual && (
        <div
          onClick={() => setShowSimulatorManual(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Panduan Simulator Buku Soft Cover</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Alur perhitungan HPP berbasis oplah pcs, cover AC 230 (Print Inter A3+), isi HVS 70 (Oliver offset)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSimulatorManual(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Langkah Menggunakan Simulator Buku Soft Cover
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    ['1. Varian', 'Pilih 21×29,7 cm (A4) atau 14,8×21 cm (A5). Area laminasi: A4=1.320 cm², A5=660 cm².'],
                    ['2. Finishing', 'Pilih Laminasi Glossy (0,35/cm²), Doff (0,40/cm²), UV Varnish (0,11/cm²), atau Tanpa Laminasi.'],
                    ['3. Oplah', 'Tentukan oplah 20–500 pcs via dropdown tier atau custom. Formula empiris terverifikasi dari Excel.'],
                    ['4. Salin / Simpan', 'Klik Salin Penawaran untuk teks WA otomatis, atau simpan ke daftar kalkulasi.'],
                  ].map(([title, desc]) => (
                    <div key={title as string} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="font-bold text-emerald-800 text-xs">{title}</span>
                      <p className="text-[11px] text-slate-600">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  Struktur Biaya Produksi Buku Soft Cover
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-2.5 bg-white rounded border border-emerald-100 space-y-1">
                    <span className="font-bold text-emerald-900 block">Cover (Print Inter A3+):</span>
                    <p className="text-slate-600 leading-snug">
                      (oplah+5) lbr × Rp 2.700 all-in (bahan AC 230 + cetak FC). Desain Rp 20.000.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-blue-100 space-y-1">
                    <span className="font-bold text-blue-900 block">Isi (Oliver Offset):</span>
                    <p className="text-slate-600 leading-snug">
                      Plano = 2×oplah+200. Kertas: plano × 0,04549 kg × Rp 15.700/kg +3%. Plate 1×45.000, min 90.000, over-drek (insirt-500)×80.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-purple-100 space-y-1">
                    <span className="font-bold text-purple-900 block">Laminasi + Jasa:</span>
                    <p className="text-slate-600 leading-snug">
                      Laminasi: area_cm² × tarif × oplah (min 50.000). Jasa susun: UMR/20.000/pcs. Staples: 9/pcs. Sisir: 150/pcs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[11.5px] text-amber-900">
                <strong>Catatan:</strong> Formula ini terverifikasi dari Pricelist Buku Soft Cover 21×29,7.xlsm (diff=0 untuk semua tier 20–500 pcs).
                Staples 9/pcs dari pack 3.000 per 369 pcs (internal, tidak di master parameter).
                Desain isi dihitung per halaman × 32 halaman.
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSimulatorManual(false)}
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
