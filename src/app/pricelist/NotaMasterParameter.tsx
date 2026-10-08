'use client';

import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  HelpCircle,
  X,
  Layers,
  Printer,
  FileText,
  Search,
} from 'lucide-react';
import {
  DEFAULT_NOTA_PARAMS,
  NotaMasterParams,
} from '@/lib/nota-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface NotaMasterParameterProps {
  customParams: NotaMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<NotaMasterParams>>;
}

interface FieldDef {
  key: keyof NotaMasterParams;
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

const KERTAS_NOTA_GROUPS: GroupDef[] = [
  {
    title: 'Kertas HVS 70 gsm (Nota 1 Rangkap)',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'tarifHvs70Kg', label: 'HVS 70 gsm (Rp/Kg)' },
      { key: 'upHvsPct', label: 'Markup / Up HVS', opts: { rupiah: false, suffix: '%' } },
    ],
  },
  {
    title: 'Kertas NCR 55 gsm (Nota 2, 3 & 4 Rangkap)',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'tarifNcrTopRim', label: 'NCR Top (Rp/Rim Folio)' },
      { key: 'tarifNcrMiddleRim', label: 'NCR Middle (Rp/Rim Folio)' },
      { key: 'tarifNcrBottomRim', label: 'NCR Bottom (Rp/Rim Folio)' },
      { key: 'upNcrPct', label: 'Markup / Up NCR', opts: { rupiah: false, suffix: '%' } },
    ],
  },
];

const MESIN_CETAK_GROUPS: GroupDef[] = [
  {
    title: 'Mesin Cetak Toko / Ryobi',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifPlatRyobi', label: 'Plat Ryobi (Rp/plat)' },
      { key: 'minOngkosCetakRyobi', label: 'Ongkos Min Cetak Ryobi (Rp/500 drek)' },
      { key: 'tarifDrekOverRyobi', label: 'Ongkos Drek Over (Rp/drek)' },
      { key: 'tarifDesainNota', label: 'Biaya Desain Setting (Rp)' },
    ],
  },
];

const JILID_FINISHING_GROUPS: GroupDef[] = [
  {
    title: 'Bahan & Perakitan Jilid',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'tarifKertasSamson', label: 'Kertas Samson Sampul (Rp/Rim)' },
      { key: 'tarifKertasBoard', label: 'Kertas Board Alas (Rp/Rim)' },
      { key: 'tarifSusunKomplit', label: 'Susun Komplit (Rp/Rim)' },
      { key: 'tarifStaplesNota', label: 'Tarif Staples Nota (Rp/Rim)' },
      { key: 'tarifLemNgetruk', label: 'Tarif Lem Ngetruk (Rp/Rim)' },
    ],
  },
  {
    title: 'Potong, Porporasi & Nomorator',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'tarifSisirNota', label: 'Potong Sisir (Rp/Rim)' },
      { key: 'tarifPorporasiPerRim', label: 'Porporasi Sobekan (Rp/Rim)' },
      { key: 'tarifNomoratorPerRim', label: 'Nomorator Seri (Rp/Rim)' },
    ],
  },
];

const NOTA_VISIBLE_KEYS: (keyof NotaMasterParams)[] = [
  'tarifHvs70Kg',
  'upHvsPct',
  'tarifNcrTopRim',
  'tarifNcrMiddleRim',
  'tarifNcrBottomRim',
  'upNcrPct',
  'tarifPlatRyobi',
  'minOngkosCetakRyobi',
  'tarifDrekOverRyobi',
  'tarifDesainNota',
  'tarifKertasSamson',
  'tarifKertasBoard',
  'tarifSusunKomplit',
  'tarifStaplesNota',
  'tarifLemNgetruk',
  'tarifSisirNota',
  'tarifPorporasiPerRim',
  'tarifNomoratorPerRim',
];

