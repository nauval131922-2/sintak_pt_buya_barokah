'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { saveCalculationToDb } from '@/lib/pricelist-db-sync';
import {
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  Percent,
  FileText,
  Check,
  Share2,
  Sliders,
  Bookmark,
  BookmarkCheck,
  X,
  Settings2,
  Info,
  Award,
  Printer,
  Sparkles,
  PackageCheck,
  Stamp,
  HelpCircle,
} from 'lucide-react';
import {
  calculateSyahadahHpp,
  DEFAULT_SYAHADAH_PARAMS,
  SyahadahMasterParams,
  SyahadahVarianType,
  SyahadahMesinType,
  SyahadahLaminasiType,
  SyahadahUkuranType,
  SYAHADAH_TIERS,
  SYAHADAH_VARIANTS,
  SavedSyahadahSimulationItem,
  SYAHADAH_CONFIG,
} from '@/lib/syahadah-calculator';
import { toast } from '@/lib/toast';

export type { SavedSyahadahSimulationItem };

const UKURAN_OPTIONS: SyahadahUkuranType[] = ['21,5 x 33 cm', '21 x 29,7 cm'];

const LAMINASI_OPTIONS: { id: SyahadahLaminasiType; label: string }[] = [
  { id: 'Tanpa Laminasi', label: 'Tanpa Laminasi' },
  { id: 'Glossy', label: 'Laminasi Glossy' },
  { id: 'Doff', label: 'Laminasi Doff' },
  { id: 'UV Varnish', label: 'UV Varnish' },
];

interface SyahadahSimulatorProps {
  customParams?: SyahadahMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<SyahadahMasterParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

export default function SyahadahSimulator({
  customParams = DEFAULT_SYAHADAH_PARAMS,
  setCustomParams,
  onOpenMasterParam,
  activeSimulationId: propActiveSimId,
  setActiveSimulationId: propSetActiveSimId,
  activeSimulationTitle: propActiveSimTitle,
  setActiveSimulationTitle: propSetActiveSimTitle,
}: SyahadahSimulatorProps) {
  const [oplah, setOplah] = useState<number>(100);
  const [varian, setVarian] = useState<SyahadahVarianType>('1 Muka FC');
  const [ukuran, setUkuran] = useState<SyahadahUkuranType>('21,5 x 33 cm');
  const [mesin, setMesin] = useState<SyahadahMesinType>('Auto');
  const [laminasi, setLaminasi] = useState<SyahadahLaminasiType>('Tanpa Laminasi');
  const [opsiFoil, setOpsiFoil] = useState<boolean>(false);
  const [opsiKardusLakban, setOpsiKardusLakban] = useState<boolean>(false);
  const [marginPct, setMarginPct] = useState<number>(30);
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(5);
  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);

  const [savedSimulations, setSavedSimulations] = useState<SavedSyahadahSimulationItem[]>([]);
  const [simulationTitle, setSimulationTitle] = useState('');
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const [internalActiveTitle, setInternalActiveTitle] = useState<string | null>(null);
  const [showSimulatorManual, setShowSimulatorManual] = useState<boolean>(false);

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

