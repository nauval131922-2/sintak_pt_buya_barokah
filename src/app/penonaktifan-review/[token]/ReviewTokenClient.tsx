'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react';
import { Loader2, Send, Trash2, Plus, Search, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';

interface SnapRow {
  kode: string;
  nama: string;
  kategori: string;
  alasan: string;
}

interface RevItem {
  id: number;
  kode: string;
  nama: string;
  aksi: 'usul_hapus' | 'usul_tambah';
  alasan: string;
  reviewer: string;
  keputusan: string;
}

interface SuggestRow {
  kode: string;
  nama: string;
}

const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

function formatCutoff(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]} ${BULAN_SHORT[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

interface ReviewRowProps {
  s: SnapRow;
  marked: boolean;
  selected: boolean;
  onToggleMarked: (kode: string) => void;
  onToggleSelect: (kode: string, e?: React.MouseEvent, isCheckbox?: boolean) => void;
  dropReason: string;
  onDropReasonChange: (kode: string, reason: string) => void;
}

// Memoized row to prevent re-rendering all rows on reviewer name keystrokes
const ReviewRow = memo(function ReviewRow({
  s,
  marked,
  selected,
  onToggleMarked,
  onToggleSelect,
  dropReason,
  onDropReasonChange,
}: ReviewRowProps) {
  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('input, button')) return;
        onToggleSelect(s.kode, e, false);
      }}
      className={`px-3 sm:px-4 py-2.5 flex items-start gap-2.5 text-xs transition-colors cursor-pointer select-none ${
        marked
          ? 'bg-amber-50/70 border-l-4 border-l-amber-500'
          : selected
          ? 'bg-emerald-50/60 border-l-4 border-l-emerald-500'
          : 'hover:bg-slate-50/60'
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(s.kode, e, true);
        }}
        className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500/20 border-slate-300 cursor-pointer shrink-0"
        title="Pilih (tahan Shift untuk memilih banyak sekaligus)"
      />

      <button
        type="button"
        onClick={() => onToggleMarked(s.kode)}
        title={marked ? 'Batalkan usul hapus' : 'Usul hapus kode ini (jangan dinonaktifkan)'}
        className={`p-1.5 rounded-lg border transition-colors shrink-0 mt-0.5 cursor-pointer ${
          marked
            ? 'bg-rose-500 border-rose-500 text-white hover:bg-rose-600 shadow-sm'
            : 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100 hover:border-rose-300'
        }`}
      >
        <Trash2 size={14} />
      </button>

      <span className="font-mono font-bold text-slate-700 shrink-0 w-24 mt-0.5">{s.kode}</span>

      {/* Nama barang ditampilkan utuh tanpa batasan sempit truncate */}
      <div className="flex-1 min-w-0 pr-2">
        <span className="block text-slate-800 font-semibold text-xs leading-snug whitespace-normal break-words" title={s.nama}>
          {s.nama}
        </span>
        <span
          className="block text-[11px] text-slate-400 leading-tight whitespace-normal break-words mt-0.5"
          title={String(s.alasan ?? '').replace(/penawaran batal/gi, 'Hanya penawaran')}
        >
          {String(s.alasan ?? '').replace(/penawaran batal/gi, 'Hanya penawaran')}
        </span>
      </div>

      <input
        value={dropReason}
        onChange={(e) => onDropReasonChange(s.kode, e.target.value)}
        placeholder="Alasan (opsional)…"
        className="w-40 sm:w-56 shrink-0 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-300 focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none transition-all mt-0.5"
      />
    </div>
  );
});

export default function ReviewTokenClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cutoff, setCutoff] = useState('');
  const [snapshot, setSnapshot] = useState<SnapRow[]>([]);
  const [items, setItems] = useState<RevItem[]>([]);
  
  // Reviewer name with localStorage memory
  const [reviewer, setReviewer] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('penonaktifan_reviewer_name') || '';
    }
    return '';
  });

  const [drop, setDrop] = useState<Record<string, string>>({});
  const [trash, setTrash] = useState<Set<string>>(new Set());
  const [selectedKodes, setSelectedKodes] = useState<Set<string>>(new Set());
  const lastClickedKodeRef = useRef<string | null>(null);
  const [searchUsulan, setSearchUsulan] = useState('');

  // Add Kode State
  const [addKode, setAddKode] = useState('');
  const [addNama, setAddNama] = useState('');
  const [addAlasan, setAddAlasan] = useState('');
  const [adds, setAdds] = useState<Array<{ kode: string; nama: string; alasan: string }>>([]);
  const [addHits, setAddHits] = useState<SuggestRow[]>([]);
  const [addSearching, setAddSearching] = useState(false);
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const addBoxRef = useRef<HTMLDivElement>(null);
  
  const mountedRef = useRef(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState('');
  const [showPastItems, setShowPastItems] = useState(true);
  const [searchPast, setSearchPast] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/penonaktifan-master-barang/review?token=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal muat data review');
      setCutoff(json.review.cutoff);
      setSnapshot(json.review.snapshot ?? []);
      setItems(json.review.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Persist reviewer name
  const handleReviewerChange = (val: string) => {
    setReviewer(val);
    try {
      localStorage.setItem('penonaktifan_reviewer_name', val);
    } catch {}
  };

  // Suggest tambah-kode via endpoint publik ber-token (debounce 300ms)
  useEffect(() => {
    const q = addNama.trim().length >= 2 ? addNama.trim() : addKode.trim();
    if (q.length < 2) {
      setAddHits([]);
      setAddSearching(false);
      return;
    }
    setAddSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/penonaktifan-master-barang/review/search?token=${encodeURIComponent(token)}&q=${encodeURIComponent(q)}&limit=10`,
        );
        const json = await res.json();
        if (mountedRef.current && json.success) setAddHits(json.rows ?? []);
      } catch {
        /* dropdown kosong */
      } finally {
        if (mountedRef.current) setAddSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [addNama, addKode, token]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (addBoxRef.current && !addBoxRef.current.contains(e.target as Node)) {
        setAddDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filtered = useMemo(() => {
    const s = searchUsulan.trim().toLowerCase();
    if (!s) return snapshot;
    return snapshot.filter((x) => x.kode.toLowerCase().includes(s) || x.nama.toLowerCase().includes(s));
  }, [snapshot, searchUsulan]);

  const snapshotMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of snapshot) {
      map.set(s.kode, s.nama);
    }
    return map;
  }, [snapshot]);

  const filteredPastItems = useMemo(() => {
    const q = searchPast.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const nama = (it.nama || snapshotMap.get(it.kode) || '').toLowerCase();
      return (
        it.kode.toLowerCase().includes(q) ||
        nama.includes(q) ||
        (it.alasan || '').toLowerCase().includes(q) ||
        (it.reviewer || '').toLowerCase().includes(q)
      );
    });
  }, [items, searchPast, snapshotMap]);

  const toggleTrash = useCallback((kode: string) => {
    setTrash((prev) => {
      const next = new Set(prev);
      if (next.has(kode)) next.delete(kode);
      else next.add(kode);
      return next;
    });
  }, []);

  // Multi-select with Shift support
  const toggleSelect = useCallback((kode: string, e?: React.MouseEvent, isCheckbox?: boolean) => {
    setSelectedKodes((prev) => {
      const next = new Set(prev);
      if (e?.shiftKey && lastClickedKodeRef.current) {
        const last = lastClickedKodeRef.current;
        const cIdx = filtered.findIndex((x) => x.kode === kode);
        const lIdx = filtered.findIndex((x) => x.kode === last);
        if (cIdx !== -1 && lIdx !== -1) {
          const start = Math.min(cIdx, lIdx);
          const end = Math.max(cIdx, lIdx);
          for (let i = start; i <= end; i++) {
            next.add(filtered[i].kode);
          }
          return next;
        }
      }
      if (isCheckbox || e?.ctrlKey || e?.metaKey) {
        if (next.has(kode)) {
          next.delete(kode);
        } else {
          next.add(kode);
        }
        lastClickedKodeRef.current = kode;
        return next;
      }
      const isCurrentlySelected = next.has(kode);
      const wasOnlyOneSelected = next.size === 1;
      if (isCurrentlySelected && wasOnlyOneSelected) {
        next.clear();
        lastClickedKodeRef.current = null;
      } else {
        next.clear();
        next.add(kode);
        lastClickedKodeRef.current = kode;
      }
      return next;
    });
  }, [filtered]);

  const handleDropReasonChange = useCallback((kode: string, reason: string) => {
    setDrop((prev) => ({ ...prev, [kode]: reason }));
  }, []);

  // Multi-select bulk actions
  const isAllFilteredSelected = filtered.length > 0 && filtered.every((x) => selectedKodes.has(x.kode));

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedKodes((prev) => {
        const next = new Set(prev);
        filtered.forEach((x) => next.delete(x.kode));
        return next;
      });
    } else {
      setSelectedKodes((prev) => {
        const next = new Set(prev);
        filtered.forEach((x) => next.add(x.kode));
        return next;
      });
    }
  };

  const markSelectedForTrash = () => {
    setTrash((prev) => {
      const next = new Set(prev);
      selectedKodes.forEach((k) => next.add(k));
      return next;
    });
    setSelectedKodes(new Set());
  };

  const unmarkSelectedFromTrash = () => {
    setTrash((prev) => {
      const next = new Set(prev);
      selectedKodes.forEach((k) => next.delete(k));
      return next;
    });
    setSelectedKodes(new Set());
  };

  const submit = async () => {
    const seen = new Set<string>();
    const usul: Array<{ kode: string; nama: string; aksi: 'usul_hapus' | 'usul_tambah'; alasan: string }> = [];
    for (const kode of trash) {
      const s = snapshot.find((x) => x.kode === kode);
      if (!s || seen.has(kode)) continue;
      seen.add(kode);
      usul.push({ kode, nama: s.nama ?? '', aksi: 'usul_hapus', alasan: (drop[kode] ?? '').trim() });
    }
    for (const [kode, alasan] of Object.entries(drop)) {
      if (seen.has(kode) || alasan.trim().length === 0) continue;
      const s = snapshot.find((x) => x.kode === kode);
      if (!s) continue;
      seen.add(kode);
      usul.push({ kode, nama: s?.nama ?? '', aksi: 'usul_hapus', alasan: alasan.trim() });
    }
    for (const a of adds) {
      if (seen.has(a.kode)) continue;
      seen.add(a.kode);
      usul.push({ kode: a.kode, nama: a.nama, aksi: 'usul_tambah', alasan: a.alasan });
    }
    if (!reviewer.trim()) {
      setError('Isi nama Anda dulu.');
      return;
    }
    if (usul.length === 0) {
      setError('Belum ada usulan — klik tong sampah pada kode, pilih massal, atau tambah kode.');
      return;
    }
    setSaving(true);
    setError('');
    setDone('');
    try {
      const res = await fetch('/api/penonaktifan-master-barang/review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reviewer: reviewer.trim(), items: usul }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal kirim');
      setDone(`Terkirim ${json.saved} usulan. Terima kasih — pemilik usulan yang memutuskan.`);
      setDrop({});
      setTrash(new Set());
      setSelectedKodes(new Set());
      setAdds([]);
      setAddKode('');
      setAddNama('');
      setAddAlasan('');
      setAddHits([]);
      setAddDropdownOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const showAddDropdown =
    addDropdownOpen && (addNama.trim().length >= 2 || addKode.trim().length >= 2);

  if (loading) {
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center p-4">
        <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
          <Loader2 size={18} className="animate-spin text-emerald-600" />
          Memuat data review usulan…
        </p>
      </div>
    );
  }

  if (error && snapshot.length === 0) {
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center p-4">
        <div className="bg-white border border-rose-200 rounded-2xl p-6 max-w-md text-center shadow-lg">
          <p className="text-sm font-bold text-rose-600 mb-2">Terjadi Kesalahan</p>
          <p className="text-xs text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] flex flex-col gap-2 p-3 sm:px-6 sm:py-3 overflow-hidden bg-slate-50">
      {/* 1. Header Pengenal Reviewer */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shrink-0 shadow-sm">
        <div className="shrink-0">
          <label className="block text-[11px] font-bold text-gray-500 mb-0.5">Nama Anda (pengecek)</label>
          <input
            value={reviewer}
            onChange={(e) => handleReviewerChange(e.target.value)}
            placeholder="cth. Budi"
            className="px-3 py-1.5 w-44 sm:w-56 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>
        <div className="text-[11px] text-slate-500 border-l border-slate-200 pl-3">
          Cutoff: <b className="text-slate-800">{formatCutoff(cutoff)}</b> • Total <b className="text-slate-800">{snapshot.length}</b> kode • Anda hanya mengusulkan, tidak mengubah database secara langsung.
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-rose-600 px-1 shrink-0">{error}</p>}
      {done && <p className="text-xs font-semibold text-emerald-600 px-1 shrink-0">{done}</p>}

      {/* 2. Daftar Usulan Utama (dengan Multi-Select & Baris Cepat) */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white flex-1 min-h-0 flex flex-col shrink shadow-sm">
        {/* Toolbar Header List */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap shrink-0 min-h-[42px]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAllFiltered}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 cursor-pointer"
            >
              {isAllFilteredSelected ? <CheckSquare size={15} className="text-emerald-600" /> : <Square size={15} className="text-slate-400" />}
              <span>Pilih Semua</span>
            </button>
            <span className="text-[11px] text-slate-400 font-medium">
              ({filtered.length} dari {snapshot.length} kode)
            </span>

            {/* Batch actions jika ada item terpilih */}
            {selectedKodes.size > 0 && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={markSelectedForTrash}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 size={12} />
                  <span>Tandai {selectedKodes.size} Usul Hapus</span>
                </button>
                <button
                  type="button"
                  onClick={unmarkSelectedFromTrash}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  Batal Tandai
                </button>
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchUsulan}
              onChange={(e) => setSearchUsulan(e.target.value)}
              placeholder="Cari kode atau nama barang…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Scrollable Rows */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
          {filtered.map((s) => (
            <ReviewRow
              key={s.kode}
              s={s}
              marked={trash.has(s.kode)}
              selected={selectedKodes.has(s.kode)}
              onToggleMarked={toggleTrash}
              onToggleSelect={toggleSelect}
              dropReason={drop[s.kode] ?? ''}
              onDropReasonChange={handleDropReasonChange}
            />
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-xs text-slate-400">Tidak ada kode yang cocok dengan pencarian.</p>
          )}
        </div>
      </div>

      {/* 3. Panel Usul Tambah Kode (Dropdown Melayang Bebas / Floating) */}
      <div className="border border-slate-200 rounded-2xl bg-white shadow-sm shrink-0 relative z-20">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-700">
          Usul tambah kode yang belum ada di daftar
        </div>
        <div className="p-3 flex gap-2.5 flex-wrap items-end">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1">Kode</label>
            <input
              value={addKode}
              onChange={(e) => setAddKode(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder="2608…"
              className="px-2.5 py-1.5 w-28 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Input nama barang dengan wrapper relative untuk floating dropdown */}
          <div className="flex-1 min-w-[220px] relative" ref={addBoxRef}>
            <label className="block text-[10px] font-bold text-gray-400 mb-1">Nama barang</label>
            <input
              value={addNama}
              onChange={(e) => {
                setAddNama(e.target.value);
                setAddDropdownOpen(true);
              }}
              onFocus={() => setAddDropdownOpen(true)}
              placeholder="Ketik min. 2 huruf…"
              autoComplete="off"
              className="px-2.5 py-1.5 w-full text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-500 focus:outline-none"
            />

            {/* Dropdown Mengambang Bebas (Floating Overlay) */}
            {showAddDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                {addSearching && <p className="px-3 py-2 text-[11px] text-slate-400">Mencari barang…</p>}
                {!addSearching && addHits.length === 0 && (
                  <p className="px-3 py-2 text-[11px] text-slate-400">
                    Tidak ada kode/nama yang cocok — kode manual tetap bisa ditambah.
                  </p>
                )}
                {!addSearching &&
                  addHits.map((r) => (
                    <button
                      key={r.kode}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setAddKode(r.kode);
                        setAddNama(r.nama);
                        setAddHits([]);
                        setAddDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title={r.nama}
                    >
                      <span className="block text-xs font-mono font-bold text-slate-700">{r.kode}</span>
                      <span className="block text-[11px] text-slate-600 break-words leading-snug">{r.nama}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="flex-[2] min-w-[180px]">
            <label className="block text-[10px] font-bold text-gray-400 mb-1">Alasan</label>
            <input
              value={addAlasan}
              onChange={(e) => setAddAlasan(e.target.value)}
              placeholder="Kenapa perlu dinonaktifkan…"
              className="px-2.5 py-1.5 w-full text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (!/^\d+$/.test(addKode.trim())) {
                setError('Kode tambah harus numerik.');
                return;
              }
              if (!addAlasan.trim()) {
                setError('Isi alasan penambahan.');
                return;
              }
              setAdds((p) => [...p, { kode: addKode.trim(), nama: addNama.trim(), alasan: addAlasan.trim() }]);
              setAddKode('');
              setAddNama('');
              setAddAlasan('');
              setAddHits([]);
              setAddDropdownOpen(false);
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <Plus size={14} /> Tambah
          </button>
        </div>

        {/* List draft tambah kode */}
        {adds.map((a, i) => (
          <div key={`${a.kode}-${i}`} className="px-4 py-2 flex items-center gap-2.5 text-xs border-t border-slate-100 bg-emerald-50/50">
            <span className="font-mono font-bold text-emerald-700">+{a.kode}</span>
            <span className="text-slate-800 font-semibold">{a.nama || '—'}</span>
            <span className="text-slate-500 flex-1 truncate italic">"{a.alasan}"</span>
            <button
              type="button"
              onClick={() => setAdds((p) => p.filter((_, j) => j !== i))}
              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
              title="Hapus draft"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* 4. Tombol Utama Kirim Usulan */}
      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="shrink-0 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-900/10 cursor-pointer transition-all"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        <span>Kirim usulan koreksi</span>
      </button>

      {/* 5. Panel Usulan yang Sudah Masuk (Collapsible + Search + Tampilkan Nama Barang Lengkap) */}
      {items.length > 0 && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm shrink-0">
          <div className="w-full px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setShowPastItems(!showPastItems)}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-700 cursor-pointer"
            >
              <span>Usulan yang sudah masuk ({items.length})</span>
              {showPastItems ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
            </button>

            <div className="relative w-44 sm:w-60">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchPast}
                onChange={(e) => setSearchPast(e.target.value)}
                placeholder="Cari usulan masuk…"
                className="w-full pl-7 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>
          </div>

          {showPastItems && (
            <div className="max-h-48 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
              {filteredPastItems.map((it) => {
                const namaBarang = it.nama || snapshotMap.get(it.kode) || '—';
                return (
                  <div key={it.id} className="px-4 py-2 text-xs flex items-center gap-2.5 hover:bg-slate-50/50">
                    <span
                      className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] shrink-0 ${
                        it.aksi === 'usul_tambah'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {it.aksi === 'usul_tambah' ? '+' : '−'}{it.kode}
                    </span>

                    {/* Nama Barang Ditampilkan Jelas */}
                    <span className="font-semibold text-slate-800 break-words leading-snug flex-1 min-w-0" title={namaBarang}>
                      {namaBarang}
                    </span>

                    {it.alasan && (
                      <span className="text-slate-400 italic text-[11px] truncate max-w-xs" title={it.alasan}>
                        "{it.alasan}"
                      </span>
                    )}

                    <span className="text-[10px] text-slate-500 font-medium shrink-0 bg-slate-100 px-2 py-0.5 rounded-full">
                      {it.reviewer} • {it.keputusan}
                    </span>
                  </div>
                );
              })}

              {filteredPastItems.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">Tidak ada usulan masuk yang cocok.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
