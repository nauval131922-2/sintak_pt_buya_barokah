'use client';

import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Sparkles,
  HelpCircle,
  X,
  Printer,
  BookOpen,
  Search,
} from 'lucide-react';
import {
  DEFAULT_MANASIK_PARAMS,
  ManasikMasterParams,
} from '@/lib/manasik-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface ManasikMasterParameterProps {
  customParams: ManasikMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<ManasikMasterParams>>;
}

interface FieldDef {
  key: keyof ManasikMasterParams;
  label: string;
  badge?: string;
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

const KOSONGAN_GROUPS: GroupDef[] = [
  {
    title: 'Bahan Baku Kertas',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'tarifKertasHvs70Kg', label: 'Kertas HVS 70 gsm / Kg', badge: 'Folio HVS' },
    ],
  },
  {
    title: 'Insheet Kertas Cetak Isi (Toleransi)',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'insheetIsiBuya', label: 'Insheet Buya', badge: 'Print Buya', opts: { rupiah: false } },
      { key: 'insheetIsiRyobi', label: 'Insheet Ryobi', badge: 'Ryobi', opts: { rupiah: false } },
      { key: 'insheetIsiOliver', label: 'Insheet Oliver', badge: 'Oliver', opts: { rupiah: false } },
    ],
  },
  {
    title: 'Ongkos Cetak & Plat Mesin',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'tarifPrintBuyaPerLbr', label: 'Cetak Print Buya', badge: 'Rp/lbr' },
      { key: 'ryobiPlatUnitIsi', label: 'Plat Ryobi Isi', badge: 'Rp/plat' },
      { key: 'oliverPlatUnitIsi', label: 'Plat Oliver Isi', badge: 'Rp/plat' },
      { key: 'tarifSpiralManasik', label: 'Spiral Kawat Alternatif', badge: 'Spiral' },
    ],
  },
];

const CUSTOM_COVER_GROUPS: GroupDef[] = [
  {
    title: 'Harga Isi Kosongan (per Buku)',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'hargaIsiKosongan208', label: 'Isi 212 Hal (2026)', badge: '212 Hal' },
      { key: 'hargaIsiKosongan192', label: 'Isi 192 Hal (Lama)', badge: '192 Hal' },
      { key: 'hargaIsiKosongan128', label: 'Isi 128 Hal', badge: '128 Hal' },
      { key: 'hargaIsiKosongan96', label: 'Isi 96 Hal', badge: '96 Hal' },
    ],
  },
  {
    title: 'Cetak Cover & Sisipan PT',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'tarifPrintCoverA3', label: 'Print Digital Cover A3+', badge: 'AC 230 Digital' },
      { key: 'tarifPrintSisipanA3', label: 'Print Sisipan PT A3+', badge: 'Sisipan PT' },
      { key: 'tarifDesainCover', label: 'Jasa Desain Cover', badge: 'Cover Baru' },
      { key: 'insheetCover', label: 'Insheet Print Digital', badge: 'lbr A3+', opts: { rupiah: false } },
    ],
  },
  {
    title: 'Cover Offset Oliver (Plano 79x109)',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'oliverPlatUnitCover', label: 'Plat Oliver', badge: 'Rp/plat' },
      { key: 'oliverMinOngkosCover', label: 'Min. Cetak Oliver', badge: '4 Plat' },
      { key: 'oliverDrekOverCover', label: 'Tarif Drek Over', badge: 'Rp/drek' },
      { key: 'insheetOffsetCover', label: 'Insheet Cover Oliver', badge: 'plano', opts: { rupiah: false } },
    ],
  },
  {
    title: 'Jilid Staples, Tali & Finishing',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'tarifTaliKurPerPcs', label: 'Bahan Tali Kur', badge: 'Rp/pcs' },
      { key: 'tarifPasangTali', label: 'Jasa Pasang Tali', badge: 'Rp/pcs' },
      { key: 'tarifLubangBor', label: 'Lubang Bor Mata Ayam', badge: 'Rp/pcs' },
      { key: 'tarifBendingPerCm2', label: 'Tarif Lem Panas', badge: 'Bending' },
    ],
  },
];

