'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Printer,
  Layers,
  CreditCard,
  Package,
  Search,
} from 'lucide-react';
import {
  DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS,
  KartuKoperasiPromiseMasterParams,
} from '@/lib/kartu-koperasi-promise-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface KartuKoperasiPromiseMasterParameterProps {
  customParams: KartuKoperasiPromiseMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<KartuKoperasiPromiseMasterParams>>;
}

interface FieldDef {
  key: keyof KartuKoperasiPromiseMasterParams;
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

const KARTU_KOPERASI_PROMISE_GROUPS: GroupDef[] = [
  {
    title: '1. Kertas & Desain',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifKertasKg', label: 'Kertas / kg (Rp)' },
      { key: 'upKertasPct', label: 'Up Kertas (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'gramaturGsm', label: 'Gramatur (gsm)', opts: { rupiah: false } },
      { key: 'insheet', label: 'Insheet (lbr)', opts: { rupiah: false } },
      { key: 'koefInsheet', label: 'Koef. Insheet', opts: { rupiah: false, decimal: true } },
      { key: 'tarifDesign', label: 'Desain / Order (Rp)' },
      { key: 'tarifPrintA3Plus', label: 'Print A3+ (Rp)' },
    ],
  },
  {
    title: '2. Plate, Cetak & Jasa',
    border: 'border-sky-300',
    labelCls: 'text-sky-800',
    fields: [
      { key: 'tarifPlatePerPlat', label: 'Plate / Plat (Rp)' },
      { key: 'tarifCetakMinPerPlat', label: 'Min Cetak / Plat (Rp)' },
      { key: 'tarifRoyaltyPerPcs', label: 'Royalty / pcs (Rp)' },
      { key: 'biayaTransport', label: 'Transport / order (Rp)' },
      { key: 'biayaLain', label: 'Biaya Lain-Lain (Rp)' },
    ],
  },
  {
    title: '3. Finishing Pound, Sisir & Laminasi',
    border: 'border-violet-300',
    labelCls: 'text-violet-800',
    fields: [
      { key: 'umr', label: 'UMR (Rp)' },
      { key: 'tarifPisauPerCm2', label: 'Pisau / cm² (Rp)', opts: { decimal: true } },
      { key: 'tarifSisirPer500', label: 'Sisir / 500 unit (Rp)' },
      { key: 'minPound', label: 'Min Pound (Rp)' },
      { key: 'tarifLaminasiGlossy', label: 'Laminasi Glossy / cm²', opts: { decimal: true } },
      { key: 'tarifLaminasiDoff', label: 'Laminasi Doff / cm²', opts: { decimal: true } },
      { key: 'tarifUvVarnish', label: 'UV Varnish / cm²', opts: { decimal: true } },
      { key: 'minFinishing', label: 'Floor Finishing (Rp)' },
    ],
  },
  {
    title: '4. Packing & Margin',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'tarifKardusBox', label: 'Kardus / box (Rp)' },
      { key: 'tarifLakbanRoll', label: 'Lakban / roll (Rp)' },
      { key: 'lakbanUkuranRoll', label: 'Ukuran Lakban / Roll', opts: { rupiah: false } },
      { key: 'kardusIsiPcs', label: 'Isi Kardus (pcs)', opts: { rupiah: false } },
      { key: 'marginDefaultPct', label: 'Margin Default (%)', opts: { rupiah: false, suffix: '%' } },
    ],
  },
];

const KARTU_KOPERASI_PROMISE_VISIBLE_KEYS: (keyof KartuKoperasiPromiseMasterParams)[] = [
  'umr',
  'tarifKertasKg',
  'upKertasPct',
  'insheet',
  'koefInsheet',
  'gramaturGsm',
  'tarifDesign',
  'tarifPrintA3Plus',
  'tarifPlatePerPlat',
  'tarifCetakMinPerPlat',
  'tarifRoyaltyPerPcs',
  'biayaTransport',
  'biayaLain',
  'tarifPisauPerCm2',
  'tarifSisirPer500',
  'minPound',
  'tarifLaminasiGlossy',
  'tarifLaminasiDoff',
  'tarifUvVarnish',
  'minFinishing',
  'tarifKardusBox',
  'tarifLakbanRoll',
  'lakbanUkuranRoll',
  'kardusIsiPcs',
  'marginDefaultPct',
];

