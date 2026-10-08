'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Printer,
  Layers,
  Sliders,
  Search,
} from 'lucide-react';
import {
  LabelKhqMasterParams,
  DEFAULT_LABEL_KHQ_PARAMS,
} from '@/lib/label-khq-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface LabelKhqMasterParameterProps {
  customParams?: LabelKhqMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<LabelKhqMasterParams>>;
}

interface FieldDef {
  key: keyof LabelKhqMasterParams;
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

const LABEL_KHQ_GROUPS: GroupDef[] = [
  {
    title: '1. Cetak Print Digital A3+',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifPrintA3', label: 'Print Digital A3+ (Rp/lbr)' },
      { key: 'insheetWasteLbr', label: 'Insheet Cetak (lbr)', opts: { rupiah: false } },
      { key: 'tarifDesain', label: 'Biaya Desain Label (Rp)' },
    ],
  },
  {
    title: '2. Finishing Rajang & Laminasi',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'tarifRajangPerPcs', label: 'Rajang / Potong per lbr (Rp)' },
      { key: 'tarifLaminasiGlossyCm2', label: 'Laminasi Glossy (Rp/cm²)', opts: { rupiah: true, decimal: true } },
      { key: 'minLaminasi', label: 'Min. Order Laminasi (Rp)' },
    ],
  },
  {
    title: '3. Margin & Nego Standar',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'marginDefaultPct', label: 'Margin Default (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'negoDefaultPct', label: 'Nego Default (%)', opts: { rupiah: false, suffix: '%' } },
    ],
  },
];

const LABEL_KHQ_VISIBLE_KEYS: (keyof LabelKhqMasterParams)[] = [
  'tarifPrintA3',
  'insheetWasteLbr',
  'tarifDesain',
  'tarifRajangPerPcs',
  'tarifLaminasiGlossyCm2',
  'minLaminasi',
  'marginDefaultPct',
  'negoDefaultPct',
];

export default function LabelKhqMasterParameter({
  customParams = DEFAULT_LABEL_KHQ_PARAMS,
  setCustomParams,
}: LabelKhqMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof LabelKhqMasterParams, val: number) => {
    if (!setCustomParams) return;
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof LabelKhqMasterParams) =>
    customParams[key] !== DEFAULT_LABEL_KHQ_PARAMS[key];

  const handleResetField = (key: keyof LabelKhqMasterParams) => {
    if (!setCustomParams) return;
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_LABEL_KHQ_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_LABEL_KHQ_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => LABEL_KHQ_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_LABEL_KHQ_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    if (!setCustomParams) return;
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      LABEL_KHQ_VISIBLE_KEYS.forEach((k) => {
        (resetObj as Record<string, unknown>)[k] = DEFAULT_LABEL_KHQ_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Label KHQ dikembalikan ke standar master.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_LABEL_KHQ_PARAMS[f.key];
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
    const rawVal = customParams[key] ?? DEFAULT_LABEL_KHQ_PARAMS[key];
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

  const cardHeader = (badgeCls: string, badge: string, Icon: React.ComponentType<{ className?: string }>, iconCls: string, title: string) => (
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
          <BookOpen size={14} className="text-slate-500" />
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
        {/* Card 1: Cetak Print Digital A3+ */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-blue-100 text-blue-800', 'Cetak Digital', Printer, 'text-blue-600', '1. Cetak Print Digital A3+'),
          [LABEL_KHQ_GROUPS[0]]
        )}

        {/* Card 2: Finishing Rajang & Laminasi Glossy */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-emerald-100 text-emerald-800', 'Finishing', Sliders, 'text-emerald-700', '2. Finishing Rajang & Laminasi'),
          [LABEL_KHQ_GROUPS[1]]
        )}

        {/* Card 3: Margin & Nego Default */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-amber-100 text-amber-800', 'Margin & Nego', Layers, 'text-amber-600', '3. Margin & Nego Standar'),
          [LABEL_KHQ_GROUPS[2]]
        )}
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Label KHQ
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
                  Pemetaan Master Parameter ke File Excel (Folder 05. Pricelist Label KHQ/*.xlsm)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan &amp; Cetak Print A3+</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Tarif Print A3+</strong>: <span className="font-mono text-emerald-700">Master!D18</span> = Rp 2.000/lbr A3+ (khusus label botol, independen dari tarif A3 umum).</li>
                      <li>• <strong>Insheet Cetak</strong>: <span className="font-mono text-emerald-700">Master!D13</span> = 7 lembar/order.</li>
                      <li>• Kapasitas: 220ml 19 pcs/A3+, 330ml 20 pcs/A3+, 600ml 17 pcs/A3+.</li>
                      <li>• Kebutuhan A3+ = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">ceil(lbr / pcsPerA3) + 7</code>.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Finishing, Laminasi &amp; Desain</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Rajang/Potong</strong>: <span className="font-mono text-blue-700">BUKU!AN6</span> = Rp 50/lembar label.</li>
                      <li>• <strong>Laminasi Glossy</strong>: <span className="font-mono text-blue-700">BUKU!AP6</span> = Rp 0,35/cm² (min <span className="font-mono text-blue-700">AQ27</span> Rp 50.000).</li>
                      <li>• <strong>Desain</strong>: <span className="font-mono text-blue-700">Master!D17</span> = Rp 30.000/order.</li>
                      <li>• Finishing rajang &amp; laminasi via cetak digital A3+ (33,5×49 cm ≈ 1.641 cm²).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Kemasan (Standar Dus)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• 1 Dus = 24 lembar label (standar KHQ 220/330/600 ml).</li>
                      <li>• Tidak ada biaya kardus/lakban tambahan di Label KHQ (inklusif).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Margin &amp; Nego Default</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Margin Standar</strong>: 30% dari HPP (Pricelist Label!F8).</li>
                      <li>• <strong>Pembulatan Harga Jual</strong>: <span className="font-mono text-violet-700">BUKU!BJ7</span> = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">ROUNDUP(BI7, 0)</code> (pembulatan ke atas ke satuan rupiah terdekat, cell BK7 = 0).</li>
                      <li>• <strong>Batas Nego</strong>: 4% dari harga jual standar.</li>
                      <li>• HPP/lbr = Total HPP / total lembar label.</li>
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
