'use client';

import { useEffect, useState } from 'react';
import { Loader2, Send, Trash2, Plus } from 'lucide-react';

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

export default function ReviewTokenClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cutoff, setCutoff] = useState('');
  const [snapshot, setSnapshot] = useState<SnapRow[]>([]);
  const [items, setItems] = useState<RevItem[]>([]);
  const [reviewer, setReviewer] = useState('');
  const [drop, setDrop] = useState<Record<string, string>>({});
  const [addKode, setAddKode] = useState('');
  const [addNama, setAddNama] = useState('');
  const [addAlasan, setAddAlasan] = useState('');
  const [adds, setAdds] = useState<Array<{ kode: string; nama: string; alasan: string }>>([]);
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submit = async () => {
    const usul = [
      ...Object.entries(drop)
        .filter(([, v]) => v.trim().length > 0)
        .map(([kode, alasan]) => {
          const s = snapshot.find((x) => x.kode === kode);
          return { kode, nama: s?.nama ?? '', aksi: 'usul_hapus' as const, alasan: alasan.trim() };
        }),
      ...adds.map((a) => ({ kode: a.kode, nama: a.nama, aksi: 'usul_tambah' as const, alasan: a.alasan })),
    ];
    if (!reviewer.trim()) {
      setError('Isi nama Anda dulu.');
      return;
    }
    if (usul.length === 0) {
      setError('Belum ada usulan — isi alasan hapus atau tambah kode.');
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
      setAdds([]);
      setAddKode('');
      setAddNama('');
      setAddAlasan('');
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
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar min-h-0 px-1 pb-4">
      <div className="flex items-end gap-2 flex-wrap">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 mb-1">Nama Anda (pengecek)</label>
          <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="cth. Pak Triswadi" className="px-3 py-2 w-56 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" />
        </div>
        <div className="text-[11px] text-slate-500">Cutoff: <b className="text-slate-700">{cutoff}</b> • {snapshot.length} kode • Anda hanya mengusulkan, tidak mengubah apa pun.</div>
      </div>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      {done && <p className="text-xs font-semibold text-emerald-600">{done}</p>}

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-700">Daftar usulan — isi alasan bila ingin dihapus</div>
        <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
          {snapshot.map((s) => (
            <div key={s.kode} className="px-4 py-2 flex items-center gap-3 text-xs flex-wrap">
              <span className="font-mono font-bold text-slate-700 shrink-0 w-24">{s.kode}</span>
              <span className="text-slate-600 flex-1 min-w-[160px] truncate" title={s.nama}>{s.nama}</span>
              <input value={drop[s.kode] ?? ''} onChange={(e) => setDrop((p) => ({ ...p, [s.kode]: e.target.value }))} placeholder="Alasan usul hapus…" className="flex-[2] min-w-[160px] px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-300 focus:bg-white focus:border-amber-400 focus:outline-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-700">Usul tambah kode yang belum ada</div>
        <div className="p-3 flex gap-2 flex-wrap items-end">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1">Kode</label>
            <input value={addKode} onChange={(e) => setAddKode(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="2608…" className="px-2 py-1.5 w-28 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-400 focus:outline-none" />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[10px] font-bold text-gray-400 mb-1">Nama (opsional)</label>
            <input value={addNama} onChange={(e) => setAddNama(e.target.value)} placeholder="Nama barang…" className="px-2 py-1.5 w-full text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-400 focus:outline-none" />
          </div>
          <div className="flex-[2] min-w-[160px]">
            <label className="block text-[10px] font-bold text-gray-400 mb-1">Alasan</label>
            <input value={addAlasan} onChange={(e) => setAddAlasan(e.target.value)} placeholder="Kenapa ditambah…" className="px-2 py-1.5 w-full text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-400 focus:outline-none" />
          </div>
          <button
            onClick={() => {
              if (!/^\d+$/.test(addKode.trim()) || !addAlasan.trim()) return;
              setAdds((p) => [...p, { kode: addKode.trim(), nama: addNama.trim(), alasan: addAlasan.trim() }]);
              setAddKode('');
              setAddNama('');
              setAddAlasan('');
            }}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
          >
            <Plus size={13} /> Tambah
          </button>
        </div>
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
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
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