export default function KartuKoperasiPromiseMasterParameter({
  customParams,
  setCustomParams,
}: KartuKoperasiPromiseMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof KartuKoperasiPromiseMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof KartuKoperasiPromiseMasterParams) =>
    customParams[key] !== DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[key];

  const handleResetField = (key: keyof KartuKoperasiPromiseMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => KARTU_KOPERASI_PROMISE_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      KARTU_KOPERASI_PROMISE_VISIBLE_KEYS.forEach((k) => {
        (resetObj as Record<string, unknown>)[k] = DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Kartu Koperasi Promise dikembalikan ke standar master.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[f.key];
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
    const val = customParams[key] ?? DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS[key];

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
        {/* Card 1: Kertas & Desain */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-blue-100 text-blue-800', 'Kertas & Desain', Printer, 'text-blue-600', '1. Kertas & Desain'),
          [KARTU_KOPERASI_PROMISE_GROUPS[0]],
          <p className="text-[10px] text-slate-500">
            Default file: kertas Rp 34.800 +5% &amp; desain Rp 15.000 (varian 10,5) vs Rp 33.000 +0% &amp; tanpa desain (12,7×16,3) — simulator otomatis memakai bawaan tiap file kecuali field diubah manual.
          </p>
        )}

        {/* Card 2: Cetak */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-sky-100 text-sky-800', 'Plate & Cetak', CreditCard, 'text-sky-600', '2. Plate, Cetak & Jasa'),
          [KARTU_KOPERASI_PROMISE_GROUPS[1]],
          <p className="text-[10px] text-slate-500">
            Plate Rp 10.000 &amp; min cetak Rp 15.000 per plat hanya untuk Ryobi (Print Inter = Rp 0). Jumlah plat = warna × muka (12,7 override 1 plat). Drek over: Rp 40 (10,5) / Rp 30 (12,7).
          </p>
        )}

        {/* Card 3: Finishing */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-violet-100 text-violet-800', 'Finishing', Layers, 'text-violet-600', '3. Finishing Pound, Sisir & Laminasi'),
          [KARTU_KOPERASI_PROMISE_GROUPS[2]],
          <p className="text-[10px] text-slate-500">
            Pound = (UMR/25)/target (target 800 utk 10,5 / 1.200 utk 12,7), min Rp 50.000. Laminasi/UV = luas×rate×oplah, floor Rp 50.000, aktif sesuai pilihan finishing.
          </p>
        )}

        {/* Card 4: Packing & Margin */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-amber-100 text-amber-800', 'Packing & Margin', Package, 'text-amber-600', '4. Packing & Margin'),
          [KARTU_KOPERASI_PROMISE_GROUPS[3]],
          <p className="text-[10px] text-slate-500">
            Kardus CEIL(oplah/3000)×Rp 8.500 + lakban (oplah/3000)/(7650/196)×Rp 8.000. Margin 30% dari HPP, harga dibulatkan ke puluhan (Excel tidak punya kolom nego — nego dihapus).
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
                    Referensi sheet, cell, dan formula master Kartu Koperasi Promise (15. Pricelist kartu Koperasi Promise/Source/*.xlsm)
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
                  Dropdown Master!D5–D19 (diekstrak programatis via dataValidation)
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• <strong>Master!D5 Ukuran</strong>: 1 item per file (= varian: 10,5×16,5 / 10,5×21,5 / 12,7×16,3).</p>
                  <p>• <strong>Master!D6 Oplah</strong>: named range <span className="font-mono text-emerald-700">Oplah</span> → 15 tier BUKU!H7:H21 = 500–10.000.</p>
                  <p>• <strong>Master!D13 Muka</strong>: <span className="font-mono text-emerald-700">1 Muka, 2 Muka</span> → BUKU!M7 (jumlah plat &amp; P file 12,7).</p>
                  <p>• <strong>Master!D14 Warna</strong>: <span className="font-mono text-emerald-700">1–4 Warna</span> → BUKU!Y2/L7 (jumlah plat &amp; pengali drek over).</p>
                  <p>• <strong>Master!D15 Cetak</strong>: <span className="font-mono text-emerald-700">Print Inter, Ryobi</span> → potong/plano (N7), kartu/plano (O7), jalur biaya kertas &amp; cetak.</p>
                  <p>• <strong>Master!D19 Catatan</strong>: <span className="font-mono text-emerald-700">None, / UV Varnish, / Laminasi Glossy, / Laminasi Doff,</span> → gate √ BUKU!AQ27/AT27/AW27.</p>
                  <p>• <strong>Master!D9 Bahan</strong> (BC/HVS/…): hanya label tampilan BUKU!X28, tanpa efek biaya. <strong>Master!D10 Gramatur</strong> (17 opsi): dipetakan ke angka BUKU!V28 → harga rim.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Alur Hitung BUKU!K7–BJ7 (per tier oplah H)
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• <strong>Insheet BUKU!K7</strong>: =IF(K2·H≤40, 40, IF(K2·H&gt;30, K2·H, insheet)) dengan K2 = <span className="font-mono text-emerald-700">BUKU!K2</span> 0,025.</p>
                  <p>• <strong>Plano BUKU!Q7</strong>: =ROUNDUP(H/O+K/N,0). <strong>Cetak BUKU!P7</strong>: =Q·N (×muka hanya file 12,7).</p>
                  <p>• <strong>Kertas BUKU!S7</strong>: Print Inter = Rp 2.500×Q; Ryobi = (V29/500)×Q dengan <span className="font-mono text-emerald-700">BUKU!V29</span> =((planoW×planoH)×gsm)/20000×(kg×(1+up)).</p>
                  <p>• <strong>Plat BUKU!X7</strong>: =X6×Y7; Y7 = override Y6 (12,7: 1 plat) atau warna×muka. <strong>Cetak BUKU!AF7</strong>: =min×plat + over×drek×warna, over = P−500 jika &gt;1.</p>
                  <p>• <strong>Pound BUKU!AM7</strong>: =MAX(50.000, H/(O/N)×(UMR/25)/target); target 800 (10,5) / 1.200 (12,7). <strong>Sisir BUKU!AN7</strong>: =(H/(O/N)/500)×10.000.</p>
                  <p>• <strong>Pisau BUKU!AL7</strong>: =149,8×(21,5×31,5) / (17×26,1 utk 12,7). <strong>Packing BUKU!BB7</strong>: =ROUNDUP(H/3000)×8.500 + lakban.</p>
                  <p>• <strong>Total BUKU!BD7</strong>: =S+U+X+AF+AH+AJ+AN+AQ+AT+AW+AK+BB+AM+AL. <strong>Harga BUKU!BJ7</strong>: =ROUNDUP(BI,−1), laba 30% (Master!E23).</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  Perbedaan Bawaan Antar-File (diikat per varian, bukan kompromi)
                </h4>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• Kertas <span className="font-mono">D11</span> Rp 34.800 + up 5% (10,5) vs Rp 33.000 + up 0% (12,7); desain <span className="font-mono">D16</span> Rp 15.000 vs Rp 0.</p>
                  <p>• Drek over Rp 40 (10,5) vs Rp 30 (12,7); plano 21,5×33 vs 61×86; Ryobi 1/4, 1/3 vs 11/22 (potong/kartu); P 12,7 dikali muka.</p>
                  <p>• Simulator memakai bawaan file tiap varian secara otomatis; setiap field yang diubah di tab ini menang secara global.</p>
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
