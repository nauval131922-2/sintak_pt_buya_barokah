'use client';

import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Printer,
  Scissors,
  HelpCircle,
  X,
  FileText,
  Tag,
  CheckCircle2,
  Search,
} from 'lucide-react';
import {
  StikerMasterParams,
  DEFAULT_STIKER_PARAMS,
} from '@/lib/stiker-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface Props {
  customParams: StikerMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<StikerMasterParams>>;
}

type FieldDef = {
  key: keyof StikerMasterParams;
  label: string;
  opts?: { rupiah?: boolean; decimal?: boolean; suffix?: string };
};

type GroupDef = {
  title: string;
  border: string;
  labelCls: string;
  fields: FieldDef[];
};

const CETAK_DESAIN_GROUPS: GroupDef[] = [
  {
    title: 'Tarif Cetak Digital A3+ & Desain',
    border: 'border-sky-300',
    labelCls: 'text-sky-800',
    fields: [
      { key: 'tarifPrintNonCuttingA3', label: 'Print Non Cutting A3+ (Rajang)' },
      { key: 'tarifPrintCuttingA3', label: 'Print Cutting A3+ (Kiss-Cut)' },
      { key: 'tarifDesain', label: 'Jasa Desain Stiker (per order)' },
    ],
  },
];

const FINISHING_MARGIN_GROUPS: GroupDef[] = [
  {
    title: 'Finishing Sisir & Kebijakan Margin',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'tarifSisirPer500', label: 'Ongkos Sisir per 500 Lbr A3+' },
      { key: 'marginDefaultPct', label: 'Margin Standar Penjualan', opts: { rupiah: false, suffix: '%' } },
      { key: 'negoDefaultPct', label: 'Batas Toleransi Nego Diskon', opts: { rupiah: false, suffix: '%' } },
    ],
  },
];

const ALL_KEYS: (keyof StikerMasterParams)[] = [
  'tarifPrintNonCuttingA3',
  'tarifPrintCuttingA3',
  'tarifDesain',
  'tarifSisirPer500',
  'marginDefaultPct',
  'negoDefaultPct',
];

