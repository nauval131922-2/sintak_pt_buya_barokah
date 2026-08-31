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
  Layers,
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
      {/* Active Edit Alert Bar */}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Input Spesifikasi Label KHQ</h3>
            </div>

            {/* Varian Botol */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Varian Botol Label KHQ</label>
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
              <p className="text-[11px] text-slate-500 mt-1.5 italic">{LABEL_KHQ_CONFIG[varian].description}</p>
            </div>

            {/* Kuantitas Order */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kuantitas Order (Kardus)</label>
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
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={1}
                  value={jumlahKardus}
                  onChange={(e) => {
                    setJumlahKardus(Math.max(1, Number(e.target.value) || 1));
                    setJumlahLbrCustom(0);
                  }}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  placeholder="Kardus..."
                />
                <input
                  type="number"
                  min={0}
                  value={jumlahLbrCustom || ''}
                  onChange={(e) => {
                    const lbr = Number(e.target.value) || 0;
                    setJumlahLbrCustom(lbr);
                    if (lbr > 0) setJumlahKardus(Math.ceil(lbr / LABEL_KHQ_CONFIG[varian].lbrPerKardus));
                  }}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  placeholder="Atau custom lbr..."
                />
              </div>
            </div>

            {/* Finishing */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Finishing</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={opsiLaminasi}
                    onChange={(e) => setOpsiLaminasi(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block text-[11px]">Laminasi Glossy</span>
                    <span className="text-[10px] text-slate-400">Kilap tahan air</span>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={opsiRajang}
                    onChange={(e) => setOpsiRajang(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block text-[11px]">Rajang / Potong</span>
                    <span className="text-[10px] text-slate-400">Siap tempel botol</span>
                  </div>
                </label>
              </div>
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

            {/* Judul + Salin WA — simpan utama ada di kanan bawah (full-width) */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <input
                type="text"
                value={simulationTitle}
                onChange={(e) => setSimulationTitle(e.target.value)}
                placeholder={defaultTitle()}
                className="w-full px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyQuote}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                title="Salin penawaran WhatsApp"
              >
                {copiedQuote ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                <span>Salin Penawaran WA</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Hasil */}
        <div className="lg:col-span-7 space-y-5">
          {/* 4 Kartu Finansial — style identik Brosur */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">HPP / lbr</span>
                <DollarSign size={13} className="text-slate-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
                  Rp {result.hppPerLbr.toFixed(2)}
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
                  Rp {result.hargaJualPerLbr.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-emerald-700/80 mt-0.5">/ lbr</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-800 mb-1">
                <span className="text-[11px] font-bold">Harga Nego (-{negoDiskonPct}%)</span>
                <Percent size={13} className="text-blue-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-blue-800 font-mono">
                  Rp {result.hargaNegoPerLbr.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-blue-700/80 mt-0.5">/ lbr</span>
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
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Rincian Estimasi Komponen Biaya Label KHQ</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {result.jumlahKardus} Dus / {result.jumlahLbr.toLocaleString('id-ID')} lbr · {result.kebutuhanLbrA3} lbr A3+
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
                      <td className="py-2 px-3 text-right font-bold text-slate-800">Rp {item.nominal.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right text-slate-500">{(item.pct * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/90 font-bold border-t border-slate-200 text-xs">
                    <td colSpan={3} className="py-2.5 px-3 text-slate-800 font-sans">
                      Total HPP Biaya Produksi ({result.jumlahKardus} Dus / {result.jumlahLbr.toLocaleString('id-ID')} lbr)
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

          {/* Aksi Simpan alternatif di kanan (konsisten Brosur: full-width di bawah breakdown) */}
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
                  <h3 className="text-base font-bold tracking-tight">Panduan Simulator Label KHQ</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">Alur perhitungan berbasis kardus (24 lbr/dus), POD A3+, laminasi &amp; rajang</p>
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
                  Langkah Menggunakan Simulator Label KHQ
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    ['1. Varian & Jumlah', 'Pilih varian botol 220/330/600 ml dan tentukan jumlah kardus (1 dus = 24 lbr).'],
                    ['2. Finishing', 'Aktifkan Laminasi Glossy & Rajang/Potong sesuai kebutuhan label.'],
                    ['3. Margin & Nego', 'Atur margin profit & batas nego, harga otomatis terhitung.'],
                    ['4. Salin & Simpan', 'Salin format WA atau simpan ke Daftar Kalkulasi untuk muat ulang.'],
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
                  Struktur Biaya Produksi Label KHQ
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-white rounded border border-emerald-100 space-y-1">
                    <span className="font-bold text-emerald-900 block">Cetak &amp; Bahan:</span>
                    <p className="text-slate-600 leading-snug">
                      Print POD A3+ Rp 2.000/lbr + insheet 7 lbr. Kapasitas: 220ml 19 pcs/A3+, 330ml 20 pcs/A3+, 600ml 17 pcs/A3+.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-blue-100 space-y-1">
                    <span className="font-bold text-blue-900 block">Finishing &amp; Packing:</span>
                    <p className="text-slate-600 leading-snug">
                      Rajang Rp 50/lembar + Laminasi glossy 0,35/cm² (min 50k) per lbr A3+ + Desain Rp 30.000/order.
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
