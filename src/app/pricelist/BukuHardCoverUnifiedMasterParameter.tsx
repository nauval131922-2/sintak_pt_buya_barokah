'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Printer,
  Layers,
  Scissors,
  BookCopy,
  Search,
  Sliders,
} from 'lucide-react';
import {
  DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS,
  BukuHardCoverUnifiedParams,
} from '@/lib/buku-hard-cover-unified';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface BukuHardCoverUnifiedMasterParameterProps {
  customParams: BukuHardCoverUnifiedParams;
  setCustomParams: React.Dispatch<React.SetStateAction<BukuHardCoverUnifiedParams>>;
}

type FieldDef = {
  key: keyof BukuHardCoverUnifiedParams;
  label: string;
  opts?: { rupiah?: boolean; decimal?: boolean; suffix?: string };
};

type GroupDef = {
  title: string;
  border: string;
  labelCls: string;
  fields: FieldDef[];
};

const COVER_GROUPS: GroupDef[] = [
  {
    title: 'Kertas Cover',
    border: 'border-sky-300',
    labelCls: 'text-sky-800',
    fields: [
      { key: 'hargaKertasCoverPerKg', label: 'Harga Kertas Cover / kg' },
      { key: 'gramaturCover', label: 'Gramatur Cover', opts: { rupiah: false, suffix: ' gsm' } },
      { key: 'insheetCoverOffset', label: 'Insheet Cover (Offset)', opts: { rupiah: false, suffix: ' lbr' } },
      { key: 'insheetCoverPrint', label: 'Insheet Cover (Print)', opts: { rupiah: false, suffix: ' lbr' } },
    ],
  },
  {
    title: 'Desain & Print Cover',
    border: 'border-cyan-300',
    labelCls: 'text-cyan-800',
    fields: [
      { key: 'biayaDesainCover', label: 'Biaya Desain Cover' },
      { key: 'tarifPrintCoverA3', label: 'Tarif Print A3+ Cover' },
    ],
  },
  {
    title: 'Mesin Oliver (Cover)',
    border: 'border-sky-300',
    labelCls: 'text-sky-800',
    fields: [
      { key: 'tarifPlateCoverOliver', label: 'Tarif Plat Oliver' },
      { key: 'minOngkosCoverOliver', label: 'Min Ongkos Oliver' },
      { key: 'drekCoverOliver', label: 'Drek Oliver / lbr' },
    ],
  },
  {
    title: 'Mesin SM 102 (Cover)',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifPlateCoverSM', label: 'Tarif Plat SM 102' },
      { key: 'minOngkosCoverSM', label: 'Min Ongkos SM 102' },
      { key: 'drekCoverSM', label: 'Drek SM 102 / lbr' },
    ],
  },
];

const BOARD_SKIBLAT_GROUPS: GroupDef[] = [
  {
    title: 'Yellow Board (Gembos)',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'hargaBoardPerPack', label: 'Harga Board / Pack' },
      { key: 'lembarPerPackBoard', label: 'Lembar per Pack', opts: { rupiah: false, suffix: ' lbr' } },
      { key: 'insheetBoardMin', label: 'Insheet Board Min', opts: { rupiah: false, suffix: ' pcs' } },
      { key: 'targetPouncePerHari', label: 'Target Pounce / Hari', opts: { rupiah: false, suffix: ' exp' } },
    ],
  },
  {
    title: 'Casing & Lem Hard Cover',
    border: 'border-yellow-300',
    labelCls: 'text-yellow-800',
    fields: [
      { key: 'hargaLemHardCoverKg', label: 'Harga Lem HC / kg' },
      { key: 'targetHardCoverPerHari', label: 'Target Making Casing / Hari', opts: { rupiah: false, suffix: ' exp' } },
      { key: 'targetRoundingCoverPerHari', label: 'Target Rounding Cover / Hari', opts: { rupiah: false, suffix: ' exp' } },
    ],
  },
  {
    title: 'Kertas Skiblat (Art Carton)',
    border: 'border-orange-300',
    labelCls: 'text-orange-800',
    fields: [
      { key: 'hargaKertasSkiblatPerKg', label: 'Harga Kertas Skiblat / kg' },
      { key: 'gramaturSkiblat', label: 'Gramatur Skiblat', opts: { rupiah: false, suffix: ' gsm' } },
      { key: 'insheetSkiblat', label: 'Insheet Skiblat', opts: { rupiah: false, suffix: ' lbr' } },
      { key: 'tarifPrintSkiblatA3', label: 'Tarif Print A3+ Skiblat' },
      { key: 'targetLipatSkiblatPerHari', label: 'Target Lipat Skiblat / Hari', opts: { rupiah: false, suffix: ' exp' } },
    ],
  },
];

