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
  Sparkles,
  Scissors,
  Newspaper,
  Sliders,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import ThousandInput from '@/components/ThousandInput';

const DRAFT_KEY = 'sintak_majalah_draft';
const draftVal = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const v = parsed[key];
    return v === undefined || v === null ? fallback : (v as T);
  } catch {
    return fallback;
  }
};

import {
  MajalahMasterParams,
  MajalahSimulatorResult,
  MajalahFinishingOption,
  MajalahJilidOption,
  MajalahMesinCoverOption,
  MajalahMesinIsiOption,
  MAJALAH_TIERS,
  calculateMajalahSimulator,
} from '@/lib/majalah-calculator';

export interface SavedMajalahSimulationItem {
  id: string;
  savedAt: string;
  title: string;
  oplah: number;
  data: MajalahSimulatorResult;
  paramsSnapshot?: Partial<MajalahMasterParams>;
}

const FINISHING_OPTIONS: MajalahFinishingOption[] = [
  'Tanpa Laminasi',
  'Laminasi Glossy',
  'Laminasi Doff',
  'UV Varnish',
];

const JILID_OPTIONS: MajalahJilidOption[] = [
  'Staples Tengah',
  'Lem Bending',
];

const MESIN_OPTIONS = ['Otomatis', 'Print Inter', 'Oliver'] as const;

