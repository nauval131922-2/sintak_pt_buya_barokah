'use client';

import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  HelpCircle,
  X,
  Layers,
  Box,
  Search,
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

interface FieldDef {
  key: keyof YasinMasterParams;
  label: string;
  opts?: {
    rupiah?: boolean;
    decimal?: boolean;
    suffix?: string;
  };
}

interface GroupDef {
  title: string;
  border: string;
  labelCls: string;
  fields: FieldDef[];
}

const SOFTCOVER_GROUPS: GroupDef[] = [
  {
    title: 'Harga Isi Kitab Yasin (per Buku)',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'hargaIsiYasin64', label: 'Yasin 64 Hal' },
      { key: 'hargaIsiYasin96', label: 'Yasin 96 Hal' },
      { key: 'hargaIsiYasin112', label: 'Yasin 112 Hal' },
      { key: 'hargaIsiYasin128', label: 'Yasin 128 Hal' },
      { key: 'hargaIsiYasin144', label: 'Yasin 144 Hal' },
      { key: 'hargaIsiYasin192', label: 'Yasin 192 Hal' },
    ],
  },
  {
    title: 'Cetak Cover Softcover (AC 230) & Hardcover (AP 150)',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'tarifPrintCoverA3', label: 'Print Cover A3+ Soft (AC 230)' },
      { key: 'tarifPrintCoverHC', label: 'Print Cover A3+ Hard (AP 150)' },
      { key: 'tarifDesainCover', label: 'Jasa Desain Cover & Foto' },
      { key: 'insheetCover', label: 'Insheet Cover Soft (lbr A3+)', opts: { rupiah: false, suffix: ' A3+' } },
      { key: 'insheetCoverHC', label: 'Insheet Cover Hard (lbr A3+)', opts: { rupiah: false, suffix: ' A3+' } },
    ],
  },
  {
    title: 'Finishing Jilid Dasar & Softcover',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'tarifSisipLembar', label: 'Ongkos Sisip /lbr' },
      { key: 'tarifStaplesYasin', label: 'Ongkos Staples /buku' },
      { key: 'tarifSisirYasin', label: 'Ongkos Sisir Potong /buku' },
      { key: 'tarifPasangCoverSoft', label: 'Pasang Cover Soft /buku' },
      { key: 'tarifPlastikOppYasin', label: 'Plastik OPP Soft /pcs' },
    ],
  },
];

