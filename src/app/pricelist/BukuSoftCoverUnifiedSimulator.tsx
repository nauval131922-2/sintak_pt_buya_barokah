'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { saveCalculationToDb } from '@/lib/pricelist-db-sync';
import {
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
  BookCopy,
} from 'lucide-react';
import {
  calculateSoftCoverUnified,
  DEFAULT_SOFT_COVER_UNIFIED,
  SoftCoverUnifiedParams,
  SoftCoverUnifiedInput,
  SoftCoverLini,
  SoftCoverMukaType,
  SoftCoverWarnaType,
  SoftCoverFinishing,
  SavedSoftCoverUnifiedItem,
  SOFT_COVER_LINI_LABEL,
  SOFT_COVER_UKURANS,
  SoftCoverUkuran,
  SOFT_COVER_COVER_OPTIONS,
  SOFT_COVER_ISI_OPTIONS,
  resolveLiniCandidates,
  liniToSelectors,
  isCustomLini,
  defaultFinCustom,
  SoftCoverFinCustom,
  softCoverTiers,
  softCoverFinishingOptions,
} from '@/lib/buku-soft-cover-unified';
import { SOFT_COVER_CUSTOM_CONFIGS } from '@/lib/buku-soft-cover-custom-calculator';
import { toast } from '@/lib/toast';

export type { SavedSoftCoverUnifiedItem };

const DRAFT_KEY = 'sintak_buku_soft_cover_draft';
const LS_KEY = 'sintak_saved_buku_soft_cover_simulations';

const draftVal = (key: string, fallback: any) => {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return fallback;
    const v = JSON.parse(raw)[key];
    return v === undefined || v === null ? fallback : v;
  } catch { return fallback; }
};

const FINISHING_LABEL: Record<string, string> = {
  'None,': 'Tanpa Finishing',
  'UV Varnish,': 'UV Varnish',
  'Laminasi Glossy,': 'Laminasi Glossy',
  'Laminasi Doff,': 'Laminasi Doff',
  'Lem Bending,': 'Lem Bending',
  'UV Varnish + Bending,': 'UV Varnish + Bending',
  'Laminasi Glossy + Bending,': 'Laminasi Glossy + Bending',
  'Laminasi Doff + Bending,': 'Laminasi Doff + Bending',
  'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,': 'Full Paket',
};

