'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  X,
  Layers,
  Sparkles,
  Package,
  DollarSign,
  Search,
  HelpCircle,
} from 'lucide-react';
import {
  DEFAULT_RAPORT_KALEB_PARAMS,
  RaportKalebMasterParams,
} from '@/lib/raport-kaleb-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface RaportKalebMasterParameterProps {
  customParams: RaportKalebMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<RaportKalebMasterParams>>;
}

interface FieldDef {
  key: keyof RaportKalebMasterParams;
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
    title: 'Bahan Map Kaleb & Kantong Mika',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'hargaMapKosongan', label: 'Harga Map Kosongan' },
      { key: 'upMapKosonganPct', label: 'Markup Map (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'hargaIsiPerLbr', label: 'Tarif Kantong Mika /Lbr' },
      { key: 'tarifPenambahanIsiPricelist', label: 'Acuan Tambah Isi Eceran' },
    ],
  },
];

const CARD2_GROUPS: GroupDef[] = [
  {
    title: 'Desain & Matres Klise Foil Emas',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'tarifDesign', label: 'Biaya Setting Desain' },
      { key: 'tarifKlise', label: 'Tarif Klise Foil (≤120 pcs)' },
      { key: 'batasOplahKlise', label: 'Batas Oplah Klise Gratis', opts: { rupiah: false, suffix: 'pcs' } },
    ],
  },
];

const CARD3_GROUPS: GroupDef[] = [
  {
    title: 'Packing Kardus & Lakban',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifKardusBox', label: 'Kardus Packing / Box' },
      { key: 'tarifLakbanRoll', label: 'Lakban / Roll' },
      { key: 'kapasitasKardus', label: 'Kapasitas Map / Box', opts: { rupiah: false, suffix: 'map' } },
    ],
  },
];

