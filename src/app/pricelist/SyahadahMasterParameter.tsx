'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  X,
  Printer,
  PackageCheck,
  DollarSign,
  Stamp,
  Search,
  HelpCircle,
} from 'lucide-react';
import {
  DEFAULT_SYAHADAH_PARAMS,
  SyahadahMasterParams,
} from '@/lib/syahadah-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface SyahadahMasterParameterProps {
  customParams: SyahadahMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<SyahadahMasterParams>>;
}

interface FieldDef {
  key: keyof SyahadahMasterParams;
  label: string;
  opts?: {
    rupiah?: boolean;
    decimal?: boolean;
    suffix?: string;
  };
  helpText?: string;
}

interface GroupDef {
  title: string;
  border: string;
  labelCls: string;
  fields: FieldDef[];
}

const CARD1_GROUPS: GroupDef[] = [
  {
    title: 'Bahan Kertas & Desain',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'tarifKertasLinenKg', label: 'Harga Kertas Linen/Hammer /Kg', helpText: 'Hammer Crem / Linen Tebal 300 gsm' },
      { key: 'upKertasPct', label: 'Markup Kertas (%)', opts: { rupiah: false, suffix: '%' }, helpText: 'Kenaikan harga kertas (default 0%)' },
      { key: 'tarifDesign', label: 'Desain / Order', helpText: 'Biaya setting layout syahadah (Rp 20.000)' },
      { key: 'tarifSisirPer500', label: 'Potong Sisir / 500 Pcs', helpText: 'Ongkos potong sisir (Rp 5.000 per 500 pcs)' },
    ],
  },
];

const CARD2_GROUPS: GroupDef[] = [
  {
    title: 'Cetak Digital Print Inter',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifPrintA3', label: 'Tarif Print A3+ Digital', helpText: 'Biaya cetak per lbr A3+ (muat 2 syahadah)' },
      { key: 'insheetPod', label: 'Insheet Cetak Digital (Lembar A3+)', opts: { rupiah: false, suffix: 'Lbr' }, helpText: 'Cadangan cetak digital Print Inter (default 5 lbr)' },
    ],
  },
];

const CARD3_GROUPS: GroupDef[] = [
  {
    title: 'Cetak Offset Ryobi',
    border: 'border-indigo-300',
    labelCls: 'text-indigo-800',
    fields: [
      { key: 'tarifPlatRyobi', label: 'Tarif Plat Ryobi / Warna', helpText: 'Biaya plat cetak offset toko (Rp 10.000/plat)' },
      { key: 'minOrderRyobi', label: 'Min. Order Cetak / Plat', helpText: 'Ongkos dasar cetak per plat s.d. 500 drek' },
      { key: 'tarifDrekOverRyobi', label: 'Tarif Drek Over / Warna', helpText: 'Drek over di atas 500 (Rp 30/drek/warna)' },
      { key: 'insheetRyobi', label: 'Insheet Cetak Ryobi (Lembar)', opts: { rupiah: false, suffix: 'Lbr' }, helpText: 'Cadangan cetak offset Ryobi (default 50 lbr)' },
      { key: 'syahadahPerPlanoRyobi', label: 'Kapasitas Plano (Pcs / Plano)', opts: { rupiah: false, suffix: 'Pcs' }, helpText: '1 plano 79×109 cm dipotong jadi 11 lembar folio' },
    ],
  },
];

const CARD4_GROUPS: GroupDef[] = [
  {
    title: 'Cetak Offset Oliver',
    border: 'border-purple-300',
    labelCls: 'text-purple-800',
    fields: [
      { key: 'tarifPlatOliver', label: 'Tarif Plat Oliver / Warna', helpText: 'Biaya plat cetak offset Oliver (Rp 43.000/plat)' },
      { key: 'minOrderOliver', label: 'Min. Order Cetak / Plat', helpText: 'Ongkos dasar cetak per plat s.d. 1.000 drek' },
      { key: 'tarifDrekOverOliver', label: 'Tarif Drek Over / Warna', helpText: 'Drek over di atas 1.000 (Rp 40/drek/warna)' },
    ],
  },
];

