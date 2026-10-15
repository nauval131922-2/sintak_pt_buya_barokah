'use client';

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { Loader2, Play, Save, CheckSquare, Square, HelpCircle, BookOpen, X, ShieldCheck, CheckCircle2, Info, Layers, MousePointerClick } from 'lucide-react';
import CopyButton from '@/components/ui/CopyButton';
import SearchAndReload from '@/components/SearchAndReload';

interface Cand {
  kode: string;
  nama: string;
  bom: number;
  beli: number;
  so: number;
  jual: number;
  spk: boolean;
}

interface GenResult {
  success: boolean;
  minBom: number;
  generik: Cand[];
  generikCount: number;
  custom: Cand[];
  customCount: number;
  error?: string;
}

const STORAGE_KEYS = {
  MIN_BOM: 'sintak_routine_minBom',
  DATA: 'sintak_routine_candidates',
  PICKED: 'sintak_routine_picked',
};

// Komponen baris di-memoize: identik dengan tabel Lap. Penonaktifan Master Barang Jadi
const CandidateRow = memo(function CandidateRow({
  c,
  tableId,
  isSelected,
  onRowClick,
}: {
  c: Cand;
  tableId: string;
  isSelected: boolean;
  onRowClick: (tableId: string, kode: string, e: React.MouseEvent, isCheckbox?: boolean) => void;
}) {
  return (
    <tr
      onMouseDown={(e) => {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          e.preventDefault();
        }
      }}
      onClick={(e) => onRowClick(tableId, c.kode, e, false)}
      className={`group cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50/90 hover:bg-blue-100/70 text-blue-950 font-bold is-selected'
          : 'hover:bg-slate-50 text-slate-700'
      }`}
    >
      <td
        className="px-2.5 py-1.5 text-center text-blue-600"
        onClick={(e) => {
          e.stopPropagation();
          onRowClick(tableId, c.kode, e, true);
        }}
      >
        {isSelected ? <CheckSquare size={15} /> : <Square size={15} className="text-slate-300" />}
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-slate-700">{c.kode}</span>
          <CopyButton text={c.kode} size={11} className="w-5 h-5 opacity-40 group-hover:opacity-100 hover:!opacity-100" title="Salin kode" />
        </div>
      </td>
      <td className="px-2 py-1.5 max-w-[280px]">
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <span className="text-slate-600 truncate flex-1" title={c.nama}>{c.nama}</span>
          <CopyButton text={c.nama} size={11} className="w-5 h-5 shrink-0 opacity-40 group-hover:opacity-100 hover:!opacity-100" title="Salin nama barang" />
        </div>
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 font-semibold">{c.bom}×</td>
      <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{c.beli > 0 ? `${c.beli}×` : '—'}</td>
      <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{c.so > 0 ? `${c.so}×` : '—'}</td>
      <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{c.jual > 0 ? `${c.jual}×` : '—'}</td>
      <td className="px-2 py-1.5 text-center">
        {c.spk ? (
          <span className="text-[10px] font-bold text-amber-600" title="Sudah ada SPK — terlindungi otomatis, tak perlu rutin">
            SPK ✓
          </span>
        ) : (
          <span className="text-[10px] text-slate-300">—</span>
        )}
      </td>
    </tr>
  );
});

