'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  DollarSign,
  TrendingUp,
  Percent,
  Cpu,
  Info,
  CheckCircle2,
  FileText,
  RotateCcw,
  Copy,
  Check,
  Share2,
  Sparkles,
} from 'lucide-react';
import {
  calculateManasikSimulator,
  DEFAULT_MANASIK_PARAMS,
  ManasikMasterParams,
  ManasikSimulatorInput,
} from '@/lib/manasik-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

const HALAMAN_OPTIONS = [
  { value: 96, label: '96 Halaman', desc: 'Blok Manasik Ringkas' },
  { value: 128, label: '128 Halaman', desc: 'Blok Manasik Standar' },
  { value: 192, label: '192 Halaman', desc: 'Blok Manasik Lengkap (Populer)' },
  { value: 208, label: '208 Halaman', desc: 'Blok Manasik Jumbo Plus' },
];

const JILID_OPTIONS = [
  { value: 'Softcover (Bending/Lem Panas)', label: 'Softcover (Lem Panas)', desc: 'Jilid bending punggung rapi' },
  { value: 'Tali Cocard', label: 'Tali Cocard', desc: 'Staples + Lubang Bor + Tali Kur Leher' },
  { value: 'Staples Kawat', label: 'Staples Kawat', desc: 'Staples tengah / samping ekonomis' },
  { value: 'Spiral Kawat', label: 'Spiral Kawat', desc: 'Jilid kawat ring spiral' },
];

const METODE_OPTIONS = [
  { value: 'Otomatis', label: 'Otomatis (Rekomendasi)', desc: '< 300 POD Digital, >= 300 Offset' },
  { value: 'Print Digital (A3+)', label: 'Digital Print (A3+)', desc: 'Cepat untuk oplah kecil' },
  { value: 'Offset (Oliver)', label: 'Offset Mesin Oliver', desc: 'Ekonomis untuk oplah partai besar' },
];

const LAMINASI_OPTIONS = [
  { value: 'Glossy', label: 'Laminasi Glossy', desc: 'Mengkilap cerah' },
  { value: 'Doff', label: 'Laminasi Doff', desc: 'Matte elegan & eksklusif' },
  { value: 'UV Varnish', label: 'UV Varnish', desc: 'Lapisan vernis mengkilap' },
  { value: 'Tanpa Laminasi', label: 'Tanpa Laminasi', desc: 'Standar cetak polos' },
];

interface ManasikSimulatorProps {
  customParams?: ManasikMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<ManasikMasterParams>>;
}

