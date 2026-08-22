'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import {
  calculatePricelistSimulator,
  DEFAULT_MASTER_PARAMS,
  SimulatorMasterParams,
} from '@/lib/pricelist-simulator';
import ThousandInput from '@/components/ThousandInput';

const MODEL_OPTIONS = [
  { value: 'Eko Wulan (12 Lbr)', label: 'Eko Wulan (12 Lbr)', desc: '12 Lembar / Kalender' },
  { value: 'Dwi Wulan (6 Lbr)', label: 'Dwi Wulan (6 Lbr)', desc: '6 Lembar / Kalender' },
  { value: 'Tri Wulan (4 Lbr)', label: 'Tri Wulan (4 Lbr)', desc: '4 Lembar / Kalender' },
];

const BAHAN_OPTIONS = [
  { value: 'HVS 70', label: 'HVS 70 gsm', desc: 'Ekonomis (Rp 15.700/kg)' },
  { value: 'Art Paper 120', label: 'Art Paper 120 gsm', desc: 'Standar Kilap (Rp 17.400/kg)' },
  { value: 'Art Paper 150', label: 'Art Paper 150 gsm', desc: 'Tebal & Premium (Rp 17.400/kg)' },
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
  onOpenMasterParam?: () => void;
}

export default function PricelistSimulator({
  customParams,
  setCustomParams,
  onOpenMasterParam,
}: PricelistSimulatorProps) {
  // Input states with persistent localStorage support
  const [modelKalender, setModelKalender] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sintak_sim_model') || 'Eko Wulan (12 Lbr)';
    }
    return 'Eko Wulan (12 Lbr)';
  });

  const [bahan, setBahan] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sintak_sim_bahan') || 'Art Paper 150';
    }
    return 'Art Paper 150';
  });

  const [ukuran, setUkuran] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sintak_sim_ukuran') || '32 x 48';
    }
    return '32 x 48';
  });

  const [oplah, setOplah] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sintak_sim_oplah');
      if (saved) return Number(saved) || 1500;
    }
    return 1500;
  });

  const [pilihanMesin, setPilihanMesin] = useState<'Otomatis' | 'Oliver' | 'SM'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sintak_sim_mesin');
      if (saved === 'Oliver' || saved === 'SM' || saved === 'Otomatis') return saved;
    }
    return 'Otomatis';
  });

  const [marginPct, setMarginPct] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sintak_sim_margin');
      if (saved) return Number(saved) || 30;
    }
    return 30;
  });

  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sintak_sim_nego');
      if (saved) return Number(saved) || 4;
    }
    return 4;
  });

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

  const result = useMemo(() => {
    return calculatePricelistSimulator({
      modelKalender,
      bahan,
      ukuran,
      oplah: Math.max(1, oplah || 1),
      pilihanMesin,
      marginPct: marginPct / 100,
      negoDiskonPct: negoDiskonPct / 100,
      customParams,
    });
  }, [modelKalender, bahan, ukuran, oplah, pilihanMesin, marginPct, negoDiskonPct, customParams]);

  const formatRp = (val: number) => {
    return Math.round(val).toLocaleString('id-ID');
  };

  const handleResetParams = () => {
    setCustomParams(DEFAULT_MASTER_PARAMS);
  };

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Top Banner / Card header - Soft Style */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">Simulator & Kalkulator Kalender Spiral 2027</h2>
              <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
                Hitung simulasi HPP, Harga Jual, Nego, Omset, dan Estimasi Profit secara akurat & transparan untuk kuantitas oplah kustom.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-manual'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all shadow-2xs cursor-pointer"
          >
            <Info size={14} />
            <span>Panduan Simulator</span>
          </button>
          {onOpenMasterParam && (
            <button
              type="button"
              onClick={onOpenMasterParam}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all shadow-2xs cursor-pointer"
            >
              <Settings2 size={14} />
              <span>Lihat Master Parameter</span>
            </button>
          )}
        </div>
      </div>

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
                {BAHAN_OPTIONS.map((opt) => (
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

            {/* Kuantitas / Oplah Custom */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">4. Kuantitas / Oplah (Pcs)</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">5. Pilihan Mesin Cetak</label>
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
                <span className="text-slate-500 block">Mesin Dipakai</span>
                <span className="font-bold text-slate-900">{result.calculatedParams.mesinDigunakan}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block">Plano & Potong</span>
                <span className="font-bold text-slate-900">
                  {result.calculatedParams.planoUkuran} (bagi {result.calculatedParams.planoPotong})
                </span>
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col flex-1">
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

            <div className="overflow-x-auto flex-1">
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
                  <tr className="bg-emerald-50/60 border-t-2 border-emerald-200 font-bold text-slate-900">
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
        </div>
      </div>
    </div>
  );
}
