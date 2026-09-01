'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  Layers,
  Settings2,
  Sliders,
  DollarSign,
  TrendingUp,
  Percent,
  Cpu,
  Info,
  CheckCircle2,
  FileText,
  RotateCcw,
  X,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Clock,
  ChevronRight,
  Copy,
  Check,
  Share2,
  Search,
  Filter,
  Calendar as CalendarIcon,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import {
  calculatePricelistSimulator,
  DEFAULT_MASTER_PARAMS,
  DEFAULT_MASTER_PARAMS_KLEM,
  SimulatorMasterParams,
  SimulatorOutput,
} from '@/lib/pricelist-simulator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';
import ManasikSimulator from './ManasikSimulator';
import YasinSimulator from './YasinSimulator';
import NotaSimulator from './NotaSimulator';
import BrosurSimulator from './BrosurSimulator';

export interface SavedSimulationItem {
  id: string;
  savedAt: string;
  title: string;
  modelKalender: string;
  bahan: string;
  ukuran: string;
  finishingJilid: 'Spiral' | 'Klem';
  oplah: number;
  pilihanMesin: 'Otomatis' | 'Oliver' | 'SM';
  marginPct: number;
  negoDiskonPct: number;
  customParams?: SimulatorMasterParams;
  summary: SimulatorOutput['summary'];
  mesinDigunakan: string;
}

const MODEL_OPTIONS = [
  { value: 'Eko Wulan (12 Lbr)', label: 'Eko Wulan (12 Lbr)', desc: '12 Lembar / Kalender' },
  { value: 'Dwi Wulan (6 Lbr)', label: 'Dwi Wulan (6 Lbr)', desc: '6 Lembar / Kalender' },
  { value: 'Tri Wulan (4 Lbr)', label: 'Tri Wulan (4 Lbr)', desc: '4 Lembar / Kalender' },
];

const UKURAN_OPTIONS = [
  { value: '32 x 48', label: '32 x 48 cm', desc: 'Plano 65x100 (Bagi 4)' },
  { value: '38 x 54', label: '38 x 54 cm', desc: 'Plano 79x109 (Bagi 4)' },
  { value: '46 x 64', label: '46 x 64 cm', desc: 'Plano 65x100 (Bagi 2)' },
  { value: '48 x 64', label: '48 x 64 cm', desc: 'Plano 65x100 (Bagi 2)' },
];

const MESIN_OPTIONS = [
  { value: 'Otomatis', label: 'Otomatis (Rekomendasi)', desc: '< 3000: Oliver, >= 3000: SM' },
  { value: 'Oliver', label: 'Oliver 58/72', desc: 'Kapasitas s/d 2.500 pcs' },
  { value: 'SM', label: 'Speedmaster (SM)', desc: 'Kapasitas besar >= 3.000 pcs' },
];

interface PricelistSimulatorProps {
  customParams: SimulatorMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<SimulatorMasterParams>>;
  setParamsForFinishing?: (mode: 'Spiral' | 'Klem', params: SimulatorMasterParams) => void;
  finishingJilid: 'Spiral' | 'Klem';
  onChangeFinishingJilid: (mode: 'Spiral' | 'Klem') => void;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
  paramsSpiral?: SimulatorMasterParams;
  paramsKlem?: SimulatorMasterParams;
  backupParamsSpiral?: SimulatorMasterParams | null;
  setBackupParamsSpiral?: (params: SimulatorMasterParams | null) => void;
  backupParamsKlem?: SimulatorMasterParams | null;
  setBackupParamsKlem?: (params: SimulatorMasterParams | null) => void;
}