const CARD4_GROUPS: GroupDef[] = [
  {
    title: 'Margin Laba & Nego Standar',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'marginDefaultPct', label: 'Margin Default (%)', opts: { rupiah: false, suffix: '%' }, helpText: 'HARGA JULI 2026!S4: 25%' },
      { key: 'negoDefaultPct', label: 'Nego Default (%)', opts: { rupiah: false, suffix: '%' }, helpText: 'HARGA JULI 2026!T4: 4%' },
    ],
  },
];
export default function RaportKalebMasterParameter({
  customParams,
  setCustomParams,
}: RaportKalebMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof RaportKalebMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof RaportKalebMasterParams) => {
    const current = customParams[key] ?? DEFAULT_RAPORT_KALEB_PARAMS[key];
    const def = DEFAULT_RAPORT_KALEB_PARAMS[key];
    return current !== def;
  };

  const handleResetField = (key: keyof RaportKalebMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_RAPORT_KALEB_PARAMS[key] }));
    toast.info(`Field ${key} dikembalikan ke standar master (${DEFAULT_RAPORT_KALEB_PARAMS[key]}).`);
  };

  const allKeys = Object.keys(DEFAULT_RAPORT_KALEB_PARAMS) as (keyof RaportKalebMasterParams)[];
  const isModified = React.useMemo(
    () =>
      allKeys.some((key) => {
        const current = customParams[key] ?? DEFAULT_RAPORT_KALEB_PARAMS[key];
        return current !== DEFAULT_RAPORT_KALEB_PARAMS[key];
      }),
    [customParams, allKeys]
  );

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_RAPORT_KALEB_PARAMS });
    toast.success('Semua parameter Raport Kaleb dikembalikan ke standar master.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_RAPORT_KALEB_PARAMS[f.key];
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
    const val = (customParams[key] ?? DEFAULT_RAPORT_KALEB_PARAMS[key]) as number;

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
              allowDecimals={isDecimal}
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
          'bg-white border-slate-200',
          cardHeader('text-emerald-900 bg-emerald-100', 'Bahan', Layers, 'text-emerald-700', '1. Bahan Map Kaleb & Kantong Mika'),
          CARD1_GROUPS,
          <p className="text-[10px] text-slate-500">
            Biaya map kosongan dihitung per order oplah. Kantong plastik mika dihitung berdasarkan varian isi (4, 6, 8, 10, 12 lbr) atau custom.
          </p>
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-amber-900 bg-amber-100', 'Klise', Sparkles, 'text-amber-600', '2. Desain & Matres Klise Foil Emas'),
          CARD2_GROUPS,
          <p className="text-[10px] text-slate-500">
            Klise foil emas dibebankan Rp 350.000 untuk pesanan kecil (≤ 120 pcs). Untuk oplah di atas 120 pcs, biaya klise otomatis digratiskan (Rp 0).
          </p>
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-blue-900 bg-blue-100', 'Packing', Package, 'text-blue-600', '3. Packing Kardus & Lakban'),
          CARD3_GROUPS,
          <p className="text-[10px] text-slate-500">
            Di sheet BUKU cell X6 default bernilai non-aktif (&quot;X&quot;). Jika diaktifkan, otomatis menghitung jumlah box kardus dan kebutuhan roll lakban.
          </p>
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-emerald-900 bg-emerald-100', 'Margin', DollarSign, 'text-emerald-600', '4. Margin Laba & Nego Standar'),
          CARD4_GROUPS,
          <p className="text-[10px] text-slate-500">
            Standar pricelist resmi menggunakan margin 25% dan toleransi nego 4% dengan pembulatan ke atas ratusan (ROUNDUP -2).
          </p>
        )}
      </div>

      {/* Modal Manual Pengguna */}
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
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Raport Kaleb (09. Pricelist Raport Kaleb)
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
                  Pemetaan Master Parameter ke File Excel (09. Pricelist Raport Kaleb)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan Map &amp; Kantong Mika</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga Map Kosongan</strong>: <span className="font-mono text-emerald-700">Master!D12</span> = Rp 16.000 / pcs (Ukuran 24×34 cm tertutup).</li>
                      <li>• <strong>Markup Kertas Map</strong>: <span className="font-mono text-emerald-700">Master!E12</span> = 0% default.</li>
                      <li>• <strong>Tarif Kantong Mika /Lbr</strong>: <span className="font-mono text-emerald-700">Master!D13</span> = Rp 900 / lbr mika.</li>
                      <li>• <strong>Varian Standar</strong>: Kosongan (0 lbr), Isi 4, Isi 6, Isi 8, Isi 10, Isi 12.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>2. Desain &amp; Matres Klise Foil</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Biaya Setting Desain</strong>: <span className="font-mono text-amber-700">Master!D14</span> = Rp 10.000 / order.</li>
                      <li>• <strong>Klise Foil Emas</strong>: <span className="font-mono text-amber-700">Master!D15</span> = Rp 350.000 / order.</li>
                      <li>• <strong>Batas Oplah Klise</strong>: <span className="font-mono text-amber-700">BUKU!P7</span> = <code>IF(Oplah &le; 120, 350.000, 0)</code>. Oplah &gt; 120 pcs otomatis bebas biaya klise.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>3. Finishing Packing Kardus &amp; Lakban</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Kardus Packing</strong>: <span className="font-mono text-blue-700">Master!D18</span> = Rp 8.500 / box (Kapasitas: <span className="font-mono text-blue-700">BUKU!V35</span> = 100 map/box).</li>
                      <li>• <strong>Lakban Transparan</strong>: <span className="font-mono text-blue-700">Master!D17</span> = Rp 8.000 / roll (Ukuran: 7.650 cm/roll, pemakaian: 196 cm/box).</li>
                      <li>• <strong>Opsi Default Master</strong>: <span className="font-mono text-blue-700">BUKU!X6</span> = &quot;X&quot; (non-aktif).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>4. Standar Margin &amp; Nego Pricelist</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Margin Laba Standar</strong>: <span className="font-mono text-purple-700">HARGA JULI 2026!S4</span> = 25% (di sheet BUKU!E20 = 30%).</li>
                      <li>• <strong>Nego Diskon Standar</strong>: <span className="font-mono text-purple-700">HARGA JULI 2026!T4</span> = 4%.</li>
                      <li>• <strong>Penambahan Isi Eceran</strong>: <span className="font-mono text-purple-700">HARGA JULI 2026!B11</span> = Rp 1.200 / lbr.</li>
                      <li>• <strong>Pembulatan</strong>: <code>ROUNDUP(..., -2)</code> ke atas ratusan penuh.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
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
