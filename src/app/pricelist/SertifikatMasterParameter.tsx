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
  DEFAULT_SERTIFIKAT_PARAMS,
  SertifikatMasterParams,
  SERTIFIKAT_GRAMATUR_OPTIONS,
} from '@/lib/sertifikat-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface SertifikatMasterParameterProps {
  customParams: SertifikatMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<SertifikatMasterParams>>;
}

interface FieldDef {
  key: keyof SertifikatMasterParams;
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

const SERTIFIKAT_GROUPS: GroupDef[] = [
  {
    title: '1. Bahan per Jenis',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'hargaKgAc', label: 'Ac 230 — Rp/kg' },
      { key: 'hargaKgBc', label: 'BC — Rp/kg' },
      { key: 'hargaKgLinen', label: 'Linen — Rp/kg' },
      { key: 'gramaturAc', label: 'Ac — gramatur', opts: { rupiah: false } },
      { key: 'gramaturBc', label: 'BC — gramatur', opts: { rupiah: false } },
      { key: 'gramaturLinen', label: 'Linen — gramatur', opts: { rupiah: false } },
    ],
  },
  {
    title: '2. Up Harga per Kombinasi',
    border: 'border-sky-300',
    labelCls: 'text-sky-800',
    fields: [
      { key: 'upAcOffset', label: 'Ac + Offset (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'upAcPrint', label: 'Ac + Print (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'upBcOffset', label: 'BC + Offset (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'upBcPrint', label: 'BC + Print (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'upLinenOffset', label: 'Linen + Offset (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'upLinenPrint', label: 'Linen + Print (%)', opts: { rupiah: false, suffix: '%' } },
    ],
  },
  {
    title: '3. Cetak: Desain, Print, Insheet, Plate',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'desain', label: 'Desain / Order (Rp)' },
      { key: 'tarifPrintAc', label: 'Print Ac / lbr (Rp)' },
      { key: 'tarifPrintBc', label: 'Print BC / lbr (Rp)' },
      { key: 'tarifPrintLinen', label: 'Print Linen / lbr (Rp)' },
      { key: 'insheetOffset', label: 'Insheet Offset (lbr)', opts: { rupiah: false } },
      { key: 'insheetPrint', label: 'Insheet Print (lbr)', opts: { rupiah: false } },
      { key: 'platOverride', label: 'Override Plat Z6 (0=auto)', opts: { rupiah: false } },
      { key: 'umr', label: 'UMR (jasa foil) (Rp)' },
    ],
  },
  {
    title: '4. Finishing, Foil, Kardus & Laba',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'tarifSisir', label: 'Sisir (Rp)' },
      { key: 'tarifLamGlossy', label: 'Laminasi Glossy (Rp/cm²)', opts: { rupiah: false, decimal: true } },
      { key: 'tarifLamDoff', label: 'Laminasi Doff (Rp/cm²)', opts: { rupiah: false, decimal: true } },
      { key: 'tarifUv', label: 'UV Varnish (Rp/cm²)', opts: { rupiah: false, decimal: true } },
      { key: 'tarifFoilPlastikRoll', label: 'Foil plastik /roll (Rp)' },
      { key: 'tarifLakbanRoll', label: 'Lakban /roll (Rp)' },
      { key: 'tarifKardusBox', label: 'Kardus /box (Rp)' },
      { key: 'royaltyPerPcs', label: 'Royalty /pcs (Rp)' },
      { key: 'transportPerOrder', label: 'Transport /order (Rp)' },
      { key: 'labaPct', label: 'Laba Default (%)', opts: { rupiah: false, suffix: '%' } },
    ],
  },
];

