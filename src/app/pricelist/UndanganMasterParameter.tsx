'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Printer,
  Layers,
  Package,
  Info,
  Search,
} from 'lucide-react';
import {
  DEFAULT_UNDANGAN_PARAMS,
  UndanganMasterParams,
  UNDANGAN_GRAMATUR_OPTIONS,
  UNDANGAN_BAHAN_OPTIONS,
} from '@/lib/undangan-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface UndanganMasterParameterProps {
  customParams: UndanganMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<UndanganMasterParams>>;
}

interface FieldDef {
  key: keyof UndanganMasterParams;
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

const UNDANGAN_GROUPS: GroupDef[] = [
  {
    title: '1. Bahan & Kertas',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'hargaPerKg', label: 'Harga / kg (Rp)' },
      { key: 'gramatur', label: 'Gramatur (gsm)', opts: { rupiah: false } },
      { key: 'upOffsetPct', label: 'Up Oliver (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'upPrintPct', label: 'Up Print (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'insheetOliver', label: 'Insheet Oliver (lbr)', opts: { rupiah: false } },
      { key: 'insheetPrint', label: 'Insheet Print (lbr)', opts: { rupiah: false } },
      { key: 'umr', label: 'UMR (lipat/pasang) (Rp)' },
    ],
  },
  {
    title: '2. Cetak: Desain, Print, Plate',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'desain', label: 'Desain / Order (Rp)' },
      { key: 'tarifPrintA3', label: 'Print A3+ / lbr (Rp)' },
      { key: 'transportOliver', label: 'Transport Oliver (Rp)' },
      { key: 'transportPrint', label: 'Transport Print (Rp)' },
    ],
  },
  {
    title: '3. OPP, Label & Jasa',
    border: 'border-sky-300',
    labelCls: 'text-sky-800',
    fields: [
      { key: 'tarifPlastikOpp', label: 'Plastik OPP /100 (Rp)' },
      { key: 'tarifLabel', label: 'Label /84 (Rp)' },
      { key: 'tarifPrintLabel', label: 'Print Label /12 (Rp)' },
      { key: 'royaltyPerPcs', label: 'Royalty /pcs (Rp)' },
    ],
  },
  {
    title: '4. Sisir, Laminasi, Kardus & Laba',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'tarifSisirBase', label: 'Sisir base (Rp)' },
      { key: 'tarifLamGlossy', label: 'Laminasi Glossy (Rp/cm²)', opts: { rupiah: false, decimal: true } },
      { key: 'tarifLamDoff', label: 'Laminasi Doff (Rp/cm²)', opts: { rupiah: false, decimal: true } },
      { key: 'tarifUv', label: 'UV Varnish (Rp/cm²)', opts: { rupiah: false, decimal: true } },
      { key: 'tarifLakbanRoll', label: 'Lakban /roll (Rp)' },
      { key: 'tarifKardusBox', label: 'Kardus /box (Rp)' },
      { key: 'labaPct', label: 'Laba Default (%)', opts: { rupiah: false, suffix: '%' } },
    ],
  },
];

