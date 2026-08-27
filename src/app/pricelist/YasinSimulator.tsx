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
  Layers,
} from 'lucide-react';
import {
  calculateYasinSimulator,
  DEFAULT_YASIN_PARAMS,
  YasinMasterParams,
  YasinSimulatorInput,
} from '@/lib/yasin-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

const HALAMAN_OPTIONS = [
  { value: 64, label: '64 Halaman', desc: 'Yasin Ringkas / Tahlil' },
  { value: 96, label: '96 Halaman', desc: 'Standar Populer Buya Barokah' },
  { value: 112, label: '112 Halaman', desc: 'Yasin & Tahlil Lengkap' },
  { value: 128, label: '128 Halaman', desc: 'Yasin + Doa-doa Pilihan' },
  { value: 144, label: '144 Halaman', desc: 'Yasin + Surat Pilihan' },
  { value: 192, label: '192 Halaman', desc: 'Kitab Yasin & Majmu Syarif' },
];

const UKURAN_OPTIONS = [
  { value: '11.7 x 15', label: '11.7 x 15 cm', desc: 'Ukuran Standar Umum' },
  { value: '9.5 x 14', label: '9.5 x 14 cm', desc: 'Ukuran Saku / Mini' },
];

interface YasinSimulatorProps {
  customParams?: YasinMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<YasinMasterParams>>;
}

