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

interface FieldDef {
  key: keyof StikerMasterParams;
  label: string;
  opts?: {
    rupiah?: boolean;
    suffix?: string;
    decimal?: boolean;
  };
}

interface GroupDef {
  title: string;
  border: string;
  labelCls: string;
  fields: FieldDef[];
}

const GROUPS_CETAK_DESAIN: GroupDef[] = [
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

const GROUPS_FINISHING_MARGIN: GroupDef[] = [
  {
    title: 'Finishing Sisir & Kebijakan Harga',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'tarifSisirPer500', label: 'Ongkos Sisir per 500 Lembar A3+' },
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

  const handleValueChange = (key: keyof StikerMasterParams, val: number) => {
    setCustomParams((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const renderField = (f: FieldDef) => {
    const isCurrency = f.opts?.rupiah ?? true;
    const isFloat = f.opts?.decimal ?? false;
    const suffix = f.opts?.suffix ?? '';
    const modified = isFieldModified(f.key);
    const val = customParams[f.key] ?? DEFAULT_STIKER_PARAMS[f.key];

    return (
      <div
        key={f.key}
        className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
          modified
            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
            : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
        }`}
      >
        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-xs font-semibold text-slate-700 truncate">{f.label}</span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Def:{' '}
            {isCurrency
              ? `Rp ${DEFAULT_STIKER_PARAMS[f.key].toLocaleString('id-ID')}`
              : `${DEFAULT_STIKER_PARAMS[f.key]}${suffix}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            {isCurrency && (
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium z-10 pointer-events-none">
                Rp
              </span>
            )}
            <ThousandInput
              value={val}
              allowDecimals={isFloat}
              onValueChange={(newVal) => handleValueChange(f.key, newVal)}
              className={`w-28 text-right text-xs font-bold py-1.5 rounded-lg border outline-hidden transition-all ${
                isCurrency ? 'pl-7 pr-2' : suffix ? 'pr-7 pl-2' : 'px-2'
              } ${
                modified
                  ? 'border-amber-400 bg-white text-amber-950 font-black shadow-2xs'
                  : 'border-slate-300 bg-white text-slate-800 focus:border-emerald-500'
              }`}
            />
            {suffix && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
                {suffix}
              </span>
            )}
          </div>

          {modified && (
            <button
              type="button"
              onClick={() => handleResetField(f.key)}
              title="Reset ke default"
              className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderCard = (
    title: string,
    Icon: any,
    iconCls: string,
    groups: GroupDef[]
  ) => {
    const query = q.toLowerCase().trim();
    const visibleGroups = groups
      .map((g) => ({
        ...g,
        fields: g.fields.filter(
          (f) => !query || f.label.toLowerCase().includes(query) || f.key.toLowerCase().includes(query)
        ),
      }))
      .filter((g) => g.fields.length > 0);

    if (visibleGroups.length === 0) return null;

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3.5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Icon size={16} className={iconCls} />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <div className="flex flex-col gap-3">
          {visibleGroups.map((g) => (
            <div
              key={g.title}
              className={`p-3 rounded-xl border bg-slate-50/50 flex flex-col gap-2.5 ${g.border}`}
            >
              <span className={`text-[11px] font-bold ${g.labelCls}`}>
                {g.title}
              </span>
              <div className="flex flex-col gap-2">
                {g.fields.map(renderField)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Sticky Action & Search Bar */}
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 -mt-1 mb-1">
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

        <div className="flex items-center gap-2.5">
          {/* Search Bar Input */}
          <div className="relative w-full sm:w-56">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari parameter..."
              className="w-full text-xs pl-7 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <HelpCircle size={13} className="text-emerald-600" />
            <span>Panduan</span>
          </button>
          {isModified && (
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Standar</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid 2 Kolom Seimbang Standar Manasik / Poster */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderCard('1. Cetak Digital A3+ & Desain', Printer, 'text-sky-700', GROUPS_CETAK_DESAIN)}
        {renderCard('2. Finishing Sisir & Margin', Scissors, 'text-amber-700', GROUPS_FINISHING_MARGIN)}
      </div>

      {/* Modal Manual Pengguna Internal (Pemetaan Excel untuk Estimator) */}
      {showManualModal && (
        <div
          onClick={() => setShowManualModal(false)}
          className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600/30 rounded-xl border border-emerald-500/40">
                  <FileText size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Panduan Manual Parameter Stiker</h3>
                  <p className="text-xs text-slate-400">Pricelist Juli 2026 — 23. Stiker</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
                <h5 className="font-bold mb-1 flex items-center gap-1.5 text-xs text-emerald-900">
                  <CheckCircle2 size={14} className="text-emerald-700" />
                  Pemetaan Cell Excel Master (10 File Source .xlsm)
                </h5>
                <ul className="space-y-1 text-[11px] text-emerald-950">
                  <li>• <strong>Print Non Cutting A3+</strong>: Cell <code className="font-mono font-bold">Master!D19</code> (Rp 7.500 / lbr)</li>
                  <li>• <strong>Print Cutting A3+</strong>: Cell <code className="font-mono font-bold">Master!D19</code> (Rp 20.000 / lbr)</li>
                  <li>• <strong>Desain Stiker</strong>: Cell <code className="font-mono font-bold">Master!D16</code> (Rp 15.000 / order)</li>
                  <li>• <strong>Sisir Potong per 500 Lembar</strong>: Cell <code className="font-mono font-bold">BUKU!AJ6</code> (Rp 10.000 / 500 lbr)</li>
                  <li>• <strong>Margin Standar Penjualan</strong>: Cell <code className="font-mono font-bold">Master!E22</code> (30%)</li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 mb-2">Tabel Kapasitas Isi per Lembar A3+ (Sheet BUKU Kolom O):</h5>
                <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold">
                      <th className="p-2 border border-slate-200">Ukuran</th>
                      <th className="p-2 border border-slate-200 text-center">Isi Non Cutting</th>
                      <th className="p-2 border border-slate-200 text-center">Isi Cutting (Kiss-Cut)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-2 border border-slate-200 font-bold">7,5 × 6 cm</td><td className="p-2 border border-slate-200 text-center">30 pcs</td><td className="p-2 border border-slate-200 text-center">20 pcs</td></tr>
                    <tr><td className="p-2 border border-slate-200 font-bold">8 × 5 cm</td><td className="p-2 border border-slate-200 text-center">33 pcs</td><td className="p-2 border border-slate-200 text-center">29 pcs</td></tr>
                    <tr><td className="p-2 border border-slate-200 font-bold">9,5 × 6,5 cm</td><td className="p-2 border border-slate-200 text-center">21 pcs</td><td className="p-2 border border-slate-200 text-center">16 pcs</td></tr>
                    <tr><td className="p-2 border border-slate-200 font-bold">10 × 12 cm</td><td className="p-2 border border-slate-200 text-center">11 pcs</td><td className="p-2 border border-slate-200 text-center">8 pcs</td></tr>
                    <tr><td className="p-2 border border-slate-200 font-bold">21 × 29,7 cm (A4)</td><td className="p-2 border border-slate-200 text-center">2 pcs</td><td className="p-2 border border-slate-200 text-center">1 pcs</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