export default function ManasikSimulator({
  customParams = DEFAULT_MANASIK_PARAMS,
}: ManasikSimulatorProps) {
  const [oplah, setOplah] = useState<number>(500);
  const [jumlahHalaman, setJumlahHalaman] = useState<96 | 128 | 192 | 208>(192);
  const [tipeJilid, setTipeJilid] = useState<
    'Softcover (Bending/Lem Panas)' | 'Staples Kawat' | 'Tali Cocard' | 'Spiral Kawat'
  >('Tali Cocard');
  const [metodeCetakCover, setMetodeCetakCover] = useState<
    'Otomatis' | 'Print Digital (A3+)' | 'Offset (Oliver)'
  >('Otomatis');
  const [laminasiCover, setLaminasiCover] = useState<
    'Tanpa Laminasi' | 'Glossy' | 'Doff' | 'UV Varnish'
  >('Doff');
  const [opsiPlastikOpp, setOpsiPlastikOpp] = useState<boolean>(true);
  const [opsiKardus, setOpsiKardus] = useState<boolean>(true);
  const [marginPct, setMarginPct] = useState<number>(30);
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(0);
  const [copiedQuote, setCopiedQuote] = useState(false);

  const inputConfig: ManasikSimulatorInput = useMemo(
    () => ({
      oplah,
      jumlahHalaman,
      tipeJilid,
      metodeCetakCover,
      laminasiCover,
      opsiPlastikOpp,
      opsiKardus,
      marginPct,
      negoDiskonPct,
    }),
    [
      oplah,
      jumlahHalaman,
      tipeJilid,
      metodeCetakCover,
      laminasiCover,
      opsiPlastikOpp,
      opsiKardus,
      marginPct,
      negoDiskonPct,
    ]
  );

  const result = useMemo(
    () => calculateManasikSimulator(inputConfig, customParams),
    [inputConfig, customParams]
  );

  const handleCopyQuote = () => {
    const text = `*PENAWARAN BUKU PANDUAN MANASIK HAJI / UMROH*
*PT Buya Barokah*
━━━━━━━━━━━━━━━━━━━━
• *Produk*: Buku Manasik ${jumlahHalaman} Halaman
• *Ukuran*: 10 x 15.5 cm
• *Kuantitas (Oplah)*: ${oplah.toLocaleString('id-ID')} eks
• *Cover*: Custom Full Color (AC 230 gsm) + Laminasi ${laminasiCover}
• *Model Jilid*: ${tipeJilid}
• *Kemasan*: ${opsiPlastikOpp ? 'Plastik OPP Satuan' : 'Standar'} + ${opsiKardus ? 'Kardus Master' : ''}
━━━━━━━━━━━━━━━━━━━━
• *Harga Satuan*: *Rp ${result.summary.hargaJualPerPcs.toLocaleString('id-ID')}* / eks
${negoDiskonPct > 0 ? `• *Harga Nego (${negoDiskonPct}%)*: *Rp ${result.summary.hargaNegoPerPcs.toLocaleString('id-ID')}* / eks\n• *Total Penawaran*: *Rp ${result.summary.totalHargaNego.toLocaleString('id-ID')}*` : `• *Total Penawaran*: *Rp ${result.summary.totalHargaJual.toLocaleString('id-ID')}*`}
━━━━━━━━━━━━━━━━━━━━
_Harga belum termasuk PPN. Spesifikasi & desain dapat dikonsultasikan lebih lanjut._`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success('Penawaran format WhatsApp berhasil disalin!');
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-emerald-950 flex items-center gap-2">
              Simulator & Kalkulator Buku Manasik Haji / Umroh
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Katalog 01
              </span>
            </h3>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Kalkulasi HPP cepat berbasis blok isi ready, cover custom, laminasi, dan variasi jilid cocard/bending.
            </p>
          </div>
        </div>
        <button
          onClick={handleCopyQuote}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 rounded-lg shadow-2xs transition cursor-pointer"
        >
          {copiedQuote ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedQuote ? 'Tersalin' : 'Salin Penawaran WA'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form Input Spesifikasi */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Spesifikasi Pesanan
            </h4>

            {/* Oplah */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Kuantitas Order (Oplah)
              </label>
              <ThousandInput
                value={oplah}
                onChange={setOplah}
                className="w-full text-sm font-bold bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg p-2.5"
                placeholder="Jumlah pesanan (eks)"
              />
            </div>

            {/* Jumlah Halaman */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Varian Isi Buku Manasik
              </label>
              <div className="grid grid-cols-2 gap-2">
                {HALAMAN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setJumlahHalaman(opt.value as any)}
                    className={`p-2.5 text-left rounded-lg border transition ${
                      jumlahHalaman === opt.value
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-medium'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tipe Jilid & Finishing */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Model Jilid & Binding
              </label>
              <div className="grid grid-cols-1 gap-2">
                {JILID_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTipeJilid(opt.value as any)}
                    className={`p-2 text-left rounded-lg border transition flex items-center justify-between ${
                      tipeJilid === opt.value
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-medium'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{opt.desc}</div>
                    </div>
                    {tipeJilid === opt.value && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Laminasi Cover */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Laminasi Cover
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LAMINASI_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLaminasiCover(opt.value as any)}
                    className={`p-2 text-left rounded-lg border text-xs transition ${
                      laminasiCover === opt.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cetak Cover */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Metode Produksi Cover
              </label>
              <select
                value={metodeCetakCover}
                onChange={(e) => setMetodeCetakCover(e.target.value as any)}
                className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg p-2.5 font-medium"
              >
                {METODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.desc})
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox Kemasan */}
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opsiPlastikOpp}
                  onChange={(e) => setOpsiPlastikOpp(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Plastik OPP Satuan</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opsiKardus}
                  onChange={(e) => setOpsiKardus(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Box Kardus Master</span>
              </label>
            </div>

            {/* Margin & Nego */}
            <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Margin Profit (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={marginPct}
                    onChange={(e) => setMarginPct(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg p-2 pr-7"
                  />
                  <Percent className="w-3 h-3 text-gray-400 absolute right-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Diskon Nego (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={negoDiskonPct}
                    onChange={(e) => setNegoDiskonPct(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg p-2 pr-7"
                  />
                  <Percent className="w-3 h-3 text-gray-400 absolute right-2.5 top-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Kalkulasi & Breakdown */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card Hasil Ringkasan - Soft Style Presisi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* HPP Modal Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">HPP Modal</span>
                <DollarSign size={13} className="text-slate-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
                  Rp {result.summary.hppPerPcs.toLocaleString('id-ID')}
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
                  Rp {result.summary.hargaJualPerPcs.toLocaleString('id-ID')}
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
                  Rp {result.summary.hargaNegoPerPcs.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-blue-700/80 mt-0.5">Batas aman diskon</span>
              </div>
            </div>

            {/* Estimasi Profit Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">Total Profit</span>
                <TrendingUp size={13} className="text-emerald-500" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                  Rp {(negoDiskonPct > 0 ? result.summary.totalProfitNego : result.summary.totalProfit).toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Omset: Rp {(negoDiskonPct > 0 ? result.summary.totalHargaNego : result.summary.totalHargaJual).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Info Teknis Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <div>
              <span className="text-slate-400">Metode Cover: </span>
              <span className="font-semibold text-slate-800">{result.metodeCoverTerpilih}</span>
            </div>
            <div>
              <span className="text-slate-400">Punggung: </span>
              <span className="font-semibold text-slate-800">{result.tebalPunggungCm} cm</span>
            </div>
            <div>
              <span className="text-slate-400">Kebutuhan Cover: </span>
              <span className="font-semibold text-slate-800">
                {result.kebutuhanA3Cover > 0 ? `${result.kebutuhanA3Cover} Lbr A3+` : `${result.kebutuhanPlanoCover} Lbr Plano`}
              </span>
            </div>
          </div>

          {/* Breakdown Komponen Biaya */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <span>Rincian Komponen Biaya (HPP)</span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {result.breakdown.length} Elemen Produksi
              </span>
            </h4>

            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {result.breakdown.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {item.nama}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {item.keterangan}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-gray-900 dark:text-gray-100">
                      Rp {item.nominal.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {item.pct.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
