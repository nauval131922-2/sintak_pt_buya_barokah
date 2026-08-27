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
      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-lg shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Simulator Buku Surat Yasin & Tahlil
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium">
                Katalog 02
              </span>
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Kalkulasi HPP Softcover & Hardcover lengkap dengan sisipan foto almarhum, doa keluarga, dan foil gembos emas.
            </p>
          </div>
        </div>
        <button
          onClick={handleCopyQuote}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 shadow-sm transition"
        >
          {copiedQuote ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedQuote ? 'Tersalin' : 'Salin Penawaran WA'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Spesifikasi Yasin
            </h4>

            {/* Pilihan Softcover vs Hardcover */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Tipe Cover Buku
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Hardcover', 'Softcover'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipeCover(t)}
                    className={`p-2.5 text-center rounded-lg border font-bold text-xs transition ${
                      tipeCover === t
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
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
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Kuantitas (Oplah)
                </label>
                <ThousandInput
                  value={oplah}
                  onChange={setOplah}
                  className="w-full text-xs font-bold bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg p-2"
                  placeholder="Jumlah buku"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Ukuran Buku
                </label>
                <select
                  value={ukuran}
                  onChange={(e) => setUkuran(e.target.value as any)}
                  className="w-full text-xs font-semibold bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg p-2"
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
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Jumlah Halaman Kitab Yasin
              </label>
              <div className="grid grid-cols-3 gap-2">
                {HALAMAN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setJumlahHalamanIsi(opt.value as any)}
                    className={`p-2 text-center rounded-lg border text-xs transition ${
                      jumlahHalamanIsi === opt.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                    }`}
                  >
                    {opt.value} Hal
                  </button>
                ))}
              </div>
            </div>

            {/* Sisipan Foto & Sisipan Teks */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-lg border border-gray-200 dark:border-zinc-700/60">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Sisipan Foto FC (Lbr)
                </label>
                <select
                  value={lembarSisipanFoto}
                  onChange={(e) => setLembarSisipanFoto(Number(e.target.value))}
                  className="w-full text-xs bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md p-1.5 font-medium"
                >
                  {[0, 1, 2, 3, 4, 6, 8].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? 'Tanpa Foto' : `${n} Lembar`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Sisipan Silsilah/Doa (Lbr)
                </label>
                <select
                  value={lembarSisipanKeluarga}
                  onChange={(e) => setLembarSisipanKeluarga(Number(e.target.value))}
                  className="w-full text-xs bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md p-1.5 font-medium"
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
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laminasiCover === 'Doff'}
                    onChange={(e) => setLaminasiCover(e.target.checked ? 'Doff' : 'Glossy')}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Laminasi Doff (Default: Glossy)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opsiPlastikOpp}
                    onChange={(e) => setOpsiPlastikOpp(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Plastik Satuan</span>
                </label>
              </div>

              {tipeCover === 'Hardcover' && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-dashed border-gray-200 dark:border-zinc-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={opsiSikuEmas}
                      onChange={(e) => setOpsiSikuEmas(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Siku Sudut Emas (4 Sudut)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={opsiPitaRumbai}
                      onChange={(e) => setOpsiPitaRumbai(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Pita Rumbai</span>
                  </label>
                </div>
              )}
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
          {/* Card Hasil Ringkasan */}
          <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white rounded-xl p-6 shadow-md">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-indigo-200 text-xs font-medium">HPP Satuan</div>
                <div className="text-2xl font-bold mt-1">
                  Rp {result.summary.hppPerPcs.toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-indigo-300 mt-0.5">
                  Total: Rp {result.summary.totalHpp.toLocaleString('id-ID')}
                </div>
              </div>

              <div>
                <div className="text-indigo-200 text-xs font-medium">Harga Jual Satuan</div>
                <div className="text-2xl font-bold mt-1">
                  Rp {result.summary.hargaJualPerPcs.toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-indigo-300 mt-0.5">
                  Margin: {marginPct}% (+Rp {result.summary.marginNominalPerPcs.toLocaleString('id-ID')})
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-indigo-500/40 pt-3 sm:pt-0 sm:pl-4">
                <div className="text-indigo-200 text-xs font-medium">Total Nilai Order</div>
                <div className="text-2xl font-black mt-1 text-yellow-300">
                  Rp {(negoDiskonPct > 0 ? result.summary.totalHargaNego : result.summary.totalHargaJual).toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-indigo-300 mt-0.5">
                  Profit: Rp {(negoDiskonPct > 0 ? result.summary.totalProfitNego : result.summary.totalProfit).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-indigo-500/40 flex flex-wrap items-center justify-between text-xs text-indigo-200 gap-2">
              <div>
                <span className="opacity-80">Format: </span>
                <span className="font-semibold">{tipeCover} ({ukuran} cm)</span>
              </div>
              <div>
                <span className="opacity-80">Punggung: </span>
                <span className="font-semibold">{result.tebalPunggungCm} cm</span>
              </div>
              <div>
                <span className="opacity-80">Kebutuhan Cover: </span>
                <span className="font-semibold">{result.kebutuhanA3Cover} Lbr A3+</span>
              </div>
            </div>
          </div>

          {/* Breakdown Komponen Biaya */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <span>Rincian Biaya Produksi (HPP)</span>
              <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                {result.breakdown.length} Elemen
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
