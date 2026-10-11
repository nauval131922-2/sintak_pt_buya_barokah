'use client';

import { useState } from 'react';
import { Loader2, Play, Save, CheckSquare, Square } from 'lucide-react';

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

export default function RoutineGeneratorClient() {
  const [minBom, setMinBom] = useState('3');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<GenResult | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const res = await fetch(`/api/penonaktifan-master-barang/generate-routine?minBom=${encodeURIComponent(minBom)}&limit=200`);
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

  const toggle = (kode: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(kode)) next.delete(kode);
      else next.add(kode);
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

  const renderTable = (rows: Cand[], title: string, desc: string) => (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">{title} ({rows.length})</h3>
        <p className="text-[11px] text-slate-500">{desc}</p>
      </div>
      <div className="max-h-80 overflow-y-auto custom-scrollbar">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white border-b border-slate-100">
            <tr>
              <th className="w-8 px-2 py-2" />
              <th className="text-left px-2 py-2 font-bold text-slate-600">Kode</th>
              <th className="text-left px-2 py-2 font-bold text-slate-600">Nama</th>
              <th className="text-right px-2 py-2 font-bold text-slate-600">BOM</th>
              <th className="text-center px-2 py-2 font-bold text-slate-600">SPK</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((c) => {
              const on = picked.has(c.kode);
              return (
                <tr key={c.kode} onClick={() => toggle(c.kode)} className={`cursor-pointer transition-colors ${on ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                  <td className="px-2 py-1.5 text-emerald-600">{on ? <CheckSquare size={15} /> : <Square size={15} className="text-slate-300" />}</td>
                  <td className="px-2 py-1.5 font-mono font-bold text-slate-700 whitespace-nowrap">{c.kode}</td>
                  <td className="px-2 py-1.5 text-slate-600 max-w-[280px] truncate" title={c.nama}>{c.nama}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{c.bom}×</td>
                  <td className="px-2 py-1.5 text-center">{c.spk ? <span className="text-[10px] font-bold text-amber-600">ada</span> : <span className="text-[10px] text-slate-300">—</span>}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-400">Tidak ada kandidat.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar min-h-0 px-1 pb-4">
      <div className="flex items-end gap-2 flex-wrap shrink-0">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 mb-1">Repeat minimal (× BOM)</label>
          <input value={minBom} onChange={(e) => setMinBom(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="px-3 py-2 w-24 text-xs tabular-nums bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" />
        </div>
        <button onClick={handleGenerate} disabled={loading} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Generate kandidat
        </button>
        {data && (
          <>
            <button onClick={() => handleSave('tambah')} disabled={saving || picked.size === 0} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Tambah {picked.size} ke rutin
            </button>
            <button onClick={() => handleSave('ganti')} disabled={saving} className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-[12px] font-bold disabled:opacity-50">
              Ganti semua
            </button>
          </>
        )}
      </div>

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      {msg && <p className="text-xs font-semibold text-emerald-600">{msg}</p>}

      {data && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {renderTable(data.generik, 'Generik — disarankan', 'Tanpa OP/HP/NN, repeat-order massal. Centang = lindungi.')}
          {renderTable(data.custom, 'Custom — tidak disarankan', 'Sekali-cetak pelanggan. Terlindungi otomatis via oplah saat SPK jalan.')}
        </div>
      )}
      {!data && !loading && (
        <p className="text-xs text-slate-400">Atur batas repeat, klik Generate — centang kandidat, lalu Tambah ke rutin.</p>
      )}
    </div>
  );
}