export default function YasinSimulator({
  customParams = DEFAULT_YASIN_PARAMS,
}: YasinSimulatorProps) {
  const [oplah, setOplah] = useState<number>(100);
  const [tipeCover, setTipeCover] = useState<'Softcover' | 'Hardcover'>('Hardcover');
  const [ukuran, setUkuran] = useState<'11.7 x 15' | '9.5 x 14'>('11.7 x 15');
  const [jumlahHalamanIsi, setJumlahHalamanIsi] = useState<64 | 96 | 112 | 128 | 144 | 192>(96);
  const [lembarSisipanFoto, setLembarSisipanFoto] = useState<number>(2);
  const [lembarSisipanKeluarga, setLembarSisipanKeluarga] = useState<number>(2);
  const [laminasiCover, setLaminasiCover] = useState<'Glossy' | 'Doff'>('Glossy');
  const [opsiPitaRumbai, setOpsiPitaRumbai] = useState<boolean>(true);
  const [opsiSikuEmas, setOpsiSikuEmas] = useState<boolean>(true);
  const [opsiPlastikOpp, setOpsiPlastikOpp] = useState<boolean>(true);
  const [marginPct, setMarginPct] = useState<number>(30);
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(0);
  const [copiedQuote, setCopiedQuote] = useState(false);

  const inputConfig: YasinSimulatorInput = useMemo(
    () => ({
      oplah,
      tipeCover,
      ukuran,
      jumlahHalamanIsi,
      lembarSisipanFoto,
      lembarSisipanKeluarga,
      laminasiCover,
      opsiPitaRumbai: tipeCover === 'Hardcover' ? opsiPitaRumbai : false,
      opsiSikuEmas: tipeCover === 'Hardcover' ? opsiSikuEmas : false,
      opsiPlastikOpp,
      marginPct,
      negoDiskonPct,
    }),
    [
      oplah,
      tipeCover,
      ukuran,
      jumlahHalamanIsi,
      lembarSisipanFoto,
      lembarSisipanKeluarga,
      laminasiCover,
      opsiPitaRumbai,
      opsiSikuEmas,
      opsiPlastikOpp,
      marginPct,
      negoDiskonPct,
    ]
  );

  const result = useMemo(
    () => calculateYasinSimulator(inputConfig, customParams),
    [inputConfig, customParams]
  );

  const handleCopyQuote = () => {
    const text = `*PENAWARAN BUKU SURAT YASIN & TAHLIL*
*PT Buya Barokah*
━━━━━━━━━━━━━━━━━━━━
• *Produk*: Buku Yasin ${tipeCover} (${jumlahHalamanIsi} Halaman)
• *Ukuran*: ${ukuran} cm
• *Kuantitas (Oplah)*: ${oplah.toLocaleString('id-ID')} buku
• *Sisipan Foto*: ${lembarSisipanFoto} Lembar Full Color
• *Sisipan Doa/Keluarga*: ${lembarSisipanKeluarga} Lembar
• *Cover & Finishing*: Cover Laminasi ${laminasiCover}${tipeCover === 'Hardcover' ? ` + Foil Emboss Gembos ${opsiSikuEmas ? '+ Siku Emas ' : ''}${opsiPitaRumbai ? '+ Pita Rumbai ' : ''}` : ''}
• *Kemasan*: ${opsiPlastikOpp ? 'Plastik OPP Satuan' : 'Standar'}
━━━━━━━━━━━━━━━━━━━━
• *Harga Satuan*: *Rp ${result.summary.hargaJualPerPcs.toLocaleString('id-ID')}* / buku
${negoDiskonPct > 0 ? `• *Harga Nego (${negoDiskonPct}%)*: *Rp ${result.summary.hargaNegoPerPcs.toLocaleString('id-ID')}* / buku\n• *Total Penawaran*: *Rp ${result.summary.totalHargaNego.toLocaleString('id-ID')}*` : `• *Total Penawaran*: *Rp ${result.summary.totalHargaJual.toLocaleString('id-ID')}*`}
━━━━━━━━━━━━━━━━━━━━
_Desain foto almarhum & silsilah keluarga dibantu layouting sampai approved._`;

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
              Simulator & Kalkulator Buku Surat Yasin & Tahlil
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Katalog 02
              </span>
            </h3>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Kalkulasi HPP Softcover & Hardcover lengkap dengan sisipan foto almarhum, doa keluarga, dan foil gembos emas.
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
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Spesifikasi Yasin
            </h4>

            {/* Pilihan Softcover vs Hardcover */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tipe Cover Buku
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Hardcover', 'Softcover'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipeCover(t)}
                    className={`p-2.5 text-center rounded-lg border font-bold text-xs transition cursor-pointer ${
                      tipeCover === t
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {t === 'Hardcover' ? '📘 Hard Cover (Mewah)' : '📄 Soft Cover (Standar)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Oplah & Ukuran */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kuantitas (Oplah)
                </label>
                <ThousandInput
                  value={oplah}
                  onChange={setOplah}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2"
                  placeholder="Jumlah buku"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ukuran Buku
                </label>
                <select
                  value={ukuran}
                  onChange={(e) => setUkuran(e.target.value as any)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  {UKURAN_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Halaman Isi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jumlah Halaman Kitab Yasin
              </label>
              <div className="grid grid-cols-3 gap-2">
                {HALAMAN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setJumlahHalamanIsi(opt.value as any)}
                    className={`p-2 text-center rounded-lg border text-xs transition cursor-pointer ${
                      jumlahHalamanIsi === opt.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {opt.value} Hal
                  </button>
                ))}
              </div>
            </div>

            {/* Sisipan Foto & Sisipan Teks */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Sisipan Foto FC (Lbr)
                </label>
                <select
                  value={lembarSisipanFoto}
                  onChange={(e) => setLembarSisipanFoto(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-300 rounded-md p-1.5 font-medium"
                >
                  {[0, 1, 2, 3, 4, 6, 8].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? 'Tanpa Foto' : `${n} Lembar`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Sisipan Silsilah/Doa (Lbr)
                </label>
                <select
                  value={lembarSisipanKeluarga}
                  onChange={(e) => setLembarSisipanKeluarga(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-300 rounded-md p-1.5 font-medium"
                >
                  {[0, 1, 2, 3, 4, 6].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? 'Tanpa Sisipan' : `${n} Lembar`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Aksesoris & Fitur Tambahan */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laminasiCover === 'Doff'}
                    onChange={(e) => setLaminasiCover(e.target.checked ? 'Doff' : 'Glossy')}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700">Laminasi Doff (Default: Glossy)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opsiPlastikOpp}
                    onChange={(e) => setOpsiPlastikOpp(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700">Plastik Satuan</span>
                </label>
              </div>

              {tipeCover === 'Hardcover' && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-dashed border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={opsiSikuEmas}
                      onChange={(e) => setOpsiSikuEmas(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">Siku Sudut Emas (4 Sudut)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={opsiPitaRumbai}
                      onChange={(e) => setOpsiPitaRumbai(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">Pita Rumbai</span>
                  </label>
                </div>
              )}
            </div>

            {/* Margin & Nego */}
            <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Margin Profit (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={marginPct}
                    onChange={(e) => setMarginPct(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2 pr-7"
                  />
                  <Percent className="w-3 h-3 text-slate-400 absolute right-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Diskon Nego (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={negoDiskonPct}
                    onChange={(e) => setNegoDiskonPct(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2 pr-7"
                  />
                  <Percent className="w-3 h-3 text-slate-400 absolute right-2.5 top-3" />
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
              <span className="text-slate-400">Format: </span>
              <span className="font-semibold text-slate-800">{tipeCover} ({ukuran} cm)</span>
            </div>
            <div>
              <span className="text-slate-400">Punggung: </span>
              <span className="font-semibold text-slate-800">{result.tebalPunggungCm} cm</span>
            </div>
            <div>
              <span className="text-slate-400">Kebutuhan Cover: </span>
              <span className="font-semibold text-slate-800">{result.kebutuhanA3Cover} Lbr A3+</span>
            </div>
          </div>

          {/* Breakdown Komponen Biaya */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>Rincian Biaya Produksi (HPP)</span>
              <span className="text-[11px] font-medium text-emerald-600">
                {result.breakdown.length} Elemen
              </span>
            </h4>

            <div className="divide-y divide-slate-100">
              {result.breakdown.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 truncate">
                      {item.nama}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {item.keterangan}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900">
                      Rp {item.nominal.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-slate-400">
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