  // 1. Auto-restore draft from localStorage
  const isHydratedRef = useRef(false);
  useEffect(() => {
    try {
      const rawDraft = localStorage.getItem('sintak_syahadah_simulator_draft');
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        if (draft.oplah) setOplah(Number(draft.oplah));
        if (draft.varian) setVarian(draft.varian);
        if (draft.ukuran) setUkuran(draft.ukuran);
        if (draft.mesin) setMesin(draft.mesin);
        if (draft.laminasi) setLaminasi(draft.laminasi);
        if (draft.opsiFoil !== undefined) setOpsiFoil(Boolean(draft.opsiFoil));
        if (draft.opsiKardusLakban !== undefined) setOpsiKardusLakban(Boolean(draft.opsiKardusLakban));
        if (draft.marginPct !== undefined) setMarginPct(Number(draft.marginPct));
        if (draft.negoDiskonPct !== undefined) setNegoDiskonPct(Number(draft.negoDiskonPct));
      }
    } catch (e) {
      console.error('Gagal memuat draft simulator syahadah:', e);
    }
    isHydratedRef.current = true;
  }, []);

  // 2. Auto-persist draft to localStorage (debounced)
  useEffect(() => {
    if (!isHydratedRef.current) return;
    const timer = setTimeout(() => {
      try {
        const draft = {
          oplah,
          varian,
          ukuran,
          mesin,
          laminasi,
          opsiFoil,
          opsiKardusLakban,
          marginPct,
          negoDiskonPct,
        };
        localStorage.setItem('sintak_syahadah_simulator_draft', JSON.stringify(draft));
      } catch (e) {
        console.error('Gagal menyimpan draft simulator syahadah:', e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [oplah, varian, ukuran, mesin, laminasi, opsiFoil, opsiKardusLakban, marginPct, negoDiskonPct]);

  // 3. Load saved simulation list
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sintak_saved_syahadah_simulations');
      if (raw) {
        const list: SavedSyahadahSimulationItem[] = JSON.parse(raw);
        setSavedSimulations(list);

        if (activeSimulationId) {
          const item = list.find((s) => s.id === activeSimulationId);
          if (item) {
            const inp = item.data.input;
            setOplah(inp.oplah);
            setVarian(inp.varian);
            if (inp.ukuran) setUkuran(inp.ukuran);
            if (inp.mesin) setMesin(inp.mesin);
            if (inp.laminasi) setLaminasi(inp.laminasi);
            setOpsiFoil(Boolean(inp.opsiFoil));
            if (inp.opsiKardusLakban !== undefined) setOpsiKardusLakban(Boolean(inp.opsiKardusLakban));
            setMarginPct(inp.marginPct ?? 30);
            setNegoDiskonPct(inp.negoDiskonPct ?? 5);
            setSimulationTitle(item.title);
          }
        }
      }
    } catch (e) {
      console.error('Gagal memuat riwayat simulasi syahadah:', e);
    }
  }, [activeSimulationId]);

  // Kalkulasi engine Syahadah murni
  const result = useMemo(
    () =>
      calculateSyahadahHpp(
        {
          oplah,
          varian,
          ukuran,
          mesin,
          laminasi,
          opsiFoil,
          opsiKardusLakban,
          marginPct,
          negoDiskonPct,
        },
        customParams
      ),
    [oplah, varian, ukuran, mesin, laminasi, opsiFoil, opsiKardusLakban, marginPct, negoDiskonPct, customParams]
  );

  const defaultTitle = () =>
    `Syahadah ${varian} ${result.mesinTerpilih} (${oplah.toLocaleString('id-ID')} pcs)`;

  const handleSaveSimulation = () => {
    const title = simulationTitle.trim() || defaultTitle();
    const newItem: SavedSyahadahSimulationItem = {
      id: 'syahadah_' + Date.now(),
      title,
      savedAt: new Date().toISOString(),
      data: result,
      paramsSnapshot: customParams,
    };
    const updated = [newItem, ...savedSimulations.slice(0, 49)];
    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_syahadah_simulations', JSON.stringify(updated));
      saveCalculationToDb({ ...newItem, category: 'Syahadah' });
    } catch (e) {
      console.error('Failed to save syahadah simulation:', e);
    }
    setSimulationTitle('');
    toast.success(`Kalkulasi "${title}" berhasil disimpan!`);
    setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
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
      localStorage.setItem('sintak_saved_syahadah_simulations', JSON.stringify(updated));
      const targetItem = updated.find((x) => x.id === activeSimulationId);
      if (targetItem) saveCalculationToDb({ ...targetItem, category: 'Syahadah' });
    } catch (e) {
      console.error('Failed to update syahadah simulation:', e);
    }
    setActiveSimulationTitle(title);
    toast.success(`Perubahan "${title}" berhasil disimpan!`);
    setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
    setSimulationTitle('');
  };

  const handleCopyQuote = () => {
    const fmt = (n: number) => n.toLocaleString('id-ID');
    const cfg = SYAHADAH_CONFIG[varian] || SYAHADAH_CONFIG['1 Muka FC'];
    const text =
      `*PENAWARAN HARGA SYAHADAH / SERTIFIKAT*\n` +
      `*PT Buya Barokah*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Produk*: Syahadah ${varian} (${ukuran})\n` +
      `• *Bahan*: Linen / Hammer Crem Tebal 300 gsm\n` +
      `• *Kuantitas*: ${oplah.toLocaleString('id-ID')} pcs\n` +
      `• *Mesin Cetak*: ${result.mesinTerpilih}\n` +
      `• *Finishing*: Potong Sisir${laminasi !== 'Tanpa Laminasi' ? ` + ${laminasi}` : ''}${opsiFoil ? ' + Foil Emas (Hotprint)' : ''}${opsiKardusLakban ? ' + Packing Kardus' : ''}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Harga Satuan*: *Rp ${fmt(result.hargaJualPerPcs)} / pcs*\n` +
      `• *Harga Nego*: *Rp ${fmt(result.hargaNegoPerPcs)} / pcs* (-${negoDiskonPct}%)\n` +
      `• *Total Penawaran*: *Rp ${fmt(result.totalHargaJual)}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Catatan: Harga belum termasuk PPN. Penawaran resmi berlaku 14 hari._`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success('Penawaran harga Syahadah berhasil disalin ke WhatsApp clipboard!');
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  return (
    // Struktur dual-scroll mandiri standar Manasik: flex flex-col flex-1 h-[calc(100vh-140px)] min-h-0
    <div className="flex flex-col flex-1 h-[calc(100vh-140px)] min-h-0 space-y-3 pb-2">
      {/* Header Banner */}
      <div className="p-3.5 sm:p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-emerald-950 tracking-tight">
                Simulator &amp; Kalkulator Syahadah
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Katalog 08
              </span>
            </div>
            <p className="text-[11px] text-emerald-800/80 mt-0.5">
              Kalkulasi 100% presisi Excel (Linen/Hammer Crem 300 gsm, Cetak Digital Print Inter vs Offset Ryobi/Oliver, hotprint foil emas, &amp; packing).
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

      {/* Banner Mode Riwayat Aktif */}
      {activeSimulationId && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-200 text-amber-900 rounded-lg shrink-0">
              <Bookmark className="w-4 h-4 fill-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                  Mode Riwayat Aktif
                </span>
                <h4 className="text-xs font-bold text-amber-950">{activeSimulationTitle}</h4>
              </div>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Menyunting data dari riwayat simulasi yang dimuat.
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

      {/* Grid Dual Scroll Mandiri */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 min-h-0 pb-1">
        {/* Kolom Kiri: Input Form (lg:col-span-5) */}
        <div className="lg:col-span-5 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Spesifikasi &amp; Parameter Syahadah
              </h3>
            </div>

            {/* 1. Varian Syahadah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                1. Varian Cetak Syahadah
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {SYAHADAH_VARIANTS.map((v) => {
                  const active = varian === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVarian(v)}
                      className={`py-2 px-2 rounded-lg border text-[11px] font-bold text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                        active
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{v}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1.5 italic">
                {SYAHADAH_CONFIG[varian]?.description}
              </p>
            </div>

            {/* 2. Pilihan Mesin Cetak */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  2. Metode Cetak Mesin
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  Aktif: <strong className="text-emerald-700">{result.mesinTerpilih}</strong>
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Auto', 'Print Inter', 'Ryobi', 'Oliver'] as SyahadahMesinType[]).map((m) => {
                  const active = mesin === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMesin(m)}
                      className={`py-2 px-1 rounded-lg border text-[11px] font-bold text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                        active
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {m === 'Auto' ? (
                        <Sparkles size={13} className={active ? 'text-amber-200' : 'text-amber-500'} />
                      ) : (
                        <Printer size={13} />
                      )}
                      <span>{m === 'Auto' ? '⚙️ Auto' : m}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {mesin === 'Auto'
                  ? 'Auto: Oplah ≤200 Print Inter A3+, Oplah ≥250 Ryobi offset (1W/2W) / Oliver'
                  : `Dipaksa mesin: ${mesin}`}
              </p>
            </div>

            {/* 3. Ukuran Kertas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                3. Ukuran Cetak
              </label>
              <div className="grid grid-cols-2 gap-2">
                {UKURAN_OPTIONS.map((u) => {
                  const active = ukuran === u;
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUkuran(u)}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                        active
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {u}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Opsi Foil & Pengemasan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                4. Opsi Finishing Khusus &amp; Packing
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={opsiFoil}
                    onChange={(e) => setOpsiFoil(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-slate-800 block">Foil Emas (Hotprint)</span>
                    <span className="text-[10px] text-slate-500">+Rp 450/pcs (min 100k + klise)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={opsiKardusLakban}
                    onChange={(e) => setOpsiKardusLakban(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-slate-800 block">Kardus &amp; Lakban</span>
                    <span className="text-[10px] text-slate-500">Box kardus @1.000 pcs</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 5. Kuantitas Oplah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                5. Kuantitas Oplah (Pcs)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={SYAHADAH_TIERS.includes(oplah) ? oplah : 'custom'}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v !== 'custom') setOplah(Number(v));
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {SYAHADAH_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t.toLocaleString('id-ID')} pcs
                    </option>
                  ))}
                  {!SYAHADAH_TIERS.includes(oplah) && (
                    <option value="custom">{oplah.toLocaleString('id-ID')} pcs (custom)</option>
                  )}
                </select>
                <input
                  type="number"
                  min={1}
                  max={50000}
                  step={5}
                  value={oplah}
                  onChange={(e) => setOplah(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  placeholder="Kustom oplah..."
                />
              </div>
            </div>

            {/* 6. Margin & Nego Diskon */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Margin Profit (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={marginPct}
                    onChange={(e) => setMarginPct(Number(e.target.value) || 0)}
                    className="w-full pl-3 pr-7 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
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
                    max={100}
                    value={negoDiskonPct}
                    onChange={(e) => setNegoDiskonPct(Number(e.target.value) || 0)}
                    className="w-full pl-3 pr-7 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rincian & Hasil (lg:col-span-7) */}
        <div className="lg:col-span-7 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          {/* 4 Kartu Finansial Utama */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Card 1: HPP */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">HPP / Pcs</span>
                <DollarSign size={13} className="text-slate-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
                  Rp {Math.round(result.hppPerPcs).toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  Total: Rp {result.totalHpp.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Card 2: Harga Jual Pricelist */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-xl border border-emerald-200 p-3 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[11px] font-bold">Harga Jual (+{marginPct}%)</span>
                <TrendingUp size={13} className="text-emerald-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                  Rp {result.hargaJualPerPcs.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-emerald-700/80 mt-0.5">
                  Master BUKU: Rp {result.hargaJualTensPerPcs.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Card 3: Harga Nego */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-xl border border-blue-200 p-3 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-800 mb-1">
                <span className="text-[11px] font-bold">Harga Nego (-{negoDiskonPct}%)</span>
                <Percent size={13} className="text-blue-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-blue-800 font-mono">
                  Rp {result.hargaNegoPerPcs.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-blue-700/80 mt-0.5">
                  Total: Rp {result.totalHargaNego.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Card 4: Total Nilai Order */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">Total Nilai Order</span>
                <TrendingUp size={13} className="text-emerald-500" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                  Rp {result.totalHargaJual.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Profit: Rp {result.profitTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Tabel Rincian Breakdown Biaya Transparan */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Rincian Komponen Biaya HPP Syahadah
                </h4>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {oplah.toLocaleString('id-ID')} pcs
                </span>
                <span>• {varian}</span>
                <span>• {result.mesinTerpilih}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2 px-3 w-10 text-center">No</th>
                    <th className="py-2 px-3">Komponen Biaya</th>
                    <th className="py-2 px-3">Spesifikasi &amp; Alamat Cell Excel</th>
                    <th className="py-2 px-3 text-right">Nominal (Rp)</th>
                    <th className="py-2 px-3 text-right w-16">Porsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {result.breakdown.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {item.nama}
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {item.keterangan}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                        Rp {item.nominal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500 text-[11px]">
                        {(item.pct * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50/70 border-t border-emerald-200 font-bold text-emerald-950">
                    <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                      Total HPP Produksi:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-emerald-900">
                      Rp {result.totalHpp.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                      100.0%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Tombol Aksi Simpan Simulasi (Full Width) */}
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

      {/* Modal Panduan Penggunaan Simulator */}
      {showSimulatorManual && (
        <div
          onClick={() => setShowSimulatorManual(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">
                    Panduan Penggunaan Kalkulator Syahadah
                  </h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Alur pemilihan spek fisik, mesin cetak, dan kalkulasi harga penawaran Syahadah
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

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-700" />
                  1. Anatomi Kertas &amp; Dimensi Syahadah
                </h4>
                <p>
                  • <strong>Bahan Baku</strong>: Kertas Linen / Hammer Crem Tebal 300 gsm (harga acuan Rp 29.900 / kg).
                </p>
                <p>
                  • <strong>Ukuran Standar</strong>: Folio 21,5×33 cm (atau A4 21×29,7 cm). 1 lembar plano 79×109 cm dipotong menjadi 11 lembar folio.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Printer className="w-4 h-4 text-blue-700" />
                  2. Pemilihan Mesin Cetak (Auto vs Manual)
                </h4>
                <p>
                  • <strong>Cetak Digital (Print Inter A3+)</strong>: Pilihan otomatis untuk oplah kecil (≤ 200 pcs) pada varian 1W/2W, dan sampai 500 pcs pada varian Full Colour. Menggunakan kertas A3+ di mana 1 lembar A3+ muat 2 lembar syahadah.
                </p>
                <p>
                  • <strong>Offset Toko / Ryobi</strong>: Pilihan otomatis untuk oplah ≥ 250 pcs pada varian 1 Warna dan 2 Warna. Biaya plat Rp 10.000/plat dengan ongkos dasar Rp 15.000/plat (s.d. 500 drek) dan drek over Rp 30/drek/warna.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Stamp className="w-4 h-4 text-amber-700" />
                  3. Finishing Foil Emas (Hotprint)
                </h4>
                <p>
                  • Penambahan hotprint foil emas dikenakan biaya Rp 450 / pcs (dengan batas order minimum Rp 100.000) ditambah biaya pembuatan klise master foil Rp 53.200 per muka.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  4. Strategi Penawaran &amp; Pembulatan
                </h4>
                <p>
                  • <strong>Harga Master BUKU</strong>: Menggunakan pembulatan puluhan (<code className="bg-white px-1 py-0.5 rounded border">ROUNDUP(HPP*1.3, -1)</code>).
                </p>
                <p>
                  • <strong>Harga Pricelist Final (HARGA JULI 2026)</strong>: Menggunakan pembulatan ke ratusan terdekat (<code className="bg-white px-1 py-0.5 rounded border">ROUNDUP(HPP*1.3, -2)</code>).
                </p>
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