export default function RoutineGeneratorClient() {
  const [minBom, setMinBom] = useState('3');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<GenResult | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [searchGenerik, setSearchGenerik] = useState('');
  const [searchCustom, setSearchCustom] = useState('');

  const lastClickedRef = useRef<{ tableId: string; kode: string } | null>(null);

  // Restore dari localStorage setelah mounted di browser (mencegah hydration mismatch)
  useEffect(() => {
    try {
      const savedMinBom = localStorage.getItem(STORAGE_KEYS.MIN_BOM);
      if (savedMinBom) setMinBom(savedMinBom);

      const savedData = localStorage.getItem(STORAGE_KEYS.DATA);
      if (savedData) {
        const parsed = JSON.parse(savedData) as GenResult;
        if (parsed && Array.isArray(parsed.generik) && Array.isArray(parsed.custom)) {
          setData(parsed);
        }
      }

      const savedPicked = localStorage.getItem(STORAGE_KEYS.PICKED);
      if (savedPicked) {
        const parsedPicked = JSON.parse(savedPicked);
        if (Array.isArray(parsedPicked)) {
          setPicked(new Set(parsedPicked));
        }
      }
    } catch (e) {
      console.error('Failed to restore routine generator data:', e);
    } finally {
      setIsMounted(true);
    }
  }, []);

  // Simpan minBom ke localStorage
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(STORAGE_KEYS.MIN_BOM, minBom);
    } catch { /* ignore */ }
  }, [minBom, isMounted]);

  // Simpan data kandidat ke localStorage
  useEffect(() => {
    if (!isMounted) return;
    try {
      if (data) {
        localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(data));
      } else {
        localStorage.removeItem(STORAGE_KEYS.DATA);
      }
    } catch { /* ignore quota */ }
  }, [data, isMounted]);

  // Debounced simpan picked ke localStorage (mencegah disk blocking di setiap klik)
  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEYS.PICKED, JSON.stringify([...picked]));
      } catch { /* ignore quota */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [picked, isMounted]);

  const handleGenerate = async () => {
    const n = Number(minBom);
    if (!minBom.trim() || !Number.isFinite(n) || n < 1) {
      setError('Repeat minimal harus angka ≥ 1.');
      return;
    }
    setLoading(true);
    setError('');
    setMsg('');
    lastClickedRef.current = null;
    try {
      const res = await fetch(`/api/penonaktifan-master-barang/generate-routine?minBom=${encodeURIComponent(String(Math.floor(n)))}&limit=200`);
      const json = (await res.json()) as GenResult;
      if (!json.success) throw new Error(json.error || 'Gagal generate');
      setData(json);
      setPicked(new Set(json.generik.filter((c) => !c.spk).map((c) => c.kode)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // Filter baris berdasarkan pencarian per tabel
  const filteredGenerik = useMemo(() => {
    const q = searchGenerik.trim().toLowerCase();
    if (!q) return data?.generik ?? [];
    return (data?.generik ?? []).filter(
      (c) => c.kode.toLowerCase().includes(q) || c.nama.toLowerCase().includes(q)
    );
  }, [data?.generik, searchGenerik]);

  const filteredCustom = useMemo(() => {
    const q = searchCustom.trim().toLowerCase();
    if (!q) return data?.custom ?? [];
    return (data?.custom ?? []).filter(
      (c) => c.kode.toLowerCase().includes(q) || c.nama.toLowerCase().includes(q)
    );
  }, [data?.custom, searchCustom]);

  // Implementasi seleksi identik dengan useTableSelection di Lap. Penonaktifan, terisolasi per tabel
  const handleRowClick = useCallback(
    (tableId: string, kode: string, e: React.MouseEvent, isCheckbox?: boolean) => {
      const tableRows = tableId === 'generik' ? filteredGenerik : filteredCustom;

      setPicked((prev) => {
        const next = new Set(prev);

        // 1. Shift + Klik: Range selection (mengambil semua baris antara lastClicked dan baris saat ini)
        if (e.shiftKey && lastClickedRef.current?.tableId === tableId) {
          const lastKode = lastClickedRef.current.kode;
          const currentIndex = tableRows.findIndex((d) => d.kode === kode);
          const lastIndex = tableRows.findIndex((d) => d.kode === lastKode);

          if (currentIndex !== -1 && lastIndex !== -1) {
            const start = Math.min(currentIndex, lastIndex);
            const end = Math.max(currentIndex, lastIndex);

            for (let i = start; i <= end; i++) {
              next.add(tableRows[i].kode);
            }
          }
        }
        // 2. Klik pada Checkbox langsung ATAU Ctrl / Cmd + Klik: Toggle individual selection
        else if (isCheckbox || e.ctrlKey || e.metaKey) {
          if (next.has(kode)) next.delete(kode);
          else next.add(kode);
          lastClickedRef.current = { tableId, kode };
        }
        // 3. Normal Click pada baris: Fokus single selection terisolasi pada tabel ini (TIDAK menghapus pilihan di tabel lain)
        else {
          const isCurrentlySelected = next.has(kode);
          let selectedCountInThisTable = 0;
          for (const d of tableRows) {
            if (next.has(d.kode)) selectedCountInThisTable++;
          }
          const wasOnlyOneSelected = selectedCountInThisTable === 1 && isCurrentlySelected;

          // Hapus hanya pilihan milik tabel ini, biarkan tabel lain tetap utuh
          for (const d of tableRows) {
            next.delete(d.kode);
          }

          if (wasOnlyOneSelected) {
            lastClickedRef.current = null;
          } else {
            next.add(kode);
            lastClickedRef.current = { tableId, kode };
          }
        }

        return next;
      });
    },
    [filteredGenerik, filteredCustom]
  );

  const handleSave = async (mode: 'tambah' | 'ganti') => {
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const curRes = await fetch('/api/penonaktifan-master-barang/settings');
      const cur = await curRes.json();
      if (!cur.success) throw new Error(cur.error || 'Gagal baca settings');
      const curCodes: string[] = cur.settings?.routine_codes ?? [];
      const next = mode === 'ganti' ? [...picked] : [...new Set([...curCodes, ...picked])];
      const saveRes = await fetch('/api/penonaktifan-master-barang/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routine_codes: next, idle_days: cur.settings?.idle_days ?? 7 }),
      });
      const saved = await saveRes.json();
      if (!saved.success) throw new Error(saved.error || 'Gagal simpan');
      setMsg(mode === 'ganti' ? `Tersimpan ${next.length} kode (mengganti).` : `Ditambah — total ${next.length} kode rutin.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const generikStats = useMemo(() => {
    const rows = data?.generik ?? [];
    let count = 0;
    for (const c of rows) if (picked.has(c.kode)) count++;
    return {
      total: rows.length,
      selected: count,
      all: rows.length > 0 && count === rows.length,
      some: count > 0 && count < rows.length,
    };
  }, [data?.generik, picked]);

  const customStats = useMemo(() => {
    const rows = data?.custom ?? [];
    let count = 0;
    for (const c of rows) if (picked.has(c.kode)) count++;
    return {
      total: rows.length,
      selected: count,
      all: rows.length > 0 && count === rows.length,
      some: count > 0 && count < rows.length,
    };
  }, [data?.custom, picked]);

  const renderTable = (
    tableId: 'generik' | 'custom',
    rawRows: Cand[],
    filteredRows: Cand[],
    searchValue: string,
    onSearchChange: (val: string) => void,
    title: string,
    desc: string
  ) => {
    const stats = tableId === 'generik' ? generikStats : customStats;

    const allFilteredSelected = filteredRows.length > 0 && filteredRows.every((c) => picked.has(c.kode));
    const someFilteredSelected = filteredRows.some((c) => picked.has(c.kode)) && !allFilteredSelected;

    const toggleAll = () => {
      setPicked((prev) => {
        const next = new Set(prev);
        if (allFilteredSelected) {
          for (const c of filteredRows) next.delete(c.kode);
        } else {
          for (const c of filteredRows) next.add(c.kode);
        }
        return next;
      });
    };

    const clearThisTable = () => {
      setPicked((prev) => {
        const next = new Set(prev);
        for (const c of rawRows) next.delete(c.kode);
        return next;
      });
    };

    return (
      <div className="flex flex-col h-full min-h-0 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 shrink-0 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 truncate">
                {title} ({filteredRows.length !== rawRows.length ? `${filteredRows.length} dari ${rawRows.length}` : rawRows.length})
              </h3>
              <p className="text-[11px] text-slate-500 truncate">{desc}</p>
            </div>
            {rawRows.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                {stats.selected > 0 && (
                  <>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border text-blue-700 bg-blue-50 border-blue-200">
                      {stats.selected} dipilih
                    </span>
                    <button
                      type="button"
                      onClick={clearThisTable}
                      className="text-[11px] font-semibold text-slate-400 hover:text-blue-600 underline cursor-pointer"
                    >
                      Bersihkan
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* SearchAndReload Baku SINTAK (Reload di Kiri + Search Bar di Kanan) */}
          <SearchAndReload
            searchQuery={searchValue}
            setSearchQuery={onSearchChange}
            onReload={handleGenerate}
            loading={loading}
            placeholder={`Cari kode atau nama di ${tableId === 'generik' ? 'Generik' : 'Custom'}…`}
            compact={true}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white border-b border-slate-100 z-10 shadow-xs">
              <tr>
                <th className="w-9 px-2.5 py-2 text-center">
                  <button
                    type="button"
                    onClick={toggleAll}
                    disabled={filteredRows.length === 0}
                    title={allFilteredSelected ? 'Batalkan semua di hasil filter' : 'Pilih semua di hasil filter'}
                    className="p-0.5 rounded hover:bg-slate-100 text-blue-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {allFilteredSelected ? (
                      <CheckSquare size={15} />
                    ) : someFilteredSelected ? (
                      <div className="w-[15px] h-[15px] rounded border border-blue-600 bg-blue-50 flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-blue-600 rounded-xs" />
                      </div>
                    ) : (
                      <Square size={15} className="text-slate-300" />
                    )}
                  </button>
                </th>
                <th className="text-left px-2 py-2 font-bold text-slate-600">Kode</th>
                <th className="text-left px-2 py-2 font-bold text-slate-600">Nama</th>
                <th className="text-right px-2 py-2 font-bold text-slate-600">BOM</th>
                <th className="text-right px-2 py-2 font-bold text-slate-600" title="Frekuensi di Penerimaan Pembelian (Faktur PB)">Beli</th>
                <th className="text-right px-2 py-2 font-bold text-slate-600" title="Frekuensi di Sales Order (Pesanan Konsumen)">SO</th>
                <th className="text-right px-2 py-2 font-bold text-slate-600" title="Frekuensi di Penjualan (Faktur PJ Kasir)">Jual</th>
                <th className="text-center px-2 py-2 font-bold text-slate-600">SPK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 select-none">
              {filteredRows.map((c) => (
                <CandidateRow
                  key={c.kode}
                  c={c}
                  tableId={tableId}
                  isSelected={picked.has(c.kode)}
                  onRowClick={handleRowClick}
                />
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-slate-400">
                    {searchValue ? 'Tidak ada kandidat yang cocok dengan pencarian.' : 'Tidak ada kandidat.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 px-1 pb-2">
      <div className="flex items-end gap-2 flex-wrap shrink-0">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 mb-1">Minimal produksi berulang (×)</label>
          <input
            value={minBom}
            onChange={(e) => setMinBom(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            className="px-3 py-2 w-24 text-xs tabular-nums bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none shadow-xs"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm transition-all"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Generate kandidat
        </button>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          title="Panduan penggunaan & penjelasan logika kurasi"
        >
          <HelpCircle size={15} className="text-emerald-600" />
          <span>Panduan</span>
        </button>
        {isMounted && data && (
          <>
            <button
              onClick={() => handleSave('tambah')}
              disabled={saving || picked.size === 0}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm transition-all"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Tambah {picked.size} ke rutin
            </button>
            <button
              onClick={() => handleSave('ganti')}
              disabled={saving}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-[12px] font-bold disabled:opacity-50 cursor-pointer shadow-sm transition-all"
            >
              Ganti semua
            </button>
          </>
        )}
      </div>

      {error && <p className="text-xs font-semibold text-red-600 shrink-0">{error}</p>}
      {msg && <p className="text-xs font-semibold text-emerald-600 shrink-0">{msg}</p>}

      {!isMounted ? (
        <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
          <Loader2 size={18} className="animate-spin text-emerald-600 mr-2" /> Memuat data...
        </div>
      ) : data ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-4 overflow-hidden">
          {renderTable('generik', data.generik, filteredGenerik, searchGenerik, setSearchGenerik, 'Generik — disarankan', 'Tanpa OP/HP/NN, repeat-order massal. Centang = lindungi.')}
          {renderTable('custom', data.custom, filteredCustom, searchCustom, setSearchCustom, 'Custom — tidak disarankan', 'Sekali-cetak pelanggan. Terlindungi otomatis via oplah saat SPK jalan.')}
        </div>
      ) : !loading ? (
        <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
          Atur batas repeat, klik Generate — centang kandidat, lalu Tambah ke rutin.
        </div>
      ) : null}

      {/* Modal Panduan Penggunaan Halaman Generator Kode Rutin */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                  <BookOpen size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Panduan Generator Kode Rutin</h3>
                  <p className="text-xs text-emerald-100">Sistem Kurasi Proteksi Kode Barang Master terhadap Usulan Penonaktifan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/20 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title="Tutup Panduan"
              >
                <X size={18} />
              </button>
            </div>

            {/* Isi Panduan Rinci */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-5 text-xs text-slate-600 leading-relaxed">
              {/* Seksi 1: Tujuan Halaman */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1.5">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <h4>Tujuan &amp; Fungsi Halaman</h4>
                </div>
                <p>
                  Halaman ini berfungsi sebagai <strong>alat kurasi proteksi master barang</strong>. Master barang yang terdaftar di dalam <em>Kode Rutin</em> akan <strong>dikecualikan (diberi proteksi kebal)</strong> dari sistem usulan penonaktifan mingguan pada modul <em>Lap. Penonaktifan Master Barang Jadi</em>, karena barang tersebut dinilai merupakan produk standar percetakan yang terus-menerus dipesan ulang (<em>repeat order</em>).
                </p>
              </div>

              {/* Seksi 2: Indikator Kolom Transaksi */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                  <Layers size={15} className="text-emerald-600" />
                  Arti 5 Kolom Indikator Transaksi
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-2xs">
                    <span className="font-bold text-slate-800 block text-xs">1. Kolom BOM (Produksi)</span>
                    <span className="text-[11px] text-slate-500">Jumlah frekuensi barang ini dibuatkan <em>Bill of Materials</em> / SPK naik cetak di percetakan.</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-2xs">
                    <span className="font-bold text-slate-800 block text-xs">2. Kolom Beli (Pembelian PB)</span>
                    <span className="text-[11px] text-slate-500">Jumlah transaksi penerimaan barang pembelian (faktur PB) yang tercatat di <code>rekap_pembelian_barang</code>.</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-2xs">
                    <span className="font-bold text-slate-800 block text-xs">3. Kolom SO (Sales Order)</span>
                    <span className="text-[11px] text-slate-500">Jumlah riwayat pesanan resmi dari konsumen yang tercatat pada modul <code>sales_orders</code>.</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-2xs">
                    <span className="font-bold text-slate-800 block text-xs">4. Kolom Jual (Penjualan Kasir)</span>
                    <span className="text-[11px] text-slate-500">Jumlah faktur nota penjualan kasir/admin yang tercatat pada modul <code>sales_reports</code>.</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-2xs md:col-span-2">
                    <span className="font-bold text-amber-600 block text-xs">5. Kolom SPK ✓ (Proteksi Otomatis Produksi)</span>
                    <span className="text-[11px] text-slate-500">Menandakan barang sedang memiliki SPK aktif berjalan di pabrik. Barang ini <strong>sudah terlindungi otomatis</strong> oleh sistem penonaktifan via oplah berjalan, sehingga tidak wajib dimasukkan ke kode rutin.</span>
                  </div>
                </div>
              </div>

              {/* Seksi 3: Klasifikasi Generik vs Custom */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  Kriteria Pemisahan: Generik vs Custom
                </h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                    <span className="font-bold text-emerald-800 block text-xs">Tabel Kiri: Generik — Disarankan</span>
                    <p className="text-[11px] text-emerald-900/80 mt-0.5">
                      Berisi produk massal standar milik percetakan sendiri (seperti <em>Al-Qur&apos;an Al-Quddus</em> berbagai varian, <em>Buku Panduan Yanbu&apos;a</em>, dan <em>Kitab Standar Pesantren</em>) yang terbukti memiliki riwayat transaksi penjualan/SO aktif berulang kali dan bukan milik satu pemesan perorangan. <strong>Sangat disarankan dicentang untuk dilindungi</strong>.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                    <span className="font-bold text-slate-800 block text-xs">Tabel Kanan: Custom — Tidak Disarankan</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Berisi pesanan perorangan atau instansi khusus (mengandung nama pemesan, nomor HP/WA, label <code>NN -</code>, awalan <code>OP./PO.</code>, nama sekolah/madrasah/ponpes, biro travel umrah, buku manasik, kalender musiman, buku setoran, map raport, atau tidak memiliki riwayat penjualan berulang). Barang-barang ini bertipe <em>made-to-order</em> (sekali cetak). Tidak disarankan dilindungi abadi agar master tidak menumpuk saat sudah selesai acaranya.
                    </p>
                  </div>
                </div>
              </div>

              {/* Seksi 4: Panduan Interaksi Tabel & Keyboard Shortcut */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                  <MousePointerClick size={15} className="text-emerald-600" />
                  Cara Seleksi Baris (Multi-Select) &amp; Pencarian
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                  <li><strong>Klik Biasa pada Baris:</strong> Memilih/fokus pada satu baris tunggal di tabel tersebut.</li>
                  <li><strong>Shift + Klik:</strong> Memilih seluruh rentang baris sekaligus dari baris terakhir yang diklik (<em>range selection</em>).</li>
                  <li><strong>Ctrl + Klik (atau Cmd + Klik):</strong> Menambah atau membatalkan pilihan baris secara individual tanpa mereset baris lain.</li>
                  <li><strong>Klik Kotak Checkbox:</strong> Berfungsi sebagai <em>toggle</em> aditif langsung pada baris tersebut.</li>
                  <li><strong>Checkbox Header Tabel:</strong> Memilih semua atau membatalkan semua baris di tabel tersebut dalam 1 klik.</li>
                  <li><strong>Search &amp; Reload per Tabel:</strong> Gunakan kotak cari di atas masing-masing tabel untuk menyaring kode atau nama barang tertentu secara cepat.</li>
                </ul>
              </div>

              {/* Seksi 5: Perbedaan Tombol Simpan */}
              <div className="border-t border-slate-200/80 pt-4">
                <h4 className="font-bold text-slate-800 text-sm mb-2">Perbedaan Tombol Simpan Proteksi:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/40">
                    <span className="font-bold text-blue-700 block text-xs">Tambah {picked.size} ke rutin (Append)</span>
                    <span>Menggabungkan kode-kode yang sedang Anda centang saat ini ke dalam daftar rutin lama. Kode rutin lama yang sebelumnya sudah terdaftar <strong>tetap dipertahankan (tidak hilang)</strong>.</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <span className="font-bold text-slate-700 block text-xs">Ganti semua (Overwrite)</span>
                    <span>Menghapus seluruh daftar kode rutin lama dan <strong>menggantinya secara total</strong> hanya dengan kode-kode yang Anda centang saat ini. Cocok untuk menyetel ulang daftar proteksi dari nol.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">SINTAK • Sistem Penonaktifan Master Barang PT Buya Barokah</span>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
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
