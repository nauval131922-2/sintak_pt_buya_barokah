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
  DEFAULT_KOP_SURAT_PARAMS,
  KopSuratMasterParams,
  KOP_SURAT_GRAMATUR_OPTIONS,
  KOP_SURAT_BAHAN_OPTIONS,
  KOP_SURAT_D9_OPTIONS,
} from '@/lib/kop-surat-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface KopSuratMasterParameterProps {
  customParams: KopSuratMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<KopSuratMasterParams>>;
}

interface FieldDef {
  key: keyof KopSuratMasterParams;
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
    title: 'Bahan & Harga Kertas',
    border: 'border-emerald-300',
    labelCls: 'text-emerald-800',
    fields: [
      { key: 'gramatur', label: 'Gramatur (gsm) [55–160]', opts: { rupiah: false } },
      { key: 'hargaPerKg', label: 'Harga / kg (Rp)' },
      { key: 'upPct', label: 'Up Harga (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'umr', label: 'UMR Acuan (Rp, info)' },
    ],
  },
];

const CARD2_GROUPS: GroupDef[] = [
  {
    title: 'Insheet Lembar Cetak',
    border: 'border-sky-300',
    labelCls: 'text-sky-800',
    fields: [
      { key: 'insheet1Warna', label: 'File 1 Warna (lbr)', opts: { rupiah: false } },
      { key: 'insheet2Warna', label: 'File 2 Warna (lbr)', opts: { rupiah: false } },
      { key: 'insheet3Warna', label: 'File 3 Warna (lbr)', opts: { rupiah: false } },
      { key: 'insheet4Warna', label: 'File 4 Warna (lbr)', opts: { rupiah: false } },
    ],
  },
];

const CARD3_GROUPS: GroupDef[] = [
  {
    title: 'Desain, Film & Plate',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'desain', label: 'Desain / Order (Rp)' },
      { key: 'platOverride', label: 'Override Jml Plat X6 (0=auto)', opts: { rupiah: false } },
      { key: 'royaltyPerRim', label: 'Royalty / rim (Rp)' },
      { key: 'transportPerOrder', label: 'Transport / order (Rp)' },
    ],
  },
];

const CARD4_GROUPS: GroupDef[] = [
  {
    title: 'Laba & Referensi',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'labaPct', label: 'Laba Default (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'hargaPembandingPerRim', label: 'Pembanding / rim (Rp, info)' },
    ],
  },
];

