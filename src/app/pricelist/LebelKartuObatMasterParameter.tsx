'use client';

import React, { useState } from 'react';
import {
  Database,
  RotateCcw,
  BookOpen,
  X,
  Printer,
  Layers,
  Scissors,
  Search,
} from 'lucide-react';
import {
  DEFAULT_LEBEL_KARTU_OBAT_PARAMS,
  LebelKartuObatMasterParams,
} from '@/lib/lebel-kartu-obat-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface LebelKartuObatMasterParameterProps {
  customParams: LebelKartuObatMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<LebelKartuObatMasterParams>>;
}

interface FieldDef {
  key: keyof LebelKartuObatMasterParams;
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

const LEBEL_KARTU_OBAT_GROUPS: GroupDef[] = [
  {
    title: '1. Kertas & Desain',
    border: 'border-blue-300',
    labelCls: 'text-blue-800',
    fields: [
      { key: 'tarifKertasKg', label: 'Kertas HVS / kg (Rp)' },
      { key: 'upKertasPct', label: 'Up Kertas (%)', opts: { rupiah: false, suffix: '%' } },
      { key: 'gramaturGsm', label: 'Gramatur (gsm)', opts: { rupiah: false } },
      { key: 'insheetLbr', label: 'Insheet (lbr)', opts: { rupiah: false } },
      { key: 'tarifDesain', label: 'Desain / Order (Rp)' },
    ],
  },
  {
    title: '2. Plate, Cetak & Sisir',
    border: 'border-sky-300',
    labelCls: 'text-sky-800',
    fields: [
      { key: 'tarifPlatePerPlat', label: 'Plate / Plat (Rp)' },
      { key: 'tarifCetakMinPerPlat', label: 'Min Cetak / Plat (Rp)' },
      { key: 'tarifDrekPerWarna', label: 'Drek / Warna (Rp)' },
      { key: 'tarifSisirPer500', label: 'Sisir / 500 lbr (Rp)' },
      { key: 'tarifRoyaltyPerPcs', label: 'Royalty / rim (Rp)' },
      { key: 'biayaTransport', label: 'Transport / order (Rp)' },
    ],
  },
  {
    title: '3. Margin Standar',
    border: 'border-amber-300',
    labelCls: 'text-amber-800',
    fields: [
      { key: 'marginDefaultPct', label: 'Margin Default (%)', opts: { rupiah: false, suffix: '%' } },
    ],
  },
];

const LEBEL_KARTU_OBAT_VISIBLE_KEYS: (keyof LebelKartuObatMasterParams)[] = [
  'tarifKertasKg',
  'upKertasPct',
  'gramaturGsm',
  'insheetLbr',
  'tarifDesain',
  'tarifPlatePerPlat',
  'tarifCetakMinPerPlat',
  'tarifDrekPerWarna',
  'tarifRoyaltyPerPcs',
  'biayaTransport',
  'tarifSisirPer500',
  'marginDefaultPct',
];

export default function LebelKartuObatMasterParameter({
  customParams,
  setCustomParams,
}: LebelKartuObatMasterParameterProps) {
  const [q, setQ] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof LebelKartuObatMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof LebelKartuObatMasterParams) =>
    customParams[key] !== DEFAULT_LEBEL_KARTU_OBAT_PARAMS[key];

  const handleResetField = (key: keyof LebelKartuObatMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_LEBEL_KARTU_OBAT_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_LEBEL_KARTU_OBAT_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(
    () => LEBEL_KARTU_OBAT_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_LEBEL_KARTU_OBAT_PARAMS[key]),
    [customParams]
  );

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      LEBEL_KARTU_OBAT_VISIBLE_KEYS.forEach((k) => {
        (resetObj as Record<string, unknown>)[k] = DEFAULT_LEBEL_KARTU_OBAT_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Lebel Kartu Obat dikembalikan ke standar master.');
  };

  const fmtStd = (f: FieldDef) => {
    const def = DEFAULT_LEBEL_KARTU_OBAT_PARAMS[f.key];
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
    const val = customParams[key] ?? DEFAULT_LEBEL_KARTU_OBAT_PARAMS[key];

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
          [LEBEL_KARTU_OBAT_GROUPS[0]],
          <p className="text-[10px] text-slate-500">
            HVS 70 gsm Folio 21,5×33 cm Rp 15.700/kg +5% (rim Rp 40.936/500), insheet 30 lbr polos (tanpa koefisien), desain Rp 10.000/order.
          </p>
        )}

