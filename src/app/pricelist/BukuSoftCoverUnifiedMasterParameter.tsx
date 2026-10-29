'use client';

import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Printer,
  Layers,
  Scissors,
  BookCopy,
  Search,
  X,
  HelpCircle,
} from 'lucide-react';
import {
  DEFAULT_SOFT_COVER_UNIFIED,
  SoftCoverUnifiedParams,
} from '@/lib/buku-soft-cover-unified';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface BukuSoftCoverUnifiedMasterParameterProps {
  customParams: SoftCoverUnifiedParams;
  setCustomParams: React.Dispatch<React.SetStateAction<SoftCoverUnifiedParams>>;
}

type FieldDef = {
  key: keyof SoftCoverUnifiedParams;
  label: string;
  opts?: { rupiah?: boolean; decimal?: boolean; suffix?: string };
};

type GroupDef = {
  title: string;
  border: string;
  labelCls: string;
  fields: FieldDef[];
};

const COVER_GROUPS: GroupDef[] = [
  {
    title: 'Kertas', border: 'border-sky-300', labelCls: 'text-sky-800',
    fields: [
      { key: 'tarifKertasCoverKg', label: 'Harga Cover / kg' },
      { key: 'gramaturCover', label: 'Gramatur', opts: { rupiah: false } },
      { key: 'upCoverPct', label: 'Up Cover (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'insheetCover', label: 'Insheet Cover' },
    ],
  },
  {
    title: 'Cetak', border: 'border-cyan-300', labelCls: 'text-cyan-800',
    fields: [
      { key: 'tarifDesainCover', label: 'Desain Cover' },
      { key: 'tarifPrintCoverA3', label: 'Harga Print Cover A3+' },
    ],
  },
];

const ISI_GROUPS: GroupDef[] = [
  {
    title: 'Kertas', border: 'border-blue-300', labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifKertasIsiKg', label: 'Harga Isi / kg' },
      { key: 'upIsiPct', label: 'Up Isi (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'gramaturIsi', label: 'Gramatur', opts: { rupiah: false } },
      { key: 'insheetIsi', label: 'Insheet Isi' },
    ],
  },
  {
    title: 'Desain', border: 'border-indigo-300', labelCls: 'text-indigo-800',
    fields: [
      { key: 'tarifDesainIsiPerUnit', label: 'Design Isi / Lbr' },
      { key: 'tarifDesainIsiPerHlm', label: 'Design Isi / Hlm' },
    ],
  },
  {
    title: 'Plate & Cetak', border: 'border-sky-300', labelCls: 'text-sky-800',
    fields: [
      { key: 'tarifPlateIsi', label: 'Plate' },
      { key: 'tarifCetakMinIsi', label: 'Harga Min Order/plat' },
      { key: 'tarifDrekIsi', label: 'Per Drek wrn' },
    ],
  },
  {
    title: 'Print Isi', border: 'border-teal-300', labelCls: 'text-teal-800',
    fields: [
      { key: 'tarifPrintBuyaIsi', label: 'Harga Print Isi Buya' },
      { key: 'tarifPrintIsiA3', label: 'Harga Print Isi A3+' },
    ],
  },
];

const JASA_GROUPS: GroupDef[] = [
  {
    title: 'Tenaga', border: 'border-violet-300', labelCls: 'text-violet-800',
    fields: [
      { key: 'umr', label: 'UMR' },
      { key: 'tarifRoyalti', label: 'Royalty' },
    ],
  },
  {
    title: 'Biaya Lain-Lain', border: 'border-purple-300', labelCls: 'text-purple-800',
    fields: [
      { key: 'tarifKawatRoll', label: 'Kawat Stiching @Roll' },
      { key: 'tarifTintaSpotUV', label: 'Tinta Spot UV /Kg' },
      { key: 'tarifSteplesPack', label: 'Isi Steples 369/Pack' },
      { key: 'tarifSisirPerPcs', label: 'Sisir' },
    ],
  },
  {
    title: 'Packing', border: 'border-fuchsia-300', labelCls: 'text-fuchsia-800',
    fields: [
      { key: 'tarifShrinkRoll', label: 'Plastik Sring /Roll' },
      { key: 'tarifLakbanRoll', label: 'Lakban Transparan /Roll' },
      { key: 'tarifKardusBox', label: 'Kardus @' },
    ],
  },
];

const FINISH_GROUPS: GroupDef[] = [
  {
    title: 'Bending', border: 'border-amber-300', labelCls: 'text-amber-800',
    fields: [{ key: 'tarifBending', label: 'Bending' }],
  },
  {
    title: 'Laminasi & UV', border: 'border-orange-300', labelCls: 'text-orange-800',
    fields: [
      { key: 'tarifLaminasiGlossy', label: 'Laminasi Glossy', opts: { decimal: true } },
      { key: 'tarifLaminasiDoff', label: 'Laminasi Doff', opts: { decimal: true } },
      { key: 'tarifUvVarnish', label: 'UV Varnish', opts: { decimal: true } },
    ],
  },
  {
    title: 'Laba', border: 'border-yellow-300', labelCls: 'text-yellow-800',
    fields: [{ key: 'marginDefaultPct', label: 'Laba (%)', opts: { rupiah: false, suffix: '%' } }],
  },
];

// Jarang diubah — collapsed default.
const RARE_GROUPS: GroupDef[] = [
  {
    title: 'Target Harian', border: 'border-teal-300', labelCls: 'text-teal-800',
    fields: [
      { key: 'targetLipat', label: 'Target Lipat /hari' },
      { key: 'targetSisir', label: 'Target Sisir /hari' },
      { key: 'targetSusunKomplit', label: 'Target Susun Komplit /hari' },
      { key: 'targetKawatRoll', label: 'Kawat 1 roll jadi (pcs)' },
      { key: 'targetStiching', label: 'Target Stiching /hari' },
    ],
  },
  {
    title: 'Harga Min', border: 'border-slate-300', labelCls: 'text-slate-600',
    fields: [
      { key: 'minBending', label: 'Min Bending' },
      { key: 'minFinishing', label: 'Min Finishing' },
    ],
  },
];

export default function BukuSoftCoverUnifiedMasterParameter({
  customParams,
  setCustomParams,
}: BukuSoftCoverUnifiedMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const isFieldModified = (key: keyof SoftCoverUnifiedParams) =>
    (customParams[key] ?? DEFAULT_SOFT_COVER_UNIFIED[key]) !== DEFAULT_SOFT_COVER_UNIFIED[key];

  const isModified = useMemo(
    () =>
      (Object.keys(DEFAULT_SOFT_COVER_UNIFIED) as (keyof SoftCoverUnifiedParams)[]).some(
        (k) => (customParams[k] ?? DEFAULT_SOFT_COVER_UNIFIED[k]) !== DEFAULT_SOFT_COVER_UNIFIED[k]
      ),
    [customParams]
  );

  const handleChange = (key: keyof SoftCoverUnifiedParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_SOFT_COVER_UNIFIED });
    toast.success('Semua parameter Buku Soft Cover dikembalikan ke standar Master.');
  };
  const handleResetField = (key: keyof SoftCoverUnifiedParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_SOFT_COVER_UNIFIED[key] }));
    toast.info(`Field kembali ke Master (${DEFAULT_SOFT_COVER_UNIFIED[key]}).`);
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_SOFT_COVER_UNIFIED[f.key];
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
                title="Master"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ThousandInput
            value={customParams[key] ?? DEFAULT_SOFT_COVER_UNIFIED[key]}
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

  const rareVisible = RARE_GROUPS.some((g) => g.fields.some((f) => matchQ(f.label)));

  return (
    <div className="flex flex-col gap-4 pb-8 overflow-y-auto">
      {/* Cari field — sticky agar tetap terlihat saat scroll */}
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs py-1.5 -my-1 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari parameter tarif, kertas, plat, jilid..."
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

      <div className="columns-1 md:columns-2 gap-4">
        {cardShell(
          'bg-sky-50/40 border-sky-200',
          cardHeader('text-sky-900 bg-sky-200/80', 'Cover', Printer, 'text-sky-600', '1. Cover'),
          COVER_GROUPS,
          <p className="text-[10px] text-slate-500">
            Cover Print Inter: Rp {customParams.tarifPrintCoverA3.toLocaleString('id-ID')}/lbr A3+. Cover Oliver: Harga Per kg + Plate mengikuti Master.
          </p>
        )}

        {cardShell(
          'bg-blue-50/40 border-blue-200',
          cardHeader('text-blue-900 bg-blue-200/80', 'Isi', BookCopy, 'text-blue-600', '2. Isi HVS'),
          ISI_GROUPS,
          <p className="text-[10px] text-slate-500">
            Plate/Min/Drek hanya untuk 17.
          </p>
        )}

        {cardShell(
          'bg-violet-50/40 border-violet-200',
          cardHeader('text-violet-900 bg-violet-200/80', 'Jasa', Scissors, 'text-violet-600', '3. Jasa, Kawat & Packing'),
          JASA_GROUPS,
          <p className="text-[10px] text-slate-500">
            Lipat, Sisir, Susun, Stiching, Sring & Packing mengikuti Master dan Catatan.
          </p>
        )}

        {cardShell(
          'bg-amber-50/40 border-amber-200',
          cardHeader('text-amber-900 bg-amber-200/80', 'Finishing', Layers, 'text-amber-600', '4. Bending, Laminasi & Laba'),
          FINISH_GROUPS,
          <p className="text-[10px] text-slate-500">
            Min Finishing Rp {customParams.minFinishing.toLocaleString('id-ID')}, Min Bending Rp {customParams.minBending.toLocaleString('id-ID')}. Laba {customParams.marginDefaultPct}%, dibulatkan. Tanpa Nego.
          </p>
        )}

        {/* 5. Lanjutan — terbuka seperti kartu lain */}
        {rareVisible && (
          <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col gap-3 break-inside-avoid mb-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">Lanjutan</span>
              <h3 className="text-xs font-bold text-slate-700">5. Target & Harga Min</h3>
            </div>
            <div className="flex flex-col gap-2.5">
              {RARE_GROUPS.map(subGroup)}
            </div>
          </div>
        )}
      </div>

      {/* Modal Panduan & Rumus */}
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
                <h3 className="font-bold text-sm">Panduan Parameter Master Buku Soft Cover</h3>
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
                  Spesifikasi &amp; Cakupan Lini Buku Soft Cover (18 Lini Ukuran)
                </span>
                <p>
                  Mencakup Buku Soft Cover ukuran 10,5×14,8 cm (A6), 14,5×20,25 cm (A5/Katalog 18, 19, 21), dan 21×29,7 cm (A4).
                  Cover dicetak pada Art Carton 210/230/260 gsm Full Colour.
                  Isi menggunakan kertas HVS 70/80 gsm atau Bookpaper 55/72 gsm 1 Muka atau 2 Muka (BW / Full Colour).
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Alur &amp; Kombinasi Mesin Cetak (Cover &amp; Isi)
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <li>
                    <strong>Cover</strong>: Print Digital A3+ untuk oplah kecil atau Offset Oliver (4 Plat) untuk oplah besar.
                  </li>
                  <li>
                    <strong>Isi Offset Oliver / SM</strong>: Dihitung berbasis kebutuhan plat cetak, ongkos minimal order, dan tarif drek per warna.
                  </li>
                  <li>
                    <strong>Isi Print Inter Digital</strong>: Dihitung per lembar klik A3+ bolak-balik untuk oplah ekonomis skala kecil.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Finishing Jilid &amp; Ketentuan Minimal Order
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <li><strong>Jilid Lem Panas (Bending)</strong>: Memiliki batas minimal ongkos kerja (Min Bending) jika total biaya di bawah tarif minimum.</li>
                  <li><strong>Jilid Kawat (Stiching)</strong>: Digunakan untuk buku tipis (majalah/buklet) dengan tarif per buku atau per kawat.</li>
                  <li><strong>Laminasi Cover</strong>: Doff atau Glossy 1 muka dihitung dari luas plano cover terbuka dengan batas minimal order.</li>
                  <li><strong>Laba / Margin Standar</strong>: Diterapkan dari total HPP seluruh komponen produksi secara otomatis.</li>
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