export default function StikerMasterParameter({
  customParams,
  setCustomParams,
}: Props) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const isFieldModified = (key: keyof StikerMasterParams) =>
    (customParams[key] ?? DEFAULT_STIKER_PARAMS[key]) !== DEFAULT_STIKER_PARAMS[key];

  const isModified = useMemo(
    () => ALL_KEYS.some((k) => isFieldModified(k)),
    [customParams]
  );

  const handleResetField = (key: keyof StikerMasterParams) => {
    setCustomParams((prev) => ({
      ...prev,
      [key]: DEFAULT_STIKER_PARAMS[key],
    }));
  };

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      ALL_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_STIKER_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Stiker dikembalikan ke nilai default.');
  };

  const handleChange = (key: keyof StikerMasterParams, val: number) => {
    setCustomParams((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_STIKER_PARAMS[f.key];
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
            value={customParams[key] ?? DEFAULT_STIKER_PARAMS[key]}
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

  const cardHeader = (badgeCls: string, badge: string, Icon: any, iconCls: string, title: string) => (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${badgeCls}`}>{badge}</span>
      <Icon className={`w-4 h-4 ${iconCls}`} />
      <h3 className="text-xs font-bold text-slate-800">{title}</h3>
    </div>
  );

  const cardShell = (cls: string, header: React.ReactNode, groups: GroupDef[], note?: React.ReactNode) => {
    const hasVisible = groups.some((g) => g.fields.some((f) => matchQ(f.label)));
    if (!hasVisible) return null;
    return (
      <div className={`${cls} rounded-xl border p-4 shadow-2xs flex flex-col gap-3 break-inside-avoid mb-4`}>
        {header}
        <div className="flex flex-col gap-2.5">{groups.map(subGroup)}</div>
        {note && <div className="pt-2 border-t border-slate-200/60 mt-1">{note}</div>}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-8 overflow-y-auto">
      {/* Action Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3 -mt-1">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-700" />
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Master Parameter Stiker
          </h2>
          {isModified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
              Dimodifikasi
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <HelpCircle size={13} className="text-emerald-700" />
            Panduan
          </button>
          {isModified && (
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 cursor-pointer shadow-2xs"
            >
              <RotateCcw size={13} />
              Reset Semua
            </button>
          )}
        </div>
      </div>

      {/* Sticky Full-Width Search Bar */}
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

      {/* 2-Column Responsive Card Shells */}
      <div className="columns-1 md:columns-2 gap-4">
        {cardShell(
          'bg-sky-50/40 border-sky-200',
          cardHeader('text-sky-900 bg-sky-200/80', 'Cetak', Printer, 'text-sky-600', '1. Cetak Digital A3+ & Desain'),
          CETAK_DESAIN_GROUPS,
          <p className="text-[10px] text-slate-500">
            Print A3+ digital berbasis per lembar plano A3+. Kiss-Cut memotong stiker setengah putus, Rajang potong kotak lurus.
          </p>
        )}

        {cardShell(
          'bg-amber-50/40 border-amber-200',
          cardHeader('text-amber-900 bg-amber-200/80', 'Finishing', Scissors, 'text-amber-600', '2. Finishing & Kebijakan Harga'),
          FINISHING_MARGIN_GROUPS,
          <p className="text-[10px] text-slate-500">
            Finishing sisir memotong keliling per tumpukan 500 lembar A3+. Margin standar dan toleransi nego diterapkan pada harga jual.
          </p>
        )}
      </div>

      {/* Modal Panduan Parameter Stiker */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-800">
                  Panduan Master Parameter Stiker (Vinyl Glossy)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 space-y-2">
                <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-700" />
                  Alur Logika &amp; Rumus Kalkulasi
                </h4>
                <ul className="space-y-1 text-[11px] text-emerald-950">
                  <li>• <strong>Print Non Cutting A3+</strong>: Rp 7.500 / lembar A3+ (sudah termasuk bahan Vinyl Glossy dan cetak digital full color).</li>
                  <li>• <strong>Print Cutting A3+</strong>: Rp 20.000 / lembar A3+ (sudah termasuk cetak digital + potong pola kiss-cut).</li>
                  <li>• <strong>Desain Stiker</strong>: Rp 15.000 flat per order (jika belum ada file siap cetak).</li>
                  <li>• <strong>Sisir Potong per 500 Lembar</strong>: Rp 10.000 / paket 500 lembar A3+ (opsional).</li>
                  <li>• <strong>Margin Standar Penjualan</strong>: 30% dari Total HPP.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Kapasitas Isi per Lembar A3+</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <p className="font-bold text-slate-700">Non Cutting (Rajang Potong)</p>
                    <p className="text-slate-500 mt-1">• 7.5 x 6 cm: 30 pcs</p>
                    <p className="text-slate-500">• 8 x 5 cm: 33 pcs</p>
                    <p className="text-slate-500">• 9.5 x 6.5 cm: 21 pcs</p>
                    <p className="text-slate-500">• 10 x 12 cm: 11 pcs</p>
                    <p className="text-slate-500">• 21 x 29.7 cm: 2 pcs</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <p className="font-bold text-slate-700">Cutting (Kiss Cut)</p>
                    <p className="text-slate-500 mt-1">• 7.5 x 6 cm: 20 pcs</p>
                    <p className="text-slate-500">• 8 x 5 cm: 29 pcs</p>
                    <p className="text-slate-500">• 9.5 x 6.5 cm: 16 pcs</p>
                    <p className="text-slate-500">• 10 x 12 cm: 8 pcs</p>
                    <p className="text-slate-500">• 21 x 29.7 cm: 1 pcs</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
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
