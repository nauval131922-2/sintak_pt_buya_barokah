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
} from 'lucide-react';
import {
  MajalahMasterParams,
  DEFAULT_MAJALAH_PARAMS,
} from '@/lib/majalah-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface MajalahMasterParameterProps {
  customParams: MajalahMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<MajalahMasterParams>>;
}

interface FieldDef {
  key: keyof MajalahMasterParams;
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

const COVER_GROUPS: GroupDef[] = [
  {
    title: 'Bahan & Cetak Cover AC 230',
    border: 'border-sky-300',
    labelCls: 'text-sky-800',
    fields: [
      { key: 'tarifPrintCoverA3', label: 'Print Cover A3+ (Print Inter)' },
      { key: 'tarifKertasAc230Kg', label: 'Harga Kertas AC 230 / kg' },
      { key: 'tarifDesainCover', label: 'Desain Cover (per order)' },
    ],
  },
  {
    title: 'Mesin Offset Oliver Cover',
    border: 'border-sky-300',
    labelCls: 'text-sky-800',
    fields: [
      { key: 'tarifPlateCoverOliver', label: 'Tarif Plat Cover (per plat)' },
      { key: 'minOngkosCoverOliver', label: 'Min Ongkos Cetak Cover (per plat)' },
      { key: 'drekCoverOliver', label: 'Tarif Drek Over Cover (per drek)' },
    ],
  },
];

const ISI_GROUPS: GroupDef[] = [
  {
    title: 'Bahan & Cetak Isi AP 120 Full Colour',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifKertasAp120Kg', label: 'Harga Kertas AP 120 / kg' },
      { key: 'tarifDesainIsi', label: 'Desain Isi 32 Halaman' },
      { key: 'tarifPrintIsiA3', label: 'Print Isi A3+ / sisi (Print Inter)' },
    ],
  },
  {
    title: 'Mesin Offset Oliver Isi',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifPlateIsiOliver', label: 'Tarif Plat Isi (per plat)' },
      { key: 'minOngkosIsiOliver', label: 'Min Ongkos Cetak Isi (per plat)' },
      { key: 'drekIsiOliver', label: 'Tarif Drek Over Isi (per drek)' },
    ],
  },
];

const JASA_GROUPS: GroupDef[] = [
  {
    title: 'Upah Tenaga Kerja & Jilid Standar',
    border: 'border-violet-300',
    labelCls: 'text-violet-800',
    fields: [
      { key: 'umr', label: 'UMR Acuan Upah Tenaga Kerja' },
      { key: 'jasaFinishingStandar', label: 'Tarif Susun Staples Lipat / pcs', opts: { decimal: true } },
      { key: 'tarifKawatRoll', label: 'Harga Kawat Stiching / roll' },
      { key: 'tarifStaplesPcs', label: 'Biaya Isi Staples / pcs' },
      { key: 'tarifSisirPcs', label: 'Biaya Sisir Potong 3 Sisi / pcs' },
    ],
  },
  {
    title: 'Kemasan & Packing',
    border: 'border-violet-300',
    labelCls: 'text-violet-800',
    fields: [
      { key: 'tarifKardusBox', label: 'Harga Kardus Box / pcs' },
      { key: 'tarifLakbanRoll', label: 'Harga Lakban Transparan / roll' },
      { key: 'kardusIsi', label: 'Kapasitas Isi Kardus', opts: { rupiah: false, suffix: ' pcs' } },
    ],
  },
];

const FINISH_GROUPS: GroupDef[] = [
  {
    title: 'Laminasi Cover & Jilid Lem Bending',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'tarifLaminasiGlossyCm2', label: 'Laminasi Glossy / cm²', opts: { decimal: true } },
      { key: 'tarifLaminasiDoffCm2', label: 'Laminasi Doff / cm²', opts: { decimal: true } },
      { key: 'tarifUvVarnishCm2', label: 'UV Varnish / cm²', opts: { decimal: true } },
      { key: 'minLaminasi', label: 'Batas Bawah Min Laminasi' },
      { key: 'tarifBendingPerCm', label: 'Lem Bending Panas / cm' },
      { key: 'minBending', label: 'Batas Bawah Min Lem Bending' },
    ],
  },
  {
    title: 'Margin & Batas Nego',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'marginDefaultPct', label: 'Margin Standar Default', opts: { rupiah: false, suffix: '%' } },
      { key: 'negoDefaultPct', label: 'Batas Maksimal Nego Default', opts: { rupiah: false, suffix: '%' } },
    ],
  },
];

const ALL_KEYS: (keyof MajalahMasterParams)[] = [
  'umr',
  'tarifPrintCoverA3',
  'tarifKertasAc230Kg',
  'tarifDesainCover',
  'tarifPlateCoverOliver',
  'minOngkosCoverOliver',
  'drekCoverOliver',
  'tarifKertasAp120Kg',
  'tarifDesainIsi',
  'tarifPrintIsiA3',
  'tarifPlateIsiOliver',
  'minOngkosIsiOliver',
  'drekIsiOliver',
  'jasaFinishingStandar',
  'targetBN',
  'targetLipat',
  'targetSisip',
  'targetSusunKomplit',
  'targetKawatRoll',
  'targetStiching',
  'tarifKawatRoll',
  'tarifStaplesPcs',
  'tarifSisirPcs',
  'tarifKardusBox',
  'tarifLakbanRoll',
  'kardusIsi',
  'tarifLaminasiGlossyCm2',
  'tarifLaminasiDoffCm2',
  'tarifUvVarnishCm2',
  'minLaminasi',
  'tarifBendingPerCm',
  'minBending',
  'marginDefaultPct',
  'negoDefaultPct',
];

