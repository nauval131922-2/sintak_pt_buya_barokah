'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { saveCalculationToDb } from '@/lib/pricelist-db-sync';
import {
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  FileText,
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
  Wallet,
} from 'lucide-react';
import {
  calculateSertifikatHpp,
  DEFAULT_SERTIFIKAT_PARAMS,
  SertifikatMasterParams,
  SertifikatBahan,
  SertifikatMesin,
  SertifikatUkuran,
  SertifikatFinishing,
  SERTIFIKAT_BAHAN,
  SERTIFIKAT_MESIN,
  SERTIFIKAT_UKURAN,
  SERTIFIKAT_FINISHING,
  SERTIFIKAT_TIERS,
  gramaturDefaultForBahan,
  insheetDefaultForMesin,
  SavedSertifikatSimulationItem,
} from '@/lib/sertifikat-calculator';
import { toast } from '@/lib/toast';

export type { SavedSertifikatSimulationItem };

const DRAFT_KEY = 'sintak_sertifikat_draft';
const SAVED_KEY = 'sintak_saved_sertifikat_simulations';

interface SertifikatSimulatorProps {
  customParams?: SertifikatMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<SertifikatMasterParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

const FINISHING_LABEL: Record<SertifikatFinishing, string> = {
  'None,': 'None',
  'UV Varnish,': 'UV Varnish',
  'Laminasi Glossy,': 'Laminasi Glossy',
  'Laminasi Doff,': 'Laminasi Doff',
};

export default function SertifikatSimulator({
  customParams = DEFAULT_SERTIFIKAT_PARAMS,
  setCustomParams,
  onOpenMasterParam,
  activeSimulationId: propActiveSimId,
  setActiveSimulationId: propSetActiveSimId,
  activeSimulationTitle: propActiveSimTitle,
  setActiveSimulationTitle: propSetActiveSimTitle,
}: SertifikatSimulatorProps) {
  const params: SertifikatMasterParams = { ...DEFAULT_SERTIFIKAT_PARAMS, ...(customParams || {}) };

  const [oplahPcs, setOplahPcs] = useState<number>(1000);
  const [ukuran, setUkuran] = useState<SertifikatUkuran>('21 x 29,7');
  const [bahan, setBahan] = useState<SertifikatBahan>('Art Carton');
  const [gramatur, setGramatur] = useState<number>(params.gramaturAc);
  const [nWarna, setNWarna] = useState<1 | 2 | 3 | 4>(4);
  const [muka, setMuka] = useState<1 | 2>(1);
  const [mesin, setMesin] = useState<SertifikatMesin>('Oliver');
  const [finishing, setFinishing] = useState<SertifikatFinishing>('None,');
  const [foilAktif, setFoilAktif] = useState(false);
  const [kardusAktif, setKardusAktif] = useState(true);
  const [insheetLembar, setInsheetLembar] = useState<number>(params.insheetOffset);
  const [marginPct, setMarginPct] = useState(params.labaPct);
  const [copiedQuote, setCopiedQuote] = useState(false);

  const [savedSimulations, setSavedSimulations] = useState<SavedSertifikatSimulationItem[]>([]);
  const [simulationTitle, setSimulationTitle] = useState('');
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const [internalActiveTitle, setInternalActiveTitle] = useState<string | null>(null);
  const [showSimulatorManual, setShowSimulatorManual] = useState(false);
  const draftLoaded = useRef(false);

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

  // Auto-persist draft agar tidak reset saat pindah tab
  useEffect(() => {
    if (!draftLoaded.current) {
      draftLoaded.current = true;
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          if (typeof d.oplahPcs === 'number') setOplahPcs(d.oplahPcs);
          if (SERTIFIKAT_UKURAN.includes(d.ukuran)) setUkuran(d.ukuran);
          if (SERTIFIKAT_BAHAN.includes(d.bahan)) setBahan(d.bahan);
          if (typeof d.gramatur === 'number') setGramatur(d.gramatur);
          if ([1, 2, 3, 4].includes(d.nWarna)) setNWarna(d.nWarna);
          if ([1, 2].includes(d.muka)) setMuka(d.muka);
          if (SERTIFIKAT_MESIN.includes(d.mesin)) setMesin(d.mesin);
          if (SERTIFIKAT_FINISHING.includes(d.finishing)) setFinishing(d.finishing);
          if (typeof d.foilAktif === 'boolean') setFoilAktif(d.foilAktif);
          if (typeof d.kardusAktif === 'boolean') setKardusAktif(d.kardusAktif);
          if (typeof d.insheetLembar === 'number') setInsheetLembar(d.insheetLembar);
          if (typeof d.marginPct === 'number') setMarginPct(d.marginPct);
        }
      } catch (e) {
        console.error('Failed to load sertifikat draft:', e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!draftLoaded.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ oplahPcs, ukuran, bahan, gramatur, nWarna, muka, mesin, finishing, foilAktif, kardusAktif, insheetLembar, marginPct }));
    } catch (e) {
      console.error('Failed to save sertifikat draft:', e);
    }
  }, [oplahPcs, ukuran, bahan, gramatur, nWarna, muka, mesin, finishing, foilAktif, kardusAktif, insheetLembar, marginPct]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) {
        const list: SavedSertifikatSimulationItem[] = JSON.parse(raw);
        setSavedSimulations(list);

        if (activeSimulationId) {
          const item = list.find((s) => s.id === activeSimulationId);
          if (item) {
            const inp = item.data.input;
            setOplahPcs(inp.oplahPcs);
            setUkuran(inp.ukuran);
            setBahan(inp.bahan);
            setGramatur(inp.gramatur);
            setNWarna(inp.nWarna);
            setMuka(inp.muka);
            setMesin(inp.mesin);
            setFinishing(inp.finishing);
            setFoilAktif(inp.foilAktif);
            setKardusAktif(inp.kardusAktif);
            setInsheetLembar(inp.insheetLembar);
            setMarginPct(inp.marginPct);
            setSimulationTitle(item.title);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load saved sertifikat simulations:', e);
    }
  }, [activeSimulationId]);

  // Ganti bahan → gramatur ikut default file; ganti mesin → insheet + kardus ikut pola file
  const handleBahanChange = (b: SertifikatBahan) => {
    setBahan(b);
    setGramatur(gramaturDefaultForBahan(b, params));
  };
  const handleMesinChange = (m: SertifikatMesin) => {
    setMesin(m);
    setInsheetLembar(insheetDefaultForMesin(m, params));
    setKardusAktif(m !== 'Print Inter');
  };

  const result = useMemo(
    () =>
      calculateSertifikatHpp(
        { oplahPcs, ukuran, bahan, gramatur, nWarna, muka, mesin, finishing, foilAktif, kardusAktif, insheetLembar, marginPct },
        params
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [oplahPcs, ukuran, bahan, gramatur, nWarna, muka, mesin, finishing, foilAktif, kardusAktif, insheetLembar, marginPct, customParams]
  );

  const defaultTitle = () => {
    return `Sertifikat ${bahan} ${nWarna}W ${mesin} (${oplahPcs} pcs)`;
  };

  const handleSaveSimulation = () => {
    const title = simulationTitle.trim() || defaultTitle();
    const newItem: SavedSertifikatSimulationItem = {
      id: 'sertifikat_' + Date.now(),
      title,
      savedAt: new Date().toISOString(),
      data: result,
      paramsSnapshot: params,
    };
    const updated = [newItem, ...savedSimulations.slice(0, 49)];
    setSavedSimulations(updated);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
      saveCalculationToDb({ ...newItem, category: 'Sertifikat' });
    } catch (e) {
      console.error('Failed to save sertifikat simulation:', e);
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
        ? { ...item, title, savedAt: new Date().toISOString(), data: result, paramsSnapshot: params }
        : item
    );
    setSavedSimulations(updated);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
      const targetItem = updated.find((x) => x.id === activeSimulationId);
      if (targetItem) saveCalculationToDb({ ...targetItem, category: 'Sertifikat' });
    } catch (e) {
      console.error('Failed to update sertifikat simulation:', e);
    }
    setActiveSimulationTitle(title);
    toast.success(`Perubahan "${title}" berhasil disimpan!`);
    setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
    setSimulationTitle('');
  };

  const handleCopyQuote = () => {
    const fmt = (n: number) => n.toLocaleString('id-ID');
    const text =
      `*PENAWARAN SERTIFIKAT*\n` +
      `*PT Buya Barokah*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Produk*: Sertifikat ${ukuran} 1 Muka\n` +
      `• *Spesifikasi*: ${bahan} ${gramatur} gsm, ${nWarna} Warna, Cetak ${mesin}, ${FINISHING_LABEL[finishing]}${foilAktif ? ', Foil' : ''}\n` +
      `• *Kuantitas*: ${oplahPcs.toLocaleString('id-ID')} pcs\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Harga / Pcs*: *Rp ${fmt(result.hargaFinalPerPcs)}*\n` +
      `• *Total Penawaran*: *Rp ${fmt(Math.round(result.totalHarga))}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Harga belum termasuk PPN._`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success('Penawaran harga Sertifikat berhasil disalin ke WhatsApp clipboard!');
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const specButton = (active: boolean) => `py-2 px-2 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
    active
      ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
  }`;

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-140px)] min-h-0 space-y-3 pb-2">
      {/* Header */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-emerald-950 flex items-center gap-2">
              Simulator &amp; Kalkulator Sertifikat
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Katalog 12
              </span>
            </h3>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Engine BUKU 1:1 file Sertifikat 1 Muka — Ac/BC/Linen, Oliver/SM/Print/Ryobi, Foil, Laminasi/UV, Kardus.
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
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 shrink-0">
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

      {/* Grid Dual Scroll Mandiri */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 min-h-0 pb-1">
        {/* Kolom Kiri: Input Form (lg:col-span-5) */}
        <div className="lg:col-span-5 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Input Spesifikasi Sertifikat</h3>
            </div>

            {/* Bahan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Bahan (Master!D10)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SERTIFIKAT_BAHAN.map((b) => (
                  <button key={b} type="button" onClick={() => handleBahanChange(b)} className={specButton(bahan === b)}>
                    <span className="text-[11px]">{b}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ukuran + Gramatur */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ukuran (D5)</label>
                <div className="grid grid-cols-1 gap-2">
                  {SERTIFIKAT_UKURAN.map((u) => (
                    <button key={u} type="button" onClick={() => setUkuran(u)} className={specButton(ukuran === u)}>
                      <span className="text-[11px]">{u}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Gramatur (D11)</label>
                <input
                  type="number"
                  min={0}
                  value={gramatur}
                  onChange={(e) => setGramatur(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">File: Ac 230, BC 200, Linen 300.</p>
              </div>
            </div>

            {/* Mesin */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mesin Cetak (Master!D16)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {SERTIFIKAT_MESIN.map((m) => (
                  <button key={m} type="button" onClick={() => handleMesinChange(m)} className={specButton(mesin === m)}>
                    <span className="text-[11px]">{m === 'Print Inter' ? 'Print' : m}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Ganti mesin = insheet &amp; kardus ikut pola file.</p>
            </div>

            {/* Warna + Muka */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Warna (D15)</label>
                <div className="grid grid-cols-4 gap-2">
                  {([1, 2, 3, 4] as const).map((w) => (
                    <button key={w} type="button" onClick={() => setNWarna(w)} className={specButton(nWarna === w)}>
                      {w}W
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Muka (D14)</label>
                <div className="grid grid-cols-2 gap-2">
                  {([1, 2] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setMuka(m)} className={specButton(muka === m)}>
                      {m} Muka
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Finishing */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Finishing (Master!D20)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SERTIFIKAT_FINISHING.map((f) => (
                  <button key={f} type="button" onClick={() => setFinishing(f)} className={specButton(finishing === f)}>
                    <span className="text-[11px]">{FINISHING_LABEL[f]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Foil + Kardus */}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setFoilAktif(!foilAktif)} className={`${specButton(foilAktif)} flex items-center justify-center gap-1.5`}>
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${foilAktif ? 'bg-white border-white' : 'border-slate-300'}`}>
                  {foilAktif && <Check size={12} className="text-emerald-700" />}
                </span>
                <span className="text-[11px]">Foil {foilAktif ? '√' : 'X'}</span>
              </button>
              <button type="button" onClick={() => setKardusAktif(!kardusAktif)} className={`${specButton(kardusAktif)} flex items-center justify-center gap-1.5`}>
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${kardusAktif ? 'bg-white border-white' : 'border-slate-300'}`}>
                  {kardusAktif && <Check size={12} className="text-emerald-700" />}
                </span>
                <span className="text-[11px]">Kardus {kardusAktif ? '√' : 'X'}</span>
              </button>
            </div>

            {/* Oplah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Oplah (pcs — Master!D7)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={SERTIFIKAT_TIERS.includes(oplahPcs) ? oplahPcs : 'custom'}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v !== 'custom') setOplahPcs(Number(v));
                  }}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {SERTIFIKAT_TIERS.map((t) => (
                    <option key={t} value={t}>{t.toLocaleString('id-ID')} pcs</option>
                  ))}
                  {!SERTIFIKAT_TIERS.includes(oplahPcs) && <option value="custom">{oplahPcs.toLocaleString('id-ID')} pcs (custom)</option>}
                </select>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  step={10}
                  value={oplahPcs}
                  onChange={(e) => setOplahPcs(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  placeholder="Custom..."
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Kebutuhan plano: {result.kebutuhanPlano.toLocaleString('id-ID')} lbr (inkl. insheet {insheetLembar}).</p>
            </div>

            {/* Insheet + Margin */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Insheet (lbr)</label>
                <input
                  type="number"
                  min={0}
                  value={insheetLembar}
                  onChange={(e) => setInsheetLembar(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Margin Laba (%)</label>
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
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Hasil & Rincian (lg:col-span-7) */}
        <div className="lg:col-span-7 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
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
                  Total HPP: Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[11px] font-bold">Final / pcs (+{marginPct}%)</span>
                <TrendingUp size={13} className="text-emerald-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                  Rp {result.hargaFinalPerPcs.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-emerald-700/80 mt-0.5">/ pcs (ROUNDUP puluhan)</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">Total Harga</span>
                <Wallet size={13} className="text-slate-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                  Rp {Math.round(result.totalHarga).toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  {oplahPcs.toLocaleString('id-ID')} pcs
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">Laba Total</span>
                <TrendingUp size={13} className="text-emerald-500" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
                  Rp {Math.round(result.labaTotal).toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Rp {Math.round(result.labaPerPcs).toLocaleString('id-ID')} / pcs
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
                  Rincian Biaya (BUKU!T7–AK7 → BI7)
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {oplahPcs.toLocaleString('id-ID')} pcs · {bahan} {nWarna}W {mesin}
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
                      Total HPP ({oplahPcs.toLocaleString('id-ID')} pcs — BUKU!BI7)
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
                  <h3 className="text-base font-bold tracking-tight">Panduan Simulator Sertifikat</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    1 Muka — Ac 230 / BC / Linen; Oliver / SM / Print Inter / Ryobi; Foil, Laminasi/UV, Kardus
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
                  Langkah Menggunakan Simulator Sertifikat
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    ['1. Bahan & Ukuran', 'Pilih Art Carton / BC Putih / Linen Crem (gramatur ikut file, bisa diubah), ukuran 21×29,7 atau 21,5×33.'],
                    ['2. Mesin & Warna', 'Oliver / SM / Print Inter / Ryobi (ganti mesin = insheet & kardus ikut pola file), warna 1–4, muka 1–2.'],
                    ['3. Finishing & Oplah', 'None / UV / Laminasi (min Rp 50.000), Foil √/X, Kardus √/X. Tier 100–3000 pcs atau custom.'],
                    ['4. Salin / Simpan', 'Klik Salin Penawaran untuk teks WA otomatis, atau simpan ke daftar kalkulasi.'],
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
                  Struktur Biaya Engine BUKU
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-white rounded border border-emerald-100 space-y-1">
                    <span className="font-bold text-emerald-900 block">Kertas &amp; Cetak:</span>
                    <p className="text-slate-600 leading-snug">
                      Plano = ceil(oplah/potongan + insheet/potongan); harga/rim dari gramatur × harga/kg. Offset: plate + min order + over; Print Inter: oplah × tarif Print.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-blue-100 space-y-1">
                    <span className="font-bold text-blue-900 block">Finishing &amp; Harga Final:</span>
                    <p className="text-slate-600 leading-snug">
                      Sisir selalu ditarik; laminasi/UV bila dipilih (min Rp 50.000); foil bila √; kardus bila √. Total + laba 30%, final ROUNDUP puluhan.
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
