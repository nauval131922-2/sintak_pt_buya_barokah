'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  X,
  Printer,
  Layers,
  PackageCheck,
  Scissors,
  DollarSign,
  Search,
  HelpCircle,
} from 'lucide-react';
import {
  DEFAULT_STOPMAP_PARAMS,
  StopmapMasterParams,
} from '@/lib/stopmap-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface StopmapMasterParameterProps {
  customParams: StopmapMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<StopmapMasterParams>>;
}

interface FieldDef {
  key: keyof StopmapMasterParams;
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
    title: 'Standar Upah & Bahan Kertas',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'standarUMR', label: 'Standar UMR / Bulan (Rp)', helpText: 'Basis hitungan upah per hari (UMR / 25)' },
      { key: 'tarifArtCartonKg', label: 'Harga Art Carton 230 /Kg', helpText: 'Harga dasar bahan kertas per kg' },
      { key: 'upArtCartonPct', label: 'Markup Kertas (%)', opts: { rupiah: false, suffix: '%' }, helpText: 'Kenaikan harga kertas (default 5%)' },
    ],
  },
];

const CARD2_GROUPS: GroupDef[] = [
  {
    title: 'Cetak Digital Print Inter (A4)',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifPrintA3', label: 'Tarif Print A3+ Digital', helpText: 'Biaya cetak digital 4W per lbr A3+' },
      { key: 'insheetCoverPrintInter', label: 'Insheet Cetak Digital (Lembar)', opts: { rupiah: false, suffix: 'Lbr' }, helpText: 'Cadangan cetak digital A4 (default 5 lbr)' },
      { key: 'tarifDesainA4', label: 'Desain Stopmap A4', helpText: 'Biaya artwork cover A4' },
      { key: 'tarifTransportA4', label: 'Transportasi A4', helpText: 'Biaya transport A4 (default Rp 0)' },
    ],
  },
];

const CARD3_GROUPS: GroupDef[] = [
  {
    title: 'Cetak Offset Oliver 4W',
    border: 'border-indigo-300',
    labelCls: 'text-indigo-800',
    fields: [
      { key: 'tarifPlatOliver', label: 'Tarif Plat Oliver / Warna', helpText: 'Biaya plat cetak offset per warna' },
      { key: 'minOrderOliver', label: 'Min. Order Cetak / Plat', helpText: 'Ongkos dasar cetak per plat s.d 1.000 drek' },
      { key: 'tarifDrekOverOliver', label: 'Tarif Drek Over / Warna', helpText: 'Drek over di atas 1.000 (per warna)' },
      { key: 'insheetCoverOliver', label: 'Insheet Cetak Oliver (Lembar)', opts: { rupiah: false, suffix: 'Lbr' }, helpText: 'Cadangan cetak offset Folio (default 150 lbr)' },
      { key: 'tarifDesainFolio', label: 'Desain Stopmap Folio', helpText: 'Biaya artwork cover Folio' },
      { key: 'tarifTransportFolio', label: 'Transportasi Folio', helpText: 'Biaya transport Folio (default Rp 30.000)' },
    ],
  },
];

const CARD4_GROUPS: GroupDef[] = [
  {
    title: 'Bahan Kupingan / Kantong',
    border: 'border-purple-300',
    labelCls: 'text-purple-800',
    fields: [
      { key: 'kupinganPerPlano', label: 'Isi Kupingan / Lembar Plano', opts: { rupiah: false, suffix: 'Pcs' }, helpText: '1 plano 79×109 cm menghasilkan 15 kupingan' },
      { key: 'insheetPlanoKupinganA4', label: 'Insheet Kupingan A4 (Plano)', opts: { rupiah: false, suffix: 'Plano' }, helpText: 'Cadangan bahan kupingan A4 (default 3 plano)' },
      { key: 'insheetPlanoKupinganFolio', label: 'Insheet Kupingan Folio (Plano)', opts: { rupiah: false, suffix: 'Plano' }, helpText: 'Cadangan bahan kupingan Folio (default 8 plano)' },
      { key: 'biayaPisauPonzBaru', label: 'Biaya Pisau Ponz Baru', helpText: 'Biaya pisau ponz jika buat cetakan baru' },
    ],
  },
];

