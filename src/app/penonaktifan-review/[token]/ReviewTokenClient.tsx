'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Send, Trash2, Plus, Search } from 'lucide-react';

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

export default function ReviewTokenClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cutoff, setCutoff] = useState('');
  const [snapshot, setSnapshot] = useState<SnapRow[]>([]);
  const [items, setItems] = useState<RevItem[]>([]);
  const [reviewer, setReviewer] = useState('');
  const [drop, setDrop] = useState<Record<string, string>>({});
  const [trash, setTrash] = useState<Set<string>>(new Set());
  const [searchUsulan, setSearchUsulan] = useState('');
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

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/penonaktifan-master-barang/review?token=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal muat');
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
        /* abaikan, dropdown kosong */
      } finally {
        if (mountedRef.current) setAddSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [addNama, addKode, token]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (addBoxRef.current && !addBoxRef.current.contains(e.target as Node)) setAddDropdownOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filtered = useMemo(() => {
    const s = searchUsulan.trim().toLowerCase();
    if (!s) return snapshot;
    return snapshot.filter((x) => x.kode.toLowerCase().includes(s) || x.nama.toLowerCase().includes(s));
  }, [snapshot, searchUsulan]);

  const showAddDropdown =
    addDropdownOpen && (addNama.trim().length >= 2 || addKode.trim().length >= 2);

   const toggleTrash = (kode: string) => {
     setTrash((prev) => {
       const next = new Set(prev);
       if (next.has(kode)) next.delete(kode);
       else next.add(kode);
       return next;
     });
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
      setError('Belum ada usulan — klik tong sampah pada kode, atau tambah kode.');
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

  if (loading) return <p className="text-sm text-slate-400 p-4"><Loader2 size={16} className="inline animate-spin mr-1" /> Memuat usulan…</p>;
  if (error && snapshot.length === 0) return <p className="text-sm font-semibold text-red-600 p-4">{error}</p>;

  return (
     <div className="mx-auto w-full max-w-6xl flex flex-col gap-4 p-4 sm:p-6 pb-24">
      <div className="flex items-end gap-3 flex-wrap bg-white border border-slate-200 rounded-2xl p-4">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 mb-1">Nama Anda (pengecek)</label>
          <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="cth. Budi" className="px-3 py-2 w-56 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" />
        </div>
        <div className="text-[11px] text-slate-500 pb-2">Cutoff: <b className="text-slate-700">{formatCutoff(cutoff)}</b> • {snapshot.length} kode • Anda hanya mengusulkan, tidak mengubah apa pun.</div>
      </div>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      {done && <p className="text-xs font-semibold text-emerald-600">{done}</p>}

      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700">Daftar usulan — klik tong sampah bila ingin dihapus</span>
          <span className="text-[11px] text-slate-400">({filtered.length}/{snapshot.length})</span>
          <div className="relative ml-auto w-full sm:w-56">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchUsulan}
              onChange={(e) => setSearchUsulan(e.target.value)}
              placeholder="Cari kode / nama…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
          {filtered.map((s) => {
            const marked = trash.has(s.kode);
            return (
               <div key={s.kode} className={`px-4 py-2 flex items-center gap-3 text-xs flex-wrap ${marked ? 'bg-amber-50/70' : ''}`}>
                 <button
                   type="button"
                   onClick={() => toggleTrash(s.kode)}
                   title={marked ? 'Batalkan usul hapus' : 'Usul hapus kode ini'}
                   className={`p-1.5 rounded-lg border transition-colors shrink-0 ${marked ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' : 'bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300'}`}
                 >
                   <Trash2 size={14} />
                 </button>
                 <span className="font-mono font-bold text-slate-700 shrink-0 w-24">{s.kode}</span>
                 <span className="text-slate-600 flex-1 min-w-[160px] truncate" title={s.nama}>{s.nama}</span>
                 <input value={drop[s.kode] ?? ''} onChange={(e) => setDrop((p) => ({ ...p, [s.kode]: e.target.value }))} placeholder="Alasan (opsional)…" className="flex-[2] min-w-[160px] px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-300 focus:bg-white focus:border-amber-400 focus:outline-none" />
               </div>
             );
           })}
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-slate-400">Tidak ada kode yang cocok dengan pencarian.</p>
          )}
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-700">Usul tambah kode yang belum ada</div>
        <div className="p-3 flex gap-2 flex-wrap items-end">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1">Kode</label>
            <input value={addKode} onChange={(e) => setAddKode(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="2608…" className="px-2 py-1.5 w-28 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-400 focus:outline-none" />
          </div>
          <div className="flex-1 min-w-[200px]" ref={addBoxRef}>
            <label className="block text-[10px] font-bold text-gray-400 mb-1">Nama barang</label>
            <input
              value={addNama}
              onChange={(e) => { setAddNama(e.target.value); setAddDropdownOpen(true); }}
              onFocus={() => setAddDropdownOpen(true)}
              placeholder="Ketik min. 2 huruf…"
              autoComplete="off"
              className="px-2 py-1.5 w-full text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div className="flex-[2] min-w-[160px]">
            <label className="block text-[10px] font-bold text-gray-400 mb-1">Alasan</label>
            <input value={addAlasan} onChange={(e) => setAddAlasan(e.target.value)} placeholder="Kenapa ditambah…" className="px-2 py-1.5 w-full text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-400 focus:outline-none" />
          </div>
          <button
            onClick={() => {
              if (!/^\d+$/.test(addKode.trim())) { setError('Kode tambah harus numerik.'); return; }
              if (!addAlasan.trim()) { setError('Isi alasan penambahan.'); return; }
              setAdds((p) => [...p, { kode: addKode.trim(), nama: addNama.trim(), alasan: addAlasan.trim() }]);
              setAddKode('');
              setAddNama('');
              setAddAlasan('');
              setAddHits([]);
              setAddDropdownOpen(false);
            }}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
          >
            <Plus size={13} /> Tambah
          </button>
        </div>
        {showAddDropdown && (
          <div className="mx-3 mb-3 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
            {addSearching && <p className="px-3 py-2 text-[11px] text-slate-400">Mencari…</p>}
            {!addSearching && addHits.length === 0 && <p className="px-3 py-2 text-[11px] text-slate-400">Tidak ada kode/nama yang cocok — kode manual tetap bisa ditambah.</p>}
            {addHits.map((r) => (
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
                className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition-colors"
                title={r.nama}
              >
                <span className="block text-xs font-mono font-bold text-slate-700">{r.kode}</span>
                <span className="block text-[11px] text-slate-500 truncate">{r.nama}</span>
              </button>
            ))}
          </div>
        )}
        {adds.map((a, i) => (
          <div key={`${a.kode}-${i}`} className="px-4 py-1.5 flex items-center gap-2 text-xs border-t border-slate-50">
            <span className="font-mono font-bold text-emerald-700">+{a.kode}</span>
            <span className="text-slate-500 flex-1 truncate">{a.nama || '—'} • {a.alasan}</span>
            <button onClick={() => setAdds((p) => p.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-500"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      <button onClick={submit} disabled={saving} className="shrink-0 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 disabled:opacity-50">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        Kirim usulan koreksi
      </button>

      {items.length > 0 && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-700">Usulan yang sudah masuk ({items.length})</div>
          <div className="divide-y divide-slate-50">
            {items.map((it) => (
              <div key={it.id} className="px-4 py-1.5 text-xs flex items-center gap-2">
                <span className={`font-bold ${it.aksi === 'usul_tambah' ? 'text-emerald-600' : 'text-amber-600'}`}>{it.aksi === 'usul_tambah' ? '+' : '−'}{it.kode}</span>
                <span className="text-slate-500 flex-1 truncate">{it.alasan}</span>
                <span className="text-[10px] text-slate-400">{it.reviewer} • {it.keputusan}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
