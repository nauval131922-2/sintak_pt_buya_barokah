'use client';

import { useEffect, useState } from 'react';
import { DownloadCloud, Loader2, AlertCircle, CheckCircle2, Package } from 'lucide-react';
import TableFooter from '@/components/TableFooter';
import SearchAndReload from '@/components/SearchAndReload';
import ScrapingHeader from '@/components/ScrapingHeader';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [deb, setDeb] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<SaldoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [available, setAvailable] = useState<{ tgl: string; n: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setDeb(searchQuery); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

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
    setIsSyncing(true);
    setMsg('');
    setError('');
    try {
      const res = await fetch(`/api/scrape-saldo-barang?tgl=${tgl}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || json.details || 'Gagal sync');
      setMsg(`Tersimpan ${Number(json.total).toLocaleString('id-ID')} kode per ${json.tgl}.`);
      setLastUpdated(new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
      setPage(1);
      await load(1, tgl, deb);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSyncing(false);
    }
  };

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm shadow-red-900/5 text-sm font-bold flex items-start gap-3 animate-in fade-in shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {msg && (
        <div className="p-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl shadow-sm shadow-emerald-900/5 text-sm font-bold flex items-start gap-3 animate-in fade-in shrink-0">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p>{msg}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-4 flex-wrap">
              <ScrapingHeader title="Data Saldo Barang" icon={<Package size={16} />} lastUpdated={lastUpdated} scrapedPeriod={null} />

              {loading && rows.length > 0 && (
                <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm animate-pulse leading-none">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Memuat...</span>
                </div>
              )}
            </div>

            <div className="flex items-end gap-2 flex-wrap">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">Tanggal posisi</label>
                <input
                  type="date"
                  value={tgl}
                  onChange={(e) => { setTgl(e.target.value); setPage(1); }}
                  className="h-10 px-3 rounded-lg border border-gray-100 bg-white text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 shadow-sm"
                />
              </div>
              <button
                onClick={handleSync}
                disabled={isSyncing || loading}
                className="shrink-0 w-full sm:w-auto min-w-[140px] px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-[12px] font-bold shadow-sm shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isSyncing ? (
                    <><Loader2 size={16} className="animate-spin" /> Sedang Menarik...</>
                  ) : (
                    <><DownloadCloud size={16} className="group-hover/btn:-translate-y-0.5 transition-transform duration-300" /> Tarik Data</>
                  )}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <SearchAndReload
                searchQuery={searchQuery}
                setSearchQuery={(v) => { setSearchQuery(v); }}
                onReload={() => load(page, tgl, deb)}
                loading={loading}
                placeholder="Cari berdasarkan kode, nama barang, atau kelompok..."
              />
            </div>
            {available.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center text-xs">
                <span className="text-gray-400 font-bold">Tersedia:</span>
                {available.map((a) => (
                  <button
                    key={String(a.tgl)}
                    onClick={() => { setTgl(String(a.tgl)); setPage(1); }}
                    className={`px-2 py-1 rounded-full font-bold ${a.tgl === tgl ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 shadow-sm'}`}
                  >
                    {String(a.tgl)} ({Number(a.n).toLocaleString('id-ID')})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden relative">
          <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-auto">
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
                      Belum ada data tanggal ini — klik Tarik Data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TableFooter
            totalCount={total}
            currentCount={rows.length}
            label="Saldo Barang"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