const CARD5_GROUPS: GroupDef[] = [
  {
    title: 'Jasa Finishing Tenaga UMR',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'targetLipatPerHari', label: 'Target Harian Lipat (Pcs)', opts: { rupiah: false, suffix: 'Pcs' }, helpText: 'Target harian lipat (UMR/25/Target)' },
      { key: 'targetPonzPerHari', label: 'Target Harian Ponz (Pcs)', opts: { rupiah: false, suffix: 'Pcs' }, helpText: 'Target harian ponz kupingan' },
      { key: 'biayaLemKupinganPerPcs', label: 'Biaya Lem Kupingan / Pcs', helpText: 'Ongkos bahan lem perekat per pcs' },
      { key: 'targetPasangPerHari', label: 'Target Pasang Kupingan (Pcs)', opts: { rupiah: false, suffix: 'Pcs' }, helpText: 'Target harian tempel kantong ke map' },
    ],
  },
];

const CARD6_GROUPS: GroupDef[] = [
  {
    title: 'Laminasi & Pengemasan',
    border: 'border-rose-300',
    labelCls: 'text-rose-800',
    fields: [
      { key: 'tarifLaminasiGlossyCm2', label: 'Tarif Laminasi Glossy / cm²', opts: { rupiah: false, decimal: true, suffix: 'Rp' }, helpText: 'Tarif glossy per cm² (default 0.35)' },
      { key: 'tarifLaminasiDoffCm2', label: 'Tarif Laminasi Doff / cm²', opts: { rupiah: false, decimal: true, suffix: 'Rp' }, helpText: 'Tarif doff per cm² (default 0.40)' },
      { key: 'tarifUvVarnishCm2', label: 'Tarif UV Varnish / cm²', opts: { rupiah: false, decimal: true, suffix: 'Rp' }, helpText: 'Tarif UV per cm² (default 0.12)' },
      { key: 'minLaminasi', label: 'Min. Order Laminasi', helpText: 'Minimum biaya finishing' },
      { key: 'tarifKardusBox', label: 'Harga Kardus / Box', helpText: 'Kardus per box (isi 300 pcs)' },
      { key: 'tarifLakbanRoll', label: 'Harga Lakban / Roll', helpText: 'Lakban 90 yard per roll' },
      { key: 'marginDefaultPct', label: 'Margin Laba Default (%)', opts: { rupiah: false, suffix: '%' }, helpText: 'Standar margin profit 30%' },
      { key: 'negoDefaultPct', label: 'Nego Diskon Default (%)', opts: { rupiah: false, suffix: '%' }, helpText: 'Batas diskon sales 5%' },
    ],
  },
];
export default function StopmapMasterParameter({
  customParams,
  setCustomParams,
}: StopmapMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof StopmapMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof StopmapMasterParams) =>
    customParams[key] !== DEFAULT_STOPMAP_PARAMS[key];

  const handleResetField = (key: keyof StopmapMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_STOPMAP_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_STOPMAP_PARAMS[key]}).`);
  };

  const allKeys = Object.keys(DEFAULT_STOPMAP_PARAMS) as (keyof StopmapMasterParams)[];
  const isModified = React.useMemo(
    () => allKeys.some((key) => customParams[key] !== DEFAULT_STOPMAP_PARAMS[key]),
    [customParams, allKeys]
  );

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_STOPMAP_PARAMS });
    toast.success('Semua parameter Stopmap dikembalikan ke standar master.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_STOPMAP_PARAMS[f.key];
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
    const val = rawVal ?? DEFAULT_STOPMAP_PARAMS[key];

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
          cardHeader('text-emerald-900 bg-emerald-100', 'Bahan', DollarSign, 'text-emerald-600', '1. Standar Upah & Bahan Kertas'),
          CARD1_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-blue-900 bg-blue-100', 'A4', Printer, 'text-blue-600', '2. Cetak Digital Print Inter (A4)'),
          CARD2_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-indigo-900 bg-indigo-100', 'Folio', Printer, 'text-indigo-600', '3. Cetak Offset Oliver 4W'),
          CARD3_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-purple-900 bg-purple-100', 'Kantong', Scissors, 'text-purple-600', '4. Bahan Kupingan / Kantong'),
          CARD4_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-amber-900 bg-amber-100', 'Finishing', Layers, 'text-amber-600', '5. Jasa Finishing Tenaga UMR'),
          CARD5_GROUPS
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-rose-900 bg-rose-100', 'Kemasan', PackageCheck, 'text-rose-600', '6. Laminasi & Pengemasan'),
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Stopmap (07. Pricelist Stopmap)
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
                      <span>1. Bahan Kertas &amp; Standar Upah UMR</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Standar UMR</strong>: <span className="font-mono text-emerald-700">Master!D8</span> Rp 2.818.585 (dasar upah harian UMR / 25).</li>
                      <li>• <strong>Art Carton 230 gsm</strong>: <span className="font-mono text-emerald-700">Master!D12</span> Rp 16.400/kg.</li>
                      <li>• <strong>Markup Kertas</strong>: <span className="font-mono text-emerald-700">Master!E12</span> 5% (harga net per kg = Rp 17.220).</li>
                      <li>• <strong>Harga Plano 79×109</strong>: <span className="font-mono text-emerald-700">BUKU!W29</span> Berat rim = (79×109×230)/20.000 = 99,0265 kg → Rp 1.705.236/rim (Rp 3.410,47/lbr plano).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Cetak Digital (Print Inter) vs Offset (Oliver)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Print Inter A3+</strong>: <span className="font-mono text-emerald-700">Master!D18</span> Rp 2.500/lbr A3+ (sudah termasuk kertas dan cetak 4W).</li>
                      <li>• <strong>Insheet Digital</strong>: <span className="font-mono text-emerald-700">Master!D13</span> 5 lbr A3+ (flat).</li>
                      <li>• <strong>Insheet Oliver</strong>: <span className="font-mono text-emerald-700">Master!D13</span> 150 lbr plano offset.</li>
                      <li>• <strong>Plat Oliver</strong>: <span className="font-mono text-emerald-700">BUKU!Y6</span> Rp 45.000/plat (4 plat = Rp 180.000).</li>
                      <li>• <strong>Ongkos Cetak Oliver</strong>: <span className="font-mono text-emerald-700">BUKU!AB6</span> Min Rp 90.000/plat (Rp 360.000 dasar) + <span className="font-mono text-emerald-700">BUKU!AC7</span> drek over Rp 40/drek/warna.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>3. Kupingan (Kantong Stopmap) &amp; Jasa Finishing</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Yield Kupingan</strong>: <span className="font-mono text-emerald-700">BUKU!AN6</span> 1 plano 79×109 menghasilkan 15 kupingan.</li>
                      <li>• <strong>Cadangan Plano Kupingan</strong>: <span className="font-mono text-emerald-700">BUKU!AN7</span> A4 = 3 plano, Folio = 8 plano (120 kupingan cadangan).</li>
                      <li>• <strong>Lipat Stopmap</strong>: <span className="font-mono text-emerald-700">BUKU!AL7</span> (UMR/25/4.000) = Rp 28,18585/pcs.</li>
                      <li>• <strong>Ponz &amp; Lem</strong>: <span className="font-mono text-emerald-700">BUKU!AR7</span> (UMR/25/2.000) + Rp 50 lem = Rp 106,3717/pcs.</li>
                      <li>• <strong>Pasang Kupingan</strong>: <span className="font-mono text-emerald-700">BUKU!AU7</span> (UMR/25/500) = Rp 225,4868/pcs.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>4. Laminasi, Packing Kardus &amp; Margin</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Laminasi Glossy</strong>: <span className="font-mono text-emerald-700">BUKU!AW6</span> Rp 0,35/cm² × (2×W × H) (Min. Rp 50.000).</li>
                      <li>• <strong>Laminasi Doff</strong>: <span className="font-mono text-emerald-700">BUKU!AZ6</span> Rp 0,40/cm² × (2×W+1 × H+1) bleed (Min. Rp 50.000).</li>
                      <li>• <strong>Packing Lakban</strong>: <span className="font-mono text-emerald-700">BUKU!BH7</span> Rp 8.000/roll (panjang 7.650 cm / konsumsi 196 cm per box).</li>
                      <li>• <strong>Kardus</strong>: <span className="font-mono text-emerald-700">Master!D22</span> Rp 8.500/box (kapasitas 300 pcs map).</li>
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
