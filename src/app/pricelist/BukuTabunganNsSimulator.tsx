'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { saveCalculationToDb } from '@/lib/pricelist-db-sync';
import {
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  FileText,
  Share2,
  Check,
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
  calculateBukuTabunganNsHpp,
  DEFAULT_BUKU_TABUNGAN_NS_PARAMS,
  BukuTabunganNsMasterParams,
  BukuTabunganNsSimulatorInput,
  TabunganNsMesinCover,
  TabunganNsMesinIsi,
  TabunganNsFinishing,
  TABUNGAN_NS_MESIN_COVER,
  TABUNGAN_NS_MESIN_ISI,
  TABUNGAN_NS_FINISHING,
  TABUNGAN_NS_GRAMATUR_COVER,
  TABUNGAN_NS_GRAMATUR_ISI,
  BUKU_TABUNGAN_NS_TIERS,
  SavedBukuTabunganNsSimulationItem,
} from '@/lib/buku-tabungan-ns-calculator';
import { toast } from '@/lib/toast';

export type { SavedBukuTabunganNsSimulationItem };

const DRAFT_KEY = 'sintak_tabungan_ns_draft';

// Baca 1 field draft secara sinkron (aman SSR: fallback saat prerender).
// Dipakai lazy initializer useState agar remount (pindah tab) langsung
// melukis nilai draft tanpa menunggu effect — imun terhadap anomali
// penjadwalan effect/HMR. Cross-session & keluar-riwayat tetap via effect.
const draftVal = (key: string, fallback: any) => {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return fallback;
    const v = JSON.parse(raw)[key];
    return v === undefined || v === null ? fallback : v;
  } catch { return fallback; }
};

