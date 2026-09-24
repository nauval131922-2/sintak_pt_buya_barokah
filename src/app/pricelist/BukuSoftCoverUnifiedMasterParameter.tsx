'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Printer,
  Layers,
  Scissors,
  BookCopy,
  Search,
  ChevronDown,
} from 'lucide-react';
import {
  DEFAULT_SOFT_COVER_UNIFIED,
  SoftCoverUnifiedParams,
} from '@/lib/buku-soft-cover-unified';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface BukuSoftCoverUnifiedMasterParameterProps {
  customParams: SoftCoverUnifiedParams;
  setCustomParams: React.Dispatch<React.SetStateAction<SoftCoverUnifiedParams>>;
}

type FieldDef = {
  key: keyof SoftCoverUnifiedParams;
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
    title: 'Kertas', border: 'border-sky-300', labelCls: 'text-sky-800',
    fields: [
      { key: 'tarifKertasCoverKg', label: 'Kertas Cover / kg (Rp)' },
      { key: 'gramaturCover', label: 'Gramatur Cover', opts: { rupiah: false } },
      { key: 'upCoverPct', label: 'Up Cover (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'insheetCover', label: 'Insheet Cover (lbr)' },
    ],
  },
  {
    title: 'Cetak', border: 'border-cyan-300', labelCls: 'text-cyan-800',
    fields: [
      { key: 'tarifDesainCover', label: 'Desain Cover (Rp)' },
      { key: 'tarifPrintCoverA3', label: 'Print Cover A3+ (Rp)' },
    ],
  },
];

const ISI_GROUPS: GroupDef[] = [
  {
    title: 'Kertas', border: 'border-blue-300', labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifKertasIsiKg', label: 'Kertas HVS / kg (Rp)' },
      { key: 'upIsiPct', label: 'Up Isi (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'gramaturIsi', label: 'Gramatur Isi', opts: { rupiah: false } },
      { key: 'insheetIsi', label: 'Insheet Isi (lbr)' },
    ],
  },
  {
    title: 'Desain', border: 'border-indigo-300', labelCls: 'text-indigo-800',
    fields: [
      { key: 'tarifDesainIsiPerUnit', label: 'Desain Isi per Lembar (Rp)' },
      { key: 'tarifDesainIsiPerHlm', label: 'Desain Isi per Halaman (Rp)' },
    ],
  },
  {
    title: 'Plate & Cetak', border: 'border-sky-300', labelCls: 'text-sky-800',
    fields: [
      { key: 'tarifPlateIsi', label: 'Plate Isi (Rp)' },
      { key: 'tarifCetakMinIsi', label: 'Min Cetak (Rp)' },
      { key: 'tarifDrekIsi', label: 'Drek Isi (Rp)' },
    ],
  },
  {
    title: 'Print Isi', border: 'border-teal-300', labelCls: 'text-teal-800',
    fields: [
      { key: 'tarifPrintBuyaIsi', label: 'Print Isi Buya flat (Rp)' },
      { key: 'tarifPrintIsiA3', label: 'Print Isi A3+ (Rp)' },
    ],
  },
];

const JASA_GROUPS: GroupDef[] = [
  {
    title: 'Tenaga', border: 'border-violet-300', labelCls: 'text-violet-800',
    fields: [
      { key: 'umr', label: 'UMR (Rp)' },
      { key: 'tarifRoyalti', label: 'Royalty / pcs (Rp)' },
    ],
  },
  {
    title: 'Habis Pakai', border: 'border-purple-300', labelCls: 'text-purple-800',
    fields: [
      { key: 'tarifKawatRoll', label: 'Kawat Stiching /roll (Rp)' },
      { key: 'tarifTintaSpotUV', label: 'Tinta Spot UV /kg (Rp)' },
      { key: 'tarifSteplesPack', label: 'Steples 369/Pack (Rp)' },
      { key: 'tarifSisirPerPcs', label: 'Sisir / pcs (Rp) — 150 flat' },
    ],
  },
  {
    title: 'Kemas', border: 'border-fuchsia-300', labelCls: 'text-fuchsia-800',
    fields: [
      { key: 'tarifShrinkRoll', label: 'Shrink /roll (Rp)' },
      { key: 'tarifLakbanRoll', label: 'Lakban /roll (Rp)' },
      { key: 'tarifKardusBox', label: 'Kardus /box (Rp)' },
    ],
  },
];

const FINISH_GROUPS: GroupDef[] = [
  {
    title: 'Bending', border: 'border-amber-300', labelCls: 'text-amber-800',
    fields: [{ key: 'tarifBending', label: 'Bending (Rp)' }],
  },
  {
    title: 'Laminasi & UV', border: 'border-orange-300', labelCls: 'text-orange-800',
    fields: [
      { key: 'tarifLaminasiGlossy', label: 'Glossy /cm²', opts: { decimal: true } },
      { key: 'tarifLaminasiDoff', label: 'Doff /cm²', opts: { decimal: true } },
      { key: 'tarifUvVarnish', label: 'UV /cm²', opts: { decimal: true } },
    ],
  },
  {
    title: 'Laba', border: 'border-yellow-300', labelCls: 'text-yellow-800',
    fields: [{ key: 'marginDefaultPct', label: 'Margin Default (%)', opts: { rupiah: false, suffix: '%' } }],
  },
];

