'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { saveCalculationToDb } from \'@/lib/pricelist-db-sync\';
import {
  Calculator,
  Save,
  RotateCcw,
  Copy,
  Settings2,
  BookOpen,
  Info,
  Check,
  CheckCircle2,
  HelpCircle,
  X,
  Printer,
  Layers,
  Sparkles,
  Scissors,
  Tag,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import {
  StikerMasterParams,
  StikerSimulatorInput,
  StikerSimulatorResult,
  StikerUkuran,
  StikerFinishingOption,
  STIKER_UKURAN_OPTIONS,
  STIKER_TIERS,
  calculateStikerSimulator,
} from '@/lib/stiker-calculator';

export type SavedStikerSimulationItem = {
  id: string;
  savedAt: string;
  title: string;
  oplah: number;
  data: StikerSimulatorResult;
  paramsSnapshot?: any;
};

const FINISHING_OPTIONS: StikerFinishingOption[] = [
  'Non Cutting (Rajang Potong)',
  'Kiss Cutting (Setengah Putus)',
  'Die Cut (Potong Putus)',
];

interface Props {
  customParams: StikerMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<StikerMasterParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

export default function StikerSimulator({
  customParams,
  onOpenMasterParam,
  activeSimulationId,
  setActiveSimulationId,
  activeSimulationTitle,
  setActiveSimulationTitle,
}: Props) {
  const [ukuran, setUkuran] = useState<StikerUkuran>('8 x 5 cm');
  const [oplah, setOplah] = useState<number>(100);
  const [finishing, setFinishing] = useState<StikerFinishingOption>('Non Cutting (Rajang Potong)');
  const [marginPct, setMarginPct] = useState<number>(customParams.marginDefaultPct ?? 30);
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(customParams.negoDefaultPct ?? 4);

  const [copiedQuote, setCopiedQuote] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    if (!activeSimulationId) {
      setMarginPct(customParams.marginDefaultPct ?? 30);
      setNegoDiskonPct(customParams.negoDefaultPct ?? 4);
    }
  }, [customParams.marginDefaultPct, customParams.negoDefaultPct, activeSimulationId]);

  const result = useMemo<StikerSimulatorResult>(() => {
    return calculateStikerSimulator(
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
            setMarginPct(found.data.input.marginPct);
            setNegoDiskonPct(found.data.input.negoDiskonPct);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [activeSimulationId]);

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
    saveCalculationToDb({ ...newItem, category: 'Stiker' });
        toast.success('Simulasi berhasil diperbarui!');
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

  const handleExitSimulation = () => {
    if (setActiveSimulationId) setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
    setUkuran('8 x 5 cm');
    setOplah(100);
    setFinishing('Non Cutting (Rajang Potong)');
    setMarginPct(customParams.marginDefaultPct ?? 30);
    setNegoDiskonPct(customParams.negoDefaultPct ?? 4);
    toast.info('Keluar dari mode riwayat. Parameter di-reset ke nilai default.');
  };

  const handleCopyWhatsApp = () => {
    const text = `*PENAWARAN CETAK STIKER*
*PT Buya Barokah*
━━━━━━━━━━━━━━━━━━━━
• *Produk*: Stiker ${ukuran}
• *Bahan*: Sticker Vinyl Glossy 200 gsm Full Colour
• *Kuantitas*: ${oplah.toLocaleString('id-ID')} pcs
• *Finishing*: ${finishing} + Packing Rapi
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

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Header Info Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100/80 rounded-xl border border-emerald-200 text-emerald-800 shrink-0">
            <Tag size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-800 text-sm sm:text-base">
                Simulator &amp; Kalkulator Stiker
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Katalog 23
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kalkulasi instan HPP, harga jual, dan batas nego untuk 5 ukuran Stiker Vinyl Glossy.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyWhatsApp}
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

      {activeSimulationId && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold">Mode Edit Riwayat:</span>
            <span>{activeSimulationTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveSimulation}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
            >
              Simpan Perubahan
            </button>
            <button
              type="button"
              onClick={handleExitSimulation}
              className="px-3 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold rounded-lg text-xs transition-all cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>
      )}

      {/* Grid Simulator: Kiri Form, Kanan Hasil Finansial & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Parameter Pesanan
              </h4>
            </div>

            {/* Ukuran Stiker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ukuran Stiker
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STIKER_UKURAN_OPTIONS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUkuran(u)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                      ukuran === u
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs ring-2 ring-emerald-500/30'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Oplah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jumlah Pesanan / Oplah (pcs)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={STIKER_TIERS.includes(oplah) ? oplah : 'custom'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== 'custom') setOplah(Number(val));
                  }}
                  className="w-full text-xs font-bold py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  {STIKER_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t.toLocaleString('id-ID')} pcs
                    </option>
                  ))}
                  {!STIKER_TIERS.includes(oplah) && (
                    <option value="custom">Custom: {oplah.toLocaleString('id-ID')} pcs</option>
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

            {/* Finishing Cutting */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Finishing Cutting
              </label>
              <div className="grid grid-cols-1 gap-2">
                {FINISHING_OPTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFinishing(f)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all text-left cursor-pointer flex items-center justify-between ${
                      finishing === f
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs ring-2 ring-emerald-500/30'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{f}</span>
                    {finishing === f && <Check size={14} className="text-emerald-200" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Margin & Nego */}
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
                    className="w-full text-right text-xs font-bold py-2 pr-7 pl-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
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
                    className="w-full text-right text-xs font-bold py-2 pr-7 pl-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    %
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSimulation}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save size={15} />
              <span>{activeSimulationId ? 'Perbarui Simulasi Ini' : 'Simpan Kalkulasi ke Riwayat'}</span>
            </button>
          </div>
        </div>

        {/* Kolom Kanan: 4 Kartu Finansial + Breakdown */}
        <div className="lg:col-span-7 space-y-5">
          {/* 4 Kartu Finansial */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">HPP / pcs</span>
                <Calculator size={13} className="text-slate-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-800">
                  Rp {Math.round(result.hppPerPcs).toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  Total: Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="bg-emerald-50/80 rounded-xl border border-emerald-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[11px] font-bold">Harga Jual / pcs</span>
                <Sparkles size={13} className="text-emerald-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-900">
                  Rp {result.hargaJualPerPcs.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-emerald-700 mt-0.5">
                  Margin: {marginPct}%
                </span>
              </div>
            </div>

            <div className="bg-blue-50/80 rounded-xl border border-blue-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-800 mb-1">
                <span className="text-[11px] font-bold">Harga Nego / pcs</span>
                <Info size={13} className="text-blue-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-blue-900">
                  Rp {result.negoPerPcs.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-blue-700 mt-0.5">
                  Diskon: {negoDiskonPct}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">Total Omset</span>
                <Layers size={13} className="text-slate-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-800">
                  Rp {result.totalHargaJual.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  {oplah.toLocaleString('id-ID')} pcs
                </span>
              </div>
            </div>
          </div>

          {/* Banner Spesifikasi */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Tag size={15} className="text-emerald-700" />
              <span className="font-semibold">Spesifikasi:</span>
              <span className="font-black text-emerald-900 px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-200">
                Stiker {ukuran} • Sticker Vinyl Glossy 200 gsm
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Finishing: {finishing}
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
                  <tr className="bg-slate-50 font-black border-t-2 border-slate-300 text-slate-900">
                    <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
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
                  <h3 className="font-bold text-base">Panduan Simulator Stiker</h3>
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
                <h5 className="font-bold text-slate-800">1. Pilihan Ukuran &amp; Oplah</h5>
                <p>
                  Tersedia 5 pilihan ukuran stiker: 8×5 cm, 7,5×6 cm, 9,5×6,5 cm, 10×12 cm, dan 21×29,7 cm (A4).
                  Pilih oplah dari dropdown tier atau ketik angka custom langsung.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h5 className="font-bold text-slate-800">2. Pilihan Finishing Cutting</h5>
                <p>
                  Pilih <strong>Non Cutting (Rajang)</strong> untuk potong lurus standar,
                  <strong>Kiss Cutting</strong> untuk setengah putus pada lembar A3+, atau <strong>Die Cut</strong> untuk potong putus pola khusus.
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