        {/* Card 2: Cetak */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-sky-100 text-sky-800', 'Plate, Cetak & Sisir', Scissors, 'text-sky-600', '2. Plate, Cetak & Sisir'),
          [LEBEL_KARTU_OBAT_GROUPS[1]],
          <p className="text-[10px] text-slate-500">
            Plate Rp 10.000×(warna×muka) — Rp 0 saat ONGKOS CETAK. Over = P−500 (Rp 30×plat). Sisir (Q/500)×Rp 10.000 hanya saat finishing SISIR.
          </p>
        )}

        {/* Card 3: Margin */}
        {cardShell(
          'bg-white border-slate-200',
          cardHeader('bg-amber-100 text-amber-800', 'Margin', Layers, 'text-amber-600', '3. Margin Standar'),
          [LEBEL_KARTU_OBAT_GROUPS[2]],
          <p className="text-[10px] text-slate-500">
            Margin 30% dari HPP per rim, harga dibulatkan ke puluhan. Excel tidak punya kolom nego — nego dihapus.
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
                    Referensi sheet, cell, dan formula master Lebel Kartu Obat (16. Pricelist Lebel Kartu Obat/Source/*.xlsm)
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
                  Dropdown Master (diekstrak programatis via dataValidation)
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• <strong>Master!D6 Ukuran</strong>: 1 item per file (= varian 3,5×7 / 4×6 / 5×6,7 — tanpa efek biaya, ketiga file klon identik).</p>
                  <p>• <strong>Master!D7 Oplah</strong>: named range <span className="font-mono text-emerald-700">Oplah</span> → 10 tier rim BUKU!H7:H16 = 1–10 (1 rim = 500 lbr).</p>
                  <p>• <strong>Master!D10 Jenis Cetak</strong>: <span className="font-mono text-emerald-700">CETAK, ONGKOS CETAK,</span> — ONGKOS CETAK menolkan biaya plate (BUKU!W6), min &amp; drek tetap jalan.</p>
                  <p>• <strong>Master!D17 Warna</strong> (1–4) &amp; <strong>Master!D18 Muka</strong> (1/2): jumlah plat = warna×muka (BUKU!X7), pengali drek over = plat.</p>
                  <p>• <strong>Master!D20 Finishing</strong>: <span className="font-mono text-emerald-700">SISIR, TANPA SISIR,</span> → gate biaya sisir BUKU!AJ7.</p>
                  <p>• <strong>Master!D5/D11/D12</strong>: FOLIO, bahan HVS/BC/CD (label saja), gramatur angka 55–160 → BUKU!U27.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Alur Hitung BUKU (per tier rim H)
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• <strong>Plano BUKU!Q7</strong>: =(H·500)/O + K/N (K = insheet 30 polos, tanpa koefisien &amp; tanpa ROUNDUP). <strong>Cetak BUKU!P7</strong>: =N·Q.</p>
                  <p>• <strong>Kertas BUKU!R7</strong>: =(U28/500)·Q dengan <span className="font-mono text-emerald-700">BUKU!U28</span> =((21,5·33)·70)/20000·(15.700·1,05) = Rp 40.936/rim.</p>
                  <p>• <strong>Plat BUKU!W7</strong>: =W6·(warna×muka). <strong>Cetak BUKU!AE7</strong>: =15.000·plat + over·30·plat, over = P−500 (Rp 0 hanya jika P−500 tepat 0).</p>
                  <p>• <strong>Sisir BUKU!AJ7</strong>: =(Q/500)·10.000 (saat SISIR). <strong>Total BUKU!AL7</strong>: =SUM(R+T+W+AE+AG+AI+AJ).</p>
                  <p>• <strong>Harga BUKU!AR7</strong>: =ROUNDUP(AQ,−1) ke puluhan, laba 30% (Master!E21).</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  Sel Mati di Excel (sengaja tidak jadi parameter)
                </h4>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                  <p>• <strong>Master!D8 UMR Rp 2.818.585</strong>: tidak direferensikan rumus BUKU mana pun — engine tidak menghitung upah/jasa.</p>
                  <p>• <strong>BUKU!U6 Film (=0) + T29, BUKU!X6 (=0), BUKU!C6</strong>: konstanta/sel mati tanpa efek biaya.</p>
                  <p>• Ketiga file varian klon identik — pemilih varian hanya label ukuran, bukan pembeda biaya.</p>
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