interface BukuSoftCoverUnifiedSimulatorProps {
  customParams?: SoftCoverUnifiedParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<SoftCoverUnifiedParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

export default function BukuSoftCoverUnifiedSimulator({
  customParams = DEFAULT_SOFT_COVER_UNIFIED,
  setCustomParams,
  onOpenMasterParam,
  activeSimulationId: propActiveSimId,
  setActiveSimulationId: propSetActiveSimId,
  activeSimulationTitle: propActiveSimTitle,
  setActiveSimulationTitle: propSetActiveSimTitle,
}: BukuSoftCoverUnifiedSimulatorProps) {
  const [ukuran, setUkuran] = useState<SoftCoverUkuran>(() => draftVal('ukuran', '21 × 29,7'));
  const [mesinCover, setMesinCover] = useState<string>(() => draftVal('mesinCover', 'Print Inter'));
  const [mesinIsi, setMesinIsi] = useState<string>(() => draftVal('mesinIsi', 'Oliver'));
  const [sumberLini, setSumberLini] = useState<SoftCoverLini | null>(() => draftVal('sumberLini', null) ?? draftVal('lini', null));
  const [oplah, setOplah] = useState<number>(() => draftVal('oplah', 20));
  const [jumlahHalaman, setJumlahHalaman] = useState<number>(() => draftVal('jumlahHalaman', 32));
  const [mukaCover, setMukaCover] = useState<SoftCoverMukaType>(() => draftVal('mukaCover', '1 Muka'));
  const [warnaCover, setWarnaCover] = useState<SoftCoverWarnaType>(() => draftVal('warnaCover', '4 Warna'));
  const [warnaIsi, setWarnaIsi] = useState<SoftCoverWarnaType>(() => draftVal('warnaIsi', '1 Warna'));
  const [finishing, setFinishing] = useState<SoftCoverFinishing>(() => draftVal('finishing', 'None,'));
  const [marginPct, setMarginPct] = useState(() => draftVal('marginPct', customParams.marginDefaultPct ?? 30));
  const [finCustom, setFinCustom] = useState<SoftCoverFinCustom>(() => draftVal('finCustom', null) ?? defaultFinCustom('Klasik'));
  const [copiedQuote, setCopiedQuote] = useState(false);

  const [savedSimulations, setSavedSimulations] = useState<SavedSoftCoverUnifiedItem[]>([]);
  const [simulationTitle, setSimulationTitle] = useState('');
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const [internalActiveTitle, setInternalActiveTitle] = useState<string | null>(null);
  const [showSimulatorManual, setShowSimulatorManual] = useState(false);

  const candidates = resolveLiniCandidates(ukuran, mesinCover, mesinIsi);
  const lini: SoftCoverLini = (sumberLini && (candidates as SoftCoverLini[]).includes(sumberLini) ? sumberLini : candidates[0]) ?? 'Klasik';
  const tiers = softCoverTiers(lini);
  const finishingOptions = softCoverFinishingOptions(lini);

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
        const list: SavedSoftCoverUnifiedItem[] = JSON.parse(raw);
        setSavedSimulations(list);

        if (activeSimulationId) {
          const item = list.find((s) => s.id === activeSimulationId);
          if (item) {
            const inp = item.data.input as SoftCoverUnifiedInput;
            const sel = inp.lini ? liniToSelectors(inp.lini) : null;
            if (sel) {
              setUkuran(sel.ukuran);
              setMesinCover((inp as any).mesinCover ?? sel.mesinCover);
              setMesinIsi((inp as any).mesinIsi ?? sel.mesinIsi);
            }
            if (inp.lini) setSumberLini(inp.lini);
            setOplah(inp.oplah);
            setJumlahHalaman(inp.jumlahHalaman ?? 32);
            setMukaCover((inp as any).mukaCover ?? '1 Muka');
            setWarnaCover((inp as any).warnaCover ?? '4 Warna');
            setWarnaIsi((inp as any).warnaIsi ?? '1 Warna');
            setFinishing((inp.finishing ?? 'None,') as SoftCoverFinishing);
            setMarginPct(inp.marginPct);
            if ((inp as any).finCustom) setFinCustom((inp as any).finCustom);
            setSimulationTitle(item.title);
          }
        }
      }
      if (!activeSimulationId) {
        // Restore draft settingan (persist saat pindah tab)
        try {
          const rawDraft = localStorage.getItem(DRAFT_KEY);
          if (rawDraft) {
            const d = JSON.parse(rawDraft);
            if (d.ukuran) setUkuran(d.ukuran);
            else if (d.lini) {
              // Migrasi draft lama (era dropdown lini) → cascade.
              const sel = liniToSelectors(d.lini as SoftCoverLini);
              setUkuran(sel.ukuran); setMesinCover(sel.mesinCover); setMesinIsi(sel.mesinIsi);
              setSumberLini(d.lini);
            }
            if (d.mesinCover) setMesinCover(d.mesinCover);
            if (d.mesinIsi) setMesinIsi(d.mesinIsi);
            if (d.sumberLini) setSumberLini(d.sumberLini);
            if (d.oplah) setOplah(Number(d.oplah));
            if (d.jumlahHalaman) setJumlahHalaman(Number(d.jumlahHalaman));
            if (d.mukaCover) setMukaCover(d.mukaCover);
            if (d.warnaCover) setWarnaCover(d.warnaCover);
            if (d.warnaIsi) setWarnaIsi(d.warnaIsi);
            if (d.finishing) setFinishing(d.finishing);
            if (d.marginPct !== undefined) setMarginPct(Number(d.marginPct));
            if (d.finCustom) setFinCustom(d.finCustom);
            if (d.mesinCover !== undefined) setMesinCover(d.mesinCover);
            if (d.mesinIsi !== undefined) setMesinIsi(d.mesinIsi);
          }
        } catch { /* abaikan draft rusak */ }
      }
    } catch (e) {
      console.error('Failed to load buku soft cover simulations:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSimulationId]);

  // Auto-persist draft settingan simulator (tidak reset saat pindah tab)
  useEffect(() => {
    if (activeSimulationId) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ukuran, mesinCover, mesinIsi, sumberLini, oplah, jumlahHalaman, mukaCover, warnaCover, warnaIsi, finishing, marginPct, finCustom }));
    } catch { /* abaikan */ }
  }, [ukuran, mesinCover, mesinIsi, sumberLini, oplah, jumlahHalaman, mukaCover, warnaCover, warnaIsi, finishing, marginPct, finCustom, activeSimulationId]);

  // Ganti finishing tak-valid & reset toggle jasa saat lini hasil cascade berubah
  useEffect(() => {
    if (activeSimulationId) return; // jangan timpa restore riwayat
    if (!softCoverFinishingOptions(lini).includes(finishing)) setFinishing('None,');
    if (isCustomLini(lini)) setFinCustom(defaultFinCustom(lini));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lini]);

  const pickCascade = (u: SoftCoverUkuran, mc: string, mi: string) => {
    setUkuran(u); setMesinCover(mc); setMesinIsi(mi); setSumberLini(null);
  };

  const custom = isCustomLini(lini);
  const customCfg = custom ? SOFT_COVER_CUSTOM_CONFIGS[lini] : null;
  const input: SoftCoverUnifiedInput = custom
    ? { lini, oplah, jumlahHalaman, mukaCover, warnaCover, warnaIsi, finishing, marginPct, finCustom, mesinCover, mesinIsi }
    : { lini, oplah, jumlahHalaman, mukaCover, warnaCover, warnaIsi, finishing, marginPct };
  const result = useMemo(
    () => calculateSoftCoverUnified(input, customParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lini, oplah, jumlahHalaman, mukaCover, warnaCover, warnaIsi, finishing, marginPct, finCustom, mesinCover, mesinIsi, customParams]
  );

  const defaultTitle = () => `Buku Soft Cover ${SOFT_COVER_LINI_LABEL[lini]} ${jumlahHalaman} Hal (${oplah} pcs)`;

  const handleSaveSimulation = () => {
    const title = simulationTitle.trim() || defaultTitle();
    const newItem: SavedSoftCoverUnifiedItem = {
      id: 'buku_soft_cover_' + Date.now(),
      title,
      savedAt: new Date().toISOString(),
      data: result,
      paramsSnapshot: customParams,
    };
    const updated = [newItem, ...savedSimulations.slice(0, 49)];
    setSavedSimulations(updated);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      saveCalculationToDb({ ...newItem, category: 'Buku Soft Cover' });
    } catch (e) {
      console.error('Failed to save buku soft cover simulation:', e);
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
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      const targetItem = updated.find((x) => x.id === activeSimulationId);
      if (targetItem) saveCalculationToDb({ ...targetItem, category: 'Buku Soft Cover' });
    } catch (e) {
      console.error('Failed to update buku soft cover simulation:', e);
    }
    setActiveSimulationTitle(title);
    toast.success(`Perubahan "${title}" berhasil disimpan!`);
    setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
    setSimulationTitle('');
  };

  const ukuranLabel = custom && customCfg ? customCfg.ukuran.replace(' X ', ' × ').replace('x', '×')
    : lini === 'Klasik' || lini === 'Oliver-Oliver' || lini === 'Print-Oliver' || lini === 'Print-Print' ? '21 × 29,7' : '14,5 × 20,25';

  const handleCopyQuote = () => {
    const fmt = (n: number) => n.toLocaleString('id-ID');
    const text =
      `*PENAWARAN BUKU SOFT COVER*\n` +
      `*PT Buya Barokah*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Produk*: Buku Soft Cover ${ukuranLabel} cm ${jumlahHalaman} Hal\n` +
      `• *Lini*: ${SOFT_COVER_LINI_LABEL[lini]} — Cover ${mukaCover} ${warnaCover}, Isi ${warnaIsi}\n` +
      (custom ? `• *Mesin*: Cover ${mesinCover}, Isi ${mesinIsi}\n` : '') +
      `• *Finishing*: ${FINISHING_LABEL[finishing]} + Sisir\n` +
      `• *Kuantitas*: ${oplah} pcs\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Harga / pcs*: *Rp ${fmt(result.hargaJualPerPcs)}*\n` +
      `• *Total Penawaran*: *Rp ${fmt(result.totalHargaJual)}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Harga belum termasuk PPN._`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success('Penawaran harga Buku Soft Cover berhasil disalin ke WhatsApp clipboard!');
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const optBtn = (active: boolean) =>
    `py-2 px-2 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
      active
        ? 'border-slate-500 bg-slate-200 text-slate-900 shadow-xs'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
    }`;

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-140px)] min-h-0 space-y-3 pb-2">
      {/* Header */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <BookCopy className="w-5 h-5" />
          </div>
          <div>
              <h3 className="font-bold text-sm sm:text-base text-emerald-950 flex items-center gap-2">
                Simulator &amp; Kalkulator Buku Soft Cover
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                  Katalog 17–19–21–24
                </span>
              </h3>
              <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
                1 produk · 3 ukuran · 18 lini mesin (21×29,7 &amp; 14,5×20,25 &amp; 10,5×14,8) — HPP, harga, dan profit per pcs.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 min-h-0 pb-1">
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-5 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Input Spesifikasi Buku Soft Cover</h3>
            </div>

            {/* 1. Ukuran */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ukuran jadi (cm)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SOFT_COVER_UKURANS.map((u) => (
                  <button key={u} type="button" onClick={() => pickCascade(u, SOFT_COVER_COVER_OPTIONS[u].includes(mesinCover) ? mesinCover : SOFT_COVER_COVER_OPTIONS[u][0], SOFT_COVER_ISI_OPTIONS[u].includes(mesinIsi) ? mesinIsi : SOFT_COVER_ISI_OPTIONS[u][0])} className={optBtn(ukuran === u)}>
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Oplah ketik + Halaman */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Oplah (pcs) — ketik bebas
                </label>
                <input
                  type="number"
                  min={1}
                  value={oplah}
                  onChange={(e) => setOplah(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {tiers.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setOplah(t)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                        oplah === t
                          ? 'border-slate-500 bg-slate-200 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {t.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Halaman
                </label>
                <input
                  type="number"
                  min={1}
                  max={600}
                  step={1}
                  value={jumlahHalaman}
                  onChange={(e) => setJumlahHalaman(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 -mt-2">
              Cover {result.kebutuhanKertasCover} lbr plano · Isi {result.kebutuhanPlanoIsi} lbr plano
            </p>

            {/* Grup Cover */}
            <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-900 bg-sky-200/80 px-2 py-0.5 rounded">Cover</span>
                <label className="text-xs font-bold text-sky-900">Muka &amp; Warna</label>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-sky-900/80 mb-1">Mesin Cover</label>
                <div className="grid grid-cols-2 gap-2">
                  {SOFT_COVER_COVER_OPTIONS[ukuran].map((m) => (
                    <button key={m} type="button" onClick={() => pickCascade(ukuran, m, SOFT_COVER_ISI_OPTIONS[ukuran].includes(mesinIsi) ? mesinIsi : SOFT_COVER_ISI_OPTIONS[ukuran][0])} className={optBtn(mesinCover === m)}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Muka Cover</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['1 Muka', '2 Muka'] as const).map((m) => (
                      <button key={m} type="button" onClick={() => setMukaCover(m)} className={optBtn(mukaCover === m)}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Warna Cover</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['1 Warna', '2 Warna', '3 Warna', '4 Warna'] as const).map((w) => (
                      <button key={w} type="button" onClick={() => setWarnaCover(w)} className={optBtn(warnaCover === w)}>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Grup Isi */}
            <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-900 bg-violet-200/80 px-2 py-0.5 rounded">Isi</span>
                <label className="text-xs font-bold text-violet-900">Warna Isi</label>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-violet-900/80 mb-1">Mesin Isi</label>
                <div className="grid grid-cols-2 gap-2">
                  {SOFT_COVER_ISI_OPTIONS[ukuran].map((m) => (
                    <button key={m} type="button" onClick={() => pickCascade(ukuran, mesinCover, m)} className={optBtn(mesinIsi === m)}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['1 Warna', '2 Warna', '3 Warna', '4 Warna'] as const).map((w) => (
                  <button key={w} type="button" onClick={() => setWarnaIsi(w)} className={optBtn(warnaIsi === w)}>
                    {w.replace(' Warna', 'W')}
                  </button>
                ))}
              </div>
            </div>

            {/* File sumber hasil cascade */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                File sumber: {SOFT_COVER_LINI_LABEL[lini]} <span className="font-normal text-slate-500">(tier {tiers[0]}–{tiers[tiers.length - 1]} pcs)</span>
              </label>
              {candidates.length > 1 ? (
                <div className="grid grid-cols-1 gap-2">
                  {candidates.map((c) => (
                    <button key={c} type="button" onClick={() => setSumberLini(c)} className={optBtn(lini === c)}>
                      {SOFT_COVER_LINI_LABEL[c]}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 italic">
                  Otomatis ketemu 1 file Excel untuk kombinasi ini.
                </p>
              )}
            </div>

            {/* Grup Finishing */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">Finishing</span>
                <label className="text-xs font-bold text-amber-900">Catatan Finishing</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {finishingOptions.map((f) => (
                  <button key={f} type="button" onClick={() => setFinishing(f)} className={optBtn(finishing === f)}>
                    {FINISHING_LABEL[f]}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 italic">
                {lini === 'Klasik'
                  ? 'Klasik: 7 opsi (Glossy+Bending & full-paket #DIV/0! di file Klasik).'
                  : custom
                    ? 'Custom: 9 opsi + toggle jasa harian di bawah.'
                    : 'Offset: 9 opsi terkomputasi penuh.'}
              </p>
              {custom && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {([['lipat', 'Lipat'], ['sisir', 'Sisir'], ['susunKomplit', 'Susun Komplit'], ['kawat', 'Kawat Stiching'], ['stiching', 'Stiching'], ['susunStaples', 'Susun+Staples'], ['biayaStaples', 'Biaya Staples']] as [keyof SoftCoverFinCustom, string][]).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFinCustom((prev) => ({ ...prev, [k]: !prev[k] }))}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold text-center transition cursor-pointer ${
                        finCustom[k]
                          ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {finCustom[k] ? '✓ ' : ''}{label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Margin / Laba */}
            {custom ? (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-600">
                  Laba <strong>{customParams.marginDefaultPct ?? 30}%</strong> dari file Excel — harga ke puluhan. Tanpa nego.
                </p>
              </div>
            ) : (
            <div className="pt-2 border-t border-slate-100">
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
            )}
          </div>
        </div>

        {/* Kolom Kanan: Hasil */}
        <div className="lg:col-span-7 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          {/* 3 Kartu Finansial */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                <span className="text-[11px] font-bold">Harga Jual (+{custom ? result.marginPct : marginPct}%)</span>
                <TrendingUp size={13} className="text-emerald-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                  Rp {result.hargaJualPerPcs.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-emerald-700/80 mt-0.5">/ pcs</span>
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
                  Rincian Biaya {SOFT_COVER_LINI_LABEL[lini]}
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {oplah.toLocaleString('id-ID')} pcs · {jumlahHalaman} hal · {FINISHING_LABEL[finishing]}
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
                  <h3 className="text-base font-bold tracking-tight">Panduan Simulator Buku Soft Cover</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    1 produk · 3 ukuran · 18 lini mesin — pilih lini sesuai file Excel sumbernya
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
                    ['1. Ukuran & Mesin', 'Pilih ukuran (21×29,7 / 14,5×20,25 / 10,5×14,8), mesin cover & mesin isi. File sumber ketemu otomatis; kalau 1 kombinasi ada di beberapa file, pilih sumbernya.'],
                    ['2. Oplah & Spesifikasi', 'Ketik oplah bebas (chip = tier file) + halaman, muka & warna cover, warna isi. Oplah di luar tier = ekstrapolasi rumus file.'],
                    ['3. Finishing & Laba', 'Pilih catatan finishing (Klasik 7 opsi, offset & custom 9 opsi + toggle jasa harian di custom). Laba 30% — harga ke puluhan, tanpa nego.'],
                    ['4. Salin Penawaran', 'Klik Salin Penawaran untuk teks WA otomatis, atau Simpan Kalkulasi Ini ke Daftar Kalkulasi di bawah tabel rincian.'],
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
                  Struktur Biaya per Generasi Engine
                </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                    <div className="p-2.5 bg-white rounded border border-emerald-100 space-y-1">
                      <span className="font-bold text-emerald-900 block">Klasik Print Inter–Oliver (folder 17):</span>
                      <p className="text-slate-600 leading-snug">
                        Cover per lembar Rp 2.700, desain isi per halaman, ongkos plate dan cetak mengikuti mesin, biaya susun, staples, sisir, dan laminasi sesuai opsi.
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded border border-blue-100 space-y-1">
                      <span className="font-bold text-blue-900 block">Offset 7 lini (folder 17-21 &amp; 18):</span>
                      <p className="text-slate-600 leading-snug">
                        Kebutuhan kertas mengikuti kapasitas mesin, ongkos cetak mengikuti jumlah warna dan muka, finishing dan kemas mengikuti opsi yang dipilih.
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded border border-amber-100 space-y-1">
                      <span className="font-bold text-amber-900 block">Custom 10 lini (folder 19/21/24):</span>
                      <p className="text-slate-600 leading-snug">
                        Alternatif perhitungan dari file lain: jumlah lembar isi seperempat halaman, kebutuhan plano mengikuti mesin, toggle jasa harian, laba 30%. Detail sel per sel ada di Manual Pengguna tab Master Parameter.
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