interface BukuTabunganNsSimulatorProps {
  customParams?: BukuTabunganNsMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<BukuTabunganNsMasterParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

export default function BukuTabunganNsSimulator({
  customParams = DEFAULT_BUKU_TABUNGAN_NS_PARAMS,
  setCustomParams,
  onOpenMasterParam,
  activeSimulationId: propActiveSimId,
  setActiveSimulationId: propSetActiveSimId,
  activeSimulationTitle: propActiveSimTitle,
  setActiveSimulationTitle: propSetActiveSimTitle,
}: BukuTabunganNsSimulatorProps) {
  const [oplahPcs, setOplahPcs] = useState<number>(() => draftVal('oplahPcs', 1000));
  const [jumlahHalaman, setJumlahHalaman] = useState<number>(() => draftVal('jumlahHalaman', 24));
  const [mukaCover, setMukaCover] = useState<1 | 2>(() => draftVal('mukaCover', 1));
  const [warnaCover, setWarnaCover] = useState<1 | 2 | 3 | 4>(() => draftVal('warnaCover', 4));
  const [mesinCover, setMesinCover] = useState<TabunganNsMesinCover>(() => draftVal('mesinCover', 'Otomatis'));
  const [bahanCover, setBahanCover] = useState<string>(() => draftVal('bahanCover', 'Art Carton'));
  const [gramaturCover, setGramaturCover] = useState<number>(() => draftVal('gramaturCover', 260));
  const [warnaIsi, setWarnaIsi] = useState<1 | 2 | 3 | 4>(() => draftVal('warnaIsi', 1));
  const [mesinIsi, setMesinIsi] = useState<TabunganNsMesinIsi>(() => draftVal('mesinIsi', 'Otomatis'));
  const [bahanIsi, setBahanIsi] = useState<string>(() => draftVal('bahanIsi', 'HVS'));
  const [gramaturIsi, setGramaturIsi] = useState<number>(() => draftVal('gramaturIsi', 70));
  const [finishing, setFinishing] = useState<TabunganNsFinishing>(() => draftVal('finishing', 'Laminasi Glossy,'));
  const [jahitAktif, setJahitAktif] = useState(() => draftVal('jahitAktif', true));
  const [pisauPoundAktif, setPisauPoundAktif] = useState(() => draftVal('pisauPoundAktif', true));
  const [jasaPoundAktif, setJasaPoundAktif] = useState(() => draftVal('jasaPoundAktif', true));
  const [sisirAktif, setSisirAktif] = useState(() => draftVal('sisirAktif', false));
  const [kardusAktif, setKardusAktif] = useState(() => draftVal('kardusAktif', true));
  const [insheetCover, setInsheetCover] = useState<number>(() => draftVal('insheetCover', 15));
  const [insheetIsi, setInsheetIsi] = useState<number>(() => draftVal('insheetIsi', 30));
  const [marginPct, setMarginPct] = useState(() => draftVal('marginPct', 30));
  const [copiedQuote, setCopiedQuote] = useState(false);

  const [savedSimulations, setSavedSimulations] = useState<SavedBukuTabunganNsSimulationItem[]>([]);
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

  const applyInput = (inp: BukuTabunganNsSimulatorInput) => {
    setOplahPcs(inp.oplahPcs); setJumlahHalaman(inp.jumlahHalaman); setMukaCover(inp.mukaCover);
    setWarnaCover(inp.warnaCover); setMesinCover(inp.mesinCover); setBahanCover(inp.bahanCover);
    setGramaturCover(inp.gramaturCover); setWarnaIsi(inp.warnaIsi); setMesinIsi(inp.mesinIsi);
    setBahanIsi(inp.bahanIsi); setGramaturIsi(inp.gramaturIsi); setFinishing(inp.finishing);
    setJahitAktif(inp.jahitAktif); setPisauPoundAktif(inp.pisauPoundAktif); setJasaPoundAktif(inp.jasaPoundAktif);
    setSisirAktif(inp.sisirAktif); setKardusAktif(inp.kardusAktif);
    setInsheetCover(inp.insheetCover); setInsheetIsi(inp.insheetIsi); setMarginPct(inp.marginPct);
  };

  // Draft persist (tidak reset saat pindah tab; skip saat Mode Edit Riwayat)
  useEffect(() => {
    if (activeSimulationId) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) applyInput(JSON.parse(raw));
    } catch { /* abaikan draft rusak */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSimulationId]);
  useEffect(() => {
    if (activeSimulationId) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        oplahPcs, jumlahHalaman, mukaCover, warnaCover, mesinCover, bahanCover, gramaturCover,
        warnaIsi, mesinIsi, bahanIsi, gramaturIsi, finishing, jahitAktif, pisauPoundAktif,
        jasaPoundAktif, sisirAktif, kardusAktif, insheetCover, insheetIsi, marginPct,
      }));
    } catch { /* abaikan */ }
  }, [oplahPcs, jumlahHalaman, mukaCover, warnaCover, mesinCover, bahanCover, gramaturCover, warnaIsi, mesinIsi, bahanIsi, gramaturIsi, finishing, jahitAktif, pisauPoundAktif, jasaPoundAktif, sisirAktif, kardusAktif, insheetCover, insheetIsi, marginPct, activeSimulationId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sintak_saved_buku_tabungan_ns_simulations');
      if (raw) {
        const list: SavedBukuTabunganNsSimulationItem[] = JSON.parse(raw);
        setSavedSimulations(list);
        if (activeSimulationId) {
          const item = list.find((s) => s.id === activeSimulationId);
          if (item) { applyInput(item.data.input); setSimulationTitle(item.title); }
        }
      }
    } catch (e) {
      console.error('Failed to load saved buku tabungan ns simulations:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSimulationId]);

  const input: BukuTabunganNsSimulatorInput = useMemo(() => ({
    oplahPcs, jumlahHalaman, mukaCover, warnaCover, mesinCover, bahanCover, gramaturCover,
    warnaIsi, mesinIsi, bahanIsi, gramaturIsi, finishing, jahitAktif, pisauPoundAktif,
    jasaPoundAktif, sisirAktif, kardusAktif, insheetCover, insheetIsi, marginPct,
  }), [oplahPcs, jumlahHalaman, mukaCover, warnaCover, mesinCover, bahanCover, gramaturCover, warnaIsi, mesinIsi, bahanIsi, gramaturIsi, finishing, jahitAktif, pisauPoundAktif, jasaPoundAktif, sisirAktif, kardusAktif, insheetCover, insheetIsi, marginPct]);

  const result = useMemo(() => calculateBukuTabunganNsHpp(input, customParams), [input, customParams]);
  void setCustomParams;

  const defaultTitle = () => `Buku Tabungan NS ${oplahPcs}pcs ${result.mesinIsiEfektif}`;

  const handleSaveSimulation = () => {
    const title = simulationTitle.trim() || defaultTitle();
    const newItem: SavedBukuTabunganNsSimulationItem = {
      id: 'buku_tabungan_ns_' + Date.now(), title, savedAt: new Date().toISOString(),
      data: result, paramsSnapshot: customParams,
    };
    const updated = [newItem, ...savedSimulations.slice(0, 49)];
    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_buku_tabungan_ns_simulations', JSON.stringify(updated));
      saveCalculationToDb({ ...newItem, category: 'Buku Tabungan NS' });
    } catch (e) { console.error('Failed to save buku tabungan ns simulation:', e); }
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
      localStorage.setItem('sintak_saved_buku_tabungan_ns_simulations', JSON.stringify(updated));
      const targetItem = updated.find((x) => x.id === activeSimulationId);
      if (targetItem) saveCalculationToDb({ ...targetItem, category: 'Buku Tabungan NS' });
    } catch (e) { console.error('Failed to update buku tabungan ns simulation:', e); }
    setActiveSimulationTitle(title);
    toast.success(`Perubahan "${title}" berhasil disimpan!`);
    setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
    setSimulationTitle('');
  };

  const handleCopyQuote = () => {
    const fmt = (n: number) => Math.round(n).toLocaleString('id-ID');
    const text =
      `*PENAWARAN BUKU TABUNGAN NON SECURITY*\n` +
      `*PT Buya Barokah*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Produk*: Buku Tabungan NS 9×14,5 cm ${jumlahHalaman} Hal\n` +
      `• *Spesifikasi*: Cover ${bahanCover} ${gramaturCover} gsm ${warnaCover} Warna ${mukaCover} Muka (Cetak ${result.mesinCoverEfektif}), Isi ${bahanIsi} ${gramaturIsi} gsm ${warnaIsi} Warna (Cetak ${result.mesinIsiEfektif}), ${finishing.replace(/,$/, '')}${jahitAktif ? ', Jahit' : ''}${kardusAktif ? ', Kardus' : ''}\n` +
      `• *Kuantitas*: ${oplahPcs.toLocaleString('id-ID')} pcs\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Harga / Pcs*: *Rp ${fmt(result.hargaFinalPerPcs)}*\n` +
      `• *Total Penawaran*: *Rp ${fmt(result.totalHarga)}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Harga belum termasuk PPN._`;
    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success('Penawaran harga Buku Tabungan NS berhasil disalin!');
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const optBtn = (active: boolean) =>
    `py-1.5 px-2 rounded-lg border text-[11px] font-bold text-center transition cursor-pointer ${
      active ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
    }`;
  const toggleBtn = (on: boolean) =>
    `flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
      on ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-400'
    }`;
  const numInput = 'w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none';
  const lbl = 'block text-xs font-bold text-slate-700 mb-1';
  void Layers;

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
              Simulator &amp; Kalkulator Buku Tabungan Non Security
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">Katalog 14</span>
            </h3>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              9 × 14,5 cm · Cover {result.mesinCoverEfektif} · Isi {result.mesinIsiEfektif} · {oplahPcs.toLocaleString('id-ID')} pcs → Rp {result.hargaFinalPerPcs.toLocaleString('id-ID')}/pcs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={handleCopyQuote}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${copiedQuote ? 'bg-emerald-700 text-white' : 'bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300'}`}>
            {copiedQuote ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copiedQuote ? 'Tersalin!' : 'Salin Penawaran'}</span>
          </button>
          <button type="button" onClick={() => setShowSimulatorManual(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all shadow-2xs cursor-pointer">
            <Info size={14} /><span>Panduan</span>
          </button>
          {onOpenMasterParam && (
            <button type="button" onClick={onOpenMasterParam}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all shadow-2xs cursor-pointer">
              <Settings2 size={14} /><span>Master Parameter</span>
            </button>
          )}
        </div>
      </div>

      {activeSimulationId && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-200 text-amber-900 rounded-lg"><Bookmark className="w-4 h-4 fill-amber-700" /></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">Mode Riwayat Aktif</span>
                <h4 className="text-xs font-bold text-amber-950">{activeSimulationTitle}</h4>
              </div>
              <p className="text-[11px] text-amber-800/90 mt-0.5">Anda sedang melihat atau mengedit data dari riwayat simulasi yang dimuat.</p>
            </div>
          </div>
          <button type="button" onClick={() => { setActiveSimulationId(null); setActiveSimulationTitle(null); setSimulationTitle(''); }}
            className="px-3 py-1.5 bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 shrink-0">
            <X size={14} /><span>Keluar</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 min-h-0 pb-1">
        {/* Kolom Kiri: Form */}
        <div className="lg:col-span-5 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Input Spesifikasi</h3>
            </div>

            <div>
              <label className={lbl}>Kuantitas Oplah (pcs) — Master!D7</label>
              <div className="grid grid-cols-2 gap-2">
                <select value={BUKU_TABUNGAN_NS_TIERS.includes(oplahPcs) ? oplahPcs : 'custom'}
                  onChange={(e) => { const v = e.target.value; if (v !== 'custom') setOplahPcs(Number(v)); }}
                  className={`${numInput} cursor-pointer`}>
                  {BUKU_TABUNGAN_NS_TIERS.map((t) => <option key={t} value={t}>{t.toLocaleString('id-ID')} pcs</option>)}
                  {!BUKU_TABUNGAN_NS_TIERS.includes(oplahPcs) && <option value="custom">{oplahPcs.toLocaleString('id-ID')} pcs (custom)</option>}
                </select>
                <input type="number" min={1} max={20000} step={10} value={oplahPcs}
                  onChange={(e) => setOplahPcs(Math.max(1, Number(e.target.value) || 1))} className={numInput} placeholder="Custom..." />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Plano cover {result.kebutuhanCoverPlano} lbr · Plano isi {result.kebutuhanIsiPlano} lbr</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={lbl}>Halaman</label>
                <input type="number" min={4} step={4} value={jumlahHalaman}
                  onChange={(e) => setJumlahHalaman(Math.max(4, Number(e.target.value) || 24))} className={numInput} />
              </div>
              <div>
                <label className={lbl}>Insheet Cover</label>
                <input type="number" min={0} value={insheetCover}
                  onChange={(e) => setInsheetCover(Math.max(0, Number(e.target.value) || 0))} className={numInput} />
              </div>
              <div>
                <label className={lbl}>Insheet Isi</label>
                <input type="number" min={0} value={insheetIsi}
                  onChange={(e) => setInsheetIsi(Math.max(0, Number(e.target.value) || 0))} className={numInput} />
              </div>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-900 bg-sky-200/80 px-2 py-0.5 rounded">Cover</span>
                <label className="text-xs font-bold text-sky-900">Cetak Cover — Master!D16 {mesinCover === 'Otomatis' ? '(otomatis: Print Inter)' : ''}</label>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {TABUNGAN_NS_MESIN_COVER.map((m) => (
                  <button key={m} type="button" onClick={() => setMesinCover(m)} className={optBtn(mesinCover === m)}>
                    {m === 'Otomatis' ? '⚙️ Otomatis' : m}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                {([1, 2] as const).map((n) => <button key={n} type="button" onClick={() => setMukaCover(n)} className={optBtn(mukaCover === n)}>{n} Muka</button>)}
                {([1, 2, 3, 4] as const).map((n) => <button key={n} type="button" onClick={() => setWarnaCover(n)} className={optBtn(warnaCover === n)}>{n} Warna</button>)}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <select value={bahanCover} onChange={(e) => setBahanCover(e.target.value)} className={`${numInput} cursor-pointer`}>
                  {['HVS', 'Imperial', 'Book Paper', 'Art Paper', 'Art Carton', 'Duplex', 'Vp', 'Ivory'].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={gramaturCover} onChange={(e) => setGramaturCover(Number(e.target.value))} className={`${numInput} cursor-pointer`}>
                  {TABUNGAN_NS_GRAMATUR_COVER.map((g) => <option key={g} value={g}>{g} gsm</option>)}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-900 bg-violet-200/80 px-2 py-0.5 rounded">Isi</span>
                <label className="text-xs font-bold text-violet-900">Cetak Isi — Master!D25 {mesinIsi === 'Otomatis' ? `(otomatis: ${oplahPcs < 250 ? 'Print Buya' : 'Ryobi'})` : ''}</label>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {TABUNGAN_NS_MESIN_ISI.map((m) => (
                  <button key={m} type="button" onClick={() => setMesinIsi(m)} className={optBtn(mesinIsi === m)}>
                    {m === 'Otomatis' ? '⚙️ Otomatis' : m}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                {([1, 2, 3, 4] as const).map((n) => <button key={n} type="button" onClick={() => setWarnaIsi(n)} className={optBtn(warnaIsi === n)}>{n} Warna</button>)}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <select value={bahanIsi} onChange={(e) => setBahanIsi(e.target.value)} className={`${numInput} cursor-pointer`}>
                  {['HVS', 'Imperial', 'Book Paper', 'Art Paper', 'QPP'].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={gramaturIsi} onChange={(e) => setGramaturIsi(Number(e.target.value))} className={`${numInput} cursor-pointer`}>
                  {TABUNGAN_NS_GRAMATUR_ISI.map((g) => <option key={g} value={g}>{g} gsm</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={lbl}>Finishing — Master!D29</label>
              <select value={finishing} onChange={(e) => setFinishing(e.target.value as TabunganNsFinishing)} className={`${numInput} cursor-pointer`}>
                {TABUNGAN_NS_FINISHING.map((f) => <option key={f} value={f}>{f.replace(/,$/, '')}</option>)}
              </select>
            </div>

            <div>
              <label className={lbl}>Toggle jasa (BUKU!BJ26/BL26/BM26/BQ26/DA28)</label>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setJahitAktif(!jahitAktif)} className={toggleBtn(jahitAktif)}>Jahit {jahitAktif ? '√' : 'X'}</button>
                <button type="button" onClick={() => setPisauPoundAktif(!pisauPoundAktif)} className={toggleBtn(pisauPoundAktif)}>Pisau {pisauPoundAktif ? '√' : 'X'}</button>
                <button type="button" onClick={() => setJasaPoundAktif(!jasaPoundAktif)} className={toggleBtn(jasaPoundAktif)}>Pound {jasaPoundAktif ? '√' : 'X'}</button>
              </div>
              <div className="flex gap-1.5 mt-1.5">
                <button type="button" onClick={() => setSisirAktif(!sisirAktif)} className={toggleBtn(sisirAktif)}>Sisir {sisirAktif ? '√' : 'X'}</button>
                <button type="button" onClick={() => setKardusAktif(!kardusAktif)} className={toggleBtn(kardusAktif)}>Kardus {kardusAktif ? '√' : 'X'}</button>
              </div>
            </div>

            <div>
              <label className={lbl}>Margin Profit (%) — Master!E37</label>
              <div className="relative">
                <input type="number" min={0} max={100} value={marginPct}
                  onChange={(e) => setMarginPct(Number(e.target.value) || 0)} className={`${numInput} pr-7`} />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Hasil */}
        <div className="lg:col-span-7 h-full min-h-0 overflow-y-auto pr-1.5 pb-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">HPP / pcs</span><DollarSign size={13} className="text-slate-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-800 font-mono">Rp {Math.round(result.hppPerPcs).toLocaleString('id-ID')}</span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Total: Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[11px] font-bold">Final (+{marginPct}%)</span><TrendingUp size={13} className="text-emerald-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">Rp {result.hargaFinalPerPcs.toLocaleString('id-ID')}</span>
                <span className="block text-[10px] text-emerald-700/80 mt-0.5">/ pcs (ROUNDUP puluhan)</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">Total Harga</span><TrendingUp size={13} className="text-emerald-500" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">Rp {Math.round(result.totalHarga).toLocaleString('id-ID')}</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Laba: Rp {Math.round(result.totalLaba).toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">Plano Cover/Isi</span><Wallet size={13} className="text-slate-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-800 font-mono">{result.kebutuhanCoverPlano} / {result.kebutuhanIsiPlano}</span>
                <span className="block text-[10px] text-slate-400 mt-0.5">lbr plano (R7/AP7)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Rincian Biaya HPP (BUKU!DC7)</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {oplahPcs.toLocaleString('id-ID')} pcs · {jumlahHalaman} hal · {result.mesinCoverEfektif}/{result.mesinIsiEfektif}
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
                    <tr key={idx} className={`hover:bg-slate-50/60 transition-colors ${item.diLuarTotal ? 'bg-slate-50/50 text-slate-400' : ''}`}>
                      <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-800 font-sans">{item.nama}</td>
                      <td className="py-2 px-3 text-slate-500 text-[10.5px] font-sans">{item.keterangan}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">Rp {Math.round(item.nominal).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right text-slate-500">{(item.pct * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/90 font-bold border-t border-slate-200 text-xs">
                    <td colSpan={3} className="py-2.5 px-3 text-slate-800 font-sans">Total HPP Biaya Produksi ({oplahPcs.toLocaleString('id-ID')} pcs)</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm">Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="pt-1">
            {activeSimulationId ? (
              <div className="flex items-center gap-2 w-full">
                <button type="button" onClick={handleUpdateSavedSimulation}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                  <BookmarkCheck size={15} /><span>Update Perubahan</span>
                </button>
                <button type="button" onClick={handleSaveSimulation}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                  <Bookmark size={14} /><span>Simpan Baru</span>
                </button>
              </div>
            ) : (
              <button type="button" onClick={handleSaveSimulation}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
                <Bookmark size={16} /><span>Simpan Kalkulasi Ini ke Daftar Kalkulasi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showSimulatorManual && (
        <div onClick={() => setShowSimulatorManual(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200"><Calculator className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Panduan Simulator Buku Tabungan NS</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">9 × 14,5 cm · Cover Print Inter · Isi Otomatis (Buya/Ryobi) · 15 tier 50–1500 pcs</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowSimulatorManual(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-all cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>Langkah Menggunakan Simulator
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    ['1. Oplah & Halaman', 'Pilih tier 50–1500 pcs atau custom; isi jumlah halaman (default 24 = 6 lbr). Oplah <250 otomatis isi Print Buya, ≥250 Ryobi.'],
                    ['2. Mesin & Warna', 'Cover default Print Inter 1 Muka 4 Warna; Isi default 1 Warna. Tombol ⚙️ Otomatis atau pilih mesin offset manual (Plat/Min/Drek berlaku).'],
                    ['3. Finishing & Toggle', 'Pilih 1 dari 9 opsi Master!D29 (menggerakkan SpotUV/Emboss/Bending/Laminasi/Sring otomatis) + toggle √/X Jahit/Pisau/Pound/Sisir/Kardus.'],
                    ['4. Margin & Simpan', 'Atur laba % (default 30), salin penawaran WA atau simpan kalkulasi ke daftar.'],
                  ].map(([title, desc]) => (
                    <div key={title} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="font-bold text-emerald-800 text-xs">{title}</span>
                      <p className="text-[11px] text-slate-600">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Struktur Rincian HPP (BUKU!DC7)</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-white rounded border border-emerald-100 space-y-1">
                    <span className="font-bold text-emerald-900 block">Kertas &amp; Cetak:</span>
                    <p className="text-slate-600 leading-snug">Cover plano R7 + kertas ream W29 (offset) / jasa A3+ (digital); Plat/Min/Drek per mesin + over (Ryobi Q−500, Oliver Q−1000, SM Q−3000). Isi plano AP7 + kertas AU29; Buya 350×AO7, Inter (AR2×2)×AP7. Desain cover flat + isi per lembar.</p>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-blue-100 space-y-1">
                    <span className="font-bold text-blue-900 block">Jasa &amp; Packing:</span>
                    <p className="text-slate-600 leading-snug">Jasa UMR/25 (Susun-Lipat, Jahit min 250rb, Pound min 50rb, SpotUV, Emboss, Sring) + Pisau Pound + Bending/Laminasi (min 50rb, kombi min 100rb) + Kardus+Lakban. Quirk Excel: Pound triple-count (BN7+BM7+BL7) dipertahankan 1:1.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button type="button" onClick={() => setShowSimulatorManual(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all cursor-pointer shadow-xs">Tutup Panduan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