const MINI_TIKTOK_GROUPS: GroupDef[] = [
  {
    title: 'Print Digital Cocard (A3+ 2 Muka)',
    border: 'border-purple-300',
    labelCls: 'text-purple-800',
    fields: [
      { key: 'tarifPrintMiniTikTokA3', label: 'Print Cocard AC 310 A3+', badge: '20 Kartu/A3+' },
      { key: 'tarifDesainMiniTikTok', label: 'Jasa Desain Cocard', badge: 'Rp/order' },
    ],
  },
  {
    title: 'Cetak Offset Oliver (Plano 79x109 AC 310)',
    border: 'border-purple-300',
    labelCls: 'text-purple-800',
    fields: [
      { key: 'oliverPlatUnitCover', label: 'Plat Oliver (2 Muka)', badge: '8 Plat' },
      { key: 'oliverMinOngkosCover', label: 'Min. Cetak Oliver', badge: 'Rp/order' },
      { key: 'oliverDrekOverCover', label: 'Tarif Drek Over', badge: 'Rp/drek' },
      { key: 'insheetOffsetCover', label: 'Insheet Toleransi', badge: 'plano', opts: { rupiah: false } },
    ],
  },
  {
    title: 'Aksesoris & Perlengkapan Cocard',
    border: 'border-purple-300',
    labelCls: 'text-purple-800',
    fields: [
      { key: 'tarifRingBinderMini', label: 'Ring Binder 3cm', badge: 'Rp/pcs' },
      { key: 'tarifTaliCocardMini', label: 'Tali Cocard Mini', badge: 'Rp/pcs' },
      { key: 'tarifPlastikZiplockMini', label: 'Plastik Ziplock', badge: 'Rp/pcs' },
      { key: 'tarifPisauPoundMini', label: 'Pisau Pond Custom', badge: 'Rp/order' },
    ],
  },
];

const MANASIK_VISIBLE_KEYS: (keyof ManasikMasterParams)[] = [
  'hargaIsiKosongan96',
  'hargaIsiKosongan128',
  'hargaIsiKosongan192',
  'hargaIsiKosongan208',
  'tarifPrintCoverA3',
  'tarifPrintMiniTikTokA3',
  'tarifDesainCover',
  'tarifDesainMiniTikTok',
  'insheetCover',
  'tarifKertasHvs70Kg',
  'tarifPrintSisipanA3',
  'tarifPrintBuyaPerLbr',
  'insheetIsiBuya',
  'insheetIsiRyobi',
  'insheetIsiOliver',
  'ryobiPlatUnitIsi',
  'oliverPlatUnitIsi',
  'tarifBendingPerCm2',
  'tarifLubangBor',
  'tarifPasangTali',
  'tarifStaplesPalu',
  'tarifCasingIn',
  'jasaPlastikOpp',
  'tarifTaliCocardMini',
  'tarifRingBinderMini',
  'tarifPlastikZiplockMini',
  'tarifPisauPoundMini',
  'tarifSpiralManasik',
  'oliverPlatUnitCover',
  'oliverMinOngkosCover',
  'oliverDrekOverCover',
  'insheetOffsetCover',
  'tarifTaliKurPerPcs',
];

