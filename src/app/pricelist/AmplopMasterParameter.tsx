'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  X,
  Printer,
  Layers,
  Package,
  Info,
  Search,
  HelpCircle,
} from 'lucide-react';
import {
  DEFAULT_AMPLOP_PARAMS,
  AmplopMasterParams,
} from '@/lib/amplop-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface AmplopMasterParameterProps {
  customParams: AmplopMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<AmplopMasterParams>>;
}

interface FieldDef {
  key: keyof AmplopMasterParams;
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

const CARD1_GROUPS: GroupDef[] = [
  {
    title: 'Bahan Amplop Jadi & Insheet',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'hargaPackBesar', label: 'Harga /pack Besar 11×23 (Rp)' },
      { key: 'hargaPackTgg', label: 'Harga /pack Tgg 9,5×15,5 (Rp)' },
      { key: 'insheetLembar', label: 'Insheet Tanggung (lbr)', opts: { rupiah: false } },
      { key: 'umr', label: 'UMR Acuan (Rp, info)' },
    ],
  },
];

const CARD2_GROUPS: GroupDef[] = [
  {
    title: 'Tarif Print per Pack',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifPrintUnguBesar', label: 'Print Ungu Besar (Rp)' },
      { key: 'tarifPrintBuyaBesar', label: 'Print Buya Besar (Rp)' },
      { key: 'tarifPrintUnguTgg', label: 'Print Ungu Tgg (Rp)' },
      { key: 'tarifPrintBuyaTgg', label: 'Print Buya Tgg (Rp)' },
    ],
  },
];

const CARD3_GROUPS: GroupDef[] = [
  {
    title: 'Desain, Plate & Jasa',
    border: 'border-sky-300',
    labelCls: 'text-sky-800',
    fields: [
      { key: 'desainStandar', label: 'Desain Standar (Rp)' },
      { key: 'desainBesarPrint', label: 'Desain Besar+Print (Rp)' },
      { key: 'platOverride', label: 'Override Jml Plat V6 (0=auto)', opts: { rupiah: false } },
      { key: 'transportPerOrder', label: 'Transport / order (Rp)' },
    ],
  },
];

