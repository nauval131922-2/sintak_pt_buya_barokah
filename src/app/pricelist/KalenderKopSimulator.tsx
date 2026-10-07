'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { saveCalculationToDb } from '@/lib/pricelist-db-sync';
import {
  Calculator,
  Save, BookmarkCheck, Bookmark,
  RotateCcw,
  Copy,
  Settings2,
  BookOpen,
  Info,
  Check,
  Share2,
  CheckCircle2,
  HelpCircle,
  X,
  Printer,
  Layers,
  Sparkles,
  Scissors,
  Calendar,
  Sliders,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { toast } from '@/lib/toast';

const DRAFT_KEY = 'sintak_kalender_kop_draft';

const draftVal = (key: string, fallback: any) => {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return fallback;
    const v = JSON.parse(raw)[key];
    return v === undefined || v === null ? fallback : v;
  } catch { return fallback; }
};
import {
  KalenderKopMasterParams,
  KalenderKopSimulatorInput,
  KalenderKopSimulatorResult,
  KalenderKopVarian,
  KALENDER_KOP_VARIAN_OPTIONS,
  KALENDER_KOP_TIERS,
  calculateKalenderKopSimulator,
} from '@/lib/kalender-kop-calculator';

export type SavedKalenderKopSimulationItem = {
  id: string;
  savedAt: string;
  title: string;
  oplah: number;
  data: KalenderKopSimulatorResult;
  paramsSnapshot?: any;
};