const ISI_GROUPS: GroupDef[] = [
  {
    title: 'Kertas Isi (HVS)',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'hargaKertasIsiPerKg', label: 'Harga Kertas Isi / kg' },
      { key: 'gramaturIsi', label: 'Gramatur Isi', opts: { rupiah: false, suffix: ' gsm' } },
      { key: 'insheetIsiOffset', label: 'Insheet Isi (Offset)', opts: { rupiah: false, suffix: ' lbr' } },
      { key: 'insheetIsiPrint', label: 'Insheet Isi (Print)', opts: { rupiah: false, suffix: ' lbr' } },
    ],
  },
  {
    title: 'Desain & Print Isi',
    border: 'border-indigo-300',
    labelCls: 'text-indigo-800',
    fields: [
      { key: 'biayaDesainIsiPerLbr', label: 'Desain Isi / Lembar' },
      { key: 'tarifPrintIsiA4', label: 'Print Isi (A5 & A6)' },
      { key: 'tarifPrintIsiA3', label: 'Print Isi (A4 21x29,7)' },
    ],
  },
  {
    title: 'Mesin Ryobi (Isi A5/A6)',
    border: 'border-teal-300',
    labelCls: 'text-teal-800',
    fields: [
      { key: 'tarifPlateIsiRyobi', label: 'Tarif Plat Ryobi' },
      { key: 'minOngkosIsiRyobi', label: 'Min Ongkos Ryobi' },
      { key: 'drekIsiRyobi', label: 'Drek Ryobi / lbr' },
    ],
  },
  {
    title: 'Mesin Oliver & SM (Isi)',
    border: 'border-cyan-300',
    labelCls: 'text-cyan-800',
    fields: [
      { key: 'tarifPlateIsiOliver', label: 'Tarif Plat Oliver' },
      { key: 'minOngkosIsiOliver', label: 'Min Ongkos Oliver' },
      { key: 'drekIsiOliver', label: 'Drek Oliver / lbr' },
      { key: 'tarifPlateIsiSM', label: 'Tarif Plat SM 102' },
      { key: 'minOngkosIsiSM', label: 'Min Ongkos SM 102' },
      { key: 'drekIsiSM', label: 'Drek SM 102 / lbr' },
    ],
  },
];