const CARD5_GROUPS: GroupDef[] = [
  {
    title: 'Finishing Foil Emas',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'tarifKliseMasterFoil', label: 'Biaya Klise Master Foil', helpText: 'Biaya pembuatan plat/matris foil per muka' },
      { key: 'tarifFoilPerPcs', label: 'Tarif Hotprint Foil / Pcs', helpText: 'Ongkos hotprint per pcs (Rp 450/pcs)' },
      { key: 'minOrderFoil', label: 'Min. Order Hotprint Foil', helpText: 'Minimum ongkos foil (Rp 100.000)' },
    ],
  },
];

const CARD6_GROUPS: GroupDef[] = [
  {
    title: 'Packing & Margin',
    border: 'border-rose-300',
    labelCls: 'text-rose-800',
    fields: [
      { key: 'tarifKardusBox', label: 'Harga Kardus / Box', helpText: 'Kardus per box (kapasitas 1.000 pcs)' },
      { key: 'tarifLakbanRoll', label: 'Harga Lakban / Roll', helpText: 'Lakban 90 yard per roll' },
      { key: 'marginDefaultPct', label: 'Margin Laba Default (%)', opts: { rupiah: false, suffix: '%' }, helpText: 'Standar margin profit 30%' },
      { key: 'negoDefaultPct', label: 'Nego Diskon Default (%)', opts: { rupiah: false, suffix: '%' }, helpText: 'Batas diskon sales 5%' },
    ],
  },
];
export default function SyahadahMasterParameter({
  customParams,
  setCustomParams,
}: SyahadahMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof SyahadahMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof SyahadahMasterParams) =>
    customParams[key] !== DEFAULT_SYAHADAH_PARAMS[key];

  const handleResetField = (key: keyof SyahadahMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_SYAHADAH_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_SYAHADAH_PARAMS[key]}).`);
  };

  const allKeys = Object.keys(DEFAULT_SYAHADAH_PARAMS) as (keyof SyahadahMasterParams)[];
  const isModified = React.useMemo(
    () => allKeys.some((key) => customParams[key] !== DEFAULT_SYAHADAH_PARAMS[key]),
    [customParams, allKeys]
  );

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_SYAHADAH_PARAMS });
    toast.success('Semua parameter Syahadah dikembalikan ke standar master.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_SYAHADAH_PARAMS[f.key];
    if (f.opts?.suffix === '%') return `${def}%`;
    if (f.opts?.decimal) return `${def} ${f.opts?.suffix || ''}`.trim();
    if (f.opts?.rupiah === false) return `${Number(def).toLocaleString('id-ID')} ${f.opts?.suffix || ''}`.trim();
    return `Rp ${Number(def).toLocaleString('id-ID')}`;
  };

  const matchQ = (label: string) =>
    q.trim() === '' || label.toLowerCase().includes(q.trim().toLowerCase());

  const fieldRow = (f: FieldDef) => {
    const key = f.key;
    const isRupiah = f.opts?.rupiah ?? true;
    const isDecimal = f.opts?.decimal ?? false;
    const modified = isFieldModified(key);
    const rawVal = customParams[key];
    const val = rawVal ?? DEFAULT_SYAHADAH_PARAMS[key];

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
          {isRupiah && !isDecimal ? (
            <ThousandInput
              value={val}
              onValueChange={(v) => handleChange(key, v || 0)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
              prefix="Rp"
              allowDecimals={false}
            />
          ) : (
            <div className="relative w-full">
              <input
                type="number"
                step={isDecimal ? 0.01 : 1}
                value={val}
                onChange={(e) => handleChange(key, Number(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
              />
              {f.opts?.suffix && (
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 pointer-events-none">
                  {f.opts.suffix}
                </span>
              )}
            </div>
          )}
        </div>
        {f.helpText && (
          <p className="text-[10px] text-slate-400 mt-1 leading-tight">{f.helpText}</p>
        )}
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

  const cardShell = (cls: string, header: React.ReactNode, groups: GroupDef[]) => {
    const hasVisible = groups.some((g) => g.fields.some((f) => matchQ(f.label)));
    if (!hasVisible) return null;
    return (
      <div className={`${cls} rounded-xl border p-4 shadow-2xs flex flex-col gap-3 break-inside-avoid mb-4`}>
        {header}
        <div className="flex flex-col gap-2.5">{groups.map(subGroup)}</div>
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
            placeholder="Cari nama parameter tarif, kertas, plat, jilid..."
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
          cardHeader('text-emerald-900 bg-emerald-100', 'Bahan', DollarSign, 'text-emerald-600', '1. Bahan Kertas & Desain'),
          CARD1_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-blue-900 bg-blue-100', 'Print', Printer, 'text-blue-600', '2. Cetak Digital Print Inter'),
          CARD2_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-indigo-900 bg-indigo-100', 'Ryobi', Printer, 'text-indigo-600', '3. Cetak Offset Ryobi'),
          CARD3_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-purple-900 bg-purple-100', 'Oliver', Printer, 'text-purple-600', '4. Cetak Offset Oliver'),
          CARD4_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-amber-900 bg-amber-100', 'Foil', Stamp, 'text-amber-600', '5. Finishing Foil Emas'),
          CARD5_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-rose-900 bg-rose-100', 'Packing', PackageCheck, 'text-rose-600', '6. Packing & Margin'),
          CARD6_GROUPS
        )}
      </div>

      {/* Modal Manual Pengguna & Pemetaan Sumber Excel */}
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Syahadah (08. Pricelist Syahadah)
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
                  Pemetaan Cell Excel Asli ke Parameter SINTAK
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan Kertas Linen/Hammer Crem</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga Kertas</strong>: <span className="font-mono text-emerald-700">Master!D12</span> Rp 29.900/kg (Hammer Crem / Linen Tebal 300 gsm).</li>
                      <li>• <strong>Plano 79×109</strong>: <span className="font-mono text-emerald-700">BUKU!W29</span> Berat rim = (79×109×300)/20.000 = 129,165 kg → Rp 3.862.033,5/rim (Rp 7.724,07/lbr plano).</li>
                      <li>• <strong>Kapasitas Plano Ryobi</strong>: <span className="font-mono text-emerald-700">BUKU!O15/P16</span> 1 plano 79×109 cm menghasilkan 11 lembar folio 21,5×33 cm.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Cetak Digital (Print Inter) vs Offset (Ryobi)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Print Inter A3+</strong>: <span className="font-mono text-emerald-700">Master!D18</span> Rp 3.800/lbr A3+ (1 lbr A3+ muat 2 lembar folio).</li>
                      <li>• <strong>Insheet Digital</strong>: <span className="font-mono text-emerald-700">Master!D13</span> 5 lbr A3+ (flat).</li>
                      <li>• <strong>Insheet Ryobi</strong>: <span className="font-mono text-emerald-700">Master!D13</span> 50 lbr folio offset.</li>
                      <li>• <strong>Plat Ryobi</strong>: <span className="font-mono text-emerald-700">BUKU!Y6</span> Rp 10.000/plat (1W = 1 plat, 2W = 2 plat per muka).</li>
                      <li>• <strong>Ongkos Cetak Ryobi</strong>: <span className="font-mono text-emerald-700">BUKU!AB6</span> Min Rp 15.000/plat + <span className="font-mono text-emerald-700">BUKU!AC7</span> drek over Rp 30/drek/warna (&gt;500 drek).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>3. Finishing Sisir &amp; Foil Emas (Hotprint)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Potong Sisir</strong>: <span className="font-mono text-emerald-700">BUKU!AS7</span> ROUNDUP(oplah/500, 0) × Rp 5.000.</li>
                      <li>• <strong>Klise Master Foil</strong>: <span className="font-mono text-emerald-700">BUKU!AN6</span> Rp 53.200 per muka.</li>
                      <li>• <strong>Tarif Hotprint</strong>: Catatan <span className="font-mono text-emerald-700">HARGA JULI 2026</span> Rp 450/pcs (min. Rp 100.000).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>4. Packing Kardus &amp; Margin Jual</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Kardus Box</strong>: <span className="font-mono text-emerald-700">Master!D22</span> Rp 8.500/box (kapasitas 1.000 pcs syahadah).</li>
                      <li>• <strong>Lakban Roll</strong>: <span className="font-mono text-emerald-700">Master!D21</span> Rp 8.000/roll (7.650 cm / 196 cm = 39,03 box/roll).</li>
                      <li>• <strong>Margin &amp; Nego</strong>: Margin 30% (<span className="font-mono text-emerald-700">Master!E24</span>), Nego 5% (<span className="font-mono text-emerald-700">HARGA JULI 2026</span>).</li>
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
