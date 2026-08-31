'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  RefreshCw,
  Wine,
} from 'lucide-react';
import {
  LabelKhqMasterParams,
  DEFAULT_LABEL_KHQ_PARAMS,
  LabelKhqVarianType,
  LABEL_KHQ_CONFIG,
  calculateLabelKhqHpp,
  SavedLabelKhqSimulationItem,
} from '@/lib/label-khq-calculator';
import { toast } from '@/lib/toast';

export type { SavedLabelKhqSimulationItem };

const VARIAN_LIST: LabelKhqVarianType[] = ['KHQ 220 ml', 'KHQ 330 ml', 'KHQ 600 ml'];
const KARDUS_TIERS = [5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 35, 40, 50, 100];

interface LabelKhqSimulatorProps {
  customParams?: LabelKhqMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<LabelKhqMasterParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

export default function LabelKhqSimulator({
  customParams = DEFAULT_LABEL_KHQ_PARAMS,
  setCustomParams,
  onOpenMasterParam,
  activeSimulationId: propActiveSimId,
  setActiveSimulationId: propSetActiveSimId,
  activeSimulationTitle: propActiveSimTitle,
  setActiveSimulationTitle: propSetActiveSimTitle,
}: LabelKhqSimulatorProps) {
  const [varian, setVarian] = useState<LabelKhqVarianType>('KHQ 220 ml');
  const [jumlahKardus, setJumlahKardus] = useState<number>(10);
  const [jumlahLbrCustom, setJumlahLbrCustom] = useState<number>(0);
  const [opsiLaminasi, setOpsiLaminasi] = useState<boolean>(true);
  const [opsiRajang, setOpsiRajang] = useState<boolean>(true);
  const [marginPct, setMarginPct] = useState<number>(30);
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(4);
  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);

  const [savedSimulations, setSavedSimulations] = useState<SavedLabelKhqSimulationItem[]>([]);
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
      const raw = localStorage.getItem('sintak_saved_label_khq_simulations');
      if (raw) {
        const list: SavedLabelKhqSimulationItem[] = JSON.parse(raw);
        setSavedSimulations(list);

        if (activeSimulationId) {
          const item = list.find((s) => s.id === activeSimulationId);
          if (item) {
            const input = item.data.input;
            setVarian(input.varian);
            setJumlahKardus(input.jumlahKardus);
            setJumlahLbrCustom(input.jumlahLbrCustom || 0);
            setOpsiLaminasi(input.opsiLaminasi !== false);
            setOpsiRajang(input.opsiRajang !== false);
            setMarginPct(input.marginPct);
            setNegoDiskonPct(input.negoDiskonPct);
            setSimulationTitle(item.title);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load saved Label KHQ simulations:', e);
    }
  }, [activeSimulationId]);

  const result = useMemo(
    () =>
      calculateLabelKhqHpp(
        {
          varian,
          jumlahKardus,
          jumlahLbrCustom: jumlahLbrCustom > 0 ? jumlahLbrCustom : undefined,
          opsiLaminasi,
          opsiRajang,
          marginPct,
          negoDiskonPct,
        },
        customParams
      ),
    [varian, jumlahKardus, jumlahLbrCustom, opsiLaminasi, opsiRajang, marginPct, negoDiskonPct, customParams]
  );

  const defaultTitle = () =>
    `Label ${varian} (${result.jumlahKardus} Dus / ${result.jumlahLbr} Lbr)`;

