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
  Tag,
  Pill,
} from 'lucide-react';
import {
  calculateLebelKartuObatHpp,
  DEFAULT_LEBEL_KARTU_OBAT_PARAMS,
  LebelKartuObatMasterParams,
  LebelKartuObatVarianType,
  LEBEL_KARTU_OBAT_TIERS,
  SavedLebelKartuObatSimulationItem,
  LEBEL_KARTU_OBAT_CONFIG,
} from '@/lib/lebel-kartu-obat-calculator';
import { toast } from '@/lib/toast';

export type { SavedLebelKartuObatSimulationItem };

const VARIAN_OPTIONS: LebelKartuObatVarianType[] = ['3,5 x 7 cm', '4 x 6 cm', '5 x 6,7 cm'];

interface LebelKartuObatSimulatorProps {
  customParams?: LebelKartuObatMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<LebelKartuObatMasterParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

export default function LebelKartuObatSimulator({
  customParams = DEFAULT_LEBEL_KARTU_OBAT_PARAMS,
  setCustomParams,
  onOpenMasterParam,
  activeSimulationId: propActiveSimId,
  setActiveSimulationId: propSetActiveSimId,
  activeSimulationTitle: propActiveSimTitle,
  setActiveSimulationTitle: propSetActiveSimTitle,
}: LebelKartuObatSimulatorProps) {
  const [oplah, setOplah] = useState<number>(5);
  const [varian, setVarian] = useState<LebelKartuObatVarianType>('3,5 x 7 cm');
  const [marginPct, setMarginPct] = useState(30);
  const [negoDiskonPct, setNegoDiskonPct] = useState(4);
  const [copiedQuote, setCopiedQuote] = useState(false);

  const [savedSimulations, setSavedSimulations] = useState<SavedLebelKartuObatSimulationItem[]>([]);
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
      const raw = localStorage.getItem('sintak_saved_lebel_kartu_obat_simulations');
      if (raw) {
        const list: SavedLebelKartuObatSimulationItem[] = JSON.parse(raw);
        setSavedSimulations(list);

        if (activeSimulationId) {
          const item = list.find((s) => s.id === activeSimulationId);
          if (item) {
            const inp = item.data.input;
            setOplah(inp.oplah);
            setVarian(inp.varian);
            setMarginPct(inp.marginPct);
            setNegoDiskonPct(inp.negoDiskonPct);
            setSimulationTitle(item.title);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load saved lebel kartu obat simulations:', e);
    }
  }, [activeSimulationId]);

  const result = useMemo(
    () =>
      calculateLebelKartuObatHpp(
        { oplah, varian, marginPct, negoDiskonPct },
        customParams
      ),
    [oplah, varian, marginPct, negoDiskonPct, customParams]
  );

  const defaultTitle = () => {
    return `Lebel Kartu Obat ${varian} (${oplah} rim)`;
  };

  const handleSaveSimulation = () => {
    const title = simulationTitle.trim() || defaultTitle();
    const newItem: SavedLebelKartuObatSimulationItem = {
      id: 'lebel_kartu_obat_' + Date.now(),
      title,
      savedAt: new Date().toISOString(),
      data: result,
      paramsSnapshot: customParams,
    };
    const updated = [newItem, ...savedSimulations.slice(0, 49)];
    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_lebel_kartu_obat_simulations', JSON.stringify(updated));
    saveCalculationToDb({ ...newItem, category: 'Lebel Kartu Obat' });
    } catch (e) {
      console.error('Failed to save lebel kartu obat simulation:', e);
    }
    setSimulationTitle('');
    toast.success(`Kalkulasi "${title}" berhasil disimpan!`);
    setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
    setSimulationTitle('');
  };

