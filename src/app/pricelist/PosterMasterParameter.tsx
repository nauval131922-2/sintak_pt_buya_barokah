'use client';

import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Printer,
  Layers,
  Scissors,
  Database,
  HelpCircle,
  X,
  FileText,
  Search,
  Image as ImageIcon,
} from 'lucide-react';
import {
  PosterMasterParams,
  DEFAULT_POSTER_PARAMS,
} from '@/lib/poster-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface PosterMasterParameterProps {
  customParams: PosterMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<PosterMasterParams>>;
}

interface FieldDef {
  key: keyof PosterMasterParams;
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

const GROUPS_KERTAS: GroupDef[] = [
  {
    title: 'Kertas & Bahan Dasar',
    border: 'border-sky-300',
    labelCls: 'text-sky-800',
    fields: [
      { key: 'tarifArtCarton230Kg', label: 'Tarif Kertas Art Carton 230 /kg' },
      { key: 'upKertasPct', label: 'Mark-up Kertas', opts: { rupiah: false, suffix: '%' } },
    ],
  },
];

const GROUPS_MESIN: GroupDef[] = [
  {
    title: 'Setting & Desain Poster',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifDesain', label: 'Biaya Desain Poster (per order)' },
      { key: 'tarifPrintA3', label: 'Tarif Print Inter Digital A3+ (per lembar)' },
    ],
  },
  {
    title: 'Mesin Oliver Offset 4 Warna',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'oliverPlatUnit', label: 'Tarif Plat Oliver (per plat)' },
      { key: 'oliverMinOngkos', label: 'Min Ongkos Cetak Oliver (per warna / 1.000 drek)' },
      { key: 'oliverDrekOver', label: 'Tarif Over Drek Oliver (per drek/warna)' },
    ],
  },
  {
    title: 'Mesin Heidelberg SM (Full Colour)',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'smPlatUnit', label: 'Tarif Plat SM (per plat)' },
      { key: 'smMinOngkos', label: 'Min Ongkos Cetak SM (per warna / 3.000 drek)' },
      { key: 'smDrekOver', label: 'Tarif Over Drek SM (per drek/warna)' },
    ],
  },
];

const GROUPS_OPERASIONAL: GroupDef[] = [
  {
    title: 'Finishing & Operasional Cetak',
    border: 'border-violet-300',
    labelCls: 'text-violet-800',
    fields: [
      { key: 'tarifTransp', label: 'Biaya Transport (per order)' },
      { key: 'tarifSisirPer100Plano', label: 'Upah Potong / Sisir (per 100 plano)' },
    ],
  },
  {
    title: 'Standar Kemasan',
    border: 'border-violet-300',
    labelCls: 'text-violet-800',
    fields: [
      { key: 'tarifKardusBox', label: 'Harga Kardus Box' },
      { key: 'tarifLakbanRoll', label: 'Harga Lakban Transparan /roll' },
    ],
  },
];

const GROUPS_FINISHING_MARGIN: GroupDef[] = [
  {
    title: 'Finishing Tambahan (Laminasi / Vernis)',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'tarifLaminasiGlossyCm2', label: 'Tarif Laminasi Glossy /cm²', opts: { rupiah: true, decimal: true } },
      { key: 'tarifLaminasiDoffCm2', label: 'Tarif Laminasi Doff /cm²', opts: { rupiah: true, decimal: true } },
      { key: 'tarifUvVarnishCm2', label: 'Tarif UV Varnish /cm²', opts: { rupiah: true, decimal: true } },
      { key: 'minLaminasi', label: 'Min Charge Laminasi / Order' },
    ],
  },
  {
    title: 'Margin & Nego Standar',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'marginDefaultPct', label: 'Margin Standar Penjualan', opts: { rupiah: false, suffix: '%' } },
      { key: 'negoDefaultPct', label: 'Batas Toleransi Nego Diskon', opts: { rupiah: false, suffix: '%' } },
    ],
  },
];

