'use client';

import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Printer,
  Layers,
  HelpCircle,
  X,
  FileText,
  Sliders,
  Search,
} from 'lucide-react';
import {
  DEFAULT_BUKU_TULIS_PARAMS,
  BukuTulisMasterParams,
} from '@/lib/buku-tulis-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface BukuTulisMasterParameterProps {
  customParams: BukuTulisMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<BukuTulisMasterParams>>;
}

interface FieldDef {
  key: keyof BukuTulisMasterParams;
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

const KERTAS_INSHEET_GROUPS: GroupDef[] = [
  {
    title: 'Bahan Kertas Cover & Isi',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'tarifArtCarton230Kg', label: 'Art Carton 230 (Rp/Kg)' },
      { key: 'upArtCartonPct', label: 'Markup AC 230 (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'tarifHvs70Kg', label: 'Kertas HVS 70 (Rp/Kg)' },
      { key: 'upHvsPct', label: 'Markup HVS 70 (%)', opts: { rupiah: false, suffix: '%' } },
    ],
  },
  {
    title: 'Insheet Cover & Isi',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'insheetCoverPod', label: 'Insheet Cover Print Inter (lbr)', opts: { rupiah: false } },
      { key: 'insheetCoverOffset', label: 'Insheet Cover Offset (lbr)', opts: { rupiah: false } },
      { key: 'insheetIsiRyobi', label: 'Insheet Isi Ryobi (lbr)', opts: { rupiah: false } },
      { key: 'insheetIsiOliver', label: 'Insheet Isi Oliver (lbr)', opts: { rupiah: false } },
      { key: 'insheetIsiSm', label: 'Insheet Isi SM (lbr)', opts: { rupiah: false } },
    ],
  },
];

const CETAK_DESAIN_GROUPS: GroupDef[] = [
  {
    title: 'Print Cover & Desain Setting',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifPrintCoverA3', label: 'Print Cover Digital A3+ (Rp/lbr)' },
      { key: 'tarifDesignCover', label: 'Desain Setting Cover (Rp)' },
      { key: 'tarifDesignIsiPerHlm', label: 'Desain Setting Isi/Hal (Rp)' },
    ],
  },
  {
    title: 'Mesin Cetak Offset Isi (Ryobi, Oliver, SM)',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifPlatRyobi', label: 'Plat Ryobi (Rp/plat)' },
      { key: 'minOrderRyobi', label: 'Min Order Ryobi (Rp)' },
      { key: 'tarifDrekRyobi', label: 'Ongkos Drek Ryobi (Rp/drek)' },
      { key: 'tarifPlatOliver', label: 'Plat Oliver (Rp/plat)' },
      { key: 'minOrderOliver', label: 'Min Order Oliver (Rp)' },
      { key: 'tarifDrekOliver', label: 'Ongkos Drek Oliver (Rp/drek)' },
      { key: 'tarifPlatSm', label: 'Plat SM (Rp/plat)' },
      { key: 'minOrderSm', label: 'Min Order SM (Rp)' },
      { key: 'tarifDrekSm', label: 'Ongkos Drek SM (Rp/drek)' },
    ],
  },
];

const FINISHING_GROUPS: GroupDef[] = [
  {
    title: 'Finishing, Laminasi & Kemasan',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'tarifLaminasiGlossyCm2', label: 'Laminasi Glossy (Rp/cm²)', opts: { decimal: true } },
      { key: 'minLaminasi', label: 'Min. Order Laminasi (Rp)' },
      { key: 'tarifSisirPerPcs', label: 'Ongkos Sisir / pcs (Rp)' },
      { key: 'tarifTransport', label: 'Ongkos Transport (Rp)' },
      { key: 'tarifKardusBox', label: 'Kardus Box (Rp/box)' },
      { key: 'kapasitasKardus', label: 'Kapasitas Box (pcs/box)', opts: { rupiah: false } },
      { key: 'tarifLakbanRoll', label: 'Lakban Roll (Rp/roll)' },
    ],
  },
];

const MARGIN_GROUPS: GroupDef[] = [
  {
    title: 'Margin & Nego Standar',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'marginDefaultPct', label: 'Margin Default (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'negoDefaultPct', label: 'Nego Default (%)', opts: { rupiah: false, suffix: '%' } },
    ],
  },
];

const BUKU_TULIS_VISIBLE_KEYS: (keyof BukuTulisMasterParams)[] = [
  'tarifArtCarton230Kg',
  'upArtCartonPct',
  'tarifHvs70Kg',
  'upHvsPct',
  'insheetCoverPod',
  'insheetCoverOffset',
  'insheetIsiRyobi',
  'insheetIsiOliver',
  'insheetIsiSm',
  'tarifPrintCoverA3',
  'tarifPlatRyobi',
  'minOrderRyobi',
  'tarifDrekRyobi',
  'tarifPlatOliver',
  'minOrderOliver',
  'tarifDrekOliver',
  'tarifPlatSm',
  'minOrderSm',
  'tarifDrekSm',
  'tarifDesignCover',
  'tarifDesignIsiPerHlm',
  'tarifLaminasiGlossyCm2',
  'minLaminasi',
  'tarifSisirPerPcs',
  'tarifTransport',
  'tarifKardusBox',
  'kapasitasKardus',
  'tarifLakbanRoll',
  'marginDefaultPct',
  'negoDefaultPct',
];

