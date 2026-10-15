'use client';

import { useState, useRef, useEffect } from 'react';
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

export default function RoutineGeneratorClient() {
  const [minBom, setMinBom] = useState('3');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<GenResult | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState('');
  const [hydrated, setHydrated] = useState(false);

  const lastClickedRef = useRef<{ tableId: string; kode: string } | null>(null);

  // Restore dari localStorage saat pertama kali mount
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
      setHydrated(true);
    }
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

  // Simpan picked ke localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PICKED, JSON.stringify([...picked]));
    } catch { /* ignore quota */ }
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

  const handleRowClick = (
    tableId: string,
    kode: string,
    tableRows: Cand[],
    e: React.MouseEvent,
    isCheckbox?: boolean
  ) => {
    setPicked((prev) => {
      const next = new Set(prev);

      // 1. Shift + Klik: Range selection (mengambil semua baris antara lastClicked dan baris saat ini)
      if (e.shiftKey && lastClickedRef.current?.tableId === tableId) {
        const lastKode = lastClickedRef.current.kode;
        const cIdx = tableRows.findIndex((x) => x.kode === kode);
        const lIdx = tableRows.findIndex((x) => x.kode === lastKode);
        if (cIdx !== -1 && lIdx !== -1) {
          const start = Math.min(cIdx, lIdx);
          const end = Math.max(cIdx, lIdx);
          for (let i = start; i <= end; i++) {
            next.add(tableRows[i].kode);
          }
          lastClickedRef.current = { tableId, kode };
          return next;
        }
      }

      // 2. Klik pada Checkbox langsung ATAU Ctrl / Cmd + Klik: Additive toggle
      if (isCheckbox || e.ctrlKey || e.metaKey) {
        if (next.has(kode)) {
          next.delete(kode);
        } else {
          next.add(kode);
        }
        lastClickedRef.current = { tableId, kode };
        return next;
      }

      // 3. Klik biasa pada baris: Single select (gaya Windows Explorer / Gmail)
      const isCurrentlySelected = next.has(kode);
      const wasOnlyOneSelected = next.size === 1;
      if (isCurrentlySelected && wasOnlyOneSelected) {
        next.clear();
        lastClickedRef.current = null;
      } else {
        next.clear();
        next.add(kode);
        lastClickedRef.current = { tableId, kode };
      }
      return next;
    });
  };

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

  const renderTable = (tableId: string, rows: Cand[], title: string, desc: string) => {
    const selectedInTable = rows.filter((c) => picked.has(c.kode)).length;
    const allSelected = rows.length > 0 && selectedInTable === rows.length;
    const someSelected = selectedInTable > 0 && !allSelected;

    const toggleAll = () => {
      setPicked((prev) => {
        const next = new Set(prev);
        if (allSelected) {
          for (const c of rows) next.delete(c.kode);
        } else {
          for (const c of rows) next.add(c.kode);
        }
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
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
              selectedInTable > 0
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-slate-500 bg-slate-100 border-slate-200'
            }`}>
              {selectedInTable} dipilih
            </span>
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
                    title={allSelected ? 'Batalkan semua di tabel ini' : 'Pilih semua di tabel ini'}
                    className="p-0.5 rounded hover:bg-slate-100 text-emerald-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {allSelected ? (
                      <CheckSquare size={15} />
                    ) : someSelected ? (
                      <div className="w-[15px] h-[15px] rounded border border-emerald-600 bg-emerald-50 flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-emerald-600 rounded-xs" />
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
              {rows.map((c) => {
                const on = picked.has(c.kode);
                return (
                  <tr
                    key={c.kode}
                    onClick={(e) => handleRowClick(tableId, c.kode, rows, e, false)}
                    className={`group cursor-pointer transition-colors ${on ? 'bg-emerald-50/90 hover:bg-emerald-100/60' : 'hover:bg-slate-50'}`}
                  >
                    <td
                      className="px-2.5 py-1.5 text-center text-emerald-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(tableId, c.kode, rows, e, true);
                      }}
                    >
                      {on ? <CheckSquare size={15} /> : <Square size={15} className="text-slate-300" />}
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
              })}
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
      ) : !loading ? (
        <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
          Atur batas repeat, klik Generate — centang kandidat, lalu Tambah ke rutin.
        </div>
      ) : null}
    </div>
  );
}