export default function MajalahMasterParameter({
  customParams,
  setCustomParams,
}: MajalahMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const isFieldModified = (key: keyof MajalahMasterParams) =>
    (customParams[key] ?? DEFAULT_MAJALAH_PARAMS[key]) !== DEFAULT_MAJALAH_PARAMS[key];

  const isModified = useMemo(
    () => ALL_KEYS.some((k) => isFieldModified(k)),
    [customParams]
  );

  const handleChange = (key: keyof MajalahMasterParams, val: number) => {
    setCustomParams((prev) => ({
      ...prev,
      [key]: Math.max(0, val),
    }));
  };

  const handleResetField = (key: keyof MajalahMasterParams) => {
    setCustomParams((prev) => ({
      ...prev,
      [key]: DEFAULT_MAJALAH_PARAMS[key],
    }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_MAJALAH_PARAMS[key]}).`);
  };

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_MAJALAH_PARAMS });
    toast.success('Semua parameter Majalah dikembalikan ke standar master.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_MAJALAH_PARAMS[f.key];
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
    const val = customParams[key] ?? DEFAULT_MAJALAH_PARAMS[key];

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
          'bg-sky-50/40 border-sky-200',
          cardHeader('text-sky-900 bg-sky-200/80', 'Cover', Printer, 'text-sky-600', '1. Cover & Mesin Cetak Cover'),
          COVER_GROUPS,
          <p className="text-[10px] text-slate-500">
            Cover AC 230 gsm 1 Muka Full Colour. Print Inter (oplah ≤500 pcs) / Offset Oliver 4 Plat (oplah ≥600 pcs).
          </p>
        )}

        {cardShell(
          'bg-blue-50/40 border-blue-200',
          cardHeader('text-blue-900 bg-blue-200/80', 'Isi', Layers, 'text-blue-600', '2. Isi Art Paper 120 gsm Full Colour'),
          ISI_GROUPS,
          <p className="text-[10px] text-slate-500">
            Isi 32 Halaman (8 Lembar) Full Colour. Print Inter 2 Muka (oplah ≤200 pcs) / Offset Oliver 16 Plat (oplah ≥250 pcs).
          </p>
        )}

        {cardShell(
          'bg-violet-50/40 border-violet-200',
          cardHeader('text-violet-900 bg-violet-200/80', 'Jasa', Scissors, 'text-violet-600', '3. Jilid, Finishing & Kemasan'),
          JASA_GROUPS,
          <p className="text-[10px] text-slate-500">
            Upah UMR Rp 2.818.850. Oplah ≤200 pcs menggunakan model Susun Staples Lipat. Oplah ≥250 pcs menggunakan Kawat Stiching & Sisir 3 Sisi.
          </p>
        )}

        {cardShell(
          'bg-amber-50/40 border-amber-200',
          cardHeader('text-amber-900 bg-amber-200/80', 'Finishing', Database, 'text-amber-600', '4. Finishing Tambahan & Margin'),
          FINISH_GROUPS,
          <p className="text-[10px] text-slate-500">
            Luas cover terbuka: 30 × 21,25 cm = 637,5 cm². Min Laminasi Rp 50.000, Min Lem Bending Rp 100.000.
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
            className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900">
                <HelpCircle size={18} className="text-emerald-700" />
                <h3 className="font-bold text-sm">Panduan Parameter Master Majalah 14,5×20,25 cm</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg hover:bg-emerald-100 text-slate-500 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 block text-xs">
                  Spesifikasi Standar Katalog 20 (Majalah 14,5×20,25 cm)
                </span>
                <p>
                  Ukuran tertutup 14,5 × 20,25 cm (terbuka 29 × 20,25 cm + buangan potong). 
                  Cover Art Carton 230 gsm 1 Muka Full Colour. 
                  Isi Art Paper 120 gsm 32 Halaman (8 Lembar A3+ / 2 katern plano) Full Colour bolak-balik.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Alur Perpindahan Mesin Cetak Otomatis
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <li>
                    <strong>Oplah 20–200 pcs</strong>: Cover Print Inter A3+ Digital, Isi Print Inter A3+ FC 2 Muka, Finishing model Susun Staples Lipat.
                  </li>
                  <li>
                    <strong>Oplah 250–500 pcs</strong>: Cover Print Inter A3+ Digital, Isi Offset Oliver 4 Warna (16 Plat), Finishing Kawat Stiching & Sisir 3 Sisi.
                  </li>
                  <li>
                    <strong>Oplah 600–3.000 pcs</strong>: Cover Offset Oliver 4 Warna (4 Plat), Isi Offset Oliver 4 Warna (16 Plat), Finishing Kawat Stiching & Sisir 3 Sisi.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Ketentuan Finishing Tambahan &amp; Kemasan
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <li>Laminasi dihitung dari luas cover terbuka 637,5 cm² dengan batas minimal order Rp 50.000.</li>
                  <li>Jilid Lem Bending panas memiliki batas minimal order Rp 100.000.</li>
                  <li>Kemasan standar menggunakan kardus box kapasitas 200 pcs per box dan lakban transparan.</li>
                </ul>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition cursor-pointer"
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