const CARD4_GROUPS: GroupDef[] = [
  {
    title: 'BTKL, BOP & Laba',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'btklPct', label: 'BTKL (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'bopPct', label: 'BOP (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'labaPct', label: 'Laba Default (%)', opts: { rupiah: false, suffix: '%' } },
    ],
  },
];
export default function AmplopMasterParameter({
  customParams,
  setCustomParams,
}: AmplopMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const safe: AmplopMasterParams = { ...DEFAULT_AMPLOP_PARAMS, ...(customParams || {}) };

  const handleChange = (key: keyof AmplopMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof AmplopMasterParams) =>
    safe[key] !== DEFAULT_AMPLOP_PARAMS[key];

  const handleResetField = (key: keyof AmplopMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_AMPLOP_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${String(DEFAULT_AMPLOP_PARAMS[key])}).`);
  };

  const isModified = React.useMemo(
    () => (Object.keys(DEFAULT_AMPLOP_PARAMS) as (keyof AmplopMasterParams)[]).some((key) => safe[key] !== DEFAULT_AMPLOP_PARAMS[key]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_AMPLOP_PARAMS });
    toast.success('Semua parameter Amplop dikembalikan ke standar master.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_AMPLOP_PARAMS[f.key];
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
    const val = (safe[key] ?? DEFAULT_AMPLOP_PARAMS[key]) as number;

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
          'bg-white border-slate-200',
          cardHeader('text-emerald-900 bg-emerald-100', 'Bahan', Package, 'text-emerald-600', '1. Amplop Jadi & Insheet'),
          CARD1_GROUPS,
          <p className="text-[10px] text-slate-500">
            Pack @100 pcs (Besar Rp 25.000, Tgg Rp 15.800). Insheet hanya hidup saat Tanggung; ukuran Besar otomatis 3% proporsional.
          </p>
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-blue-900 bg-blue-100', 'Print', Printer, 'text-blue-600', '2. Tarif Print per Pack'),
          CARD2_GROUPS,
          <p className="text-[10px] text-slate-500">
            P2 per pack @100. Besar: Ungu Rp 55.000 / Buya Rp 50.000 (file Besar 1 Warna). Tanggung: Rp 35.000 keduanya.
          </p>
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-sky-900 bg-sky-100', 'Jasa', Layers, 'text-sky-600', '3. Desain, Plate & Jasa'),
          CARD3_GROUPS,
          <p className="text-[10px] text-slate-500">
            Desain Rp 5.000, kecuali Besar+Print Rp 2.500 (file Besar FC). Plate Rp 10.000/plat (Ryobi saja), min Rp 15.000/plat, drek over Rp 30. Desain hanya dihitung bila H &lt; 1000.
          </p>
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-amber-900 bg-amber-100', 'Overhead', Info, 'text-amber-600', '4. BTKL, BOP & Laba'),
          CARD4_GROUPS,
          <p className="text-[10px] text-slate-500">
            BTKL 20% &amp; BOP 10% hanya bila Ryobi dan H ≥ 1000. Laba 30% → harga final pack dibulatkan satuan (ROUNDUP 0).
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
                    3 file Harga AMPLOP JADI (Besar 1 Warna, Besar FC, Tgg FC) — sheet Master, BUKU, named range Oplah &amp; Harga_Final
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
                      <span>1. Bahan &amp; Insheet</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga/pack</strong> <span className="font-mono text-emerald-700">Master!D12</span> = Tgg Rp 15.800 / Besar Rp 25.000 (pack @100, khusus Ryobi).</li>
                      <li>• <strong>Insheet</strong> <span className="font-mono text-emerald-700">Master!D13</span> → <span className="font-mono">BUKU!K6</span>; hidup hanya saat Tanggung (<span className="font-mono">K2</span>=0). Besar otomatis 3%×H.</li>
                      <li>• <strong>Kebutuhan</strong> <span className="font-mono text-emerald-700">BUKU!N7</span> = H + K7; biaya bahan <span className="font-mono">P7</span> = (N7/100) × tarif pack.</li>
                      <li>• <strong>UMR</strong> <span className="font-mono text-emerald-700">Master!D8</span> informatif, tidak masuk rumus.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>2. Mesin Cetak</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Ryobi</strong> <span className="font-mono text-emerald-700">Master!D15</span>: Plate Rp 10.000/plat (<span className="font-mono">U6</span>, jml = warna), min Rp 15.000/plat, over (M−500) × Rp 30 × plat.</li>
                      <li>• <strong>Print Ungu / Print Buya</strong>: tarif per pack <span className="font-mono text-emerald-700">BUKU!P2</span> (Besar 55000/50000, Tgg 35000/35000); plate &amp; ongkos cetak = 0.</li>
                      <li>• <strong>Desain</strong> <span className="font-mono text-emerald-700">Master!D16</span>: Rp 5.000 (Besar+Print Rp 2.500); dihitung hanya bila H &lt; 1000 (<span className="font-mono">R7</span>).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>3. BTKL, BOP &amp; Transport</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>BTKL</strong> <span className="font-mono text-emerald-700">Master!D17</span> = 20% dan <strong>BOP</strong> <span className="font-mono">D18</span> = 10% dari (cetak+plate+desain+kertas) — hanya bila Ryobi dan H ≥ 1000.</li>
                      <li>• <strong>Transport</strong> <span className="font-mono text-emerald-700">BUKU!AE6</span> = 0, berlaku hanya 500 ≤ H &lt; 1000.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Total &amp; Harga Final</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Total HPP</strong> <span className="font-mono text-emerald-700">BUKU!AI7</span> = kertas + desain + plate + cetak + transp + BTKL + BOP.</li>
                      <li>• <strong>Laba</strong> <span className="font-mono text-emerald-700">Master!E20</span> = 30% → <span className="font-mono">AL7</span> = AJ7 × 30%.</li>
                      <li>• <strong>Harga final/pack</strong> <span className="font-mono text-emerald-700">BUKU!AQ7</span> = ROUNDUP(AP7, 0), dibulatkan satuan.</li>
                      <li>• Output via <span className="font-mono">Oplah</span> (H7:H24) &amp; <span className="font-mono">Harga_Final</span> (AQ7:AQ24) + INDEX/MATCH di <span className="font-mono">B39</span>.</li>
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
