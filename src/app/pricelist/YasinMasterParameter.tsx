'use client';

import React, { useState } from 'react';
import {
  Database,
  BookOpen,
  RotateCcw,
  Sparkles,
  X,
  Sliders,
  Layers,
  Printer,
  FileText,
  Box,
} from 'lucide-react';
import {
  DEFAULT_YASIN_PARAMS,
  YasinMasterParams,
} from '@/lib/yasin-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface YasinMasterParameterProps {
  customParams: YasinMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<YasinMasterParams>>;
}

const YASIN_VISIBLE_KEYS: (keyof YasinMasterParams)[] = [
  'hargaIsiYasin64',
  'hargaIsiYasin96',
  'hargaIsiYasin112',
  'hargaIsiYasin128',
  'hargaIsiYasin144',
  'hargaIsiYasin192',
  'tarifPrintCoverA3',
  'tarifPrintCoverHC',
  'tarifDesainCover',
  'insheetCover',
  'insheetCoverHC',
  'tarifSisipLembar',
  'tarifStaplesYasin',
  'tarifSisirYasin',
  'tarifPasangCoverSoft',
  'tarifPlastikOppYasin',
  'tarifPrintSisipanFotoA3',
  'tarifPrintSisipanTeksA3',
  'insheetSisipan',
  'tarifBoardHardcover',
  'tarifCasingInHardcover',
  'tarifSkiblat',
  'tarifSikuSudutEmas',
  'tarifPitaRumbaiPapercraft',
  'tarifEmbossFoilGembos',
  'tarifPlastikOppHC',
  'tarifLaminasiGlossyCm2',
  'tarifLaminasiDoffCm2',
  'minLaminasi',
];