export default function NotaMasterParameter({
  customParams,
  setCustomParams,
}: NotaMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof NotaMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof NotaMasterParams) =>
    (customParams[key] ?? DEFAULT_NOTA_PARAMS[key]) !== DEFAULT_NOTA_PARAMS[key];

  const handleResetField = (key: keyof NotaMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_NOTA_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_NOTA_PARAMS[key]}).`);
  };

  const isModified = useMemo(
    () => NOTA_VISIBLE_KEYS.some((key) => (customParams[key] ?? DEFAULT_NOTA_PARAMS[key]) !== DEFAULT_NOTA_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      NOTA_VISIBLE_KEYS.forEach((k) => {
        resetObj[k] = DEFAULT_NOTA_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Nota dikembalikan ke standar master.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_NOTA_PARAMS[f.key];
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
    const rawVal = customParams[key] ?? DEFAULT_NOTA_PARAMS[key];
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
          cardHeader('text-emerald-900 bg-emerald-100', 'Kertas', FileText, 'text-emerald-700', '1. Bahan Kertas Nota (HVS 70 & NCR 55)'),
          KERTAS_NOTA_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-blue-900 bg-blue-100', 'Mesin', Printer, 'text-blue-600', '2. Mesin Cetak Toko / Ryobi'),
          MESIN_CETAK_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-amber-900 bg-amber-100', 'Jilid', Layers, 'text-amber-600', '3. Ongkos Jilid & Finishing'),
          JILID_FINISHING_GROUPS
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
                  <h3 className="text-base font-bold tracking-tight">Manual Pengguna & Pemetaan Sumber Excel (Nota 1 & 2 Warna)</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Nota 1 Warna &amp; 2 Warna (Juli 2026)
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
                  Pemetaan 4 Bagian Master Parameter ke File Excel (Folder 03. Pricelist Nota 1 Warna/*.xlsx &amp; PENDUKUNG/)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Poin 1 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan Kertas (HVS 70 & NCR 55)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Kertas HVS 70</strong>: <span className="font-mono text-emerald-700">Master!D12</span> (Rp 15.700/kg, up 7%). Formula: <code className="text-[10px] bg-white px-1 py-0.5 rounded border">(21.5*33*70)/20.000 * 15.700 * 1.07 = Rp 41.716/rim</code>.</li>
                      <li>• <strong>Kertas NCR 55</strong>: Top (Rp 65.500), Middle (Rp 65.500), Bottom (Rp 62.000) dengan up 5% (<span className="font-mono text-emerald-700">Master!E11</span>). 2 Rangkap: Rp 133.875/rim, 3 Rangkap: Rp 202.650/rim.</li>
                    </ul>
                  </div>

                  {/* Poin 2 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Mesin Cetak Toko / Ryobi</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Biaya Plat Ryobi</strong>: <span className="font-mono text-blue-700">BUKU!U6</span> (Rp 10.000 / plat). Plat dihitung per warna desain (1 Warna = 1 Plat, 2 Warna = 2 Plat; lembar ply NCR memakai plat yang sama).</li>
                      <li>• <strong>Ongkos Cetak Min Order</strong>: <span className="font-mono text-blue-700">BUKU!W6</span> (Rp 15.000 / plat s/d 500 drek).</li>
                      <li>• <strong>Tarif Drek Over</strong>: <span className="font-mono text-blue-700">BUKU!X6</span> (Rp 30 / drek over). Putaran over = total putaran cetak − (warna × 500).</li>
                      <li>• <strong>Biaya Desain</strong>: <span className="font-mono text-blue-700">Master!D16</span> (Rp 0 / free standard).</li>
                    </ul>
                  </div>

                  {/* Poin 3 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Ongkos Jilid & Perakitan (Per Rim Rangkap)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Kertas Samson Sampul</strong>: <span className="font-mono text-amber-700">BUKU!AF6</span> (Rp 1.600 / rim).</li>
                      <li>• <strong>Kertas Board Alas</strong>: <span className="font-mono text-amber-700">BUKU!AG6</span> (Rp 1.250 / rim).</li>
                      <li>• <strong>Susun Komplit</strong>: <span className="font-mono text-amber-700">BUKU!AH6</span> (Rp 2.500 / rim).</li>
                      <li>• <strong>Staples & Lem Ngetruk</strong>: <span className="font-mono text-amber-700">BUKU!AI6</span> (Rp 1.500) + <span className="font-mono text-amber-700">BUKU!AJ6</span> (Rp 1.000).</li>
                      <li>• <strong>Potong Sisir Sisi</strong>: <span className="font-mono text-amber-700">BUKU!AK6</span> (Rp 5.000 / rim).</li>
                    </ul>
                  </div>

                  {/* Poin 4 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Finishing Porporasi, Nomorator & Margin</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Porporasi Sobekan</strong>: <span className="font-mono text-violet-700">BUKU!AM6</span> (Rp 5.000 / rim rangkap).</li>
                      <li>• <strong>Nomorator Otomatis</strong>: <span className="font-mono text-violet-700">BUKU!AO6</span> (Rp 10.000 / rim rangkap).</li>
                      <li>• <strong>Target Margin Standar</strong>: <span className="font-mono text-violet-700">Master!E19</span> (30%).</li>
                      <li>• <strong>Pembulatan Harga Jual</strong>: <span className="font-mono text-violet-700">BUKU!AY7</span> = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">ROUNDUP(AW7, -1)</code> (kelipatan 10 terdekat).</li>
                      <li>• <strong>Batas Nego Diskon</strong>: 4% dari harga jual standar.</li>
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