interface MajalahSimulatorProps {
  customParams: MajalahMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<MajalahMasterParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

export default function MajalahSimulator({
  customParams,
  onOpenMasterParam,
  activeSimulationId,
  setActiveSimulationId,
  activeSimulationTitle,
  setActiveSimulationTitle,
}: MajalahSimulatorProps) {
  const [oplah, setOplah] = useState<number>(() => draftVal<number>('oplah', 500));
  const [mesinCover, setMesinCover] = useState<MajalahMesinCoverOption>(() => draftVal<MajalahMesinCoverOption>('mesinCover', 'Otomatis'));
  const [mesinIsi, setMesinIsi] = useState<MajalahMesinIsiOption>(() => draftVal<MajalahMesinIsiOption>('mesinIsi', 'Otomatis'));
  const [finishing, setFinishing] = useState<MajalahFinishingOption>(() => draftVal<MajalahFinishingOption>('finishing', 'Tanpa Laminasi'));
  const [jilid, setJilid] = useState<MajalahJilidOption>(() => draftVal<MajalahJilidOption>('jilid', 'Staples Tengah'));
  const [marginPct, setMarginPct] = useState<number>(() => draftVal<number>('marginPct', customParams.marginDefaultPct ?? 30));
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(() => draftVal<number>('negoDiskonPct', customParams.negoDefaultPct ?? 5));

  const [copiedQuote, setCopiedQuote] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Sync state when loading from saved calculations
  useEffect(() => {
    if (activeSimulationId) {
      try {
        const raw = localStorage.getItem('sintak_saved_majalah_simulations');
        if (raw) {
          const list: SavedMajalahSimulationItem[] = JSON.parse(raw);
          const found = list.find((item) => item.id === activeSimulationId);
          if (found && found.data && found.data.input) {
            const inp = found.data.input;
            setOplah(inp.oplah || 500);
            if (inp.mesinCover) setMesinCover(inp.mesinCover);
            if (inp.mesinIsi) setMesinIsi(inp.mesinIsi);
            setFinishing(inp.finishing || 'Tanpa Laminasi');
            setJilid(inp.jilid || 'Staples Tengah');
            setMarginPct(inp.marginPct ?? 30);
            setNegoDiskonPct(inp.negoDiskonPct ?? 5);
          }
        }
      } catch (e) {
        console.error('Gagal memuat riwayat simulasi majalah:', e);
      }
    }
  }, [activeSimulationId]);

  // Persist draft to localStorage when not editing a saved simulation
  useEffect(() => {
    if (!activeSimulationId && typeof window !== 'undefined') {
      const draft = {
        oplah,
        mesinCover,
        mesinIsi,
        finishing,
        jilid,
        marginPct,
        negoDiskonPct,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [activeSimulationId, oplah, mesinCover, mesinIsi, finishing, jilid, marginPct, negoDiskonPct]);

  const result: MajalahSimulatorResult = useMemo(() => {
    return calculateMajalahSimulator(
      {
        oplah,
        mesinCover,
        mesinIsi,
        finishing,
        jilid,
        marginPct,
        negoDiskonPct,
      },
      customParams
    );
  }, [oplah, mesinCover, mesinIsi, finishing, jilid, marginPct, negoDiskonPct, customParams]);

  const handleSaveCalculation = (asNew = false) => {
    const isEdit = Boolean(activeSimulationId) && !asNew;
    const title = `Majalah 14,5×20,25 • ${oplah.toLocaleString('id-ID')} pcs • ${result.prosesCetak} • ${finishing} • ${jilid}`;

    try {
      const existingRaw = localStorage.getItem('sintak_saved_majalah_simulations');
      const list: SavedMajalahSimulationItem[] = existingRaw ? JSON.parse(existingRaw) : [];

      if (isEdit && activeSimulationId) {
        const updated = list.map((item) =>
          item.id === activeSimulationId
            ? {
                ...item,
                title,
                oplah,
                data: result,
                paramsSnapshot: { ...customParams },
              }
            : item
        );
        localStorage.setItem('sintak_saved_majalah_simulations', JSON.stringify(updated));
        const targetItem = updated.find((item) => item.id === activeSimulationId);
        if (targetItem) saveCalculationToDb({ ...targetItem, category: 'Majalah 14,5×20,25' });
        toast.success('Simulasi majalah berhasil diperbarui!');
        if (setActiveSimulationTitle) setActiveSimulationTitle(title);
      } else {
        const newItem: SavedMajalahSimulationItem = {
          id: `majalah_${Date.now()}`,
          savedAt: new Date().toISOString(),
          title,
          oplah,
          data: result,
          paramsSnapshot: { ...customParams },
        };
        list.unshift(newItem);
        localStorage.setItem('sintak_saved_majalah_simulations', JSON.stringify(list));
        saveCalculationToDb({ ...newItem, category: 'Majalah 14,5×20,25' });
        toast.success(asNew ? 'Disimpan sebagai kalkulasi baru!' : 'Kalkulasi berhasil disimpan ke riwayat!');
        if (setActiveSimulationId) setActiveSimulationId(newItem.id);
        if (setActiveSimulationTitle) setActiveSimulationTitle(newItem.title);
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal menyimpan kalkulasi ke penyimpanan lokal.');
    }
  };

  const handleExitEdit = () => {
    if (setActiveSimulationId) setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
    toast.info('Keluar dari mode edit riwayat kalkulasi.');
  };

  const handleCopyWhatsApp = () => {
    const lines = [
      `*PENAWARAN MAJALAH 14,5 × 20,25 CM*`,
      `*PT Buya Barokah Percetakan*`,
      `----------------------------------------`,
      `• *Ukuran*: 14,5 × 20,25 cm (32 Halaman)`,
      `• *Kuantitas*: ${oplah.toLocaleString('id-ID')} pcs`,
      `• *Cover*: Art Carton 230 gsm 1 Muka Full Colour`,
      `• *Isi*: Art Paper 120 gsm 32 Hal Full Colour`,
      `• *Mesin*: ${result.prosesCetak}`,
      `• *Finishing Cover*: ${finishing}`,
      `• *Tipe Jilid*: ${jilid}`,
      `----------------------------------------`,
      `• *Harga Jual Satuan*: *Rp ${result.hargaJualPerPcs.toLocaleString('id-ID')}* / pcs`,
      `• *Total Penawaran*: *Rp ${result.totalHargaJual.toLocaleString('id-ID')}*`,
      `• *Batas Nego*: Rp ${result.negoPerPcs.toLocaleString('id-ID')} / pcs`,
      `----------------------------------------`,
      `_Harga sudah termasuk kardus packing & lakban standar pabrik._`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
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

  const stepChip = (n: number) => (
    <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-emerald-700 text-white text-[10px] font-black shrink-0">
      {n}
    </span>
  );

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-140px)] min-h-0 space-y-3 pb-2">
      {/* Banner Riwayat Aktif */}
      {activeSimulationId && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 animate-in fade-in duration-200">
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
              onClick={() => handleSaveCalculation(false)}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <BookmarkCheck size={14} />
              <span>Update Perubahan</span>
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
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Spesifikasi Majalah 14,5×20,25 cm
              </h3>
            </div>

            {/* 1. Ukuran & Oplah */}
            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  {stepChip(1)} Ukuran Majalah
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="py-2 px-3 rounded-lg border border-slate-300 bg-slate-100/70 text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>14,5 × 20,25 cm (Katalog 20)</span>
                    <span className="text-[10px] text-slate-500 font-medium">Tertutup 14,5 · Terbuka 29 cm</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    {stepChip(2)} Jumlah Pesanan / Oplah (pcs)
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">32 Halaman (8 Lembar)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={MAJALAH_TIERS.includes(oplah) ? oplah : 'custom'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== 'custom') setOplah(Number(val));
                    }}
                    className="w-full text-xs font-bold py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                  >
                    {MAJALAH_TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t.toLocaleString('id-ID')} pcs
                      </option>
                    ))}
                    {!MAJALAH_TIERS.includes(oplah) && (
                      <option value="custom">Custom: {oplah.toLocaleString('id-ID')} pcs</option>
                    )}
                  </select>

                  <ThousandInput
                    value={oplah}
                    onValueChange={(val) => setOplah(Math.max(1, val || 1))}
                    className="w-full text-right text-xs font-bold py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    suffix="pcs"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {MAJALAH_TIERS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setOplah(t)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        oplah === t
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {t.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Cetak Cover */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  {stepChip(3)} Cetak Cover (AC 230 4W Fullcolor)
                </label>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                  Aktif: {result.mesinCoverTerpilih}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MESIN_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMesinCover(m)}
                    className={optBtn(mesinCover === m)}
                  >
                    {m === 'Otomatis' ? 'Otomatis (Rekomendasi)' : m}
                  </button>
                ))}
              </div>
              <p className="text-[10.5px] text-slate-500">
                {mesinCover === 'Otomatis'
                  ? oplah <= 500
                    ? 'Oplah ≤500 pcs otomatis menggunakan Print Inter A3+'
                    : 'Oplah ≥600 pcs otomatis menggunakan Offset Oliver 4 Plat'
                  : `Mode manual: ${mesinCover}`}
              </p>
            </div>

            {/* 3. Cetak Isi */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  {stepChip(4)} Cetak Isi (AP 120 4W Fullcolor 32 Hal)
                </label>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                  Aktif: {result.mesinIsiTerpilih}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MESIN_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMesinIsi(m)}
                    className={optBtn(mesinIsi === m)}
                  >
                    {m === 'Otomatis' ? 'Otomatis (Rekomendasi)' : m}
                  </button>
                ))}
              </div>
              <p className="text-[10.5px] text-slate-500">
                {mesinIsi === 'Otomatis'
                  ? oplah <= 200
                    ? 'Oplah ≤200 pcs otomatis menggunakan Print Inter A3+ FC 2 Muka'
                    : 'Oplah ≥250 pcs otomatis menggunakan Offset Oliver 16 Plat'
                  : `Mode manual: ${mesinIsi}`}
              </p>
            </div>

            {/* 4. Finishing Tambahan & Jilid */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  {stepChip(5)} Finishing Cover (Laminasi)
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

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  {stepChip(6)} Tipe Jilid Buku
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {JILID_OPTIONS.map((j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setJilid(j)}
                      className={optBtn(jilid === j)}
                    >
                      {j}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Margin & Batas Nego */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                {stepChip(7)} Target Margin &amp; Batas Nego
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Margin Target (%)
                  </span>
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
                  <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Batas Nego (%)
                  </span>
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
            </div>
            {/* Laba Master info */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <span>Laba Master Majalah: <strong>{marginPct}%</strong></span>
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

        {/* Kolom Kanan: 3 Kartu Finansial Baku + Breakdown + Tombol Simpan Full-Width */}
        <div className="lg:col-span-7 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          <div className="sticky top-0 z-10 space-y-2 bg-slate-50/95 backdrop-blur-xs py-1 -my-1">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-900">
              {stepChip(8)} Kalkulasi Total
            </p>
            {/* 3 Kartu Finansial Baku */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  <span className="block text-[10px] text-emerald-700/80 mt-0.5">Laba {marginPct}%</span>
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

            {/* Banner Alur Mesin Cetak */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Printer size={15} className="text-emerald-700" />
                <span className="font-semibold">Alur Mesin / Proses:</span>
                <span className="font-black text-emerald-900 px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-200">
                  {result.prosesCetak}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Cover AC 230 • Isi AP 120 FC (32 Hal)
              </span>
            </div>
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
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {result.breakdown.map((row) => (
                    <tr key={row.no} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-slate-400 text-center font-semibold text-[10px]">
                        {row.no}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-800 font-sans">{row.komponen}</td>
                      <td className="py-2 px-3 text-slate-500 text-[10.5px] font-sans">{row.keterangan}</td>
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
          </div>

          {/* Tombol Simpan Standar Full-Width di Bawah Tabel Breakdown */}
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

      {/* Guide Modal */}
      {showGuideModal && (
        <div
          onClick={() => setShowGuideModal(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900">
                <BookOpen size={18} className="text-emerald-700" />
                <h4 className="font-bold text-sm">Panduan Kalkulasi Majalah 14,5×20,25 cm</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg hover:bg-emerald-100 text-slate-500 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <p>
                Simulator ini menghitung otomatis biaya produksi (HPP), harga jual standar laba 30%, dan batas diskon nego untuk produk <strong>Majalah Ukuran 14,5 × 20,25 cm</strong> dengan spesifikasi baku:
              </p>
              <ul className="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium text-slate-700">
                <li>Cover Art Carton 230 gsm (1 Muka Full Colour)</li>
                <li>Isi Art Paper 120 gsm (32 Halaman Full Colour bolak-balik)</li>
                <li>Jilid Kawat Stiching / Staples Tengah + Sisir 3 Sisi</li>
                <li>Packing Kardus Box &amp; Lakban Standar Pabrik</li>
              </ul>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <span className="font-bold block">Pilihan Mesin Cetak</span>
                <p className="text-[11px]">
                  Mode <strong>Otomatis</strong> akan memilih kombinasi mesin paling efisien secara ekonomis (Print Inter untuk oplah kecil, Offset Oliver untuk oplah menengah &amp; besar). Anda dapat mengganti ke mode manual kapan saja.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition cursor-pointer"
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