export default function BukuTulisMasterParameter({
  customParams,
  setCustomParams,
}: BukuTulisMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof BukuTulisMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof BukuTulisMasterParams) =>
    (customParams[key] ?? DEFAULT_BUKU_TULIS_PARAMS[key]) !== DEFAULT_BUKU_TULIS_PARAMS[key];

  const handleResetField = (key: keyof BukuTulisMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_BUKU_TULIS_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_BUKU_TULIS_PARAMS[key]}).`);
  };

  const isModified = useMemo(
    () => BUKU_TULIS_VISIBLE_KEYS.some((key) => (customParams[key] ?? DEFAULT_BUKU_TULIS_PARAMS[key]) !== DEFAULT_BUKU_TULIS_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      BUKU_TULIS_VISIBLE_KEYS.forEach((k) => {
        resetObj[k] = DEFAULT_BUKU_TULIS_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Buku Tulis dikembalikan ke standar master.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_BUKU_TULIS_PARAMS[f.key];
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
    const rawVal = customParams[key] ?? DEFAULT_BUKU_TULIS_PARAMS[key];
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
          cardHeader('text-emerald-900 bg-emerald-100', 'Kertas', FileText, 'text-emerald-700', '1. Bahan Kertas & Insheet'),
          KERTAS_INSHEET_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-blue-900 bg-blue-100', 'Mesin', Printer, 'text-blue-600', '2. Cetak & Desain'),
          CETAK_DESAIN_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-emerald-900 bg-emerald-100', 'Finishing', Sliders, 'text-emerald-700', '3. Finishing & Packing'),
          FINISHING_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-amber-900 bg-amber-100', 'Margin', Layers, 'text-amber-600', '4. Margin & Nego Standar'),
          MARGIN_GROUPS,
          <p className="text-[10px] text-slate-500">
            Margin 20% &amp; nego 4% sesuai PRICELIST 2026 sheet HARGA JULI 2026. HPP dihitung per pcs dengan pembulatan ke kelipatan Rp 10.
          </p>
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
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Manual Pengguna &amp; Pemetaan Sumber Excel</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Buku Tulis 72 Hal (06. Pricelist Buku Tulis)
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
                  Pemetaan Master Parameter ke File Excel (Folder 06. Pricelist Buku Tulis/*.xlsx)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan Kertas Cover &amp; Isi</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Art Carton 230 gsm</strong>: <span className="font-mono text-emerald-700">Master!D12</span> Rp 16.400/kg + up 0–5% (<span className="font-mono text-emerald-700">Master!E12</span>).</li>
                      <li>• <strong>Insheet Cover</strong>: <span className="font-mono text-emerald-700">Master!D13 / BUKU!K6</span> (Print Inter: 7 lbr, Oliver: 100 lbr).</li>
                      <li>• <strong>HVS 70 gsm</strong>: <span className="font-mono text-emerald-700">Master!D22</span> Rp 15.700/kg + up 3% (<span className="font-mono text-emerald-700">Master!E22</span>).</li>
                      <li>• <strong>Insheet Isi</strong>: <span className="font-mono text-emerald-700">Master!D23 / BUKU!AI6</span> (Ryobi: 30 lbr, Oliver: 100 lbr), 72 hal = 18 lembar isi/buku.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Cetak Cover &amp; Isi</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Cover Print A3+</strong>: <span className="font-mono text-blue-700">Master!D18</span> Print Inter 1 muka 4W @ Rp 2.500/A3+.</li>
                      <li>• <strong>Isi Ryobi / Oliver</strong>: <span className="font-mono text-blue-700">Master!D27 / BUKU!BD</span> Ryobi 1W bolak-balik @ Rp 2.000/A3+ (≤500 eks), Oliver/SM untuk oplah besar.</li>
                      <li>• <strong>Desain Setting</strong>: Cover <span className="font-mono text-blue-700">Master!D17</span> Rp 20.000 + Isi <span className="font-mono text-blue-700">Master!D26</span> Rp 2.500/hal × 72 hal.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Finishing &amp; Packing</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Laminasi Glossy</strong>: <span className="font-mono text-amber-700">BUKU!CI6</span> Rp 0,35/cm² (min <span className="font-mono text-amber-700">CJ7</span> Rp 50.000) × luas bentangan cover terbuka.</li>
                      <li>• <strong>Potong Sisir 3 Sisi</strong>: <span className="font-mono text-amber-700">BUKU!BT6</span> Rp 150/pcs.</li>
                      <li>• <strong>Ongkos Transport</strong>: Rp 15.000 flat per batch.</li>
                      <li>• <strong>Kardus &amp; Lakban</strong>: <span className="font-mono text-amber-700">BUKU!DD7</span> Kardus Box Rp 8.500 (kapasitas 300 pcs) + Lakban <span className="font-mono text-amber-700">Master!D34</span> Rp 9.600/roll.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Margin &amp; Nego</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Margin Standar</strong>: <span className="font-mono text-violet-700">BUKU!DH6</span> 20% dari HPP, nego 4% dari harga jual.</li>
                      <li>• <strong>Pembulatan Harga Jual</strong>: <span className="font-mono text-violet-700">BUKU!DL7</span> = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">ROUNDUP(DK7, -1)</code> (kelipatan 10 terdekat).</li>
                      <li>• Tier oplah: 15,5×21 (20–500 eks), 16×21 (600–10.000 eks).</li>
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
