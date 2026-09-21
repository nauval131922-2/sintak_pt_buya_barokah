'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Printer,
  Layers,
  Package,
  Info,
} from 'lucide-react';
import {
  DEFAULT_KOP_SURAT_PARAMS,
  KopSuratMasterParams,
  KOP_SURAT_GRAMATUR_OPTIONS,
  KOP_SURAT_BAHAN_OPTIONS,
  KOP_SURAT_D9_OPTIONS,
} from '@/lib/kop-surat-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface KopSuratMasterParameterProps {
  customParams: KopSuratMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<KopSuratMasterParams>>;
}

type NumKey = {
  [K in keyof KopSuratMasterParams]: KopSuratMasterParams[K] extends number ? K : never;
}[keyof KopSuratMasterParams];

const KOP_SURAT_VISIBLE_KEYS: NumKey[] = [
  'gramatur',
  'hargaPerKg',
  'upPct',
  'insheet1Warna',
  'insheet2Warna',
  'insheet3Warna',
  'insheet4Warna',
  'desain',
  'tarifFilm',
  'platOverride',
  'royaltyPerRim',
  'transportPerOrder',
  'labaPct',
];

export default function KopSuratMasterParameter({
  customParams,
  setCustomParams,
}: KopSuratMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const safe: KopSuratMasterParams = { ...DEFAULT_KOP_SURAT_PARAMS, ...(customParams || {}) };

  const handleChange = (key: NumKey, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const handleChangeStr = (key: 'bahanKop' | 'jenisKertasTambahan', val: string) => {
    setCustomParams((prev) => ({ ...prev, [key]: val }));
  };

  const isFieldModified = (key: keyof KopSuratMasterParams) =>
    safe[key] !== DEFAULT_KOP_SURAT_PARAMS[key];

  const handleResetField = (key: keyof KopSuratMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_KOP_SURAT_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${String(DEFAULT_KOP_SURAT_PARAMS[key])}).`);
  };

  const isModified = React.useMemo(
    () => (Object.keys(DEFAULT_KOP_SURAT_PARAMS) as (keyof KopSuratMasterParams)[]).some((key) => safe[key] !== DEFAULT_KOP_SURAT_PARAMS[key]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_KOP_SURAT_PARAMS });
    toast.success('Semua parameter Kop Surat dikembalikan ke standar master.');
  };

  const fieldRow = (key: NumKey, label: string, isRupiah = true) => (
    <div
      className={`p-2.5 rounded-lg border transition-all ${
        isFieldModified(key)
          ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <label className="text-xs font-semibold text-slate-700 truncate" title={label}>
          {label}
        </label>
        {isFieldModified(key) && (
          <button
            type="button"
            onClick={() => handleResetField(key)}
            className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
            title="Reset ke default"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Def
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {isRupiah ? (
          <ThousandInput
            value={safe[key] as number}
            onValueChange={(v) => handleChange(key, v || 0)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
            prefix="Rp"
          />
        ) : (
          <input
            type="number"
            min={0}
            value={safe[key] as number}
            onChange={(e) => handleChange(key, Number(e.target.value) || 0)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
          />
        )}
      </div>
    </div>
  );

  const selectRow = (key: 'bahanKop' | 'jenisKertasTambahan', label: string, options: string[], note: string) => (
    <div
      className={`p-2.5 rounded-lg border transition-all ${
        isFieldModified(key)
          ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <label className="text-xs font-semibold text-slate-700 truncate" title={label}>
          {label}
        </label>
        {isFieldModified(key) && (
          <button
            type="button"
            onClick={() => handleResetField(key)}
            className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
            title="Reset ke default"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Def
          </button>
        )}
      </div>
      <select
        value={safe[key]}
        onChange={(e) => handleChangeStr(key, e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs cursor-pointer"
      >
        {key === 'jenisKertasTambahan' && <option value="">(kosong — sesuai file)</option>}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <p className="text-[10px] text-slate-400 mt-1 italic">{note}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
                Master Parameter Kop Surat
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan 4 file Pricelist KOP SURAT 1–4 Warna (FOLIO/A4/Setengah, rim @500 lbr, Plate 10000, Min 15000/plat, Drek 30).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all cursor-pointer shadow-2xs"
          >
            <BookOpen size={13} />
            <span>Manual Pengguna</span>
          </button>
          <button
            type="button"
            onClick={handleResetAll}
            disabled={!isModified}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 ${
              isModified
                ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer ring-2 ring-amber-400/40'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70'
            }`}
          >
            <RotateCcw size={13} />
            <span>Reset Standar Master</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Bahan & Kertas */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800">1. Bahan &amp; Harga Kertas (Master!D11–E13)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('gramatur', 'Gramatur (gsm) [55–160]', false)}
            {fieldRow('hargaPerKg', 'Harga / kg (Rp)')}
            {fieldRow('upPct', 'Up Harga (%)', false)}
            {fieldRow('umr', 'UMR Acuan (Rp, info)', true)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectRow('bahanKop', 'Bahan Kop (Master!D11)', KOP_SURAT_BAHAN_OPTIONS, 'Informatif — tidak dipakai rumus BUKU.')}
            {selectRow('jenisKertasTambahan', 'Jenis Kertas D9 (Master!D9)', KOP_SURAT_D9_OPTIONS, 'Tersimpan kosong di ke-4 file; tidak dipakai rumus.')}
          </div>
          <p className="text-[10px] text-slate-500">
            Harga/rim BUKU!U29 = ((T27×U27)×gramatur)/20000 × (harga/kg + up). Gramatur Excel: {KOP_SURAT_GRAMATUR_OPTIONS.join(', ')}.
          </p>
        </div>

        {/* Card 2: Insheet per file warna */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Insheet Lbr Cetak (Master!D15 per file)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('insheet1Warna', 'File 1 Warna (lbr)', false)}
            {fieldRow('insheet2Warna', 'File 2 Warna (lbr)', false)}
            {fieldRow('insheet3Warna', 'File 3 Warna (lbr)', false)}
            {fieldRow('insheet4Warna', 'File 4 Warna (lbr)', false)}
          </div>
          <p className="text-[10px] text-slate-500">
            Nilai bawaan file: 30 / 30 / 40 / 50. Simulator otomatis memakai default file sesuai jumlah warna, masih bisa dioverride per simulasi.
          </p>
        </div>

        {/* Card 3: Cetak */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Desain, Film &amp; Plate (BUKU!T6–X6)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('desain', 'Desain / Order (Rp)')}
            {fieldRow('tarifFilm', 'Film BW / satuan (Rp)')}
            {fieldRow('platOverride', 'Override Jml Plat X6 (0=auto)', false)}
            {fieldRow('royaltyPerRim', 'Royalty / rim (Rp)')}
            {fieldRow('transportPerOrder', 'Transport / order (Rp)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Plate BUKU!W6: CETAK = Rp 10.000/plat, ONGKOS CETAK = Rp 0. Min order Rp 15.000/plat, drek over Rp 30 (tetap di kedua mode). Jml plat auto = warna × muka.
          </p>
        </div>

        {/* Card 4: Margin + referensi */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Info className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Laba &amp; Referensi (Master!E21, H14)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('labaPct', 'Laba Default (%)', false)}
            {fieldRow('hargaPembandingPerRim', 'Pembanding / rim (Rp, info)')}
          </div>
          <p className="text-[10px] text-slate-500">
            Laba BUKU!AO7 = HPP/rim × E21%. Harga final BUKU!AS7 = ROUNDUP(..., -1) ke puluhan. H14 hanya angka pembanding statis.
          </p>
        </div>
      </div>

      {showManualModal && (
        <div
          onClick={() => setShowManualModal(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Manual Pengguna &amp; Pemetaan Sumber Excel</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    4 file Pricelist KOP SURAT 1/2/3/4 Warna.xlsm — sheet Master, BUKU, named range Oplah &amp; Harga_Final
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Pemetaan Sel Excel → Parameter SINTAK
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan &amp; Kertas</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Gramatur</strong> <span className="font-mono text-emerald-700">Master!D12</span> = 70 (opsi 55–160) → <span className="font-mono">BUKU!U28</span>.</li>
                      <li>• <strong>Harga/kg</strong> <span className="font-mono text-emerald-700">Master!D13</span> = Rp 15.700 → <span className="font-mono">BUKU!U30</span>.</li>
                      <li>• <strong>Up</strong> <span className="font-mono text-emerald-700">Master!E13</span> = 0,05 (UI 5%) → <span className="font-mono">BUKU!W30</span>.</li>
                      <li>• <strong>Harga/rim</strong> <span className="font-mono text-emerald-700">BUKU!U29</span> = ((T27×U27)×gramatur)/20000 × (harga/kg + up) → <span className="font-mono">Master!D14</span>.</li>
                      <li>• <strong>UMR</strong> <span className="font-mono text-emerald-700">Master!D8</span> = 2.818.585 informatif, tidak masuk rumus.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>2. Insheet &amp; Oplah</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Insheet</strong> <span className="font-mono text-emerald-700">Master!D15</span> → <span className="font-mono">BUKU!K7</span>: file 1W = 30, 2W = 30, 3W = 40, 4W = 50.</li>
                      <li>• <strong>Oplah</strong> <span className="font-mono text-emerald-700">Master!D7</span> dalam <strong>rim</strong> @500 lbr → <span className="font-mono">BUKU!H7:H16</span> = 1–10 rim.</li>
                      <li>• <strong>Kebutuhan plano</strong> <span className="font-mono text-emerald-700">BUKU!Q7</span> = ((H×500)/O7) + (K7/N7).</li>
                      <li>• <strong>Jenis kop</strong> <span className="font-mono text-emerald-700">Master!D5</span>: FOLIO 21,5×33, A4 21×29,7, Setengah Folio/Setengah A4 (jadi 2/area).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>3. Cetak (Plate, Min, Drek)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Desain</strong> <span className="font-mono text-emerald-700">Master!D16</span> = Rp 10.000 → <span className="font-mono">BUKU!T6/T7</span>.</li>
                      <li>• <strong>Plate</strong> <span className="font-mono text-emerald-700">BUKU!W6</span>: CETAK = Rp 10.000/plat, ONGKOS CETAK = Rp 0. Jml plat <span className="font-mono">X7</span> = warna × muka (override <span className="font-mono">X6</span>).</li>
                      <li>• <strong>Min order</strong> <span className="font-mono text-emerald-700">BUKU!Z6</span> = Rp 15.000/plat (tetap), <strong>drek over</strong> <span className="font-mono">AA7</span> = Rp 30, over = P7 − 500.</li>
                      <li>• <strong>Film</strong> <span className="font-mono text-emerald-700">BUKU!U7</span> aktif hanya jika T30 = √. <strong>Sisir</strong> <span className="font-mono">AK7</span> hanya jika <span className="font-mono">Master!D20</span> = SISIR.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Total &amp; Harga Final</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Total HPP</strong> <span className="font-mono text-emerald-700">BUKU!AM7</span> = SUM(kertas + desain + film + plate + cetak + royalty + transp + sisir).</li>
                      <li>• <strong>Laba</strong> <span className="font-mono text-emerald-700">Master!E21</span> = 30% → <span className="font-mono">AO7</span> = AN7 × 30%.</li>
                      <li>• <strong>Harga final</strong> <span className="font-mono text-emerald-700">BUKU!AS7</span> = ROUNDUP(AR7, −1), dibulatkan ke <strong>puluhan</strong>.</li>
                      <li>• Output antar-sheet via <span className="font-mono">Oplah</span> (H7:H24) &amp; <span className="font-mono">Harga_Final</span> (AS7:AS24) + INDEX/MATCH di <span className="font-mono">B38</span>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
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