const FINISHING_GROUPS: GroupDef[] = [
  {
    title: 'Lipat, Susun & Jahit',
    border: 'border-violet-300',
    labelCls: 'text-violet-800',
    fields: [
      { key: 'targetLipatIsiPerHari', label: 'Target Lipat / Hari', opts: { rupiah: false, suffix: ' katern' } },
      { key: 'targetSusunIsiBasis', label: 'Target Susun Basis', opts: { rupiah: false } },
      { key: 'targetSisipPerHari', label: 'Target Sisip / Hari', opts: { rupiah: false, suffix: ' exp' } },
      { key: 'hargaBenangJahitRoll', label: 'Harga Benang / Roll' },
      { key: 'targetJahitIsiBasis', label: 'Target Jahit Basis', opts: { rupiah: false } },
      { key: 'targetLemPressSkiblatPerHari', label: 'Target Lem Press / Hari', opts: { rupiah: false, suffix: ' exp' } },
      { key: 'tarifSisirPerExp', label: 'Tarif Sisir 3 Sisi' },
    ],
  },
  {
    title: 'Aksesoris & Casing In',
    border: 'border-purple-300',
    labelCls: 'text-purple-800',
    fields: [
      { key: 'hargaHeadbandMeter', label: 'Harga Headband / Meter' },
      { key: 'targetPasangHeadbandPerHari', label: 'Target Headband / Hari', opts: { rupiah: false, suffix: ' exp' } },
      { key: 'hargaPitaRoll', label: 'Harga Pita / Roll' },
      { key: 'targetPasangPitaPerHari', label: 'Target Pasang Pita / Hari', opts: { rupiah: false, suffix: ' exp' } },
      { key: 'hargaCraftPlano', label: 'Harga Craft / Plano' },
      { key: 'targetPasangCraftPerHari', label: 'Target Pasang Craft / Hari', opts: { rupiah: false, suffix: ' exp' } },
      { key: 'targetPilungPerHari', label: 'Target Pilung (Rounding Isi)', opts: { rupiah: false, suffix: ' exp' } },
      { key: 'targetCasingInPerHari', label: 'Target Casing-In / Hari', opts: { rupiah: false, suffix: ' exp' } },
    ],
  },
  {
    title: 'Packing & Dus',
    border: 'border-fuchsia-300',
    labelCls: 'text-fuchsia-800',
    fields: [
      { key: 'hargaKardusBox', label: 'Harga Kardus / Dus' },
      { key: 'hargaLakbanRoll', label: 'Harga Lakban / Roll' },
      { key: 'hargaPlastikShrinkRoll', label: 'Harga Plastik Shrink / Roll' },
      { key: 'targetShrinkPerHari', label: 'Target Shrink / Hari', opts: { rupiah: false, suffix: ' exp' } },
    ],
  },
];

const LANJUTAN_GROUPS: GroupDef[] = [
  {
    title: 'Laminasi Cover',
    border: 'border-slate-300',
    labelCls: 'text-slate-800',
    fields: [
      { key: 'hargaLaminasiGlossyRoll', label: 'Laminasi Glossy / Roll' },
      { key: 'hargaLaminasiDoffRoll', label: 'Laminasi Doff / Roll' },
      { key: 'targetLaminasiPerHari', label: 'Target Laminasi / Hari', opts: { rupiah: false, suffix: ' exp' } },
      { key: 'minBiayaLaminasi', label: 'Min Biaya Laminasi' },
    ],
  },
  {
    title: 'Foil, Spot UV & Emboss',
    border: 'border-slate-300',
    labelCls: 'text-slate-800',
    fields: [
      { key: 'hargaFoilRoll', label: 'Plastik Foil / Roll' },
      { key: 'targetFoilPerHari', label: 'Target Foil / Hari', opts: { rupiah: false, suffix: ' exp' } },
      { key: 'minBiayaFoil', label: 'Min Biaya Foil' },
      { key: 'hargaSpotUvKg', label: 'Tinta Spot UV / kg' },
      { key: 'targetSpotUvPerHari', label: 'Target Spot UV / Hari', opts: { rupiah: false, suffix: ' exp' } },
      { key: 'minBiayaSpotUv', label: 'Min Biaya Spot UV' },
      { key: 'targetEmbossPerHari', label: 'Target Emboss / Hari', opts: { rupiah: false, suffix: ' exp' } },
      { key: 'minBiayaEmboss', label: 'Min Biaya Emboss' },
    ],
  },
  {
    title: 'UMR & Margin Standar',
    border: 'border-slate-300',
    labelCls: 'text-slate-800',
    fields: [
      { key: 'umr', label: 'Basis UMR Harian' },
      { key: 'marginPersen', label: 'Margin / Profit Standar', opts: { rupiah: false, suffix: '%' } },
    ],
  },
];