export default function ManasikMasterParameter({
  customParams,
  setCustomParams,
}: ManasikMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof ManasikMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof ManasikMasterParams) =>
    (customParams[key] ?? DEFAULT_MANASIK_PARAMS[key]) !== DEFAULT_MANASIK_PARAMS[key];

  const handleResetField = (key: keyof ManasikMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_MANASIK_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_MANASIK_PARAMS[key]}).`);
  };

  const isModified = useMemo(
    () => MANASIK_VISIBLE_KEYS.some((key) => (customParams[key] ?? DEFAULT_MANASIK_PARAMS[key]) !== DEFAULT_MANASIK_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_MANASIK_PARAMS });
    toast.success('Semua parameter Buku Manasik dikembalikan ke standar master 2026.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_MANASIK_PARAMS[f.key];
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
    const rawVal = customParams[key] ?? DEFAULT_MANASIK_PARAMS[key];
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
            {f.badge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200">
                {f.badge}
              </span>
            )}
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
          cardHeader('text-amber-900 bg-amber-100', 'Varian 1', Printer, 'text-amber-700', '1. Kosongan (10 x 15,5 cm)'),
          KOSONGAN_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-emerald-900 bg-emerald-100', 'Varian 2', BookOpen, 'text-emerald-700', '2. Custom Cover (10 x 15,5 cm)'),
          CUSTOM_COVER_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-purple-900 bg-purple-100', 'Varian 3', Sparkles, 'text-purple-600', '3. Cocard Mini TikTok (6,3 x 10,3 cm)'),
          MINI_TIKTOK_GROUPS
        )}
      </div>

      {/* Manual Modal */}
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Buku Manasik
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
              {/* Bagian 1: Pemetaan 3 Varian Master File Excel */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Pemetaan 3 File Master Excel Buku Manasik (Katalog 02020107)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                    <span className="font-bold text-amber-950 text-xs block">1. Kosongan 10 x 15,5 cm</span>
                    <p className="text-[10.5px] text-amber-900 leading-snug">
                      <strong>File:</strong> <code>02020107 BUKU, KITAB SOFT COVER UK. 10 x 15,5 - BUKU MANASIK - Kosongan.xlsm</code><br />
                      <strong>Sheet:</strong> <span className="font-mono font-semibold">Master</span>, <span className="font-mono font-semibold">BUKU</span>, <span className="font-mono font-semibold">HARGA 2026</span>.<br />
                      <strong>Spesifikasi:</strong> Blok isi 212 Hal HVS 70 gsm (Rp 15.700/kg) cetak mesin Print Buya (Rp 350/lbr), Ryobi (Plat), atau Oliver + lipat kuras + susun urut + lem panas bending + kardus master. Margin default 0% (HPP Netto).
                    </p>
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1.5">
                    <span className="font-bold text-emerald-950 text-xs block">2. Custom Cover 10 x 15,5 cm</span>
                    <p className="text-[10.5px] text-emerald-900 leading-snug">
                      <strong>File:</strong> <code>02020107 BUKU, KITAB SOFT COVER UK. 10 x 15,5 - BUKU MANASIK - Custom Cover 2026.xlsm</code><br />
                      <strong>Sheet:</strong> <span className="font-mono font-semibold">Master</span>, <span className="font-mono font-semibold">BUKU</span>, <span className="font-mono font-semibold">HARGA FILE BARU</span>.<br />
                      <strong>Spesifikasi:</strong> Cover AC 230 Print Digital (Rp 2.700) / Mesin Oliver (Plano 79x109) + Sisipan 4 hal PT (Rp 350 + Rp 225,49) + Blok isi 212 hal (Rp 3.620) + Staples kawat + Casing In + Bor + Tali Kur (Rp 285,71 + Rp 112,74) + OPP + Kardus.
                    </p>
                  </div>
                  <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 space-y-1.5">
                    <span className="font-bold text-purple-950 text-xs block">3. Cocard 6,3 x 10,3 cm</span>
                    <p className="text-[10.5px] text-purple-900 leading-snug">
                      <strong>File:</strong> <code>02020107 BUKU, KITAB SOFT COVER UK. 6,3 x 10,3 - BUKU MANASIK MINI TIKTOK.xlsm</code><br />
                      <strong>Sheet:</strong> <span className="font-mono font-semibold">Master</span> & <span className="font-mono font-semibold">BUKU</span>.<br />
                      <strong>Spesifikasi:</strong> AC 310 gsm (Rp 33.500/kg) bolak-balik (48 hal / 24 kartu) Print Digital A3+ (20 kartu/lbr) / Oliver (150 plano) + Pisau Pond Custom (Rp 258.595) + Jasa Pond + Ring Binder 3cm (Rp 925) + Tali cocard (Rp 2.500) + Ziplock (Rp 465) + Margin 32%.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Rincian 3 Kolom Varian Parameter Master */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                  Rincian Rumus & Komponen Parameter per Varian
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Poin 1: Kosongan */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>1. Parameter Kosongan 10 x 15,5</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Kertas HVS 70 gsm</strong>: <span className="font-mono text-amber-700">Kosongan!Master!D22</span> = Rp 15.700 / kg.</li>
                      <li>• <strong>Insheet Toleransi</strong>: Print Buya (5 lbr), Ryobi (100 lbr), Oliver (200 lbr plano).</li>
                      <li>• <strong>Ongkos Cetak Print Buya</strong>: <span className="font-mono text-amber-700">BUKU!AL6</span> = Rp 350 / lbr folio.</li>
                      <li>• <strong>Plat Mesin</strong>: Ryobi (Rp 25.000), Oliver (Rp 40.000).</li>
                    </ul>
                  </div>

                  {/* Poin 2: Custom Cover */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>2. Parameter Custom Cover 10 x 15,5</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga Isi Kosongan 212 Hal</strong>: <span className="font-mono text-emerald-700">Master!D21</span> = Rp 3.620 / eks (192 hal: Rp 3.421, 128 hal: Rp 2.300, 96 hal: Rp 1.800).</li>
                      <li>• <strong>Print Cover AC 230 A3+</strong>: <span className="font-mono text-emerald-700">Master!D18</span> = Rp 2.700 / lbr A3+ (muat 4 cover + 5 insheet).</li>
                      <li>• <strong>Cover Oliver Offset</strong>: Plano 79x109 (16 cover/plano) + 4 Plat (Rp 40.000) + Min Ongkos 4 Plat (Rp 360.000) + Drek Over Rp 40 x 4 + Insheet 200 plano.</li>
                      <li>• <strong>Sisipan 4 Hal PT</strong>: Print A3+ Rp 350 + Sisip Lipat Rp 225,49.</li>
                      <li>• <strong>Jilid Staples + Tali</strong>: Tali Kur Rp 285,71 + Pasang Rp 112,74 + Bor Rp 225,49 + Staples Rp 112,74 + Casing In Rp 225,49.</li>
                    </ul>
                  </div>

                  {/* Poin 3: Cocard TikTok */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>3. Parameter Cocard 6,3 x 10,3 cm</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Print Cocard AC 310 A3+</strong>: <span className="font-mono text-purple-700">Master!D18</span> = Rp 2.500 / lbr A3+ (20 kartu/A3+ bolak-balik).</li>
                      <li>• <strong>Oliver Offset AC 310</strong>: Plano 79x109 + 8 Plat 2 Muka + Insheet 200 plano.</li>
                      <li>• <strong>Pisau & Jasa Pond</strong>: Pisau Rp 258.595/order + Jasa Pond Rp 225,49/lbr.</li>
                      <li>• <strong>Aksesoris</strong>: Ring Binder 3cm (Rp 925) + Tali Cocard (Rp 2.500) + Plastik Ziplock (Rp 465) + Susun Ring (Rp 751,62).</li>
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