  const handleUpdateSavedSimulation = () => {
    if (!activeSimulationId) return;
    const title = simulationTitle.trim() || activeSimulationTitle || defaultTitle();
    const updated = savedSimulations.map((item) =>
      item.id === activeSimulationId
        ? { ...item, title, savedAt: new Date().toISOString(), data: result, paramsSnapshot: customParams }
        : item
    );
    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_lebel_kartu_obat_simulations', JSON.stringify(updated));
    const targetItem = updated.find((x) => x.id === activeSimulationId);
      if (targetItem) saveCalculationToDb({ ...targetItem, category: 'Lebel Kartu Obat' });
    } catch (e) {
      console.error('Failed to update lebel kartu obat simulation:', e);
    }
    setActiveSimulationTitle(title);
    toast.success(`Perubahan "${title}" berhasil disimpan!`);
    setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
    setSimulationTitle('');
  };

  const handleCopyQuote = () => {
    const fmt = (n: number) => n.toLocaleString('id-ID');
    const cfg = LEBEL_KARTU_OBAT_CONFIG[varian];
    const text =
      `*PENAWARAN LEBEL KARTU OBAT*\n` +
      `*PT Buya Barokah*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Produk*: Lebel Kartu Obat ${varian} cm\n` +
      `• *Spesifikasi*: ${cfg.description}\n` +
      `• *Ukuran*: ${varian} cm · HVS 70 gsm 1 Warna 1 Muka\n` +
      `• *Bahan*: HVS 70 gsm Folio 21,5×33 cm\n` +
      `• *Finishing*: Rajang + Packing\n` +
      `• *Kuantitas*: ${oplah} rim (${oplah * 500} lbr, ${result.kebutuhanPlano} lbr plano)\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Harga / Rim*: *Rp ${fmt(result.hargaJualPerRim)}*\n` +
      `• *Harga Nego / Rim*: *Rp ${fmt(result.hargaNegoPerRim)}*\n` +
      `• *Total Penawaran*: *Rp ${fmt(result.totalHargaJual)}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Harga belum termasuk PPN. Lebel Kartu Obat ${varian} cm, HVS 70 1 Warna 1 Muka, cetak 1 plat, finishing sisir/rajang + packing._`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success('Penawaran harga Lebel Kartu Obat berhasil disalin ke WhatsApp clipboard!');
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-emerald-950 flex items-center gap-2">
              Simulator &amp; Kalkulator Lebel Kartu Obat
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Katalog 16
              </span>
            </h3>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Hitung HPP, harga penawaran, dan estimasi profit Lebel Kartu Obat HVS 70 1 Warna 1 Muka 3,5×7 / 4×6 / 5×6,7 cm, rajang + packing.
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
              className="px-3 py-1.5 bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <X size={14} />
              <span>Keluar</span>
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
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Input Spesifikasi Lebel Kartu Obat</h3>
            </div>

            {/* Varian Ukuran */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Varian Ukuran Lebel Kartu Obat
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VARIAN_OPTIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVarian(v)}
                    className={`py-2 px-2 rounded-lg border text-xs font-bold text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      varian === v
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Tag size={14} className={varian === v ? 'text-white' : 'text-slate-500'} />
                    <span className="leading-tight text-[11px]">{v}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 italic">{LEBEL_KARTU_OBAT_CONFIG[varian].description}</p>
            </div>

            {/* Oplah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kuantitas Oplah (rim) — 1 rim = 500 lbr
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={LEBEL_KARTU_OBAT_TIERS.includes(oplah) ? oplah : 'custom'}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v !== 'custom') setOplah(Number(v));
                  }}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {LEBEL_KARTU_OBAT_TIERS.map((t) => (
                    <option key={t} value={t}>{t.toLocaleString('id-ID')} rim ({(t*500).toLocaleString('id-ID')} lbr)</option>
                  ))}
                  {!LEBEL_KARTU_OBAT_TIERS.includes(oplah) && <option value="custom">{oplah.toLocaleString('id-ID')} rim (custom)</option>}
                </select>
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  value={oplah}
                  onChange={(e) => setOplah(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  placeholder="Custom..."
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{LEBEL_KARTU_OBAT_CONFIG[varian].potongPerPlano} potong/plano · Kebutuhan {result.kebutuhanPlano} lbr plano · Cetak {result.kebutuhanCetak} lbr</p>
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
          </div>
        </div>

        {/* Kolom Kanan: Hasil */}
        <div className="lg:col-span-7 space-y-5">
          {/* 4 Kartu Finansial */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">HPP / rim</span>
                <DollarSign size={13} className="text-slate-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
                  Rp {Math.round(result.hppPerRim).toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  Total HPP: Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}
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
                  Rp {result.hargaJualPerRim.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-emerald-700/80 mt-0.5">/ rim (500 lbr)</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-800 mb-1">
                <span className="text-[11px] font-bold">Harga Nego (-{negoDiskonPct}%)</span>
                <Percent size={13} className="text-blue-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-blue-800 font-mono">
                  Rp {result.hargaNegoPerRim.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-blue-700/80 mt-0.5">/ rim</span>
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
                  Profit: Rp {Math.round(result.profitTotal).toLocaleString('id-ID')}
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
                  Rincian Estimasi Komponen Biaya Lebel Kartu Obat
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {oplah.toLocaleString('id-ID')} rim · {varian} · HVS 70 · Sisir
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
                      <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-800 font-sans">{item.nama}</td>
                      <td className="py-2 px-3 text-slate-500 text-[10.5px] font-sans">{item.keterangan}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">
                        Rp {item.nominal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        {(item.pct * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/90 font-bold border-t border-slate-200 text-xs">
                    <td colSpan={3} className="py-2.5 px-3 text-slate-800 font-sans">
                      Total HPP Biaya Produksi ({oplah.toLocaleString('id-ID')} rim / {(oplah*500).toLocaleString('id-ID')} lbr)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm">
                      Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}
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
                  onClick={handleUpdateSavedSimulation}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Perbarui kalkulasi yang sedang diedit"
                >
                  <BookmarkCheck size={15} />
                  <span>Update Perubahan</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveSimulation}
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
                  <h3 className="text-base font-bold tracking-tight">Panduan Simulator Lebel Kartu Obat</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Alur perhitungan berbasis oplah rim (1 rim = 500 lbr), HVS 70 1 Warna 1 Muka, rajang + packing
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
                  Langkah Menggunakan Simulator Lebel Kartu Obat
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    ['1. Varian', 'Pilih 3,5×7 (kecil), 4×6 (sedang), atau 5×6,7 cm (besar) — semua HVS 70 Folio 21,5×33.'],
                    ['2. Oplah', 'Tentukan oplah 1–10 rim via dropdown tier atau custom (max 50 rim = 25.000 lbr). 1 rim = 500 lbr.'],
                    ['3. Margin & Nego', 'Atur margin 30% & nego 4% (default HARGA JULI 2026) — harga jual ceil(+30%)/100, nego -4%.'],
                    ['4. Salin Penawaran', 'Klik Salin Penawaran untuk teks WA otomatis (HVS 70 Rajang), atau simpan ke daftar kalkulasi.'],
                  ].map(([title, desc]) => (
                    <div key={title} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="font-bold text-emerald-800 text-xs">{title}</span>
                      <p className="text-[11px] text-slate-600">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  Struktur Biaya Produksi Lebel Kartu Obat
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-white rounded border border-emerald-100 space-y-1">
                    <span className="font-bold text-emerald-900 block">Kertas &amp; Cetak:</span>
                    <p className="text-slate-600 leading-snug">
                      HVS 70 gsm Folio Rp 15.700/kg +5% → Rp 40.936/rim (500 lbr 21,5×33), insheet 30 lbr, Q=rim×500+30, harga kertas Q×81,87, desain Rp 10.000, plate 10k×1, cetak min 15k×plat + drek Rp 30×over(P-500).
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-blue-100 space-y-1">
                    <span className="font-bold text-blue-900 block">Finishing &amp; Packing:</span>
                    <p className="text-slate-600 leading-snug">
                      Sisir/Rajang (Q/500)×10.000 (10600@530 lbr, 20600@1030 lbr), tanpa laminasi/pound tambahan, packing rajang + packing standar. Margin 30% nego 4% rounding ratusan.
                    </p>
                  </div>
                </div>
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