const HARDCOVER_GROUPS: GroupDef[] = [
  {
    title: 'Sisipan Halaman Foto & Doa (AP 120 gsm)',
    border: 'border-purple-300',
    labelCls: 'text-purple-800',
    fields: [
      { key: 'tarifPrintSisipanFotoA3', label: 'Print Sisipan Foto FC A3+' },
      { key: 'tarifPrintSisipanTeksA3', label: 'Print Sisipan Teks 2M A3+' },
      { key: 'insheetSisipan', label: 'Insheet Sisipan', opts: { rupiah: false, suffix: ' lbr' } },
    ],
  },
  {
    title: 'Komponen & Aksesoris Hardcover',
    border: 'border-purple-300',
    labelCls: 'text-purple-800',
    fields: [
      { key: 'tarifBoardHardcover', label: 'Board Greyboard No.30/40', opts: { decimal: true } },
      { key: 'tarifCasingInHardcover', label: 'Jasa Casing-In Hardcover', opts: { decimal: true } },
      { key: 'tarifSkiblat', label: 'Skiblat Sambung Dalam' },
      { key: 'tarifPitaRumbaiPapercraft', label: 'Pita Pembatas Rumbai' },
      { key: 'tarifSikuSudutEmas', label: 'Siku Sudut Emas (4 Pcs)' },
      { key: 'tarifEmbossFoilGembos', label: 'Foil Gembos Emboss Setup' },
      { key: 'tarifPlastikOppHC', label: 'Plastik OPP Hardcover /pcs' },
    ],
  },
  {
    title: 'Tarif Laminasi Cover (Glossy & Doff)',
    border: 'border-purple-300',
    labelCls: 'text-purple-800',
    fields: [
      { key: 'tarifLaminasiGlossyCm2', label: 'Laminasi Glossy /cm²', opts: { decimal: true } },
      { key: 'tarifLaminasiDoffCm2', label: 'Laminasi Doff /cm²', opts: { decimal: true } },
      { key: 'minLaminasi', label: 'Min. Order Laminasi' },
    ],
  },
];

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
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof YasinMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof YasinMasterParams) =>
    (customParams[key] ?? DEFAULT_YASIN_PARAMS[key]) !== DEFAULT_YASIN_PARAMS[key];

  const handleResetField = (key: keyof YasinMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_YASIN_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_YASIN_PARAMS[key]}).`);
  };

  const isModified = useMemo(
    () => YASIN_VISIBLE_KEYS.some((key) => (customParams[key] ?? DEFAULT_YASIN_PARAMS[key]) !== DEFAULT_YASIN_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      YASIN_VISIBLE_KEYS.forEach((k) => {
        resetObj[k] = DEFAULT_YASIN_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Buku Surat Yasin dikembalikan ke standar master.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_YASIN_PARAMS[f.key];
    if (f.opts?.suffix === '%') return `${def}%`;
    if (f.opts?.rupiah === false && !f.opts?.decimal) return Number(def).toLocaleString('id-ID');
    if (f.opts?.rupiah === false) return String(def);
    return `Rp ${Number(def).toLocaleString('id-ID')}`;
  };

  const matchQ = (label: string) =>
    q.trim() === '' || label.toLowerCase().includes(q.trim().toLowerCase());

  const fieldRow = (f: FieldDef) => {
    const key = f.key;
    const isRupiah = f.opts?.rupiah ?? true;
    const isDecimal = f.opts?.decimal ?? false;
    const modified = isFieldModified(key);
    const rawVal = customParams[key] ?? DEFAULT_YASIN_PARAMS[key];
    const val = typeof rawVal === 'number' ? rawVal : 0;

    return (
      <div
        key={key}
        className={`p-2.5 rounded-lg border transition-all ${
          modified
            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
            : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <label className="text-xs font-semibold text-slate-700 truncate" title={f.label}>
            {f.label}
          </label>
          <div className="flex items-center gap-1 shrink-0">
            {modified && (
              <button
                type="button"
                onClick={() => handleResetField(key)}
                className="text-amber-700 hover:text-amber-900 flex items-center bg-amber-100/80 p-1 rounded cursor-pointer shrink-0"
                title="Reset ke standar master"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ThousandInput
            value={val}
            onValueChange={(v) => handleChange(key, v || 0)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
            prefix={isRupiah ? 'Rp' : undefined}
            suffix={f.opts?.suffix}
            allowDecimals={isDecimal}
          />
        </div>
        {modified && (
          <p className="text-[10px] text-slate-500 mt-1">Master: {fmtStd(f)}</p>
        )}
      </div>
    );
  };

  const subGroup = (g: GroupDef) => {
    const visible = g.fields.filter((f) => matchQ(f.label));
    if (visible.length === 0) return null;
    return (
      <div key={g.title} className={`rounded-lg border ${g.border} bg-white/70 p-2.5 space-y-2`}>
        <span className={`block text-[10px] font-black uppercase tracking-wider ${g.labelCls}`}>{g.title}</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{visible.map(fieldRow)}</div>
      </div>
    );
  };

  const cardShell = (cls: string, header: React.ReactNode, groups: GroupDef[], note?: React.ReactNode) => {
    const hasVisible = groups.some((g) => g.fields.some((f) => matchQ(f.label)));
    if (!hasVisible) return null;
    return (
      <div className={`${cls} rounded-xl border p-4 shadow-2xs flex flex-col gap-3 break-inside-avoid mb-4`}>
        {header}
        <div className="flex flex-col gap-2.5">{groups.map(subGroup)}</div>
        {note}
      </div>
    );
  };

  const cardHeader = (badgeCls: string, badge: string, Icon: any, iconCls: string, title: string) => (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${badgeCls}`}>{badge}</span>
      <Icon className={`w-4 h-4 ${iconCls}`} />
      <h3 className="text-xs font-bold text-slate-800">{title}</h3>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 pb-8 overflow-y-auto">
      {/* Sticky Search Bar & Actions */}
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs py-1 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama parameter ..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs font-medium"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowManualModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition cursor-pointer shrink-0"
        >
          <HelpCircle size={14} className="text-slate-500" />
          <span>Panduan & Rumus</span>
        </button>
        {isModified && (
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs transition cursor-pointer shrink-0"
          >
            <RotateCcw size={14} />
            <span>Reset Semua</span>
          </button>
        )}
      </div>

      {/* Grid 2 Kolom Seimbang */}
      <div className="columns-1 md:columns-2 gap-4">
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-emerald-900 bg-emerald-100', 'Softcover', Box, 'text-emerald-700', '1. Isi Kitab Yasin Kosongan & Softcover'),
          SOFTCOVER_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-purple-900 bg-purple-100', 'Hardcover', Layers, 'text-purple-600', '2. Hardcover, Sisipan & Foil Gembos'),
          HARDCOVER_GROUPS
        )}
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
                  <HelpCircle className="w-5 h-5" />
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
                      <span>3. Perakitan Jilid &amp; Hardcover</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Board Hardcover No.30/40</strong>: <span className="font-mono text-amber-700">BUKU!BA6</span> (Rp 279,48 / buku).</li>
                      <li>• <strong>Casing-In Hardcover</strong>: <span className="font-mono text-amber-700">BUKU!AZ6</span> (Formula: UMR/25/150 = Rp 751,62 / buku).</li>
                      <li>• <strong>Skiblat Sambung Dalam</strong>: <span className="font-mono text-amber-700">BUKU!AT6</span> (Rp 350 / buku).</li>
                      <li>• <strong>Susun Sisipan Lembar</strong>: <span className="font-mono text-amber-700">BUKU!AU6</span> (Rp 100 / lbr).</li>
                      <li>• <strong>Steples Tengah</strong>: <span className="font-mono text-amber-700">BUKU!AV6</span> (Rp 50 / buku).</li>
                      <li>• <strong>Potong Sisir 3 Sisi</strong>: <span className="font-mono text-amber-700">BUKU!AW6</span> (Rp 150 / buku).</li>
                      <li>• <strong>Pasang Softcover</strong>: <span className="font-mono text-amber-700">BUKU!AU6 (SC)</span> (Rp 200 / buku).</li>
                    </ul>
                  </div>

                  {/* Poin 4 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Aksesoris, Laminasi, Gembos &amp; OPP</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Pita Pembatas Rumbai</strong>: <span className="font-mono text-violet-700">BUKU!AY6</span> (Rp 470 / buku; Note cell AX6: opsi pembatas Rp 275/pcs).</li>
                      <li>• <strong>Siku Sudut Emas (4 Pcs)</strong>: <span className="font-mono text-violet-700">Master Parameter</span> (Rp 400 / set).</li>
                      <li>• <strong>Gembos Klise Foil Emas</strong>: <span className="font-mono text-violet-700">Master!D40 / 40</span> (Rp 195.000 / pack = Rp 4.875 / setup).</li>
                      <li>• <strong>Plastik OPP</strong>: <span className="font-mono text-violet-700">BUKU!AX6 (SC) / BC6 (HC)</span> (SC: Rp 90/pcs min kelipatan 100, HC: Rp 95/pcs).</li>
                      <li>• <strong>Laminasi Glossy &amp; Doff</strong>: <span className="font-mono text-violet-700">BUKU!BE6 / BH6</span> (Glossy: Rp 0,35/cm², Doff: Rp 0,40/cm², Min. Rp 50.000 di cell BF7/BI7).</li>
                      <li>• <strong>Target Margin Standar</strong>: <span className="font-mono text-violet-700">Master!E43</span> (30% pembulatan puluhan di BUKU!BS7 / BM7).</li>
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