export default function UndanganMasterParameter({
  customParams,
  setCustomParams,
}: UndanganMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const safe: UndanganMasterParams = { ...DEFAULT_UNDANGAN_PARAMS, ...(customParams || {}) };

  const handleChange = (key: keyof UndanganMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof UndanganMasterParams) =>
    safe[key] !== DEFAULT_UNDANGAN_PARAMS[key];

  const handleResetField = (key: keyof UndanganMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_UNDANGAN_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${String(DEFAULT_UNDANGAN_PARAMS[key])}).`);
  };

  const isModified = React.useMemo(
    () => (Object.keys(DEFAULT_UNDANGAN_PARAMS) as (keyof UndanganMasterParams)[]).some((key) => safe[key] !== DEFAULT_UNDANGAN_PARAMS[key]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_UNDANGAN_PARAMS });
    toast.success('Semua parameter Undangan dikembalikan ke standar master.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_UNDANGAN_PARAMS[f.key];
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
    const val = safe[key] ?? DEFAULT_UNDANGAN_PARAMS[key];

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
            value={val as number}
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
        {/* Card 1: Bahan & kertas */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-emerald-100 text-emerald-800', 'Bahan', Package, 'text-emerald-600', '1. Bahan & Kertas'),
          [UNDANGAN_GROUPS[0]],
          <p className="text-[10px] text-slate-500">
            Bahan file: Art Carton 230 gsm (opsi: {UNDANGAN_BAHAN_OPTIONS.join(', ')}; gramatur {UNDANGAN_GRAMATUR_OPTIONS.join(', ')}). Up: Oliver 5%, Print 0%.
          </p>
        )}

        {/* Card 2: Cetak */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-blue-100 text-blue-800', 'Cetak', Printer, 'text-blue-600', '2. Cetak: Desain, Print, Plate'),
          [UNDANGAN_GROUPS[1]],
          <p className="text-[10px] text-slate-500">
            Plate Oliver Rp 45.000/plat (jml = warna×muka), min Rp 90.000/plat, drek over Rp 40 (Q−1000). Print Inter: tanpa plate, R×tarif.
          </p>
        )}

        {/* Card 3: OPP, label & jasa */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-sky-100 text-sky-800', 'Jasa & OPP', Layers, 'text-sky-600', '3. OPP, Label & Jasa'),
          [UNDANGAN_GROUPS[2]],
          <p className="text-[10px] text-slate-500">
            Label + print label masuk total hanya bila AT26=√. Lipat &amp; pasang plastik ikut UMR (nunggu toggle di simulator, default X=0).
          </p>
        )}

        {/* Card 4: Finishing & laba */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-amber-100 text-amber-800', 'Finishing & Laba', Info, 'text-amber-600', '4. Sisir, Laminasi, Kardus & Laba'),
          [UNDANGAN_GROUPS[3]],
          <p className="text-[10px] text-slate-500">
            Sisir min Rp 7.000. Laminasi/UV bila dipilih (min Rp 50.000). Laba 30% → final ROUNDUP puluhan.
          </p>
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
                    4 file Undangan (15×17, 15,5×15,5 × Oliver, Print) — sheet Master, BUKU, Oplah &amp; Harga_Final
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
                  Pemetaan Sel Excel → Parameter SINTAK
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Bahan &amp; Kertas</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga/kg</strong> <span className="font-mono text-emerald-700">Master!D12</span> = Rp 16.400 (Art Carton 230) → <span className="font-mono">BUKU!W30</span>.</li>
                      <li>• <strong>Up</strong> <span className="font-mono text-emerald-700">Master!E12</span>: Oliver 0,05, Print 0 → <span className="font-mono">BUKU!Y30</span>.</li>
                      <li>• <strong>Insheet</strong> <span className="font-mono text-emerald-700">Master!D13</span>: Oliver 150, Print 7 → <span className="font-mono">BUKU!K6/K7</span>.</li>
                      <li>• <strong>Plano</strong> <span className="font-mono text-emerald-700">BUKU!R7</span> = ceil(H/P7 + K7/O7); O7/P7: Oliver 4/12, Print 1/2 (15,5: 1/3).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>2. Cetak</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Oliver</strong>: plate Rp 45.000/plat (jml = warna×muka), min Rp 90.000/plat, over (Q−1000) × Rp 40 × warna.</li>
                      <li>• <strong>Print Inter</strong>: tanpa plate — <span className="font-mono">T7</span> = R7 × tarif Print A3+ (<span className="font-mono">D18</span> = Rp 4.500).</li>
                      <li>• <strong>Desain</strong> <span className="font-mono text-emerald-700">Master!D17</span> = Rp 20.000 → <span className="font-mono">BUKU!V6/V7</span>.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>3. OPP, Label &amp; Jasa</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Plastik OPP</strong> <span className="font-mono text-emerald-700">Master!D22</span> = Rp 12.000/100 pcs (AM26 selalu √).</li>
                      <li>• <strong>Label + print label</strong> bila <span className="font-mono">AT26</span>=√: ceil(H/84)×Rp 5.000 + ceil(H/12)×Rp 1.500.</li>
                      <li>• <strong>Lipat &amp; pasang plastik</strong> ikut UMR bila <span className="font-mono">AN26/AO26</span>=√ (tersimpan X di file).</li>
                      <li>• <strong>Kardus @ Rp 8.000</strong> (<span className="font-mono">D24</span>) sel mati — kardus dihitung pakai tarif lakban Rp 9.200.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Sisir, Laminasi &amp; Total</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Sisir</strong>: max(Rp 7.000, (H/500)×Rp 7.000). <strong>Laminasi/UV</strong> bila dipilih, min Rp 50.000.</li>
                      <li>• <strong>Kardus + lakban</strong> bila <span className="font-mono">BK28</span>=√: ceil(H/500)×Rp 9.200 + lakban.</li>
                      <li>• <strong>Total HPP</strong> <span className="font-mono text-emerald-700">BUKU!BM7</span> (14 komponen) → laba 30% → <span className="font-mono">BS7</span> = ROUNDUP(..., −1) puluhan.</li>
                      <li>• Output via <span className="font-mono">Oplah</span> (H7:H24) &amp; <span className="font-mono">Harga_Final</span> (BS7:BS24) + INDEX/MATCH di <span className="font-mono">B39</span>.</li>
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