interface Props {
  customParams: KalenderKopMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<KalenderKopMasterParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

export default function KalenderKopSimulator({
  customParams,
  onOpenMasterParam,
  activeSimulationId,
  setActiveSimulationId,
  activeSimulationTitle,
  setActiveSimulationTitle,
}: Props) {
  const [varian, setVarian] = useState<KalenderKopVarian>(() => draftVal('varian', '1 Warna'));
  const [oplah, setOplah] = useState<number>(() => draftVal('oplah', 100));
  const [marginPct, setMarginPct] = useState<number>(() => draftVal('marginPct', customParams.marginDefaultPct ?? 0));
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(() => draftVal('negoDiskonPct', customParams.negoDefaultPct ?? 4));

  const [copiedQuote, setCopiedQuote] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    if (!activeSimulationId) {
      setMarginPct(customParams.marginDefaultPct ?? 0);
      setNegoDiskonPct(customParams.negoDefaultPct ?? 4);
    }
  }, [customParams.marginDefaultPct, customParams.negoDefaultPct, activeSimulationId]);

  const result = useMemo<KalenderKopSimulatorResult>(() => {
    return calculateKalenderKopSimulator(
      {
        varian,
        oplah,
        marginPct,
        negoDiskonPct,
      },
      customParams
    );
  }, [varian, oplah, marginPct, negoDiskonPct, customParams]);

  useEffect(() => {
    if (activeSimulationId) {
      try {
        const raw = localStorage.getItem('sintak_saved_kalender_kop_simulations');
        if (raw) {
          const list: SavedKalenderKopSimulationItem[] = JSON.parse(raw);
          const found = list.find((item) => item.id === activeSimulationId);
          if (found) {
            setVarian(found.data.input.varian);
            setOplah(found.data.input.oplah);
            setMarginPct(found.data.input.marginPct ?? 0);
            setNegoDiskonPct(found.data.input.negoDiskonPct ?? 4);
          }
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      // Restore draft settingan (persist saat pindah tab)
      try {
        const rawDraft = localStorage.getItem(DRAFT_KEY);
        if (rawDraft) {
          const d = JSON.parse(rawDraft);
          if (d.varian) setVarian(d.varian);
          if (d.oplah) setOplah(Number(d.oplah));
          if (d.marginPct !== undefined) setMarginPct(Number(d.marginPct));
          if (d.negoDiskonPct !== undefined) setNegoDiskonPct(Number(d.negoDiskonPct));
        }
      } catch { /* abaikan draft rusak */ }
    }
  }, [activeSimulationId]);

  // Auto-persist draft settingan simulator (tidak reset saat pindah tab)
  useEffect(() => {
    if (activeSimulationId) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ varian, oplah, marginPct, negoDiskonPct }));
    } catch { /* abaikan */ }
  }, [varian, oplah, marginPct, negoDiskonPct, activeSimulationId]);

  const handleSaveSimulation = () => {
    try {
      const existingRaw = localStorage.getItem('sintak_saved_kalender_kop_simulations');
      const list: SavedKalenderKopSimulationItem[] = existingRaw ? JSON.parse(existingRaw) : [];

      const title =
        activeSimulationTitle ||
        `Kalender Kop ${varian} • ${oplah.toLocaleString('id-ID')} eks`;

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
        localStorage.setItem('sintak_saved_kalender_kop_simulations', JSON.stringify(updated));
        const targetItem = updated.find((item) => item.id === activeSimulationId);
        if (targetItem) saveCalculationToDb({ ...targetItem, category: 'Kalender Kop' });
        toast.success('Simulasi berhasil diperbarui!');
        if (setActiveSimulationId) setActiveSimulationId(null);
        if (setActiveSimulationTitle) setActiveSimulationTitle(null);
      
      } else {
        const newItem: SavedKalenderKopSimulationItem = {
          id: `kalender_kop_${Date.now()}`,
          savedAt: new Date().toISOString(),
          title,
          oplah,
          data: result,
        };
        list.unshift(newItem);
        localStorage.setItem('sintak_saved_kalender_kop_simulations', JSON.stringify(list));
    saveCalculationToDb({ ...newItem, category: 'Kalender Kop' });
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
      const existingRaw = localStorage.getItem('sintak_saved_kalender_kop_simulations');
      const list: SavedKalenderKopSimulationItem[] = existingRaw ? JSON.parse(existingRaw) : [];
      const title = `Kalender Kop • ${varian} • ${oplah.toLocaleString("id-ID")} pcs`;
      const newItem: SavedKalenderKopSimulationItem = {
        id: `kalender_kop_${Date.now()}`,
        savedAt: new Date().toISOString(),
        title,
        oplah,
        data: result,
      };
      list.unshift(newItem);
      localStorage.setItem('sintak_saved_kalender_kop_simulations', JSON.stringify(list));
      saveCalculationToDb({ ...newItem, category: 'Kalender Kop' });
      if (setActiveSimulationId) setActiveSimulationId(null);
      if (setActiveSimulationTitle) setActiveSimulationTitle(null);
      toast.success('Simulasi berhasil disimpan sebagai kalkulasi baru & keluar dari mode edit!');
    } catch (e) {
      console.error(e);
      toast.error('Gagal menyimpan kalkulasi baru.');
    }
  };

  const handleExitSimulation = () => {
    if (setActiveSimulationId) setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
    setVarian('1 Warna');
    setOplah(100);
    setMarginPct(customParams.marginDefaultPct ?? 0);
    setNegoDiskonPct(customParams.negoDefaultPct ?? 4);
    toast.info('Keluar dari mode riwayat. Parameter di-reset ke nilai default.');
  };

  const handleCopyWhatsApp = () => {
    const text = `*PENAWARAN KALENDER KOP (BLANKO DWI WULAN)*
*PT Buya Barokah*
━━━━━━━━━━━━━━━━━━━━
• *Produk*: Kalender Dinding Kop 32 × 48 cm
• *Spesifikasi*: Blanko Dwi Wulan 6 Lembar (Art Paper 120 gsm)
• *Cetak Kop*: Sablon / Offset ${varian}
• *Kuantitas*: ${oplah.toLocaleString('id-ID')} eks
• *Finishing*: Jilid Klem Seng Kaleng + Packing Kardus
━━━━━━━━━━━━━━━━━━━━
• *Harga / Eks*: *Rp ${result.hargaJualPerPcs.toLocaleString('id-ID')}*
• *Harga Nego / Eks*: *Rp ${result.negoPerPcs.toLocaleString('id-ID')}*
• *Total Penawaran*: *Rp ${result.totalHargaJual.toLocaleString('id-ID')}*
━━━━━━━━━━━━━━━━━━━━
_Harga belum termasuk PPN. Hasil cetak kop tajam & jepit kaleng rapi._`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success('Format penawaran WhatsApp berhasil disalin!');
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
      {/* Header Info Banner */}

      

      {/* Grid Simulator: Kiri Form, Kanan Hasil Finansial & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-5 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Spesifikasi Kalender Kop</h3>
            </div>

            {/* Varian Warna Kop */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                {stepChip(1)} Varian Warna Kop
              </label>
              <div className="grid grid-cols-2 gap-2">
                {KALENDER_KOP_VARIAN_OPTIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVarian(v)}
                    className={optBtn(varian === v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Oplah */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                {stepChip(2)} Jumlah Pesanan / Oplah (eks)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={KALENDER_KOP_TIERS.includes(oplah) ? oplah : 'custom'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== 'custom') setOplah(Number(val));
                  }}
                  className="w-full text-xs font-bold py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  {KALENDER_KOP_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t.toLocaleString('id-ID')} eks
                    </option>
                  ))}
                  {!KALENDER_KOP_TIERS.includes(oplah) && (
                    <option value="custom">Custom: {oplah.toLocaleString('id-ID')} eks</option>
                  )}
                </select>

                <input
                  type="number"
                  min={1}
                  max={50000}
                  value={oplah === 0 ? '' : oplah}
                  onChange={(e) => setOplah(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  placeholder="Ketik oplah..."
                  className="w-full text-right text-xs font-bold py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            {/* Margin & Nego */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  {stepChip(3)} Margin Tambahan (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={marginPct === 0 ? '' : marginPct}
                    onChange={(e) => setMarginPct(parseFloat(e.target.value) || 0)}
                    className="w-full text-right text-xs font-bold py-2 pr-7 pl-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  {stepChip(3)} Batas Nego (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={negoDiskonPct === 0 ? '' : negoDiskonPct}
                    onChange={(e) => setNegoDiskonPct(parseFloat(e.target.value) || 0)}
                    className="w-full text-right text-xs font-bold py-2 pr-7 pl-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    %
                  </span>
                </div>
              </div>
            </div>
            {/* Laba Master info */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <span>Laba Master Kalender Kop: <strong>{marginPct}%</strong></span>
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

        {/* Kolom Kanan: 4 Kartu Finansial + Breakdown */}
        <div className="lg:col-span-7 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          {/* Sticky 3-Kartu Metrik Ringkasan Finansial Baku */}
          <div className="sticky top-0 z-10 space-y-2 bg-slate-50/95 backdrop-blur-xs py-1 -my-1">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-900">
              {stepChip(4)} Kalkulasi Total
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Card 1: HPP Per Eks */}
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold">HPP Per Eks</span>
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

              {/* Card 2: Harga Per Eks */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200 p-3.5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-800 mb-1">
                  <span className="text-[11px] font-bold">Harga Per Eks (+{marginPct}%)</span>
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

          {/* Banner Spesifikasi */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-emerald-700" />
              <span className="font-semibold">Spesifikasi:</span>
              <span className="font-black text-emerald-900 px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-200">
                Kalender Kop {varian} • Dwi Wulan (6 Lembar) Art Paper 120 gsm
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Finishing: Jilid Klem Seng Kaleng
            </span>
          </div>

          {/* Tabel Rincian Breakdown Biaya HPP */}
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
                <tbody className="divide-y divide-slate-100">
                  {result.breakdown.map((row) => (
                    <tr key={row.no} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-slate-400 text-center font-semibold text-[10px]">
                        {row.no}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-800">{row.komponen}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">{row.keterangan}</td>
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
                  <tr className="bg-slate-50/90 font-bold border-t border-slate-200 text-xs">
                    <td colSpan={3} className="py-2.5 px-3 text-slate-800 font-sans">
                      Total HPP Biaya Produksi ({oplah.toLocaleString('id-ID')} eks)
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
                className="w-full mt-2 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={15} />
                <span>Simpan Kalkulasi ke Riwayat</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Guide Modal */}
      {showGuideModal && (
        <div
          onClick={() => setShowGuideModal(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700">
                  <BookOpen size={18} className="text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Panduan Simulator Kalender Kop</h3>
                  <p className="text-xs text-emerald-200">Cara Penggunaan &amp; Ketentuan Penawaran</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/60 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h5 className="font-bold text-slate-800">1. Varian Warna &amp; Oplah</h5>
                <p>
                  Pilih varian warna kop (1 s/d 4 Warna). Tentukan oplah dari dropdown tier (50 s/d 1.000 eks) atau custom.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h5 className="font-bold text-slate-800">2. Spesifikasi Kalender</h5>
                <p>
                  Ukuran 32 × 48 cm Dwi Wulan (6 Lembar) Art Paper 120 gsm. Finishing sudah termasuk Jilid Klem Seng atas dan packing rapi.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h5 className="font-bold text-slate-800">3. Penawaran WhatsApp &amp; Riwayat</h5>
                <p>
                  Klik <strong>Salin Penawaran</strong> untuk teks WhatsApp instan atau <strong>Simpan Kalkulasi</strong> agar tercatat di tab Daftar Riwayat SINTAK.
                </p>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
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
