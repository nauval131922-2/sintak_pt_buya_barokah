'use client';

import { useState } from 'react';
import { Download, Loader2, Play, AlertTriangle, CheckCircle2, Search } from 'lucide-react';

interface PreviewRow {
  kode: string;
  nama: string;
  satuan: string;
  kelompok: string;
  kategori: 'A_LUDES' | 'B_BATAL';
  alasan: string;
}

interface PreviewResult {
  success: boolean;
  cutoff: string;
  kandidat: number;
  bolehCount: number;
  ditolakCount: number;
  rows: PreviewRow[];
  error?: string;
}

function todayIso(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  return wib.toISOString().slice(0, 10);
}

const KAT_LABEL: Record<string, string> = {
  A_LUDES: 'A — Ludes Pesanan',
  B_BATAL: 'B — Penawaran Batal',
};

export default function PenonaktifanMasterClient() {
  const [cutoff, setCutoff] = useState(todayIso());
  const [data, setData] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/penonaktifan-master-barang?cutoff=${cutoff}&limit=5000`);
      const json = (await res.json()) as PreviewResult;
      if (!json.success) throw new Error(json.error || 'Gagal generate');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/export-penonaktifan-master-barang?cutoff=${cutoff}`);
      if (!res.ok) throw new Error('Gagal export Excel');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `USULAN NONAKTIF ${cutoff}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  const filtered = (data?.rows ?? []).filter((r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return r.kode.toLowerCase().includes(s) || r.nama.toLowerCase().includes(s);
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal cutoff</label>
          <input
            type="date"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          Generate usulan
        </button>
        <button
          onClick={handleExport}
          disabled={!data || exporting}
          className="h-9 px-4 inline-flex items-center gap-2 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-50"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Unduh Excel usulan
        </button>
        {data && (
          <div className="ml-auto relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari kode / nama…"
              className="h-9 pl-8 pr-3 rounded-lg border border-gray-300 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Kandidat aktif saldo 0', value: data.kandidat },
              { label: 'Layak diusulkan', value: data.bolehCount },
              { label: 'Ditolak Pilar 2', value: data.ditolakCount },
              { label: 'Cutoff', value: data.cutoff, mono: true },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3">
                <div className="text-[11px] font-semibold text-gray-500">{s.label}</div>
                <div className={`text-xl font-bold text-gray-800 tabular-nums ${s.mono ? 'text-base font-mono' : ''}`}>
                  {typeof s.value === 'number' ? s.value.toLocaleString('id-ID') : s.value}
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="sticky top-0 bg-emerald-700 text-white">
                <tr>
                  <th className="px-3 py-2 text-center font-semibold w-12">No</th>
                  <th className="px-3 py-2 text-center font-semibold w-32">Kode</th>
                  <th className="px-3 py-2 text-left font-semibold">Nama barang</th>
                  <th className="px-3 py-2 text-center font-semibold w-44">Kategori</th>
                  <th className="px-3 py-2 text-left font-semibold">Alasan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.kode} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-3 py-2 text-center tabular-nums text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2 text-center font-mono font-semibold">{r.kode}</td>
                    <td className="px-3 py-2">{r.nama}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.kategori === 'A_LUDES' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {KAT_LABEL[r.kategori]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600 text-[13px]">{r.alasan}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                      <CheckCircle2 size={20} className="inline mr-1" /> Tidak ada baris — ubah cutoff atau kata kunci.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-400">
            File usulan saja — tidak mengubah status master. Eksekusi nonaktif tetap di Digit oleh Dhea.
          </p>
        </>
      )}
    </div>
  );
}