  const handleSaveSimulation = () => {
    const title = simulationTitle.trim() || defaultTitle();
    const newItem: SavedLabelKhqSimulationItem = {
      id: 'label_khq_' + Date.now(),
      title,
      savedAt: new Date().toISOString(),
      data: result,
      paramsSnapshot: customParams,
    };
    const updated = [newItem, ...savedSimulations.slice(0, 49)];
    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_label_khq_simulations', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save label KHQ simulation:', e);
    }
    setSimulationTitle('');
    toast.success(`Kalkulasi "${title}" berhasil disimpan!`);
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
      localStorage.setItem('sintak_saved_label_khq_simulations', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update label KHQ simulation:', e);
    }
    setActiveSimulationTitle(title);
    toast.success(`Perubahan "${title}" berhasil disimpan!`);
  };

  const handleCopyQuote = () => {
    const fmt = (n: number) => n.toLocaleString('id-ID');
    const cfg = LABEL_KHQ_CONFIG[varian];
    const text =
      `*PENAWARAN LABEL BOTOL KHQ*\n` +
      `*PT Buya Barokah*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Produk*: ${varian}\n` +
      `• *Spesifikasi*: ${cfg.description}\n` +
      `• *Jumlah Order*: ${result.jumlahKardus} Kardus (${fmt(result.jumlahLbr)} Lembar Label)\n` +
      `• *Finishing*: ${opsiLaminasi ? 'Laminasi Glossy' : 'Tanpa Laminasi'}, ${opsiRajang ? 'Rajang Potong' : 'Tanpa Potong'}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Harga / Lembar*: Rp ${fmt(result.hargaJualPerLbr)}\n` +
      `• *Harga Nego / Lembar*: Rp ${fmt(result.hargaNegoPerLbr)}\n` +
      `• *Total Omset*: *Rp ${fmt(result.totalHargaJual)}*\n` +
      `• *Total Nego*: *Rp ${fmt(result.totalHargaNego)}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Harga dapat berubah sewaktu-waktu sesuai ketentuan & fluktuasi bahan baku._`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success('Format penawaran berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Active Edit Alert Bar — konsisten dengan Brosur/Manasik/Yasin/Nota */}
      {activeSimulationId && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 border border-amber-200 shrink-0">
              <BookmarkCheck size={14} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                  Mode Riwayat Aktif
                </span>
                <h4 className="text-xs font-bold text-amber-950">{activeSimulationTitle || defaultTitle()}</h4>
              </div>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Anda sedang melihat atau mengedit data dari riwayat simulasi yang dimuat.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (setCustomParams) setCustomParams(DEFAULT_LABEL_KHQ_PARAMS);
                toast.success('Parameter Label KHQ dikembalikan ke tarif Master Standar!');
              }}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              title="Hitung ulang simulasi ini menggunakan tarif Master acuan hari ini"
            >
              <RefreshCw size={12} />
              <span>Hitung Tarif Master</span>
            </button>
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

      {/* 4 Financial Cards Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: HPP Total */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total HPP</span>
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
              <Calculator size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>HPP / Lbr:</span>
            <span className="font-mono font-bold text-slate-700">
              Rp {result.hppPerLbr.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Card 2: Harga Jual / Lbr */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-xs hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50/40 to-transparent">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Harga Jual / Lbr</span>
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
            Rp {result.hargaJualPerLbr.toLocaleString('id-ID')}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-700/80 font-medium">
            <span>Total Omset:</span>
            <span className="font-mono font-bold text-emerald-900">
              Rp {result.totalHargaJual.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Card 3: Harga Nego / Lbr */}
        <div className="bg-white rounded-2xl border border-blue-200/80 p-4 shadow-xs hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50/40 to-transparent">
          <div className="flex items-center justify-between text-blue-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Harga Nego / Lbr</span>
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
              <Percent size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-900 tracking-tight">
            Rp {result.hargaNegoPerLbr.toLocaleString('id-ID')}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-blue-700/80 font-medium">
            <span>Diskon: {negoDiskonPct}% · Total Nego:</span>
            <span className="font-mono font-bold text-blue-900">
              Rp {result.totalHargaNego.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Card 4: Profit Bersih */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50/40 to-transparent">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Profit Bersih</span>
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight">
            Rp {result.profitTotal.toLocaleString('id-ID')}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-amber-700/80 font-medium">
            <span>Margin Aktual:</span>
            <span className="font-mono font-bold text-amber-900">
              {Math.round(result.marginPct * 100)}% (Rp {Math.round(result.profitPerLbr).toLocaleString('id-ID')}/lbr)
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Input & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form Input Spesifikasi */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Input Spesifikasi Label KHQ
              </h3>
            </div>

            {/* Pilihan Varian Ukuran Botol */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Varian Botol Label KHQ
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VARIAN_LIST.map((v) => (
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
                    <Wine size={14} className={varian === v ? 'text-white' : 'text-slate-500'} />
                    <span>{v}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 italic">
                {LABEL_KHQ_CONFIG[varian].description}
              </p>
            </div>

            {/* Input Qty Kardus / Lembar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kuantitas Order (Kardus)
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={jumlahKardus}
                  onChange={(e) => {
                    setJumlahKardus(Number(e.target.value));
                    setJumlahLbrCustom(0);
                  }}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {KARDUS_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t} Kardus ({t * LABEL_KHQ_CONFIG[varian].lbrPerKardus} Lembar)
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={jumlahKardus}
                  onChange={(e) => {
                    setJumlahKardus(Math.max(1, Number(e.target.value) || 1));
                    setJumlahLbrCustom(0);
                  }}
                  className="w-1/2 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                  placeholder="Kardus..."
                />
                <input
                  type="number"
                  min={0}
                  value={jumlahLbrCustom || ''}
                  onChange={(e) => {
                    const lbr = Number(e.target.value) || 0;
                    setJumlahLbrCustom(lbr);
                    if (lbr > 0) {
                      setJumlahKardus(Math.ceil(lbr / LABEL_KHQ_CONFIG[varian].lbrPerKardus));
                    }
                  }}
                  className="w-1/2 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                  placeholder="Atau custom lbr..."
                />
              </div>
            </div>

            {/* Opsi Finishing */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Finishing &amp; Proses
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={opsiLaminasi}
                    onChange={(e) => setOpsiLaminasi(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-800">Laminasi Glossy</span>
                    <p className="text-[10.5px] text-slate-500">Lapisan kilap tahan air &amp; gesekan botol</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={opsiRajang}
                    onChange={(e) => setOpsiRajang(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-800">Rajang / Potong Lembaran</span>
                    <p className="text-[10.5px] text-slate-500">Potong satuan siap tempel di botol KHQ</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Margin & Diskon Nego */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Margin Profit (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={marginPct}
                  onChange={(e) => setMarginPct(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Diskon Nego (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={negoDiskonPct}
                  onChange={(e) => setNegoDiskonPct(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Simpan Kalkulasi */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <input
                type="text"
                value={simulationTitle}
                onChange={(e) => setSimulationTitle(e.target.value)}
                placeholder={defaultTitle()}
                className="w-full px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={activeSimulationId ? handleUpdateSavedSimulation : handleSaveSimulation}
                  className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Bookmark size={14} />
                  <span>{activeSimulationId ? 'Update Riwayat' : 'Simpan Kalkulasi'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyQuote}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
                  title="Salin penawaran WhatsApp"
                >
                  {copiedQuote ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                  <span>Salin WA</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Breakdown HPP & Ringkasan Teknis */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-emerald-700" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Rincian Komponen Biaya HPP
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-medium">
                {result.kebutuhanLbrA3} Lembar A3+
              </span>
            </div>

            {/* Tabel Breakdown */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="pb-2 px-2">Komponen Biaya</th>
                    <th className="pb-2 px-2">Keterangan / Volume</th>
                    <th className="pb-2 px-2 text-right">Subtotal</th>
                    <th className="pb-2 px-2 text-right">Porsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {result.breakdown.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-2 font-bold text-slate-800">{item.nama}</td>
                      <td className="py-2.5 px-2 text-slate-500 text-[11px]">{item.keterangan}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800">
                        Rp {item.nominal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-500 text-[11px]">
                        {(item.pct * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 font-bold text-slate-900 bg-slate-50/50">
                    <td className="py-2.5 px-2" colSpan={2}>
                      Total HPP ({result.jumlahKardus} Kardus / {result.jumlahLbr.toLocaleString('id-ID')} Lembar)
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-emerald-800 text-sm">
                      Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-600 text-xs">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Note & Informasi Teknis */}
            <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3 text-[11.5px] text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info size={14} className="text-emerald-700 shrink-0" />
                <span>Informasi Spesifikasi &amp; Kemasan</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-emerald-800/90 pl-1 text-[11px]">
                <li>Standar 1 Dus/Kardus = 24 lembar label botol.</li>
                <li>Layout lembar cetak A3+ memuat {LABEL_KHQ_CONFIG[varian].pcsPerLbrA3} pcs label per lembar.</li>
                <li>Biaya cetak menggunakan printer digital POD A3+ dengan bahan kertas Art Paper 120 gsm.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