export default function KopSuratMasterParameter({
  customParams,
  setCustomParams,
}: KopSuratMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const safe: KopSuratMasterParams = { ...DEFAULT_KOP_SURAT_PARAMS, ...(customParams || {}) };

  const handleChange = (key: keyof KopSuratMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const handleChangeStr = (key: 'bahanKop' | 'jenisKertasTambahan', val: string) => {
    setCustomParams((prev) => ({ ...prev, [key]: val }));
  };

  const isFieldModified = (key: keyof KopSuratMasterParams) =>
    safe[key] !== DEFAULT_KOP_SURAT_PARAMS[key];

  const handleResetField = (key: keyof KopSuratMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_KOP_SURAT_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${String(DEFAULT_KOP_SURAT_PARAMS[key])}).`);
  };

  const isModified = React.useMemo(
    () => (Object.keys(DEFAULT_KOP_SURAT_PARAMS) as (keyof KopSuratMasterParams)[]).some((key) => safe[key] !== DEFAULT_KOP_SURAT_PARAMS[key]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams({ ...DEFAULT_KOP_SURAT_PARAMS });
    toast.success('Semua parameter Kop Surat dikembalikan ke standar master.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_KOP_SURAT_PARAMS[f.key];
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
    const val = (safe[key] ?? DEFAULT_KOP_SURAT_PARAMS[key]) as number;

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

  const selectRow = (key: 'bahanKop' | 'jenisKertasTambahan', label: string, options: string[], note: string) => {
    if (!matchQ(label)) return null;
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
          <label className="text-xs font-semibold text-slate-700 truncate" title={label}>
            {label}
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
        <select
          value={safe[key]}
          onChange={(e) => handleChangeStr(key, e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs cursor-pointer"
        >
          {key === 'jenisKertasTambahan' && <option value="">(kosong — sesuai file)</option>}
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <p className="text-[10px] text-slate-400 mt-1 italic">{note}</p>
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

  const cardShell = (cls: string, header: React.ReactNode, groups: GroupDef[], extraNode?: React.ReactNode, note?: React.ReactNode) => {
    const hasVisibleFields = groups.some((g) => g.fields.some((f) => matchQ(f.label)));
    const hasVisibleExtra = extraNode != null;
    if (!hasVisibleFields && !hasVisibleExtra) return null;
    return (
      <div className={`${cls} rounded-xl border p-4 shadow-2xs flex flex-col gap-3 break-inside-avoid mb-4`}>
        {header}
        {hasVisibleFields && <div className="flex flex-col gap-2.5">{groups.map(subGroup)}</div>}
        {extraNode}
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

  const bahanSelects = [
    selectRow('bahanKop', 'Bahan Kop', KOP_SURAT_BAHAN_OPTIONS, 'Informatif — pilihan opsi bahan kop surat.'),
    selectRow('jenisKertasTambahan', 'Jenis Kertas Tambahan', KOP_SURAT_D9_OPTIONS, 'Tersimpan opsional.'),
  ].filter(Boolean);

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
          cardHeader('text-emerald-900 bg-emerald-100', 'Bahan', Package, 'text-emerald-600', '1. Bahan & Harga Kertas'),
          CARD1_GROUPS,
          bahanSelects.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{bahanSelects}</div> : null,
          <p className="text-[10px] text-slate-500">
            Harga per rim dihitung dari dimensi, gramatur, harga per kg, dan persentase up. Gramatur: {KOP_SURAT_GRAMATUR_OPTIONS.join(', ')}.
          </p>
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-sky-900 bg-sky-100', 'Insheet', Layers, 'text-sky-600', '2. Insheet Lembar Cetak'),
          CARD2_GROUPS,
          null,
          <p className="text-[10px] text-slate-500">
            Nilai bawaan file: 30 / 30 / 40 / 50. Simulator otomatis memakai default file sesuai jumlah warna, masih bisa dioverride per simulasi.
          </p>
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-blue-900 bg-blue-100', 'Plat', Printer, 'text-blue-600', '3. Desain, Film & Plate'),
          CARD3_GROUPS,
          null,
          <p className="text-[10px] text-slate-500">
            Plate: CETAK = Rp 10.000/plat, ONGKOS CETAK = Rp 0. Min order Rp 15.000/plat, drek over Rp 30 (tetap di kedua mode). Jml plat auto = warna × muka.
          </p>
        )}

        {cardShell(
          'bg-white border-slate-200',
          cardHeader('text-amber-900 bg-amber-100', 'Margin', Info, 'text-amber-600', '4. Laba & Referensi'),
          CARD4_GROUPS,
          null,
          <p className="text-[10px] text-slate-500">
            Laba dihitung dari HPP per rim × margin %. Harga final dibulatkan ke puluhan.
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
                    4 file Pricelist KOP SURAT 1/2/3/4 Warna.xlsm — sheet Master, BUKU, named range Oplah &amp; Harga_Final
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
                      <li>• <strong>Gramatur</strong> <span className="font-mono text-emerald-700">Master!D12</span> = 70 (opsi 55–160) → <span className="font-mono">BUKU!U28</span>.</li>
                      <li>• <strong>Harga/kg</strong> <span className="font-mono text-emerald-700">Master!D13</span> = Rp 15.700 → <span className="font-mono">BUKU!U30</span>.</li>
                      <li>• <strong>Up</strong> <span className="font-mono text-emerald-700">Master!E13</span> = 0,05 (UI 5%) → <span className="font-mono">BUKU!W30</span>.</li>
                      <li>• <strong>Harga/rim</strong> <span className="font-mono text-emerald-700">BUKU!U29</span> = ((T27×U27)×gramatur)/20000 × (harga/kg + up) → <span className="font-mono">Master!D14</span>.</li>
                      <li>• <strong>UMR</strong> <span className="font-mono text-emerald-700">Master!D8</span> = 2.818.585 informatif, tidak masuk rumus.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>2. Insheet &amp; Oplah</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Insheet</strong> <span className="font-mono text-emerald-700">Master!D15</span> → <span className="font-mono">BUKU!K7</span>: file 1W = 30, 2W = 30, 3W = 40, 4W = 50.</li>
                      <li>• <strong>Oplah</strong> <span className="font-mono text-emerald-700">Master!D7</span> dalam <strong>rim</strong> @500 lbr → <span className="font-mono">BUKU!H7:H16</span> = 1–10 rim.</li>
                      <li>• <strong>Kebutuhan plano</strong> <span className="font-mono text-emerald-700">BUKU!Q7</span> = ((H×500)/O7) + (K7/N7).</li>
                      <li>• <strong>Jenis kop</strong> <span className="font-mono text-emerald-700">Master!D5</span>: FOLIO 21,5×33, A4 21×29,7, Setengah Folio/Setengah A4 (jadi 2/area).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>3. Cetak (Plate, Min, Drek)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Desain</strong> <span className="font-mono text-emerald-700">Master!D16</span> = Rp 10.000 → <span className="font-mono">BUKU!T6/T7</span>.</li>
                      <li>• <strong>Plate</strong> <span className="font-mono text-emerald-700">BUKU!W6</span>: CETAK = Rp 10.000/plat, ONGKOS CETAK = Rp 0. Jml plat <span className="font-mono">X7</span> = warna × muka (override <span className="font-mono">X6</span>).</li>
                      <li>• <strong>Min order</strong> <span className="font-mono text-emerald-700">BUKU!Z6</span> = Rp 15.000/plat (tetap), <strong>drek over</strong> <span className="font-mono">AA7</span> = Rp 30, over = P7 − 500.</li>
                      <li>• <strong>Film</strong> <span className="font-mono text-emerald-700">BUKU!U7</span> aktif hanya jika T30 = √. <strong>Sisir</strong> <span className="font-mono">AK7</span> hanya jika <span className="font-mono">Master!D20</span> = SISIR.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Total &amp; Harga Final</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Total HPP</strong> <span className="font-mono text-emerald-700">BUKU!AM7</span> = SUM(kertas + desain + film + plate + cetak + royalty + transp + sisir).</li>
                      <li>• <strong>Laba</strong> <span className="font-mono text-emerald-700">Master!E21</span> = 30% → <span className="font-mono">AO7</span> = AN7 × 30%.</li>
                      <li>• <strong>Harga final</strong> <span className="font-mono text-emerald-700">BUKU!AS7</span> = ROUNDUP(AR7, −1), dibulatkan ke <strong>puluhan</strong>.</li>
                      <li>• Output antar-sheet via <span className="font-mono">Oplah</span> (H7:H24) &amp; <span className="font-mono">Harga_Final</span> (AS7:AS24) + INDEX/MATCH di <span className="font-mono">B38</span>.</li>
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
