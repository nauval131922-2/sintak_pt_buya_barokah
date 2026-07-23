'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import LastUpdatedBadge from '@/components/LastUpdatedBadge';

interface JurnalAkuntansiRow {
  id: number;
  faktur: string;
  tgl?: string | null;
  rekening?: string | null;
  keterangan?: string | null;
  debit?: number | null;
  kredit?: number | null;
  username?: string | null;
  create_at?: string | null;
  jenis_akun?: 'Laba/Rugi' | 'Arus Kas' | null;
}

const rupiahFmt = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 });

function formatDate(value?: string | null) {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta',
    }).format(new Date(`${value}T00:00:00+07:00`));
  } catch { return value; }
}

function formatCreateAt(value?: string | null) {
  if (!value) return null;
  try {
    // create_at dari Digit sudah dalam WIB — jangan tambah 'Z' (itu UTC)
    // Cukup normalisasi spasi → 'T', lalu format tanpa konversi timezone
    const normalized = value.includes('T') || value.includes('+')
      ? value
      : value.replace(' ', 'T');
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(d);
  } catch { return value; }
}

function JenisAkunBadge({ jenis }: { jenis?: string | null }) {
  if (!jenis) return <span className="text-gray-300 text-[11px]">—</span>;
  if (jenis === 'Laba/Rugi') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 tracking-wider">
        L/R
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border bg-violet-50 text-violet-700 border-violet-200 tracking-wider">
      KAS
    </span>
  );
}

export default function JurnalAkuntansiTerbaru({ initialData }: { initialData: JurnalAkuntansiRow[] }) {
  const [data, setData] = useState<JurnalAkuntansiRow[]>(initialData);

  const fetchData = useCallback(() => {
    fetch('/api/dashboard/akunting-jurnal-terbaru')
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) setData(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('sintak:data-updated', handler);
    return () => window.removeEventListener('sintak:data-updated', handler);
  }, [fetchData]);

  const lastUpdated = useAutoRefresh(fetchData);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-gray-400 tracking-widest">Jurnal Umum terbaru</p>
          <p className="text-[13px] font-bold text-gray-700 mt-0.5">Rekening Laba/Rugi &amp; Arus Kas</p>
          <LastUpdatedBadge lastUpdated={lastUpdated} />
        </div>
        <Link
          href="/akuntansi/laporan/jurnal-umum"
          className="group text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0 mt-0.5"
        >
          Lihat semua
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 border-y border-gray-100">
              <tr>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Tgl. Input</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 tracking-wider whitespace-nowrap">User</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Jenis</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Faktur</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Tgl. Transaksi</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Rekening</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Keterangan</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 tracking-wider text-right whitespace-nowrap">Debit</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 tracking-wider text-right whitespace-nowrap">Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <p className="text-[11px] font-medium text-gray-400">{formatCreateAt(row.create_at) ?? '-'}</p>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <p className="text-[11px] font-semibold text-gray-400">{row.username || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <JenisAkunBadge jenis={row.jenis_akun} />
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <p className="text-[11px] font-bold text-gray-700 font-mono">{row.faktur || '-'}</p>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <p className="text-[11px] font-semibold text-gray-600">{formatDate(row.tgl)}</p>
                  </td>
                  <td className="px-5 py-3 min-w-[180px]">
                    <p className="text-[11px] font-semibold text-gray-700 line-clamp-1">{row.rekening || '-'}</p>
                  </td>
                  <td className="px-5 py-3 min-w-[200px]">
                    <p className="text-[11px] font-medium text-gray-500 line-clamp-2">{row.keterangan || '-'}</p>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <p className="text-[11px] font-extrabold text-emerald-700">
                      {/* L/R: Debit LR = kredit raw; Kas: debit raw */}
                      {row.jenis_akun === 'Laba/Rugi'
                        ? (row.kredit ? rupiahFmt.format(row.kredit) : '-')
                        : (row.debit  ? rupiahFmt.format(row.debit)  : '-')}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <p className="text-[11px] font-extrabold text-rose-600">
                      {/* L/R: Kredit LR = debit raw; Kas: kredit raw */}
                      {row.jenis_akun === 'Laba/Rugi'
                        ? (row.debit  ? rupiahFmt.format(row.debit)  : '-')
                        : (row.kredit ? rupiahFmt.format(row.kredit) : '-')}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-5 pb-5">
          <div className="text-[12px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 rounded-xl p-4">
            Belum ada data jurnal umum dengan rekening Laba/Rugi atau Arus Kas. Pastikan data sudah disinkronkan.
          </div>
        </div>
      )}
    </div>
  );
}