// Jarang diubah — collapsed default.
const RARE_GROUPS: GroupDef[] = [
  {
    title: 'Target Harian', border: 'border-teal-300', labelCls: 'text-teal-800',
    fields: [
      { key: 'targetLipat', label: 'Target Lipat /hari' },
      { key: 'targetSisir', label: 'Target Sisir /hari' },
      { key: 'targetSusunKomplit', label: 'Target Susun Komplit /hari' },
      { key: 'targetKawatRoll', label: 'Kawat 1 roll jadi (pcs)' },
      { key: 'targetStiching', label: 'Target Stiching /hari' },
    ],
  },
  {
    title: 'Batas Bawah (Floor)', border: 'border-slate-300', labelCls: 'text-slate-600',
    fields: [
      { key: 'minBending', label: 'Floor Bending (Rp)' },
      { key: 'minFinishing', label: 'Floor Finishing (Rp)' },
    ],
  },
];

export default function BukuSoftCoverUnifiedMasterParameter({
  customParams,
  setCustomParams,
}: BukuSoftCoverUnifiedMasterParameterProps) {
  const [q, setQ] = useState('');

  const handleChange = (key: keyof SoftCoverUnifiedParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof SoftCoverUnifiedParams) =>
    customParams[key] !== DEFAULT_SOFT_COVER_UNIFIED[key];

  const handleResetField = (key: keyof SoftCoverUnifiedParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_SOFT_COVER_UNIFIED[key] }));
    toast.info(`Field dikembalikan ke standar (${DEFAULT_SOFT_COVER_UNIFIED[key]}).`);
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_SOFT_COVER_UNIFIED[f.key];
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
                className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                title="Reset ke default"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Def
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ThousandInput
            value={customParams[key] ?? DEFAULT_SOFT_COVER_UNIFIED[key]}
            onValueChange={(v) => handleChange(key, v || 0)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
            prefix={isRupiah ? 'Rp' : undefined}
            suffix={f.opts?.suffix}
            allowDecimals={isDecimal}
          />
        </div>
        {modified && (
          <p className="text-[10px] text-slate-500 mt-1">Standar file: {fmtStd(f)}</p>
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

  const rareVisible = RARE_GROUPS.some((g) => g.fields.some((f) => matchQ(f.label)));

  return (
    <div className="flex flex-col gap-4 pb-8 overflow-y-auto">
      {/* Cari field — sticky agar tetap terlihat saat scroll */}
      <div className="sticky top-0 z-10 relative bg-slate-50/95 backdrop-blur-xs py-1 -my-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari parameter… mis. UMR, laminasi, target"
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
        />
      </div>

      <div className="columns-1 md:columns-2 gap-4">
        {cardShell(
          'bg-sky-50/40 border-sky-200',
          cardHeader('text-sky-900 bg-sky-200/80', 'Cover', Printer, 'text-sky-600', '1. Cover'),
          COVER_GROUPS,
          <p className="text-[10px] text-slate-500">
            Cover Print Inter: all-in Rp {customParams.tarifPrintCoverA3.toLocaleString('id-ID')}/lembar. Cover Oliver: mengikuti harga rim + plate per file.
          </p>
        )}

        {cardShell(
          'bg-blue-50/40 border-blue-200',
          cardHeader('text-blue-900 bg-blue-200/80', 'Isi', BookCopy, 'text-blue-600', '2. Isi HVS'),
          ISI_GROUPS,
          <p className="text-[10px] text-slate-500">
            Tarif plate/min/drek hanya untuk file 17.
          </p>
        )}

        {cardShell(
          'bg-violet-50/40 border-violet-200',
          cardHeader('text-violet-900 bg-violet-200/80', 'Jasa', Scissors, 'text-violet-600', '3. Jasa, Kawat & Kemas'),
          JASA_GROUPS,
          <p className="text-[10px] text-slate-500">
            Jasa harian, SpotUV/Emboss/Shrink/Packing mengikuti file dan saklar Komponen Tambahan.
          </p>
        )}

        {cardShell(
          'bg-amber-50/40 border-amber-200',
          cardHeader('text-amber-900 bg-amber-200/80', 'Finishing', Layers, 'text-amber-600', '4. Bending, Laminasi & Margin'),
          FINISH_GROUPS,
          <p className="text-[10px] text-slate-500">
            Floor finishing Rp {customParams.minFinishing.toLocaleString('id-ID')}, bending Rp {customParams.minBending.toLocaleString('id-ID')}. Margin {customParams.marginDefaultPct}%, harga ke puluhan.
          </p>
        )}

        {/* 5. Jarang diubah — collapsed */}
        {rareVisible && (
          <details
            open={q.trim() !== '' ? true : undefined}
            className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 shadow-2xs break-inside-avoid mb-4"
          >
            <summary className="flex items-center gap-2 cursor-pointer list-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">Lanjutan</span>
              <h3 className="text-xs font-bold text-slate-700">5. Target Harian & Batas Bawah</h3>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto" />
            </summary>
            <div className="flex flex-col gap-2.5 mt-3">
              {RARE_GROUPS.map(subGroup)}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

