'use client';

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { Loader2, Play, Save, CheckSquare, Square } from 'lucide-react';
import CopyButton from '@/components/ui/CopyButton';

interface Cand {
  kode: string;
  nama: string;
  bom: number;
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
      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{c.bom}×</td>
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
  const [minBom, setMinBom] = useState<string>(() => {
    if (typeof window === 'undefined') return '3';
    try {
      return localStorage.getItem(STORAGE_KEYS.MIN_BOM) || '3';
    } catch {
      return '3';
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<GenResult | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const savedData = localStorage.getItem(STORAGE_KEYS.DATA);
      if (savedData) {
        const parsed = JSON.parse(savedData) as GenResult;
        if (parsed && Array.isArray(parsed.generik) && Array.isArray(parsed.custom)) {
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }
    return null;
  });
  const [picked, setPicked] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const savedPicked = localStorage.getItem(STORAGE_KEYS.PICKED);
      if (savedPicked) {
        const parsedPicked = JSON.parse(savedPicked);
        if (Array.isArray(parsedPicked)) {
          return new Set(parsedPicked);
        }
      }
    } catch {
      /* ignore */
    }
    return new Set();
  });
  const [msg, setMsg] = useState('');
  const [hydrated, setHydrated] = useState(false);

  const lastClickedRef = useRef<{ tableId: string; kode: string } | null>(null);

  // Tandai hydration selesai
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Simpan minBom ke localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.MIN_BOM, minBom);
    } catch { /* ignore */ }
  }, [minBom, hydrated]);

  // Simpan data kandidat ke localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (data) {
        localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(data));
      } else {
        localStorage.removeItem(STORAGE_KEYS.DATA);
      }
    } catch { /* ignore quota */ }
  }, [data, hydrated]);

  // Debounced simpan picked ke localStorage (mencegah disk blocking di setiap klik)
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEYS.PICKED, JSON.stringify([...picked]));
      } catch { /* ignore quota */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [picked, hydrated]);

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

  // Implementasi seleksi identik dengan useTableSelection di Lap. Penonaktifan, terisolasi per tabel
  const handleRowClick = useCallback(
    (tableId: string, kode: string, e: React.MouseEvent, isCheckbox?: boolean) => {
      const tableRows = tableId === 'generik' ? (data?.generik ?? []) : (data?.custom ?? []);

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
    [data]
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
    rows: Cand[],
    title: string,
    desc: string
  ) => {
    const stats = tableId === 'generik' ? generikStats : customStats;

    const toggleAll = () => {
      setPicked((prev) => {
        const next = new Set(prev);
        if (stats.all) {
          for (const c of rows) next.delete(c.kode);
        } else {
          for (const c of rows) next.add(c.kode);
        }
        return next;
      });
    };

    const clearThisTable = () => {
      setPicked((prev) => {
        const next = new Set(prev);
        for (const c of rows) next.delete(c.kode);
        return next;
      });
    };

    return (
      <div className="flex flex-col h-full min-h-0 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 shrink-0 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800 truncate">{title} ({rows.length})</h3>
            <p className="text-[11px] text-slate-500 truncate">{desc}</p>
          </div>
          {rows.length > 0 && (
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
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white border-b border-slate-100 z-10 shadow-xs">
              <tr>
                <th className="w-9 px-2.5 py-2 text-center">
                  <button
                    type="button"
                    onClick={toggleAll}
                    disabled={rows.length === 0}
                    title={stats.all ? 'Batalkan semua di tabel ini' : 'Pilih semua di tabel ini'}
                    className="p-0.5 rounded hover:bg-slate-100 text-blue-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {stats.all ? (
                      <CheckSquare size={15} />
                    ) : stats.some ? (
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
                <th className="text-center px-2 py-2 font-bold text-slate-600">SPK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 select-none">
              {rows.map((c) => (
                <CandidateRow
                  key={c.kode}
                  c={c}
                  tableId={tableId}
                  isSelected={picked.has(c.kode)}
                  onRowClick={handleRowClick}
                />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                    Tidak ada kandidat.
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
        {data && (
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

      {data ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-4 overflow-hidden">
          {renderTable('generik', data.generik, 'Generik — disarankan', 'Tanpa OP/HP/NN, repeat-order massal. Centang = lindungi.')}
          {renderTable('custom', data.custom, 'Custom — tidak disarankan', 'Sekali-cetak pelanggan. Terlindungi otomatis via oplah saat SPK jalan.')}
        </div>
      ) : !loading && hydrated ? (
        <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
          Atur batas repeat, klik Generate — centang kandidat, lalu Tambah ke rutin.
        </div>
      ) : null}
    </div>
  );
}