export default function PricelistSimulator({
  customParams,
  setCustomParams,
  setParamsForFinishing,
  finishingJilid,
  onChangeFinishingJilid,
  onOpenMasterParam,
  activeSimulationId: propActiveSimId,
  setActiveSimulationId: propSetActiveSimId,
  activeSimulationTitle: propActiveSimTitle,
  setActiveSimulationTitle: propSetActiveSimTitle,
  paramsSpiral,
  paramsKlem,
  backupParamsSpiral,
  setBackupParamsSpiral,
  backupParamsKlem,
  setBackupParamsKlem,
}: PricelistSimulatorProps) {
  // Load initial category from parent state or localStorage
  const getInitialCategory = (): 'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026' => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sintak_pricelist_selected_category');
      if (saved === 'Kalender' || saved === 'Buku Manasik' || saved === 'Buku Yasin' || saved === 'Nota 1 Warna' || saved === 'Brosur 2026') {
        return saved as any;
      }
    }
    return 'Kalender';
  };

  const [activeProductCategory, setActiveProductCategory] = useState<'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026'>(getInitialCategory);

  // Keep category in sync with global localStorage triggers
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sintak_pricelist_selected_category');
      if (saved === 'Kalender' || saved === 'Buku Manasik' || saved === 'Buku Yasin' || saved === 'Nota 1 Warna' || saved === 'Brosur 2026') {
        setActiveProductCategory(saved as any);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Interval check as backup because window storage event only fires on other tabs
    const interval = setInterval(handleStorageChange, 500);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleCategoryChange = (category: 'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026') => {
    setActiveProductCategory(category);
    try {
      localStorage.setItem('sintak_pricelist_selected_category', category);
    } catch (e) {
      console.error(e);
    }
  };

  const [showSimulatorManual, setShowSimulatorManual] = useState(false);

  // Input states with persistent localStorage support (loaded in useEffect to prevent hydration mismatch)
  const [modelKalender, setModelKalender] = useState<string>('Eko Wulan (12 Lbr)');
  const [bahan, setBahan] = useState<string>('Art Paper 150');
  const [ukuran, setUkuran] = useState<string>('32 x 48');
  const [oplah, setOplah] = useState<number>(1500);
  const [pilihanMesin, setPilihanMesin] = useState<'Otomatis' | 'Oliver' | 'SM'>('Otomatis');
  const [marginPct, setMarginPct] = useState<number>(30);
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(4);

  // Load preferences from localStorage after mount (client-only)
  React.useEffect(() => {
    try {
      const savedModel = localStorage.getItem('sintak_sim_model');
      if (savedModel) setModelKalender(savedModel);

      const savedBahan = localStorage.getItem('sintak_sim_bahan');
      if (savedBahan) setBahan(savedBahan);

      const savedUkuran = localStorage.getItem('sintak_sim_ukuran');
      if (savedUkuran) setUkuran(savedUkuran);

      const savedOplah = localStorage.getItem('sintak_sim_oplah');
      if (savedOplah) setOplah(Number(savedOplah) || 1500);

      const savedMesin = localStorage.getItem('sintak_sim_mesin');
      if (savedMesin === 'Oliver' || savedMesin === 'SM' || savedMesin === 'Otomatis') {
        setPilihanMesin(savedMesin);
      }

      const savedMargin = localStorage.getItem('sintak_sim_margin');
      if (savedMargin) setMarginPct(Number(savedMargin) || 30);

      const savedNego = localStorage.getItem('sintak_sim_nego');
      if (savedNego) setNegoDiskonPct(Number(savedNego) || 4);
    } catch (e) {
      console.error('Failed to load simulator preferences:', e);
    }
  }, []);

  // Sync states to localStorage (debounced 400ms agar input responsif dan tidak lag)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('sintak_sim_model', modelKalender);
        localStorage.setItem('sintak_sim_bahan', bahan);
        localStorage.setItem('sintak_sim_ukuran', ukuran);
        localStorage.setItem('sintak_sim_oplah', String(oplah));
        localStorage.setItem('sintak_sim_mesin', pilihanMesin);
        localStorage.setItem('sintak_sim_margin', String(marginPct));
        localStorage.setItem('sintak_sim_nego', String(negoDiskonPct));
      } catch (e) {
        console.error('Failed to save simulator state to localStorage:', e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [modelKalender, bahan, ukuran, oplah, pilihanMesin, marginPct, negoDiskonPct]);

  // Quick preset oplah buttons
  const presetOplahs = [300, 500, 1000, 1500, 2000, 3000, 5000, 10000];

  const [savedSimulations, setSavedSimulations] = useState<SavedSimulationItem[]>([]);
  const [simulationTitle, setSimulationTitle] = useState('');
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const [internalActiveTitle, setInternalActiveTitle] = useState<string | null>(null);

  // Backup form input simulator sebelum riwayat dimuat
  const [backupFormInput, setBackupFormInput] = useState<{
    modelKalender: string;
    bahan: string;
    ukuran: string;
    oplah: number;
    pilihanMesin: 'Otomatis' | 'Oliver' | 'SM';
    marginPct: number;
    negoDiskonPct: number;
    finishingJilid: 'Spiral' | 'Klem';
  } | null>(null);

  const activeSimulationId = propActiveSimId !== undefined ? propActiveSimId : internalActiveId;
  const activeSimulationTitle = propActiveSimTitle !== undefined ? propActiveSimTitle : internalActiveTitle;

  const setActiveSimulationId = (id: string | null) => {
    if (propSetActiveSimId) propSetActiveSimId(id);
    else setInternalActiveId(id);
  };

  const setActiveSimulationTitle = (title: string | null) => {
    if (propSetActiveSimTitle) propSetActiveSimTitle(title);
    else setInternalActiveTitle(title);
  };

  const [showSavedListModal, setShowSavedListModal] = useState(false);
  const [savedSearchTerm, setSavedSearchTerm] = useState('');
  const [savedFilterFinishing, setSavedFilterFinishing] = useState<'ALL' | 'Spiral' | 'Klem'>('ALL');

  const filteredSavedSimulations = useMemo(() => {
    return savedSimulations.filter((sim) => {
      // 1. Filter Finishing
      if (savedFilterFinishing !== 'ALL' && sim.finishingJilid !== savedFilterFinishing) {
        return false;
      }
      // 2. Search Term
      if (!savedSearchTerm.trim()) return true;
      const q = savedSearchTerm.toLowerCase();
      return (
        sim.title.toLowerCase().includes(q) ||
        sim.modelKalender.toLowerCase().includes(q) ||
        sim.bahan.toLowerCase().includes(q) ||
        sim.ukuran.toLowerCase().includes(q) ||
        String(sim.oplah).includes(q)
      );
    });
  }, [savedSimulations, savedFilterFinishing, savedSearchTerm]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sintak_saved_simulations');
      if (raw) {
        const list: SavedSimulationItem[] = JSON.parse(raw);
        setSavedSimulations(list);

        // Jika activeSimulationId ada, sinkronkan input form dari data item tersebut
        if (activeSimulationId) {
          const item = list.find((s) => s.id === activeSimulationId);
          if (item) {
            setModelKalender(item.modelKalender);
            setBahan(item.bahan);
            setUkuran(item.ukuran);
            setOplah(item.oplah);
            setPilihanMesin(item.pilihanMesin);
            setMarginPct(item.marginPct);
            setNegoDiskonPct(item.negoDiskonPct);
            setSimulationTitle(item.title);
            if (onChangeFinishingJilid && item.finishingJilid) {
              onChangeFinishingJilid(item.finishingJilid);
            }
            if (item.customParams) {
              if (setParamsForFinishing) {
                setParamsForFinishing(item.finishingJilid, item.customParams);
              } else {
                setCustomParams(item.customParams);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load saved simulations:', e);
    }
  }, [activeSimulationId]);

  const handleSaveSimulation = () => {
    const defaultTitle = `${modelKalender.split(' ')[0]} - ${ukuran} cm (${oplah.toLocaleString('id-ID')} pcs - ${finishingJilid})`;
    const titleToUse = simulationTitle.trim() || defaultTitle;

    const newItem: SavedSimulationItem = {
      id: 'sim_' + Date.now(),
      savedAt: new Date().toISOString(),
      title: titleToUse,
      modelKalender,
      bahan,
      ukuran,
      finishingJilid,
      oplah,
      pilihanMesin,
      marginPct,
      negoDiskonPct,
      customParams: { ...customParams },
      summary: result.summary,
      mesinDigunakan: result.calculatedParams.mesinDigunakan,
    };

    const updated = [newItem, ...savedSimulations].slice(0, 50); // Maks 50 riwayat simulasi tersimpan
    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_simulations', JSON.stringify(updated));
      toast.success(`Simulasi "${titleToUse}" berhasil disimpan!`);
      setSimulationTitle('');
    } catch (e) {
      console.error('Failed to save simulation to localStorage:', e);
      toast.error('Gagal menyimpan hasil simulasi.');
    }
  };

  const handleLoadSimulation = (item: SavedSimulationItem) => {
    if (!backupFormInput) {
      setBackupFormInput({
        modelKalender,
        bahan,
        ukuran,
        oplah,
        pilihanMesin,
        marginPct,
        negoDiskonPct,
        finishingJilid,
      });
    }

    // 1. Ubah mode finishing
    onChangeFinishingJilid(item.finishingJilid);

    // 2. Pulihkan Master Parameters snapshot langsung ke profil yang bersangkutan
    if (item.customParams) {
      if (setParamsForFinishing) {
        setParamsForFinishing(item.finishingJilid, item.customParams);
      } else {
        setCustomParams(item.customParams);
      }
    }

    // 3. Pulihkan spesifikasi form simulator
    setModelKalender(item.modelKalender);
    setBahan(item.bahan);
    setUkuran(item.ukuran);
    setOplah(item.oplah);
    setPilihanMesin(item.pilihanMesin);
    setMarginPct(item.marginPct);
    setNegoDiskonPct(item.negoDiskonPct);

    // 4. Set state tracking simulasi aktif
    setActiveSimulationId(item.id);
    setActiveSimulationTitle(item.title);
    setSimulationTitle(item.title);

    setShowSavedListModal(false);
    toast.info(`Memuat simulasi: ${item.title}`);
  };

  const handleExitLoadedMode = () => {
    if (setBackupParamsSpiral) setBackupParamsSpiral(null);
    if (setBackupParamsKlem) setBackupParamsKlem(null);

    // Kembalikan input form simulator ke kondisi sebelum memuat riwayat
    if (backupFormInput) {
      setModelKalender(backupFormInput.modelKalender);
      setBahan(backupFormInput.bahan);
      setUkuran(backupFormInput.ukuran);
      setOplah(backupFormInput.oplah);
      setPilihanMesin(backupFormInput.pilihanMesin);
      setMarginPct(backupFormInput.marginPct);
      setNegoDiskonPct(backupFormInput.negoDiskonPct);
      onChangeFinishingJilid(backupFormInput.finishingJilid);
      setBackupFormInput(null);
    }

    setActiveSimulationId(null);
    setActiveSimulationTitle(null);
    setSimulationTitle('');
    toast.info('Keluar dari mode riwayat simulasi & data dikembalikan ke sesi aktif sebelumnya.');
  };

  const handleUpdateSavedSimulation = () => {
    if (!activeSimulationId) return;

    const titleToUse = simulationTitle.trim() || activeSimulationTitle || 'Simulasi Kalender';
    const updated = savedSimulations.map((sim) => {
      if (sim.id === activeSimulationId) {
        return {
          ...sim,
          title: titleToUse,
          modelKalender,
          bahan,
          ukuran,
          finishingJilid,
          oplah,
          pilihanMesin,
          marginPct,
          negoDiskonPct,
          customParams: { ...customParams },
          summary: result.summary,
          mesinDigunakan: result.calculatedParams.mesinDigunakan,
          savedAt: new Date().toISOString(),
        };
      }
      return sim;
    });

    setSavedSimulations(updated);
    setActiveSimulationTitle(titleToUse);
    try {
      localStorage.setItem('sintak_saved_simulations', JSON.stringify(updated));
      toast.success(`Perubahan pada "${titleToUse}" berhasil diperbarui!`);
    } catch (e) {
      console.error('Failed to update saved simulation:', e);
      toast.error('Gagal memperbarui simulasi tersimpan.');
    }
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSimulations.filter((s) => s.id !== id);
    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_simulations', JSON.stringify(updated));
      toast.success('Simulasi tersimpan berhasil dihapus.');
    } catch (err) {
      console.error('Failed to update localStorage:', err);
    }
  };

  const handleClearAllSaved = () => {
    if (confirm('Hapus semua riwayat simulasi yang tersimpan?')) {
      setSavedSimulations([]);
      try {
        localStorage.removeItem('sintak_saved_simulations');
        toast.success('Semua simulasi tersimpan telah dihapus.');
      } catch (err) {
        console.error('Failed to clear saved simulations:', err);
      }
    }
  };

  const result = useMemo(() => {
    return calculatePricelistSimulator({
      modelKalender,
      bahan,
      ukuran,
      finishingJilid,
      oplah: Math.max(1, oplah || 1),
      pilihanMesin,
      marginPct: marginPct / 100,
      negoDiskonPct: negoDiskonPct / 100,
      customParams,
    });
  }, [modelKalender, bahan, ukuran, finishingJilid, oplah, pilihanMesin, marginPct, negoDiskonPct, customParams]);

  const formatRp = (val: number) => {
    return Math.round(val || 0).toLocaleString('id-ID');
  };

  const [copied, setCopied] = useState(false);

  const handleCopyPenawaran = () => {
    const text = `*PENAWARAN ESTIMASI HARGA KALENDER 2027*
--------------------------------------------
• *Model*: ${modelKalender}
• *Bahan*: ${bahan}
• *Ukuran*: ${ukuran} cm
• *Finishing Jilid*: ${finishingJilid === 'Klem' ? 'Klem Seng (Jepit Kaleng)' : 'Spiral Kawat Gantung'}
• *Kuantitas (Oplah)*: ${oplah.toLocaleString('id-ID')} pcs
--------------------------------------------
*Rincian Harga*:
• HPP Modal: Rp ${formatRp(result.summary.hppPerPcs)} / pcs
• *Harga Jual (+${marginPct}%)*: *Rp ${formatRp(result.summary.hargaJualPerPcs)} / pcs*
• *Total Omset*: *Rp ${formatRp(result.summary.totalOmset)}*
• Batas Harga Nego (-${negoDiskonPct}%): Rp ${formatRp(result.summary.hargaNegoPerPcs)} / pcs
--------------------------------------------
_Generated by SINTAK (PT Buya Barokah)_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Ringkasan penawaran berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetParams = () => {
    setCustomParams(finishingJilid === 'Klem' ? DEFAULT_MASTER_PARAMS_KLEM : DEFAULT_MASTER_PARAMS);
  };

  return (
    <div className="flex flex-col gap-5 pb-6">
      {activeProductCategory === 'Buku Manasik' ? (
        <ManasikSimulator
          customParams={customParams as any}
          setCustomParams={setCustomParams as any}
          onOpenMasterParam={onOpenMasterParam}
        />
      ) : activeProductCategory === 'Buku Yasin' ? (
        <YasinSimulator
          customParams={customParams as any}
          setCustomParams={setCustomParams as any}
          onOpenMasterParam={onOpenMasterParam}
        />
      ) : activeProductCategory === 'Nota 1 Warna' ? (
        <NotaSimulator
          customParams={customParams as any}
          setCustomParams={setCustomParams as any}
          onOpenMasterParam={onOpenMasterParam}
        />
      ) : activeProductCategory === 'Brosur 2026' ? (
        <BrosurSimulator
          customParams={customParams as any}
          setCustomParams={setCustomParams as any}
          onOpenMasterParam={onOpenMasterParam}
        />
      ) : (
        <>
      {/* Top Banner / Card header - Soft Style */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">Simulator & Kalkulator Kalender Spiral & Klem 2027</h2>
              <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
                Hitung simulasi HPP, Harga Jual, Nego, Omset, dan Estimasi Profit secara akurat & transparan untuk kuantitas oplah kustom.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyPenawaran}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
              copied
                ? 'bg-emerald-700 text-white'
                : 'bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300'
            }`}
            title="Salin ringkasan spesifikasi & penawaran harga ke WhatsApp / Clipboard"
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copied ? 'Tersalin!' : 'Salin Penawaran'}</span>
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

      {/* Banner Status Mode Edit / Riwayat Dimuat */}
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
                <h4 className="text-xs font-bold text-amber-950">
                  {activeSimulationTitle}
                </h4>
              </div>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Menampilkan parameter saat disimpan. Anda dapat memperbarui dengan tarif hari ini atau menyimpan perubahan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (setParamsForFinishing) {
                  setParamsForFinishing('Spiral', DEFAULT_MASTER_PARAMS);
                  setParamsForFinishing('Klem', DEFAULT_MASTER_PARAMS_KLEM);
                } else {
                  setCustomParams(finishingJilid === 'Klem' ? DEFAULT_MASTER_PARAMS_KLEM : DEFAULT_MASTER_PARAMS);
                }
                toast.success('Parameter simulasi dikembalikan ke tarif Master Standar!');
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
              onClick={handleExitLoadedMode}
              className="px-3 py-1.5 bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <X size={14} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Form Inputs (Left) & Results Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Form Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Input Spesifikasi Order</h3>
            </div>

            {/* Model Kalender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">1. Model Kalender</label>
              <div className="grid grid-cols-3 gap-2">
                {MODEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setModelKalender(opt.value)}
                    className={`py-2 px-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      modelKalender === opt.value
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-xs">{opt.label.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bahan Kertas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">2. Bahan Kertas</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    value: 'HVS 70',
                    label: 'HVS 70 gsm',
                    desc: `Ekonomis (Rp ${formatRp(customParams.tarifHvs70)}/kg)`,
                  },
                  {
                    value: 'Art Paper 120',
                    label: 'Art Paper 120 gsm',
                    desc: `Standar Kilap (Rp ${formatRp(customParams.tarifAp120)}/kg)`,
                  },
                  {
                    value: 'Art Paper 150',
                    label: 'Art Paper 150 gsm',
                    desc: `Tebal & Premium (Rp ${formatRp(customParams.tarifAp150)}/kg)`,
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBahan(opt.value)}
                    className={`py-2 px-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      bahan === opt.value
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-xs">{opt.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ukuran Kalender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">3. Ukuran Jadi</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {UKURAN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUkuran(opt.value)}
                    className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      ukuran === opt.value
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-xs block">{opt.value}</span>
                    <span className="text-[9.5px] text-slate-500 block mt-0.5">cm</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pilihan Finishing Jilid: Spiral vs Klem */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">4. Finishing Jilid</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangeFinishingJilid('Spiral')}
                  className={`py-2 px-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    finishingJilid === 'Spiral'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="text-xs">Spiral Kawat Gantung</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Rp {customParams.tarifSpiralLubang}/cm (Min Rp {formatRp(customParams.tarifSpiralMin)})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeFinishingJilid('Klem')}
                  className={`py-2 px-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    finishingJilid === 'Klem'
                      ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold ring-1 ring-amber-500'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="text-xs">Klem Seng (Jepit Kaleng)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Rp {formatRp(result.calculatedParams.tarifKlemUnit)} / pcs
                  </span>
                </button>
              </div>
            </div>

            {/* Kuantitas / Oplah Custom */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">5. Kuantitas / Oplah (Pcs)</label>
                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {oplah.toLocaleString('id-ID')} Pcs
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ThousandInput
                  value={oplah}
                  allowDecimals={false}
                  onValueChange={(val) => setOplah(Math.max(1, val))}
                  placeholder="Ketik oplah..."
                  className="w-full px-3 py-2 text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Preset Oplah */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {presetOplahs.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setOplah(val)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      oplah === val
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {val.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            </div>

            {/* Pilihan Mesin Cetak */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">6. Pilihan Mesin Cetak</label>
              <div className="grid grid-cols-3 gap-2">
                {MESIN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPilihanMesin(opt.value as any)}
                    className={`py-2 px-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      pilihanMesin === opt.value
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-xs">{opt.label.split(' ')[0]}</span>
                    <span className="text-[9.5px] text-slate-500 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Margin & Diskon Nego */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Margin (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={marginPct}
                    onChange={(e) => setMarginPct(Number(e.target.value) || 0)}
                    className="w-full pl-3 pr-7 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Diskon Nego (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={negoDiskonPct}
                    onChange={(e) => setNegoDiskonPct(Number(e.target.value) || 0)}
                    className="w-full pl-3 pr-7 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parameter Teknis Terhitung (Specs Card) */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-2.5">
              <Cpu size={14} className="text-emerald-700" />
              <span>Parameter Teknis Produksi</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block">Kebutuhan Plano</span>
                <span className="font-bold text-emerald-900">
                  {Math.round(result.calculatedParams.totalPlanoDibutuhkan).toLocaleString('id-ID')} lbr
                  <span className="text-[10px] font-normal text-slate-500 block">
                    ({result.calculatedParams.kebutuhanRimPlano.toFixed(2)} rim)
                  </span>
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block">Plano & Potong</span>
                <span className="font-bold text-slate-900">
                  {result.calculatedParams.planoUkuran} (bagi {result.calculatedParams.planoPotong})
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block">Mesin Dipakai</span>
                <span className="font-bold text-slate-900">{result.calculatedParams.mesinDigunakan}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block">Area Cetak Jadi</span>
                <span className="font-bold text-slate-900">{result.calculatedParams.areaCetak} jenis</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block">Insheet Cetak</span>
                <span className="font-bold text-slate-900">{result.calculatedParams.insheet} lbr</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block">Biaya Plat/Unit</span>
                <span className="font-bold text-slate-900">Rp {formatRp(result.calculatedParams.biayaPlatUnit)}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block">Jilid Digunakan</span>
                <span className="font-bold text-slate-900">
                  {result.calculatedParams.finishingJilid === 'Klem' ? 'Klem Seng' : 'Spiral Gantung'}
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block">Ongkos Dasar Mesin</span>
                <span className="font-bold text-slate-900">Rp {formatRp(result.calculatedParams.ongkosCetakDasar)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Output Summary & Detailed Breakdown (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Key Output Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* HPP Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">HPP / Pcs</span>
                <DollarSign size={13} className="text-slate-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
                  Rp {formatRp(result.summary.hppPerPcs)}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Biaya modal per unit</span>
              </div>
            </div>

            {/* Harga Jual Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[11px] font-bold">Harga Jual (+{marginPct}%)</span>
                <TrendingUp size={13} className="text-emerald-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                  Rp {formatRp(result.summary.hargaJualPerPcs)}
                </span>
                <span className="block text-[10px] text-emerald-700/80 mt-0.5">Rekomendasi harga</span>
              </div>
            </div>

            {/* Harga Nego Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-800 mb-1">
                <span className="text-[11px] font-bold">Harga Nego (-{negoDiskonPct}%)</span>
                <Percent size={13} className="text-blue-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-blue-800 font-mono">
                  Rp {formatRp(result.summary.hargaNegoPerPcs)}
                </span>
                <span className="block text-[10px] text-blue-700/80 mt-0.5">Batas aman diskon</span>
              </div>
            </div>

            {/* Estimasi Profit Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">Total Profit (Jual)</span>
                <TrendingUp size={13} className="text-emerald-500" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                  Rp {formatRp(result.summary.estimasiProfit)}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Nego: Rp {formatRp(result.summary.estimasiProfitNego)}
                </span>
              </div>
            </div>
          </div>

          {/* Ringkasan Finansial Banner - Soft Emerald Style */}
          <div className="bg-emerald-50/80 border border-emerald-200/90 text-emerald-950 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100/80 rounded-lg text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <span className="text-emerald-700 block text-[11px] font-semibold">Total Omset Penjualan ({oplah.toLocaleString('id-ID')} pcs)</span>
                <span className="text-base font-bold font-mono text-emerald-900">
                  Rp {formatRp(result.summary.totalOmset)}
                </span>
              </div>
            </div>
            <div className="h-px sm:h-8 w-full sm:w-px bg-emerald-200"></div>
            <div>
              <span className="text-emerald-700 block text-[11px] font-semibold">Total Biaya Produksi</span>
              <span className="text-base font-bold font-mono text-emerald-900">
                Rp {formatRp(result.summary.totalBiayaProduksi)}
              </span>
            </div>
          </div>

          {/* Rincian 11 Komponen Biaya Produksi */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Rincian 11 Estimasi Komponen Biaya
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                Oplah: {oplah.toLocaleString('id-ID')} Pcs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2 px-3 w-10 text-center">No</th>
                    <th className="py-2 px-3">Komponen Biaya</th>
                    <th className="py-2 px-3 hidden sm:table-cell text-slate-400">Formula Kalkulasi</th>
                    <th className="py-2 px-3 text-right">Subtotal (Rp)</th>
                    <th className="py-2 px-3 text-right w-16">% Porsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.breakdown.map((item, idx) => {
                    const porsiPct = (item.amount / result.summary.totalBiayaProduksi) * 100;
                    return (
                      <tr key={item.name} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {item.name}
                        </td>
                        <td className="py-2 px-3 text-[10.5px] text-slate-500 font-mono hidden sm:table-cell truncate max-w-[240px]" title={item.formula}>
                          {item.formula}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                          {formatRp(item.amount)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-500">
                          {porsiPct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50/60 border-t-2 border-emerald-200 font-bold text-emerald-950">
                    <td colSpan={2} className="py-2.5 px-3 uppercase text-emerald-950 font-black text-[11px]">
                      TOTAL BIAYA PRODUKSI
                    </td>
                    <td className="hidden sm:table-cell"></td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-900 font-black text-sm">
                      Rp {formatRp(result.summary.totalBiayaProduksi)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-emerald-800">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Fitur Simpan Hasil Simulasi */}
          {activeSimulationId ? (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleUpdateSavedSimulation}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <BookmarkCheck size={15} />
                <span>Update Perubahan</span>
              </button>
              <button
                type="button"
                onClick={handleSaveSimulation}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                title="Simpan sebagai riwayat baru tanpa menimpa yang lama"
              >
                <Bookmark size={14} />
                <span>Simpan Baru</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSaveSimulation}
              className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <BookmarkCheck size={15} />
              <span>Simpan Hasil Simulasi</span>
            </button>
          )}
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
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Panduan Penggunaan Simulator & Kalkulator Kalender</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Cara kerja perhitungan instan, pemilihan spesifikasi mesin, serta interpretasi hasil biaya dan margin keuntungan
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
              {/* Alur Kerja Simulator */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Langkah Menggunakan Simulator
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">1. Pilih Spesifikasi</span>
                    <p className="text-[11px] text-slate-600">
                      Tentukan <strong>Model Kalender</strong> (12/6/4 Lbr), jenis <strong>Bahan Kertas</strong> (HVS 70 / AP 120 / AP 150), dan <strong>Ukuran Kalender</strong>.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">2. Tentukan Finishing Jilid</span>
                    <p className="text-[11px] text-slate-600">
                      Pilih antara <strong>Spiral Kawat Gantung</strong> (per cm lubang) atau <strong>Klem Seng</strong> (jepit kaleng per pcs).
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">3. Input Oplah & Mesin</span>
                    <p className="text-[11px] text-slate-600">
                      Ketik kuantitas <strong>Oplah (Pcs)</strong>. Pilihan mesin <strong>Otomatis</strong> akan memilihkan Oliver (&lt;3.000) atau SM (&ge;3.000).
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">4. Atur Margin & Nego</span>
                    <p className="text-[11px] text-slate-600">
                      Sesuaikan persentase target <strong>Margin Profit (+%)</strong> (default 30%) dan batas <strong>Diskon Nego (-%)</strong> (default 4%).
                    </p>
                  </div>
                </div>
              </div>

              {/* Penjelasan Pilihan Mesin Cetak */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-700" />
                  Logika Otomatis Mesin Cetak (Oliver vs SM)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-white rounded border border-blue-100 space-y-1">
                    <span className="font-bold text-blue-900 block">Mesin Oliver (Oplah &lt; 3.000 Pcs):</span>
                    <p className="text-slate-600 leading-snug">
                      Lebih hemat biaya plat CTP (Rp 45.000/plat) dan ongkos minimum (Rp 90.000/4 plat) dengan insheet plat 100 lembar. Sangat ekonomis untuk cetak skala kecil & menengah.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-purple-100 space-y-1">
                    <span className="font-bold text-purple-900 block">Mesin Speedmaster SM (Oplah &ge; 3.000 Pcs):</span>
                    <p className="text-slate-600 leading-snug">
                      Mampu mencetak 2x lipat area sekaligus (misal ukuran 32x48 masuk 4 lembar per putaran), sehingga jumlah plat lebih sedikit dan waktu cetak jauh lebih efisien untuk oplah besar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Memahami Kartu Hasil & Rincian 11 Biaya */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Memahami 4 Kartu Finansial & Target Margin
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 block">4 Kartu Finansial Utama:</span>
                    <ul className="space-y-1 text-slate-600 list-disc list-inside">
                      <li><strong>HPP per Pcs</strong>: Total biaya riil produksi dibagi kuantitas oplah.</li>
                      <li><strong>Harga Jual per Pcs</strong>: Nilai penawaran standar (+30% pembulatan ratusan).</li>
                      <li><strong>Harga Nego per Pcs</strong>: Batas aman harga diskon marketing (-4% pembulatan).</li>
                      <li><strong>Estimasi Profit Bersih</strong>: Total margin laba bersih yang didapat dari seluruh pesanan.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-1.5 text-emerald-950">
                    <span className="font-bold block">Rumus Finansial Baku:</span>
                    <ul className="space-y-1 text-[10.5px] font-mono text-emerald-900 list-disc list-inside">
                      <li><strong>HPP</strong>: Total Biaya Produksi / Oplah</li>
                      <li><strong>Harga Jual (+30%)</strong>: ROUNDUP(HPP * 1.30, -2)</li>
                      <li><strong>Harga Nego (-4%)</strong>: ROUNDUP(Harga Jual * 0.96, -2)</li>
                      <li><strong>Profit Total</strong>: (Harga - HPP) * Oplah</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tabel Pemetaan Lengkap 11 Komponen Biaya Produksi */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Rincian & Formula 11 Komponen Pembentuk Total HPP (Rumus: KALENDER!DA7)
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-800 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Komponen Biaya</th>
                        <th className="py-2.5 px-3">Cell di File Satuan (.xlsm)</th>
                        <th className="py-2.5 px-3">Formula / Logika Grafika</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">1. Bahan Kertas</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">Dashboard!D27</span> (Tarif/kg)<br />
                          Sheet <span className="font-mono text-emerald-700">Dashboard!E27</span> (PPN/Margin 5%)<br />
                          Sheet <span className="font-mono text-slate-600">KALENDER!BE29</span> (Harga per Rim)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          [(L*P*GSM)/20.000] * (Tarif + 5% PPN) / 500 * (Oplah+Insheet)*Lbr / Potong
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">2. Biaya Plat CTP</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">KALENDER!BG6</span> (Rp 45rb Oliver / Rp 78rb SM)<br />
                          Sheet <span className="font-mono text-slate-600">KALENDER!BG7</span> (=BG6 * Jml Plat)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          Ceil(Lembar / Area Cetak) * 4 Plat * Biaya Plat Unit
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">3. Ongkos Mesin Cetak</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">KALENDER!BJ6</span> (Min Order: Rp 90rb Oliver / Rp 310rb SM)<br />
                          Sheet <span className="font-mono text-emerald-700">KALENDER!BK7</span> (Drek Over: Rp 40 Oliver / Rp 100 SM)<br />
                          Sheet <span className="font-mono text-emerald-700">KALENDER!BM7</span> (Batas Min Drek: Oliver 1.000 / SM 3.000)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          (Jml Plat * Min Order) + (MAX(0, Oplah+Insheet - Batas) * Over * Jml Plat)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">4. Desain Kalender</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">Dashboard!D30</span> (Rp 30.000/lbr)<br />
                          Sheet <span className="font-mono text-slate-600">KALENDER!BD6:BD13</span>
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          Tarif Desain * Jumlah Lembar Kalender
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">5. Plat & Cetak Almanak</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">KALENDER!CF6</span> (Desain Almanak Rp 30.000)<br />
                          Sheet <span className="font-mono text-emerald-700">KALENDER!CI6</span> (1 Plat Almanak: Rp 45rb / Rp 78rb)<br />
                          Sheet <span className="font-mono text-emerald-700">KALENDER!CN6</span> (Cetak Almanak Dasar + Over)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          Desain Almanak + 1 Plat Unit + Ongkos Min (+ Over drek)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">6. Royalty Kalender</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">Dashboard!D41</span> (Rp 150/pcs)<br />
                          Sheet <span className="font-mono text-slate-600">KALENDER!CR6:CR13</span>
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          Tarif Royalty * Oplah
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">7. Potong Dasar</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">KALENDER!CT6</span> (Rp 2.000/lbr)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          (Tarif * Lembar) + (Tarif * (Lembar / IF(32x48, 4, 2)))
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">8. Susun / Colator</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">KALENDER!CW6</span> (Rp 40/55/70/75 per lbr per ukuran)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          Lembar * Tarif Colator * (Oplah + Insheet/2)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">9. Jilid (Spiral / Klem)</td>
                        <td className="py-2 px-3">
                          <strong>Spiral</strong>: <span className="font-mono text-emerald-700">KALENDER!CX6</span> (Rp 150/cm, min Rp 250rb)<br />
                          <strong>Klem</strong>: <span className="font-mono text-emerald-700">KALENDER!CY6</span> (32x48: Rp 350, 38x54: Rp 350, 46x64: Rp 480, 48x64: Rp 490)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          • Spiral: MAX(Min 250rb, Lebar * Tarif * (Oplah + 5))<br />
                          • Klem: (Oplah + 5 pcs) * Tarif Satuan Klem
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">10. Lakban & Packing</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">Dashboard!D40</span> (Rp 9.600/roll)<br />
                          Sheet <span className="font-mono text-slate-600">KALENDER!CV6:CV13</span> (Kapasitas: 8000/60 = 133.33 ikat)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          MAX(Tarif 1 Roll, ((Oplah / 50) / 133.33) * Tarif Roll)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">11. Transportasi</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">KALENDER!CU6</span> (Oliver: Rp 100.000 / SM: Rp 50.000)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          Biaya flat per job sesuai mesin cetak yang digunakan
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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

      {/* Modal Daftar Simulasi Tersimpan */}
      {showSavedListModal && (
        <div
          onClick={() => setShowSavedListModal(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Daftar Riwayat Simulasi Tersimpan</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Klik pada simulasi yang diinginkan untuk memuat kembali parameter ke simulator
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSavedListModal(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {/* Search & Filter Finishing Bar */}
              {savedSimulations.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pb-1 border-b border-slate-100">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari judul, model, bahan, ukuran, oplah..."
                      value={savedSearchTerm}
                      onChange={(e) => setSavedSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                    {savedSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setSavedSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Filter Jilid */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setSavedFilterFinishing('ALL')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        savedFilterFinishing === 'ALL'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua ({savedSimulations.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSavedFilterFinishing('Spiral')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        savedFilterFinishing === 'Spiral'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Spiral
                    </button>
                    <button
                      type="button"
                      onClick={() => setSavedFilterFinishing('Klem')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        savedFilterFinishing === 'Klem'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Klem
                    </button>
                  </div>
                </div>
              )}

              {savedSimulations.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Bookmark className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-600">Belum ada riwayat simulasi yang disimpan.</p>
                  <p className="text-[11px] text-slate-400">
                    Gunakan tombol &quot;Simpan Hasil Simulasi&quot; di bagian bawah simulator untuk menyimpan skenario hitungan.
                  </p>
                </div>
              ) : filteredSavedSimulations.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <p className="text-xs font-semibold text-slate-600">Tidak ada riwayat simulasi yang sesuai pencarian/filter.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSavedSearchTerm('');
                      setSavedFilterFinishing('ALL');
                    }}
                    className="text-[11px] text-emerald-700 font-bold underline cursor-pointer"
                  >
                    Reset Filter Pencarian
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {filteredSavedSimulations.map((sim) => {
                    const dateFormatted = new Date(sim.savedAt).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={sim.id}
                        onClick={() => handleLoadSimulation(sim)}
                        className="p-3.5 hover:bg-emerald-50/40 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 truncate">
                              {sim.title}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              sim.finishingJilid === 'Klem'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {sim.finishingJilid}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            <span>{sim.modelKalender}</span>
                            <span>•</span>
                            <span>{sim.bahan}</span>
                            <span>•</span>
                            <span>{sim.ukuran} cm</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700 font-mono">
                              {sim.oplah.toLocaleString('id-ID')} pcs
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[10.5px] text-slate-400">
                              <Clock size={11} />
                              {dateFormatted}
                            </span>
                          </div>

                          {/* Detail Ringkas Finansial */}
                          <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
                            <span className="text-slate-600">
                              HPP: <strong className="text-slate-800 font-bold">Rp {formatRp(sim.summary.hppPerPcs)}</strong>
                            </span>
                            <span className="text-emerald-700">
                              Jual: <strong className="font-bold">Rp {formatRp(sim.summary.hargaJualPerPcs)}</strong>
                            </span>
                            <span className="text-blue-700">
                              Nego: <strong className="font-bold">Rp {formatRp(sim.summary.hargaNegoPerPcs)}</strong>
                            </span>
                            <span className="text-emerald-800">
                              Profit: <strong className="font-bold">Rp {formatRp(sim.summary.estimasiProfit)}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            title="Hapus simulasi ini"
                            onClick={(e) => handleDeleteSaved(sim.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-700 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {savedSimulations.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearAllSaved}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                >
                  Hapus Semua Riwayat
                </button>
              ) : (
                <div></div>
              )}
              <button
                type="button"
                onClick={() => setShowSavedListModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all cursor-pointer shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
