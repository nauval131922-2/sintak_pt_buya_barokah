'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Loader2, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SaldoRow {
  kode: string;
  tgl: string;
  nama: string;
  kd_satuan: string;
  saldo: number;
  kd_golongan: string;
  kd_kelompok: string;
  status: string;
  n_persd: number;
  n_hp: number;
}

function todayIso(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  return wib.toISOString().slice(0, 10);
}

const PAGE_SIZE = 50;

export default function SaldoBarangClient() {
  const [tgl, setTgl] = useState(todayIso());
  const [q, setQ] = useState('');
  const [deb, setDeb] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<SaldoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [available, setAvailable] = useState<{ tgl: string; n: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setDeb(q); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const load = async (p: number, date: string, keyword: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE), tgl: date, q: keyword });
      const res = await fetch(`/api/saldo-barang?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal memuat');
      setRows(json.data);
      setTotal(json.total);
      setAvailable(json.available ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, tgl, deb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tgl, deb]);

  const handleSync = async () => {
    setSyncing(true);
    setMsg('');
    setError('');
    try {
      const res = await fetch(`/api/scrape-saldo-barang?tgl=${tgl}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || json.details || 'Gagal sync');
      setMsg(`Tersimpan ${Number(json.total).toLocaleString('id-ID')} kode per ${json.tgl}.`);
      setPage(1);
      await load(1, tgl, deb);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  };

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal posisi</label>
          <input
            type="date"
            value={tgl}
            onChange={(e) => { setTgl(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Sync dari Digit
        </button>
        <div className="ml-auto relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kode / nama…"
            className="h-9 pl-8 pr-3 rounded-lg border border-gray-300 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {available.length > 0 && (
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="text-gray-400 font-semibold py-1">Tersedia:</span>
          {available.map((a) => (
            <button
              key={String(a.tgl)}
              onClick={() => { setTgl(String(a.tgl)); setPage(1); }}
              className={`px-2 py-1 rounded-full font-semibold ${a.tgl === tgl ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {String(a.tgl)} ({Number(a.n).toLocaleString('id-ID')})
            </button>
          ))}
        </div>
      )}

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <CheckCircle2 size={16} /> {msg}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="sticky top-0 bg-emerald-700 text-white">
            <tr>
              <th className="px-3 py-2 text-center font-semibold w-12">No</th>
              <th className="px-3 py-2 text-center font-semibold w-32">Kode</th>
              <th className="px-3 py-2 text-left font-semibold">Nama barang</th>
              <th className="px-3 py-2 text-center font-semibold w-20">Satuan</th>
              <th className="px-3 py-2 text-right font-semibold w-24">Saldo</th>
              <th className="px-3 py-2 text-right font-semibold w-28">N Persediaan</th>
              <th className="px-3 py-2 text-center font-semibold w-24">Status</th>
              <th className="px-3 py-2 text-left font-semibold">Kelompok</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.kode} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-3 py-2 text-center tabular-nums text-gray-500">{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className="px-3 py-2 text-center font-mono font-semibold">{r.kode}</td>
                <td className="px-3 py-2">{r.nama}</td>
                <td className="px-3 py-2 text-center">{r.kd_satuan}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold">{Number(r.saldo).toLocaleString('id-ID')}</td>
                <td className="px-3 py-2 text-right tabular-nums">{Number(r.n_persd).toLocaleString('id-ID')}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.status || '-'}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-500 text-[13px]">{r.kd_kelompok}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-400">
                  Belum ada data tanggal ini — klik Sync dari Digit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {loading ? 'Memuat…' : `Halaman ${page} dari ${totalPages} — ${total.toLocaleString('id-ID')} kode`}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1 || loading}
            className="h-9 px-4 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages || loading}
            className="h-9 px-4 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