export default function SertifikatMasterParameter({
  customParams,
  setCustomParams,
}: SertifikatMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const safe: SertifikatMasterParams = { ...DEFAULT_SERTIFIKAT_PARAMS, ...(customParams || {}) };

  const handleChange = (key: keyof SertifikatMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof SertifikatMasterParams) =>
    safe[key] !== DEFAULT_SERTIFIKAT_PARAMS[key];

  const handleResetField = (key: keyof SertifikatMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_SERTIFIKAT_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${String(DEFAULT_SERTIFIKAT_PARAMS[key])}).`);
  };

  const isModified = React.useMemo(
    () => (Object.keys(DEFAULT_SERTIFIKAT_PARAMS) as (keyof SertifikatMasterParams)[]).some((key) => safe[key] !== DEFAULT_SERTIFIKAT_PARAMS[key]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_SERTIFIKAT_PARAMS });
    toast.success('Semua parameter Sertifikat dikembalikan ke standar master.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_SERTIFIKAT_PARAMS[f.key];
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
    const val = safe[key] ?? DEFAULT_SERTIFIKAT_PARAMS[key];

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
        {/* Card 1: Bahan per jenis */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-emerald-100 text-emerald-800', 'Bahan', Package, 'text-emerald-600', '1. Bahan per Jenis'),
          [SERTIFIKAT_GROUPS[0]],
          <p className="text-[10px] text-slate-500">
            Harga per rim dihitung dari dimensi, gramatur, harga per kg, dan persentase up. Gramatur: {SERTIFIKAT_GRAMATUR_OPTIONS.join(', ')} gsm.
          </p>
        )}

        {/* Card 2: Up per kombinasi */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-sky-100 text-sky-800', 'Up Harga', Layers, 'text-sky-600', '2. Up Harga per Kombinasi'),
          [SERTIFIKAT_GROUPS[1]],
          <p className="text-[10px] text-slate-500">
            Nilai file: Ac 5/0, BC 5/5, Linen 0/0 (offset/print). SM &amp; Ryobi ikut pola offset.
          </p>
        )}

        {/* Card 3: Cetak */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-blue-100 text-blue-800', 'Cetak', Printer, 'text-blue-600', '3. Cetak: Desain, Print, Insheet, Plate'),
          [SERTIFIKAT_GROUPS[2]],
          <p className="text-[10px] text-slate-500">
            Plate: Oliver Rp 45.000 / SM Rp 78.000 / Ryobi Rp 10.000 (jml = warna×muka). Min &amp; drek: 90000/40, 310000/100, 15000/30.
          </p>
        )}

        {/* Card 4: Finishing & laba */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-amber-100 text-amber-800', 'Finishing & Laba', Info, 'text-amber-600', '4. Finishing, Foil, Kardus & Laba'),
          [SERTIFIKAT_GROUPS[3]],
          <p className="text-[10px] text-slate-500">
            Laminasi/UV dikenakan bila dipilih (min Rp 50.000). Foil masuk total hanya bila AP27=√. Laba 30% → final ROUNDUP puluhan.
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
                    6 file Sertifikat 1 Muka (Ac 230, BC, Linen × Oliver, Print) — sheet Master, BUKU, Oplah &amp; Harga_Final
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
                      <li>• <strong>Harga/kg</strong> <span className="font-mono text-emerald-700">Master!D12</span>: Ac Rp 16.400, BC Rp 24.100, Linen Rp 29.900 → <span className="font-mono">BUKU!W30</span>.</li>
                      <li>• <strong>Up</strong> <span className="font-mono text-emerald-700">Master!E12</span>: Ac 5/0, BC 5/5, Linen 0/0 (offset/print) → <span className="font-mono">BUKU!Y30</span>.</li>
                      <li>• <strong>Harga/rim</strong> <span className="font-mono text-emerald-700">BUKU!W29</span> = ((dim×gram)/20000) × (harga/kg + up); plano <span className="font-mono">R7</span> = ceil(H/P7 + K7/O7).</li>
                      <li>• <strong>Insheet</strong> <span className="font-mono text-emerald-700">Master!D13</span>: offset 100, Print 7 → <span className="font-mono">BUKU!K6/K7</span>.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>2. Mesin Cetak</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Oliver</strong>: plate Rp 45.000, min Rp 90.000/plat, drek Rp 40, over Q−1000, 5 lbr/potongan, 10 sertifikat/plano.</li>
                      <li>• <strong>SM</strong>: plate Rp 78.000, min Rp 310.000, drek Rp 100, over Q−3000, 2/8.</li>
                      <li>• <strong>Print Inter</strong>: tanpa plate (Q×tarif Print A3+), 1/2. <strong>Ryobi</strong>: 10000/15000/30, over Q−500, 11/11.</li>
                      <li>• <strong>Desain</strong> <span className="font-mono text-emerald-700">Master!D17</span> = Rp 20.000 → <span className="font-mono">BUKU!V6/V7</span>.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>3. Foil, Laminasi &amp; Kardus</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Foil</strong>: klise Rp 53.200 + jasa (UMR/25)/500/pcs + plastik Rp 295.000/roll — masuk total hanya bila <span className="font-mono">AP27</span>=√.</li>
                      <li>• <strong>Laminasi Glossy/Doff &amp; UV</strong> <span className="font-mono text-emerald-700">Master!D20</span> → checkbox <span className="font-mono">AV27/AY27/BB27</span>; tarif 0,35/0,4/0,12 per cm², min Rp 50.000.</li>
                      <li>• <strong>Sisir</strong> Rp 5.000 selalu ditarik (<span className="font-mono">AS7</span> = ceil(H/500)×5000, tanpa syarat).</li>
                      <li>• <strong>Kardus + lakban</strong> bila <span className="font-mono">BG28</span>=√: ceil(H/1000)×Rp 8.500 + lakban (Rp 8.000/roll ÷ 196).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Total &amp; Harga Final</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Total HPP</strong> <span className="font-mono text-emerald-700">BUKU!BI7</span> = kertas + desain + plate + cetak + royalty + transp + sisir + laminasi/UV + kardus + foil + kebutuhan foil roll.</li>
                      <li>• <strong>Laba</strong> <span className="font-mono text-emerald-700">Master!E24</span> = 30% → <span className="font-mono">BK7</span> = BJ7 × 30%.</li>
                      <li>• <strong>Harga final</strong> <span className="font-mono text-emerald-700">BUKU!BO7</span> = ROUNDUP(BN7, −1), dibulatkan ke <strong>puluhan</strong>.</li>
                      <li>• Output via <span className="font-mono">Oplah</span> (H7:H24) &amp; <span className="font-mono">Harga_Final</span> (BO7:BO24) + INDEX/MATCH di <span className="font-mono">B39</span>.</li>
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