const ALL_KEYS: (keyof PosterMasterParams)[] = [
  'tarifArtCarton230Kg',
  'upKertasPct',
  'tarifDesain',
  'tarifPrintA3',
  'oliverPlatUnit',
  'oliverMinOngkos',
  'oliverDrekOver',
  'smPlatUnit',
  'smMinOngkos',
  'smDrekOver',
  'tarifTransp',
  'tarifSisirPer100Plano',
  'tarifKardusBox',
  'tarifLakbanRoll',
  'tarifLaminasiGlossyCm2',
  'tarifLaminasiDoffCm2',
  'tarifUvVarnishCm2',
  'minLaminasi',
  'marginDefaultPct',
  'negoDefaultPct',
];

export default function PosterMasterParameter({
  customParams,
  setCustomParams,
}: PosterMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const isFieldModified = (key: keyof PosterMasterParams) =>
    (customParams[key] ?? DEFAULT_POSTER_PARAMS[key]) !== DEFAULT_POSTER_PARAMS[key];

  const isModified = useMemo(
    () => ALL_KEYS.some((k) => isFieldModified(k)),
    [customParams]
  );

  const handleResetField = (key: keyof PosterMasterParams) => {
    setCustomParams((prev) => ({
      ...prev,
      [key]: DEFAULT_POSTER_PARAMS[key],
    }));
    toast.info(`Field ${key} dikembalikan ke nilai Master.`);
  };

  const handleResetAll = () => {
    setCustomParams(DEFAULT_POSTER_PARAMS);
    toast.success('Semua parameter Poster berhasil dikembalikan ke standar Master.');
  };

  const handleChange = (key: keyof PosterMasterParams, value: number) => {
    setCustomParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_POSTER_PARAMS[f.key];
    if (f.opts?.suffix === '%') return `${def}%`;
    if (f.opts?.rupiah === false && !f.opts?.decimal) return Number(def).toLocaleString('id-ID');
    if (f.opts?.decimal) return `Rp ${def}`;
    return `Rp ${Number(def).toLocaleString('id-ID')}`;
  };

  const matchQ = (label: string) =>
    q.trim() === '' || label.toLowerCase().includes(q.trim().toLowerCase());

  const fieldRow = (f: FieldDef) => {
    const key = f.key;
    const isRupiah = f.opts?.rupiah ?? true;
    const isDecimal = f.opts?.decimal ?? false;
    const modified = isFieldModified(key);
    const val = customParams[key] ?? DEFAULT_POSTER_PARAMS[key];

    return (
      <div
        key={key}
        className={`p-2.5 rounded-lg border transition-all ${
          modified
            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
            : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <label className="text-[11px] font-bold text-slate-700 truncate">{f.label}</label>
          {modified && (
            <button
              type="button"
              onClick={() => handleResetField(key)}
              title="Reset ke nilai Master"
              className="text-amber-600 hover:text-amber-800 p-0.5 rounded cursor-pointer"
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>
        <div className="relative">
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
        <span className={`block text-[10px] font-black uppercase tracking-wider ${g.labelCls}`}>
          {g.title}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{visible.map(fieldRow)}</div>
      </div>
    );
  };

  const cardShell = (
    cls: string,
    header: React.ReactNode,
    groups: GroupDef[],
    note?: React.ReactNode
  ) => {
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

  const cardHeader = (
    badgeCls: string,
    badge: string,
    Icon: React.ComponentType<{ className?: string }>,
    iconCls: string,
    title: string
  ) => (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${badgeCls}`}>
        {badge}
      </span>
      <Icon className={`w-4 h-4 ${iconCls}`} />
      <h3 className="text-xs font-bold text-slate-800">{title}</h3>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 pb-8 overflow-y-auto">
      {/* Header Info Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100/80 rounded-xl border border-emerald-200 text-emerald-800 shrink-0">
            <ImageIcon className="w-5 h-5 text-emerald-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                Master Parameter Poster
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">
                Katalog 19 / 21
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tarif bahan kertas Art Carton 230 gsm, mesin Print Inter / Oliver / SM, upah potong sisir, serta finishing tambahan untuk 4 ukuran poster.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition cursor-pointer"
          >
            <HelpCircle size={14} className="text-slate-500" />
            <span>Panduan & Rumus</span>
          </button>
          {isModified && (
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs transition cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset Semua</span>
            </button>
          )}
        </div>
      </div>

      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs py-1">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari parameter poster (misal: kertas, oliver, plat, sm, laminasi, drek)..."
            className="w-full pl-8.5 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs text-slate-800 font-medium"
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
      </div>

      {/* 2 Kolom Seimbang Masonry */}
      <div className="columns-1 lg:columns-2 gap-4 space-y-0">
        {/* 1. Kertas & Bahan Dasar */}
        {cardShell(
          'bg-sky-50/40 border-sky-200/80',
          cardHeader('bg-sky-100 text-sky-800 border border-sky-300', '1. Kertas', Database, 'text-sky-600', 'Bahan Baku Poster (Art Carton 230 gsm)'),
          GROUPS_KERTAS,
          <p className="text-[10px] text-slate-500 italic">
            * Ukuran plano standar: 79×109 cm (untuk 32×48 cm, 50×70 cm, 70×100 cm) dan 65×100 cm (untuk 48×64 cm).
          </p>
        )}

        {/* 2. Desain & Mesin Cetak */}
        {cardShell(
          'bg-blue-50/40 border-blue-200/80',
          cardHeader('bg-blue-100 text-blue-800 border border-blue-300', '2. Mesin', Printer, 'text-blue-600', 'Setting Desain & Mesin Cetak'),
          GROUPS_MESIN
        )}

        {/* 3. Finishing & Operasional */}
        {cardShell(
          'bg-violet-50/40 border-violet-200/80',
          cardHeader('bg-violet-100 text-violet-800 border border-violet-300', '3. Operasional', Scissors, 'text-violet-600', 'Upah Sisir, Transport & Kemasan'),
          GROUPS_OPERASIONAL
        )}

        {/* 4. Finishing Tambahan & Margin */}
        {cardShell(
          'bg-amber-50/40 border-amber-200/80',
          cardHeader('bg-amber-100 text-amber-800 border border-amber-300', '4. Finishing & Laba', Layers, 'text-amber-600', 'Laminasi, UV Varnish & Target Penjualan'),
          GROUPS_FINISHING_MARGIN
        )}
      </div>

      {/* Modal Panduan & Rumus */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    Panduan Rumus Kalkulasi Poster (Katalog 19 / 21)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Spesifikasi baku & alur hitung harga pokok produksi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  1. Alur Mesin Cetak per Ukuran:
                </span>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                  <li><strong>32 × 48 cm:</strong> Oplah 100–500 pcs via Print Inter A3+ (digital); Oplah 600–2.000 pcs via Oliver Offset 4 Warna.</li>
                  <li><strong>48 × 64 cm:</strong> Oplah 300–3.000 pcs via Oliver Offset 4 Warna; Oplah 3.500–5.000 pcs via Heidelberg SM 52.</li>
                  <li><strong>50 × 70 cm:</strong> Oplah 1.000–10.000 pcs via Heidelberg SM 52 (potong 2 mesin).</li>
                  <li><strong>70 × 100 cm:</strong> Oplah 1.000–10.000 pcs via Heidelberg SM 72 / 102 (masuk plano utuh).</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  2. Rumus Kebutuhan Kertas &amp; Rim Price:
                </span>
                <p className="text-[11px]">
                  Rim Price = ((Panjang × Lebar × Gramatur) / 20.000) × Tarif Kertas /kg.
                </p>
                <p className="text-[11px]">
                  Kebutuhan plano dihitung dari (Oplah / Dapat Plano) + (Insheet / Potong Mesin). Biaya kertas = (Kebutuhan Plano / 500) × Rim Price.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  3. Ongkos Cetak &amp; Over Drek:
                </span>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                  <li><strong>Oliver:</strong> Minimum order 4 warna (4 × Rp 90.000 = Rp 360.000) untuk tarikan s/d 1.000 lembar. Over drek dihitung (Q - 1.000) × Rp 40 × 4.</li>
                  <li><strong>SM:</strong> Minimum order 4 warna (4 × Rp 310.000 = Rp 1.240.000) untuk tarikan s/d 3.000 lembar. Over drek dihitung (Q - 3.000) × Rp 100 × 4.</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  4. Finishing Tambahan (Laminasi / UV Varnish):
                </span>
                <p className="text-[11px]">
                  Dihitung dari luas bidang potong (D + 1) × (F + 1) cm² × Tarif × Oplah, dengan batas minimum charge Rp 50.000 per order.
                </p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