export default function YasinMasterParameter({
  customParams,
  setCustomParams,
}: YasinMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);
  const handleChange = (key: keyof YasinMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof YasinMasterParams) => {
    return customParams[key] !== DEFAULT_YASIN_PARAMS[key];
  };

  const handleResetField = (key: keyof YasinMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_YASIN_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_YASIN_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(() => {
    return YASIN_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_YASIN_PARAMS[key]);
  }, [customParams]);

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      YASIN_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_YASIN_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Buku Surat Yasin dikembalikan ke standar master.');
  };

  const fieldRow = (
    key: keyof YasinMasterParams,
    label: string,
    isRupiah = true,
    isDecimal = false,
    customUnit?: string
  ) => (
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
        <ThousandInput
          value={customParams[key] as number}
          onValueChange={(v) => handleChange(key, v || 0)}
          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
          prefix={isRupiah ? 'Rp' : undefined}
          suffix={isRupiah ? undefined : (customUnit !== undefined ? customUnit : '%')}
          allowDecimals={isDecimal}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
      {/* Header Info */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
                Master Parameter Buku Surat Yasin & Tahlil
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan harga blok kitab Yasin (64–192 hal), cetak sisipan foto/doa A3+, board hardcover, dan foil gembos emas.
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

      {/* Grid Parameter: Dikelompokkan Sesuai 2 Model Yasin (Softcover vs Hardcover) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kolom 1: Isi Kitab Yasin & Softcover */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800">1. Isi Kitab Yasin Kosongan & Softcover</h3>
            </div>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              Softcover
            </span>
          </div>

          {/* Sub: Database Isi Yasin */}
          <div>
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Harga Isi Kitab Yasin (per Buku):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {fieldRow('hargaIsiYasin64', 'Yasin 64 Hal')}
              {fieldRow('hargaIsiYasin96', 'Yasin 96 Hal')}
              {fieldRow('hargaIsiYasin112', 'Yasin 112 Hal')}
              {fieldRow('hargaIsiYasin128', 'Yasin 128 Hal')}
              {fieldRow('hargaIsiYasin144', 'Yasin 144 Hal')}
              {fieldRow('hargaIsiYasin192', 'Yasin 192 Hal')}
            </div>
          </div>

          {/* Sub: Cover AC 230 & Desain */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Cetak Cover Softcover (AC 230) & Hardcover (AP 150):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fieldRow('tarifPrintCoverA3', 'Print Cover A3+ Soft (AC 230)')}
              {fieldRow('tarifPrintCoverHC', 'Print Cover A3+ Hard (AP 150)')}
              {fieldRow('tarifDesainCover', 'Jasa Desain Cover & Foto')}
              {fieldRow('insheetCover', 'Insheet Cover Soft (lbr A3+)', false, false, 'A3+')}
              {fieldRow('insheetCoverHC', 'Insheet Cover Hard (lbr A3+)', false, false, 'A3+')}
            </div>
          </div>

          {/* Sub: Finishing Jilid Dasar & Softcover */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Finishing Jilid Dasar &amp; Softcover:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fieldRow('tarifSisipLembar', 'Ongkos Sisip /lbr')}
              {fieldRow('tarifStaplesYasin', 'Ongkos Staples /buku')}
              {fieldRow('tarifSisirYasin', 'Ongkos Sisir Potong /buku')}
              {fieldRow('tarifPasangCoverSoft', 'Pasang Cover Soft /buku')}
              {fieldRow('tarifPlastikOppYasin', 'Plastik OPP Soft /pcs')}
            </div>
          </div>
        </div>

        {/* Kolom 2: Komponen Khusus Hardcover, Sisipan & Foil Gembos */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-800">2. Hardcover, Sisipan & Foil Gembos</h3>
            </div>
            <span className="text-[10px] font-bold bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
              Hardcover
            </span>
          </div>

          {/* Sub: Cetak Sisipan Foto & Teks */}
          <div>
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Sisipan Halaman Foto & Doa (AP 120 gsm):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fieldRow('tarifPrintSisipanFotoA3', 'Print Sisipan Foto FC A3+')}
              {fieldRow('tarifPrintSisipanTeksA3', 'Print Sisipan Teks 2M A3+')}
              {fieldRow('insheetSisipan', 'Insheet Sisipan', false, false, 'lbr')}
            </div>
          </div>

          {/* Sub: Perakitan Hardcover & Aksesoris */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Komponen & Aksesoris Hardcover:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fieldRow('tarifBoardHardcover', 'Board Greyboard No.30/40', true, true)}
              {fieldRow('tarifCasingInHardcover', 'Jasa Casing-In Hardcover', true, true)}
              {fieldRow('tarifSkiblat', 'Skiblat Sambung Dalam')}
              {fieldRow('tarifPitaRumbaiPapercraft', 'Pita Pembatas Rumbai')}
              {fieldRow('tarifSikuSudutEmas', 'Siku Sudut Emas (4 Pcs)')}
              {fieldRow('tarifEmbossFoilGembos', 'Foil Gembos Emboss Setup')}
              {fieldRow('tarifPlastikOppHC', 'Plastik OPP Hardcover /pcs')}
            </div>
          </div>

          {/* Sub: Tarif Laminasi Cover */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
              • Tarif Laminasi Cover (Glossy &amp; Doff):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fieldRow('tarifLaminasiGlossyCm2', 'Laminasi Glossy /cm²', true, true)}
              {fieldRow('tarifLaminasiDoffCm2', 'Laminasi Doff /cm²', true, true)}
              {fieldRow('minLaminasi', 'Min. Order Laminasi')}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Manual Pengguna Master Parameter */}
      {showManualModal && (
        <div
          onClick={() => setShowManualModal(false)}
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
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Manual Pengguna & Pemetaan Sumber Excel</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Buku Surat Yasin
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
              {/* Bagian 1: Pemetaan 4 Kelompok Master Parameter */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Pemetaan 4 Bagian Master Parameter ke File Excel (Folder 02. Pricelist Yasin/*.xlsx)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Poin 1 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Isi Kitab Yasin Kosongan</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Database Harga Isi</strong>: <span className="font-mono text-emerald-700">Data_Yasin!A1:P104</span> & <span className="font-mono text-emerald-700">Master!D36</span>.</li>
                      <li>• <strong>Harga Netto</strong>: 64 Hal: Rp 1.650, 96 Hal: Rp 2.250, 112 Hal: Rp 2.470, 128 Hal: Rp 3.000 (Buya Barokah), 144 Hal: Rp 3.200, 192 Hal: Rp 3.800.</li>
                      <li>• <strong>Kode Master</strong>: <span className="font-mono text-slate-600">Master!D34</span> = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">Bo-[96-2250]-11,5[0#2250]Tgg</code> &amp; <code className="text-[10px] bg-white px-1 py-0.5 rounded border">Bo-[128-3000]-11,5[0#3000]Tgg</code>.</li>
                    </ul>
                  </div>
                  {/* Poin 2 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Cetak Cover & Sisipan (Print Inter A3+)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Print Cover AC 230 / AP 150</strong>: <span className="font-mono text-blue-700">Master!D15</span> (Softcover: Rp 2.500 [insheet 5 lbr], Hardcover: Rp 2.000 / lbr A3+ [insheet 10 lbr]).</li>
                      <li>• <strong>Print Sisipan Foto (4 Warna)</strong>: <span className="font-mono text-blue-700">Master!D23</span> (Rp 1.750 / lbr A3+ AP 120, insheet 2 lbr).</li>
                      <li>• <strong>Print Sisipan Doa Keluarga</strong>: <span className="font-mono text-blue-700">Master!D31</span> (Rp 3.300 / lbr A3+ AP 120 cetak 2 muka bolak-balik, insheet 2 lbr).</li>
                      <li>• <strong>Desain Setting Cover</strong>: <span className="font-mono text-blue-700">Master!D14</span> (Rp 25.000).</li>
                    </ul>
                  </div>

                  {/* Poin 3 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Perakitan Jilid & Skiblat Hardcover</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Skiblat Sambung Dalam</strong>: <span className="font-mono text-amber-700">BUKU!AT6</span> (Rp 350 / buku).</li>
                      <li>• <strong>Susun Sisipan Lembar</strong>: <span className="font-mono text-amber-700">BUKU!AU6</span> (Rp 100 / lbr).</li>
                      <li>• <strong>Steples Tengah</strong>: <span className="font-mono text-amber-700">BUKU!AV6</span> (Rp 50 / buku).</li>
                      <li>• <strong>Potong Sisir 3 Sisi</strong>: <span className="font-mono text-amber-700">BUKU!AW6</span> (Rp 150 / buku).</li>
                      <li>• <strong>Casing-In Hardcover</strong>: <span className="font-mono text-amber-700">BUKU!AZ6</span> (Rp 751,62 / buku).</li>
                    </ul>
                  </div>

                  {/* Poin 4 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Aksesoris, Gembos Emas & OPP</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Pita Pembatas Rumbai</strong>: <span className="font-mono text-violet-700">BUKU!AY6</span> (Rp 470 / buku).</li>
                      <li>• <strong>Siku Sudut Emas (4 Pcs)</strong>: <span className="font-mono text-violet-700">Master Parameter</span> (Rp 400 / set, opsi tambahan di luar paket standar).</li>
                      <li>• <strong>Gembos Klise Foil Emas</strong>: <span className="font-mono text-violet-700">Master!D40</span> (Rp 195.000 / pack = Rp 4.875 / 12 pcs setup).</li>
                      <li>• <strong>Plastik OPP /Pack</strong>: <span className="font-mono text-violet-700">BUKU!AX6 / BC6</span> (Softcover: min 1 pack 100 pcs @ Rp 90 = Rp 9.000, Hardcover: Rp 95 / buku).</li>
                      <li>• <strong>Target Margin Standar</strong>: <span className="font-mono text-violet-700">Master!E43 &amp; Sheet Harga 2026</span> (30% pembulatan ke kelipatan 10 / ratusan).</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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