export default function BukuHardCoverUnifiedMasterParameter({
  customParams,
  setCustomParams,
}: BukuHardCoverUnifiedMasterParameterProps) {
  const [q, setQ] = useState('');

  const isFieldModified = (key: keyof BukuHardCoverUnifiedParams) =>
    (customParams[key] ?? DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS[key]) !==
    DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS[key];

  const handleChange = (key: keyof BukuHardCoverUnifiedParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: val }));
  };

  const handleResetField = (key: keyof BukuHardCoverUnifiedParams) => {
    setCustomParams((prev) => ({
      ...prev,
      [key]: DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS[key],
    }));
    toast.info(`Field kembali ke Master (${DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS[key]}).`);
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS[f.key];
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
                title="Kembalikan ke standar Master"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ThousandInput
            value={customParams[key] ?? DEFAULT_BUKU_HARD_COVER_UNIFIED_PARAMS[key]}
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

  const lanjutanVisible = LANJUTAN_GROUPS.some((g) => g.fields.some((f) => matchQ(f.label)));

  return (
    <div className="flex flex-col gap-4 pb-8 overflow-y-auto">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-10 relative bg-slate-50/95 backdrop-blur-xs py-1 -my-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari parameter tarif, kertas, plat, atau upah…"
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
        />
      </div>

      <div className="columns-1 md:columns-2 gap-4">
        {cardShell(
          'bg-sky-50/40 border-sky-200',
          cardHeader('text-sky-900 bg-sky-200/80', 'Cover', Printer, 'text-sky-600', '1. Cover & Cetak Cover'),
          COVER_GROUPS,
          <p className="text-[10px] text-slate-500">
            Cover Print Inter: Rp {customParams.tarifPrintCoverA3.toLocaleString('id-ID')}/lbr A3+. Oliver & SM: Plat + Min Ongkos + Drek mengikuti standar Master.
          </p>
        )}

        {cardShell(
          'bg-amber-50/40 border-amber-200',
          cardHeader('text-amber-900 bg-amber-200/80', 'Board', Layers, 'text-amber-600', '2. Board, Casing & Skiblat'),
          BOARD_SKIBLAT_GROUPS,
          <p className="text-[10px] text-slate-500">
            Yellow Board No. 30 per pack isi 30 lembar. Kapasitas potong: 10,5x14,8 (12 pcs), 14,5x20,25 (7 pcs), 21x29,7 (3 pcs).
          </p>
        )}

        {cardShell(
          'bg-blue-50/40 border-blue-200',
          cardHeader('text-blue-900 bg-blue-200/80', 'Isi', BookCopy, 'text-blue-600', '3. Kertas Isi & Cetak Isi'),
          ISI_GROUPS,
          <p className="text-[10px] text-slate-500">
            HVS 70 gsm plano 61x86 cm. Ryobi hanya untuk A5 & A6 (min ongkos Rp {customParams.minOngkosIsiRyobi.toLocaleString('id-ID')}).
          </p>
        )}

        {cardShell(
          'bg-violet-50/40 border-violet-200',
          cardHeader('text-violet-900 bg-violet-200/80', 'Finishing', Scissors, 'text-violet-600', '4. Finishing Jilid & Aksesoris'),
          FINISHING_GROUPS,
          <p className="text-[10px] text-slate-500">
            Upah lipat, susun, jahit, casing-in, headband, pita, dan craft berbasis UMR harian Rp {(customParams.umr / 25).toLocaleString('id-ID', { maximumFractionDigits: 0 })}.
          </p>
        )}

        {/* 5. Lanjutan — Terbuka Penuh */}
        {lanjutanVisible && (
          <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col gap-3 break-inside-avoid mb-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">Lanjutan</span>
              <Sliders className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-700">5. Finishing Khusus & Margin</h3>
            </div>
            <div className="flex flex-col gap-2.5">
              {LANJUTAN_GROUPS.map(subGroup)}
            </div>
            <p className="text-[10px] text-slate-500">
              Laminasi, Foil, Spot UV, Emboss dihitung saat dipilih di simulator. Laba standar {customParams.marginPersen}%, pembulatan puluhan ke atas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
